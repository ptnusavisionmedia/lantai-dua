import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Keranjang' };

export default function KeranjangPage() {
  return (
    <ComingSoon
      title="Keranjang"
      description="Keranjang dan checkout sedang disiapkan. Sementara itu, cek stok dan coba unitnya dulu di Lantai 2."
    />
  );
}
