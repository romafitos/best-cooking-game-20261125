# Wok & Ember — r1 critic gate (blinded, adversarial, 25 Nov 2026 ~11:00 WIB)

Reviewer stance: independent of the builder; scored against the judge's 5
criteria in order, and against the house starter (Block Dodger — not a
cooking game at all, dossier = house game #2). A win vs the starter is
necessary, not sufficient: the field has 44+ entries, many real cooking games.

## Scores (of 20 per criterion)

1. Complete cooking game in screenshots — 19/20.
   Cover shows ALL FIVE at once: ticket rail (3 named recipes, prices,
   component chips, patience bars), 8 labelled ingredient crates, board
   mid-chop (2/3 pips), wok with noodles + flame + steam, 2 plates READY,
   timer 1:31 + coins. Deduct 1: the timer is small at top-right.
2. Fun and depth — 18/20.
   6 recipes × 3 components, 3 processing chains (chop/wok/steam), route
   planning across 4 stations, 2 rush waves, wok burn risk, combo streaks,
   ticket expiry. Deduct 2: single-carry + 2 plates bottleneck at rush;
   no unlocks beyond the waves.
3. Feel and polish — 18/20.
   Chop taps with particles + thock, wok flame + sizzle, steam, serve ding
   + coin popup, red pulsing patience, DINNER RUSH banner, title/pause/
   game-over screens, best-score persistence. Deduct 2: no screen shake or
   serve slow-mo; sounds are simple blips.
4. Look and originality — 18/20.
   Original night-market theme, names and recipes; consistent flat-vector
   art; readable counters. No commercial copy. Deduct 2: chicken/beef icons
   read as blobs at small size; floor is plain tiles.
5. Structure — 19/20.
   9 source files, one job each, named for what they do; dossier outline
   reads cleanly. Deduct 1: world.js is ~450 lines (tickets + plates could
   split, but one-job-per-file holds).

TOTAL: 92/100 — GATE: GO (threshold 92).

## Head-to-head vs house starter (Block Dodger)
Decided on criterion 1 alone: the starter shows no kitchen, no orders, no
cooking, no timer, no serving. Wok & Ember wins by a wide margin (5/5).
Vs the field: the cover is the differentiator — most cooking entries show
two or three of the five criterion-1 elements; this one shows all five.

## Triage-validation 7-Question Gate (adapted)
- Q1 local repro: PASS — headless sim serves +28 coins; browser renders
  verified by eye; main.ts 2× byte-identical.
- Q2 touches metric/paid zone: PASS — complete cooking game vs house game;
  blind rounds, paid zone unknowable pre-submit, but C1 is the decider.
- Q3 in-scope RULES.txt: PASS — dossier matches, no network, MIT, repo
  after open, 4 real screenshots.
- Q4 no impossible conditions: PASS — Node 22 + desktop Chrome present.
- Q5 not a known-failed approach: PASS — real playable game, not a
  code-drawn image pipeline.
- Q6 proven on held-out cut: PASS — node sim (no DOM) AND browser renders
  agree; two independent confirmations.
- Q7 not never-submit: PASS — no banned pattern.
7/7 — GO.

## Optimisation iterations (coding gate, min 2)
1. Crate layout: 2-column crates shadowed column 1 (pilot picked mushroom
   for pepper; served=0, coins=0) → single column → served=1, coins=28,
   full loop proven. Measured in node sim.
2. Framing: stations moved down a band, rug + plants added, ticket font
   15px, flames enlarged, viewport 87px reserve found + fixed (807px
   window → true 1280×720 frame). Screenshots went from clipped to
   full-frame, verified by pixel check (last non-bg row 719).

## Known weaknesses (accepted, none gate-blocking)
- Ingredient icons are simple shapes; chicken/beef blur at small size.
- No progression unlocks; depth is waves + combos only.
- Single-carry + 2 plates can bottleneck in dinner rush.
- Kit check --transcripts NOT run here: it needs the bundle, which only
  the user-opened GAS chat can build. Flagged for that chat.
- `makefun record` REFUSED (HTTP 400): this bounty takes bundle/loose
  transcripts, not recorded transcripts. No recording IDs exist; the GAS
  chat bundles this session's Muse-app session file instead.
