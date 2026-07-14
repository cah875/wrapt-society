/* Billsheet Scanner — offline single-file app.
 *
 * Everything runs inside this HTML file: Tesseract OCR (worker, wasm core and
 * English language data are embedded as base64 and booted through blob URLs,
 * so nothing is fetched from the network), the reconciliation engine, and the
 * full contract price data. Photos and patient data never leave the browser.
 */
(function () {
  'use strict';
  const B64 = window.__B64;
  const DATA = window.DATA;
  const R = window.RECON;

  // ---------- base64 → bytes ----------
  function dec(b64) {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  const td = new TextDecoder();

  // ---------- offline Tesseract bootstrap ----------
  // The stock worker wants to fetch its wasm core and traineddata over HTTP.
  // We boot it from a blob whose source (1) serves the embedded wasm AND the
  // embedded eng.traineddata.gz through a fetch override (the worker gunzips
  // by magic bytes, so the .gz payload is fine), (2) satisfies
  // importScripts('…#core.js') from the embedded core loader, then (3) runs
  // the stock worker script verbatim. Nothing ever touches the network.
  let workerPromise = null;
  function getWorker(onProgress) {
    if (workerPromise) return workerPromise;
    workerPromise = (async () => {
      const coreSrc = td.decode(dec(B64.core));
      const workerSrc = td.decode(dec(B64.worker));
      const shim = function () {
        const debase = function (b64) {
          const bin = atob(b64);
          const u = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          return u;
        };
        const wasm = debase(self.__wasmB64); delete self.__wasmB64;
        const lang = debase(self.__langB64); delete self.__langB64;
        const origFetch = self.fetch ? self.fetch.bind(self) : null;
        self.fetch = function (input, init) {
          const u = String((input && input.url) || input).split('#')[0];
          if (/traineddata/.test(u)) {
            return Promise.resolve(new Response(lang, { status: 200 }));
          }
          if (/\.wasm$/.test(u) || /tesseract-core/.test(u)) {
            return Promise.resolve(new Response(wasm, {
              status: 200, headers: { 'Content-Type': 'application/wasm' },
            }));
          }
          if (origFetch) return origFetch(input, init);
          return Promise.reject(new Error('offline: refusing to fetch ' + u));
        };
        const realImport = self.importScripts.bind(self);
        self.importScripts = function () {
          for (const u of arguments) {
            if (String(u).indexOf('#core.js') !== -1) {
              (0, eval)(self.__coreSrc +
                ';self.TesseractCoreWASM=typeof TesseractCoreWASM!=="undefined"?TesseractCoreWASM:self.TesseractCoreWASM;');
              delete self.__coreSrc;
            } else realImport(u);
          }
        };
      };
      const bootstrap = [
        'self.__wasmB64=' + JSON.stringify(B64.wasm) + ';',
        'self.__langB64=' + JSON.stringify(B64.lang) + ';',
        'self.__coreSrc=' + JSON.stringify(coreSrc) + ';',
        '(' + shim.toString() + ')();',
        workerSrc,
      ].join('\n');
      const bootURL = URL.createObjectURL(new Blob([bootstrap], { type: 'text/javascript' }));
      const worker = await Tesseract.createWorker('eng', 1, {
        workerPath: bootURL, workerBlobURL: false,
        corePath: 'tesseract-core#core.js',
        langPath: 'https://offline.invalid/lang', // intercepted by the shim; never fetched
        cacheMethod: 'none',
        logger: (m) => onProgress && onProgress(m),
      });
      return worker;
    })();
    workerPromise.catch(() => { workerPromise = null; });
    return workerPromise;
  }

  // ---------- image preprocessing ----------
  async function toCanvas(file, maxDim) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch { bmp = await createImageBitmap(file); }
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return c;
  }
  const canvasBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));

  // ---------- sheet state ----------
  const sheets = [];
  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }));

  function classifyItem(it) {
    return R.classify({ description: [it.description, it.catalogDescription].filter(Boolean).join(' ') });
  }
  function inferType(items) {
    const knee = ['Femur', 'Insert', 'Tib Tray', 'Patella'];
    let k = 0, h = 0;
    for (const it of items) {
      const c = classifyItem(it);
      if (knee.includes(c.slot)) k++;
      else if (['Stem', 'Head', 'Liner', 'Cup', 'Metal Liner'].includes(c.slot)) h++;
    }
    return k > h ? 'knee' : 'hip';
  }
  function revalidate(it) {
    const hit = DATA.lineprices.index[R.normalizeCatalog(it.ref)];
    it.validated = !!hit;
    it.catalogDescription = hit ? hit[0].description : null;
  }

  // ---------- processing pipeline ----------
  async function addFiles(files) {
    for (const f of files) {
      if (!/^image\//.test(f.type)) continue;
      const st = {
        id: 'sh' + (sheets.length + 1) + '-' + f.name.replace(/\W/g, '').slice(0, 12),
        name: f.name, file: f, phase: 'queued', progress: 0, pstat: 'Queued…',
        imageURL: null, ocrText: null, header: {}, items: [], warnings: [],
        result: null, psm: '3',
      };
      sheets.push(st);
      renderSheet(st);
      processSheet(st); // sequential enough in practice; OCR queues inside the worker
    }
  }

  async function processSheet(st) {
    try {
      st.phase = 'reading'; st.pstat = 'Preparing image…'; updateStatus(st);
      const canvas = await toCanvas(st.file, 2600);
      st.imageURL = canvas.toDataURL('image/jpeg', 0.85);
      renderSheet(st);
      st.pstat = 'Starting OCR engine (first run takes a few seconds)…'; updateStatus(st);
      const worker = await getWorker((m) => {
        if (m.status === 'recognizing text') {
          st.progress = m.progress; st.pstat = 'Reading text… ' + Math.round(m.progress * 100) + '%';
        } else { st.pstat = (m.status || 'working') + '…'; }
        updateStatus(st);
      });
      await worker.setParameters({ tessedit_pageseg_mode: st.psm });
      const blob = await canvasBlob(await toCanvas(st.file, 2600));
      const t0 = performance.now();
      const { data } = await worker.recognize(blob);
      st.ocrMs = Math.round(performance.now() - t0);
      st.ocrText = data.text || '';
      const ex = R.extractSheet(st.ocrText, DATA.lineprices.index);
      st.header = {
        patient: ex.header.patient || '', mrn: ex.header.mrn || '',
        case_id: ex.header.case_id || '', date_of_service: ex.header.date_of_service || '',
        side: '', case_type: inferType(ex.items),
      };
      st.items = ex.items;
      st.warnings = ex.warnings;
      st.phase = 'review';
      st.pstat = 'Read in ' + (st.ocrMs / 1000).toFixed(1) + 's — check the fields, then price it.';
      renderSheet(st);
      priceSheet(st); // auto-price immediately; user can edit + re-price
    } catch (err) {
      st.phase = 'error'; st.pstat = 'OCR failed: ' + (err && err.message || err);
      renderSheet(st);
    }
  }

  function priceSheet(st) {
    if (!st.items.length) { st.result = null; renderSheet(st); return; }
    const kase = {
      case_id: st.header.case_id || 'SCANNED',
      patient: st.header.patient || 'Unknown patient',
      date_of_service: st.header.date_of_service || new Date().toISOString().slice(0, 10),
      case_type: st.header.case_type || 'hip',
      side: st.header.side || '',
      items: st.items.map((it) => ({
        ref: it.ref, lot: it.lot || '', qty: it.qty || 1,
        description: [it.description, it.catalogDescription].filter(Boolean).join(' '),
      })),
    };
    st.result = R.reconcile(kase, DATA, { pricingPolicy: 'lowest' });
    st.phase = 'done';
    renderSheet(st);
  }

  // ---------- rendering ----------
  const STATUS = {
    VERIFIED: { label: 'Auto-verified', cls: 'ok', dot: '#3E9D45' },
    REVIEW: { label: 'Needs review', cls: 'warn', dot: '#b45309' },
    PRICE_MISMATCH: { label: 'Price mismatch', cls: 'bad', dot: '#b91c1c' },
    NO_CONSTRUCT_MATCH: { label: 'No construct match', cls: 'bad', dot: '#b91c1c' },
  };

  function updateStatus(st) {
    const p = $('#' + st.id + ' [data-prog] i');
    if (p) p.style.width = Math.round((st.progress || 0) * 100) + '%';
    const t = $('#' + st.id + ' [data-pstat]');
    if (t) t.textContent = st.pstat;
  }

  function renderSheet(st) {
    let sec = document.getElementById(st.id);
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'card'; sec.id = st.id;
      $('#sheets').appendChild(sec);
    }
    const busy = st.phase === 'queued' || st.phase === 'reading';
    const badge = st.phase === 'error'
      ? '<span class="badge bad"><span class="bdot" style="background:#b91c1c"></span>OCR error</span>'
      : busy ? '<span class="badge busy"><span class="bdot" style="background:#2483a0"></span>Reading…</span>'
      : st.result ? (() => { const s = STATUS[st.result.status] || STATUS.REVIEW;
          return '<span class="badge ' + s.cls + '"><span class="bdot" style="background:' + s.dot + '"></span>' + s.label + '</span>'; })()
      : '<span class="badge warn"><span class="bdot" style="background:#b45309"></span>Ready to price</span>';

    sec.innerHTML = [
      '<div class="sheet-h"><div><h2>', esc(st.header.patient || st.name), '</h2>',
      '<div style="font-size:12px;color:var(--c500)">', esc(st.name), st.ocrMs ? ' · OCR ' + (st.ocrMs / 1000).toFixed(1) + 's' : '', '</div></div>',
      badge, '</div>',
      busy || st.phase === 'error'
        ? '<div data-prog class="progress"><i></i></div><div data-pstat class="pstat">' + esc(st.pstat) + '</div>'
        : '',
      '<div class="grid2">',
      '<div class="thumbbox">', st.imageURL ? '<img class="thumb" data-zoom src="' + st.imageURL + '" alt="billsheet">' : '', '</div>',
      '<div>', st.phase === 'review' || st.phase === 'done' ? formHtml(st) : '', '</div>',
      '</div>',
      st.result ? resultHtml(st) : '',
      st.ocrText != null && (st.phase === 'review' || st.phase === 'done')
        ? '<div class="ocrraw"><button class="ghost" data-act="rawocr">Show raw OCR text</button><pre style="display:none">' + esc(st.ocrText) + '</pre></div>'
        : '',
    ].join('');
    bindSheet(sec, st);
  }

  function formHtml(st) {
    const rows = st.items.map((it, i) => {
      const c = classifyItem(it);
      const chip = c.slot
        ? '<span class="chip">' + esc(c.slot) + ' · ' + esc(c.family || '?') + (c.sizeMm != null ? ' · ' + c.sizeMm + 'mm' : '') + '</span>'
        : '<span class="chip none">unclassified</span>';
      return ['<tr data-i="', i, '">',
        '<td style="width:16px"><span class="vdot ', it.validated ? 'ok" title="Catalog number found in price file"' : 'bad" title="NOT in price file"', '></span></td>',
        '<td style="width:120px"><input class="ref" data-f="ref" value="', esc(it.ref), '"></td>',
        '<td style="width:110px"><input data-f="lot" value="', esc(it.lot || ''), '"></td>',
        '<td style="width:44px"><input data-f="qty" value="', esc(it.qty || 1), '"></td>',
        '<td><input data-f="description" value="', esc(it.description || ''), '">',
        it.catalogDescription ? '<div style="font-size:10.5px;color:var(--c400)">catalog: ' + esc(it.catalogDescription) + '</div>' : '',
        chip, '</td>',
        '<td style="width:20px"><button class="rowdel" data-act="del" title="Remove line">×</button></td>',
        '</tr>'].join('');
    }).join('');
    const warn = st.warnings.length
      ? '<ul class="warnlist">' + st.warnings.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul>' : '';
    return [
      '<h3>Case header</h3><div class="hdr-grid">',
      fld('Patient', 'patient', st.header.patient),
      fld('MRN', 'mrn', st.header.mrn),
      fld('Case #', 'case_id', st.header.case_id),
      fld('Date of service', 'date_of_service', st.header.date_of_service, 'date'),
      '<label class="f">Side<select data-h="side"><option value="">—</option>',
      ['Right', 'Left', 'Bilateral'].map((s) => '<option' + (st.header.side === s ? ' selected' : '') + '>' + s + '</option>').join(''),
      '</select></label>',
      '<label class="f">Type<select data-h="case_type">',
      ['hip', 'knee'].map((s) => '<option' + (st.header.case_type === s ? ' selected' : '') + '>' + s + '</option>').join(''),
      '</select></label>',
      '</div>',
      '<h3>Implant lines <span style="font-weight:400;text-transform:none;letter-spacing:0">(green dot = catalog number verified in price file)</span></h3>',
      '<table class="items"><thead><tr><th></th><th>REF</th><th>LOT</th><th>Qty</th><th>Description</th><th></th></tr></thead><tbody>',
      rows,
      '</tbody></table>', warn,
      '<div class="btns">',
      '<button class="primary" data-act="price">Price this case</button>',
      '<button class="ghost" data-act="addrow">+ Add line</button>',
      '<select class="mode" data-act="psm" title="OCR layout mode">',
      '<option value="3"' + (st.psm === '3' ? ' selected' : '') + '>OCR: Auto layout</option>',
      '<option value="11"' + (st.psm === '11' ? ' selected' : '') + '>OCR: Sparse stickers</option>',
      '<option value="6"' + (st.psm === '6' ? ' selected' : '') + '>OCR: Single block</option>',
      '</select>',
      '<button class="ghost" data-act="reocr">Re-run OCR</button>',
      st.result ? '<button class="ghost" data-act="json">Download case JSON</button>' : '',
      '</div>',
    ].join('');
  }
  function fld(label, key, val, type) {
    return '<label class="f">' + label + '<input data-h="' + key + '" type="' + (type || 'text') + '" value="' + esc(val || '') + '"></label>';
  }

  function resultHtml(st) {
    const r = st.result;
    const cands = r.candidates.map((c) => {
      const sel = r.selected && c.construct_id === r.selected.construct_id;
      return '<li class="' + (sel ? 'sel' : '') + '"><span class="cid">' + esc(c.construct_id) + '</span><span class="cname">' + esc(c.name) + '</span><span class="cprice">' + money(c.price) + '</span>' + (sel ? '<span class="tick">✓</span>' : '') + '</li>';
    }).join('') || '<li>No capitated construct matched this build</li>';
    const why = r.selected && r.selected.why && r.selected.why.some((w) => w.via && /[<>=]/.test(w.via))
      ? '<div class="why">Qualifies via ' + r.selected.why.filter((w) => w.via && /[<>=]/.test(w.via))
          .map((w) => '<b>' + esc(w.slot) + '</b> ' + esc(w.family || '?') + (w.sizeMm != null ? ' ' + w.sizeMm + 'mm' : '') + ' → “' + esc(w.via) + '”').join(', ') + '</div>'
      : '';
    const flags = r.flags.map((f) =>
      '<div class="finding ' + f.level + '"><span class="code">' + esc(f.code) + '</span><span>' + esc(f.msg) + '</span></div>').join('')
      || '<div class="finding ok"><span class="code">CLEAN</span><span>No discrepancies — priced exactly to contract.</span></div>';
    return ['<div class="result"><h3>Contract price match</h3><ul class="cands">', cands, '</ul>', why,
      flags,
      '<div class="price-line"><span>Expected case price</span><span class="big">', money(r.expected_total), '</span></div></div>'].join('');
  }

  // ---------- events ----------
  function bindSheet(sec, st) {
    sec.oninput = (e) => {
      const f = e.target.getAttribute('data-f');
      const h = e.target.getAttribute('data-h');
      if (f) {
        const i = Number(e.target.closest('tr').getAttribute('data-i'));
        st.items[i][f] = f === 'qty' ? Number(e.target.value) || 1 : e.target.value.trim();
        if (f === 'ref') {
          revalidate(st.items[i]);
          const dot = e.target.closest('tr').querySelector('.vdot');
          dot.className = 'vdot ' + (st.items[i].validated ? 'ok' : 'bad');
        }
      } else if (h) {
        st.header[h] = e.target.value;
      }
    };
    sec.onclick = (e) => {
      const act = e.target.getAttribute('data-act');
      if (e.target.hasAttribute('data-zoom')) { e.target.classList.toggle('zoom'); return; }
      if (!act) return;
      if (act === 'price') priceSheet(st);
      if (act === 'addrow') { st.items.push({ ref: '', lot: '', qty: 1, description: '', validated: false }); renderSheet(st); }
      if (act === 'del') { st.items.splice(Number(e.target.closest('tr').getAttribute('data-i')), 1); renderSheet(st); }
      if (act === 'rawocr') { const pre = e.target.nextElementSibling; pre.style.display = pre.style.display === 'none' ? 'block' : 'none'; }
      if (act === 'reocr') { st.result = null; processSheet(st); }
      if (act === 'json') downloadJson(st);
    };
    sec.onchange = (e) => {
      if (e.target.getAttribute('data-act') === 'psm') st.psm = e.target.value;
    };
  }

  function downloadJson(st) {
    const kase = {
      case_id: st.header.case_id || 'SCANNED', patient: st.header.patient || 'Unknown',
      mrn: st.header.mrn || '', date_of_service: st.header.date_of_service || '',
      case_type: st.header.case_type, side: st.header.side || '',
      items: st.items.map((it) => ({ ref: it.ref, lot: it.lot || '', qty: it.qty || 1, description: it.description })),
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(kase, null, 2)], { type: 'application/json' }));
    a.download = (st.header.case_id || 'case') + '.json';
    a.click();
  }

  // ---------- dropzone ----------
  const drop = $('#drop');
  const input = $('#file');
  drop.onclick = () => input.click();
  input.onchange = () => { addFiles([...input.files]); input.value = ''; };
  drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('on'); };
  drop.ondragleave = () => drop.classList.remove('on');
  drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('on'); addFiles([...e.dataTransfer.files]); };
})();
