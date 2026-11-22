import { safeNextPath } from '@lantai-dua/shared/access';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Daftar' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DaftarPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next =
    typeof params.next === 'string' ? (safeNextPath(params.next) ?? undefined) : undefined;

  return (
    <>
      <h1 className="font-display text-[30px] leading-9 font-semibold tracking-[-0.01em]">
        Daftar
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Satu akun untuk web dan aplikasi LANTAI DUA.
      </p>
      <SignupForm next={next} />
      <p className="mt-6 text-sm text-ink-muted">
        Sudah punya akun?{' '}
        <Link
          href={next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk'}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </>
  );
}
