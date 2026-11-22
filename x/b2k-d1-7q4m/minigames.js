// Back in the 2000s: The Game — original arcade mini-games drawn on the #mg canvas (GAME ORIGINAL; simple generic mechanics):
//   runner  — side-scrolling skate run: jump trash cans and benches, do a trick in the air for bonus points
//   dodge   — top-down three-lane driving: weave through traffic
//   meter   — timing meter: stop the marker in the green (basketball shots at the park, field-goal kicks on the console)
// Each returns a Promise of the final score. Space/E/Enter (Ⓐ/Ⓧ) = action, A/D or arrows = left/right, Esc = quit.
import * as E from './engine.js';
const { G } = E; const W = 960, H = 540;
export function open(title, hint){ const cv = document.getElementById('mg'), dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.display = 'block'; cv.style.width = '100vw'; cv.style.height = '100vh'; cv.style.background = '#05070f';
  const g = cv.getContext('2d'), sc = Math.min(cv.width / W, cv.height / H); g.setTransform(sc, 0, 0, sc, (cv.width - W * sc) / 2, (cv.height - H * sc) / 2); g.beginPath(); g.rect(0, 0, W, H); g.clip();
  const keys = {}, press = [], kd = e => { if(['Space', 'KeyE', 'Enter'].includes(e.code)) press.push('act'); else if(['KeyA', 'ArrowLeft'].includes(e.code)) press.push('left'); else if(['KeyD', 'ArrowRight'].includes(e.code)) press.push('right'); else if(e.code === 'Escape') press.push('quit'); keys[e.code] = true; e.stopImmediatePropagation(); e.preventDefault(); };
  const ku = e => { keys[e.code] = false; }; addEventListener('keydown', kd, true); addEventListener('keyup', ku, true); cv.onclick = () => press.push('act');
  G.uiOpen = true; E.cut(true); const text = (t, x, y, size = 16, c = '#fff', al = 'left') => { g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = al; g.fillStyle = '#000'; g.fillText(t, x + 2, y + 2); g.fillStyle = c; g.fillText(t, x, y); };
  const frame = () => { text(title, 24, 40, 18, '#ffd23f'); text(hint, W / 2, H - 16, 10, '#9bb4ff', 'center'); };
  const ui = { g, press, keys, text, frame, open:true, close(){ if(!ui.open) return; ui.open = false; removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); cv.onclick = null; cv.style.display = 'none'; G.uiOpen = false; E.cut(false); } };
  (G.cleanups = G.cleanups || []).push(() => ui.close()); return ui; } // a checkpoint restart also closes the mini-game
export function run(ui, step){ return new Promise(res => { let done = false; const stop = E.tick(dt => { if(done) return; const r = step(Math.min(dt, .05)); if(r !== undefined){ done = true; stop(); ui.close(); res(r); } }); }); }
async function results(ui, title, lines){ return run(ui, () => { const { g, text } = ui; g.fillStyle = 'rgba(5,7,15,.86)'; g.fillRect(0, 0, W, H); text(title, W / 2, 200, 28, '#ffd23f', 'center'); lines.forEach((l, i) => text(l, W / 2, 262 + i * 36, 14, '#fff', 'center')); text('PRESS SPACE', W / 2, 440, 12, '#9bb4ff', 'center');
  if(ui.press.splice(0).some(p => p === 'act' || p === 'quit')) return true; }); }

export async function playRunner(o = {}){ const snow = o.skin === 'snow', ui = open(o.title || 'SKATE JAM', 'SPACE jump - D trick in the air - ESC quit'), { g, press, text } = ui;
  let t = 0, y = 0, vy = 0, lives = 3, score = 0, dist = 0, speed = 330, obs = [], next = 1, trick = 0, tricked = false, flash = 0, msg = '', msgT = 0; const GY = 410, PX = 170, T = o.secs || 45;
  const r = await run(ui, dt => { t += dt; speed = 330 + t * 6; dist += speed * dt; score += speed * dt * .02;
    for(const p of press.splice(0)){ if(p === 'quit') return Math.round(score); if(p === 'act' && y === 0){ vy = 620; E.sfx('cart'); } if(p === 'right' && y > 30 && !tricked){ tricked = true; trick = .5; } }
    if(y > 0 || vy > 0){ vy -= 1700 * dt; y += vy * dt; if(y <= 0){ y = 0; vy = 0; if(tricked){ score += 25; msg = 'KICKFLIP +25'; msgT = 1; E.sfx('ok'); } tricked = false; } } trick = Math.max(0, trick - dt);
    if((next -= dt) <= 0){ next = .8 + Math.random() * 1.1 - Math.min(.35, t * .008); const k = Math.random(); obs.push(k < .5 ? { x:W + 40, w:34, h:46, c:'#3a5a3a' } : k < .8 ? { x:W + 40, w:28, h:34, c:'#e8822a' } : { x:W + 40, w:90, h:30, c:'#8a5a32' }); }
    for(const ob of obs){ ob.x -= speed * dt; if(!ob.hit && !ob.pass && ob.x < PX + 22 && ob.x + ob.w > PX - 18 && y < ob.h - 6){ ob.hit = true; lives--; flash = .4; E.sfx('bang'); } if(!ob.pass && ob.x + ob.w < PX - 20){ ob.pass = true; if(!ob.hit) score += 10; } } obs = obs.filter(ob => ob.x > -120); flash = Math.max(0, flash - dt); msgT = Math.max(0, msgT - dt);
    // draw
    const sk = g.createLinearGradient(0, 0, 0, GY); sk.addColorStop(0, snow ? '#9fc8f0' : '#4f86ee'); sk.addColorStop(1, snow ? '#eef6ff' : '#ffd8a8'); g.fillStyle = sk; g.fillRect(0, 0, W, GY);
    g.fillStyle = snow ? '#c9dcee' : '#6a7a9a'; for(let i = 0; i < 9; i++){ const bx = ((i * 190 - dist * .25) % (W + 200) + W + 200) % (W + 200) - 100; g.fillRect(bx, GY - 90 - (i % 3) * 40, 110, 90 + (i % 3) * 40); }
    g.fillStyle = snow ? '#f4f8ff' : '#55585e'; g.fillRect(0, GY, W, H - GY); g.fillStyle = snow ? '#d8e4f0' : '#e8c832'; for(let i = 0; i < 12; i++){ const lx = ((i * 100 - dist) % (W + 100) + W + 100) % (W + 100) - 50; g.fillRect(lx, GY + 50, 50, 6); }
    for(const ob of obs){ g.fillStyle = ob.c; g.fillRect(ob.x, GY - ob.h, ob.w, ob.h); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(ob.x, GY - ob.h, ob.w, 6); }
    g.save(); g.translate(PX, GY - y); if(trick) g.rotate(trick * 12); g.fillStyle = '#2a2a2a'; g.fillRect(-26, -8, 52, 6); g.fillStyle = '#f2f2e8'; g.fillRect(-20, -3, 8, 6); g.fillRect(12, -3, 8, 6); g.restore();
    g.fillStyle = '#2a3a6a'; g.fillRect(PX - 9, GY - y - 44, 18, 36); g.fillStyle = '#f2f2f2'; g.fillRect(PX - 11, GY - y - 66, 22, 24); g.fillStyle = '#efc29e'; g.fillRect(PX - 9, GY - y - 84, 18, 18); g.fillStyle = '#5a3a1c'; g.fillRect(PX - 10, GY - y - 90, 20, 8);
    if(flash){ g.fillStyle = `rgba(255,60,60,${flash})`; g.fillRect(0, 0, W, H); } ui.frame(); text(`SCORE ${Math.round(score)}`, W - 24, 40, 16, '#fff', 'right'); text('♥'.repeat(Math.max(0, lives)), W - 24, 72, 18, '#ff5a6a', 'right'); text(`${Math.max(0, Math.ceil(T - t))}s`, W / 2, 40, 16, '#fff', 'center'); if(msgT) text(msg, PX + 40, GY - y - 100, 12, '#ffd23f');
    if(lives <= 0 || t >= T) return Math.round(score); });
  await results(open(o.title || 'SKATE JAM', ''), 'RUN OVER', [`SCORE  ${r}`, r >= 600 ? 'UNREAL.' : r >= 350 ? 'Not bad at all.' : 'Zeke would be embarrassed for you.']); return r; }

export async function playDodge(o = {}){ const ui = open(o.title || 'STREET DODGE', 'A / D or ARROWS change lanes - ESC quit'), { g, press, text } = ui; let t = 0, lane = 1, px = 0, lives = 3, score = 0, cars = [], next = .6, flash = 0, dist = 0; const LX = [W / 2 - 110, W / 2, W / 2 + 110], T = o.secs || 40, PY = 430;
  const r = await run(ui, dt => { t += dt; const speed = 380 + t * 9; dist += speed * dt; score += speed * dt * .02; for(const p of press.splice(0)){ if(p === 'quit') return Math.round(score); if(p === 'left') lane = Math.max(0, lane - 1); if(p === 'right') lane = Math.min(2, lane + 1); }
    px += (LX[lane] - px) * Math.min(1, dt * 14); if((next -= dt) <= 0){ next = Math.max(.32, .85 - t * .012); const free = Math.random() * 3 | 0; [0, 1, 2].forEach(i => { if(i !== free && Math.random() < .62) cars.push({ l:i, y:-90, c:['#c8202a', '#2a8a3a', '#e8e8e8', '#e8a020', '#7a3a9a'][Math.random() * 5 | 0] }); }); }
    for(const c of cars){ c.y += speed * .62 * dt; if(!c.hit && Math.abs(c.y - PY) < 70 && Math.abs(LX[c.l] - px) < 60){ c.hit = true; lives--; flash = .4; E.sfx('bang'); } if(!c.pass && c.y > PY + 90){ c.pass = true; if(!c.hit) score += 5; } } cars = cars.filter(c => c.y < H + 120); flash = Math.max(0, flash - dt);
    g.fillStyle = '#3d7a3a'; g.fillRect(0, 0, W, H); g.fillStyle = '#4b4d53'; g.fillRect(W / 2 - 175, 0, 350, H); g.fillStyle = '#e8e8e0'; g.fillRect(W / 2 - 178, 0, 6, H); g.fillRect(W / 2 + 172, 0, 6, H);
    g.fillStyle = '#e8c832'; for(let i = 0; i < 9; i++){ const ly = ((i * 80 + dist) % (H + 80)) - 80; g.fillRect(W / 2 - 58, ly, 6, 44); g.fillRect(W / 2 + 52, ly, 6, 44); }
    const car = (x, y, c, me) => { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 32, y - 52, 68, 112); g.fillStyle = c; g.fillRect(x - 30, y - 56, 60, 112); g.fillStyle = '#27384a'; g.fillRect(x - 24, y - (me ? 30 : 10), 48, 26); g.fillRect(x - 24, y + (me ? 22 : -40), 48, 14); g.fillStyle = me ? '#fff8d0' : '#c00'; g.fillRect(x - 26, y - (me ? 56 : -50), 14, 6); g.fillRect(x + 12, y - (me ? 56 : -50), 14, 6); };
    for(const c of cars) car(LX[c.l], c.y, c.c, false); car(px, PY, '#2a5a9a', true); if(flash){ g.fillStyle = `rgba(255,60,60,${flash})`; g.fillRect(0, 0, W, H); }
    ui.frame(); text(`SCORE ${Math.round(score)}`, W - 24, 40, 16, '#fff', 'right'); text('♥'.repeat(Math.max(0, lives)), W - 24, 72, 18, '#ff5a6a', 'right'); text(`${Math.max(0, Math.ceil(T - t))}s`, 24, 72, 16);
    if(lives <= 0 || t >= T) return Math.round(score); });
  await results(open(o.title || 'STREET DODGE', ''), 'RACE OVER', [`SCORE  ${r}`, r >= 500 ? 'Clean driving. Suspicious.' : 'You drive like Zeke skates.']); return r; }

// kind: 'hoops' (park) or 'kick' (console football)
export async function playMeter(o = {}){ const hoops = o.kind !== 'kick', n = o.shots || 10, ui = open(o.title || (hoops ? 'HOOPS' : 'FIELD GOAL'), 'SPACE to stop the marker in the green - ESC quit'), { g, press, text } = ui;
  let i = 0, made = 0, m = 0, dir = 1, state = 'aim', anim = 0, good = false, zone = [.42, o.zw || .18], off = 0;
  const r = await run(ui, dt => { const sp = .75 + i * .09; for(const p of press.splice(0)){ if(p === 'quit') return made; if(p === 'act' && state === 'aim'){ off = m - (zone[0] + zone[1] / 2); good = Math.abs(off) <= zone[1] / 2; state = 'fly'; anim = 0; E.sfx('cart'); } }
    if(state === 'aim'){ m += dir * sp * dt; if(m > 1){ m = 1; dir = -1; } if(m < 0){ m = 0; dir = 1; } }
    else { anim += dt / .9; if(anim >= 1){ if(good){ made++; E.sfx('ok'); } else E.sfx('miss'); i++; state = 'aim'; m = Math.random() * .2; dir = 1; const w = o.zw || Math.max(.07, .18 - i * .012); zone = [.25 + Math.random() * (.6 - w), w]; if(i >= n) return made; } }
    // scene
    g.fillStyle = hoops ? '#7fb6ea' : '#1c3d1c'; g.fillRect(0, 0, W, H); g.fillStyle = hoops ? '#7d7f86' : '#2f7a2f'; g.fillRect(0, 380, W, 160);
    if(hoops){ g.fillStyle = '#9aa0a6'; g.fillRect(760, 150, 10, 230); g.fillStyle = '#f4f4f0'; g.fillRect(700, 130, 70, 90); g.strokeStyle = '#e05a1a'; g.lineWidth = 6; g.beginPath(); g.ellipse(672, 222, 34, 9, 0, 0, 7); g.stroke(); }
    else { g.fillStyle = '#e8c832'; g.fillRect(676, 80, 8, 300); g.fillRect(600, 200, 160, 8); g.fillRect(600, 80, 8, 128); g.fillRect(752, 80, 8, 128); g.fillStyle = '#fff'; for(let k = 0; k < 6; k++) g.fillRect(0, 392 + k * 28, W, 2); }
    g.fillStyle = '#2f5d8a'; g.fillRect(190, 300, 26, 60); g.fillStyle = '#efc29e'; g.fillRect(192, 272, 22, 26); g.fillStyle = '#4a5a78'; g.fillRect(190, 360, 26, 24);
    const tx = hoops ? 672 : 680, ty = hoops ? 222 : 150; let bx = 232, by = 300; if(state === 'fly'){ const u = Math.min(1, anim), miss = good ? 0 : (off > 0 ? 1 : -1) * 80; bx = 232 + (tx + miss - 232) * u; by = 300 + (ty - 300) * u - Math.sin(u * Math.PI) * (hoops ? 190 : 120); }
    g.fillStyle = hoops ? '#e05a1a' : '#7a4a2a'; g.beginPath(); g.ellipse(bx, by, hoops ? 14 : 16, hoops ? 14 : 10, state === 'fly' ? anim * 9 : 0, 0, 7); g.fill();
    // meter
    g.fillStyle = '#0a0e1e'; g.fillRect(180, 462, 600, 30); g.fillStyle = '#c8202a'; g.fillRect(184, 466, 592, 22); g.fillStyle = '#3ad86a'; g.fillRect(184 + 592 * zone[0], 466, 592 * zone[1], 22); g.fillStyle = '#fff'; g.fillRect(184 + 592 * m - 3, 458, 6, 38);
    ui.frame(); text(`${hoops ? 'SHOT' : 'KICK'} ${Math.min(n, i + 1)} / ${n}`, W / 2, 40, 16, '#fff', 'center'); text(`MADE ${made}`, W - 24, 40, 16, '#fff', 'right'); if(state === 'fly' && anim > .8) text(good ? (hoops ? 'SWISH!' : 'IT’S GOOD!') : (hoops ? 'BRICK' : 'NO GOOD'), W / 2, 120, 22, good ? '#3ad86a' : '#ff5a6a', 'center'); });
  await results(open(o.title || (hoops ? 'HOOPS' : 'FIELD GOAL'), ''), hoops ? 'FINAL' : 'FINAL', [`MADE  ${r} / ${n}`, r >= n * .8 ? 'On fire.' : r >= n * .5 ? 'Respectable.' : 'Stick to pushing carts.']); return r; }
