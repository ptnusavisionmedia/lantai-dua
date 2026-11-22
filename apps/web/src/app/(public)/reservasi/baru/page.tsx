import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Reservasi demo' };

export default function ReservasiBaruPage() {
  return <ComingSoon title="Reservasi demo" description="Halaman ini sedang disiapkan." />;
}
