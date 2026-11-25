// Render: one job — paint the kitchen on canvas, flat-vector style. No
// rules here; it only reads world state. Every food icon is drawn from
// code, so the game needs no image assets at all.
import {
  CANVAS, DAY_SECONDS, INGREDIENTS, PALETTE, PLATE_SLOTS, RECIPES,
  STATIONS, WOK_SECONDS, STEAM_SECONDS,
} from './config.js';
import { plateRecipe } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function shortLabel(component) {
  const name = INGREDIENTS[component.ing].name;
  if (component.stage === 'chopped') return `${name} · chopped`;
  if (component.stage === 'wokked') return `${name} · wokked`;
  if (component.stage === 'steamed') return `${name} · steamed`;
  return name;
}

// One ingredient icon, drawn from shapes. `stage` tints it: raw is bright,
// wokked is golden-brown, steamed is pale, burnt is charred.
export function drawIngredient(ctx, ing, stage, x, y, r) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (stage === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.5);
    ctx.quadraticCurveTo(0, -r * 1.2, r * 0.4, -r * 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const color = stage === 'wokked' ? '#c98a2e' : stage === 'steamed' ? '#f3e2c7' : def.color;
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(36,26,18,0.55)';
  ctx.lineWidth = 2;
  if (ing === 'noodle') {
    ctx.lineWidth = 3;
    ctx.strokeStyle = stage === 'wokked' ? '#a86f1d' : '#e8a91c';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r, i * r * 0.45);
      ctx.quadraticCurveTo(0, i * r * 0.45 - r * 0.5, r, i * r * 0.45);
      ctx.stroke();
    }
  } else if (ing === 'chicken' || ing === 'beef') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.72, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.4, r * 0.25);
    ctx.stroke();
  } else if (ing === 'prawn') {
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.85, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(r * 0.7, r * 0.5);
    ctx.arc(r * 0.35, r * 0.5, r * 0.35, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (ing === 'pepper') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.3);
    ctx.quadraticCurveTo(0, r * 1.1, r * 0.8, -r * 0.5);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.1, -r * 0.8, -r * 0.3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -r * 0.5);
    ctx.quadraticCurveTo(r * 1.1, -r * 0.9, r * 0.6, -r * 1.0);
    ctx.stroke();
  } else if (ing === 'mushroom') {
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.9, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stage === 'steamed' ? '#e8dcc8' : '#d8c9a8';
    ctx.fillRect(-r * 0.28, -r * 0.1, r * 0.56, r * 0.7);
    ctx.strokeRect(-r * 0.28, -r * 0.1, r * 0.56, r * 0.7);
  } else if (ing === 'egg') {
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.85, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stage === 'wokked' ? '#f5a623' : '#ffd166';
    ctx.beginPath();
    ctx.arc(r * 0.1, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing === 'greens') {
    ctx.fillStyle = stage === 'wokked' ? '#5a8a3c' : '#7fb069';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.55, -i * i * r * 0.2, r * 0.45, r * 0.75, i * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r, items, ready) {
  ctx.fillStyle = '#f7f2e7';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ready ? '#7fb069' : 'rgba(36,26,18,0.4)';
  ctx.lineWidth = ready ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = '#e3d9c2';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  items.forEach((component, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, items.length)) * Math.PI * 2;
    drawIngredient(ctx, component.ing, component.stage, x + Math.cos(angle) * r * 0.4, y + Math.sin(angle) * r * 0.4, r * 0.3);
  });
}

function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(15,38,34,0.85)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  if (frac > 0) {
    rr(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2);
    ctx.fill();
  }
}

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
  rr(ctx, x, y, w, h, 8);
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
    drawIngredient(ctx, need.ing, need.stage, cx, y + 44, 10);
  });
  const barColor = frac > 0.5 ? '#7fb069' : frac > 0.25 ? '#f5a623' : '#e4572e';
  progressBar(ctx, x + 10, y + h - 10, w - 20, 6, frac, barColor);
  ctx.restore();
}

function drawChef(ctx, chef) {
  ctx.save();
  ctx.translate(chef.x, chef.y);
  if (chef.moving) ctx.translate(0, Math.sin(Date.now() / 90) * 1.5);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body / apron.
  ctx.fillStyle = '#f7f2e7';
  rr(ctx, -18, -6, 36, 28, 12);
  ctx.fill();
  ctx.fillStyle = '#2a9d8f';
  ctx.fillRect(-18, 8, 36, 6);
  // Head.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -20, 15, 0, Math.PI * 2);
  ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -14, -44, 28, 16, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -30, 6, 0, Math.PI * 2);
  ctx.arc(0, -33, 7, 0, Math.PI * 2);
  ctx.arc(9, -30, 6, 0, Math.PI * 2);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#241a12';
  const look = chef.face === 'left' ? -3 : chef.face === 'right' ? 3 : 0;
  ctx.beginPath();
  ctx.arc(-5 + look, -20, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + look, -20, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#241a12';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(look, -16, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item floats above the toque.
  if (chef.hand) {
    ctx.fillStyle = 'rgba(255,243,214,0.9)';
    ctx.beginPath();
    ctx.arc(0, -58, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(36,26,18,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (chef.hand.dish) {
      const recipe = RECIPES.find((r) => r.id === chef.hand.dish);
      if (recipe) drawPlate(ctx, 0, -58, 13, recipe.needs, true);
    } else {
      drawIngredient(ctx, chef.hand.ing, chef.hand.stage, 0, -58, 11);
    }
  }
  ctx.restore();
}

function drawStations(ctx, state) {
  // Ingredient crates.
  for (const crate of STATIONS.crates) {
    const def = INGREDIENTS[crate.ing];
    ctx.fillStyle = PALETTE.wood;
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, crate.ing, 'raw', crate.x + crate.w / 2, crate.y + 24, 15);
    text(ctx, def.name.toUpperCase(), crate.x + crate.w / 2, crate.y + crate.h - 10, 10, PALETTE.cream, 800, 'center');
  }
  // Chopping board.
  const b = STATIONS.board;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8dcc8';
  rr(ctx, b.x + 18, b.y + 30, b.w - 36, 62, 6);
  ctx.fill();
  if (state.board) {
    drawIngredient(ctx, state.board.item.ing, state.board.item.stage, b.x + b.w / 2, b.y + 61, 20);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.board.taps ? '#e4572e' : 'rgba(36,26,18,0.3)';
      ctx.beginPath();
      ctx.arc(b.x + 52 + i * 32, b.y + b.h - 16, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    text(ctx, 'CHOP ×3', b.x + b.w / 2, b.y + 61, 13, 'rgba(36,26,18,0.55)', 800, 'center');
  }
  text(ctx, b.label, b.x + b.w / 2, b.y - 12, 11, PALETTE.cream, 800, 'center');
  // Wok.
  const w = STATIONS.wok;
  ctx.fillStyle = '#3a3a3a';
  rr(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (state.wok) {
    const t = Date.now() / 160;
    ctx.fillStyle = '#ff7b2f';
    for (let i = 0; i < 3; i += 1) {
      const fx = w.x + 44 + i * 40;
      const fh = 22 + Math.sin(t + i * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(fx - 12, w.y + w.h - 18);
      ctx.quadraticCurveTo(fx, w.y + w.h - 18 - fh, fx + 12, w.y + w.h - 18);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(w.x + w.w / 2, w.y + 58, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e2e2e';
  ctx.beginPath();
  ctx.arc(w.x + w.w / 2, w.y + 58, 34, 0, Math.PI * 2);
  ctx.fill();
  if (state.wok) {
    drawIngredient(ctx, state.wok.item.ing, state.wok.item.stage, w.x + w.w / 2, w.y + 58, 20);
    const frac = Math.min(1, state.wok.t / WOK_SECONDS);
    const color = state.wok.item.stage === 'burnt' ? '#241a12' : '#f5a623';
    progressBar(ctx, w.x + 16, w.y + w.h - 22, w.w - 32, 8, frac, color);
    if (state.wok.item.stage === 'burnt') text(ctx, 'BURNT!', w.x + w.w / 2, w.y + 24, 13, '#ff8c66', 800, 'center');
  } else {
    text(ctx, 'READY', w.x + w.w / 2, w.y + 58, 12, 'rgba(255,243,214,0.6)', 800, 'center');
  }
  text(ctx, w.label, w.x + w.w / 2, w.y - 12, 11, PALETTE.cream, 800, 'center');
  // Steamer.
  const s = STATIONS.steamer;
  ctx.fillStyle = '#b8c4c9';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#8a979e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#8a979e';
  rr(ctx, s.x + 24, s.y + 22, s.w - 48, 52, 8);
  ctx.fill();
  ctx.fillStyle = '#6e7d84';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(s.x + 34 + i * 36, s.y + 34, 20, 4);
    ctx.fillRect(s.x + 34 + i * 36, s.y + 48, 20, 4);
  }
  if (state.steamer) {
    drawIngredient(ctx, state.steamer.item.ing, state.steamer.item.stage, s.x + s.w / 2, s.y + 48, 18);
    progressBar(ctx, s.x + 16, s.y + s.h - 22, s.w - 32, 8, Math.min(1, state.steamer.t / STEAM_SECONDS), '#7fb069');
  }
  text(ctx, s.label, s.x + s.w / 2, s.y - 12, 11, PALETTE.cream, 800, 'center');
  // Pass: plating + serve.
  const p = STATIONS.pass;
  ctx.fillStyle = PALETTE.counter;
  rr(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  state.plates.forEach((plate, i) => {
    const px = p.x + 62 + i * 130;
    const recipe = plateRecipe(plate);
    drawPlate(ctx, px, p.y + 66, 46, plate.items, !!recipe);
    if (recipe) text(ctx, 'READY', px, p.y + 128, 12, '#7fb069', 800, 'center');
    else if (plate.items.length > 0) text(ctx, `${plate.items.length}/3`, px, p.y + 128, 12, PALETTE.cream, 800, 'center');
  });
  ctx.fillStyle = '#e4572e';
  rr(ctx, p.x + p.w - 92, p.y + 12, 80, 28, 6);
  ctx.fill();
  text(ctx, 'SERVE →', p.x + p.w - 52, p.y + 27, 13, '#fff', 800, 'center');
  text(ctx, p.label, p.x + p.w / 2, p.y - 12, 11, PALETTE.cream, 800, 'center');
  // Trash.
  const t = STATIONS.trash;
  ctx.fillStyle = '#4a4a4a';
  rr(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.stroke();
  text(ctx, '🗑', t.x + t.w / 2, t.y + 26, 20, '#fff', 400, 'center');
  text(ctx, t.label, t.x + t.w / 2, t.y + t.h - 10, 10, PALETTE.cream, 800, 'center');
}

function drawHud(ctx, state) {
  // Ticket rail.
  state.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, 16 + i * 216, 10);
  });
  if (state.tickets.length === 0) {
    ctx.fillStyle = 'rgba(255,243,214,0.75)';
    rr(ctx, 16, 10, 204, 76, 8);
    ctx.fill();
    text(ctx, 'No orders yet —', 118, 40, 13, '#5a4a35', 700, 'center');
    text(ctx, 'grab an ingredient!', 118, 60, 13, '#5a4a35', 700, 'center');
  }
  // Right cluster: coins, combo, day clock.
  const rx = 900;
  ctx.fillStyle = 'rgba(15,38,34,0.8)';
  rr(ctx, rx, 10, 364, 76, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(rx + 30, 32, 13, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '$', rx + 30, 33, 15, '#8a6d1d', 800, 'center');
  text(ctx, String(state.coins), rx + 52, 32, 24, '#fff3d6', 800);
  text(ctx, 'COINS', rx + 52, 56, 10, 'rgba(255,243,214,0.7)', 700);
  if (state.combo >= 2) {
    ctx.fillStyle = '#e4572e';
    rr(ctx, rx + 150, 18, 92, 40, 8);
    ctx.fill();
    text(ctx, `COMBO ×${state.combo}`, rx + 196, 38, 16, '#fff', 800, 'center');
  } else {
    text(ctx, 'COMBO ×0', rx + 196, 38, 14, 'rgba(255,243,214,0.55)', 700, 'center');
  }
  const remain = Math.max(0, DAY_SECONDS - state.time);
  const mm = Math.floor(remain / 60);
  const ss = String(Math.floor(remain % 60)).padStart(2, '0');
  const lowTime = remain < 30;
  text(ctx, `${mm}:${ss}`, rx + 300, 32, 24, lowTime ? '#ff8c66' : '#fff3d6', 800, 'center');
  text(ctx, 'LEFT TODAY', rx + 300, 56, 10, 'rgba(255,243,214,0.7)', 700, 'center');
  progressBar(ctx, rx + 8, 66, 348, 6, remain / DAY_SECONDS, lowTime ? '#e4572e' : '#2a9d8f');
  // Rush banner.
  if (state.rushBanner > 0) {
    const alpha = Math.min(1, state.rushBanner);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#e4572e';
    rr(ctx, 440, 96, 400, 44, 10);
    ctx.fill();
    text(ctx, state.rushLabel, 640, 118, 22, '#fff', 800, 'center');
    ctx.restore();
  }
  // Hint line.
  text(ctx, 'WASD / arrows move · E interact · click a station to walk there · P pause · M mute', 640, 700, 12, 'rgba(255,243,214,0.55)', 600, 'center');
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const frac = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = p.kind === 'steam' ? frac * 0.5 : frac;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.kind === 'steam' ? 1 + p.life : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const p of state.popups) {
    const frac = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, frac * 2);
    text(ctx, p.text, p.x, p.y, 18, p.color, 800, 'center');
    ctx.restore();
  }
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(15,38,34,0.82)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'WOK & EMBER', 640, 210, 84, '#ffd166', 800, 'center');
  text(ctx, '— NIGHT MARKET KITCHEN —', 640, 268, 24, '#fff3d6', 700, 'center');
  text(ctx, 'Chop it. Wok it. Steam it. Plate it. Serve it before the ticket runs out.', 640, 330, 19, '#fff3d6', 600, 'center');
  text(ctx, '6 recipes · 8 ingredients · lunch rush at 1:00 · dinner rush at 2:00', 640, 362, 16, 'rgba(255,243,214,0.8)', 600, 'center');
  text(ctx, 'WASD / arrows to move · E to chop, cook, plate & serve · click a station to walk to it', 640, 408, 16, '#7fb069', 700, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0) text(ctx, 'PRESS ENTER TO OPEN THE STALL', 640, 480, 24, '#fff', 800, 'center');
  if (best > 0) text(ctx, `Best day so far: $${best}`, 640, 530, 16, '#ffd166', 700, 'center');
  text(ctx, 'A game by an AI agent for make.fun — original recipes, art, sounds and names.', 640, 580, 13, 'rgba(255,243,214,0.6)', 600, 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(15,38,34,0.85)';
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  text(ctx, 'DAY DONE!', 640, 180, 64, '#ffd166', 800, 'center');
  text(ctx, `Grade ${state.grade}`, 640, 250, 30, '#fff3d6', 800, 'center');
  text(ctx, `Coins earned: $${state.coins}`, 640, 310, 24, '#fff', 700, 'center');
  text(ctx, `Dishes served: ${state.served}   ·   Walked out: ${state.missed}   ·   Best combo: ×${state.bestCombo}`, 640, 350, 20, '#fff3d6', 600, 'center');
  if (Math.floor(Date.now() / 500) % 2 === 0) text(ctx, 'PRESS ENTER TO COOK ANOTHER DAY', 640, 430, 22, '#fff', 800, 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(state, best) {
      // Floor.
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(0, 0, CANVAS.width, 96);
      ctx.fillStyle = PALETTE.floor;
      ctx.fillRect(0, 96, CANVAS.width, CANVAS.height - 96);
      ctx.fillStyle = PALETTE.floorTile;
      for (let y = 120; y < CANVAS.height; y += 56) {
        for (let x = ((y / 56) % 2) * 28; x < CANVAS.width; x += 56) {
          ctx.fillRect(x, y, 52, 52);
        }
      }
      // A worn rug where the chef paces, and potted herbs by the pass.
      ctx.fillStyle = '#a34d2d';
      ctx.beginPath();
      ctx.ellipse(640, 560, 250, 84, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c96f3f';
      ctx.beginPath();
      ctx.ellipse(640, 560, 216, 66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a5a33';
      ctx.beginPath();
      ctx.ellipse(640, 560, 150, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      for (const px of [240, 1080]) {
        ctx.fillStyle = '#b0703a';
        rr(ctx, px - 16, 636, 32, 40, 6);
        ctx.fill();
        ctx.fillStyle = '#7fb069';
        ctx.beginPath();
        ctx.arc(px - 8, 628, 12, 0, Math.PI * 2);
        ctx.arc(px + 8, 624, 14, 0, Math.PI * 2);
        ctx.arc(px, 612, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // String lights along the wall.
      for (let x = 30; x < CANVAS.width; x += 64) {
        ctx.fillStyle = x % 128 === 30 ? '#ffd166' : '#e4572e';
        ctx.beginPath();
        ctx.arc(x, 100 + Math.sin(x / 40) * 4, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      drawStations(ctx, state);
      drawChef(ctx, state.chef);
      drawParticles(ctx, state);
      drawHud(ctx, state);
      if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, best);
      if (state.screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(15,38,34,0.7)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
        text(ctx, 'PAUSED', 640, 340, 56, '#fff3d6', 800, 'center');
        text(ctx, 'Press P to keep cooking', 640, 400, 18, '#fff3d6', 600, 'center');
      }
      if (state.screen === SCREEN_OVER) drawOver(ctx, state);
    },
  };
}
