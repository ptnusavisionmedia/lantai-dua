import Link from 'next/link';
import { buttonClasses } from '@/components/button';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-start justify-center px-4 py-16 md:px-8">
      <Link href="/" aria-label="LANTAI DUA, ke beranda">
        <Logo />
      </Link>
      <p className="font-display mt-10 text-xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
        404
      </p>
      <h1 className="font-display mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.015em] text-balance">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-4 text-lg text-ink-muted">
        Alamatnya mungkin salah ketik, atau produknya sudah tidak dipajang lagi.
      </p>
      <Link href="/katalog" className={`${buttonClasses('primary')} mt-8`}>
        Ke katalog
      </Link>
    </main>
  );
}
