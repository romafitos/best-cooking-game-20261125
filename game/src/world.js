// World: one job — the rules of Wok & Ember. State, fixed-step updates,
// stations, tickets, plates, combos, waves. No drawing, no input here.
import {
  BURN_SECONDS, CHEF_SPEED, CHOP_TAPS, DAY_SECONDS, INGREDIENTS,
  INTERACT_RADIUS, MAX_OPEN_TICKETS, PLATE_SLOTS, RECIPES, STATIONS,
  STEAM_SECONDS, STEP, WAVES, WOK_SECONDS,
} from './config.js';
import { pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export const EVENT_CHOP = 'chop';
export const EVENT_PICKUP = 'pickup';
export const EVENT_PLACE = 'place';
export const EVENT_SIZZLE = 'sizzle';
export const EVENT_DING = 'ding';
export const EVENT_SERVE = 'serve';
export const EVENT_MISS = 'miss';
export const EVENT_BURN = 'burn';
export const EVENT_RUSH = 'rush';
export const EVENT_TRASH = 'trash';
export const EVENT_DENY = 'deny';

const CHEF_R = 24;
const FLOOR = { x0: 12, y0: 100, x1: 1268, y1: 708 };

function solids() {
  const list = [];
  for (const crate of STATIONS.crates) list.push({ x: crate.x, y: crate.y, w: crate.w, h: crate.h, id: 'crate' });
  list.push({ ...STATIONS.board, id: 'board' });
  list.push({ ...STATIONS.wok, id: 'wok' });
  list.push({ ...STATIONS.steamer, id: 'steamer' });
  list.push({ ...STATIONS.pass, id: 'pass' });
  list.push({ ...STATIONS.trash, id: 'trash' });
  return list;
}
const SOLIDS = solids();

function circleRectPush(chef, rect) {
  const cx = Math.max(rect.x, Math.min(chef.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(chef.y, rect.y + rect.h));
  const dx = chef.x - cx;
  const dy = chef.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= CHEF_R * CHEF_R) return;
  if (d2 === 0) { chef.y = rect.y - CHEF_R; return; }
  const d = Math.sqrt(d2);
  chef.x = cx + (dx / d) * CHEF_R;
  chef.y = cy + (dy / d) * CHEF_R;
}

function componentKey(component) {
  return `${component.ing}:${component.stage}`;
}

function recipeKey(recipe) {
  return recipe.needs.map(componentKey).sort().join('|');
}

function plateMatches(plate, recipe) {
  if (plate.items.length !== recipe.needs.length) return false;
  return plate.items.map(componentKey).sort().join('|') === recipeKey(recipe);
}

export function plateRecipe(plate) {
  for (const recipe of RECIPES) {
    if (plateMatches(plate, recipe)) return recipe;
  }
  return null;
}

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
    chef: { x: 640, y: 560, hand: null, face: 'down', moving: false },
    walkTarget: null,
    board: null, // { item, taps }
    wok: null, // { item, t }
    steamer: null, // { item, t }
    plates: Array.from({ length: PLATE_SLOTS }, () => ({ items: [] })),
    tickets: [],
    spawnTimer: 6,
    nextTicketId: 1,
    waveIndex: 0,
    rushBanner: 0,
    rushLabel: '',
    particles: [],
    popups: [],
    events: [],
    grade: '',
    muted: false,
  };
}

function waveAt(time) {
  let index = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    if (time >= WAVES[i].from) index = i;
  }
  return { wave: WAVES[index], index };
}

function burst(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = state.random() * Math.PI * 2;
    const v = speed * (0.4 + state.random() * 0.8);
    state.particles.push({
      x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 30,
      life: 0.5 + state.random() * 0.4, maxLife: 0.9,
      color, size: 3 + state.random() * 4, kind: 'chip',
    });
  }
}

function steamPuff(state, x, y) {
  state.particles.push({
    x: x + (state.random() - 0.5) * 40, y, vx: (state.random() - 0.5) * 12,
    vy: -34 - state.random() * 22, life: 0, maxLife: 1.1,
    color: '#fff3d6', size: 8 + state.random() * 8, kind: 'steam',
  });
}

function popup(state, x, y, text, color) {
  state.popups.push({ x, y, text, life: 0, maxLife: 1.2, color });
}

function spawnTicket(state) {
  const last = state.tickets.length > 0 ? state.tickets[state.tickets.length - 1].recipe.id : '';
  let recipe = pick(state.random, RECIPES);
  if (recipe.id === last) recipe = pick(state.random, RECIPES);
  const { wave } = waveAt(state.time);
  state.tickets.push({
    id: state.nextTicketId,
    recipe,
    patience: wave.patience,
    maxPatience: wave.patience,
  });
  state.nextTicketId += 1;
}

function nearestStation(chef) {
  let best = null;
  let bestD = Infinity;
  const zones = [];
  for (const crate of STATIONS.crates) zones.push({ kind: 'crate', ing: crate.ing, x: crate.x, y: crate.y, w: crate.w, h: crate.h });
  zones.push(STATIONS.board, STATIONS.wok, STATIONS.steamer, STATIONS.pass, STATIONS.trash);
  for (const zone of zones) {
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestD) { bestD = d; best = zone; }
  }
  return bestD <= INTERACT_RADIUS + 40 ? best : null;
}

function stationAtPoint(point) {
  const zones = [];
  for (const crate of STATIONS.crates) zones.push({ kind: 'crate', ing: crate.ing, x: crate.x, y: crate.y, w: crate.w, h: crate.h });
  zones.push(STATIONS.board, STATIONS.wok, STATIONS.steamer, STATIONS.pass, STATIONS.trash);
  for (const zone of zones) {
    if (point.x >= zone.x && point.x <= zone.x + zone.w && point.y >= zone.y && point.y <= zone.y + zone.h) return zone;
  }
  return null;
}

function canProcess(ing, stage, kind) {
  const def = INGREDIENTS[ing];
  if (kind === 'board') return stage === 'raw' && def.chop;
  if (kind === 'wok') return (stage === 'raw' || stage === 'chopped') && def.wok;
  if (kind === 'steamer') return stage === 'raw' && def.steam;
  return false;
}

function interact(state, zone) {
  const chef = state.chef;
  const hand = chef.hand;
  if (!zone) return;
  if (zone.kind === 'crate') {
    if (hand) { state.events.push(EVENT_DENY); return; }
    chef.hand = { ing: zone.ing, stage: 'raw' };
    state.events.push(EVENT_PICKUP);
    return;
  }
  if (zone.kind === 'board') {
    if (!state.board) {
      if (hand && canProcess(hand.ing, hand.stage, 'board')) {
        state.board = { item: hand, taps: 0 };
        chef.hand = null;
        state.events.push(EVENT_PLACE);
      } else state.events.push(EVENT_DENY);
      return;
    }
    if (state.board.taps < CHOP_TAPS) {
      state.board.taps += 1;
      burst(state, zone.x + zone.w / 2, zone.y + zone.h / 2, INGREDIENTS[state.board.item.ing].color, 8, 120);
      state.events.push(EVENT_CHOP);
      if (state.board.taps >= CHOP_TAPS) state.board.item.stage = 'chopped';
      return;
    }
    if (!hand) {
      chef.hand = state.board.item;
      state.board = null;
      state.events.push(EVENT_PICKUP);
    } else state.events.push(EVENT_DENY);
    return;
  }
  if (zone.kind === 'wok' || zone.kind === 'steamer') {
    const slot = zone.kind === 'wok' ? 'wok' : 'steamer';
    const limit = zone.kind === 'wok' ? WOK_SECONDS : STEAM_SECONDS;
    if (!state[slot]) {
      if (hand && canProcess(hand.ing, hand.stage, zone.kind)) {
        state[slot] = { item: hand, t: 0 };
        chef.hand = null;
        state.events.push(EVENT_SIZZLE);
      } else state.events.push(EVENT_DENY);
      return;
    }
    const cooking = state[slot];
    if (cooking.t >= limit && !hand) {
      chef.hand = cooking.item;
      state[slot] = null;
      state.events.push(EVENT_PICKUP);
    } else state.events.push(EVENT_DENY);
    return;
  }
  if (zone.kind === 'pass') {
    // Serving a finished dish takes priority over plating.
    if (hand && hand.dish) {
      const ticketIndex = state.tickets.findIndex((t) => t.recipe.id === hand.dish);
      if (ticketIndex >= 0) {
        const ticket = state.tickets[ticketIndex];
        state.tickets.splice(ticketIndex, 1);
        const timeBonus = Math.round(ticket.patience * 0.2);
        const earned = ticket.recipe.price + state.combo * 5 + timeBonus;
        state.coins += earned;
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.served += 1;
        popup(state, chef.x, chef.y - 64, `+${earned}  ${ticket.recipe.name}`, '#ffd166');
        burst(state, zone.x + zone.w / 2, zone.y + 40, '#ffd166', 14, 160);
        state.events.push(EVENT_SERVE);
        chef.hand = null;
      } else {
        popup(state, chef.x, chef.y - 44, 'NO ORDER FOR THIS', '#e4572e');
        state.events.push(EVENT_DENY);
      }
      return;
    }
    // Picking up a completed plate.
    if (!hand) {
      for (const plate of state.plates) {
        const recipe = plateRecipe(plate);
        if (recipe) {
          plate.items = [];
          chef.hand = { dish: recipe.id, name: recipe.name };
          state.events.push(EVENT_PICKUP);
          return;
        }
      }
    }
    // Plating one processed component.
    if (hand && !hand.dish && (hand.stage === 'chopped' || hand.stage === 'wokked' || hand.stage === 'steamed')) {
      const key = componentKey(hand);
      for (const plate of state.plates) {
        if (plate.items.length < 3 && !plate.items.some((c) => componentKey(c) === key)) {
          plate.items.push(hand);
          chef.hand = null;
          state.events.push(EVENT_PLACE);
          const recipe = plateRecipe(plate);
          if (recipe) {
            popup(state, zone.x + zone.w / 2, zone.y - 12, `${recipe.name} READY!`, '#7fb069');
            state.events.push(EVENT_DING);
          }
          return;
        }
      }
    }
    state.events.push(EVENT_DENY);
    return;
  }
  if (zone.kind === 'trash') {
    if (hand) {
      chef.hand = null;
      state.events.push(EVENT_TRASH);
    } else state.events.push(EVENT_DENY);
  }
}

export function stepWorld(state, input) {
  state.events = [];
  if (state.screen !== SCREEN_PLAY) return state.events;

  // Movement: keys, or a mouse walk target that auto-interacts on arrival.
  const chef = state.chef;
  let mx = input.move.x;
  let my = input.move.y;
  if ((mx === 0 && my === 0) && state.walkTarget) {
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
  chef.x = Math.max(FLOOR.x0, Math.min(FLOOR.x1, chef.x));
  chef.y = Math.max(FLOOR.y0, Math.min(FLOOR.y1, chef.y));
  for (const solid of SOLIDS) circleRectPush(chef, solid);

  if (input.pressed.has('confirm')) interact(state, nearestStation(chef));
  if (input.click) {
    const zone = stationAtPoint(input.click);
    if (zone) {
      const cx = zone.x + zone.w / 2;
      const cy = zone.y + zone.h / 2;
      if (Math.hypot(chef.x - cx, chef.y - cy) <= INTERACT_RADIUS + 40) interact(state, zone);
      else state.walkTarget = { x: cx, y: cy + zone.h / 2 + 30, zone };
    } else {
      state.walkTarget = { x: input.click.x, y: input.click.y, zone: null };
    }
  }

  // Clock, waves, tickets.
  state.time += STEP;
  const { wave, index } = waveAt(state.time);
  if (index !== state.waveIndex) {
    state.waveIndex = index;
    state.rushLabel = wave.label;
    state.rushBanner = 2.4;
    state.events.push(EVENT_RUSH);
  }
  if (state.rushBanner > 0) state.rushBanner -= STEP;
  state.spawnTimer -= STEP;
  if (state.spawnTimer <= 0 && state.tickets.length < MAX_OPEN_TICKETS) {
    spawnTicket(state);
    state.spawnTimer = wave.spawn;
  }
  for (let i = state.tickets.length - 1; i >= 0; i -= 1) {
    const ticket = state.tickets[i];
    ticket.patience -= STEP;
    if (ticket.patience <= 0) {
      state.tickets.splice(i, 1);
      state.missed += 1;
      state.combo = 0;
      popup(state, 440, 120, `${ticket.recipe.name} WALKED OUT`, '#e4572e');
      state.events.push(EVENT_MISS);
    }
  }

  // Cooking progress; the wok burns, the steamer never does.
  if (state.wok) {
    state.wok.t += STEP;
    if (state.random() < 0.25) steamPuff(state, STATIONS.wok.x + STATIONS.wok.w / 2, STATIONS.wok.y + 20);
    if (state.wok.t >= WOK_SECONDS && state.wok.item.stage === 'raw') state.wok.item.stage = 'wokked';
    if (state.wok.t >= WOK_SECONDS && state.wok.item.stage === 'chopped') state.wok.item.stage = 'wokked';
    if (state.wok.t >= BURN_SECONDS && state.wok.item.stage !== 'burnt') {
      state.wok.item.stage = 'burnt';
      popup(state, STATIONS.wok.x + 84, STATIONS.wok.y - 10, 'BURNT!', '#e4572e');
      state.events.push(EVENT_BURN);
    }
  }
  if (state.steamer) {
    state.steamer.t += STEP;
    if (state.random() < 0.4) steamPuff(state, STATIONS.steamer.x + STATIONS.steamer.w / 2, STATIONS.steamer.y + 16);
    if (state.steamer.t >= STEAM_SECONDS && state.steamer.item.stage !== 'steamed') state.steamer.item.stage = 'steamed';
  }

  // Particles and popups age out.
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.life += STEP;
    p.x += p.vx * STEP;
    p.y += p.vy * STEP;
    p.vy += 60 * STEP;
    if (p.life >= p.maxLife) state.particles.splice(i, 1);
  }
  for (let i = state.popups.length - 1; i >= 0; i -= 1) {
    const p = state.popups[i];
    p.life += STEP;
    p.y -= 26 * STEP;
    if (p.life >= p.maxLife) state.popups.splice(i, 1);
  }

  if (state.time >= DAY_SECONDS) {
    state.screen = SCREEN_OVER;
    const served = state.served;
    state.grade = served >= 14 ? 'S' : served >= 10 ? 'A' : served >= 7 ? 'B' : served >= 4 ? 'C' : 'D';
  }
  return state.events;
}

export { componentKey, recipeKey, plateMatches, nearestStation, stationAtPoint };
