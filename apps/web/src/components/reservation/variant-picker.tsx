'use client';

import { MAX_ITEMS, type ReservableVariant, variantLabel } from '@lantai-dua/shared/reservation';
import { useRef } from 'react';
import { Button } from '../button';
import { X } from '../icons';

/**
 * Pilihan varian demo: chip yang bisa dihapus, lalu tombol "+ Tambah" yang membuka dialog berisi
 * varian per kategori. Varian yang semua unitnya diservis tampil nonaktif.
 */
export function VariantPicker({
  variants,
  selected,
  onChange,
}: {
  variants: ReservableVariant[];
  selected: string[];
  onChange: (skus: string[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const bySku = new Map(variants.map((v) => [v.sku, v]));
  const full = selected.length >= MAX_ITEMS;
  const options = variants.filter((v) => !selected.includes(v.sku));
  const groups = [...new Set(options.map((v) => v.categoryName))].map((name) => ({
    name,
    items: options.filter((v) => v.categoryName === name),
  }));

  const add = (sku: string) => {
    dialog.current?.close();
    onChange([...selected, sku]);
  };

  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold text-ink">
        Yang mau disiapin{' '}
        <span className="font-text font-normal text-ink-muted">(maks. {MAX_ITEMS})</span>
      </legend>
      <ul className="mt-3 flex flex-wrap gap-2">
        {selected.map((sku) => {
          const v = bySku.get(sku);
          if (!v) return null;
          const label = variantLabel(v);
          return (
            <li
              key={sku}
              className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-border-input bg-surface py-1 pr-1 pl-4 text-sm text-ink"
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
              {v.assignableUnits === 0 && (
                <span className="text-[13px] text-ink-muted">· Sedang diservis</span>
              )}
              <button
                type="button"
                aria-label={`Hapus ${label}`}
                onClick={() => onChange(selected.filter((s) => s !== sku))}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
              >
                <X width={16} height={16} />
              </button>
            </li>
          );
        })}
        <li>
          <Button
            variant="secondary"
            disabled={full}
            aria-describedby={full ? 'tambah-penuh' : undefined}
            onClick={() => dialog.current?.showModal()}
          >
            + Tambah
          </Button>
        </li>
      </ul>
      {full && (
        <p id="tambah-penuh" className="mt-2 text-sm text-ink-muted">
          Maksimal {MAX_ITEMS} unit demo per reservasi.
        </p>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="tambah-judul"
        className="m-auto max-h-[85vh] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-lg border border-border bg-surface p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <h2 id="tambah-judul" className="font-display text-lg font-semibold">
            Tambah unit demo
          </h2>
          <Button variant="text" onClick={() => dialog.current?.close()}>
            Tutup
          </Button>
        </div>
        <div className="space-y-5 px-5 py-4">
          {groups.length === 0 && <p className="text-ink-muted">Semua unit demo sudah dipilih.</p>}
          {groups.map((g) => (
            <section key={g.name}>
              <h3 className="text-[13px] font-semibold text-ink-muted">{g.name}</h3>
              <ul className="mt-2 grid gap-1">
                {g.items.map((v) => (
                  <li key={v.sku}>
                    <button
                      type="button"
                      disabled={v.assignableUnits === 0}
                      onClick={() => add(v.sku)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm hover:bg-surface-sunken disabled:cursor-not-allowed disabled:text-ink-muted disabled:hover:bg-transparent"
                    >
                      <span>{variantLabel(v)}</span>
                      {v.assignableUnits === 0 && (
                        <span className="shrink-0 text-[13px]">Sedang diservis</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </dialog>
    </fieldset>
  );
}
