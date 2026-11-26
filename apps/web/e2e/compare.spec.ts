import { expect, type Page, test } from '@playwright/test';
import { compareExample, fullName, product, references } from './data';

const current = (page: Page) => page.getByLabel('Mouse gue sekarang');
const target = (page: Page) => page.getByLabel('Mouse incaran');
const summary = (page: Page) => page.getByTestId('compare-summary');
const { currentSlug: ex1, targetSlug: ex2 } = compareExample;

test('opens on the example pair and writes it into the URL', async ({ page }) => {
  await page.goto('/bandingkan');
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  await expect(current(page).locator('option:checked')).toHaveText(fullName(ex1));
  await expect(target(page).locator('option:checked')).toHaveText(fullName(ex2));
  await expect(page).toHaveTitle(`Bandingkan ${fullName(ex1)} vs ${fullName(ex2)} · LANTAI DUA`);
  await expect(summary(page)).toHaveText(/^Incaran /);
});

test('keeps the current slot empty when only a target is given', async ({ page }) => {
  await page.goto('/bandingkan?incaran=razer-deathadder-v3-pro');
  await expect(summary(page)).toHaveText(
    'Pilih mouse yang lu pakai sekarang untuk melihat bedanya.',
  );
  await expect(page).toHaveURL('/bandingkan?incaran=razer-deathadder-v3-pro');
});

test('offers for-sale mice and other mice in separate groups', async ({ page }) => {
  await page.goto('/bandingkan');
  await expect(current(page).locator('optgroup[label="Dijual di LANTAI DUA"]')).toHaveCount(1);
  await expect(
    current(page).locator('optgroup[label="Mouse lain"] option', { hasText: fullName(ex1) }),
  ).toHaveCount(1);
  await expect(current(page).locator('option', { hasText: 'Isi ukuran sendiri' })).toHaveCount(1);
  await expect(target(page).locator('option', { hasText: fullName(ex1) })).toHaveCount(0);
});

test('each choice is one step back in history', async ({ page }) => {
  await page.goto('/bandingkan');
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  await target(page).selectOption({ label: fullName('razer-deathadder-v3-pro') });
  await expect(page).toHaveURL(/incaran=razer-deathadder-v3-pro/);
  await current(page).selectOption({ label: 'Isi ukuran sendiri' });
  await expect(page).toHaveURL(/sekarang=ukur/);
  await page.goBack();
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=razer-deathadder-v3-pro`);
  await expect(current(page).locator('option:checked')).toHaveText(fullName(ex1));
  await page.goBack();
  await expect(page).toHaveURL(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  await expect(target(page).locator('option:checked')).toHaveText(fullName(ex2));
});

for (const [raw, url] of [
  ['sekarang=zzz&incaran=logitech-g102-lightsync', `/bandingkan?sekarang=${ex1}&incaran=${ex2}`],
  [
    'sekarang=ukur&panjang=abc&lebar=63&incaran=vortexseries-ignix-f1',
    '/bandingkan?sekarang=ukur&lebar=63&incaran=vortexseries-ignix-f1',
  ],
  ['panjang=125&incaran=vortexseries-ignix-f1', '/bandingkan?incaran=vortexseries-ignix-f1'],
] as const) {
  test(`survives ?${raw}`, async ({ page }) => {
    await page.goto(`/bandingkan?${raw}`);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bandingkan mouse');
  });
}

test('says when both slots hold the same mouse', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=vortexseries-ignix-f1&incaran=vortexseries-ignix-f1');
  await expect(summary(page)).toHaveText('Dua pilihan ini mouse yang sama.');
});

test('applies manual sizes on Enter and rejects out-of-range values', async ({ page }) => {
  await page.goto('/bandingkan?sekarang=ukur&incaran=vortexseries-ignix-f1');
  await page.getByLabel('Panjang (mm)').fill('125,5');
  await page.getByLabel('Panjang (mm)').press('Enter');
  await expect(page).toHaveURL(/panjang=125\.5/);
  await expect(summary(page)).toHaveText(/^Incaran lebih pendek/);
  await page.getByLabel('Lebar (mm)').fill('500');
  await page.getByLabel('Lebar (mm)').blur();
  await expect(page.getByText('Lebar harus antara 40 dan 100 mm.')).toBeVisible();
  await expect(page).not.toHaveURL(/lebar=/);
});

test('shows price only when both mice are for sale', async ({ page }) => {
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  const table = page.getByTestId('compare-table');
  await expect(table.getByText('Panjang', { exact: true })).toBeVisible();
  await expect(table.getByText('Harga', { exact: true })).toHaveCount(0);
  await page.goto('/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=razer-deathadder-v3-pro');
  await expect(table.getByText('Harga', { exact: true })).toBeVisible();
});

test('sends guests to login with the reservation link, and suggests bringing the old mouse', async ({
  page,
}) => {
  await page.goto(`/bandingkan?sekarang=${ex1}&incaran=${ex2}`);
  const sku = product(ex2).demoUnits[0]?.variantSku;
  const next = `/reservasi/baru?varian=${sku}&bawa=${ex1}`;
  await expect(page.getByText('Tidak ada di showroom')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Coba keduanya di Surabaya' })).toHaveAttribute(
    'href',
    `/masuk?next=${encodeURIComponent(next)}`,
  );
  await expect(
    page.getByText(
      'Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.',
    ),
  ).toBeVisible();
});

test('links both demo units without bawa for two showroom mice', async ({ page }) => {
  const a = 'vortexseries-ignix-r1-pro';
  const b = 'razer-deathadder-v3-pro';
  await page.goto(`/bandingkan?sekarang=${a}&incaran=${b}`);
  const next = `/reservasi/baru?varian=${product(a).demoUnits[0]?.variantSku},${product(b).demoUnits[0]?.variantSku}`;
  await expect(page.getByRole('link', { name: 'Coba keduanya di Surabaya' })).toHaveAttribute(
    'href',
    `/masuk?next=${encodeURIComponent(next)}`,
  );
  await expect(page.getByText(/Mouse lama lu nggak ada di showroom/)).toHaveCount(0);
});

test('reference mice have no product page', async ({ page }) => {
  const slug = references[0]?.slug;
  expect(slug).toBeDefined();
  expect((await page.goto(`/produk/${slug}`))?.status()).toBe(404);
});
