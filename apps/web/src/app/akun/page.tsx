import type { Metadata } from 'next';
import { DashboardTitle, EmptyState } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'Akun' };

export default async function AkunPage() {
  const me = await requireRole(['customer']);
  const firstName = me.fullName.split(' ')[0] || 'kamu';
  return (
    <>
      <DashboardTitle>Halo, {firstName}</DashboardTitle>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <EmptyState title="Reservasi">Belum ada reservasi.</EmptyState>
        <EmptyState title="Pesanan">Belum ada pesanan.</EmptyState>
      </div>
    </>
  );
}
