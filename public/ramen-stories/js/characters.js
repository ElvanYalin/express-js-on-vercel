// Ramen Stories — reusable character rig.
// One parametric body/face renderer drives every customer and employee, so new
// characters are pure data (see data.js `look`). Parts are grouped exactly as
// the planned Unity 2D Animation (PSB bones) rig: legs, torso, arm-l, arm-r,
// head, hair-back, hair-front, face/eyes, face/brows, face/mouth, accessory.
// Origin is at the feet (0,0); a regular build is ~420 units tall.

import { PALETTE as P } from './data.js';
import { stroke } from './assets.js';

const INK = P.ink;
const S4 = stroke(4);
const S3 = stroke(3);

export const EXPRESSIONS = ['neutral', 'happy', 'angry', 'confused', 'surprised'];
export const VIEWS = ['front', 'threeQuarter', 'side'];

const BUILDS = {
  slim: { w: 96, h: 1 }, regular: { w: 110, h: 1 }, athletic: { w: 122, h: 1.02 },
  round: { w: 134, h: 0.96 }, tall: { w: 104, h: 1.08 },
};

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};

function eyes(expr, dx) {
  const L = -24 + dx, R = 24 + dx, y = -6;
  switch (expr) {
    case 'happy':
      return `<path d="M${L - 10} ${y + 2} q10 -12 20 0 M${R - 10} ${y + 2} q10 -12 20 0" fill="none" ${stroke(5)}/>`;
    case 'angry':
      return `<ellipse cx="${L}" cy="${y + 2}" rx="7" ry="6" fill="${INK}"/><ellipse cx="${R}" cy="${y + 2}" rx="7" ry="6" fill="${INK}"/>`;
    case 'surprised':
      return `<circle cx="${L}" cy="${y}" r="11" fill="#FFF" ${S3}/><circle cx="${R}" cy="${y}" r="11" fill="#FFF" ${S3}/><circle cx="${L}" cy="${y}" r="5" fill="${INK}"/><circle cx="${R}" cy="${y}" r="5" fill="${INK}"/>`;
    case 'confused':
      return `<ellipse cx="${L}" cy="${y}" rx="7" ry="9" fill="${INK}"/><path d="M${R - 9} ${y} h18" ${stroke(5)}/>`;
    default:
      return `<ellipse cx="${L}" cy="${y}" rx="7" ry="10" fill="${INK}"/><ellipse cx="${R}" cy="${y}" rx="7" ry="10" fill="${INK}"/>
        <circle cx="${L + 2}" cy="${y - 4}" r="2.6" fill="#FFF"/><circle cx="${R + 2}" cy="${y - 4}" r="2.6" fill="#FFF"/>`;
  }
}

function brows(expr, dx, hair) {
  const L = -24 + dx, R = 24 + dx, y = -26;
  const c = `stroke="${shade(hair, -0.1)}" stroke-width="5" stroke-linecap="round" fill="none"`;
  switch (expr) {
    case 'angry': return `<path d="M${L - 10} ${y - 4} l20 8 M${R + 10} ${y - 4} l-20 8" ${c}/>`;
    case 'surprised': return `<path d="M${L - 9} ${y - 6} q9 -7 18 0 M${R - 9} ${y - 6} q9 -7 18 0" ${c}/>`;
    case 'confused': return `<path d="M${L - 9} ${y + 2} q9 -3 18 2 M${R - 9} ${y - 8} q9 -8 18 0" ${c}/>`;
    case 'happy': return `<path d="M${L - 9} ${y - 2} q9 -6 18 0 M${R - 9} ${y - 2} q9 -6 18 0" ${c}/>`;
    default: return `<path d="M${L - 9} ${y} q9 -4 18 0 M${R - 9} ${y} q9 -4 18 0" ${c}/>`;
  }
}

function mouth(expr, dx, open) {
  const x = dx, y = 26;
  if (open) return `<ellipse cx="${x}" cy="${y + 2}" rx="11" ry="9" fill="${P.redDeep}" ${S3}/><ellipse cx="${x}" cy="${y + 7}" rx="6" ry="3" fill="${P.sakura}"/>`;
  switch (expr) {
    case 'happy': return `<path d="M${x - 16} ${y - 4} q16 22 32 0z" fill="${P.redDeep}" ${S3}/><path d="M${x - 8} ${y + 6} q8 4 16 0" stroke="${P.sakura}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'angry': return `<path d="M${x - 14} ${y + 6} q14 -12 28 0" fill="none" ${stroke(4.5)}/>`;
    case 'surprised': return `<ellipse cx="${x}" cy="${y + 2}" rx="8" ry="11" fill="${P.redDeep}" ${S3}/>`;
    case 'confused': return `<path d="M${x - 14} ${y + 2} q7 -6 14 0 t14 0" fill="none" ${stroke(4.5)}/>`;
    default: return `<path d="M${x - 10} ${y} q10 8 20 0" fill="none" ${stroke(4.5)}/>`;
  }
}

function hairBack(style, c) {
  switch (style) {
    case 'bob': return `<path d="M-74 -10 q-6 -80 74 -84 q80 4 74 84 q2 40 -14 54 h-120 q-16 -14 -14 -54z" fill="${c}" ${S4}/>`;
    case 'ponytail': return `<path d="M54 -50 q60 -10 50 60 q-6 30 -26 40 q16 -40 -14 -70z" fill="${c}" ${S4}/>`;
    case 'bun': return `<circle cx="0" cy="-86" r="26" fill="${c}" ${S4}/>`;
    case 'curly': return `<g fill="${c}" ${S4}>${[[-62, -30], [-66, 0], [62, -30], [66, 0]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20"/>`).join('')}</g>`;
    default: return '';
  }
}

function hairFront(style, c) {
  const hi = shade(c, 0.12);
  switch (style) {
    case 'bob': return `<path d="M-70 -14 q0 -66 70 -66 q70 0 70 66 q-30 -30 -54 -26 q-10 18 -34 18 q-26 -2 -52 8z" fill="${c}" ${S4}/><path d="M-30 -64 q24 -8 46 0" stroke="${hi}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'parted': return `<path d="M-68 -10 q-6 -70 66 -72 q74 2 70 72 q-14 -36 -40 -42 q-40 2 -54 -14 q-20 30 -42 56z" fill="${c}" ${S4}/><path d="M10 -70 q26 2 40 18" stroke="${hi}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    case 'ponytail': return `<path d="M-68 -12 q-2 -68 68 -70 q70 2 68 70 q-26 -34 -66 -30 q-40 0 -70 30z" fill="${c}" ${S4}/>`;
    case 'bald': return `<path d="M-68 -2 q-4 -24 6 -34 q4 22 -6 34z M68 -2 q4 -24 -6 -34 q-4 22 6 34z" fill="${c}" ${S3}/><path d="M-30 -62 q20 -8 40 -2" stroke="#FFF" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>`;
    case 'curly': return `<g fill="${c}" ${S4}>${[[-48, -54], [-20, -70], [12, -72], [42, -60], [62, -36], [-64, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="24"/>`).join('')}</g>`;
    case 'bun': return `<path d="M-68 -8 q-2 -68 68 -68 q70 0 68 68 q-30 -38 -68 -38 q-38 0 -68 38z" fill="${c}" ${S4}/>`;
    default: return `<path d="M-68 -14 q-4 -64 68 -66 q72 2 68 66 q-20 -20 -40 -18 l-10 -16 l-12 18 l-14 -18 l-12 18 q-30 -2 -48 16z" fill="${c}" ${S4}/>`;
  }
}

function accessoryHead(acc, look) {
  switch (acc) {
    case 'glasses': return `<g fill="none" ${stroke(4)}><circle cx="-24" cy="-6" r="17" fill="#FFF" fill-opacity=".18"/><circle cx="24" cy="-6" r="17" fill="#FFF" fill-opacity=".18"/><path d="M-7 -8 q7 -5 14 0"/></g>`;
    case 'headband': return `<path d="M-70 -34 q70 -26 140 0 v16 q-70 -26 -140 0z" fill="${look.topAccent}" ${S3}/>`;
    case 'hachimaki': return `<path d="M-70 -36 q70 -24 140 0 v16 q-70 -24 -140 0z" fill="#FFF" ${S3}/><circle cx="0" cy="-37" r="7" fill="${P.red}"/><path d="M68 -28 l26 -12 l-6 22z" fill="#FFF" ${S3}/>`;
    case 'chefBandana': return `<path d="M-72 -26 q-6 -62 72 -64 q78 2 72 64 q-72 -22 -144 0z" fill="${look.topAccent}" ${S4}/><path d="M-50 -60 q50 -16 100 0" stroke="${P.cream}" stroke-width="4" fill="none" opacity=".5"/>`;
    default: return '';
  }
}

function accessoryBody(acc, look, bw) {
  switch (acc) {
    case 'tie': return `<path d="M0 -270 l-10 12 l10 70 l10 -70z" fill="${look.topAccent}" ${stroke(3)}/>`;
    case 'camera': return `<path d="M${-bw / 2 + 8} -280 L18 -206 M${bw / 2 - 8} -280 L-18 -206" stroke="${INK}" stroke-width="5"/><rect x="-26" y="-218" width="52" height="34" rx="6" fill="${INK}"/><circle cx="0" cy="-201" r="11" fill="${P.teal}" ${stroke(3, '#FFF')}/>`;
    case 'apron': return `<path d="M${-bw / 2 + 10} -230 h${bw - 20} v120 h-${bw - 20}z" fill="${P.walnut}" ${S3}/>`;
    case 'cane': return `<path d="M${bw / 2 + 30} 0 v-150 q0 -20 -18 -20" fill="none" ${stroke(8)}/><path d="M${bw / 2 + 30} 0 v-150 q0 -20 -18 -20" fill="none" stroke="${P.wood}" stroke-width="4" stroke-linecap="round"/>`;
    default: return '';
  }
}

/**
 * Render a character.
 * @param look   rig parameters (skin, hair, hairStyle, top, topAccent, bottom, accessory, build)
 * @param opts   { expression, talking, view, pose: 'stand'|'seated'|'carry', blink: bool }
 */
export function drawCharacter(look, opts = {}) {
  const { expression = 'neutral', talking = false, view = 'front', pose = 'stand' } = opts;
  const b = BUILDS[look.build] || BUILDS.regular;
  const bw = b.w;
  const dx = view === 'threeQuarter' ? 10 : view === 'side' ? 24 : 0;
  const skinS = shade(look.skin, -0.12);
  const topS = shade(look.top, -0.12);
  const blush = expression === 'angry' ? `<ellipse cx="0" cy="-20" rx="56" ry="22" fill="${P.red}" opacity=".18"/>` : '';

  const legs = pose === 'seated' ? '' : `<g class="rig-legs">
      <path d="M-30 -150 h24 v138 h-24z" fill="${look.bottom}" ${S4}/><path d="M6 -150 h24 v138 h-24z" fill="${look.bottom}" ${S4}/>
      <path d="M-38 -14 h34 q4 14 -6 14 h-30z" fill="${INK}"/><path d="M4 -14 h34 q8 14 -4 14 h-30z" fill="${INK}"/></g>`;
  const torsoY = -150;
  const torso = `<g class="rig-torso">
      <path d="M${-bw / 2} ${torsoY} v-104 q0 -30 30 -32 h${bw - 60} q30 2 30 32 v104z" fill="${look.top}" ${S4}/>
      <path d="M${-bw / 2 + 10} ${torsoY - 20} h${bw - 20}" stroke="${topS}" stroke-width="6" opacity=".6"/>
      <path d="M-22 -286 l22 26 l22 -26" fill="${look.topAccent}" ${S3}/>
      ${accessoryBody(look.accessory, look, bw)}</g>`;
  const armL = `<g class="rig-arm-l"><path d="M${-bw / 2 + 4} -270 q-22 10 -24 80 v28" stroke="${INK}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M${-bw / 2 + 4} -270 q-22 10 -24 80 v28" stroke="${look.top}" stroke-width="22" fill="none" stroke-linecap="round"/><circle cx="${-bw / 2 - 20}" cy="-156" r="14" fill="${look.skin}" ${S3}/></g>`;
  const armR = pose === 'carry'
    ? `<g class="rig-arm-r"><path d="M${bw / 2 - 4} -270 q30 20 10 70 h-40" stroke="${INK}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M${bw / 2 - 4} -270 q30 20 10 70 h-40" stroke="${look.top}" stroke-width="22" fill="none" stroke-linecap="round"/><circle cx="${bw / 2 - 34}" cy="-200" r="14" fill="${look.skin}" ${S3}/></g>`
    : `<g class="rig-arm-r"><path d="M${bw / 2 - 4} -270 q22 10 24 80 v28" stroke="${INK}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M${bw / 2 - 4} -270 q22 10 24 80 v28" stroke="${look.top}" stroke-width="22" fill="none" stroke-linecap="round"/><circle cx="${bw / 2 + 20}" cy="-156" r="14" fill="${look.skin}" ${S3}/></g>`;

  const head = `<g class="rig-head" transform="translate(0 -360)">
      ${hairBack(look.hairStyle, look.hair)}
      <rect x="-16" y="56" width="32" height="30" fill="${skinS}" ${S3}/>
      <ellipse cx="${view === 'side' ? 10 : 0}" cy="0" rx="68" ry="70" fill="${look.skin}" ${S4}/>
      ${view !== 'side' ? `<ellipse cx="-68" cy="6" rx="10" ry="15" fill="${look.skin}" ${S3}/>` : ''}<ellipse cx="68" cy="6" rx="10" ry="15" fill="${look.skin}" ${S3}/>
      ${blush}
      <ellipse cx="${-40 + dx}" cy="16" rx="12" ry="7" fill="${P.sakura}" opacity=".7"/><ellipse cx="${40 + dx}" cy="16" rx="12" ry="7" fill="${P.sakura}" opacity=".7"/>
      <g class="rig-eyes">${eyes(expression, dx)}</g>
      <g class="rig-brows">${brows(expression, dx, look.hair)}</g>
      <path d="M${dx + 2} 4 q4 8 -2 10" stroke="${skinS}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <g class="rig-mouth">
        <g class="mouth-closed">${mouth(expression, dx, false)}</g>
        <g class="mouth-open">${mouth(expression, dx, true)}</g>
      </g>
      ${hairFront(look.hairStyle, look.hair)}
      ${accessoryHead(look.accessory, look)}
    </g>`;

  const fx = expression === 'confused'
    ? `<g transform="translate(86 -460)"><path d="M0 0 q14 -16 26 -2 q8 14 -10 20 v10" fill="none" ${stroke(6)}/><circle cx="16" cy="44" r="4" fill="${INK}"/></g>`
    : expression === 'angry' ? `<g transform="translate(70 -470)" fill="${P.red}"><path d="M0 0 l8 14 l14 -8 l-8 14 l14 8 l-14 0 l0 14 l-8 -14 l-14 8 l8 -14 l-14 -8 l14 0z"/></g>`
    : expression === 'happy' ? `<g transform="translate(-100 -470)"><path d="M0 0 q4 14 18 18 q-14 4 -18 18 q-4 -14 -18 -18 q14 -4 18 -18z" fill="${P.gold}" ${stroke(2)}/></g>` : '';

  return `<g class="character ${talking ? 'is-talking' : ''}" data-expression="${expression}">
    <ellipse cx="0" cy="0" rx="${bw / 2 + 16}" ry="10" fill="${INK}" opacity=".22"/>
    <g class="rig-body" transform="scale(${b.h > 1 ? 1 : 1} ${b.h})">${legs}${armL}${torso}${armR}${head}</g>${fx}</g>`;
}

/** Bust portrait (cards, dialogue). viewBox suggestion: -130 -470 260 300 */
export function drawPortrait(look, opts = {}) {
  return drawCharacter(look, { ...opts, pose: 'stand' });
}
