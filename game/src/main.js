// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the ticket order. ?shot=start|cover|rush|serve (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, SLOWMO_SCALE, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, stepWorld, EVENT_CHOP, EVENT_PICKUP, EVENT_PLACE, EVENT_SIZZLE, EVENT_DING, EVENT_SERVE, EVENT_MISS, EVENT_BURN, EVENT_RUSH, EVENT_TRASH, EVENT_DENY, EVENT_UNLOCK, EVENT_SWAP, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_START, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const input = createInput(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

let best = readBest();

function playEvents(events) {
  for (const event of events) {
    if (event === EVENT_CHOP) audio.chop();
    else if (event === EVENT_PICKUP) audio.pickup();
    else if (event === EVENT_PLACE) audio.place();
    else if (event === EVENT_SIZZLE) audio.sizzle();
    else if (event === EVENT_DING) audio.ding();
    else if (event === EVENT_SERVE) audio.serve();
    else if (event === EVENT_MISS) audio.miss();
    else if (event === EVENT_BURN) audio.burn();
    else if (event === EVENT_RUSH) audio.rush();
    else if (event === EVENT_TRASH) audio.trash();
    else if (event === EVENT_DENY) audio.deny();
    else if (event === EVENT_UNLOCK) audio.unlock();
    else if (event === EVENT_SWAP) audio.swap();
  }
}

function startDay() {
  const fresh = createWorld(createRandom(Math.floor(Math.random() * 4294967296)));
  Object.assign(world, fresh, { screen: SCREEN_PLAY, muted: world.muted });
  status.textContent = 'Cooking — serve tickets before they walk out!';
}

function endDay() {
  if (world.coins > best) {
    best = world.coins;
    saveBest(best);
  }
  status.textContent = `Day done — $${world.coins}, ${world.served} served, grade ${world.grade}.`;
}

if (shot) {
  // Screenshot mode: stage the scene, paint it, announce readiness. The
  // status line is hidden so the 1280x720 canvas fills the frame exactly.
  document.getElementById('status').style.display = 'none';
  document.body.style.justifyContent = 'flex-start';
  stageShot(world, shot);
  renderer.draw(world, best);
  renderer.draw(world, best);
  window.__shotReady = true;
  status.textContent = `Shot ${shot} staged.`;
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const pressed = input.takePressed();
    const click = input.takeClick();
    if (pressed.has(ACTION_MUTE)) {
      world.muted = !world.muted;
      audio.setMuted(world.muted);
    }
    audio.resume();
    if (pressed.has(ACTION_START) && (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER)) {
      startDay();
    } else if (pressed.has(ACTION_PAUSE) && (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSED)) {
      world.screen = world.screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    }
    if (world.screen === SCREEN_PLAY) {
      // A serve slows the whole kitchen for a beat (slow-mo), so the
      // world gets fewer fixed steps per real second while it lasts.
      acc += world.slowmo > 0 ? dt * SLOWMO_SCALE : dt;
      let firstStep = true;
      while (acc >= STEP) {
        const events = stepWorld(world, {
          move: input.move(),
          pressed: firstStep ? pressed : new Set(),
          click: firstStep ? click : null,
        });
        playEvents(events);
        acc -= STEP;
        firstStep = false;
        if (world.screen === SCREEN_OVER) { endDay(); break; }
      }
      // Pressed keys and clicks are consumed on the first step of the
      // frame only; later steps in the same frame get empty input.
    } else {
      acc = 0;
    }
    renderer.draw(world, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
