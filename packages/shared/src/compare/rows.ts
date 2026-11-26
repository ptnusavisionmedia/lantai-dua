import { toDemoStatus, toRecord } from '../catalog/rows';
import type { Database, Json } from '../database.types';
import { MANUAL_KEYS } from './manual';
import type { CompareItem, Gear, ManualSpecs } from './types';

type CompareRow = Database['public']['Views']['compare_items']['Row'];

export function fromCompareRow(row: CompareRow): CompareItem {
  return {
    id: row.id ?? '',
    slug: row.slug ?? '',
    modelName: row.model_name ?? '',
    brandSlug: row.brand_slug ?? '',
    brandName: row.brand_name ?? '',
    categorySlug: row.category_slug ?? '',
    isForSale: row.is_for_sale ?? false,
    specs: toRecord(row.specs),
    eloshapesUrl: row.eloshapes_url,
    priceMin: row.price_min,
    priceMax: row.price_max,
    demoStatus: toDemoStatus(row.demo_status),
    demoVariantSku: row.demo_variant_sku,
    demoVariantName: row.demo_variant_name,
  };
}

/** Baris `user_gear` menjadi Gear. Ukuran manual hanya menyimpan angka positif dari empat ukuran. */
export function fromGearRow(row: {
  product_id: string | null;
  manual_specs: Json | null;
}): Gear | null {
  if (row.product_id) return { kind: 'item', productId: row.product_id };
  const raw = toRecord(row.manual_specs);
  const specs: ManualSpecs = {};
  for (const key of MANUAL_KEYS) {
    const value = raw[key];
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) specs[key] = value;
  }
  return Object.keys(specs).length > 0 ? { kind: 'manual', specs } : null;
}
