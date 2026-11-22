// Back in the 2000s: The Game — world: Belleville/Swansea 2003 slice + 1989 sets
import { THREE, G, box, plane, floor, ramp, cyl, mat, txMat, noise, label, mapRect, makeCar, makePerson } from './engine.js';
import * as PR from './props.js';
import * as BL from './buildings.js';
import * as CHR from './chrishouse.js';
import * as SC from './school.js';
import * as PZ from './plaza.js';
import * as ST from './store.js';
import { worldDetail } from './detail.js';
const S = G.scene;
// ---------- materials ----------
const M = {
  grass:txMat('grass', (g, w, h) => { noise(g, w, h, '#62993f', .2, 2600); for(let i = 0; i < 420; i++){ g.strokeStyle = ['rgba(40,90,30,.5)', 'rgba(140,190,90,.45)', 'rgba(90,150,60,.5)'][i % 3]; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.random() * 3 - 1.5, y - 3 - Math.random() * 4); g.stroke(); } }, [1, 1]),
  asphalt:txMat('asph', (g, w, h) => { noise(g, w, h, '#4b4d53', .2, 3400); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; for(let i = 0; i < 3; i++){ let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for(let k = 0; k < 6; k++){ x += Math.random() * 16 - 8; y += Math.random() * 16 - 4; g.lineTo(x, y); } g.stroke(); } }, [1, 1]),
  walk:txMat('walk', (g, w, h) => { noise(g, w, h, '#b9b6ad', .12); g.strokeStyle = '#8f8c84'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [1, 1]),
  wood:txMat('wood', (g, w, h) => { noise(g, w, h, '#a8743f', .15); g.strokeStyle = '#7a5028'; for(let y = 0; y < h; y += 16){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [1, 1]),
  carpet:txMat('carpet', (g, w, h) => noise(g, w, h, '#7d6a8a', .2, 3000), [1, 1]),
  tile:txMat('tile', (g, w, h) => { g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfcab9'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, [1, 1]),
  kitchen:txMat('ktile', (g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8352c'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, [1, 1]),
  brick:txMat('brick', (g, w, h) => { g.fillStyle = '#9c4a36'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9bfae';
    for(let y = 0; y < h; y += 16){ g.fillRect(0, y, w, 2); for(let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) g.fillRect(x, y, 2, 16); } }, [1, 1]),
  stucco:txMat('stucco', (g, w, h) => noise(g, w, h, '#d9d2c0', .1), [1, 1]),
  ceiling:txMat('ceil', (g, w, h) => { g.fillStyle = '#efeee8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9c7bd'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [1, 1]),
};
const siding = c => txMat('side' + c, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.14)'; for(let y = 0; y < h; y += 12) g.fillRect(0, y, w, 2); }, [2, 2]);
const roofM = c => txMat('roof' + c, (g, w, h) => { noise(g, w, h, c, .2); g.fillStyle = 'rgba(0,0,0,.2)'; for(let y = 0; y < h; y += 14) g.fillRect(0, y, w, 2); }, [3, 3]);
const rep = (m, x, y) => { const c = m.clone(); c.map = m.map.clone(); c.map.needsUpdate = true; c.map.repeat.set(x, y); return c; };
const glass = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.55, emissive:0x223344 });
G.M = M;

// ---------- ground + roads ----------
plane(1200, 1200, rep(M.grass, 160, 160), 200, 0, 200);
function road(x0, z0, x1, z1, name){ plane(x1 - x0, z1 - z0, rep(M.asphalt, (x1 - x0) / 6, (z1 - z0) / 6), (x0 + x1) / 2, .02, (z0 + z1) / 2); mapRect(x0, z0, x1, z1, '#5a5d63');
  const along = x1 - x0 > z1 - z0, dash = new THREE.MeshBasicMaterial({ color:0xf2d04a });
  if(along){ for(let x = x0 + 2; x < x1; x += 6) plane(3, .18, dash, x, .03, (z0 + z1) / 2); plane(x1 - x0, 2.4, rep(M.walk, (x1 - x0) / 3, 1), (x0 + x1) / 2, .06, z0 - 1.2); plane(x1 - x0, 2.4, rep(M.walk, (x1 - x0) / 3, 1), (x0 + x1) / 2, .06, z1 + 1.2); }
  else { for(let z = z0 + 2; z < z1; z += 6) plane(.18, 3, dash, (x0 + x1) / 2, .03, z); plane(2.4, z1 - z0, rep(M.walk, 1, (z1 - z0) / 3), x0 - 1.2, .06, (z0 + z1) / 2); plane(2.4, z1 - z0, rep(M.walk, 1, (z1 - z0) / 3), x1 + 1.2, .06, (z0 + z1) / 2); }
  if(name) G.roads.push({ x0, z0, x1, z1, name }); }
G.roads = [];
road(-190, 20, 150, 28, 'Oakmont Drive');         // Chris's street (not named in the story bible — game original)
road(96, 28, 104, 252, 'Maple Street');           // Maple Street (dog chase meet-up)
road(-190, 252, 230, 260, 'N Illinois Street');   // real: Schnucks Swansea is on N Illinois St (IL-159)
road(-112, 28, -104, 252, 'Westhaven Road');    // school road (not named in the story bible — game original)
[[96, 104, 17.6, 30.4], [96, 104, 249.6, 262.4], [-112, -104, 17.6, 30.4], [-112, -104, 249.6, 262.4]].forEach(([x0, x1, z0, z1]) => plane(x1 - x0, z1 - z0, rep(M.asphalt, 2, 3), (x0 + x1) / 2, .07, (z0 + z1) / 2));
[[100, 19], [100, 29], [-108, 19], [-108, 29], [100, 251], [100, 261]].forEach(([x, z]) => plane(8, 2.2, txMat('xw2', (g, w, h) => { g.fillStyle = '#3b3d42'; g.fillRect(0, 0, w, h); g.fillStyle = '#eee'; for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 8, h); }, [1, 1]), x, .075, z));
function streetSign(x, z, t, ry = 0){ cyl(.05, 3, mat('#777'), x, 0, z); const s = new THREE.Mesh(new THREE.BoxGeometry(1.8, .4, .05), new THREE.MeshBasicMaterial({ map:label(t, { bg:'#1d6b3a', fg:'#fff', size:52, w:512, h:110 }) }));
  s.position.set(x, 3, z); s.rotation.y = ry; S.add(s); }
streetSign(94.5, 30, 'MAPLE ST'); streetSign(105.5, 249.5, 'MAPLE ST'); streetSign(-102.5, 30, 'WESTHAVEN RD', Math.PI / 2); streetSign(-1.5, 18.5, 'OAKMONT DR'); streetSign(94.5, 262.5, 'N ILLINOIS ST'); streetSign(-102.5, 249.5, 'N ILLINOIS ST');
{ const lim = (x, z, ry, t) => { cyl(.05, 2.6, mat('#777'), x, 0, z); const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, .05), new THREE.MeshBasicMaterial({ map:label(t, { bg:'#1d6b3a', fg:'#fff', size:36, w:512, h:230 }) })); s.position.set(x, 2.6, z); s.rotation.y = ry; S.add(s); };
  lim(93.5, 205, Math.PI / 2, ['VILLAGE OF', 'SWANSEA', 'POP. 10,579']); lim(106.5, 75, -Math.PI / 2, ['CITY OF', 'BELLEVILLE', 'EST. 1814']); }

// ---------- trees / props ----------
const leafM = [mat('#3f7a2e'), mat('#4d8a34'), mat('#5c7f2a'), mat('#b5651d'), mat('#c98a2a')];
export function tree(x, z, s = 1, fall){ cyl(.22 * s, 2.6 * s, mat('#5a3d22'), x, 0, z, 7);
  const l = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s, 0), leafM[fall ? 3 + (Math.random() * 2 | 0) : Math.random() * 3 | 0]); l.position.set(x, 3.4 * s, z); l.castShadow = true; S.add(l);
  [[.95, .75, .35, .62], [-.85, .45, -.55, .56], [.1, 1.25, -.2, .5]].forEach(([dx, dy, dz, sc]) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s * sc, 0), l.material); b.position.set(x + dx * s, 3.4 * s + dy * s, z + dz * s); b.rotation.y = dx * 3; b.castShadow = true; S.add(b); });
  G.colliders.push({ x0:x - .3, x1:x + .3, z0:z - .3, z1:z + .3, y0:0, y1:3 }); }
function bush(x, z){ const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.8, 0), leafM[1]); b.position.set(x, .5, z); b.scale.y = .7; b.castShadow = true; S.add(b); }
function fence(x0, z0, x1, z1){ const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0); const fm = mat('#e8e2d0');
  box(x1 === x0 ? .12 : len, 1.3, x1 === x0 ? len : .12, fm, (x0 + x1) / 2, 0, (z0 + z1) / 2); }
function lamp(x, z){ cyl(.08, 5, mat('#4a4a4a'), x, 0, z, 6); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .9), new THREE.MeshBasicMaterial({ color:0xffe9a8 })); b.position.set(x, 5.05, z); S.add(b); }
for(let x = -180; x < 150; x += 26){ lamp(x, 17.6); }

// ---------- houses ----------
const houseCols = ['#d9d4c3', '#b7c8d6', '#e2cfa3', '#c7d3b4', '#d6b8a8', '#9fb2c4', '#ece6da'];
function house(x, z, face, col, o = {}){ // closed exterior house; face: 1 = door faces +z (south), -1 = faces -z
  const w = o.w || 11, d = o.d || 9, h = o.h || 5.4, sm = siding(col), rm = roofM(o.roof || '#5b4a44');
  box(w, h, d, sm, x, 0, z);
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(w + .8, .3, d / 2 + 1.2), rm); r1.position.set(x, h + 1.2, z - d / 4 - .1); r1.rotation.x = -.5; r1.castShadow = true;
  const r2 = r1.clone(); r2.position.z = z + d / 4 + .1; r2.rotation.x = .5; S.add(r1, r2);
  const gab = new THREE.Mesh(new THREE.CylinderGeometry(0, d / 2 + .1, 2.4, 3, 1), sm); gab.rotation.set(Math.PI / 2, 0, 0); gab.scale.set(1, 1, .0001);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, .1), mat(o.door || '#6b2a22')); door.position.set(x, 1.1, z + face * (d / 2 + .05)); S.add(door);
  [-1, 1].forEach(sd => { const wi = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, .1), glass); wi.position.set(x + sd * 3, 1.7, z + face * (d / 2 + .05)); S.add(wi);
    const w2 = wi.clone(); w2.position.y = 4; S.add(w2); });
  box(1.4, .3, 1.6, M.walk.clone ? mat('#b9b6ad') : mat('#bbb'), x, 0, z + face * (d / 2 + .8), { col:false });
  if(o.garage){ box(5, 3, 6, sm, x + face * (w / 2 + 2.5), 0, z); const gd = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, .1), mat('#eee')); gd.position.set(x + face * (w / 2 + 2.5), 1.2, z + face * 3.05); S.add(gd); }
  mapRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, '#b8a99a');
  bush(x - w / 2 + 1, z + face * (d / 2 + 1)); bush(x + w / 2 - 1, z + face * (d / 2 + 1)); }
// north side of Elm (doors face +z), south side (doors face -z)
const north = [-170, -150, -130, -80, -60, -40, 25, 45, 65, 120, 140], south = [-170, -150, -130, -60, -40, -20, 0, 20, 40, 60, 80, 120, 140];
north.forEach((x, i) => BL.house(x, 6, 's', i * 7 + 3, { curb:14 }));
south.forEach((x, i) => BL.house(x, 42, 'n', i * 5 + 11, { curb:14 }));
[-30, -15, 30, 55, 85, 130, -115, -95, -165, -142].forEach((x, i) => { tree(x, 34 + (i % 2) * 2, 1, true); tree(x + 6, 14 - (i % 2) * 2, 1.1); });
for(let z = 54, k = 0; z < 245; z += 15, k++){ const sd = [1, 2, 4, 5]; BL.house(83, z + 4, 'e', sd[k % 4] + 6 * k, { curb:13 }); BL.house(117, z, 'w', sd[(k + 2) % 4] + 6 * (k + 3), { curb:13 }); }
// fill along Maple: rotate doors toward road is cosmetic; keep simple

// ---------- Chris's house (enterable, 2 floors) ----------
const CH = { x:0, z:-4 }; G.CH = CH; CHR.buildChrisHouse();

// ---------- Elmwood Park (tutorial landmark) ----------
const PK = { x:-80, z:70 }; G.PK = PK;
plane(44, 34, rep(M.grass, 8, 6), -80, .03, 70); mapRect(-102, 53, -58, 87, '#4f8a3c');
{ const wood = mat('#8a5a32'), wh = mat('#f3efe4'); cyl(4.2, .4, mat('#cfc6ad'), -80, 0, 70, 8); G.platforms.push({ x0:-84, z0:66, x1:-76, z1:74, y:.4 });
  for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; cyl(.15, 3, wh, -80 + Math.cos(a) * 3.8, .4, 70 + Math.sin(a) * 3.8, 6); }
  const rf = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 8), mat('#3e6e8e')); rf.position.set(-80, 4.5, 70); rf.castShadow = true; S.add(rf);
  const sg = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, .2), new THREE.MeshBasicMaterial({ map:label(['ELMWOOD PARK', 'BELLEVILLE, IL'], { bg:'#2f5a2a', fg:'#f3e9c6', size:44, w:512, h:150 }) }));
  sg.position.set(-70, 1.2, 55); S.add(sg); box(.2, .7, .2, wood, -71.8, 0, 55, { col:false }); box(.2, .7, .2, wood, -68.2, 0, 55, { col:false });
  [[-92, 60], [-68, 80], [-95, 82], [-62, 60]].forEach(([x, z]) => tree(x, z, 1.3, true));
  box(2.2, .5, .6, wood, -86, 0, 61); box(2.2, .5, .6, wood, -74, 0, 61);
  const sl = mat('#d33'); box(.2, 2.4, .2, sl, -96, 0, 68); box(.2, 2.4, .2, sl, -96, 0, 72); box(.15, .15, 4, sl, -96, 2.4, 70, { col:false }); }

// ---------- Jax's spot ----------
G.JX = { x:-40, z:33 };

SC.buildSchool(); // Belleville West High School (school.js)

// ---------- Schnucks Swansea ----------
export const SCH = { x0:50, x1:170, z0:330, z1:402, mz:3.6 }; G.SCH = SCH;
// expanded lot: spans the whole plaza frontage (x -6..246) with painted stall rows
plane(252, 70, rep(M.asphalt, 44, 12), 120, .025, 295); mapRect(-6, 262, 246, 330, '#4c4f55');
{ const ln = new THREE.MeshBasicMaterial({ color:0xe8e8e0 }); for(const [z0, z1] of [[271, 281], [297, 307], [313, 323]]) for(let x = -4; x <= 244; x += 2.8){ if(Math.abs(x - 105) < 7) continue; plane(.12, z1 - z0, ln, x, .04, (z0 + z1) / 2); } }
{ const lineM = new THREE.MeshBasicMaterial({ color:0xeeeeee });
  for(let x = 44; x < 200; x += 3.2){ plane(.12, 5, lineM, x, .04, 274); plane(.12, 5, lineM, x, .04, 323); plane(.12, 5, lineM, x, .04, 296); plane(.12, 5, lineM, x, .04, 306); }
  plane(12, 6, txMat('xw', (g, w, h) => { g.fillStyle = '#3b3d42'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0f0f0'; for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 8, h); }, [1, 1]), 105, .045, 327); }
{ const { x0, x1, z0, z1, mz } = SCH, H = 8, wm = BL.brickM('#8a3626', '#bfae98', [24, 2], 'w'), wi = mat('#f4f2ec');
  // front wall with entrance gap x 99..111, staff side door on east wall z 356..359, rear door north wall x 150..154, emergency exit west wall z 392..394
  box(49, H, .5, wm, 74.5, 0, z0); box(59, H, .5, wm, 140.5, 0, z0); box(12, 3.6, .5, wm, 105, 4.4, z0);
  box(.5, H, 26, wm, x1, 0, 343); box(.5, H, 43, wm, x1, 0, 380.5); box(.5, 4.4, 3, wm, x1, 3.6, 357.5);
  box(100, H, .5, wm, 100, 0, z1); box(16, H, .5, wm, 162, 0, z1); box(4, 4.4, .5, wm, 152, 3.6, z1);
  box(.5, H, 62, wm, x0, 0, 361); box(.5, H, 8, wm, x0, 0, 398); box(.5, 5.6, 2, wm, x0, 2.4, 393);
  box(x1 - x0, .4, z1 - z0, mat('#8a8a8a'), 110, H, 366, { col:false });
  plane(x1 - x0, z1 - z0, rep(M.tile, 60, 36), 110, .02, 366); floor(x0, z0, x1, z1, 0);
  plane(x1 - x0, z1 - z0, rep(M.ceiling, 30, 18), 110, H - .05, 366).rotation.x = Math.PI / 2;
  // ceiling lights
  for(let x = 62; x < 166; x += 12) for(let z = 340; z < 400; z += 10){ const l = new THREE.Mesh(new THREE.BoxGeometry(3, .1, .8), new THREE.MeshBasicMaterial({ color:0xfffbea })); l.position.set(x, H - .15, z); S.add(l); }
  const pl = new THREE.PointLight(0xfff6e0, 60, 80, 1.6); pl.position.set(110, 7, 360); S.add(pl); pl.distance = 110; // one light for the whole store (each point light costs every pixel on screen)
  // cart bay (inside, right of entrance)
  plane(12, 7, mat('#bdb9aa'), 112, .03, 334.5); box(.3, 1, 7, mat('#c8102e'), 106, 0, 334.5, { col:false });
  const cb = new THREE.Mesh(new THREE.BoxGeometry(5, .8, .1), new THREE.MeshBasicMaterial({ map:label('CART RETURN', { bg:'#c8102e', fg:'#fff', size:60 }) })); cb.position.set(113, 3, 330.4); cb.rotation.y = Math.PI; S.add(cb);
  G.cartBay = { x:113, z:335 };
  // checklanes
  G.lanes = []; for(let i = 0; i < 6; i++){ const x = 62 + i * 5; box(.9, 1, 5, mat('#4a4a52'), x, 0, 344); box(.6, 1.3, .6, mat('#2a2a2a'), x, 1, 342.6, { col:false });
    const n = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, .1), new THREE.MeshBasicMaterial({ map:label(String(i + 1), { bg:'#c8102e', fg:'#fff', size:90, w:128, h:128 }) })); n.position.set(x, 3, 344); S.add(n); G.lanes.push({ x:x + 1.4, z:344 }); }
  box(6, 1.1, 2, mat('#5a5a66'), 94, 0, 337.5); box(6, .1, 2.2, mat('#d8d0c0'), 94, 1.1, 337.5, { col:false }); const cs = new THREE.Mesh(new THREE.BoxGeometry(6, .9, .1), new THREE.MeshBasicMaterial({ map:label('CUSTOMER SERVICE', { bg:'#1b3a6a', fg:'#fff', size:44 }) })); cs.position.set(94, 3.2, 338.7); S.add(cs); G.custService = { x:94, z:340.6 };
  // produce
  const prod = ['#d4212a', '#f2c230', '#5aa832', '#ff8c1a', '#7a3a8a'];
  for(let i = 0; i < 5; i++){ box(3, .9, 5, mat('#6a4a2a'), 54, 0, 338 + i * 5.5); const top = box(2.8, .3, 4.8, mat(prod[i]), 54, .9, 338 + i * 5.5, { col:false }); }
  const ps = new THREE.Mesh(new THREE.BoxGeometry(6, 1, .1), new THREE.MeshBasicMaterial({ map:label('PRODUCE', { bg:'#2f7a2a', fg:'#fff', size:70 }) })); ps.position.set(57, 4.5, 336); ps.rotation.y = Math.PI / 2; S.add(ps); G.produce = { x:58, z:348 };
  // aisles
  const shelfCols = ['#e8463a', '#f4c430', '#4a8ad8', '#5ab04a', '#e88a2a', '#9a5ad8', '#d8d8d8'];
  for(let i = 0; i < 9; i++){ const x = 70 + i * 8; PR.gondola(x, 366, 22); G.colliders.push({ x0:x - .8, x1:x + .8, z0:355, z1:377, y0:0, y1:2.3 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(2.4, .9, .1), new THREE.MeshBasicMaterial({ map:label(String(i + 1), { bg:'#1b3a6a', fg:'#fff', size:90, w:256, h:128 }) })); a.position.set(x, 4.2, 354.5); S.add(a); }
  // back room (z 388..402) separated by wall at z=388 with doors x 118..124 and 140..146
  box(68, H, .4, wi, 84, 0, 388); box(16, H, .4, wi, 132, 0, 388); box(24, H, .4, wi, 158, 0, 388); box(6, 3.6, .4, wi, 121, 4.4, 388); box(6, 3.6, .4, wi, 143, 4.4, 388);
  [[70, 395], [90, 396], [110, 395], [130, 396]].forEach(([x, z]) => { box(4, 2.6, 3, mat('#b8935a'), x, 0, z); box(3, 1.4, 2, mat('#a8834a'), x, 2.6, z, { col:false }); });
  G.camerasBack = [];
  [[60, 390], [100, 390], [140, 390], [160, 400], [75, 400]].forEach(([x, z]) => { const c = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .7), mat('#ddd')); const led = new THREE.Mesh(new THREE.SphereGeometry(.07), new THREE.MeshBasicMaterial({ color:0xff0000 }));
    led.position.set(0, 0, .36); c.add(b, led); c.position.set(x, 6.6, z); c.rotation.x = .5; S.add(c); G.camerasBack.push(led); });
  // rear door + dock
  const rd = box(4, 3.6, .3, mat('#6a7a8a'), 152, 0, z1, { }); G.rearDoor = rd; // double steel doors with push bars (children slide with it)
  [[-1, 0], [1, 0]].forEach(([s]) => { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, .08, .08), mat('#c9c9c9')); bar.position.set(s * 1, -.8, -.2); rd.add(bar); }); { const seam = new THREE.Mesh(new THREE.BoxGeometry(.04, 3.5, .32), mat('#3a4048')); rd.add(seam); }
  floor(140, 402, 166, 414, .5, mat('#9a9a92'), { slab:mat('#8a8a82') }); ramp(132, 402, 140, 414, 'x', 0, .5); G.dock = { x:152, z:408 };
  PR.dumpster(161, 409.5, 0); PR.dumpster(161, 413, 0); G.colliders.push({ x0:159.3, x1:162.7, z0:408.4, z1:414, y0:0, y1:1.8 }); G.hide = { x:161, z:416.5 };
  const truck = makeCar('#e8e8e8', { suv:true }); truck.scale.set(1.4, 1.5, 2); truck.position.set(178, 0, 410); S.add(truck);
  // emergency exit (west wall, z 392..394)
  const ex = box(.3, 2.4, 2, mat('#c83a2a'), x0, 0, 393); G.exitDoor = ex;
  const es = new THREE.Mesh(new THREE.BoxGeometry(.1, .5, 1.6), new THREE.MeshBasicMaterial({ map:label('EMERGENCY EXIT · ALARM WILL SOUND', { bg:'#c8102e', fg:'#fff', size:34 }) })); es.position.set(x0 + .3, 2.9, 393); es.rotation.y = Math.PI / 2; S.add(es);
  // pharmacy (back-left) under mezzanine
  box(12, 1.1, 1.2, mat('#2a5a8a'), 58, 0, 383); const pm = new THREE.Mesh(new THREE.BoxGeometry(10, 1, .1), new THREE.MeshBasicMaterial({ map:label('PHARMACY', { bg:'#2a5a8a', fg:'#fff', size:64 }) })); pm.position.set(58, 2.9, 382.3); S.add(pm);
  // mezzanine above pharmacy (y = mz) x 50..82, z 366..388 ; stairs x 82..85 from z 350 (floor) to z 366 (mezz)
  floor(50, 366, 83.5, 388, mz, mat('#9a9a92'), { slab:mat('#c9c5b8') }); ramp(80.5, 350, 83.5, 366, 'z', 0, mz);
  for(let i = 0; i < 14; i++) box(3, .26, 1.15, mat('#8a8a8a'), 82, i * .257, 350.6 + i * 1.14, { col:false });
  box(.12, 1.1, 16, mat('#555'), 80.4, 0, 358, { col:false }); box(.12, 1.1, 16, mat('#555'), 83.6, 0, 358, { col:false });
  box(30.4, 1.1, .12, mat('#555'), 65.2, mz, 366.1); box(.12, 1.1, 22, mat('#555'), 83.6, mz, 377);
  for(let i = 0; i < 10; i++){ box(1, 2.4, .6, mat(i % 2 ? '#5a7a9a' : '#4a6a8a'), 52 + i * 1.05 + (i > 4 ? 0 : 0), mz, 387.4, { col:false }); }
  G.locker = { x:56, z:386, y:mz };
  box(.2, 3, 10, wi, 66, mz, 382.5); // break room divider
  box(3, .8, 1.6, mat('#7a6a5a'), 74, mz, 378); box(1, 1.6, .8, mat('#c8102e'), 81, mz, 384); // table, vending
  const btv = box(1.4, 1, .6, mat('#222'), 79, mz + 1.4, 387.4, { col:false }); const bscr = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .8), new THREE.MeshBasicMaterial({ color:0x2a6a3a })); bscr.position.set(79, mz + 1.9, 387.05); bscr.rotation.y = Math.PI; S.add(bscr); G.breakTV = bscr;
  G.breakRoom = { x:76, z:376, y:mz }; G.vending = { x:80, z:382, y:mz };
  // staff corridor (east): time clock, vests, Eric's office x 150..170 z 366..388, restroom x 150..160 z 342..354
  box(.3, H, 14, wi, 150, 0, 377); box(8, H, .3, wi, 154, 0, 366); box(8, H, .3, wi, 166, 0, 366);
  box(2.5, .8, 1.2, mat('#5a3a2a'), 160, 0, 380); box(.6, 1.2, .6, mat('#333'), 160, 0, 382.4, { col:false }); G.office = { chair:{ x:160, z:377.6 }, eric:{ x:160, z:382 }, door:{ x:160, z:364 } };
  const off = new THREE.Mesh(new THREE.BoxGeometry(3, .6, .1), new THREE.MeshBasicMaterial({ map:label('MANAGER', { bg:'#333', fg:'#fff', size:60 }) })); off.position.set(154, 3, 365.8); S.add(off);
  box(.6, 1.2, .3, mat('#cfcfcf'), 169.6, 1, 362, { col:false }); G.timeClock = { x:168, z:362 }; box(.1, 1, 2, mat('#ff8c1a'), 169.7, 1.2, 365, { col:false }); G.vests = { x:168, z:365 };
  box(.3, H, 12, wi, 150, 0, 348); box(10, H, .3, wi, 160, 0, 354); box(5, H, .3, wi, 152.5, 0, 342); box(.3, H, .1, wi, 150, 0, 342);
  box(.8, .9, .8, mat('#9aa'), 166, 0, 344); box(1.2, .8, .5, mat('#fff'), 158, 0, 352.6); G.restroom = { x:160, z:347, can:{ x:166, z:344 } };
  const rr = new THREE.Mesh(new THREE.BoxGeometry(2.4, .6, .1), new THREE.MeshBasicMaterial({ map:label('RESTROOM', { bg:'#2a5a8a', fg:'#fff', size:56 }) })); rr.position.set(153, 3, 342.2); rr.rotation.y = Math.PI; S.add(rr);
  mapRect(x0, z0, x1, z1, '#d8d4c8'); mapRect(140, 402, 166, 414, '#a8a8a0');
  BL.schnucksExterior(SCH); BL.schnucksInterior(SCH); ST.storeDetail(SCH); PZ.plazaShops();
  G.storeEntrance = { x:105, z:328 }; G.staffDoor = { x:172, z:357.5 }; G.backDoorOutside = { x:152, z:405 }; }
// 14 numbered cart corrals (C01–C14)
G.corrals = [];
for(let r = 0; r < 2; r++) for(let i = 0; i < 7; i++){ const x = 56 + i * 20, z = r ? 312 : 290, n = r * 7 + i + 1, rail = mat('#a8aab0');
  box(.1, 1, 6, rail, x - 1.1, 0, z); box(.1, 1, 6, rail, x + 1.1, 0, z); box(2.3, .1, .1, rail, x, 1, z - 3, { col:false });
  const sg = new THREE.Mesh(new THREE.BoxGeometry(1.4, .9, .05), new THREE.MeshBasicMaterial({ map:label('C' + String(n).padStart(2, '0'), { bg:'#c8102e', fg:'#fff', size:84, w:256, h:160 }) }));
  sg.position.set(x, 2, z - 3.1); S.add(sg); cyl(.04, 2, rail, x, 0, z - 3.1, 6);
  G.corrals.push({ n, x, z, carts:[] }); }
// parked cars
const pc = ['#a33', '#335', '#ddd', '#2a6a3a', '#888', '#d8b84a', '#222', '#6a2a6a'];
for(let i = 0; i < 46; i++){ const x = -2.6 + ((i * 7) % 88) * 2.8 + 1.4, z = [276, 302, 318][i % 3]; if(Math.abs(x - 105) < 7) continue; if([[44, 280], [44, 304], [196, 280], [196, 304], [120, 280], [120, 304], [82, 304], [158, 280], [150, 302], [60, 316], [93, 316], [126, 316], [159, 316], [60, 288], [93, 288], [126, 288], [159, 288]].some(([px, pz]) => Math.abs(px - x) < 3 && Math.abs(pz - z) < 5)) continue; if(G.corrals.some(c => Math.abs(c.x - x) < 3.5 && Math.abs(c.z - z) < 6)) continue;
  const c = makeCar(pc[i % 8], { suv:i % 4 === 0 }); c.position.set(x, 0, z); S.add(c); G.colliders.push({ x0:x - 1, x1:x + 1, z0:z - 2.3, z1:z + 2.3, y0:0, y1:1.6 }); }
G.parkDoris = { x:150, z:302 };
[40, 60, 180, 200].forEach(x => tree(x, 266, 1.1));

// ---------- 1989 sets (far east, x ≈ 1000) ----------
export const Y89 = { campus:{ x:1000, z:0 }, dorm:{ x:1040, z:0 }, apt:{ x:1070, z:0 }, stadium:{ x:1120, z:0 } }; G.Y89 = Y89;
{ const cx = 1000, bm = rep(M.brick, 6, 2);
  plane(70, 70, rep(M.grass, 10, 10), cx, .03, 0); plane(6, 70, rep(M.walk, 2, 20), cx, .05, 0);
  [[-14, -18], [14, -18], [-14, 14], [14, 14]].forEach(([dx, dz]) => { box(14, 9, 12, bm, cx + dx, 0, dz); for(let k = -2; k <= 2; k++){ const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, .1), glass); w.position.set(cx + dx + k * 2.6, 5, dz + (dz > 0 ? -6.06 : 6.06)); S.add(w); } });
  const bt = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), bm); bt.position.set(cx, 8, -30); S.add(bt);
  const sg = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, .2), new THREE.MeshBasicMaterial({ map:label('NORTH CAROLINA STATE UNIVERSITY', { bg:'#cc0000', fg:'#fff', size:40, w:1024, h:118 }) })); sg.position.set(cx + 7, 1.6, 26); S.add(sg);
  [[-6, -6], [6, 4], [-6, 22], [6, -26]].forEach(([dx, dz]) => tree(cx + dx, dz, 1.2));
  // dorm room / University Towers apartment (simple rooms)
  const room = (x, col, name) => { box(10, 3.2, .3, mat(col), x, 0, -5); box(10, 3.2, .3, mat(col), x, 0, 5); box(.3, 3.2, 10, mat(col), x - 5, 0, 0); box(.3, 3.2, 10, mat(col), x + 5, 0, 0);
    plane(10, 10, rep(M.carpet, 4, 4), x, .02, 0); box(10, .2, 10, mat('#eee'), x, 3.2, 0, { col:false }); floor(x - 5, -5, x + 5, 5, 0);
    const n = new THREE.Mesh(new THREE.BoxGeometry(4, .6, .1), new THREE.MeshBasicMaterial({ map:label(name, { bg:'#222', fg:'#ffd23f', size:46 }) })); n.position.set(x, 2.6, -4.8); S.add(n); };
  room(1040, '#d8c8a0', 'DORM'); box(1.2, .6, 2.2, mat('#7a2a2a'), 1043, 0, 2); box(1.2, .6, 2.2, mat('#2a3a7a'), 1037, 0, 2); const pep = makeCar; // beds
  room(1070, '#c8d0b8', 'UNIVERSITY TOWERS'); box(2.6, .8, 1, mat('#5a4a3a'), 1070, 0, 3.4); box(.3, .45, .15, mat('#c8b890'), 1074.6, 1.3, -2, { col:false }); G.aptPhone = { x:1073.5, z:-2 };
  box(2.2, .5, 1, mat('#6a6a8a'), 1066, 0, -3); // couch
  // stadium
  const sx = 1120; plane(60, 34, rep(M.grass, 10, 6), sx, .03, 0);
  for(let y = 0; y < 6; y++) box(70, .5, 1.2, mat(y % 2 ? '#bcbcbc' : '#a8a8a8'), sx, y * .5, 19 + y * 1.2, { col:y === 0 });
  floor(sx - 35, 18.4, sx + 35, 26, 2.5); ramp(sx - 35, 12, sx - 30, 18.4, 'z', 0, 2.5);
  for(let x = -24; x <= 24; x += 8){ plane(.3, 30, new THREE.MeshBasicMaterial({ color:0xffffff }), sx + x, .05, 0); }
  const sb = new THREE.Mesh(new THREE.BoxGeometry(14, 4, .4), new THREE.MeshBasicMaterial({ map:label(['NC STATE  vs  UNC', 'HOME 14   VISITORS 10'], { bg:'#111', fg:'#ffd23f', size:50, w:1024, h:300 }) })); sb.position.set(sx, 8, -20); S.add(sb);
  const crowdC = ['#cc0000', '#ffffff', '#7bafd4', '#cc0000', '#222'];
  G.crowd = []; for(let i = 0; i < 46; i++){ const p = makePerson({ shirt:crowdC[i % 5], pants:'#334', hair:['#3a2414', '#c9a15a', '#111'][i % 3], scale:.95 }); const row = i % 5, x = sx - 30 + (i * 7.7) % 60;
    p.position.set(x, row * .5 + .5, 19.6 + row * 1.2); p.rotation.y = Math.PI; S.add(p); G.crowd.push(p); }
  G.stadium = { jacob:{ x:sx + 2, z:21 }, guy:{ x:sx + 4, z:21 }, lilly:{ x:sx, z:21 }, gate:{ x:sx - 32, z:13 } }; }
// interior lights for Chris's house and the school classroom
[[0, 2.6, -6], [3, 5.8, -7]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xffe8c8, 18, 16, 1.4); l.position.set(x, y, z); S.add(l); });
worldDetail(); // curbs, poles, yard + park + plaza + store detail (detail.js)
