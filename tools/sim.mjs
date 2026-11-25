// Headless day simulator for Wok & Ember: plays whole 3-minute days with a
// greedy scripted cook against the real rules (game/src/world.js), no DOM.
// It answers "does a change make the kitchen play better?" with numbers:
//   node tools/sim.mjs [days=20]
// Prints served, coins, walk-outs and grade per seed plus the mean, and a
// JSON line at the end so before/after runs can be compared by machine.
import { createRandom } from '../game/src/random.js';
import * as worldModule from '../game/src/world.js';
import { INGREDIENTS, STATIONS, STEP } from '../game/src/config.js';

const { createWorld, stepWorld } = worldModule;
const days = Number(process.argv[2] || 20);
const useTray = process.argv.includes('--tray');

function standAt(zone) {
  return { x: zone.x + zone.w / 2, y: zone.y + zone.h + 34 };
}
function crateAt(ing) {
  const crate = STATIONS.crates.find((c) => c.ing === ing);
  return { x: 134, y: crate.y + crate.h / 2 };
}

// Turn the oldest open ticket into a list of walk-and-press goals. With the
// tray unlocked (and `useTray`), two components are fetched from the crates
// in one trip: the second rides in front, is finished first, then the first.
function planFor(recipe, trayOpen) {
  const perNeed = recipe.needs.map((need) => componentGoals(need));
  if (!trayOpen) return [...perNeed.flat(), { at: standAt(STATIONS.pass), press: 2 }];
  const goals = [];
  for (let i = 0; i < perNeed.length; i += 2) {
    const a = perNeed[i];
    const b = perNeed[i + 1];
    if (!b) { goals.push(...a); continue; }
    goals.push(a[0], b[0], ...b.slice(1), ...a.slice(1));
  }
  goals.push({ at: standAt(STATIONS.pass), press: 2 });
  return goals;
}

function componentGoals(need) {
  const goals = [];
  {
    goals.push({ at: crateAt(need.ing), press: 1 });
    if (need.stage === 'steamed') {
      goals.push({ at: standAt(STATIONS.steamer), press: 1 });
      goals.push({ at: standAt(STATIONS.steamer), waitFor: (s) => s.steamer && s.steamer.item.stage === 'steamed' });
      goals.push({ at: standAt(STATIONS.steamer), press: 1 });
    } else {
      if (INGREDIENTS[need.ing].chop) {
        goals.push({ at: standAt(STATIONS.board), press: 5 });
      }
      if (need.stage === 'wokked') {
        goals.push({ at: standAt(STATIONS.wok), press: 1 });
        goals.push({ at: standAt(STATIONS.wok), waitFor: (s) => s.wok && s.wok.item.stage === 'wokked' });
        goals.push({ at: standAt(STATIONS.wok), press: 1 });
      }
    }
    goals.push({ at: standAt(STATIONS.pass), press: 1 });
  }
  return goals;
}

function playDay(seed) {
  const state = createWorld(createRandom(seed));
  state.screen = 'play';
  let goals = [];
  let cooldown = 0;
  let pressesLeft = 0;
  let steps = 0;
  while (state.screen === 'play' && steps < 20000) {
    steps += 1;
    const input = { move: { x: 0, y: 0 }, pressed: new Set(), click: null };
    cooldown -= STEP;
    if (goals.length === 0 && state.tickets.length > 0 && !state.chef.hand) {
      goals = planFor(state.tickets[0].recipe, useTray && state.traySlots > 0);
    }
    const goal = goals[0];
    if (goal) {
      const dx = goal.at.x - state.chef.x;
      const dy = goal.at.y - state.chef.y;
      const d = Math.hypot(dx, dy);
      if (d > 16) input.move = { x: dx / d, y: dy / d };
      else if (goal.waitFor) { if (goal.waitFor(state)) goals.shift(); }
      else if (cooldown <= 0) {
        if (pressesLeft === 0) pressesLeft = goal.press;
        input.pressed.add('confirm');
        cooldown = 0.2;
        pressesLeft -= 1;
        if (pressesLeft === 0) goals.shift();
      }
    }
    stepWorld(state, input);
    // A dish whose ticket walked out is dropped and the plan restarts.
    if (goals.length === 0 && state.chef.hand && cooldown <= 0) {
      state.chef.hand = null;
      if (state.chef.tray) state.chef.tray = null;
    }
  }
  return { seed, served: state.served, coins: state.coins, missed: state.missed, grade: state.grade,
    plates: (state.plateSlots ?? state.plates.length), unlocked: (state.unlocked ?? []).join(',') };
}

// --bench: seconds to cook and plate each recipe from an empty kitchen,
// without and with the tray (and hot wok), patience ignored.
function benchRecipe(recipe, withTray) {
  const state = createWorld(createRandom(1));
  state.screen = 'play';
  state.spawnTimer = 1e9;
  if (withTray) { state.traySlots = 1; state.wokSeconds = 3; }
  const goals = planFor(recipe, withTray).slice(0, -1);
  let cooldown = 0;
  let pressesLeft = 0;
  let steps = 0;
  while (goals.length > 0 && steps < 20000) {
    steps += 1;
    const input = { move: { x: 0, y: 0 }, pressed: new Set(), click: null };
    cooldown -= STEP;
    const goal = goals[0];
    const dx = goal.at.x - state.chef.x;
    const dy = goal.at.y - state.chef.y;
    const d = Math.hypot(dx, dy);
    if (d > 16) input.move = { x: dx / d, y: dy / d };
    else if (goal.waitFor) { if (goal.waitFor(state)) goals.shift(); }
    else if (cooldown <= 0) {
      if (pressesLeft === 0) pressesLeft = goal.press;
      input.pressed.add('confirm');
      cooldown = 0.2;
      pressesLeft -= 1;
      if (pressesLeft === 0) goals.shift();
    }
    stepWorld(state, input);
  }
  const plated = state.plates.some((p) => p.items.length === 3);
  return { seconds: Math.round(steps * STEP * 10) / 10, plated };
}

if (process.argv.includes('--bench')) {
  const { RECIPES } = await import('../game/src/config.js');
  let a = 0;
  let b = 0;
  for (const recipe of RECIPES) {
    const plain = benchRecipe(recipe, false);
    const tray = benchRecipe(recipe, true);
    a += plain.seconds;
    b += tray.seconds;
    console.log(`${recipe.name.padEnd(22)} one-hand ${plain.seconds}s  tray+hot-wok ${tray.seconds}s  plated ${plain.plated && tray.plated}`);
  }
  console.log(JSON.stringify({ bench: true, oneHand: a / RECIPES.length, trayHotWok: b / RECIPES.length }));
  process.exit(0);
}

const rows = [];
for (let i = 0; i < days; i += 1) rows.push(playDay(1000 + i * 7));
for (const r of rows) console.log(`seed ${r.seed}  served ${r.served}  coins ${r.coins}  missed ${r.missed}  grade ${r.grade}  plates ${r.plates}  unlocked [${r.unlocked}]`);
const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
console.log(JSON.stringify({ days, served: mean('served'), coins: mean('coins'), missed: mean('missed') }));
