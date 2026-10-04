import { test, expect } from '@playwright/test';

test.describe('Command Palette tests', () => {
  // Test both Day and Night modes (if there's a button we can click, or just test default mode thoroughly)
  test('Palette item click interaction', async ({ page }) => {
    // Navigate to the production preview
    await page.goto('http://localhost:4173');

    // Make sure the page is loaded
    await page.waitForSelector('h1#hero-name');

    // 1. Open palette via keyboard shortcut
    await page.keyboard.press('Control+K');
    const overlay = page.locator('#palette-overlay');
    await expect(overlay).toHaveClass(/open/);

    // 2. Click "Go to Projects" (using human-like mouse events)
    // Find the item
    const projectsItem = page.locator('.palette-item', { hasText: 'Go to Projects' });
    await expect(projectsItem).toBeVisible();
    
    const box = await projectsItem.boundingBox();
    if (box) {
      // Hover
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(100);
      
      // Mousedown, small jitter, mouseup (human click)
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2 + 1);
      await page.waitForTimeout(120);
      await page.mouse.up();
    }

    // Wait for palette to close
    await expect(overlay).not.toHaveClass(/open/);

    // Verify it scrolled to #projects
    // We can check if window.scrollY is roughly matching the projects section
    await page.waitForFunction(() => window.scrollY > 500);

    // 3. Open palette again and test another command
    await page.keyboard.press('Control+K');
    await expect(overlay).toHaveClass(/open/);

    const nightModeItem = page.locator('.palette-item', { hasText: 'Toggle Night Mode' });
    await expect(nightModeItem).toBeVisible();
    const nmBox = await nightModeItem.boundingBox();
    if (nmBox) {
      await page.mouse.move(nmBox.x + nmBox.width / 2, nmBox.y + nmBox.height / 2);
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(120);
      await page.mouse.up();
    }

    // Verify night mode class on body
    await expect(overlay).not.toHaveClass(/open/);
    await expect(page.locator('body')).toHaveClass(/night/);
  });
});
