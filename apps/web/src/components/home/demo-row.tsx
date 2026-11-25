import { type CatalogItem, sortCatalog } from '@lantai-dua/shared/catalog';
import { ButtonLink } from '../button';
import { ProductCard } from '../catalog/product-card';

const LIMIT = 8;

/** Sampai 8 produk yang unit demonya sedang tersedia, yang terbaru dulu. Kosong = tidak dirender. */
export function DemoRow({ items }: { items: CatalogItem[] }) {
  const available = sortCatalog(
    items.filter((i) => i.demoStatus === 'available'),
    'terbaru',
  ).slice(0, LIMIT);
  if (available.length === 0) return null;
  return (
    <section aria-labelledby="demo-title" className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="demo-title" className="font-display text-2xl font-bold tracking-[-0.01em]">
            Bisa dicoba di showroom
          </h2>
          <p className="mt-2 max-w-[56ch] text-ink-muted">
            Unit demonya sedang ada di meja dan siap dipakai.
          </p>
        </div>
        <ButtonLink variant="text" href="/katalog?demo=1">
          Semua yang bisa dicoba
        </ButtonLink>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {available.map((item) => (
          <li key={item.id} className="flex [&>a]:w-full">
            <ProductCard item={item} headingLevel="h3" />
          </li>
        ))}
      </ul>
    </section>
  );
}
