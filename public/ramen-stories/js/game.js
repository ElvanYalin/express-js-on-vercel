// Interactive kitchen controller for the Phase 1 layout mockup.
// Purpose: validate the screen layout, touch targets and cooking flow with real
// interactions before the Unity build. Logic modules (evaluation.js, data.js)
// are written to be ported 1:1 to C#.

import { PALETTE as P, BROTHS, NOODLES, CUSTOMERS, ORDERS, INGREDIENTS } from './data.js';
import { ASSETS, INGREDIENT_ART, icon, uid } from './assets.js';
import { drawCharacter } from './characters.js';
import { LAYOUT } from './scene.js';
import { evaluateOrder, doneness } from './evaluation.js';
import { t } from './i18n.js';
import { sfx } from './audio.js';
import { save, load } from './save.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => { const g = document.createElementNS(NS, 'g'); g.innerHTML = html; return g; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function toWorld(svg, x, y) {
  const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
export function toScreen(svg, x, y) {
  const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
  return pt.matrixTransform(svg.getScreenCTM());
}

export class KitchenGame {
  constructor(svg, ui, { onDayEnd, onHud, showBubble = true, cameraFocus = null } = {}) {
    this.cameraFocus = cameraFocus;
    this.svg = svg; this.ui = ui; this.onDayEnd = onDayEnd; this.onHud = onHud; this.showBubble = showBubble;
    const saved = load();
    this.state = {
      day: saved.day || 1, money: saved.money ?? 120, satisfaction: saved.satisfaction ?? 70,
      clock: 11 * 60, orderIdx: 0,
      stats: { customers: 0, success: 0, fail: 0, revenue: 0, tips: 0, ingredients: 0, perfect: 0 },
    };
    this.bowl = null;
    this.basket = { state: 'empty', noodle: null, t0: 0, seconds: 0 };
    this.customer = null;
    this.busy = false;
    this.destroyed = false;
  }

  start() {
    this.bindInput();
    this.renderBowl();
    this.updateFlow();
    this.tick = setInterval(() => { this.state.clock += 1; this.onHud?.(this.state); }, 1000);
    this.nextCustomer(600);
  }

  destroy() {
    this.destroyed = true;
    clearInterval(this.tick);
    cancelAnimationFrame(this.raf);
    this.unbind?.();
  }

  // ------------------------------------------------------------ helpers
  layerEl(id) { return this.svg.querySelector(`#${id}`); }
  floatText(text, wx, wy, color) {
    const s = toScreen(this.svg, wx, wy);
    const d = document.createElement('div');
    d.className = 'float'; d.textContent = text; d.style.left = `${s.x}px`; d.style.top = `${s.y}px`;
    if (color) d.style.color = color;
    this.ui.appendChild(d); setTimeout(() => d.remove(), 1500);
  }
  sparkle(x, y, n = 5) {
    const fx = this.layerEl('fx-layer');
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 70 + Math.random() * 40;
      const g = el(`<g transform="translate(${x + Math.cos(a) * r} ${y + Math.sin(a) * r * 0.6}) scale(${0.5 + Math.random() * 0.5})"><g class="sparkle-pop">${ASSETS['fx-sparkle'].draw({ color: i % 2 ? P.gold : P.sakura })}</g></g>`);
      fx.appendChild(g); setTimeout(() => g.remove(), 1000);
    }
  }

  // ------------------------------------------------------------ input
  bindInput() {
    const svg = this.svg;
    const down = (e) => this.pointerDown(e);
    const move = (e) => this.pointerMove(e);
    const up = (e) => this.pointerUp(e);
    svg.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this.unbind = () => {
      svg.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }

  pointerDown(e) {
    if (this.busy || this.destroyed) return;
    sfx.unlock();
    const target = e.target.closest('[data-broth], [data-noodle], [data-ingredient], #bowl-stack, .basket, #bowl-layer, .topping');
    if (!target) return;
    const w = toWorld(this.svg, e.clientX, e.clientY);
    if (target.classList.contains('topping')) { this.startDrag('bowl', w, e); this.drag.topping = target; return; }
    if (target.dataset.broth) { this.pour(target.dataset.broth); return; }
    if (target.id === 'bowl-stack') { this.placeBowl(); return; }
    if (target.classList.contains('basket')) {
      if (this.basket.state === 'loaded') { this.lowerBasket(); return; }
      if (this.basket.state === 'cooking') { this.liftBasket(); return; }
      if (this.basket.state === 'cooked') { this.startDrag('noodles', w, e); return; }
      return;
    }
    if (target.dataset.noodle) { if (this.basket.state === 'empty') this.startDrag('bundle', w, e, target.dataset.noodle); else this.nudge('hint.toNoodle'); return; }
    if (target.dataset.ingredient && !target.classList.contains('locked')) { this.startDrag('ingredient', w, e, target.dataset.ingredient); return; }
    if (target.id === 'bowl-layer' && this.bowl) { this.startDrag('bowl', w, e); }
  }

  startDrag(kind, w, e, id) {
    e.preventDefault();
    this.svg.setPointerCapture?.(e.pointerId);
    let art = '';
    if (kind === 'bundle') art = ASSETS[`food-noodles-${id}`].draw();
    if (kind === 'noodles') art = `<g transform="translate(0 40)">${ASSETS['equip-noodle-basket'].draw({ noodles: this.basket.noodle })}</g>`;
    if (kind === 'ingredient') { art = `<g transform="scale(.8)">${INGREDIENT_ART[id]()}</g>`; sfx.pick(); }
    let ghost;
    if (kind === 'bowl') {
      ghost = this.layerEl('bowl-layer');
      ghost.classList.add('ghost');
      this.showDropTarget(true);
    } else {
      ghost = el(`<g class="ghost-inner">${art}</g>`);
      ghost.classList.add('ghost');
      this.layerEl('fx-layer').appendChild(ghost);
      if (kind === 'ingredient' || kind === 'noodles') this.highlightBowl(true);
      if (kind === 'bundle') this.basketEl()?.classList.add('pulse');
    }
    if (kind === 'noodles') this.basketEl().style.opacity = '.35';
    this.drag = { kind, id, ghost, start: w };
    this.moveGhost(w);
  }

  moveGhost(w) {
    const d = this.drag;
    if (d.kind === 'bowl') {
      d.ghost.setAttribute('transform', `translate(${w.x} ${w.y + 10})`);
    } else d.ghost.setAttribute('transform', `translate(${w.x} ${w.y - 30})`);
    d.last = w;
  }

  pointerMove(e) {
    if (!this.drag) return;
    e.preventDefault();
    this.moveGhost(toWorld(this.svg, e.clientX, e.clientY));
  }

  pointerUp(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const w = d.last || toWorld(this.svg, e.clientX, e.clientY);
    const [bx, by] = LAYOUT.bowl;
    // Visual drop point (ghosts are drawn 30 units above the finger so they stay visible).
    const vx = w.x, vy = w.y - 30;
    const inBowl = (x, y, pad = 1) => ((x - bx) / (120 * pad)) ** 2 + ((y - by) / (56 * pad)) ** 2 <= 1;
    this.highlightBowl(false);
    this.basketEl()?.classList.remove('pulse');
    if (d.kind === 'bowl') {
      d.ghost.classList.remove('ghost');
      this.showDropTarget(false);
      const [tx, ty] = LAYOUT.servingTray;
      const moved = Math.hypot(w.x - d.start.x, w.y - d.start.y);
      if (d.topping && moved < 12) { d.ghost.setAttribute('transform', `translate(${bx} ${by})`); this.removeTopping(d.topping); return; }
      if (Math.hypot(w.x - tx, w.y - ty) < 200 && this.customer && !this.customer.leaving) this.serve();
      else d.ghost.setAttribute('transform', `translate(${bx} ${by})`);
      return;
    }
    d.ghost.remove();
    if (d.kind === 'bundle') {
      const bk = LAYOUT.baskets[0][0];
      if (Math.hypot(vx - bk, vy - 740) < 150) this.loadBasket(d.id);
      return;
    }
    if (d.kind === 'noodles') {
      this.basketEl().style.opacity = '';
      if (inBowl(vx, vy, 1.6)) {
        if (!this.bowl) this.placeBowl(true);
        if (this.bowl.noodle) { this.nudge('hint.toppings'); return; }
        this.bowl.noodle = this.basket.noodle; this.bowl.noodleSeconds = this.basket.seconds;
        this.basket = { state: 'empty', noodle: null, t0: 0, seconds: 0 };
        this.renderBasket(); this.renderBowl('noodle'); sfx.plop(); this.updateFlow();
      }
      return;
    }
    if (d.kind === 'ingredient') {
      if (!inBowl(vx, vy, 1.15)) return;
      if (!this.bowl) { this.nudge('hint.bowl'); return; }
      const x = Math.max(-0.82, Math.min(0.82, (vx - bx) / 92));
      const y = Math.max(-0.8, Math.min(0.85, (vy - by) / 30));
      this.bowl.ingredients.push({ id: d.id, x, y, r: Math.round(Math.random() * 40 - 20), key: uid('t') });
      this.state.stats.ingredients += INGREDIENTS.find((i) => i.id === d.id)?.cost || 1;
      this.renderBowl('topping'); sfx.plop(); this.updateFlow();
    }
  }

  basketEl() { return this.svg.querySelector('#basket-0 .basket'); }
  highlightBowl(on) { this.layerEl('bowl-layer')?.classList.toggle('pulse', on); }
  showDropTarget(on) {
    const tray = this.layerEl('serving-tray');
    if (!tray) return;
    tray.innerHTML = ASSETS['kitchen-serving-tray'].draw({ highlight: on });
  }
  nudge(key) { this.setHint(key, true); }

  // ------------------------------------------------------------ cooking actions
  placeBowl(silent) {
    if (this.bowl) return;
    this.bowl = { broth: null, noodle: null, noodleSeconds: null, ingredients: [] };
    if (!silent) sfx.clink();
    this.renderBowl('in'); this.updateFlow();
  }

  async pour(broth) {
    if (this.bowl?.broth) { this.nudge(this.bowl.noodle ? 'hint.toppings' : 'hint.noodles'); return; }
    if (!this.bowl) this.placeBowl();
    this.busy = true;
    const [bx, by] = LAYOUT.bowl;
    const def = BROTHS.find((b) => b.id === broth);
    const g = el(`<g transform="translate(${bx - 40} ${by - 70})"><path class="stream" d="M18 -8 q-6 40 -4 70" stroke="${def.color}" stroke-width="12" stroke-linecap="round" fill="none"/>
      <g class="pour">${ASSETS['equip-ladle'].draw({ broth })}</g></g>`);
    this.layerEl('fx-layer').appendChild(g);
    sfx.pour();
    await wait(450);
    this.bowl.broth = broth;
    this.state.stats.ingredients += def.cost;
    this.renderBowl('broth');
    await wait(700);
    g.remove();
    this.busy = false;
    this.updateFlow();
  }

  loadBasket(noodle) {
    this.basket = { state: 'loaded', noodle, t0: 0, seconds: 0 };
    this.state.stats.ingredients += NOODLES.find((n) => n.id === noodle).cost;
    sfx.plop(); this.renderBasket(); this.updateFlow();
  }

  lowerBasket() {
    this.basket.state = 'cooking'; this.basket.t0 = performance.now();
    sfx.splash(); sfx.boilStart();
    this.renderBasket(); this.updateFlow();
    const loop = () => {
      if (this.basket.state !== 'cooking' || this.destroyed) return;
      this.basket.seconds = (performance.now() - this.basket.t0) / 1000;
      this.renderTimer();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  liftBasket() {
    this.basket.state = 'cooked';
    sfx.boilStop(); sfx.splash();
    const def = NOODLES.find((n) => n.id === this.basket.noodle);
    const d = doneness(def, this.basket.seconds);
    const label = { perfect: t('rating.perfect'), under: t('mistake.underNoodles'), soft: t('mistake.softNoodles'), over: t('mistake.overNoodles') }[d];
    this.floatText(label, LAYOUT.baskets[0][0], 690, d === 'perfect' ? P.gold : '#F2A5B8');
    if (d === 'perfect') this.sparkle(LAYOUT.baskets[0][0], 740, 4);
    this.renderTimer(true);
    this.renderBasket(); this.updateFlow();
  }

  removeTopping(node) {
    if (!this.bowl) return;
    this.bowl.ingredients = this.bowl.ingredients.filter((tp) => tp.key !== node.dataset.key);
    sfx.pick(); this.renderBowl(); this.updateFlow();
  }

  // ------------------------------------------------------------ rendering
  renderBasket() {
    const wrap = this.svg.querySelector('#basket-0 .basket');
    if (!wrap) return;
    const y = this.basket.state === 'cooking' ? LAYOUT.basketLoweredY : LAYOUT.basketRaisedY;
    wrap.style.transform = `translate(${LAYOUT.baskets[0][0]}px, ${y}px)`;
    wrap.removeAttribute('transform');
    wrap.innerHTML = `${ASSETS['equip-noodle-basket'].draw({ noodles: this.basket.noodle })}<rect class="hit" x="-60" y="-140" width="120" height="150" fill="transparent"/>`;
    wrap.classList.toggle('pulse', this.basket.state === 'loaded' || this.basket.state === 'cooked');
  }

  renderTimer(hide) {
    const ring = this.layerEl('timer-ring');
    if (!ring) return;
    if (hide || this.basket.state !== 'cooking') { ring.classList.add('hidden'); return; }
    const def = NOODLES.find((n) => n.id === this.basket.noodle);
    const max = def.over + 1.5;
    const cx = LAYOUT.baskets[0][0] + 84, cy = 700, r = 36;
    const arc = (a0, a1, color) => {
      const p = (a) => [cx + r * Math.sin((a / max) * 2 * Math.PI), cy - r * Math.cos((a / max) * 2 * Math.PI)];
      const [x0, y0] = p(a0), [x1, y1] = p(a1);
      return `<path d="M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > max / 2 ? 1 : 0} 1 ${x1} ${y1}" stroke="${color}" stroke-width="12" fill="none"/>`;
    };
    const s = Math.min(this.basket.seconds, max - 0.01);
    const ang = (s / max) * 360;
    ring.classList.remove('hidden');
    ring.innerHTML = `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="${P.cream}" stroke="${P.ink}" stroke-width="4"/>
      ${arc(0, def.perfect[0], '#D8C7A8')}${arc(def.perfect[0], def.perfect[1], P.teal)}${arc(def.perfect[1], def.over, P.gold)}${arc(def.over, max - 0.001, P.red)}
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r - 4}" stroke="${P.ink}" stroke-width="5" stroke-linecap="round" transform="rotate(${ang} ${cx} ${cy})"/>
      <circle cx="${cx}" cy="${cy}" r="7" fill="${P.ink}"/>`;
  }

  renderBowl(anim) {
    const layer = this.layerEl('bowl-layer');
    if (!layer) return;
    layer.setAttribute('transform', `translate(${LAYOUT.bowl[0]} ${LAYOUT.bowl[1]})`);
    if (!this.bowl) { layer.innerHTML = ''; return; }
    const html = ASSETS['food-bowl-composite'].draw({ broth: this.bowl.broth, noodle: this.bowl.noodle, toppings: [] });
    // Toppings rendered as individual nodes so they can be tapped/removed.
    const tops = [...this.bowl.ingredients].sort((a, b) => a.y - b.y).map((tp, i, arr) =>
      `<g class="topping${anim === 'topping' && tp === this.bowl.ingredients[this.bowl.ingredients.length - 1] ? ' placed' : ''}" data-key="${tp.key}" transform="translate(${tp.x * 92} ${tp.y * 30}) rotate(${tp.r}) scale(.62)"><circle r="44" fill="transparent"/>${INGREDIENT_ART[tp.id]()}</g>`).join('');
    // Insert toppings before the bowl's front rim: split composite at the front-body path.
    const cut = html.lastIndexOf('<path d="M-114 0 a114 38');
    layer.innerHTML = `<g class="${anim === 'in' ? 'bowl-in' : ''}">${html.slice(0, cut)}<g class="toppings">${tops}</g>${html.slice(cut)}<rect class="hit" x="-120" y="-50" width="240" height="140" fill="transparent" style="pointer-events:none"/></g>`;
  }

  // ------------------------------------------------------------ flow + hints
  steps() {
    const b = this.bowl;
    const need = this.customer ? Object.values(this.customer.order.ingredients).reduce((a, c) => a + c, 0) : 1;
    return {
      broth: !!b?.broth,
      noodles: !!b?.noodle || this.basket.state === 'cooked',
      bowl: !!b?.noodle,
      toppings: (b?.ingredients.length || 0) >= need,
    };
  }

  updateFlow() {
    const s = this.steps();
    const order = ['broth', 'noodles', 'bowl', 'toppings', 'serve'];
    const active = order.find((k) => k === 'serve' || !s[k]);
    document.querySelectorAll('.flow-step').forEach((n) => {
      const k = n.dataset.step;
      n.classList.toggle('done', !!s[k]);
      n.classList.toggle('active', k === active);
    });
    // contextual hint
    let hint;
    if (!this.customer || this.customer.leaving) hint = null;
    else if (this.basket.state === 'loaded') hint = 'hint.lower';
    else if (this.basket.state === 'cooking') hint = 'hint.cooking';
    else if (this.basket.state === 'cooked') hint = 'hint.toNoodle';
    else if (!s.broth) hint = 'hint.broth';
    else if (!s.bowl) hint = 'hint.noodles';
    else if (!s.toppings) hint = 'hint.toppings';
    else hint = 'hint.serve';
    this.setHint(hint);
    this.updateTicket();
    // highlight the next interactive object
    this.svg.querySelectorAll('.pulse-target').forEach((n) => n.classList.remove('pulse', 'pulse-target'));
    const mark = (sel) => this.svg.querySelectorAll(sel).forEach((n) => n.classList.add('pulse', 'pulse-target'));
    if (hint === 'hint.broth' && this.customer) mark(`#pot-${this.customer.order.broth}`);
    if (hint === 'hint.noodles' && this.customer && this.basket.state === 'empty') mark(`.noodle-box[data-noodle="${this.customer.order.noodle}"]`);
  }

  setHint(key, flash) {
    const h = $('.hint', this.ui);
    if (!h) return;
    if (!key) { h.style.opacity = 0; return; }
    h.textContent = t(key);
    h.style.opacity = 1;
    if (flash) { h.animate([{ transform: 'translateX(-50%) scale(1.08)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 300 }); }
  }

  updateTicket() {
    const tk = $('.ticket', this.ui);
    if (!tk) return;
    if (!this.customer || this.customer.leaving) { tk.classList.add('hidden'); return; }
    tk.classList.remove('hidden');
    const o = this.customer.order, b = this.bowl;
    const broth = BROTHS.find((x) => x.id === o.broth);
    const placed = {};
    (b?.ingredients || []).forEach((p) => { placed[p.id] = (placed[p.id] || 0) + 1; });
    const ingRows = Object.entries(o.ingredients).map(([id, q]) =>
      `<li class="${(placed[id] || 0) >= q ? 'ok' : ''}"><svg viewBox="-40 -40 80 80">${INGREDIENT_ART[id]()}</svg>${t(`ing.${id}`)}<span class="q">×${q}</span></li>`).join('');
    tk.querySelector('ul').innerHTML = `
      <li class="${b?.broth === o.broth ? 'ok' : ''}"><span class="swatch" style="background:${broth.color}"></span>${t(`broth.${o.broth}`)}<span class="q"></span></li>
      <li class="${b?.noodle === o.noodle ? 'ok' : ''}"><svg viewBox="-46 -32 92 64">${ASSETS[`food-noodles-${o.noodle}`].draw()}</svg>${t(`noodle.${o.noodle}`)}<span class="q"></span></li>
      ${ingRows}`;
    tk.querySelector('h3 span').textContent = `${t('order.title')} · ${t(`cust.${o.customer}`)}`;
  }

  // ------------------------------------------------------------ customers
  async nextCustomer(delay = 1200) {
    await wait(delay);
    if (this.destroyed) return;
    if (this.state.orderIdx >= ORDERS.length) { this.endDay(); return; }
    const order = ORDERS[this.state.orderIdx];
    const def = CUSTOMERS.find((c) => c.id === order.customer);
    const layer = this.layerEl('customer-layer');
    const [dx, dy] = LAYOUT.doorSpot, [ox, oy] = LAYOUT.orderSpot;
    const g = el(`<g class="customer-flip">${drawCharacter(def.look, { expression: 'neutral', view: 'threeQuarter' })}</g>`);
    g.setAttribute('class', 'customer walking');
    g.style.transform = `translate(${dx}px, ${dy}px) scale(.94)`;
    g.style.transitionDuration = '0s';
    layer.appendChild(g);
    this.customer = { def, order, el: g, arrivedAt: 0 };
    this.openDoor(true); sfx.door();
    await wait(80);
    g.style.transitionDuration = '';
    g.style.transform = `translate(${ox}px, ${oy}px)`;
    await wait(1650);
    if (this.destroyed) return;
    g.classList.remove('walking');
    this.openDoor(false);
    this.setExpression('happy', true);
    this.updateFlow();
    if (this.showBubble) this.bubble(`<span class="who">${t(`cust.${def.id}`)}<small>${t(`role.${def.role}`)}</small></span><div>${t(order.dialogue)}</div>`);
    sfx.chatter();
    await wait(2600);
    if (this.customer?.def === def && !this.customer.leaving) {
      this.setExpression('neutral', false);
      if (this.cameraFocus) { this.bubble(null); await this.cameraFocus('kitchen'); }
    }
  }

  setExpression(expr, talking) {
    const c = this.customer;
    if (!c) return;
    c.el.innerHTML = drawCharacter(c.def.look, { expression: expr, talking, view: 'threeQuarter' });
  }

  openDoor(open) {
    const d = this.svg.querySelector('#door .door-right');
    if (d) d.style.transform = `translateX(${open ? -92 : 0}px)`;
  }

  repositionBubble() { if (this.lastBubble) this.bubble(...this.lastBubble); }

  bubble(html, cls = '') {
    this.ui.querySelectorAll('.bubble').forEach((b) => b.remove());
    this.lastBubble = html ? [html, cls] : null;
    if (!html) return;
    const s = toScreen(this.svg, LAYOUT.orderSpot[0] + 92, LAYOUT.orderSpot[1] - 300);
    const b = document.createElement('div');
    b.className = `bubble ${cls}`;
    b.innerHTML = html;
    b.style.left = `${s.x}px`;
    b.style.bottom = `${window.innerHeight - s.y}px`;
    this.ui.appendChild(b);
    const r = b.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) b.style.left = `${Math.max(8, window.innerWidth - r.width - 8)}px`;
    if (r.top < 70) b.style.bottom = `${window.innerHeight - r.height - 74}px`;
  }

  async serve() {
    if (!this.customer || this.busy) return;
    this.busy = true;
    const c = this.customer;
    const result = evaluateOrder(c.order, this.bowl, NOODLES, c.def);
    // move bowl to tray
    const [tx, ty] = LAYOUT.servingTray;
    this.layerEl('served-bowl').innerHTML = `<g transform="translate(${tx} ${ty - 34}) scale(.62)" class="bowl-in">${ASSETS['food-bowl-composite'].draw({ ...this.bowl, toppings: this.bowl.ingredients })}</g>`;
    this.bowl = null; this.renderBowl();
    sfx.clink();
    const good = result.rating === 'perfect' || result.rating === 'good';
    c.leaving = true;
    if (this.cameraFocus) await this.cameraFocus('full');
    this.setExpression(good ? 'happy' : result.rating === 'okay' ? 'confused' : 'angry', true);
    c.el.classList.add(good ? 'react-good' : 'react-bad');
    const mist = result.mistakes.slice(0, 3).map((m) => `<li>${t(`mistake.${m.key}`, {
      expected: m.expected ? t(m.key.includes('Broth') ? `broth.${m.expected}` : `noodle.${m.expected}`) : '', id: m.id ? t(`ing.${m.id}`) : '', qty: m.qty ?? '',
    })}</li>`).join('');
    if (this.showBubble) this.bubble(`<span class="who">${t(`cust.${c.def.id}`)}</span><div class="rating ${result.rating}">${t(`rating.${result.rating}`)} · ${result.score}</div><div>${t(`react.${result.rating}`)}</div>${mist ? `<ul class="mistakes">${mist}</ul>` : ''}`, 'react');
    if (good) this.sparkle(tx, ty - 260, 7);
    // money
    const st = this.state;
    st.money += result.payment + result.tip;
    st.stats.customers += 1; st.stats.revenue += result.payment; st.stats.tips += result.tip;
    if (good) st.stats.success += 1; else st.stats.fail += 1;
    if (result.rating === 'perfect') st.stats.perfect += 1;
    st.satisfaction = Math.max(0, Math.min(100, Math.round(st.satisfaction * 0.7 + result.score * 0.3)));
    sfx.coin();
    this.floatText(t('pay.earned', { money: result.payment }), tx, ty - 120);
    if (result.tip) setTimeout(() => this.floatText(t('pay.tip', { tip: result.tip }), tx + 90, ty - 160, P.sakura), 350);
    this.onHud?.(st, true);
    save({ day: st.day, money: st.money, satisfaction: st.satisfaction });
    this.updateFlow();
    await wait(3200);
    if (this.destroyed) return;
    this.bubble(null);
    // customer leaves
    c.el.classList.remove('react-good', 'react-bad');
    this.setExpression(good ? 'happy' : 'neutral', false);
    c.el.classList.add('walking');
    this.openDoor(true); sfx.door();
    c.el.style.transform = `translate(${LAYOUT.doorSpot[0]}px, ${LAYOUT.doorSpot[1]}px) scale(.94)`;
    this.layerEl('served-bowl').innerHTML = '';
    await wait(1650);
    c.el.remove(); this.openDoor(false);
    this.customer = null;
    this.busy = false;
    st.orderIdx += 1;
    this.updateFlow();
    this.nextCustomer(900);
  }

  endDay() {
    const st = this.state;
    this.onDayEnd?.({ ...st.stats, day: st.day, satisfaction: st.satisfaction, money: st.money });
  }
}

export { icon };
