// Exports every library asset as an individual, standalone SVG layer file
// (ramen-stories/art/<Category>/<name>.svg) plus character expression sheets
// and a manifest.json. These are the editable vector sources; Unity import
// rasterizes them into sprite atlases (see docs/04-unity-architecture.md).
// Usage: node ramen-stories/tools/export-assets.mjs
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSETS, resetUid } from '../../public/ramen-stories/js/assets.js';
import { drawCharacter, EXPRESSIONS, VIEWS } from '../../public/ramen-stories/js/characters.js';
import { CUSTOMERS, EMPLOYEES, PLAYER_CHEF } from '../../public/ramen-stories/js/data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../art');
await rm(root, { recursive: true, force: true });
const wrap = (box, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}">${body}</svg>\n`;
const manifest = { generated: 'tools/export-assets.mjs', assets: [], characters: [] };

for (const [name, a] of Object.entries(ASSETS)) {
  resetUid();
  const dir = path.join(root, a.category);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.svg`), wrap(a.box, a.draw()));
  manifest.assets.push({ name, category: a.category, sortingLayer: a.layer, box: a.box, file: `${a.category}/${name}.svg` });
}

const chars = [[PLAYER_CHEF.id, PLAYER_CHEF.look], ...CUSTOMERS.map((c) => [c.id, c.look]), ...EMPLOYEES.map((e) => [e.id, e.look])];
const box = [-150, -500, 300, 520];
for (const [id, look] of chars) {
  const dir = path.join(root, 'Characters', id);
  await mkdir(dir, { recursive: true });
  const files = [];
  for (const view of VIEWS) { resetUid(); const f = `${id}-${view}.svg`; await writeFile(path.join(dir, f), wrap(box, drawCharacter(look, { view }))); files.push(f); }
  for (const ex of EXPRESSIONS) { resetUid(); const f = `${id}-${ex}.svg`; await writeFile(path.join(dir, f), wrap(box, drawCharacter(look, { expression: ex, view: 'threeQuarter' }))); files.push(f); }
  resetUid();
  await writeFile(path.join(dir, `${id}-talking.svg`), wrap(box, drawCharacter(look, { talking: true, view: 'threeQuarter' }).replace('class="mouth-closed"', 'class="mouth-closed" display="none"')));
  files.push(`${id}-talking.svg`);
  // Sheet: 3 views + 5 expressions side by side
  const cells = [...VIEWS.map((v) => ({ view: v })), ...EXPRESSIONS.map((e) => ({ expression: e, view: 'threeQuarter' }))];
  resetUid();
  await writeFile(path.join(dir, `${id}-sheet.svg`), wrap([0, 0, cells.length * 300, 540],
    `<rect width="100%" height="100%" fill="#F6E4C6"/>${cells.map((o, i) => `<g transform="translate(${i * 300 + 150} 510)">${drawCharacter(look, o)}</g>`).join('')}`));
  files.push(`${id}-sheet.svg`);
  manifest.characters.push({ id, files: files.map((f) => `Characters/${id}/${f}`) });
}
await writeFile(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${manifest.assets.length} assets and ${manifest.characters.length} characters to ${path.relative(process.cwd(), root)}`);
