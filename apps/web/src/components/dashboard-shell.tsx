import Link from 'next/link';
import type { ReactNode } from 'react';
import { signOut } from '@/app/(auth)/actions';
import { Button } from './button';
import { Logo } from './logo';

type NavItem = { href: string; label: string };

export function DashboardShell({
  roleLabel,
  userName,
  nav,
  children,
}: {
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-surface lg:border-r lg:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 lg:flex-col lg:items-start lg:px-5 lg:pt-6">
          <Link
            href="/"
            aria-label="LANTAI DUA, ke beranda"
            className="inline-flex min-h-11 items-center"
          >
            <Logo />
          </Link>
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">{userName}</span> · {roleLabel}
          </p>
        </div>
        <nav
          aria-label="Dashboard"
          className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:px-3 lg:py-4"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-ink hover:bg-surface-sunken"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="px-4 pb-4 lg:px-5">
          <Button type="submit" variant="secondary" size="sm">
            Keluar
          </Button>
        </form>
      </aside>
      <main className="px-4 py-8 md:px-8 lg:py-12">{children}</main>
    </div>
  );
}

export function DashboardTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[30px] leading-9 font-semibold tracking-[-0.01em] text-balance md:text-[40px] md:leading-[44px]">
      {children}
    </h1>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-ink-muted">{children}</p>
    </section>
  );
}
