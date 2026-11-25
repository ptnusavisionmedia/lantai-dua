import { formatDimensions, formatRupiah, stockLabel } from '@lantai-dua/shared/catalog';
import { expect, test } from '@playwright/test';
import { allProducts } from './data';

type Product = (typeof allProducts)[number];
const sorted = (p: Product) => [...p.variants].sort((a, b) => a.sortOrder - b.sortOrder);
function pick(label: string, pred: (p: Product) => boolean): Product {
  const found = allProducts.find(pred);
  if (!found) throw new Error(`Data uji tidak ada: ${label}`);
  return found;
}

// D5: stok habis, unit demo tersedia.
const d5 = pick(
  'd5',
  (p) =>
    p.variants.every((v) => v.stockQty === 0) && p.demoUnits.some((u) => u.status === 'available'),
);
// Data asli tidak punya varian berbeda harga, jadi pergantian varian dibuktikan lewat teks stoknya.
const multi = pick('multi', (p) => {
  const [a, b] = sorted(p);
  return !!a && !!b && stockLabel(a.stockQty).detail !== stockLabel(b.stockQty).detail;
});
const freeOne = pick('free', (p) => ['mousepad', 'glasspad', 'deskmat'].includes(p.categorySlug));
const mouse = pick(
  'mouse',
  (p) =>
    p.categorySlug === 'mouse' && ['length_mm', 'width_mm', 'height_mm'].every((k) => k in p.specs),
);

test('shows name, price and both statuses', async ({ page }) => {
  await page.goto(`/produk/${multi.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(multi.modelName);
  await expect(page.getByText(formatRupiah(sorted(multi)[0]?.priceIdr ?? 0)).first()).toBeVisible();
  await expect(page.getByText(/^Stok jual: /)).toBeVisible();
  await expect(
    page.getByText(/^(Demo tersedia|Unit demo sedang|Tidak ada unit demo|Bisa dicoba langsung)/),
  ).toBeVisible();
});

test('switching variant updates URL, price and stock', async ({ page }) => {
  await page.goto(`/produk/${multi.slug}`);
  const second = sorted(multi)[1];
  if (!second) throw new Error('varian kedua tidak ada');
  await page.getByRole('radio', { name: second.name }).click();
  await expect(page).toHaveURL(new RegExp(`varian=${second.sku}`));
  await expect(page.getByRole('radio', { name: second.name })).toBeChecked();
  await expect(page.getByText(formatRupiah(second.priceIdr)).first()).toBeVisible();
  await expect(page.getByText(stockLabel(second.stockQty).detail)).toBeVisible();
});

test('unknown variant falls back to the first', async ({ page }) => {
  const res = await page.goto(`/produk/${multi.slug}?varian=TIDAK-ADA`);
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('radio', { checked: true })).toHaveAccessibleName(
    sorted(multi)[0]?.name ?? '',
  );
});

test('out of stock with an available demo still offers a trial', async ({ page }) => {
  await page.goto(`/produk/${d5.slug}`);
  await expect(page.getByText('Stok jual: habis')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah ke keranjang' })).toBeDisabled();
  const demoSku = d5.demoUnits.find((u) => u.status === 'available')?.variantSku;
  await expect(page.getByRole('link', { name: /Coba di showroom/ })).toHaveAttribute(
    'href',
    `/reservasi/baru?varian=${demoSku}`,
  );
});

test('in-stock variant links to the cart', async ({ page }) => {
  const inStock = pick('stok', (p) => (sorted(p)[0]?.stockQty ?? 0) > 0);
  await page.goto(`/produk/${inStock.slug}`);
  await expect(page.getByRole('link', { name: 'Tambah ke keranjang' })).toHaveAttribute(
    'href',
    `/keranjang?tambah=${sorted(inStock)[0]?.sku}`,
  );
});

test('free-to-try products name the area', async ({ page }) => {
  await page.goto(`/produk/${freeOne.slug}`);
  await expect(
    page.getByText('Bisa dicoba langsung di Meja Permukaan, tanpa reservasi.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Coba di showroom/ })).toHaveCount(0);
});

test('mouse spec table shows dimensions and compare link', async ({ page }) => {
  await page.goto(`/produk/${mouse.slug}`);
  await expect(page.getByText(formatDimensions(mouse.specs) ?? '')).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Bandingkan', exact: true }),
  ).toHaveAttribute('href', `/bandingkan?incaran=${mouse.slug}`);
});

test('unknown products are 404', async ({ page }) => {
  expect((await page.goto('/produk/tidak-ada'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible();
});

test('catalog card opens the product page', async ({ page }) => {
  await page.goto('/katalog');
  await page.getByTestId('product-card').first().click();
  await expect(page).toHaveURL(/\/produk\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('no horizontal scroll on a product page at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/produk/${multi.slug}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
});
