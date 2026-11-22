import type { Metadata } from 'next';
import { DashboardTitle, EmptyState } from '@/components/dashboard-shell';

export const metadata: Metadata = { title: 'Pemilik' };

export default function PemilikPage() {
  return (
    <>
      <DashboardTitle>Ringkasan bisnis</DashboardTitle>
      <div className="mt-8">
        <EmptyState title="Penjualan">Data penjualan muncul setelah ada pesanan.</EmptyState>
      </div>
    </>
  );
}
