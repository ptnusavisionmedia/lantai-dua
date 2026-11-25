'use client';

import type { CatalogQuery, Facet, FacetOption, Range } from '@lantai-dua/shared/catalog';
import { type FormEvent, type KeyboardEvent, useState } from 'react';

type Checklist = Extract<Facet, { kind: 'checklist' }>;

export type FilterPanelProps = {
  query: CatalogQuery;
  brand: Checklist;
  price: { min: number; max: number } | null;
  facets: Facet[];
  onChange: (next: CatalogQuery) => void;
  /** Awalan id input; panel bisa tampil dua kali (sidebar desktop dan sheet HP). */
  idPrefix: string;
};

const LEGEND = 'font-display text-sm font-semibold text-ink';
const CHECK_ROW =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-[15px] hover:bg-surface-sunken';
const CHECKBOX = 'size-[18px] shrink-0 accent-(--color-primary)';

function toggleValue(list: string[], value: string, order: string[]): string[] {
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  return order.filter((v) => next.includes(v));
}

function CheckRow({
  id,
  label,
  count,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label htmlFor={id} className={CHECK_ROW}>
      <input id={id} type="checkbox" className={CHECKBOX} checked={checked} onChange={onToggle} />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-xs text-ink-muted tabular-nums" aria-hidden="true">
          {count}
        </span>
      )}
    </label>
  );
}

function ChecklistGroup({
  idPrefix,
  facet,
  selected,
  onChangeSelected,
}: {
  idPrefix: string;
  facet: Checklist;
  selected: string[];
  onChangeSelected: (next: string[]) => void;
}) {
  // Opsi tanpa produk disembunyikan, kecuali sedang dipilih (supaya bisa dilepas).
  const visible = facet.options.filter(
    (o: FacetOption) => o.count > 0 || selected.includes(o.value),
  );
  if (visible.length === 0) return null;
  const order = facet.options.map((o) => o.value);
  return (
    <fieldset className="border-t border-border pt-4">
      <legend className={`${LEGEND} float-left mb-2 w-full`}>{facet.label}</legend>
      <div className="clear-both flex flex-col">
        {visible.map((o) => (
          <CheckRow
            key={o.value}
            id={`${idPrefix}-${facet.key}-${o.value}`}
            label={o.label}
            count={o.count}
            checked={selected.includes(o.value)}
            onToggle={() => onChangeSelected(toggleValue(selected, o.value, order))}
          />
        ))}
      </div>
    </fieldset>
  );
}

const rangeKey = (r: Range | null | undefined) => `${r?.min ?? ''}-${r?.max ?? ''}`;

/**
 * Harga ditulis orang Indonesia dengan titik ribuan ("1.500.000"), jadi untuk harga semua
 * selain angka dibuang. Satuan lain (gram, mm) boleh berdesimal dengan koma atau titik ("60,5").
 */
function parseNumber(raw: string, integer: boolean): number | undefined {
  const compact = raw.replace(/\s/g, '');
  if (compact === '') return undefined;
  if (integer) {
    const digits = compact.replace(/\D/g, '');
    return digits === '' ? undefined : Number(digits);
  }
  const decimal = compact.replace(',', '.');
  return /^\d+(\.\d+)?$/.test(decimal) ? Number(decimal) : undefined;
}

const rupiahDigits = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const unitDigits = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
  useGrouping: false,
});
const show = (n: number | undefined, integer: boolean) =>
  n === undefined ? '' : (integer ? rupiahDigits : unitDigits).format(n);

/** Dua kolom min/maks. Nilai dikirim saat kolom ditinggalkan atau Enter ditekan. */
function RangeFields({
  idPrefix,
  name,
  label,
  unit,
  value,
  bounds,
  integer = false,
  onCommit,
}: {
  idPrefix: string;
  name: string;
  label: string;
  unit: string | null;
  value: Range | null;
  bounds: { min: number; max: number } | null;
  /** true untuk harga: titik dibaca sebagai pemisah ribuan. */
  integer?: boolean;
  onCommit: (next: Range | null) => void;
}) {
  const [min, setMin] = useState(show(value?.min, integer));
  const [max, setMax] = useState(show(value?.max, integer));
  // Komponen ini tidak di-remount saat nilainya berubah, karena remount membuang fokus dari
  // kolom berikutnya. Isi kolom disamakan dengan URL hanya saat nilai dari luar berubah.
  const valueKey = rangeKey(value);
  const [seen, setSeen] = useState(valueKey);
  if (seen !== valueKey) {
    setSeen(valueKey);
    setMin(show(value?.min, integer));
    setMax(show(value?.max, integer));
  }

  const commit = () => {
    let lo = parseNumber(min, integer);
    let hi = parseNumber(max, integer);
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    const next: Range = {};
    if (lo !== undefined) next.min = lo;
    if (hi !== undefined) next.max = hi;
    const same = next.min === value?.min && next.max === value?.max;
    if (!same) onCommit(next.min === undefined && next.max === undefined ? null : next);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commit();
  };
  // Form dengan dua kolom teks tanpa tombol kirim tidak terkirim lewat Enter (aturan HTML),
  // jadi Enter ditangani langsung di tiap kolom.
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    commit();
  };

  const field =
    'h-11 w-full min-w-0 rounded-md border border-border-input bg-surface px-3 font-mono text-sm tabular-nums';
  return (
    <form onSubmit={onSubmit} className="border-t border-border pt-4">
      <fieldset>
        <legend className={`${LEGEND} mb-2`}>
          {label}
          {unit && <span className="font-text font-normal text-ink-muted"> ({unit})</span>}
        </legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${idPrefix}-${name}-min`}>
            {label} minimum
          </label>
          <input
            id={`${idPrefix}-${name}-min`}
            inputMode={integer ? 'numeric' : 'decimal'}
            className={field}
            placeholder={bounds ? show(bounds.min, integer) : 'Min'}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={commit}
            onKeyDown={onEnter}
          />
          <span className="text-ink-muted" aria-hidden="true">
            –
          </span>
          <label className="sr-only" htmlFor={`${idPrefix}-${name}-max`}>
            {label} maksimum
          </label>
          <input
            id={`${idPrefix}-${name}-max`}
            inputMode={integer ? 'numeric' : 'decimal'}
            className={field}
            placeholder={bounds ? show(bounds.max, integer) : 'Maks'}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={commit}
            onKeyDown={onEnter}
          />
        </div>
      </fieldset>
    </form>
  );
}

export function FilterPanel({ query, brand, price, facets, onChange, idPrefix }: FilterPanelProps) {
  const setAttr = (key: string, value: CatalogQuery['attrs'][string] | null) => {
    const attrs = { ...query.attrs };
    if (value === null || (Array.isArray(value) && value.length === 0)) delete attrs[key];
    else attrs[key] = value;
    onChange({ ...query, attrs });
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className={`${LEGEND} mb-2`}>Ketersediaan</legend>
        <CheckRow
          id={`${idPrefix}-demo`}
          label="Bisa dicoba sekarang"
          checked={query.demo}
          onToggle={() => onChange({ ...query, demo: !query.demo })}
        />
        <CheckRow
          id={`${idPrefix}-stok`}
          label="Stok tersedia"
          checked={query.stok}
          onToggle={() => onChange({ ...query, stok: !query.stok })}
        />
      </fieldset>

      <ChecklistGroup
        idPrefix={idPrefix}
        facet={brand}
        selected={query.merek}
        onChangeSelected={(merek) => onChange({ ...query, merek })}
      />

      <RangeFields
        key="harga"
        integer
        idPrefix={idPrefix}
        name="harga"
        label="Harga"
        unit="Rp"
        value={query.harga}
        bounds={price}
        onCommit={(harga) => onChange({ ...query, harga })}
      />

      {facets.map((facet) => {
        const current = query.attrs[facet.key];
        if (facet.kind === 'checklist') {
          return (
            <ChecklistGroup
              key={facet.key}
              idPrefix={idPrefix}
              facet={facet}
              selected={Array.isArray(current) ? current : []}
              onChangeSelected={(values) => setAttr(facet.key, values)}
            />
          );
        }
        if (facet.kind === 'range') {
          if (!facet.bounds && !current) return null;
          const value = current && current !== true && !Array.isArray(current) ? current : null;
          return (
            <RangeFields
              key={facet.key}
              idPrefix={idPrefix}
              name={facet.key}
              label={facet.label}
              unit={facet.unit}
              value={value}
              bounds={facet.bounds}
              onCommit={(range) => setAttr(facet.key, range)}
            />
          );
        }
        return (
          <fieldset key={facet.key} className="border-t border-border pt-4">
            <legend className="sr-only">{facet.label}</legend>
            <CheckRow
              id={`${idPrefix}-${facet.key}`}
              label={facet.label}
              checked={current === true}
              onToggle={() => setAttr(facet.key, current === true ? null : true)}
            />
          </fieldset>
        );
      })}
    </div>
  );
}
