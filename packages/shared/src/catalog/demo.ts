import type { CatalogItem, DemoStatus, VariantAvailability } from './types';

/**
 * Baris demo di halaman detail: kalau unit varian terpilih tersedia, itu yang ditampilkan;
 * kalau tidak, kembali ke status demo terbaik produk (yang sudah diurutkan oleh view).
 */
export function pickDemoForVariant(
  item: Pick<CatalogItem, 'demoStatus' | 'demoVariantName' | 'demoVariantSku'>,
  variants: VariantAvailability[],
  selectedSku: string,
): { status: DemoStatus; variantName: string | null; sku: string | null } {
  if (item.demoStatus === 'free') return { status: 'free', variantName: null, sku: null };
  const selected = variants.find((v) => v.sku === selectedSku);
  if (selected?.demoStatus === 'available') {
    return { status: 'available', variantName: selected.name, sku: selected.sku };
  }
  return { status: item.demoStatus, variantName: item.demoVariantName, sku: item.demoVariantSku };
}
