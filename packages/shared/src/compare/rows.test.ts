import { describe, expect, it } from 'vitest';
import { fromCompareRow, fromGearRow } from './rows';

describe('fromCompareRow', () => {
  it('maps a compare_items row', () => {
    expect(
      fromCompareRow({
        id: 'p1',
        slug: 'logitech-g102-lightsync',
        model_name: 'G102 Lightsync',
        brand_slug: 'logitech',
        brand_name: 'Logitech',
        category_slug: 'mouse',
        is_for_sale: false,
        specs: { length_mm: 116.6 },
        eloshapes_url: null,
        price_min: null,
        price_max: null,
        demo_status: 'none',
        demo_variant_sku: null,
        demo_variant_name: null,
      }),
    ).toEqual({
      id: 'p1',
      slug: 'logitech-g102-lightsync',
      modelName: 'G102 Lightsync',
      brandSlug: 'logitech',
      brandName: 'Logitech',
      categorySlug: 'mouse',
      isForSale: false,
      specs: { length_mm: 116.6 },
      eloshapesUrl: null,
      priceMin: null,
      priceMax: null,
      demoStatus: 'none',
      demoVariantSku: null,
      demoVariantName: null,
    });
  });

  it('narrows unknown values to safe defaults', () => {
    const item = fromCompareRow({
      id: null,
      slug: null,
      model_name: null,
      brand_slug: null,
      brand_name: null,
      category_slug: null,
      is_for_sale: null,
      specs: ['bukan objek'],
      eloshapes_url: null,
      price_min: 900_000,
      price_max: 950_000,
      demo_status: 'aneh',
      demo_variant_sku: null,
      demo_variant_name: null,
    });
    expect(item).toMatchObject({
      isForSale: false,
      specs: {},
      priceMin: 900_000,
      priceMax: 950_000,
      demoStatus: 'none',
    });
  });
});

describe('fromGearRow', () => {
  it('maps a product gear', () => {
    expect(fromGearRow({ product_id: 'p1', manual_specs: null })).toEqual({
      kind: 'item',
      productId: 'p1',
    });
  });

  it('keeps only positive sizes from manual gear', () => {
    expect(
      fromGearRow({
        product_id: null,
        manual_specs: { length_mm: 125, weight_g: 60, sensor: 'x', width_mm: -3, height_mm: '40' },
      }),
    ).toEqual({ kind: 'manual', specs: { length_mm: 125, weight_g: 60 } });
  });

  it('returns null for empty gear', () => {
    expect(fromGearRow({ product_id: null, manual_specs: null })).toBeNull();
    expect(fromGearRow({ product_id: null, manual_specs: {} })).toBeNull();
    expect(fromGearRow({ product_id: null, manual_specs: { sensor: 'x' } })).toBeNull();
  });
});
