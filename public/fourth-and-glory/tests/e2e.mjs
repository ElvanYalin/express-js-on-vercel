// Gerçek Chromium üzerinde UI zamanlama/durum hatalarının (B1–B7) regresyon testi.
// Çalıştırma: node tests/e2e.mjs   (playwright paketi global ya da yerel kurulu olmalı)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let chromium;
for (const base of [root + '/', '/opt/node22/lib/node_modules/', process.env.NODE_PATH ? process.env.NODE_PATH + '/' : null].filter(Boolean)) {
  try { ({ chromium } = createRequire(base)('playwright')); break; } catch {}
}
if (!chromium) { console.log('SKIP e2e: playwright bulunamadı'); process.exit(0); }

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const url = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
const results = [];
async function scenario(name, fn) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  // WebGL bağlam sayacı (B7)
  await page.addInitScript(() => { const seen = new Set(); const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/.test(t)) seen.add(this); window.__glContexts = seen.size; return orig.call(this, t, ...a); }; });
  await page.goto(url); await page.waitForTimeout(300);
  await page.click('#crStart'); await page.waitForTimeout(350);
  try { await fn(page); results.push('PASS ' + name); } catch (e) { results.push('FAIL ' + name + ': ' + e.message); }
  await page.close();
}
const shown = (page, id) => page.evaluate(i => document.getElementById(i).classList.contains('show'), id);
const active = (page, id) => page.evaluate(i => document.getElementById(i).classList.contains('active'), id);

await scenario('B10 karakter sekmeleri telefon boyutunda tıklanabilir (grid satırı ezilmesi)', async page => {
  await page.evaluate(() => FG_UI.openCreator(true)); await page.waitForTimeout(300);
  for (const t of ['look', 'body', 'id']) { await page.click(`#crTabs [data-tab="${t}"]`, { timeout: 3000 }); assert.equal(await page.evaluate(x => document.querySelector(`.tab-body[data-body="${x}"]`).hidden, t), false); }
});

await scenario('B1 seviye sonu + hızlı çıkış: harita üstünde kart yok, ödül bir kez', async page => {
  await page.click('#playBtn'); await page.waitForTimeout(350); await page.click('#introStart');
  const cash0 = await page.evaluate(() => FG_STATE.get().cash);
  await page.evaluate(() => FG_GAME.hooks.levelEnd({ success: true, stars: 3, stats: { attempts: 4, completions: 4, yards: 40 }, perfects: 0, scores: [] }));
  assert.equal(await page.isDisabled('#pauseBtn'), true, 'son 450 ms duraklatma kapalı olmalı');
  await page.evaluate(() => FG_UI.openMap());
  await page.waitForTimeout(700);
  assert.equal(await shown(page, 'endOverlay'), false);
  assert.equal(await active(page, 'mapScreen'), true);
  const st = await page.evaluate(() => ({ stars: FG_STATE.stars(1), cash: FG_STATE.get().cash, unlocked: FG_STATE.get().unlocked }));
  assert.equal(st.stars, 3); assert.equal(st.unlocked, 2); assert(st.cash > cash0);
});

await scenario('B2/B3 kariyer kapısı oyun ekranından çağrılınca haritada açılır; × haritada bırakır', async page => {
  await page.click('#playBtn'); await page.waitForTimeout(350); await page.click('#introStart');
  await page.evaluate(() => { FG_STATE.finishLevel(FG_DATA.levels[0], 3); FG_UI.openIntro(FG_DATA.levels[1]); });
  await page.waitForTimeout(350);
  assert.equal(await active(page, 'mapScreen'), true); assert.equal(await shown(page, 'careerOverlay'), true);
  await page.click('#careerClose'); await page.waitForTimeout(300);
  assert.equal(await active(page, 'mapScreen'), true); assert.equal(await shown(page, 'careerOverlay'), false);
  assert.equal(await page.evaluate(() => FG_UISTATE.get().stack.length), 0);
});

await scenario('B4 düğüme çift dokunuş seviyeyi bir kez başlatır', async page => {
  await page.evaluate(() => { window.__starts = 0; const f = FG_GAME.startLevel; FG_GAME.startLevel = l => { window.__starts++; return f(l); }; });
  await page.dblclick('.node[data-level="1"]'); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__starts), 1);
});

await scenario('B5 snap sonrası PAS AT düğmesi hemen görünür', async page => {
  await page.click('#playBtn'); await page.waitForTimeout(350); await page.click('#introStart'); await page.waitForTimeout(100);
  await page.click('#snapAction'); await page.waitForTimeout(60);
  assert.equal(await page.isVisible('#passAction'), true); assert.equal(await page.isVisible('#movePad'), true);
});

await scenario('B6 aynı anda tek etkileşimli katman; alttakiler inert', async page => {
  await page.click('#packsBtn'); await page.waitForTimeout(250);
  await page.evaluate(() => FG_UI.openPlayer()); await page.waitForTimeout(250);
  const inert = await page.evaluate(() => [document.getElementById('packsOverlay').inert, document.getElementById('playerOverlay').inert]);
  assert.deepEqual(inert, [true, false]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  assert.equal(await shown(page, 'playerOverlay'), false); assert.equal(await page.evaluate(() => document.getElementById('packsOverlay').inert), false);
});

await scenario('B7 en fazla 2 WebGL bağlamı (oyun + tüm önizlemeler)', async page => {
  await page.evaluate(() => FG_UI.openPlayer()); await page.waitForTimeout(300);
  await page.evaluate(() => FG_UI.openLocker()); await page.waitForTimeout(300);
  await page.evaluate(() => FG_UI.openCreator(true)); await page.waitForTimeout(300);
  await page.evaluate(() => { FG_UI.openMap(); FG_UI.openIntro(FG_DATA.levels[0]); }); await page.waitForTimeout(400);
  assert(await page.evaluate(() => window.__glContexts) <= 2, 'bağlam sayısı: ' + await page.evaluate(() => window.__glContexts));
});

await browser.close(); server.close();
console.log(results.join('\n'));
if (errors.length) console.log('Sayfa hataları:\n' + errors.join('\n'));
assert(results.every(r => r.startsWith('PASS')) && !errors.length, 'E2E başarısız');
console.log('PASS e2e: B1–B7 gerçek Chromium üzerinde.');
