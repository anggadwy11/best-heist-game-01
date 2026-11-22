// Vault Break — guards: waypoint patrols, a pause to scan, a vision cone
// that walls really block, and a short chase when they are sure of you.

export function makeGuard(def) {
  return {
    x: def.x, y: def.y,
    waypoints: def.waypoints, wp: 0,
    speed: def.speed, angle: 0,
    pause: 0, alert: 0, mode: 'patrol', // patrol | chase
    chaseX: 0, chaseY: 0, lostTime: 0,
  };
}

function segHitsRect(x1, y1, x2, y2, r) {
  // segment vs rectangle: quick reject, then test the four edges
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  if (x2 >= r.x && x2 <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (Math.abs(d) < 1e-9) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

export function lineBlocked(x1, y1, x2, y2, solids) {
  for (const s of solids) if (segHitsRect(x1, y1, x2, y2, s)) return true;
  return false;
}

export function canSee(g, px, py, solids, exposure) {
  const dx = px - g.x, dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  const range = 225 * exposure;
  if (dist > range) return 0;
  let da = Math.atan2(dy, dx) - g.angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  if (Math.abs(da) > 0.62) return 0;
  if (lineBlocked(g.x, g.y, px, py, solids)) return 0;
  // closer + more centred = stronger sighting
  return (1 - dist / (range + 40)) * (1 - Math.abs(da) / 0.9) + 0.15;
}

export function turnToward(angle, target, maxStep) {
  let d = target - angle;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return angle + Math.max(-maxStep, Math.min(maxStep, d));
}

function guardHitsSolid(x, y, solids) {
  for (const s of solids) {
    if (x + 11 > s.x && x - 11 < s.x + s.w && y + 11 > s.y && y - 11 < s.y + s.h) return true;
  }
  return false;
}

export function stepGuard(g, dt, solids = []) {
  if (g.mode === 'chase') {
    const dx = g.chaseX - g.x, dy = g.chaseY - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      const sp = g.speed * 1.55;
      // slide along vaults instead of clipping through them
      const nx = g.x + (dx / dist) * sp * dt;
      const ny = g.y + (dy / dist) * sp * dt;
      if (!guardHitsSolid(nx, g.y, solids)) g.x = nx;
      if (!guardHitsSolid(g.x, ny, solids)) g.y = ny;
      g.angle = turnToward(g.angle, Math.atan2(dy, dx), dt * 5);
    }
    return;
  }
  if (g.pause > 0) {
    g.pause -= dt;
    g.angle += dt * 0.9; // scanning sweep while paused
    return;
  }
  const target = g.waypoints[g.wp];
  const dx = target.x - g.x, dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) {
    g.wp = (g.wp + 1) % g.waypoints.length;
    g.pause = 1.1;
    return;
  }
  g.x += (dx / dist) * g.speed * dt;
  g.y += (dy / dist) * g.speed * dt;
  g.angle = turnToward(g.angle, Math.atan2(dy, dx), dt * 4);
}

export function sendGuardTo(g, x, y, mode) {
  g.mode = mode;
  g.chaseX = x; g.chaseY = y; g.lostTime = 0;
}
