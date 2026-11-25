export type TryMode = 'unit' | 'station' | 'free';
export type DemoStatus = 'free' | 'available' | 'in_use' | 'servicing' | 'none';
export type AttributeType = 'number' | 'enum' | 'multi_enum' | 'boolean' | 'text';

export type AttributeDef = {
  key: string;
  label: string;
  type: AttributeType;
  scope: 'product' | 'variant';
  unit: string | null;
  options: string[] | null;
  isFilterable: boolean;
  isComparable: boolean;
  sortOrder: number;
};

/** Satu baris view `catalog_items`: satu produk dengan ringkasan harga, stok, dan demo. */
export type CatalogItem = {
  id: string;
  slug: string;
  modelName: string;
  brandSlug: string;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  tryMode: TryMode;
  groupSlug: string;
  groupName: string;
  groupSortOrder: number;
  specs: Record<string, unknown>;
  variantAttributes: Record<string, unknown>[];
  priceMin: number;
  priceMax: number;
  stockTotal: number;
  demoStatus: DemoStatus;
  demoVariantName: string | null;
  demoVariantSku: string | null;
  imagePath: string | null;
  createdAt: string;
};

/** Satu baris view `variant_availability`. */
export type VariantAvailability = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  priceIdr: number;
  stockQty: number;
  sortOrder: number;
  demoStatus: DemoStatus;
  imagePath: string | null;
};

export type SortKey = 'terbaru' | 'termurah' | 'termahal' | 'teringan';
export type Range = { min?: number; max?: number };

export type CatalogQuery = {
  q: string;
  rak: string | null;
  merek: string[];
  harga: Range | null;
  demo: boolean;
  stok: boolean;
  urut: SortKey;
  attrs: Record<string, string[] | Range | true>;
};

export type FacetOption = { value: string; label: string; count: number };

export type Facet =
  | { key: string; label: string; kind: 'checklist'; options: FacetOption[] }
  | {
      key: string;
      label: string;
      kind: 'range';
      unit: string | null;
      bounds: { min: number; max: number } | null;
    }
  | { key: string; label: string; kind: 'toggle' };

export type Tone = 'ok' | 'warn' | 'bad' | 'demo' | 'none';
