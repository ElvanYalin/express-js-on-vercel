// Order evaluation — pure logic, shared by the browser mockup and Node tests.
// Planned Unity port: Scripts/Cooking/OrderEvaluator.cs (same weights/rules).

import { BASE_PRICE } from './data.js';

export const WEIGHTS = Object.freeze({ broth: 25, noodle: 20, doneness: 15, ingredients: 35, presentation: 5 });

/** Classify noodle cooking time against a noodle definition. */
export function doneness(noodleDef, seconds) {
  if (!noodleDef || seconds == null) return 'none';
  const [lo, hi] = noodleDef.perfect;
  if (seconds < lo) return 'under';
  if (seconds <= hi) return 'perfect';
  if (seconds < noodleDef.over) return 'soft';
  return 'over';
}

/** Presentation: reward spreading toppings instead of stacking them on one spot. 0..1 */
export function spreadScore(placements) {
  if (!placements || placements.length < 2) return placements && placements.length === 1 ? 1 : 0;
  let total = 0, pairs = 0;
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const dx = placements[i].x - placements[j].x;
      const dy = placements[i].y - placements[j].y;
      total += Math.min(1, Math.hypot(dx, dy) / 0.35); // coords normalized to bowl radius
      pairs++;
    }
  }
  return total / pairs;
}

/**
 * @param order  { broth, noodle, ingredients: {id: qty} }
 * @param bowl   { broth, noodle, noodleSeconds, ingredients: [{id, x, y}] }
 * @param noodleDefs array of noodle definitions
 * @returns { score, rating, mistakes[], payment, tip }
 */
export function evaluateOrder(order, bowl, noodleDefs, customer = { budget: 99, tipRate: 0.1 }) {
  const mistakes = [];
  let score = 0;

  if (bowl.broth === order.broth) score += WEIGHTS.broth;
  else mistakes.push(bowl.broth ? { key: 'wrongBroth', expected: order.broth, got: bowl.broth } : { key: 'missingBroth' });

  if (bowl.noodle === order.noodle) score += WEIGHTS.noodle;
  else mistakes.push(bowl.noodle ? { key: 'wrongNoodle', expected: order.noodle, got: bowl.noodle } : { key: 'missingNoodle' });

  if (bowl.noodle) {
    const def = noodleDefs.find((n) => n.id === bowl.noodle);
    const d = doneness(def, bowl.noodleSeconds);
    if (d === 'perfect') score += WEIGHTS.doneness;
    else if (d === 'soft') { score += WEIGHTS.doneness * 0.5; mistakes.push({ key: 'softNoodles' }); }
    else if (d === 'under') { score += WEIGHTS.doneness * 0.2; mistakes.push({ key: 'underNoodles' }); }
    else mistakes.push({ key: 'overNoodles' });
  }

  const placed = {};
  for (const p of bowl.ingredients || []) placed[p.id] = (placed[p.id] || 0) + 1;
  const required = Object.entries(order.ingredients || {});
  const requiredTotal = required.reduce((s, [, q]) => s + q, 0);
  let matched = 0;
  for (const [id, qty] of required) {
    const have = placed[id] || 0;
    matched += Math.min(have, qty);
    if (have < qty) mistakes.push({ key: 'missingIngredient', id, qty: qty - have });
    if (have > qty) mistakes.push({ key: 'extraIngredient', id, qty: have - qty });
  }
  const extras = Object.entries(placed).filter(([id]) => !(id in (order.ingredients || {})));
  for (const [id, qty] of extras) mistakes.push({ key: 'unwantedIngredient', id, qty });
  const extraCount = extras.reduce((s, [, q]) => s + q, 0)
    + required.reduce((s, [id, q]) => s + Math.max(0, (placed[id] || 0) - q), 0);
  const ingredientRatio = requiredTotal ? matched / requiredTotal : 1;
  score += WEIGHTS.ingredients * ingredientRatio;
  score -= Math.min(9, extraCount * 3); // gentle: creativity is not punished hard

  score += WEIGHTS.presentation * spreadScore(bowl.ingredients || []);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const rating = score >= 90 ? 'perfect' : score >= 70 ? 'good' : score >= 45 ? 'okay' : 'bad';
  const listPrice = BASE_PRICE.bowl + BASE_PRICE.perIngredient * requiredTotal;
  const payFactor = { perfect: 1, good: 1, okay: 0.8, bad: 0.5 }[rating];
  const payment = Math.round(listPrice * payFactor);
  const tipFactor = { perfect: 1, good: 0.5, okay: 0, bad: 0 }[rating];
  const tip = Math.max(0, Math.min(customer.budget - payment, Math.round(listPrice * customer.tipRate * tipFactor * 2)));

  return { score, rating, mistakes, payment, tip };
}
