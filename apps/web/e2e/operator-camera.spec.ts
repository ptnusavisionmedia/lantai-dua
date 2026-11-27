import { expect, test } from '@playwright/test';
import { login } from './data';

// Kamera palsu bawaan Chromium. Opsi peluncuran browser harus di tingkat file, jadi tes ini
// terpisah dari operator.spec.ts. Tes ini tidak membuat reservasi.
test.use({
  permissions: ['camera'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

test('opens the camera dialog with a fake camera', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test');
  await expect(page).toHaveURL('/operator', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Scan kamera' }).click();
  const dialog = page.getByRole('dialog', { name: 'Scan QR reservasi' });
  await expect(dialog.getByText('Arahkan kamera ke QR reservasi')).toBeVisible();
  await expect(dialog.locator('video')).toBeVisible();
  await expect(dialog.getByText('Kamera tidak bisa dipakai. Ketik kodenya saja.')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Tutup' }).click();
  await expect(dialog).toBeHidden();
});
