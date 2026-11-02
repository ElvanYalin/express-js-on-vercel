import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOrder, doneness, spreadScore } from '../../public/ramen-stories/js/evaluation.js';
import { NOODLES, ORDERS, CUSTOMERS } from '../../public/ramen-stories/js/data.js';

const thin = NOODLES.find((n) => n.id === 'thin');
const order = ORDERS[0]; // mei: shoyu, thin, egg+greenOnion+nori
const mei = CUSTOMERS.find((c) => c.id === 'mei');
const spread = [
  { id: 'egg', x: -0.5, y: -0.2 },
  { id: 'greenOnion', x: 0.5, y: -0.2 },
  { id: 'nori', x: 0, y: 0.5 },
];

test('doneness windows', () => {
  assert.equal(doneness(thin, 2), 'under');
  assert.equal(doneness(thin, 3.5), 'perfect');
  assert.equal(doneness(thin, 5.5), 'perfect');
  assert.equal(doneness(thin, 6), 'soft');
  assert.equal(doneness(thin, 8), 'over');
  assert.equal(doneness(thin, null), 'none');
});

test('perfect bowl scores 100 and tips', () => {
  const r = evaluateOrder(order, { broth: 'shoyu', noodle: 'thin', noodleSeconds: 4.5, ingredients: spread }, NOODLES, mei);
  assert.equal(r.score, 100);
  assert.equal(r.rating, 'perfect');
  assert.deepEqual(r.mistakes, []);
  assert.equal(r.payment, 16);
  assert.ok(r.tip > 0 && r.payment + r.tip <= mei.budget);
});

test('stacking toppings only loses the small presentation bonus', () => {
  const stacked = spread.map((p) => ({ ...p, x: 0, y: 0 }));
  const r = evaluateOrder(order, { broth: 'shoyu', noodle: 'thin', noodleSeconds: 4.5, ingredients: stacked }, NOODLES, mei);
  assert.equal(r.score, 95);
  assert.equal(r.rating, 'perfect');
});

test('wrong broth and missing topping are reported', () => {
  const r = evaluateOrder(order, { broth: 'miso', noodle: 'thin', noodleSeconds: 4.5, ingredients: spread.slice(0, 2) }, NOODLES, mei);
  assert.equal(r.rating, 'okay');
  assert.ok(r.mistakes.some((m) => m.key === 'wrongBroth' && m.expected === 'shoyu'));
  assert.ok(r.mistakes.some((m) => m.key === 'missingIngredient' && m.id === 'nori'));
});

test('extra creativity is penalized gently (max 9 points)', () => {
  const extra = [...spread, ...Array.from({ length: 6 }, (_, i) => ({ id: 'corn', x: i / 10, y: 0.3 }))];
  const r = evaluateOrder(order, { broth: 'shoyu', noodle: 'thin', noodleSeconds: 4.5, ingredients: extra }, NOODLES, mei);
  assert.ok(r.score >= 90 - 9);
  assert.ok(r.mistakes.some((m) => m.key === 'unwantedIngredient' && m.id === 'corn'));
});

test('empty bowl is bad, still pays something and never negative tip', () => {
  const r = evaluateOrder(order, { ingredients: [] }, NOODLES, mei);
  assert.equal(r.rating, 'bad');
  assert.equal(r.tip, 0);
  assert.ok(r.payment > 0);
});

test('spreadScore bounds', () => {
  assert.equal(spreadScore([]), 0);
  assert.equal(spreadScore([{ x: 0, y: 0 }]), 1);
  assert.equal(spreadScore([{ x: 0, y: 0 }, { x: 0, y: 0 }]), 0);
});
