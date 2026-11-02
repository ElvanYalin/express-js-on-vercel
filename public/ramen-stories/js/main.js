// Ramen Stories — Phase 1 design mockup entry: screen router + UI builders.
import { PALETTE as P, CUSTOMERS, EMPLOYEES, PLAYER_CHEF, UPGRADES, ORDERS, BROTHS } from './data.js';
import { ASSETS, INGREDIENT_ART, icon, resetUid } from './assets.js';
import { drawCharacter, EXPRESSIONS, VIEWS } from './characters.js';
import { composeScene, viewBoxFor, LAYOUT } from './scene.js';
import { KitchenGame, toScreen } from './game.js';
import { t, setLang, getLang } from './i18n.js';
import { sfx } from './audio.js';
import { load, save, reset } from './save.js';

const svg = document.getElementById('stage');
const ui = document.getElementById('ui');
const app = document.getElementById('app');

export const SCREENS = ['main', 'empty', 'upgraded', 'prep', 'upgrades', 'hire', 'customize', 'dialogue', 'results', 'menu'];
const EXTRA = ['characters', 'assets'];

let game = null;
let current = null;
let focus = 'full';
let lastDay = null;

// ------------------------------------------------------------------ stage
function setStage(markup, f = 'full') {
  focus = f;
  svg.innerHTML = markup;
  fitStage();
}
function fitStage() {
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  svg.setAttribute('viewBox', viewBoxFor(a, focus).join(' '));
}
// Smooth camera move between framings (used by the phone cooking camera).
function animateFocus(next, ms = 450) {
  if (next === focus) return Promise.resolve();
  const a = window.innerWidth / Math.max(1, window.innerHeight);
  const from = viewBoxFor(a, focus), to = viewBoxFor(a, next);
  focus = next;
  // While the cooking camera is active the nav slides away so it never covers kitchen equipment.
  ui.classList.toggle('cooking', next === 'kitchen');
  const reduce = document.body.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { fitStage(); return Promise.resolve(); }
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      svg.setAttribute('viewBox', from.map((v, i) => v + (to[i] - v) * e).join(' '));
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
window.addEventListener('resize', () => { fitStage(); game?.repositionBubble?.(); });

// ------------------------------------------------------------------ UI builders
const fmtClock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function hudHTML(st) {
  return `<div class="hud">
    <div>
      <div class="pill" aria-label="${t('hud.day', { day: st.day })}">${icon('clock')}<span><small>${t('hud.day', { day: st.day })}</small><span class="clock">${fmtClock(st.clock ?? 660)}</span></span></div>
      <div class="pill" aria-label="${t('hud.satisfaction')}">${icon('satisfaction')}<span><small>${t('hud.satisfaction')}</small><span class="sat-bar"><i style="width:${st.satisfaction}%"></i></span></span></div>
    </div>
    <div>
      <div class="pill money">${icon('coin')}<span class="money-val">${st.money}</span></div>
      <button class="round-btn" aria-label="${t('hud.pause')}">${icon('pause')}</button>
      <button class="round-btn" aria-label="${t('hud.settings')}" data-go="menu">${icon('settings')}</button>
    </div></div>`;
}
function updateHud(st, bump) {
  const m = ui.querySelector('.money-val');
  if (m) { m.textContent = st.money; if (bump) { const p = m.parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }
  const c = ui.querySelector('.clock'); if (c) c.textContent = fmtClock(st.clock);
  const s = ui.querySelector('.sat-bar i'); if (s) s.style.width = `${st.satisfaction}%`;
}
const NAV = [['shop', 'shop'], ['upgrades', 'upgrades', 'upgrades'], ['employees', 'employees', 'hire'], ['recipes', 'recipes'],
  ['tasks', 'tasks'], ['events', 'events'], ['customize', 'customize', 'customize'], ['achievements', 'achievements']];
function navHTML(active) {
  return `<nav class="nav collapsed" aria-label="Menu">${NAV.map(([k, ic, go], i) =>
    `<button class="nav-btn ${i >= 4 ? 'extra' : ''}" ${go ? `data-go="${go}"` : 'data-soon="1"'} aria-current="${go === active}">
      <span class="ico">${icon(ic)}${k === 'tasks' ? '<i class="dot"></i>' : ''}</span><span>${t(`nav.${k}`)}</span></button>`).join('')}
    <button class="nav-btn nav-more" data-more="1"><span class="ico">${icon('more')}</span><span>${t('nav.more')}</span></button></nav>`;
}
const FLOW = [['broth', 'flowBroth'], ['noodles', 'flowNoodles'], ['bowl', 'flowBowl'], ['toppings', 'flowToppings'], ['serve', 'flowServe']];
function flowHTML() {
  return `<div class="flow" role="list">${FLOW.map(([k, ic], i) => `${i ? '<i class="flow-sep"></i>' : ''}<div class="flow-step" role="listitem" data-step="${k}">${icon(ic)}<span>${t(`flow.${k}`)}</span></div>`).join('')}</div>
    <div class="hint" style="opacity:0"></div>`;
}
function ticketHTML() {
  return `<aside class="ticket hidden" aria-live="polite"><h3><span>${t('order.title')}</span><button class="tog" aria-label="${t('order.reopen')}">▾</button></h3><ul></ul></aside>`;
}
function toast(text) {
  const d = document.createElement('div');
  d.className = 'hint'; d.style.opacity = 1; d.style.top = '40%'; d.textContent = text;
  ui.appendChild(d); setTimeout(() => d.remove(), 1600);
}

// ------------------------------------------------------------------ screens
function stopGame() { game?.destroy(); game = null; ui.classList.remove('cooking'); }

function mountGameplay({ variant = 'main', f = 'full', bubble = true } = {}) {
  resetUid();
  const saved = load();
  setStage(composeScene(variant, { deco: saved.deco, levels: saved.levels }), f);
  ui.innerHTML = navHTML('main') + flowHTML() + ticketHTML();
  game = new KitchenGame(svg, ui, {
    showBubble: bubble,
    // Phones: zoom to the kitchen while cooking so trays stay >= 44px touch targets.
    cameraFocus: f === 'full' && window.innerHeight < 520 ? animateFocus : null,
    onHud: (st, bump) => updateHud(st, bump),
    onDayEnd: (stats) => { lastDay = stats; go('results'); },
  });
  ui.insertAdjacentHTML('afterbegin', hudHTML({ ...game.state }));
  game.start();
}

function staticScene(variant, opts = {}) {
  resetUid();
  setStage(composeScene(variant, opts));
}

const renderers = {
  main() { mountGameplay(); },
  prep() {
    mountGameplay({ f: 'kitchen', bubble: false });
    // Annotated interaction order (design spec overlay): 1 pot → 2 noodles → 3 basket → 4 toppings → 5 serve
    const marks = [[320, 600, 'tap'], [705, 905, 'drag'], [880, 690, 'tap'], [1610, 730, 'drag'], [1110, 560, 'drag']];
    const fx = svg.querySelector('#fx-layer');
    fx.insertAdjacentHTML('beforeend', `<g class="markers" pointer-events="none">${marks.map(([x, y, kind], i) => `<g class="marker" transform="translate(${x} ${y})">
      <circle class="ring" r="44" fill="none" stroke="${P.gold}" stroke-width="6" stroke-dasharray="14 10"/>
      <circle r="28" fill="${kind === 'tap' ? P.red : P.tealDeep}" stroke="${P.ink}" stroke-width="5"/>
      <text y="11" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="34" fill="${P.cream}">${i + 1}</text></g>`).join('')}
      <path d="M1180 830 C 1150 700, 1120 640, 1060 600" fill="none" stroke="${P.gold}" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/></g>`);
    setTimeout(() => fx.querySelector('.markers')?.remove(), 9000);
  },

  empty() {
    staticScene('empty');
    ui.innerHTML = hudHTML({ day: 1, clock: 9 * 60, satisfaction: 50, money: 120 }) + navHTML()
      + `<aside class="ticket" style="width:calc(var(--u)*270)"><h3><span>${t('nav.tasks')} · ${t('hud.day', { day: 1 })}</span></h3><ul>
        <li>${icon('flowServe')}${t('tasks.serve3')}<span class="q">0/3</span></li>
        <li>${icon('flowNoodles')}${t('tasks.perfect1')}<span class="q">0/1</span></li>
        <li>${icon('coin')}${t('tasks.earn60')}<span class="q">0/60</span></li></ul>
        <div style="margin-top:10px"><button class="btn" data-go="dialogue" style="width:100%">${t('menu.play')}</button></div></aside>`;
  },

  upgraded() {
    staticScene('upgraded');
    ui.innerHTML = hudHTML({ day: 24, clock: 19 * 60 + 40, satisfaction: 92, money: 3840 }) + navHTML();
  },

  dialogue() {
    staticScene('main');
    const order = ORDERS[1];
    const def = CUSTOMERS.find((c) => c.id === order.customer);
    const layer = svg.querySelector('#customer-layer');
    layer.innerHTML = `<g transform="translate(${LAYOUT.orderSpot[0]} ${LAYOUT.orderSpot[1]})">${drawCharacter(def.look, { expression: 'happy', talking: true, view: 'threeQuarter' })}</g>`;
    svg.querySelector('#fx-layer').innerHTML = `<defs><linearGradient id="dim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#292323" stop-opacity="0"/><stop offset="1" stop-color="#292323" stop-opacity=".55"/></linearGradient></defs><rect x="-300" y="640" width="2600" height="700" fill="url(#dim)"/>`;
    ui.innerHTML = hudHTML({ day: 2, clock: 12 * 60 + 15, satisfaction: 74, money: 186 }) + navHTML() + ticketHTML();
    const s = toScreen(svg, LAYOUT.orderSpot[0] + 92, LAYOUT.orderSpot[1] - 300);
    const b = document.createElement('div');
    b.className = 'bubble'; b.style.left = `${s.x}px`; b.style.bottom = `${window.innerHeight - s.y}px`; b.style.width = 'calc(var(--u)*380)';
    b.innerHTML = `<span class="who">${t(`cust.${def.id}`)}<small>${t(`role.${def.role}`)}</small></span><div>${t(order.dialogue)}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn teal" data-go="main" style="flex:1;min-height:44px;font-size:calc(var(--u)*18)">${t('dlg.ok')}</button><button class="btn ghost" data-repeat="1" style="min-height:44px;font-size:calc(var(--u)*18)">${t('dlg.repeat')}</button></div>`;
    ui.appendChild(b);
    const r = b.getBoundingClientRect();
    if (r.top < 70) b.style.bottom = `${window.innerHeight - r.height - 74}px`;
    const tk = ui.querySelector('.ticket'); tk.classList.remove('hidden');
    const fake = { customer: { order }, bowl: null, basket: { state: 'empty' } };
    KitchenGame.prototype.updateTicket.call({ ...fake, ui });
  },

  upgrades() {
    const saved = load();
    const levels = { noodleCooker: 1, brothStation: 1, ingredientCounter: 3, ...(saved.levels || {}) };
    let money = saved.money ?? 640;
    if (money < 200) money = 640; // mockup: ensure purchases can be demonstrated
    staticScene('main', { deco: saved.deco });
    ui.innerHTML = hudHTML({ day: 3, clock: 21 * 60, satisfaction: 81, money }) + navHTML('upgrades');
    const kitchenThumb = () => { resetUid(); return `<svg viewBox="0 640 1920 400">${composeScene('main', { levels, deco: saved.deco })}
      ${[['noodleCooker', 780, 840], ['brothStation', 320, 760], ['ingredientCounter', 1610, 850]].map(([k, x, y]) => `<g><circle cx="${x}" cy="${y}" r="110" fill="none" stroke="${P.gold}" stroke-width="10" stroke-dasharray="26 16" class="deco-slot-hl"/><circle cx="${x + 90}" cy="${y - 80}" r="34" fill="${P.red}" stroke="${P.ink}" stroke-width="5"/><text x="${x + 90}" y="${y - 68}" font-size="36" text-anchor="middle" fill="${P.cream}" font-family="Baloo 2, sans-serif" font-weight="800">${levels[k]}</text></g>`).join('')}</svg>`; };
    const cardArt = (k, lvl) => {
      if (k === 'noodleCooker') return `<svg viewBox="-20 -150 300 360"><g transform="translate(0 0)">${ASSETS['equip-noodle-cooker'].draw({ level: lvl })}</g>${Array.from({ length: Math.min(3, lvl) }, (_, i) => `<g transform="translate(${130 + (i - (Math.min(3, lvl) - 1) / 2) * 70} 30) scale(.8)">${ASSETS['equip-noodle-basket'].draw({ noodles: i ? 'thick' : 'thin' })}</g>`).join('')}</svg>`;
      if (k === 'brothStation') return `<svg viewBox="-110 -200 220 220">${ASSETS['equip-broth-pot'].draw({ broth: 'miso', level: lvl })}</svg>`;
      return `<svg viewBox="0 0 330 190">${['chashu', 'egg', 'nori', 'corn', 'mushroom', 'naruto'].map((id, i) => `<g transform="translate(${(i % 3) * 108} ${Math.floor(i / 3) * 92})">${ASSETS['equip-ingredient-tray'].draw({ id })}</g>`).join('')}</svg>`;
    };
    const card = (u) => {
      const lvl = levels[u.id];
      const max = lvl >= u.maxLevel;
      const price = u.levels[lvl] ?? 0;
      return `<div class="card" data-up="${u.id}"><div class="art">${cardArt(u.id, max ? lvl : lvl + 1)}<span class="badge">${t('up.level', { level: max ? lvl : lvl + 1 })}</span></div>
        <h3>${t(`up.${u.id}`)}<span class="lv">${t('up.level', { level: lvl })}</span></h3>
        <div class="pips">${Array.from({ length: u.maxLevel }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>
        <p>${t(`up.${u.id}.desc`)}</p>
        <button class="btn ${max ? 'ghost' : 'gold'}" ${max || money < price ? 'disabled' : ''} data-buy="${u.id}">${max ? t('up.max') : `${icon('coin')} ${price} · ${t('up.buy')}`}</button></div>`;
    };
    const lockedCard = (asset, nameKey) => `<div class="card locked"><div class="art"><svg viewBox="${ASSETS[asset].box.join(' ')}">${ASSETS[asset].draw()}</svg><span class="badge">${icon('lock')} ${t('up.locked')}</span></div><h3>${t(nameKey)}</h3><p>${t('up.lockedDesc')}</p></div>`;
    const render = () => {
      ui.querySelector('.scrim')?.remove();
      ui.insertAdjacentHTML('beforeend', `<div class="scrim"><section class="panel" role="dialog" aria-label="${t('up.title')}">
        <header class="panel-head">${icon('upgrades', 44)}<h2>${t('up.title')}</h2><div class="pill">${icon('coin')}<span>${money}</span></div><button class="round-btn" data-go="main" aria-label="${t('panel.close')}">✕</button></header>
        <div class="panel-body"><div class="split"><div class="layout-preview">${kitchenThumb()}</div>
          <div class="cards">${UPGRADES.map(card).join('')}${lockedCard('equip-refrigerator', 'up.refrigerator')}${lockedCard('equip-sink', 'up.dishwasher')}</div></div></div></section></div>`);
      ui.querySelector('.money-val').textContent = money;
    };
    render();
    on(ui, 'click', (e) => {
      const b = e.target.closest('[data-buy]'); if (!b || current !== 'upgrades') return;
      const u = UPGRADES.find((x) => x.id === b.dataset.buy);
      const price = u.levels[levels[u.id]];
      if (money < price) return;
      money -= price; levels[u.id] += 1;
      save({ money, levels });
      sfx.unlock(); sfx.coin();
      render();
      const c = ui.querySelector(`[data-up="${u.id}"]`); c.classList.add('purchase-burst');
    });
  },

  hire() {
    staticScene('main');
    const saved = load();
    const hired = new Set(saved.hired || []);
    let money = Math.max(saved.money ?? 0, 420);
    ui.innerHTML = hudHTML({ day: 4, clock: 21 * 60, satisfaction: 83, money }) + navHTML('hire');
    const stat = (k, v) => `<div class="stat"><span>${t(k)}</span><span class="bar"><i style="width:${v * 20}%"></i></span></div>`;
    const card = (e) => {
      const locked = e.locked; const isHired = hired.has(e.id);
      return `<div class="card ${locked ? 'locked' : ''}"><div class="art" style="background:radial-gradient(circle at 50% 80%, ${locked ? '#E9DCC6' : '#CDE6E2'}, ${locked ? '#D8C7A8' : '#A9D3CD'})"><svg viewBox="-150 -500 300 330">${drawCharacter(e.look, { expression: isHired ? 'happy' : 'neutral', view: 'threeQuarter' })}</svg>${locked ? `<span class="badge">${icon('lock')} ${t('emp.locked')}</span>` : ''}</div>
        <h3>${t(`emp.${e.id}`)}<span class="lv">${t(`emp.${e.role}`)}</span></h3>
        ${stat('emp.speed', e.speed)}${stat('emp.accuracy', e.accuracy)}
        <div class="stat"><span>${t('emp.salary')}</span><span>${icon('coin', 22)} ${e.salary}</span></div>
        <div class="stat"><span>${t('emp.station')}</span><span>${t(e.role === 'waiter' ? 'station.floor' : e.role === 'prepWorker' ? 'station.prep' : 'station.noodles')}</span></div>
        <p>${t(`emp.${e.id}.ability`)}</p>
        ${locked ? `<button class="btn ghost" disabled>${t('up.locked')}</button>` : isHired ? `<button class="btn teal" data-train="${e.id}">${t('emp.train')} · ${icon('coin')} 80</button>` : `<button class="btn gold" data-hire="${e.id}" ${money < e.hireCost ? 'disabled' : ''}>${icon('coin')} ${e.hireCost} · ${t('emp.hire')}</button>`}</div>`;
    };
    const render = () => {
      ui.querySelector('.scrim')?.remove();
      ui.insertAdjacentHTML('beforeend', `<div class="scrim"><section class="panel" role="dialog"><header class="panel-head">${icon('employees', 44)}<h2>${t('emp.title')}</h2><div class="pill">${icon('coin')}<span>${money}</span></div><button class="round-btn" data-go="main" aria-label="${t('panel.close')}">✕</button></header>
        <div class="panel-body"><div class="cards">${EMPLOYEES.map(card).join('')}</div></div></section></div>`);
      ui.querySelector('.money-val').textContent = money;
    };
    render();
    on(ui, 'click', (e) => {
      const b = e.target.closest('[data-hire]'); if (!b || current !== 'hire') return;
      const emp = EMPLOYEES.find((x) => x.id === b.dataset.hire);
      if (money < emp.hireCost) return;
      money -= emp.hireCost; hired.add(emp.id); save({ money, hired: [...hired] });
      sfx.unlock(); sfx.coin(); render();
      // Show the new hire physically in the kitchen behind the dimmed panel.
      resetUid(); setStage(composeScene('main', { staff: true }));
    });
  },

  customize() {
    const saved = load();
    let deco = { lanterns: 'red', plants: 'fern', wallArt: 'wave', wall: P.plaster, ...(saved.deco || {}) };
    let preview = { ...deco };
    let cat = 'lanterns';
    const OPTIONS = {
      lanterns: [['red', P.red], ['teal', P.teal], ['sakura', P.sakura]],
      plants: [['fern'], ['round']],
      wallArt: [['wave'], ['mountain']],
      walls: [[P.plaster, P.plaster], ['#F7DCE2', '#F7DCE2'], ['#DDEBE5', '#DDEBE5']],
    };
    const thumb = (c, v) => {
      if (c === 'lanterns') return `<svg viewBox="-70 40 140 170">${ASSETS['bg-lantern'].draw({ color: v[1], lit: false })}</svg>`;
      if (c === 'plants') return `<svg viewBox="-64 -175 128 180">${ASSETS['deco-plant'].draw({ variant: v[0] })}</svg>`;
      if (c === 'wallArt') return `<svg viewBox="0 0 150 190">${ASSETS['deco-wall-art'].draw({ variant: v[0] })}</svg>`;
      return `<svg viewBox="0 0 100 70"><rect x="4" y="4" width="92" height="62" rx="10" fill="${v[1]}" stroke="${P.ink}" stroke-width="4"/><rect x="4" y="44" width="92" height="22" fill="${P.wood}" stroke="${P.ink}" stroke-width="4"/></svg>`;
    };
    const key = { lanterns: 'lanterns', plants: 'plants', wallArt: 'wallArt', walls: 'wall' };
    const draw = () => {
      resetUid();
      setStage(composeScene('main', { deco: { ...preview, plants: preview.plants } }));
      const hl = { lanterns: [[LAYOUT.lanterns[2][0], 210, 90]], plants: LAYOUT.plantSlots.map(([x, y]) => [x, y - 60, 70]), wallArt: [[LAYOUT.wallArt[0] + 75, LAYOUT.wallArt[1] + 95, 110]], walls: [[960, 300, 0]] }[cat];
      svg.querySelector('#fx-layer').innerHTML = hl.filter((h) => h[2]).map(([x, y, r]) => `<ellipse class="deco-slot-hl" cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="${P.gold}" fill-opacity=".18" stroke="${P.gold}" stroke-width="8" stroke-dasharray="22 14"/>`).join('');
      ui.querySelector('.deco-tray')?.remove();
      ui.insertAdjacentHTML('beforeend', `<div class="deco-tray"><div class="deco-tabs">${Object.keys(OPTIONS).map((c) => `<button aria-pressed="${c === cat}" data-cat="${c}">${t(`deco.${c === 'walls' ? 'walls' : c === 'wallArt' ? 'wall' : c}`)}</button>`).join('')}</div>
        ${OPTIONS[cat].map((v) => `<button class="deco-item" data-opt="${v[0]}" aria-pressed="${preview[key[cat]] === v[0]}">${thumb(cat, v)}<span>${icon('coin', 16)} ${cat === 'walls' ? 40 : 60}</span></button>`).join('')}
        <div class="deco-actions"><button class="btn teal" data-confirm="1">${t('deco.confirm')}</button><button class="btn ghost" data-cancel="1">${t('deco.cancel')}</button></div></div>`);
    };
    ui.innerHTML = hudHTML({ day: 3, clock: 21 * 60, satisfaction: 81, money: load().money ?? 640 }) + navHTML('customize');
    draw();
    on(ui, 'click', (e) => {
      if (current !== 'customize') return;
      const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; draw(); return; }
      const o = e.target.closest('[data-opt]'); if (o) { preview[key[cat]] = o.dataset.opt; sfx.unlock(); sfx.pick(); draw(); return; }
      if (e.target.closest('[data-confirm]')) { deco = { ...preview }; save({ deco }); sfx.coin(); toast(t('deco.saved')); return; }
      if (e.target.closest('[data-cancel]')) { preview = { ...deco }; draw(); }
    });
  },

  results() {
    staticScene('main');
    const d = lastDay || { day: 1, customers: 5, success: 4, fail: 1, revenue: 74, tips: 11, ingredients: 41, satisfaction: 82, perfect: 2 };
    const salaries = 0;
    const net = d.revenue + d.tips - d.ingredients - salaries;
    const stars = d.satisfaction >= 85 ? 3 : d.satisfaction >= 65 ? 2 : 1;
    const star = (on) => `<svg viewBox="0 0 64 64"><path d="M32 4 l8 18 l20 2 l-15 13 l5 20 l-18 -10 l-18 10 l5 -20 l-15 -13 l20 -2z" fill="${on ? P.gold : '#E9CFA6'}" stroke="${P.ink}" stroke-width="4" stroke-linejoin="round"/></svg>`;
    ui.innerHTML = `<div class="scrim"><section class="panel results" role="dialog"><div class="noren-top"></div>
      <header class="panel-head" style="justify-content:center;padding-top:calc(var(--u)*20)"><h2 style="text-align:center">${t('res.title', { day: d.day })}</h2></header>
      <div class="panel-body"><div class="stars">${star(stars >= 1)}${star(stars >= 2)}${star(stars >= 3)}</div>
        <div class="rows">
          <div class="row"><span>${t('res.customers')}</span><b data-count="${d.customers}">0</b></div>
          <div class="row"><span>${t('res.revenue')}</span><b data-count="${d.revenue}">0</b></div>
          <div class="row"><span>${t('res.success')}</span><b data-count="${d.success}">0</b></div>
          <div class="row"><span>${t('res.tips')}</span><b data-count="${d.tips}">0</b></div>
          <div class="row"><span>${t('res.fail')}</span><b data-count="${d.fail}">0</b></div>
          <div class="row neg"><span>${t('res.ingredients')}</span><b data-count="${d.ingredients}" data-neg="1">0</b></div>
          <div class="row"><span>${t('res.satisfaction')}</span><b data-count="${d.satisfaction}" data-suffix="%">0</b></div>
          <div class="row neg"><span>${t('res.salaries')}</span><b data-count="${salaries}" data-neg="1">0</b></div>
        </div>
        <div class="net"><span>${t('res.net')}</span><b data-count="${net}">0</b></div>
        <div class="unlock-row"><span>${t('res.unlocked')}</span><span class="unlock-chip">${icon('upgrades')}${t('up.noodleCooker')} ${t('up.level', { level: 2 })}</span><span class="unlock-chip"><svg viewBox="-40 -40 80 80">${INGREDIENT_ART.mushroom()}</svg>${t('ing.mushroom')}</span></div>
      </div>
      <footer class="footer-actions"><button class="btn ghost" data-ad="1">${t('res.bonus')}</button><button class="btn" data-next="1">${t('res.next')}</button></footer></section></div>`;
    const els = [...ui.querySelectorAll('[data-count]')];
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 1200); const e = 1 - (1 - p) ** 3;
      els.forEach((n) => { const v = Math.round(+n.dataset.count * e); n.textContent = `${n.dataset.neg && v ? '−' : ''}${v}${n.dataset.suffix || ''}`; });
      if (p < 1 && current === 'results') requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    ui.querySelector('[data-next]').onclick = () => { save({ day: (load().day || 1) + 1 }); go('main'); };
    ui.querySelector('[data-ad]').onclick = () => toast(t('ads.placeholder'));
  },

  menu() {
    staticScene('main');
    svg.style.filter = 'blur(3px) brightness(.8)';
    const bowlMark = `<svg viewBox="-130 -130 260 210" class="bowl-mark">${ASSETS['fx-steam'].draw()}${ASSETS['food-bowl-composite'].draw({ broth: 'shoyu', noodle: 'thin', toppings: [{ id: 'egg', x: -0.4, y: -0.1 }, { id: 'chashu', x: 0.35, y: -0.2 }, { id: 'nori', x: 0.05, y: -0.5 }, { id: 'naruto', x: 0.6, y: 0.3 }, { id: 'greenOnion', x: -0.1, y: 0.4 }] })}</svg>`;
    const saved = load();
    ui.innerHTML = `<div class="menu"><div class="logo">${bowlMark}<h1>${t('game.title')}</h1><p>${t('game.tagline')}</p></div>
      <div class="loading"><div>${t('loading.text')}</div><div class="loadbar"><i></i></div><div style="opacity:.85">${t(Math.random() < 0.5 ? 'loading.tip1' : 'loading.tip2')}</div></div></div>`;
    setTimeout(() => {
      if (current !== 'menu') return;
      ui.querySelector('.loading').remove();
      ui.querySelector('.menu').insertAdjacentHTML('beforeend', `<div class="menu-actions">
        <button class="btn" data-go="empty">${t('menu.play')}</button>
        ${saved.day ? `<button class="btn teal" data-go="main">${t('menu.continue', { day: saved.day })}</button>` : ''}
        <div class="row"><button class="btn ghost" data-soon="1">${t('menu.settings')}</button><button class="btn ghost" data-soon="1">${t('menu.credits')}</button></div></div>`);
    }, 2200);
  },

  characters() {
    staticScene('main');
    svg.style.filter = 'blur(3px) brightness(.7)';
    const all = [[PLAYER_CHEF.id, PLAYER_CHEF.look, t('char.chef')], ...CUSTOMERS.map((c) => [c.id, c.look, `${t(`cust.${c.id}`)} · ${t(`role.${c.role}`)}`]), ...EMPLOYEES.map((e) => [e.id, e.look, `${t(`emp.${e.id}`)} · ${t(`emp.${e.role}`)}`])];
    const cell = (look, opts) => `<svg viewBox="-150 -500 300 520" style="height:calc(var(--u)*150);width:auto">${drawCharacter(look, opts)}</svg>`;
    ui.innerHTML = `<div class="scrim"><section class="panel" style="width:min(calc(var(--u)*1240),100%)"><header class="panel-head"><h2>${t('board.characters')}</h2><button class="round-btn" data-go="main">✕</button></header>
      <div class="panel-body">${all.map(([id, look, name]) => `<div style="margin-bottom:14px"><h3 style="margin:0 0 4px;font-family:var(--font-display)">${name}</h3>
        <div style="display:flex;gap:6px;overflow-x:auto;background:#F6E4C6;border:3px solid var(--ink);border-radius:14px;padding:6px">
          ${VIEWS.map((v) => cell(look, { view: v })).join('')}<span style="width:3px;background:var(--wood);border-radius:2px"></span>${EXPRESSIONS.map((ex) => cell(look, { expression: ex, view: 'threeQuarter' })).join('')}</div></div>`).join('')}</div></section></div>`;
  },

  assets() {
    staticScene('main');
    svg.style.filter = 'blur(3px) brightness(.7)';
    const groups = {};
    Object.entries(ASSETS).forEach(([name, a]) => { (groups[a.category] ||= []).push([name, a]); });
    ui.innerHTML = `<div class="scrim"><section class="panel" style="width:min(calc(var(--u)*1240),100%)"><header class="panel-head"><h2>${t('board.assets')} · ${Object.keys(ASSETS).length}</h2><button class="round-btn" data-go="main">✕</button></header>
      <div class="panel-body">${Object.entries(groups).map(([g, items]) => `<h3 style="font-family:var(--font-display);margin:8px 0">${g}</h3><div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">
        ${items.map(([name, a]) => `<div class="card" style="padding:6px"><div class="art" style="height:100px">${(resetUid(), '')}<svg viewBox="${a.box.join(' ')}" preserveAspectRatio="xMidYMid meet">${a.draw()}</svg></div><p style="font-size:11px;word-break:break-all">${name}<br><span style="opacity:.6">${a.layer}</span></p></div>`).join('')}</div>`).join('')}</div></section></div>`;
  },
};

// ------------------------------------------------------------------ router
let screenAbort = null;
const on = (target, type, fn) => target.addEventListener(type, fn, { signal: screenAbort.signal });

export function go(name) {
  if (!renderers[name]) name = 'main';
  stopGame();
  screenAbort?.abort();
  screenAbort = new AbortController();
  current = name;
  svg.style.filter = '';
  ui.innerHTML = '';
  renderers[name]();
  if (location.hash.slice(1) !== name) history.replaceState(null, '', `#${name}${location.search}`);
  board();
}

// ------------------------------------------------------------------ design board
function board() {
  const root = ui;
  root.querySelector('.board')?.remove();
  const open = sessionStorage.getItem('rs-board') === '1';
  root.insertAdjacentHTML('beforeend', `<div class="board"><div class="board-menu ${open ? '' : 'hidden'}">
      <h4>${t('mockup.title')}</h4><p>${t('mockup.note')}</p>
      ${[...SCREENS, ...EXTRA].map((s, i) => `<button class="scr" data-go="${s}" aria-current="${s === current}">${i < 10 ? `${i + 1}. ` : '★ '}${t(`screen.${s}`)}</button>`).join('')}
      <div class="langs"><button data-lang="tr" aria-pressed="${getLang() === 'tr'}">TR</button><button data-lang="en" aria-pressed="${getLang() === 'en'}">EN</button></div>
      <div class="opts"><button data-sound="1" aria-pressed="${!sfx.isMuted()}">♪ ${t('board.sound')}</button><button data-motion="1" aria-pressed="${document.body.classList.contains('reduce-motion')}">${t('board.motion')}</button></div>
      <div class="opts"><button data-reset="1">${t('board.reset')}</button></div>
    </div><button class="board-toggle">${t('board.toggle')}</button></div>`);
}

function bindGlobal() {
  document.addEventListener('click', (e) => {
    const root = ui;
    if (!root.contains(e.target)) return;
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    if (e.target.closest('.board-toggle')) { const m = root.querySelector('.board-menu'); m.classList.toggle('hidden'); sessionStorage.setItem('rs-board', m.classList.contains('hidden') ? '0' : '1'); return; }
    const l = e.target.closest('[data-lang]');
    if (l) { setLang(l.dataset.lang); document.documentElement.lang = l.dataset.lang; const u = new URL(location.href); u.searchParams.set('lang', l.dataset.lang); history.replaceState(null, '', u); go(current); return; }
    if (e.target.closest('[data-sound]')) { sfx.setMuted(!sfx.isMuted()); board(); return; }
    if (e.target.closest('[data-motion]')) { document.body.classList.toggle('reduce-motion'); board(); return; }
    if (e.target.closest('[data-reset]')) { if (confirm(t('board.resetConfirm'))) { reset(); go(current); } return; }
    if (e.target.closest('[data-soon]')) { toastIn(root, t('soon')); return; }
    if (e.target.closest('[data-more]')) { root.querySelector('.nav')?.classList.toggle('collapsed'); return; }
    if (e.target.closest('.ticket .tog')) { root.querySelector('.ticket').classList.toggle('collapsed'); }
    if (e.target.closest('[data-repeat]')) { const b = root.querySelector('.bubble'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
  });
}
function toastIn(root, text) {
  const d = document.createElement('div');
  d.className = 'hint'; d.style.opacity = 1; d.style.top = '40%'; d.textContent = text;
  root.appendChild(d); setTimeout(() => d.remove(), 1600);
}

// ------------------------------------------------------------------ boot
const params = new URLSearchParams(location.search);
setLang(params.get('lang') || ((navigator.language || '').startsWith('en') ? 'en' : 'tr'));
document.documentElement.lang = getLang();
if (params.get('motion') === 'reduce') document.body.classList.add('reduce-motion');
document.querySelector('#rotate-hint p').textContent = t('rotate');
bindGlobal();
go(location.hash.slice(1) || 'menu');
