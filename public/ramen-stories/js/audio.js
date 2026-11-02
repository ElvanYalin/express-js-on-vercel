// Temporary synthesized SFX (Phase 2 "temporary sound effects"). Original, generated
// at runtime with WebAudio — no copyrighted samples. Replaced by recorded/Foley
// assets in Phase 8. Separate music/SFX buses already modelled for settings.

let ctx = null, sfxGain = null, boilNode = null;
const settings = { sfx: 0.6, muted: false };

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  sfxGain = ctx.createGain();
  sfxGain.gain.value = settings.muted ? 0 : settings.sfx;
  sfxGain.connect(ctx.destination);
  return ctx;
}

function noise(dur) {
  const c = ensure(); if (!c) return null;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf; return src;
}

function tone(freq, dur, type = 'sine', vol = 0.3, slide = 0, delay = 0) {
  const c = ensure(); if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(sfxGain); o.start(t0); o.stop(t0 + dur + 0.02);
}

function filtered(dur, freq, q = 1, vol = 0.25, type = 'bandpass') {
  const c = ensure(); if (!c) return;
  const src = noise(dur); const f = c.createBiquadFilter(); const g = c.createGain();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const t0 = c.currentTime;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(sfxGain); src.start(); src.stop(t0 + dur);
}

export const sfx = {
  unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
  setMuted(m) { settings.muted = m; if (sfxGain) sfxGain.gain.value = m ? 0 : settings.sfx; },
  isMuted() { return settings.muted; },
  pick() { tone(520, 0.08, 'triangle', 0.15, 200); },
  plop() { tone(300, 0.14, 'sine', 0.3, -180); },
  clink() { tone(1800, 0.25, 'triangle', 0.12); tone(2400, 0.2, 'sine', 0.06, 0, 0.03); },
  pour() { filtered(1.0, 900, 0.8, 0.22); },
  splash() { filtered(0.35, 1400, 0.6, 0.25); },
  door() { filtered(0.45, 400, 2, 0.12, 'lowpass'); tone(880, 0.3, 'sine', 0.05, 0, 0.1); },
  coin() { tone(988, 0.12, 'square', 0.06); tone(1319, 0.3, 'square', 0.06, 0, 0.08); },
  chatter() { [0, 0.09, 0.2].forEach((d, i) => tone(260 + i * 50, 0.08, 'triangle', 0.06, 40, d)); },
  boilStart() {
    const c = ensure(); if (!c || boilNode) return;
    const src = noise(2); src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = c.createGain(); g.gain.value = 0.05;
    src.connect(f).connect(g).connect(sfxGain); src.start(); boilNode = src;
  },
  boilStop() { if (boilNode) { boilNode.stop(); boilNode = null; } },
};
