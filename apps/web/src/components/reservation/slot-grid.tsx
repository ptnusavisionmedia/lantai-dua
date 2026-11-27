'use client';

import type { Slot } from '@lantai-dua/shared/reservation';
import { useState } from 'react';

/**
 * Grid jam sebagai radio. Slot yang tidak bisa dipilih tetap tampil dan tetap bisa difokus
 * (`aria-disabled`, bukan `disabled`), supaya alasannya bisa dibaca saat difokus atau disorot.
 */
export function SlotGrid({
  slots,
  value,
  reasonText,
  onChange,
  busy,
}: {
  slots: Slot[];
  value: string | null;
  reasonText: (s: Slot) => string | null;
  onChange: (time: string) => void;
  busy: boolean;
}) {
  const [hint, setHint] = useState<string | null>(null);
  const closed = slots.length > 0 && slots.every((s) => s.reason === 'closed');
  const hintSlot = slots.find((s) => s.time === hint);
  const hintText = hintSlot ? reasonText(hintSlot) : null;

  return (
    <fieldset className="min-w-0" aria-busy={busy}>
      <legend className="font-display text-sm font-semibold text-ink">Jam</legend>
      {closed ? (
        <p className="mt-3 text-ink-muted">Toko tutup di tanggal ini. Pilih tanggal lain.</p>
      ) : (
        <>
          <div
            className={`mt-3 grid grid-cols-4 gap-2 min-[480px]:grid-cols-6 md:grid-cols-8 ${busy ? 'opacity-60' : ''}`}
          >
            {slots.map((s) => {
              const checked = s.available && s.time === value;
              return (
                <label
                  key={s.startsAt}
                  onMouseEnter={() => setHint(s.time)}
                  onMouseLeave={() => setHint(null)}
                  className={`relative inline-flex min-h-11 items-center justify-center rounded-md border font-mono text-sm tabular-nums transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
                    checked
                      ? 'border-primary bg-primary text-on-primary'
                      : s.available
                        ? 'cursor-pointer border-border-input bg-surface text-ink hover:bg-surface-sunken'
                        : 'cursor-not-allowed border-border bg-surface-sunken text-ink-subtle line-through'
                  }`}
                >
                  <input
                    type="radio"
                    name="jam"
                    value={s.time}
                    checked={checked}
                    aria-disabled={!s.available || undefined}
                    aria-describedby="alasan-slot"
                    onFocus={() => setHint(s.time)}
                    onBlur={() => setHint(null)}
                    onClick={(e) => {
                      if (!s.available) e.preventDefault();
                    }}
                    onChange={() => {
                      if (s.available) onChange(s.time);
                    }}
                    className="absolute inset-0 cursor-[inherit] appearance-none opacity-0"
                  />
                  {s.time}
                </label>
              );
            })}
          </div>
          <p id="alasan-slot" aria-live="polite" className="mt-3 min-h-5 text-sm text-ink-muted">
            {hintText ? `${hintSlot?.time} — ${hintText}` : ''}
          </p>
        </>
      )}
    </fieldset>
  );
}
