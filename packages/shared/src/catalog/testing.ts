import type { AttributeDef, CatalogItem } from './types';

/** Atribut contoh untuk tes: satu per tipe filter, termasuk satu atribut level varian. */
export const ATTRS: AttributeDef[] = [
  {
    key: 'weight_g',
    label: 'Bobot',
    type: 'number',
    scope: 'product',
    unit: 'g',
    options: null,
    isFilterable: true,
    isComparable: true,
    sortOrder: 1,
  },
  {
    key: 'shape',
    label: 'Bentuk',
    type: 'enum',
    scope: 'product',
    unit: null,
    options: ['Simetris', 'Ergonomis kanan'],
    isFilterable: true,
    isComparable: true,
    sortOrder: 2,
  },
  {
    key: 'connectivity',
    label: 'Koneksi',
    type: 'multi_enum',
    scope: 'product',
    unit: null,
    options: ['Kabel', 'Bluetooth'],
    isFilterable: true,
    isComparable: true,
    sortOrder: 3,
  },
  {
    key: 'hot_swap',
    label: 'Hot-swap',
    type: 'boolean',
    scope: 'product',
    unit: null,
    options: null,
    isFilterable: true,
    isComparable: true,
    sortOrder: 4,
  },
  {
    key: 'switch_type',
    label: 'Jenis switch',
    type: 'enum',
    scope: 'variant',
    unit: null,
    options: ['Linear', 'Tactile'],
    isFilterable: true,
    isComparable: true,
    sortOrder: 5,
  },
  {
    key: 'sensor',
    label: 'Sensor',
    type: 'text',
    scope: 'product',
    unit: null,
    options: null,
    isFilterable: false,
    isComparable: true,
    sortOrder: 6,
  },
];

let counter = 0;

/** CatalogItem lengkap dengan nilai bawaan yang masuk akal; timpa yang perlu lewat `overrides`. */
export function makeItem(overrides: Partial<CatalogItem> = {}): CatalogItem {
  counter += 1;
  return {
    id: `id-${counter}`,
    slug: `produk-${counter}`,
    modelName: `Model ${counter}`,
    brandSlug: 'merek-a',
    brandName: 'Merek A',
    categorySlug: 'mouse',
    categoryName: 'Mouse',
    tryMode: 'unit',
    groupSlug: 'kontrol',
    groupName: 'Kontrol',
    groupSortOrder: 1,
    specs: {},
    variantAttributes: [{}],
    priceMin: 1_000_000,
    priceMax: 1_000_000,
    stockTotal: 5,
    demoStatus: 'none',
    demoVariantName: null,
    demoVariantSku: null,
    imagePath: null,
    createdAt: '2026-11-25T00:00:00Z',
    ...overrides,
  };
}
