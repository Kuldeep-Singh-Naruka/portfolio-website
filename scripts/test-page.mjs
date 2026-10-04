import fs from 'fs';
import { createServer } from 'vite';
import { chromium } from 'playwright';

async function testScene() {
  const server = await createServer({
    server: { port: 4173 },
    configFile: false,
    root: process.cwd(),
  });
  await server.listen();

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:4173');
  await page.waitForTimeout(2000);
  
  await browser.close();
  await server.close();
}

testScene().catch(console.error);
