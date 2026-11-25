// Carrying: one job — the chef's hands. The front item is `chef.hand`;
// after the tray unlock a second item rides in `chef.tray` behind it.
// Taking fills the hand (moving the old front item to the tray), giving
// empties the hand and brings the tray item forward.
import { EVENT_SWAP } from './events.js';

export function canTake(state) {
  return !state.chef.hand || (state.traySlots > 0 && !state.chef.tray);
}

export function takeItem(state, item) {
  const chef = state.chef;
  if (!chef.hand) { chef.hand = item; return true; }
  if (state.traySlots > 0 && !chef.tray) {
    chef.tray = chef.hand;
    chef.hand = item;
    return true;
  }
  return false;
}

// Hand the front item over; the tray item steps forward.
export function giveItem(state) {
  const chef = state.chef;
  const item = chef.hand;
  chef.hand = chef.tray;
  chef.tray = null;
  return item;
}

export function swapHands(state) {
  const chef = state.chef;
  if (!chef.tray) return false;
  const front = chef.hand;
  chef.hand = chef.tray;
  chef.tray = front;
  state.events.push(EVENT_SWAP);
  return true;
}
