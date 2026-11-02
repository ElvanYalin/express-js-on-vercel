// Renders every Phase 1 screen at several landscape device sizes and records console errors.
// Usage: node ramen-stories/tools/screenshots.mjs [baseUrl] [outDir]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:4173/ramen-stories/';
const out = process.argv[3] || 'ramen-stories/mockups';
const screens = (process.env.SCREENS || 'main,empty,upgraded,prep,upgrades,hire,customize,dialogue,results,menu,characters,assets').split(',');
const devices = (process.env.DEVICES || 'hd').split(',');
const SIZES = { hd: [1920, 1080, 1], phone: [844, 390, 3], phoneWide: [932, 430, 3], tablet: [1180, 820, 2], fourThree: [1024, 768, 2] };
const lang = process.env.LANG_CODE || 'tr';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
for (const d of devices) {
  const [w, h, dpr] = SIZES[d];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d === 'hd' ? 1 : Math.min(dpr, 2), hasTouch: d !== 'hd' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${d}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${d}] ${e.message}`));
  for (const s of screens) {
    await page.goto(`${base}?lang=${lang}#${s}`);
    await page.evaluate(() => sessionStorage.setItem('rs-board', '0'));
    await page.reload();
    await page.waitForTimeout(s === 'menu' ? 2600 : s === 'main' || s === 'prep' ? 4600 : 1400);
    await page.screenshot({ path: `${out}/${String(screens.indexOf(s) + 1).padStart(2, '0')}-${s}-${d}-${lang}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'No console errors.');
