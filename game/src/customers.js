// Customers: one job — draw the diners waiting at the stall's front
// counter, one per open ticket, so the pressure of the rail is in the room
// too: each sits on a stool with a bubble of the dish they want and a ring
// of patience that drains from green to red. Drawing only; no rules here.
import { drawIngredient } from './food-art.js';
import { roundRect, text } from './canvas-kit.js';

const COAT = ['#e9c46a', '#8ab17d', '#e76f51', '#90b4ce', '#c38fb5', '#f4a261'];
const SKIN = ['#f1c27d', '#c68642', '#e0ac69', '#8d5524', '#ffdbac'];

function moodColor(frac) {
  return frac > 0.55 ? '#7fb069' : frac > 0.28 ? '#f4a261' : '#e4572e';
}

function drawCounter(ctx) {
  // The front counter the diners lean on, below the chef's floor.
  ctx.fillStyle = '#6b3f22';
  roundRect(ctx, 300, 664, 680, 22, 8);
  ctx.fill();
  ctx.fillStyle = '#8a5530';
  roundRect(ctx, 300, 660, 680, 10, 6);
  ctx.fill();
}

function drawDiner(ctx, ticket, index, x, y) {
  const frac = Math.max(0, ticket.patience / ticket.maxPatience);
  const coat = COAT[ticket.id % COAT.length];
  const skin = SKIN[(ticket.id * 3) % SKIN.length];
  // Stool, body, head.
  ctx.fillStyle = '#3b2a1e';
  ctx.fillRect(x - 3, y + 26, 6, 18);
  ctx.fillStyle = coat;
  roundRect(ctx, x - 20, y - 4, 40, 34, 12);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y - 16, 15, 0, Math.PI * 2);
  ctx.fill();
  // Face: calm, then a flat mouth, then a frown as patience runs out.
  ctx.fillStyle = '#2b1d14';
  ctx.beginPath();
  ctx.arc(x - 5, y - 18, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 18, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1d14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (frac > 0.55) ctx.arc(x, y - 12, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (frac > 0.28) { ctx.moveTo(x - 5, y - 9); ctx.lineTo(x + 5, y - 9); }
  else ctx.arc(x, y - 5, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();
  // Order bubble with the dish's first component and a patience ring.
  const bx = x + 34;
  const by = y - 36;
  ctx.fillStyle = 'rgba(255,243,214,0.95)';
  ctx.beginPath();
  ctx.arc(bx, by, 19, 0, Math.PI * 2);
  ctx.fill();
  const first = ticket.recipe.needs[0];
  drawIngredient(ctx, first.ing, first.stage, bx, by, 11);
  ctx.strokeStyle = moodColor(frac);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(bx, by, 21, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  if (frac <= 0.28) text(ctx, '!', bx + 20, by - 18, 18, '#e4572e', 800, 'center');
}

export function drawCustomers(ctx, state) {
  drawCounter(ctx);
  const tickets = state.tickets || [];
  if (tickets.length === 0) {
    text(ctx, 'The counter is quiet — the next diner is on the way', 640, 640, 13, 'rgba(255,243,214,0.55)', 700, 'center');
    return;
  }
  const gap = 150;
  const startX = 640 - ((tickets.length - 1) * gap) / 2 - 16;
  tickets.forEach((ticket, index) => drawDiner(ctx, ticket, index, startX + index * gap, 630));
}
