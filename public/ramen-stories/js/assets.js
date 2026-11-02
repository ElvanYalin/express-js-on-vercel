// Ramen Stories — vector asset library (Phase 1 style-locked production layers).
// Every interactive object is its own asset. No text is ever baked into art.
// Each entry: { category, layer, box:[x,y,w,h], draw(opts) => SVG markup }.
// `box` is the asset's own viewBox (used by tools/export-assets.mjs).
// Pure string generation: importable in the browser and in Node.

import { PALETTE as P, BROTHS } from './data.js';

let _uid = 0;
export const uid = (p = 'g') => `${p}${(++_uid).toString(36)}`;
export const resetUid = () => { _uid = 0; };

const INK = P.ink;
export const stroke = (w = 4, c = INK) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const S4 = stroke(4);
const S3 = stroke(3);
const S2 = stroke(2);

const lin = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;

// ---------------------------------------------------------------- ENVIRONMENT
const wall = {
  category: 'Backgrounds', layer: 'bg-architecture', box: [-260, -200, 2440, 820],
  draw({ tint = P.plaster } = {}) {
    const g = uid('wall'), w = uid('wains'), c = uid('ceil');
    let planks = '';
    for (let x = -260; x < 2180; x += 60) planks += `<line x1="${x}" y1="452" x2="${x}" y2="600" stroke="${P.woodDark}" stroke-width="2" opacity=".45"/>`;
    let beamEnds = '';
    for (let x = -200; x < 2180; x += 240) beamEnds += `<rect x="${x}" y="-12" width="54" height="40" rx="5" fill="${P.woodDark}" ${S3}/><rect x="${x + 8}" y="-6" width="38" height="10" rx="4" fill="${P.wood}" opacity=".6"/>`;
    let brush = '';
    for (let i = 0; i < 26; i++) {
      const x = -200 + ((i * 397) % 2360), y = 110 + ((i * 131) % 300);
      brush += `<path d="M${x} ${y} q 40 -8 90 0" stroke="${P.plasterShade}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>`;
    }
    return `<defs>${lin(g, [[0, '#FBEFD9'], [0.6, tint], [1, P.plasterShade]])}
      ${lin(w, [[0, P.woodLight], [1, P.wood]])}${lin(c, [[0, P.walnutDeep], [1, P.walnut]])}</defs>
      <rect x="-260" y="-200" width="2440" height="820" fill="url(#${g})"/>
      ${brush}
      <rect x="-260" y="-200" width="2440" height="240" fill="url(#${c})"/>
      ${beamEnds}
      <rect x="-260" y="36" width="2440" height="46" fill="${P.wood}" ${S4}/>
      <rect x="-260" y="42" width="2440" height="8" fill="${P.woodLight}" opacity=".7"/>
      <rect x="-260" y="82" width="2440" height="14" fill="${P.walnut}" opacity=".25"/>
      <rect x="-260" y="440" width="2440" height="180" fill="url(#${w})"/>
      ${planks}
      <rect x="-260" y="430" width="2440" height="22" fill="${P.woodDark}" ${S3}/>
      <rect x="-260" y="433" width="2440" height="5" fill="${P.woodLight}" opacity=".6"/>`;
  },
};

const pillar = {
  category: 'Backgrounds', layer: 'bg-architecture', box: [0, 0, 56, 560],
  draw() {
    const g = uid('pil');
    return `<defs>${lin(g, [[0, P.woodLight], [0.5, P.wood], [1, P.woodDark]], 1, 0)}</defs>
      <rect x="4" y="0" width="48" height="560" fill="url(#${g})" ${S4}/>
      <path d="M16 30 q4 120 0 240 M36 90 q-4 160 2 330" stroke="${P.woodDark}" stroke-width="2" fill="none" opacity=".5"/>`;
  },
};

const windowAsset = {
  category: 'Backgrounds', layer: 'bg-windows', box: [0, 0, 340, 290],
  draw({ time = 'dusk', rain = false } = {}) {
    const sky = uid('sky'), clip = uid('wclip'), glow = uid('wglow');
    const skyStops = time === 'night'
      ? [[0, '#22344A'], [1, '#4F5E78']]
      : rain ? [[0, '#8FA9A8'], [1, '#C9C7B8']] : [[0, P.teal], [0.55, '#BFD8C8'], [1, P.gold]];
    const blossom = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.sakura}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.3}" r="${r * 0.55}" fill="#F8C6D3"/>`;
    let rainLines = '';
    if (rain) for (let i = 0; i < 22; i++) rainLines += `<line x1="${(i * 37) % 330}" y1="${(i * 53) % 260}" x2="${((i * 37) % 330) - 8}" y2="${((i * 53) % 260) + 26}" stroke="#E8F1F0" stroke-width="2" opacity=".7"/>`;
    return `<defs>${lin(sky, skyStops)}${rad(glow, [[0, '#FFF6E0', 0.8], [1, '#FFF6E0', 0]])}
      <clipPath id="${clip}"><rect x="16" y="16" width="308" height="250"/></clipPath></defs>
      <g clip-path="url(#${clip})">
        <rect x="16" y="16" width="308" height="250" fill="url(#${sky})"/>
        <circle cx="250" cy="70" r="60" fill="url(#${glow})"/>
        <path d="M16 210 l40 -30 l40 30 l30 -24 l50 24 l40 -36 l60 36 l48 -20 v80 h-308z" fill="${P.tealDeep}" opacity=".55"/>
        <path d="M16 236 h308 v30 h-308z" fill="${P.tealDeep}" opacity=".7"/>
        <path d="M70 266 q6 -60 -6 -110 q24 30 26 110z" fill="${P.woodDark}"/>
        <path d="M60 170 q-30 -20 -44 -10 M70 150 q30 -40 70 -30" stroke="${P.woodDark}" stroke-width="7" fill="none" stroke-linecap="round"/>
        ${blossom(40, 120, 38)}${blossom(100, 96, 44)}${blossom(150, 130, 30)}${blossom(20, 168, 26)}${blossom(120, 160, 24)}
        <circle cx="200" cy="230" r="3" fill="${P.sakura}"/><circle cx="240" cy="200" r="2.5" fill="${P.sakura}"/>
        ${rainLines}
      </g>
      <rect x="8" y="8" width="324" height="266" rx="6" fill="none" stroke="${P.walnut}" stroke-width="18"/>
      <rect x="8" y="8" width="324" height="266" rx="6" fill="none" ${S4}/>
      <rect x="16" y="16" width="308" height="250" fill="none" ${S3}/>
      <g stroke="${P.walnut}" stroke-width="7">
        <line x1="119" y1="16" x2="119" y2="266"/><line x1="221" y1="16" x2="221" y2="266"/><line x1="16" y1="141" x2="324" y2="141"/>
      </g>
      <rect x="-4" y="272" width="348" height="18" rx="4" fill="${P.wood}" ${S4}/>`;
  },
};

const lantern = {
  category: 'Backgrounds', layer: 'bg-lanterns', box: [-60, 0, 120, 210],
  draw({ color = P.red, lit = true } = {}) {
    const body = uid('lan'), glow = uid('lglow');
    return `<defs>${rad(body, [[0, lit ? P.gold : color], [0.55, lit ? P.lantern : color], [1, color]], 0.45, 0.45, 0.6)}
      ${rad(glow, [[0, P.lantern, 0.55], [1, P.lantern, 0]])}</defs>
      ${lit ? `<circle cx="0" cy="130" r="95" fill="url(#${glow})" class="lantern-glow"/>` : ''}
      <line x1="0" y1="0" x2="0" y2="62" ${S3}/>
      <rect x="-22" y="58" width="44" height="16" rx="4" fill="${INK}"/>
      <ellipse cx="0" cy="128" rx="50" ry="58" fill="url(#${body})" ${S4}/>
      <g stroke="${P.redDeep}" stroke-width="2.5" fill="none" opacity=".75">
        <path d="M-48 112 q48 10 96 0"/><path d="M-50 130 q50 10 100 0"/><path d="M-46 148 q46 10 92 0"/><path d="M-36 166 q36 8 72 0"/><path d="M-38 92 q38 8 76 0"/>
      </g>
      <path d="M-20 90 q-10 38 0 76" stroke="#FFF6E0" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>
      <rect x="-24" y="180" width="48" height="16" rx="4" fill="${INK}"/>
      <path d="M-6 196 v12 M0 196 v14 M6 196 v12" stroke="${P.red}" stroke-width="3" stroke-linecap="round"/>`;
  },
};

const banner = {
  category: 'Backgrounds', layer: 'bg-decor', box: [0, 0, 96, 300],
  draw({ color = P.teal } = {}) {
    return `<rect x="0" y="0" width="96" height="14" rx="6" fill="${P.wood}" ${S3}/>
      <path d="M8 14 h80 v250 l-40 30 l-40 -30z" fill="${color}" ${S4}/>
      <path d="M8 14 h80 v20 h-80z" fill="${INK}" opacity=".15"/>
      <circle cx="48" cy="120" r="28" fill="${P.cream}" ${S3}/>
      <path d="M28 120 h40 a20 18 0 0 1 -40 0z" fill="${P.red}" ${S2}/>
      <path d="M36 108 q4 -14 0 -22 M48 106 q4 -14 0 -22 M60 108 q4 -14 0 -22" stroke="${P.cream}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M22 190 h52 M22 210 h52 M22 230 h40" stroke="${P.cream}" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
  },
};

const shelf = {
  category: 'Backgrounds', layer: 'bg-decor', box: [0, 0, 220, 190],
  draw() {
    const jar = (x, c, h) => `<rect x="${x}" y="${78 - h}" width="34" height="${h}" rx="9" fill="${c}" ${S3}/><rect x="${x + 4}" y="${72 - h}" width="26" height="9" rx="3" fill="${P.wood}" ${S2}/>`;
    const bowlIcon = (x, y, c) => `<path d="M${x} ${y} h44 a22 18 0 0 1 -44 0z" fill="${c}" ${S3}/><path d="M${x + 6} ${y + 6} h32" stroke="${P.cream}" stroke-width="3" opacity=".6"/>`;
    return `<rect x="0" y="78" width="220" height="14" rx="3" fill="${P.wood}" ${S3}/>
      <rect x="0" y="168" width="220" height="14" rx="3" fill="${P.wood}" ${S3}/>
      <path d="M20 92 l10 18 M200 92 l-10 18 M20 182 l10 8 M200 182 l-10 8" ${S3}/>
      ${jar(14, P.teal, 46)}${jar(58, P.cream, 58)}${jar(102, P.lantern, 40)}
      <path d="M150 78 q10 -50 34 -60 q8 30 -6 60z" fill="#7DAA6A" ${S3}/><rect x="146" y="58" width="40" height="22" rx="5" fill="${P.red}" ${S3}/>
      ${bowlIcon(14, 146, P.red)}${bowlIcon(70, 146, P.cream)}${bowlIcon(126, 146, P.teal)}
      <circle cx="194" cy="150" r="14" fill="${P.gold}" ${S3}/>`;
  },
};

const wallArt = {
  category: 'Decorations', layer: 'bg-decor', box: [0, 0, 150, 190],
  draw({ variant = 'wave' } = {}) {
    const art = variant === 'wave'
      ? `<path d="M22 130 q30 -60 60 -20 q-20 -6 -22 14 q30 -50 70 -10 v42 h-108z" fill="${P.teal}" ${S3}/><circle cx="108" cy="56" r="16" fill="${P.red}"/>`
      : `<path d="M30 140 q46 -90 90 0z" fill="${P.tealDeep}" ${S3}/><path d="M62 82 l13 -16 l13 16z" fill="${P.cream}"/><circle cx="44" cy="56" r="14" fill="${P.lantern}"/>`;
    return `<rect x="6" y="6" width="138" height="178" rx="4" fill="${P.walnut}" ${S4}/>
      <rect x="18" y="18" width="114" height="154" fill="${P.cream}" ${S2}/>${art}`;
  },
};

const plant = {
  category: 'Decorations', layer: 'bg-decor', box: [-60, -170, 120, 170],
  draw({ variant = 'fern' } = {}) {
    const leaves = variant === 'fern'
      ? `<path d="M0 -60 q-50 -40 -54 -100 q30 20 54 100z" fill="#7DAA6A" ${S3}/><path d="M0 -60 q46 -50 56 -96 q-36 26 -56 96z" fill="#91BC79" ${S3}/><path d="M0 -60 q-6 -70 6 -110 q14 50 -6 110z" fill="#6A9659" ${S3}/>`
      : `<circle cx="-18" cy="-92" r="30" fill="#6A9659" ${S3}/><circle cx="20" cy="-100" r="34" fill="#7DAA6A" ${S3}/><circle cx="0" cy="-130" r="26" fill="#91BC79" ${S3}/>`;
    return `${leaves}<path d="M-34 -64 h68 l-8 64 h-52z" fill="${P.red}" ${S4}/><rect x="-38" y="-70" width="76" height="14" rx="4" fill="${P.redDeep}" ${S3}/>`;
  },
};

const diningTable = {
  category: 'Backgrounds', layer: 'bg-furniture', box: [-170, -20, 340, 150],
  draw() {
    return `<rect x="-160" y="0" width="320" height="22" rx="6" fill="${P.wood}" ${S4}/>
      <rect x="-154" y="4" width="308" height="6" rx="3" fill="${P.woodLight}" opacity=".7"/>
      <rect x="-130" y="22" width="20" height="108" fill="${P.woodDark}" ${S3}/><rect x="110" y="22" width="20" height="108" fill="${P.woodDark}" ${S3}/>
      <path d="M-46 -2 h40 a20 16 0 0 1 -40 0z" fill="${P.cream}" ${S3}/><path d="M-40 -14 q4 -10 0 -18 M-28 -14 q4 -10 0 -18" stroke="${P.cream}" stroke-width="3" fill="none" class="steam-mini" opacity=".8"/>
      <path d="M40 -2 h34 a17 14 0 0 1 -34 0z" fill="${P.teal}" ${S3}/><line x1="30" y1="-20" x2="80" y2="-6" stroke="${P.woodDark}" stroke-width="3" stroke-linecap="round"/>`;
  },
};

const stool = {
  category: 'Backgrounds', layer: 'bg-furniture', box: [-40, -10, 80, 100],
  draw() {
    return `<rect x="-36" y="0" width="72" height="16" rx="7" fill="${P.red}" ${S3}/><path d="M-26 16 l-6 74 M26 16 l6 74 M-28 60 h56" ${stroke(5, P.walnut)}/>`;
  },
};

const door = {
  category: 'Backgrounds', layer: 'bg-door', box: [0, -40, 230, 520],
  draw({ open = 0 } = {}) {
    const pane = uid('pane');
    const panel = (x) => `<g><rect x="${x}" y="40" width="96" height="400" fill="${P.wood}" ${S4}/>
      <rect x="${x + 12}" y="56" width="72" height="250" fill="url(#${pane})" ${S2}/>
      <g stroke="${P.woodDark}" stroke-width="4"><line x1="${x + 36}" y1="56" x2="${x + 36}" y2="306"/><line x1="${x + 60}" y1="56" x2="${x + 60}" y2="306"/>
      <line x1="${x + 12}" y1="140" x2="${x + 84}" y2="140"/><line x1="${x + 12}" y1="222" x2="${x + 84}" y2="222"/></g>
      <rect x="${x + 12}" y="320" width="72" height="104" fill="${P.woodDark}" ${S2}/></g>`;
    return `<defs>${lin(pane, [[0, '#FFF6E0'], [1, '#F3D9A8']])}</defs>
      <rect x="10" y="40" width="210" height="400" fill="${P.tealDeep}"/>
      <path d="M10 360 h210 v80 h-210z" fill="${P.gold}" opacity=".35"/>
      <g class="door-left">${panel(14)}</g>
      <g class="door-right" style="transform: translateX(${-open * 92}px)">${panel(120)}</g>
      <rect x="0" y="28" width="230" height="16" rx="3" fill="${P.walnut}" ${S4}/>
      <rect x="0" y="436" width="230" height="12" fill="${P.walnut}" ${S3}/>
      <g class="noren">
        <path d="M18 44 h62 v118 q-31 10 -62 0z" fill="${P.red}" ${S3}/>
        <path d="M84 44 h62 v118 q-31 10 -62 0z" fill="${P.red}" ${S3}/>
        <path d="M150 44 h62 v118 q-31 10 -62 0z" fill="${P.red}" ${S3}/>
        <circle cx="115" cy="98" r="24" fill="${P.cream}" ${S2}/>
        <path d="M99 98 h32 a16 14 0 0 1 -32 0z" fill="${P.red}"/>
      </g>`;
  },
};

// ------------------------------------------------------------------ COUNTER
const counter = {
  category: 'Kitchen', layer: 'counter', box: [-260, 560, 2440, 180],
  draw() {
    const top = uid('ctop'), front = uid('cfront');
    let slats = '';
    for (let x = -240; x < 2180; x += 46) slats += `<line x1="${x}" y1="612" x2="${x}" y2="730" stroke="${P.walnutDeep}" stroke-width="3" opacity=".55"/>`;
    return `<defs>${lin(top, [[0, '#D39B72'], [1, P.wood]])}${lin(front, [[0, P.woodDark], [1, P.walnut]])}</defs>
      <rect x="-260" y="604" width="2440" height="136" fill="url(#${front})"/>${slats}
      <rect x="-260" y="572" width="2440" height="38" rx="6" fill="url(#${top})" ${S4}/>
      <path d="M-250 580 H2170" stroke="#F0C29C" stroke-width="5" opacity=".7" stroke-linecap="round"/>
      <path d="M200 592 q60 -4 120 0 M820 596 q90 -4 160 0 M1500 590 q70 -4 130 0" stroke="${P.woodDark}" stroke-width="2" fill="none" opacity=".5"/>
      <rect x="-260" y="610" width="2440" height="10" fill="${INK}" opacity=".25"/>`;
  },
};

const servingTray = {
  category: 'Kitchen', layer: 'counter-props', box: [-150, -30, 300, 60],
  draw({ highlight = false } = {}) {
    return `${highlight ? `<ellipse cx="0" cy="0" rx="150" ry="30" fill="${P.gold}" opacity=".55" class="drop-pulse"/>` : ''}
      <path d="M-130 -10 h260 l-14 24 h-232z" fill="${P.red}" ${S4}/>
      <path d="M-122 -8 h244" stroke="${P.gold}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-110 6 h220" stroke="${P.redDeep}" stroke-width="3" opacity=".6"/>`;
  },
};

// ------------------------------------------------------------------ KITCHEN
const worktop = {
  category: 'Kitchen', layer: 'kitchen-surface', box: [-260, 720, 2440, 560],
  draw() {
    const g = uid('wt');
    let lines = '';
    for (let y = 800; y < 1280; y += 70) lines += `<path d="M-260 ${y} H2180" stroke="${P.woodDark}" stroke-width="2" opacity=".28"/>`;
    for (let i = 0; i < 18; i++) {
      const x = -200 + ((i * 313) % 2300), y = 790 + ((i * 97) % 420);
      lines += `<path d="M${x} ${y} q30 -6 70 0" stroke="${P.woodDark}" stroke-width="2" fill="none" opacity=".25"/>`;
    }
    return `<defs>${lin(g, [[0, '#C98E66'], [0.2, '#BD8159'], [1, '#93593E']])}</defs>
      <rect x="-260" y="720" width="2440" height="560" fill="url(#${g})"/>${lines}
      <rect x="-260" y="720" width="2440" height="26" fill="${INK}" opacity=".28"/>
      <path d="M-260 760 H2180" stroke="#E4AE86" stroke-width="4" opacity=".55"/>`;
  },
};

const stove = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 600, 230],
  draw({ burners = 3, lit = [true, true, true] } = {}) {
    const g = uid('stv');
    let b = '';
    for (let i = 0; i < burners; i++) {
      const cx = 100 + i * 200;
      b += `<ellipse cx="${cx}" cy="30" rx="70" ry="14" fill="${INK}"/>
        ${lit[i] ? `<g class="flame"><path d="M${cx - 50} 30 q8 -16 14 0 q8 -18 14 0 q8 -20 14 0 q8 -20 14 0 q8 -18 14 0 q8 -16 14 0 q8 -14 12 0" fill="#5FA8D3" opacity=".9"/></g>` : ''}`;
    }
    return `<defs>${lin(g, [[0, '#4A403C'], [1, '#2B2422']])}</defs>
      <rect x="0" y="22" width="600" height="200" rx="14" fill="url(#${g})" ${S4}/>
      <rect x="0" y="22" width="600" height="26" rx="10" fill="#5B504A" ${S3}/>
      ${b}
      <rect x="24" y="150" width="552" height="50" rx="10" fill="#3A322F" ${S3}/>
      ${[0, 1, 2].map((i) => `<circle cx="${100 + i * 200}" cy="175" r="15" fill="${P.steel}" ${S3}/><line x1="${100 + i * 200}" y1="175" x2="${100 + i * 200}" y2="163" ${S3}/>`).join('')}`;
  },
};

const brothPot = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [-95, -170, 190, 175],
  draw({ broth = 'shoyu', level = 1 } = {}) {
    const def = BROTHS.find((b) => b.id === broth) || BROTHS[0];
    const body = uid('pot');
    const tagIcon = { shoyu: `<path d="M0 -14 q10 12 0 22 q-10 -10 0 -22z" fill="${def.color}"/>`,
      miso: `<rect x="-9" y="-9" width="18" height="16" rx="4" fill="${def.color}"/>`,
      tonkotsu: `<circle cx="0" cy="-1" r="9" fill="${def.color}" ${S2}/>` }[broth] || '';
    const big = level >= 2 ? 1.08 : 1;
    return `<defs>${lin(body, [[0, '#D2CCC4'], [0.5, P.steel], [1, P.steelDark]], 1, 0)}</defs>
      <g transform="scale(${big}) ">
      <path d="M-88 -110 h-16 a8 8 0 0 0 0 26 h16 M88 -110 h16 a8 8 0 0 1 0 26 h-16" fill="none" ${stroke(7)}/>
      <path d="M-80 -132 h160 v120 q0 14 -14 14 h-132 q-14 0 -14 -14z" fill="url(#${body})" ${S4}/>
      <path d="M-62 -110 v80" stroke="#EFEBE5" stroke-width="7" opacity=".6" stroke-linecap="round"/>
      <ellipse cx="0" cy="-132" rx="82" ry="18" fill="${P.steelDark}" ${S4}/>
      <ellipse cx="0" cy="-130" rx="72" ry="12" fill="${def.surface}"/>
      <ellipse cx="-20" cy="-132" rx="18" ry="4" fill="#FFF6E0" opacity=".45"/>
      <circle cx="22" cy="-128" r="4" fill="#FFF6E0" opacity=".5" class="bubble"/><circle cx="-34" cy="-126" r="3" fill="#FFF6E0" opacity=".5" class="bubble b2"/>
      <circle cx="0" cy="-58" r="20" fill="${P.cream}" ${S3}/>${`<g transform="translate(0 -58)">${tagIcon}</g>`}
      </g>`;
  },
};

const ladle = {
  category: 'Equipment', layer: 'kitchen-fx', box: [-20, -150, 160, 180],
  draw({ broth = 'shoyu' } = {}) {
    const def = BROTHS.find((b) => b.id === broth) || BROTHS[0];
    return `<line x1="120" y1="-140" x2="20" y2="-10" ${stroke(9)}/><line x1="120" y1="-140" x2="20" y2="-10" stroke="${P.steel}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-14 -10 a34 26 0 0 0 68 0z" fill="${P.steel}" ${S4}/><ellipse cx="20" cy="-10" rx="30" ry="7" fill="${def.surface}"/>`;
  },
};

const noodleCooker = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 260, 190],
  draw({ level = 1 } = {}) {
    const g = uid('nc'), w = uid('water');
    return `<defs>${lin(g, [[0, '#CFC9C1'], [1, P.steelDark]])}${lin(w, [[0, '#BFE0DA'], [1, '#8CC3BB']])}</defs>
      <rect x="6" y="40" width="248" height="140" rx="12" fill="url(#${g})" ${S4}/>
      <rect x="20" y="120" width="220" height="40" rx="8" fill="${P.steelDark}" opacity=".5"/>
      ${level >= 4 ? `<rect x="96" y="128" width="68" height="24" rx="5" fill="${INK}"/><rect x="104" y="134" width="52" height="12" rx="3" fill="${P.teal}"/>` : `<circle cx="130" cy="140" r="12" fill="${P.steel}" ${S3}/>`}
      <ellipse cx="130" cy="44" rx="118" ry="20" fill="${P.steelDark}" ${S4}/>
      <ellipse cx="130" cy="46" rx="106" ry="14" fill="url(#${w})"/>
      <g class="boil"><circle cx="70" cy="46" r="5" fill="#E6F4F1"/><circle cx="170" cy="44" r="4" fill="#E6F4F1"/><circle cx="120" cy="50" r="3.5" fill="#E6F4F1"/><circle cx="200" cy="48" r="3" fill="#E6F4F1"/></g>`;
  },
};

const basket = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [-60, -130, 120, 140],
  draw({ noodles = null } = {}) {
    let mesh = '';
    for (let x = -36; x <= 36; x += 12) mesh += `<line x1="${x}" y1="-64" x2="${x * 0.85}" y2="0" stroke="${P.steelDark}" stroke-width="2"/>`;
    for (let y = -52; y < 0; y += 13) mesh += `<line x1="-40" y1="${y}" x2="40" y2="${y}" stroke="${P.steelDark}" stroke-width="2"/>`;
    const fill = noodles ? `<path d="M-36 -62 q12 -14 24 0 q12 -14 24 0 q12 -14 24 0" fill="none" stroke="#F3D486" stroke-width="${noodles === 'thick' ? 9 : 5}" stroke-linecap="round"/>` : '';
    return `<rect x="-6" y="-128" width="12" height="70" rx="5" fill="${P.walnut}" ${S3}/>
      ${fill}
      <path d="M-42 -64 h84 l-6 64 q-36 10 -72 0z" fill="${P.steel}" fill-opacity=".35" ${S4}/>${mesh}
      <ellipse cx="0" cy="-64" rx="42" ry="8" fill="none" ${S4}/>`;
  },
};

const noodleBundle = (type) => ({
  category: 'Ingredients', layer: 'kitchen-items', box: [-46, -32, 92, 64],
  draw() {
    const w = type === 'thick' ? 7 : 3.4;
    let s = '';
    const n = type === 'thick' ? 6 : 10;
    for (let i = 0; i < n; i++) {
      const y = -18 + (i * 36) / n;
      s += `<path d="M-34 ${y} q10 -${type === 'wavy' ? 8 : 3} 20 0 t20 0 t20 0 t14 0" fill="none" stroke="${i % 2 ? '#F0CC78' : '#F7DC95'}" stroke-width="${w}" stroke-linecap="round"/>`;
    }
    return `<rect x="-40" y="-26" width="80" height="52" rx="14" fill="#F3D486" ${S3}/>${s}<rect x="-6" y="-26" width="14" height="52" fill="${P.red}" ${S2}/>`;
  },
});

const noodleBox = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 130, 70],
  draw({ type = 'thin' } = {}) {
    return `<rect x="4" y="8" width="122" height="58" rx="8" fill="${P.wood}" ${S4}/><rect x="12" y="16" width="106" height="12" rx="4" fill="${P.woodDark}" opacity=".5"/>
      <g transform="translate(65 34) scale(.9)">${noodleBundle(type).draw()}</g>
      <circle cx="112" cy="54" r="10" fill="${type === 'thick' ? P.red : P.teal}" ${S2}/>`;
  },
};

const bowlStack = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [-70, -120, 140, 130],
  draw({ design = { body: P.cream, band: P.teal } } = {}) {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const y = -i * 24;
      s += `<path d="M-60 ${y - 20} h120 q-6 30 -30 34 h-60 q-24 -4 -30 -34z" fill="${design.body}" ${S4}/><path d="M-56 ${y - 12} h112" stroke="${design.band}" stroke-width="5"/>`;
    }
    return s;
  },
};

const bowlLayers = {
  category: 'Food', layer: 'bowl', box: [-130, -60, 260, 140],
  // Composite renderer: back → broth → noodles → toppings(sorted) → front rim.
  draw({ design = { body: P.cream, band: P.teal, inner: '#F3E2C6' }, broth = null, noodle = null, toppings = [], scale = 1 } = {}) {
    const clip = uid('bclip'), bodyG = uid('bbody');
    const def = BROTHS.find((b) => b.id === broth);
    let noodles = '';
    if (noodle) {
      const sw = noodle === 'thick' ? 7 : 4;
      for (let i = 0; i < (noodle === 'thick' ? 7 : 11); i++) {
        const y = -24 + i * (noodle === 'thick' ? 7.5 : 4.8);
        noodles += `<path d="M-96 ${y} q16 -7 32 0 t32 0 t32 0 t32 0 t32 0 t32 0" fill="none" stroke="${i % 2 ? '#E9C26A' : '#F5D88E'}" stroke-width="${sw}" stroke-linecap="round"/>`;
      }
    }
    const tops = [...toppings].sort((a, b) => a.y - b.y)
      .map((tp) => `<g transform="translate(${tp.x * 92} ${tp.y * 30}) rotate(${tp.r || 0}) scale(.62)">${INGREDIENT_ART[tp.id] ? INGREDIENT_ART[tp.id]() : ''}</g>`).join('');
    return `<defs><clipPath id="${clip}"><ellipse cx="0" cy="0" rx="104" ry="34"/></clipPath>
      ${lin(bodyG, [[0, design.body], [1, design.body], [1, INK]], 0, 1)}</defs>
      <g transform="scale(${scale})">
      <ellipse cx="0" cy="66" rx="92" ry="12" fill="${INK}" opacity=".25"/>
      <ellipse cx="0" cy="0" rx="114" ry="38" fill="${design.inner}" ${S4}/>
      <g clip-path="url(#${clip})">
        ${def ? `<ellipse cx="0" cy="4" rx="106" ry="34" fill="${def.color}" class="broth-fill"/><ellipse cx="-30" cy="-8" rx="40" ry="8" fill="${def.surface}" opacity=".8"/>
          <circle cx="40" cy="-4" r="5" fill="${P.gold}" opacity=".6"/><circle cx="-60" cy="8" r="4" fill="${P.gold}" opacity=".6"/>` : ''}
        ${noodles}
      </g>
      ${tops}
      <path d="M-114 0 a114 38 0 0 0 228 0 q-6 54 -50 68 h-128 q-44 -14 -50 -68z" fill="${design.body}" ${S4}/>
      <path d="M-104 22 q104 36 208 0" stroke="${design.band}" stroke-width="9" fill="none"/>
      <path d="M-86 30 q-6 16 6 30" stroke="#FFFFFF" stroke-width="6" opacity=".45" fill="none" stroke-linecap="round"/>
      </g>`;
  },
};

const ingredientTray = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 104, 84],
  draw({ id = 'egg', locked = false } = {}) {
    const art = INGREDIENT_ART[id] ? INGREDIENT_ART[id]() : '';
    const pile = `<g transform="translate(36 40) scale(.62) rotate(-8)">${art}</g><g transform="translate(68 44) scale(.62) rotate(10)">${art}</g><g transform="translate(52 30) scale(.66)">${art}</g>`;
    return `<rect x="2" y="10" width="100" height="72" rx="10" fill="${P.steelDark}" ${S4}/>
      <rect x="10" y="16" width="84" height="58" rx="7" fill="#E7E1D8" ${S2}/>
      <g ${locked ? 'filter="grayscale(1)" opacity=".35"' : ''}>${pile}</g>`;
  },
};

const sauceBottle = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [-24, -92, 48, 96],
  draw({ color = P.red } = {}) {
    return `<rect x="-6" y="-90" width="12" height="18" rx="3" fill="${INK}"/><path d="M-10 -72 h20 l8 16 v52 q0 6 -6 6 h-24 q-6 0 -6 -6 v-52z" fill="${color}" ${S4}/>
      <rect x="-12" y="-46" width="24" height="22" rx="4" fill="${P.cream}" ${S2}/><path d="M-12 -60 v40" stroke="#FFF" stroke-width="4" opacity=".35" stroke-linecap="round"/>`;
  },
};

const cuttingBoard = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 220, 80],
  draw({ level = 1 } = {}) {
    return `<rect x="6" y="20" width="170" height="54" rx="10" fill="#DDB083" ${S4}/><rect x="14" y="26" width="154" height="8" rx="3" fill="#EBC9A4"/>
      <g transform="translate(70 46) scale(.9)">${INGREDIENT_ART.chashu()}</g><g transform="translate(116 48) scale(.9) rotate(14)">${INGREDIENT_ART.chashu()}</g>
      <path d="M150 10 l60 -4 l-4 14 l-56 4z" fill="${level >= 2 ? '#E7E7E7' : P.steel}" ${S3}/><rect x="186" y="2" width="30" height="16" rx="4" fill="${P.walnut}" ${S2} transform="rotate(-4 200 10)"/>`;
  },
};

const sink = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 200, 130],
  draw() {
    return `<rect x="4" y="30" width="192" height="94" rx="12" fill="${P.steel}" ${S4}/><rect x="20" y="40" width="160" height="40" rx="10" fill="#C9D9D6" ${S3}/>
      <path d="M100 30 v-24 h40 v14" fill="none" ${stroke(7)}/><path d="M100 30 v-24 h40 v14" fill="none" stroke="${P.steel}" stroke-width="3"/>
      <ellipse cx="60" cy="58" rx="22" ry="8" fill="${P.cream}" ${S2}/><ellipse cx="60" cy="52" rx="22" ry="8" fill="${P.cream}" ${S2}/>`;
  },
};

const refrigerator = {
  category: 'Equipment', layer: 'kitchen-equipment', box: [0, 0, 160, 300],
  draw() {
    return `<rect x="4" y="4" width="152" height="292" rx="14" fill="#E6E2DA" ${S4}/><line x1="4" y1="110" x2="156" y2="110" ${S4}/>
      <rect x="128" y="40" width="10" height="50" rx="4" fill="${P.steelDark}"/><rect x="128" y="140" width="10" height="70" rx="4" fill="${P.steelDark}"/>
      <circle cx="40" cy="40" r="10" fill="${P.teal}"/><circle cx="64" cy="54" r="8" fill="${P.sakura}"/>`;
  },
};

// --------------------------------------------------------------- INGREDIENTS
// Drawn at ~70px, centered on 0,0. Each is a pure function for re-use in
// trays, bowls, recipe book icons and order cards.
export const INGREDIENT_ART = {
  chashu: () => `<ellipse cx="0" cy="0" rx="32" ry="26" fill="#B5643E" ${S3}/><ellipse cx="0" cy="0" rx="25" ry="19" fill="#F0B9A0"/>
    <path d="M-12 -4 q8 -10 16 -2 q6 8 -4 12 q-10 2 -10 -6 q2 -6 6 -4" fill="none" stroke="#D88D73" stroke-width="3" stroke-linecap="round"/>`,
  chicken: () => `<path d="M-30 -6 q30 -26 60 -4 q2 22 -30 26 q-30 2 -30 -22z" fill="#F4DCC0" ${S3}/><path d="M-18 -4 q16 -10 34 -2 M-14 8 q16 -6 30 0" stroke="#D9B38C" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M-30 -6 q30 -26 60 -4" fill="none" stroke="#C98A3E" stroke-width="5" stroke-linecap="round"/>`,
  egg: () => `<ellipse cx="0" cy="0" rx="26" ry="32" fill="#FFF7E8" ${S3}/><ellipse cx="0" cy="4" rx="15" ry="16" fill="${P.lantern}"/><ellipse cx="2" cy="6" rx="9" ry="10" fill="#E5803A"/><ellipse cx="-5" cy="-1" rx="4" ry="3" fill="#FFE0B0"/>`,
  nori: () => `<rect x="-20" y="-32" width="40" height="64" rx="3" fill="#2F3D2E" ${S3} transform="rotate(-6)"/><path d="M-12 -24 v48 M0 -26 v50 M12 -24 v48" stroke="#4B5E43" stroke-width="2" transform="rotate(-6)"/>`,
  greenOnion: () => [[-14, -8], [12, -10], [0, 8], [-18, 14], [18, 12]].map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="#9CCB6A" ${S2}/><circle cx="${x}" cy="${y}" r="4" fill="#DDF0B8"/>`).join(''),
  corn: () => [[-14, -8], [0, -10], [14, -8], [-16, 6], [-2, 4], [12, 6], [-6, 18], [8, 18]].map(([x, y]) =>
    `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="4" fill="${P.gold}" stroke="#C98A3E" stroke-width="2"/>`).join(''),
  mushroom: () => `<path d="M-30 4 q0 -32 30 -32 q30 0 30 32z" fill="#7A4A2E" ${S3}/><path d="M-10 4 h20 l-4 22 h-12z" fill="#EAD7BC" ${S3}/>
    <path d="M-16 -12 l8 6 M14 -14 l-6 8 M0 -22 v8" stroke="#B88660" stroke-width="3" stroke-linecap="round"/>`,
  bamboo: () => [[-14, -2, -12], [0, 0, 6], [14, -2, 16]].map(([x, y, r]) =>
    `<rect x="${x - 6}" y="${y - 24}" width="13" height="48" rx="4" fill="#D6B271" stroke="${INK}" stroke-width="2.5" transform="rotate(${r} ${x} ${y})"/><line x1="${x}" y1="${y - 18}" x2="${x}" y2="${y + 18}" stroke="#B88E4E" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`).join(''),
  naruto: () => `<path d="M-28 -2 l6 -22 l20 -6 l18 6 l12 18 l-4 22 l-18 12 l-20 -2 l-14 -14z" fill="#FFFBF4" ${S3}/>
    <path d="M0 0 m-2 -2 q8 -4 10 4 q2 12 -12 12 q-16 -2 -14 -18 q4 -18 24 -14" fill="none" stroke="${P.sakura}" stroke-width="4" stroke-linecap="round"/>`,
  chili: () => [[-12, -6, 20], [8, -10, -30], [0, 10, 70], [16, 8, 10]].map(([x, y, r]) =>
    `<path d="M${x - 10} ${y} q10 -6 20 0 q-10 6 -20 0z" fill="#D2402E" stroke="${INK}" stroke-width="2" transform="rotate(${r} ${x} ${y})"/>`).join(''),
  beef: () => `<path d="M-32 -10 q20 -22 64 -4 q-6 26 -40 26 q-24 -2 -24 -22z" fill="#A9483C" ${S3}/><path d="M-18 -6 q14 -6 30 2" stroke="#E3A396" stroke-width="3" fill="none"/>`,
  garlic: () => `<circle cx="-8" cy="0" r="10" fill="#F6EEDC" ${S2}/><circle cx="10" cy="-4" r="9" fill="#F6EEDC" ${S2}/><circle cx="4" cy="12" r="8" fill="#F6EEDC" ${S2}/>`,
  sesame: () => [[-12, -4], [0, -10], [10, 0], [-4, 8], [14, 12], [-16, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#F4E6C4" stroke="${INK}" stroke-width="1.2"/>`).join(''),
  sprouts: () => [-14, -4, 6, 16].map((x) => `<path d="M${x} 20 q-6 -20 4 -36" stroke="#F4F1DF" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="${x + 4}" cy="-18" rx="5" ry="4" fill="#E4DB8E"/>`).join(''),
  spinach: () => `<path d="M-28 10 q-4 -30 20 -36 q16 20 -20 36z" fill="#3E7A3A" ${S3}/><path d="M28 12 q6 -32 -18 -38 q-16 22 18 38z" fill="#4C8C45" ${S3}/>`,
};

// --------------------------------------------------------------------- FX
const steam = {
  category: 'Effects', layer: 'fx', box: [-50, -160, 100, 170],
  draw({ strength = 1 } = {}) {
    return `<g class="steam" opacity="${0.7 * strength}">
      <path class="wisp w1" d="M-20 0 q-16 -30 0 -60 q16 -30 0 -70" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path class="wisp w2" d="M6 0 q16 -30 0 -60 q-16 -30 0 -80" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path class="wisp w3" d="M28 0 q-12 -26 0 -50 q12 -26 0 -54" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round"/></g>`;
  },
};

const petal = {
  category: 'Effects', layer: 'fx', box: [-10, -8, 20, 16],
  draw() { return `<path d="M-8 0 q8 -10 16 0 q-8 10 -16 0z" fill="${P.sakura}"/><path d="M-4 0 h8" stroke="#F8C6D3" stroke-width="2"/>`; },
};

const coin = {
  category: 'UI', layer: 'ui', box: [-26, -26, 52, 52],
  draw() {
    return `<circle cx="0" cy="0" r="22" fill="${P.gold}" ${S4}/><circle cx="0" cy="0" r="15" fill="none" stroke="#D9A441" stroke-width="3"/>
      <rect x="-6" y="-6" width="12" height="12" rx="2" fill="${P.walnut}"/><path d="M-12 -12 q6 -6 14 -6" stroke="#FFF6E0" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  },
};

const sparkle = {
  category: 'Effects', layer: 'fx', box: [-30, -30, 60, 60],
  draw({ color = P.gold } = {}) { return `<path d="M0 -26 q4 22 26 26 q-22 4 -26 26 q-4 -22 -26 -26 q22 -4 26 -26z" fill="${color}" ${S2}/>`; },
};

// ------------------------------------------------------------------- UI ICONS
// 64x64 icons for navigation; meaning carried by shape + label (localized).
export const ICONS = {
  shop: () => `<path d="M10 26 h44 v28 h-44z" fill="${P.cream}" ${S3}/><path d="M6 14 h52 l-4 14 h-44z" fill="${P.red}" ${S3}/><path d="M16 14 v14 M28 14 v14 M40 14 v14" stroke="${P.cream}" stroke-width="3"/><rect x="26" y="36" width="14" height="18" fill="${P.wood}" ${S2}/>`,
  upgrades: () => `<path d="M12 30 h40 v18 q0 8 -8 8 h-24 q-8 0 -8 -8z" fill="${P.steel}" ${S3}/><ellipse cx="32" cy="30" rx="20" ry="5" fill="${P.steelDark}" ${S2}/><path d="M32 6 l12 12 h-7 v8 h-10 v-8 h-7z" fill="${P.teal}" ${S3}/>`,
  employees: () => `<path d="M18 26 q-8 -14 6 -18 q8 -8 16 0 q14 4 6 18z" fill="#FFFFFF" ${S3}/><rect x="18" y="24" width="28" height="8" fill="#FFFFFF" ${S3}/><circle cx="32" cy="42" r="12" fill="#E8B993" ${S3}/><circle cx="28" cy="41" r="1.8" fill="${INK}"/><circle cx="36" cy="41" r="1.8" fill="${INK}"/><path d="M28 46 q4 3 8 0" ${S2} fill="none"/>`,
  recipes: () => `<path d="M8 14 q12 -6 24 2 q12 -8 24 -2 v38 q-12 -6 -24 2 q-12 -8 -24 -2z" fill="${P.cream}" ${S3}/><line x1="32" y1="16" x2="32" y2="54" ${S2}/><path d="M38 28 h12 a6 5 0 0 1 -12 0z" fill="${P.red}" ${S2}/><path d="M14 26 h12 M14 34 h12 M14 42 h10" stroke="${P.wood}" stroke-width="3" stroke-linecap="round"/>`,
  tasks: () => `<rect x="14" y="8" width="36" height="48" rx="4" fill="${P.cream}" ${S3}/><rect x="10" y="6" width="44" height="8" rx="4" fill="${P.wood}" ${S3}/><rect x="10" y="52" width="44" height="8" rx="4" fill="${P.wood}" ${S3}/><path d="M20 24 l4 4 l8 -8 M20 38 l4 4 l8 -8" stroke="${P.tealDeep}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M36 26 h8 M36 40 h8" stroke="${P.wood}" stroke-width="3" stroke-linecap="round"/>`,
  events: () => `<path d="M32 54 l-24 -30 a30 30 0 0 1 48 0z" fill="${P.sakura}" ${S3}/><path d="M32 54 l-14 -36 M32 54 v-38 M32 54 l14 -36" stroke="${P.red}" stroke-width="2.5"/><circle cx="32" cy="52" r="4" fill="${P.gold}" ${S2}/>`,
  customize: () => `<path d="M40 8 l16 16 l-22 22 l-16 -16z" fill="${P.teal}" ${S3}/><path d="M18 30 l16 16 q-6 12 -20 12 q-8 0 -8 -6 q8 -4 4 -12 q0 -6 8 -10z" fill="${P.lantern}" ${S3}/>`,
  achievements: () => `<path d="M22 6 h20 l-4 18 h-12z M14 6 l12 18 M50 6 l-12 18" fill="${P.red}" ${S3}/><circle cx="32" cy="40" r="16" fill="${P.gold}" ${S3}/><path d="M32 30 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#FFF6E0"/>`,
  more: () => `<circle cx="18" cy="32" r="5" fill="${P.cream}" ${S2}/><circle cx="32" cy="32" r="5" fill="${P.cream}" ${S2}/><circle cx="46" cy="32" r="5" fill="${P.cream}" ${S2}/>`,
  pause: () => `<rect x="18" y="14" width="10" height="36" rx="3" fill="${P.cream}" ${S3}/><rect x="36" y="14" width="10" height="36" rx="3" fill="${P.cream}" ${S3}/>`,
  settings: () => `<circle cx="32" cy="32" r="14" fill="${P.cream}" ${S3}/><circle cx="32" cy="32" r="5" fill="${P.wood}" ${S2}/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="29" y="8" width="6" height="8" rx="2" fill="${P.cream}" ${S2} transform="rotate(${a} 32 32)"/>`).join('')}`,
  satisfaction: () => `<circle cx="32" cy="32" r="22" fill="${P.sakura}" ${S3}/><circle cx="24" cy="28" r="3" fill="${INK}"/><circle cx="40" cy="28" r="3" fill="${INK}"/><path d="M22 38 q10 10 20 0" fill="none" ${S3}/>`,
  clock: () => `<circle cx="32" cy="32" r="22" fill="${P.cream}" ${S3}/><path d="M32 18 v14 l9 6" fill="none" ${S3}/>`,
  coin: () => `<g transform="translate(32 32)">${coin.draw()}</g>`,
  order: () => `<rect x="12" y="8" width="40" height="48" rx="6" fill="${P.cream}" ${S3}/><path d="M20 22 h24 M20 32 h24 M20 42 h16" stroke="${P.wood}" stroke-width="3.5" stroke-linecap="round"/><rect x="24" y="4" width="16" height="9" rx="3" fill="${P.red}" ${S2}/>`,
  lock: () => `<rect x="14" y="28" width="36" height="28" rx="6" fill="${P.steel}" ${S3}/><path d="M22 28 v-8 a10 10 0 0 1 20 0 v8" fill="none" ${S4}/><circle cx="32" cy="42" r="4" fill="${INK}"/>`,
  flowBroth: () => `<path d="M10 24 h44 v20 q0 10 -10 10 h-24 q-10 0 -10 -10z" fill="${P.steel}" ${S3}/><ellipse cx="32" cy="24" rx="22" ry="5" fill="#A8603A" ${S2}/><path d="M24 16 q-4 -6 0 -12 M34 16 q-4 -6 0 -12" stroke="${P.cream}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  flowNoodles: () => `<path d="M14 18 h36 l-4 30 q-14 6 -28 0z" fill="${P.steel}" fill-opacity=".5" ${S3}/><path d="M18 24 q6 -6 12 0 t12 0" stroke="#F3D486" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="29" y="2" width="6" height="16" fill="${P.walnut}" ${S2}/>`,
  flowBowl: () => `<path d="M8 28 h48 a24 20 0 0 1 -48 0z" fill="${P.cream}" ${S3}/><path d="M12 36 q20 8 40 0" stroke="${P.teal}" stroke-width="4" fill="none"/>`,
  flowToppings: () => `<ellipse cx="22" cy="32" rx="12" ry="14" fill="#FFF7E8" ${S2}/><ellipse cx="22" cy="34" rx="7" ry="7" fill="${P.lantern}"/><ellipse cx="42" cy="32" rx="13" ry="11" fill="#B5643E" ${S2}/><ellipse cx="42" cy="32" rx="9" ry="7" fill="#F0B9A0"/>`,
  flowServe: () => `<path d="M8 40 h48 l-6 10 h-36z" fill="${P.red}" ${S3}/><path d="M16 36 h32 a16 12 0 0 1 -32 0z" fill="${P.cream}" ${S2}/><path d="M26 22 q-3 -6 0 -12 M36 22 q-3 -6 0 -12" stroke="${P.wood}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
};

export const icon = (name, size = 40) =>
  `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${ICONS[name] ? ICONS[name]() : ''}</svg>`;

// --------------------------------------------------------------- REGISTRY
export const ASSETS = {
  'bg-wall': wall,
  'bg-pillar': pillar,
  'bg-window': windowAsset,
  'bg-lantern': lantern,
  'bg-banner': banner,
  'bg-shelf': shelf,
  'bg-dining-table': diningTable,
  'bg-stool': stool,
  'bg-door': door,
  'deco-wall-art': wallArt,
  'deco-plant': plant,
  'kitchen-counter': counter,
  'kitchen-serving-tray': servingTray,
  'kitchen-worktop': worktop,
  'equip-stove': stove,
  'equip-broth-pot': brothPot,
  'equip-ladle': ladle,
  'equip-noodle-cooker': noodleCooker,
  'equip-noodle-basket': basket,
  'equip-noodle-box': noodleBox,
  'equip-bowl-stack': bowlStack,
  'equip-ingredient-tray': ingredientTray,
  'equip-sauce-bottle': sauceBottle,
  'equip-cutting-board': cuttingBoard,
  'equip-sink': sink,
  'equip-refrigerator': refrigerator,
  'food-bowl-composite': bowlLayers,
  'food-noodles-thin': noodleBundle('thin'),
  'food-noodles-thick': noodleBundle('thick'),
  'fx-steam': steam,
  'fx-petal': petal,
  'fx-sparkle': sparkle,
  'ui-coin': coin,
};

for (const id of Object.keys(INGREDIENT_ART)) {
  ASSETS[`ingredient-${id}`] = { category: 'Ingredients', layer: 'food', box: [-40, -40, 80, 80], draw: INGREDIENT_ART[id] };
}
for (const id of Object.keys(ICONS)) {
  ASSETS[`icon-${id}`] = { category: 'UI', layer: 'ui', box: [0, 0, 64, 64], draw: ICONS[id] };
}

/** Render an asset at a world position. */
export const place = (name, x, y, opts = {}, attrs = '') =>
  `<g transform="translate(${x} ${y})${opts.scale ? ` scale(${opts.scale})` : ''}" ${attrs}>${ASSETS[name].draw(opts)}</g>`;
