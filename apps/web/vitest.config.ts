import { defineConfig } from 'vitest/config';

// Unit test saja. Tes end-to-end di folder e2e/ dijalankan Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
