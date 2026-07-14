// Generate a self-contained HTML dashboard from the reconciliation engine —
// styled to match the Northwest Specialty Hospital app theme (clinical
// palette, brand blue #197B97, card/badge styles). Opens in any browser with
// no server, no Node, no network — for board/demo use.
//
//   node recon/build/preview.mjs   ->   recon/preview.html

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reconcile } from '../lib/engine.mjs';
import { classify } from '../lib/classify.mjs';
import { normalizeCatalog } from '../lib/normalize.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const REPO = join(ROOT, '..');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

const data = {
  constructs: load(join(ROOT, 'data', 'constructs.json')),
  lineprices: load(join(ROOT, 'data', 'lineprices.json')),
};

// Embed the hospital logo so the file is fully self-contained.
let logoData = '';
try {
  logoData = 'data:image/png;base64,' + readFileSync(join(REPO, 'public', 'logo.png')).toString('base64');
} catch { /* logo optional */ }

const caseDir = join(ROOT, 'cases');
const cases = readdirSync(caseDir).filter((f) => f.endsWith('.json')).sort();

// A case's source billsheet scan (PHI — gitignored, local only) is matched by
// filename: recon/billsheets/<case-stem>.{jpg,jpeg,png}. If present, the case
// card gets a "View billsheet" link. Absent (e.g. on a hosted build), no link.
const BILLSHEET_DIR = join(ROOT, 'billsheets');
const IMG_MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
function billsheetFor(caseFile) {
  const stem = caseFile.replace(/\.json$/, '');
  for (const ext of ['jpg', 'jpeg', 'png']) {
    const abs = join(BILLSHEET_DIR, `${stem}.${ext}`);
    if (existsSync(abs)) return { rel: `billsheets/${stem}.${ext}`, abs, ext };
  }
  return null;
}
// A billsheet link's href: for the shareable file, a relative path (no image
// bytes committed); for the local file, the image inlined as a data URI so the
// single HTML is fully self-contained and prints straight to PDF.
function sheetHref(billsheet, mode) {
  if (!billsheet) return null;
  if (mode !== 'local') return billsheet.rel;
  return `data:${IMG_MIME[billsheet.ext]};base64,${readFileSync(billsheet.abs).toString('base64')}`;
}

const results = cases.map((f) => ({ file: f, raw: load(join(caseDir, f)),
  billsheet: billsheetFor(f),
  r: reconcile(load(join(caseDir, f)), data, { pricingPolicy: 'lowest' }) }));

const money = (n) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 }));
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// KPIs
const verified = results.filter((x) => x.r.status === 'VERIFIED').length;
const flagged = results.filter((x) => x.r.status !== 'VERIFIED').length;
let identified = 0;
for (const { r } of results) {
  if (r.candidates.length > 1) {
    const prices = r.candidates.map((c) => c.price);
    identified += Math.max(...prices) - Math.min(...prices); // avoided overcharge
  }
}
const realCases = results.filter((x) => !x.raw.note); // synthetic cases carry a note

const STATUS = {
  VERIFIED: { label: 'Auto-verified', cls: 'ok', dot: '#3E9D45' },
  REVIEW: { label: 'Needs review', cls: 'warn', dot: '#b45309' },
  PRICE_MISMATCH: { label: 'Price mismatch', cls: 'bad', dot: '#b91c1c' },
  NO_CONSTRUCT_MATCH: { label: 'No match', cls: 'bad', dot: '#b91c1c' },
};

function caseCard({ raw, r, billsheet }, mode) {
  const sheet = sheetHref(billsheet, mode);
  const st = STATUS[r.status] || { label: r.status, cls: 'warn', dot: '#b45309' };
  const comps = r.components.map((c) => `
        <tr>
          <td class="slot">${esc(c.slot || '?')}</td>
          <td><span class="fam">${esc(c.family || 'UNKNOWN')}</span>${c.sizeMm != null ? `<span class="sz">${c.sizeMm} mm</span>` : ''}</td>
          <td class="ref">${esc(c.ref)}</td>
        </tr>`).join('');

  const candidates = r.candidates.map((c) => {
    const sel = r.selected && c.construct_id === r.selected.construct_id;
    return `<li class="${sel ? 'sel' : ''}">
          <span class="cid">${esc(c.construct_id)}</span>
          <span class="cname">${esc(c.name)}</span>
          <span class="cprice">${money(c.price)}</span>${sel ? '<span class="tick">✓</span>' : '<span class="tick muted"></span>'}</li>`;
  }).join('') || '<li class="none">No capitated construct matched this build</li>';

  const findings = r.flags.map((f) => `
        <div class="finding ${f.level}">
          <span class="fdot"></span><span class="code">${esc(f.code)}</span><span>${esc(f.msg)}</span>
        </div>`).join('')
    || '<div class="finding ok"><span class="fdot"></span><span class="code">CLEAN</span><span>No discrepancies — priced exactly to contract.</span></div>';

  const synthetic = raw.note
    ? `<div class="synthetic">Synthetic case — included to show the engine also prices knee constructs, not just hips.</div>` : '';

  return `
      <section class="card case">
        <div class="case-h">
          <div>
            <h2>${esc(raw.patient)}</h2>
            <div class="meta">${esc(raw.side || '')} ${esc(r.case_type.toUpperCase())} &middot; DOS ${esc(r.date_of_service)} &middot; <span class="mono">${esc(r.case_id)}</span></div>
            ${sheet
              ? `<a class="sheetlink" href="${esc(sheet)}" target="_blank" rel="noopener">📄 View source billsheet</a>`
              : ''}
          </div>
          <span class="badge ${st.cls}"><span class="bdot" style="background:${st.dot}"></span>${st.label}</span>
        </div>
        ${synthetic}
        <div class="case-grid">
          <div class="panel">
            <h3>Components scanned from billsheet</h3>
            <table class="comp"><tbody>${comps}</tbody></table>
          </div>
          <div class="panel">
            <h3>Contract price match</h3>
            <ul class="cands">${candidates}</ul>
            ${r.selected && r.selected.why && r.selected.why.some((w) => w.via && /[<>=]/.test(w.via))
              ? `<div class="why">Qualifies via ${r.selected.why.filter((w) => w.via && /[<>=]/.test(w.via))
                  .map((w) => `<b>${esc(w.slot)}</b> ${esc(w.family || '?')}${w.sizeMm != null ? ` ${w.sizeMm}mm` : ''} → &ldquo;${esc(w.via)}&rdquo;`).join(', ')}</div>`
              : ''}
            <div class="price-line">
              <span>Expected case price</span>
              <span class="big">${money(r.expected_total)}</span>
            </div>
            ${r.submitted_total != null ? `<div class="price-line sub"><span>Vendor submitted</span><span>${money(r.submitted_total)}</span></div>` : ''}
          </div>
        </div>
        <h3 class="findings-h">Findings</h3>
        <div class="findings">${findings}</div>
      </section>`;
}

// ── "How it works" section ────────────────────────────────────────────────
// Built from the real data so the worked example is truthful, not a mockup.
const canon = (f) => String(f || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function tierOk(mm, t) {
  if (!t) return true;
  if (mm == null) return null;
  switch (t.op) { case '<=': return mm <= t.mm; case '>=': return mm >= t.mm;
    case '<': return mm < t.mm; case '>': return mm > t.mm; default: return mm === t.mm; }
}
function matchedRule(construct, comp) {
  for (const e of (construct.slots[comp.slot] || []))
    if (canon(e.family) === canon(comp.family) && tierOk(comp.sizeMm, e.sizeTier) === true) return e;
  return null;
}
const lineRowFor = (ref) => (data.lineprices.index[normalizeCatalog(ref)] || [])[0] || null;

function howItWorks() {
  // Use the first real hip case (Gregg) as the worked example.
  const ex = results.find((x) => !x.raw.note && x.r.case_type === 'hip') || results[0];
  const con = data.constructs.find((c) => c.construct_id === (ex.r.selected && ex.r.selected.construct_id));
  const items = ex.raw.items.map((it) => ({ raw: it, c: classify(it), line: lineRowFor(it.ref) }));
  // Headline line for the close-up: the head, where the size tier matters.
  const focus = items.find((i) => i.c.slot === 'Head') || items[0];
  const rule = con ? matchedRule(con, focus.c) : null;

  const stages = [
    ['1', 'Read the billsheet', 'Each line gives a catalog number (REF) and the printed description.', '📄'],
    ['2', 'Classify the component', 'Reduce each line to the three things a contract cares about: slot, family, size.', '🏷️'],
    ['3', 'Match to the contract', 'Look the build up in both pricing sources — construct schedule and line-price file.', '🔎'],
    ['4', 'Price &amp; verify', 'Output the contract price and a status: auto-verified or flagged for review.', '✓'],
  ].map(([n, t, d, ic]) => `
        <div class="stage">
          <div class="stage-ic">${ic}</div>
          <div class="stage-n">Step ${n}</div>
          <div class="stage-t">${t}</div>
          <div class="stage-d">${d}</div>
        </div>`).join('<div class="chev">&rsaquo;</div>');

  // Full-build match table: every component -> the construct rule it satisfies.
  const rows = items.map(({ raw, c }) => {
    const r = con ? matchedRule(con, c) : null;
    const ln = lineRowFor(raw.ref);
    const lineNote = ln ? (ln.line_priced ? `line price ${money(ln.contracted_price)}` : 'priced inside construct') : 'not found';
    return `
        <tr>
          <td class="mono small">${esc(raw.ref)}</td>
          <td><span class="slot-chip">${esc(c.slot || '?')}</span> <strong>${esc(c.family || 'UNKNOWN')}</strong>${c.sizeMm != null ? ` · ${c.sizeMm} mm` : ''}</td>
          <td>${r ? `<span class="rule">${esc(r.raw)}</span> <span class="okmark">✓</span>` : '<span class="nomark">no rule</span>'}</td>
          <td class="small muted">${lineNote}</td>
        </tr>`;
  }).join('');

  return `
    <section class="card how">
      <h3 class="how-h">How a case is priced</h3>
      <div class="pipeline">${stages}</div>
      <div class="sources">
        <span class="src-cap">Step&nbsp;3 reads from two contract sources:</span>
        <span class="src"><b>Construct schedule</b> — ${data.constructs.length} bundled builds <span class="muted">(from the agreement)</span></span>
        <span class="src"><b>Line-price file</b> — ${data.lineprices.meta.rows.toLocaleString('en-US')} catalog items <span class="muted">(CSV)</span></span>
      </div>

      <div class="trace-h">Worked example &mdash; following one line from <b>${esc(ex.raw.patient)}</b></div>
      <div class="trace">
        <div class="t-col">
          <div class="t-cap">1 · On the billsheet</div>
          <div class="t-box">
            <div class="mono small muted">REF ${esc(focus.raw.ref)}</div>
            <div class="t-desc">${esc(focus.raw.description)}</div>
          </div>
        </div>
        <div class="t-arrow"><span>classify</span>&rarr;</div>
        <div class="t-col">
          <div class="t-cap">2 · Engine reads it as</div>
          <div class="t-box chips">
            <span class="chip"><i>slot</i>${esc(focus.c.slot)}</span>
            <span class="chip"><i>family</i>${esc(focus.c.family)}</span>
            <span class="chip"><i>size</i>${focus.c.sizeMm} mm</span>
          </div>
        </div>
        <div class="t-arrow"><span>look up</span>&rarr;</div>
        <div class="t-col wide">
          <div class="t-cap">3 · Matched against the contract</div>
          <div class="t-box src-read">
            <div class="sr-title">Line-price file <span class="mono muted">· ${esc(normalizeCatalog(focus.raw.ref))}</span></div>
            <div class="sr-body">${focus.line ? (focus.line.line_priced
              ? `standalone price ${money(focus.line.contracted_price)}`
              : `found, no standalone price &rarr; <b>priced inside a construct</b>`) : 'not found'}</div>
          </div>
          <div class="t-box src-read ok">
            <div class="sr-title">Construct schedule <span class="mono muted">· ${esc(con ? con.construct_id : '')} ${esc(con ? con.name : '')}</span></div>
            <div class="sr-body">${focus.c.slot} rule <span class="rule">${rule ? esc(rule.raw) : 'n/a'}</span>
              <span class="okmark">✓</span> ${rule && rule.sizeTier ? `<span class="muted">(${focus.c.sizeMm} ${rule.sizeTier.op} ${rule.sizeTier.mm})</span>` : ''}</div>
          </div>
        </div>
      </div>

      <div class="trace-h">All ${items.length} components must fit the same construct</div>
      <table class="match"><thead><tr>
        <th>Catalog #</th><th>Classified as</th><th>Construct rule satisfied</th><th>Line-price file</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="match-foot">
        All ${items.length} fit <b>${esc(con ? con.construct_id : '')} ${esc(con ? con.name : '')}</b>
        &rarr; one bundled price of <b>${money(con ? con.price : ex.r.expected_total)}</b>
        <span class="muted">— not the sum of individual parts.</span>
      </div>
    </section>`;
}

const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const renderHtml = (mode) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Implant Billsheet Reconciliation — Northwest Specialty Hospital</title>
<style>
  :root{
    --c50:#eef7fa; --c100:#d5ebf1; --c200:#aed7e3; --c300:#7bbccd; --c400:#479cb3;
    --c500:#2483a0; --c600:#197b97; --c700:#15637a; --c800:#154f61; --c900:#143f4d; --c950:#0c2832;
    --green:#3E9D45; --ok:#2f8a3a; --warn:#b45309; --danger:#b91c1c;
    --okbg:#dcfce7; --warnbg:#fef3c7; --dangerbg:#fee2e2;
    --line:#aed7e3; --shadow:0 1px 2px rgba(20,79,97,.06), 0 1px 3px rgba(20,79,97,.04);
  }
  *{box-sizing:border-box;}
  html{font-size:16px;}
  body{margin:0; background:var(--c50); color:var(--c900);
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;}
  .mono{font-family:ui-monospace,Menlo,Consolas,monospace;}

  /* Header — mirrors the app top bar */
  header.app{position:sticky; top:0; z-index:30; background:rgba(255,255,255,.92);
    backdrop-filter:blur(8px); border-bottom:1px solid var(--c200);}
  .head-in{max-width:1080px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px;}
  .brand{display:flex; align-items:center; gap:14px;}
  .logo-chip{background:#fff; padding:7px 9px; border-radius:10px; box-shadow:var(--shadow); border:1px solid var(--c200);}
  .logo-chip img{height:30px; width:auto; display:block;}
  .brand h1{margin:0; font-size:17px; font-weight:700; color:var(--c800); letter-spacing:-.01em;}
  .brand p{margin:1px 0 0; font-size:12px; color:var(--c500);}
  .tag{font-size:12px; font-weight:600; color:var(--c700); background:var(--c100);
    border:1px solid var(--c200); padding:5px 12px; border-radius:999px; white-space:nowrap;}

  .wrap{max-width:1080px; margin:0 auto; padding:28px 24px 64px;}

  /* Title block */
  .lede h2{margin:0 0 6px; font-size:24px; font-weight:700; letter-spacing:-.02em; color:var(--c900);}
  .lede p{margin:0; color:var(--c600); max-width:64ch; line-height:1.55;}

  /* KPI tiles — mirror Dashboard <Stat> */
  .kpis{display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:22px 0 6px;}
  .kpi{background:#fff; border:1px solid var(--c200); border-radius:16px; padding:16px 18px; box-shadow:var(--shadow);}
  .kpi .n{font-size:30px; font-weight:700; letter-spacing:-.02em; color:var(--c800); line-height:1.1;}
  .kpi .l{font-size:13px; font-weight:500; color:var(--c600); margin-top:3px;}
  .kpi .s{font-size:11px; color:var(--c400); margin-top:2px;}
  .kpi.ok{border-color:#a7e3b4; background:#f3fcf5;}
  .kpi.ok .n{color:var(--ok);}
  .kpi.warn{border-color:#fcd9a3; background:var(--warnbg);} .kpi.warn .n{color:var(--warn);}
  .kpi.save{border-color:#a7e3b4; background:#f0fbf2;} .kpi.save .n{color:var(--green);}

  /* Cards */
  .card{background:#fff; border:1px solid var(--c200); border-radius:18px; padding:22px 24px; box-shadow:var(--shadow);}
  .case{margin-top:18px;}
  .case-h{display:flex; justify-content:space-between; align-items:flex-start; gap:16px;}
  .case-h h2{margin:0; font-size:18px; font-weight:700; color:var(--c800);}
  .sheetlink{display:inline-block; margin-top:6px; font-size:12px; font-weight:600; color:var(--c600); text-decoration:none; border:1px solid #dbeaf1; background:#f2f8fb; padding:3px 9px; border-radius:999px;}
  .sheetlink:hover{background:#e4f1f7; border-color:var(--c500);}
  .meta{font-size:13px; color:var(--c500); margin-top:3px;}

  /* Badge — mirrors StatusBadge pill */
  .badge{display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600;
    padding:5px 13px; border-radius:999px; white-space:nowrap;}
  .badge .bdot{width:8px; height:8px; border-radius:999px; display:inline-block;}
  .badge.ok{background:var(--okbg); color:var(--ok);}
  .badge.warn{background:var(--warnbg); color:var(--warn);}
  .badge.bad{background:var(--dangerbg); color:var(--danger);}

  .synthetic{margin-top:10px; font-size:12px; color:var(--c400); font-style:italic;}

  .case-grid{display:grid; grid-template-columns:1.05fr 1fr; gap:22px; margin-top:16px;}
  .panel{background:var(--c50); border:1px solid var(--c100); border-radius:14px; padding:14px 16px;}
  h3{font-size:11px; text-transform:uppercase; letter-spacing:.07em; color:var(--c500); font-weight:700; margin:0 0 10px;}

  table.comp{width:100%; border-collapse:collapse; font-size:13px;}
  table.comp td{padding:7px 6px; border-bottom:1px solid var(--c100); vertical-align:middle;}
  table.comp tr:last-child td{border-bottom:0;}
  td.slot{color:var(--c500); width:64px; font-weight:500;}
  .fam{font-weight:600; color:var(--c900);}
  .sz{margin-left:8px; font-size:11px; color:var(--c600); background:var(--c100); padding:1px 7px; border-radius:6px;}
  td.ref{color:var(--c400); font-family:ui-monospace,Menlo,monospace; font-size:11px; white-space:nowrap; text-align:right;}

  ul.cands{list-style:none; margin:0; padding:0;}
  ul.cands li{display:flex; align-items:center; gap:10px; padding:9px 11px; border:1px solid var(--c200);
    border-radius:10px; margin-bottom:7px; font-size:13px; background:#fff;}
  ul.cands li.sel{border-color:#a7e3b4; background:#f3fcf5;}
  ul.cands li.none{color:var(--danger); background:var(--dangerbg); border-color:#fcc; justify-content:center; font-weight:500;}
  .cid{font-family:ui-monospace,Menlo,monospace; font-size:11px; color:var(--c500); white-space:nowrap;}
  .cname{flex:1; color:var(--c800);}
  .cprice{font-weight:700; color:var(--c900);}
  .tick{width:16px; text-align:center; color:var(--green); font-weight:700;}
  .tick.muted{color:transparent;}

  .price-line{display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; padding-top:13px; border-top:1px solid var(--c200);}
  .price-line>span:first-child{font-size:13px; font-weight:600; color:var(--c600);}
  .price-line .big{font-size:24px; font-weight:700; letter-spacing:-.02em; color:var(--c800);}
  .price-line.sub{border:0; margin-top:3px; padding-top:0;}
  .price-line.sub>span{font-size:13px; color:var(--c500); font-weight:500;}

  .findings-h{margin-top:18px;}
  .finding{display:flex; align-items:flex-start; gap:10px; font-size:13px; padding:10px 13px; border-radius:11px; margin-bottom:7px; line-height:1.45;}
  .finding .fdot{width:7px; height:7px; border-radius:999px; margin-top:6px; flex:none;}
  .finding .code{font-family:ui-monospace,Menlo,monospace; font-size:11px; font-weight:700; letter-spacing:.02em; flex:none;}
  .finding.error{background:var(--dangerbg); color:#7f1d1d;} .finding.error .fdot{background:var(--danger);} .finding.error .code{color:var(--danger);}
  .finding.warn{background:var(--warnbg); color:#7c2d12;} .finding.warn .fdot{background:var(--warn);} .finding.warn .code{color:var(--warn);}
  .finding.ok{background:var(--okbg); color:#14532d;} .finding.ok .fdot{background:var(--green);} .finding.ok .code{color:var(--ok);}
  .finding.info{background:#eef6fb; color:#0f3a52;} .finding.info .fdot{background:var(--c600);} .finding.info .code{color:var(--c600);}
  .why{font-size:11.5px; color:var(--c700); background:#f2f8fb; border:1px solid #dbeaf1; border-radius:9px; padding:7px 10px; margin:8px 0 2px; line-height:1.5;}
  .why b{color:var(--c800);}

  /* How it works */
  .how{margin-top:18px;}
  .how-h{font-size:13px; color:var(--c700); margin-bottom:16px;}
  .pipeline{display:flex; align-items:stretch; gap:0;}
  .stage{flex:1; background:var(--c50); border:1px solid var(--c200); border-radius:14px; padding:14px 15px;}
  .stage-ic{font-size:20px; line-height:1;}
  .stage-n{font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--c500); margin-top:8px;}
  .stage-t{font-size:14px; font-weight:700; color:var(--c800); margin-top:2px;}
  .stage-d{font-size:12px; color:var(--c600); margin-top:5px; line-height:1.45;}
  .chev{display:flex; align-items:center; padding:0 8px; font-size:26px; color:var(--c300); font-weight:700;}
  .sources{display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:14px; padding:12px 14px;
    background:#fff; border:1px dashed var(--c300); border-radius:12px; font-size:12px;}
  .src-cap{font-weight:700; color:var(--c700);}
  .src{background:var(--c50); border:1px solid var(--c200); border-radius:999px; padding:5px 12px; color:var(--c800);}
  .src b{color:var(--c700);}

  .trace-h{font-size:11px; text-transform:uppercase; letter-spacing:.07em; color:var(--c500); font-weight:700; margin:22px 0 10px;}
  .trace{display:flex; align-items:stretch; gap:0;}
  .t-col{flex:1; min-width:0;} .t-col.wide{flex:1.5;}
  .t-cap{font-size:11px; font-weight:700; color:var(--c600); margin-bottom:6px;}
  .t-box{background:var(--c50); border:1px solid var(--c200); border-radius:12px; padding:11px 13px; margin-bottom:8px;}
  .t-desc{font-size:12px; color:var(--c900); margin-top:4px; line-height:1.4;}
  .t-box.chips{display:flex; flex-direction:column; gap:7px;}
  .chip{display:flex; align-items:baseline; gap:8px; background:#fff; border:1px solid var(--c200); border-radius:8px; padding:5px 10px; font-size:13px; font-weight:600; color:var(--c900);}
  .chip i{font-style:normal; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--c400); width:42px; font-weight:700;}
  .t-arrow{display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 12px; color:var(--c400); font-size:20px; font-weight:700;}
  .t-arrow span{font-size:9px; text-transform:uppercase; letter-spacing:.05em; color:var(--c400); margin-bottom:2px; font-weight:700;}
  .src-read{margin-bottom:8px;} .src-read.ok{border-color:#a7e3b4; background:#f3fcf5;}
  .sr-title{font-size:12px; font-weight:700; color:var(--c700);}
  .sr-body{font-size:12px; color:var(--c800); margin-top:4px; line-height:1.45;}
  .rule{font-family:ui-monospace,Menlo,monospace; font-size:11px; background:var(--c100); color:var(--c800); padding:2px 7px; border-radius:6px;}
  .okmark{color:var(--green); font-weight:700;} .nomark{color:var(--danger); font-size:12px;}

  table.match{width:100%; border-collapse:collapse; font-size:13px; margin-top:2px;}
  table.match th{text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.05em; color:var(--c500); font-weight:700; padding:6px 8px; border-bottom:1px solid var(--c200);}
  table.match td{padding:8px 8px; border-bottom:1px solid var(--c100); vertical-align:middle;}
  .slot-chip{display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--c600); background:var(--c100); padding:2px 7px; border-radius:6px; margin-right:4px;}
  .small{font-size:11px;} .muted{color:var(--c400);}
  .match-foot{margin-top:12px; padding:11px 14px; background:#f3fcf5; border:1px solid #a7e3b4; border-radius:12px; font-size:13px; color:var(--c800);}

  footer{margin-top:30px; padding-top:18px; border-top:1px solid var(--c200); color:var(--c400); font-size:12px; text-align:center; line-height:1.6;}
  footer .dot{color:var(--c300); margin:0 6px;}

  @media (max-width:760px){
    .kpis{grid-template-columns:repeat(2,1fr);}
    .case-grid{grid-template-columns:1fr;}
    .brand p{display:none;}
    .pipeline,.trace{flex-direction:column;}
    .chev{transform:rotate(90deg); padding:6px 0; align-self:center;}
    .t-arrow{flex-direction:row; transform:rotate(90deg); padding:6px 0; align-self:center;}
    .t-arrow span{margin:0 4px 0 0;}
  }
</style></head>
<body>
  <header class="app">
    <div class="head-in">
      <div class="brand">
        ${logoData ? `<div class="logo-chip"><img src="${logoData}" alt="Northwest Specialty Hospital"></div>` : ''}
        <div>
          <h1>Implant Billsheet Reconciliation</h1>
          <p>Northwest Specialty Hospital &middot; Contract pricing engine</p>
        </div>
      </div>
      <span class="tag">Working prototype</span>
    </div>
  </header>

  <div class="wrap">
    <div class="lede">
      <h2>Every surgical case, automatically priced to contract</h2>
      <p>Each consignment billsheet is reconciled against our DePuy Synthes agreement across all three pricing
        regimes &mdash; line-item, capitated construct, and upcharge &mdash; verifying correct cases and flagging the rest before a PO is cut.</p>
    </div>

    <div class="kpis">
      <div class="kpi"><div class="n">${results.length}</div><div class="l">Cases reconciled</div><div class="s">${realCases.length} real billsheets</div></div>
      <div class="kpi ok"><div class="n">${verified}</div><div class="l">Auto-verified</div><div class="s">priced to contract</div></div>
      <div class="kpi warn"><div class="n">${flagged}</div><div class="l">Flagged for review</div><div class="s">routed to staff</div></div>
      <div class="kpi save"><div class="n">${money(identified)}</div><div class="l">Overcharge caught</div><div class="s">on a single case</div></div>
    </div>

    ${howItWorks()}

    ${results.map((x) => caseCard(x, mode)).join('')}

    <footer>
      Matched against ${data.lineprices.meta.rows.toLocaleString('en-US')} contracted line items
      <span class="dot">&bull;</span> ${data.constructs.length} capitated constructs
      <span class="dot">&bull;</span> Generated ${generated}
      <span class="dot">&bull;</span> Prototype &mdash; internal use only
    </footer>
  </div>
</body></html>`;

const summary = `${results.length} cases: ${verified} verified, ${flagged} flagged, ${money(identified)} caught`;

// Shareable dashboard — no PHI image bytes; safe to commit/deploy.
const OUT = join(ROOT, 'preview.html');
writeFileSync(OUT, renderHtml('shareable'));
console.log(`Wrote ${OUT}  (${summary})`);

// Self-contained local copy with billsheet scans embedded — for local viewing
// or printing straight to PDF. Gitignored (contains PHI). Only when scans exist.
const withScans = results.filter((x) => x.billsheet);
if (withScans.length) {
  const LOCAL = join(ROOT, 'preview.local.html');
  writeFileSync(LOCAL, renderHtml('local'));
  console.log(`Wrote ${LOCAL}  (self-contained, ${withScans.length} billsheet scan(s) embedded — LOCAL ONLY, gitignored)`);
}
