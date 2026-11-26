import { demoLabel } from '../catalog/labels';
import type { Tone } from '../catalog/types';
import { MANUAL_SLUG } from './query';
import { slotItem } from './slot';
import type { CompareItem, ComparePair, CurrentSlot } from './types';

const UNIT_STATUSES: readonly string[] = ['available', 'in_use', 'servicing'];

/**
 * Mouse dijual yang punya unit demo, apa pun statusnya. Reservasi dipesan untuk jadwal ke depan,
 * jadi unit yang sedang dipakai atau diservis tetap bisa dipesan (desain §5.7).
 */
export function hasDemoUnit(slot: CurrentSlot | CompareItem | null): boolean {
  const item = slotItem(slot);
  return item !== null && UNIT_STATUSES.includes(item.demoStatus) && item.demoVariantSku !== null;
}

/** Status demo satu mouse. Referensi dan ukuran manual tidak ada di showroom. */
export function slotDemoLabel(slot: Exclude<CurrentSlot, null> | CompareItem): {
  tone: Tone;
  text: string;
} {
  const item = slotItem(slot);
  if (!item?.isForSale) return { tone: 'none', text: 'Tidak ada di showroom' };
  return demoLabel(item.demoStatus, item.demoVariantName);
}

/**
 * Tujuan tombol "Coba keduanya": SKU unit demo terbaik dari tiap mouse yang punya unit, lalu
 * `bawa` kalau mouse sekarang tidak ada di showroom. Null kalau satu slot kosong atau tidak ada unit.
 */
export function tryBothHref(pair: ComparePair): string | null {
  const { current, target } = pair;
  if (!current || !target) return null;
  const skus: string[] = [];
  for (const slot of [current, target]) {
    const sku = hasDemoUnit(slot) ? slotItem(slot)?.demoVariantSku : null;
    if (sku && !skus.includes(sku)) skus.push(sku);
  }
  if (skus.length === 0) return null;
  let href = `/reservasi/baru?varian=${skus.map(encodeURIComponent).join(',')}`;
  if (!hasDemoUnit(current)) {
    const bawa = current.kind === 'manual' ? MANUAL_SLUG : current.item.slug;
    href += `&bawa=${encodeURIComponent(bawa)}`;
  }
  return href;
}
