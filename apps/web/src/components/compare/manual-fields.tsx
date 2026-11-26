'use client';

import {
  MANUAL_FIELDS,
  MANUAL_KEYS,
  type ManualKey,
  type ManualSpecs,
  parseManualNumber,
} from '@lantai-dua/shared/compare';
import { type KeyboardEvent, useId, useState } from 'react';

const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, useGrouping: false });
const show = (n: number | undefined) => (n === undefined ? '' : decimal.format(n));

function Field({
  id,
  fieldKey,
  value,
  onCommit,
}: {
  id: string;
  fieldKey: ManualKey;
  value: number | undefined;
  onCommit: (value: number | null) => void;
}) {
  const { label, unit } = MANUAL_FIELDS[fieldKey];
  const [text, setText] = useState(show(value));
  const [error, setError] = useState<string | null>(null);
  // Komponen tidak di-remount saat URL berubah (fokus tetap di kolom). Isinya disamakan
  // dengan URL hanya saat nilai dari luar berubah, sama dengan RangeFields di katalog.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setText(show(value));
    setError(null);
  }

  const commit = () => {
    const parsed = parseManualNumber(text, fieldKey);
    setError(parsed.error);
    if (parsed.error) return;
    if ((parsed.value ?? undefined) !== value) onCommit(parsed.value);
  };
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commit();
  };

  const errorId = `${id}-${fieldKey}-galat`;
  return (
    <div className="min-w-0">
      <label htmlFor={`${id}-${fieldKey}`} className="text-sm font-medium text-ink">
        {label} ({unit})
      </label>
      <input
        id={`${id}-${fieldKey}`}
        inputMode="decimal"
        autoComplete="off"
        className="mt-1.5 h-11 w-full min-w-0 rounded-md border border-border-input bg-surface px-3 font-mono text-sm tabular-nums aria-invalid:border-danger"
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={onEnter}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Empat kolom ukuran manual. Nilai diterapkan saat kolom kehilangan fokus atau Enter ditekan. */
export function ManualFields({
  specs,
  onCommit,
}: {
  specs: ManualSpecs;
  onCommit: (specs: ManualSpecs) => void;
}) {
  const id = useId();
  return (
    <fieldset className="rounded-lg border border-border bg-surface-sunken p-4">
      <legend className="px-1 font-display text-sm font-semibold text-ink">Ukuran mouse lu</legend>
      <p className="text-sm text-ink-muted">
        Isi yang lu tahu saja. Koma atau titik sama-sama boleh.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {MANUAL_KEYS.map((key) => (
          <Field
            key={key}
            id={id}
            fieldKey={key}
            value={specs[key]}
            onCommit={(value) => {
              const next: ManualSpecs = { ...specs };
              if (value === null) delete next[key];
              else next[key] = value;
              onCommit(next);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
