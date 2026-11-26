import type { ManualKey, ManualSpecs } from './types';

export const MANUAL_KEYS: readonly ManualKey[] = ['length_mm', 'width_mm', 'height_mm', 'weight_g'];

/** Nama parameter URL, label, satuan, dan rentang wajar tiap ukuran manual (desain §5.2). */
export const MANUAL_FIELDS: Record<
  ManualKey,
  {
    param: 'panjang' | 'lebar' | 'tinggi' | 'bobot';
    label: string;
    unit: 'mm' | 'g';
    min: number;
    max: number;
  }
> = {
  length_mm: { param: 'panjang', label: 'Panjang', unit: 'mm', min: 80, max: 160 },
  width_mm: { param: 'lebar', label: 'Lebar', unit: 'mm', min: 40, max: 100 },
  height_mm: { param: 'tinggi', label: 'Tinggi', unit: 'mm', min: 20, max: 60 },
  weight_g: { param: 'bobot', label: 'Bobot', unit: 'g', min: 20, max: 200 },
};

const INVALID = 'Isi dengan angka, misalnya 125 atau 125,5.';
const DECIMAL = /^\d+(\.\d+)?$/;

/** Dibulatkan ke dua desimal, sama dengan ketelitian angka resmi pabrikan. */
export function roundSize(n: number): number {
  return Math.round(n * 100) / 100;
}

export function inManualRange(key: ManualKey, n: number): boolean {
  const { min, max } = MANUAL_FIELDS[key];
  return Number.isFinite(n) && n >= min && n <= max;
}

/** Membaca satu kolom ukuran manual. Koma dan titik desimal sama-sama diterima. */
export function parseManualNumber(
  raw: string,
  key: ManualKey,
): { value: number | null; error: string | null } {
  const text = raw.trim();
  if (text === '') return { value: null, error: null };
  const normalized = text.replace(',', '.');
  if (!DECIMAL.test(normalized)) return { value: null, error: INVALID };
  const value = roundSize(Number(normalized));
  if (!inManualRange(key, value)) {
    const { label, min, max, unit } = MANUAL_FIELDS[key];
    return { value: null, error: `${label} harus antara ${min} dan ${max} ${unit}.` };
  }
  return { value, error: null };
}

/**
 * Ukuran manual yang boleh disimpan: hanya empat ukuran, berupa angka dalam rentang, minimal satu.
 * Selain itu null. Dipakai di server sebelum menyimpan Gear gue.
 */
export function validateManualSpecs(specs: Record<string, unknown>): ManualSpecs | null {
  const out: ManualSpecs = {};
  for (const [key, value] of Object.entries(specs)) {
    if (!(MANUAL_KEYS as readonly string[]).includes(key)) return null;
    if (typeof value !== 'number' || !inManualRange(key as ManualKey, value)) return null;
    out[key as ManualKey] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}
