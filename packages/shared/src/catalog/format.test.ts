import { describe, expect, it } from 'vitest';
import { formatDimensions, formatRupiah, formatSpecValue } from './format';
import { priceLabel } from './labels';
import type { AttributeDef } from './types';

describe('format', () => {
  it('formats rupiah and price ranges', () => {
    expect(formatRupiah(1249000)).toBe('Rp1.249.000');
    expect(priceLabel(1249000, 1249000)).toBe('Rp1.249.000');
    expect(priceLabel(1149000, 1199000)).toBe('mulai Rp1.149.000');
  });

  it('formats mouse dimensions only when all three exist', () => {
    expect(formatDimensions({ length_mm: 124, width_mm: 64, height_mm: 38 })).toBe(
      '124 × 64 × 38 mm',
    );
    expect(formatDimensions({ length_mm: 124.5, width_mm: 64, height_mm: 38 })).toBe(
      '124,5 × 64 × 38 mm',
    );
    // Dua desimal seperti di halaman resmi (VortexSeries Ignix F1).
    expect(formatDimensions({ length_mm: 121.48, width_mm: 61.27, height_mm: 38.2 })).toBe(
      '121,48 × 61,27 × 38,2 mm',
    );
    expect(formatDimensions({ length_mm: 124 })).toBeNull();
  });
});

describe('formatSpecValue', () => {
  const attr = (type: AttributeDef['type'], unit: string | null = null): AttributeDef => ({
    key: 'k',
    label: 'K',
    type,
    scope: 'product',
    unit,
    options: null,
    isFilterable: false,
    isComparable: true,
    sortOrder: 1,
  });

  it('formats spec values like the 1A spec table', () => {
    expect(formatSpecValue(attr('number', 'mm'), 121.48)).toBe('121,48 mm');
    expect(formatSpecValue(attr('number'), 3)).toBe('3');
    expect(formatSpecValue(attr('boolean'), true)).toBe('Ya');
    expect(formatSpecValue(attr('boolean'), false)).toBe('Tidak');
    expect(formatSpecValue(attr('multi_enum'), ['Kabel', 'Bluetooth'])).toBe('Kabel, Bluetooth');
    expect(formatSpecValue(attr('enum'), 'Simetris')).toBe('Simetris');
  });

  it('returns null for missing or mistyped values', () => {
    expect(formatSpecValue(attr('number', 'g'), undefined)).toBeNull();
    expect(formatSpecValue(attr('number', 'g'), '60')).toBeNull();
    expect(formatSpecValue(attr('text'), '')).toBeNull();
    expect(formatSpecValue(attr('multi_enum'), [])).toBeNull();
    expect(formatSpecValue(attr('boolean'), 'ya')).toBeNull();
  });
});
