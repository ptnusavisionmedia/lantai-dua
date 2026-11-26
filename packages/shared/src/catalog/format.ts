import type { AttributeDef } from './types';

const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

/** `1249000` → `Rp1.249.000`. */
export function formatRupiah(n: number): string {
  return `Rp${rupiah.format(n)}`;
}

/** Dimensi mouse `P × L × T mm`, atau null kalau salah satunya belum tercatat. */
export function formatDimensions(specs: Record<string, unknown>): string | null {
  const dims = [specs.length_mm, specs.width_mm, specs.height_mm];
  if (!dims.every((d): d is number => typeof d === 'number')) return null;
  return `${dims.map((d) => decimal.format(d)).join(' × ')} mm`;
}

/**
 * Nilai satu atribut template untuk ditampilkan, dengan satuannya. Null kalau kosong atau tipenya
 * tidak cocok. Dipakai tabel spek detail produk dan tabel Bandingkan.
 */
export function formatSpecValue(attr: AttributeDef, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  switch (attr.type) {
    case 'number':
      return typeof value === 'number'
        ? `${decimal.format(value)}${attr.unit ? ` ${attr.unit}` : ''}`
        : null;
    case 'boolean':
      return value === true ? 'Ya' : value === false ? 'Tidak' : null;
    case 'multi_enum':
      return Array.isArray(value) && value.length > 0 ? value.join(', ') : null;
    default:
      return typeof value === 'string' ? value : null;
  }
}
