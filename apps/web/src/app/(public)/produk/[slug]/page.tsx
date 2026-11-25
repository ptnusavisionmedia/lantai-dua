import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductView } from '@/components/product/product-view';
import { getProductPage } from '@/lib/catalog-data';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getProductPage((await params).slug);
  if (!page) return { title: 'Halaman tidak ditemukan' };
  return {
    title: `${page.item.brandName} ${page.item.modelName}`,
    description: page.description || undefined,
  };
}

export default async function ProdukPage({ params }: Props) {
  const page = await getProductPage((await params).slug);
  if (!page) notFound();
  const { item } = page;

  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-8 pb-20 md:px-8 md:pt-12">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/katalog" className="underline-offset-4 hover:text-primary hover:underline">
              Katalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/katalog/${item.categorySlug}`}
              className="underline-offset-4 hover:text-primary hover:underline"
            >
              {item.categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {item.modelName}
          </li>
        </ol>
      </nav>
      <div className="mt-6">
        <Suspense>
          <ProductView {...page} />
        </Suspense>
      </div>
    </section>
  );
}
