import { describe, expect, it } from 'vitest';
import type { Database } from '../database.types';
import { fromAttributeRow, fromCatalogRow, fromVariantRow } from './rows';

type CatalogRow = Database['public']['Views']['catalog_items']['Row'];

const fullRow: CatalogRow = {
  id: 'p1',
  slug: 'logitech-g-pro-x-superlight-2',
  model_name: 'G Pro X Superlight 2',
  brand_slug: 'logitech',
  brand_name: 'Logitech',
  category_slug: 'mouse',
  category_name: 'Mouse',
  try_mode: 'unit',
  group_slug: 'kontrol',
  group_name: 'Kontrol',
  group_sort_order: 1,
  specs: { weight_g: 60 },
  variant_attributes: [{ color: 'Hitam' }],
  price_min: 2_199_000,
  price_max: 2_299_000,
  stock_total: 4,
  demo_status: 'available',
  demo_variant_name: 'Hitam',
  demo_variant_sku: 'L2-LOG-GPXS2-BLK',
  image_path: null,
  created_at: '2026-11-25T00:00:00Z',
};

describe('fromCatalogRow', () => {
  it('maps a catalog_items row to CatalogItem', () => {
    expect(fromCatalogRow(fullRow)).toEqual({
      id: 'p1',
      slug: 'logitech-g-pro-x-superlight-2',
      modelName: 'G Pro X Superlight 2',
      brandSlug: 'logitech',
      brandName: 'Logitech',
      categorySlug: 'mouse',
      categoryName: 'Mouse',
      tryMode: 'unit',
      groupSlug: 'kontrol',
      groupName: 'Kontrol',
      groupSortOrder: 1,
      specs: { weight_g: 60 },
      variantAttributes: [{ color: 'Hitam' }],
      priceMin: 2_199_000,
      priceMax: 2_299_000,
      stockTotal: 4,
      demoStatus: 'available',
      demoVariantName: 'Hitam',
      demoVariantSku: 'L2-LOG-GPXS2-BLK',
      imagePath: null,
      createdAt: '2026-11-25T00:00:00Z',
    });
  });

  it('narrows unknown statuses and fills nulls safely', () => {
    const item = fromCatalogRow({
      ...fullRow,
      demo_status: 'aneh',
      try_mode: null,
      specs: null,
      variant_attributes: null,
      stock_total: null,
    });
    expect(item).toMatchObject({
      demoStatus: 'none',
      tryMode: 'unit',
      specs: {},
      variantAttributes: [],
      stockTotal: 0,
    });
  });
});

describe('fromVariantRow / fromAttributeRow', () => {
  it('maps a variant row', () => {
    expect(
      fromVariantRow({
        id: 'v1',
        product_id: 'p1',
        sku: 'L2-X',
        name: 'Hitam',
        attributes: { color: 'Hitam' },
        price_idr: 100,
        stock_qty: 0,
        sort_order: 2,
        demo_status: 'in_use',
        image_path: null,
      }),
    ).toEqual({
      id: 'v1',
      productId: 'p1',
      sku: 'L2-X',
      name: 'Hitam',
      attributes: { color: 'Hitam' },
      priceIdr: 100,
      stockQty: 0,
      sortOrder: 2,
      demoStatus: 'in_use',
      imagePath: null,
    });
  });

  it('maps an attribute row', () => {
    expect(
      fromAttributeRow({
        id: 'a1',
        category_id: 'c1',
        key: 'weight_g',
        label: 'Bobot',
        type: 'number',
        scope: 'product',
        unit: 'g',
        options: null,
        is_filterable: true,
        is_comparable: true,
        sort_order: 4,
        created_at: '2026-11-25T00:00:00Z',
        updated_at: '2026-11-25T00:00:00Z',
      }),
    ).toEqual({
      key: 'weight_g',
      label: 'Bobot',
      type: 'number',
      scope: 'product',
      unit: 'g',
      options: null,
      isFilterable: true,
      isComparable: true,
      sortOrder: 4,
    });
  });
});
