'use client';

import {
  type AttributeDef,
  brandFacet,
  type CatalogItem,
  type CatalogQuery,
  EMPTY_QUERY,
  facetsFor,
  filterCatalog,
  formatRupiah,
  parseCatalogQuery,
  priceBounds,
  type Range,
  type SortKey,
  serializeCatalogQuery,
  sortCatalog,
} from '@lantai-dua/shared/catalog';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../button';
import { Search, SlidersHorizontal, X } from '../icons';
import { FilterPanel } from './filter-panel';
import { ProductCard } from './product-card';

export type CatalogBrowserProps = {
  items: CatalogItem[];
  attributes: AttributeDef[];
  basePath: string;
  categoryChips?: { slug: string; name: string }[];
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'termurah', label: 'Harga terendah' },
  { value: 'termahal', label: 'Harga tertinggi' },
  { value: 'teringan', label: 'Paling ringan' },
];

type ActiveFilter = { id: string; label: string; next: CatalogQuery };

function rangeText(r: Range, format: (n: number) => string, unit = ''): string {
  const u = unit ? ` ${unit}` : '';
  if (r.min !== undefined && r.max !== undefined) return `${format(r.min)}–${format(r.max)}${u}`;
  if (r.min !== undefined) return `≥ ${format(r.min)}${u}`;
  return `≤ ${format(r.max ?? 0)}${u}`;
}

function activeFilters(
  q: CatalogQuery,
  items: CatalogItem[],
  attributes: AttributeDef[],
): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  if (q.q) out.push({ id: 'q', label: `“${q.q}”`, next: { ...q, q: '' } });
  if (q.rak) {
    const name = items.find((i) => i.groupSlug === q.rak)?.groupName ?? q.rak;
    out.push({ id: 'rak', label: `Rak ${name}`, next: { ...q, rak: null } });
  }
  for (const slug of q.merek) {
    const name = items.find((i) => i.brandSlug === slug)?.brandName ?? slug;
    out.push({
      id: `merek-${slug}`,
      label: name,
      next: { ...q, merek: q.merek.filter((m) => m !== slug) },
    });
  }
  if (q.harga)
    out.push({
      id: 'harga',
      label: `Harga ${rangeText(q.harga, formatRupiah)}`,
      next: { ...q, harga: null },
    });
  if (q.demo) out.push({ id: 'demo', label: 'Bisa dicoba sekarang', next: { ...q, demo: false } });
  if (q.stok) out.push({ id: 'stok', label: 'Stok tersedia', next: { ...q, stok: false } });
  for (const [key, value] of Object.entries(q.attrs)) {
    const attr = attributes.find((a) => a.key === key);
    if (!attr) continue;
    const without = (v: CatalogQuery['attrs'][string] | null): CatalogQuery => {
      const attrs = { ...q.attrs };
      if (v === null || (Array.isArray(v) && v.length === 0)) delete attrs[key];
      else attrs[key] = v;
      return { ...q, attrs };
    };
    if (value === true) {
      out.push({ id: key, label: attr.label, next: without(null) });
    } else if (Array.isArray(value)) {
      for (const v of value) {
        out.push({ id: `${key}-${v}`, label: v, next: without(value.filter((x) => x !== v)) });
      }
    } else {
      out.push({
        id: key,
        label: `${attr.label} ${rangeText(value, (n) => n.toLocaleString('id-ID'), attr.unit ?? '')}`,
        next: without(null),
      });
    }
  }
  return out;
}

export function CatalogBrowser({
  items,
  attributes,
  basePath,
  categoryChips,
}: CatalogBrowserProps) {
  const searchParams = useSearchParams();
  const sheetRef = useRef<HTMLDialogElement>(null);

  // Sheet hanya untuk layar < 1024 px. Kalau layar melebar saat sheet terbuka (tablet diputar),
  // sheet ditutup; kalau tidak, <dialog> modal yang tersembunyi akan mengunci seluruh halaman.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) sheetRef.current?.close();
    };
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, []);
  const urlKey = searchParams.toString();

  // "Paling ringan" hanya masuk akal kalau produknya punya bobot (spec K5).
  const canSortByWeight = attributes.some((a) => a.key === 'weight_g');

  const fromUrl = useMemo(() => {
    const parsed = parseCatalogQuery(searchParams, attributes);
    // Nilai yang formatnya sah tetapi tidak dikenal (merek atau rak yang tidak ada di halaman
    // ini, misalnya dari tautan lama) diabaikan, supaya halaman tidak mendadak kosong.
    const brands = new Set(items.map((i) => i.brandSlug));
    const racks = new Set(items.map((i) => i.groupSlug));
    return {
      ...parsed,
      merek: parsed.merek.filter((m) => brands.has(m)),
      // `rak` hanya berlaku di /katalog; di halaman kategori parameter itu diabaikan.
      rak: basePath === '/katalog' && parsed.rak && racks.has(parsed.rak) ? parsed.rak : null,
      urut: parsed.urut === 'teringan' && !canSortByWeight ? 'terbaru' : parsed.urut,
    };
  }, [searchParams, attributes, basePath, items, canSortByWeight]);

  // Next menerapkan pushState di dalam transisi, jadi URL baru menyusul sesaat kemudian.
  // Sampai itu terjadi, tampilan langsung memakai query yang baru dipilih (kotak centang
  // langsung tercentang). Begitu URL berubah, termasuk lewat tombol kembali, URL kembali jadi sumbernya.
  const [pending, setPending] = useState<CatalogQuery | null>(null);
  const [seenUrl, setSeenUrl] = useState(urlKey);
  if (seenUrl !== urlKey) {
    setSeenUrl(urlKey);
    setPending(null);
  }
  const query = pending ?? fromUrl;

  const results = useMemo(
    () => sortCatalog(filterCatalog(items, query, attributes), query.urut),
    [items, query, attributes],
  );
  const brand = useMemo(() => brandFacet(items), [items]);
  const facets = useMemo(() => facetsFor(attributes, items), [attributes, items]);
  const price = useMemo(() => priceBounds(items), [items]);
  const active = activeFilters(query, items, attributes);
  const filterCount = active.filter((f) => f.id !== 'q').length;

  // pushState (bukan router.push): filter berjalan di klien tanpa memuat ulang data dari server,
  // tetapi setiap langkah tetap masuk riwayat browser, jadi tombol kembali mundur satu langkah.
  const update = (next: CatalogQuery) => {
    setPending(next);
    window.history.pushState(null, '', `${basePath}${serializeCatalogQuery(next)}`);
  };
  const clearAll = () => update({ ...EMPTY_QUERY, urut: query.urut });

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get('q') ?? '').trim();
    if (value !== query.q) update({ ...query, q: value });
  };

  const panel = (idPrefix: string) => (
    <FilterPanel
      idPrefix={idPrefix}
      query={query}
      brand={brand}
      price={price}
      facets={facets}
      onChange={update}
    />
  );

  return (
    <div>
      {categoryChips && categoryChips.length > 0 && (
        <nav aria-label="Kategori" className="mb-6 flex flex-wrap gap-2">
          <span
            aria-current="page"
            className="inline-flex min-h-9 items-center rounded-full bg-ink px-4 text-sm font-medium text-on-primary"
          >
            Semua
          </span>
          {categoryChips.map((c) => (
            <Link
              key={c.slug}
              href={`/katalog/${c.slug}`}
              className="inline-flex min-h-9 items-center rounded-full border border-border-input bg-surface px-4 text-sm font-medium text-ink transition-colors duration-(--dur-fast) hover:bg-surface-sunken"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <search className="min-w-0 flex-1 basis-60">
          <form onSubmit={onSearch} className="relative">
            <label htmlFor="katalog-q" className="sr-only">
              Cari merek atau model
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
            <input
              key={query.q}
              id="katalog-q"
              name="q"
              type="search"
              defaultValue={query.q}
              placeholder="Cari merek atau model"
              className="h-11 w-full rounded-md border border-border-input bg-surface pr-3 pl-9 text-[15px]"
            />
          </form>
        </search>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-muted">
          Urutkan
          <select
            value={query.urut}
            onChange={(e) => update({ ...query, urut: e.target.value as SortKey })}
            className="h-11 rounded-md border border-border-input bg-surface px-3 text-[15px] text-ink"
          >
            {SORT_OPTIONS.filter((o) => o.value !== 'teringan' || canSortByWeight).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          className="lg:hidden"
          onClick={() => sheetRef.current?.showModal()}
        >
          <SlidersHorizontal />
          Filter{filterCount > 0 ? ` (${filterCount})` : ''}
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside aria-label="Filter produk" className="hidden lg:block">
          {panel('sidebar')}
        </aside>

        <section aria-label="Hasil katalog" className="min-w-0">
          <p aria-live="polite" className="text-sm font-medium text-ink-muted">
            {results.length} produk
          </p>

          {active.length > 0 && (
            <ul className="mt-3 flex flex-wrap items-center gap-2">
              {active.map((f) => (
                <li key={f.id}>
                  <span className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border-input bg-surface pl-3 text-sm">
                    {f.label}
                    <button
                      type="button"
                      aria-label={`Hapus filter ${f.label}`}
                      onClick={() => update(f.next)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-ink"
                    >
                      <X width={14} height={14} />
                    </button>
                  </span>
                </li>
              ))}
              <li>
                <Button variant="text" size="sm" onClick={clearAll}>
                  Hapus semua
                </Button>
              </li>
            </ul>
          )}

          {results.length > 0 ? (
            <ul className="mt-5 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {results.map((item) => (
                <li key={item.id} className="flex">
                  <div className="flex w-full [&>a]:w-full">
                    <ProductCard item={item} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border-input bg-surface px-6 py-12 text-center">
              <p className="font-display text-lg font-semibold">Belum ada produk yang cocok</p>
              <p className="mx-auto mt-2 max-w-[44ch] text-ink-muted">
                Coba longgarkan filternya, atau mulai lagi dari semua produk.
              </p>
              <Button variant="secondary" className="mt-5" onClick={clearAll}>
                Hapus semua filter
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Klik di latar (di luar sheet) menutup sheet; keyboard menutupnya dengan Esc bawaan <dialog>. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Esc sudah ditangani <dialog> sendiri. */}
      <dialog
        ref={sheetRef}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        aria-labelledby="filter-sheet-title"
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-full overflow-hidden rounded-t-xl bg-surface p-0 text-ink backdrop:bg-ink/40 lg:hidden"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <h2 id="filter-sheet-title" className="font-display text-lg font-semibold">
              Filter
            </h2>
            <button
              type="button"
              aria-label="Tutup filter"
              onClick={() => sheetRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken"
            >
              <X />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{panel('sheet')}</div>
          <div className="border-t border-border p-4">
            <Button className="w-full" onClick={() => sheetRef.current?.close()}>
              Lihat {results.length} produk
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
