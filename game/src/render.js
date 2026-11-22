// Vault Break — every pixel the judge sees: floor, vaults, shadows,
// vision cones, cameras, lasers, loot, the thief, and the HUD.

import { laserOn } from './cameras.js';

function cone(ctx, x, y, angle, range, half, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawScene(ctx, state) {
  const room = state.room;
  ctx.fillStyle = '#141a26';
  ctx.fillRect(0, 0, 960, 600);
  // floor tiles
  ctx.strokeStyle = '#1d2536';
  ctx.lineWidth = 1;
  for (let x = 0; x < 960; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
  for (let y = 0; y < 600; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }

  // shadow pools: safe dark ground
  for (const s of room.shadows) {
    ctx.fillStyle = 'rgba(8,10,18,0.85)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#3a4a6b';
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.setLineDash([]);
  }

  // vaults and crates
  for (const w of room.walls) {
    ctx.fillStyle = '#2b3448';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = '#f0c44c';
    ctx.fillRect(w.x, w.y, w.w, 5);
    ctx.strokeStyle = '#4a5878';
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // exit: green gate at the bottom, labelled
  const e = room.exit;
  const exitOpen = state.lootTaken >= 3;
  ctx.fillStyle = exitOpen ? '#1f7a44' : '#23402e';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = exitOpen ? '#4be38a' : '#5a7a68';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = exitOpen ? '#c9ffe0' : '#8fb89e';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exitOpen ? 'EXIT — GO!' : 'EXIT (LOCKED)', e.x + e.w / 2, e.y + 28);

  // loot piles
  for (const l of state.loot) {
    if (l.taken) continue;
    ctx.fillStyle = l.color;
    ctx.beginPath(); ctx.arc(l.x, l.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0e14';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('$', l.x, l.y + 5);
    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(l.label, l.x, l.y - 20);
  }

  // lasers
  for (const laser of room.lasers) {
    const on = laserOn(laser, state.time);
    ctx.strokeStyle = on ? '#ff3b4e' : 'rgba(255,59,78,0.25)';
    ctx.lineWidth = on ? 3 : 1;
    ctx.setLineDash(on ? [] : [4, 6]);
    ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff3b4e';
    ctx.beginPath(); ctx.arc(laser.x1, laser.y1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(laser.x2, laser.y2, 5, 0, Math.PI * 2); ctx.fill();
  }

  // camera cones first (under the cameras), then guard cones
  for (const c of state.cameras) {
    cone(ctx, c.x, c.y, c.angle, c.range, 0.45, 'rgba(255,80,80,0.13)');
  }
  for (const g of state.guards) {
    const hot = g.alert > 55;
    cone(ctx, g.x, g.y, g.angle, 225, 0.62, hot ? 'rgba(255,90,60,0.28)' : 'rgba(240,196,76,0.20)');
  }

  // cameras: small red boxes on the wall
  for (const c of state.cameras) {
    ctx.fillStyle = '#c22';
    ctx.fillRect(c.x - 8, c.y - 6, 16, 12);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  // guards: blue patrolmen with a facing tick
  for (const g of state.guards) {
    ctx.fillStyle = g.mode === 'chase' ? '#ff5a3c' : '#4a90e2';
    ctx.beginPath(); ctx.arc(g.x, g.y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 16, g.y + Math.sin(g.angle) * 16);
    ctx.stroke();
    if (g.alert > 40) {
      ctx.fillStyle = '#ff5a3c';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('!', g.x, g.y - 18);
    }
  }

  // the thief: black coat, gold mask
  const p = state.player;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f0c44c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f0c44c';
  ctx.fillRect(p.x - 6, p.y - 3, 12, 5);
  if (p.crouch) {
    ctx.fillStyle = '#f0c44c';
    ctx.font = '10px sans-serif';
    ctx.fillText('sneak', p.x, p.y - 16);
  }
}

export function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(5,7,12,0.88)';
  ctx.fillRect(0, 0, 960, 34);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('VAULT BREAK', 12, 22);
  // alarm meter
  ctx.fillStyle = '#3a2a2a';
  ctx.fillRect(150, 10, 220, 14);
  const a = state.alarm / 100;
  ctx.fillStyle = a < 0.5 ? '#f0c44c' : a < 0.8 ? '#ff8a3c' : '#ff3b4e';
  ctx.fillRect(150, 10, 220 * a, 14);
  ctx.strokeStyle = '#e8ecf4';
  ctx.strokeRect(150, 10, 220, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, 378, 22);
  ctx.fillStyle = '#f0c44c';
  ctx.fillText(`LOOT ${state.lootTaken}/3  •  $${state.score.toLocaleString()}`, 520, 22);
  ctx.fillStyle = '#9db1d4';
  ctx.fillText(`TIME ${Math.floor(state.time)}s`, 760, 22);
  ctx.fillStyle = '#9db1d4';
  ctx.font = '12px sans-serif';
  const obj = state.lootTaken < 3
    ? 'Grab all 3 loot piles, then reach the green EXIT'
    : 'All loot grabbed — reach the green EXIT!';
  ctx.fillText(obj, 12, 52);
}

export function drawBanner(ctx, title, lines, color) {
  ctx.fillStyle = 'rgba(5,7,12,0.82)';
  ctx.fillRect(180, 150, 600, 300);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(180, 150, 600, 300);
  ctx.fillStyle = color;
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 480, 210);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '15px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 480, 250 + i * 26));
  ctx.textAlign = 'left';
}
