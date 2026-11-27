import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';
import { login } from './data';

// Kamera palsu Chromium yang memutar video berisi QR kode reservasi, supaya jalur baca QR
// (jsQR di Chromium desktop, karena BarcodeDetector tidak ada di Windows) benar-benar diuji.
// Kodenya tidak perlu ada di database: yang diuji adalah QR terbaca lalu detailnya dibuka.

const CODE = 'L2D-SCAN2345';
const W = 640;
const H = 480;

/** Berkas Y4M (YUV 4:2:0) berisi QR hitam di atas putih, beberapa bingkai yang sama. */
function qrVideo(text: string): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const scale = Math.floor(Math.min(W, H) / (size + 8));
  const left = Math.floor((W - size * scale) / 2);
  const top = Math.floor((H - size * scale) / 2);
  const luma = Buffer.alloc(W * H, 235);
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!qr.modules.get(r, c)) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        const row = (top + r * scale + dy) * W;
        luma.fill(16, row + left + c * scale, row + left + (c + 1) * scale);
      }
    }
  }
  const chroma = Buffer.alloc((W / 2) * (H / 2), 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma, chroma]);
  const file = join(mkdtempSync(join(tmpdir(), 'l2-qr-')), 'qr.y4m');
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`),
      frame,
      frame,
      frame,
    ]),
  );
  return file;
}

test.use({
  permissions: ['camera'],
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${qrVideo(CODE)}`,
    ],
  },
});

test('reads a reservation QR from the camera and opens it', async ({ page }) => {
  await login(page, 'operator1@lantaidua.test');
  await expect(page).toHaveURL('/operator', { timeout: 15_000 });
  await page.getByRole('button', { name: 'Scan kamera' }).click();
  await expect(page).toHaveURL(`/operator/reservasi/${CODE}`, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Kode reservasi tidak ditemukan' })).toBeVisible();
});
