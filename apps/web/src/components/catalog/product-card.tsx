import { type CatalogItem, demoLabel, priceLabel, stockLabel } from '@lantai-dua/shared/catalog';
import Link from 'next/link';
import { ProductImage } from './product-image';
import { StatusLine } from './status-line';

/** Kartu produk: foto, merek, model, harga, lalu status stok jual dan demo dalam kata. */
export function ProductCard({ item }: { item: CatalogItem }) {
  const stock = stockLabel(item.stockTotal);
  const demo = demoLabel(item.demoStatus, item.demoVariantName);
  return (
    <Link
      data-testid="product-card"
      href={`/produk/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-(--dur-fast) hover:border-border-input"
    >
      <ProductImage
        path={item.imagePath}
        category={item.categorySlug}
        alt={`${item.brandName} ${item.modelName}`}
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium text-ink-muted">{item.brandName}</p>
        <h2 className="font-display text-lg leading-snug font-semibold text-ink group-hover:text-primary">
          {item.modelName}
        </h2>
        <p className="font-display text-base font-semibold tabular-nums">
          {priceLabel(item.priceMin, item.priceMax)}
        </p>
        <div className="mt-2 flex flex-col items-start gap-1.5">
          <StatusLine tone={stock.tone} text={stock.card} />
          <StatusLine tone={demo.tone} text={demo.text} />
        </div>
      </div>
    </Link>
  );
}
