import Link from 'next/link';
import { ArrowUpRight } from './icons';
import { Logo } from './logo';

const NAV_LINK =
  'inline-flex min-h-11 items-center gap-1 text-[15px] font-medium transition-colors duration-(--dur-fast)';

export function SiteHeader({ account }: { account?: { href: string; label: string } }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-8 px-4 md:px-8">
        <Link href="/" aria-label="LANTAI DUA, ke beranda" className="flex min-h-16 items-center">
          <Logo />
        </Link>

        <nav
          aria-label="Utama"
          className="order-last flex w-full gap-6 border-t border-border md:order-none md:w-auto md:border-t-0"
        >
          <Link href="/katalog" className={`${NAV_LINK} text-ink hover:text-primary`}>
            Katalog
          </Link>
          <Link href="/bandingkan" className={`${NAV_LINK} text-ink hover:text-primary`}>
            Bandingkan
          </Link>
          <Link href="/showroom" className={`${NAV_LINK} group text-accent-ink`}>
            Showroom
            <ArrowUpRight className="text-accent transition-transform duration-(--dur-fast) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
          </Link>
        </nav>

        <div className="ml-auto flex items-center">
          {account ? (
            <Link
              href={account.href}
              className={`${NAV_LINK} rounded-md px-3 text-ink hover:bg-surface-sunken`}
            >
              {account.label}
            </Link>
          ) : (
            <Link
              href="/masuk"
              className={`${NAV_LINK} rounded-md px-3 text-ink hover:bg-surface-sunken`}
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
