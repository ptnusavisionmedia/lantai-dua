import { formatRupiah } from './format';
import type { DemoStatus, Tone } from './types';

const LOW_STOCK = 3;

/** Label stok jual: `card` untuk kartu katalog, `detail` untuk halaman produk. */
export function stockLabel(stock: number): { tone: Tone; card: string; detail: string } {
  if (stock <= 0) return { tone: 'bad', card: 'Stok habis', detail: 'Stok jual: habis' };
  if (stock <= LOW_STOCK) {
    return { tone: 'warn', card: `Sisa ${stock}`, detail: `Stok jual: sisa ${stock}` };
  }
  return { tone: 'ok', card: 'Stok tersedia', detail: 'Stok jual: tersedia' };
}

export function demoLabel(
  status: DemoStatus,
  variantName: string | null,
): { tone: Tone; text: string } {
  switch (status) {
    case 'free':
      return { tone: 'demo', text: 'Bisa dicoba langsung' };
    case 'available':
      return {
        tone: 'demo',
        text: variantName ? `Demo tersedia · ${variantName}` : 'Demo tersedia',
      };
    case 'in_use':
      return { tone: 'warn', text: 'Unit demo sedang dipakai' };
    case 'servicing':
      return { tone: 'none', text: 'Unit demo sedang diservis' };
    case 'none':
      return { tone: 'none', text: 'Tidak ada unit demo' };
  }
}

/** Satu harga, atau `mulai …` kalau varian punya harga berbeda. */
export function priceLabel(min: number, max: number): string {
  return min === max ? formatRupiah(min) : `mulai ${formatRupiah(min)}`;
}
