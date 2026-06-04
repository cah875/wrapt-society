import { useEffect } from 'react';
import { CheckIcon, AlertIcon, XIcon } from './Icons.jsx';

const STYLES = {
  success: 'bg-status-ok text-white',
  error: 'bg-status-danger text-white',
  info: 'bg-clinical-700 text-white',
  warn: 'bg-status-warn text-white',
};

/** Transient notification anchored bottom-center; auto-dismisses. */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    if (toast.sticky) return undefined;
    const t = setTimeout(onDismiss, toast.duration || 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const Icon = toast.type === 'success' ? CheckIcon : AlertIcon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-5 py-4 text-lg font-semibold shadow-lg ${
          STYLES[toast.type] || STYLES.info
        }`}
      >
        <Icon width={24} height={24} />
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded p-1 hover:bg-white/20"
        >
          <XIcon width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
