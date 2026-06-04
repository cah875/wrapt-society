import { useMemo } from 'react';
import { buildMeditechCsv, catalogToCsv, downloadCsv, missingRequired } from '../lib/catalog.js';

/**
 * Right-column view for Catalog mode: the Item Master list plus one-click
 * exports (Meditech ItemTemplate format, or the full enriched dataset).
 */
export default function CatalogView({ items = [], lookups, onRefresh }) {
  const today = new Date().toISOString().slice(0, 10);

  const incomplete = useMemo(
    () => items.filter((it) => missingRequired(it, lookups).length > 0).length,
    [items, lookups]
  );

  const exportMeditech = () => {
    downloadCsv(buildMeditechCsv(items, lookups), `meditech-item-master-${today}.csv`);
  };
  const exportFull = () => {
    downloadCsv(catalogToCsv(items), `item-master-full-${today}.csv`);
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
          Item Master
        </h2>
        <span className="badge bg-clinical-100 text-clinical-600 dark:bg-clinical-800 dark:text-clinical-300">
          {items.length} product{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={exportMeditech} disabled={!items.length} className="btn-primary">
          ⬇ Meditech CSV
        </button>
        <button onClick={exportFull} disabled={!items.length} className="btn-ghost">
          ⬇ Full data CSV
        </button>
      </div>

      {incomplete > 0 && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          {incomplete} item{incomplete === 1 ? '' : 's'} still missing a required field (excludes
          finance fields MM completes).
        </p>
      )}

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-clinical-400">
          No products catalogued yet. Scan or photograph a product to build its master record.
        </p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-clinical-400 dark:bg-clinical-900">
              <tr>
                <th className="py-2 pr-2">Product</th>
                <th className="py-2 pr-2">Mfr</th>
                <th className="py-2 pr-2">Cat</th>
                <th className="py-2">REF / GTIN</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const miss = missingRequired(it, lookups);
                return (
                  <tr key={(it.gtin || it.catalogNumber || it.product) + i}
                    className="border-t border-clinical-100 align-top dark:border-clinical-800">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-clinical-800 dark:text-clinical-100">
                        {it.product || '(unnamed)'}
                      </div>
                      {miss.length > 0 && (
                        <div className="text-xs text-status-warn">needs: {miss.join(', ')}</div>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-clinical-600 dark:text-clinical-300">{it.manufacturer}</td>
                    <td className="py-2 pr-2 text-clinical-600 dark:text-clinical-300">{it.category}</td>
                    <td className="py-2 font-mono text-xs text-clinical-500">
                      <div>{it.catalogNumber}</div>
                      <div>{it.gtin}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {onRefresh && (
        <button onClick={onRefresh} className="btn-ghost w-full text-sm">
          Refresh from file
        </button>
      )}
    </div>
  );
}
