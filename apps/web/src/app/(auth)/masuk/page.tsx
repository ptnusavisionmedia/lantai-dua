import { safeNextPath } from '@lantai-dua/shared/access';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Masuk' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MasukPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next =
    typeof params.next === 'string' ? (safeNextPath(params.next) ?? undefined) : undefined;
  const initialError =
    params.error === 'verifikasi'
      ? 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.'
      : undefined;
  const notice =
    params.pesan === 'terverifikasi' ? 'Email sudah terverifikasi. Silakan masuk.' : undefined;

  return (
    <>
      <h1 className="font-display text-[30px] leading-9 font-semibold tracking-[-0.01em]">Masuk</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Masuk untuk reservasi demo, pesan-ambil, dan menyimpan gear.
      </p>
      <LoginForm next={next} initialError={initialError} notice={notice} />
      <p className="mt-6 text-sm text-ink-muted">
        Belum punya akun?{' '}
        <Link
          href={next ? `/daftar?next=${encodeURIComponent(next)}` : '/daftar'}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </>
  );
}
