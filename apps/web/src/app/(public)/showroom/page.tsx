import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Showroom' };

export default function ShowroomPage() {
  return <ComingSoon title="Showroom" description="Halaman ini sedang disiapkan." />;
}
