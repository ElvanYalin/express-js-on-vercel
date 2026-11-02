// Scene composer: builds the restaurant from separate layered assets in a
// fixed 1920x1080 world (with bleed for wider/taller screens).
// Sorting layers (back → front) mirror the planned Unity sorting layers:
//   BG-Architecture, BG-Windows, BG-Decor, BG-Lanterns, BG-Furniture, BG-Characters,
//   BG-Staff, Door, Customers, Counter, CounterProps, Staff-Kitchen, KitchenSurface,
//   KitchenEquipment, Bowl, FX, (UI is DOM, above everything)

import { PALETTE as P, CUSTOMERS, EMPLOYEES, INGREDIENTS } from './data.js';
import { place, ASSETS } from './assets.js';
import { drawCharacter } from './characters.js';

export const WORLD = { w: 1920, h: 1080, bleedX: 210, bleedTop: 180, bleedBottom: 200 };

// Fixed layout anchors (world units). Documented in docs/02-screen-specifications.md
export const LAYOUT = {
  windows: [[600, 124], [980, 124]],
  pillars: [-30, 470, 1338, 1622],
  lanterns: [[230, 82, 0.85], [760, 82, 1], [1170, 82, 1], [1790, 82, 0.85]],
  banner: [372, 104],
  wallArt: [180, 160],
  shelf: [1680, 150],
  tables: [[300, 482], [1790, 482]],
  door: [1386, 140],
  plantSlots: [[540, 432], [1300, 432]],
  orderSpot: [960, 714],
  doorSpot: [1500, 714],
  servingTray: [960, 588],
  stove: [20, 788],
  pots: [[120, 826, 'shoyu'], [320, 826, 'miso'], [520, 826, 'tonkotsu']],
  cooker: [650, 768],
  baskets: [[780, 0], [700, 0], [860, 0]], // basket 0 is the player's; 1-2 unlock with Noodle Cooker Lv2/Lv3
  basketRaisedY: 800,
  basketLoweredY: 872,
  waterY: 816,
  noodleBoxes: [[640, 944, 'thin'], [780, 944, 'thick']],
  bowlStack: [990, 968],
  sauces: [[1078, 838, P.red], [1118, 842, P.walnut]],
  board: [1066, 872, 268, 112],
  bowl: [1200, 912],
  trays: { x: 1340, y: [758, 848], w: 104, gap: 6 },
  cuttingBoard: [1340, 942],
  taroSpot: [604, 800],
};

export const TRAY_ORDER = ['chashu', 'egg', 'nori', 'greenOnion', 'corn', 'chili', 'mushroom', 'bamboo', 'chicken', 'naruto'];
export const traySlotsForLevel = (lvl) => [6, 8, 10, 10, 10][Math.max(0, Math.min(4, lvl - 1))];

export function trayPos(i) {
  const { x, y, w, gap } = LAYOUT.trays;
  return [x + (i % 5) * (w + gap), y[Math.floor(i / 5)]];
}

/**
 * @param v variant: 'main' | 'empty' | 'upgraded' | 'customize'
 */
export function composeScene(v = 'main', opts = {}) {
  const upgraded = v === 'upgraded';
  const empty = v === 'empty';
  const lv = opts.levels || {};
  const cookerLevel = upgraded ? 4 : (lv.noodleCooker || 1);
  const brothLevel = upgraded ? 3 : (lv.brothStation || 1);
  const counterLevel = upgraded ? 5 : empty ? 1 : (lv.ingredientCounter || 3);
  const deco = opts.deco || {};
  const L = LAYOUT;
  const out = [];
  const layer = (name, content, extra = '') => out.push(`<g class="layer layer-${name}" ${extra}>${content}</g>`);

  // BG-Architecture
  layer('bg-architecture', ASSETS['bg-wall'].draw({ tint: deco.wall || P.plaster }) + L.pillars.map((x) => place('bg-pillar', x, 82)).join(''));
  // BG-Windows
  layer('bg-windows', L.windows.map(([x, y]) => place('bg-window', x, y, { rain: opts.rain })).join('')
    + `<g class="petals">${Array.from({ length: 7 }, (_, i) => `<g class="petal p${i}" style="--x:${620 + i * 96}px">${ASSETS['fx-petal'].draw()}</g>`).join('')}</g>`);
  // BG-Decor
  const decoParts = [place('bg-banner', ...L.banner, { color: empty ? P.woodDark : P.teal }), place('bg-shelf', ...L.shelf)];
  if (!empty) decoParts.push(place('deco-wall-art', ...L.wallArt, { variant: deco.wallArt || 'wave' }, 'id="slot-wallArt" class="deco-slot"'));
  else decoParts.push(`<rect x="${L.wallArt[0] + 18}" y="${L.wallArt[1] + 18}" width="114" height="154" fill="${P.plasterShade}" opacity=".7"/>`);
  if (upgraded || deco.plants) L.plantSlots.forEach(([x, y], i) => decoParts.push(place('deco-plant', x, y, { scale: 0.62, variant: (deco.plants || 'fern') }, `class="deco-slot" id="slot-plant${i}"`)));
  layer('bg-decor', decoParts.join(''));
  // BG-Furniture + BG-Characters (seated guests)
  let furn = '';
  L.tables.forEach(([x, y], i) => {
    furn += place('bg-stool', x - 112, y + 26) + place('bg-stool', x + 112, y + 26);
    const seated = (!empty && i === 0) || upgraded;
    if (seated) {
      const guest = CUSTOMERS[(i + 3) % CUSTOMERS.length];
      furn += `<g transform="translate(${x - 100} ${y + 96}) scale(.5)" class="bg-guest idle-breathe">${drawCharacter(guest.look, { expression: 'happy', view: 'threeQuarter' })}</g>`;
      if (upgraded) furn += `<g transform="translate(${x + 100} ${y + 96}) scale(.5)" class="bg-guest idle-breathe d2">${drawCharacter(CUSTOMERS[(i + 1) % CUSTOMERS.length].look, { expression: 'neutral', view: 'threeQuarter' })}</g>`;
    }
    furn += place('bg-dining-table', x, y);
  });
  layer('bg-furniture', furn);
  // BG-Lanterns
  const lanterns = L.lanterns.map(([x, y, s], i) => {
    const lit = !empty || i === 1;
    const color = deco.lanterns === 'teal' ? P.teal : deco.lanterns === 'sakura' ? P.sakura : P.red;
    return `<g class="lantern-sway s${i}" style="transform-origin:${x}px ${y}px" ${i === 2 ? 'id="slot-lantern" ' : ''}>${place('bg-lantern', x, y, { scale: s, lit, color })}</g>`;
  }).join('');
  layer('bg-lanterns', lanterns);
  // Door
  layer('door', place('bg-door', ...L.door, { open: 0 }), 'id="door"');
  // Customers (between background and counter)
  layer('customers', '', 'id="customer-layer"');
  // Counter + props
  layer('counter', ASSETS['kitchen-counter'].draw());
  layer('counter-props', `<g id="serving-tray" transform="translate(${L.servingTray[0]} ${L.servingTray[1]})">${ASSETS['kitchen-serving-tray'].draw()}</g><g id="served-bowl"></g>`);
  // Staff-Kitchen: drawn after the counter and before the worktop, so the
  // worktop hides their legs — they always read as "behind the counter".
  let staff = '';
  if (upgraded || opts.staff) {
    staff += `<g class="staff idle-breathe" transform="translate(${LAYOUT.taroSpot[0]} ${LAYOUT.taroSpot[1]}) scale(.8)">${drawCharacter(EMPLOYEES[0].look, { expression: 'happy', view: 'threeQuarter' })}</g>`;
  }
  layer('staff-kitchen', staff);
  if (upgraded) {
    out.splice(out.findIndex((s) => s.includes('layer-door')), 0,
      `<g class="layer layer-bg-staff"><g class="idle-breathe d2" transform="translate(1236 604) scale(.56)">${drawCharacter(EMPLOYEES[2].look, { expression: 'happy', view: 'threeQuarter', pose: 'carry' })}</g></g>`);
  }
  // Kitchen surface
  layer('kitchen-surface', ASSETS['kitchen-worktop'].draw());
  // Kitchen equipment
  let eq = '';
  eq += place('equip-stove', ...L.stove);
  eq += L.pots.map(([x, y, broth]) => `<g class="pot interactive" data-broth="${broth}" id="pot-${broth}" transform="translate(${x} ${y})">
      <g class="steam-anchor" transform="translate(0 -170)">${ASSETS['fx-steam'].draw({ strength: 0.9 })}</g>
      ${ASSETS['equip-broth-pot'].draw({ broth, level: brothLevel })}<rect class="hit" x="-95" y="-180" width="190" height="190" fill="transparent"/></g>`).join('');
  eq += `<g id="cooker" transform="translate(${L.cooker[0]} ${L.cooker[1]})">${ASSETS['equip-noodle-cooker'].draw({ level: cookerLevel })}
      <g class="steam-anchor" transform="translate(130 20)">${ASSETS['fx-steam'].draw({ strength: 0.7 })}</g></g>`;
  const basketCount = Math.min(3, cookerLevel);
  for (let i = 0; i < basketCount; i++) {
    const bx = L.baskets[i][0];
    const loaded = upgraded && i > 0 ? (i === 1 ? 'thick' : 'thin') : null;
    eq += `<g class="basket-wrap" id="basket-${i}" data-x="${bx}">
      <g class="basket interactive" transform="translate(${bx} ${loaded ? L.basketLoweredY : L.basketRaisedY})">${ASSETS['equip-noodle-basket'].draw({ noodles: loaded })}<rect class="hit" x="-60" y="-140" width="120" height="150" fill="transparent"/></g></g>`;
  }
  // water front lip hides lowered baskets
  eq += `<g pointer-events="none"><path d="M${L.cooker[0] + 12} ${L.waterY + 2} a118 20 0 0 0 236 0 v26 h-236z" fill="#9FC9C2" opacity=".85"/><path d="M${L.cooker[0] + 6} ${L.waterY + 4} a124 22 0 0 0 248 0" fill="none" stroke="${P.ink}" stroke-width="4"/></g>`;
  eq += `<g id="timer-ring" class="hidden"></g>`;
  eq += L.noodleBoxes.map(([x, y, type]) => `<g class="noodle-box interactive draggable" data-noodle="${type}" transform="translate(${x} ${y})">${ASSETS['equip-noodle-box'].draw({ type })}</g>`).join('');
  eq += `<g id="bowl-stack" class="interactive" transform="translate(${L.bowlStack[0]} ${L.bowlStack[1]})">${ASSETS['equip-bowl-stack'].draw(upgraded ? { design: { body: '#FBE3E9', band: P.sakura } } : undefined)}<rect class="hit" x="-72" y="-120" width="144" height="128" fill="transparent"/></g>`;
  eq += L.sauces.map(([x, y, c]) => place('equip-sauce-bottle', x, y, { color: c })).join('');
  const [bx, by, bw, bh] = L.board;
  eq += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="14" fill="#D9A97E" stroke="${P.ink}" stroke-width="4"/><rect x="${bx + 8}" y="${by + 6}" width="${bw - 16}" height="10" rx="4" fill="#EBC9A4"/>`;
  const slots = traySlotsForLevel(counterLevel);
  TRAY_ORDER.forEach((id, i) => {
    const [x, y] = trayPos(i);
    const locked = i >= slots;
    eq += `<g class="tray ${locked ? 'locked' : 'interactive draggable'}" data-ingredient="${id}" transform="translate(${x} ${y})">${ASSETS['equip-ingredient-tray'].draw({ id, locked })}${locked ? `<g transform="translate(36 30) scale(.5)">${'<rect x="14" y="28" width="36" height="28" rx="6" fill="#A9A39B" stroke="#292323" stroke-width="3"/><path d="M22 28 v-8 a10 10 0 0 1 20 0 v8" fill="none" stroke="#292323" stroke-width="4"/>'}</g>` : ''}</g>`;
  });
  eq += place('equip-cutting-board', ...L.cuttingBoard, { level: upgraded ? 2 : 1 });
  if (upgraded) {
    eq += place('equip-refrigerator', -170, 690, { scale: 0.9 });
    eq += place('equip-sink', 1580, 940, { scale: 1.1 });
  }
  layer('kitchen-equipment', eq);
  // Bowl (assembly)
  layer('bowl', '', `id="bowl-layer" transform="translate(${L.bowl[0]} ${L.bowl[1]})"`);
  layer('fx', '', 'id="fx-layer"');
  return out.join('');
}

export function viewBoxFor(aspect, focus = 'full') {
  if (focus === 'kitchen') {
    // Cooking camera: keep the whole kitchen width, crop ceiling/background.
    // On wide phones this enlarges every kitchen touch target by ~20%.
    const w = 1940, h = Math.min(1080, w / aspect);
    return [960 - w / 2, 1072 - h, w, h];
  }
  const { bleedX, bleedTop, bleedBottom } = WORLD;
  if (aspect >= 16 / 9) {
    const w = Math.min(1080 * aspect, 1920 + bleedX * 2);
    const h = w / aspect;
    return [960 - w / 2, 540 - h / 2, w, h];
  }
  const h = Math.min(1920 / aspect, 1080 + bleedTop + bleedBottom);
  const w = h * aspect;
  // Grow mostly upward (ceiling) and slightly into the worktop.
  const extra = h - 1080;
  return [960 - w / 2, -extra * 0.55, w, h];
}

export { INGREDIENTS };
