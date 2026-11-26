import { expect, test } from '@playwright/test';

test('home shows the promise and both calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Coba dulu. Baru pilih.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lihat Katalog' })).toHaveAttribute(
    'href',
    '/katalog',
  );
  await expect(page.getByRole('link', { name: /Reservasi Demo/ })).toHaveAttribute(
    'href',
    '/reservasi/baru',
  );
});

for (const [name, path] of [
  ['Katalog', '/katalog'],
  ['Bandingkan', '/bandingkan'],
  ['Showroom', '/showroom'],
] as const) {
  test(`nav link ${name} opens ${path}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Utama' }).getByRole('link', { name }).click();
    // Bandingkan menulis pasangan yang tampil ke URL (desain 1B §5.3), jadi yang dicek path-nya.
    await expect(page).toHaveURL((url) => url.pathname === path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('footer states the store is fictional', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('contentinfo')).toContainText(
    'LANTAI DUA adalah toko fiktif untuk project magang.',
  );
});
