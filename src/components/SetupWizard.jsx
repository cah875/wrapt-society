import { CheckIcon, AlertIcon } from './Icons.jsx';

/**
 * First-run guidance shown when Google Sheets is not configured. Explains the
 * three setup steps and routes the user to Settings. Non-blocking: the tech can
 * still capture/log to the local cache and sync later.
 */
export default function SetupWizard({ sheetsConfigured, onOpenSettings, onDismiss }) {
  const steps = [
    {
      title: 'Add your Claude API key',
      body: 'Either set ANTHROPIC_API_KEY on the server (recommended) or paste a key in Settings → Claude Vision. Use the Test button to confirm.',
    },
    {
      title: 'Connect your Google Sheet',
      body: 'Create a Google service account, enable the Sheets API, and share your sheet with the service account email (Editor). Paste the Sheet URL in Settings → Google Sheets.',
    },
    {
      title: 'Start logging',
      body: 'Capture a photo, verify the details, set quantity, and Confirm & Log. Entries also cache locally and sync automatically.',
    },
  ];

  return (
    <div className="card border-l-4 border-l-clinical-500">
      <div className="flex items-start gap-3">
        <AlertIcon width={26} height={26} className="mt-0.5 shrink-0 text-clinical-500" />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-clinical-800 dark:text-clinical-50">
            {sheetsConfigured ? 'Setup' : 'Finish setup to sync to Google Sheets'}
          </h2>
          <p className="text-sm text-clinical-500 dark:text-clinical-400">
            {sheetsConfigured
              ? 'You can re-run any of these steps from Settings.'
              : 'Until a sheet is connected, items are saved locally and will sync once configured.'}
          </p>

          <ol className="mt-4 space-y-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clinical-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-clinical-800 dark:text-clinical-100">
                    {s.title}
                  </div>
                  <div className="text-sm text-clinical-500 dark:text-clinical-400">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={onOpenSettings} className="btn-primary">
              Open Settings
            </button>
            <button onClick={onDismiss} className="btn-ghost">
              <CheckIcon width={18} height={18} /> Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
