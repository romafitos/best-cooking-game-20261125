# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/romafitos/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/romafitos/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Wok & Ember — Night Market Kitchen.** You are Mira, a night-market chef.
Tickets roll in on the rail: chop it, wok it, steam it, plate it, and serve it
before the ticket runs out. Six original recipes from eight ingredients, two
rush waves (lunch at 1:00, dinner at 2:00), combo streaks for clean serving,
a wok that burns anything you forget in it — and a stall you upgrade with the
coins you earn: a third plate at $50, a two-hand tray at $100, a hot wok at
$160. Every serve lands with a gold shockwave, a beat of slow-motion and a
kick of screen shake.

## Run it

```sh
node serve.ts
# open http://localhost:8080 — or open game/index.html in desktop Chrome
```

No build step, no network: `game/` is plain static files. `main.ts` hands the
game in (`MAKEFUN_OUTPUT_DIR=out node main.ts`).

## How to play

- **WASD / arrows** — move Mira around the kitchen.
- **E** — interact: grab an ingredient, chop it (3 taps), cook it, plate it,
  serve a finished dish. Click a station to walk there instead.
- **P** — pause. **M** — mute. **Q** (or Tab) — swap the two items once
  the tray is unlocked.
- Crates (left) hold raw ingredients. The **board** chops, the **wok** cooks
  (4s, 3s once upgraded — leave it 9s and it burns), the **steamer** steams
  (5s, never burns). The **pass** (right) plates dishes and serves them
  against open tickets.
- Upgrades come from the coins of the day, not the clock: a good cook gets
  the third plate and the tray before the lunch rush. In the headless
  benchmark (`node tools/sim.mjs --bench`) the tray and hot wok cut the time
  to cook a dish from 33.1 s to 27.5 s on average.
- A plate needs exactly the 3 components of a recipe. Serve the right dish
  to the right ticket for coins + combo; a ticket that runs out walks away
  and resets your combo. Day ends after 3 minutes — best day wins.

## Files

Rules (no drawing, no input):
- `game/src/world.js` — a day's state and the fixed-step update.
- `game/src/kitchen-map.js` — station zones, collisions, nearest station.
- `game/src/stations.js` — what E does at each station; wok and steamer heat.
- `game/src/plates.js` — matching plates to recipes, plating, lifting dishes.
- `game/src/tickets.js` — waves, the order rail, walk-outs, paying for dishes.
- `game/src/carry.js` — the chef's hand and the tray behind it.
- `game/src/upgrades.js` — coin-bought stall upgrades and their banner.
- `game/src/effects.js` — particles, popups, screen shake, serve slow-mo.
- `game/src/events.js` — screen and event names shared by rules and sound.

Presentation:
- `game/src/render.js` — floor, stations, chef and effects under the shake.
- `game/src/food-art.js` — every ingredient and plate, drawn from code.
- `game/src/hud.js` — ticket rail, coins, combo, the big day clock, screens.
- `game/src/canvas-kit.js` — shared drawing helpers.
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files.
- `game/src/input.js` — keyboard + mouse.

Glue and tools:
- `game/src/main.js` — boot and the game loop (slow-mo scales the clock).
- `game/src/config.js` — recipes, ingredients, stations, waves, upgrades.
- `game/src/shots.js` — deterministic autopilot that stages the screenshots.
- `game/src/random.js` — seeded RNG.
- `tools/sim.mjs` — headless day simulator and per-dish benchmark.

---

<sub>Entered on [make.fun](https://make.fun/?ref=romafitos&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
