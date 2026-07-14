# Consignment Implant Billsheet Reconciliation — Engine Prototype

A runnable proof-of-concept for the idea: **store our implant contracts and
pricing in a repository, then reconcile a vendor's billsheet against it** —
auto-verifying cases that price correctly and flagging the ones that don't,
before a PO is cut.

This prototype is the **reconciliation engine only** (per the agreed scope:
*bundled JSON, prototype the engine first*). It ingests the two pricing
sources, classifies the components on a billsheet, matches the case to the
correct contract price, and prints a VERIFIED / REVIEW report. Capture (photo →
extract) and UI come later and reuse the existing app's Vision/UDI pipeline.

It is proven on the **two real DePuy billsheets** (Gregg R-hip, Griese L-hip)
plus one synthetic knee case, against the **real 18,495-row line-price list**
and the **real capitated-construct schedule** from the Single-Site Agreement.

## Why this is the hard part

Your DePuy contract uses **three pricing regimes at once**:

1. **Line-item** — a contracted price per catalog number (in the CSV).
2. **Capitated constructs** — one bundled price for a whole build, e.g. a
   primary THA = stem + head + liner + cup (in the *agreement PDF*, **not** the
   CSV — the CSV's `Cap construct price` column is entirely zero).
3. **Construct + upcharge** — a construct plus add-ons (Gription Multihole
   +$500, MS Insert +$250, …).

The decisive insight: **constructs are not matched by catalog number.** A
construct is matched by the *combination* of component **families** and **size
tiers**. So the engine reduces each billsheet line to `(slot, family, size)`
and then finds the construct whose eligibility rules the whole set satisfies.

## Layout

```
recon/
  source/                     committed source data (the durable inputs)
    Depuy_List_Price_Hip.csv          line-item price list (18,495 rows)
    constructs-schedule.txt           CAPITATED CONSTRUCTS text from the PDF
  build/                      one-time importers -> data/*.json
    parse-constructs.mjs              constructs-schedule.txt -> constructs.json
    parse-lineprices.mjs             CSV -> lineprices.json (indexed, dated)
  data/                       bundled JSON the engine reads (regenerable)
    constructs.json                   21 constructs w/ eligibility rules
    lineprices.json                   catalog# -> dated price windows
  lib/
    normalize.mjs                     catalog-number normalization
    classify.mjs                      component desc -> {slot, family, sizeMm}
    engine.mjs                        the reconciliation engine
  cases/                      example billsheets as JSON
    gregg-rhip.json   griese-lhip.json   example-knee.json (synthetic)
  reconcile.mjs               CLI report runner
```

## Run it

```bash
# Reconcile the two real cases (no deps, no API keys, pure Node):
node recon/reconcile.mjs recon/cases/gregg-rhip.json recon/cases/griese-lhip.json

# Knee, and the "highest price" policy, and raw JSON:
node recon/reconcile.mjs recon/cases/example-knee.json
node recon/reconcile.mjs recon/cases/gregg-rhip.json --policy=highest
node recon/reconcile.mjs recon/cases/griese-lhip.json --json

# Rebuild the bundled JSON from source (after a contract update):
node recon/build/parse-constructs.mjs
node recon/build/parse-lineprices.mjs

# Build the offline single-file scanner app (photo -> OCR -> priced case):
npm run app:build          # -> recon/billsheet-app.html (~16MB, gitignored)
```

## Offline scanner app (`recon/billsheet-app.html`)

One self-contained HTML file: open it in any modern browser (double-click,
`file://` is fine), drop in a billsheet **photo**, and it OCRs the stickers
locally (Tesseract wasm embedded in the file), extracts REF/LOT/description,
validates each catalog number against the price file, and prices the case
through the same engine as the CLI — **with zero network access**. Photos and
patient data never leave the machine.

- Sources: `recon/app/app.js` (UI + offline OCR bootstrap), `recon/app/app.css`,
  `recon/lib/extract.mjs` (OCR text → header/items), built by
  `recon/build/app.mjs` from `node_modules` + `recon/app/vendor/`.
- Extracted fields are editable before pricing; unreadable stickers can be
  keyed by REF (green dot = found in the price file).
- OCR layout modes (Auto / Sparse stickers / Single block) for tricky photos.
- Verified end-to-end in headless Chromium under `file://` with all network
  blocked, including a rotated/noisy photo simulation.

## What it found on the real billsheets

**Gregg, R-hip (DOS 2026-06-01)** — Actis stem + Ceramic Delta **TS** 40 mm
head + Gription cup + AltrX liner. The build satisfies **two** constructs:

| Construct | Price |
| --- | --- |
| `OSC363669` COP | **$4,250** |
| `OSC367606` COP Delta TS Heads | $4,750 |

The standard COP construct explicitly allows a *Ceramic Delta TS head > 36 mm*,
so a 40 mm TS head qualifies for the **$4,250** price. Billing it as the
dedicated "COP Delta TS Heads" construct would be a **$500 overcharge**. The
engine flags `AMBIGUOUS_CONSTRUCT`, selects the lowest valid price by policy,
and routes the case to **REVIEW**. *(This kind of subtle, money-on-the-table
catch is the whole point of the tool.)*

**Griese, L-hip (DOS 2026-06-03)** — Actis + Ceramic Delta (not-TS) 32 mm +
Gription + AltrX. Matches exactly one construct, `OSC363669` COP = **$4,250** →
**VERIFIED**. The engine *also* noticed the liner's only line-item price window
(`$941.10`) expired 2024-08-31, before the date of service →
`EXPIRED_CONTRACT_WINDOW`.

## How the engine decides

1. **Classify** each line → `(slot, family, sizeMm)` via keyword tables
   (`classify.mjs`). Confidence is reported per line.
2. **Match constructs**: a construct is satisfied when every clinical component
   fits an eligible `(family, size-tier)` slot **and** every required primary
   slot is filled. Conditional parts (S-Rom sleeve, dual-mobility metal liner)
   don't wrongly exclude a standard build.
3. **Price by policy**: overlapping size tiers mean several constructs can be
   valid; `--policy=lowest` (default, hospital-favorable) or `highest`.
4. **Cross-check line items** against the CSV at the **date of service** —
   confirming construct-governed items carry placeholder prices, and flagging
   expired/missing contract windows.
5. **Status**: `VERIFIED` (matches a submitted total, or unambiguous with no
   errors), `REVIEW` (ambiguous / unclassified / no submitted total), or
   `PRICE_MISMATCH` / `NO_CONSTRUCT_MATCH`.

## Known limitations (deliberate, for the prototype)

- **Classifier coverage** is seeded for the DePuy hip line + Attune knees in
  this agreement. New families/vendors = extend the keyword tables in
  `classify.mjs` (ideally backed by a generated catalog→family map).
- **Construct effective dates** aren't in the PDF text per-construct; the
  agreement-level window should gate matches in production.
- **OCR/Vision capture** is out of scope here — cases are hand-built JSON that
  mirror exactly what the capture step would emit.
- **Pricing policy** (lowest vs. most-specific construct) is a business rule to
  confirm with contracting; the engine supports both and shows all candidates.

## Suggested next steps

1. Confirm the **pricing policy** (lowest valid vs. most-specific construct).
2. Decide whether to broaden the **classifier** via a generated catalog→family
   map (Claude can build it from the manufacturer catalog).
3. Wire capture: photograph billsheet → Vision/UDI extract → `case.json` → this
   engine → VERIFIED/REVIEW queue → PO export. (Reuses the existing app.)
