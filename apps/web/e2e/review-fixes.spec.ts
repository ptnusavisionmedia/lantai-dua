import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const password = process.env.E2E_PASSWORD ?? '';

test.describe('forms keep what the user typed', () => {
  test('wrong password keeps the email', async ({ page }) => {
    await page.goto('/masuk');
    await page.getByLabel('Email').fill('pelanggan1@lantaidua.test');
    await page.getByLabel('Kata sandi').fill('salah-banget');
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('pelanggan1@lantaidua.test');
  });

  test('signup keeps name and email when consent is missing', async ({ page }) => {
    await page.goto('/daftar');
    await page.getByLabel('Nama lengkap').fill('Tes Isian Tetap');
    await page.getByLabel('Email').fill('isian-tetap@lantaidua.test');
    await page.getByLabel('Kata sandi').fill('kata-sandi-panjang');
    await page.getByRole('button', { name: 'Daftar' }).click();
    await expect(page.getByText('Setujui kebijakan privasi untuk mendaftar.')).toBeVisible();
    await expect(page.getByLabel('Nama lengkap')).toHaveValue('Tes Isian Tetap');
    await expect(page.getByLabel('Email')).toHaveValue('isian-tetap@lantaidua.test');
  });
});

test('error fields only reference descriptions that exist', async ({ page }) => {
  await page.goto('/daftar');
  await page.getByRole('button', { name: 'Daftar' }).click();
  await expect(page.getByText('Kata sandi minimal 8 karakter.')).toBeVisible();
  const dangling = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-describedby]')].flatMap((el) =>
      (el.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && !document.getElementById(id)),
    ),
  );
  expect(dangling).toEqual([]);
});

test('sign-out button meets the 44px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/masuk');
  await page.getByLabel('Email').fill('pelanggan2@lantaidua.test');
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL('/akun');
  const box = await page.getByRole('button', { name: 'Keluar' }).boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test('email links with token_hash are not accepted yet (login CSRF)', async ({ page }) => {
  const rootEnv = '../../.env.local';
  if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  test.skip(!url || !secret, 'Butuh SUPABASE_URL dan SUPABASE_SECRET_KEY di .env.local root');
  const admin = createClient(url ?? '', secret ?? '', { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'pelanggan3@lantaidua.test',
  });
  if (error) throw error;

  await page.goto(
    `/auth/konfirmasi?token_hash=${data.properties.hashed_token}&type=magiclink&next=%2Fakun`,
  );
  await expect(page).toHaveURL('/masuk?error=verifikasi');
  await page.goto('/akun');
  await expect(page).toHaveURL('/masuk?next=%2Fakun');
});
