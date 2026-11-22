// Vault Break — game flow: title, one vault room, caught and clean getaway.
// Cross the room, grab GOLD, JEWELS, CASH and THE CROWN, dodge the
// patrols, the sweeping cameras and the blinking lasers, and leave by
// the green exit before the alarm meter fills. Sneak (Shift) and the
// shadow pools make you harder to spot; being seen is recoverable until
// the alarm is full. Fast grab chains pay a COMBO bonus, and finishing
// with the alarm under 50% pays the GHOST bonus.
//
// Keys: WASD / arrows move, Shift sneak, P pause, R restart, Enter start.
// ?shot=title|play|alarm|win stages a still scene for the screenshots
// and sets window.__shotReady when it has been drawn.

import { ROOM, solidsOf, freshLoot } from './level.js';
import { makeGuard, stepGuard, canSee, turnToward, sendGuardTo } from './guards.js';
import { makeCamera, stepCamera, cameraSees, laserOn, pointOnLaser } from './cameras.js';
import { drawScene, drawHud, drawBanner } from './render.js';
import { blip, pickupSound, alarmSound, caughtSound, winSound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const keys = new Set();
addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
  if (e.key === 'Enter' && state.mode !== 'play') advance();
  if (e.key.toLowerCase() === 'r' && state.mode === 'play') startHeist();
  if (e.key.toLowerCase() === 'p' && state.mode === 'play') state.paused = !state.paused;
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

const state = {
  mode: 'title', // title | play | caught | win
  room: ROOM,
  player: { x: ROOM.start.x, y: ROOM.start.y, crouch: false, inShadow: false },
  guards: [],
  cameras: [],
  loot: [],
  lootTaken: 0,
  score: 0,
  alarm: 0,
  time: 0,
  paused: false,
  laserHitAt: -10,
  alarmWarned: false,
  particles: [],
  combo: 0,
  lastLootAt: -99,
  maxAlarm: 0,
  timeBonus: 0,
  ghostBonus: 0,
  comboBonus: 0,
};

function burst(x, y, color, n, speed, size) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (0.3 + Math.random() * 0.7) * speed;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 18,
      life: 0.7 + Math.random() * 0.6,
      color, size: size * (0.6 + Math.random() * 0.8),
    });
  }
}

function startHeist() {
  state.player.x = ROOM.start.x;
  state.player.y = ROOM.start.y;
  state.player.crouch = false;
  state.guards = ROOM.guards.map(makeGuard);
  state.cameras = ROOM.cameras.map(makeCamera);
  state.loot = freshLoot();
  state.lootTaken = 0;
  state.score = 0;
  state.alarm = 0;
  state.time = 0;
  state.paused = false;
  state.laserHitAt = -10;
  state.alarmWarned = false;
  state.particles = [];
  state.combo = 0;
  state.lastLootAt = -99;
  state.maxAlarm = 0;
  state.timeBonus = 0;
  state.ghostBonus = 0;
  state.comboBonus = 0;
  state.mode = 'play';
}

function advance() {
  if (state.mode === 'title') startHeist();
  else if (state.mode === 'caught') startHeist();
  else if (state.mode === 'win') startHeist();
}

function hitsSolid(x, y, r, solids) {
  for (const s of solids) {
    if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return true;
  }
  return false;
}

function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

function step(dt) {
  if (state.paused) return;
  state.time += dt;
  // particles drift and fade in every mode, so the win screen celebrates
  for (const pt of state.particles) {
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    pt.vy += 55 * dt; pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);
  if (state.mode !== 'play') return;
  const solids = solidsOf(state.room);
  const p = state.player;

  p.crouch = keys.has('shift');
  const speed = p.crouch ? 82 : 165;
  let mx = 0, my = 0;
  if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
  if (keys.has('d') || keys.has('arrowright')) mx += 1;
  if (keys.has('w') || keys.has('arrowup')) my -= 1;
  if (keys.has('s') || keys.has('arrowdown')) my += 1;
  const len = Math.hypot(mx, my) || 1;
  const nx = p.x + (mx / len) * speed * dt;
  const ny = p.y + (my / len) * speed * dt;
  if (!hitsSolid(nx, p.y, 10, solids)) p.x = nx;
  if (!hitsSolid(p.x, ny, 10, solids)) p.y = ny;
  p.x = Math.max(26, Math.min(934, p.x));
  p.y = Math.max(44, Math.min(574, p.y));

  p.inShadow = state.room.shadows.some((r) => inRect(p.x, p.y, r));
  const exposure = (p.inShadow ? 0.55 : 1) * (p.crouch ? 0.6 : 1);

  // guards: sight feeds the alarm; a sure guard gives chase, then gives up
  let strongest = 0;
  for (const g of state.guards) {
    stepGuard(g, dt, solids);
    const seen = canSee(g, p.x, p.y, solids, exposure);
    g.alert = Math.max(0, Math.min(100, g.alert + (seen > 0 ? seen * 120 * dt : -24 * dt)));
    if (g.alert > 55 && seen > 0) g.angle = turnToward(g.angle, Math.atan2(p.y - g.y, p.x - g.x), dt * 2.4);
    if (seen > 0.35 && g.alert > 70 && g.mode !== 'chase') sendGuardTo(g, p.x, p.y, 'chase');
    if (g.mode === 'chase') {
      if (seen > 0) { g.chaseX = p.x; g.chaseY = p.y; g.lostTime = 0; }
      else {
        g.lostTime += dt;
        if (g.lostTime > 3) { g.mode = 'patrol'; g.alert = 40; }
      }
    }
    strongest = Math.max(strongest, seen * (0.55 + g.alert / 220));
  }

  // cameras: faster alarm, no chase — they only raise the alarm
  for (const c of state.cameras) {
    stepCamera(c, dt);
    const seen = cameraSees(c, p.x, p.y, solids, exposure);
    strongest = Math.max(strongest, seen * 0.85);
  }

  // lasers: a lit beam you touch spikes the alarm once per second
  for (const laser of state.room.lasers) {
    if (pointOnLaser(p.x, p.y, laser, state.time) && state.time - state.laserHitAt > 1) {
      state.laserHitAt = state.time;
      state.alarm = Math.min(100, state.alarm + 22);
      state.combo = 0;
      burst(p.x, p.y, '#ff3b4e', 12, 90, 3);
      alarmSound();
      blip(180, 0.2, 'square', 0.05);
    }
  }

  if (strongest > 0) state.alarm = Math.min(100, state.alarm + strongest * 88 * dt);
  else state.alarm = Math.max(0, state.alarm - 30 * dt);
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  if (state.alarm >= 80 && !state.alarmWarned) { state.alarmWarned = true; alarmSound(); }
  if (state.alarm < 70) state.alarmWarned = false;

  if (state.alarm >= 100) {
    burst(p.x, p.y, '#ff3b4e', 22, 130, 4);
    state.mode = 'caught';
    caughtSound();
    return;
  }

  // loot: a fast grab chain builds a combo worth bonus cash
  for (const l of state.loot) {
    if (!l.taken && Math.hypot(p.x - l.x, p.y - l.y) < 26) {
      l.taken = true;
      state.lootTaken += 1;
      state.combo = state.time - state.lastLootAt < 9 ? state.combo + 1 : 1;
      state.lastLootAt = state.time;
      const bonus = (state.combo - 1) * 500;
      state.comboBonus += bonus;
      state.score += l.value + bonus;
      burst(l.x, l.y, l.color, 16, 110, 3.5);
      pickupSound();
    }
  }
  if (state.lootTaken >= state.loot.length && inRect(p.x, p.y, state.room.exit)) {
    state.timeBonus = Math.max(0, 5000 - Math.floor(state.time) * 20);
    state.ghostBonus = state.maxAlarm < 50 ? 3000 : 0;
    state.score += state.timeBonus + state.ghostBonus;
    burst(p.x, p.y - 10, '#4be38a', 26, 150, 4);
    burst(p.x, p.y - 10, '#f0c44c', 20, 120, 3.5);
    state.mode = 'win';
    winSound();
  }
}

function frame() {
  drawScene(ctx, state);
  if (state.mode === 'play' || state.mode === 'caught') drawHud(ctx, state);
  if (state.paused && state.mode === 'play') {
    drawBanner(ctx, 'PAUSED', ['The vault holds its breath.', '', 'Press P to slip back into the dark'], '#9db1d4');
    return;
  }
  if (state.mode === 'title') {
    drawBanner(ctx, 'VAULT BREAK', [
      'One room. Four loot piles. One way out.',
      'Dodge the patrols, the sweeping cameras and the',
      'blinking lasers — fill the alarm and you are caught.',
      'Sneak (Shift) and hide in the shadow pools.',
      'Chain fast grabs for a COMBO bonus; finish with the',
      'alarm under 50% for the $3,000 GHOST bonus.',
      '',
      'WASD / arrows to move · Shift to sneak · P pause · R restart',
      'Grab GOLD, JEWELS, CASH and THE CROWN, then reach the EXIT',
    ], '#f0c44c');
  } else if (state.mode === 'caught') {
    drawBanner(ctx, 'CAUGHT!', [
      'The alarm hit 100%. The vault doors slam shut.',
      'The loot is still in there, waiting for a better thief.',
      '',
      'Press Enter to try the heist again',
    ], '#ff5a3c');
  } else if (state.mode === 'win') {
    drawBanner(ctx, 'CLEAN GETAWAY', [
      `All four loot piles, $${state.score.toLocaleString()} in ${Math.floor(state.time)}s —`,
      `time bonus $${state.timeBonus.toLocaleString()} · combo $${state.comboBonus.toLocaleString()}` +
        (state.ghostBonus ? ` · GHOST bonus $${state.ghostBonus.toLocaleString()}` : ''),
      'and not a single guard can say who did it.',
      '',
      'Press Enter to run the heist again',
    ], '#4be38a');
  }
}

function stageShot(name) {
  startHeist();
  state.time = 2.2;
  if (name === 'title') { state.mode = 'title'; }
  if (name === 'play') {
    state.player.x = 480; state.player.y = 330;
    state.guards[0].x = 300; state.guards[0].y = 205; state.guards[0].angle = 0.4;
    state.guards[1].x = 310; state.guards[1].y = 460; state.guards[1].angle = -1.2;
    state.cameras[0].angle = 1.2;
    state.loot[0].taken = true; state.lootTaken = 1; state.score = 4200;
    state.combo = 1;
    state.alarm = 22;
  }
  if (name === 'alarm') {
    state.player.x = 480; state.player.y = 340;
    state.guards[0].x = 380; state.guards[0].y = 300;
    state.guards[0].angle = Math.atan2(40, 100); state.guards[0].alert = 88;
    state.cameras[0].angle = Math.PI / 2;
    state.loot[0].taken = true; state.loot[1].taken = true;
    state.lootTaken = 2; state.score = 11000;
    state.alarm = 82;
  }
  if (name === 'win') {
    state.loot.forEach((l) => { l.taken = true; });
    state.lootTaken = 4; state.combo = 4;
    state.timeBonus = 3840; state.ghostBonus = 3000; state.comboBonus = 1500;
    state.score = 29940; state.time = 58;
    state.player.x = 480; state.player.y = 550;
    burst(480, 540, '#4be38a', 26, 150, 4);
    burst(480, 540, '#f0c44c', 20, 120, 3.5);
    state.mode = 'win';
  }
  frame();
  window.__shotReady = true;
}

if (shot) {
  stageShot(shot);
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    frame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
