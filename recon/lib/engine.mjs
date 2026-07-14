// Reconciliation engine.
//
// Given a billsheet (case) and the two pricing sources (constructs + line
// prices), determine the expected price and either VERIFY it or FLAG it.
//
// The hard part is the capitated-construct match: a construct is satisfied
// when every clinical component on the sheet fits an eligible (family, size
// tier) slot AND every required slot of the construct is filled. Multiple
// constructs can be valid for the same build (the schedule has overlapping
// size tiers), so we return ALL matches and let a pricing policy choose.

import { classify } from './classify.mjs';
import { normalizeCatalog } from './normalize.mjs';

const REQUIRED_CORE = {
  hip: ['Stem', 'Head', 'Liner', 'Cup'],
  knee: ['Femur', 'Insert', 'Tib Tray'],
};

function canon(family) {
  return String(family || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sizeTierOk(mm, tier) {
  if (!tier) return true;          // family eligible at any size
  if (mm == null) return null;     // unknown — cannot confirm
  switch (tier.op) {
    case '<=': return mm <= tier.mm;
    case '>=': return mm >= tier.mm;
    case '<': return mm < tier.mm;
    case '>': return mm > tier.mm;
    default: return mm === tier.mm;
  }
}

// Can `comp` fill `slot` of `construct`? Returns { result, entry } where
// result is true / false / 'unknown' and entry is the eligibility line that
// admitted it (so callers can explain *why* a component qualified).
function eligibleInSlot(comp, eligList) {
  if (!eligList) return { result: false, entry: null };
  let unknownEntry = null;
  for (const e of eligList) {
    if (canon(e.family) !== canon(comp.family)) continue;
    const ok = sizeTierOk(comp.sizeMm, e.sizeTier);
    if (ok === true) return { result: true, entry: e };
    if (ok === null && !unknownEntry) unknownEntry = e;
  }
  return unknownEntry ? { result: 'unknown', entry: unknownEntry } : { result: false, entry: null };
}

function matchConstruct(components, construct) {
  const reasons = [];
  const usedSlots = new Set();
  const slotMatches = [];        // per-component: how it qualified (for explanation)
  let anyUnknown = false;

  // 1) every clinical component must fit some eligible slot
  for (const c of components) {
    const elig = construct.slots[c.slot];
    const { result: res, entry } = eligibleInSlot(c, elig);
    if (res === false) {
      reasons.push(`${c.slot} "${c.family || '?'}"${c.sizeMm ? ` ${c.sizeMm}mm` : ''} not eligible`);
      return { match: false, reasons };
    }
    slotMatches.push({ slot: c.slot, family: c.family, sizeMm: c.sizeMm ?? null,
      via: entry ? entry.raw : null, definite: res === true });
    if (res === 'unknown') anyUnknown = true;
    usedSlots.add(c.slot);
  }

  // 2) every required core slot the construct defines must be filled
  const required = (construct.core_slots || REQUIRED_CORE[construct.type] || [])
    .filter((s) => construct.slots[s]); // only slots this construct actually defines
  for (const s of required) {
    if (!usedSlots.has(s)) {
      reasons.push(`missing required ${s}`);
      return { match: false, reasons };
    }
  }

  // 3) a construct that defines a Metal Liner (dual mobility) requires one
  if (construct.slots['Metal Liner'] && !usedSlots.has('Metal Liner')) {
    reasons.push('construct requires Metal Liner (dual mobility); none on sheet');
    return { match: false, reasons };
  }

  return { match: true, reasons, uncertain: anyUnknown, slotMatches };
}

function dosWindowFor(windows, dosIso) {
  // Choose the line-price window valid on the date of service.
  const active = windows.filter((w) => {
    if (!w.start) return false;
    if (w.start > dosIso) return false;
    if (w.end && w.end < dosIso) return false;
    return true;
  });
  return { active, anyExpired: windows.some((w) => w.end && w.end < dosIso) };
}

/**
 * @param {object} kase   billsheet case
 * @param {object} data   { constructs, lineprices }
 * @param {object} opts   { pricingPolicy: 'lowest'|'highest', today }
 */
export function reconcile(kase, data, opts = {}) {
  const policy = opts.pricingPolicy || 'lowest';
  const dos = kase.date_of_service;
  const type = kase.case_type || 'hip';

  // 1) classify every component
  const components = kase.items.map((it) => ({ ...it, ...classify(it) }));
  const clinical = components.filter((c) =>
    (REQUIRED_CORE[type] || []).concat(['Metal Liner', 'Sleeve Modular']).includes(c.slot));

  // 2) find all matching constructs
  const candidates = [];
  for (const con of data.constructs) {
    if (con.type !== type) continue;
    const r = matchConstruct(clinical, con);
    if (r.match) candidates.push({ ...con, uncertain: r.uncertain, slotMatches: r.slotMatches });
  }
  candidates.sort((a, b) => a.price - b.price);

  // 3) apply pricing policy
  const selected = candidates.length
    ? (policy === 'highest' ? candidates[candidates.length - 1] : candidates[0])
    : null;

  // 4) line-item lookups (DOS-aware) for every component, for transparency
  const lineLookups = components.map((c) => {
    const windows = data.lineprices.index[normalizeCatalog(c.ref)] || [];
    const { active, anyExpired } = dosWindowFor(windows, dos);
    const linePriced = active.find((w) => w.line_priced);
    return {
      ref: c.ref,
      slot: c.slot,
      found: windows.length > 0,
      governed_by_construct: windows.length > 0 && !windows.some((w) => w.line_priced),
      active_line_price: linePriced ? linePriced.contracted_price : null,
      expired_only: anyExpired && active.length === 0 && windows.length > 0,
    };
  });

  // 5) assemble flags + status
  const flags = [];
  if (!selected) flags.push({ level: 'error', code: 'NO_CONSTRUCT_MATCH',
    msg: 'No capitated construct matches this component combination' });
  if (selected && candidates.length > 1) {
    const prices = [...new Set(candidates.map((c) => c.price))];
    const higher = candidates.filter((c) => c.price > selected.price);
    if (prices.length > 1) {
      // A specialized construct (e.g. "COP Delta TS Heads") often overlaps a
      // cheaper base construct at some size tiers. When the selected (lowest)
      // construct EXPLICITLY admits every component — every match pinned by a
      // definite family+size rule, no unknowns — the pricier overlapping
      // constructs add no required coverage here: they are redundant, not a
      // genuine ambiguity. Only when a size is unreadable (uncertain) can a
      // higher construct actually be the intended one, so we flag that.
      const explicit = selected.slotMatches && selected.slotMatches.every((m) => m.definite);
      if (policy === 'lowest' && higher.length && explicit) {
        const because = selected.slotMatches
          .filter((m) => m.via && /[<>=]/.test(m.via))
          .map((m) => `${m.slot} "${m.family}"${m.sizeMm != null ? ` ${m.sizeMm}mm` : ''} via "${m.via}"`)
          .join('; ');
        const alts = higher.map((c) => `${c.construct_id} "${c.name}" ($${c.price})`).join(', ');
        flags.push({ level: 'info', code: 'CONSTRUCT_RESOLVED',
          msg: `Selected ${selected.construct_id} "${selected.name}" ($${selected.price}) explicitly covers every component${because ? ` (${because})` : ''}. Higher-priced overlap ${alts} adds no required coverage at these sizes — not applicable; billing it would overcharge $${Math.max(...higher.map((c) => c.price)) - selected.price}.` });
      } else {
        flags.push({ level: 'warn', code: 'AMBIGUOUS_CONSTRUCT',
          msg: `Build matches ${candidates.length} constructs spanning $${Math.min(...prices)}–$${Math.max(...prices)}; policy="${policy}" selected $${selected.price}${explicit ? '' : ' — a component size could not be read, so a higher construct may apply'}` });
      }
    }
  }
  for (const c of components) {
    if (!c.family) flags.push({ level: 'warn', code: 'UNCLASSIFIED_COMPONENT',
      msg: `Could not classify ${c.slot || 'item'} (REF ${c.ref}): ${c.description}` });
  }
  for (const l of lineLookups) {
    if (l.expired_only) flags.push({ level: 'warn', code: 'EXPIRED_CONTRACT_WINDOW',
      msg: `REF ${l.ref}: line-price windows exist but none active on ${dos}` });
  }

  // line items NOT absorbed by the construct -> separately billable
  const extras = components.filter((c) =>
    !(REQUIRED_CORE[type] || []).concat(['Metal Liner', 'Sleeve Modular']).includes(c.slot));

  // compare to a submitted figure if the sheet carries one
  let status = 'REVIEW';
  let expected = selected ? selected.price : null;
  if (extras.length) {
    for (const e of extras) {
      const ll = lineLookups.find((l) => l.ref === e.ref);
      if (ll && ll.active_line_price) expected += ll.active_line_price;
    }
  }
  if (selected && kase.submitted_total != null) {
    status = Math.abs(kase.submitted_total - expected) < 0.01 ? 'VERIFIED' : 'PRICE_MISMATCH';
    if (status === 'PRICE_MISMATCH') flags.push({ level: 'error', code: 'PRICE_MISMATCH',
      msg: `Submitted $${kase.submitted_total} vs expected $${expected} (Δ $${(kase.submitted_total - expected).toFixed(2)})` });
  } else if (selected && !flags.some((f) => f.level === 'error' || f.code === 'AMBIGUOUS_CONSTRUCT')) {
    status = 'VERIFIED';
  }

  return {
    case_id: kase.case_id,
    patient: kase.patient,
    date_of_service: dos,
    case_type: type,
    components,
    candidates: candidates.map((c) => ({ construct_id: c.construct_id, name: c.name, price: c.price, uncertain: !!c.uncertain })),
    selected: selected ? { construct_id: selected.construct_id, name: selected.name, price: selected.price,
      why: (selected.slotMatches || []).map((m) => ({ slot: m.slot, family: m.family, sizeMm: m.sizeMm, via: m.via })) } : null,
    line_lookups: lineLookups,
    extras: extras.map((e) => ({ ref: e.ref, slot: e.slot, description: e.description })),
    expected_total: expected,
    submitted_total: kase.submitted_total ?? null,
    flags,
    status,
  };
}
