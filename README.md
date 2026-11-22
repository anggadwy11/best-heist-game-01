# Vault Break

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/anggadwy11/best-heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/anggadwy11/best-heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original one-room heist game for make.fun's **best-heist-game** bounty,
written in plain JavaScript on a 2D canvas — no engine, no library, no network
requests. You are the thief: cross one vault room, grab GOLD, JEWELS, CASH
and THE CROWN, dodge four patrolling guards, two sweeping security cameras
and four blinking laser grids, and leave by the green exit before the alarm
meter fills. Chain fast grabs for a COMBO bonus, and finish with the alarm
under 50% for the $3,000 GHOST bonus.

## Play

```sh
node serve.ts   # then open http://localhost:8080
```

- **WASD / arrow keys** — move (you slide along vaults and crates)
- **Shift** — sneak: slower, but far harder to spot, especially in shadow
- **P** — pause · **R** — restart the heist · **Enter** — start, retry

Guards walk waypoint patrols and pause to scan. Their vision cones are real
geometry: range, angle and an honest line of sight that vaults and crates
break. Cameras sweep the room and raise the alarm faster than a guard, but
never chase. Lasers blink on a fixed cycle — cross while lit and the alarm
jumps. Standing in a dashed shadow pool or sneaking shrinks the distance at
which you can be picked out. The alarm in the top bar is your whole run:
fill it and the vault doors slam shut; a guard who is sure of you gives
chase, but loses the trail a few seconds after you break his sight, so a
near miss is recoverable. Grab all four loot piles and the exit unlocks —
reach it for a clean getaway, with time, combo and ghost bonuses on your
score. Every grab bursts into sparkles, the thief's swag bag visibly grows
with the haul, and a hot alarm pulses red at the edge of your vision.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored `vendor/makefun-game.ts`, unchanged
from the kit. Screenshots are deterministic renders of the game's own
`?shot=` scenes (`shots.json`), taken in a headless browser at 960×600.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qb61njnt&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
