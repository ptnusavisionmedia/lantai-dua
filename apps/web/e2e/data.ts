import type { Page } from '@playwright/test';
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

/** "Merek Model · Varian" seperti di formulir reservasi, dari SKU varian. */
export const variantLabelOf = (sku: string) => {
  const p = catalogSeed.products.find((x) => x.variants.some((v) => v.sku === sku));
  const v = p?.variants.find((x) => x.sku === sku);
  if (!p || !v) throw new Error(`Varian ${sku} tidak ada di data`);
  return `${fullName(p.slug)} · ${v.name}`;
};

export const PASSWORD = process.env.E2E_PASSWORD ?? '';

/** Mengisi formulir login di halaman yang sedang terbuka. */
export async function fillLogin(page: Page, email: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(PASSWORD);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

/** Membuka /masuk (dengan `next` kalau ada), lalu login. */
export async function login(page: Page, email: string, next?: string): Promise<void> {
  await page.goto(next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk');
  await fillLogin(page, email);
}
