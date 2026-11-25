// Screenshot scenes: each one plays the REAL rules forward from a fresh
// world for a fixed number of steps, steered by a scripted pilot that walks
// the chef between stations and presses E — so the frame is what a short
// game really looks like, and the same seed always gives the same frame.
// ?shot=start|cover|rush|serve|kitchen|results (with &seed=N) stages that scene instead of
// running the loop, paints it twice and sets window.__shotReady.
import { INGREDIENTS, STEP, STATIONS, RECIPES, STEAM_SECONDS } from './config.js';
import { stepWorld } from './world.js';

const SAMPLE = STEP;

// Centre of a station zone, plus a standing spot just outside it.
function spot(zone) {
  return { x: zone.x + zone.w / 2, y: zone.y + zone.h + 34 };
}
function crateSpot(ing) {
  const crate = STATIONS.crates.find((c) => c.ing === ing);
  // Stand to the right of the single crate column (it ends at x=100).
  return { x: 134, y: crate.y + crate.h / 2 };
}

// The pilot is a list of goals: { at: {x,y}, do: 'confirm'|'wait', n }.
// It walks (the world's own movement + collision) and presses E.
function runPilot(state, goals, seconds) {
  const input = { move: { x: 0, y: 0 }, pressed: new Set(), click: null };
  let goalIndex = 0;
  let waitLeft = -1; // -1 = this wait goal has not started yet
  let confirmCooldown = 0;
  const steps = Math.round(seconds / SAMPLE);
  for (let step = 0; step < steps; step += 1) {
    input.move = { x: 0, y: 0 };
    input.pressed = new Set();
    confirmCooldown -= SAMPLE;
    const goal = goals[goalIndex];
    if (!goal) break;
    const dx = goal.at.x - state.chef.x;
    const dy = goal.at.y - state.chef.y;
    const d = Math.hypot(dx, dy);
    if (goal.do === 'wait') {
      if (waitLeft < 0) waitLeft = goal.n;
      waitLeft -= SAMPLE;
      if (waitLeft <= 0) { goalIndex += 1; waitLeft = -1; }
    } else if (d > 16) {
      input.move = { x: dx / d, y: dy / d };
    } else if (goal.do === 'collect') {
      // Stand at the wok/steamer until its item is done, then lift it.
      const pot = state[goal.slot];
      const limit = goal.slot === 'wok' ? state.wokSeconds : STEAM_SECONDS;
      if (pot && pot.t >= limit && confirmCooldown <= 0) {
        input.pressed.add('confirm');
        confirmCooldown = 0.35;
        goalIndex += 1;
      }
    } else if (goal.do === 'confirm') {
      if (confirmCooldown <= 0) {
        input.pressed.add('confirm');
        confirmCooldown = 0.35;
        goal.taps = (goal.taps || 0) + 1;
        if (!goal.needTaps || goal.taps >= goal.needTaps) goalIndex += 1;
      }
    }
    stepWorld(state, input);
    if (state.screen !== 'play') break;
  }
}

function cookDish(state, recipeId, seconds) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const goals = [];
  // Build the dish component by component, in recipe order.
  for (const need of recipe.needs) {
    const ing = need.ing;
    const stage = need.stage;
    const needsChop = INGREDIENTS[ing].chop && stage !== 'steamed';
    if (stage === 'chopped' || stage === 'wokked') {
      goals.push({ at: crateSpot(ing), do: 'confirm' });
      if (needsChop) {
        goals.push({ at: spot(STATIONS.board), do: 'confirm', needTaps: 1 });
        goals.push({ at: spot(STATIONS.board), do: 'confirm', needTaps: 3 });
        goals.push({ at: spot(STATIONS.board), do: 'confirm' });
      }
      if (stage === 'wokked') {
        goals.push({ at: spot(STATIONS.wok), do: 'confirm' });
        goals.push({ at: spot(STATIONS.wok), do: 'wait', n: 4.5 });
        goals.push({ at: spot(STATIONS.wok), do: 'confirm' });
      }
    } else if (stage === 'steamed') {
      goals.push({ at: crateSpot(ing), do: 'confirm' });
      goals.push({ at: spot(STATIONS.steamer), do: 'confirm' });
      goals.push({ at: spot(STATIONS.steamer), do: 'wait', n: 5.5 });
      goals.push({ at: spot(STATIONS.steamer), do: 'confirm' });
    }
    goals.push({ at: spot(STATIONS.pass), do: 'confirm' });
  }
  runPilot(state, goals, seconds);
}

// A practised cook: start whatever needs heat first, chop the cold
// component while the wok or steamer works, then lift and plate. Same
// rules and stations as cookDish, just no standing around.
function fetchGoals(need) {
  const goals = [{ at: crateSpot(need.ing), do: 'confirm' }];
  if (INGREDIENTS[need.ing].chop && need.stage !== 'steamed') {
    goals.push({ at: spot(STATIONS.board), do: 'confirm', needTaps: 1 });
    goals.push({ at: spot(STATIONS.board), do: 'confirm', needTaps: 3 });
    goals.push({ at: spot(STATIONS.board), do: 'confirm' });
  }
  return goals;
}
function slotFor(need) {
  return need.stage === 'wokked' ? 'wok' : need.stage === 'steamed' ? 'steamer' : null;
}
function cookDishFast(state, recipeId, seconds) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const hot = recipe.needs.filter((n) => slotFor(n));
  const cold = recipe.needs.filter((n) => !slotFor(n));
  const pass = { at: spot(STATIONS.pass), do: 'confirm' };
  const goals = [];
  const busy = {}; // slot -> true while something is cooking there
  const start = (need) => {
    const slot = slotFor(need);
    goals.push(...fetchGoals(need), { at: spot(STATIONS[slot]), do: 'confirm' });
    busy[slot] = true;
  };
  const collect = (slot) => {
    goals.push({ at: spot(STATIONS[slot]), do: 'collect', slot }, pass);
    busy[slot] = false;
  };
  // The steamer never burns, so it starts first and works through the
  // whole dish; the wok burns, so the cook stays beside it.
  const steamed = hot.filter((n) => slotFor(n) === 'steamer');
  const wokked = hot.filter((n) => slotFor(n) === 'wok');
  if (steamed.length) start(steamed.shift());
  for (const need of cold) goals.push(...fetchGoals(need), pass);
  for (const need of wokked) { start(need); collect('wok'); }
  if (busy.steamer) collect('steamer');
  for (const need of steamed) { start(need); collect('steamer'); }
  runPilot(state, goals, seconds);
}

// The open ticket with the most patience left: the one the pilot can
// still finish before it walks out.
function longestWaitingTicket(state) {
  let best = null;
  for (const ticket of state.tickets) if (!best || ticket.patience > best.patience) best = ticket;
  return best;
}

// Cook the dish for a ticket and serve it; with no ticket yet, wait for one.
function serveNextTicket(state) {
  if (state.tickets.length === 0) runPilot(state, [{ at: { x: state.chef.x, y: state.chef.y }, do: 'wait', n: 8 }], 8);
  const ticket = longestWaitingTicket(state);
  if (!ticket) return;
  cookDish(state, ticket.recipe.id, 60);
  runPilot(state, [{ at: spot(STATIONS.pass), do: 'confirm', needTaps: 2 }], 6);
}

// Practised cook's pick: the most urgent ticket that can still be made in
// time (about 25 s of patience), else the freshest one.
function urgentTicket(state) {
  let best = null;
  for (const ticket of state.tickets) {
    if (ticket.patience < 25) continue;
    if (!best || ticket.patience < best.patience) best = ticket;
  }
  return best || longestWaitingTicket(state);
}
export function serveFast(state) {
  for (let i = 0; i < 20 && state.tickets.length === 0 && state.screen === 'play'; i += 1) {
    runPilot(state, [{ at: { x: state.chef.x, y: state.chef.y }, do: 'wait', n: 1 }], 1);
  }
  const ticket = urgentTicket(state);
  if (!ticket) return;
  cookDishFast(state, ticket.recipe.id, 60);
  runPilot(state, [{ at: spot(STATIONS.pass), do: 'confirm', needTaps: 2 }], 6);
}

// Serve dishes with the practised cook until the combo reaches `combo`
// at or after `notBefore` seconds (or the day runs low).
function streak(state, combo, notBefore) {
  for (let i = 0; i < 12 && state.screen === 'play' && state.time < 150; i += 1) {
    if (state.combo >= combo && state.time >= notBefore) return;
    serveFast(state);
  }
}

export function stageShot(state, shot) {
  state.screen = 'play';
  if (shot === 'start') {
    state.screen = 'title';
    return;
  }
  if (shot === 'cover') {
    // A busy mid-day frame on a live streak: dishes served back to back
    // (combo running), one dish READY on the pass and the next one
    // started: chopped greens on the next plate, noodles hitting the wok
    // and a pepper under the knife.
    streak(state, 2, 0);
    const ready = urgentTicket(state);
    if (ready) cookDishFast(state, ready.recipe.id, 60);
    const goals = [
      { at: crateSpot('greens'), do: 'confirm' },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 1 },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 3 },
      { at: spot(STATIONS.board), do: 'confirm' },
      { at: spot(STATIONS.pass), do: 'confirm' },
      { at: crateSpot('noodle'), do: 'confirm' },
      { at: spot(STATIONS.wok), do: 'confirm' },
      { at: crateSpot('pepper'), do: 'confirm' },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 1 },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 2 },
    ];
    runPilot(state, goals, 30);
    return;
  }
  if (shot === 'rush') {
    // Rush hour on a streak: dishes served back to back into the rush,
    // the chef heading out with two things at once once the tray is open.
    streak(state, 2, 100);
    const goals = [
      { at: crateSpot('prawn'), do: 'confirm' },
      { at: crateSpot('egg'), do: 'confirm' },
      { at: { x: 560, y: 430 }, do: 'walk' },
    ];
    runPilot(state, goals, 8.5);
    // Hold on until the dinner rush rolls in, so its banner is up.
    if (state.time < 120.4) {
      const n = 120.4 - state.time;
      runPilot(state, [{ at: { x: state.chef.x, y: state.chef.y }, do: 'wait', n }], n + STEP);
    }
    return;
  }
  if (shot === 'results') {
    // The end of a whole day played by the practised cook: the results
    // card with dishes served, walk-outs, best combo and the grade.
    for (let i = 0; i < 20 && state.screen === 'play'; i += 1) serveFast(state);
    for (let i = 0; i < 400 && state.screen === 'play'; i += 1) {
      runPilot(state, [{ at: { x: state.chef.x, y: state.chef.y }, do: 'wait', n: 1 }], 1);
    }
    return;
  }
  if (shot === 'kitchen') {
    // Every station busy: prawns in the steamer, noodles in the wok and
    // the chef mid-chop on a pepper — steam, flame and knife in one frame.
    streak(state, 2, 0);
    const goals = [
      { at: crateSpot('prawn'), do: 'confirm' },
      { at: spot(STATIONS.steamer), do: 'confirm' },
      { at: crateSpot('noodle'), do: 'confirm' },
      { at: spot(STATIONS.wok), do: 'confirm' },
      { at: crateSpot('pepper'), do: 'confirm' },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 1 },
      { at: spot(STATIONS.board), do: 'confirm', needTaps: 2 },
    ];
    runPilot(state, goals, 30);
    return;
  }
  if (shot === 'serve') {
    // The serve moment: pick up the finished dish, then serve it — the
    // frame catches the gold ring, the slow-mo vignette and the coins.
    const ticket = longestWaitingTicket(state);
    cookDish(state, ticket ? ticket.recipe.id : 'golden-dumplings', 60);
    const goals = [{ at: spot(STATIONS.pass), do: 'confirm', needTaps: 2 }];
    runPilot(state, goals, 8);
    // Advance a few steps so the ring has grown out of the pass, while
    // the slow-mo is still on.
    runPilot(state, [{ at: { x: state.chef.x, y: state.chef.y }, do: 'wait', n: 0.1 }], 0.1);
    return;
  }
  // Unknown shot: just open the stall.
}
