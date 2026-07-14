// Build the single-file offline Billsheet Scanner app.
//
//   node recon/build/app.mjs   ->   recon/billsheet-app.html
//
// Inlines EVERYTHING the app needs — Tesseract OCR (main lib, worker, wasm
// core, English traineddata), the reconciliation engine + extraction, and the
// full contract pricing data — so the output runs from a plain file:// open
// with zero network access. ~12 MB, by design: it must work on an offline
// hospital desktop with nothing installed.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const REPO = join(ROOT, '..');
const NM = join(REPO, 'node_modules');

const read = (p) => readFileSync(p, 'utf8');
const b64 = (p) => readFileSync(p).toString('base64');

// --- vendor pieces (from node_modules + vendored traineddata) --------------
const tesseractLib = read(join(NM, 'tesseract.js/dist/tesseract.min.js'));
const workerB64 = b64(join(NM, 'tesseract.js/dist/worker.min.js'));
const coreB64 = b64(join(NM, 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js'));
const wasmB64 = b64(join(NM, 'tesseract.js-core/tesseract-core-simd-lstm.wasm'));
const langB64 = b64(join(ROOT, 'app/vendor/eng.traineddata.gz'));

// --- engine bundle: strip ESM syntax, wrap into window.RECON ---------------
function stripEsm(src) {
  return src
    .replace(/^import\s[^\n]*\n/gm, '')
    .replace(/^export\s+(function|const|let|class)/gm, '$1')
    .replace(/^export\s*\{[^}]*\};?\s*$/gm, '');
}
const engineBundle = [
  '(function(){',
  stripEsm(read(join(ROOT, 'lib/normalize.mjs'))),
  stripEsm(read(join(ROOT, 'lib/classify.mjs'))),
  stripEsm(read(join(ROOT, 'lib/engine.mjs'))),
  stripEsm(read(join(ROOT, 'lib/extract.mjs'))),
  'window.RECON = { classify, reconcile, extractSheet, normalizeCatalog };',
  '})();',
].join('\n');

// --- data (escape "<" so "</script>" can never occur inside the JSON) ------
const jsonJs = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
const constructs = JSON.parse(read(join(ROOT, 'data/constructs.json')));
const lineprices = JSON.parse(read(join(ROOT, 'data/lineprices.json')));

// --- optional logo ----------------------------------------------------------
let logo = '';
try { logo = 'data:image/png;base64,' + b64(join(REPO, 'public/logo.png')); } catch { /* optional */ }

const appCss = read(join(ROOT, 'app/app.css'));
const appJs = read(join(ROOT, 'app/app.js'));

for (const [name, src] of [['tesseract.min.js', tesseractLib], ['app.js', appJs], ['engine', engineBundle]]) {
  if (src.includes('</script')) throw new Error(`${name} contains a literal </script> — refusing to inline`);
}

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Billsheet Scanner — Offline Reconciliation</title>
<style>${appCss}</style>
</head>
<body>
  <header class="app"><div class="head-in">
    <div class="brand">
      ${logo ? `<div class="logo-chip"><img src="${logo}" alt="Northwest Specialty Hospital"></div>` : ''}
      <div><h1>Billsheet Scanner</h1><p>Northwest Specialty Hospital · Offline contract reconciliation</p></div>
    </div>
    <span class="tag">100% local — no internet</span>
  </div></header>
  <div class="wrap">
    <div class="phi"><span>🔒</span><div><b>Everything stays on this computer.</b> The photo is read by an OCR engine embedded in this file and priced against the contract data embedded in this file. Nothing is uploaded anywhere — this page makes no network requests at all.</div></div>
    <div id="drop" class="drop">
      <input id="file" type="file" accept="image/*" multiple>
      <div class="big">Drop billsheet photo(s) here — or click to choose</div>
      <div class="sub">JPG/PNG photos of the sticker sheet. Each photo becomes a priced case below.</div>
    </div>
    <div id="sheets"></div>
    <footer>
      ${lineprices.meta.rows.toLocaleString('en-US')} contracted line items
      <span class="dot">&bull;</span> ${constructs.length} capitated constructs
      <span class="dot">&bull;</span> Prototype — internal use only
      <div class="byline">Created by Chris Hill</div>
    </footer>
  </div>
  <script>window.__B64 = { worker: "${workerB64}", core: "${coreB64}", wasm: "${wasmB64}", lang: "${langB64}" };</script>
  <script>${tesseractLib}</script>
  <script>window.DATA = { constructs: ${jsonJs(constructs)}, lineprices: ${jsonJs(lineprices)} };</script>
  <script>${engineBundle}</script>
  <script>${appJs}</script>
</body></html>`;

const OUT = join(ROOT, 'billsheet-app.html');
writeFileSync(OUT, html);
console.log(`Wrote ${OUT}  (${(html.length / 1024 / 1024).toFixed(1)} MB, fully self-contained)`);
