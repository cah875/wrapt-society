// Vercel serverless function: GTIN → enriched device record via the FDA's public
// GUDID (Global Unique Device Identification Database). Free, no key required.
//
// GET /api/gudid?gtin=00844588000036
//   → { gtin, name, brandName, company, model, ...enriched fields }
//
// Proxied server-side to avoid browser CORS issues and to normalize the result.
// Returns far more than a name: catalog number, device description, GMDN clinical
// term, FDA product code, packaging hierarchy, sterilization, sizes, HCT/P flag,
// MRI safety, Rx/OTC, and which production identifiers the label carries. This is
// the data that feeds the Item Master / Meditech catalog.
import { sendJson } from './_lib.js';
import { isAuthed } from './_auth.js';

const LOOKUP_URL = 'https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json';

/** Coerce GUDID's "true"/"false"/"" strings into a real boolean (or null). */
function boolish(v) {
  if (v === true || v === 'true' || v === 'Y' || v === 'yes') return true;
  if (v === false || v === 'false' || v === 'N' || v === 'no') return false;
  return null;
}

/** Always return an array, whether GUDID gave us one item, many, or none. */
function arr(v) {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined || v === '') return [];
  return [v];
}

const str = (v) => (v === null || v === undefined ? '' : String(v).trim());

export default async function handler(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Please log in.' });

  const gtin = (req.query?.gtin || '').toString().replace(/\D/g, '');
  if (!gtin) return sendJson(res, 400, { error: 'Missing gtin parameter.' });

  try {
    const resp = await fetch(`${LOOKUP_URL}?di=${encodeURIComponent(gtin)}`, {
      headers: { Accept: 'application/json' },
    });

    if (resp.status === 404) {
      return sendJson(res, 404, { error: 'GTIN not found in GUDID.', gtin, found: false });
    }
    if (!resp.ok) {
      return sendJson(res, 502, { error: `GUDID lookup failed (${resp.status}).`, gtin });
    }

    const data = await resp.json();
    const device = data?.gudid?.device || {};

    const brandName = str(device.brandName);
    const model = str(device.versionModelNumber);
    const company = str(device.companyName);
    const catalogNumber = str(device.catalogNumber);

    // Friendly composed name: "Company BrandName Model" (backward compatible).
    const name = [company, brandName, model].map(str).filter(Boolean).join(' ').trim();

    // ── GMDN clinical category (term + plain-language definition) ─────────────
    const gmdnList = arr(device.gmdnTerms?.gmdn);
    const gmdn = gmdnList[0]
      ? {
          term: str(gmdnList[0].gmdnPTName),
          definition: str(gmdnList[0].gmdnPTDefinition),
          code: str(gmdnList[0].gmdnCode),
        }
      : null;

    // ── FDA product code ──────────────────────────────────────────────────────
    const pcList = arr(device.productCodes?.fdaProductCode);
    const productCode = pcList[0]
      ? { code: str(pcList[0].productCode), name: str(pcList[0].productCodeName) }
      : null;

    // ── Device sizes / dimensions ─────────────────────────────────────────────
    const sizes = arr(device.deviceSizes?.deviceSize).map((s) => ({
      type: str(s.sizeType),
      value: str(s.size?.value ?? s.value),
      unit: str(s.size?.unit ?? s.unit),
      text: str(s.sizeText),
    }));

    // ── Sterilization (fields appear at device level and/or nested) ───────────
    const sterilization = device.sterilization || {};
    const sterilizationMethods = arr(
      sterilization.methodTypes?.sterilizationMethod ?? device.methodTypes?.sterilizationMethod
    ).map(str);

    // ── Packaging hierarchy ───────────────────────────────────────────────────
    // GUDID lists the primary DI plus one entry per package level. Each package
    // level says how many of the contained DI it holds (e.g. Box of 5, Case of 4
    // boxes), which is exactly the "packaging string" for the item master.
    const identifiers = arr(device.identifiers?.identifier);
    const packaging = identifiers
      .filter((id) => str(id.deviceIdType).toLowerCase() === 'package')
      .map((id) => ({
        gtin: str(id.deviceId),
        type: str(id.pkgType),
        quantity: str(id.pkgQuantity),
        contains: str(id.containsDINumber),
        status: str(id.pkgStatus),
      }));
    const primaryId = identifiers.find(
      (id) => str(id.deviceIdType).toLowerCase() === 'primary'
    );
    const issuingAgency = str(primaryId?.deviceIdIssuingAgency);

    return sendJson(res, 200, {
      found: true,
      gtin,
      name: name || brandName || '',
      brandName,
      company,
      model,
      catalogNumber,
      description: str(device.deviceDescription),
      gmdn,
      productCode,
      // Production identifiers the label carries (drives which fields to capture).
      hasLot: boolish(device.lotBatch),
      hasSerial: boolish(device.serialNumber),
      hasExpiration: boolish(device.expirationDate),
      hasManufacturingDate: boolish(device.manufacturingDate),
      hasDonationId: boolish(device.donationIdNumber),
      // Clinical / regulatory attributes.
      singleUse: boolish(device.singleUse),
      sterile: boolish(device.deviceSterile ?? sterilization.deviceSterile),
      sterilizationPriorToUse: boolish(
        device.sterilizationPriorToUse ?? sterilization.sterilizationPriorToUse
      ),
      sterilizationMethods,
      hctp: boolish(device.deviceHCTP), // human cell/tissue product → biologic
      kit: boolish(device.deviceKit),
      combinationProduct: boolish(device.deviceCombinationProduct),
      rx: boolish(device.rx),
      otc: boolish(device.otc),
      mriSafety: str(device.MRISafetyStatus),
      containsLatex: boolish(device.labeledContainsNRL),
      sizes,
      packaging,
      issuingAgency,
      distributionStatus: str(device.deviceCommDistributionStatus),
      distributionEndDate: str(device.deviceCommDistributionEndDate),
      versionDate: str(device.devicePublishDate),
    });
  } catch (err) {
    return sendJson(res, 502, { error: err.message || 'GUDID lookup error.', gtin });
  }
}
