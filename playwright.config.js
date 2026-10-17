import { defineConfig } from '@playwright/test';

// `npm run build && npm run preview` first, then `npm test`
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
});
