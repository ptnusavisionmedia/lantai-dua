import { expect, test } from '@playwright/test';
import {
  clearReservations,
  minutesFromNow,
  reserveAs,
  setWhatsapp,
  shiftReservation,
  startsAtOn,
  updateReservation,
  whatsappOf,
  wibDateIn,
} from './admin';
import { fillLogin, login, product, variantLabelOf } from './data';

// Satu file, berurutan: tes reservasi memakai akun dan unit yang sama, jadi tidak boleh paralel.
test.describe.configure({ mode: 'serial' });

const CUSTOMER = 'pelanggan3@lantaidua.test';
const OTHER = 'pelanggan2@lantaidua.test';
const CUSTOMER_WA = '6281234500003';
const OTHER_WA = '6281234500002';

// Reservasi mewajibkan nomor WhatsApp, jadi kedua akun disiapkan dengan nomor (seed bisa belum dijalankan ulang).
test.beforeAll(async () => {
  await setWhatsapp(CUSTOMER, CUSTOMER_WA);
  await setWhatsapp(OTHER, OTHER_WA);
});
const sku = (slug: string) => product(slug).demoUnits[0]?.variantSku ?? '';
const F1 = sku('vortexseries-ignix-f1'); // satu unit, tersedia
const R1 = sku('vortexseries-ignix-r1-pro');
const SERV = sku('hyperx-cloud-ii'); // satu-satunya unit sedang diservis

test.describe('formulir reservasi', () => {
  const day = wibDateIn(3);
  const at = (hhmm: string) => startsAtOn(day, hhmm);

  test.beforeAll(async () => {
    await clearReservations([CUSTOMER, OTHER]);
  });

  test('a guest picks a slot, logs in, and comes back to the same form', async ({ page }) => {
    await page.goto(`/reservasi/baru?varian=${F1}`);
    await expect(page.getByRole('button', { name: `Hapus ${variantLabelOf(F1)}` })).toBeVisible();
    await page.locator(`[data-date="${day}"]`).click();
    await page.getByRole('radio', { name: '14.00' }).check();
    await page.getByLabel('Catatan').fill('Bawa mouse sendiri');
    await expect(page).toHaveURL(new RegExp(`tanggal=${day}&jam=14\\.00`));
    await page.getByRole('link', { name: 'Masuk untuk konfirmasi' }).click();
    await expect(page).toHaveURL(/\/masuk\?next=/);
    await fillLogin(page, CUSTOMER);
    await expect(page).toHaveURL(
      new RegExp(`/reservasi/baru\\?varian=${F1}&tanggal=${day}&jam=14\\.00`),
    );
    await expect(page.getByLabel('Catatan')).toHaveValue('Bawa mouse sendiri');
    await expect(page.getByRole('radio', { name: '14.00' })).toBeChecked();
    await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
    await expect(page).toHaveURL(/\/akun\/reservasi\/L2D-[2-9A-HJKMNP-Z]{8}\?baru=1$/);
  });

  test('shows the bring-your-own hint from Bandingkan', async ({ page }) => {
    await page.goto(`/reservasi/baru?varian=${F1}&bawa=logitech-g102-lightsync`);
    await expect(
      page.getByText(
        'Mouse lama lu nggak ada di showroom? Bawa aja dari rumah biar bisa dibandingin langsung.',
      ),
    ).toBeVisible();
  });

  test('survives a hand-made URL', async ({ page }) => {
    await page.goto(
      `/reservasi/baru?varian=ZZZ,${F1},${F1}&tanggal=1999-01-01&jam=99.99&bawa=../x`,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reservasi demo');
    await expect(page.getByRole('button', { name: /^Hapus / })).toHaveCount(1);
  });

  test('keeps a serviced-only variant and explains every slot', async ({ page }) => {
    await page.goto(`/reservasi/baru?varian=${SERV}&tanggal=${day}`);
    await expect(page.getByRole('button', { name: `Hapus ${variantLabelOf(SERV)}` })).toBeVisible();
    const radios = page.getByRole('radio', { name: /^\d{2}\.\d{2}$/ });
    await expect(radios.first()).toBeDisabled();
    expect(
      await radios.evaluateAll((els) =>
        els.every((e) => e.getAttribute('aria-disabled') === 'true'),
      ),
    ).toBe(true);
    await radios.first().focus();
    await expect(page.getByText(`Unit demo ${variantLabelOf(SERV)} sedang diservis`)).toBeVisible();
  });

  test('explains a slot taken by someone else, without saying who', async ({ page }) => {
    await reserveAs(OTHER, [F1], at('15.00'));
    await page.goto(`/reservasi/baru?varian=${F1}&tanggal=${day}`);
    const slot = page.getByRole('radio', { name: '15.00' });
    await expect(slot).toBeDisabled();
    await slot.focus();
    await expect(
      page.getByText(`Unit demo ${variantLabelOf(F1)} sudah dipesan di jam ini`),
    ).toBeVisible();
    await expect(page.getByText(/pelanggan2|Sari|Dewi/i)).toHaveCount(0);
  });

  test('tells the loser of a race what happened and refreshes the slots', async ({ page }) => {
    await login(page, CUSTOMER, `/reservasi/baru?varian=${R1}&tanggal=${day}&jam=16.00`);
    await expect(page.getByRole('radio', { name: '16.00' })).toBeChecked();
    await reserveAs(OTHER, [R1], at('16.00')); // diambil orang lain setelah halaman terbuka
    await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'baru saja dipesan orang lain di jam ini' }),
    ).toBeVisible();
    await expect(page.getByRole('radio', { name: '16.00' })).toBeDisabled();
  });

  test('staff see that reservations come from customer accounts', async ({ page }) => {
    await login(page, 'operator1@lantaidua.test', `/reservasi/baru?varian=${F1}`);
    await expect(page).toHaveURL((url) => url.pathname === '/reservasi/baru');
    await expect(page.getByText('Reservasi dibuat dari akun pelanggan.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Konfirmasi reservasi' })).toHaveCount(0);
  });

  test('limits the picker to four variants', async ({ page }) => {
    const four = [F1, R1, sku('logitech-g-pro-x-superlight-2'), sku('razer-deathadder-v3-pro')];
    await page.goto(`/reservasi/baru?varian=${four.join(',')}`);
    await expect(page.getByRole('button', { name: /^Hapus / })).toHaveCount(4);
    await expect(page.getByRole('button', { name: '+ Tambah' })).toBeDisabled();
    await expect(page.getByText('Maksimal 4 unit demo per reservasi.')).toBeVisible();
  });

  test('adds and removes variants from the picker', async ({ page }) => {
    await page.goto('/reservasi/baru');
    await expect(page.getByRole('button', { name: 'Konfirmasi reservasi' })).toHaveCount(0);
    await page.getByRole('button', { name: '+ Tambah' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: variantLabelOf(F1) }).click();
    await expect(page).toHaveURL(new RegExp(`varian=${F1}`));
    await expect(page.getByRole('button', { name: `Hapus ${variantLabelOf(F1)}` })).toBeVisible();
    await page.getByRole('button', { name: `Hapus ${variantLabelOf(F1)}` }).click();
    await expect(page.getByRole('button', { name: /^Hapus / })).toHaveCount(0);
  });

  test('tells a customer at the active limit before they fill the form', async ({ page }) => {
    // Pelanggan sudah punya F1 14.00 dari tes pertama; satu lagi membuatnya mencapai batas 2.
    await reserveAs(CUSTOMER, [R1], at('18.00'));
    await login(page, CUSTOMER, `/reservasi/baru?varian=${F1}&tanggal=${day}&jam=19.00`);
    await expect(page).toHaveURL((url) => url.pathname === '/reservasi/baru', { timeout: 15_000 });
    await expect(
      page.getByText(
        'Lu udah punya 2 reservasi aktif. Batalkan salah satu dulu, atau tunggu sampai sesinya lewat.',
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Konfirmasi reservasi' })).toBeDisabled();
  });

  test('fits 360 px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/reservasi/baru?varian=${F1}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
  });

  test.afterAll(async () => {
    await clearReservations([CUSTOMER, OTHER]);
  });
});

test.describe('reservasi saya', () => {
  const day = wibDateIn(4);
  const at = (hhmm: string) => startsAtOn(day, hhmm);
  const unitCode = product('vortexseries-ignix-f1').demoUnits[0]?.code ?? '';
  let code = '';

  test.beforeAll(async () => {
    await clearReservations([CUSTOMER, OTHER]);
    code = await reserveAs(CUSTOMER, [F1], at('14.00'));
  });

  test('shows the code, QR, schedule, items and address', async ({ page }) => {
    await login(page, CUSTOMER, `/akun/reservasi/${code}?baru=1`);
    await expect(page).toHaveURL(new RegExp(`/akun/reservasi/${code}`), { timeout: 15_000 });
    await expect(page.getByText('Reservasi berhasil dibuat.')).toBeVisible();
    await expect(page.getByText(code, { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: `QR ${code}` })).toBeVisible();
    await expect(page.getByText(/· 14\.00–14\.30 WIB$/)).toBeVisible();
    await expect(page.getByText(`${variantLabelOf(F1)} · ${unitCode}`)).toBeVisible();
    await expect(page.getByText('Terjadwal', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/62\d+$/,
    );
  });

  test('offers an ics file and a Google Calendar link', async ({ page }) => {
    await login(page, CUSTOMER, `/akun/reservasi/${code}`);
    await expect(page).toHaveURL(new RegExp(`/akun/reservasi/${code}`), { timeout: 15_000 });
    const ics = page.getByRole('link', { name: 'Unduh ke kalender (.ics)' });
    const href = (await ics.getAttribute('href')) ?? '';
    const res = await page.request.get(href);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/calendar');
    expect(res.headers()['content-disposition']).toContain(`lantai-dua-${code}.ics`);
    expect(await res.text()).toContain(`UID:${code}@lantaidua`);
    const google = page.getByRole('link', { name: 'Tambah ke Google Calendar' });
    await expect(google).toHaveAttribute('href', /calendar\.google\.com.*dates=/);
  });

  test('lists the reservation as upcoming and on the account summary', async ({ page }) => {
    await login(page, CUSTOMER, '/akun/reservasi');
    await expect(page).toHaveURL('/akun/reservasi', { timeout: 15_000 });
    const upcoming = page.getByRole('region', { name: 'Mendatang' });
    await expect(upcoming.getByRole('link', { name: new RegExp(code) })).toBeVisible();
    await page.goto('/akun');
    await expect(page.getByRole('img', { name: `QR ${code}` })).toBeVisible();
    await page.getByRole('link', { name: 'Reservasi', exact: true }).click();
    await expect(page).toHaveURL('/akun/reservasi');
  });

  test('cancels after confirming', async ({ page }) => {
    await login(page, CUSTOMER, `/akun/reservasi/${code}`);
    await expect(page).toHaveURL(new RegExp(`/akun/reservasi/${code}`), { timeout: 15_000 });
    await page.getByRole('button', { name: 'Batalkan reservasi' }).click();
    const dialog = page.getByRole('dialog', { name: 'Batalkan reservasi ini?' });
    await dialog.getByRole('button', { name: 'Ya, batalkan' }).click();
    await expect(page.getByText('Dibatalkan', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: `QR ${code}` })).toHaveCount(0);
    await page.goto('/akun/reservasi');
    const history = page.getByRole('region', { name: 'Riwayat' });
    await expect(history.getByRole('link', { name: new RegExp(code) })).toBeVisible();
  });

  test("another customer's code is a 404", async ({ page }) => {
    const otherCode = await reserveAs(OTHER, [R1], at('17.00'));
    await login(page, CUSTOMER);
    await expect(page).toHaveURL('/akun', { timeout: 15_000 });
    expect((await page.goto(`/akun/reservasi/${otherCode}`))?.status()).toBe(404);
    expect((await page.goto('/akun/reservasi/L2D-AAAAAAAA'))?.status()).toBe(404);
    expect((await page.goto('/akun/reservasi/bukan-kode'))?.status()).toBe(404);
  });

  test('guests are sent to login', async ({ page }) => {
    await page.goto('/akun/reservasi');
    await expect(page).toHaveURL('/masuk?next=%2Fakun%2Freservasi');
  });

  test('fits 360 px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await login(page, CUSTOMER, `/akun/reservasi/${code}`);
    await expect(page).toHaveURL(new RegExp(`/akun/reservasi/${code}`), { timeout: 15_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
  });

  test.afterAll(async () => {
    await clearReservations([CUSTOMER, OTHER]);
  });
});

test.describe('nomor WhatsApp', () => {
  const day = wibDateIn(5);

  test.beforeAll(async () => {
    await clearReservations([CUSTOMER]);
    await setWhatsapp(CUSTOMER, null);
  });

  test('asks for a number before the first reservation', async ({ page }) => {
    await login(page, CUSTOMER, `/reservasi/baru?varian=${F1}&tanggal=${day}&jam=14.00`);
    await expect(page).toHaveURL(/\/reservasi\/baru/, { timeout: 15_000 });
    const field = page.getByLabel('Nomor WhatsApp');
    await expect(field).toBeVisible();
    await expect(
      page.getByText('Dipakai toko kalau perlu ngabarin lu soal reservasi ini.'),
    ).toBeVisible();
    await field.fill('0812-abc');
    await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
    await expect(
      page.getByText('Nomor WhatsApp belum benar. Contoh: 0812-3456-7890'),
    ).toBeVisible();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await field.fill('0812 3450 0003');
    await page.getByRole('button', { name: 'Konfirmasi reservasi' }).click();
    await expect(page).toHaveURL(/\/akun\/reservasi\/L2D-[2-9A-HJKMNP-Z]{8}\?baru=1$/, {
      timeout: 15_000,
    });
    expect(await whatsappOf(CUSTOMER)).toBe(CUSTOMER_WA);
  });

  test('does not ask again once saved', async ({ page }) => {
    await login(page, CUSTOMER, `/reservasi/baru?varian=${F1}`);
    await expect(page).toHaveURL(/\/reservasi\/baru/, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Konfirmasi reservasi' })).toBeVisible();
    await expect(page.getByLabel('Nomor WhatsApp')).toHaveCount(0);
  });

  test.afterAll(async () => {
    await setWhatsapp(CUSTOMER, CUSTOMER_WA);
    await clearReservations([CUSTOMER]);
  });
});

test.describe('status dari toko', () => {
  const day = wibDateIn(6);

  test.beforeAll(async () => {
    await clearReservations([OTHER]);
  });

  test('shows a store cancellation with its reason and no QR', async ({ page }) => {
    const code = await reserveAs(OTHER, [R1], startsAtOn(day, '15.00'));
    await updateReservation(code, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: 'Unit sedang dibersihkan',
    });
    await login(page, OTHER, `/akun/reservasi/${code}`);
    await expect(page).toHaveURL(new RegExp(`/akun/reservasi/${code}`), { timeout: 15_000 });
    await expect(page.getByText('Dibatalkan toko', { exact: true })).toBeVisible();
    await expect(page.getByText('Alasan dari toko: Unit sedang dibersihkan')).toBeVisible();
    await expect(page.getByRole('img', { name: `QR ${code}` })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Unduh ke kalender (.ics)' })).toHaveCount(0);
    expect((await page.request.get(`/akun/reservasi/${code}/kalender`)).status()).toBe(404);
  });

  test('keeps a checked-in session in Mendatang with its QR', async ({ page }) => {
    const code = await reserveAs(OTHER, [F1], startsAtOn(day, '16.00'));
    await shiftReservation(code, minutesFromNow(-5));
    await updateReservation(code, { status: 'checked_in' });
    await login(page, OTHER, '/akun/reservasi');
    await expect(page).toHaveURL('/akun/reservasi', { timeout: 15_000 });
    const upcoming = page.getByRole('region', { name: 'Mendatang' });
    await expect(upcoming.getByRole('link', { name: new RegExp(code) })).toBeVisible();
    await page.goto(`/akun/reservasi/${code}`);
    await expect(page.getByText('Check-in', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: `QR ${code}` })).toBeVisible();
  });

  test.afterAll(async () => {
    await clearReservations([OTHER]);
  });
});
