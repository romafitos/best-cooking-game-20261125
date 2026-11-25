// Upgrades: one job — the stall's progression. Coins earned during the day
// unlock a third plate, a two-hand tray and a hotter wok, each announced
// with a banner, independent of the lunch and dinner waves.
import { HOT_WOK_SECONDS, START_PLATES, UPGRADES, WOK_SECONDS } from './config.js';
import { popup, shakeScreen } from './effects.js';
import { EVENT_UNLOCK } from './events.js';

export function hasUpgrade(state, id) {
  return state.unlocked.includes(id);
}

function applyUpgrade(state, id) {
  if (id === 'third-plate') state.plateSlots = START_PLATES + 1;
  if (id === 'tray') state.traySlots = 1;
  if (id === 'hot-wok') state.wokSeconds = HOT_WOK_SECONDS;
}

// Unlock every upgrade whose price the day's coins have reached.
export function checkUpgrades(state) {
  for (const upgrade of UPGRADES) {
    if (state.coins >= upgrade.at && !hasUpgrade(state, upgrade.id)) {
      state.unlocked.push(upgrade.id);
      applyUpgrade(state, upgrade.id);
      state.unlockLabel = `UNLOCKED: ${upgrade.name}`;
      state.unlockNote = upgrade.note;
      state.unlockBanner = 2.6;
      popup(state, 640, 196, `${upgrade.name}!`, '#7fb069');
      shakeScreen(state, 'unlock');
      state.events.push(EVENT_UNLOCK);
    }
  }
}

// The next upgrade still to come, for the HUD's "next at $N" hint.
export function nextUpgrade(state) {
  return UPGRADES.find((u) => !hasUpgrade(state, u.id)) ?? null;
}

export function baseUpgradeState() {
  return { unlocked: [], plateSlots: START_PLATES, traySlots: 0, wokSeconds: WOK_SECONDS };
}
