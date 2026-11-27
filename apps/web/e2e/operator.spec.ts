import { expect, type Page, test } from '@playwright/test';
import {
  clearReservations,
  minutesFromNow,
  reservationStatus,
  reserveAs,
  setWhatsapp,
  shiftReservation,
  startsAtOn,
  updateReservation,
  wibDateIn,
} from './admin';
import { login, variantLabelOf } from './data';

// Berurutan: satu pelanggan tidak boleh punya dua reservasi aktif yang tumpang tindih,
// jadi setiap tes menutup reservasinya sendiri sebelum tes berikutnya.
test.describe.configure({ mode: 'serial' });

const OPERATOR = 'operator1@lantaidua.test';
const CUSTOMER = 'pelanggan1@lantaidua.test'; // Raka Pratama
const HEADSET = 'L2-DBE-GS1XPRO-STD'; // unit DM-H-001, kategori dengan catatan kebersihan
const KEYBOARD = 'L2-KCH-K8PRO-BRN';

/** Sekarang + `min` menit, tetapi tidak sebelum awal hari ini (WIB), supaya sesi tetap "hari ini". */
function at(min: number): Date {
  const todayStart = Date.parse(startsAtOn(wibDateIn(0), '00.00'));
  return new Date(Math.max(minutesFromNow(min).getTime(), todayStart));
}

/** Reservasi pelanggan dibuat di slot masa depan, lalu digeser ke `start`. */
async function make(skus: string[], start: Date, note: string | null = null): Promise<string> {
  const code = await reserveAs(CUSTOMER, skus, startsAtOn(wibDateIn(9), '12.00'), note);
  await shiftReservation(code, start);
  return code;
}

async function asOperator(page: Page, path = '/operator'): Promise<void> {
  await login(page, OPERATOR);
  await expect(page).toHaveURL('/operator', { timeout: 15_000 });
  if (path !== '/operator') await page.goto(path);
}

const rowOf = (page: Page, code: string) => page.locator('article', { hasText: code });

let first = '';
let cancelled = '';

test.beforeAll(async () => {
  await clearReservations([CUSTOMER]);
  await setWhatsapp(CUSTOMER, '6281234500001');
});

test.afterAll(async () => {
  await clearReservations([CUSTOMER]);
});

test("shows today's reservation with contact, units, hygiene note, and note", async ({ page }) => {
  first = await make([HEADSET, KEYBOARD], at(-5), 'Bawa mouse lama');
  await asOperator(page);
  const row = rowOf(page, first);
  await expect(row).toBeVisible();
  await expect(row.getByText('Raka Pratama')).toBeVisible();
  await expect(row.getByRole('link', { name: '0812-3450-0001' })).toHaveAttribute(
    'href',
    'https://wa.me/6281234500001',
  );
  await expect(row.getByText(variantLabelOf(HEADSET))).toBeVisible();
  await expect(row.getByText('DM-H-001')).toBeVisible();
  await expect(row.getByText('Meja Kontrol').first()).toBeVisible();
  await expect(
    row.getByText('Pasang cover telinga sekali pakai sebelum dipakai pelanggan.'),
  ).toBeVisible();
  await expect(row.getByText('Bawa mouse lama')).toBeVisible();
  await expect(row.getByText('Terjadwal', { exact: true })).toBeVisible();
  await expect(row.getByText('Baru', { exact: true })).toBeVisible();
});

test('checks in and completes from the timeline, with undo', async ({ page }) => {
  await asOperator(page);
  const row = rowOf(page, first);
  await row.getByRole('button', { name: 'Check-in', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Selesai', exact: true })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Urungkan check-in' })).toBeVisible();
  await row.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Urungkan selesai' })).toBeVisible();
  await expect(row.getByText('Selesai', { exact: true })).toBeVisible();
  expect(await reservationStatus(first)).toBe('completed');
});

test('marks a no-show on the detail page and still lets a late customer in', async ({ page }) => {
  const code = await make(['L2-RKG-M75-BLK-VIR'], at(-20));
  await asOperator(page, `/operator/reservasi/${code}`);
  await page.getByRole('button', { name: 'Tidak datang', exact: true }).click();
  // Tombolnya hilang setelah status berubah; teks yang tersisa adalah chip status.
  await expect(page.getByRole('button', { name: 'Tidak datang', exact: true })).toHaveCount(0);
  await expect(page.getByText('Tidak datang', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check-in', exact: true })).toBeVisible();
  expect(await reservationStatus(code)).toBe('no_show');
  await updateReservation(code, { status: 'cancelled', cancel_reason: 'bersih-bersih tes' });
});

test('cancels with a reason that the customer can read', async ({ page, browser }) => {
  cancelled = await make(['L2-RZR-DAV3PRO-BLK'], at(90));
  await asOperator(page, `/operator/reservasi/${cancelled}`);
  await page.getByRole('button', { name: 'Batalkan', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Batalkan reservasi ini?' });
  await expect(dialog.getByText('Alasan ini tampil di halaman reservasi pelanggan.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Batalkan reservasi' }).click();
  await expect(dialog.getByText('Tulis alasan pembatalan (3–200 karakter).')).toBeVisible();
  await dialog.getByLabel('Alasan pembatalan').fill('Unit sedang dibersihkan');
  await dialog.getByRole('button', { name: 'Batalkan reservasi' }).click();
  await expect(page.getByText('Dibatalkan', { exact: true })).toBeVisible();
  await expect(page.getByText('Unit sedang dibersihkan')).toBeVisible();

  const customer = await browser.newContext();
  const customerPage = await customer.newPage();
  await login(customerPage, CUSTOMER, `/akun/reservasi/${cancelled}`);
  await expect(customerPage).toHaveURL(new RegExp(`/akun/reservasi/${cancelled}`), {
    timeout: 15_000,
  });
  await expect(customerPage.getByText('Dibatalkan toko', { exact: true })).toBeVisible();
  await expect(customerPage.getByText('Alasan dari toko: Unit sedang dibersihkan')).toBeVisible();
  await customer.close();
});

test('opens a reservation from a typed code and explains bad ones', async ({ page }) => {
  await asOperator(page);
  const field = page.getByLabel('Kode reservasi');
  await field.fill(cancelled.replace('L2D-', '').toLowerCase());
  await field.press('Enter');
  await expect(page).toHaveURL(`/operator/reservasi/${cancelled}`);

  await page.goto('/operator');
  await page.getByLabel('Kode reservasi').fill('zzz');
  await page.getByRole('button', { name: 'Buka' }).click();
  await expect(page.getByText('Kode tidak dikenali. Contoh: L2D-H7K3QX9P')).toBeVisible();

  await page.goto('/operator/reservasi/L2D-22222222');
  await expect(page.getByText('Kode reservasi tidak ditemukan')).toBeVisible();
  await expect(page.getByLabel('Kode reservasi')).toBeVisible();
});

test('lists unrecorded reservations for correction', async ({ page }) => {
  const code = await make(['L2-PRS-ESS75HE-SBK'], new Date(startsAtOn(wibDateIn(-1), '14.00')));
  await updateReservation(code, { status: 'unrecorded' });
  await asOperator(page);
  const corrections = page.getByRole('region', { name: /Perlu dikoreksi/ });
  const row = corrections.locator('article', { hasText: code });
  await expect(row.getByText('Raka Pratama')).toBeVisible();
  await row.getByRole('button', { name: 'Datang', exact: true }).click();
  await expect(page.locator('article', { hasText: code })).toHaveCount(0);
  expect(await reservationStatus(code)).toBe('completed');
});

test('keeps customers out of the operator pages', async ({ page }) => {
  await login(page, CUSTOMER);
  await expect(page).toHaveURL('/akun', { timeout: 15_000 });
  await page.goto('/operator');
  await expect(page).toHaveURL('/akun');
});

test('fits a 360 px screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await asOperator(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('shows a new reservation without reloading', async ({ page }) => {
  await asOperator(page);
  await expect(page.getByText('Langsung', { exact: true })).toBeVisible({ timeout: 15_000 });
  let reloaded = false;
  page.on('load', () => {
    reloaded = true;
  });
  const code = await make(['L2-VTX-IGNIXR1PRO-BLK'], at(-5));
  await expect(rowOf(page, code)).toBeVisible({ timeout: 10_000 });
  expect(reloaded).toBe(false);
  await updateReservation(code, { status: 'cancelled', cancel_reason: 'bersih-bersih tes' });
});

test('explains a blocked camera and keeps the code field usable', async ({ page }) => {
  await asOperator(page);
  await page.getByRole('button', { name: 'Scan kamera' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan QR reservasi' });
  await expect(dialog.getByText('Kamera tidak bisa dipakai. Ketik kodenya saja.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Tutup' }).click();
  await expect(dialog).toBeHidden();
  await page.getByLabel('Kode reservasi').fill(first);
  await page.getByRole('button', { name: 'Buka' }).click();
  await expect(page).toHaveURL(`/operator/reservasi/${first}`);
});
