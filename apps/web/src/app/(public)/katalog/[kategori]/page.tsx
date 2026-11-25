import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { getCategory, listCatalogItems } from '@/lib/catalog-data';

type Props = { params: Promise<{ kategori: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).kategori);
  return { title: category ? category.name : 'Halaman tidak ditemukan' };
}

export default async function KategoriPage({ params }: Props) {
  const { kategori } = await params;
  const category = await getCategory(kategori);
  if (!category) notFound();
  const items = await listCatalogItems({ category: category.slug });

  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-20 md:px-8 md:pt-14">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/katalog" className="underline-offset-4 hover:text-primary hover:underline">
              Katalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {category.name}
          </li>
        </ol>
      </nav>
      <h1 className="font-display mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.015em]">
        {category.name}
      </h1>
      {category.tryMode === 'free' && (
        <p className="mt-3 max-w-[62ch] text-ink-muted">
          Semua {category.name.toLowerCase()} dipajang di Meja Permukaan dan bisa langsung dicoba
          tanpa reservasi.
          {category.hygieneNote ? ` ${category.hygieneNote}` : ''}
        </p>
      )}
      <div className="mt-8">
        <Suspense>
          <CatalogBrowser
            items={items}
            attributes={category.attributes}
            basePath={`/katalog/${category.slug}`}
          />
        </Suspense>
      </div>
    </section>
  );
}
