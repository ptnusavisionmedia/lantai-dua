import { expect, test } from '@playwright/test';
import { clearReservations, reserveAs, startsAtOn, wibDateIn } from './admin';
import { fillLogin, login, product, variantLabelOf } from './data';

// Satu file, berurutan: tes reservasi memakai akun dan unit yang sama, jadi tidak boleh paralel.
test.describe.configure({ mode: 'serial' });

const CUSTOMER = 'pelanggan3@lantaidua.test';
const OTHER = 'pelanggan2@lantaidua.test';
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
