import { useEffect, useState } from 'react';
import { testVision, testSheets } from '../lib/api.js';
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

/** Full settings editor: API keys, sheet, camera, thresholds, appearance. */
export default function SettingsModal({ settings, onUpdate, onReset, onClose, cameras = [] }) {
  // Local draft so typing doesn't thrash localStorage; commit on change/blur.
  const [draft, setDraft] = useState(settings);
  const [unitText, setUnitText] = useState((settings.unitTypes || []).join(', '));

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Persist a field immediately (settings are cheap and we want test buttons accurate).
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
            title="Claude Vision"
            desc="Used to read product, expiration, and lot from photos. Leave blank if the key is configured on the server (recommended)."
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

          <Section
            title="Google Sheets"
            desc="Your inventory log. Share the sheet with the service account email (Editor access)."
          >
            <label className="field-label" htmlFor="sheet-url">
              Google Sheet URL
            </label>
            <input
              id="sheet-url"
              value={draft.sheetUrl}
              onChange={(e) => set({ sheetUrl: e.target.value })}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="field-input"
            />
            {draft.sheetId && (
              <p className="mt-1 text-xs text-clinical-400">Sheet ID: {draft.sheetId}</p>
            )}
            <label className="field-label mt-3" htmlFor="sheet-tab">
              Tab name
            </label>
            <input
              id="sheet-tab"
              value={draft.sheetTab}
              onChange={(e) => set({ sheetTab: e.target.value })}
              placeholder="Inventory"
              className="field-input"
            />
            <label className="field-label mt-3" htmlFor="sa-json">
              Service Account JSON (optional if set on server)
            </label>
            <textarea
              id="sa-json"
              rows={3}
              value={draft.googleServiceAccountJson}
              onChange={(e) => set({ googleServiceAccountJson: e.target.value })}
              placeholder='{"type":"service_account", …}'
              className="field-input font-mono text-xs"
            />
            <TestButton label="Test Google Sheets" onTest={() => testSheets(draft)} />
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
                if (window.confirm('Reset all settings to defaults? This does not delete logged inventory.')) {
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
