import { expect, test } from '@playwright/test';
import { allProducts, byCategory } from './data';

// Temuan review akhir Fase 1A. Setiap tes di sini gagal sebelum perbaikannya.

const cards = (page: import('@playwright/test').Page) => page.getByTestId('product-card');
const minPrice = (p: (typeof allProducts)[number]) =>
  Math.min(...p.variants.map((v) => v.priceIdr));

test('range fields keep focus and read Indonesian thousand separators', async ({ page }) => {
  await page.goto('/katalog/mouse');
  const sidebar = page.getByRole('complementary', { name: 'Filter produk' });
  const min = sidebar.getByLabel('Harga minimum');
  const max = sidebar.getByLabel('Harga maksimum');
  await min.fill('500.000');
  await min.press('Tab');
  await expect(max).toBeFocused();
  await max.fill('2.300.000');
  await max.press('Enter');
  await expect(page).toHaveURL(/harga=500000-2300000/);
  const expected = byCategory('mouse').filter((p) => {
    const price = minPrice(p);
    return price >= 500_000 && price <= 2_300_000;
  }).length;
  await expect(cards(page)).toHaveCount(expected);
});

test('unknown brand or rack in the URL is ignored, not an empty page', async ({ page }) => {
  await page.goto('/katalog?rak=lama');
  await expect(cards(page)).toHaveCount(allProducts.length);
  await page.goto('/katalog/mouse?merek=keychron');
  await expect(cards(page)).toHaveCount(byCategory('mouse').length);
  await expect(page.getByRole('button', { name: /^Hapus filter/ })).toHaveCount(0);
});

test('lightest-first sort is only offered where products have a weight', async ({ page }) => {
  await page.goto('/katalog/keyboard?urut=teringan');
  const sort = page.getByLabel('Urutkan');
  await expect(sort).toHaveValue('terbaru');
  await expect(sort.locator('option[value="teringan"]')).toHaveCount(0);
  await page.goto('/katalog/mouse');
  await expect(page.getByLabel('Urutkan').locator('option[value="teringan"]')).toHaveCount(1);
});

test('filter sheet closes on backdrop click and when the screen grows past the breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/katalog/mouse');
  const sheet = page.getByRole('dialog', { name: 'Filter' });

  await page.getByRole('button', { name: /^Filter/ }).click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(400, 20); // backdrop di atas sheet
  await expect(sheet).toBeHidden();

  await page.getByRole('button', { name: /^Filter/ }).click();
  await expect(sheet).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Halaman tidak terkunci: filter di sidebar bisa dipakai.
  await page.getByRole('checkbox', { name: 'Stok tersedia' }).check();
  await expect(page).toHaveURL(/stok=1/);
});
