import { hasDemoUnit } from './demo';
import { MANUAL_KEYS } from './manual';
import { slotItem } from './slot';
import type { CompareExamples, CompareItem, ComparePair, CurrentSlot, Gear } from './types';

const byName = (a: CompareItem, b: CompareItem) =>
  a.brandName.localeCompare(b.brandName, 'id') || a.modelName.localeCompare(b.modelName, 'id');

/** Isi pemilih: grup "Dijual di LANTAI DUA" dan "Mouse lain", urut merek lalu model. */
export function pickerGroups(items: CompareItem[]): {
  forSale: CompareItem[];
  others: CompareItem[];
} {
  const sorted = [...items].sort(byName);
  return { forSale: sorted.filter((i) => i.isForSale), others: sorted.filter((i) => !i.isForSale) };
}

/** Gear menjadi isi slot sekarang. Produk yang sudah tidak aktif (tidak ada di daftar) dianggap kosong. */
export function gearToSlot(gear: Gear | null, items: CompareItem[]): CurrentSlot {
  if (!gear) return null;
  if (gear.kind === 'manual') return { kind: 'manual', specs: { ...gear.specs } };
  const item = items.find((i) => i.id === gear.productId);
  return item ? { kind: 'item', item } : null;
}

function weightOf(item: CompareItem): number {
  const w = item.specs.weight_g;
  return typeof w === 'number' ? w : Number.POSITIVE_INFINITY;
}

/** Cadangan incaran: mouse dijual teringan yang punya unit demo, lalu mouse dijual teringan. */
function fallbackTarget(items: CompareItem[]): CompareItem | null {
  const ranked = items
    .filter((i) => i.isForSale)
    .sort(
      (a, b) =>
        Number(hasDemoUnit(b)) - Number(hasDemoUnit(a)) ||
        weightOf(a) - weightOf(b) ||
        a.slug.localeCompare(b.slug),
    );
  return ranked[0] ?? null;
}

/**
 * Isi awal kedua slot (desain §5.4): URL, lalu Gear gue untuk slot sekarang, lalu pasangan contoh
 * kalau URL tidak memuat slot yang sah sama sekali.
 */
export function resolveInitialPair(
  fromUrl: ComparePair,
  ctx: { items: CompareItem[]; gear: Gear | null; examples: CompareExamples },
): ComparePair {
  const urlEmpty = fromUrl.current === null && fromUrl.target === null;
  let current = fromUrl.current ?? gearToSlot(ctx.gear, ctx.items);
  let target = fromUrl.target;
  if (urlEmpty) {
    if (current === null) {
      const example = ctx.items.find((i) => i.id === ctx.examples.currentId);
      current = example ? { kind: 'item', item: example } : null;
    }
    if (target === null) {
      const example = ctx.items.find((i) => i.id === ctx.examples.targetId);
      target = example?.isForSale ? example : fallbackTarget(ctx.items);
    }
  }
  return { current, target };
}

/** Apakah isi slot sama dengan gear yang tersimpan. */
export function slotMatchesGear(slot: CurrentSlot, gear: Gear | null): boolean {
  if (!slot || !gear) return false;
  if (slot.kind === 'item') return gear.kind === 'item' && gear.productId === slot.item.id;
  if (gear.kind !== 'manual') return false;
  return MANUAL_KEYS.every((k) => slot.specs[k] === gear.specs[k]);
}

/** Nama untuk orang: "Logitech G102 Lightsync", atau "Ukuran lu" untuk ukuran manual. */
export function slotName(slot: Exclude<CurrentSlot, null> | CompareItem): string {
  const item = slotItem(slot);
  return item ? `${item.brandName} ${item.modelName}` : 'Ukuran lu';
}

/** Judul halaman: kedua nama kalau kedua slot berisi mouse dari daftar, selain itu umum. */
export function compareTitle(pair: ComparePair): string {
  const current = slotItem(pair.current);
  if (!current || !pair.target) return 'Bandingkan mouse';
  return `Bandingkan ${slotName(current)} vs ${slotName(pair.target)}`;
}
