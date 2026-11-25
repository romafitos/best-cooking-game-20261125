// Render: one job — paint the kitchen on canvas, flat-vector style: the
// textured floor, the stations, the chef and the effects, under a frame
// that shakes on hits. It only reads world state. Food art lives in
// food-art.js and the HUD in hud.js; the game needs no image assets.
import { CANVAS, INGREDIENTS, PALETTE, RECIPES, STATIONS, STEAM_SECONDS, UPGRADES } from './config.js';
import { plateRecipe } from './plates.js';
import { shakeOffset } from './effects.js';
import { roundRect, text, progressBar } from './canvas-kit.js';
import { drawIngredient, drawLockedPlate, drawPlate } from './food-art.js';
import { drawHud, drawOver, drawPaused, drawTitle } from './hud.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_TITLE } from './events.js';

const TILE = 56;

// A stable per-tile number in 0..1, so the floor looks worn but the same
// on every frame and every run.
function tileNoise(i, j, salt) {
  let h = (i * 374761393 + j * 668265263 + salt * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Terrazzo floor: jade tiles in two shades with dark grout, a highlight
// bevel on each tile and scattered stone chips. Painted once, then reused.
function paintFloor(ctx, x0, y0, w, h) {
  ctx.fillStyle = '#0f2a24';
  ctx.fillRect(x0, y0, w, h);
  for (let j = 0; j * TILE < h; j += 1) {
    for (let i = 0; i * TILE < w; i += 1) {
      const x = x0 + i * TILE;
      const y = y0 + j * TILE;
      const n = tileNoise(i, j, 1);
      const base = (i + j) % 2 === 0 ? [27, 64, 56] : [23, 55, 48];
      const k = 0.9 + n * 0.2;
      ctx.fillStyle = `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = 'rgba(255,243,214,0.06)';
      ctx.fillRect(x + 2, y + 2, TILE - 4, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(x + 2, y + TILE - 5, TILE - 4, 3);
      for (let c = 0; c < 5; c += 1) {
        const cx = x + 6 + tileNoise(i, j, 10 + c) * (TILE - 12);
        const cy = y + 6 + tileNoise(i, j, 20 + c) * (TILE - 12);
        const tint = tileNoise(i, j, 30 + c);
        ctx.fillStyle = tint < 0.4 ? 'rgba(255,243,214,0.18)' : tint < 0.7 ? 'rgba(245,166,35,0.18)' : 'rgba(10,20,18,0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 1.2 + tint * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function makeFloorLayer() {
  if (typeof document === 'undefined') return null;
  const layer = document.createElement('canvas');
  layer.width = CANVAS.width + 40;
  layer.height = CANVAS.height + 40;
  paintFloor(layer.getContext('2d'), 0, 0, layer.width, layer.height);
  return layer;
}

function drawBackdrop(ctx, floorLayer) {
  if (floorLayer) ctx.drawImage(floorLayer, -20, 76);
  else paintFloor(ctx, -20, 76, CANVAS.width + 40, CANVAS.height);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(-20, -20, CANVAS.width + 40, 116);
  // A worn rug where the chef paces, and potted herbs by the walls.
  ctx.fillStyle = '#a34d2d';
  ctx.beginPath();
  ctx.ellipse(640, 560, 250, 84, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c96f3f';
  ctx.beginPath();
  ctx.ellipse(640, 560, 216, 66, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.ellipse(640, 560, 196, 56, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.ellipse(640, 560, 150, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const px of [240, 1080]) {
    ctx.fillStyle = '#b0703a';
    roundRect(ctx, px - 16, 636, 32, 40, 6);
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
}

function drawCrates(ctx) {
  for (const crate of STATIONS.crates) {
    const def = INGREDIENTS[crate.ing];
    ctx.fillStyle = PALETTE.wood;
    roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, crate.ing, 'raw', crate.x + crate.w / 2, crate.y + 24, 16);
    text(ctx, def.name.toUpperCase(), crate.x + crate.w / 2, crate.y + crate.h - 10, 10, PALETTE.cream, 800, 'center');
  }
}

function drawBoard(ctx, state) {
  const b = STATIONS.board;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8dcc8';
  roundRect(ctx, b.x + 18, b.y + 30, b.w - 36, 62, 6);
  ctx.fill();
  if (state.board) {
    drawIngredient(ctx, state.board.item.ing, state.board.item.stage, b.x + b.w / 2, b.y + 61, 22);
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
}

function drawWok(ctx, state) {
  const w = STATIONS.wok;
  ctx.fillStyle = '#3a3a3a';
  roundRect(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (state.wok) {
    const t = state.time * 6;
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
    drawIngredient(ctx, state.wok.item.ing, state.wok.item.stage, w.x + w.w / 2, w.y + 58, 22);
    const frac = Math.min(1, state.wok.t / state.wokSeconds);
    const color = state.wok.item.stage === 'burnt' ? '#241a12' : '#f5a623';
    progressBar(ctx, w.x + 16, w.y + w.h - 22, w.w - 32, 8, frac, color);
    if (state.wok.item.stage === 'burnt') text(ctx, 'BURNT!', w.x + w.w / 2, w.y + 24, 13, '#ff8c66', 800, 'center');
  } else {
    text(ctx, 'READY', w.x + w.w / 2, w.y + 58, 12, 'rgba(255,243,214,0.6)', 800, 'center');
  }
  const label = state.unlocked.includes('hot-wok') ? 'HOT WOK  3s' : w.label;
  text(ctx, label, w.x + w.w / 2, w.y - 12, 11, PALETTE.cream, 800, 'center');
}

function drawSteamer(ctx, state) {
  const s = STATIONS.steamer;
  ctx.fillStyle = '#b8c4c9';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#8a979e';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#8a979e';
  roundRect(ctx, s.x + 24, s.y + 22, s.w - 48, 52, 8);
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
}

// The pass: three plate slots (the third locked until its upgrade), each
// with its progress, and the SERVE marker.
function drawPass(ctx, state) {
  const p = STATIONS.pass;
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  const platePrice = UPGRADES.find((u) => u.id === 'third-plate').at;
  state.plates.forEach((plate, i) => {
    const px = p.x + 58 + i * 108;
    const py = p.y + 64;
    if (i >= state.plateSlots) { drawLockedPlate(ctx, px, py, 42, platePrice); return; }
    const recipe = plateRecipe(plate);
    drawPlate(ctx, px, py, 42, plate.items, !!recipe);
    if (recipe) text(ctx, 'READY', px, p.y + 122, 13, '#7fb069', 900, 'center');
    else if (plate.items.length > 0) text(ctx, `${plate.items.length}/3`, px, p.y + 122, 12, PALETTE.cream, 800, 'center');
  });
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, p.x + p.w - 96, p.y + p.h - 32, 84, 24, 6);
  ctx.fill();
  text(ctx, 'SERVE →', p.x + p.w - 54, p.y + p.h - 20, 13, '#fff', 800, 'center');
  text(ctx, p.label, p.x + p.w / 2, p.y - 12, 11, PALETTE.cream, 800, 'center');
}

function drawTrash(ctx) {
  const t = STATIONS.trash;
  ctx.fillStyle = '#4a4a4a';
  roundRect(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.stroke();
  // A little bin: lid, body, ribs.
  const bx = t.x + t.w / 2;
  ctx.fillStyle = '#9aa5ab';
  ctx.fillRect(bx - 14, t.y + 12, 28, 4);
  ctx.fillRect(bx - 4, t.y + 8, 8, 4);
  ctx.beginPath();
  ctx.moveTo(bx - 12, t.y + 18);
  ctx.lineTo(bx + 12, t.y + 18);
  ctx.lineTo(bx + 9, t.y + 42);
  ctx.lineTo(bx - 9, t.y + 42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 2;
  for (const dx of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.moveTo(bx + dx, t.y + 22);
    ctx.lineTo(bx + dx * 0.8, t.y + 38);
    ctx.stroke();
  }
  text(ctx, t.label, bx, t.y + t.h - 10, 10, PALETTE.cream, 800, 'center');
}

function drawCarried(ctx, item, x, y, r) {
  ctx.fillStyle = 'rgba(255,243,214,0.92)';
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(36,26,18,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (item.dish) {
    const recipe = RECIPES.find((rec) => rec.id === item.dish);
    if (recipe) drawPlate(ctx, x, y, r + 2, recipe.needs, true);
  } else {
    drawIngredient(ctx, item.ing, item.stage, x, y, r);
  }
}

function drawChef(ctx, state) {
  const chef = state.chef;
  ctx.save();
  ctx.translate(chef.x, chef.y);
  if (chef.moving) ctx.translate(0, Math.sin(state.time * 11) * 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7f2e7';
  roundRect(ctx, -18, -6, 36, 28, 12);
  ctx.fill();
  ctx.fillStyle = '#2a9d8f';
  ctx.fillRect(-18, 8, 36, 6);
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -20, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -14, -44, 28, 16, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-9, -30, 6, 0, Math.PI * 2);
  ctx.arc(0, -33, 7, 0, Math.PI * 2);
  ctx.arc(9, -30, 6, 0, Math.PI * 2);
  ctx.fill();
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
  // Front item above the toque; the tray item rides smaller beside it.
  if (chef.tray) drawCarried(ctx, chef.tray, 26, -48, 8);
  if (chef.hand) drawCarried(ctx, chef.hand, 0, -60, 12);
  ctx.restore();
}

function drawEffects(ctx, state) {
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
  // Serve rings: a gold shockwave that grows out of the pass.
  for (const ring of state.rings) {
    const f = ring.life / ring.maxLife;
    ctx.save();
    ctx.globalAlpha = 1 - f;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 10 * (1 - f) + 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 30 + f * 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  for (const p of state.popups) {
    const frac = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.min(1, frac * 2);
    ctx.strokeStyle = 'rgba(15,38,34,0.85)';
    ctx.lineWidth = 4;
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(p.text, p.x, p.y);
    text(ctx, p.text, p.x, p.y, 20, p.color, 800, 'center');
    ctx.restore();
  }
}

// While a serve's slow-mo runs, a warm vignette closes in on the frame.
function drawSlowmo(ctx, state) {
  if (state.slowmo <= 0) return;
  const a = Math.min(1, state.slowmo / 0.12);
  const g = ctx.createRadialGradient(640, 380, 260, 640, 380, 760);
  g.addColorStop(0, 'rgba(255,209,102,0)');
  g.addColorStop(1, `rgba(120,60,10,${0.45 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const floorLayer = makeFloorLayer();
  return {
    draw(state, best) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
      const shake = shakeOffset(state);
      ctx.save();
      ctx.translate(shake.x, shake.y);
      drawBackdrop(ctx, floorLayer);
      drawCrates(ctx);
      drawBoard(ctx, state);
      drawWok(ctx, state);
      drawSteamer(ctx, state);
      drawPass(ctx, state);
      drawTrash(ctx);
      drawChef(ctx, state);
      drawEffects(ctx, state);
      ctx.restore();
      drawSlowmo(ctx, state);
      drawHud(ctx, state);
      if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, best);
      if (state.screen === SCREEN_PAUSED) drawPaused(ctx);
      if (state.screen === SCREEN_OVER) drawOver(ctx, state);
    },
  };
}
