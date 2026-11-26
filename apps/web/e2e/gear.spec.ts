import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { compareExample, references } from './data';

// Gear disimpan per akun, jadi tes di file ini berjalan berurutan dengan satu akun khusus.
test.describe.configure({ mode: 'serial' });

const CUSTOMER = 'pelanggan2@lantaidua.test';
const password = process.env.E2E_PASSWORD ?? '';
const reference = references[0]?.slug ?? '';

async function login(page: Page, email: string, next?: string) {
  await page.goto(next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

test.beforeAll(async () => {
  if (!password) throw new Error('E2E_PASSWORD belum diisi di apps/web/.env.local');
  // Mulai dari keadaan bersih: pelanggan menghapus gear-nya sendiri (diizinkan RLS).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({ email: CUSTOMER, password });
  if (error) throw new Error(`Login ${CUSTOMER} gagal: ${error.message}`);
  await supabase.from('user_gear').delete().eq('user_id', data.user.id);
  await supabase.auth.signOut();
});

test('guests are sent to login and come back to the same pair', async ({ page }) => {
  const pairUrl = '/bandingkan?sekarang=vortexseries-ignix-r1-pro&incaran=vortexseries-ignix-f1';
  await page.goto(pairUrl);
  await page.getByRole('link', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page).toHaveURL(`/masuk?next=${encodeURIComponent(pairUrl)}`);
  await page.getByLabel('Email').fill(CUSTOMER);
  await page.getByLabel('Kata sandi').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL(pairUrl);
  // Tidak tersimpan otomatis setelah login (keputusan penyusun no. 13).
  await expect(page.getByRole('button', { name: 'Simpan sebagai mouse gue' })).toBeVisible();
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toHaveCount(0);
});

test('a customer saves a listed mouse and it fills the current slot next time', async ({
  page,
}) => {
  await login(page, CUSTOMER, `/bandingkan?sekarang=${reference}&incaran=vortexseries-ignix-f1`);
  await page.getByRole('button', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toBeVisible();
  await page.goto('/bandingkan?incaran=razer-deathadder-v3-pro');
  await expect(page).toHaveURL(`/bandingkan?sekarang=${reference}&incaran=razer-deathadder-v3-pro`);
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toBeVisible();
});

test('a customer saves manual sizes', async ({ page }) => {
  await login(
    page,
    CUSTOMER,
    '/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=vortexseries-ignix-f1',
  );
  await page.getByRole('button', { name: 'Simpan sebagai mouse gue' }).click();
  await expect(page.getByText('Tersimpan sebagai mouse lu.')).toBeVisible();
  await page.goto('/bandingkan');
  await expect(page).toHaveURL(
    `/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=${compareExample.targetSlug}`,
  );
});

test('staff never see the save button', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test', '/bandingkan');
  await expect(page).toHaveURL(/\/bandingkan/);
  await expect(page.getByTestId('compare-summary')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simpan sebagai mouse gue' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Simpan sebagai mouse gue' })).toHaveCount(0);
});

test('a logged-in customer goes straight to the reservation form', async ({ page }) => {
  await login(
    page,
    CUSTOMER,
    `/bandingkan?sekarang=${compareExample.currentSlug}&incaran=${compareExample.targetSlug}`,
  );
  await expect(page.getByRole('link', { name: 'Coba keduanya di Surabaya' })).toHaveAttribute(
    'href',
    /^\/reservasi\/baru\?varian=/,
  );
});

test('home offers the saved manual sizes', async ({ page }) => {
  // Gear pelanggan2 berupa ukuran manual dari tes 'a customer saves manual sizes'.
  await login(page, CUSTOMER, '/');
  const section = page.getByRole('region', { name: 'Bandingkan mouse' });
  await expect(section.getByLabel('Mouse gue sekarang').locator('option:checked')).toHaveText(
    'Ukuran yang lu simpan',
  );
  await expect(section.getByRole('link', { name: 'Buka perbandingan lengkap' })).toHaveAttribute(
    'href',
    `/bandingkan?sekarang=ukur&panjang=125&bobot=60&incaran=${compareExample.targetSlug}`,
  );
});
