import { AlertIcon, RefreshIcon, CheckIcon } from './Icons.jsx';

/**
 * Shown when an item was captured/verified but writing it to the Excel file
 * failed (most often because the file is open in Excel). The captured data is
 * preserved, so the tech can fix the issue and retry the save WITHOUT taking a
 * new photo (which would cost another Vision call).
 */
export default function SaveErrorDialog({ label, message, busy, onRetry, onKeepLocal }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-lg space-y-5">
        <div className="flex items-start gap-3">
          <AlertIcon width={28} height={28} className="mt-0.5 shrink-0 text-status-warn" />
          <div>
            <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
              Couldn&apos;t save to Excel
            </h2>
            <p className="mt-1 text-sm text-clinical-500 dark:text-clinical-400">
              {label ? <strong>{label}</strong> : 'Your item'} is held safely — your photo and the
              scanned details are <strong>not lost</strong>. No need to retake the photo.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 p-3 text-sm text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          {message || 'The write failed.'}
        </div>

        <div className="rounded-lg bg-clinical-50 p-3 text-sm text-clinical-600 dark:bg-clinical-800 dark:text-clinical-300">
          <strong>Most common fix:</strong> the Excel file is open in Excel and locked. Close it
          (or close the file in OneDrive), then click <em>Retry saving</em>.
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={onRetry} disabled={busy} className="btn-success btn-xl">
            <RefreshIcon width={26} height={26} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Saving…' : 'Retry saving'}
          </button>
          <button onClick={onKeepLocal} disabled={busy} className="btn-ghost btn-xl">
            <CheckIcon width={26} height={26} /> Keep for later
          </button>
        </div>
        <p className="text-center text-xs text-clinical-400">
          “Keep for later” stores it on this device and saves it automatically with your next item.
        </p>
      </div>
    </div>
  );
}
