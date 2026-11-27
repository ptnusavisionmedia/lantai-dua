'use client';

import { dayLabel } from '@lantai-dua/shared/reservation';

/**
 * Deretan tanggal sebagai radio. Wadahnya bisa digeser ke samping sendiri tanpa membuat halaman
 * bergeser. Tanggal tutup tetap tampil tetapi nonaktif.
 */
export function DateStrip({
  window,
  today,
  closedDates,
  value,
  onChange,
}: {
  window: string[];
  today: string;
  closedDates: Set<string>;
  value: string;
  onChange: (date: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-display text-sm font-semibold text-ink">Tanggal</legend>
      <div className="mt-3 -mx-1 overflow-x-auto overscroll-x-contain px-1 pb-2">
        <div className="flex w-max gap-2">
          {window.map((date) => {
            const closed = closedDates.has(date);
            const checked = date === value;
            return (
              <label
                key={date}
                data-date={date}
                className={`relative inline-flex min-h-11 min-w-[76px] flex-col items-center justify-center rounded-md border px-3 py-1.5 text-sm transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
                  checked
                    ? 'border-primary bg-primary text-on-primary'
                    : closed
                      ? 'cursor-not-allowed border-border bg-surface-sunken text-ink-subtle'
                      : 'cursor-pointer border-border-input bg-surface text-ink hover:bg-surface-sunken'
                }`}
              >
                <input
                  type="radio"
                  name="tanggal"
                  value={date}
                  checked={checked}
                  disabled={closed}
                  onChange={() => onChange(date)}
                  className="absolute inset-0 cursor-[inherit] appearance-none opacity-0"
                />
                <span className="font-medium">{dayLabel(date, today)}</span>
                {closed && <span className="text-[12px]">Tutup</span>}
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
