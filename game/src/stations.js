// Stations: one job — what pressing E does at each station, and how the
// wok and steamer cook over time. Crates hand out raw food, the board
// chops, the wok fries (and burns), the steamer steams, the pass plates
// and serves, the trash takes anything.
import { BURN_SECONDS, CHOP_TAPS, INGREDIENTS, STATIONS, STEAM_SECONDS, STEP } from './config.js';
import { burst, popup, serveMoment, shakeScreen, steamPuff } from './effects.js';
import {
  EVENT_BURN, EVENT_CHOP, EVENT_DENY, EVENT_DING, EVENT_PICKUP, EVENT_PLACE,
  EVENT_SERVE, EVENT_SIZZLE, EVENT_TRASH,
} from './events.js';
import { addToPlate, isPlateable, plateRecipe, takeFinishedDish } from './plates.js';
import { payForDish } from './tickets.js';
import { canTake, giveItem, takeItem } from './carry.js';

export function canProcess(ing, stage, kind) {
  const def = INGREDIENTS[ing];
  if (kind === 'board') return stage === 'raw' && def.chop;
  if (kind === 'wok') return (stage === 'raw' || stage === 'chopped') && def.wok;
  if (kind === 'steamer') return stage === 'raw' && def.steam;
  return false;
}

function useCrate(state, zone) {
  if (!canTake(state)) { state.events.push(EVENT_DENY); return; }
  takeItem(state, { ing: zone.ing, stage: 'raw' });
  state.events.push(EVENT_PICKUP);
}

function useBoard(state, zone) {
  const hand = state.chef.hand;
  if (!state.board) {
    if (hand && canProcess(hand.ing, hand.stage, 'board')) {
      state.board = { item: giveItem(state), taps: 0 };
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
  if (canTake(state)) {
    takeItem(state, state.board.item);
    state.board = null;
    state.events.push(EVENT_PICKUP);
  } else state.events.push(EVENT_DENY);
}

function useHeat(state, zone) {
  const slot = zone.kind;
  const limit = slot === 'wok' ? state.wokSeconds : STEAM_SECONDS;
  const hand = state.chef.hand;
  if (!state[slot]) {
    if (hand && canProcess(hand.ing, hand.stage, slot)) {
      state[slot] = { item: giveItem(state), t: 0 };
      state.events.push(EVENT_SIZZLE);
    } else state.events.push(EVENT_DENY);
    return;
  }
  const cooking = state[slot];
  if (cooking.t >= limit && canTake(state)) {
    takeItem(state, cooking.item);
    state[slot] = null;
    state.events.push(EVENT_PICKUP);
  } else state.events.push(EVENT_DENY);
}

function usePass(state, zone) {
  const chef = state.chef;
  const hand = chef.hand;
  // Serving a finished dish comes first.
  if (hand && hand.dish) {
    const paid = payForDish(state, hand.dish);
    if (paid) {
      popup(state, chef.x, chef.y - 64, `+${paid.earned}  ${paid.name}`, '#ffd166');
      burst(state, zone.x + zone.w / 2, zone.y + 40, '#ffd166', 18, 180);
      serveMoment(state, zone.x + zone.w / 2, zone.y + 66);
      state.events.push(EVENT_SERVE);
      giveItem(state);
    } else {
      popup(state, chef.x, chef.y - 44, 'NO ORDER FOR THIS', '#e4572e');
      state.events.push(EVENT_DENY);
    }
    return;
  }
  // Plating the front component.
  if (isPlateable(hand)) {
    const plate = addToPlate(state, hand);
    if (plate) {
      giveItem(state);
      state.events.push(EVENT_PLACE);
      const recipe = plateRecipe(plate);
      if (recipe) {
        popup(state, zone.x + zone.w / 2, zone.y - 40, `${recipe.name} READY!`, '#7fb069');
        state.events.push(EVENT_DING);
      }
      return;
    }
  }
  // Lifting a finished dish (into the hand, or onto the tray).
  if (canTake(state)) {
    const dish = takeFinishedDish(state);
    if (dish) {
      takeItem(state, dish);
      state.events.push(EVENT_PICKUP);
      return;
    }
  }
  state.events.push(EVENT_DENY);
}

function useTrash(state) {
  if (state.chef.hand) {
    giveItem(state);
    state.events.push(EVENT_TRASH);
  } else state.events.push(EVENT_DENY);
}

export function interact(state, zone) {
  if (!zone) return;
  if (zone.kind === 'crate') useCrate(state, zone);
  else if (zone.kind === 'board') useBoard(state, zone);
  else if (zone.kind === 'wok' || zone.kind === 'steamer') useHeat(state, zone);
  else if (zone.kind === 'pass') usePass(state, zone);
  else if (zone.kind === 'trash') useTrash(state);
}

// Heat over time: the wok cooks then burns, the steamer never burns.
export function cookOverTime(state) {
  if (state.wok) {
    const wok = state.wok;
    wok.t += STEP;
    if (state.random() < 0.25) steamPuff(state, STATIONS.wok.x + STATIONS.wok.w / 2, STATIONS.wok.y + 20);
    if (wok.t >= state.wokSeconds && (wok.item.stage === 'raw' || wok.item.stage === 'chopped')) wok.item.stage = 'wokked';
    if (wok.t >= BURN_SECONDS && wok.item.stage !== 'burnt') {
      wok.item.stage = 'burnt';
      popup(state, STATIONS.wok.x + 84, STATIONS.wok.y - 40, 'BURNT!', '#e4572e');
      shakeScreen(state, 'burn');
      state.events.push(EVENT_BURN);
    }
  }
  if (state.steamer) {
    state.steamer.t += STEP;
    if (state.random() < 0.4) steamPuff(state, STATIONS.steamer.x + STATIONS.steamer.w / 2, STATIONS.steamer.y + 16);
    if (state.steamer.t >= STEAM_SECONDS && state.steamer.item.stage !== 'steamed') state.steamer.item.stage = 'steamed';
  }
}
