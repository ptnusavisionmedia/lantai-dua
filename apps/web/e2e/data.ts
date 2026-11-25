import { catalogSeed } from '../../../packages/catalog-data/src/index.ts';

/** Ekspektasi e2e diambil langsung dari data asli, supaya tes ikut berubah kalau datanya berubah. */
export const allProducts = catalogSeed.products;
export const byCategory = (c: string) => catalogSeed.products.filter((p) => p.categorySlug === c);
