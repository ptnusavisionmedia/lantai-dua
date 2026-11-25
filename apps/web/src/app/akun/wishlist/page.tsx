import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Wishlist' };

export default function WishlistPage() {
  return (
    <ComingSoon
      title="Wishlist"
      description="Daftar produk incaranmu akan tersimpan di sini. Fitur ini sedang disiapkan."
    />
  );
}
