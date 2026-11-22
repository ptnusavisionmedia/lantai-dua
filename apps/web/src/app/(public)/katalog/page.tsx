import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Katalog' };

export default function KatalogPage() {
  return <ComingSoon title="Katalog" description="Halaman ini sedang disiapkan." />;
}
