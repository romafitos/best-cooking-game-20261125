// World: one job — the state of a day and the fixed-step update that ties
// the kitchen together. The rules live in their own files: kitchen-map.js
// (where things are), stations.js (what E does), plates.js (the pass),
// tickets.js (the rail), carry.js (hands and tray), upgrades.js (unlocks)
// and effects.js (game feel). No drawing, no input here.
import { CHEF_SPEED, DAY_SECONDS, PLATE_SLOTS, STEP } from './config.js';
import { keepChefOnFloor, nearestStation, stationAtPoint, withinReach } from './kitchen-map.js';
import { cookOverTime, interact } from './stations.js';
import { gradeFor, updateRail } from './tickets.js';
import { ageEffects } from './effects.js';
import { baseUpgradeState, checkUpgrades } from './upgrades.js';
import { swapHands } from './carry.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './events.js';

export * from './events.js';
export { plateRecipe } from './plates.js';

export function createWorld(random) {
  return {
    random,
    screen: SCREEN_TITLE,
    time: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    chef: { x: 640, y: 560, hand: null, tray: null, face: 'down', moving: false },
    walkTarget: null,
    board: null, // { item, taps }
    wok: null, // { item, t }
    steamer: null, // { item, t }
    plates: Array.from({ length: PLATE_SLOTS }, () => ({ items: [] })),
    ...baseUpgradeState(),
    tickets: [],
    spawnTimer: 6,
    nextTicketId: 1,
    waveIndex: 0,
    rushBanner: 0,
    rushLabel: '',
    unlockBanner: 0,
    unlockLabel: '',
    unlockNote: '',
    particles: [],
    popups: [],
    rings: [],
    shake: { power: 0, time: 0, maxTime: 1 },
    slowmo: 0,
    events: [],
    grade: '',
    muted: false,
  };
}

// Keys move the chef; with no key held, a clicked walk target pulls the
// chef there and uses the station on arrival.
function moveChef(state, input) {
  const chef = state.chef;
  let mx = input.move.x;
  let my = input.move.y;
  if (mx === 0 && my === 0 && state.walkTarget) {
    const dx = state.walkTarget.x - chef.x;
    const dy = state.walkTarget.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 14) {
      const zone = state.walkTarget.zone;
      state.walkTarget = null;
      interact(state, zone);
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    chef.x += (mx / len) * CHEF_SPEED * STEP;
    chef.y += (my / len) * CHEF_SPEED * STEP;
    chef.moving = true;
    chef.face = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
  } else chef.moving = false;
  keepChefOnFloor(chef);
}

function handleClick(state, click) {
  const zone = stationAtPoint(click);
  if (!zone) { state.walkTarget = { x: click.x, y: click.y, zone: null }; return; }
  if (withinReach(state.chef, zone)) interact(state, zone);
  else state.walkTarget = { x: zone.x + zone.w / 2, y: zone.y + zone.h + 30, zone };
}

export function stepWorld(state, input) {
  state.events = [];
  if (state.screen !== SCREEN_PLAY) return state.events;
  moveChef(state, input);
  if (input.pressed.has('confirm')) interact(state, nearestStation(state.chef));
  if (input.pressed.has('swap')) swapHands(state);
  if (input.click) handleClick(state, input.click);
  state.time += STEP;
  updateRail(state);
  cookOverTime(state);
  checkUpgrades(state);
  ageEffects(state);
  if (state.time >= DAY_SECONDS) {
    state.screen = SCREEN_OVER;
    state.grade = gradeFor(state.served);
  }
  return state.events;
}

export { nearestStation, stationAtPoint };
