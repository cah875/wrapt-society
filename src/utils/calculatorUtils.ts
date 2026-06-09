// Pure calculation helpers for peptide reconstitution & dosing math.
// All functions are side-effect free and safe to call on every keystroke.
//
// Core relationships (U-100 insulin syringe = 100 units per 1 mL):
//   concentration (mg/mL) = vialMg / bacWaterMl
//   mcg per mL            = concentration * 1000
//   mcg per unit          = mcgPerMl / 100
//   units to draw         = doseMcg / mcgPerUnit
//   volume drawn (mL)     = unitsDrawn / 100

import { CalculatorResult } from '../types';
import { peptideDatabase } from '../data/peptideDatabase';

function round(value: number, decimals: number): number {
  if (!isFinite(value)) return 0;
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

/**
 * Mode 1 — Dose to Units.
 * Given a vial size, BAC water volume, and a desired dose in mcg,
 * return how many U-100 units to draw.
 */
export function calcUnitsFromDose(
  vialMg: number,
  bacWaterMl: number,
  doseMcg: number,
): CalculatorResult {
  const safeBac = bacWaterMl > 0 ? bacWaterMl : 0;
  const concentration = safeBac > 0 ? vialMg / safeBac : 0; // mg/mL
  const mcgPerUnit = (concentration * 1000) / 100; // mcg per U-100 unit
  const rawUnits = mcgPerUnit > 0 ? doseMcg / mcgPerUnit : 0;
  const units = round(rawUnits, 1);

  return {
    mode: 1,
    vialMg,
    bacWaterMl: safeBac,
    concentrationMgPerMl: round(concentration, 4),
    desiredDose: doseMcg,
    doseUnit: 'mcg',
    unitsToDrawOnSyringe: units,
    mathSteps: getMathSteps(vialMg, safeBac, doseMcg),
  };
}

/**
 * Mode 2 — Units to Water.
 * Given a vial size, the number of units the user wants a dose to occupy,
 * and the desired dose in mcg, return how much BAC water to add.
 */
export function calcBacWaterFromUnits(
  vialMg: number,
  unitsToDraw: number,
  doseMcg: number,
): CalculatorResult {
  // neededConcentration (mg/mL) = doseMcg / (unitsToDraw * 0.01 * 1000)
  //   unitsToDraw * 0.01 mL  -> volume occupied by the dose
  //   * 1000                 -> convert the resulting mg/mL scaling
  const denom = unitsToDraw * 0.01 * 1000;
  const neededConcentration = denom > 0 ? doseMcg / denom : 0; // mg/mL
  const bacWater =
    neededConcentration > 0 ? round(vialMg / neededConcentration, 2) : 0;

  const mcgPerUnit = (neededConcentration * 1000) / 100;

  const mathSteps: string[] = [
    `Step 1: Volume occupied by the dose = ${unitsToDraw} units × 0.01 mL = ${round(
      unitsToDraw * 0.01,
      3,
    )} mL.`,
    `Step 2: Needed concentration = ${doseMcg} mcg ÷ (${unitsToDraw} units × 0.01 × 1000) = ${round(
      neededConcentration,
      4,
    )} mg/mL.`,
    `Step 3: BAC water to add = vial ${vialMg} mg ÷ ${round(
      neededConcentration,
      4,
    )} mg/mL = ${bacWater} mL.`,
    `Step 4: At that fill, each unit holds ${round(
      mcgPerUnit,
      2,
    )} mcg, so drawing ${unitsToDraw} units gives ${doseMcg} mcg.`,
  ];

  return {
    mode: 2,
    vialMg,
    bacWaterMl: bacWater,
    concentrationMgPerMl: round(neededConcentration, 4),
    desiredDose: doseMcg,
    doseUnit: 'mcg',
    unitsToDrawOnSyringe: round(unitsToDraw, 1),
    mathSteps,
  };
}

/**
 * Mode 3 — Suggested Dose.
 * Look up a peptide, pull the low/moderate/high dose from its dosingRanges,
 * convert to mcg when needed, then compute units via calcUnitsFromDose.
 */
export function calcFromSuggestedDose(
  peptideId: string,
  dosingLevel: 'low' | 'moderate' | 'high',
  vialMg: number,
  bacWaterMl: number,
): CalculatorResult {
  const peptide = peptideDatabase.find((p) => p.id === peptideId);

  if (!peptide) {
    return {
      mode: 3,
      vialMg,
      bacWaterMl,
      concentrationMgPerMl: 0,
      unitsToDrawOnSyringe: 0,
      suggestedDoseMcg: 0,
      mathSteps: ['Peptide not found in database.'],
    };
  }

  const { dosingRanges } = peptide;
  const rawDose = dosingRanges[dosingLevel];
  // Convert to mcg. Treat "mg" as ×1000; "IU" has no clean mcg conversion so
  // we keep the numeric value (calculator still produces a usable unit count).
  let doseMcg = rawDose;
  if (dosingRanges.unit === 'mg') doseMcg = rawDose * 1000;

  const base = calcUnitsFromDose(vialMg, bacWaterMl, doseMcg);

  const mathSteps: string[] = [
    `Selected ${peptide.name} — ${dosingLevel} dose = ${rawDose} ${dosingRanges.unit}${
      dosingRanges.unit === 'mg' ? ` (= ${doseMcg} mcg)` : ''
    }.`,
    ...base.mathSteps,
  ];

  return {
    ...base,
    mode: 3,
    suggestedDoseMcg: doseMcg,
    mathSteps,
  };
}

/**
 * Plain-English, step-by-step breakdown of a dose→units calculation.
 * Used by Mode 1 and the dose log modal. Matches the spec's 4-step format.
 */
export function getMathSteps(
  vialMg: number,
  bacWaterMl: number,
  doseMcg: number,
): string[] {
  const concentration = bacWaterMl > 0 ? vialMg / bacWaterMl : 0;
  const mcgPerMl = concentration * 1000;
  const mcgPerUnit = mcgPerMl / 100;
  const units = mcgPerUnit > 0 ? doseMcg / mcgPerUnit : 0;

  return [
    `Step 1: Concentration = ${vialMg} mg ÷ ${bacWaterMl} mL = ${round(
      concentration,
      4,
    )} mg/mL.`,
    `Step 2: ${round(concentration, 4)} mg/mL × 1000 = ${round(
      mcgPerMl,
      2,
    )} mcg/mL.`,
    `Step 3: ${round(mcgPerMl, 2)} mcg/mL ÷ 100 units/mL = ${round(
      mcgPerUnit,
      3,
    )} mcg per unit.`,
    `Step 4: ${doseMcg} mcg ÷ ${round(mcgPerUnit, 3)} mcg/unit = ${round(
      units,
      1,
    )} units to draw on a U-100 syringe.`,
  ];
}

// Convenience used by modals: convert a dose (with unit) into mcg.
export function toMcg(dose: number, unit: 'mcg' | 'mg'): number {
  return unit === 'mg' ? dose * 1000 : dose;
}

// Volume (mL) consumed when drawing a given number of U-100 units.
export function volumeFromUnits(units: number): number {
  return round(units / 100, 4);
}
