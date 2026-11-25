import { describe, expect, it } from 'vitest';
import { formatDimensions, formatRupiah } from './format';
import { priceLabel } from './labels';

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
    expect(formatDimensions({ length_mm: 124 })).toBeNull();
  });
});
