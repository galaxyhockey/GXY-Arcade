// Back in the 2000s: The Game — Schnucks Swansea strip-plaza shops, walk-in interiors (2003 small-business look).
// Each unit: 16 m frontage at z 334 (glass storefront + door, facing the lot), 16 m deep, back wall z 350.
import { THREE, G, box, plane, mat, label, tex, makePerson } from './engine.js';
import * as PR from './props.js';
import { brickM } from './buildings.js';
const S = G.scene, M = mat, ZF = 334, ZB = 350, H = 3.4;
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
const col = (x0, z0, x1, z1, y1 = 6) => G.colliders.push({ x0, x1, z0, z1, y0:0, y1 });
function vp(w, h, m, x, y, z, ry){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; S.add(p); return p; }
const basic = c => new THREE.MeshBasicMaterial({ color:c });
const glass = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.3, emissive:0x1a2c34, side:THREE.DoubleSide, depthWrite:false });
const tx = (key, draw, w, h, rep, em) => new THREE.MeshLambertMaterial({ map:tex(key, draw, w, h, rep), emissive:em || 0x000000 });
const sign = (t, bg, fg, size = 56, w = 512, h = 100) => new THREE.MeshBasicMaterial({ map:label(t, { bg, fg, size, w, h }) });
function person(x, z, ry, look){ const p = makePerson(look); p.position.set(x, 0, z); p.rotation.y = ry; S.add(p); return p; }
const metal = M('#b8bcc0'), dark = M('#2a2a2a'), wood = M('#8a6a44');

function shell(x0, x1, wallC, floorM){ const cx = (x0 + x1) / 2, w = x1 - x0, wallM = new THREE.MeshLambertMaterial({ color:wallC, emissive:0x302c28 });
  plane(w, ZB - ZF, floorM, cx, .03, (ZF + ZB) / 2);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, ZB - ZF), basic(0xeeece6)); c.rotation.x = Math.PI / 2; c.position.set(cx, H, (ZF + ZB) / 2); S.add(c);
  for(let x = x0 + 2; x < x1 - 1; x += 4) for(let z = ZF + 3; z < ZB - 1; z += 4){ const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .6), basic(0xfffdf2)); l.rotation.x = Math.PI / 2; l.position.set(x, H - .02, z); S.add(l); }
  vp(w, H, wallM, cx, H / 2, ZB - .05, Math.PI); vp(ZB - ZF, H, wallM, x0 + .2, H / 2, (ZF + ZB) / 2, Math.PI / 2); vp(ZB - ZF, H, wallM, x1 - .2, H / 2, (ZF + ZB) / 2, -Math.PI / 2);
  // storefront: kick plate, glass, mullions, door gap (east of centre)
  const d0 = cx + 2.2, d1 = cx + 4; deco(w, .4, .15, dark, cx, 0, ZF); deco(w, 2.8, .15, brickM('#8a4a34', '#c2b29c', [6, 1], 'p'), cx, H, ZF);
  vp(d0 - x0, 2.8, glass, (x0 + d0) / 2, 1.8, ZF, 0); vp(x1 - d1, 2.8, glass, (d1 + x1) / 2, 1.8, ZF, 0);
  for(let x = x0 + .1; x <= x1; x += 2.6) if(x < d0 - .1 || x > d1 + .1) deco(.1, 2.8, .12, dark, x, .4, ZF); [d0, d1].forEach(x => deco(.14, 2.6, .14, dark, x, 0, ZF)); deco(d1 - d0, .15, .14, dark, (d0 + d1) / 2, 2.6, ZF);
  col(x0, ZF - .1, d0, ZF + .1); col(d1, ZF - .1, x1, ZF + .1); col(x0, ZB - .2, x1, ZB);
  const hours = new THREE.Mesh(new THREE.PlaneGeometry(.5, .6), sign(['OPEN', 'M-SA 9-8'], '#fff', '#b02020', 40, 128, 150)); hours.position.set(d0 - .5, 1.5, ZF - .02); hours.rotation.y = Math.PI; S.add(hours);
  return { cx, x0, x1, d0, d1 }; }
const partition = x => { box(.25, 6, ZB - ZF, brickM('#8a4a34', '#c2b29c', [6, 2], 'p'), x, 0, (ZF + ZB) / 2); };

// ---------- the six units ----------
function nailSpa(u){ const { x0, x1, cx } = u;
  box(2.4, 1.05, .8, M('#f2f2f2'), cx + 4.5, 0, ZF + 3); deco(2.5, .05, .9, M('#d77aa0'), cx + 4.5, 1.05, ZF + 3); person(cx + 4.5, ZF + 4, Math.PI, { shirt:'#d77aa0', hair:'#111', long:true, skin:'#e3bf96' });
  for(let i = 0; i < 4; i++){ const z = ZF + 6 + i * 2.2; box(1.6, .75, .7, M('#f4f4f4'), x0 + 2.2, 0, z); const lp = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5, 6), metal); lp.position.set(x0 + 1.7, 1, z); S.add(lp);
    PR.chair(x0 + 1.1, 0, z, Math.PI / 2, '#222'); PR.chair(x0 + 3.3, 0, z, -Math.PI / 2, '#d77aa0'); }
  for(let i = 0; i < 3; i++){ const x = x1 - 9 + i * 2.6; box(2, .5, 2.2, M('#e8e0d8'), x, 0, ZB - 1.6); deco(1.1, 1, .9, M('#3a2a3a'), x, .5, ZB - 1.8); deco(1.1, .9, .2, M('#3a2a3a'), x, 1.3, ZB - 1.15); deco(.8, .3, .6, M('#cfd8de'), x, .05, ZB - 3.1); }
  vp(6, 1.6, tx('polish', (g, w, h) => { g.fillStyle = '#f7f1ee'; g.fillRect(0, 0, w, h); for(let y = 6; y < h; y += 14) for(let x = 4; x < w; x += 8){ g.fillStyle = `hsl(${Math.random() * 360},70%,${40 + Math.random() * 25}%)`; g.fillRect(x, y, 5, 9); } }, 256, 64, [1, 1], 0x222222), x1 - .25, 1.6, ZF + 7, -Math.PI / 2);
  vp(4, .8, sign('NAIL SPA', '#d77aa0', '#fff', 70), cx, 2.8, ZB - .07, Math.PI); }
function videoWorld(u){ const { x0, x1, cx } = u, covers = tx('vhs', (g, w, h) => { g.fillStyle = '#222'; g.fillRect(0, 0, w, h); for(let r = 0; r < 4; r++) for(let x = 0; x < w; x += 9){ g.fillStyle = `hsl(${Math.random() * 360},${50 + Math.random() * 40}%,${25 + Math.random() * 40}%)`; g.fillRect(x + 1, 4 + r * 16, 7, 12); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 2, 6 + r * 16, 5, 2); } }, 256, 64, [1, 1], 0x1a1a1a);
  for(let i = 0; i < 3; i++){ const x = x0 + 4 + i * 3.6; box(.7, 1.8, 9, M('#1f4aa8'), x, 0, ZF + 8); [-1, 1].forEach(s => vp(9, 1.6, covers, x + s * .36, .95, ZF + 8, s * Math.PI / 2)); }
  [[x0 + .26, Math.PI / 2], [x1 - .26, -Math.PI / 2]].forEach(([x, ry]) => vp(13, 1.8, covers, x, 1.1, ZF + 8.5, ry));
  ['NEW RELEASES', 'ACTION', 'COMEDY', 'DRAMA', 'HORROR', 'KIDS'].forEach((t, i) => vp(2.4, .45, sign(t, '#f2d04a', '#1f4aa8', 54, 256, 56), x0 + 2 + i * 2.4, 2.6, ZB - .07, Math.PI));
  box(3.4, 1.05, .9, M('#1f4aa8'), x1 - 3, 0, ZF + 3); deco(3.5, .05, 1, M('#f2d04a'), x1 - 3, 1.05, ZF + 3); PR.crtTV(x1 - .9, 2.1, ZF + 4.5, -Math.PI / 2, .9);
  person(x1 - 3, ZF + 4, Math.PI, { shirt:'#1f4aa8', hair:'#6a4a2a', cap:'#f2d04a' }); deco(.5, .25, .4, metal, x1 - 1.4, 1.1, ZF + .2); // return slot
  plane(x1 - x0 - .5, ZB - ZF - .5, M('#2a3a6a'), cx, .04, (ZF + ZB) / 2); }
function laundry(u){ const { x0, x1, cx } = u, washer = tx('washer', (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#777'; g.beginPath(); g.arc(w / 2, h * .55, w * .3, 0, 7); g.fill(); g.fillStyle = '#3a4a56'; g.beginPath(); g.arc(w / 2, h * .55, w * .24, 0, 7); g.fill(); g.fillStyle = '#ccc'; g.fillRect(4, 4, w - 8, 8); }, 64, 64, [1, 1], 0x222222);
  for(let i = 0; i < 6; i++) [-1, 1].forEach(s => { const x = x0 + 3 + i * 1.05, z = ZF + 8 + s * .45; box(.95, 1.05, .85, M('#f2f2ee'), x, 0, z); vp(.9, .9, washer, x, .55, z + s * .43, s > 0 ? 0 : Math.PI); });
  for(let i = 0; i < 8; i++) [0, 1].forEach(r => { const z = ZF + 4 + i * 1.3; deco(.9, 1.1, 1.2, M('#e8e8e4'), x1 - .7, r * 1.15, z); vp(1.1, 1, washer, x1 - 1.16, r * 1.15 + .55, z, -Math.PI / 2); }); col(x1 - 1.2, ZF + 3.3, x1, ZF + 14);
  [[x0 + 3.2, ZB - 2], [x0 + 6.4, ZB - 2]].forEach(([x, z]) => { box(2.4, .9, 1, M('#d8d0b8'), x, 0, z); });
  for(let i = 0; i < 5; i++) PR.chair(x0 + 1.5 + i * .8, 0, ZF + 1.2, Math.PI, '#f2a23a');
  box(.8, 1.7, .6, M('#2a7a5a'), x0 + .7, 0, ZB - 1); vp(.6, .4, sign('SOAP', '#fff', '#2a7a5a', 50, 128, 80), x0 + .7, 1.4, ZB - 1.31, Math.PI);
  person(cx + 3, ZB - 3, 0, { shirt:'#2a7a5a', hair:'#ddd', glasses:true }); vp(4, .8, sign('COIN LAUNDRY', '#2a7a5a', '#fff', 60), cx, 2.8, ZB - .07, Math.PI); }
function taxService(u){ const { x0, x1, cx } = u;
  for(let i = 0; i < 4; i++){ const x = x0 + 3 + (i % 2) * 6, z = ZF + 6 + (i / 2 | 0) * 5; box(2, .76, 1, wood, x, 0, z); PR.crtMonitor(x - .3, .76, z - .1, Math.PI); PR.chair(x, 0, z + 1, Math.PI, '#333'); PR.chair(x, 0, z - 1.1, 0, '#555');
    if(i < 2) person(x, z + 1, Math.PI, { shirt:['#e8e8e8', '#9ab0c8'][i], pants:'#333', hair:['#6a4a2a', '#222'][i], glasses:i === 0 }); }
  for(let i = 0; i < 4; i++) box(.6, 1.4, .7, M('#8a8f96'), x1 - .6, 0, ZB - 1 - i * .8);
  for(let i = 0; i < 5; i++) PR.chair(x1 - 1, 0, ZF + 2 + i * .8, -Math.PI / 2, '#2a5a2a');
  vp(3, 1.3, sign(['FILE ELECTRONICALLY', 'FASTER REFUNDS!', '2003'], '#2a5a2a', '#fff', 34, 384, 170), x0 + .27, 2, ZF + 10, Math.PI / 2);
  plane(x1 - x0 - .5, ZB - ZF - .5, M('#6a6e74'), cx, .04, (ZF + ZB) / 2); vp(4, .8, sign('TAX SERVICE', '#2a5a2a', '#fff', 60), cx, 2.8, ZB - .07, Math.PI); }
function chinaGarden(u){ const { x0, x1, cx } = u, red = M('#b8282a');
  box(4, 1.05, .9, red, cx, 0, ZB - 4); deco(4.1, .05, 1, M('#d4af37'), cx, 1.05, ZB - 4); deco(.4, .3, .35, dark, cx - 1, 1.1, ZB - 4); person(cx + .5, ZB - 3.2, Math.PI, { shirt:'#fff', hair:'#111', skin:'#e3bf96' });
  vp(6, 1.4, new THREE.MeshBasicMaterial({ map:label(['1. General Tso Chicken  6.95', '2. Sweet & Sour Pork  6.50', '3. Crab Rangoon (6)  3.25', '4. Egg Roll  1.10'], { bg:'#2a0a0a', fg:'#ffd36a', size:22, w:512, h:120 }) }), cx, 2.5, ZB - .07, Math.PI);
  deco(6, .9, .3, metal, cx, 1.2, ZB - .3); // kitchen pass-through
  for(let i = 0; i < 6; i++){ const x = x0 + 3 + (i % 3) * 4.4, z = ZF + 3.5 + (i / 3 | 0) * 4; box(1.2, .75, 1.2, red, x, 0, z); deco(1.3, .03, 1.3, M('#f4f1ea'), x, .75, z); PR.chair(x - .9, 0, z, Math.PI / 2, '#2a1a1a'); PR.chair(x + .9, 0, z, -Math.PI / 2, '#2a1a1a'); }
  for(let i = 0; i < 5; i++){ const l = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), new THREE.MeshBasicMaterial({ color:0xd8302a })); l.scale.y = 1.2; l.position.set(x0 + 2 + i * 3, H - .7, ZF + 6); S.add(l); }
  box(1.8, .8, .5, wood, x1 - 1.3, 0, ZF + 1); const aq = new THREE.Mesh(new THREE.BoxGeometry(1.7, .8, .45), new THREE.MeshLambertMaterial({ color:0x3a8ab8, transparent:true, opacity:.6, emissive:0x10304a })); aq.position.set(x1 - 1.3, 1.2, ZF + 1); S.add(aq);
  for(let i = 0; i < 3; i++){ const f = new THREE.Mesh(new THREE.BoxGeometry(.12, .07, .03), new THREE.MeshBasicMaterial({ color:0xff8a2a })); f.position.set(x1 - 1.8 + i * .5, 1.1 + i * .15, ZF + 1); S.add(f); }
  plane(x1 - x0 - .5, ZB - ZF - .5, M('#8a2a22'), cx, .04, (ZF + ZB) / 2); }
function hairCuts(u){ const { x0, x1, cx } = u, mirror = new THREE.MeshLambertMaterial({ color:0xcfe0ea, emissive:0x40505a });
  for(let i = 0; i < 3; i++){ const z = ZF + 5 + i * 3; vp(1.6, 1.4, mirror, x0 + .27, 1.7, z, Math.PI / 2); deco(.5, .9, 2, M('#e8e4dc'), x0 + .5, 0, z);
    const ch = new THREE.Group(); ch.position.set(x0 + 2, 0, z); S.add(ch); [[.7, .4, .7, '#888', 0, 0], [.75, .5, .75, '#b02020', 0, .45], [.75, .9, .15, '#b02020', .32, .95]].forEach(([w, h, d, c, dx, y]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); b.position.set(-dx, y + h / 2, 0); b.rotation.y = 0; ch.add(b); });
    ch.rotation.y = -Math.PI / 2; G.colliders.push({ x0:x0 + 1.6, x1:x0 + 2.4, z0:z - .4, z1:z + .4, y0:0, y1:1.6 }); }
  person(x0 + 2.4, ZF + 8.2, -Math.PI / 2, { shirt:'#f2f2f2', hair:'#333', beard:'#333' });
  for(let i = 0; i < 6; i++) PR.chair(x1 - 1, 0, ZF + 3 + i * .9, -Math.PI / 2, '#222'); box(.8, .45, 1.4, wood, x1 - 2.2, 0, ZF + 5.2); deco(.5, .04, .4, M('#c83'), x1 - 2.2, .45, ZF + 5.2);
  box(1.2, .9, .6, M('#e8e4dc'), cx, 0, ZB - .7); vp(4, .8, sign('HAIR CUTS', '#7a2a8a', '#fff', 60), cx + 3, 2.8, ZB - .07, Math.PI);
  // barber pole outside the door
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1, 12), new THREE.MeshBasicMaterial({ map:tex('pole', (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); for(let i = -4; i < 8; i++){ g.fillStyle = i % 2 ? '#c8202a' : '#2040a8'; g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16 + 32); g.lineTo(w, i * 16 + 40); g.lineTo(0, i * 16 + 8); g.fill(); } }, 64, 128) }));
  pole.position.set(u.d1 + .4, 2, ZF - .25); S.add(pole); G.barberPole = pole; G.ticks.push(Object.assign(() => { pole.rotation.y += .03; }, { amb:true })); }

function shopExtras(){ const deco = (w, h, d, c, x, y, z) => box(w, h, d, typeof c === 'string' ? M(c) : c, x, y, z, { col:false }); const fr = (t, bg, fg, w, h, x, y, z, ry) => vp(w, h, sign(t, bg, fg, 34, 256, Math.round(256 * h / w)), x, y, z, ry), plant = (x, z) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .45, 8), M('#8a5a3a')); p.position.set(x, .22, z); S.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), M('#3d7a2e')); l.position.set(x, .95, z); l.scale.y = 1.35; S.add(l); };
  const fan = (x, z) => { deco(.06, .4, .06, '#ccc', x, H - .4, z); for(let i = 0; i < 4; i++){ const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, .02, .16), M('#8a6a44')); b.position.set(x + Math.cos(i * 1.57) * .6, H - .42, z + Math.sin(i * 1.57) * .6); b.rotation.y = -i * 1.57; S.add(b); } };
  // nail spa (2..18)
  plant(3, 335.2); plant(16.8, 348.8); fr(['SPA PEDICURE $25', 'MANICURE $12', 'ACRYLIC SET $30'], '#f7f1ee', '#b23a6a', 3, 1.3, 9, 2.1, ZB - .07, Math.PI); fan(7, 341); fan(13, 341);
  deco(.9, .4, .9, '#e8e0d8', 13.2, 0, 336); deco(.5, .03, .35, '#c83', 13.2, .4, 336); [12.2, 14.2].forEach(x => PR.chair(x, 0, 336, x < 13 ? Math.PI / 2 : -Math.PI / 2, '#d77aa0'));
  // video world (18..34): standee, candy rack, gumball machine, posters
  deco(.9, 1.9, .05, '#f2d030', 19.6, 0, 336.2); vp(.8, 1.6, sign(['NOW', 'RENTING', '★★★★'], '#c8202a', '#fff', 40, 128, 256), 19.6, 1, 336.24, 0);
  deco(1.2, 1.1, .4, '#8a8f96', 32.6, 0, 337.6); for(let i = 0; i < 12; i++) deco(.16, .1, .3, ['#c8202a', '#f2d030', '#2a8a3a', '#e88a2a'][i % 4], 32.15 + (i % 4) * .28, .2 + (i / 4 | 0) * .32, 337.5);
  { const gm = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), new THREE.MeshLambertMaterial({ color:0xf2a0a0, transparent:true, opacity:.7 })); gm.position.set(31.2, 1.25, 334.7); S.add(gm); deco(.28, 1, .28, '#c8202a', 31.2, 0, 334.7); }
  [[20, '#2a4a8a', 'SEQUEL II'], [23, '#8a2a2a', 'FAST CARS'], [26, '#2a6a3a', 'SWAMP GUY']].forEach(([x, c, t]) => fr([t, 'COMING SOON'], c, '#fff', 1.2, 1.7, x, 2.3, ZF + .12, 0));
  // laundry (34..49): carts, change machine, clock, bulletin board
  [[38, 345], [44, 340.5]].forEach(([x, z]) => { deco(.9, .5, .6, '#e8e8e8', x, .35, z); [[-.4, -.25], [.4, -.25], [-.4, .25], [.4, .25]].forEach(([a, b]) => deco(.04, .35, .04, '#999', x + a, 0, z + b)); deco(.7, .2, .5, ['#d8a0a0', '#a0b8d8'][x % 2 | 0], x, .6, z); });
  deco(.7, 1.6, .5, '#8a8f96', 35, 0, 349.4); fr(['CHANGE', '$1 → 4 QTRS'], '#f2d030', '#111', .6, .5, 35, 1.2, 349.12, Math.PI); fr(['LOST SOCK?', 'ROOM FOR RENT', 'GUITAR LESSONS', 'BAND NEEDS DRUMMER'], '#c8a26a', '#1a1a1a', 2, 1.4, 41, 2, ZB - .07, Math.PI); fan(41.5, 342);
  // tax service (184..200): water cooler, plants, certificates, wall clock
  deco(.4, 1, .4, '#e8e8e8', 185, 0, 349.2); deco(.3, .45, .3, '#9fd0f2', 185, 1, 349.2); plant(198.8, 335.4); plant(185.2, 335.4);
  [[188, 'CERTIFIED'], [190.2, 'SINCE 1987'], [192.4, 'BBB A+']].forEach(([x, t]) => fr([t], '#f4f1e6', '#2a5a2a', .9, .7, x, 2.2, ZB - .07, Math.PI));
  // china garden (200..216): booths, soda cooler, lucky cat, photo menu
  [[201.4, 346], [201.4, 348.4]].forEach(([x, z]) => { deco(1, .45, .5, '#8a2a22', x, 0, z - .8); deco(1, .5, .12, '#8a2a22', x, .45, z - 1.02); deco(1, .45, .5, '#8a2a22', x, 0, z + .8); deco(1, .5, .12, '#8a2a22', x, .45, z + 1.02); deco(1.1, .06, .9, '#3a2a1a', x + .1, .72, z); });
  G.colliders.push({ x0:200.8, x1:202, z0:344.8, z1:349.6, y0:0, y1:1 }); deco(.8, 1.9, .7, '#e8e8e8', 214.9, 0, 349.3); vp(.6, 1.4, new THREE.MeshLambertMaterial({ color:0xbfe3ff, emissive:0x2a4a5a, transparent:true, opacity:.6 }), 214.9, 1, 348.94, Math.PI);
  { const cat = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), M('#f2d030')); cat.position.set(209, 1.28, 346); cat.scale.y = 1.3; S.add(cat); deco(.05, .2, .05, '#f2d030', 209.14, 1.36, 346); }
  fr(['LUNCH SPECIAL', '11–3 · $4.95'], '#2a0a0a', '#ffd36a', 2.2, .8, 205, 2.4, ZF + .12, 0);
  // hair cuts (216..232): shampoo sink, product shelf, wall TV, price board, checker strip
  deco(.9, .9, .7, '#2a2a2a', 229.4, 0, 349.2); deco(.6, .2, .5, '#f4f4f0', 229.4, .9, 349.1); deco(1.6, .05, .25, '#8a6a44', 223, 1.4, ZB - .2); for(let i = 0; i < 7; i++) deco(.12, .26, .12, ['#2a8ad8', '#e8457a', '#3a8a3a', '#f2d030'][i % 4], 222.4 + i * .2, 1.45, ZB - .2);
  PR.crtTV(231.2, 2.2, 342, -Math.PI / 2, .8); fr(['HAIRCUT $12', 'BUZZ $8', 'FROSTED TIPS $20', 'KIDS $9'], '#f4f1e6', '#7a2a8a', 2, 1.3, 226, 2.2, ZB - .07, Math.PI);
  for(let i = 0; i < 16; i++){ const t = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), M(i % 2 ? '#1a1a1a' : '#f4f4f0')); t.rotation.x = -Math.PI / 2; t.position.set(216.5 + (i % 2) * .5, .045, 335 + i * .9 % 14); S.add(t); } }
export function plazaShops(){
  const groups = [[[2, 18, nailSpa, '#f3e3ea', '#ece6e0'], [18, 34, videoWorld, '#e8ecf4', '#d8d4cc'], [34, 49, laundry, '#eef2ec', '#dcd8cc']],
    [[184, 200, taxService, '#ece9e0', '#d8d4cc'], [200, 216, chinaGarden, '#f2e6d6', '#c8b49a'], [216, 232, hairCuts, '#f0eaf2', '#e4e0d8']]];
  shopExtras();
  for(const g of groups){ g.forEach(([a, b, fn, wall, fl]) => { const u = shell(a, b, wall, M(fl)); fn(u); }); partition(g[0][0]); g.forEach(([, b]) => partition(b)); }
}
