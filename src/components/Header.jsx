import { GearIcon, CloudOffIcon, RefreshIcon, CheckIcon } from './Icons.jsx';

/** Top bar: app identity, sync/connection status, settings access. */
export default function Header({ online, syncing, pendingCount, onOpenSettings }) {
  let status;
  if (!online) {
    status = {
      icon: <CloudOffIcon width={18} height={18} />,
      text: 'Offline — will sync',
      cls: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
    };
  } else if (syncing) {
    status = {
      icon: <RefreshIcon width={18} height={18} className="animate-spin" />,
      text: 'Syncing…',
      cls: 'bg-clinical-100 text-clinical-700 dark:bg-clinical-800 dark:text-clinical-200',
    };
  } else if (pendingCount > 0) {
    status = {
      icon: <RefreshIcon width={18} height={18} />,
      text: `${pendingCount} pending`,
      cls: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
    };
  } else {
    status = {
      icon: <CheckIcon width={18} height={18} />,
      text: 'All synced',
      cls: 'bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300',
    };
  }

  return (
    <header className="sticky top-0 z-30 border-b border-clinical-200 bg-white/90 backdrop-blur dark:border-clinical-800 dark:bg-clinical-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinical-600 text-white">
            {/* simple plus/cross mark */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold text-clinical-800 dark:text-clinical-50">
              Implant Expiration Tracker
            </h1>
            <p className="text-xs text-clinical-500 dark:text-clinical-400">
              Loading dock inventory logging
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`badge ${status.cls}`}
            title={online ? 'Connection status' : 'You are offline'}
          >
            {status.icon}
            <span className="hidden sm:inline">{status.text}</span>
          </span>
          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            aria-label="Open settings"
            title="Settings"
          >
            <GearIcon width={22} height={22} />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
