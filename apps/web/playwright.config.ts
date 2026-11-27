import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export default defineConfig({
  testDir: './e2e',
  workers: 2,
  // Dev server yang baru menyala mengompilasi setiap halaman dan Server Action saat pertama dipakai,
  // jadi pemeriksaan pertama di halaman baru bisa lebih dari 5 detik.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
