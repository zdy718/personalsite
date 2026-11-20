// Captures fresh screenshots of the live projects into src/assets/work.
// Usage: npm run shots   (uses the locally installed Google Chrome)
import { chromium } from '@playwright/test';

const OUT = new URL('../src/assets/work/', import.meta.url).pathname;
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

async function universeMap() {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto('https://www.universemap.org/?object=Betelgeuse', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: OUT + 'universe-map.png' });
  await page.close();
}

async function stuntDouble() {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('https://stuntdouble-kappa.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + 'stunt-double-title.png' });
  // Roll camera, then advance through any menus/cards into gameplay.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(Number(process.env.SD_WAIT ?? 2600));
  await page.screenshot({ path: OUT + 'stunt-double.png' });
  await page.close();
}

await universeMap();
await stuntDouble();
await browser.close();
console.log('Saved screenshots to', OUT);
