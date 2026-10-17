// ─── scripts/render-stills.mjs ───────────────────────────────────────────────
// Renders every 3D body from the real scene into public/stills/*.webp so the
// "3D Off" mode shows the exact same objects (transparent WebP, one set per theme).
//
//   npm run stills            # all bodies, both themes
//   npm run stills -- sun moon
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const BODIES = ['sun', 'moon', 'jupiter', 'saturn', 'mercury', 'earth', 'mars', 'uranus', 'neptune', 'belt',
  'orrery', 'supernova', 'station', 'probe', 'telescope', 'comet', 'nebula', 'blackhole'];
// scroll progress to freeze each body at
const P = { supernova: 0.66, comet: 0.75, orrery: 0.35 };
const OUT = resolve('public/stills');
const SIZE = 640;

const only = process.argv.slice(2);
const list = only.length ? BODIES.filter(b => only.includes(b)) : BODIES;
mkdirSync(OUT, { recursive: true });

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
page.on('pageerror', e => console.error('page error:', e.message));

for (const id of list) {
  for (const theme of ['dark', 'light']) {
    await page.goto(`http://localhost:5199/?still=${id}&theme=${theme}&p=${P[id] ?? 0.5}`);
    await page.waitForFunction(() => window.__stillReady === true, null, { timeout: 120000 });
    const data = await page.evaluate((size) => {
      const src = document.getElementById('space-canvas');
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, size, size);
      return c.toDataURL('image/webp', 0.84);
    }, SIZE);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    writeFileSync(`${OUT}/${id}-${theme}.webp`, buf);
    console.log(`✓ ${id}-${theme}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

await browser.close();
await server.close();
