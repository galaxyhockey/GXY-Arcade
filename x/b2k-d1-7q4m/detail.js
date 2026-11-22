// Back in the 2000s: The Game — world detail pass (Draft 1.5): curbs, stop lines + stop signs, utility poles and wires, hydrants,
// kerbside bins, side-yard fences and lawn clutter, a real park (path, playground, court, picnic tables), plaza frontage
// (walkways, benches, payphone, newspaper boxes, soda + ice machines, bollards, bike rack, accessible stalls, lot arrows),
// school buses + bike racks, and the store's aisle category signs, end caps and frozen-food doors.
// Everything here is static, so it is merged per map cell at start-up and costs almost nothing per frame.
import { THREE, G, box, cyl, plane, mat, label, lampGlow } from './engine.js';
const S = G.scene, M = mat;
const D = (w, h, d, c, x, y, z) => box(w, h, d, typeof c === 'string' ? M(c) : c, x, y, z, { col:false });
const col = (x0, z0, x1, z1, y1 = 2) => G.colliders.push({ x0, x1, z0, z1, y0:0, y1 });
const sign = (t, o) => new THREE.MeshBasicMaterial({ map:label(t, o) });
function vp(w, h, m, x, y, z, ry = 0){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; S.add(p); return p; }
const flat = (w, d, c, x, z, y = .045) => plane(w, d, typeof c === 'string' ? M(c) : c, x, y, z);
const rnd = (() => { let s = 20031; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

export function worldDetail(){
  const conc = '#c4c0b6', white = new THREE.MeshBasicMaterial({ color:0xe8e8e0 }), yellow = new THREE.MeshBasicMaterial({ color:0xe8c832 });
  // ---------- curbs along every road (broken at the intersections) ----------
  const curbX = (x0, x1, z) => D(x1 - x0, .13, .22, conc, (x0 + x1) / 2, 0, z), curbZ = (z0, z1, x) => D(.22, .13, z1 - z0, conc, x, 0, (z0 + z1) / 2);
  [[20, 28], [252, 260]].forEach(([a, b], r) => [[-190, -112.2], [-103.8, 95.8], [104.2, r ? 230 : 150]].forEach(([x0, x1]) => { curbX(x0, x1, a - .11); curbX(x0, x1, b + .11); }));
  [[96, 104], [-112, -104]].forEach(([a, b]) => { curbZ(28.2, 251.8, a - .11); curbZ(28.2, 251.8, b + .11); });
  // stop lines + stop signs at the four corners
  const stop = (x, z, ry) => { cyl(.05, 2.4, M('#888'), x, 0, z, 6); const o = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .04, 8), sign('STOP', { bg:'#c8102e', fg:'#fff', size:42, w:128, h:128 })); o.rotation.set(Math.PI / 2, 0, Math.PI / 8); o.rotation.order = 'YXZ'; o.rotation.y = ry; o.position.set(x, 2.5, z); S.add(o); col(x - .1, z - .1, x + .1, z + .1, 2.6); };
  [[100, 24], [100, 256], [-108, 24], [-108, 256]].forEach(([cx, cz]) => { const n = cz < 100;
    flat(3.6, .4, white, cx + 2, n ? cz + 6.4 : cz - 6.4); stop(cx + 5.4, n ? cz + 6.6 : cz - 6.6, n ? 0 : Math.PI);          // traffic on Maple / Westhaven arriving at the cross street
    flat(.4, 3.6, white, cx - 6.4, cz + 2); flat(.4, 3.6, white, cx + 6.4, cz - 2); });
  // double yellow centre line on the two main roads
  [[-188, -113], [-103, 95], [105, 228]].forEach(([a, b]) => { flat(b - a, .1, yellow, (a + b) / 2, 255.78, .034); flat(b - a, .1, yellow, (a + b) / 2, 256.22, .034); });
  // ---------- utility poles + wires, hydrants, storm drains ----------
  const pole = (x, z, along) => { cyl(.13, 8.6, M('#5a4632'), x, 0, z, 7); D(along === 'x' ? .12 : 1.9, .12, along === 'x' ? 1.9 : .12, '#5a4632', x, 7.7, z); D(.3, .5, .3, '#8a8f96', x + (along === 'x' ? 0 : .5), 6.6, z + (along === 'x' ? .5 : 0)); col(x - .16, z - .16, x + .16, z + .16, 8); };
  const wire = M('#1a1a1a'); const px = []; for(let x = -172; x <= 140; x += 39) if(Math.abs(x + 108) > 8 && Math.abs(x - 100) > 8) px.push(x);
  px.forEach((x, i) => { pole(x, 31.5, 'x'); if(i) [-.8, .8].forEach(dz => D(x - px[i - 1], .03, .03, wire, (x + px[i - 1]) / 2, 7.72, 31.5 + dz)); });
  const pz = []; for(let z = 48; z <= 244; z += 39) pz.push(z); pz.forEach((z, i) => { pole(107.3, z, 'z'); if(i) [-.8, .8].forEach(dx => D(.03, .03, z - pz[i - 1], wire, 107.3 + dx, 7.72, (z + pz[i - 1]) / 2)); });
  [[-64, 18.6], [58, 18.6], [94.6, 140], [-102.6, 96], [36, 261.4], [150, 261.4]].forEach(([x, z]) => { cyl(.14, .55, M('#c8202a'), x, 0, z, 8); cyl(.09, .16, M('#c8202a'), x, .55, z, 8, .04); D(.44, .1, .1, '#c8202a', x, .36, z); col(x - .16, z - .16, x + .16, z + .16, .8); });
  [[-140, 20.5], [-20, 27.5], [70, 20.5], [96.5, 90], [103.5, 190], [10, 252.5], [140, 259.5]].forEach(([x, z]) => flat(.9, .5, '#1c1c1e', x, z, .05));
  [[-30, 24], [60, 24], [100, 120], [100, 210], [-60, 256], [160, 256]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.CircleGeometry(.42, 12), M('#33353a')); m.rotation.x = -Math.PI / 2; m.position.set(x, .04, z); S.add(m); });
  // extra street lamps on Maple + N Illinois
  const lamp = (x, z) => { cyl(.08, 5, M('#4a4a4a'), x, 0, z, 6); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .9), G.lampM); b.position.set(x, 5.05, z); S.add(b); lampGlow(x, z, 8); };
  for(let z = 66; z < 240; z += 44) lamp(93.4, z); for(let x = -170; x < 220; x += 46) if(Math.abs(x - 100) > 8 && Math.abs(x + 108) > 8) lamp(x, 262.6);
  // ---------- yards on Oakmont: kerbside bins, side fences, lawn clutter ----------
  const NORTH = [-170, -150, -130, -80, -60, -40, 25, 45, 65, 120, 140], SOUTH = [-170, -150, -130, -60, -40, -20, 20, 40, 60, 80, 120, 140];
  const bin = (x, z, c) => { D(.5, .85, .55, c, x, 0, z); D(.54, .06, .6, '#222', x, .85, z); };
  const clutter = (x, z, k) => { const m = k % 7;
    if(m === 0){ [[-.25, '#f06aa0'], [.25, '#f48ab8']].forEach(([dx, c]) => { D(.03, .5, .03, '#222', x + dx, 0, z); D(.2, .16, .08, c, x + dx, .5, z); }); }                          // flamingos
    else if(m === 1){ cyl(.16, .7, M('#b8b4aa'), x, 0, z, 8); cyl(.42, .08, M('#b8b4aa'), x, .7, z, 10); }                                                                          // bird bath
    else if(m === 2){ for(let i = 0; i < 9; i++){ const f = new THREE.Mesh(new THREE.SphereGeometry(.11, 5, 4), M(['#e8457a', '#f2d030', '#f4f4f4', '#a85ad8'][i % 4])); f.position.set(x - .8 + (i % 3) * .8, .2, z - .3 + (i / 3 | 0) * .3); S.add(f); } D(2.2, .08, 1, '#4a3322', x, 0, z); } // flower bed
    else if(m === 3){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .28, 14), M('#3a8ad8')); p.position.set(x, .14, z); S.add(p); const w = new THREE.Mesh(new THREE.CircleGeometry(.8, 14), M('#9fd8f2')); w.rotation.x = -Math.PI / 2; w.position.set(x, .29, z); S.add(w); } // kiddie pool
    else if(m === 4){ [[-.5, 0], [.5, .3]].forEach(([dx, r]) => { D(.5, .05, .5, '#e8e8e8', x + dx, .4, z); D(.5, .5, .05, '#e8e8e8', x + dx, .4, z - .25); [[-.22, -.22], [.22, -.22], [-.22, .22], [.22, .22]].forEach(([a, b]) => D(.04, .4, .04, '#bbb', x + dx + a, 0, z + b)); }); } // lawn chairs
    else if(m === 5){ D(.05, .5, .05, '#888', x, 0, z); const s = vp(.7, .45, sign(['YARD', 'SALE SAT'], { bg:'#f2d030', fg:'#111', size:30, w:128, h:84 }), x, .75, z + .03); const s2 = vp(.7, .45, s.material, x, .75, z - .03, Math.PI); }
    else { D(.06, .5, .9, '#c8202a', x, .15, z); [-.38, .38].forEach(dz => { const w = new THREE.Mesh(new THREE.TorusGeometry(.2, .03, 5, 10), M('#222')); w.rotation.y = Math.PI / 2; w.position.set(x, .22, z + dz); S.add(w); }); } };                     // kid's bike on its side
  NORTH.forEach((x, i) => { if(i % 2 === 0){ bin(x - 5.4, 16.4, '#2a5a3a'); if(i % 4 === 0) bin(x - 4.7, 16.4, '#2a4a8a'); } clutter(x - 4.6, 13.4, i); });
  SOUTH.forEach((x, i) => { if(i % 2 === 1){ bin(x + 5.4, 31.9, '#2a5a3a'); } clutter(x + 4.6, 34.2, i + 3); });
  const fence = (x, z0, z1, c) => { D(.08, .08, z1 - z0, c, x, .35, (z0 + z1) / 2); D(.08, .08, z1 - z0, c, x, .85, (z0 + z1) / 2); for(let z = z0; z <= z1 + .01; z += 1.25) D(.1, 1.05, .1, c, x, 0, z); col(x - .08, z0, x + .08, z1, 1.1); };
  [[-160, 1], [-140, 0], [-70, 1], [-50, 0], [35, 1], [55, 0], [130, 1]].forEach(([x, k]) => fence(x, -2, 9.5, k ? '#f2efe6' : '#8a6a44'));
  [[-160, 0], [-140, 1], [-50, 1], [-30, 0], [30, 1], [50, 0], [70, 1], [130, 0]].forEach(([x, k]) => fence(x, 38.5, 50, k ? '#f2efe6' : '#8a6a44'));
  // ---------- Elmwood Park: path, playground, half court, picnic tables ----------
  flat(1.8, 36, '#cfc6ad', -80, 48.4, .04); flat(1.8, 1.8, '#cfc6ad', -80, 30.9, .065);
  { const steel = M('#8a8f96'), sx = -91, sz = 77; [[-2.2, -1], [-2.2, 1], [2.2, -1], [2.2, 1]].forEach(([dx, dz]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.7, 6), steel); l.position.set(sx + dx, 1.3, sz + dz * .6); l.rotation.x = -dz * .22; S.add(l); });
    D(4.6, .09, .09, steel, sx, 2.55, sz); [-1.1, 1.1].forEach(dx => { [-.25, .25].forEach(o => D(.02, 1.9, .02, '#444', sx + dx + o, .62, sz)); D(.6, .05, .26, '#c8202a', sx + dx, .58, sz); }); col(sx - 2.4, sz - .5, sx + 2.4, sz + .5, 1);
    const lx = -72, lz = 80; D(1.2, .08, 1.2, '#e8c832', lx, 1.5, lz); [[-.55, -.55], [.55, -.55], [-.55, .55], [.55, .55]].forEach(([a, b]) => D(.08, 1.5, .08, steel, lx + a, 0, lz + b));
    const sl = new THREE.Mesh(new THREE.BoxGeometry(.7, .06, 3), M('#3a8ad8')); sl.position.set(lx, .78, lz - 1.95); sl.rotation.x = -.52; sl.castShadow = true; S.add(sl); for(let i = 0; i < 4; i++) D(.6, .05, .1, steel, lx, .3 + i * .32, lz + .68); col(lx - .7, lz - 3.4, lx + .7, lz + .8, 1);
    flat(11, 12, '#7d7f86', -65, 68, .04); [[11, .1, -65, 62.05], [11, .1, -65, 73.95], [.1, 12, -70.45, 68], [.1, 12, -59.55, 68]].forEach(([w, d, x, z]) => flat(w, d, white, x, z, .05));
    cyl(.09, 3.1, steel, -59.2, 0, 68, 6); D(.06, 1.05, 1.8, '#f4f4f0', -59.6, 2.6, 68); const rim = new THREE.Mesh(new THREE.TorusGeometry(.23, .02, 5, 12), M('#e05a1a')); rim.rotation.x = Math.PI / 2; rim.position.set(-60.1, 3.05, 68); S.add(rim); col(-59.4, 67.8, -59, 68.2, 3);
    [[-92, 67], [-70, 58]].forEach(([x, z]) => { D(2, .08, .9, '#8a5a32', x, .72, z); D(2, .06, .3, '#8a5a32', x, .42, z - .75); D(2, .06, .3, '#8a5a32', x, .42, z + .75); [-.8, .8].forEach(dx => D(.08, .72, 1.6, '#6a4428', x + dx, 0, z)); col(x - 1, z - .9, x + 1, z + .9, .8); });
    cyl(.28, .8, M('#3a5a3a'), -77.4, 0, 61, 8); cyl(.28, .8, M('#3a5a3a'), -83, 0, 77.6, 8); }
  // ---------- plaza frontage ----------
  [[2, 49], [184, 232]].forEach(([a, b]) => { flat(b - a, 4, '#c9c5ba', (a + b) / 2, 332, .05); D(b - a, .14, .2, '#e8c832', (a + b) / 2, 0, 329.95); });
  [[50, 98.5], [111.5, 170]].forEach(([a, b]) => { flat(b - a, 2.6, '#c9c5ba', (a + b) / 2, 325.9, .05); D(b - a, .14, .2, '#e8c832', (a + b) / 2, 0, 324.55); });
  const bench = (x, z) => { D(1.9, .08, .5, '#6a4428', x, .45, z); D(1.9, .5, .07, '#6a4428', x, .55, z + .26); [-.8, .8].forEach(dx => D(.08, .45, .5, '#2a2a2a', x + dx, 0, z)); col(x - .95, z - .25, x + .95, z + .3, .9); };
  [[12, 333.4], [44, 333.4], [194, 333.4], [226, 333.4], [72, 326.7], [136, 326.7]].forEach(([x, z]) => bench(x, z));
  [[6, 333.3], [22, 333.3], [38, 333.3], [188, 333.3], [204, 333.3], [220, 333.3], [80, 326.6], [128, 326.6]].forEach(([x, z]) => { cyl(.3, .85, M('#4a4a4a'), x, 0, z, 8); cyl(.33, .08, M('#2a2a2a'), x, .85, z, 8); });
  { D(.1, 2.1, .1, '#777', 17.2, 0, 333.5); D(.5, .75, .35, '#2a4a9a', 17.2, 1.05, 333.5); D(.34, .3, .05, '#c9c9c9', 17.2, 1.3, 333.3); vp(.5, .2, sign('PHONE', { bg:'#2a4a9a', fg:'#fff', size:40, w:128, h:50 }), 17.2, 1.95, 333.3, Math.PI); col(16.9, 333.3, 17.5, 333.7, 2); }     // payphone
  [['#c8202a', 'DAILY'], ['#2a4a9a', 'USA'], ['#e8c832', 'AUTO']].forEach(([c, t], i) => { const x = 33.6 + i * .7; D(.55, .95, .45, c, x, .2, 333.5); D(.06, .2, .06, '#333', x, 0, 333.5); vp(.45, .3, sign(t, { bg:'#f4f4f0', fg:'#111', size:34, w:128, h:84 }), x, .8, 333.26, Math.PI); });
  col(33.2, 333.2, 35.4, 333.8, 1.2);
  [['#c8202a', 59.5], ['#1a4ab8', 60.7]].forEach(([c, x]) => { D(1.05, 1.9, .8, c, x, 0, 326.85); const g = new THREE.Mesh(new THREE.PlaneGeometry(.85, 1.2), new THREE.MeshBasicMaterial({ color:new THREE.Color(c).offsetHSL(0, 0, .22) })); g.position.set(x, 1.15, 326.44); g.rotation.y = Math.PI; S.add(g); });
  D(1.9, 1.7, .9, '#e8e8e4', 63, 0, 326.85); vp(1.2, .5, sign('ICE', { bg:'#2a6ad8', fg:'#fff', size:70, w:256, h:110 }), 63, 1.25, 326.39, Math.PI); col(58.9, 326.4, 64, 327.3, 2);
  { D(2.2, 1.5, .8, '#9aa0a6', 142, 0, 326.85); vp(1.6, .4, sign('PROPANE EXCHANGE', { bg:'#f4f4f0', fg:'#1a4ab8', size:30, w:256, h:64 }), 142, 1.1, 326.43, Math.PI); col(140.9, 326.4, 143.1, 327.3, 1.6);
    for(let i = 0; i < 5; i++){ const u = new THREE.Mesh(new THREE.TorusGeometry(.38, .03, 5, 10, Math.PI), M('#9aa0a6')); u.position.set(150 + i * .6, 0, 326.2); u.rotation.y = Math.PI / 2; S.add(u); } }
  for(let x = 99.5; x <= 110.6; x += 2.2){ cyl(.14, 1, M('#e8c832'), x, 0, 323.6, 8); col(x - .16, 323.44, x + .16, 323.76, 1); }
  // accessible stalls, lot arrows, stop bar at the exit
  [93.4, 96.2, 113.8, 116.6].forEach(x => { flat(2.5, 4.6, '#2a5ad8', x, 316, .042); vp(1.2, 1.2, sign('♿', { bg:'#2a5ad8', fg:'#fff', size:90, w:128, h:128 }), x, .05, 316).rotation.x = -Math.PI / 2; cyl(.04, 1.8, M('#888'), x, 0, 313.4, 5); vp(.4, .5, sign(['♿', 'ONLY'], { bg:'#2a5ad8', fg:'#fff', size:30, w:64, h:80 }), x, 1.7, 313.36, Math.PI); });
  { const am = sign('➜', { bg:'#4b4d53', fg:'#e8e8e0', size:100, w:128, h:128 }); [[70, 296, 0], [130, 296, Math.PI], [190, 296, 0], [20, 296, Math.PI]].forEach(([x, z, r]) => { const p = vp(2.6, 2.6, am, x, .046, z); p.rotation.set(-Math.PI / 2, 0, r); }); }
  flat(8, .5, white, 100, 263.2, .05);
  // ---------- school: buses, bike racks, benches ----------
  const bus = (x, z) => { box(2.6, 2.5, 10.5, M('#e8b020'), x, .55, z, { col:false }); D(2.62, .55, 10.52, '#1a1a1a', x, .5, z); D(2.64, .8, 9.4, '#2a3a48', x, 1.9, z - .3); D(2.62, .12, 10.52, '#1a1a1a', x, 1.55, z); D(2.3, .9, 1.4, '#e8b020', x, .55, z + 5.9);
    [[-1.2, 3.6], [1.2, 3.6], [-1.2, -3.4], [1.2, -3.4]].forEach(([dx, dz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .3, 10), M('#151515')); w.rotation.z = Math.PI / 2; w.position.set(x + dx, .5, z + dz); S.add(w); });
    [-1.32, 1.32].forEach(dx => vp(6, .45, sign('BELLEVILLE TWP H.S. DIST 201', { bg:'#e8b020', fg:'#111', size:30, w:512, h:44 }), x + dx, 2.75, z, dx > 0 ? Math.PI / 2 : -Math.PI / 2)); col(x - 1.4, z - 5.4, x + 1.4, z + 6.7, 3); };
  bus(-127, 214); bus(-127, 232);
  for(let i = 0; i < 6; i++){ const u = new THREE.Mesh(new THREE.TorusGeometry(.38, .03, 5, 10, Math.PI), M('#9aa0a6')); u.position.set(-137.4, 0, 133 + i * .6); S.add(u); } bench(-136.8, 163);
  // ---------- inside Schnucks: aisle category signs, end caps, frozen-food doors ----------
  const CATS = [['BREAD', 'PEANUT BUTTER', 'JELLY'], ['CEREAL', 'COFFEE', 'TEA'], ['CANNED GOODS', 'SOUP', 'PASTA'], ['BAKING', 'SPICES', 'OIL'], ['CHIPS', 'CRACKERS', 'COOKIES'], ['SODA', 'WATER', 'JUICE'], ['PAPER GOODS', 'CLEANING'], ['PET FOOD', 'BABY'], ['CANDY', 'GREETING CARDS']];
  CATS.forEach((c, i) => { const x = 70 + i * 8, m = sign(c, { bg:'#f4efe4', fg:'#1b3a6a', size:c.length > 2 ? 26 : 30, w:256, h:112 }); vp(2.4, 1.05, m, x, 3.15, 354.56); vp(2.4, 1.05, m, x, 3.15, 354.44, Math.PI);
    [354.3, 377.7].forEach((z, k) => { D(1.5, 1.5, .7, '#d8d4c8', x, 0, z); const pc = ['#e8463a', '#f4c430', '#4a8ad8', '#5ab04a', '#e88a2a', '#9a5ad8'][(i + k) % 6]; for(let r = 0; r < 3; r++) D(1.36, .34, .76, new THREE.Color(pc).offsetHSL(0, 0, (r - 1) * .07).getStyle(), x, .14 + r * .46, z);
      vp(1.1, .3, sign(['2 FOR $4', '$1.99', '10 FOR $10', '$2.49', 'BUY 1 GET 1', '99¢'][(i + k) % 6], { bg:'#c8102e', fg:'#fff', size:30, w:256, h:64 }), x, 1.68, z + (k ? .36 : -.36), k ? 0 : Math.PI); col(x - .75, z - .38, x + .75, z + .38, 1.6); }); });
  { const fr = M('#e8e8e8'), gl = new THREE.MeshLambertMaterial({ color:0xbfe3ff, emissive:0x2a4a5a, transparent:true, opacity:.55 }); D(1, 2.3, 19.4, fr, 149.1, 0, 376.4); col(148.6, 366.7, 149.7, 386.1, 2.3);
    for(let z = 367.4; z < 386; z += 1.3){ vp(1.12, 1.9, gl, 148.58, 1.15, z, -Math.PI / 2); D(.05, 2, .06, '#9aa0a6', 148.56, .15, z - .62); D(.03, .5, .04, '#555', 148.54, .9, z + .45);
      for(let r = 0; r < 4; r++) D(.3, .28, .9, ['#e8463a', '#4a8ad8', '#f4f4f0', '#5ab04a', '#f4c430'][(r + (z | 0)) % 5], 148.85, .28 + r * .46, z); } }
}
