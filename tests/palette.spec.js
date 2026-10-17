import { test, expect } from '@playwright/test';

// Run against `npm run preview` (http://localhost:4173)
const URL = process.env.SITE_URL || 'http://localhost:4173';

test.describe('Command palette + display settings', () => {
  test('palette navigates and switches theme / 3D', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return; // keep what the test sets across reloads
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('space-settings', JSON.stringify({ theme: 'light' }));
    });
    await page.goto(URL);
    await page.waitForSelector('h1#hero-name');
    const html = page.locator('html');
    const overlay = page.locator('#palette-overlay');

    await expect(html).not.toHaveClass(/night/);

    // Navigate
    await page.keyboard.press('Control+K');
    await expect(overlay).toHaveClass(/open/);
    await page.locator('.palette-item', { hasText: 'Go to Projects' }).click();
    await expect(overlay).not.toHaveClass(/open/);
    await page.waitForFunction(() => window.scrollY > 500);

    // Theme
    await page.keyboard.press('Control+K');
    await page.locator('.palette-item', { hasText: 'Theme: Dark' }).click();
    await expect(html).toHaveClass(/night/);

    // 3D off → stills mode
    await page.keyboard.press('Control+K');
    await page.locator('.palette-item', { hasText: '3D: Off' }).click();
    await expect(html).toHaveClass(/three-off/);

    // Persisted
    await page.reload();
    await expect(html).toHaveClass(/night/);
    await expect(html).toHaveClass(/three-off/);
  });

  test('settings popover toggles', async ({ page }) => {
    await page.goto(URL);
    await page.click('#settings-open');
    await expect(page.locator('#settings-panel')).toBeVisible();
    await page.click('[data-set="theme"][data-val="light"]');
    await expect(page.locator('html')).not.toHaveClass(/night/);
    await page.click('[data-set="motion"][data-val="reduced"]');
    await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settings-panel')).toBeHidden();
  });
});
