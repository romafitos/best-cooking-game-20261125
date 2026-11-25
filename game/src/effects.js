// Effects: one job — game feel. Particle bursts, steam, floating text,
// screen shake and the serve slow-mo. Rules call these; render draws them.
import { SHAKE, SLOWMO_SECONDS, STEP } from './config.js';

export function burst(state, x, y, color, count, speed) {
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

export function steamPuff(state, x, y) {
  state.particles.push({
    x: x + (state.random() - 0.5) * 40, y, vx: (state.random() - 0.5) * 12,
    vy: -34 - state.random() * 22, life: 0, maxLife: 1.1,
    color: '#fff3d6', size: 8 + state.random() * 8, kind: 'steam',
  });
}

export function popup(state, x, y, text, color) {
  state.popups.push({ x, y, text, life: 0, maxLife: 1.2, color });
}

// Shake the frame; a stronger hit replaces a weaker one still running.
export function shakeScreen(state, kind) {
  const hit = SHAKE[kind];
  if (!hit) return;
  if (state.shake.time > 0 && state.shake.power > hit.power) return;
  state.shake = { power: hit.power, time: hit.time, maxTime: hit.time };
}

// A serve freezes the moment: the world runs slow while the ring flashes.
export function serveMoment(state, x, y) {
  state.slowmo = SLOWMO_SECONDS;
  state.rings.push({ x, y, life: 0, maxLife: 0.6 });
  shakeScreen(state, 'serve');
}

// The frame offset this step, from the shake still running (deterministic:
// it follows the world clock, so a screenshot seed always shakes the same).
export function shakeOffset(state) {
  if (!state.shake || state.shake.time <= 0) return { x: 0, y: 0 };
  const fade = state.shake.time / state.shake.maxTime;
  const p = state.shake.power * fade;
  return { x: Math.sin(state.time * 97) * p, y: Math.cos(state.time * 71) * p * 0.7 };
}

export function ageEffects(state) {
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
  for (let i = state.rings.length - 1; i >= 0; i -= 1) {
    const r = state.rings[i];
    r.life += STEP;
    if (r.life >= r.maxLife) state.rings.splice(i, 1);
  }
  if (state.shake.time > 0) state.shake.time = Math.max(0, state.shake.time - STEP);
  if (state.slowmo > 0) state.slowmo = Math.max(0, state.slowmo - STEP);
  if (state.unlockBanner > 0) state.unlockBanner = Math.max(0, state.unlockBanner - STEP);
}
