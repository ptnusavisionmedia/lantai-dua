import { slotItem } from './slot';
import type { CompareItem, ComparePair, CurrentSlot } from './types';

const mm = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const gram = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Spek di dalam slot: ukuran manual, atau spek mouse dari daftar. */
export function slotSpecs(slot: CurrentSlot | CompareItem | null): Record<string, unknown> {
  if (slot === null) return {};
  if ('kind' in slot) return slot.kind === 'manual' ? slot.specs : slot.item.specs;
  return slot.specs;
}

function sizeOf(specs: Record<string, unknown>, key: string): number | null {
  const v = specs[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Selisih `incaran − sekarang` untuk satu angka, atau null kalau salah satunya tidak ada. */
export function numberDiff(
  current: Record<string, unknown>,
  target: Record<string, unknown>,
  key: string,
): number | null {
  const a = sizeOf(current, key);
  const b = sizeOf(target, key);
  return a === null || b === null ? null : b - a;
}

type Part = { same: true } | { same: false; text: string };

function weightPart(d: number): Part {
  if (Math.abs(d) < 1) return { same: true };
  return { same: false, text: `lebih ${d < 0 ? 'ringan' : 'berat'} ${gram.format(Math.abs(d))} g` };
}

function lengthPart(d: number): Part {
  if (Math.abs(d) < 0.5) return { same: true };
  return {
    same: false,
    text: `lebih ${d < 0 ? 'pendek' : 'panjang'} ${mm.format(Math.abs(d))} mm`,
  };
}

/**
 * Kalimat ringkas selisih bobot dan panjang, dari incaran terhadap mouse sekarang (desain §5.6).
 * Null kalau salah satu slot kosong atau kedua angka itu tidak bisa dihitung.
 */
export function summarySentence(pair: ComparePair): string | null {
  const { current, target } = pair;
  if (!current || !target) return null;
  if (slotItem(current)?.id === target.id) return 'Dua pilihan ini mouse yang sama.';

  const specs = slotSpecs(current);
  const wd = numberDiff(specs, target.specs, 'weight_g');
  const ld = numberDiff(specs, target.specs, 'length_mm');
  const w = wd === null ? null : weightPart(wd);
  const l = ld === null ? null : lengthPart(ld);

  if (w && l) {
    if (w.same) {
      return l.same
        ? 'Bobot dan panjangnya hampir sama.'
        : `Incaran ${l.text}, bobotnya hampir sama.`;
    }
    return l.same
      ? `Incaran ${w.text}, panjangnya hampir sama.`
      : `Incaran ${w.text} dan ${l.text}.`;
  }
  if (w) return w.same ? 'Bobotnya hampir sama.' : `Incaran ${w.text}.`;
  if (l) return l.same ? 'Panjangnya hampir sama.' : `Incaran ${l.text}.`;
  return null;
}
