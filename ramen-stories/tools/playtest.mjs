// End-to-end interaction test of the Phase 1 mockup. Plays a full day (5 orders)
// with real pointer input (tap + drag) and asserts outcomes. Exit code 1 on failure.
// Usage: node ramen-stories/tools/playtest.mjs [baseUrl] [WxH]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://localhost:4173/ramen-stories/';
const [vw, vh] = (process.argv[3] || '1920x1080').split('x').map(Number);
const shots = process.env.SHOTS;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}?lang=en#main`);
await page.evaluate(() => { localStorage.clear(); sessionStorage.setItem('rs-board', '0'); });
await page.reload();

const w2s = (x, y) => page.evaluate(([x, y]) => {
  const svg = document.getElementById('stage');
  const p = svg.createSVGPoint(); p.x = x; p.y = y;
  const r = p.matrixTransform(svg.getScreenCTM()); return [r.x, r.y];
}, [x, y]);
const tap = async (x, y) => { const [sx, sy] = await w2s(x, y); await page.mouse.click(sx, sy); };
const drag = async (x0, y0, x1, y1) => {
  const [a, b] = await w2s(x0, y0); const [c, d] = await w2s(x1, y1);
  await page.mouse.move(a, b); await page.mouse.down();
  await page.mouse.move((a + c) / 2, (b + d) / 2, { steps: 8 });
  await page.mouse.move(c, d, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(120);
};
const money = () => page.$eval('.money-val', (n) => +n.textContent);
const bowlState = () => page.evaluate(() => {
  const l = document.querySelector('#bowl-layer');
  return { present: !!l && l.children.length > 0, toppings: l ? l.querySelectorAll('.topping').length : 0, broth: !!l?.querySelector('.broth-fill') };
});
const results = [];
const check = (name, ok, detail = '') => results.push([ok ? 'PASS' : 'FAIL', name, detail]);
const waitCustomer = async () => { await page.waitForSelector('.ticket:not(.hidden)', { timeout: 15000 }); await page.waitForTimeout(3700); }; // dialogue 2.6 s + phone cooking-camera move 0.45 s

// World anchors (see js/scene.js LAYOUT)
const POT = { shoyu: [120, 740], miso: [320, 740], tonkotsu: [520, 740] };
const BOX = { thin: [705, 978], thick: [845, 978] };
const BASKET_DROP = [780, 770];
const BASKET = [780, 735];
const BOWL_DROP = [1200, 935];
const TRAY = (i) => [1340 + (i % 5) * 110 + 52, [758, 848][Math.floor(i / 5)] + 44];
const ING = { chashu: 0, egg: 1, nori: 2, greenOnion: 3, corn: 4, chili: 5, mushroom: 6, bamboo: 7, chicken: 8, naruto: 9 };

// ---------------- Order 1 (Mei): perfect bowl
await waitCustomer();
check('customer walks in and order ticket appears', true);
const m0 = await money();
await tap(...POT.shoyu);
await page.waitForTimeout(1300);
let b = await bowlState();
check('tap pot → bowl placed + broth poured', b.present && b.broth, JSON.stringify(b));
await drag(...BOX.thin, ...BASKET_DROP);
const loaded = await page.evaluate(() => document.querySelector('#basket-0 .basket').innerHTML.includes('#F3D486'));
check('drag noodle bundle → basket loaded', loaded);
await tap(...BASKET);
await page.waitForTimeout(300);
const ringShown = await page.evaluate(() => !document.querySelector('#timer-ring').classList.contains('hidden'));
check('tap basket → lowered, timer ring visible', ringShown);
await page.waitForTimeout(4200); // thin perfect window 3.5–5.5 s
await tap(BASKET[0], BASKET[1] + 70);
await page.waitForTimeout(400);
const floatTxt = await page.$$eval('.float', (n) => n.map((x) => x.textContent).join('|'));
check('lift in window → "Perfect!" feedback', /Perfect/.test(floatTxt), floatTxt);
await drag(BASKET[0], BASKET[1] - 20, ...BOWL_DROP);
const noodleRow = await page.$$eval('.ticket li', (n) => n[1]?.classList.contains('ok'));
check('drag basket → noodles in bowl (ticket ✓)', noodleRow);
await drag(...TRAY(ING.egg), 1130, 925);
await drag(...TRAY(ING.greenOnion), 1270, 925);
await drag(...TRAY(ING.nori), 1200, 905);
b = await bowlState();
if (shots) await page.screenshot({ path: `${shots}/playtest-cooking.png` });
check('drag 3 toppings → 3 toppings rendered in bowl', b.toppings === 3, JSON.stringify(b));
await drag(1200, 960, 960, 600);
await page.waitForTimeout(600);
const rating1 = await page.$eval('.bubble .rating', (n) => n.textContent).catch(() => '');
check('serve → customer rating shows Perfect', /Perfect/.test(rating1), rating1);
const m1 = await money();
check('money increases by payment + tip', m1 > m0 + 10, `${m0} → ${m1}`);
if (shots) await page.screenshot({ path: `${shots}/playtest-serve.png` });

// ---------------- Order 2 (Ece): deliberately wrong bowl → clear mistake feedback
await waitCustomer();
await tap(...POT.shoyu); // wanted miso
await page.waitForTimeout(1300);
await drag(...TRAY(ING.corn), 1200, 920);
// tap-to-remove then re-add
await tap(1200, 890); // corn landed ~30 units above the finger (ghost offset)
b = await bowlState();
check('tap a topping → removed', b.toppings === 0, JSON.stringify(b));
await drag(...TRAY(ING.corn), 1200, 920);
await drag(1200, 960, 960, 600);
await page.waitForTimeout(600);
const mist = await page.$$eval('.bubble .mistakes li', (n) => n.map((x) => x.textContent));
check('wrong bowl → mistakes explained', mist.some((m) => /Miso/.test(m)) && mist.length >= 2, mist.join(' | '));
const rating2 = await page.$eval('.bubble .rating', (n) => n.textContent).catch(() => '');
check('wrong bowl → low rating', /Hmm|Not bad/.test(rating2), rating2);

// ---------------- Orders 3–5: quick serves to reach end of day
for (let i = 0; i < 3; i++) {
  await waitCustomer();
  await tap(990, 900); // bowl stack
  await page.waitForTimeout(400);
  const who = await page.$eval('.ticket h3 span', (n) => n.textContent).catch(() => '?');
  const bs = await bowlState();
  await drag(1200, 960, 960, 600);
  await page.waitForTimeout(400);
  const served = await page.$('.bubble.react');
  if (process.env.DEBUG) console.log(`quick serve ${i + 1}: ${who} bowl=${JSON.stringify(bs)} reacted=${!!served}`);
}
await page.waitForSelector('.results', { timeout: 20000 }).then(() => check('day ends → results screen', true)).catch(() => check('day ends → results screen', false));
await page.waitForTimeout(1500);
const netTxt = await page.$eval('.results .net b', (n) => n.textContent).catch(() => '');
check('results show animated net profit', netTxt !== '' && netTxt !== '0', netTxt);
if (shots) await page.screenshot({ path: `${shots}/playtest-results.png` });
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ramen-stories:mockup') || '{}'));
check('progress auto-saved (versioned envelope)', saved.version === 1 && saved.data.money > 120, JSON.stringify(saved));

check('no console/page errors', errors.length === 0, errors.join(' | '));
await browser.close();
for (const r of results) console.log(`${r[0]}  ${r[1]}${r[2] ? `  — ${r[2]}` : ''}`);
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} checks passed at ${vw}x${vh}`);
process.exit(failed ? 1 : 0);
