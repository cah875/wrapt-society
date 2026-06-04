import { useCallback, useEffect, useRef, useState } from 'react';
import { loadInventory, saveInventory, newId } from '../lib/storage.js';
import { daysUntil, statusFor } from '../lib/dates.js';
import * as excel from '../lib/excel.js';

/** Build the Excel row payload from a local entry (status/days computed now). */
function toRow(entry, alertDays) {
  return {
    timestamp: formatTimestamp(entry.timestamp),
    product: entry.product,
    expiration: entry.expiration || '',
    lot: entry.lot || '',
    quantity: entry.quantity,
    unit: entry.unit,
    daysUntil: daysUntil(entry.expiration) ?? '',
    status: statusFor(entry.expiration, alertDays).label,
    location: entry.location || '',
  };
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Excel connection states surfaced to the UI. */
export const EXCEL_STATE = {
  UNSUPPORTED: 'unsupported',
  DISCONNECTED: 'disconnected',
  NEEDS_PERMISSION: 'needs-permission',
  CONNECTED: 'connected',
};

/**
 * Inventory state machine. Keeps a local cache (dashboard, duplicate detection,
 * and offline queue) and persists each entry to a local Excel file via the File
 * System Access API. Entries that can't be written are queued and retried.
 */
export function useInventory(settings, onSettingsChange) {
  const [entries, setEntries] = useState(() => loadInventory());
  const [excelState, setExcelState] = useState(
    excel.isSupported() ? EXCEL_STATE.DISCONNECTED : EXCEL_STATE.UNSUPPORTED
  );
  const [fileName, setFileName] = useState(settings.excelFileName || '');
  const [busy, setBusy] = useState(false);
  const [excelError, setExcelError] = useState('');

  const handleRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onSettingsChangeRef = useRef(onSettingsChange);
  onSettingsChangeRef.current = onSettingsChange;

  // Persist cache on every change.
  useEffect(() => {
    saveInventory(entries);
  }, [entries]);

  const connected = excelState === EXCEL_STATE.CONNECTED;

  /** Replace the cache with the file's contents (most-recent first). */
  const importFromFile = useCallback(async () => {
    const handle = handleRef.current;
    if (!handle) return;
    const rows = await excel.readAllEntries(handle);
    const mapped = rows
      .map((r) => ({
        id: newId(),
        timestamp: r.timestamp,
        product: r.product,
        expiration: r.expiration,
        lot: r.lot,
        quantity: r.quantity,
        unit: r.unit,
        location: r.location,
        synced: true,
        syncError: null,
      }))
      .reverse(); // file is append-order; newest last → show newest first
    setEntries((prev) => {
      // Preserve any not-yet-saved local entries on top.
      const pending = prev.filter((e) => !e.synced);
      return [...pending, ...mapped];
    });
  }, []);

  const setConnected = useCallback(
    (handle, name) => {
      handleRef.current = handle;
      setFileName(name);
      setExcelState(EXCEL_STATE.CONNECTED);
      setExcelError('');
      onSettingsChangeRef.current?.({ excelFileName: name });
    },
    []
  );

  // On mount, try to restore a previously chosen file.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!excel.isSupported()) return;
      try {
        const handle = await excel.loadHandle();
        if (!handle || cancelled) return;
        handleRef.current = handle;
        const perm = await excel.queryPermission(handle, true);
        if (cancelled) return;
        if (perm === 'granted') {
          setConnected(handle, handle.name);
          await importFromFile();
        } else {
          setFileName(handle.name);
          setExcelState(EXCEL_STATE.NEEDS_PERMISSION);
        }
      } catch {
        // Ignore restore failures; user can reconnect from Settings.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist a single entry to the connected Excel file. */
  const writeEntry = useCallback(
    async (entry) => {
      if (!handleRef.current) throw new Error('No Excel file connected.');
      await excel.upsertEntry(handleRef.current, toRow(entry, settingsRef.current.alertDays));
    },
    []
  );

  // ── Connection actions (must run from a user gesture) ─────────────────────
  const connectExisting = useCallback(async () => {
    setBusy(true);
    setExcelError('');
    try {
      const handle = await excel.pickExistingFile();
      handleRef.current = handle;
      const ok = await excel.requestPermission(handle, true);
      if (!ok) throw new Error('Permission to edit the file was not granted.');
      setConnected(handle, handle.name);
      await importFromFile();
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false; // user cancelled picker
      setExcelError(err.message || 'Could not open the Excel file.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [importFromFile, setConnected]);

  const connectNew = useCallback(async () => {
    setBusy(true);
    setExcelError('');
    try {
      const handle = await excel.createNewFile();
      setConnected(handle, handle.name);
      await importFromFile();
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      setExcelError(err.message || 'Could not create the Excel file.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [importFromFile, setConnected]);

  const reconnect = useCallback(async () => {
    setBusy(true);
    setExcelError('');
    try {
      const handle = handleRef.current || (await excel.loadHandle());
      if (!handle) throw new Error('No saved file to reconnect.');
      handleRef.current = handle;
      const ok = await excel.requestPermission(handle, true);
      if (!ok) throw new Error('Permission was not granted.');
      setConnected(handle, handle.name);
      await importFromFile();
      return true;
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      setExcelError(err.message || 'Could not reconnect.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [importFromFile, setConnected]);

  const disconnect = useCallback(async () => {
    await excel.clearHandle();
    handleRef.current = null;
    setFileName('');
    setExcelState(EXCEL_STATE.DISCONNECTED);
    onSettingsChangeRef.current?.({ excelFileName: '' });
  }, []);

  // ── Inventory operations ──────────────────────────────────────────────────
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

  /** Retry writing any entries that failed to save earlier. Returns a result. */
  const retryPending = useCallback(async () => {
    if (!handleRef.current) {
      return { ok: false, error: 'No Excel file connected.' };
    }
    const pending = entries.filter((e) => !e.synced);
    if (!pending.length) return { ok: true, failed: 0, error: null };
    setBusy(true);
    let failed = 0;
    let lastError = null;
    try {
      for (const e of pending) {
        try {
          await writeEntry(e);
          setEntries((prev) =>
            prev.map((x) => (x.id === e.id ? { ...x, synced: true, syncError: null } : x))
          );
        } catch (err) {
          failed += 1;
          lastError = err.message;
          setEntries((prev) =>
            prev.map((x) => (x.id === e.id ? { ...x, syncError: err.message } : x))
          );
        }
      }
    } finally {
      setBusy(false);
    }
    return { ok: failed === 0, failed, error: lastError };
  }, [entries, writeEntry]);

  /**
   * Add a new entry, or merge quantity into an existing one. Writes through to
   * the Excel file when connected; otherwise queues the entry as pending.
   */
  const addEntry = useCallback(
    async (data, mergeIntoId = null) => {
      let resultEntry;

      if (mergeIntoId) {
        const base = entries.find((e) => e.id === mergeIntoId);
        resultEntry = base
          ? {
              ...base,
              quantity: base.quantity + data.quantity,
              timestamp: new Date().toISOString(),
              synced: false,
            }
          : null;
        setEntries((prev) =>
          prev.map((e) => (e.id === mergeIntoId ? resultEntry : e))
        );
      } else {
        resultEntry = {
          id: newId(),
          timestamp: new Date().toISOString(),
          product: data.product || 'Unknown product',
          expiration: data.expiration || '',
          lot: data.lot || '',
          quantity: data.quantity,
          unit: data.unit || 'each',
          location: data.location || settingsRef.current.location || '',
          synced: false,
          syncError: null,
        };
        setEntries((prev) => [resultEntry, ...prev]);
      }

      if (!resultEntry) {
        return { entry: null, saved: false, error: 'Entry not found.', connected };
      }

      // Write through to the file when connected.
      if (handleRef.current && excelState === EXCEL_STATE.CONNECTED) {
        try {
          await writeEntry(resultEntry);
          setEntries((prev) =>
            prev.map((e) => (e.id === resultEntry.id ? { ...e, synced: true, syncError: null } : e))
          );
          return { entry: resultEntry, saved: true, error: null, connected: true };
        } catch (err) {
          setEntries((prev) =>
            prev.map((e) => (e.id === resultEntry.id ? { ...e, syncError: err.message } : e))
          );
          return { entry: resultEntry, saved: false, error: err.message, connected: true };
        }
      }

      return { entry: resultEntry, saved: false, error: null, connected: false };
    },
    [entries, excelState, connected, writeEntry]
  );

  const clearLocal = useCallback(() => setEntries([]), []);

  const pendingCount = entries.filter((e) => !e.synced).length;

  return {
    entries,
    pendingCount,
    findDuplicate,
    addEntry,
    retryPending,
    clearLocal,
    // Excel connection
    excelState,
    excelSupported: excelState !== EXCEL_STATE.UNSUPPORTED,
    connected,
    fileName,
    busy,
    excelError,
    connectExisting,
    connectNew,
    reconnect,
    disconnect,
    importFromFile,
  };
}
