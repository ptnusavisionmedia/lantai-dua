import type { Metadata } from 'next';
import { DashboardTitle, EmptyState } from '@/components/dashboard-shell';

export const metadata: Metadata = { title: 'Operator' };

export default function OperatorPage() {
  return (
    <>
      <DashboardTitle>Hari ini</DashboardTitle>
      <div className="mt-8">
        <EmptyState title="Jadwal">Belum ada kunjungan atau pesanan.</EmptyState>
      </div>
    </>
  );
}
