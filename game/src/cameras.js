// Vault Break — security cameras and laser grids.
// Cameras sweep back and forth; their cone is real geometry too.
// Lasers blink on a fixed cycle: cross while lit and the alarm jumps.

import { lineBlocked } from './guards.js';

export function makeCamera(def) {
  return { ...def, t: Math.random() * 2, angle: def.base, alert: 0 };
}

export function stepCamera(c, dt) {
  c.t += dt;
  c.angle = c.base + Math.sin(c.t * c.speed) * c.sweep;
}

export function cameraSees(c, px, py, solids, exposure) {
  const dx = px - c.x, dy = py - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist > c.range * exposure) return 0;
  let da = Math.atan2(dy, dx) - c.angle;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  if (Math.abs(da) > 0.45) return 0;
  if (lineBlocked(c.x, c.y, px, py, solids)) return 0;
  return (1 - dist / (c.range + 40)) + 0.2;
}

export function laserOn(laser, time) {
  const phase = (time + laser.phase) % laser.period;
  return phase < laser.onTime;
}

export function pointOnLaser(px, py, laser, time) {
  if (!laserOn(laser, time)) return false;
  // distance from point to the laser segment, under 7px counts as a hit
  const dx = laser.x2 - laser.x1, dy = laser.y2 - laser.y1;
  const len2 = dx * dx + dy * dy;
  let t = ((px - laser.x1) * dx + (py - laser.y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = laser.x1 + t * dx, cy = laser.y1 + t * dy;
  return Math.hypot(px - cx, py - cy) < 9;
}
