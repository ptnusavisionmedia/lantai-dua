import { expect, test } from '@playwright/test';
import { allProducts, compareExample, fullName } from './data';

const RACKS = [
  ['Kontrol', 'kontrol', ['mouse', 'keyboard']],
  ['Permukaan', 'permukaan', ['mousepad', 'glasspad', 'deskmat']],
  ['Audio', 'audio', ['headset']],
] as const;
const inCategories = (cats: readonly string[]) =>
  allProducts.filter((p) => cats.includes(p.categorySlug)).length;

test('rack doors link to each rack with a product count', async ({ page }) => {
  await page.goto('/');
  const racks = page.getByRole('region', { name: 'Rak di lantai satu' });
  for (const [name, slug, cats] of RACKS) {
    const door = racks.getByRole('link', { name: new RegExp(`^${name}`) });
    await expect(door).toHaveAttribute('href', `/katalog?rak=${slug}`);
    await expect(door).toContainText(`${inCategories(cats)} produk`);
  }
});

test('demo row shows only products with an available demo unit', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('region', { name: 'Bisa dicoba di showroom' });
  const expected = Math.min(
    8,
    allProducts.filter((p) => p.demoUnits.some((u) => u.status === 'available')).length,
  );
  await expect(row.getByTestId('product-card')).toHaveCount(expected);
  await expect(row.getByText('Bisa dicoba langsung')).toHaveCount(0);
  await expect(row.getByRole('link', { name: 'Semua yang bisa dicoba' })).toHaveAttribute(
    'href',
    '/katalog?demo=1',
  );
});

test('rack filter on /katalog', async ({ page }) => {
  await page.goto('/katalog?rak=permukaan');
  await expect(page.getByTestId('product-card')).toHaveCount(
    inCategories(['mousepad', 'glasspad', 'deskmat']),
  );
  await expect(page.getByRole('button', { name: 'Hapus filter Rak Permukaan' })).toBeVisible();
});

test('rack door opens the filtered catalog', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Rak di lantai satu' })
    .getByRole('link', { name: /^Audio/ })
    .click();
  await expect(page).toHaveURL('/katalog?rak=audio');
  await expect(page.getByTestId('product-card')).toHaveCount(inCategories(['headset']));
});

test('home compares the example pair and opens the full page', async ({ page }) => {
  await page.goto('/');
  const section = page.getByRole('region', { name: 'Bandingkan mouse' });
  await expect(section.getByLabel('Mouse gue sekarang').locator('option:checked')).toHaveText(
    fullName(compareExample.currentSlug),
  );
  await expect(section.getByLabel('Mouse gue sekarang').locator('option')).not.toContainText([
    'Isi ukuran sendiri',
  ]);
  await expect(section.getByRole('img')).toHaveCount(1);
  await expect(section.getByTestId('compare-summary')).toHaveText(/^Incaran /);
  await section
    .getByLabel('Mouse incaran')
    .selectOption({ label: fullName('razer-deathadder-v3-pro') });
  await expect(page).toHaveURL('/');
  await section.getByRole('link', { name: 'Buka perbandingan lengkap' }).click();
  await expect(page).toHaveURL(
    `/bandingkan?sekarang=${compareExample.currentSlug}&incaran=razer-deathadder-v3-pro`,
  );
});
