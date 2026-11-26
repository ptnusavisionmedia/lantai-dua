import { formatRupiah, formatSpecValue } from '../catalog/format';
import { priceLabel } from '../catalog/labels';
import type { AttributeDef } from '../catalog/types';
import { MANUAL_KEYS } from './manual';
import { slotItem } from './slot';
import { numberDiff, slotSpecs } from './summary';
import type { ComparePair, CompareTableRow } from './types';

const DASH = '–';
const SIZE_KEYS: readonly string[] = MANUAL_KEYS;

/** `−6,2 mm`, `+3 g`, atau `Sama` kalau selisihnya dibulatkan menjadi nol. Gram tanpa desimal. */
function signed(d: number, attr: AttributeDef): string {
  const decimals = attr.unit === 'g' ? 0 : 1;
  const factor = 10 ** decimals;
  const abs = Math.round(Math.abs(d) * factor) / factor;
  if (abs === 0) return 'Sama';
  const text = new Intl.NumberFormat('id-ID', { maximumFractionDigits: decimals }).format(abs);
  return `${d < 0 ? '−' : '+'}${text}${attr.unit ? ` ${attr.unit}` : ''}`;
}

/**
 * Baris tabel Bandingkan: empat ukuran, harga (kalau kedua mouse punya harga), lalu atribut
 * template lain yang bisa dibandingkan. Baris yang kosong di kedua sisi dilewati.
 */
export function compareRows(pair: ComparePair, attributes: AttributeDef[]): CompareTableRow[] {
  const { current, target } = pair;
  if (!current || !target) return [];
  const a = slotSpecs(current);
  const b = target.specs;

  const comparable = attributes
    .filter((attr) => attr.isComparable && attr.scope === 'product')
    .sort((x, y) => x.sortOrder - y.sortOrder);
  const row = (attr: AttributeDef): CompareTableRow | null => {
    const cv = formatSpecValue(attr, a[attr.key]);
    const tv = formatSpecValue(attr, b[attr.key]);
    if (cv === null && tv === null) return null;
    const d = attr.type === 'number' ? numberDiff(a, b, attr.key) : null;
    return {
      key: attr.key,
      label: attr.label,
      current: cv ?? DASH,
      target: tv ?? DASH,
      diff: d === null ? null : signed(d, attr),
    };
  };

  const rows: (CompareTableRow | null)[] = comparable
    .filter((attr) => SIZE_KEYS.includes(attr.key))
    .map(row);

  const item = slotItem(current);
  if (
    item?.priceMin != null &&
    item.priceMax != null &&
    target.priceMin != null &&
    target.priceMax != null
  ) {
    const d = target.priceMin - item.priceMin;
    rows.push({
      key: 'harga',
      label: 'Harga',
      current: priceLabel(item.priceMin, item.priceMax),
      target: priceLabel(target.priceMin, target.priceMax),
      diff: d === 0 ? 'Sama' : `${d < 0 ? '−' : '+'}${formatRupiah(Math.abs(d))}`,
    });
  }

  rows.push(...comparable.filter((attr) => !SIZE_KEYS.includes(attr.key)).map(row));
  return rows.filter((r): r is CompareTableRow => r !== null);
}
