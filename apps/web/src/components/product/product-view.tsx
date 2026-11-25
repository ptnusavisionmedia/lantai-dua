'use client';

import {
  demoLabel,
  formatRupiah,
  pickDemoForVariant,
  stockLabel,
} from '@lantai-dua/shared/catalog';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ProductPage } from '@/lib/catalog-data';
import { Button, ButtonLink } from '../button';
import { ProductImage } from '../catalog/product-image';
import { StatusLine } from '../catalog/status-line';
import { SpecTable } from './spec-table';

export function ProductView({
  item,
  description,
  eloshapesUrl,
  attributes,
  variants,
  hygieneNote,
  freeAreaName,
}: ProductPage) {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get('varian');

  // Sama seperti katalog: varian baru langsung tampil, lalu URL (lewat replaceState) menyusul.
  const [pending, setPending] = useState<string | null>(null);
  const [seenUrl, setSeenUrl] = useState(fromUrl);
  if (seenUrl !== fromUrl) {
    setSeenUrl(fromUrl);
    setPending(null);
  }
  const wanted = pending ?? fromUrl;
  // `variants` sudah urut menurut sort_order; SKU yang tidak dikenal kembali ke varian pertama.
  const variant = variants.find((v) => v.sku === wanted) ?? variants[0];
  if (!variant) return null;

  const select = (sku: string) => {
    setPending(sku);
    window.history.replaceState(null, '', `?varian=${encodeURIComponent(sku)}`);
  };

  const stock = stockLabel(variant.stockQty);
  const demo = pickDemoForVariant(item, variants, variant.sku);
  const demoText = demoLabel(demo.status, demo.variantName);
  const canTry = demo.status !== 'none' && demo.status !== 'free' && demo.sku !== null;
  const name = `${item.brandName} ${item.modelName}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
      <div className="min-w-0">
        <div
          key={variant.sku}
          className="l2-fade-in overflow-hidden rounded-lg border border-border"
        >
          <ProductImage
            path={variant.imagePath ?? item.imagePath}
            category={item.categorySlug}
            alt={name}
          />
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{item.brandName}</p>
        <h1 className="font-display mt-1 text-[36px] leading-[1.1] font-bold tracking-[-0.015em] text-balance">
          {item.modelName}
        </h1>

        <div key={`harga-${variant.sku}`} className="l2-fade-in mt-4">
          <p className="font-display text-2xl font-semibold tabular-nums">
            {formatRupiah(variant.priceIdr)}
          </p>
          <div className="mt-3 flex flex-col items-start gap-2">
            <StatusLine tone={stock.tone} text={stock.detail} />
            <StatusLine tone={demoText.tone} text={demoText.text} />
          </div>
        </div>

        {variants.length > 1 && (
          <div role="radiogroup" aria-label="Varian" className="mt-6">
            <p className="text-sm font-medium text-ink" aria-hidden="true">
              Varian
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v) => (
                <label
                  key={v.sku}
                  className="relative inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border-input bg-surface px-4 text-[15px] transition-colors duration-(--dur-fast) has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary hover:bg-surface-sunken"
                >
                  <input
                    type="radio"
                    name="varian"
                    value={v.sku}
                    checked={v.sku === variant.sku}
                    onChange={() => select(v.sku)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  {v.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {variant.stockQty > 0 ? (
            <ButtonLink href={`/keranjang?tambah=${encodeURIComponent(variant.sku)}`}>
              Tambah ke keranjang
            </ButtonLink>
          ) : (
            <Button disabled>Tambah ke keranjang</Button>
          )}
          {canTry && (
            <ButtonLink
              variant="demo"
              href={`/reservasi/baru?varian=${encodeURIComponent(demo.sku ?? '')}`}
            >
              Coba di showroom
            </ButtonLink>
          )}
          {item.categorySlug === 'mouse' && (
            <ButtonLink variant="secondary" href={`/bandingkan?incaran=${item.slug}`}>
              Bandingkan
            </ButtonLink>
          )}
        </div>
        <ButtonLink variant="text" href="/akun/wishlist" className="mt-2">
          Simpan ke wishlist
        </ButtonLink>

        {item.tryMode === 'free' ? (
          <p className="mt-4 text-ink-muted">
            Bisa dicoba langsung di {freeAreaName ?? 'showroom'}, tanpa reservasi.
          </p>
        ) : (
          hygieneNote && <p className="mt-4 text-sm text-ink-muted">{hygieneNote}</p>
        )}

        {description && (
          <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed">{description}</p>
        )}

        <h2 className="font-display mt-10 text-xl font-semibold">Spesifikasi</h2>
        <div key={`spek-${variant.sku}`} className="l2-fade-in mt-3">
          <SpecTable
            attributes={attributes}
            specs={item.specs}
            variantAttributes={variant.attributes}
          />
        </div>
        {eloshapesUrl && (
          <a
            href={eloshapesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
          >
            Bandingkan bentuknya di EloShapes
          </a>
        )}
      </div>
    </div>
  );
}
