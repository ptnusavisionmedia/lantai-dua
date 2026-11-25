import Image from 'next/image';
import { productImageUrl } from '@/lib/image-url';
import { ProductIllustration } from './product-illustration';

/**
 * Foto produk 4 : 3 di atas `surface-sunken`. Selama foto asli belum diunggah,
 * yang tampil adalah ilustrasi garis kategorinya.
 */
export function ProductImage({
  path,
  category,
  alt,
}: {
  path: string | null;
  category: string;
  alt: string;
}) {
  const url = productImageUrl(path);
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-surface-sunken">
      <div className="absolute inset-0 transition-transform duration-(--dur-base) ease-(--ease-out) group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        {url ? (
          <Image
            src={url}
            alt={alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-contain p-4"
          />
        ) : (
          <div role="img" aria-label={alt} className="flex h-full items-center justify-center p-6">
            <ProductIllustration category={category} className="h-full max-h-40 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
