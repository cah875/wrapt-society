// CLI: reconcile a billsheet case against the contract pricing repository.
//
//   node recon/reconcile.mjs recon/cases/gregg-rhip.json
//   node recon/reconcile.mjs recon/cases/*.json --policy=highest
//   node recon/reconcile.mjs --json recon/cases/griese-lhip.json
//
// Loads the bundled JSON pricing (constructs + line prices), runs the engine,
// and prints a human-readable reconciliation report (or raw JSON with --json).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reconcile } from './lib/engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

const data = {
  constructs: load(join(HERE, 'data', 'constructs.json')),
  lineprices: load(join(HERE, 'data', 'lineprices.json')),
};

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const policyArg = args.find((a) => a.startsWith('--policy='));
const policy = policyArg ? policyArg.split('=')[1] : 'lowest';
const files = args.filter((a) => !a.startsWith('--'));

if (!files.length) {
  console.error('usage: node recon/reconcile.mjs <case.json> [...] [--policy=lowest|highest] [--json]');
  process.exit(1);
}

const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m' };
const statusColor = (s) => ({ VERIFIED: C.green, REVIEW: C.yellow,
  PRICE_MISMATCH: C.red, NO_CONSTRUCT_MATCH: C.red }[s] || C.yellow);
const money = (n) => (n == null ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 }));

function report(r) {
  console.log(`\n${C.bold}━━━ ${r.patient}  ·  ${r.side || ''} ${r.case_type.toUpperCase()}  ·  DOS ${r.date_of_service} ━━━${C.reset}`);
  console.log(`${C.dim}case ${r.case_id}${C.reset}`);

  console.log(`\n  ${C.bold}Components${C.reset}`);
  for (const c of r.components) {
    const tier = c.sizeMm != null ? ` ${c.sizeMm}mm` : '';
    const conf = c.confidence === 'high' ? C.green : c.confidence === 'medium' ? C.yellow : C.red;
    console.log(`    ${(c.slot || '?').padEnd(6)} ${conf}${(c.family || 'UNKNOWN')}${tier}${C.reset}  ${C.dim}REF ${c.ref}${C.reset}`);
  }

  console.log(`\n  ${C.bold}Construct match${C.reset}  ${C.dim}(policy: ${policy})${C.reset}`);
  if (!r.candidates.length) {
    console.log(`    ${C.red}none${C.reset}`);
  } else {
    for (const cand of r.candidates) {
      const sel = r.selected && cand.construct_id === r.selected.construct_id;
      const mark = sel ? `${C.green}▶${C.reset}` : ' ';
      console.log(`    ${mark} ${cand.construct_id.padEnd(10)} ${money(cand.price).padStart(10)}  ${cand.name}${cand.uncertain ? C.yellow + ' (size unverified)' + C.reset : ''}`);
    }
  }

  const constructGoverned = r.line_lookups.filter((l) => l.governed_by_construct).length;
  console.log(`\n  ${C.bold}Line-item cross-check${C.reset}  ${C.dim}(DOS ${r.date_of_service})${C.reset}`);
  console.log(`    ${constructGoverned}/${r.line_lookups.length} components carry placeholder line prices ${C.dim}(=> construct-governed, as expected)${C.reset}`);
  for (const l of r.line_lookups) {
    if (l.active_line_price) console.log(`    ${C.cyan}REF ${l.ref}${C.reset} also has an active line price ${money(l.active_line_price)}`);
  }

  if (r.flags.length) {
    console.log(`\n  ${C.bold}Flags${C.reset}`);
    for (const f of r.flags) {
      const col = f.level === 'error' ? C.red : C.yellow;
      console.log(`    ${col}● ${f.code}${C.reset} ${f.msg}`);
    }
  }

  console.log(`\n  ${C.bold}Expected case price:${C.reset} ${C.bold}${money(r.expected_total)}${C.reset}` +
    (r.submitted_total != null ? `   submitted ${money(r.submitted_total)}` : `   ${C.dim}(rep total not on sheet)${C.reset}`));
  console.log(`  ${C.bold}Status:${C.reset} ${statusColor(r.status)}${C.bold}${r.status}${C.reset}`);
}

const results = files.map((f) => reconcile(load(f), data, { pricingPolicy: policy }));

if (asJson) {
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
} else {
  for (const r of results) report(r);
  console.log('');
}
