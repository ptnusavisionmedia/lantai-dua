import { catalogSeed } from '../../../packages/catalog-data/src/index.ts';

/** Ekspektasi e2e diambil langsung dari data asli, supaya tes ikut berubah kalau datanya berubah. */
export const allProducts = catalogSeed.products;
export const byCategory = (c: string) => catalogSeed.products.filter((p) => p.categorySlug === c);
export const references = catalogSeed.references;
export const compareExample = (() => {
  const example = catalogSeed.compareExample;
  if (!example) throw new Error('catalogSeed.compareExample belum diisi');
  return example;
})();
export const product = (slug: string) => {
  const p = catalogSeed.products.find((x) => x.slug === slug);
  if (!p) throw new Error(`Produk ${slug} tidak ada di data`);
  return p;
};
/** "Merek Model" seperti yang tampil di pemilih Bandingkan. */
export const fullName = (slug: string) => {
  const m = [...catalogSeed.products, ...catalogSeed.references].find((x) => x.slug === slug);
  const brand = catalogSeed.brands.find((b) => b.slug === m?.brandSlug);
  if (!m || !brand) throw new Error(`Mouse ${slug} tidak ada di data`);
  return `${brand.name} ${m.modelName}`;
};
