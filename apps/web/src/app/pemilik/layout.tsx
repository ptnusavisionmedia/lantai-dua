import { ROLE_LABEL } from '@lantai-dua/shared/roles';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';

export default async function PemilikLayout({ children }: { children: ReactNode }) {
  const me = await requireRole(['owner']);
  return (
    <DashboardShell
      roleLabel={ROLE_LABEL.owner}
      userName={me.fullName}
      nav={[
        { href: '/pemilik', label: 'Ringkasan' },
        { href: '/operator', label: 'Hari ini (operator)' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
