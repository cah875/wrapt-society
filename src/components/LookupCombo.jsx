import { useEffect, useMemo, useState } from 'react';

/**
 * Searchable combobox over a {name, code} lookup list (Category, EOC, …).
 * The bound `value` is the code; the input shows the name with type-ahead via a
 * native <datalist>. Offers a one-click "use suggested" chip.
 */
export default function LookupCombo({
  id,
  label,
  options = [],
  value,
  onChange,
  suggestion,
  placeholder,
}) {
  const nameByCode = useMemo(() => {
    const m = new Map();
    for (const o of options) m.set(o.code, o.name);
    return m;
  }, [options]);

  const [text, setText] = useState(nameByCode.get(value) || '');

  // When options load (async) or value is set externally, sync the display text.
  useEffect(() => {
    const name = nameByCode.get(value) || '';
    if (name && text !== name) setText(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, nameByCode]);

  const resolve = (t) => {
    const lc = t.trim().toLowerCase();
    const hit = options.find(
      (o) => o.name.toLowerCase() === lc || o.code.toLowerCase() === lc
    );
    return hit ? hit.code : '';
  };

  const onText = (t) => {
    setText(t);
    onChange(resolve(t));
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setText(suggestion.name);
    onChange(suggestion.code);
  };

  const showSuggest = suggestion && value !== suggestion.code;

  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        list={`${id}-list`}
        value={text}
        onChange={(e) => onText(e.target.value)}
        className="field-input"
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={`${id}-list`}>
        {options.map((o) => (
          <option key={o.code + o.name} value={o.name}>{o.code}</option>
        ))}
      </datalist>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {value ? (
          <span className="text-status-ok">→ {value}</span>
        ) : text.trim() ? (
          <span className="text-status-warn">no match — pick from the list</span>
        ) : null}
        {showSuggest && (
          <button
            type="button"
            onClick={applySuggestion}
            className="rounded-full bg-clinical-100 px-2 py-0.5 font-medium text-clinical-600 hover:bg-clinical-200 dark:bg-clinical-800 dark:text-clinical-300"
          >
            use suggested: {suggestion.name} ({suggestion.code})
          </button>
        )}
      </div>
    </div>
  );
}
