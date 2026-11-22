import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Bandingkan' };

export default function BandingkanPage() {
  return <ComingSoon title="Bandingkan" description="Halaman ini sedang disiapkan." />;
}
