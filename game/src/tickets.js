// Tickets: one job — the order rail. Which wave the day is in, new
// tickets, patience running out, and paying for a served dish.
import { MAX_OPEN_TICKETS, RECIPES, STEP, WAVES } from './config.js';
import { pick } from './random.js';
import { popup, shakeScreen } from './effects.js';
import { EVENT_MISS, EVENT_RUSH } from './events.js';

export function waveAt(time) {
  let index = 0;
  for (let i = 0; i < WAVES.length; i += 1) {
    if (time >= WAVES[i].from) index = i;
  }
  return { wave: WAVES[index], index };
}

export function spawnTicket(state) {
  const last = state.tickets.length > 0 ? state.tickets[state.tickets.length - 1].recipe.id : '';
  let recipe = pick(state.random, RECIPES);
  if (recipe.id === last) recipe = pick(state.random, RECIPES);
  const { wave } = waveAt(state.time);
  state.tickets.push({ id: state.nextTicketId, recipe, patience: wave.patience, maxPatience: wave.patience });
  state.nextTicketId += 1;
}

// Advance the wave banner, spawn on the wave's beat, and walk out tickets
// whose patience is gone (which breaks the combo and shakes the room).
export function updateRail(state) {
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
      shakeScreen(state, 'miss');
      state.events.push(EVENT_MISS);
    }
  }
}

// Pay for a dish against its open ticket. Returns the coins earned, or
// null when no open ticket wants that dish.
export function payForDish(state, dishId) {
  const index = state.tickets.findIndex((t) => t.recipe.id === dishId);
  if (index < 0) return null;
  const ticket = state.tickets[index];
  state.tickets.splice(index, 1);
  const timeBonus = Math.round(ticket.patience * 0.2);
  const earned = ticket.recipe.price + state.combo * 5 + timeBonus;
  state.coins += earned;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  return { earned, name: ticket.recipe.name };
}

export function gradeFor(served) {
  return served >= 14 ? 'S' : served >= 10 ? 'A' : served >= 7 ? 'B' : served >= 4 ? 'C' : 'D';
}
