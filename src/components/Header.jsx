import { GearIcon, CloudOffIcon, RefreshIcon, CheckIcon, AlertIcon } from './Icons.jsx';
import { EXCEL_STATE } from '../hooks/useInventory.js';

/** Top bar: app identity, Excel file status, settings access. */
export default function Header({
  excelState,
  fileName,
  busy,
  pendingCount,
  onReconnect,
  onOpenSettings,
}) {
  let status;
  if (excelState === EXCEL_STATE.UNSUPPORTED) {
    status = {
      icon: <AlertIcon width={18} height={18} />,
      text: 'Use Edge or Chrome',
      cls: 'bg-red-100 text-status-danger dark:bg-red-900/40 dark:text-red-300',
    };
  } else if (busy) {
    status = {
      icon: <RefreshIcon width={18} height={18} className="animate-spin" />,
      text: 'Saving…',
      cls: 'bg-clinical-100 text-clinical-700 dark:bg-clinical-800 dark:text-clinical-200',
    };
  } else if (excelState === EXCEL_STATE.NEEDS_PERMISSION) {
    status = {
      icon: <RefreshIcon width={18} height={18} />,
      text: 'Reconnect file',
      cls: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
      action: onReconnect,
    };
  } else if (excelState !== EXCEL_STATE.CONNECTED) {
    status = {
      icon: <CloudOffIcon width={18} height={18} />,
      text: 'No file connected',
      cls: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
      action: onOpenSettings,
    };
  } else if (pendingCount > 0) {
    status = {
      icon: <AlertIcon width={18} height={18} />,
      text: `${pendingCount} not saved`,
      cls: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
    };
  } else {
    status = {
      icon: <CheckIcon width={18} height={18} />,
      text: fileName ? `Saved · ${fileName}` : 'Saved',
      cls: 'bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300',
    };
  }

  const StatusEl = status.action ? 'button' : 'span';

  return (
    <header className="sticky top-0 z-30 border-b border-clinical-200 bg-white/90 backdrop-blur dark:border-clinical-800 dark:bg-clinical-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Logo on a white chip so it stays legible in both light and dark mode. */}
          <div className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-clinical-200 dark:ring-clinical-700">
            <img
              src="/logo.png"
              alt="Northwest Specialty Hospital"
              className="h-7 w-auto sm:h-9"
            />
          </div>
          <div className="hidden leading-tight sm:block">
            <h1 className="text-lg font-bold text-clinical-800 dark:text-clinical-50">
              Implant Expiration Tracker
            </h1>
            <p className="text-xs text-clinical-500 dark:text-clinical-400">
              Loading dock inventory logging
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusEl
            onClick={status.action}
            className={`badge max-w-[14rem] truncate ${status.cls} ${
              status.action ? 'cursor-pointer hover:brightness-95' : ''
            }`}
            title={status.action ? 'Click to fix' : 'Excel file status'}
          >
            {status.icon}
            <span className="hidden truncate sm:inline">{status.text}</span>
          </StatusEl>
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
