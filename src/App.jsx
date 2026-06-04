import { useCallback, useState } from 'react';
import Header from './components/Header.jsx';
import CameraCapture from './components/CameraCapture.jsx';
import ConfirmationPanel from './components/ConfirmationPanel.jsx';
import DuplicateDialog from './components/DuplicateDialog.jsx';
import Dashboard from './components/Dashboard.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import SetupWizard from './components/SetupWizard.jsx';
import Toast from './components/Toast.jsx';
import { useSettings } from './hooks/useSettings.js';
import { useInventory } from './hooks/useInventory.js';
import { extractFromImage } from './lib/api.js';

export default function App() {
  const { settings, update, reset } = useSettings();
  const inventory = useInventory(settings, update);

  // Capture/confirm flow state.
  const [stage, setStage] = useState('capture'); // 'capture' | 'confirm'
  const [extracted, setExtracted] = useState(null);
  const [busy, setBusy] = useState(false);

  // Modals / overlays.
  const [showSettings, setShowSettings] = useState(false);
  const [duplicate, setDuplicate] = useState(null); // { existing, incoming }
  const [toast, setToast] = useState(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);
  const [cameras, setCameras] = useState([]);

  const notify = useCallback((type, message, opts = {}) => {
    setToast({ type, message, ...opts });
  }, []);

  // --- Vision capture -------------------------------------------------------
  const handleCapture = useCallback(
    async (imageDataUrl) => {
      setBusy(true);
      try {
        const result = await extractFromImage(imageDataUrl, settings);
        setExtracted({ ...result, fromVision: true });
        setStage('confirm');
        if (result.blurry) {
          notify('warn', 'Photo looked blurry — please verify the fields or retake.', {
            duration: 5000,
          });
        }
      } catch (err) {
        // Graceful fallback to manual entry when Vision is unavailable.
        notify('error', `${err.message} You can enter details manually.`, { duration: 5000 });
        setExtracted({ fromVision: false });
        setStage('confirm');
      } finally {
        setBusy(false);
      }
    },
    [settings, notify]
  );

  const handleManualEntry = useCallback(() => {
    setExtracted({ fromVision: false });
    setStage('confirm');
  }, []);

  const backToCapture = useCallback(() => {
    setExtracted(null);
    setStage('capture');
  }, []);

  // --- Logging --------------------------------------------------------------
  const logEntry = useCallback(
    async (data, mergeIntoId = null) => {
      const { saved, error, connected } = await inventory.addEntry(data, mergeIntoId);
      const label = `${data.quantity}× ${data.product}`;
      if (saved) {
        notify('success', `Logged ${label} to ${inventory.fileName || 'the Excel file'}.`);
      } else if (!connected) {
        notify('warn', `Logged ${label} locally — connect an Excel file in Settings to save it.`, {
          duration: 6000,
        });
      } else {
        notify('error', `Logged ${label} locally, but writing to Excel failed${error ? `: ${error}` : ''}.`, {
          duration: 7000,
        });
      }
      backToCapture();
    },
    [inventory, notify, backToCapture]
  );

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
          <div>
            {stage === 'capture' ? (
              <CameraCapture
                preferredDeviceId={settings.cameraDeviceId}
                busy={busy}
                onCapture={handleCapture}
                onManualEntry={handleManualEntry}
                onSelectDevice={(id) => update({ cameraDeviceId: id })}
                onCamerasEnumerated={setCameras}
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
            <Dashboard
              entries={inventory.entries}
              settings={settings}
              syncing={inventory.busy}
              onRefresh={inventory.connected ? inventory.importFromFile : inventory.retryPending}
            />
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

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-clinical-400">
        Implant Expiration Tracker · Inventory is saved to your local Excel file and synced via OneDrive/SharePoint.
      </footer>
    </div>
  );
}
