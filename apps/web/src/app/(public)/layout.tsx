import { homePathForRole } from '@lantai-dua/shared/roles';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCurrentViewer } from '@/lib/auth';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { viewer } = await getCurrentViewer();
  const account =
    viewer.kind === 'active'
      ? { href: homePathForRole(viewer.role), label: 'Akun saya' }
      : undefined;

  return (
    <>
      <SiteHeader account={account} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
