// Catalog-number normalization shared by the CSV importer and the engine.
// Billsheets print catalog numbers with dashes (1365-40-720); the contract
// CSV stores them without (136540720). Strip everything non-alphanumeric and
// uppercase so the two always line up.
export function normalizeCatalog(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
