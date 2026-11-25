import type { CatalogItem } from '@lantai-dua/shared/catalog';
import Link from 'next/link';
import { ProductIllustration } from '../catalog/product-illustration';

type Rack = {
  slug: string;
  name: string;
  sortOrder: number;
  categories: { slug: string; name: string }[];
  count: number;
};

function groupRacks(items: CatalogItem[]): Rack[] {
  const racks = new Map<string, Rack>();
  for (const item of items) {
    const rack = racks.get(item.groupSlug) ?? {
      slug: item.groupSlug,
      name: item.groupName,
      sortOrder: item.groupSortOrder,
      categories: [],
      count: 0,
    };
    rack.count += 1;
    if (!rack.categories.some((c) => c.slug === item.categorySlug)) {
      rack.categories.push({ slug: item.categorySlug, name: item.categoryName });
    }
    racks.set(item.groupSlug, rack);
  }
  return [...racks.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Pintu ke tiap rak di lantai satu. Rak tanpa produk tidak ditampilkan. */
export function RackDoors({ items }: { items: CatalogItem[] }) {
  const racks = groupRacks(items);
  if (racks.length === 0) return null;
  return (
    <section aria-labelledby="rak-title" className="mx-auto max-w-[1200px] px-4 py-12 md:px-8">
      <h2 id="rak-title" className="font-display text-2xl font-bold tracking-[-0.01em]">
        Rak di lantai satu
      </h2>
      <p className="mt-2 max-w-[56ch] text-ink-muted">
        Pilih raknya dulu. Yang ada label demonya bisa dicoba di lantai dua.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {racks.map((rack) => (
          <li key={rack.slug} className="flex">
            <Link
              href={`/katalog?rak=${rack.slug}`}
              className="group flex w-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors duration-(--dur-fast) hover:border-border-input hover:bg-surface-sunken"
            >
              <span className="font-display text-xl font-semibold group-hover:text-primary">
                {rack.name}
              </span>
              <span className="mt-1 text-sm text-ink-muted">
                {rack.categories.map((c) => c.name).join(' · ')}
              </span>
              <span className="mt-auto flex items-end justify-between gap-4 pt-6">
                <span className="font-mono text-sm tabular-nums">{rack.count} produk</span>
                <ProductIllustration
                  category={rack.categories[0]?.slug ?? 'lainnya'}
                  className="h-14 w-20 shrink-0"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
