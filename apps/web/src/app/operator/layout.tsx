import { ROLE_LABEL } from '@lantai-dua/shared/roles';
import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { requireRole } from '@/lib/auth';

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const me = await requireRole(['operator', 'owner']);
  return (
    <DashboardShell
      roleLabel={ROLE_LABEL[me.role]}
      userName={me.fullName}
      nav={[{ href: '/operator', label: 'Hari ini' }]}
    >
      {children}
    </DashboardShell>
  );
}
