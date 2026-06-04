import { statusFor, relativeDays } from '../lib/dates.js';

const COLOR_CLASSES = {
  ok: 'bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300',
  warn: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-status-danger dark:bg-red-900/40 dark:text-red-300',
  gray: 'bg-clinical-100 text-clinical-600 dark:bg-clinical-800 dark:text-clinical-300',
};

/** Color-coded pill summarizing an item's expiration status. */
export default function StatusBadge({ expiration, alertDays = 30, showDays = true }) {
  const s = statusFor(expiration, alertDays);
  return (
    <span className={`badge ${COLOR_CLASSES[s.color] || COLOR_CLASSES.gray}`}>
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          backgroundColor:
            s.color === 'ok'
              ? '#3E9D45'
              : s.color === 'warn'
              ? '#b45309'
              : s.color === 'danger'
              ? '#b91c1c'
              : '#94a3b8',
        }}
      />
      {s.label}
      {showDays && s.days !== null && (
        <span className="font-normal opacity-80">· {relativeDays(s.days)}</span>
      )}
    </span>
  );
}
