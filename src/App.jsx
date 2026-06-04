import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import CameraCapture from './components/CameraCapture.jsx';
import ConfirmationPanel from './components/ConfirmationPanel.jsx';
import DuplicateDialog from './components/DuplicateDialog.jsx';
import SaveErrorDialog from './components/SaveErrorDialog.jsx';
import Dashboard from './components/Dashboard.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import SetupWizard from './components/SetupWizard.jsx';
import ScanPanel from './components/ScanPanel.jsx';
import CatalogConfirm from './components/CatalogConfirm.jsx';
import CatalogView from './components/CatalogView.jsx';
import Toast from './components/Toast.jsx';
import EasterEgg from './components/EasterEgg.jsx';
import { useSettings } from './hooks/useSettings.js';
import { useInventory } from './hooks/useInventory.js';
import { useScanner } from './hooks/useScanner.js';
import { useEasterEgg } from './hooks/useEasterEgg.js';
import { EASTER_EGGS } from './lib/easterEggs.js';
import { extractFromImage, lookupGtin } from './lib/api.js';
import { parseScan } from './lib/gs1.js';
import { buildCatalogItem, loadLookups } from './lib/catalog.js';
import { lookupGtinName, rememberGtinName } from './lib/storage.js';

export default function App() {
  const { settings, update, reset } = useSettings();
  const inventory = useInventory(settings, update);

  // Capture/confirm flow state.
  const [mode, setMode] = useState('receive'); // 'receive' | 'use' | 'catalog'
  const [stage, setStage] = useState('capture'); // 'capture' | 'confirm'
  const [extracted, setExtracted] = useState(null);
  const [catalogDraft, setCatalogDraft] = useState(null); // enriched item under review
  const [lookups, setLookups] = useState(null); // Meditech reference tables (lazy)
  const [busy, setBusy] = useState(false);

  // Modals / overlays.
  const [showSettings, setShowSettings] = useState(false);
  const [duplicate, setDuplicate] = useState(null); // { existing, incoming }
  const [saveError, setSaveError] = useState(null); // { label, message }
  const [toast, setToast] = useState(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [easterEgg, setEasterEgg] = useState(null);

  // Type a name anywhere to summon that person's popup.
  useEasterEgg('shawn', () => setEasterEgg(EASTER_EGGS.shawn));
  useEasterEgg('ruger', () => setEasterEgg(EASTER_EGGS.ruger));
  useEasterEgg('elizabeth', () => setEasterEgg(EASTER_EGGS.elizabeth));

  const notify = useCallback((type, message, opts = {}) => {
    setToast({ type, message, ...opts });
  }, []);

  // Lazy-load the (large) Meditech lookup tables the first time Catalog is used.
  useEffect(() => {
    if (mode === 'catalog' && !lookups) {
      loadLookups()
        .then(setLookups)
        .catch(() => notify('warn', 'Could not load Meditech lookup tables.', { duration: 5000 }));
    }
  }, [mode, lookups, notify]);

  // Enrich an extraction/scan via GUDID and open it for review in Catalog mode.
  const draftCatalogItem = useCallback(async (visionLike) => {
    const gtin = visionLike.gtin;
    let gudid = null;
    if (gtin) {
      try {
        gudid = await lookupGtin(gtin);
      } catch {
        // No GUDID match — the tech fills/edits the record manually.
      }
    }
    setCatalogDraft(buildCatalogItem(visionLike, gudid));
    setStage('confirm');
  }, []);

  // --- Vision capture -------------------------------------------------------
  const handleCapture = useCallback(
    async (imageDataUrl) => {
      setBusy(true);
      try {
        const result = await extractFromImage(imageDataUrl, settings);
        if (mode === 'catalog') {
          await draftCatalogItem(result);
        } else {
          setExtracted({ ...result, fromVision: true });
          setStage('confirm');
        }
        if (result.blurry) {
          notify('warn', 'Photo looked blurry — please verify the fields or retake.', {
            duration: 5000,
          });
        }
      } catch (err) {
        if (mode === 'catalog') {
          // Vision failed — start a blank record for manual catalog entry.
          notify('error', `${err.message} You can enter details manually.`, { duration: 5000 });
          await draftCatalogItem({});
        } else {
          // Graceful fallback to manual entry when Vision is unavailable.
          notify('error', `${err.message} You can enter details manually.`, { duration: 5000 });
          setExtracted({ fromVision: false });
          setStage('confirm');
        }
      } finally {
        setBusy(false);
      }
    },
    [settings, notify, mode, draftCatalogItem]
  );

  const handleManualEntry = useCallback(() => {
    if (mode === 'catalog') {
      draftCatalogItem({});
      return;
    }
    setExtracted({ fromVision: false });
    setStage('confirm');
  }, [mode, draftCatalogItem]);

  // --- Barcode scanning (USB 2D scanner or manual code) ---------------------
  // Receiving: a scan prefills the confirmation panel (no Vision cost).
  const handleReceiveScan = useCallback(async (parsed) => {
    setBusy(true);
    let name = lookupGtinName(parsed.gtin);
    if (!name && parsed.gtin) {
      try {
        const r = await lookupGtin(parsed.gtin);
        if (r?.name) {
          name = r.name;
          rememberGtinName(parsed.gtin, name);
        }
      } catch {
        // No GUDID match — leave the name blank for the tech to fill in.
      }
    }
    setExtracted({
      product: name || '',
      expiration_date: parsed.expiration,
      lot_number: parsed.lot,
      serial_number: parsed.serial,
      gtin: parsed.gtin,
      fromScan: true,
      confidence: 'high',
    });
    setStage('confirm');
    setBusy(false);
  }, []);

  // Using: any barcode on the label removes 1 from the matching in-stock item.
  const handleUseScan = useCallback(
    async (rawCode) => {
      const res = await inventory.useStockByScan(rawCode, 1);
      if (!res.ok) {
        if (res.reason === 'unreadable') {
          notify('error', 'Could not read that barcode. Try again or type it in.', {
            duration: 5000,
          });
        } else {
          notify('error', 'No match in inventory for that barcode — receive it first.', {
            duration: 5000,
          });
        }
        return;
      }
      const name = res.entry.product || 'item';
      if (res.saved) {
        notify('success', `Used 1 × ${name} · ${res.remaining} left`);
      } else if (res.connected === false) {
        notify('warn', `Used 1 × ${name} (saved on device) · ${res.remaining} left`, {
          duration: 5000,
        });
      } else {
        setSaveError({ label: `Use of ${name}`, message: res.error || 'Could not write to Excel.' });
      }
    },
    [inventory, notify]
  );

  // Route a raw scanned/typed code to the right handler for the current mode.
  const handleScan = useCallback(
    (rawCode) => {
      // Use mode: any barcode on the label can match a captured identifier.
      if (mode === 'use') {
        handleUseScan(rawCode);
        return;
      }
      const parsed = parseScan(rawCode);
      // Catalog mode: enrich from GUDID off the GTIN, then review the record.
      if (mode === 'catalog') {
        if (!parsed.gtin) {
          notify('error', "Couldn't read a GTIN from that barcode — try the photo instead.", {
            duration: 5000,
          });
          return;
        }
        setBusy(true);
        draftCatalogItem({ gtin: parsed.gtin, reference_code: parsed.ref })
          .finally(() => setBusy(false));
        return;
      }
      // Receive mode: need decodable UDI fields; otherwise prompt for the photo.
      if (!parsed.gtin && !parsed.lot && !parsed.expiration && !parsed.serial) {
        notify('error', "Couldn't read that as a UDI for receiving — use the photo instead.", {
          duration: 5000,
        });
        return;
      }
      handleReceiveScan(parsed);
    },
    [mode, handleUseScan, handleReceiveScan, draftCatalogItem, notify]
  );

  const backToCapture = useCallback(() => {
    setExtracted(null);
    setCatalogDraft(null);
    setStage('capture');
  }, []);

  // --- Catalog (Item Master) ------------------------------------------------
  const saveCatalog = useCallback(
    async (item) => {
      const res = await inventory.addCatalogItem(item);
      if (res.saved) {
        notify('success', `Catalogued ${item.product || 'item'} to the Item Master.`);
        backToCapture();
      } else if (res.connected === false) {
        notify('warn', 'Connect an Excel file in Settings to save the Item Master.', {
          duration: 6000,
        });
      } else {
        setSaveError({
          label: `Catalog ${item.product || 'item'}`,
          message: res.error || 'Could not write to the Item Master sheet.',
        });
      }
    },
    [inventory, notify, backToCapture]
  );

  // --- Logging --------------------------------------------------------------
  const logEntry = useCallback(
    async (data, mergeIntoId = null) => {
      const { saved, error, connected } = await inventory.addEntry(data, mergeIntoId);
      const label = `${data.quantity}× ${data.product}`;
      if (saved) {
        notify('success', `Logged ${label} to ${inventory.fileName || 'the Excel file'}.`);
        backToCapture();
      } else if (!connected) {
        notify('warn', `Logged ${label} locally — connect an Excel file in Settings to save it.`, {
          duration: 6000,
        });
        backToCapture();
      } else {
        // Write failed (e.g. file open in Excel). Keep the captured data and let
        // the tech retry the save without taking a new photo.
        setSaveError({ label, message: error || 'Could not write to the Excel file.' });
      }
    },
    [inventory, notify, backToCapture]
  );

  // Retry saving the queued item(s) — no recapture, no extra Vision cost.
  const retrySave = useCallback(async () => {
    const res = await inventory.retryPending();
    if (res.ok) {
      notify('success', `Saved ${saveError?.label || 'item'} to ${inventory.fileName || 'the Excel file'}.`);
      setSaveError(null);
      backToCapture();
    } else {
      setSaveError((prev) => ({
        label: prev?.label,
        message: res.error || 'Still could not write to the file.',
      }));
    }
  }, [inventory, notify, saveError, backToCapture]);

  const keepLocal = useCallback(() => {
    notify('warn', `${saveError?.label || 'Item'} kept on this device — it will save with your next item.`, {
      duration: 6000,
    });
    setSaveError(null);
    backToCapture();
  }, [notify, saveError, backToCapture]);

  const handleConfirm = useCallback(
    (data) => {
      // Duplicate detection: same product + lot + expiration.
      const existing = inventory.findDuplicate(data);
      if (existing) {
        setDuplicate({ existing, incoming: data });
        return;
      }
      logEntry(data);
    },
    [inventory, logEntry]
  );

  // --- Duplicate resolution -------------------------------------------------
  const resolveDuplicate = useCallback(
    (mode) => {
      if (!duplicate) return;
      const { existing, incoming } = duplicate;
      setDuplicate(null);
      if (mode === 'merge') logEntry(incoming, existing.id);
      else logEntry(incoming);
    },
    [duplicate, logEntry]
  );

  // Listen for the USB barcode scanner whenever the main screen is active.
  const scannerEnabled = stage === 'capture' && !duplicate && !saveError && !showSettings;
  useScanner(handleScan, scannerEnabled);

  const showWizard = !inventory.connected && !wizardDismissed;

  return (
    <div className="min-h-screen">
      <Header
        excelState={inventory.excelState}
        fileName={inventory.fileName}
        busy={inventory.busy}
        pendingCount={inventory.pendingCount}
        onReconnect={inventory.reconnect}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {showWizard && (
          <SetupWizard
            excelSupported={inventory.excelSupported}
            onOpenSettings={() => setShowSettings(true)}
            onDismiss={() => setWizardDismissed(true)}
          />
        )}

        {/* Two-column on large screens: capture/confirm + dashboard. */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            {stage === 'capture' ? (
              <>
                <ScanPanel mode={mode} onMode={setMode} onManualCode={handleScan} busy={busy} />
                {mode === 'use' ? (
                  <div className="card flex items-start gap-3">
                    <span className="text-3xl" aria-hidden>
                      ⬆
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
                        Use mode
                      </h2>
                      <p className="mt-1 text-sm text-clinical-500 dark:text-clinical-400">
                        Scan each used implant&apos;s sticker (or type its code above). Each scan
                        removes one unit from inventory — no photo needed, no cost. Great for
                        running through a stack of stickers from the implant log.
                      </p>
                    </div>
                  </div>
                ) : (
                  <CameraCapture
                    preferredDeviceId={settings.cameraDeviceId}
                    busy={busy}
                    onCapture={handleCapture}
                    onManualEntry={handleManualEntry}
                    onSelectDevice={(id) => update({ cameraDeviceId: id })}
                    onCamerasEnumerated={setCameras}
                  />
                )}
              </>
            ) : mode === 'catalog' ? (
              <CatalogConfirm
                item={catalogDraft || {}}
                lookups={lookups}
                busy={busy}
                onSave={saveCatalog}
                onCancel={backToCapture}
              />
            ) : (
              <ConfirmationPanel
                extracted={extracted || {}}
                settings={settings}
                busy={busy}
                onConfirm={handleConfirm}
                onCancel={backToCapture}
              />
            )}
          </div>

          <div>
            {mode === 'catalog' ? (
              <CatalogView
                items={inventory.catalogItems}
                lookups={lookups}
                onRefresh={inventory.connected ? inventory.importFromFile : null}
              />
            ) : (
              <Dashboard
                entries={inventory.entries}
                settings={settings}
                syncing={inventory.busy}
                onRefresh={inventory.connected ? inventory.importFromFile : inventory.retryPending}
              />
            )}
          </div>
        </div>
      </main>

      {duplicate && (
        <DuplicateDialog
          existing={duplicate.existing}
          incoming={duplicate.incoming}
          alertDays={settings.alertDays}
          onAddToExisting={() => resolveDuplicate('merge')}
          onCreateNew={() => resolveDuplicate('new')}
          onCancel={() => setDuplicate(null)}
        />
      )}

      {saveError && (
        <SaveErrorDialog
          label={saveError.label}
          message={saveError.message}
          busy={inventory.busy}
          onRetry={retrySave}
          onKeepLocal={keepLocal}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          cameras={cameras}
          inventory={inventory}
          onUpdate={update}
          onReset={reset}
          onClose={() => setShowSettings(false)}
        />
      )}

      {easterEgg && <EasterEgg egg={easterEgg} onClose={() => setEasterEgg(null)} />}

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-clinical-400">
        Northwest Specialty Hospital · Implant Expiration Tracker · Inventory is saved to your local
        Excel file and synced via OneDrive/SharePoint.
      </footer>
    </div>
  );
}
