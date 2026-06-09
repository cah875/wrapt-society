// PeptideVault Database — Batch 1: Recovery & Repair
// Math verification key:
//   concentrationMgPerMl = vialMg / bacWaterMl
//   mcgPerUnit = (concentrationMgPerMl * 1000) / 100
//   unitsFor100mcg = 100 / mcgPerUnit

export interface PeptideEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string[];
  mechanism: string;
  researchStatus: string;
  dosingRanges: {
    low: number;
    moderate: number;
    high: number;
    unit: "mcg" | "mg" | "IU";
    perDose: boolean;
    titrationNotes: string;
    route: string[];
  };
  frequency: string;
  cycleLength: string;
  halfLife: string;
  storageInfo: {
    powder: string;
    reconstituted: string;
    notes: string;
  };
  stability: {
    powderDays: number | null;
    reconstitutedFridgeDays: number | null;
    reconstitutedFreezerDays: number | null;
  };
  commonVialSizes: {
    mg: number;
    unit: "mg" | "IU";
    isCommon: boolean;
  }[];
  reconstitutionRatios: {
    vialMg: number;
    recommendedBacWaterMl: number;
    concentrationMgPerMl: number;
    mcgPerUnit: number;
    unitsFor100mcg: number;
    alternativeDilutions: {
      bacWaterMl: number;
      concentrationMgPerMl: number;
      mcgPerUnit: number;
      notes: string;
    }[];
    notes: string;
  }[];
  sideEffects: string[];
  contraindications: string[];
  researchNotes: string;
  stackNotes: string;
  disclaimer: string;
}

export const peptideDatabase: PeptideEntry[] = [

  // ─────────────────────────────────────────────
  // BATCH 1: RECOVERY & REPAIR
  // ─────────────────────────────────────────────

  {
    id: "bpc-157",
    name: "BPC-157",
    aliases: ["Body Protection Compound-157", "PL-14736", "BPC157"],
    category: ["Recovery & Repair"],
    mechanism: "BPC-157 is a synthetic 15-amino-acid peptide derived from a protective protein found in human gastric juice. It promotes tissue healing by upregulating VEGF, eNOS, EGF, and FGF, stimulating angiogenesis and collagen synthesis at injury sites. It modulates nitric oxide signaling and the FAK-paxillin pathway to accelerate cell migration and proliferation. Anti-inflammatory effects are achieved by suppressing pro-inflammatory cytokines including TNF-α and IL-6. Preclinical models show accelerated repair of tendons, ligaments, muscle, bone, and GI mucosa.",
    researchStatus: "Preclinical only (extensive animal/in vitro data); Phase I oral safety trial completed; Research use only",
    dosingRanges: {
      low: 200,
      moderate: 500,
      high: 1000,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Start at 200–250 mcg once daily. Increase to 500 mcg after 1–2 weeks if tolerated. Advanced protocols use 500–1000 mcg split into two daily doses. Inject subcutaneously near the injury site when possible. Can be taken orally for GI-specific applications.",
      route: ["subcutaneous", "intramuscular", "oral"],
    },
    frequency: "Once or twice daily",
    cycleLength: "4–12 weeks",
    halfLife: "~4 hours (estimated from animal models)",
    storageInfo: {
      powder: "Store lyophilized powder at -20°C (-4°F) in a dry, dark environment. Keep desiccated.",
      reconstituted: "Refrigerate at 2–8°C (35–46°F), protected from light. Use within 28–30 days.",
      notes: "Add BAC water slowly down the vial wall. Swirl gently — never shake. Avoid repeated freeze-thaw cycles on reconstituted solution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 30,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg vial: 2 / 1 = 2 mg/mL | mcgPerUnit = (2*1000)/100 = 20 | unitsFor100mcg = 100/20 = 5
        vialMg: 2,
        recommendedBacWaterMl: 1,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "Lower concentration — use for sub-200mcg doses needing finer measurement",
          },
        ],
        notes: "1 mL BAC water gives clean 20 mcg/unit math. Good for 200–400 mcg dosing.",
      },
      {
        // 5mg vial: 5 / 2 = 2.5 mg/mL | mcgPerUnit = (2.5*1000)/100 = 25 | unitsFor100mcg = 100/25 = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "Higher volume, lower concentration — ideal for very precise low dosing",
          },
        ],
        notes: "2 mL BAC water is the standard for 5mg vials. 500mcg dose = 20 units on U-100.",
      },
      {
        // 10mg vial: 10 / 4 = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "Lower concentration for very low dose precision",
          },
        ],
        notes: "4 mL BAC water maintains same concentration as 5mg vial for consistent dosing math.",
      },
    ],
    sideEffects: [
      "Mild injection site redness or irritation",
      "Nausea (more common with oral administration)",
      "Dizziness (rare)",
      "Warm/flushing sensation at injection site",
      "Temporary hypotension (rare, animal data)",
    ],
    contraindications: [
      "Active malignancy or cancer history (theoretical concern — promotes angiogenesis)",
      "Pregnancy or breastfeeding",
      "Known hypersensitivity to peptide components",
    ],
    researchNotes: "Over 30 years of preclinical research spanning GI protection, tendon/ligament healing, bone repair, CNS protection, and systemic organ protection. Key studies include Sikiric et al. (multiple publications). Phase I oral trial (NCT05278013) completed with good tolerability. No large-scale RCTs in humans yet. Oral form studied for IBD. Intra-articular injection showed promise in a small human case series.",
    stackNotes: "Commonly paired with TB-500 for synergistic recovery (BPC handles local repair, TB-500 handles systemic/distal healing). May be combined with Thymosin Alpha-1 for immune-modulated recovery protocols.",
    disclaimer: "For research use only. Not approved for human therapeutic use. Not intended to diagnose, treat, cure, or prevent any disease. Consult a licensed healthcare provider.",
  },

  {
    id: "tb-500",
    name: "TB-500",
    aliases: ["Thymosin Beta-4 (synthetic fragment)", "TB500", "Tβ4 fragment", "Thymosin Beta-4"],
    category: ["Recovery & Repair"],
    mechanism: "TB-500 is a synthetic version of the naturally occurring peptide Thymosin Beta-4, specifically the actin-binding domain fragment (Ac-SDKP and surrounding sequence). It promotes cell migration, proliferation, and differentiation by sequestering actin monomers (G-actin), regulating cytoskeletal dynamics. It upregulates matrix metalloproteinases and promotes angiogenesis through VEGF pathway activation. Systemic distribution after injection allows repair of distal injury sites — distinguishing it from local-acting peptides like BPC-157. Preclinical models show benefit for cardiac, tendon, muscle, and neurological tissue repair.",
    researchStatus: "Preclinical; Thymosin Beta-4 studied in Phase I/II trials (heart failure, eye wounds); TB-500 synthetic fragment is research use only",
    dosingRanges: {
      low: 2,
      moderate: 5,
      high: 10,
      unit: "mg",
      perDose: true,
      titrationNotes: "Standard research protocol: 5mg twice weekly for loading phase (weeks 1–4), then 5mg once weekly for maintenance. Lower doses of 2–2.5mg 2x/week used for general recovery. Higher doses up to 10mg/week used for acute injury protocols.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "2x per week (loading) / Once weekly (maintenance)",
    cycleLength: "4–6 weeks loading, then 4–6 weeks maintenance",
    halfLife: "~3–10 days (estimated; long due to protein binding)",
    storageInfo: {
      powder: "Store at -20°C (-4°F), dry and dark. Stable for up to 2 years properly stored.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Very stable peptide. Reconstituted solution can technically be frozen but refrigeration preferred to preserve integrity. Inject slowly down vial wall when reconstituting.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: 90,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 1mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        // For mg-dosed peptide: 1mg = 50 units at this concentration
        vialMg: 2,
        recommendedBacWaterMl: 1,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1mg dose = 10 units on U-100. Easier for 2mg total dose (20 units).",
          },
        ],
        notes: "At 2mg/mL: 2mg dose = 100 units (full 1mL syringe). Consider 1mL dilution for easier measuring.",
      },
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        // 5mg dose = 200 units — split into 2 injections of 100 units each
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 2.5mg dose = 25 units. Easier syringe measurement for lower doses.",
          },
        ],
        notes: "Standard 5mg vial. At 2.5mg/mL: 2.5mg dose = 10 units. 5mg dose = 20 units. Clean math.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 5mg dose = 50 units. Good for larger volume split injections.",
          },
        ],
        notes: "Maintains same concentration as 5mg vial for consistent math across vial sizes.",
      },
    ],
    sideEffects: [
      "Fatigue or tiredness (transient, common in first days)",
      "Mild injection site reaction",
      "Head rush or lightheadedness shortly after injection",
      "Theoretical concern for promotion of pre-existing tumor growth (angiogenesis)",
    ],
    contraindications: [
      "Active malignancy or cancer history (promotes angiogenesis)",
      "Pregnancy or breastfeeding",
      "Hypersensitivity to Thymosin Beta-4 or components",
    ],
    researchNotes: "Thymosin Beta-4 (the natural parent molecule) has been studied in Phase I/II trials for acute MI (RegeneRx), dry eye disease, and epidermolysis bullosa with promising safety profiles. TB-500 as a synthetic fragment is research use only. Strong preclinical data for cardiac repair (Bock-Marquette et al.), skeletal muscle, tendon, and retinal repair.",
    stackNotes: "The classic stack is BPC-157 + TB-500 at equal ratios (available as pre-blended vials). BPC-157 provides local/targeted repair; TB-500 provides systemic/distal tissue healing. Often used together post-surgery or acute injury. Can add Thymosin Alpha-1 for immune support during recovery.",
    disclaimer: "For research use only. Not approved for human therapeutic use. Not intended to diagnose, treat, cure, or prevent any disease.",
  },

  {
    id: "kpv",
    name: "KPV",
    aliases: ["Lys-Pro-Val", "α-MSH C-terminal tripeptide", "KPV tripeptide"],
    category: ["Recovery & Repair", "Immune"],
    mechanism: "KPV is a C-terminal tripeptide fragment of alpha-melanocyte-stimulating hormone (α-MSH) consisting of the amino acids lysine-proline-valine. It exerts potent anti-inflammatory effects by binding to melanocortin receptors (MC1R, MC3R) and directly inhibiting NF-κB signaling, reducing production of pro-inflammatory cytokines including IL-1β, IL-6, TNF-α, and IL-8. Additionally, KPV demonstrates direct antimicrobial activity against certain bacteria and fungi. Particularly studied for gut inflammation, skin wound healing, and systemic inflammatory conditions.",
    researchStatus: "Preclinical; research use only. Oral and topical forms under investigation for IBD and wound healing.",
    dosingRanges: {
      low: 500,
      moderate: 1000,
      high: 2000,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Start at 500 mcg once daily subcutaneously. For GI applications, oral delivery explored at higher doses due to absorption losses. Titrate weekly based on response.",
      route: ["subcutaneous", "oral", "topical"],
    },
    frequency: "Once or twice daily",
    cycleLength: "4–8 weeks",
    halfLife: "~2–3 hours (estimated)",
    storageInfo: {
      powder: "Store at -20°C, dry and protected from light.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Swirl gently to reconstitute. Small peptide — very stable in lyophilized form.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 10,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "Lower concentration — 500mcg dose = 20 units. Better for lower dose precision.",
          },
        ],
        notes: "At 5mg/mL: 500mcg = 10 units, 1000mcg = 20 units. Clean and practical.",
      },
      {
        // 20mg / 4mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 20,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 8,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "1000mcg dose = 40 units. Easier to measure for twice-daily dosing.",
          },
        ],
        notes: "Maintains same concentration as 10mg vial for consistent math.",
      },
    ],
    sideEffects: [
      "Generally very well tolerated",
      "Mild injection site irritation",
      "Nausea at higher oral doses",
    ],
    contraindications: [
      "Known hypersensitivity to MSH-related peptides",
      "Pregnancy (insufficient data)",
    ],
    researchNotes: "Demonstrated efficacy in preclinical IBD models (colitis), wound healing, and systemic inflammation. KPV encapsulated in nanoparticles showed significant gut penetration and reduced colitis severity in mouse models. Often studied alongside BPC-157 for gut repair protocols. Antimicrobial activity observed against S. aureus and C. albicans in vitro.",
    stackNotes: "Often combined with BPC-157 for gut healing protocols. The Tri-Heal blend (BPC-157 + TB-500 + KPV) leverages complementary mechanisms: local gut/tissue repair (BPC-157), systemic healing (TB-500), and inflammation resolution (KPV).",
    disclaimer: "For research use only. Not approved for human therapeutic use. Not intended to diagnose, treat, cure, or prevent any disease.",
  },

  {
    id: "ghk-cu",
    name: "GHK-Cu",
    aliases: ["Copper Peptide GHK-Cu", "Glycyl-L-histidyl-L-lysine copper", "GHK Copper", "Copper Tripeptide-1"],
    category: ["Recovery & Repair", "Skin / Cosmetic", "Longevity / Epigenetic"],
    mechanism: "GHK-Cu is a naturally occurring copper-binding tripeptide (glycine-histidine-lysine) that declines with age. It promotes wound healing by stimulating collagen, elastin, and glycosaminoglycan synthesis, and activates tissue remodeling enzymes including matrix metalloproteinases. GHK-Cu exhibits potent antioxidant activity, scavenging free radicals and upregulating superoxide dismutase. Epigenetic studies show it resets gene expression patterns in damaged cells toward a more youthful baseline, affecting over 31% of human genes involved in inflammation, DNA repair, and metabolic regulation. Also promotes angiogenesis and nerve outgrowth.",
    researchStatus: "Topical use well-established (cosmetic); injectable form research use only; preclinical data for systemic applications",
    dosingRanges: {
      low: 1,
      moderate: 2,
      high: 3,
      unit: "mg",
      perDose: true,
      titrationNotes: "Topical: apply 1–5% solution to affected area once or twice daily. Injectable: 1mg subcutaneously once daily to start; can increase to 2–3mg. Most human data comes from topical cosmetic applications.",
      route: ["subcutaneous", "topical", "intramuscular"],
    },
    frequency: "Once daily",
    cycleLength: "8–12 weeks",
    halfLife: "~30 minutes (copper complex form; rapidly distributed)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry. Copper peptides can be sensitive to oxidation — keep tightly sealed.",
      reconstituted: "Refrigerate at 2–8°C. Use within 30 days. May develop a slight blue/green color from copper — this is normal.",
      notes: "Blue/green tint in solution is normal due to copper ion. Swirl gently. Store away from direct light as copper complexes can photodegrade.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 30,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 50, unit: "mg", isCommon: true },
      { mg: 100, unit: "mg", isCommon: true },
      { mg: 200, unit: "mg", isCommon: false },
    ],
    reconstitutionRatios: [
      {
        // 50mg / 10mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // For mg doses: 1mg = 20 units, 2mg = 40 units
        vialMg: 50,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 10.0,
            mcgPerUnit: 100,
            notes: "Higher concentration — 1mg dose = 10 units. More concentrated for smaller injection volume.",
          },
        ],
        notes: "10mL BAC water for 50mg vial. At 5mg/mL: 1mg dose = 20 units on U-100. Practical for daily 1–2mg dosing.",
      },
      {
        // 100mg / 20mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 100,
        recommendedBacWaterMl: 20,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 10.0,
            mcgPerUnit: 100,
            notes: "10mg/mL — 1mg dose = 10 units. Smaller injection volume per dose.",
          },
        ],
        notes: "Large vial — consider aliquoting into smaller portions to reduce repeated needle penetration and contamination risk.",
      },
    ],
    sideEffects: [
      "Topical: rare skin irritation, redness at high concentrations",
      "Injectable: mild injection site reaction",
      "Theoretical copper accumulation with very high doses (unlikely at research doses)",
      "Possible skin darkening with high topical concentrations",
    ],
    contraindications: [
      "Wilson's disease (copper metabolism disorder)",
      "Known copper hypersensitivity",
      "Pregnancy (insufficient safety data for injectable form)",
    ],
    researchNotes: "Loren Pickart pioneered GHK-Cu research starting in the 1970s. Thousands of in vitro and animal studies document wound healing, skin rejuvenation, hair follicle stimulation, and epigenetic effects. Gene expression analysis (Pickart & Margolina) showed GHK-Cu resets inflammation and DNA repair genes. Well-established in cosmetic dermatology. Injectable research use is extrapolated from topical data — direct human injectable studies are limited.",
    stackNotes: "Combined with Epitalon for longevity/anti-aging protocols. Stacked with BPC-157 for wound healing. Used alongside retinoids in topical skin protocols. Sometimes combined with DSIP for recovery and sleep.",
    disclaimer: "For research use only. Topical cosmetic use is established; injectable form not approved for human therapeutic use.",
  },

  {
    id: "aod-9604",
    name: "AOD-9604",
    aliases: ["Anti-Obesity Drug 9604", "hGH Fragment 177-191", "AOD9604", "Tyr-hGH Frag 177-191"],
    category: ["Recovery & Repair", "GLP-1 / Metabolic"],
    mechanism: "AOD-9604 is a modified fragment of human growth hormone (hGH) comprising amino acids 177–191 of the hGH C-terminus, with an added tyrosine at the N-terminus. It mimics the lipolytic (fat-burning) effects of hGH without stimulating IGF-1 production or causing insulin resistance. AOD-9604 activates beta-3 adrenergic receptors to stimulate fat oxidation and inhibits lipogenesis (new fat creation). Additionally studied for cartilage and bone repair through modulation of the SOX9 pathway in preclinical models.",
    researchStatus: "Phase II/III clinical trials completed for obesity (Australia/US) with good safety profile; approved as food ingredient (GRAS status in US); research use only for injectable form",
    dosingRanges: {
      low: 150,
      moderate: 300,
      high: 500,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Standard protocol: 300 mcg once daily subcutaneously, administered 30 minutes before first meal or morning exercise. Some protocols use 150 mcg twice daily. Best results observed in fasted state.",
      route: ["subcutaneous", "oral"],
    },
    frequency: "Once daily (fasted, AM)",
    cycleLength: "12–16 weeks",
    halfLife: "~30 minutes",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Swirl gently. Sensitive to temperature fluctuations — maintain consistent refrigeration.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 300mcg dose = 15 units. Smaller injection volume.",
          },
        ],
        notes: "At 1mg/mL: 300mcg dose = 30 units on U-100. Easy and accurate measurement.",
      },
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 300mcg = 30 units. More volume per injection but easier to measure.",
          },
        ],
        notes: "At 2.5mg/mL: 300mcg = 12 units on U-100. Clean measurement for standard dose.",
      },
    ],
    sideEffects: [
      "Mild injection site redness",
      "Facial flushing (transient)",
      "Fatigue in early weeks",
      "Nausea (rare)",
      "Headache (rare)",
    ],
    contraindications: [
      "Pregnancy or breastfeeding",
      "Active malignancy (theoretical IGF-pathway concern at high doses)",
      "Pediatric use (insufficient data)",
    ],
    researchNotes: "Metabolix/Calzada Phase IIb trials showed significant fat loss vs placebo with excellent safety profile. No IGF-1 elevation observed at therapeutic doses, distinguishing it from hGH. Australian TGA granted GRAS status for oral form. Cartilage regeneration properties studied by Ghosh et al. in OA models.",
    stackNotes: "Often combined with CJC-1295 + Ipamorelin for body composition protocols (AOD handles fat loss, GH secretagogues handle muscle/recovery). Pre-blended AOD + CJC + Ipamorelin 12mg blends are commercially available.",
    disclaimer: "For research use only in injectable form. Oral/food ingredient form has GRAS status. Not approved for therapeutic use via injection.",
  },

  {
    id: "ll-37",
    name: "LL-37",
    aliases: ["Cathelicidin LL-37", "Human Cathelicidin", "hCAP18/LL-37", "CAMP peptide"],
    category: ["Antimicrobial", "Immune", "Recovery & Repair"],
    mechanism: "LL-37 is the only human cathelicidin antimicrobial peptide, derived from the C-terminus of the hCAP18 protein. It directly disrupts bacterial cell membranes through amphipathic helix insertion, achieving broad-spectrum bactericidal activity against gram-positive and gram-negative organisms, fungi, and certain viruses. Beyond antimicrobial activity, LL-37 modulates innate immune responses by activating Toll-like receptor signaling, promoting chemokine and cytokine production, and stimulating angiogenesis and wound healing through EGFR/MAPK pathways. It also promotes biofilm disruption and has demonstrated anti-tumor activity in several cancer cell line models.",
    researchStatus: "Preclinical and early clinical (topical wound healing); injectable form research use only",
    dosingRanges: {
      low: 100,
      moderate: 300,
      high: 500,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Research protocols typically use 100–500 mcg subcutaneously daily. Topical applications use higher concentrations applied directly to wound sites. Start low due to potential for injection site reaction at higher concentrations.",
      route: ["subcutaneous", "topical", "intramuscular"],
    },
    frequency: "Once daily",
    cycleLength: "2–6 weeks (acute infection/wound); longer for chronic conditions",
    halfLife: "~2–3 hours (rapidly degraded by proteases)",
    storageInfo: {
      powder: "Store at -20°C, tightly sealed. Sensitive to moisture and proteolytic degradation.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days (shorter stability than most peptides due to susceptibility to enzymatic degradation).",
      notes: "More sensitive than other peptides. Consider smaller batch reconstitution. Avoid repeated freeze-thaw. Can foam — inject BAC water very slowly.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "Lower concentration for more precise small dose measurement",
          },
        ],
        notes: "At 2.5mg/mL: 300mcg dose = 12 units. Standard protocol dose is clean at this concentration.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "Larger volume — good for topical applications requiring diluted solution",
          },
        ],
        notes: "Same concentration as 5mg vial for consistent math. Consider aliquoting given 14-day stability window.",
      },
    ],
    sideEffects: [
      "Injection site pain, redness, or swelling (more common than other peptides)",
      "Nausea",
      "Systemic inflammatory response at high doses (theoretical)",
      "Potential to stimulate pre-existing cancer cell growth (in vitro data — controversial)",
    ],
    contraindications: [
      "Active malignancy (in vitro data shows both pro- and anti-tumor effects depending on cancer type)",
      "Autoimmune conditions (may upregulate immune responses)",
      "Pregnancy",
    ],
    researchNotes: "Extensive literature on antimicrobial and wound healing properties. Key studies by Hancock, Sørensen, and Zasloff labs. Clinical trials for topical wound healing in progress. Anti-tumor effects demonstrated in colorectal cancer models; pro-tumor effects in lung cancer — context-dependent. Nasal spray studies for respiratory infections ongoing.",
    stackNotes: "Used alongside Thymosin Alpha-1 for immune modulation protocols. Combined with BPC-157 for wound healing with anti-infective coverage. Often used solo for acute infection research.",
    disclaimer: "For research use only. Not approved for human therapeutic use. Complex immunological effects — use with caution.",
  },

  {
    id: "igf-1-lr3",
    name: "IGF-1 LR3",
    aliases: ["Insulin-like Growth Factor-1 Long R3", "Long R3 IGF-1", "IGF1-LR3", "Mecasermin (related)"],
    category: ["Recovery & Repair", "GH Secretagogue"],
    mechanism: "IGF-1 LR3 is a synthetic analog of human Insulin-like Growth Factor-1 with an arginine substitution at position 3 and a 13-amino-acid N-terminal extension. The R3 substitution reduces binding affinity to IGF-binding proteins (IGFBPs) by approximately 1000-fold, dramatically extending the half-life from ~10 minutes (native IGF-1) to ~20–30 hours. It signals through IGF-1R and IR receptors to activate PI3K/Akt and MAPK/ERK pathways, promoting protein synthesis, muscle hypertrophy, cellular proliferation, and inhibiting apoptosis. Stimulates satellite cell activation for muscle repair and promotes nitrogen retention.",
    researchStatus: "Preclinical; research use only. Native IGF-1 (mecasermin) is FDA-approved for growth failure.",
    dosingRanges: {
      low: 20,
      moderate: 50,
      high: 100,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Start at 20–40 mcg post-workout subcutaneously or intramuscularly. Experienced researchers use up to 100 mcg/day. Bilateral muscle injection explored for site-specific effects. Cycle length critical due to receptor desensitization.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "Once daily (post-workout preferred)",
    cycleLength: "4–6 weeks maximum (receptor downregulation occurs beyond this)",
    halfLife: "~20–30 hours",
    storageInfo: {
      powder: "Store at -20°C, dry and dark. Extremely sensitive to heat and agitation.",
      reconstituted: "Refrigerate at 2–8°C. Use within 21–28 days. Do NOT freeze reconstituted solution.",
      notes: "IGF-1 LR3 is particularly sensitive. Reconstitute with acidified water (0.1% acetic acid) or BAC water. Never shake — gently roll/swirl. Keep at stable temperature. Some researchers use small aliquots frozen at -80°C for long-term storage.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 1, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 1mg / 2mL = 0.5 mg/mL | mcgPerUnit = 5 | unitsFor100mcg = 20
        // For 50mcg dose: 10 units at 0.5mg/mL
        vialMg: 1,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 0.5,
        mcgPerUnit: 5,
        unitsFor100mcg: 20,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 50mcg dose = 5 units. More concentrated, smaller injection volume.",
          },
        ],
        notes: "Standard 1mg vial. At 0.5mg/mL: 50mcg dose = 10 units on U-100. Clean and practical for 20–100mcg range.",
      },
    ],
    sideEffects: [
      "Hypoglycemia (most significant risk — have glucose source available)",
      "Jaw/facial bone growth with extended use at high doses",
      "Organ growth (kidneys, heart, spleen) with chronic high-dose use",
      "Injection site hypoglycemia (intramuscular route)",
      "Headache",
      "Edema",
      "Potential for accelerated tumor growth (potent mitogen)",
    ],
    contraindications: [
      "Active malignancy or strong cancer predisposition (potent mitogen)",
      "Diabetics or pre-diabetics (hypoglycemia risk)",
      "Acromegaly",
      "Pregnancy",
      "Pediatric use without severe IGF-1 deficiency diagnosis",
    ],
    researchNotes: "One of the most potent anabolic research peptides. Extensively studied in muscle biology, sports science, and metabolic research. Key distinction from native IGF-1: dramatically reduced IGFBP binding extends duration of action. Receptor desensitization necessitates cycling. IGF-1 dysregulation strongly associated with cancer risk — this is the most significant safety consideration in research protocols.",
    stackNotes: "Often combined with GH secretagogues (CJC-1295 + Ipamorelin) for synergistic anabolic effects. Some protocols use it with GHRP-2 or GHRP-6. Combined with BPC-157 + TB-500 for injury recovery in muscle and connective tissue. Careful attention to hypoglycemia risk when stacking with other metabolically active compounds.",
    disclaimer: "For research use only. High risk of hypoglycemia — never use without glucose source available. Potent mitogen — cancer contraindication is serious. Not for human therapeutic use.",
  },

// ─────────────────────────────────────────────
// BATCH 2: GH SECRETAGOGUES
// ─────────────────────────────────────────────

{
    id: "cjc-1295-no-dac",
    name: "CJC-1295 (No DAC)",
    aliases: ["CJC-1295 without DAC", "Modified GRF 1-29", "Mod GRF 1-29", "CJC1295 No DAC", "Sermorelin analog"],
    category: ["GH Secretagogue"],
    mechanism: "CJC-1295 (No DAC) is a modified version of Growth Hormone Releasing Hormone (GHRH) 1-29 with four amino acid substitutions (A2, A8, A15, A27) to improve metabolic stability and receptor binding affinity. It stimulates the pituitary gland to produce and release Growth Hormone (GH) in a pulsatile, physiological fashion. Without the Drug Affinity Complex (DAC) albumin-binding moiety, it has a short half-life of 30 minutes, mimicking natural GHRH pulses. Best used in combination with a GHRP (like Ipamorelin) to amplify GH release synergistically.",
    researchStatus: "Research use only; GHRH analogs studied in clinical research; pulsatile GH release properties well characterized",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 300,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Standard dose: 100–200 mcg per injection, timed with GHRP co-administration. Most protocols inject before bed (to align with natural GH pulse) and/or upon waking. Avoid within 1–2 hours of eating (somatostatin release from food blunts GH response). Do not exceed 3 injections per day.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "1–3x daily (aligned with natural GH pulse windows)",
    cycleLength: "8–16 weeks; can be run long term with periodic breaks",
    halfLife: "~30 minutes",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable peptide. Swirl gently. Inject BAC water down vial wall slowly.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units. Smaller injection volume per dose.",
          },
        ],
        notes: "At 1mg/mL: 100mcg = 10 units, 200mcg = 20 units on U-100. Clean math.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units. More volume, easier measurement.",
          },
        ],
        notes: "At 2mg/mL: 100mcg = 5 units, 200mcg = 10 units. Very clean math for standard dosing.",
      },
    ],
    sideEffects: [
      "Increased hunger (GH-mediated)",
      "Mild water retention",
      "Numbness or tingling in extremities",
      "Temporary reduction in insulin sensitivity",
      "Fatigue if dosed during day",
      "Injection site irritation",
    ],
    contraindications: [
      "Active malignancy (GH promotes cellular growth)",
      "Diabetics (reduced insulin sensitivity)",
      "Acromegaly or gigantism",
      "Pregnancy",
    ],
    researchNotes: "Well characterized GHRH analog. Four substitutions vs native GHRH 1-29 significantly improve half-life from ~7 minutes to ~30 minutes while maintaining physiological pulsatile GH release. Synergy with GHRPs (Ipamorelin, GHRP-2, GHRP-6) is a key pharmacological finding — combined use produces significantly greater GH release than either alone.",
    stackNotes: "Almost always used with Ipamorelin (the gold standard GHRH+GHRP stack). Available as pre-blended CJC-1295 No DAC + Ipamorelin 10mg vials. Also stacked with GHRP-2 or GHRP-6 for more aggressive GH release. AOD-9604 sometimes added for metabolic/fat loss.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "cjc-1295-dac",
    name: "CJC-1295 (DAC)",
    aliases: ["CJC-1295 with DAC", "CJC-1295 DAC", "CJC1295", "DAC:GRF"],
    category: ["GH Secretagogue"],
    mechanism: "CJC-1295 with DAC (Drug Affinity Complex) incorporates a maleimide-functionalized lysine residue that forms a covalent bond with endogenous albumin after injection, dramatically extending its half-life. Rather than producing pulsatile GH release like Mod GRF 1-29, CJC-1295 DAC creates a sustained 'GH bleed' — continuously elevated GH levels for 1–2 weeks per injection. It acts on GHRH receptors in the anterior pituitary to continuously stimulate GH synthesis and release. IGF-1 levels are also chronically elevated. This non-pulsatile pattern differs fundamentally from physiological GH secretion.",
    researchStatus: "Research use only; studied in Phase I/II clinical trials (ConjuChem); non-physiological GH elevation pattern",
    dosingRanges: {
      low: 500,
      moderate: 1000,
      high: 2000,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Typical research dose: 1000–2000 mcg (1–2 mg) once weekly. Due to long half-life, once-weekly or twice-monthly dosing is sufficient. Some protocols use 500 mcg twice weekly. Lower doses preferred to avoid chronic non-pulsatile GH elevation side effects.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "Once weekly",
    cycleLength: "8–12 weeks",
    halfLife: "6–8 days (albumin-bound)",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable. Reconstitute with BAC water. Due to once-weekly dosing, one vial lasts several weeks after reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 1mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        // 1000mcg dose = 50 units, 2000mcg = 100 units (full syringe)
        vialMg: 2,
        recommendedBacWaterMl: 1,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1000mcg = 100 units (full syringe). Easiest measurement.",
          },
        ],
        notes: "At 2mg/mL: 1000mcg = 50 units on U-100. Weekly dose from 2mg vial = 1–2 injections.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1000mcg = 100 units. Clearest measurement for weekly dosing.",
          },
        ],
        notes: "5mg vial provides 2–5 weekly doses depending on protocol. Refrigerate between uses.",
      },
    ],
    sideEffects: [
      "Water retention and bloating (more pronounced than pulsatile GH analogs)",
      "Increased hunger",
      "Carpal tunnel symptoms with extended use",
      "Numbness and tingling (paresthesia)",
      "Reduced insulin sensitivity",
      "Potential pituitary desensitization with long-term use",
      "Lethargy",
    ],
    contraindications: [
      "Active malignancy",
      "Diabetes or metabolic syndrome",
      "Acromegaly",
      "Pregnancy",
      "Pre-existing pituitary disorders",
    ],
    researchNotes: "ConjuChem studied CJC-1295 DAC in Phase I/II with favorable safety and dramatic GH/IGF-1 elevation. The continuous vs pulsatile debate is important: physiological GH is released in pulses, and chronic non-pulsatile elevation may not replicate the benefits of natural GH secretion and may carry more side effects. Many researchers prefer CJC-1295 No DAC + GHRP for this reason.",
    stackNotes: "Paired with Ipamorelin once weekly for a 'set and forget' GH protocol. Less commonly combined with GHRPs given the long half-life. Some researchers prefer this for convenience. CJC-1295 DAC + Ipamorelin stack available in pre-blended form.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "ipamorelin",
    name: "Ipamorelin",
    aliases: ["Ipamorelin acetate", "NNC 26-0161", "Ipamorelin peptide"],
    category: ["GH Secretagogue"],
    mechanism: "Ipamorelin is a selective Growth Hormone Releasing Peptide (GHRP) and ghrelin receptor agonist that stimulates pituitary GH release with high selectivity. Unlike GHRP-2 and GHRP-6, Ipamorelin does not significantly elevate cortisol, prolactin, or ACTH at standard doses, making it the 'cleanest' GHRP. It mimics ghrelin's action at the GHS-R1a receptor to amplify GH pulse amplitude without disrupting the pulsatile release pattern. Synergizes powerfully with GHRH analogs (CJC-1295 No DAC) to produce GH release several times greater than either compound alone.",
    researchStatus: "Research use only; Phase I/II trials conducted (Novo Nordisk) with favorable safety profile",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 300,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Standard dose: 200 mcg per injection, 1–3x daily. Always administer 30–60 minutes after eating or wait until fasted state for maximum GH release. Combine with CJC-1295 No DAC in same injection for synergy. Before-bed injection is most popular to amplify natural nocturnal GH pulse.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "1–3x daily",
    cycleLength: "8–16 weeks; can be run longer term",
    halfLife: "~2 hours",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Very stable peptide. Standard reconstitution and storage applies.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units. Smaller volume per injection.",
          },
        ],
        notes: "At 1mg/mL: 200mcg = 20 units on U-100. Standard and easy to measure.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL for easier measurement of 200mcg = 20 units.",
          },
        ],
        notes: "At 2mg/mL: 200mcg = 10 units. Very clean measurement for twice-daily dosing.",
      },
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units. For longer shelf use from single vial.",
          },
        ],
        notes: "Maintains 2mg/mL across all large vial sizes for consistent math.",
      },
    ],
    sideEffects: [
      "Increased hunger (mild vs other GHRPs)",
      "Water retention (mild)",
      "Tiredness/drowsiness if dosed during day",
      "Mild injection site reaction",
      "Tingling or numbness (mild)",
    ],
    contraindications: [
      "Active malignancy",
      "Pregnancy",
      "Acromegaly",
      "Insulin-dependent diabetes (monitor glucose)",
    ],
    researchNotes: "Considered the gold standard GHRP due to selectivity for GH release without significant cortisol, prolactin, or ACTH elevation. Novo Nordisk trials showed significant GH elevation with excellent tolerability. The CJC-1295 No DAC + Ipamorelin combination is the most widely studied and used GHRH+GHRP research stack.",
    stackNotes: "The definitive pairing is CJC-1295 No DAC + Ipamorelin — one of the most popular peptide stacks in research. Pre-blended vials widely available. Also stacked with AOD-9604 for body composition, and with BPC-157 + TB-500 for comprehensive recovery protocols.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "sermorelin",
    name: "Sermorelin",
    aliases: ["GHRH 1-29", "GRF 1-29", "Geref", "Sermorelin acetate"],
    category: ["GH Secretagogue"],
    mechanism: "Sermorelin is the synthetic form of the first 29 amino acids of endogenous Growth Hormone Releasing Hormone (GHRH 1-29), which represents the shortest fragment of GHRH with full biological activity. It binds to GHRH receptors in the anterior pituitary to stimulate GH synthesis and pulsatile release. Unlike exogenous hGH, Sermorelin preserves the natural pituitary feedback loop and pulsatile secretion pattern. Regular pulsatile stimulation may also help rejuvenate pituitary somatotroph function over time.",
    researchStatus: "FDA-approved (Geref) for GH deficiency diagnosis and pediatric growth failure (now discontinued commercially); widely used off-label and for research",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 500,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Clinical diagnostic dose: 1 mcg/kg IV. Research protocol: 200–500 mcg subcutaneously before bed. Administer on empty stomach — food raises somatostatin and blunts response. Some protocols dose 2x daily (AM fasted + PM before bed).",
      route: ["subcutaneous", "intramuscular", "intravenous (diagnostic)"],
    },
    frequency: "Once daily (bedtime preferred) or twice daily",
    cycleLength: "12–24 weeks; some protocols run continuously",
    halfLife: "~10–12 minutes (native GHRH), slightly extended with Sermorelin modifications",
    storageInfo: {
      powder: "Store at 2–8°C (refrigerator) or -20°C for longer term. More heat-sensitive than other GHRPs.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14–21 days.",
      notes: "More sensitive than CJC-1295. Shorter reconstituted stability — plan batch sizes accordingly. Swirl gently.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units, 500mcg = 50 units.",
          },
        ],
        notes: "At 2mg/mL: 200mcg = 10 units, 500mcg = 25 units on U-100. Clean for standard dosing.",
      },
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — better for higher dose protocols requiring precise measurement.",
          },
        ],
        notes: "Use within 21 days of reconstitution — plan accordingly with this larger vial.",
      },
    ],
    sideEffects: [
      "Injection site flushing or redness",
      "Headache",
      "Nausea",
      "Dizziness",
      "Water retention (mild)",
      "Increased hunger",
    ],
    contraindications: [
      "Active malignancy",
      "Hypothyroidism (treat first — GH response impaired)",
      "Pregnancy",
      "Hypersensitivity to GHRH or components",
    ],
    researchNotes: "Has the longest clinical history of any GHRH analog with an established FDA-approved use (since withdrawn from commercial market). Multiple studies show GH restoration with long-term use. Sermorelin's physiological mechanism preserves pituitary function rather than bypassing it, making it a preferred option for age-related GH decline research.",
    stackNotes: "Combines well with Ipamorelin for synergistic GH release. Less commonly stacked than CJC-1295 No DAC but mechanistically identical effects. Some researchers prefer Sermorelin for its longer clinical history.",
    disclaimer: "For research use only. Previous FDA approval was for specific diagnostic/therapeutic use — current commercial formulations are research grade only.",
  },

  {
    id: "ghrp-2",
    name: "GHRP-2",
    aliases: ["Growth Hormone Releasing Peptide-2", "Pralmorelin", "KP-102", "GHRP2"],
    category: ["GH Secretagogue"],
    mechanism: "GHRP-2 is a synthetic hexapeptide ghrelin receptor (GHS-R1a) agonist that potently stimulates GH release from the anterior pituitary. It acts synergistically with GHRH analogs, amplifying GH pulse amplitude significantly beyond either compound alone. Compared to Ipamorelin, GHRP-2 produces stronger GH release but also causes modest elevation in cortisol, prolactin, and ACTH — though less than GHRP-6. It also has partial anti-inflammatory effects and promotes appetite.",
    researchStatus: "Research use only; studied in clinical trials for GH deficiency diagnosis and cancer cachexia",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 300,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Dose 100–300 mcg subcutaneously, 1–3x daily. Administer fasted or at least 1.5 hours from a meal. Before bed dosing preferred. Pair with CJC-1295 No DAC for maximum GH release.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "1–3x daily",
    cycleLength: "8–12 weeks",
    halfLife: "~15–60 minutes",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable. Standard reconstitution protocol.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units. Easier measurement.",
          },
        ],
        notes: "At 2mg/mL: 200mcg = 10 units on U-100. Standard and efficient.",
      },
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — larger volume for long-use vials.",
          },
        ],
        notes: "Consistent 2mg/mL across vial sizes.",
      },
    ],
    sideEffects: [
      "Increased hunger (significant — ghrelin-mediated)",
      "Increased cortisol (modest elevation)",
      "Prolactin elevation (modest)",
      "Water retention",
      "Fatigue",
      "Tingling or numbness",
    ],
    contraindications: [
      "Active malignancy",
      "Cortisol-sensitive conditions (Cushing's syndrome)",
      "Pregnancy",
      "Insulin-dependent diabetes",
    ],
    researchNotes: "More potent GH stimulation than Ipamorelin but with collateral cortisol and prolactin elevation. Pralmorelin (branded GHRP-2) studied extensively in Japan for GH deficiency diagnosis. Research shows significant GH pulse amplification when combined with GHRH. Hunger-stimulating effect is pronounced and often unwanted in body composition protocols.",
    stackNotes: "CJC-1295 No DAC + GHRP-2 is a classic high-output GH stack. Pre-blended CJC-1295 + GHRP-2 10mg vials available. For cleaner GH release without cortisol elevation, Ipamorelin is preferred by many researchers.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "ghrp-6",
    name: "GHRP-6",
    aliases: ["Growth Hormone Releasing Peptide-6", "His-DTrp-Ala-Trp-DPhe-Lys-NH2", "GHRP6"],
    category: ["GH Secretagogue"],
    mechanism: "GHRP-6 is the original synthetic hexapeptide GHRP, acting as a potent ghrelin receptor (GHS-R1a) agonist. It produces significant GH release from the pituitary, along with the strongest hunger/appetite stimulation of all GHRPs — a direct result of ghrelin pathway activation. Like GHRP-2, it modestly elevates cortisol and prolactin. It also has gastroprotective effects similar to BPC-157, and promotes GH secretion synergistically with GHRH analogs.",
    researchStatus: "Research use only; among the earliest GHRPs studied; extensive preclinical literature",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 300,
      unit: "mcg",
      perDose: true,
      titrationNotes: "100–300 mcg subcutaneously 1–3x daily. Fasted administration critical — food severely blunts GH response. Most prominent hunger stimulation occurs 30–60 minutes post-injection. Useful in cachexia/appetite stimulation research contexts.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "1–3x daily",
    cycleLength: "8–12 weeks",
    halfLife: "~15–60 minutes",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units.",
          },
        ],
        notes: "At 1mg/mL: 200mcg = 20 units. Good for precise measurement across 100–300mcg range.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units.",
          },
        ],
        notes: "Standard 5mg vial at 2mg/mL. 200mcg = 10 units, 300mcg = 15 units.",
      },
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — for longer-use vial with consistent daily dosing.",
          },
        ],
        notes: "Consistent concentration across vial sizes.",
      },
    ],
    sideEffects: [
      "Intense hunger (strongest of all GHRPs — significant)",
      "Cortisol elevation",
      "Prolactin elevation",
      "Water retention",
      "Hypoglycemia risk if not eating after hunger stimulation",
      "Fatigue",
    ],
    contraindications: [
      "Active malignancy",
      "Eating disorders (powerful appetite stimulation)",
      "Cortisol-sensitive conditions",
      "Pregnancy",
    ],
    researchNotes: "First-generation GHRP with the most extensive research history. Hunger stimulation is its most pronounced characteristic — exploited in cachexia and anorexia research. GH-releasing potency is high but comparable to GHRP-2; the hunger/cortisol side effect profile makes Ipamorelin preferred for body composition research.",
    stackNotes: "Paired with CJC-1295 No DAC for GH stack. Sometimes used intentionally in appetite-stimulation protocols. Less popular than Ipamorelin for body composition due to hunger side effects.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "tesamorelin",
    name: "Tesamorelin",
    aliases: ["Egrifta", "TH9507", "Tesamorelin acetate", "GHRH analog (stabilized)"],
    category: ["GH Secretagogue", "GLP-1 / Metabolic"],
    mechanism: "Tesamorelin is a synthetic analog of human GHRH (Growth Hormone Releasing Hormone) with a trans-3-hexenoic acid modification at the N-terminus, which protects against rapid dipeptidyl peptidase IV (DPP-IV) degradation and extends the half-life significantly compared to native GHRH. It binds pituitary GHRH receptors to stimulate pulsatile GH release in a physiological pattern. FDA-approved specifically for HIV-associated lipodystrophy (visceral fat reduction) due to potent visceral adipose tissue reduction via GH-mediated lipolysis. IGF-1 levels normalize with treatment.",
    researchStatus: "FDA-approved (Egrifta) for HIV-associated lipodystrophy; research use for other metabolic applications",
    dosingRanges: {
      low: 1,
      moderate: 2,
      high: 2,
      unit: "mg",
      perDose: true,
      titrationNotes: "FDA-approved dose: 2 mg subcutaneously once daily. Research protocols typically mirror this. Administer on empty stomach. Consistent daily timing preferred. Abdomen injection site recommended per clinical protocol.",
      route: ["subcutaneous"],
    },
    frequency: "Once daily",
    cycleLength: "26–52 weeks (clinical trials); research protocols 12–26 weeks",
    halfLife: "~26–38 minutes",
    storageInfo: {
      powder: "Store at 2–8°C (refrigerator). Do NOT freeze lyophilized form.",
      reconstituted: "Refrigerate at 2–8°C. Use within 24–48 hours of reconstitution per clinical guidelines (though research protocols extend to 14 days with BAC water).",
      notes: "Unlike most peptides, Tesamorelin lyophilized should be refrigerated — not frozen. Clinical product uses sterile water; research vials use BAC water allowing longer reconstituted stability.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        // 2mg dose = 100 units (full syringe) at 2mg/mL — consider lower concentration
        vialMg: 5,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 2.5,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 2mg dose = 100 units (full 1mL syringe). Possible but tight.",
          },
        ],
        notes: "At 1mg/mL: 2mg daily dose = 20 units on U-100. Clean and practical.",
      },
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 2mg dose = 100 units. Smaller volume but tight measurement.",
          },
        ],
        notes: "At 1mg/mL: 2mg dose = 20 units. 10mg vial provides 5 daily doses.",
      },
      {
        // 20mg / 10mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 20,
        recommendedBacWaterMl: 20,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 2mg dose = 100 units. Consider multiple syringes.",
          },
        ],
        notes: "Large vial — 10 daily doses at 2mg/day. Consider aliquoting for 14-day stability window.",
      },
    ],
    sideEffects: [
      "Injection site reactions (erythema, pain, induration) — most common",
      "Peripheral edema",
      "Arthralgia (joint pain)",
      "Myalgia",
      "Carpal tunnel syndrome",
      "Glucose intolerance",
      "Headache",
    ],
    contraindications: [
      "Active malignancy (stimulates IGF-1)",
      "Pituitary tumor, hypopituitarism",
      "Pregnancy",
      "Disruption of hypothalamic-pituitary axis (trauma, surgery, radiation)",
    ],
    researchNotes: "The only FDA-approved GHRH analog with robust Phase III clinical data (TESICO trial). Demonstrated 15–20% reduction in visceral adipose tissue in HIV patients vs placebo. IGF-1 normalization confirms GH axis engagement. Now being studied for general visceral obesity and non-HIV metabolic syndrome.",
    stackNotes: "Sometimes combined with Ipamorelin for additional GH pulse amplification. Used in body composition protocols for visceral fat reduction alongside AOD-9604.",
    disclaimer: "For research use only outside of FDA-approved HIV lipodystrophy indication. Egrifta is an FDA-approved drug.",
  },

// ─────────────────────────────────────────────
// BATCH 3: GLP-1/METABOLIC, COGNITIVE, LONGEVITY, SLEEP
// ─────────────────────────────────────────────

{
    id: "semaglutide",
    name: "Semaglutide",
    aliases: ["Ozempic", "Wegovy", "Rybelsus", "GLP-1 RA", "Semaglutide acetate"],
    category: ["GLP-1 / Metabolic"],
    mechanism: "Semaglutide is a glucagon-like peptide-1 receptor agonist (GLP-1 RA) with 94% amino acid sequence homology to native GLP-1, modified with a C18 fatty diacid chain via a linker to albumin, extending its half-life to approximately 7 days. It activates GLP-1 receptors in the pancreas to stimulate glucose-dependent insulin secretion and suppress glucagon, reducing blood glucose. Central GLP-1 receptor activation in the hypothalamus and brainstem suppresses appetite and reduces food intake profoundly. Also delays gastric emptying, reduces hepatic fat, and has demonstrated cardiovascular and renal protective effects.",
    researchStatus: "FDA-approved (Ozempic for T2DM, Wegovy for obesity, Rybelsus oral for T2DM); research vials are RUO compounded form",
    dosingRanges: {
      low: 0.25,
      moderate: 1.0,
      high: 2.4,
      unit: "mg",
      perDose: true,
      titrationNotes: "Standard titration: 0.25mg/week x 4 weeks → 0.5mg/week x 4 weeks → 1.0mg/week. For weight loss (Wegovy), titrate monthly: 0.25 → 0.5 → 1.0 → 1.7 → 2.4 mg/week. Slow titration minimizes GI side effects. Administer once weekly on same day.",
      route: ["subcutaneous"],
    },
    frequency: "Once weekly",
    cycleLength: "Ongoing (chronic condition management); research: 12–52 weeks",
    halfLife: "~7 days",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Research vials: use within 28–30 days. Do not freeze reconstituted solution.",
      notes: "Commercial pens stored at 2–8°C unopened; 56 days after first use at room temperature. Research lyophilized vials require BAC water reconstitution. Weekly dosing means each vial lasts several weeks.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 30,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: false },
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 15, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        // 0.25mg dose = 10 units | 0.5mg = 20 units | 1mg = 40 units
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 0.25mg = 25 units, 0.5mg = 50 units, 1mg = 100 units (full syringe).",
          },
        ],
        notes: "At 2.5mg/mL: 0.5mg = 20 units, 1mg = 40 units on U-100. Clean weekly dosing math.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1mg weekly dose = 100 units (full syringe). Easiest measurement.",
          },
        ],
        notes: "10mg vial at 2.5mg/mL provides 4–40 weekly doses depending on dose level.",
      },
      {
        // 15mg / 6mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 15,
        recommendedBacWaterMl: 6,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 15,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — consistent measurement across all dose levels.",
          },
        ],
        notes: "Consistent 2.5mg/mL. 15mg provides significant supply for weekly dosing at maintenance.",
      },
      {
        // 20mg / 8mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 20,
        recommendedBacWaterMl: 8,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 20,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL for clearest measurement at all dose levels.",
          },
        ],
        notes: "Large vial for extended supply. At max Wegovy dose (2.4mg/week), provides ~8 weeks.",
      },
    ],
    sideEffects: [
      "Nausea (very common, especially during titration)",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Abdominal pain",
      "Decreased appetite",
      "Fatigue",
      "Injection site reactions",
      "Rare: pancreatitis, gallbladder disease, hypoglycemia (with insulin), thyroid C-cell tumors (rodent data)",
    ],
    contraindications: [
      "Personal/family history of MTC (medullary thyroid carcinoma)",
      "MEN 2 syndrome",
      "Pregnancy or breastfeeding",
      "Diabetic retinopathy (risk of worsening with rapid glucose improvement)",
      "Pancreatitis history",
      "Severe renal impairment (caution)",
    ],
    researchNotes: "SUSTAIN and STEP trial programs established Semaglutide as the most effective GLP-1 RA for both glucose control and weight loss. STEP 1 showed 15% mean body weight reduction. SELECT trial demonstrated 20% reduction in MACE in non-diabetic obese patients. FLOW trial showed significant renal protection in T2DM. Now the benchmark GLP-1 RA against which others are compared.",
    stackNotes: "Cagrilintide + Semaglutide (CagriSema) combination is the leading next-generation obesity stack in clinical trials showing >20% weight loss. Some research protocols combine with AOD-9604 or tesamorelin for body composition. Not typically combined with other GLP-1 RAs.",
    disclaimer: "For research use only in lyophilized/compounded form. Commercial products (Ozempic/Wegovy) are FDA-approved medications requiring prescription.",
  },

  {
    id: "tirzepatide",
    name: "Tirzepatide",
    aliases: ["Mounjaro", "Zepbound", "LY3298176", "GIP/GLP-1 dual agonist", "Twincretin"],
    category: ["GLP-1 / Metabolic"],
    mechanism: "Tirzepatide is a novel dual agonist targeting both GLP-1 (glucagon-like peptide-1) and GIP (glucose-dependent insulinotropic polypeptide) receptors. It is a single synthetic peptide that activates both incretin receptors simultaneously, which appear to act synergistically for greater metabolic benefit than GLP-1 agonism alone. GIP receptor activation may improve the tolerability of GLP-1 effects and contribute additional fat oxidation through adipocyte GIP receptor signaling. Produces greater weight loss than any approved GLP-1 RA in head-to-head trials.",
    researchStatus: "FDA-approved (Mounjaro for T2DM 2022, Zepbound for obesity 2023); research vials are RUO compounded form",
    dosingRanges: {
      low: 2.5,
      moderate: 10,
      high: 15,
      unit: "mg",
      perDose: true,
      titrationNotes: "FDA titration: 2.5mg/week x 4 weeks → 5mg/week x 4 weeks → escalate by 2.5mg increments every 4 weeks to target dose (max 15mg/week). Slow titration is critical for GI tolerability. Inject subcutaneously once weekly on same day.",
      route: ["subcutaneous"],
    },
    frequency: "Once weekly",
    cycleLength: "Ongoing (chronic); research: 16–72 weeks",
    halfLife: "~5 days",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days. Do not freeze reconstituted solution.",
      notes: "Research vials use BAC water for reconstitution. Weekly dosing — plan reconstitution volume to match usage within stability window.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 15, unit: "mg", isCommon: true },
      { mg: 30, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        // 2.5mg dose = 10 units | 5mg = 20 units
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 2.5mg = 25 units, 5mg = 50 units. Better for low starting dose precision.",
          },
        ],
        notes: "At 2.5mg/mL: 2.5mg = 10 units, 5mg = 20 units. Perfect for titration starting doses.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 10mg dose = 100 units (full 1mL syringe).",
          },
        ],
        notes: "10mg vial at 2.5mg/mL = 2 doses at 5mg or 1 dose at 10mg.",
      },
      {
        // 15mg / 6mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 15,
        recommendedBacWaterMl: 6,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 15,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 15mg max dose = 150 units. Requires 1.5mL — use 2 syringes or 2mL syringe.",
          },
        ],
        notes: "At 2.5mg/mL: max 15mg dose = 60 units. One injection from 1mL syringe — clean.",
      },
      {
        // 30mg / 12mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 30,
        recommendedBacWaterMl: 12,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 30,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — various dose levels all measurable cleanly.",
          },
        ],
        notes: "30mg vial provides 2 doses at 15mg max dose. Large supply vial.",
      },
    ],
    sideEffects: [
      "Nausea (most common — less severe than semaglutide in some patients)",
      "Diarrhea",
      "Vomiting",
      "Constipation",
      "Abdominal pain",
      "Decreased appetite",
      "Injection site reactions",
      "Rare: pancreatitis, gallbladder disease, thyroid C-cell tumors (rodent)",
    ],
    contraindications: [
      "Personal/family history of MTC or MEN 2",
      "Pregnancy or breastfeeding",
      "Pancreatitis history",
      "Severe GI disease",
    ],
    researchNotes: "SURMOUNT trial program established Tirzepatide as the most effective approved weight-loss drug, with SURMOUNT-1 showing 20.9% mean body weight reduction at 72 weeks (15mg). SURPASS trials confirmed glycemic superiority over semaglutide 1mg in T2DM. SUMMIT trial ongoing for heart failure with preserved ejection fraction. Sets the new benchmark for metabolic peptide therapy.",
    stackNotes: "Not typically combined with other GLP-1 RAs. Some research protocols add AOD-9604 or peptide stacks for body composition optimization. Emerging research on combination with amylin analogs (cagrilintide).",
    disclaimer: "For research use only in lyophilized/compounded form. Mounjaro and Zepbound are FDA-approved medications.",
  },

  {
    id: "retatrutide",
    name: "Retatrutide",
    aliases: ["LY3437943", "Triple G agonist", "GLP-1/GIP/Glucagon triple agonist", "Retatrutide acetate"],
    category: ["GLP-1 / Metabolic"],
    mechanism: "Retatrutide is a first-in-class triple agonist simultaneously activating GLP-1, GIP, and glucagon receptors. The addition of glucagon receptor agonism to the GLP-1/GIP dual mechanism increases energy expenditure (via thermogenesis and hepatic glucose output), enhances lipolysis, and adds liver-specific metabolic benefits including reduction of hepatic steatosis. This triple mechanism produces the greatest weight loss of any molecule yet studied in clinical trials, with Phase II data showing unprecedented 24% body weight reduction at 48 weeks.",
    researchStatus: "Phase III clinical trials ongoing (Eli Lilly); not yet FDA-approved; research use only",
    dosingRanges: {
      low: 1,
      moderate: 8,
      high: 12,
      unit: "mg",
      perDose: true,
      titrationNotes: "Phase II protocol: 1mg/week x 4 weeks → 2mg/week x 4 weeks → 4mg/week → 8mg/week → 12mg/week. Extremely gradual titration required due to potent GI effects. Research protocols mirror clinical titration.",
      route: ["subcutaneous"],
    },
    frequency: "Once weekly",
    cycleLength: "48–72 weeks (clinical trial durations); research: 24–48 weeks",
    halfLife: "~6 days (estimated from Phase I data)",
    storageInfo: {
      powder: "Store at -20°C, dry and dark.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Weekly dosing — plan BAC water volume to match expected usage within stability window.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
      { mg: 30, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1mg = 10 units, 2mg = 20 units. Best for low titration doses.",
          },
        ],
        notes: "At 2.5mg/mL: 1mg = 4 units, 2mg = 8 units, 4mg = 16 units. Precise for titration.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 8mg = 80 units, 12mg = 120 units (split injection needed at 12mg).",
          },
        ],
        notes: "At 2.5mg/mL: 8mg = 32 units, 12mg = 48 units on U-100. Very manageable.",
      },
      {
        // 20mg / 8mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 20,
        recommendedBacWaterMl: 8,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 20,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — all dose levels cleanly measurable.",
          },
        ],
        notes: "Large supply vial. At 2.5mg/mL: 20mg provides ~2 doses at max 12mg dose.",
      },
      {
        // 30mg / 12mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 30,
        recommendedBacWaterMl: 12,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 30,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL for maximum measurement flexibility across all dose levels.",
          },
        ],
        notes: "Largest common vial size. Provides ~2–3 weekly doses at maintenance level.",
      },
    ],
    sideEffects: [
      "Nausea (dose-dependent, most common)",
      "Vomiting",
      "Diarrhea",
      "Decreased appetite",
      "Constipation",
      "Injection site reactions",
      "Tachycardia (glucagon-mediated at higher doses)",
      "Rare: pancreatitis, gallbladder disease",
    ],
    contraindications: [
      "MTC or MEN 2 history",
      "Pregnancy",
      "Pancreatitis history",
      "Cardiac arrhythmias (glucagon component)",
    ],
    researchNotes: "TRIUMPH Phase II (48-week) data showed 17.5–24.2% body weight reduction across dose groups vs 2.1% placebo — the highest ever seen in a weight loss drug trial. Phase III TRIUMPH-3 and related trials now underway. Unique differentiation from tirzepatide is glucagon receptor agonism adding thermogenic and liver-specific metabolic effects.",
    stackNotes: "Typically used as standalone due to potent GLP-1/GIP/glucagon activity. Research protocols do not typically add other metabolic peptides given potency.",
    disclaimer: "For research use only. Not FDA-approved. Phase III trials ongoing. Compounded form not equivalent to clinical investigational product.",
  },

  {
    id: "selank",
    name: "Selank",
    aliases: ["TP-7", "Selanc", "Selank peptide", "Tuftsin analog"],
    category: ["Cognitive / Nootropic", "Sleep", "Immune"],
    mechanism: "Selank is a synthetic analog of the endogenous immunomodulatory peptide Tuftsin (Thr-Lys-Pro-Arg), extended with a Gly-Pro sequence to enhance stability. It modulates GABAergic, serotonergic, and dopaminergic neurotransmission, producing anxiolytic effects without sedation or dependence. Selank increases brain BDNF (brain-derived neurotrophic factor), enhancing neuroplasticity and memory consolidation. It also demonstrates immunomodulatory effects, upregulating IL-2 and interferon production. Approved as an anxiolytic drug in Russia.",
    researchStatus: "Approved medication in Russia (anxiolytic); research use only outside Russia/CIS",
    dosingRanges: {
      low: 250,
      moderate: 500,
      high: 1000,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Typical research dose: 250–500 mcg intranasally or subcutaneously, 1–2x daily. Intranasal is the most common route (3 drops per nostril of reconstituted solution). Subcutaneous injection also used. Effects noted within 20–30 minutes of administration.",
      route: ["intranasal", "subcutaneous"],
    },
    frequency: "1–2x daily",
    cycleLength: "10–14 days (Russia clinical protocol); research: 4–8 weeks with breaks",
    halfLife: "~2 minutes (rapidly degraded; active metabolites extend effect duration)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days.",
      notes: "For intranasal use, dilute to appropriate concentration (0.15mg/mL is the standard clinical Russian formulation). Very short peptide — relatively stable but best stored cold.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 33,
            concentrationMgPerMl: 0.15,
            mcgPerUnit: 1.5,
            notes: "0.15mg/mL — matches Russian clinical intranasal formulation. 1 drop (~50mcL) ≈ 7.5mcg. 3 drops/nostril = ~45mcg per nostril.",
          },
        ],
        notes: "For SubQ: 2.5mg/mL gives 500mcg = 20 units. For intranasal: use alternative dilution to match clinical formulation.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 500mcg = 50 units on U-100. Easier for higher dose research.",
          },
        ],
        notes: "Consistent concentration for SubQ use.",
      },
    ],
    sideEffects: [
      "Generally very well tolerated",
      "Mild sedation (rare at standard doses)",
      "Appetite stimulation (mild)",
      "Nasal irritation (intranasal route)",
      "Euphoria (transient)",
    ],
    contraindications: [
      "Pregnancy (insufficient data)",
      "Known hypersensitivity to tuftsin-related peptides",
    ],
    researchNotes: "Approved and widely used in Russia for generalized anxiety disorder. Human clinical data from Russian trials show significant anxiolytic efficacy, improved cognitive function, and anti-stress effects. BDNF upregulation distinguishes it from classical anxiolytics (no receptor downregulation). No dependence or withdrawal observed in trials. Well-tolerated.",
    stackNotes: "Often combined with Semax for comprehensive cognitive enhancement (Semax for focus/energy, Selank for anxiety/mood). Sometimes combined with DSIP for anxiety with sleep optimization protocols.",
    disclaimer: "For research use only outside Russia/CIS. Approved anxiolytic medication in Russia.",
  },

  {
    id: "semax",
    name: "Semax",
    aliases: ["ACTH 4-7 Pro-Gly-Pro", "Semaxx", "N-acetyl Semax", "NA-Semax", "N-Acetyl Semax Amidate"],
    category: ["Cognitive / Nootropic"],
    mechanism: "Semax is a synthetic heptapeptide analog of the ACTH 4-10 fragment, modified with a Pro-Gly-Pro extension to prevent degradation and enhance CNS penetration. It potently upregulates BDNF (brain-derived neurotrophic factor) and NGF (nerve growth factor), promoting neuronal growth and synaptic plasticity. It enhances dopaminergic and serotonergic neurotransmission, improving focus, memory consolidation, and stress tolerance. Semax also modulates the HPA axis without the hormonal side effects of full ACTH. Additional neuroprotective effects documented in stroke and brain injury models.",
    researchStatus: "Approved as a nootropic/neuroprotective drug in Russia and Ukraine; research use only elsewhere",
    dosingRanges: {
      low: 200,
      moderate: 500,
      high: 1000,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Intranasal: 1–2 drops per nostril (25–50 mcg per drop depending on concentration), 2–3x daily. SubQ: 500–1000 mcg once daily. Effects are rapid onset via intranasal route (15–30 min). Cycling recommended: 10–14 days on, 7 days off.",
      route: ["intranasal", "subcutaneous"],
    },
    frequency: "1–3x daily (intranasal); once daily (SubQ)",
    cycleLength: "10–14 days on / 7 days off",
    halfLife: "~minutes (rapidly degraded; metabolites contribute to prolonged effect)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days.",
      notes: "N-Acetyl Semax Amidate (NASSA) is more stable and potent than standard Semax. For intranasal: dilute to 0.1–0.5 mg/mL. Sensitive to light.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 0.5,
            mcgPerUnit: 5,
            notes: "0.5mg/mL — good intranasal concentration. 1 drop ≈ 25mcg.",
          },
        ],
        notes: "For SubQ: 500mcg = 20 units at 2.5mg/mL. For intranasal: use 0.5mg/mL dilution.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 20,
            concentrationMgPerMl: 0.5,
            mcgPerUnit: 5,
            notes: "0.5mg/mL — intranasal formulation for 10mg vial.",
          },
        ],
        notes: "Standard concentration maintained across vial sizes.",
      },
    ],
    sideEffects: [
      "Mild stimulation/restlessness at high doses",
      "Nasal irritation (intranasal route)",
      "Headache (rare)",
      "Mild anxiety (rare, paradoxical)",
      "Appetite suppression",
    ],
    contraindications: [
      "Anxiety disorders (can exacerbate in sensitive individuals)",
      "Seizure disorder (ACTH pathway)",
      "Pregnancy",
      "Acute psychosis",
    ],
    researchNotes: "Approved in Russia for stroke treatment, brain injury recovery, and cognitive enhancement. Documented BDNF/NGF upregulation is the primary mechanism distinguishing it from stimulants. N-Acetyl Semax Amidate (NASSA) is considered 2–3x more potent and longer-acting than standard Semax. Russian and Ukrainian clinical literature is extensive.",
    stackNotes: "Classic stack: Semax (focus/energy/BDNF) + Selank (anxiety reduction/mood). Sometimes combined with Epitalon for neuroprotection and longevity. P21 (another BDNF mimetic) sometimes stacked for enhanced neuroplasticity.",
    disclaimer: "For research use only outside Russia/Ukraine. Approved drug in those jurisdictions.",
  },

  {
    id: "epitalon",
    name: "Epitalon",
    aliases: ["Epithalamin", "Epithalon", "Ala-Glu-Asp-Gly", "Tetrapeptide", "Epitalon tetrapeptide"],
    category: ["Longevity / Epigenetic"],
    mechanism: "Epitalon is a synthetic tetrapeptide (Ala-Glu-Asp-Gly) derived from Epithalamin, an extract of the pineal gland. Its primary mechanism involves activation of telomerase, the enzyme that maintains telomere length, thereby potentially slowing cellular senescence. It also stimulates melatonin production in the pineal gland, normalizing circadian rhythms, and has been shown to restore and regulate key hormones including cortisol, melatonin, and gonadotropins in aged subjects. Epigenetic effects include reactivation of silenced genes related to longevity pathways.",
    researchStatus: "Preclinical (extensive); human trials by Khavinson et al. (Russia); research use only outside Russia",
    dosingRanges: {
      low: 5,
      moderate: 10,
      high: 20,
      unit: "mg",
      perDose: true,
      titrationNotes: "Russian clinical protocol: 10 mg daily (IV or IM) for 10 days, 2x per year. Research community protocols: 5–10 mg subcutaneously daily for 10–20 day cycles, 2–4x per year. Some protocols use 100 mcg/kg. Longer cycles (20 days) may produce stronger telomerase activation.",
      route: ["subcutaneous", "intramuscular", "intravenous"],
    },
    frequency: "Once daily (during cycle)",
    cycleLength: "10–20 days, 2–4 cycles per year",
    halfLife: "~1–2 hours (estimated)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable tetrapeptide. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // 10mg dose = 200 units — need 2mL syringe or split into 2 SubQ injections
        vialMg: 10,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 10mg dose = 40 units. Two 20-unit injections per day possible.",
          },
        ],
        notes: "At 5mg/mL: 5mg dose = 100 units (1 full syringe), 10mg = 2 full syringes. Split into 2 subcutaneous injections for 10mg daily dose.",
      },
      {
        // 20mg / 4mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 20,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 8,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 10mg dose = 40 units per injection. More manageable.",
          },
        ],
        notes: "20mg vial provides a full 2-day supply at 10mg/day or full 20-day cycle at 1mg/day reduced dosing.",
      },
    ],
    sideEffects: [
      "Generally very well tolerated in Russian human trials",
      "Mild injection site reactions",
      "Temporary fatigue in early cycle",
      "Melatonin normalization effects (altered sleep patterns initially)",
    ],
    contraindications: [
      "Active malignancy (telomerase activation theoretical concern)",
      "Pregnancy",
      "Autoimmune conditions (immune modulation effects)",
    ],
    researchNotes: "Professor Vladimir Khavinson's 40+ years of research at the St. Petersburg Institute of Bioregulation and Gerontology are the foundation of Epitalon science. Clinical studies in aged human subjects showed telomere lengthening, melatonin normalization, restoration of reproductive hormones, and improved lifespan markers. Animal studies show 25% lifespan extension. Human data is limited to Russian literature — no Western RCTs.",
    stackNotes: "Combined with GHK-Cu for comprehensive longevity/anti-aging protocols. Some researchers add Thymosin Alpha-1 for immune rejuvenation. Often combined with Pinealon (another Khavinson peptide) for CNS longevity effects.",
    disclaimer: "For research use only. Not approved outside Russia for therapeutic use.",
  },

  {
    id: "dsip",
    name: "DSIP",
    aliases: ["Delta Sleep Inducing Peptide", "DSIP peptide", "Deltaran"],
    category: ["Sleep", "Longevity / Epigenetic"],
    mechanism: "DSIP (Delta Sleep Inducing Peptide) is a naturally occurring nonapeptide first isolated from rabbit brain tissue that induces delta (slow-wave) sleep when administered centrally. It modulates multiple neurotransmitter systems including GABAergic, serotonergic, and opioid pathways to promote sleep architecture. Beyond sleep, DSIP demonstrates stress-protective (anti-stress), antioxidant, and neuroendocrine-regulating effects. It normalizes glucocorticoid secretion, reduces ACTH levels under stress, and has shown anti-tumor and longevity-promoting effects in animal models.",
    researchStatus: "Preclinical; limited human data; research use only. Used clinically in Russia (Deltaran) for opiate withdrawal.",
    dosingRanges: {
      low: 100,
      moderate: 300,
      high: 500,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Administer 100–500 mcg subcutaneously 30–60 minutes before sleep. Some protocols use once nightly for 5–7 night cycles with breaks. Higher doses may be needed for deeper effect but start low.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "Once nightly (during cycle)",
    cycleLength: "5–7 days, repeated monthly",
    halfLife: "~30 minutes to 2 hours",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Standard reconstitution. Administer dose shortly before bed.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 300mcg = 30 units. Better for lower dose precision.",
          },
        ],
        notes: "At 2.5mg/mL: 300mcg = 12 units, 500mcg = 20 units on U-100.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL for precise nightly dose measurement.",
          },
        ],
        notes: "10mg vial provides multiple weekly cycle supplies at standard doses.",
      },
    ],
    sideEffects: [
      "Generally well tolerated",
      "Drowsiness (intended effect)",
      "Morning grogginess at higher doses",
      "Vivid dreams",
      "Mild nausea (rare)",
    ],
    contraindications: [
      "Pregnancy (insufficient data)",
      "Operating machinery within 8 hours of dosing",
      "Hypersensitivity to nonapeptides",
    ],
    researchNotes: "Discovered by Monnier et al. (1977) in Switzerland. Extensive Soviet/Russian research followed, including longevity studies showing increased lifespan in aged rats. Used clinically in Russia for opiate withdrawal syndrome (Deltaran). Human sleep induction studies show inconsistent results — activity may require intact hypothalamic-pituitary axis function. Anti-tumor effects observed in animal cancer models.",
    stackNotes: "Combined with Selank for comprehensive sleep + anxiety protocols. Sometimes stacked with Epitalon and GHK-Cu for longevity-focused protocols. DSIP handles sleep architecture while Epitalon provides longevity effects.",
    disclaimer: "For research use only outside Russia. Not approved for therapeutic use in most jurisdictions.",
  },

// ─────────────────────────────────────────────
// BATCH 4: MITOCHONDRIAL, SEXUAL HEALTH, IMMUNE
// ─────────────────────────────────────────────

{
    id: "mots-c",
    name: "MOTS-c",
    aliases: ["Mitochondrial Open Reading Frame of the 12S rRNA-c", "MOTS-c peptide", "Mitochondrial peptide"],
    category: ["Mitochondrial", "GLP-1 / Metabolic", "Longevity / Epigenetic"],
    mechanism: "MOTS-c is a mitochondria-derived peptide encoded within the 12S rRNA gene of the mitochondrial genome, making it unique among peptides as a mitochondrially encoded signaling molecule. It translocates to the nucleus in response to metabolic stress and activates the AMPK pathway, enhancing glucose uptake and fatty acid oxidation while suppressing insulin resistance. MOTS-c also activates the FOXO pathway and promotes cellular stress resistance. Exercise upregulates circulating MOTS-c, linking mitochondrial signaling to the benefits of physical activity. Declining levels with age are associated with metabolic dysfunction and reduced stress resilience.",
    researchStatus: "Preclinical (emerging); some human observational data; research use only",
    dosingRanges: {
      low: 5,
      moderate: 10,
      high: 20,
      unit: "mg",
      perDose: true,
      titrationNotes: "Research protocols: 5–10 mg subcutaneously 3x per week to once daily. Some protocols dose daily for 4 weeks, then 3x/week maintenance. Dose immediately before exercise for potential synergy with exercise-induced MOTS-c release.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "3x per week to once daily",
    cycleLength: "4–8 weeks",
    halfLife: "~1–2 hours (estimated from animal data)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Relatively stable peptide. Standard reconstitution protocol.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
      { mg: 40, unit: "mg", isCommon: false },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 1mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // 5mg dose = 100 units (full 1mL syringe)
        vialMg: 5,
        recommendedBacWaterMl: 1,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 5mg dose = 20 units. More manageable single injection.",
          },
        ],
        notes: "At 5mg/mL: 5mg dose = 100 units (full syringe). At 2.5mg/mL: 5mg = 20 units. Recommended alternative is cleaner for single-injection dosing.",
      },
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 10,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 10mg dose = 40 units. Manageable single injection.",
          },
        ],
        notes: "At 5mg/mL: 10mg = 200 units — split into 2 injections. Use 2.5mg/mL for single-injection dosing.",
      },
      {
        // 20mg / 4mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 20,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 8,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 10mg dose = 40 units, 20mg = 80 units.",
          },
        ],
        notes: "Large vial for extended supply. Consistent concentration maintained.",
      },
      {
        // 40mg / 8mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 40,
        recommendedBacWaterMl: 8,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 16,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — full dose range cleanly measurable.",
          },
        ],
        notes: "Largest vial size. Consider aliquoting given usage rate.",
      },
    ],
    sideEffects: [
      "Generally well tolerated in animal studies",
      "Mild injection site reaction",
      "Hypoglycemia potential (AMPK activation enhances glucose uptake)",
      "Fatigue (transient, exercise-mimetic effect)",
    ],
    contraindications: [
      "Hypoglycemia-prone individuals",
      "Pregnancy (insufficient data)",
      "Insulin-dependent diabetics (monitor glucose closely)",
    ],
    researchNotes: "Discovered by Changhan Lee at USC in 2015. Groundbreaking research establishing mitochondrial genome as a source of signaling peptides. Animal studies show dramatic improvement in insulin sensitivity, fat metabolism, and physical performance. Exercise correlation is a key finding — MOTS-c may mediate some exercise benefits systemically. Human trials needed.",
    stackNotes: "Often combined with SS-31 for comprehensive mitochondrial optimization ('mito stack'). Humanin is sometimes added. Combined with NAD+ and 5-Amino-1MQ for metabolic longevity protocols.",
    disclaimer: "For research use only. Very early stage research. Human safety profile not fully established.",
  },

  {
    id: "ss-31",
    name: "SS-31",
    aliases: ["Elamipretide", "MTP-131", "Bendavia", "D-Arg-dmt-Lys-Phe-NH2", "Szeto-Schiller peptide 31"],
    category: ["Mitochondrial", "Cardiovascular", "Longevity / Epigenetic"],
    mechanism: "SS-31 (Elamipretide) is a mitochondria-targeted tetrapeptide that selectively concentrates in the inner mitochondrial membrane (IMM) through electrostatic interaction with cardiolipin, a phospholipid essential for mitochondrial function and cristae structure. By binding and stabilizing cardiolipin, SS-31 preserves the mitochondrial cristae architecture, protects electron transport chain (ETC) Complex I and Complex III activity, reduces electron leak and reactive oxygen species (ROS) production, and restores ATP synthesis efficiency. Clinical trials have demonstrated benefit in heart failure with reduced ejection fraction, ischemia-reperfusion injury, and age-related mitochondrial dysfunction.",
    researchStatus: "Phase II/III clinical trials for heart failure (RESTORE, MMPOWER-3); research use only for non-cardiac applications",
    dosingRanges: {
      low: 4,
      moderate: 8,
      high: 20,
      unit: "mg",
      perDose: true,
      titrationNotes: "Clinical trials use 4–40 mg/day via subcutaneous infusion or injection. Research community protocols: 5–10 mg subcutaneously once daily. Some advanced protocols use 20 mg/day. Consistent daily dosing preferred for mitochondrial membrane stabilization.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "Once daily",
    cycleLength: "4–12 weeks",
    halfLife: "~1–2 hours",
    storageInfo: {
      powder: "Store at -20°C, dark, dry. Especially sensitive to light.",
      reconstituted: "Refrigerate at 2–8°C, protected from light. Use within 21 days.",
      notes: "Light-sensitive. Store reconstituted vial in opaque container or wrap in foil. Inject slowly. Avoid air bubbles.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 30, unit: "mg", isCommon: true },
      { mg: 50, unit: "mg", isCommon: false },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // 10mg dose = 200 units — split into 2 injections
        vialMg: 10,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 10mg dose = 50 units. Single manageable injection.",
          },
        ],
        notes: "At 5mg/mL: 5mg dose = 100 units (full syringe). 10mg = split injection. Use 2mg/mL for 10mg single-injection dosing.",
      },
      {
        // 30mg / 6mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 30,
        recommendedBacWaterMl: 6,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 15,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 10mg dose = 50 units. Manageable daily dosing.",
          },
        ],
        notes: "30mg vial at 2mg/mL provides 3 daily doses at 10mg each.",
      },
      {
        // 50mg / 10mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        vialMg: 50,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 25,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — extended supply at daily 10mg dosing.",
          },
        ],
        notes: "Large vial — store in light-protected container. 5 daily doses at 10mg.",
      },
    ],
    sideEffects: [
      "Injection site reactions (common in clinical trials)",
      "Fatigue (early treatment)",
      "Headache",
      "Nausea (mild)",
      "Generally well tolerated in Phase II trials",
    ],
    contraindications: [
      "Pregnancy",
      "Severe renal impairment",
      "Known hypersensitivity to aromatic amino acids",
    ],
    researchNotes: "Developed by Hazel Szeto and Shey-Shing Sheu. Extensive preclinical and clinical data. SPARCL and MMPOWER-3 trials for heart failure showed improvements in exercise tolerance and mitochondrial function. Unique mechanism of directly targeting IMM cardiolipin is unprecedented. Age-related decline in cardiolipin is well documented — SS-31 addresses this directly.",
    stackNotes: "The gold standard 'mito stack' pairs SS-31 + MOTS-c + NAD+. Sometimes Humanin is added. Used by longevity researchers as the core mitochondrial optimization protocol.",
    disclaimer: "For research use only outside of clinical trials. Phase II/III trials ongoing for heart failure.",
  },

  {
    id: "5-amino-1mq",
    name: "5-Amino-1MQ",
    aliases: ["5-Amino-1-methylquinolinium", "5A1MQ", "NNMT inhibitor", "5-Amino-1-methyl quinolinium"],
    category: ["Mitochondrial", "GLP-1 / Metabolic", "Longevity / Epigenetic"],
    mechanism: "5-Amino-1MQ is a small molecule inhibitor of NNMT (Nicotinamide N-methyltransferase), an enzyme that consumes SAM (S-adenosylmethionine) and NAM (nicotinamide, a NAD+ precursor) in fat tissue, thereby reducing NAD+ availability and promoting fat cell differentiation. By inhibiting NNMT, 5-Amino-1MQ preserves NAD+ and SAM availability, reducing fat cell size, increasing energy expenditure, and shifting metabolism toward fat oxidation. Particularly effective for reducing existing fat mass without muscle loss. Also improves insulin sensitivity through AMPK activation.",
    researchStatus: "Preclinical (rodent studies primarily); early human research; research use only",
    dosingRanges: {
      low: 50,
      moderate: 150,
      high: 250,
      unit: "mg",
      perDose: true,
      titrationNotes: "Research protocols: 50–250 mg orally once daily or divided twice daily. Some protocols use 100 mg twice daily. Can be taken with or without food. Oral bioavailability is reasonable — injectable form also studied but oral is predominant route.",
      route: ["oral", "subcutaneous"],
    },
    frequency: "Once or twice daily",
    cycleLength: "8–16 weeks",
    halfLife: "~6–12 hours (estimated)",
    storageInfo: {
      powder: "Store at -20°C or refrigerator, dark and dry.",
      reconstituted: "If reconstituted for injection: refrigerate at 2–8°C, use within 14 days.",
      notes: "More often used in oral capsule form than injectable. Small molecule — stable in lyophilized form.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 50, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 1mL = 10 mg/mL | mcgPerUnit = 100 | unitsFor100mcg = 1
        // Note: typically dosed in mg not mcg — 50mg dose = 500 units (not practical via SubQ)
        vialMg: 10,
        recommendedBacWaterMl: 1,
        concentrationMgPerMl: 10.0,
        mcgPerUnit: 100,
        unitsFor100mcg: 1,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 5.0,
            mcgPerUnit: 50,
            notes: "5mg/mL — more practical for any injection use.",
          },
        ],
        notes: "Primarily oral use. If injectable: at 10mg/mL, 10mg dose = 100 units (1 syringe). Oral capsule form recommended for higher mg doses.",
      },
      {
        // 50mg / 5mL = 10 mg/mL | mcgPerUnit = 100 | unitsFor100mcg = 1
        vialMg: 50,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 10.0,
        mcgPerUnit: 100,
        unitsFor100mcg: 1,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 5.0,
            mcgPerUnit: 50,
            notes: "5mg/mL — 50mg dose = 100 units from this vial.",
          },
        ],
        notes: "50mg vial primarily for oral powder use. Dissolve in appropriate solution for oral administration.",
      },
    ],
    sideEffects: [
      "Generally well tolerated in rodent studies",
      "Possible GI upset (oral)",
      "Headache (mild)",
      "Reduced appetite",
    ],
    contraindications: [
      "Pregnancy (insufficient data)",
      "Known NNMT-related pathologies",
      "Cancer (NNMT plays context-dependent roles in various cancers)",
    ],
    researchNotes: "Research by Kathryn Bhatt and colleagues showed dramatic fat loss without dietary changes in obese mice. NNMT inhibition represents a novel fat-loss mechanism distinct from GLP-1 or appetite suppression pathways. Growing research interest as an adjunct to GLP-1 therapies for metabolic syndrome.",
    stackNotes: "Often combined with NAD+ precursors (NMN, NR) for synergistic NAD+ axis optimization. Used alongside MOTS-c in metabolic longevity stacks. Sometimes combined with GLP-1 agonists for enhanced body composition effects.",
    disclaimer: "For research use only. Human safety data limited. Not approved for therapeutic use.",
  },

  {
    id: "nad-plus",
    name: "NAD+",
    aliases: ["Nicotinamide Adenine Dinucleotide", "NAD", "β-NAD+", "NAD+ IV", "Coenzyme 1"],
    category: ["Mitochondrial", "Longevity / Epigenetic"],
    mechanism: "NAD+ (Nicotinamide Adenine Dinucleotide) is an essential coenzyme found in all living cells, serving as the primary electron carrier in cellular energy metabolism (oxidative phosphorylation, glycolysis, TCA cycle). Beyond energy metabolism, NAD+ is a required substrate for sirtuin deacetylases (SIRT1-7), PARP DNA repair enzymes, and CD38/CD157 signaling, linking it to DNA repair, gene expression, mitochondrial biogenesis, circadian rhythm regulation, and cellular stress response. NAD+ levels decline ~50% by age 50 vs young adult levels, contributing to age-related mitochondrial dysfunction. Direct IV or injectable NAD+ bypasses the conversion steps required by oral precursors (NMN, NR).",
    researchStatus: "Preclinical (extensive); IV NAD+ used clinically in some addiction treatment centers; oral precursors in human trials; injectable RUO",
    dosingRanges: {
      low: 250,
      moderate: 500,
      high: 1000,
      unit: "mg",
      perDose: true,
      titrationNotes: "IV: 500–1000 mg over 2–4 hours (slow infusion required — rapid infusion causes chest tightness, nausea). SubQ: 100–250 mg once daily (much better tolerated than IV push). Start at lower dose to assess tolerance. Loading protocols: 5 consecutive days, then weekly maintenance.",
      route: ["intravenous", "subcutaneous"],
    },
    frequency: "Daily (loading phase 5 days); weekly (maintenance)",
    cycleLength: "5-day loading, then ongoing maintenance",
    halfLife: "~15–30 minutes (rapidly reduced to NADH intracellularly)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry. Protect from moisture — extremely hygroscopic.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days. Sensitive to light and temperature fluctuations.",
      notes: "NAD+ is hygroscopic and sensitive to oxidation — keep sealed until reconstitution. Use sterile saline or bacteriostatic water. For IV infusion, dilute in NS or D5W. Yellow color is normal.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 100, unit: "mg", isCommon: false },
      { mg: 500, unit: "mg", isCommon: true },
      { mg: 1000, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 500mg / 10mL = 50 mg/mL for SubQ use
        // For IV: dilute further in 250–500mL NS
        vialMg: 500,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 50.0,
        mcgPerUnit: 500,
        unitsFor100mcg: 0.2,
        alternativeDilutions: [
          {
            bacWaterMl: 50,
            concentrationMgPerMl: 10.0,
            mcgPerUnit: 100,
            notes: "10mg/mL — for SubQ injection: 250mg dose = 25 units on U-100. More practical for daily SubQ.",
          },
        ],
        notes: "At 50mg/mL: 100mg SubQ dose = 2 units on U-100 (very small volume). Prefer 10mg/mL for SubQ. For IV: dilute entire vial in 250mL NS and infuse over 2–4 hours.",
      },
      {
        // 1000mg / 20mL = 50 mg/mL
        vialMg: 1000,
        recommendedBacWaterMl: 20,
        concentrationMgPerMl: 50.0,
        mcgPerUnit: 500,
        unitsFor100mcg: 0.2,
        alternativeDilutions: [
          {
            bacWaterMl: 100,
            concentrationMgPerMl: 10.0,
            mcgPerUnit: 100,
            notes: "10mg/mL — 500mg SubQ dose = 50 units. Practical for high-dose SubQ protocols.",
          },
        ],
        notes: "IV infusion protocol: dilute 1000mg in 500mL NS; infuse at 125mL/hour (4 hour infusion). SubQ: use 10mg/mL concentration.",
      },
    ],
    sideEffects: [
      "IV: chest tightness, flushing, nausea during infusion (rate-dependent — slow down infusion)",
      "IV: palpitations, headache",
      "SubQ: injection site burning (due to acidity)",
      "Fatigue (day 1–2 of loading)",
      "Increased energy and mental clarity (desired effect after loading)",
    ],
    contraindications: [
      "Active malignancy (NAD+ supports DNA repair but also fuels cancer cell energy metabolism)",
      "Pregnancy",
      "Severe renal impairment",
    ],
    researchNotes: "David Sinclair's research popularized NAD+ as a longevity intervention. Animal studies show dramatic restoration of mitochondrial function, DNA repair capacity, and NAD+-dependent sirtuin activity. IV NAD+ has been used off-label in addiction treatment (opiates, alcohol) with promising anecdotal results. Direct NAD+ vs precursors (NMN, NR) debate ongoing — injectable NAD+ provides direct replenishment without conversion.",
    stackNotes: "Core of the 'mito longevity stack' with SS-31 and MOTS-c. Often combined with 5-Amino-1MQ for NNMT inhibition (preserving NAD+). Resveratrol and pterostilbene sometimes added as sirtuin activators synergistic with NAD+.",
    disclaimer: "For research use only in injectable form. IV administration should only be undertaken with appropriate medical supervision due to infusion reaction risk.",
  },

  {
    id: "pt-141",
    name: "PT-141",
    aliases: ["Bremelanotide", "Vyleesi", "PT141", "Melanocortin agonist (sexual)"],
    category: ["Sexual Health"],
    mechanism: "PT-141 (Bremelanotide) is a synthetic cyclic heptapeptide analog of α-MSH (alpha-melanocyte stimulating hormone) that acts as a non-selective melanocortin receptor agonist with activity at MC1R, MC3R, MC4R, and MC5R. Unlike PDE5 inhibitors (Viagra, Cialis) that act peripherally on vascular smooth muscle, PT-141 acts centrally in the hypothalamus and limbic system to increase sexual motivation and arousal in both males and females. FDA-approved (Vyleesi) for hypoactive sexual desire disorder (HSDD) in premenopausal women. Also studied for erectile dysfunction in men unresponsive to PDE5 inhibitors.",
    researchStatus: "FDA-approved (Vyleesi) for female HSDD; research use for other indications; injectable RUO vials separate from commercial product",
    dosingRanges: {
      low: 0.5,
      moderate: 1.25,
      high: 2,
      unit: "mg",
      perDose: true,
      titrationNotes: "Start at 0.5–0.75 mg subcutaneously 45–60 minutes before sexual activity. Increase to 1.25–2 mg based on response and tolerability. FDA-approved dose for HSDD is 1.75 mg. Do not use more than once per 24 hours or more than 8 times per month in clinical protocols.",
      route: ["subcutaneous"],
    },
    frequency: "As needed (45–60 min before activity); max once per 24 hours",
    cycleLength: "As needed; max 8 uses per month per clinical guidelines",
    halfLife: "~2.7 hours",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Stable peptide. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 10mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        // 1.25mg dose = 12.5 units | 1.75mg = 17.5 units — close enough with 1mg/mL
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 1mg = 4 units, 1.25mg = 5 units, 2mg = 8 units. Cleaner measurement.",
          },
        ],
        notes: "At 1mg/mL: 1mg = 10 units, 1.25mg = 12–13 units, 2mg = 20 units on U-100. Use 2.5mg/mL for cleaner unit math. 10mg vial provides 5–20 doses depending on dose level.",
      },
    ],
    sideEffects: [
      "Nausea (most common — take antiemetic if needed)",
      "Flushing",
      "Headache",
      "Transient blood pressure increase (usually mild)",
      "Injection site reactions",
      "Spontaneous erections in males",
      "Hyperpigmentation with chronic use",
    ],
    contraindications: [
      "Cardiovascular disease (BP elevation risk)",
      "Hypertension (uncontrolled)",
      "Pregnancy",
      "Use of PDE5 inhibitors (additive hypotension risk)",
      "High risk for cardiovascular events",
    ],
    researchNotes: "Originally developed as sunless tanning agent (Melanotan II parent compound). Central mechanism of action differentiates it completely from PDE5 inhibitors — addresses desire/arousal rather than mechanical response. FDA approved Vyleesi in 2019. Palatin Technologies' Rekynda (intranasal) also in development. Both male and female studies show efficacy.",
    stackNotes: "Sometimes combined with PDE5 inhibitors for synergistic effect (central desire + peripheral response). Melanotan II has overlapping but not identical effects — some researchers use one or the other. Not typically combined with other peptides for this indication.",
    disclaimer: "For research use only in lyophilized form. Vyleesi (1.75mg autoinjector) is FDA-approved for female HSDD by prescription.",
  },

  {
    id: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    aliases: ["Tα1", "Zadaxin", "TA1", "Thymalfasin", "Thymosin Alpha-1 acetate"],
    category: ["Immune"],
    mechanism: "Thymosin Alpha-1 is a naturally occurring 28-amino-acid peptide secreted by thymic epithelial cells that serves as a master immune modulator. It promotes maturation and differentiation of T-cells (particularly Th1 CD8+ cytotoxic T-cells), enhances NK cell activity, and upregulates MHC class I and II expression on antigen-presenting cells. Thymosin Alpha-1 also induces dendritic cell maturation and promotes interferon-alpha, IL-2, and IL-12 production. Approved in multiple countries for chronic hepatitis B/C, certain cancers, and sepsis. Uniquely, it can modulate immune responses in both directions — enhancing activity in immunosuppressed states while resolving excessive inflammation.",
    researchStatus: "Approved in 35+ countries (Zadaxin) for hepatitis B/C, melanoma, hepatocellular carcinoma; research use in US",
    dosingRanges: {
      low: 0.8,
      moderate: 1.6,
      high: 3.2,
      unit: "mg",
      perDose: true,
      titrationNotes: "Standard clinical protocol: 1.6 mg subcutaneously twice weekly for 6–12 months (hepatitis protocols). Research protocols: 1.6 mg 2–3x per week for 4–12 weeks. Some acute protocols use daily dosing at lower doses (0.8–1.6 mg/day) for 2 weeks.",
      route: ["subcutaneous"],
    },
    frequency: "2–3x per week",
    cycleLength: "4–52 weeks depending on indication",
    halfLife: "~2 hours",
    storageInfo: {
      powder: "Store at 2–8°C (refrigerator) for short term; -20°C for long term.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "More heat sensitive than most peptides. Prefer refrigerator storage even for lyophilized form during active use periods.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 2mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        // 1.6mg dose = 64 units
        vialMg: 5,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 3.2,
            concentrationMgPerMl: 1.5625,
            mcgPerUnit: 15.625,
            notes: "Matches clinical Zadaxin concentration. 1.6mg = 102 units — use 1.0mg/mL instead.",
          },
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1.6mg dose = 16 units. Clean and practical for standard clinical dose.",
          },
        ],
        notes: "At 2.5mg/mL: 1.6mg dose = 64 units on U-100. At 1mg/mL: 1.6mg = 16 units — much cleaner. Recommend 1mg/mL alternative dilution for standard dosing.",
      },
      {
        // 10mg / 4mL = 2.5 mg/mL | mcgPerUnit = 25 | unitsFor100mcg = 4
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 1.6mg = 16 units. Recommended for clean measurement.",
          },
        ],
        notes: "10mg vial at 1mg/mL: 10 doses at 1.6mg each. Good supply for 5-week 2x/week protocol.",
      },
    ],
    sideEffects: [
      "Generally excellent tolerability in extensive clinical use",
      "Injection site reactions (mild)",
      "Occasional mild flu-like symptoms (immune activation)",
      "Fatigue (transient)",
    ],
    contraindications: [
      "Organ transplant recipients on immunosuppression (may counteract)",
      "Autoimmune diseases requiring immunosuppression (theoretical enhancement)",
      "Pregnancy (insufficient data)",
    ],
    researchNotes: "Over 30 years of clinical use across 35+ countries with excellent safety record. Multiple clinical trials in hepatitis B/C, HIV, cancer (adjuvant), and sepsis. COVID-19 trials in China showed reduced mortality in severe cases. Emerging use in long COVID immune dysregulation. One of the most clinically validated peptides in the entire RUO space.",
    stackNotes: "Combined with BPC-157 for post-surgery recovery protocols (Thymosin Alpha-1 handles immune side, BPC-157 handles tissue repair). Used with LL-37 for antimicrobial + immune protocols. Sometimes added to GH secretagogue stacks for immune support during training.",
    disclaimer: "For research use only in US. Approved medication (Zadaxin) in 35+ countries for specific hepatitis and immune indications.",
  },

// ─────────────────────────────────────────────
// BATCH 5: ADDITIONAL METABOLIC, SEXUAL HEALTH, BLENDS
// ─────────────────────────────────────────────

{
    id: "cagrilintide",
    name: "Cagrilintide",
    aliases: ["AM833", "Long-acting amylin analog", "Cagrisema component"],
    category: ["GLP-1 / Metabolic"],
    mechanism: "Cagrilintide is a long-acting acylated amylin analog that activates amylin receptors (AMY1, AMY2, AMY3) in the hindbrain, hypothalamus, and area postrema to suppress appetite, slow gastric emptying, and reduce glucagon secretion. Unlike GLP-1 RAs, amylin signaling acts through complementary CNS pathways — particularly the brainstem — producing additive satiety effects when combined with GLP-1 agonists. Cagrilintide also improves glycemic control through glucagon suppression and promotes weight loss via reduced caloric intake. Weekly dosing is achieved through fatty acid acylation similar to semaglutide.",
    researchStatus: "Phase III clinical trials ongoing (CagriSema combination with semaglutide); not yet FDA-approved; research use only",
    dosingRanges: {
      low: 0.16,
      moderate: 1.2,
      high: 4.5,
      unit: "mg",
      perDose: true,
      titrationNotes: "Phase II titration: 0.16mg/week → 0.3mg → 0.6mg → 1.2mg → 2.4mg → 4.5mg, escalating every 4 weeks. Extremely gradual titration required. CagriSema combination trial uses parallel titration of both agents.",
      route: ["subcutaneous"],
    },
    frequency: "Once weekly",
    cycleLength: "32–68 weeks (clinical trial durations); research: 16–32 weeks",
    halfLife: "~7–10 days",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days. Do not freeze reconstituted solution.",
      notes: "Weekly dosing — reconstitute appropriate volume. Stable with BAC water.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 5mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        // 1.2mg dose = 12 units | 2.4mg = 24 units | 4.5mg = 45 units
        vialMg: 5,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 1.2mg = 4.8 units, 2.4mg = ~10 units. Less precise for low titration doses.",
          },
        ],
        notes: "At 1mg/mL: 0.16mg = 1.6 units, 1.2mg = 12 units, 2.4mg = 24 units, 4.5mg = 45 units. Clean titration math across all dose levels.",
      },
      {
        // 10mg / 10mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 4.5mg max dose = 18 units. More concentrated for smaller injection volume.",
          },
        ],
        notes: "10mg vial at 1mg/mL provides extended supply across full titration protocol.",
      },
    ],
    sideEffects: [
      "Nausea",
      "Vomiting",
      "Decreased appetite",
      "Diarrhea",
      "Constipation",
      "Injection site reactions",
      "Hypoglycemia (with insulin co-administration)",
    ],
    contraindications: [
      "Personal/family history of MTC or MEN 2 (amylin receptors expressed in thyroid)",
      "Pregnancy",
      "Pancreatitis history",
      "Severe renal impairment",
    ],
    researchNotes: "SCALE BOLT trial (CagriSema Phase II) showed 15.6% body weight reduction at 32 weeks vs 5.1% semaglutide alone — demonstrating clear additive benefit of amylin + GLP-1 dual mechanism. Phase III REDEFINE program underway. Complementary CNS mechanism to GLP-1 is the key pharmacological rationale for combination.",
    stackNotes: "Specifically designed for combination with semaglutide (CagriSema co-formulation). Pre-blended cagrilintide + semaglutide 10mg vials (5mg+5mg) commercially available from RUO suppliers.",
    disclaimer: "For research use only. Not FDA-approved. Phase III trials ongoing.",
  },

  {
    id: "survodutide",
    name: "Survodutide",
    aliases: ["BI 456906", "GLP-1/glucagon dual agonist (Boehringer)", "MASH treatment candidate"],
    category: ["GLP-1 / Metabolic"],
    mechanism: "Survodutide is a dual GLP-1/glucagon receptor co-agonist developed by Boehringer Ingelheim. Like retatrutide, it adds glucagon receptor agonism to GLP-1 activity, increasing hepatic fat oxidation, thermogenesis, and energy expenditure beyond GLP-1 agonism alone. Particularly investigated for MASH (metabolic dysfunction-associated steatohepatitis) due to the liver-specific metabolic effects of glucagon receptor activation, which promotes fatty acid oxidation and reduces hepatic lipid accumulation. Also produces significant body weight reduction.",
    researchStatus: "Phase II/III clinical trials ongoing for MASH and obesity; not yet FDA-approved; research use only",
    dosingRanges: {
      low: 0.3,
      moderate: 3.0,
      high: 6.0,
      unit: "mg",
      perDose: true,
      titrationNotes: "Phase II protocol: weekly escalation from 0.3mg to target dose of 3–6mg over 8–12 weeks. Gradual titration essential for GI tolerability. Once weekly subcutaneous injection.",
      route: ["subcutaneous"],
    },
    frequency: "Once weekly",
    cycleLength: "24–48 weeks (clinical); research: 16–24 weeks",
    halfLife: "~7 days (estimated)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Standard weekly-dosed peptide storage protocol.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        // 3mg dose = 15 units | 6mg = 30 units
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 3mg = 30 units, 6mg = 60 units. Better for lower starting doses.",
          },
        ],
        notes: "At 2mg/mL: 3mg = 15 units, 6mg = 30 units on U-100. Clean for maintenance dosing.",
      },
    ],
    sideEffects: [
      "Nausea",
      "Diarrhea",
      "Vomiting",
      "Decreased appetite",
      "Tachycardia (glucagon-mediated)",
      "Headache",
    ],
    contraindications: [
      "MTC or MEN 2 history",
      "Pregnancy",
      "Cardiac arrhythmias",
      "Pancreatitis history",
    ],
    researchNotes: "Phase II MASH trial (FRONTIER 1) showed 83% of participants achieved MASH resolution at 48 weeks vs 18% placebo — remarkable efficacy. Weight loss of ~15% also demonstrated. Phase III MASH trials now underway. Potential first-in-class dual agonist approval specifically for MASH.",
    stackNotes: "Typically used as standalone given its dual mechanism. Research community beginning to explore combinations with amylin analogs.",
    disclaimer: "For research use only. Not FDA-approved. Phase III trials ongoing.",
  },

  {
    id: "hexarelin",
    name: "Hexarelin",
    aliases: ["Examorelin", "EP-23905", "MF-6003", "Hexarelin acetate"],
    category: ["GH Secretagogue", "Cardiovascular"],
    mechanism: "Hexarelin is a synthetic hexapeptide GHRP (Growth Hormone Releasing Peptide) and potent GHS-R1a ghrelin receptor agonist. It is the most potent GHRP in terms of GH release magnitude, significantly exceeding Ipamorelin, GHRP-2, and GHRP-6. Uniquely, Hexarelin also binds CD36 receptors and progesterone receptors independently of GHS-R1a, producing direct cardioprotective effects including prevention of ischemic damage and cardiac fibrosis — effects not seen with other GHRPs. However, it produces significant GH desensitization with continuous use, limiting cycle lengths.",
    researchStatus: "Research use only; studied in clinical trials for GH deficiency and cardiac protection; cardioprotective effects unique among GHRPs",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 300,
      unit: "mcg",
      perDose: true,
      titrationNotes: "100–300 mcg subcutaneously once or twice daily. Receptor desensitization occurs faster than other GHRPs — limit continuous use to 4–8 weeks. Administer fasted. Pair with GHRH analog for synergistic GH release.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "1–2x daily",
    cycleLength: "4–8 weeks maximum (rapid desensitization)",
    halfLife: "~30–60 minutes",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Standard GHRP storage. Stable peptide.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units. Smaller injection volume.",
          },
        ],
        notes: "At 1mg/mL: 200mcg = 20 units on U-100. Clean and standard.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units. Easier measurement.",
          },
        ],
        notes: "At 2mg/mL: 200mcg = 10 units, 300mcg = 15 units on U-100.",
      },
    ],
    sideEffects: [
      "Rapid GH receptor desensitization (main limitation)",
      "Significant hunger stimulation",
      "Cortisol and prolactin elevation (greater than GHRP-2)",
      "Water retention",
      "Fatigue",
      "Flushing",
    ],
    contraindications: [
      "Active malignancy",
      "Cortisol-sensitive conditions",
      "Pregnancy",
      "Cardiac conditions requiring careful monitoring",
    ],
    researchNotes: "Most potent GH-releasing GHRP known. Cardioprotective effects via CD36/progesterone receptor binding are unique and independent of GH release — significant for cardiac ischemia research. Desensitization limits utility vs Ipamorelin for body composition. Best used in short acute cycles or for cardiac-specific research.",
    stackNotes: "Paired with CJC-1295 No DAC for maximum acute GH output. Less commonly used for ongoing protocols due to desensitization. Sometimes used alongside BPC-157 in acute cardiac/injury research protocols.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "melanotan-2",
    name: "Melanotan II",
    aliases: ["MT-2", "MT II", "Melanotan 2", "α-MSH analog (cyclic)"],
    category: ["Sexual Health", "Skin / Cosmetic"],
    mechanism: "Melanotan II is a cyclic synthetic analog of alpha-melanocyte stimulating hormone (α-MSH) that non-selectively agonizes all five melanocortin receptors (MC1R–MC5R). MC1R activation in melanocytes stimulates melanogenesis (skin tanning) without UV exposure. MC4R activation in the hypothalamus produces sexual arousal and erections (the basis of PT-141's mechanism — PT-141 is essentially a metabolite/analog of Melanotan II). MC3R and MC4R activation also suppresses appetite and promotes fat mobilization. Broader receptor profile than PT-141 produces more side effects but also tanning not seen with PT-141.",
    researchStatus: "Research use only; not FDA-approved; predecessor compound to PT-141 (Bremelanotide/Vyleesi)",
    dosingRanges: {
      low: 0.25,
      moderate: 0.5,
      high: 1.0,
      unit: "mg",
      perDose: true,
      titrationNotes: "Start at 0.25mg subcutaneously and assess tolerance (nausea is common). Increase to 0.5mg as tolerated. For tanning effect: 0.5–1mg daily for loading phase (5–7 days with UV exposure), then maintenance 2–3x/week. For sexual effects: 0.5–1mg 1–2 hours before activity.",
      route: ["subcutaneous"],
    },
    frequency: "Daily (loading); 2–3x/week (maintenance)",
    cycleLength: "5–10 day loading; ongoing maintenance 2–3x/week",
    halfLife: "~33 minutes",
    storageInfo: {
      powder: "Store at -20°C, dark. Extremely light-sensitive.",
      reconstituted: "Refrigerate at 2–8°C, protected from light. Use within 28 days.",
      notes: "Very light-sensitive — store in opaque/foil-wrapped vial after reconstitution. Nausea is dose-dependent and can be minimized by titrating slowly and taking before bed.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 10mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        // 0.25mg = 2.5 units | 0.5mg = 5 units | 1mg = 10 units
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 0.5mg = 2 units, 1mg = 4 units. Smaller volume, easier starting dose measurement.",
          },
        ],
        notes: "At 1mg/mL: 0.25mg = 2.5 units, 0.5mg = 5 units, 1mg = 10 units. Very clean low-dose titration math. 10mg vial provides 10–40 doses.",
      },
    ],
    sideEffects: [
      "Nausea (most common, especially at higher doses)",
      "Facial flushing",
      "Spontaneous erections (males)",
      "Increased libido",
      "Darkening of moles and skin lesions",
      "Hyperpigmentation with extended use",
      "Yawning (characteristic side effect)",
      "Fatigue",
      "New mole development (rare)",
    ],
    contraindications: [
      "History of melanoma or dysplastic nevi (stimulates melanogenesis)",
      "Cardiovascular disease (BP effects)",
      "Pregnancy",
      "Fair-skinned individuals with many moles (dermatological monitoring recommended)",
    ],
    researchNotes: "Developed at University of Arizona as a sunless tanning agent. PT-141 was derived from Melanotan II by removing the tanning component and improving selectivity. Broad melanocortin receptor activation produces multiple effects simultaneously. Significant safety concerns around melanoma risk with chronic use — dermatological monitoring is essential. PT-141 is generally preferred for sexual health research due to cleaner receptor profile.",
    stackNotes: "Sometimes combined with PT-141 for tanning + sexual health. Not typically combined with other melanocortin-active compounds. Some protocols use with BPC-157 for skin healing alongside tanning effect.",
    disclaimer: "For research use only. Not approved for human therapeutic use. Melanoma risk monitoring essential with any use.",
  },

  {
    id: "gonadorelin",
    name: "Gonadorelin",
    aliases: ["GnRH", "LHRH", "Luteinizing hormone-releasing hormone", "Factrel", "Gonadorelin acetate"],
    category: ["Sexual Health", "Other"],
    mechanism: "Gonadorelin is the synthetic form of endogenous Gonadotropin-Releasing Hormone (GnRH), a decapeptide produced by the hypothalamus that regulates the reproductive axis. Pulsatile gonadorelin stimulates pituitary LH (luteinizing hormone) and FSH (follicle-stimulating hormone) release, which in turn stimulates gonadal testosterone and estrogen production. Used therapeutically to maintain testicular function during testosterone replacement therapy (TRT) or to stimulate endogenous testosterone production. Critical distinction: pulsatile administration maintains gonadal function; continuous administration paradoxically suppresses it (used in prostate cancer treatment).",
    researchStatus: "FDA-approved for diagnostic use and infertility treatment; widely used off-label during TRT; injectable RUO vials available",
    dosingRanges: {
      low: 50,
      moderate: 100,
      high: 250,
      unit: "mcg",
      perDose: true,
      titrationNotes: "For TRT adjunct (maintaining testicular function): 100–250 mcg subcutaneously twice weekly or every 3 days. Pulsatile administration is essential — do not use as continuous infusion. Some protocols use 100 mcg 3x/week. For fertility stimulation: 75–150 mcg every 90 minutes via pump (mimics natural pulsatile release).",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "2–3x per week (TRT adjunct protocol)",
    cycleLength: "Ongoing during TRT; or 12–16 weeks for fertility protocols",
    halfLife: "~2–4 minutes (extremely short — pulsatile administration critical)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 21 days.",
      notes: "Very short half-life makes timing critical. Stable once reconstituted but use within 21 days.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        // 100mcg dose = 10 units | 250mcg = 25 units
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 100mcg = 5 units, 250mcg = 12.5 units. Smaller volume.",
          },
        ],
        notes: "At 1mg/mL: 100mcg = 10 units, 250mcg = 25 units on U-100. Clean and easy for TRT adjunct protocol.",
      },
      {
        // 5mg / 5mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 5,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 2.5,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 100mcg = 5 units. More concentrated for smaller injection.",
          },
        ],
        notes: "5mg vial at 1mg/mL: 20 doses at 250mcg each. Good 7-week supply for 3x/week TRT protocol.",
      },
    ],
    sideEffects: [
      "Injection site reactions",
      "Headache",
      "Nausea",
      "Abdominal discomfort",
      "Flushing",
      "Ovarian hyperstimulation syndrome (females, fertility protocols)",
    ],
    contraindications: [
      "Gonadotropin-dependent tumors",
      "Pregnancy (unless fertility protocol under medical supervision)",
      "Polycystic ovarian disease (some protocols)",
    ],
    researchNotes: "Well-established clinical compound. Pulsatile vs continuous administration dichotomy is pharmacologically critical. Used alongside TRT in men who wish to preserve testicular size and fertility during exogenous testosterone use. hCG and Kisspeptin are alternative approaches for LH stimulation. Gonadorelin's extremely short half-life necessitates frequent dosing or pump delivery for fertility applications.",
    stackNotes: "Used alongside testosterone (TRT) to prevent testicular atrophy and maintain intratesticular testosterone. Sometimes combined with HCG for fertility protocols. Kisspeptin is an upstream alternative approach.",
    disclaimer: "For research use only in RUO form. FDA-approved diagnostic/therapeutic product available by prescription.",
  },

  {
    id: "kisspeptin",
    name: "Kisspeptin",
    aliases: ["Kisspeptin-10", "Kisspeptin-54", "KP-10", "Metastin", "KISS1 peptide"],
    category: ["Sexual Health", "Other"],
    mechanism: "Kisspeptin is a family of neuropeptides encoded by the KISS1 gene that act as the primary upstream regulators of the hypothalamic-pituitary-gonadal (HPG) axis. Kisspeptin neurons in the hypothalamus (arcuate and anteroventral periventricular nuclei) project to GnRH neurons and release kisspeptin to trigger pulsatile GnRH secretion, which drives downstream LH, FSH, and sex hormone production. Kisspeptin is essentially the 'master switch' of reproductive function. It also modulates sexual behavior, mood, and has proposed roles in bone density regulation through GPR54 receptor signaling.",
    researchStatus: "Preclinical and Phase I/II clinical trials for reproductive disorders, hypogonadism, and fertility; research use only",
    dosingRanges: {
      low: 1,
      moderate: 4,
      high: 9.6,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Clinical research doses: 0.1–9.6 mcg/kg as IV bolus or subcutaneous injection. For practical research: 1–10 mcg subcutaneously. Pulsatile administration every 90 minutes studied for fertility (mimics natural release). IV administration used in most controlled trials.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "Pulsatile (every 90 min for fertility) or once/twice daily (research)",
    cycleLength: "2–8 weeks",
    halfLife: "~28 minutes (Kisspeptin-10); ~60 minutes (Kisspeptin-54)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 21 days.",
      notes: "Kisspeptin-10 (the 10 amino acid C-terminal fragment) is the most commonly available research form. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 10mL = 1 mg/mL = 1000 mcg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        // 4mcg dose = 0.4 units (very small — need more dilute solution for micro-dosing)
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 100,
            concentrationMgPerMl: 0.1,
            mcgPerUnit: 1,
            notes: "0.1mg/mL (100mcg/mL) — 4mcg dose = 4 units, 9.6mcg = ~10 units. Much easier for clinical dose measurement.",
          },
        ],
        notes: "Clinical doses are very small (mcg/kg range). Use highly diluted 0.1mg/mL solution for accurate measurement. At 1mg/mL, doses are too small to measure accurately on U-100 syringe.",
      },
    ],
    sideEffects: [
      "Generally well tolerated in clinical trials",
      "Mild flushing",
      "Headache",
      "Nausea (rare)",
      "LH surge and associated effects (testicular/ovarian)",
    ],
    contraindications: [
      "Gonadotropin-dependent tumors",
      "Pregnancy (stimulates reproductive axis)",
      "Sex hormone-sensitive malignancies",
    ],
    researchNotes: "Discovered as a metastasis suppressor gene (hence metastin), then found to regulate reproduction. KISS1 mutations cause idiopathic hypogonadotropic hypogonadism (IHH). Clinical trials at UK research centers (Dhillo group, Imperial College London) demonstrated LH surge induction and fertility restoration. Being studied as alternative to hCG for LH stimulation in male hypogonadism.",
    stackNotes: "Sometimes used as alternative to Gonadorelin/hCG for upstream HPG axis stimulation. Can be combined with clomiphene for comprehensive HPTA restoration protocols.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "hcg",
    name: "HCG",
    aliases: ["Human Chorionic Gonadotropin", "hCG", "Pregnyl", "Novarel", "Ovidrel"],
    category: ["Sexual Health", "Other"],
    mechanism: "Human Chorionic Gonadotropin (hCG) is a glycoprotein hormone produced naturally by the syncytiotrophoblast of the placenta during pregnancy. It shares structural homology with LH (luteinizing hormone) and binds the LH/hCG receptor on Leydig cells in the testes, directly stimulating intratesticular testosterone (ITT) production and spermatogenesis. Unlike gonadorelin/kisspeptin which act at the hypothalamic/pituitary level, hCG acts directly on the testes, making it highly effective for maintaining testicular function during exogenous testosterone use.",
    researchStatus: "FDA-approved for cryptorchidism, male hypogonadism, and female infertility (anovulation induction); widely used off-label during TRT",
    dosingRanges: {
      low: 250,
      moderate: 500,
      high: 1000,
      unit: "IU",
      perDose: true,
      titrationNotes: "TRT adjunct: 250–500 IU subcutaneously 2–3x per week to maintain testicular function and size. Fertility/PCT: 500–1000 IU 3x/week for 4–6 weeks. Avoid excessive doses (>1000 IU/injection) as they can suppress LH receptor sensitivity over time.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "2–3x per week",
    cycleLength: "Ongoing during TRT; 4–6 weeks for fertility/PCT",
    halfLife: "~33 hours (beta-hCG subunit)",
    storageInfo: {
      powder: "Store at 2–8°C (refrigerator). Some suppliers recommend -20°C for long-term storage.",
      reconstituted: "Refrigerate at 2–8°C. Use within 30–60 days.",
      notes: "hCG is a larger glycoprotein — more sensitive than small peptides. Reconstitute with bacteriostatic water only (NOT sterile water for multi-dose use). Avoid vigorous shaking.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 60,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5000, unit: "IU", isCommon: true },
      { mg: 10000, unit: "IU", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5000 IU / 5mL = 1000 IU/mL
        // 250 IU dose = 25 units | 500 IU = 50 units | 1000 IU = 100 units
        vialMg: 5000,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 1000, // IU/mL in this case
        mcgPerUnit: 10, // 10 IU per unit on U-100 at 1000 IU/mL
        unitsFor100mcg: 10, // 10 units = 100 IU
        alternativeDilutions: [
          {
            bacWaterMl: 10,
            concentrationMgPerMl: 500, // 500 IU/mL
            mcgPerUnit: 5, // 5 IU per unit
            notes: "500 IU/mL — 250 IU = 50 units, 500 IU = 100 units. Easier measurement for lower doses.",
          },
        ],
        notes: "NOTE: IU-dosed compound. At 1000 IU/mL: 250 IU = 25 units, 500 IU = 50 units on U-100. Clean math for standard TRT adjunct dosing.",
      },
      {
        // 10000 IU / 10mL = 1000 IU/mL
        vialMg: 10000,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1000, // IU/mL
        mcgPerUnit: 10, // 10 IU per unit
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 20,
            concentrationMgPerMl: 500, // 500 IU/mL
            mcgPerUnit: 5,
            notes: "500 IU/mL — 500 IU = 100 units. Full syringe measurement for 500 IU dose.",
          },
        ],
        notes: "10000 IU vial at 1000 IU/mL: 20 doses at 500 IU each. Extended supply for TRT protocol.",
      },
    ],
    sideEffects: [
      "Increased estrogen conversion (aromatization of elevated testosterone)",
      "Gynecomastia (from estrogen elevation)",
      "Acne",
      "Testicular ache/fullness",
      "Water retention",
      "Mood changes",
      "Ovarian hyperstimulation syndrome (females — serious)",
    ],
    contraindications: [
      "Androgen-sensitive tumors (prostate, breast cancer in males)",
      "Precocious puberty",
      "Pregnancy (paradoxically used to trigger ovulation — only under medical supervision)",
      "Uncontrolled thyroid/adrenal dysfunction",
    ],
    researchNotes: "One of the most extensively used hormonal compounds in reproductive medicine. Mechanistically distinct from GnRH analogs — acts directly on testicular Leydig cells. Key advantage over Gonadorelin: longer half-life allows 2–3x/week dosing vs pulsatile GnRH requirements. Aromatase inhibitor co-administration often needed to manage estrogen conversion.",
    stackNotes: "Standard TRT adjunct alongside testosterone cypionate/enanthate. Sometimes combined with clomiphene and/or gonadorelin in comprehensive HPTA protocols. Anastrozole or aromasin often co-administered to manage estrogen conversion.",
    disclaimer: "For research use only in RUO vial form. FDA-approved product available by prescription for specific indications.",
  },

  {
    id: "mgf",
    name: "MGF",
    aliases: ["Mechano Growth Factor", "IGF-1Ec", "MGF peptide", "mechano-sensitive IGF-1 splice variant"],
    category: ["Recovery & Repair", "GH Secretagogue"],
    mechanism: "Mechano Growth Factor (MGF) is a splice variant of IGF-1 produced locally in muscle and other tissues in response to mechanical strain (exercise, injury). The unique C-terminal E-domain peptide of MGF activates satellite cells (muscle stem cells), promoting their proliferation and differentiation into new muscle fibers. Unlike systemic IGF-1, MGF acts locally at the site of mechanical stress. It does not bind IGFBPs effectively, acting transiently before converting to systemic IGF-1. The synthetic MGF Ec peptide represents just the unique C-terminal domain responsible for satellite cell activation.",
    researchStatus: "Preclinical; research use only; animal models show significant muscle regeneration effects",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 400,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Research protocols: 100–400 mcg intramuscularly or subcutaneously into target muscle, immediately post-exercise or post-injury. Local intramuscular injection preferred for site-specific effect. Use within 3–4 hours post-workout when satellite cell activation windows are open.",
      route: ["intramuscular", "subcutaneous"],
    },
    frequency: "Post-exercise (3–5x per week based on training frequency)",
    cycleLength: "4–6 weeks",
    halfLife: "~minutes (very short; hence PEG-MGF was developed)",
    storageInfo: {
      powder: "Store at -20°C, dark. Sensitive to temperature — keep frozen until use.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days. Very short half-life means reconstituted solution degrades quickly in vivo, but is stable in vitro.",
      notes: "Very short in vivo half-life is the main limitation of native MGF — reason PEG-MGF was developed. Consider PEG-MGF for longer activity window.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
      { mg: 5, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units. Smaller volume for IM injection.",
          },
        ],
        notes: "At 1mg/mL: 200mcg = 20 units, 400mcg = 40 units on U-100. Standard for post-workout IM protocol.",
      },
      {
        // 5mg / 2.5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        vialMg: 5,
        recommendedBacWaterMl: 2.5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 5,
            concentrationMgPerMl: 1.0,
            mcgPerUnit: 10,
            notes: "1mg/mL — 200mcg = 20 units, 400mcg = 40 units.",
          },
        ],
        notes: "At 2mg/mL: 200mcg = 10 units, 400mcg = 20 units on U-100.",
      },
    ],
    sideEffects: [
      "Injection site soreness (IM route)",
      "Hypoglycemia potential (IGF-1 pathway)",
      "Theoretical concern for tumor promotion (mitogen)",
    ],
    contraindications: [
      "Active malignancy (potent mitogen)",
      "Diabetics (glucose monitoring needed)",
      "Pregnancy",
    ],
    researchNotes: "Goldspink's pioneering research at UCL established MGF as the local muscle repair signal. Satellite cell activation is the key mechanism for muscle regeneration after injury or training. Very short half-life limits practical use — PEG-MGF (pegylated version) was developed to address this. Significant anabolic potential in animal models.",
    stackNotes: "Used post-workout alongside IGF-1 LR3 in advanced anabolic research stacks. PEG-MGF is often preferred for practical use. BPC-157 + TB-500 + MGF is used in injury recovery protocols requiring both systemic and local anabolic signaling.",
    disclaimer: "For research use only. Not approved for human therapeutic use. Potent mitogen — cancer contraindication applies.",
  },

  {
    id: "peg-mgf",
    name: "PEG-MGF",
    aliases: ["Pegylated MGF", "PEGylated Mechano Growth Factor", "PEG-IGF-1Ec"],
    category: ["Recovery & Repair", "GH Secretagogue"],
    mechanism: "PEG-MGF is the pegylated (polyethylene glycol conjugated) form of Mechano Growth Factor, developed to dramatically extend its half-life from minutes to several days while preserving satellite cell activating activity. PEGylation reduces renal clearance and protease degradation. Like native MGF, it activates satellite cell proliferation and promotes muscle fiber regeneration, but with the extended half-life it can be administered less frequently and distributes more systemically rather than purely locally.",
    researchStatus: "Preclinical; research use only; extends MGF half-life from minutes to days",
    dosingRanges: {
      low: 100,
      moderate: 200,
      high: 400,
      unit: "mcg",
      perDose: true,
      titrationNotes: "200–400 mcg subcutaneously or intramuscularly 2–3x per week. Due to extended half-life, less frequent dosing is effective vs native MGF. Post-workout administration preferred but timing less critical than with native MGF.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "2–3x per week",
    cycleLength: "4–6 weeks",
    halfLife: "Several days (vs minutes for native MGF)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "More stable than native MGF due to PEGylation. Standard reconstitution with BAC water.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 2, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 2mg / 2mL = 1 mg/mL | mcgPerUnit = 10 | unitsFor100mcg = 10
        vialMg: 2,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 1,
            concentrationMgPerMl: 2.0,
            mcgPerUnit: 20,
            notes: "2mg/mL — 200mcg = 10 units, 400mcg = 20 units. Smaller injection volume.",
          },
        ],
        notes: "At 1mg/mL: 200mcg = 20 units, 400mcg = 40 units on U-100. Standard 2–3x/week protocol.",
      },
    ],
    sideEffects: [
      "Injection site reactions",
      "Hypoglycemia potential",
      "Potential immune response to PEG component (anti-PEG antibodies) with repeated use",
      "Theoretical tumor promotion risk",
    ],
    contraindications: [
      "Active malignancy",
      "Known PEG hypersensitivity",
      "Diabetes (glucose monitoring)",
      "Pregnancy",
    ],
    researchNotes: "PEGylation technology applied to MGF to overcome the extreme short half-life limitation. Anti-PEG antibodies are a theoretical concern with long-term PEGylated compound use — observed with some PEGylated drugs clinically. Trade-off: extended action window vs possible immunogenicity with chronic use.",
    stackNotes: "Preferred over native MGF for practical protocols due to longer half-life. Combined with IGF-1 LR3 for synergistic anabolic effect. BPC-157 and TB-500 added for comprehensive recovery stacks.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "oxytocin",
    name: "Oxytocin",
    aliases: ["OXT", "Love hormone", "Syntocinon", "Pitocin", "Oxytocin acetate"],
    category: ["Other", "Sexual Health"],
    mechanism: "Oxytocin is a nine-amino-acid neuropeptide produced in the hypothalamic paraventricular and supraoptic nuclei and released from the posterior pituitary. It binds oxytocin receptors (OXTRs) throughout the brain and periphery to modulate social bonding, trust, empathy, sexual arousal, and pair bonding behavior. Peripherally, it stimulates uterine contractions (obstetric use) and milk ejection (lactation). Research interest focuses on its anxiolytic, pro-social, and potential antidepressant effects via modulation of amygdala activity and HPA axis stress response.",
    researchStatus: "FDA-approved (Pitocin/Syntocinon) for obstetric use; intranasal form studied in clinical trials for autism, PTSD, anxiety; research use only for non-obstetric applications",
    dosingRanges: {
      low: 10,
      moderate: 20,
      high: 40,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Intranasal research: 20–40 IU (mcg) per nostril, 30–60 minutes before social interaction or therapy session. Injectable research: 10–40 mcg subcutaneously. Clinical intranasal spray delivers ~4 IU (mcg) per puff, with 2–3 puffs per nostril being standard research doses.",
      route: ["intranasal", "subcutaneous", "intravenous (obstetric only)"],
    },
    frequency: "As needed (acute); once daily in research protocols",
    cycleLength: "Acute use or 4–8 week research protocols",
    halfLife: "~1–6 minutes (plasma); longer CNS effects via blood-brain barrier penetration",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 21 days.",
      notes: "Intranasal administration requires appropriate nasal spray device. For injectable: standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 21,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 5, unit: "mg", isCommon: true },
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 5mg / 5mL = 1 mg/mL = 1000 mcg/mL
        // 20mcg dose = 2 units on U-100
        vialMg: 5,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 50,
            concentrationMgPerMl: 0.1,
            mcgPerUnit: 1,
            notes: "0.1mg/mL — 20mcg = 20 units. Better measurement for small doses. Also suitable for intranasal spray concentration.",
          },
        ],
        notes: "Doses are small — use diluted solution for accurate measurement. At 1mg/mL: 20mcg = 2 units (difficult to measure). Use 0.1mg/mL alternative for practical dosing.",
      },
      {
        // 10mg / 10mL = 1 mg/mL
        vialMg: 10,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 1.0,
        mcgPerUnit: 10,
        unitsFor100mcg: 10,
        alternativeDilutions: [
          {
            bacWaterMl: 100,
            concentrationMgPerMl: 0.1,
            mcgPerUnit: 1,
            notes: "0.1mg/mL — use for intranasal spray or accurate low-dose injection measurement.",
          },
        ],
        notes: "Use alternative dilution for practical dose measurement given small dose sizes.",
      },
    ],
    sideEffects: [
      "Nausea",
      "Headache",
      "Nasal irritation (intranasal)",
      "Paradoxical anxiety or fear in some individuals",
      "Hyponatremia with large IV doses (obstetric doses only)",
      "Blood pressure changes",
    ],
    contraindications: [
      "Hyponatremia",
      "Pregnancy (unless obstetric — uterine contraction risk)",
      "Severe cardiovascular disease",
      "Borderline personality disorder (paradoxical effects reported)",
    ],
    researchNotes: "Extensive clinical research in autism spectrum disorder (mixed results), PTSD, social anxiety, and pair bonding. Meta-analyses show context-dependent effects — not universally pro-social. Anxiety reduction in clinical settings but possible anxiety exacerbation in naturalistic settings. Nasal spray delivery provides CNS access. Used in trauma-focused psychotherapy research.",
    stackNotes: "Sometimes combined with MDMA-assisted therapy research (synergistic pro-social effects). Research protocols combine with standard anxiolytic peptides like Selank. Not typically combined with other peptides for reproductive applications.",
    disclaimer: "For research use only in non-obstetric injectable form. Pitocin/Syntocinon FDA-approved for obstetric use only by prescription.",
  },

  {
    id: "foxo4-dri",
    name: "FOXO4-DRI",
    aliases: ["FOXO4-p53 DRI", "Senolytic peptide", "FOXO4 D-retro-inverso peptide"],
    category: ["Longevity / Epigenetic"],
    mechanism: "FOXO4-DRI is a D-retro-inverso (DRI) modified peptide designed to disrupt the interaction between FOXO4 and p53 in senescent cells. In senescent cells, FOXO4 retains p53 in the nucleus, preventing apoptosis and causing the cell to persist and secrete the SASP (senescence-associated secretory phenotype) — inflammatory factors that damage surrounding tissue. The DRI modification makes the peptide resistant to proteolysis. By competitively disrupting FOXO4-p53 binding, FOXO4-DRI allows p53 to translocate to mitochondria and initiate apoptosis selectively in senescent cells, clearing them from tissues.",
    researchStatus: "Preclinical (de Magalhaes, van Deursen labs); research use only; no human clinical trials published",
    dosingRanges: {
      low: 5,
      moderate: 10,
      high: 25,
      unit: "mg",
      perDose: true,
      titrationNotes: "Mouse study protocol (Baar et al., 2017): 5 mg/kg intraperitoneal or IV 3x/week for 3 weeks. Translating to human research (approximate): 10–25 mg subcutaneously 3x/week for 3 weeks, repeated quarterly. Research community typically runs 3-week cycles 2–4x per year.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "3x per week (during cycle)",
    cycleLength: "3 weeks, 2–4 cycles per year",
    halfLife: "Extended (hours) due to D-amino acid DRI modification resisting protease degradation",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "DRI modification makes this more stable than L-form peptides. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // 10mg dose = 200 units — split into 2 injections
        vialMg: 10,
        recommendedBacWaterMl: 2,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — 10mg = 40 units. Single manageable injection per dose.",
          },
        ],
        notes: "At 5mg/mL: 5mg dose = 100 units (full syringe). 10mg = split into 2 injections or use 2.5mg/mL alternative.",
      },
    ],
    sideEffects: [
      "Generally well tolerated in mouse studies",
      "Potential for clearing beneficial senescent cells (wound healing senescence)",
      "Unknown human safety profile",
      "Theoretical immune response to selective senescent cell clearance",
    ],
    contraindications: [
      "Active wound healing (senescent cells play positive role in acute wound repair)",
      "Pregnancy",
      "Active infection or inflammatory state",
      "Cancer (senescent cells can suppress tumor growth — complex interaction)",
    ],
    researchNotes: "Baar et al. (2017, Cell) landmark paper showed FOXO4-DRI cleared senescent cells in fast-aged mice, restoring fitness, renal function, and fur density — with no obvious toxicity. One of the most exciting senolytic approaches because of selectivity for senescent cells via mechanism-based apoptosis induction. Human data completely lacking. Considered a frontier longevity compound.",
    stackNotes: "Used in comprehensive longevity stacks alongside Epitalon, GHK-Cu, and NAD+. Some researchers cycle FOXO4-DRI 3x/year with NAD+ loading protocols between cycles. Considered 'senolytic' — complements 'senomorphic' compounds like Rapamycin analogs.",
    disclaimer: "For research use only. No human clinical trial data exists. Unknown safety profile in humans. Extreme caution warranted.",
  },

  {
    id: "aicar",
    name: "AICAR",
    aliases: ["Acadesine", "AICA Riboside", "5-Aminoimidazole-4-carboxamide ribonucleotide", "AMPK activator"],
    category: ["Mitochondrial", "GLP-1 / Metabolic"],
    mechanism: "AICAR (5-Aminoimidazole-4-carboxamide-1-β-D-ribofuranoside) is a nucleotide precursor that is phosphorylated intracellularly to ZMP, which mimics AMP and directly activates AMPK (AMP-activated protein kinase). AMPK activation triggers a metabolic switch mimicking the effects of exercise and caloric restriction: increased glucose uptake, fatty acid oxidation, mitochondrial biogenesis, and suppression of anabolic pathways. AICAR essentially activates the cellular 'energy sensor' AMPK without requiring actual exercise, earning it the label 'exercise in a bottle' in research contexts.",
    researchStatus: "Preclinical (metabolic research); studied in Phase II trials for acute lymphoblastic leukemia and cardiac surgery; research use only for metabolic applications",
    dosingRanges: {
      low: 250,
      moderate: 500,
      high: 1000,
      unit: "mg",
      perDose: true,
      titrationNotes: "Mouse studies: 250–500 mg/kg intraperitoneal. Human research extrapolation: 250–500 mg subcutaneously or IV daily for 4–8 weeks. IV route used in clinical leukemia trials. Start conservatively — limited human metabolic data.",
      route: ["subcutaneous", "intravenous"],
    },
    frequency: "Once daily",
    cycleLength: "4–8 weeks",
    halfLife: "~4 hours",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 14 days.",
      notes: "Reconstitute with sterile saline or BAC water. Stable but use promptly after reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 14,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 50, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 50mg / 5mL = 10 mg/mL | mcgPerUnit = 100 | unitsFor100mcg = 1
        // 250mg dose = 25 units | 500mg = 50 units
        vialMg: 50,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 10.0,
        mcgPerUnit: 100,
        unitsFor100mcg: 1,
        alternativeDilutions: [
          {
            bacWaterMl: 2.5,
            concentrationMgPerMl: 20.0,
            mcgPerUnit: 200,
            notes: "20mg/mL — 50mg dose = 25 units. More concentrated — useful for lower volume injection.",
          },
        ],
        notes: "At 10mg/mL: 50mg dose = 5 units on U-100 (too small). This is a high mg-dose compound — consider IV infusion. SubQ at higher concentrations for practical injection volumes.",
      },
    ],
    sideEffects: [
      "Hypoglycemia (AMPK-mediated glucose uptake)",
      "Nausea",
      "Fatigue (paradoxically — acute AMPK activation mimics exercise fatigue)",
      "Headache",
      "Uric acid reduction (gout protective)",
    ],
    contraindications: [
      "Hypoglycemia-prone individuals",
      "Severe renal impairment (purine metabolism)",
      "Gout (AICAR is protective but monitor)",
      "Pregnancy",
    ],
    researchNotes: "The Winder and Hardie labs established AICAR as the key tool for AMPK research. Mouse studies showed significant improvements in running endurance and fat oxidation without exercise. GW501516 (Cardarine) combined with AICAR showed dramatic performance enhancement in sedentary mice. Leukemia trials showed activity. Limited human metabolic research — translation from mouse studies uncertain.",
    stackNotes: "Sometimes combined with GW501516 (non-peptide PPAR-delta agonist) in metabolic research stacks. MOTS-c and SS-31 used alongside for comprehensive mitochondrial/metabolic protocols.",
    disclaimer: "For research use only. Limited human safety data. Not approved for metabolic/performance applications.",
  },

  {
    id: "glutathione",
    name: "Glutathione",
    aliases: ["GSH", "L-Glutathione", "Reduced Glutathione", "Gamma-glutamylcysteinylglycine"],
    category: ["Immune", "Longevity / Epigenetic"],
    mechanism: "Glutathione is the most abundant endogenous antioxidant tripeptide (gamma-Glu-Cys-Gly) found in virtually all human cells. It neutralizes reactive oxygen species (ROS) and reactive nitrogen species (RNS) directly and serves as a cofactor for glutathione peroxidase and glutathione S-transferase enzymes. Glutathione is essential for immune function (T-cell proliferation, NK cell activity), detoxification of xenobiotics in the liver (Phase II detoxification), DNA synthesis and repair, and regeneration of other antioxidants (Vitamin C, E). Injectable glutathione bypasses the poor oral bioavailability of the reduced form and directly raises intracellular GSH.",
    researchStatus: "Widely used clinically in Europe and Asia (IV push) for liver disease, detoxification, skin brightening; IV/injectable form RUO in US",
    dosingRanges: {
      low: 600,
      moderate: 1200,
      high: 2400,
      unit: "mg",
      perDose: true,
      titrationNotes: "IV push: 600–2400 mg diluted in 10–20 mL NS, administered over 10–15 minutes 2–3x/week. SubQ: 200–600 mg subcutaneously daily. Nebulized for pulmonary applications. Start lower and titrate — some individuals experience detox reactions at higher doses.",
      route: ["intravenous", "subcutaneous", "nebulized"],
    },
    frequency: "Daily (SubQ) or 2–3x per week (IV)",
    cycleLength: "4–12 weeks; some protocols ongoing",
    halfLife: "~2–3 hours (reduced form in plasma)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry. Extremely sensitive to oxidation — keep sealed and minimize air exposure.",
      reconstituted: "Use within 24 hours if possible; up to 7 days refrigerated in dark. Oxidizes to GSSG (inactive) on exposure to air.",
      notes: "Critical: glutathione oxidizes rapidly once reconstituted. Use immediately or store in amber vial with minimal air. Slight yellow color normal. Brown/dark coloration indicates oxidation — discard.",
    },
    stability: {
      powderDays: 365,
      reconstitutedFridgeDays: 7,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 200, unit: "mg", isCommon: false },
      { mg: 600, unit: "mg", isCommon: true },
      { mg: 1000, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 600mg / 10mL = 60 mg/mL
        // SubQ: 200mg dose = ~33 units (close enough); IV: dilute further in NS
        vialMg: 600,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 60.0,
        mcgPerUnit: 600,
        unitsFor100mcg: 0.17,
        alternativeDilutions: [
          {
            bacWaterMl: 6,
            concentrationMgPerMl: 100.0,
            mcgPerUnit: 1000,
            notes: "100mg/mL — 600mg dose = 60 units on U-100. Most practical for SubQ administration.",
          },
        ],
        notes: "For SubQ: use 100mg/mL (6mL BAC water). 600mg = 60 units, 200mg = 20 units — clean SubQ measurement. For IV: reconstitute in 10mL NS then dilute to 50–100mL for slow push.",
      },
      {
        // 1000mg / 10mL = 100 mg/mL
        vialMg: 1000,
        recommendedBacWaterMl: 10,
        concentrationMgPerMl: 100.0,
        mcgPerUnit: 1000,
        unitsFor100mcg: 0.1,
        alternativeDilutions: [
          {
            bacWaterMl: 20,
            concentrationMgPerMl: 50.0,
            mcgPerUnit: 500,
            notes: "50mg/mL — 600mg = 12 units, 1200mg = 24 units. More practical measurement.",
          },
        ],
        notes: "High-dose vial. At 100mg/mL: 1000mg dose = 100 units (full 1mL syringe) — for SubQ split into multiple sites. IV: dilute in 50mL NS. Use immediately after reconstitution.",
      },
    ],
    sideEffects: [
      "Zinc depletion with chronic high-dose use",
      "Detox reactions (headache, fatigue) — start low",
      "Skin lightening/brightening (melanin suppression via MC1R)",
      "Nausea",
      "Rare: anaphylaxis (IV route)",
      "Wheezing (nebulized — asthmatics)",
    ],
    contraindications: [
      "Asthma (nebulized form — bronchospasm risk)",
      "Known hypersensitivity",
      "Pregnancy at high doses (insufficient safety data)",
    ],
    researchNotes: "Endogenous antioxidant with massive clinical literature. Declines with age, disease, and toxin exposure. IV glutathione used for Parkinson's disease (anecdotal and small trials), liver disease, and heavy metal detoxification. Skin-brightening effect well-documented in Asian clinical literature. Oral bioavailability of reduced form is poor — injectable form necessary for significant systemic GSH elevation.",
    stackNotes: "Combined with NAD+ for comprehensive cellular detox and antioxidant protocols. Used with Thymosin Alpha-1 for immune optimization. Frequently included in IV drip formulations alongside B vitamins and Vitamin C.",
    disclaimer: "For research use only in injectable form. IV administration carries anaphylaxis risk — have epinephrine available.",
  },

  // ─────────────────────────────────────────────
  // BLEND ENTRIES
  // ─────────────────────────────────────────────

  {
    id: "bpc-157-tb-500-blend-10mg",
    name: "BPC-157 + TB-500 Blend (10mg)",
    aliases: ["Recovery Blend 10mg", "BPC/TB Blend", "TB-500 BPC-157 10mg", "Blend 10mg"],
    category: ["Recovery & Repair"],
    mechanism: "Pre-blended combination of BPC-157 (5mg) and TB-500 (5mg) in a single vial. BPC-157 provides localized tissue healing through VEGF, eNOS, and collagen synthesis upregulation with potent GI and tendon repair properties. TB-500 provides systemic healing through actin sequestration and distal tissue repair. The complementary local (BPC-157) and systemic (TB-500) mechanisms make this the most popular recovery stack in peptide research. Combined in single vial for convenient reconstitution.",
    researchStatus: "Both components individually preclinical; blend is RUO; widely used combination",
    dosingRanges: {
      low: 5,
      moderate: 10,
      high: 15,
      unit: "mg",
      perDose: true,
      titrationNotes: "Typical protocol: full vial (5mg BPC-157 + 5mg TB-500) 2–3x per week for acute injury, or once weekly for maintenance/prevention. Can split vial into smaller doses — half vial (2.5mg each) for daily administration during acute phase.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "2–3x per week (acute) / Once weekly (maintenance)",
    cycleLength: "4–8 weeks",
    halfLife: "BPC-157: ~4 hours; TB-500: ~3–10 days (combined kinetics)",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Standard reconstitution for blended vials. Both peptides stable together in solution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
      { mg: 20, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 2mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // Full vial (10mg) dose = 200 units — split into 2 injections OR use lower concentration
        vialMg: 10,
        recommendedBacWaterMl: 4,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 2,
            concentrationMgPerMl: 5.0,
            mcgPerUnit: 50,
            notes: "5mg/mL — half vial (5mg) = 100 units. Good for daily half-vial dosing.",
          },
        ],
        notes: "At 2.5mg/mL: full 10mg vial dose = 40 units per injection. Clean single-injection option. Half vial = 20 units.",
      },
      {
        // 20mg / 8mL = 2.5 mg/mL
        vialMg: 20,
        recommendedBacWaterMl: 8,
        concentrationMgPerMl: 2.5,
        mcgPerUnit: 25,
        unitsFor100mcg: 4,
        alternativeDilutions: [
          {
            bacWaterMl: 4,
            concentrationMgPerMl: 5.0,
            mcgPerUnit: 50,
            notes: "5mg/mL — 10mg dose = 200 units — split into 2 injections.",
          },
        ],
        notes: "20mg blend vial provides 2 full-dose sessions or 4 half-dose sessions.",
      },
    ],
    sideEffects: [
      "See individual BPC-157 and TB-500 entries",
      "Mild injection site reactions",
      "Temporary fatigue (TB-500 component)",
    ],
    contraindications: [
      "Active malignancy",
      "Pregnancy",
      "See individual contraindications for BPC-157 and TB-500",
    ],
    researchNotes: "The BPC-157 + TB-500 combination is the most extensively used peptide recovery stack in research and athletic communities. Complementary mechanisms address both local (BPC-157) and systemic (TB-500) tissue healing. Pre-blended vials offer convenience and consistent ratio.",
    stackNotes: "KPV is sometimes added as the third component (Tri-Heal blend). GH secretagogues (CJC-1295 + Ipamorelin) added for comprehensive recovery + body composition protocols.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "cjc-1295-ipamorelin-blend-10mg",
    name: "CJC-1295 (No DAC) + Ipamorelin Blend (10mg)",
    aliases: ["GH Blend 10mg", "CJC/Ipa Blend", "CJC Ipamorelin 10mg", "GH Stack Blend"],
    category: ["GH Secretagogue"],
    mechanism: "Pre-blended combination of CJC-1295 No DAC (5mg) and Ipamorelin (5mg). CJC-1295 No DAC acts as a GHRH analog stimulating pituitary GH release through GHRH receptors, while Ipamorelin acts as a GHRP through ghrelin receptors. These two mechanisms are synergistic — combined administration produces significantly greater GH pulse amplitude than either alone. Ipamorelin's selectivity prevents the cortisol and prolactin elevation seen with GHRP-2 or GHRP-6. This is the gold standard GH secretagogue research stack.",
    researchStatus: "Both components individually are research use only; combination is the most widely used GH research stack",
    dosingRanges: {
      low: 200,
      moderate: 400,
      high: 600,
      unit: "mcg",
      perDose: true,
      titrationNotes: "Standard: 200–300 mcg of each (400–600 mcg total blend) subcutaneously 1–3x daily. Administer fasted or 90+ minutes from meals. Before bed injection is most popular. Reconstitute as single vial and draw each dose from reconstituted solution.",
      route: ["subcutaneous"],
    },
    frequency: "1–3x daily",
    cycleLength: "8–16 weeks",
    halfLife: "CJC-1295 NoDac: ~30 min; Ipamorelin: ~2 hours",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "Both peptides stable together in solution. Standard reconstitution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 10, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 10mg / 5mL = 2 mg/mL | mcgPerUnit = 20 | unitsFor100mcg = 5
        // 300mcg of each = 600mcg total = 30 units at 2mg/mL
        vialMg: 10,
        recommendedBacWaterMl: 5,
        concentrationMgPerMl: 2.0,
        mcgPerUnit: 20,
        unitsFor100mcg: 5,
        alternativeDilutions: [
          {
            bacWaterMl: 2.5,
            concentrationMgPerMl: 4.0,
            mcgPerUnit: 40,
            notes: "4mg/mL — 300mcg total dose = 7.5 units. Smaller injection volume, less precise measurement.",
          },
        ],
        notes: "At 2mg/mL: 300mcg of each (600mcg total) = 30 units on U-100. Very clean measurement. Since this is a 1:1 blend, drawing 30 units delivers 300mcg CJC + 300mcg Ipa.",
      },
    ],
    sideEffects: [
      "See individual CJC-1295 No DAC and Ipamorelin entries",
      "Increased hunger (mild — Ipamorelin is selective)",
      "Water retention",
      "Drowsiness (if dosed during day)",
    ],
    contraindications: [
      "Active malignancy",
      "Pregnancy",
      "Acromegaly",
      "Insulin-dependent diabetes",
    ],
    researchNotes: "The gold standard GH research stack. GHRH + GHRP synergy produces pulse amplitude far exceeding either alone. Ipamorelin's clean profile (no cortisol/prolactin elevation) makes this the preferred combination vs alternatives using GHRP-2 or GHRP-6.",
    stackNotes: "Often combined with BPC-157 + TB-500 for comprehensive recovery + GH protocols. AOD-9604 added for fat loss. Tesamorelin sometimes substituted for CJC-1295 No DAC.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

  {
    id: "tri-heal-blend-45mg",
    name: "Tri-Heal Blend (TB-500 25mg + BPC-157 10mg + KPV 10mg)",
    aliases: ["Tri-Heal", "Tri Heal 45mg", "BPC TB KPV Blend", "Triple Recovery Blend"],
    category: ["Recovery & Repair", "Immune"],
    mechanism: "The Tri-Heal blend combines three complementary healing peptides: TB-500 (25mg) for systemic tissue repair via actin regulation and angiogenesis; BPC-157 (10mg) for local tissue repair, GI protection, and anti-inflammatory cytokine modulation; and KPV (10mg) for targeted anti-inflammatory resolution via NF-κB suppression and melanocortin receptor activation. The three mechanisms address systemic healing, local repair, and inflammatory resolution simultaneously, making this the most comprehensive single-vial recovery blend available.",
    researchStatus: "All three components individually are preclinical/RUO; combination is RUO; designed for comprehensive recovery",
    dosingRanges: {
      low: 5,
      moderate: 10,
      high: 15,
      unit: "mg",
      perDose: true,
      titrationNotes: "Full vial divided over 2–3 injections per week (acute) or 1 injection per week (maintenance). Typical injection: draw proportional amount — e.g., one-third of reconstituted vial per injection for 3x/week protocol.",
      route: ["subcutaneous", "intramuscular"],
    },
    frequency: "2–3x per week (acute) / Once weekly (maintenance)",
    cycleLength: "4–8 weeks",
    halfLife: "Combined kinetics: BPC-157 ~4h, TB-500 ~3–10 days, KPV ~2–3h",
    storageInfo: {
      powder: "Store at -20°C, dark and dry.",
      reconstituted: "Refrigerate at 2–8°C. Use within 28 days.",
      notes: "All three components stable together in reconstituted solution.",
    },
    stability: {
      powderDays: 730,
      reconstitutedFridgeDays: 28,
      reconstitutedFreezerDays: null,
    },
    commonVialSizes: [
      { mg: 45, unit: "mg", isCommon: true },
    ],
    reconstitutionRatios: [
      {
        // 45mg / 9mL = 5 mg/mL | mcgPerUnit = 50 | unitsFor100mcg = 2
        // One-third vial dose (15mg total) = 30 units
        vialMg: 45,
        recommendedBacWaterMl: 9,
        concentrationMgPerMl: 5.0,
        mcgPerUnit: 50,
        unitsFor100mcg: 2,
        alternativeDilutions: [
          {
            bacWaterMl: 18,
            concentrationMgPerMl: 2.5,
            mcgPerUnit: 25,
            notes: "2.5mg/mL — one-third vial (15mg total) = 60 units. Larger volume, easier to divide into 3 precise weekly injections.",
          },
        ],
        notes: "At 5mg/mL: full 45mg vial in 9mL. For 3x/week protocol: draw 30 units per injection (= 15mg = 1/3 vial). For once weekly: draw 90 units (= 45mg = full vial, split into 2 injection sites).",
      },
    ],
    sideEffects: [
      "See individual BPC-157, TB-500, and KPV entries",
      "Generally well tolerated",
      "Mild injection site reactions",
    ],
    contraindications: [
      "Active malignancy",
      "Pregnancy",
      "See individual contraindications for each component",
    ],
    researchNotes: "The Tri-Heal blend represents the most comprehensive single-vial recovery protocol, combining systemic healing (TB-500), local repair (BPC-157), and inflammatory resolution (KPV). Particularly relevant for GI inflammation combined with systemic tissue repair protocols.",
    stackNotes: "Sometimes combined with GH secretagogue blend (CJC + Ipa) for comprehensive recovery + anabolism. Thymosin Alpha-1 added for immune support.",
    disclaimer: "For research use only. Not approved for human therapeutic use.",
  },

];
