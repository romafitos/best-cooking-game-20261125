// HUD: one job — the screen furniture over the kitchen. The ticket rail,
// the coin and combo counters, the big day clock, the wave and unlock
// banners, and the title, pause and day-done screens.
import { CANVAS, DAY_SECONDS } from './config.js';
import { roundRect, text, progressBar } from './canvas-kit.js';
import { drawIngredient } from './food-art.js';
import { nextUpgrade } from './upgrades.js';

function drawTicket(ctx, ticket, x, y) {
  const w = 204;
  const h = 76;
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const urgent = ticket.patience < 10;
  ctx.save();
  if (urgent && Math.floor(ticket.patience * 4) % 2 === 0) ctx.translate(0, -2);
  ctx.fillStyle = '#fff8e7';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  text(ctx, ticket.recipe.name, x + 10, y + 15, 15, '#241a12', 800);
  text(ctx, `$${ticket.recipe.price}`, x + w - 10, y + 15, 14, '#b07d2a', 800, 'right');
  ticket.recipe.needs.forEach((need, i) => {
    const cx = x + 24 + i * 62;
    ctx.fillStyle = '#f0e6cf';
    ctx.beginPath();
    ctx.arc(cx, y + 44, 15, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, need.ing, need.stage, cx, y + 44, 11);
  });
  const barColor = frac > 0.5 ? '#7fb069' : frac > 0.25 ? '#f5a623' : '#e4572e';
  progressBar(ctx, x + 10, y + h - 10, w - 20, 6, frac, barColor);
  ctx.restore();
}

// The day clock: a dial whose ring drains as the day runs out, with the
// minutes and seconds large in the middle. Red and pulsing in the last 30 s.
function drawDayClock(ctx, state, cx, cy) {
  const remain = Math.max(0, DAY_SECONDS - state.time);
  const frac = remain / DAY_SECONDS;
  const lowTime = remain < 30;
  const pulse = lowTime ? 1 + Math.sin(state.time * 10) * 0.06 : 1;
  const r = 38 * pulse;
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,38,34,0.25)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = lowTime ? '#e4572e' : frac > 0.5 ? '#2a9d8f' : '#f5a623';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.stroke();
  const mm = Math.floor(remain / 60);
  const ss = String(Math.floor(remain % 60)).padStart(2, '0');
  text(ctx, `${mm}:${ss}`, cx, cy + 1, 27, lowTime ? '#c0392b' : '#241a12', 900, 'center');
}

function drawBanner(ctx, label, note, y, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  roundRect(ctx, 420, y, 440, note ? 58 : 44, 10);
  ctx.fill();
  text(ctx, label, 640, y + 22, 22, '#fff', 800, 'center');
  if (note) text(ctx, note, 640, y + 45, 14, '#fff3d6', 700, 'center');
  ctx.restore();
}

export function drawHud(ctx, state) {
  state.tickets.forEach((ticket, i) => drawTicket(ctx, ticket, 16 + i * 216, 10));
  if (state.tickets.length === 0) {
    ctx.fillStyle = 'rgba(255,243,214,0.75)';
    roundRect(ctx, 16, 10, 204, 76, 8);
    ctx.fill();
    text(ctx, 'No orders yet —', 118, 40, 13, '#5a4a35', 700, 'center');
    text(ctx, 'grab an ingredient!', 118, 60, 13, '#5a4a35', 700, 'center');
  }
  // Right cluster: coins (and the next unlock), combo, the big clock.
  const rx = 900;
  ctx.fillStyle = '#1d4038';
  roundRect(ctx, rx, 6, 372, 86, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,209,102,0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(rx + 26, 30, 13, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '$', rx + 26, 31, 15, '#8a6d1d', 800, 'center');
  text(ctx, String(state.coins), rx + 46, 30, 26, '#fff3d6', 800);
  const next = nextUpgrade(state);
  text(ctx, next ? `NEXT UNLOCK $${next.at}` : 'ALL UNLOCKED', rx + 14, 58, 10, 'rgba(255,243,214,0.75)', 700);
  if (next) progressBar(ctx, rx + 14, 70, 110, 8, state.coins / next.at, '#7fb069');
  if (state.combo >= 2) {
    ctx.fillStyle = '#e4572e';
    roundRect(ctx, rx + 138, 26, 100, 44, 8);
    ctx.fill();
    text(ctx, `COMBO ×${state.combo}`, rx + 188, 48, 17, '#fff', 800, 'center');
  } else {
    text(ctx, 'COMBO ×0', rx + 188, 48, 14, 'rgba(255,243,214,0.55)', 700, 'center');
  }
  drawDayClock(ctx, state, rx + 316, 49);
  if (state.rushBanner > 0) drawBanner(ctx, state.rushLabel, '', 100, '#e4572e', state.rushBanner);
  if (state.unlockBanner > 0) drawBanner(ctx, state.unlockLabel, state.unlockNote, 150, '#2a9d8f', state.unlockBanner);
  text(ctx, 'WASD / arrows move · E interact · Q swap tray · click a station to walk there · P pause · M mute', 640, 700, 12, 'rgba(255,243,214,0.6)', 600, 'center');
}

export function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(15,38,34,0.82)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'WOK & EMBER', 640, 200, 84, '#ffd166', 800, 'center');
  text(ctx, '— NIGHT MARKET KITCHEN —', 640, 258, 24, '#fff3d6', 700, 'center');
  text(ctx, 'Chop it. Wok it. Steam it. Plate it. Serve it before the ticket runs out.', 640, 318, 19, '#fff3d6', 600, 'center');
  text(ctx, '6 recipes · 8 ingredients · lunch rush at 1:00 · dinner rush at 2:00', 640, 350, 16, 'rgba(255,243,214,0.8)', 600, 'center');
  text(ctx, 'Earn to upgrade the stall:  $50 third plate  ·  $100 two-hand tray  ·  $160 hot wok', 640, 382, 16, '#ffd166', 700, 'center');
  text(ctx, 'WASD / arrows to move · E to chop, cook, plate & serve · Q swaps the tray · click a station to walk', 640, 420, 16, '#7fb069', 700, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0) text(ctx, 'PRESS ENTER TO OPEN THE STALL', 640, 484, 24, '#fff', 800, 'center');
  if (best > 0) text(ctx, `Best day so far: $${best}`, 640, 532, 16, '#ffd166', 700, 'center');
  text(ctx, 'A game by an AI agent for make.fun — original recipes, art, sounds and names.', 640, 580, 13, 'rgba(255,243,214,0.6)', 600, 'center');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(15,38,34,0.7)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'PAUSED', 640, 340, 56, '#fff3d6', 800, 'center');
  text(ctx, 'Press P to keep cooking', 640, 400, 18, '#fff3d6', 600, 'center');
}

export function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(15,38,34,0.85)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'DAY DONE!', 640, 180, 64, '#ffd166', 800, 'center');
  text(ctx, `Grade ${state.grade}`, 640, 250, 30, '#fff3d6', 800, 'center');
  text(ctx, `Coins earned: $${state.coins}`, 640, 310, 24, '#fff', 700, 'center');
  text(ctx, `Dishes served: ${state.served}   ·   Walked out: ${state.missed}   ·   Best combo: ×${state.bestCombo}`, 640, 350, 20, '#fff3d6', 600, 'center');
  text(ctx, `Upgrades earned: ${state.unlocked.length} of 3`, 640, 386, 18, '#7fb069', 700, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0) text(ctx, 'PRESS ENTER TO COOK ANOTHER DAY', 640, 440, 22, '#fff', 800, 'center');
}
