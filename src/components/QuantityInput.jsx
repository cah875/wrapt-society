import { PlusIcon, MinusIcon } from './Icons.jsx';

/** Big gloved-hand-friendly quantity stepper with a unit-type selector. */
export default function QuantityInput({ quantity, unit, unitTypes, onQuantity, onUnit }) {
  const set = (n) => onQuantity(Math.max(1, Math.min(9999, n)));

  return (
    <div className="space-y-3">
      <label className="field-label">Quantity</label>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          onClick={() => set(quantity - 1)}
          aria-label="Decrease quantity"
          className="btn-ghost h-20 w-20 shrink-0 text-3xl"
        >
          <MinusIcon width={32} height={32} />
        </button>

        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={9999}
          value={quantity}
          onChange={(e) => set(parseInt(e.target.value || '1', 10))}
          className="field-input h-20 flex-1 text-center text-4xl font-bold"
          aria-label="Quantity"
        />

        <button
          type="button"
          onClick={() => set(quantity + 1)}
          aria-label="Increase quantity"
          className="btn-success h-20 w-20 shrink-0 text-3xl"
        >
          <PlusIcon width={32} height={32} />
        </button>
      </div>

      {/* Quick presets for common batch sizes. */}
      <div className="flex flex-wrap gap-2">
        {[5, 10, 12, 24].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(n)}
            className="btn-ghost px-4 py-2 text-sm"
          >
            Set {n}
          </button>
        ))}
      </div>

      <div>
        <label className="field-label" htmlFor="unit-type">
          Unit Type
        </label>
        <select
          id="unit-type"
          value={unit}
          onChange={(e) => onUnit(e.target.value)}
          className="field-input h-14 text-lg"
        >
          {unitTypes.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
