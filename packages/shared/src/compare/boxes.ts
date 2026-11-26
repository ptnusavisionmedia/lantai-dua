import { MANUAL_FIELDS } from './manual';
import { slotName } from './pair';
import { slotSpecs } from './summary';
import type {
  Box,
  BoxPanel,
  BoxPanels,
  CompareItem,
  ComparePair,
  CurrentSlot,
  ManualKey,
} from './types';

/** Ruang kosong di tepi panel, dalam mm. */
const PAD = 8;

type View = 'top' | 'side';

function size(specs: Record<string, unknown>, key: ManualKey): number | null {
  const v = specs[key];
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

function missingText(
  slot: Exclude<CurrentSlot, null> | CompareItem,
  keys: ManualKey[],
  view: View,
): string {
  const labels = keys.map((k) => MANUAL_FIELDS[k].label.toLowerCase()).join(' dan ');
  if ('kind' in slot && slot.kind === 'manual') {
    return `Isi ${labels} mouse lu untuk melihat tampak ${view === 'top' ? 'atas' : 'samping'}.`;
  }
  return `${labels.charAt(0).toUpperCase()}${labels.slice(1)} ${slotName(slot)} belum tercatat.`;
}

function panel(
  current: Exclude<CurrentSlot, null>,
  target: CompareItem,
  view: View,
): { panel: BoxPanel | null; gap: string | null } {
  const second: ManualKey = view === 'top' ? 'width_mm' : 'height_mm';
  const keys: ManualKey[] = ['length_mm', second];
  const gaps: string[] = [];
  const read = (slot: Exclude<CurrentSlot, null> | CompareItem) => {
    const specs = slotSpecs(slot);
    const missing = keys.filter((k) => size(specs, k) === null);
    if (missing.length > 0) gaps.push(missingText(slot, missing, view));
    return { l: size(specs, 'length_mm'), s: size(specs, second) };
  };
  const a = read(current);
  const b = read(target);
  if (a.l === null || a.s === null || b.l === null || b.s === null) {
    return { panel: null, gap: gaps.join(' ') };
  }

  const maxL = Math.max(a.l, b.l);
  const maxS = Math.max(a.s, b.s);
  // Ujung belakang (telapak) sejajar di kiri. Tampak atas dipusatkan pada sumbu lebar,
  // tampak samping alasnya di "meja".
  const box = (l: number, s: number): Box => ({
    x: PAD,
    y: view === 'top' ? PAD + (maxS - s) / 2 : PAD + maxS - s,
    w: l,
    h: s,
  });
  return {
    panel: {
      width: maxL + 2 * PAD,
      height: maxS + 2 * PAD,
      current: box(a.l, a.s),
      target: box(b.l, b.s),
    },
    gap: null,
  };
}

/**
 * Kotak ukuran tampak atas (panjang × lebar) dan tampak samping (panjang × tinggi) dalam mm.
 * Kedua panel selebar `panjang terbesar + 2·PAD`, jadi skalanya sama. Panel yang angkanya
 * tidak lengkap diganti teks penjelasan.
 */
export function boxPanels(pair: ComparePair): BoxPanels {
  const { current, target } = pair;
  if (!current || !target) return { top: null, side: null, topGap: null, sideGap: null };
  const top = panel(current, target, 'top');
  const side = panel(current, target, 'side');
  return { top: top.panel, side: side.panel, topGap: top.gap, sideGap: side.gap };
}
