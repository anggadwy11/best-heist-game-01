// Vault Break — the vault room: one room, everything visible in one frame.
// Walls are solid rectangles. Shadows are dark pools where the thief is
// harder to spot. Loot, lasers, cameras and the exit are all placed here
// so the player can read the whole heist at a glance.

export const ROOM = {
  name: 'The Midnight Vault',
  width: 960,
  height: 600,
  start: { x: 480, y: 52 },
  exit: { x: 430, y: 538, w: 100, h: 44 },
  walls: [
    // outer frame is drawn by the renderer; these are the interior vaults
    { x: 80, y: 96, w: 170, h: 104 },   // north-west vault
    { x: 710, y: 96, w: 170, h: 104 },  // north-east vault
    { x: 380, y: 218, w: 200, h: 96 },  // central strongbox
    { x: 110, y: 428, w: 150, h: 84 },  // south-west crates
    { x: 700, y: 428, w: 150, h: 84 },  // south-east crates
    { x: 300, y: 96, w: 26, h: 70 },    // pillar, north
    { x: 634, y: 96, w: 26, h: 70 },    // pillar, north
  ],
  shadows: [
    { x: 270, y: 240, w: 90, h: 70 },
    { x: 600, y: 240, w: 90, h: 70 },
    { x: 400, y: 430, w: 160, h: 60 },
  ],
  loot: [
    { id: 'gold',   label: 'GOLD BARS',  value: 4200, x: 165, y: 148, taken: false, color: '#f0c44c' },
    { id: 'jewels', label: 'JEWELS',     value: 6800, x: 795, y: 148, taken: false, color: '#7fe3ff' },
    { id: 'cash',   label: 'CASH',       value: 3100, x: 480, y: 470, taken: false, color: '#7ee787' },
  ],
  guards: [
    { x: 180, y: 205, waypoints: [{ x: 180, y: 205 }, { x: 780, y: 205 }], speed: 62 },
    { x: 310, y: 360, waypoints: [{ x: 310, y: 250 }, { x: 310, y: 500 }], speed: 54 },
    { x: 650, y: 360, waypoints: [{ x: 650, y: 500 }, { x: 650, y: 250 }], speed: 54 },
  ],
  cameras: [
    { x: 480, y: 78, base: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 250 },
    { x: 918, y: 300, base: Math.PI, sweep: 0.7, speed: 0.42, range: 240 },
  ],
  lasers: [
    // horizontal beam across the middle, cycles on and off
    { x1: 180, y1: 352, x2: 780, y2: 352, period: 3.4, onTime: 2.0, phase: 0 },
    // vertical beam guarding the cash, offset phase so both are never on together
    { x1: 480, y1: 400, x2: 480, y2: 520, period: 3.4, onTime: 2.0, phase: 1.7 },
  ],
};

export function solidsOf(room) {
  return room.walls;
}

export function freshLoot() {
  return ROOM.loot.map((l) => ({ ...l, taken: false }));
}
