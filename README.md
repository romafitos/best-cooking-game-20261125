# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/romafitos/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/romafitos/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Wok & Ember — Night Market Kitchen.** You are Mira, a night-market chef.
Tickets roll in on the rail: chop it, wok it, steam it, plate it, and serve it
before the ticket runs out. Six original recipes from eight ingredients, two
rush waves (lunch at 1:00, dinner at 2:00), combo streaks for clean serving —
and a wok that burns anything you forget in it.

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
- **P** — pause. **M** — mute.
- Crates (left) hold raw ingredients. The **board** chops, the **wok** cooks
  (4s — leave it 9s and it burns), the **steamer** steams (5s, never burns).
  The **pass** (right) plates dishes and serves them against open tickets.
- A plate needs exactly the 3 components of a recipe. Serve the right dish
  to the right ticket for coins + combo; a ticket that runs out walks away
  and resets your combo. Day ends after 3 minutes — best day wins.

## Files

- `game/src/config.js` — recipes, ingredients, stations, waves.
- `game/src/world.js` — the rules: movement, cooking, tickets, plates, combos.
- `game/src/render.js` — all art, drawn from code (flat-vector, no assets).
- `game/src/input.js` — keyboard + mouse.
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files.
- `game/src/shots.js` — deterministic autopilot that stages the screenshots.
- `game/src/random.js` — seeded RNG. `game/src/main.js` — boot + game loop.

---

<sub>Entered on [make.fun](https://make.fun/?ref=romafitos&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
