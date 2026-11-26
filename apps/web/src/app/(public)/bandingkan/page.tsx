import { compareTitle, parseCompareQuery, resolveInitialPair } from '@lantai-dua/shared/compare';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CompareView } from '@/components/compare/compare-view';
import { loadComparePage } from '@/lib/compare-data';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function toParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const data = await loadComparePage();
  if (!data) return { title: 'Halaman tidak ditemukan' };
  const pair = resolveInitialPair(
    parseCompareQuery(toParams(await searchParams), data.items),
    data,
  );
  return {
    title: compareTitle(pair),
    description:
      'Taruh mouse yang lu pakai sekarang di samping mouse incaran, lihat bedanya, lalu coba keduanya di showroom.',
  };
}

export default async function BandingkanPage() {
  const data = await loadComparePage();
  if (!data) notFound();
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-20 md:px-8 md:pt-14">
      <h1 className="font-display text-[40px] leading-[1.1] font-bold tracking-[-0.015em]">
        Bandingkan mouse
      </h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-muted">
        Taruh mouse yang lu pakai sekarang di samping mouse incaran. Lihat bedanya, lalu coba
        keduanya di lantai dua.
      </p>
      <div className="mt-8">
        <Suspense>
          <CompareView {...data} />
        </Suspense>
      </div>
    </section>
  );
}
