// Ramen Stories — game data definitions (vertical-slice scope).
// Mirrors the planned Unity ScriptableObjects 1:1 so balancing values can be
// ported without changes. Pure data: no DOM access, importable from Node.

export const PALETTE = Object.freeze({
  walnut: '#432820',
  wood: '#986044',
  cream: '#FFF0D6',
  lantern: '#F5A34A',
  red: '#A93C35',
  sakura: '#F2A5B8',
  teal: '#76B9B2',
  ink: '#292323',
  gold: '#F5CA72',
  // Derived support tones (tints/shades of the primary palette only)
  woodLight: '#B97E5C',
  woodDark: '#6B3F2E',
  walnutDeep: '#2F1B16',
  plaster: '#F6E4C6',
  plasterShade: '#E9CFA6',
  tealDeep: '#4F8F89',
  redDeep: '#7E2A26',
  steel: '#A9A39B',
  steelDark: '#6F6862',
});

export const BROTHS = [
  { id: 'shoyu', color: '#8A4B2A', surface: '#A8603A', cost: 4, unlocked: true },
  { id: 'miso', color: '#C9873C', surface: '#DDA055', cost: 5, unlocked: true },
  { id: 'tonkotsu', color: '#EED9B8', surface: '#F7E8CF', cost: 6, unlocked: true },
  { id: 'shio', color: '#E7C98A', surface: '#F2DCA6', cost: 5, unlocked: false },
  { id: 'spicyMiso', color: '#B9452F', surface: '#D0603F', cost: 7, unlocked: false },
];

// Cook windows in seconds. "perfect" is inclusive on both ends.
export const NOODLES = [
  { id: 'thin', cost: 2, perfect: [3.5, 5.5], over: 7.5, unlocked: true },
  { id: 'thick', cost: 3, perfect: [5.0, 7.0], over: 9.5, unlocked: true },
  { id: 'wavy', cost: 3, perfect: [4.0, 6.0], over: 8.0, unlocked: false },
];

export const INGREDIENTS = [
  { id: 'chashu', cost: 3, unlocked: true },
  { id: 'chicken', cost: 2, unlocked: true },
  { id: 'egg', cost: 1, unlocked: true },
  { id: 'nori', cost: 1, unlocked: true },
  { id: 'greenOnion', cost: 1, unlocked: true },
  { id: 'corn', cost: 1, unlocked: true },
  { id: 'mushroom', cost: 2, unlocked: true },
  { id: 'bamboo', cost: 1, unlocked: true },
  { id: 'naruto', cost: 2, unlocked: true },
  { id: 'chili', cost: 1, unlocked: true },
  // Post-slice content (data present, locked)
  { id: 'beef', cost: 4, unlocked: false },
  { id: 'garlic', cost: 1, unlocked: false },
  { id: 'sesame', cost: 1, unlocked: false },
  { id: 'sprouts', cost: 1, unlocked: false },
  { id: 'spinach', cost: 1, unlocked: false },
];

export const BOWLS = [
  { id: 'basic', unlocked: true, body: '#FFF0D6', band: '#76B9B2', inner: '#F3E2C6' },
  { id: 'red', unlocked: false, body: '#A93C35', band: '#F5CA72', inner: '#F6E4C6' },
  { id: 'black', unlocked: false, body: '#292323', band: '#A93C35', inner: '#3A302E' },
  { id: 'sakura', unlocked: false, body: '#FBE3E9', band: '#F2A5B8', inner: '#FFF0D6' },
];

// Character rig parameters. `look` is consumed by characters.js.
export const CUSTOMERS = [
  {
    id: 'mei', role: 'student', patience: 70, budget: 18, tipRate: 0.05,
    favorite: { broth: 'shoyu', noodle: 'thin' },
    look: { skin: '#F2C9A0', hair: '#2E2220', hairStyle: 'bob', top: '#76B9B2', topAccent: '#FFF0D6', bottom: '#4A5568', accessory: 'glasses', build: 'slim' },
  },
  {
    id: 'kenji', role: 'officeWorker', patience: 55, budget: 26, tipRate: 0.1,
    favorite: { broth: 'tonkotsu', noodle: 'thin' },
    look: { skin: '#E6B48A', hair: '#1F1A19', hairStyle: 'parted', top: '#3D4A5C', topAccent: '#A93C35', bottom: '#2F3744', accessory: 'tie', build: 'regular' },
  },
  {
    id: 'ece', role: 'athlete', patience: 60, budget: 24, tipRate: 0.12,
    favorite: { broth: 'miso', noodle: 'thick' },
    look: { skin: '#C98E64', hair: '#5A3222', hairStyle: 'ponytail', top: '#A93C35', topAccent: '#FFF0D6', bottom: '#292323', accessory: 'headband', build: 'athletic' },
  },
  {
    id: 'hoshino', role: 'elderlyRegular', patience: 95, budget: 22, tipRate: 0.15,
    favorite: { broth: 'shoyu', noodle: 'thick' },
    look: { skin: '#EBC3A0', hair: '#D9D4CC', hairStyle: 'bald', top: '#6B3F2E', topAccent: '#F5CA72', bottom: '#4B403A', accessory: 'cane', build: 'round' },
  },
  {
    id: 'lukas', role: 'tourist', patience: 80, budget: 30, tipRate: 0.18,
    favorite: { broth: 'tonkotsu', noodle: 'thick' },
    look: { skin: '#F4D3B8', hair: '#C98A3E', hairStyle: 'curly', top: '#F5A34A', topAccent: '#76B9B2', bottom: '#6E7F6A', accessory: 'camera', build: 'tall' },
  },
];

// Scripted orders for the first slice days. Each maps 1:1 to localized dialogue.
export const ORDERS = [
  { customer: 'mei', dialogue: 'order.mei.1', broth: 'shoyu', noodle: 'thin', ingredients: { egg: 1, greenOnion: 1, nori: 1 } },
  { customer: 'ece', dialogue: 'order.ece.1', broth: 'miso', noodle: 'thick', ingredients: { chashu: 2, chili: 1, corn: 1 } },
  { customer: 'hoshino', dialogue: 'order.hoshino.1', broth: 'shoyu', noodle: 'thick', ingredients: { chashu: 1, bamboo: 1, naruto: 1, greenOnion: 1 } },
  { customer: 'kenji', dialogue: 'order.kenji.1', broth: 'tonkotsu', noodle: 'thin', ingredients: { chashu: 1, egg: 1, mushroom: 1 } },
  { customer: 'lukas', dialogue: 'order.lukas.1', broth: 'tonkotsu', noodle: 'thick', ingredients: { chicken: 1, egg: 1, corn: 1, nori: 1 } },
];

export const BASE_PRICE = { bowl: 10, perIngredient: 2 };

export const UPGRADES = [
  { id: 'noodleCooker', levels: [0, 180, 420, 800, 1400], maxLevel: 5 },
  { id: 'brothStation', levels: [0, 150, 380, 750, 1300], maxLevel: 5 },
  { id: 'ingredientCounter', levels: [0, 220, 500, 900, 1500], maxLevel: 5 },
];

export const EMPLOYEES = [
  { id: 'taro', role: 'assistantChef', salary: 25, speed: 3, accuracy: 4, hireCost: 300,
    look: { skin: '#E3B088', hair: '#2E2220', hairStyle: 'short', top: '#FFF0D6', topAccent: '#A93C35', bottom: '#292323', accessory: 'hachimaki', build: 'regular' } },
  { id: 'nami', role: 'prepWorker', salary: 20, speed: 4, accuracy: 3, hireCost: 260, locked: true,
    look: { skin: '#D9A37B', hair: '#432820', hairStyle: 'bun', top: '#76B9B2', topAccent: '#FFF0D6', bottom: '#292323', accessory: 'apron', build: 'slim' } },
  { id: 'bora', role: 'waiter', salary: 18, speed: 5, accuracy: 3, hireCost: 240, locked: true,
    look: { skin: '#C48A60', hair: '#1F1A19', hairStyle: 'parted', top: '#292323', topAccent: '#F5CA72', bottom: '#292323', accessory: 'apron', build: 'tall' } },
];

export const PLAYER_CHEF = {
  id: 'chef',
  look: { skin: '#E8B993', hair: '#3A2620', hairStyle: 'short', top: '#FFF0D6', topAccent: '#432820', bottom: '#432820', accessory: 'chefBandana', build: 'regular' },
};
