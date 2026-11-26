import type { CompareItem } from './types';

let counter = 0;

/** CompareItem lengkap dengan nilai bawaan yang masuk akal; timpa yang perlu lewat `overrides`. */
export function makeCompareItem(overrides: Partial<CompareItem> = {}): CompareItem {
  counter += 1;
  return {
    id: `cmp-${counter}`,
    slug: `mouse-${counter}`,
    modelName: `Model ${counter}`,
    brandSlug: 'merek-a',
    brandName: 'Merek A',
    categorySlug: 'mouse',
    isForSale: true,
    specs: {},
    eloshapesUrl: null,
    priceMin: 1_000_000,
    priceMax: 1_000_000,
    demoStatus: 'none',
    demoVariantSku: null,
    demoVariantName: null,
    ...overrides,
  };
}
