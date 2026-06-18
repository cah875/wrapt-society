// Generate a self-contained HTML dashboard from the reconciliation engine —
// something you can open in any browser (no server, no Node) and project.
//
//   node recon/build/preview.mjs   ->   recon/preview.html
//
// Runs every case in recon/cases/ through the engine and renders an
// executive-style report: KPI tiles + per-case cards with findings.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reconcile } from '../lib/engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

const data = {
  constructs: load(join(ROOT, 'data', 'constructs.json')),
  lineprices: load(join(ROOT, 'data', 'lineprices.json')),
};

const caseDir = join(ROOT, 'cases');
const cases = readdirSync(caseDir).filter((f) => f.endsWith('.json')).sort();
const results = cases.map((f) => ({ file: f, raw: load(join(caseDir, f)),
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
  VERIFIED: { label: 'Auto-verified', cls: 'ok' },
  REVIEW: { label: 'Needs review', cls: 'warn' },
  PRICE_MISMATCH: { label: 'Price mismatch', cls: 'bad' },
  NO_CONSTRUCT_MATCH: { label: 'No match', cls: 'bad' },
};

function caseCard({ raw, r }) {
  const st = STATUS[r.status] || { label: r.status, cls: 'warn' };
  const comps = r.components.map((c) => `
      <tr>
        <td class="slot">${esc(c.slot || '?')}</td>
        <td><strong>${esc(c.family || 'UNKNOWN')}</strong>${c.sizeMm != null ? ` · ${c.sizeMm} mm` : ''}</td>
        <td class="ref">${esc(c.ref)}</td>
        <td class="desc">${esc(c.description)}</td>
      </tr>`).join('');

  const candidates = r.candidates.map((c) => {
    const sel = r.selected && c.construct_id === r.selected.construct_id;
    return `<li class="${sel ? 'sel' : ''}"><span class="cid">${esc(c.construct_id)}</span>
        <span class="cprice">${money(c.price)}</span>
        <span class="cname">${esc(c.name)}</span>${sel ? '<span class="pill">selected</span>' : ''}</li>`;
  }).join('') || '<li class="none">No capitated construct matched this build</li>';

  const findings = r.flags.map((f) => `
      <div class="finding ${f.level}">
        <span class="code">${esc(f.code)}</span>${esc(f.msg)}
      </div>`).join('') || '<div class="finding ok"><span class="code">CLEAN</span>No discrepancies — priced exactly to contract.</div>';

  const sub = raw.note ? `<div class="synthetic">⚙︎ Synthetic case — included to show the engine also handles knee constructs</div>` : '';

  return `
    <section class="card">
      <header class="card-h">
        <div>
          <h2>${esc(raw.patient)}</h2>
          <div class="meta">${esc(raw.side || '')} ${esc(r.case_type.toUpperCase())} · DOS ${esc(r.date_of_service)} · case ${esc(r.case_id)}</div>
        </div>
        <div class="badge ${st.cls}">${st.label}</div>
      </header>
      ${sub}
      <div class="grid">
        <div>
          <h3>Components scanned from billsheet</h3>
          <table class="comp"><tbody>${comps}</tbody></table>
        </div>
        <div>
          <h3>Contract price match</h3>
          <ul class="cands">${candidates}</ul>
          <div class="price-line">
            <span>Expected case price</span>
            <span class="big">${money(r.expected_total)}</span>
          </div>
          ${r.submitted_total != null ? `<div class="price-line sub"><span>Vendor submitted</span><span>${money(r.submitted_total)}</span></div>` : ''}
        </div>
      </div>
      <h3>Findings</h3>
      ${findings}
    </section>`;
}

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Implant Billsheet Reconciliation — Prototype</title>
<style>
  :root { --ink:#0f172a; --mut:#64748b; --line:#e2e8f0; --bg:#f1f5f9;
    --ok:#059669; --okbg:#ecfdf5; --warn:#b45309; --warnbg:#fffbeb; --bad:#dc2626; --badbg:#fef2f2; --brand:#1d4ed8; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink); background:var(--bg); }
  .wrap { max-width:1080px; margin:0 auto; padding:32px 24px 64px; }
  .top h1 { margin:0 0 4px; font-size:26px; letter-spacing:-.02em; }
  .top p { margin:0; color:var(--mut); }
  .proto { display:inline-block; margin-top:10px; font-size:12px; font-weight:600; color:var(--brand);
    background:#eff6ff; border:1px solid #bfdbfe; padding:3px 10px; border-radius:999px; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:24px 0 8px; }
  .kpi { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; }
  .kpi .n { font-size:30px; font-weight:700; letter-spacing:-.02em; }
  .kpi .l { color:var(--mut); font-size:13px; }
  .kpi.save .n { color:var(--ok); }
  .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px 24px; margin:18px 0;
    box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .card-h { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
  .card-h h2 { margin:0; font-size:19px; }
  .meta { color:var(--mut); font-size:13px; margin-top:3px; }
  .badge { font-weight:600; font-size:13px; padding:6px 12px; border-radius:999px; white-space:nowrap; }
  .badge.ok { color:var(--ok); background:var(--okbg); border:1px solid #a7f3d0; }
  .badge.warn { color:var(--warn); background:var(--warnbg); border:1px solid #fde68a; }
  .badge.bad { color:var(--bad); background:var(--badbg); border:1px solid #fecaca; }
  .synthetic { margin:10px 0 0; font-size:12px; color:var(--mut); }
  .grid { display:grid; grid-template-columns:1.15fr 1fr; gap:26px; margin:16px 0 4px; }
  h3 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:18px 0 8px; }
  table.comp { width:100%; border-collapse:collapse; font-size:13px; }
  table.comp td { padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  td.slot { color:var(--mut); width:62px; }
  td.ref { color:var(--mut); font-family:ui-monospace,Menlo,monospace; font-size:12px; white-space:nowrap; }
  td.desc { color:var(--mut); font-size:11px; max-width:0; }
  ul.cands { list-style:none; margin:0; padding:0; }
  ul.cands li { display:flex; align-items:center; gap:10px; padding:7px 10px; border:1px solid var(--line);
    border-radius:10px; margin-bottom:6px; font-size:13px; }
  ul.cands li.sel { border-color:#a7f3d0; background:var(--okbg); }
  ul.cands li.none { color:var(--bad); background:var(--badbg); border-color:#fecaca; }
  .cid { font-family:ui-monospace,Menlo,monospace; font-size:12px; color:var(--mut); }
  .cprice { font-weight:700; }
  .cname { flex:1; }
  .pill { font-size:11px; font-weight:600; color:var(--ok); background:#fff; border:1px solid #a7f3d0; padding:2px 8px; border-radius:999px; }
  .price-line { display:flex; justify-content:space-between; align-items:baseline; margin-top:12px; padding-top:12px;
    border-top:1px solid var(--line); }
  .price-line .big { font-size:24px; font-weight:700; letter-spacing:-.02em; }
  .price-line.sub { border:0; margin-top:2px; padding-top:0; color:var(--mut); font-size:13px; }
  .finding { font-size:13px; padding:9px 12px; border-radius:10px; margin-bottom:6px; }
  .finding .code { font-family:ui-monospace,Menlo,monospace; font-size:11px; font-weight:600; margin-right:10px;
    padding:2px 7px; border-radius:6px; background:rgba(0,0,0,.05); }
  .finding.error { background:var(--badbg); color:#7f1d1d; }
  .finding.warn { background:var(--warnbg); color:#7c2d12; }
  .finding.ok { background:var(--okbg); color:#065f46; }
  footer { color:var(--mut); font-size:12px; margin-top:28px; text-align:center; }
  @media (max-width:760px){ .kpis{grid-template-columns:repeat(2,1fr)} .grid{grid-template-columns:1fr} }
</style></head>
<body><div class="wrap">
  <div class="top">
    <h1>Consignment Implant Billsheet Reconciliation</h1>
    <p>Automatically pricing surgical cases against our DePuy Synthes contract — line-item, capitated construct, and upcharge regimes.</p>
    <span class="proto">Working prototype · ${realCases.length} real billsheets · live contract data</span>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="n">${results.length}</div><div class="l">Cases reconciled</div></div>
    <div class="kpi"><div class="n">${verified}</div><div class="l">Auto-verified</div></div>
    <div class="kpi"><div class="n">${flagged}</div><div class="l">Flagged for review</div></div>
    <div class="kpi save"><div class="n">${money(identified)}</div><div class="l">Overcharge caught</div></div>
  </div>

  ${results.map(caseCard).join('')}

  <footer>
    Matched against ${data.lineprices.meta.rows.toLocaleString('en-US')} contracted line items and ${data.constructs.length} capitated constructs ·
    Generated ${new Date().toLocaleString('en-US')} · Prototype, internal use
  </footer>
</div></body></html>`;

const OUT = join(ROOT, 'preview.html');
writeFileSync(OUT, html);
console.log(`Wrote ${OUT}  (${results.length} cases: ${verified} verified, ${flagged} flagged, ${money(identified)} caught)`);
