import { CheckIcon, AlertIcon } from './Icons.jsx';

/**
 * First-run guidance shown until an Excel file is connected. Explains the setup
 * steps and routes the user to Settings. Non-blocking: the tech can still
 * capture/log to the local cache and connect a file afterward.
 */
export default function SetupWizard({ excelSupported, onOpenSettings, onDismiss }) {
  const steps = [
    {
      title: 'Open in Microsoft Edge (or Chrome)',
      body: 'Saving to a local Excel file requires Edge or Chrome. This won\'t work in Firefox or Safari.',
    },
    {
      title: 'Connect your Excel file',
      body: 'In Settings → Excel File, choose or create an .xlsx inside your OneDrive/SharePoint-synced folder (e.g. "OneDrive - YourHospital\\Materials"). OneDrive shares it with coworkers automatically.',
    },
    {
      title: 'Add your Claude API key',
      body: 'Either set ANTHROPIC_API_KEY on the server (recommended) or paste a key in Settings → Claude Vision, then use the Test button.',
    },
    {
      title: 'Start logging',
      body: 'Capture a photo, verify the details, set the quantity, and Confirm & Log. Each item is appended to your Excel file and synced by OneDrive.',
    },
  ];

  return (
    <div className="card border-l-4 border-l-clinical-500">
      <div className="flex items-start gap-3">
        <AlertIcon width={26} height={26} className="mt-0.5 shrink-0 text-clinical-500" />
        <div className="flex-1">
          <h2 className="text-lg font-bold text-clinical-800 dark:text-clinical-50">
            Finish setup to save to your Excel file
          </h2>
          <p className="text-sm text-clinical-500 dark:text-clinical-400">
            {excelSupported
              ? 'Until a file is connected, items are saved in this browser and can be written to Excel once you connect.'
              : 'This browser cannot save local Excel files — please reopen the app in Microsoft Edge or Google Chrome.'}
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
