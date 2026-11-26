/** Dari mana sebuah nilai spek berasal: halaman resmi pabrikan, atau diukur sendiri oleh pemilik. */
export type SpecSource = 'resmi' | 'ukur';

export type SeedVariant = {
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  priceIdr: number;
  stockQty: number;
  sortOrder: number;
};

export type SeedDemoUnit = {
  code: string;
  variantSku: string;
  status: 'available' | 'in_use' | 'servicing';
};

export type SeedProduct = {
  slug: string;
  brandSlug: string;
  categorySlug: string;
  modelName: string;
  description: string;
  specs: Record<string, unknown>;
  /** Sumber untuk setiap key di `specs` dan di atribut varian. */
  specSources: Record<string, SpecSource>;
  specSourceUrl: string | null;
  eloshapesUrl: string | null;
  ownerGear: boolean;
  variants: SeedVariant[];
  demoUnits: SeedDemoUnit[];
};

export type SeedBrand = { slug: string; name: string };

/**
 * Mouse referensi untuk Bandingkan: tidak dijual, tanpa varian dan unit demo, dan tidak punya
 * halaman produk. Panjang, lebar, tinggi, dan bobot wajib dari sumber resmi.
 */
export type SeedReference = Pick<
  SeedProduct,
  'slug' | 'brandSlug' | 'categorySlug' | 'modelName' | 'specs' | 'specSources' | 'eloshapesUrl'
> & { specSourceUrl: string };

/** Pasangan contoh awal Bandingkan. Seed hanya mengisinya ke pengaturan toko kalau masih kosong. */
export type CompareExample = { currentSlug: string; targetSlug: string };

export type CatalogSeed = {
  brands: SeedBrand[];
  products: SeedProduct[];
  references: SeedReference[];
  compareExample: CompareExample | null;
};
