import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        <Link
          href="/"
          aria-label="LANTAI DUA, ke beranda"
          className="inline-flex min-h-11 items-center"
        >
          <Logo />
        </Link>
        <div className="mt-4 rounded-lg border border-border bg-surface p-6 md:p-8">{children}</div>
      </div>
    </main>
  );
}
