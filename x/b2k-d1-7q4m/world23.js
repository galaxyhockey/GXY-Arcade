// Back in the 2000s: The Game — Draft 2.3 audit pass (GAME ORIGINAL): walk-in mall stores, brand interiors, pole signs + drive-thrus,
// closed shops go dark, busy parking lots by hour, speedometer + posted limits, police Crown Vics, extra gas stations, MetroLink rides,
// pickup 1-on-1, skate tricks, disposable-camera photo hunt, Friday-night cruising, siren tests, allowance, Christmas lights on houses,
// football crowds, bowling + Snake minigames.
import * as E from './engine.js';
import { dateOf } from './extras.js';
import { playDuel } from './minigames2.js';
const { THREE, G, P } = E;
let api = null, objs = [], npcs = [];
const L = () => api.L(), T = (x, z) => G.terrain ? G.terrain(x, z) : 0;
const add = o => { G.scene.add(o); objs.push(o); return o; };
const lbl = (t, o) => new THREE.MeshBasicMaterial({ map:E.label(t, o), side:THREE.DoubleSide });
function box(w, h, d, c, x, y, z, ry = 0, col){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? E.mat(c) : c); const g = T(x, z); m.position.set(x, g + y + h / 2, z); m.rotation.y = ry; m.castShadow = true; add(m);
  if(col){ const s = Math.abs(Math.sin(ry)) > .7, hw = (s ? d : w) / 2, hd = (s ? w : d) / 2; G.colliders.push({ x0:x - hw, x1:x + hw, z0:z - hd, z1:z + hd, y0:g + y, y1:g + y + h }); } return m; }
const sign = (t, o, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lbl(t, o)); m.position.set(x, T(x, z) + y, z); m.rotation.y = ry; return add(m); };
// a flat patch that follows the ground (parking lots etc.)
export function groundQuad(w, d, ry, x, z, color, lift = .05){ const g = new THREE.PlaneGeometry(w, d, Math.max(1, Math.ceil(w / 4)), Math.max(1, Math.ceil(d / 4))); g.rotateX(-Math.PI / 2); g.rotateY(ry); g.translate(x, 0, z);
  const p = g.attributes.position; for(let k = 0; k < p.count; k++) p.setY(k, T(p.getX(k), p.getZ(k)) + lift); g.computeVertexNormals(); const m = new THREE.Mesh(g, E.mat(color)); m.receiveShadow = true; return m; }
G.groundQuad = groundQuad;
function frame(s){ const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, dx = s.door[0] - cx, dz = s.door[1] - cz, ax = Math.abs(dx) > Math.abs(dz), nx = ax ? Math.sign(dx) : 0, nz = ax ? 0 : Math.sign(dz), hd = ax ? (s.x1 - s.x0) / 2 : (s.z1 - s.z0) / 2, hl = ax ? (s.z1 - s.z0) / 2 : (s.x1 - s.x0) / 2;
  const fx = cx + nx * hd, fz = cz + nz * hd, at = (u, v) => [fx + nx * v + (ax ? 0 : 1) * u, fz + nz * v + (ax ? 1 : 0) * u]; return { nx, nz, hl, hd, ry:Math.atan2(nx, nz), at, inn:(u, v) => at(u, -v) }; }
const shop = n => (G.shops || []).find(s => s.name === n);

// ---------- small minigames (DOM canvas) ----------
function panel(title){ const el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.75);z-index:50;flex-direction:column;font-family:"Press Start 2P",monospace;color:#fff;font-size:12px';
  el.innerHTML = `<div style="margin-bottom:10px">${title}</div><canvas width="420" height="420" style="background:#111;border:4px solid #555"></canvas><div class="msg" style="margin-top:10px;font-size:10px"></div>`; document.body.appendChild(el); G.uiOpen = true; E.cut(true); return { el, g:el.querySelector('canvas').getContext('2d'), msg:t => el.querySelector('.msg').textContent = t }; }
const close = p => { p.el.remove(); G.uiOpen = false; E.cut(false); };
// Bowling: 5 frames. SPACE stops the aim needle, SPACE again sets the hook. Closer to the pocket = more pins.
export function playBowling(){ return new Promise(res => { const p = panel('BELLEVILLE BOWL'); let fr = 0, ball = 0, st = 0, t = 0, aim = 0, hook = 0, left = 10, score = 0, raf;
  const draw = () => { const g = p.g; g.fillStyle = '#c8a060'; g.fillRect(150, 0, 120, 420); g.fillStyle = '#333'; g.fillRect(140, 0, 10, 420); g.fillRect(270, 0, 10, 420);
    for(let i = 0; i < left; i++){ const r = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3][i], c = [0, -1, 1, -2, 0, 2, -3, -1, 1, 3][i]; g.fillStyle = '#fff'; g.beginPath(); g.arc(210 + c * 9, 40 + r * 14, 5, 0, 7); g.fill(); }
    const x = 210 + (st === 0 ? Math.sin(t * 2.4) : aim) * 55; g.fillStyle = '#2a4ab8'; g.beginPath(); g.arc(x, 380, 9, 0, 7); g.fill(); if(st === 1){ g.fillStyle = '#ff0'; g.fillRect(150, 400, 120 * (.5 + Math.sin(t * 3) * .5), 8); }
    g.fillStyle = '#fff'; g.fillText(`FRAME ${fr + 1}/5  BALL ${ball + 1}  SCORE ${score}`, 10, 16); };
  const loop = () => { t += 1 / 60; draw(); raf = requestAnimationFrame(loop); }; loop(); p.msg('SPACE: aim, then SPACE: hook');
  const key = e => { if(e.code !== 'Space') return; e.preventDefault(); e.stopImmediatePropagation(); if(st === 0){ aim = Math.sin(t * 2.4); st = 1; return; } hook = .5 + Math.sin(t * 3) * .5;
    const off = Math.abs(aim - (hook - .5) * .6), down = Math.min(left, Math.max(0, Math.round(left * (1 - off * 1.4) + (Math.random() - .5) * 2))); left -= down; score += down; E.sfx(down > 6 ? 'pass' : 'cart');
    p.msg(left === 0 ? (ball === 0 ? 'STRIKE!' : 'SPARE!') : `${down} pins`); st = 0; ball++; if(left === 0 || ball > 1){ fr++; ball = 0; left = 10; } if(fr >= 5){ cancelAnimationFrame(raf); removeEventListener('keydown', key, true); setTimeout(() => { close(p); res(score); }, 900); } };
  addEventListener('keydown', key, true); }); }
// Snake on the flip phone
export function playSnake(){ return new Promise(res => { const p = panel('SNAKE'); let s = [[10, 10]], d = [1, 0], f = [15, 10], alive = true, acc = 0, last = performance.now(), raf;
  const key = e => { const k = { ArrowUp:[0, -1], KeyW:[0, -1], ArrowDown:[0, 1], KeyS:[0, 1], ArrowLeft:[-1, 0], KeyA:[-1, 0], ArrowRight:[1, 0], KeyD:[1, 0] }[e.code]; if(k && (k[0] !== -d[0] || k[1] !== -d[1])) d = k; if(e.code === 'Escape') alive = false; e.preventDefault(); e.stopImmediatePropagation(); };
  addEventListener('keydown', key, true); p.msg('ARROWS / WASD');
  const loop = now => { acc += now - last; last = now; while(acc > 120 && alive){ acc -= 120; const h = [s[0][0] + d[0], s[0][1] + d[1]]; if(h[0] < 0 || h[1] < 0 || h[0] > 20 || h[1] > 20 || s.some(q => q[0] === h[0] && q[1] === h[1])){ alive = false; break; } s.unshift(h); if(h[0] === f[0] && h[1] === f[1]){ E.sfx('ok'); f = [Math.random() * 21 | 0, Math.random() * 21 | 0]; } else s.pop(); }
    const g = p.g; g.fillStyle = '#9bbc0f'; g.fillRect(0, 0, 420, 420); g.fillStyle = '#0f380f'; s.forEach(q => g.fillRect(q[0] * 20, q[1] * 20, 18, 18)); g.fillRect(f[0] * 20 + 5, f[1] * 20 + 5, 10, 10);
    if(alive) raf = requestAnimationFrame(loop); else { removeEventListener('keydown', key, true); setTimeout(() => { close(p); res(s.length - 1); }, 700); } }; raf = requestAnimationFrame(loop); }); }
G.playBowling = playBowling; G.playSnake = playSnake;

// ---------- the mall: walk into each store ----------
const MALL = { 'SBARRO':['Counter', [['Slice of cheese and a drink', 4.29, 'Pizza the size of my face.']], 'food'], 'ORANGE JULIUS':['Counter', [['Orange Julius', 2.79, 'Tastes like a creamsicle. No complaints.']], 'food'],
  'ELECTRONICS BOUTIQUE':['Clerk', null, 'games'], "SPENCER'S":['Clerk', [['Lava lamp', 19.99, 'lava'], ['Black-light poster', 9.99, 'poster_band']], 'room'], 'HOT TOPIC':['Clerk', [['Band tee', 18, 'TOUR']], 'tee'],
  'JOURNEYS':['Clerk', [['Skate shoes', 54.99, 'shoes']], 'shoes'], 'SPRINT PCS':['Sprint guy', null, 'phone'] };
async function mallStore(name){ const l = L(), c = MALL[name]; E.cut(true); await E.say([[c[0], G.greet ? G.greet(name, 'Hey, let me know if you need anything.') : 'Hey.']]);
  if(c[2] === 'games' && G.ext) await G.ext.shopGames();
  else if(c[2] === 'phone' && G.phoneStore) await G.phoneStore();
  else { const k = await E.choose([...c[1].map(i => `${i[0]} — ${api.money(i[1])}`), 'Just looking']); const it = c[1][k];
    if(it){ if(c[2] === 'room' && (l.owned || []).includes(it[2])) await E.say([[c[0], 'You already got one of those, man.']]);
      else if(c[2] === 'tee' && (l.prints || []).includes('TOUR')) await E.say([[c[0], 'We’re out of your size.']]);
      else if(api.pay(it[1])){ if(c[2] === 'food'){ api.passTime(15); P.stam = 1; P.tired = false; E.toast(it[2], 2400); } if(c[2] === 'room'){ l.owned.push(it[2]); G.drawRoom && G.drawRoom(); } if(c[2] === 'tee'){ (l.prints = l.prints || []).push('TOUR'); E.toast('Band tee. It’s in your closet (print: TOUR).', 2600); }
        if(c[2] === 'shoes'){ G.chrisLook.shoes = '#f2f2f2'; l.look = { ...G.chrisLook }; E.setOutfit({}); } api.save(); } } }
  E.cut(false); }

// ---------- driving: speedometer + posted limits + police ----------
let mph = null;
const limitAt = (x, z) => { let best = null, bd = 1e9; for(const l of G.townLines || []){ const m = l.p[l.p.length >> 1]; const d = Math.abs(m[0] - x) + Math.abs(m[1] - z); if(d < bd && d < 400){ for(let i = 1; i < l.p.length; i++){ const a = l.p[i - 1], b = l.p[i], ex = b[0] - a[0], ez = b[1] - a[1], q = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez || 1))), dd = Math.hypot(a[0] + ex * q - x, a[1] + ez * q - z); if(dd < bd){ bd = dd; best = l; } } } } return best && best.k === 0 ? 45 : 30; };
G.speedLimit = limitAt;
export function policeCar(x, z, ry){ const c = E.makeCar('#f2f2f2', { type:'sedan' }); c.position.set(x, T(x, z), z); c.rotation.y = ry; const r = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .22), new THREE.MeshBasicMaterial({ color:0xff2020 })), b = r.clone(); b.material = new THREE.MeshBasicMaterial({ color:0x2040ff }); r.position.set(.28, 1.5, -.2); b.position.set(-.28, 1.5, -.2); c.add(r, b);
  [-1, 1].forEach(s => { const st = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .3), lbl('POLICE', { bg:'#f2f2f2', fg:'#1a2a5a', size:40, w:256, h:44 })); st.position.set(s * .92, .75, 0); st.rotation.y = s * Math.PI / 2; c.add(st); }); c.userData.bar = [r, b]; return c; }
G.policeCar = policeCar;

// ---------- switch on ----------
export function world23On(a){ api = a; objs.forEach(o => G.scene.remove(o)); objs = []; npcs.forEach(n => n.remove()); npcs = []; const l = L();
  // mall stores
  { const s = shop('ST. CLAIR SQUARE'); (s && s.units || []).forEach(u => { if(!MALL[u.name]) return; const n = E.npc(MALL[u.name][0], api.randomLook(Math.random() < .5), u.clerk[0], u.clerk[1], { face:Math.atan2(u.at[0] - u.clerk[0], u.at[1] - u.clerk[1]), y:T(u.clerk[0], u.clerk[1]) }); n.shop = 'ST. CLAIR SQUARE'; npcs.push(n);
      api.add({ x:u.at[0], z:u.at[1], r:2, prompt:u.name, use:async () => { if(G.shopOpen && !G.shopOpen('ST. CLAIR SQUARE')){ E.toast('The mall is closed.', 2000); return; } await mallStore(u.name); } }); });
    if(s){ for(let i = 0; i < 6; i++){ const n = E.npc('Shopper', api.randomLook(i % 2 === 0), s.at[0] + (i - 3) * 2, s.at[1], { speed:1.2 }); n.townie = true; n.shop = 'ST. CLAIR SQUARE'; npcs.push(n); const walk = () => { if(!npcs.includes(n)) return; const u = s.units[Math.random() * s.units.length | 0]; n.go([[u.at[0] + (Math.random() - .5) * 3, u.at[1] + (s.at[1] - u.at[1]) * .5]]).then(() => setTimeout(walk, 2000 + Math.random() * 4000)); }; walk(); } } }
  // brand interiors, pole signs, drive-thrus, busy lots
  const FAST = { "STEAK 'N SHAKE":['#111', '#fff', '#c8202a'], 'WHITE CASTLE':['#1b3a8a', '#fff', '#1b3a8a'], "HARDEE'S":['#f2a020', '#fff', '#c8202a'], 'DAIRY QUEEN':['#c8202a', '#fff', '#c8202a'], 'TACO BELL':['#5a2a82', '#ffd23f', '#5a2a82'], "IMO'S PIZZA":['#c8102e', '#fff', '#2f5a3a'], 'MOTO MART':['#c8102e', '#fff', '#c8102e'], 'WALGREENS':['#f2f2f2', '#c8102e', '#c8102e'], 'BLOCKBUSTER VIDEO':['#2a5fb8', '#f2c230', '#2a5fb8'] };
  const lots = [];
  for(const s of G.shops || []){ const f = frame(s);
    if(FAST[s.name]){ const c = FAST[s.name], [px, pz] = f.at(f.hl + 2.2, 1.5); box(.35, 7.5, .35, '#8a8a8a', px, 0, pz); box(3.6, 1.6, .35, c[2], px, 7.2, pz, f.ry); sign(s.name.replace(' VIDEO', ''), { bg:c[0], fg:c[1], size:46, w:512, h:120 }, 3.4, 1.3, px + f.nx * .19, 8, pz + f.nz * .19, f.ry); sign(s.name.replace(' VIDEO', ''), { bg:c[0], fg:c[1], size:46, w:512, h:120 }, 3.4, 1.3, px - f.nx * .19, 8, pz - f.nz * .19, f.ry + Math.PI); }
    if(['WHITE CASTLE', "HARDEE'S", 'DAIRY QUEEN', 'TACO BELL', "STEAK 'N SHAKE"].includes(s.name)){ const [mx, mz] = f.inn(f.hl + 3, f.hd * 1.2); box(.25, 2.2, 1.8, '#2a2a2a', mx, 0, mz, f.ry + Math.PI / 2); sign(['DRIVE-THRU', 'MENU'], { bg:'#1a1a1a', fg:'#f2e9c8', size:34, w:256, h:200 }, 1.6, 1.4, mx + Math.cos(f.ry) * .14, 1.5, mz - Math.sin(f.ry) * .14, f.ry + Math.PI / 2);
      api.add({ x:mx, z:mz, r:6, prompt:'ORDER AT THE DRIVE-THRU', when:() => !G.mission && G.ctl && !G.uiOpen && G.driving && Math.abs(G.driving.speed) < 2, use:async () => { if(G.shopOpen && !G.shopOpen(s.name)){ E.toast('Drive-thru’s closed.', 2000); return; } E.cut(true); await E.say([['Speaker', 'Welcome to ' + s.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) + ', go ahead when you’re ready.']]);
        const k = await E.choose(['Combo meal — $3.99', 'Just a drink — $1.09', 'Never mind']); if(k < 2 && api.pay([3.99, 1.09][k])){ api.passTime(6); P.stam = 1; P.tired = false; await E.say([['Speaker', 'Pull around to the window.']]); E.toast(k ? 'Large drink. Sweating in the cupholder.' : 'Bag on the passenger seat. Fries gone before the light changed.', 2600); } E.cut(false); } }); }
    if(s.name === "STEAK 'N SHAKE"){ const pg = new THREE.PlaneGeometry(2 * f.hl - 1, 2 * f.hd - 1); pg.rotateX(-Math.PI / 2); pg.rotateY(f.ry); const g = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ map:E.tex('ssck', (g, w, h) => { for(let i = 0; i < 8; i++) for(let j = 0; j < 8; j++){ g.fillStyle = (i + j) % 2 ? '#111' : '#f2f2f2'; g.fillRect(i * w / 8, j * h / 8, w / 8, h / 8); } }, 128, 128, [6, 4]) })); const [cx, cz] = f.inn(0, f.hd); g.position.set(cx, T(s.at[0], s.at[1]) + .06, cz); add(g);
      for(let i = -3; i <= 3; i++){ const [x, z] = f.inn(i * 1.1, f.hd * 2 - 5.6); box(.4, .7, .4, '#c8202a', x, 0, z); } }
    if(s.name === 'WHITE CASTLE'){ for(const side of [-1, 1]){ const [x, z] = f.inn(side * (f.hl - .4), f.hd); box(.05, 1.2, 2 * f.hd - 1, '#e8eef8', x, 1, z, f.ry); } }
    if(s.name === 'WALGREENS'){ const [x, z] = f.inn(-f.hl + 3, 3); box(2.4, 1.1, .8, '#e8e2d0', x, 0, z, f.ry, true); sign('PHOTO', { bg:'#c8102e', fg:'#fff', size:44, w:256, h:70 }, 1.8, .5, x, 2.4, z, f.ry + Math.PI);
      api.add({ x:x + f.nx * 1.2, z:z + f.nz * 1.2, r:1.6, prompt:'PHOTO COUNTER', use:() => G.photoCounter && G.photoCounter() }); }
    // parking: a few cars by time of day (busy at lunch, Friday night, weekends)
    if(!['ST. CLAIR SQUARE', 'BELLEVILLE AUTO SALES', 'SPLASH CAR WASH'].includes(s.name)){ const cars = []; for(let i = 0; i < 4; i++){ const u = -f.hl + 2 + i * 3.2; const [x, z] = f.inn(u, 2 * f.hd + 5); const c = E.makeCar(['#7a2a2a', '#c8c8c8', '#2a4a6a', '#3a3a3a', '#6a5a2a', '#1f5a3a'][(i * 7 + s.name.length) % 6], { type:['sedan', 'suv', 'pickup', 'van', 'sedan'][(i + s.name.length) % 5] }); c.position.set(x, T(x, z), z); c.rotation.y = f.ry; c.visible = false; add(c); cars.push(c); } lots.push({ s, cars }); } }
  { const m = shop('ST. CLAIR SQUARE'); if(m){ const f = frame(m), cars = []; for(let i = 0; i < 10; i++){ const [x, z] = f.at(-f.hl + 3 + i * 5, 12 + (i % 2) * 7); const c = E.makeCar(['#7a2a2a', '#c8c8c8', '#2a4a6a', '#3a3a3a', '#d8d0b0'][i % 5], { type:['sedan', 'suv', 'van', 'pickup'][i % 4] }); c.position.set(x, T(x, z), z); c.rotation.y = f.ry; c.visible = false; add(c); cars.push(c); } lots.push({ s:m, cars }); } }
  // two more gas stations (pumps + canopy in front of the kiosk)
  for(const n of ['PHILLIPS 66', 'SHELL']){ const s = shop(n); if(!s) continue; const f = frame(s), [cx, cz] = f.at(0, 7); const col = n === 'SHELL' ? ['#f2c22a', '#c8202a'] : ['#c8202a', '#1a1a1a'];
    box(12, .5, 7, '#f2f2f2', cx, 4.6, cz, f.ry); box(12.1, .45, 7.1, col[0], cx, 4.2, cz, f.ry); [-4, 4].forEach(u => { const [x, z] = f.at(u, 7); box(.35, 4.2, .35, '#e8e8e8', x, 0, z, 0, true); box(.9, 1.7, .6, '#d8d8d0', x + f.nz * 1.5, 0, z + f.nx * 1.5, f.ry, true);
      api.add({ x:x + f.nz * 1.5, z:z + f.nx * 1.5 + 1, r:3.5, prompt:'FILL UP THE TANK', when:() => !G.mission && G.ctl && !G.driving && !G.uiOpen && G.chrisCar && Math.hypot(G.chrisCar.position.x - x, G.chrisCar.position.z - z) < 9,
        use:() => { const need = Math.max(0, 10 - G.gas), pr = (G.gasPrice ? G.gasPrice(l.dayCount) : 1.59) + (n === 'SHELL' ? .04 : .02), cost = Math.round(need * pr * 100) / 100; if(need < .2){ E.toast('Tank’s already full.', 2000); return; } if(api.pay(cost)){ G.gas = 10; l.gas = 10; api.save(); E.toast(`${n}: ${need.toFixed(1)} gal for ${api.money(cost)}.`, 2600); } } }); });
    const [px, pz] = f.at(f.hl + 2, 2); box(.35, 7, .35, '#8a8a8a', px, 0, pz); sign([n, 'UNLEADED $' + ((G.gasPrice ? G.gasPrice(l.dayCount) : 1.59) + (n === 'SHELL' ? .04 : .02)).toFixed(2) + '⁹'], { bg:col[0], fg:col[1], size:40, w:384, h:200 }, 3, 1.7, px, 7.6, pz, f.ry); }
  // speed limit signs along the streets
  for(const ln of G.townLines || []){ if(ln.len < 150 || ln.core) continue; for(let i = 1; i < ln.p.length; i += 6){ const a = ln.p[i - 1], b = ln.p[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, o = (ln.hw || 4) + 1.6, x = a[0] - (b[1] - a[1]) / d * o, z = a[1] + (b[0] - a[0]) / d * o;
      if(G.colliders.some(c => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1)) continue; box(.08, 2.2, .08, '#8a8a8a', x, 0, z); sign(['SPEED', 'LIMIT', ln.k === 0 ? '45' : '30'], { bg:'#f2f2f2', fg:'#111', size:44, w:160, h:200 }, .6, .75, x, 2.4, z, Math.atan2(b[0] - a[0], b[1] - a[1]) + Math.PI); } }
  // MetroLink: ride between stations
  const ST = Object.entries(G.townPlaced || {}).filter(([n]) => / METRO$/.test(n));
  ST.forEach(([n, p]) => api.add({ x:p[0], z:p[1], r:8, prompt:'RIDE THE METROLINK ($1.25)', use:async () => { const others = ST.filter(s => s[0] !== n); E.cut(true); const k = await E.choose([...others.map(s => s[0].replace(' METRO', '') + ' station'), 'Never mind']); if(k >= others.length || !api.pay(1.25)){ E.cut(false); return; }
    await E.fade(true, 500); api.passTime(18); const q = others[k][1]; E.place(q[0] + 5, q[1] + 5, 0); await E.card('METROLINK', others[k][0].replace(' METRO', '') + ' STATION', 1500); await E.fade(false, 500); E.cut(false); } }));
  // pickup 1-on-1 at Elmwood Park
  api.add({ x:-60.5, z:70.5, r:2.6, prompt:'PICKUP GAME: 1-ON-1 (FIRST TO 11)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && l.min > 600 && l.min < 1200 && !G.wet, use:async () => { const foe = ['Tyler', 'Dustin', 'Kyle', 'Brandon'][(l.dayCount || 0) % 4]; E.cut(true); await E.say([[foe, 'Ones? Make it, take it. Loser buys Gatorade.']]); E.cut(false); const r = await playDuel({ title:'PICKUP: 1 ON 1 VS ' + foe.toUpperCase(), foe }); api.passTime(25); l.fr = l.fr || {}; api.save(); E.toast(r && r.win ? 'Won the pickup game. Talking trash all the way home.' : 'Good run. Rematch tomorrow.', 2800); } });
  // skate tricks: Q on the board, chain them within 3 seconds for a combo
  const TR = [['Ollie', 50], ['Kickflip', 150], ['Heelflip', 150], ['Pop shove-it', 120], ['50-50 grind', 250], ['Manual', 100], ['Varial flip', 300]]; let combo = 0, cT = 0, best = l.hi?.skate || 0;
  const sk = e => { if(e.code !== 'KeyQ' || !P.board || G.driving || G.mission || !G.ctl || G.uiOpen) return; const t = TR[Math.random() * TR.length | 0], land = Math.random() > .12; if(!land){ combo = 0; E.toast('Bailed. Scraped knee, damaged pride.', 1800); E.sfx('miss'); return; }
    combo = (G.t - cT < 3 ? combo : 0) + t[1] * (1 + (G.t - cT < 3 ? .5 : 0)); cT = G.t; E.sfx('cart'); if(combo > best){ best = combo; l.hi = l.hi || {}; l.hi.skate = best; api.save(); } E.toast(`🛹 ${t[0]} · combo ${Math.round(combo)}${combo >= best ? ' · BEST' : ''}`, 1500); };
  addEventListener('keydown', sk);
  // disposable camera photo hunt: F snaps a landmark in front of you; 27 exposures; develop at the Walgreens photo counter
  const SPOTS = Object.entries(G.townPlaced || {}).filter(([n]) => !/METRO/.test(n)).concat([['SCHNUCKS', [290, 146]], ['BELLEVILLE WEST', [-315, -620]]]);
  const snap = e => { if(e.code !== 'KeyF' || G.driving || G.mission || !G.ctl || G.uiOpen) return; if(!(l.owned || []).includes('camera')){ return; } if((l.shots ?? 27) <= 0){ E.toast('Out of film. Get it developed at Walgreens.', 2200); return; } l.shots = (l.shots ?? 27) - 1;
    E.tone(1800, 0, .05, 'square', .04); E.tone(600, .06, .12, 'square', .03); const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw); const hit = SPOTS.find(([n, p]) => { const dx = p[0] - P.p.x, dz = p[1] - P.p.z, d = Math.hypot(dx, dz); return d < 90 && (dx * fx + dz * fz) / (d || 1) > .7; });
    l.film = l.film || []; if(hit && !l.film.includes(hit[0]) && !(l.photos || []).includes(hit[0])) l.film.push(hit[0]); api.save(); E.toast(`📷 *click* ${hit ? hit[0] : 'a blurry photo of nothing'} · ${l.shots} shots left`, 2000); };
  addEventListener('keydown', snap);
  G.photoCounter = async () => { E.cut(true); if(!(l.film || []).length && (l.shots ?? 27) === 27){ await E.say([['Photo tech', 'Disposable cameras are $6.99 up front. Developing is $5.99.']]); E.cut(false); return; }
    if((await E.choose([`Develop the film — $5.99`, 'Never mind'])) === 0 && api.pay(5.99)){ l.photos = [...(l.photos || []), ...(l.film || [])]; const n = (l.film || []).length; l.film = []; l.shots = 27; l.owned = (l.owned || []).filter(x => x !== 'camera'); api.save(); G.drawRoom && G.drawRoom();
      await E.say([['Photo tech', 'One-hour photo. Here you go.'], ['', n ? `${n} good shots out of 27. The rest are my thumb. ${l.photos.length}/${SPOTS.length} landmarks on the wall now.` : 'Twenty-seven pictures of my thumb. Great.']]); } E.cut(false); };
  G.preBuy = (shopName, it) => { if(/Scratch/.test(it[0])){ E.toast('<b>Clerk:</b> You 18? ...Yeah, no. Nice try, kid.', 2600); return false; } return true; };
  G.onBuy = (shopName, it) => { if(it[0] === 'Disposable camera'){ l.owned = l.owned || []; if(!l.owned.includes('camera')) l.owned.push('camera'); l.shots = 27; E.toast('📷 Press F to take a picture of a landmark in front of you.', 3400); } api.save(); };
  // Friday night cruising in the Schnucks lot, until a cop moves everyone along at 11
  const cruise = { on:false, objs:[], n:[] }; const cruiseSet = on => { if(on === cruise.on) return; cruise.on = on; cruise.objs.forEach(o => G.scene.remove(o)); cruise.n.forEach(n => n.remove()); cruise.objs = []; cruise.n = []; if(!on) return;
    for(let i = 0; i < 4; i++){ const c = E.makeCar(['#1a1a1a', '#c8202a', '#e8e8e8', '#2a4a8a'][i], { type:['sedan', 'pickup', 'sedan', 'suv'][i] }); c.position.set(298 + i * 4, T(298 + i * 4, 230), 230); G.scene.add(c); cruise.objs.push(c); const n = E.npc('Teen', api.randomLook(i % 2 === 1), 298 + i * 4, 233, { face:Math.PI }); n.townie = true; cruise.n.push(n); } };
  // Christmas lights on houses in December
  let xmas = null; const xmasSet = on => { if(!!xmas === on) return; if(xmas){ G.scene.remove(xmas); xmas = null; } if(!on) return; xmas = new THREE.Group(); const cols = [0xff3030, 0x30ff60, 0x3070ff, 0xffd030, 0xffffff];
    (G.driveways || []).forEach((d, k) => { if(k % 2) return; const fx = -Math.sin(d.ry), fz = -Math.cos(d.ry), bx = d.x + fx * 9, bz = d.z + fz * 9, rx = fz, rz = -fx; for(let i = 0; i < 12; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 5, 4), new THREE.MeshBasicMaterial({ color:cols[(i + k) % 5] })); const x = bx + rx * (i - 6) * .8, z = bz + rz * (i - 6) * .8; b.position.set(x, T(x, z) + 2.9, z); xmas.add(b); } }); G.scene.add(xmas); };
  // football crowd on Friday nights
  let crowd = []; const crowdSet = on => { if(!!crowd.length === on) return; crowd.forEach(n => n.remove()); crowd = []; if(!on) return; for(let i = 0; i < 24; i++){ const x = -400 + (i % 12) * 6, z = -516 + (i / 12 | 0) * 2; const n = E.npc('Fan', api.randomLook(i % 2 === 0), x, z, { face:Math.PI }); n.townie = true; crowd.push(n); } };
  // Friday night at Blockbuster: the place is packed; drive-in lot fills up Fri + Sat nights
  let rush = []; const rushSet = on => { if(!!rush.length === on) return; rush.forEach(n => n.remove()); rush = []; if(!on) return; for(const nm of ['BLOCKBUSTER VIDEO', 'BLOCKBUSTER']){ const s = shop(nm); if(!s) continue; const f = frame(s); for(let i = 0; i < 5; i++){ const [x, z] = f.inn(-f.hl + 3 + i * 3.4, f.hd); const n = E.npc('Customer', api.randomLook(i % 2 === 0), x, z, { face:Math.random() * 6, y:T(s.at[0], s.at[1]) }); n.townie = true; rush.push(n); } } };
  let dvi = []; const dviSet = on => { if(!!dvi.length === on) return; dvi.forEach(c => G.scene.remove(c)); dvi = []; const sv = (G.townPlaced || {})['SKYVIEW DRIVE-IN']; if(!on || !sv) return; for(let i = 0; i < 14; i++){ const x = sv[0] - 30 + (i % 7) * 9, z = sv[1] - 10 + (i / 7 | 0) * 12; const c = E.makeCar(['#7a2a2a', '#c8c8c8', '#2a4a6a', '#3a3a3a', '#6a5a2a', '#1f5a3a', '#d8d0b0'][i % 7], { type:['sedan', 'suv', 'pickup', 'van'][i % 4], lights:true }); c.position.set(x, T(x, z), z); G.scene.add(c); dvi.push(c); } };
  // the computer: dial-up, Kazaa, burning a mix (GAME ORIGINAL)
  G.dialUp = async () => { if(G.t - (G.dialT || -999) < 600) return; G.dialT = G.t; E.toast('📞 Dialing...', 1800); [[1209, 0], [1477, .15], [1336, .3], [697, .45], [941, .6]].forEach(([f, t]) => E.tone(f, t, .12, 'sine', .03)); E.tone(2100, 1, .6, 'sine', .03); E.tone(1200, 1.7, .5, 'sawtooth', .02, 2400); E.tone(980, 2.3, 1.2, 'square', .015, 1650); await E.wait(3600); E.toast('Connected at 44.0 Kbps. Do NOT pick up the phone, Mom.', 2600); };
  G.kazaa = async () => { const tr = G.radio.st.tracks, have = l.mp3 || [], left = tr.map((t, i) => i).filter(i => !have.includes(i)); if(!left.length){ await E.say([['', 'I have every song I could want. Kazaa can rest now.']]); return; } const pick = left.sort(() => Math.random() - .5).slice(0, 4);
    const k = await E.choose([...pick.map(i => `${tr[i][1]} - ${tr[i][2]}.mp3`), 'Close Kazaa']); if(k >= pick.length) return; await E.fade(true, 400); api.passTime(20); await E.fade(false, 400);
    if(Math.random() < .2){ await E.say([['', 'Downloaded for 20 minutes. It’s a guy saying “you should buy the CD.” Classic Kazaa.']]); return; } (l.mp3 = l.mp3 || []).push(pick[k]); api.save(); await E.say([['', `Got it. ${l.mp3.length} songs on the computer now.`]]); };
  G.burnCD = async () => { const n = (l.mp3 || []).length; if(n < 3){ await E.say([['', 'Need at least three songs downloaded to make a mix worth burning.']]); return; } const k = await E.choose(['Burn a mix for me (CD-R $1)', 'Burn one for a friend (CD-R $1)', 'Never mind']); if(k === 2 || !api.pay(1)) return;
    await E.fade(true, 400); api.passTime(25); await E.fade(false, 400); if(k === 0){ l.cds = l.cds || []; if(!l.cds.includes('Chris’s mix')) l.cds.push('Chris’s mix'); api.save(); G.drawRoom && G.drawRoom(); await E.say([['', 'Wrote CHRIS MIX on it in Sharpie. Plays in the boombox and the car.']]); }
    else { const f = ['Zeke', 'Jax', 'Matt', 'Milo'], j = await E.choose(f); l.fr = l.fr || {}; l.fr[f[j]] = (l.fr[f[j]] || 0) + 2; api.save(); await E.say([['', `Made ${f[j]} a mix. Track 4 skips. It’s fine. It’s the thought.`]]); } };
  // tick
  let lastCheck = 0, sirenT = 0, lastAllow = -1;
  api.addTick(dt => { if(G.mission) return; const t = l.min, d = dateOf(l.dayCount), dow = d.getDay(), dc = l.dayCount || 0;
    // speedometer
    if(G.driving){ if(!mph){ mph = document.createElement('div'); mph.style.cssText = 'position:fixed;right:22px;bottom:200px;font:bold 12px "Press Start 2P",monospace;color:#fff;text-shadow:2px 2px 0 #000;z-index:12;text-align:right'; document.body.appendChild(mph); }
      const c = G.driving.car.position, v = Math.round(Math.abs(G.driving.speed) * 2.237), lim = (G.t % 1 < dt) ? (mph.lim = limitAt(c.x, c.z)) : (mph.lim || 30); mph.style.display = ''; mph.innerHTML = `<span style="display:inline-block;background:#f2f2f2;color:#111;border:2px solid #111;padding:4px 6px;font-size:10px;line-height:1.5;text-align:center">SPEED<br>LIMIT<br><b style="font-size:16px">${lim}</b></span>${v > lim + 10 ? '<br><small style="font-size:9px;color:#ff6a5a">SLOW DOWN</small>' : ''}`; }
    else if(mph) mph.style.display = 'none';
    if((lastCheck -= dt) > 0) return; lastCheck = 1.5;
    // shops go dark when they close
    for(const s of G.shops || []){ if(!s.lit) continue; const op = !G.shopOpen || G.shopOpen(s.name); if(s.isOpen === op) continue; s.isOpen = op; s.lit.forEach(q => q.m.emissive.copy(op ? q.e : q.e.clone().multiplyScalar(.08))); }
    // parked cars by hour
    const busy = (t > 690 && t < 810 ? .8 : t > 1020 && t < 1260 ? .7 : t > 480 && t < 1320 ? .45 : .1) + (dow === 0 || dow === 6 ? .25 : 0) + (dow === 5 && t > 1080 ? .2 : 0);
    for(const q of lots){ const open = !G.shopOpen || G.shopOpen(q.s.name), n = open ? Math.round(q.cars.length * Math.min(1, busy)) : 0; q.cars.forEach((c, i) => c.visible = i < n && Math.abs(c.position.x - P.p.x) + Math.abs(c.position.z - P.p.z) < 260); }
    cruiseSet(dow === 5 && t >= 1260 && t < 1380); if(dow === 5 && t >= 1375 && t < 1385 && Math.hypot(P.p.x - 304, P.p.z - 230) < 40) E.toast('<b>Officer:</b> Alright, lot’s closed. Everybody move it along.', 3200);
    xmasSet(d.getMonth() === 11); rushSet(dow === 5 && t >= 1080 && t < 1380); dviSet((dow === 5 || dow === 6) && t >= 1170 && t < 1410 && d.getMonth() >= 3 && d.getMonth() <= 9); crowdSet(dow === 5 && d.getMonth() >= 8 && d.getMonth() <= 10 && t >= 1140 && t < 1320);
    // tornado siren test: first Tuesday of the month, 11 AM
    if(dow === 2 && d.getDate() <= 7 && t >= 660 && t < 663 && sirenT <= 0){ sirenT = 30; E.toast('🔊 Monthly tornado siren test. Everybody ignores it.', 3600); for(let i = 0; i < 3; i++){ E.tone(380, i * 4, 2, 'sawtooth', .02, 760); E.tone(760, i * 4 + 2, 2, 'sawtooth', .02, 380); } } sirenT -= 1.5;
    // allowance: Sunday morning, if you did at least two chores this week
    if(dow === 0 && t >= 540 && lastAllow !== dc){ lastAllow = dc; const ch = Object.values(l.chores || {}).filter(v => dc - v < 7).length; if(ch >= 2 && l.allowDay !== dc){ l.allowDay = dc; l.cash += 10; api.save(); E.toast('<b>Dad:</b> You pulled your weight this week. Ten bucks on the counter.', 3600); } }
    for(const n of crowd) n.o.visible = Math.hypot(n.p.x - P.p.x, n.p.z - P.p.z) < 90; });
  api.onOff(() => { removeEventListener('keydown', sk); removeEventListener('keydown', snap); objs.forEach(o => G.scene.remove(o)); objs = []; npcs.forEach(n => n.remove()); npcs = []; cruiseSet(false); xmasSet(false); crowdSet(false); rushSet(false); dviSet(false); if(mph) mph.style.display = 'none'; (G.shops || []).forEach(s => { if(s.lit){ s.lit.forEach(q => q.m.emissive.copy(q.e)); s.isOpen = true; } }); }); }
