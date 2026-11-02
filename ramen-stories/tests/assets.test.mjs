import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS, INGREDIENT_ART, resetUid } from '../../public/ramen-stories/js/assets.js';
import { drawCharacter, EXPRESSIONS } from '../../public/ramen-stories/js/characters.js';
import { INGREDIENTS, CUSTOMERS, EMPLOYEES } from '../../public/ramen-stories/js/data.js';
import { composeScene } from '../../public/ramen-stories/js/scene.js';

test('every asset renders non-empty markup with a valid box', () => {
  for (const [name, a] of Object.entries(ASSETS)) {
    resetUid();
    const svg = a.draw();
    assert.ok(svg.length > 20, name);
    assert.equal(a.box.length, 4, name);
    assert.ok(!/undefined|NaN/.test(svg), `${name} contains undefined/NaN`);
  }
});

test('every ingredient has art', () => {
  for (const i of INGREDIENTS) assert.ok(INGREDIENT_ART[i.id], i.id);
});

test('no text is baked into artwork', () => {
  for (const [name, a] of Object.entries(ASSETS)) assert.ok(!/<text/.test(a.draw()), name);
  for (const c of [...CUSTOMERS, ...EMPLOYEES]) assert.ok(!/<text/.test(drawCharacter(c.look)), c.id);
});

test('every character renders every expression', () => {
  for (const c of [...CUSTOMERS, ...EMPLOYEES]) for (const e of EXPRESSIONS) {
    const s = drawCharacter(c.look, { expression: e });
    assert.ok(s.includes(`data-expression="${e}"`) && !/undefined|NaN/.test(s), `${c.id}/${e}`);
  }
});

test('scene variants compose without undefined values', () => {
  for (const v of ['main', 'empty', 'upgraded']) {
    const s = composeScene(v, { levels: { noodleCooker: 2 } });
    assert.ok(!/undefined|NaN/.test(s), v);
    assert.ok(s.includes('id="customer-layer"') && s.includes('id="bowl-layer"'), v);
  }
});
