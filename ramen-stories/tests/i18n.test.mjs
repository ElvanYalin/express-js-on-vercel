import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, setLang } from '../../public/ramen-stories/js/i18n.js';
import { BROTHS, NOODLES, INGREDIENTS, CUSTOMERS, ORDERS, UPGRADES, EMPLOYEES } from '../../public/ramen-stories/js/data.js';

test('Turkish and English tables have identical keys', () => {
  const en = Object.keys(STRINGS.en).sort(), tr = Object.keys(STRINGS.tr).sort();
  assert.deepEqual(en.filter((k) => !tr.includes(k)), [], 'missing in tr');
  assert.deepEqual(tr.filter((k) => !en.includes(k)), [], 'missing in en');
});

test('every data id has localized names in both languages', () => {
  const keys = [
    ...BROTHS.map((b) => `broth.${b.id}`), ...NOODLES.map((n) => `noodle.${n.id}`), ...INGREDIENTS.map((i) => `ing.${i.id}`),
    ...CUSTOMERS.flatMap((c) => [`cust.${c.id}`, `role.${c.role}`]), ...ORDERS.map((o) => o.dialogue),
    ...UPGRADES.flatMap((u) => [`up.${u.id}`, `up.${u.id}.desc`]), ...EMPLOYEES.flatMap((e) => [`emp.${e.id}`, `emp.${e.role}`, `emp.${e.id}.ability`]),
  ];
  for (const lang of ['en', 'tr']) for (const k of keys) assert.ok(STRINGS[lang][k], `${lang}: ${k}`);
});

test('placeholders interpolate', () => {
  setLang('tr'); assert.equal(t('res.title', { day: 3 }), '3. Gün Tamamlandı');
  setLang('en'); assert.equal(t('hud.day', { day: 2 }), 'Day 2');
});
