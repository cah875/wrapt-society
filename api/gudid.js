// Vercel serverless function: GTIN/REF → enriched device record.
//
// Lookup waterfall (stops at first hit):
//   1. GUDID v3  — by GTIN-14 as scanned
//   2. GUDID v3  — by GTIN with packaging-indicator digit stripped (some
//                  labels print the package-level GTIN, not the primary DI)
//   3. openFDA   — by GTIN  (covers Class II devices not yet in GUDID)
//   4. openFDA   — by catalog/REF number (handles GTIN drift — same product,
//                  updated barcode, stale FDA registration)
//
// GET /api/gudid?gtin=10884389129159&ref=DYNJAA04
//   → { found, source, gtin, name, company, ...enriched fields }
//
// Proxied server-side to avoid CORS and normalise both APIs into one schema.
import { sendJson } from './_lib.js';
import { isAuthed } from './_auth.js';

const GUDID_URL = 'https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json';
const OPENFDA_URL = 'https://api.fda.gov/device/udi.json';

const bool = (v) => {
  if (v === true || v === 'true' || v === 'Y' || v === 'yes') return true;
  if (v === false || v === 'false' || v === 'N' || v === 'no') return false;
  return null;
};
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const str = (v) => (v == null ? '' : String(v).trim());

// ── GUDID lookup ─────────────────────────────────────────────────────────────

async function fromGudid(di) {
  const resp = await fetch(`${GUDID_URL}?di=${encodeURIComponent(di)}`, {
    headers: { Accept: 'application/json' },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GUDID ${resp.status}`);
  const data = await resp.json();
  if (data?.error) return null;
  const device = data?.gudid?.device;
  if (!device) return null;
  return normalizeGudid(device, di);
}

function normalizeGudid(device, resolvedDi) {
  const brandName = str(device.brandName);
  const model = str(device.versionModelNumber);
  const company = str(device.companyName);
  const catalogNumber = str(device.catalogNumber);
  const name = [company, brandName, model].filter(Boolean).join(' ').trim();

  const gmdnList = arr(device.gmdnTerms?.gmdn);
  const gmdn = gmdnList[0]
    ? { term: str(gmdnList[0].gmdnPTName), definition: str(gmdnList[0].gmdnPTDefinition), code: str(gmdnList[0].gmdnCode) }
    : null;

  const pcList = arr(device.productCodes?.fdaProductCode);
  const productCode = pcList[0]
    ? { code: str(pcList[0].productCode), name: str(pcList[0].productCodeName) }
    : null;

  const sizes = arr(device.deviceSizes?.deviceSize).map((s) => ({
    type: str(s.sizeType), value: str(s.size?.value ?? s.value),
    unit: str(s.size?.unit ?? s.unit), text: str(s.sizeText),
  }));

  const sterilization = device.sterilization || {};
  const sterilizationMethods = arr(
    sterilization.methodTypes?.sterilizationMethod ?? device.methodTypes?.sterilizationMethod
  ).map(str);

  const identifiers = arr(device.identifiers?.identifier);
  const packaging = identifiers
    .filter((id) => str(id.deviceIdType).toLowerCase() === 'package')
    .map((id) => ({ gtin: str(id.deviceId), type: str(id.pkgType), quantity: str(id.pkgQuantity), contains: str(id.containsDINumber), status: str(id.pkgStatus) }));
  const primaryId = identifiers.find((id) => str(id.deviceIdType).toLowerCase() === 'primary');

  return {
    source: 'GUDID',
    gtin: resolvedDi,
    name: name || brandName || '',
    brandName, company, model, catalogNumber,
    description: str(device.deviceDescription),
    gmdn, productCode,
    hasLot: bool(device.lotBatch),
    hasSerial: bool(device.serialNumber),
    hasExpiration: bool(device.expirationDate),
    hasManufacturingDate: bool(device.manufacturingDate),
    hasDonationId: bool(device.donationIdNumber),
    singleUse: bool(device.singleUse),
    sterile: bool(device.deviceSterile ?? sterilization.deviceSterile),
    sterilizationPriorToUse: bool(device.sterilizationPriorToUse ?? sterilization.sterilizationPriorToUse),
    sterilizationMethods,
    hctp: bool(device.deviceHCTP),
    kit: bool(device.deviceKit),
    combinationProduct: bool(device.deviceCombinationProduct),
    rx: bool(device.rx),
    otc: bool(device.otc),
    mriSafety: str(device.MRISafetyStatus),
    containsLatex: bool(device.labeledContainsNRL),
    sizes, packaging,
    issuingAgency: str(primaryId?.deviceIdIssuingAgency),
    distributionStatus: str(device.deviceCommDistributionStatus),
    distributionEndDate: str(device.deviceCommDistributionEndDate),
    versionDate: str(device.devicePublishDate),
  };
}

// ── openFDA lookup ────────────────────────────────────────────────────────────

async function fromOpenFda(query) {
  const resp = await fetch(`${OPENFDA_URL}?search=${encodeURIComponent(query)}&limit=1`, {
    headers: { Accept: 'application/json' },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`openFDA ${resp.status}`);
  const data = await resp.json();
  const r = data?.results?.[0];
  if (!r) return null;
  return normalizeOpenFda(r);
}

function normalizeOpenFda(r) {
  const identifiers = arr(r.identifiers);
  const primary = identifiers.find((id) => id.type === 'Primary');
  const packages = identifiers
    .filter((id) => id.type === 'Package')
    .map((id) => ({ gtin: str(id.id), type: str(id.package_type), quantity: str(id.quantity_per_package), contains: '', status: str(id.package_status) }));

  // openFDA's GMDN record includes an explicit implantable flag — surface it so
  // the catalog can set Implantable: N without requiring keyword guessing.
  const gmdn = r.gmdn_terms?.[0]
    ? {
        term: str(r.gmdn_terms[0].name),
        definition: str(r.gmdn_terms[0].definition),
        code: str(r.gmdn_terms[0].code),
        implantable: bool(r.gmdn_terms[0].is_implantable ?? r.gmdn_terms[0].implantable),
      }
    : null;

  const pc = r.product_codes?.[0]
    ? { code: str(r.product_codes[0].code), name: str(r.product_codes[0].name) }
    : null;

  const company = str(r.company_name);
  const brandName = str(r.brand_name);
  const model = str(r.version_or_model_number);
  const catalogNumber = str(r.catalog_number);
  const name = [company, brandName, model].filter(Boolean).join(' ').trim();

  const steril = r.sterilization || {};

  return {
    source: 'openFDA',
    gtin: str(primary?.id || r.identifiers?.[0]?.id || ''),
    name: name || brandName || '',
    brandName, company, model, catalogNumber,
    description: str(r.device_description),
    gmdn, productCode: pc,
    hasLot: bool(r.has_lot_or_batch_number),
    hasSerial: bool(r.has_serial_number),
    hasExpiration: bool(r.has_expiration_date),
    hasManufacturingDate: bool(r.has_manufacturing_date),
    hasDonationId: bool(r.has_donation_id_number),
    singleUse: bool(r.is_single_use),
    sterile: bool(steril.is_sterile),
    sterilizationPriorToUse: bool(steril.is_sterilization_prior_use),
    sterilizationMethods: arr(steril.sterilization_methods).map(str),
    hctp: bool(r.is_hct_p),
    kit: bool(r.is_kit),
    combinationProduct: bool(r.is_combination_product),
    rx: bool(r.is_rx),
    otc: bool(r.is_otc),
    mriSafety: str(r.mri_safety),
    containsLatex: bool(r.is_labeled_as_nrl),
    sizes: [],
    packaging: packages,
    issuingAgency: str(primary?.issuing_agency),
    distributionStatus: str(r.commercial_distribution_status),
    distributionEndDate: str(r.commercial_distribution_end_date),
    versionDate: str(r.publish_date),
  };
}

// ── GTIN variant helpers ──────────────────────────────────────────────────────

/**
 * A GTIN-14 whose first digit is the packaging-level indicator (1–8) can be
 * stripped to derive the base GTIN-13 (zero-padded to 14). Some labels print
 * the package-level GTIN while the FDA records the item-level DI.
 */
function stripPackagingIndicator(gtin14) {
  if (gtin14.length !== 14) return null;
  const indicator = gtin14[0];
  if (indicator === '0') return null; // already base
  return '0' + gtin14.slice(1);
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Please log in.' });

  const gtin = (req.query?.gtin || '').toString().replace(/\D/g, '');
  const ref = (req.query?.ref || '').toString().trim();

  if (!gtin && !ref) return sendJson(res, 400, { error: 'Missing gtin or ref parameter.' });

  try {
    let result = null;

    // 1. GUDID by GTIN as scanned
    if (gtin) result = await fromGudid(gtin);

    // 2. GUDID by GTIN with packaging indicator stripped
    if (!result && gtin) {
      const alt = stripPackagingIndicator(gtin);
      if (alt) result = await fromGudid(alt);
    }

    // 3. openFDA by GTIN
    if (!result && gtin) result = await fromOpenFda(`identifiers.id:${gtin}`);

    // 4. openFDA by REF/catalog number
    if (!result && ref) result = await fromOpenFda(`catalog_number:${ref}`);

    if (!result) {
      return sendJson(res, 404, {
        error: 'Device not found in GUDID or openFDA.',
        gtin, ref, found: false,
      });
    }

    return sendJson(res, 200, { found: true, ...result });
  } catch (err) {
    return sendJson(res, 502, { error: err.message || 'Device lookup error.', gtin, ref });
  }
}
