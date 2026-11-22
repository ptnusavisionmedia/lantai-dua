import Link from 'next/link';
import { Logo } from './logo';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-10 text-sm text-ink-muted md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex flex-col gap-2">
          <Logo />
          <p>LANTAI DUA adalah toko fiktif untuk project magang.</p>
        </div>
        <Link
          href="/kebijakan-privasi"
          className="inline-flex min-h-11 items-center text-ink underline-offset-4 hover:underline"
        >
          Kebijakan privasi
        </Link>
      </div>
    </footer>
  );
}
