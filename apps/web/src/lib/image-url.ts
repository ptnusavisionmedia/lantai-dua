import { publicEnv } from './env';

/** URL publik foto di bucket `product-images`, atau null kalau produk belum punya foto. Aman dipakai di klien. */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${publicEnv().url}/storage/v1/object/public/product-images/${path}`;
}
