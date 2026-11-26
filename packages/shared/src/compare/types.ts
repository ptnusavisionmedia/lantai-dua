import type { DemoStatus } from '../catalog/types';

/** Empat ukuran yang bisa diisi manual dan dibandingkan dalam gambar kotak. */
export type ManualKey = 'length_mm' | 'width_mm' | 'height_mm' | 'weight_g';
export type ManualSpecs = Partial<Record<ManualKey, number>>;

/** Satu baris view `compare_items`: mouse dijual atau mouse referensi. */
export type CompareItem = {
  id: string;
  slug: string;
  modelName: string;
  brandSlug: string;
  brandName: string;
  categorySlug: string;
  isForSale: boolean;
  specs: Record<string, unknown>;
  eloshapesUrl: string | null;
  /** Harga varian aktif termurah; null untuk mouse referensi. */
  priceMin: number | null;
  priceMax: number | null;
  demoStatus: DemoStatus;
  demoVariantSku: string | null;
  demoVariantName: string | null;
};

/** Slot "Mouse gue sekarang": mouse dari daftar, ukuran manual, atau kosong. */
export type CurrentSlot =
  | { kind: 'item'; item: CompareItem }
  | { kind: 'manual'; specs: ManualSpecs }
  | null;

/** Pasangan yang dibandingkan. Slot incaran hanya berisi mouse dijual. */
export type ComparePair = { current: CurrentSlot; target: CompareItem | null };

/** Gear gue untuk satu kategori: produk dari daftar, atau ukuran manual. */
export type Gear = { kind: 'item'; productId: string } | { kind: 'manual'; specs: ManualSpecs };

/** Pasangan contoh dari pengaturan toko (id produk, boleh kosong). */
export type CompareExamples = { currentId: string | null; targetId: string | null };
