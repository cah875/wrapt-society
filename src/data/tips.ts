// Rotating educational tips shown on the Home screen (one per day).
// Research/informational only — not medical advice.

export const tips: string[] = [
  'Reading a U-100 syringe: the numbers count insulin "units," where 100 units = 1 mL. So 50 units is exactly 0.5 mL. The calculator tells you which line to draw to.',
  'BAC water (bacteriostatic water) is sterile water containing 0.9% benzyl alcohol. The preservative lets a reconstituted vial be used over many days without bacterial growth — that is why it is preferred over plain sterile water.',
  'Reconstitution step by step: (1) wipe both vial tops with alcohol, (2) draw your BAC water, (3) inject it slowly down the inside wall of the peptide vial, (4) let it dissolve, swirling gently. Never spray water directly onto the powder.',
  'Subcutaneous injection technique: pinch a fold of skin (abdomen or thigh), insert the short insulin needle at 45–90°, inject slowly, then release. Subcutaneous means into the fat layer just under the skin.',
  'Rotate injection sites with every dose to avoid irritation and lumps. A simple pattern is to move around the navel like a clock face, then switch to the opposite side or the thighs.',
  'Storage best practices: keep lyophilized (powder) peptides cold and dark — freezer for long-term, fridge once reconstituted. Most reconstituted peptides are good in the fridge for roughly 2–4 weeks.',
  'Avoid foaming when reconstituting by adding the water slowly against the glass wall and swirling — never squirting it forcefully onto the powder, which whips air into the solution.',
  'The concentration calculation (mg ÷ mL) tells you how much peptide is in each milliliter. From there, every 1 unit on a U-100 syringe holds 1/100th of a mL of that solution.',
  'mcg vs mg: 1 mg = 1000 mcg. Most peptide doses are written in micrograms (mcg) even though vials are labeled in milligrams (mg) — keep the conversion straight to avoid a 1000× error.',
  'To calculate units from a desired dose: find mcg-per-unit (concentration × 1000 ÷ 100), then divide your target dose by that number. The Calculator does this automatically as you type.',
  'Never shake a reconstituted peptide. Shaking shears the delicate peptide chains and denatures them. Always swirl or gently roll the vial instead.',
  'Use the syringe diagram as a visual double-check: the red dashed line shows exactly how far up the barrel to pull the plunger for your calculated dose.',
  'Expiry warnings turn yellow once 80% of a vial\'s stability window has elapsed, and red once it is past expiry. Powder lasts far longer than reconstituted solution.',
  'Logging a dose records the date, amount, and units drawn, and automatically subtracts the volume used from your vial\'s remaining mL — so your inventory stays accurate.',
  'Transition a vial from powder to reconstituted using the "Reconstitute This Vial" button. This locks in the BAC water amount, concentration, and a fresh expiry clock based on the reconstituted shelf life.',
  'RUO means "Research Use Only." These compounds are sold for laboratory research and are not approved drugs. Nothing in this app is medical advice.',
  'Cycle length matters because many peptides downregulate their own receptors or lose effect over time. Following the suggested on/off cycle helps preserve sensitivity.',
  'Consistent refrigeration temperature (around 2–8°C / 36–46°F) protects reconstituted peptides. Avoid the fridge door, where temperature swings most, and never let them freeze unless rated for it.',
  'Dispose of used syringes safely in a rigid, puncture-proof sharps container — never loose in household trash. Many pharmacies and clinics accept full sharps containers.',
  'Keeping a consistent dosing schedule (same time of day) improves data quality and helps you notice effects. Pair injections with an existing daily habit to remember them.',
  'Higher concentration means fewer units per dose but less precision for tiny doses; lower concentration spreads the dose across more units for finer measurement. Pick a dilution that lands your typical dose on an easy-to-read number of units.',
  'Always inspect a reconstituted vial before drawing: the solution should be clear. Cloudiness, particles, or discoloration mean it should not be used.',
];

// Deterministic tip-of-the-day based on the calendar date so it is stable
// across reloads within the same day.
export function tipForDate(date: Date = new Date()): string {
  const dayNumber = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return tips[dayNumber % tips.length];
}
