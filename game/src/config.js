// Wok & Ember — Night Market Kitchen. Configuration: canvas, palette,
// ingredients, processing chains, recipes, stations, waves. One job: data.
// No logic here; world.js owns the rules, render.js owns the drawing.
export const CANVAS = { width: 1280, height: 720 };

export const PALETTE = {
  floor: '#17332d',
  floorTile: '#1d4038',
  wall: '#0f2622',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  counter: '#a06a3b',
  cream: '#fff3d6',
  ink: '#241a12',
  amber: '#f5a623',
  chili: '#e4572e',
  jade: '#2a9d8f',
  leaf: '#7fb069',
  gold: '#ffd166',
  steam: 'rgba(255,243,214,0.55)',
};

export const DAY_SECONDS = 180;
export const STEP = 1 / 60;
export const CHEF_SPEED = 260; // px per second
// Without the tray the chef carries one thing in hand; the tray unlock
// adds one more slot behind it (Q swaps which of the two is in front).
export const TRAY_SLOTS = 1;

// An ingredient's journey: raw -> chopped (board) -> wokked (wok), or
// raw -> steamed (steamer), or raw -> wokked (noodle, egg). `chop`, `wok`
// and `steam` say which stations accept it in its current stage.
export const INGREDIENTS = {
  noodle: { name: 'Noodle', color: '#f2c14e', chop: false, wok: true, steam: false, emoji: '~' },
  chicken: { name: 'Chicken', color: '#f6bd60', chop: true, wok: true, steam: false, emoji: '' },
  beef: { name: 'Beef', color: '#c1666b', chop: true, wok: true, steam: false, emoji: '' },
  prawn: { name: 'Prawn', color: '#ff8c66', chop: true, wok: true, steam: true, emoji: '' },
  pepper: { name: 'Chili Pepper', color: '#e4572e', chop: true, wok: true, steam: false, emoji: '' },
  mushroom: { name: 'Mushroom', color: '#e8dcc8', chop: true, wok: true, steam: true, emoji: '' },
  egg: { name: 'Egg', color: '#fff3d6', chop: false, wok: true, steam: true, emoji: '' },
  greens: { name: 'Greens', color: '#7fb069', chop: true, wok: true, steam: false, emoji: '' },
};
export const INGREDIENT_KEYS = Object.keys(INGREDIENTS);

// A component is one processed ingredient on a plate: { ing, stage } where
// stage is 'chopped' | 'wokked' | 'steamed'. A recipe is exactly 3.
export const RECIPES = [
  {
    id: 'ember-noodles', name: 'Ember Noodles', price: 24,
    needs: [{ ing: 'noodle', stage: 'wokked' }, { ing: 'chicken', stage: 'wokked' }, { ing: 'pepper', stage: 'chopped' }],
  },
  {
    id: 'golden-dumplings', name: 'Golden Dumplings', price: 26,
    needs: [{ ing: 'prawn', stage: 'steamed' }, { ing: 'mushroom', stage: 'steamed' }, { ing: 'greens', stage: 'chopped' }],
  },
  {
    id: 'beef-egg-noodles', name: 'Beef & Egg Noodles', price: 28,
    needs: [{ ing: 'noodle', stage: 'wokked' }, { ing: 'beef', stage: 'wokked' }, { ing: 'egg', stage: 'wokked' }],
  },
  {
    id: 'garden-stirfry', name: 'Garden Stir-Fry', price: 22,
    needs: [{ ing: 'greens', stage: 'wokked' }, { ing: 'mushroom', stage: 'wokked' }, { ing: 'pepper', stage: 'chopped' }],
  },
  {
    id: 'prawn-omelette', name: 'Prawn Omelette', price: 26,
    needs: [{ ing: 'egg', stage: 'wokked' }, { ing: 'prawn', stage: 'wokked' }, { ing: 'greens', stage: 'chopped' }],
  },
  {
    id: 'chili-pepper-chicken', name: 'Chili Pepper Chicken', price: 30,
    needs: [{ ing: 'chicken', stage: 'wokked' }, { ing: 'pepper', stage: 'wokked' }, { ing: 'greens', stage: 'chopped' }],
  },
];

// Stations: rectangles the chef stands next to. `kind` drives world.js.
export const STATIONS = {
  // One column down the left wall: a single column means the nearest crate
  // to a chef standing right of the block is always the crate in that row —
  // two columns would let the right column shadow the left one.
  crates: [
    { ing: 'noodle', x: 24, y: 116, w: 76, h: 58 },
    { ing: 'chicken', x: 24, y: 182, w: 76, h: 58 },
    { ing: 'beef', x: 24, y: 248, w: 76, h: 58 },
    { ing: 'prawn', x: 24, y: 314, w: 76, h: 58 },
    { ing: 'pepper', x: 24, y: 380, w: 76, h: 58 },
    { ing: 'mushroom', x: 24, y: 446, w: 76, h: 58 },
    { ing: 'egg', x: 24, y: 512, w: 76, h: 58 },
    { ing: 'greens', x: 24, y: 578, w: 76, h: 58 },
  ],
  board: { kind: 'board', label: 'CHOPPING BOARD', x: 252, y: 236, w: 168, h: 128 },
  wok: { kind: 'wok', label: 'WOK', x: 476, y: 236, w: 168, h: 128 },
  steamer: { kind: 'steamer', label: 'STEAMER', x: 700, y: 236, w: 168, h: 128 },
  pass: { kind: 'pass', label: 'PLATING & SERVE', x: 924, y: 236, w: 332, h: 168 },
  trash: { kind: 'trash', label: 'TRASH', x: 1168, y: 612, w: 88, h: 72 },
};

export const INTERACT_RADIUS = 96; // px from station centre to chef
export const CHOP_TAPS = 3; // taps of E to finish chopping
export const WOK_SECONDS = 4;
export const STEAM_SECONDS = 5;
export const BURN_SECONDS = 9; // wokked food burns if left this long

// Waves: the day escalates twice. Spawn interval and patience shrink.
export const WAVES = [
  // r2 balance: r1's 14/9/7 s spawns with 50/42/35 s patience let tickets
  // pile up faster than one cook can walk three components to the pass
  // (~35 s a dish), so a careful player still lost ~10 tickets a day and
  // the combo never got going. tools/sim.mjs --pilot fast: walk-outs
  // 9.9 -> 4.9 a day, best combo 1.1 -> 2.7.
  { from: 0, spawn: 18, patience: 72, label: 'MORNING PREP' },
  { from: 60, spawn: 13, patience: 60, label: 'LUNCH RUSH' },
  { from: 120, spawn: 10, patience: 50, label: 'DINNER RUSH' },
];
export const MAX_OPEN_TICKETS = 4;
export const PLATE_SLOTS = 3; // plates drawn on the pass
export const START_PLATES = 2; // plates usable before the third-plate unlock

// Stall upgrades: bought by the coins earned during the day, not by the
// clock, so a cook who serves well gets a bigger kitchen before the waves.
export const UPGRADES = [
  { id: 'third-plate', at: 50, name: 'THIRD PLATE', note: 'a third plate on the pass' },
  { id: 'tray', at: 100, name: 'TWO-HAND TRAY', note: 'carry two things, Q swaps' },
  { id: 'hot-wok', at: 160, name: 'HOT WOK', note: 'the wok cooks in 3 s' },
];
export const HOT_WOK_SECONDS = 3;

// Game feel: how hard and how long each hit shakes the frame, and how long
// a serve slows the kitchen (world seconds, played at SLOWMO_SCALE speed).
export const SHAKE = {
  serve: { power: 5, time: 0.25 },
  miss: { power: 9, time: 0.35 },
  burn: { power: 12, time: 0.45 },
  unlock: { power: 6, time: 0.3 },
};
export const SLOWMO_SECONDS = 0.22;
export const SLOWMO_SCALE = 0.35;

export const BEST_KEY = 'wok-and-ember-best';
