// Food art: one job — draw every ingredient and plate from code, flat-vector
// style, readable even at ticket size (r≈10). `stage` tints the food: raw is
// bright, wokked is golden-brown, steamed is pale, burnt is charred.
import { INGREDIENTS } from './config.js';

const OUTLINE = 'rgba(36,26,18,0.7)';

function drawBurnt(ctx, r) {
  ctx.fillStyle = '#241a12';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.5);
  ctx.quadraticCurveTo(0, -r * 1.2, r * 0.4, -r * 0.5);
  ctx.stroke();
}

// A drumstick: a round meaty end tipped down-left, a white bone with a
// two-lobed knuckle up-right. The bone is what makes it read as chicken.
function drawChicken(ctx, r, stage) {
  const meat = stage === 'wokked' ? '#c97a2a' : stage === 'steamed' ? '#f3dcb8' : '#f2b26b';
  const skin = stage === 'wokked' ? '#9c5a1c' : '#d98f45';
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.strokeStyle = OUTLINE;
  // Bone shaft and knuckle.
  ctx.fillStyle = '#fbf6ea';
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  ctx.fillRect(r * 0.15, -r * 0.16, r * 0.75, r * 0.32);
  ctx.strokeRect(r * 0.15, -r * 0.16, r * 0.75, r * 0.32);
  ctx.beginPath();
  ctx.arc(r * 0.95, -r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.arc(r * 0.95, r * 0.2, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Meat: a teardrop that swallows the bone's base.
  ctx.fillStyle = meat;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.3);
  ctx.bezierCurveTo(r * 0.1, -r * 0.95, -r * 1.05, -r * 0.75, -r * 0.95, 0);
  ctx.bezierCurveTo(-r * 0.85, r * 0.75, r * 0.1, r * 0.95, r * 0.35, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Crisp skin highlight.
  ctx.strokeStyle = skin;
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.beginPath();
  ctx.arc(-r * 0.35, 0, r * 0.42, Math.PI * 0.75, Math.PI * 1.35);
  ctx.stroke();
  ctx.restore();
}

// A steak: a red slab with a cream fat rim along one side and marbling
// streaks; seared it turns brown with grill marks.
function drawBeef(ctx, r, stage) {
  const seared = stage === 'wokked';
  const flesh = seared ? '#8a4a2b' : stage === 'steamed' ? '#d9a8a0' : '#c8424a';
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = '#f7e6c4';
  ctx.beginPath();
  ctx.moveTo(-r * 1.0, -r * 0.2);
  ctx.bezierCurveTo(-r * 0.9, -r * 0.95, r * 0.6, -r * 1.0, r * 1.0, -r * 0.35);
  ctx.bezierCurveTo(r * 1.15, r * 0.4, r * 0.4, r * 0.9, -r * 0.2, r * 0.8);
  ctx.bezierCurveTo(-r * 0.85, r * 0.7, -r * 1.1, r * 0.3, -r * 1.0, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = flesh;
  ctx.beginPath();
  ctx.moveTo(-r * 0.78, -r * 0.15);
  ctx.bezierCurveTo(-r * 0.7, -r * 0.72, r * 0.5, -r * 0.78, r * 0.8, -r * 0.3);
  ctx.bezierCurveTo(r * 0.9, r * 0.3, r * 0.35, r * 0.65, -r * 0.2, r * 0.58);
  ctx.bezierCurveTo(-r * 0.7, r * 0.5, -r * 0.86, r * 0.2, -r * 0.78, -r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = seared ? '#4a2414' : 'rgba(255,236,214,0.85)';
  ctx.lineWidth = Math.max(1.2, r * 0.1);
  ctx.beginPath();
  if (seared) {
    for (let i = -1; i <= 1; i += 1) {
      ctx.moveTo(-r * 0.45 + i * r * 0.4, -r * 0.55);
      ctx.lineTo(-r * 0.05 + i * r * 0.4, r * 0.45);
    }
  } else {
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.quadraticCurveTo(-r * 0.1, -r * 0.45, r * 0.3, -r * 0.2);
    ctx.moveTo(-r * 0.3, r * 0.2);
    ctx.quadraticCurveTo(r * 0.1, r * 0.05, r * 0.5, r * 0.15);
  }
  ctx.stroke();
}

export function drawIngredient(ctx, ing, stage, x, y, r) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (stage === 'burnt') { drawBurnt(ctx, r); ctx.restore(); return; }
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
  } else if (ing === 'chicken') {
    drawChicken(ctx, r, stage);
  } else if (ing === 'beef') {
    drawBeef(ctx, r, stage);
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

export function drawPlate(ctx, x, y, r, items, ready) {
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
    drawIngredient(ctx, component.ing, component.stage, x + Math.cos(angle) * r * 0.4, y + Math.sin(angle) * r * 0.4, r * 0.32);
  });
}

// A plate slot the stall has not unlocked yet: a dashed ring and its price.
export function drawLockedPlate(ctx, x, y, r, price) {
  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,243,214,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,243,214,0.85)';
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LOCKED', x, y - 8);
  ctx.fillText(`at $${price}`, x, y + 9);
}
