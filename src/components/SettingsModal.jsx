import { useEffect, useState } from 'react';
import { testVision } from '../lib/api.js';
import { EXCEL_STATE } from '../hooks/useInventory.js';
import { CheckIcon, XIcon, AlertIcon, RefreshIcon } from './Icons.jsx';

/** A single test-connection control with status feedback. */
function TestButton({ label, onTest }) {
  const [state, setState] = useState({ status: 'idle', message: '' });

  const run = async () => {
    setState({ status: 'running', message: '' });
    try {
      const res = await onTest();
      setState({ status: 'ok', message: res?.message || 'Connection OK' });
    } catch (err) {
      setState({ status: 'fail', message: err.message });
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <button onClick={run} className="btn-ghost" disabled={state.status === 'running'}>
        {state.status === 'running' ? (
          <RefreshIcon width={18} height={18} className="animate-spin" />
        ) : null}
        {label}
      </button>
      {state.status === 'ok' && (
        <span className="badge bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300">
          <CheckIcon width={16} height={16} /> {state.message}
        </span>
      )}
      {state.status === 'fail' && (
        <span className="badge bg-red-100 text-status-danger dark:bg-red-900/40 dark:text-red-300">
          <AlertIcon width={16} height={16} /> {state.message}
        </span>
      )}
    </div>
  );
}

function Section({ title, children, desc }) {
  return (
    <section className="space-y-3 border-b border-clinical-200 py-5 last:border-0 dark:border-clinical-800">
      <div>
        <h3 className="text-lg font-bold text-clinical-800 dark:text-clinical-50">{title}</h3>
        {desc && <p className="text-sm text-clinical-500 dark:text-clinical-400">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

/** Excel-file connection controls (pick / create / reconnect / disconnect). */
function ExcelSection({ inventory }) {
  const { excelState, fileName, busy, excelError } = inventory;

  if (excelState === EXCEL_STATE.UNSUPPORTED) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-status-danger dark:bg-red-900/30 dark:text-red-200">
        <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
        <p className="text-sm font-medium">
          This browser can&apos;t write local Excel files. Please open the app in{' '}
          <strong>Microsoft Edge</strong> or <strong>Google Chrome</strong>.
        </p>
      </div>
    );
  }

  const connected = excelState === EXCEL_STATE.CONNECTED;
  const needsPermission = excelState === EXCEL_STATE.NEEDS_PERMISSION;

  return (
    <div className="space-y-3">
      {/* Current status line */}
      {connected ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-status-ok dark:bg-green-900/30 dark:text-green-200">
          <CheckIcon width={20} height={20} className="shrink-0" />
          <p className="text-sm font-medium">
            Connected to <strong>{fileName}</strong>. New items are saved here automatically.
          </p>
        </div>
      ) : needsPermission ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          <AlertIcon width={20} height={20} className="shrink-0" />
          <p className="text-sm font-medium">
            {fileName ? <strong>{fileName}</strong> : 'A file'} is saved but needs permission again.
            Click <em>Reconnect</em>.
          </p>
        </div>
      ) : (
        <p className="text-sm text-clinical-500 dark:text-clinical-400">
          No file connected yet. Choose or create an <code>.xlsx</code> inside your
          OneDrive/SharePoint-synced folder so coworkers can view it.
        </p>
      )}

      {excelError && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-status-danger dark:bg-red-900/30 dark:text-red-200">
          {excelError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {needsPermission && (
          <button onClick={inventory.reconnect} className="btn-primary" disabled={busy}>
            <RefreshIcon width={18} height={18} className={busy ? 'animate-spin' : ''} /> Reconnect
          </button>
        )}
        <button onClick={inventory.connectExisting} className="btn-ghost" disabled={busy}>
          Choose existing file…
        </button>
        <button onClick={inventory.connectNew} className="btn-ghost" disabled={busy}>
          Create new file…
        </button>
        {connected && (
          <button onClick={inventory.disconnect} className="btn-ghost" disabled={busy}>
            Disconnect
          </button>
        )}
      </div>

      {connected && (
        <p className="text-xs text-clinical-400">
          Tip: keep the file in a folder like <code>OneDrive - YourHospital\Materials\</code> so it
          syncs to SharePoint for everyone to view.
        </p>
      )}
    </div>
  );
}

/** Full settings editor: API key, Excel file, camera, thresholds, appearance. */
export default function SettingsModal({ settings, onUpdate, onReset, onClose, cameras = [], inventory }) {
  const [draft, setDraft] = useState(settings);
  const [unitText, setUnitText] = useState((settings.unitTypes || []).join(', '));

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    onUpdate(patch);
  };

  const commitUnits = () => {
    const types = unitText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    set({ unitTypes: types.length ? types : ['each'] });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-0 sm:p-4">
      <div className="mx-auto min-h-full w-full max-w-2xl bg-clinical-50 dark:bg-clinical-950 sm:min-h-0 sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-clinical-200 bg-clinical-50/95 px-5 py-4 backdrop-blur dark:border-clinical-800 dark:bg-clinical-950/95 sm:rounded-t-2xl">
          <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">Settings</h2>
          <button onClick={onClose} className="btn-ghost" aria-label="Close settings">
            <XIcon width={22} height={22} /> Done
          </button>
        </div>

        <div className="px-5 pb-8">
          <Section
            title="Excel File"
            desc="Where inventory is saved. Pick a file in your OneDrive/SharePoint-synced folder; it syncs automatically for coworkers to view."
          >
            <ExcelSection inventory={inventory} />
          </Section>

          <Section
            title="Claude Vision"
            desc="Reads product, expiration, and lot from photos. Leave blank if the key is configured on the server (recommended)."
          >
            <label className="field-label" htmlFor="anthropic-key">
              Claude API Key
            </label>
            <input
              id="anthropic-key"
              type="password"
              autoComplete="off"
              value={draft.anthropicApiKey}
              onChange={(e) => set({ anthropicApiKey: e.target.value })}
              placeholder="sk-ant-… (optional if set on server)"
              className="field-input"
            />
            <label className="field-label mt-3" htmlFor="vision-model">
              Model override (optional)
            </label>
            <input
              id="vision-model"
              value={draft.visionModel}
              onChange={(e) => set({ visionModel: e.target.value })}
              placeholder="claude-opus-4-8"
              className="field-input"
            />
            <TestButton label="Test Claude Vision" onTest={() => testVision(draft)} />
          </Section>

          <Section title="Capture & Inventory">
            <label className="field-label" htmlFor="camera-select">
              Preferred camera
            </label>
            <select
              id="camera-select"
              value={draft.cameraDeviceId}
              onChange={(e) => set({ cameraDeviceId: e.target.value })}
              className="field-input"
            >
              <option value="">Default / automatic</option>
              {cameras.map((c, i) => (
                <option key={c.deviceId} value={c.deviceId}>
                  {c.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>

            <label className="field-label mt-3" htmlFor="alert-days">
              Alert threshold (days): {draft.alertDays}
            </label>
            <input
              id="alert-days"
              type="range"
              min={7}
              max={120}
              step={1}
              value={draft.alertDays}
              onChange={(e) => set({ alertDays: parseInt(e.target.value, 10) })}
              className="w-full"
            />

            <label className="field-label mt-3" htmlFor="default-location">
              Default location (optional)
            </label>
            <input
              id="default-location"
              value={draft.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="e.g. Loading Dock A"
              className="field-input"
            />

            <label className="field-label mt-3" htmlFor="unit-types">
              Unit types (comma-separated)
            </label>
            <input
              id="unit-types"
              value={unitText}
              onChange={(e) => setUnitText(e.target.value)}
              onBlur={commitUnits}
              placeholder="each, box, case, set, vial"
              className="field-input"
            />
          </Section>

          <Section title="Appearance & Accessibility">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => set({ theme: draft.theme === 'dark' ? 'light' : 'dark' })}
                className="btn-ghost"
              >
                {draft.theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
              </button>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.highContrast}
                  onChange={(e) => set({ highContrast: e.target.checked })}
                  className="h-5 w-5"
                />
                High contrast
              </label>
            </div>
            <label className="field-label mt-3" htmlFor="font-scale">
              Font size: {Math.round((draft.fontScale || 1) * 100)}%
            </label>
            <input
              id="font-scale"
              type="range"
              min={0.9}
              max={1.4}
              step={0.05}
              value={draft.fontScale || 1}
              onChange={(e) => set({ fontScale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </Section>

          <Section title="Reset">
            <button
              onClick={() => {
                if (window.confirm('Reset all settings to defaults? This does not delete your Excel file or logged inventory.')) {
                  onReset();
                }
              }}
              className="btn-danger"
            >
              Reset settings to defaults
            </button>
          </Section>
        </div>
      </div>
    </div>
  );
}
