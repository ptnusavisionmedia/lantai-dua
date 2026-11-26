import type { SearchParamsLike } from '../catalog/query';
import { inManualRange, MANUAL_FIELDS, MANUAL_KEYS, roundSize } from './manual';
import type { CompareItem, ComparePair, CurrentSlot, ManualSpecs } from './types';

export const EMPTY_PAIR: ComparePair = { current: null, target: null };

/** Kata cadangan untuk ukuran manual di parameter `sekarang` (tidak boleh jadi slug produk). */
export const MANUAL_SLUG = 'ukur';

// Angka di URL selalu memakai titik desimal.
const URL_NUMBER = /^\d+(\.\d+)?$/;

/**
 * Membaca pasangan Bandingkan dari URL (desain §5.3). Parameter yang tidak sah diabaikan:
 * slug tidak dikenal dan referensi di slot incaran membuat slotnya kosong, angka di luar rentang
 * dibuang, dan angka hanya dibaca kalau `sekarang=ukur`.
 */
export function parseCompareQuery(params: SearchParamsLike, items: CompareItem[]): ComparePair {
  const bySlug = new Map(items.map((i) => [i.slug, i]));

  const sekarang = params.get('sekarang');
  let current: CurrentSlot = null;
  if (sekarang === MANUAL_SLUG) {
    const specs: ManualSpecs = {};
    for (const key of MANUAL_KEYS) {
      const raw = params.get(MANUAL_FIELDS[key].param);
      if (raw === null || !URL_NUMBER.test(raw)) continue;
      const value = roundSize(Number(raw));
      if (inManualRange(key, value)) specs[key] = value;
    }
    current = { kind: 'manual', specs };
  } else if (sekarang) {
    const item = bySlug.get(sekarang);
    if (item) current = { kind: 'item', item };
  }

  const incaran = params.get('incaran');
  const target = incaran ? bySlug.get(incaran) : undefined;
  return { current, target: target?.isForSale ? target : null };
}

/** Menulis pasangan ke `?…` dengan urutan tetap: sekarang, panjang, lebar, tinggi, bobot, incaran. */
export function serializeCompareQuery(pair: ComparePair): string {
  const parts: string[] = [];
  const { current, target } = pair;
  if (current?.kind === 'item') {
    parts.push(`sekarang=${encodeURIComponent(current.item.slug)}`);
  } else if (current?.kind === 'manual') {
    parts.push(`sekarang=${MANUAL_SLUG}`);
    for (const key of MANUAL_KEYS) {
      const value = current.specs[key];
      if (value !== undefined) parts.push(`${MANUAL_FIELDS[key].param}=${String(value)}`);
    }
  }
  if (target) parts.push(`incaran=${encodeURIComponent(target.slug)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
