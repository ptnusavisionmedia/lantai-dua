import { expect, type Page, test } from '@playwright/test';
import { allProducts, byCategory } from './data';

const cards = (page: Page) => page.getByTestId('product-card');
const total = allProducts.length;

test('lists every product on /katalog', async ({ page }) => {
  await page.goto('/katalog');
  await expect(page.getByRole('heading', { level: 1, name: 'Katalog' })).toBeVisible();
  await expect(cards(page)).toHaveCount(total);
  await expect(page.getByText(`${total} produk`, { exact: true })).toBeVisible();
});

test('category page shows only that category', async ({ page }) => {
  await page.goto('/katalog/mouse');
  await expect(page.getByRole('heading', { level: 1, name: 'Mouse' })).toBeVisible();
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});

test('unknown category is a 404', async ({ page }) => {
  const res = await page.goto('/katalog/sepatu');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ke katalog' })).toHaveAttribute('href', '/katalog');
});

test('brand filter updates results and URL, back restores', async ({ page }) => {
  await page.goto('/katalog/mouse');
  await page
    .getByRole('checkbox', { name: /VortexSeries/ })
    .first()
    .check();
  await expect(page).toHaveURL(/merek=vortexseries/);
  await expect(cards(page)).toHaveCount(
    byCategory('mouse').filter((p) => p.brandSlug === 'vortexseries').length,
  );
  await expect(page.getByRole('button', { name: 'Hapus filter VortexSeries' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/katalog/mouse');
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});

test('variant-scope switch filter on keyboards', async ({ page }) => {
  const expected = byCategory('keyboard').filter((p) =>
    p.variants.some((v) => v.attributes.switch_type === 'Tactile'),
  ).length;
  expect(expected).toBeGreaterThan(0);
  await page.goto('/katalog/keyboard?switch_type=Tactile');
  await expect(cards(page)).toHaveCount(expected);
});

test('empty result offers a way out', async ({ page }) => {
  await page.goto('/katalog?q=zzzzzz');
  await expect(page.getByText('Belum ada produk yang cocok')).toBeVisible();
  await page.getByRole('button', { name: 'Hapus semua filter' }).click();
  await expect(cards(page)).toHaveCount(total);
});

test('garbage parameters are ignored', async ({ page }) => {
  const res = await page.goto('/katalog/mouse?weight_g=abc&shape=Bulat&urut=xyz&foo=1');
  expect(res?.status()).toBe(200);
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
});

test('mobile filter sheet and no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/katalog/mouse');
  await page.getByRole('button', { name: /^Filter/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Filter' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: /^Lihat \d+ produk$/ }).click();
  await expect(sheet).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});

test('cards show stock and demo status in words', async ({ page }) => {
  await page.goto('/katalog');
  await expect(page.getByText('Stok habis').first()).toBeVisible();
  await expect(page.getByText(/^Demo tersedia · /).first()).toBeVisible();
  await expect(page.getByText('Bisa dicoba langsung').first()).toBeVisible();
});

test('sorting by price puts the cheapest first', async ({ page }) => {
  await page.goto('/katalog?urut=termurah');
  const cheapest = [...allProducts].sort(
    (a, b) =>
      Math.min(...a.variants.map((v) => v.priceIdr)) -
      Math.min(...b.variants.map((v) => v.priceIdr)),
  )[0];
  await expect(cards(page).first()).toHaveAttribute('href', `/produk/${cheapest?.slug}`);
});
