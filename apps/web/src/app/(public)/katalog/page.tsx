import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/catalog/catalog-browser';
import { listCatalogItems, listCategories } from '@/lib/catalog-data';

export const metadata: Metadata = { title: 'Katalog' };

export default async function KatalogPage() {
  const [items, categories] = await Promise.all([listCatalogItems(), listCategories()]);
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-10 pb-20 md:px-8 md:pt-14">
      <h1 className="font-display text-[40px] leading-[1.1] font-bold tracking-[-0.015em]">
        Katalog
      </h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-muted">
        Semua yang ada di rak kami. Cek stok dan status unit demonya sebelum mampir ke Lantai 2.
      </p>
      <div className="mt-8">
        <Suspense>
          <CatalogBrowser
            items={items}
            attributes={[]}
            basePath="/katalog"
            categoryChips={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          />
        </Suspense>
      </div>
    </section>
  );
}
