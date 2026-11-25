import { expect, type Page, test } from '@playwright/test';

const password = process.env.E2E_PASSWORD ?? '';

async function login(page: Page, email: string, next?: string) {
  await page.goto(next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

test.beforeAll(() => {
  if (!password) throw new Error('E2E_PASSWORD belum diisi di apps/web/.env.local');
});

test('guest is sent to login with next', async ({ page }) => {
  await page.goto('/operator');
  await expect(page).toHaveURL('/masuk?next=%2Foperator');
});

test('customer lands on /akun', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test');
  await expect(page).toHaveURL('/akun');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Halo, Raka');
});

test('operator lands on /operator and cannot open /pemilik', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test');
  await expect(page).toHaveURL('/operator');
  await page.goto('/pemilik');
  await expect(page).toHaveURL('/operator');
});

test('owner lands on /pemilik and can open /operator', async ({ page }) => {
  await login(page, 'pemilik@lantaidua.test');
  await expect(page).toHaveURL('/pemilik');
  await page.goto('/operator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hari ini');
});

test('wrong password shows a clear message', async ({ page }) => {
  await page.goto('/masuk');
  await page.getByLabel('Email').fill('pelanggan1@lantaidua.test');
  await page.getByLabel('Kata sandi').fill('salah-banget');
  await page.getByRole('button', { name: 'Masuk' }).click();
  // Dibatasi ke <main>: Next.js punya route announcer sendiri dengan role="alert".
  const alert = page.getByRole('main').getByRole('alert');
  await expect(alert).toContainText('Email atau kata sandi salah.');
  await expect(alert).toContainText('Belum punya akun?');
  await expect(alert.getByRole('link', { name: 'Daftar dulu' })).toHaveAttribute('href', '/daftar');
});

test('the signup hint keeps where the user was going', async ({ page }) => {
  await page.goto('/masuk?next=%2Fakun');
  await page.getByLabel('Email').fill('belum-daftar@lantaidua.test');
  await page.getByLabel('Kata sandi').fill('salah-banget');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(
    page.getByRole('main').getByRole('alert').getByRole('link', { name: 'Daftar dulu' }),
  ).toHaveAttribute('href', '/daftar?next=%2Fakun');
});

test('external next is ignored', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test', 'https://evil.example');
  await expect(page).toHaveURL('/akun');
});

test('deactivated staff land on /akun-nonaktif and can sign out', async ({ page }) => {
  await login(page, 'nonaktif@lantaidua.test');
  await expect(page).toHaveURL('/akun-nonaktif');
  await page.goto('/operator');
  await expect(page).toHaveURL('/akun-nonaktif');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/akun');
  await expect(page).toHaveURL('/masuk?next=%2Fakun');
});

test('sign out ends the session', async ({ page }) => {
  await login(page, 'pelanggan1@lantaidua.test');
  await expect(page).toHaveURL('/akun');
  await page.getByRole('button', { name: 'Keluar' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/akun');
  await expect(page).toHaveURL('/masuk?next=%2Fakun');
});
