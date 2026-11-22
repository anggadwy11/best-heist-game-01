// Vault Break — tiny WebAudio bleeps. Sound is a garnish: if the
// browser has no audio context, the game still plays silently.

let audioCtx = null;

export function blip(freq, dur = 0.09, type = 'sine', gain = 0.05) {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch { /* no audio, no problem */ }
}

export function pickupSound() {
  blip(660, 0.14, 'triangle', 0.07);
  setTimeout(() => blip(990, 0.18, 'triangle', 0.06), 90);
}

export function alarmSound() { blip(220, 0.22, 'sawtooth', 0.06); }
export function caughtSound() { blip(140, 0.4, 'sawtooth', 0.08); }
export function winSound() {
  blip(523, 0.14, 'triangle', 0.07);
  setTimeout(() => blip(659, 0.14, 'triangle', 0.07), 110);
  setTimeout(() => blip(784, 0.24, 'triangle', 0.07), 220);
}
