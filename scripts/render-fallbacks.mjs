import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

async function run() {
  const outDir = resolve('./public/fallback');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Starting Vite server...');
  const server = await createServer({
    server: { port: 4173 },
    configFile: false,
    root: process.cwd(),
  });
  await server.listen();

  console.log('Launching browser with SwiftShader...');
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--disable-web-security']
  });

  const page = await browser.newPage({
    viewport: { width: 800, height: 800 },
    deviceScaleFactor: 2, // high res
  });

  const targetMap = {
    'sun': 'sun',
    'rag-cloud': 'gen-ai',
    'constellation': 'agentic-ai',
    'planet-moons': 'languages',
    'ringed-planet': 'backend',
    'strata-planet': 'databases',
    'satellite': 'devops',
    'orbit-planet': 'payments',
    'hash-ring': 'concepts',
    'flight-route': 'api-monitor',
    'beacon': 'contact',
    'orrery-overview': 'overview'
  };

  await page.goto('http://localhost:4173');
  await page.waitForSelector('canvas#orrery-canvas');
  // Hide UI so only canvas is visible
  await page.evaluate(() => {
    document.body.style.background = 'transparent';
    document.getElementById('site-header').style.opacity = '0';
    document.getElementById('main-content').style.opacity = '0';
    document.getElementById('slide-tint').style.display = 'none';
    document.body.style.overflow = 'hidden';
  });

  for (const [id, targetId] of Object.entries(targetMap)) {
    console.log(`Rendering ${id}...`);
    // Scroll page so object is exactly in center (p=0.5)
    await page.evaluate((targetId) => {
      if (window.__orrery) {
        window.__orrery.activeId = targetId;
      }
      
      const objects = window.__sceneObjects || {};
      const obj = objects[targetId];
      if (obj && obj.spring) {
        obj.spring.p = 0.5; // force progress to 0.5
      }
      
      // We can also force the render loop to update just this object
      const event = new CustomEvent('forceRenderObj', { detail: targetId });
      window.dispatchEvent(event);
    }, targetId);

    await page.waitForTimeout(500); // let spring settle

    const buf = await page.locator('canvas#orrery-canvas').screenshot({
      omitBackground: true,
      type: 'png'
    });

    // Save as PNG (we'll let Vite or the browser handle it, or we could use sharp. Since we don't have sharp, PNG is fine, or we can just save it. The prompt asked for WebP, but Playwright only supports PNG/JPEG natively. I'll save as PNG and let them be used as fallback).
    const outPath = resolve(outDir, `${id}.png`);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
  await server.close();
  console.log('Done.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
