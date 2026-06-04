import { useMemo, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { SearchIcon, RefreshIcon } from './Icons.jsx';
import { daysUntil, statusFor, displayDate } from '../lib/dates.js';

/** KPI tile. */
function Stat({ label, value, sub, tone = 'default' }) {
  const toneCls =
    tone === 'danger'
      ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
      : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
      : 'border-clinical-200 bg-white dark:border-clinical-800 dark:bg-clinical-900';
  return (
    <div className={`rounded-2xl border p-4 ${toneCls}`}>
      <div className="text-3xl font-bold text-clinical-800 dark:text-clinical-50">{value}</div>
      <div className="text-sm font-medium text-clinical-600 dark:text-clinical-300">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-clinical-400">{sub}</div>}
    </div>
  );
}

/**
 * Inventory overview: KPIs, search/filter, recent items, and a grouped-by-date
 * view. Reads from the local cache (kept in sync with the sheet).
 */
export default function Dashboard({ entries, settings, syncing, onRefresh }) {
  const [query, setQuery] = useState('');
  const [groupByDate, setGroupByDate] = useState(false);
  const alertDays = settings.alertDays || 30;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.product?.toLowerCase().includes(q) ||
        e.lot?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let expiringSoonUnits = 0;
    let expiringSoonItems = 0;
    let expiredUnits = 0;
    for (const e of entries) {
      totalUnits += e.quantity || 0;
      const d = daysUntil(e.expiration);
      if (d !== null && d < 0) expiredUnits += e.quantity || 0;
      else if (d !== null && d <= alertDays) {
        expiringSoonUnits += e.quantity || 0;
        expiringSoonItems += 1;
      }
    }
    return { totalUnits, expiringSoonUnits, expiringSoonItems, expiredUnits, distinct: entries.length };
  }, [entries, alertDays]);

  const grouped = useMemo(() => {
    if (!groupByDate) return null;
    const map = new Map();
    for (const e of filtered) {
      const key = e.expiration || 'No date';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === 'No date') return 1;
      if (b[0] === 'No date') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered, groupByDate]);

  const recent = filtered.slice(0, 10);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total units" value={stats.totalUnits} sub={`${stats.distinct} distinct items`} />
        <Stat
          label="Expiring soon"
          value={stats.expiringSoonUnits}
          sub={`${stats.expiringSoonItems} items · ≤${alertDays} days`}
          tone={stats.expiringSoonUnits > 0 ? 'warn' : 'default'}
        />
        <Stat
          label="Expired units"
          value={stats.expiredUnits}
          sub="Remove from inventory"
          tone={stats.expiredUnits > 0 ? 'danger' : 'default'}
        />
        <div className="flex items-center justify-center rounded-2xl border border-clinical-200 bg-white p-4 dark:border-clinical-800 dark:bg-clinical-900">
          <button onClick={onRefresh} className="btn-ghost w-full" disabled={syncing}>
            <RefreshIcon width={20} height={20} className={syncing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            width={20}
            height={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-clinical-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, lot, or location…"
            className="field-input pl-10"
            aria-label="Search inventory"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-clinical-600 dark:text-clinical-300">
          <input
            type="checkbox"
            checked={groupByDate}
            onChange={(e) => setGroupByDate(e.target.checked)}
            className="h-5 w-5"
          />
          Group by expiration date
        </label>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center text-clinical-500">
          {entries.length === 0
            ? 'No items logged yet. Capture a photo to get started.'
            : 'No items match your search.'}
        </div>
      ) : groupByDate ? (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-clinical-800 dark:text-clinical-50">
                  {date === 'No date' ? 'No expiration date' : displayDate(date)}
                </h3>
                {date !== 'No date' && (
                  <StatusBadge expiration={date} alertDays={alertDays} />
                )}
              </div>
              <ItemTable items={items} alertDays={alertDays} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <h3 className="mb-3 font-bold text-clinical-800 dark:text-clinical-50">
            Recent items {filtered.length > 10 && <span className="text-clinical-400">(last 10)</span>}
          </h3>
          <ItemTable items={recent} alertDays={alertDays} />
        </div>
      )}
    </div>
  );
}

function ItemTable({ items, alertDays }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-clinical-200 text-clinical-500 dark:border-clinical-700">
            <th className="py-2 pr-3 font-semibold">Product</th>
            <th className="py-2 pr-3 font-semibold">Qty</th>
            <th className="py-2 pr-3 font-semibold">Lot</th>
            <th className="py-2 pr-3 font-semibold">Expires</th>
            <th className="py-2 pr-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => {
            const s = statusFor(e.expiration, alertDays);
            return (
              <tr
                key={e.id}
                className="border-b border-clinical-100 last:border-0 dark:border-clinical-800"
              >
                <td className="py-2 pr-3">
                  <div className="font-medium text-clinical-800 dark:text-clinical-100">
                    {e.product}
                    {!e.synced && (
                      <span
                        className="ml-2 align-middle text-xs font-normal text-status-warn"
                        title={e.syncError || 'Not yet saved to the Excel file'}
                      >
                        ● not saved
                      </span>
                    )}
                  </div>
                  {e.location && (
                    <div className="text-xs text-clinical-400">{e.location}</div>
                  )}
                </td>
                <td className="py-2 pr-3 font-bold">
                  {e.quantity} <span className="font-normal text-clinical-400">{e.unit}</span>
                </td>
                <td className="py-2 pr-3 text-clinical-600 dark:text-clinical-300">{e.lot || '—'}</td>
                <td className="py-2 pr-3 text-clinical-600 dark:text-clinical-300">
                  {displayDate(e.expiration)}
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge expiration={e.expiration} alertDays={alertDays} showDays={false} />
                  {s.days !== null && (
                    <span className="ml-1 text-xs text-clinical-400">
                      {s.days < 0 ? `${Math.abs(s.days)}d ago` : `${s.days}d`}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
