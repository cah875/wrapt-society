import { useCallback, useEffect, useRef, useState } from 'react';
import { loadInventory, saveInventory, newId } from '../lib/storage.js';
import { appendRows } from '../lib/api.js';
import { daysUntil, statusFor } from '../lib/dates.js';

/** Map a status code to the human label written to the sheet. */
function statusLabel(entry, alertDays) {
  return statusFor(entry.expiration, alertDays).label;
}

/** Build the array row payload for the Sheets API from a local entry. */
function toSheetRow(entry, alertDays) {
  return {
    timestamp: entry.timestamp,
    product: entry.product,
    expiration: entry.expiration || '',
    lot: entry.lot || '',
    quantity: entry.quantity,
    unit: entry.unit,
    daysUntil: daysUntil(entry.expiration) ?? '',
    status: statusLabel(entry, alertDays),
    location: entry.location || '',
  };
}

/**
 * Inventory state machine: keeps a local cache (dashboard + offline queue) and
 * syncs entries to Google Sheets, retrying unsynced rows when back online.
 */
export function useInventory(settings) {
  const [entries, setEntries] = useState(() => loadInventory());
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Persist on every change.
  useEffect(() => {
    saveInventory(entries);
  }, [entries]);

  // Track connectivity.
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  /** Find an existing entry matching product + lot + expiration. */
  const findDuplicate = useCallback(
    ({ product, lot, expiration }) => {
      const norm = (s) => (s || '').trim().toLowerCase();
      return entries.find(
        (e) =>
          norm(e.product) === norm(product) &&
          norm(e.lot) === norm(lot) &&
          (e.expiration || '') === (expiration || '')
      );
    },
    [entries]
  );

  /** Push any unsynced entries to the sheet. Best-effort, safe to call often. */
  const syncPending = useCallback(async () => {
    const cfg = settingsRef.current;
    if (!cfg?.sheetId && !cfg?.googleServiceAccountJson) return; // not configured
    if (!navigator.onLine) return;

    const pending = entries.filter((e) => !e.synced);
    if (!pending.length) return;

    setSyncing(true);
    try {
      const rows = pending.map((e) => toSheetRow(e, cfg.alertDays));
      await appendRows(rows, cfg);
      const ids = new Set(pending.map((e) => e.id));
      setEntries((prev) =>
        prev.map((e) => (ids.has(e.id) ? { ...e, synced: true, syncError: null } : e))
      );
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) => (!e.synced ? { ...e, syncError: err.message } : e))
      );
    } finally {
      setSyncing(false);
    }
  }, [entries]);

  // Retry pending whenever we (re)gain connectivity.
  useEffect(() => {
    if (online) syncPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  /**
   * Add a brand-new entry (or, when `mergeIntoId` is given, add quantity to an
   * existing one). Attempts an immediate sync; falls back to the offline queue.
   * Returns the resulting entry and whether the sheet write succeeded.
   */
  const addEntry = useCallback(
    async (data, mergeIntoId = null) => {
      const cfg = settingsRef.current;
      let resultEntry;

      if (mergeIntoId) {
        // Increment an existing entry's quantity and re-log the delta.
        setEntries((prev) =>
          prev.map((e) =>
            e.id === mergeIntoId
              ? {
                  ...e,
                  quantity: e.quantity + data.quantity,
                  timestamp: new Date().toISOString(),
                  synced: false,
                }
              : e
          )
        );
        const base = entries.find((e) => e.id === mergeIntoId);
        resultEntry = base
          ? { ...base, quantity: base.quantity + data.quantity }
          : null;
      } else {
        resultEntry = {
          id: newId(),
          timestamp: new Date().toISOString(),
          product: data.product || 'Unknown product',
          expiration: data.expiration || '',
          lot: data.lot || '',
          quantity: data.quantity,
          unit: data.unit || 'each',
          location: data.location || cfg.location || '',
          synced: false,
          syncError: null,
        };
        setEntries((prev) => [resultEntry, ...prev]);
      }

      // Attempt immediate sync of just this change.
      let synced = false;
      let error = null;
      const configured = cfg?.sheetId || cfg?.googleServiceAccountJson;
      if (configured && navigator.onLine && resultEntry) {
        try {
          await appendRows([toSheetRow(resultEntry, cfg.alertDays)], cfg);
          synced = true;
          setEntries((prev) =>
            prev.map((e) =>
              e.id === resultEntry.id ? { ...e, synced: true, syncError: null } : e
            )
          );
        } catch (err) {
          error = err.message;
          setEntries((prev) =>
            prev.map((e) =>
              e.id === resultEntry.id ? { ...e, syncError: err.message } : e
            )
          );
        }
      }

      return { entry: resultEntry, synced, error, configured: Boolean(configured) };
    },
    [entries]
  );

  const clearLocal = useCallback(() => setEntries([]), []);

  const pendingCount = entries.filter((e) => !e.synced).length;

  return {
    entries,
    online,
    syncing,
    pendingCount,
    findDuplicate,
    addEntry,
    syncPending,
    clearLocal,
  };
}
