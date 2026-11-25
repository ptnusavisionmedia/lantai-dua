import { describe, expect, it } from 'vitest';
import { pickDemoForVariant } from './demo';
import type { VariantAvailability } from './types';

const variant = (
  sku: string,
  demoStatus: VariantAvailability['demoStatus'],
): VariantAvailability => ({
  id: sku,
  productId: 'p',
  sku,
  name: `Varian ${sku}`,
  attributes: {},
  priceIdr: 1,
  stockQty: 1,
  sortOrder: 0,
  demoStatus,
  imagePath: null,
});

const product = {
  demoStatus: 'available' as const,
  demoVariantName: 'Varian B',
  demoVariantSku: 'B',
};

describe('pickDemoForVariant', () => {
  it('prefers the selected variant when its unit is available', () => {
    expect(
      pickDemoForVariant(product, [variant('A', 'available'), variant('B', 'available')], 'A'),
    ).toEqual({ status: 'available', variantName: 'Varian A', sku: 'A' });
  });

  it('falls back to the product best when the selected variant has no available unit', () => {
    expect(
      pickDemoForVariant(product, [variant('A', 'in_use'), variant('B', 'available')], 'A'),
    ).toEqual({ status: 'available', variantName: 'Varian B', sku: 'B' });
  });

  it('falls back to the product best for an unknown sku', () => {
    expect(pickDemoForVariant(product, [variant('B', 'available')], 'ZZZ')).toEqual({
      status: 'available',
      variantName: 'Varian B',
      sku: 'B',
    });
  });

  it('returns free with no variant for free categories', () => {
    expect(
      pickDemoForVariant(
        { demoStatus: 'free', demoVariantName: null, demoVariantSku: null },
        [variant('A', 'free')],
        'A',
      ),
    ).toEqual({ status: 'free', variantName: null, sku: null });
  });
});
