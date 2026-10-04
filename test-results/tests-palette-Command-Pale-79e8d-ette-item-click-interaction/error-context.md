# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\palette.spec.js >> Command Palette tests >> Palette item click interaction
- Location: tests\palette.spec.js:5:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('body')
Expected pattern: /night/
Received string:  "no-webgl"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" locator('body') with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body class="no-webgl">…</body>
       - unexpected value "no-webgl"

```

```yaml
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - link "Kuldeep Singh — home":
    - /url: "#hero"
    - text: Kuldeep Singh
  - navigation "Main navigation"
  - button "Toggle night mode": Day
  - button "Toggle 3D scene" [pressed]: 3D On
  - button "Open command palette": Ctrl K
- text: 08/08
- main:
  - region "Kuldeep Singh"
  - region "Professional Summary"
  - region "Technical Skills"
  - region "Interactive 3D model. Drag to rotate."
  - region "AI Projects"
  - region "Experience"
  - region "Education"
  - region "Kuldeep Singh"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Command Palette tests', () => {
  4  |   // Test both Day and Night modes (if there's a button we can click, or just test default mode thoroughly)
  5  |   test('Palette item click interaction', async ({ page }) => {
  6  |     // Navigate to the production preview
  7  |     await page.goto('http://localhost:4173');
  8  | 
  9  |     // Make sure the page is loaded
  10 |     await page.waitForSelector('h1#hero-name');
  11 | 
  12 |     // 1. Open palette via keyboard shortcut
  13 |     await page.keyboard.press('Control+K');
  14 |     const overlay = page.locator('#palette-overlay');
  15 |     await expect(overlay).toHaveClass(/open/);
  16 | 
  17 |     // 2. Click "Go to Projects" (using human-like mouse events)
  18 |     // Find the item
  19 |     const projectsItem = page.locator('.palette-item', { hasText: 'Go to Projects' });
  20 |     await expect(projectsItem).toBeVisible();
  21 |     
  22 |     const box = await projectsItem.boundingBox();
  23 |     if (box) {
  24 |       // Hover
  25 |       await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  26 |       await page.waitForTimeout(100);
  27 |       
  28 |       // Mousedown, small jitter, mouseup (human click)
  29 |       await page.mouse.down();
  30 |       await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2 + 1);
  31 |       await page.waitForTimeout(120);
  32 |       await page.mouse.up();
  33 |     }
  34 | 
  35 |     // Wait for palette to close
  36 |     await expect(overlay).not.toHaveClass(/open/);
  37 | 
  38 |     // Verify it scrolled to #projects
  39 |     // We can check if window.scrollY is roughly matching the projects section
  40 |     await page.waitForFunction(() => window.scrollY > 500);
  41 | 
  42 |     // 3. Open palette again and test another command
  43 |     await page.keyboard.press('Control+K');
  44 |     await expect(overlay).toHaveClass(/open/);
  45 | 
  46 |     const nightModeItem = page.locator('.palette-item', { hasText: 'Toggle Night Mode' });
  47 |     await expect(nightModeItem).toBeVisible();
  48 |     const nmBox = await nightModeItem.boundingBox();
  49 |     if (nmBox) {
  50 |       await page.mouse.move(nmBox.x + nmBox.width / 2, nmBox.y + nmBox.height / 2);
  51 |       await page.waitForTimeout(100);
  52 |       await page.mouse.down();
  53 |       await page.waitForTimeout(120);
  54 |       await page.mouse.up();
  55 |     }
  56 | 
  57 |     // Verify night mode class on body
  58 |     await expect(overlay).not.toHaveClass(/open/);
> 59 |     await expect(page.locator('body')).toHaveClass(/night/);
     |                                        ^ Error: expect(locator).toHaveClass(expected) failed
  60 |   });
  61 | });
  62 | 
```