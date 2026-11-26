'use client';

import {
  type CompareItem,
  type ComparePair,
  type CurrentSlot,
  MANUAL_SLUG,
  type ManualSpecs,
  pickerGroups,
  slotName,
} from '@lantai-dua/shared/compare';
import { useId, useMemo } from 'react';

const SAVED = 'tersimpan';
const LABEL = 'font-display text-sm font-semibold text-ink';
const SELECT =
  'mt-2 h-11 w-full min-w-0 rounded-md border border-border-input bg-surface px-3 text-[15px] text-ink';

function currentValue(slot: CurrentSlot, allowManual: boolean): string {
  if (!slot) return '';
  if (slot.kind === 'item') return slot.item.slug;
  return allowManual ? MANUAL_SLUG : SAVED;
}

/**
 * Dua pemilih Bandingkan. Slot sekarang berisi mouse dijual dan mouse lain, ditambah ukuran manual
 * (halaman penuh) atau ukuran yang tersimpan (beranda). Slot incaran hanya berisi mouse dijual.
 */
export function PairPicker({
  items,
  pair,
  allowManual,
  savedManual = null,
  onChange,
}: {
  items: CompareItem[];
  pair: ComparePair;
  allowManual: boolean;
  savedManual?: ManualSpecs | null;
  onChange: (pair: ComparePair) => void;
}) {
  const id = useId();
  const { forSale, others } = useMemo(() => pickerGroups(items), [items]);
  const bySlug = useMemo(() => new Map(items.map((i) => [i.slug, i])), [items]);

  const changeCurrent = (value: string) => {
    if (value === MANUAL_SLUG) {
      const specs = pair.current?.kind === 'manual' ? pair.current.specs : {};
      onChange({ ...pair, current: { kind: 'manual', specs } });
    } else if (value === SAVED && savedManual) {
      onChange({ ...pair, current: { kind: 'manual', specs: { ...savedManual } } });
    } else {
      const item = bySlug.get(value);
      if (item) onChange({ ...pair, current: { kind: 'item', item } });
    }
  };
  const changeTarget = (value: string) => {
    const item = bySlug.get(value);
    if (item?.isForSale) onChange({ ...pair, target: item });
  };

  const option = (i: CompareItem) => (
    <option key={i.slug} value={i.slug}>
      {slotName(i)}
    </option>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0">
        <label htmlFor={`${id}-sekarang`} className={LABEL}>
          Mouse gue sekarang
        </label>
        <select
          id={`${id}-sekarang`}
          className={SELECT}
          value={currentValue(pair.current, allowManual)}
          onChange={(e) => changeCurrent(e.target.value)}
        >
          <option value="" disabled>
            Pilih mouse yang lu pakai sekarang
          </option>
          {forSale.length > 0 && (
            <optgroup label="Dijual di LANTAI DUA">{forSale.map(option)}</optgroup>
          )}
          {others.length > 0 && <optgroup label="Mouse lain">{others.map(option)}</optgroup>}
          {savedManual && <option value={SAVED}>Ukuran yang lu simpan</option>}
          {allowManual && <option value={MANUAL_SLUG}>Isi ukuran sendiri</option>}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor={`${id}-incaran`} className={LABEL}>
          Mouse incaran
        </label>
        <select
          id={`${id}-incaran`}
          className={SELECT}
          value={pair.target?.slug ?? ''}
          onChange={(e) => changeTarget(e.target.value)}
        >
          <option value="" disabled>
            Pilih mouse incaran
          </option>
          {forSale.map(option)}
        </select>
      </div>
    </div>
  );
}
