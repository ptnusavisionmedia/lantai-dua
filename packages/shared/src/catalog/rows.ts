import type { Database, Json } from '../database.types';
import type { AttributeDef, CatalogItem, DemoStatus, TryMode, VariantAvailability } from './types';

type CatalogRow = Database['public']['Views']['catalog_items']['Row'];
type VariantRow = Database['public']['Views']['variant_availability']['Row'];
type AttributeRow = Database['public']['Tables']['category_attributes']['Row'];

const DEMO_STATUSES: readonly string[] = ['free', 'available', 'in_use', 'servicing', 'none'];

// Tipe hasil generate untuk view membuat semua kolom nullable dan demo_status bertipe string,
// jadi nilainya dipersempit di sini. Nilai yang tidak dikenal jatuh ke pilihan paling aman.
export function toDemoStatus(value: string | null): DemoStatus {
  return value !== null && DEMO_STATUSES.includes(value) ? (value as DemoStatus) : 'none';
}

function toTryMode(value: TryMode | null): TryMode {
  return value ?? 'unit';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRecord(value: Json | null): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function toRecordList(value: Json | null): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as unknown[]).filter(isRecord) : [];
}

export function fromCatalogRow(row: CatalogRow): CatalogItem {
  return {
    id: row.id ?? '',
    slug: row.slug ?? '',
    modelName: row.model_name ?? '',
    brandSlug: row.brand_slug ?? '',
    brandName: row.brand_name ?? '',
    categorySlug: row.category_slug ?? '',
    categoryName: row.category_name ?? '',
    tryMode: toTryMode(row.try_mode),
    groupSlug: row.group_slug ?? '',
    groupName: row.group_name ?? '',
    groupSortOrder: row.group_sort_order ?? 0,
    specs: toRecord(row.specs),
    variantAttributes: toRecordList(row.variant_attributes),
    priceMin: row.price_min ?? 0,
    priceMax: row.price_max ?? 0,
    stockTotal: row.stock_total ?? 0,
    demoStatus: toDemoStatus(row.demo_status),
    demoVariantName: row.demo_variant_name,
    demoVariantSku: row.demo_variant_sku,
    imagePath: row.image_path,
    createdAt: row.created_at ?? '',
  };
}

export function fromVariantRow(row: VariantRow): VariantAvailability {
  return {
    id: row.id ?? '',
    productId: row.product_id ?? '',
    sku: row.sku ?? '',
    name: row.name ?? '',
    attributes: toRecord(row.attributes),
    priceIdr: row.price_idr ?? 0,
    stockQty: row.stock_qty ?? 0,
    sortOrder: row.sort_order ?? 0,
    demoStatus: toDemoStatus(row.demo_status),
    imagePath: row.image_path,
  };
}

export function fromAttributeRow(row: AttributeRow): AttributeDef {
  return {
    key: row.key,
    label: row.label,
    type: row.type,
    scope: row.scope,
    unit: row.unit,
    options: row.options,
    isFilterable: row.is_filterable,
    isComparable: row.is_comparable,
    sortOrder: row.sort_order,
  };
}
