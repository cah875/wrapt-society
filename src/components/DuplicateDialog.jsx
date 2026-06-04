import StatusBadge from './StatusBadge.jsx';
import { displayDate } from '../lib/dates.js';

/**
 * Shown when an incoming item matches an existing entry (product+lot+exp).
 * Offers to add the new quantity to the existing entry or create a separate one.
 */
export default function DuplicateDialog({ existing, incoming, alertDays, onAddToExisting, onCreateNew, onCancel }) {
  if (!existing) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-lg space-y-5">
        <div>
          <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
            Duplicate Item Found
          </h2>
          <p className="mt-1 text-sm text-clinical-500 dark:text-clinical-400">
            This product, lot, and expiration are already logged. Add to the existing entry
            to keep one accurate count.
          </p>
        </div>

        <div className="rounded-xl border border-clinical-200 p-4 dark:border-clinical-700">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{existing.product}</h3>
            <StatusBadge expiration={existing.expiration} alertDays={alertDays} />
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-clinical-600 dark:text-clinical-300">
            <div>
              <dt className="inline font-medium">Lot: </dt>
              <dd className="inline">{existing.lot || '—'}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Expires: </dt>
              <dd className="inline">{displayDate(existing.expiration)}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Current qty: </dt>
              <dd className="inline font-bold">
                {existing.quantity} {existing.unit}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Adding: </dt>
              <dd className="inline font-bold text-clinical-700 dark:text-clinical-100">
                +{incoming.quantity} {incoming.unit}
              </dd>
            </div>
          </dl>
          <p className="mt-3 rounded-lg bg-clinical-50 px-3 py-2 text-sm dark:bg-clinical-800">
            New total would be{' '}
            <strong>
              {existing.quantity + incoming.quantity} {existing.unit}
            </strong>
            .
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={onAddToExisting} className="btn-success btn-xl">
            Add {incoming.quantity} more
          </button>
          <button onClick={onCreateNew} className="btn-ghost btn-xl">
            Create new entry
          </button>
        </div>
        <button onClick={onCancel} className="btn-ghost w-full">
          Cancel
        </button>
      </div>
    </div>
  );
}
