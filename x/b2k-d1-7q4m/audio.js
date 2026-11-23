// Back in the 2000s: The Game — ambient sound + original music, all generated with WebAudio (no recordings).
// Zones by where Chris is: outdoors (birds by day, crickets at night, distant traffic), Schnucks (fridge hum, soft-rock store
// music, PA chimes, register beeps), school (hallway murmur, gym crowd), home (quiet fridge hum), car (pop-punk radio). N = music on/off.
import { G, P } from './engine.js';
let A, master, musicG, ambG, noiseBuf, started = false, zone = '', music = true, musicOn = '';
const ctx = () => A || (A = new (window.AudioContext || window.webkitAudioContext)());
function init(){ if(started) return; started = true; const a = ctx(); master = a.createGain(); master.gain.value = .8; master.connect(a.destination);
  musicG = a.createGain(); musicG.gain.value = .0; musicG.connect(master); ambG = a.createGain(); ambG.gain.value = .0; ambG.connect(master);
  noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = noiseBuf.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
addEventListener('keydown', e => { init(); if(A.state === 'suspended') A.resume(); if(e.code === 'KeyN' && !G.dialogOn){ music = !music; } }, true);
addEventListener('pointerdown', () => { init(); if(A.state === 'suspended') A.resume(); }, true);

// ---------- instruments ----------
function osc(type, f, t, d, v, dest, slide){ const a = A, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + .05); }
function noise(t, d, v, dest, f = 3000, q = .8, type = 'bandpass'){ const a = A, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + d + .05); }
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function epiano(n, t, d, v, dest){ osc('sine', hz(n), t, d, v, dest); osc('triangle', hz(n + 12), t, d * .5, v * .25, dest); }
function power(n, t, d, v, dest){ const lp = A.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(dest); [0, 7, 12].forEach(k => osc('sawtooth', hz(n + k), t, d, v, lp)); }
const kick = (t, dest) => osc('sine', 150, t, .25, .5, dest, 45), snare = (t, dest) => noise(t, .16, .25, dest, 1800, .6), hat = (t, dest, v = .06) => noise(t, .04, v, dest, 8000, 1, 'highpass');

// ---------- original songs (chord loops) ----------
const SONGS = {
  store:{ bpm:84, chords:[[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], play(t, bar, beat, dest){ const c = this.chords[bar % 4];
    if(beat % 2 === 0) c.forEach(n => epiano(n, t, 1.4, .05, dest)); osc('triangle', hz(c[0] - 24), t, .5, .12, dest);
    if(beat === 1 || beat === 3) epiano(c[(bar + beat) % 3] + 12, t + .18, .6, .035, dest); hat(t, dest, .02); } },
  car:{ bpm:168, chords:[52, 48, 55, 50], play(t, bar, beat, dest){ const r = this.chords[bar % 4]; power(r, t, .3, .05, dest); power(r, t + 60 / this.bpm / 2, .22, .045, dest);
    osc('triangle', hz(r - 12), t, .3, .14, dest); if(beat % 2 === 0) kick(t, dest); else snare(t, dest); hat(t, dest); hat(t + 60 / this.bpm / 2, dest); } },
  home:{ bpm:72, chords:[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], play(t, bar, beat, dest){ if(beat === 0) this.chords[bar % 4].forEach((n, i) => epiano(n, t + i * .12, 2.6, .03, dest)); } } };
let nextT = 0, step = 0, cur = null;
function schedule(){ if(!started || !cur){ return; } const s = SONGS[cur], spb = 60 / s.bpm;
  while(nextT < A.currentTime + .25){ s.play(nextT, (step / 4 | 0), step % 4, musicG); nextT += spb; step++; } }

// ---------- ambience ----------
let ambT = 0, hum = null, stepT = 0;
function setHum(on, f = 58){ if(on && !hum){ hum = A.createOscillator(); const g = A.createGain(); g.gain.value = .025; hum.type = 'sine'; hum.frequency.value = f; hum.connect(g); g.connect(ambG); hum.start(); hum.g = g; }
  if(!on && hum){ hum.stop(); hum = null; } }
function ambience(dt){ ambT -= dt; if(ambT > 0) return; const t = A.currentTime, night = G.time === 'night' || G.time === 'dusk';
  if(zone === 'out'){ ambT = .4 + Math.random() * 1.2; if(G.wet && G.wx !== 'snow'){ ambT = .25; for(let i = 0; i < 3; i++) noise(t + i * .08, .6, G.wx === 'storm' ? .07 : .045, ambG, 1800 + Math.random() * 2000, .4); }
    if(night){ for(let i = 0; i < 3; i++) osc('sine', 4200 + Math.random() * 300, t + i * .07, .05, .012, ambG); }
    else if(Math.random() < .45){ const f = 2400 + Math.random() * 1600; osc('sine', f, t, .09, .02, ambG, f * 1.3); osc('sine', f * 1.1, t + .12, .08, .016, ambG, f * .9); }
    if(Math.random() < .25) noise(t, 2.2, .025, ambG, 400, .4, 'lowpass'); }
  else if(zone === 'store'){ ambT = 2 + Math.random() * 4; if(Math.random() < .5) [1, 1.25].forEach((k, i) => osc('square', 2200 * k, t + i * .09, .06, .015, ambG));
    if(Math.random() < .08) [660, 880, 1100].forEach((f, i) => osc('sine', f, t + i * .2, .35, .03, ambG)); noise(t, 1.5, .01, ambG, 900, .5); }
  else if(zone === 'school'){ ambT = .3; for(let i = 0; i < 3; i++) noise(t + i * .1, .4, G.inGym ? .04 : .015, ambG, 500 + Math.random() * 700, 3); if(Math.random() < .03) noise(t, .15, .06, ambG, 300, 1); }
  else ambT = 1; }

// ---------- the car: engine note from rpm + throttle, tyre squeal from slip, road rumble from speed ----------
let eng = null;
function carSound(){ const c = G.driving, t = A.currentTime, vol = G.paused ? 0 : G.set.sfx / .8;
  if(c && !eng){ const o1 = A.createOscillator(), o2 = A.createOscillator(), lp = A.createBiquadFilter(), g = A.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; g.gain.value = 0; o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master); o1.start(); o2.start();
    const mk = (f, q, type) => { const s = A.createBufferSource(), fl = A.createBiquadFilter(), gg = A.createGain(); s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; gg.gain.value = 0; s.connect(fl); fl.connect(gg); gg.connect(master); s.start(); return { s, g:gg }; };
    eng = { o1, o2, lp, g, sq:mk(2700, 7, 'bandpass'), rd:mk(420, .5, 'lowpass') }; }
  if(!eng) return;
  if(!c){ const e = eng; eng = null; [e.g, e.sq.g, e.rd.g].forEach(g => g.gain.setTargetAtTime(0, t, .08)); setTimeout(() => { try{ e.o1.stop(); e.o2.stop(); e.sq.s.stop(); e.rd.s.stop(); }catch(x){} }, 600); return; }
  const rpm = c.rpm || 800, f = rpm / 60 * 1.5, thr = Math.max(0, c.thr || 0);
  eng.o1.frequency.setTargetAtTime(f, t, .04); eng.o2.frequency.setTargetAtTime(f * .5, t, .04); eng.lp.frequency.setTargetAtTime(260 + rpm * .3 + thr * 500, t, .08);
  eng.g.gain.setTargetAtTime((.022 + .034 * thr + rpm * 3e-6) * vol, t, .08); eng.sq.g.gain.setTargetAtTime(Math.min(.1, (c.slipS || 0) * .035) * vol, t, .05); eng.rd.g.gain.setTargetAtTime(Math.min(.07, Math.abs(c.speed) * .0024) * vol, t, .1); }

// ---------- zone / music selection, every frame ----------
G.ticks.push(Object.assign(dt => { if(!started) return; const p = P.p, S = G.SCH, sp = { x:p.x + 110, y:p.y, z:p.z + 770 }; // sp = position in the school's own (old) coordinates
  const z = G.driving ? 'car' : S && p.x > S.x0 && p.x < S.x1 && p.z > S.z0 && p.z < S.z1 + .5 ? 'store' : sp.x > -330 && sp.x < -140 && sp.z > 98 && sp.z < 202 && p.y >= 0 && isInside(sp) ? 'school'
    : p.x > -8 && p.x < 8 && p.z > -12 && p.z < 4 ? 'home' : 'out';
  if(z !== zone){ zone = z; setHum(z === 'store' || z === 'home', z === 'store' ? 60 : 52); }
  G.inGym = z === 'school' && sp.x < -272;
  const want = !music || G.mission === 'S01' ? null : z === 'car' ? (G.radioOn ? null : 'car') : z === 'store' ? 'store' : z === 'home' && !G.mission ? 'home' : null;
  if(want !== cur){ cur = want; step = 0; nextT = A.currentTime + .1; }
  const tgt = (cur ? (cur === 'car' ? .55 : .5) : 0) * G.set.music / .8; musicG.gain.value += (tgt - musicG.gain.value) * Math.min(1, dt * 2);
  ambG.gain.value += ((G.paused ? 0 : G.set.amb / .8) - ambG.gain.value) * Math.min(1, dt * 2);
  schedule(); ambience(dt); carSound();
  // footsteps: pace follows speed; duller indoors, crunchier on wet ground
  if(P.mv > .5 && !G.driving && !P.board && P.vy === 0 && !G.paused){ stepT -= dt * (P.mv > 8 ? 3.3 : 2.1); if(stepT <= 0){ stepT = 1; const t = A.currentTime, ind = z !== 'out' && z !== 'car'; noise(t, ind ? .07 : .09, ind ? .05 : .035, ambG, ind ? 520 : G.wet ? 2400 : 900, ind ? 1.2 : .7, 'bandpass'); osc('sine', ind ? 95 : 70, t, .05, .05, ambG, 40); } } else stepT = .25; }, { amb:true }));
function isInside(p){ return (p.x > -270 && p.x < -140 && p.z > 100 && p.z < 128) || (p.x > -190 && p.x < -140 && p.z > 128 && p.z < 172) || (p.x > -322 && p.x < -272 && p.z > 100 && p.z < 150); }
