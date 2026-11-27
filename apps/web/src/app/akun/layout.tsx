import { ROLE_LABEL } from '@lantai-dua/shared/roles';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';

export default async function AkunLayout({ children }: { children: ReactNode }) {
  const me = await requireRole(['customer']);
  return (
    <DashboardShell
      roleLabel={ROLE_LABEL.customer}
      userName={me.fullName}
      nav={[
        { href: '/akun', label: 'Ringkasan' },
        { href: '/akun/reservasi', label: 'Reservasi' },
        { href: '/akun/wishlist', label: 'Wishlist' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
