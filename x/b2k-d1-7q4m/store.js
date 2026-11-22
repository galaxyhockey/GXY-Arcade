// Back in the 2000s: The Game — Schnucks Swansea detail pass (from photos of the Swansea store): warm perimeter soffit band over the
// departments, heaped produce tables + angled wet rack, floral by the entrance, soda stack display, hanging price banners,
// a lived-in break room upstairs and a working back room (pallet racking, baler, pallets, U-boats, dock door).
import { THREE, G, box, plane, mat, label, tex, makePerson } from './engine.js';
const S = G.scene, M = mat;
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
function vp(w, h, m, x, y, z, ry){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; S.add(p); return p; }
const sign = (t, o) => new THREE.MeshBasicMaterial({ map:label(t, o), transparent:!!o.clear });
function cylP(x, z, pot, leaf){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .17, .4, 8), M(pot)); p.position.set(x, .2, z); S.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 0), M(leaf)); l.position.set(x, .85, z); l.scale.y = 1.3; S.add(l); }
export { cylP as pottedPlant };

export function storeDetail(SCH){ const { x0, x1, z0 } = SCH;
  // ---- perimeter soffit (beige band, dark trim) — west wall, back partition (z 388), staff wall (x 150)
  const sof = M('#d9c7a4', { emissive:0x2a2418 }), trim = M('#6a4a2e');
  [[x0 + .35, 336, x0 + .35, 386, Math.PI / 2], [86, 387.75, 149, 387.75, Math.PI], [149.8, 342, 149.8, 386, -Math.PI / 2]].forEach(([ax, az, bx, bz, ry]) => {
    const len = Math.hypot(bx - ax, bz - az); vp(len, 1.5, sof, (ax + bx) / 2, 5.3, (az + bz) / 2, ry);
    [4.55, 6.05].forEach(y => { const t = vp(len, .12, trim, (ax + bx) / 2, y, (az + bz) / 2, ry); t.position.x += Math.sin(ry) * .01; t.position.z += Math.cos(ry) * .01; }); });
  [['PRODUCE', x0 + .4, 342, Math.PI / 2], ['FLORAL', x0 + .4, 336.6, Math.PI / 2], ['FROZEN FOODS', 149.75, 372, -Math.PI / 2], ['DAIRY', 149.75, 382, -Math.PI / 2], ['BEER & WINE', 149.75, 350, -Math.PI / 2], ['SEAFOOD', 134, 387.7, Math.PI]].forEach(([t, x, z, ry]) =>
    vp(t.length * .42 + 1, .9, sign(t, { bg:'#d9c7a4', fg:'#b3202a', size:72, w:Math.round((t.length * .42 + 1) * 90), h:90, font:'Georgia' }), x, 5.3, z, ry));
  // ---- produce: heaps on the wood tables + angled wet rack along the west wall
  const prod = ['#d4212a', '#f2c230', '#5aa832', '#ff8c1a', '#7a3a8a'], heap = new THREE.IcosahedronGeometry(.16, 0);
  for(let i = 0; i < 5; i++){ const m = M(prod[i]); for(let k = 0; k < 26; k++){ const h = new THREE.Mesh(heap, m); h.position.set(52.9 + (k % 6) * .45, 1.32 + (k > 17 ? .2 : 0), 335.9 + i * 5.5 + (k / 6 | 0) * .9 - (k > 17 ? 1.5 : 0)); S.add(h); }
    const pc = new THREE.Mesh(new THREE.PlaneGeometry(.5, .3), sign(['$' + ['.99/lb', '1.29', '.69/lb', '2/$3', '1.49'][i]], { bg:'#fff', fg:'#c8102e', size:46, w:128, h:76 })); pc.position.set(55.6, 1.45, 338 + i * 5.5); pc.rotation.y = Math.PI / 2; S.add(pc); }
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.8), new THREE.MeshLambertMaterial({ map:tex('wetrack', (g, w, h) => { const c = ['#3f8a2e', '#7ab04a', '#2f6a22', '#d8902a', '#9ac85a', '#c83a2a']; for(let x = 0; x < w; x += 16){ g.fillStyle = c[(x / 16) % c.length]; g.fillRect(x, 0, 16, h); for(let i = 0; i < 40; i++){ g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x + Math.random() * 16, Math.random() * h, 2, 2); } } }, 256, 32) }));
  wet.position.set(50.9, 1.3, 345); wet.rotation.set(0, Math.PI / 2, 0); wet.rotateX(-.55); S.add(wet); deco(.8, .9, 16, M('#5a3a22'), 50.8, 0, 345);
  // floral by the entrance
  for(let i = 0; i < 6; i++){ const bx = 92 + (i % 3) * .7, bz = 333.5 + (i / 3 | 0) * .7; const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .18, .45, 8), M('#2a2a2a')); b.position.set(bx, .45, bz); S.add(b);
    for(let k = 0; k < 5; k++){ const f = new THREE.Mesh(new THREE.SphereGeometry(.09, 6, 5), M(['#e8457a', '#f2d030', '#f4f4f4', '#d82a2a', '#a85ad8'][(i + k) % 5])); f.position.set(bx + Math.cos(k) * .12, .85 + (k % 2) * .1, bz + Math.sin(k) * .12); S.add(f); } }
  deco(2.6, .6, 1.8, M('#5a3a22'), 92.7, 0, 333.9);
  // soda stack display in the racetrack aisle
  for(let r = 0; r < 4; r++) for(let i = 0; i < 4 - r; i++) for(let j = 0; j < 3 - (r > 1 ? 1 : 0); j++) deco(.9, .38, .6, M(['#c8202a', '#1a4ab8', '#2a8a3a'][(i + j + r) % 3]), 120 + i * .95 + r * .47, r * .38, 349 + j * .65 + (r > 1 ? .3 : 0));
  G.colliders.push({ x0:119.5, x1:124, z0:348.7, z1:351.3, y0:0, y1:1.5 });
  vp(2.2, .8, sign(['12-PACKS', '3 / $10'], { bg:'#f2d030', fg:'#c8102e', size:44, w:256, h:96 }), 121.9, 2.2, 348.6, Math.PI);
  // hanging value banners over the racetrack
  [[85, 350], [115, 350], [140, 360], [100, 380]].forEach(([x, z], i) => { const b = vp(3.2, 1.1, sign([['LOW PRICES', 'EVERY DAY'], ['SCHNUCKS', 'CARD SAVINGS'], ['FRESH', 'FROM OUR BAKERY'], ['HOMETOWN', 'SINCE 1939']][i], { bg:'#c8102e', fg:'#fff', size:40, w:384, h:132 }), x, 6.4, z, 0); b.material.side = THREE.DoubleSide;
    deco(.03, 1.3, .03, M('#888'), x - 1.4, 6.95, z); deco(.03, 1.3, .03, M('#888'), x + 1.4, 6.95, z); });
  // ---- break room (mezzanine x 66..83.5, z 366..388, y 3.6)
  const y = 3.6; [[72.6, 377.2], [75.4, 377.2], [72.6, 378.8], [75.4, 378.8]].forEach(([x, z]) => { deco(.45, .45, .45, M('#3a3a3a'), x, y, z + (z < 378 ? -.6 : .6)); deco(.45, .5, .06, M('#3a3a3a'), x, y + .45, z + (z < 378 ? -.83 : .83)); });
  box(4, .92, .65, M('#a8794a'), 70, y, 387.2); deco(4.1, .05, .7, M('#d8d0c0'), 70, y + .92, 387.2); deco(.55, .32, .38, M('#ddd'), 69, y + .97, 387.2); deco(.4, .2, .02, M('#222'), 68.95, y + 1.08, 386.99);
  box(.8, 1.85, .7, M('#e8e8e4'), 73, y, 387.1); deco(.02, .5, .05, M('#999'), 72.7, y + .9, 386.74);
  vp(1.6, 1, new THREE.MeshLambertMaterial({ map:tex('sched', (g, w, h) => { g.fillStyle = '#c8a26a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(8, 8, 90, 60); g.fillRect(104, 12, 40, 30); g.fillStyle = '#c8102e'; g.fillRect(104, 48, 40, 20); g.fillStyle = '#333'; g.font = '8px Arial'; g.fillText('WEEK OF 9/22', 14, 18); for(let i = 0; i < 6; i++) g.fillRect(14, 24 + i * 7, 60 + Math.random() * 20, 2); }, 152, 76) }), 66.12, y + 1.6, 371, Math.PI / 2);
  box(.9, .45, 2.4, M('#5a4a6a'), 67, y, 383); deco(.25, .5, 2.4, M('#5a4a6a'), 66.7, y + .45, 383); // couch
  const clk = new THREE.Mesh(new THREE.CircleGeometry(.25, 18), M('#fff')); clk.position.set(77, y + 2.3, 387.6); clk.rotation.y = Math.PI; S.add(clk);
  deco(.45, .6, .45, M('#4a6a4a'), 82.6, y, 372); vp(1.2, .5, sign('EMPLOYEES ONLY', { bg:'#fff', fg:'#c8102e', size:44, w:256, h:96 }), 83.4, y + 2, 368, -Math.PI / 2);
  // ---- back room (z 388..402): pallet racking, baler, pallets of product, U-boats, roll-up dock door, milk crates
  const rack = (x, z, len) => { [-.5, .5].forEach(dz => { for(let k = 0; k <= len; k += 2.6) deco(.1, 5.2, .1, M('#2a5aa8'), x + k, 0, z + dz); }); [1.6, 3.4, 5.1].forEach(h => deco(len, .12, 1.1, M('#e8821a'), x + len / 2, h, z));
    for(let k = .3; k < len - .6; k += 1.3) [0, 1.72, 3.52].forEach(h => deco(1.1, 1.2, .9, M(['#b8935a', '#a8834a', '#c8a36a'][(k * 3 + h | 0) % 3]), x + k + .6, h + (h ? .12 : .15), z));
    G.colliders.push({ x0:x, x1:x + len, z0:z - .6, z1:z + .6, y0:0, y1:5.3 }); };
  rack(56, 400.9, 14); rack(98, 400.9, 10.4); rack(162, 395, 6);
  box(2.6, 2.8, 2, M('#3a5a3a'), 122, 0, 399.6); vp(1.8, .5, sign('CARDBOARD ONLY', { bg:'#f2d030', fg:'#111', size:44, w:256, h:72 }), 122, 2.2, 398.58, Math.PI);
  [[80, 392.5], [86, 393], [146, 394]].forEach(([x, z]) => { deco(1.2, .14, 1, M('#8a6a3a'), x, 0, z); deco(1.1, .9 + Math.random() * .6, .95, M('#c8b48a'), x, .14, z); G.colliders.push({ x0:x - .6, x1:x + .6, z0:z - .5, z1:z + .5, y0:0, y1:1.5 }); });
  [[92, 391.5], [104, 391.8]].forEach(([x, z]) => { deco(1.6, .1, .6, M('#555'), x, .3, z); [-.75, .75].forEach(dx => deco(.06, 1.4, .06, M('#777'), x + dx, .3, z)); deco(1.5, .9, .5, M('#b8935a'), x, .4, z); });
  for(let i = 0; i < 6; i++) deco(.5, .3, .4, M(i % 2 ? '#2a5aa8' : '#c8202a'), 140 + (i % 2) * .55, (i / 2 | 0) * .3, 398);
  vp(3.6, 3.2, new THREE.MeshLambertMaterial({ map:tex('rollup', (g, w, h) => { g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.18)'; for(let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); }, 64, 64) }), 160, 1.6, 401.7, Math.PI);
  // ---- Eric's office (x 150..170, z 366..388): filing cabinets, PC, safe, schedule board, visitor chairs, plant
  { const fc = M('#8a8f96'); for(let i = 0; i < 3; i++){ box(.6, 1.4, .7, fc, 169.4, 0, 370 + i * .75); for(let d2 = 0; d2 < 3; d2++) deco(.02, .08, .3, M('#555'), 169.08, .3 + d2 * .42, 370 + i * .75); }
    deco(.5, .42, .45, M('#d8d0b8'), 160.6, .8, 380.1); deco(.4, .3, .02, M('#2a6a8a'), 160.6, .86, 379.86); deco(.5, .03, .2, M('#d8d0b8'), 159.9, .8, 379.7); deco(.3, .04, .3, M('#222'), 159.2, .8, 380);
    box(.8, .9, .7, M('#3a3a3a'), 151, 0, 387); deco(.12, .12, .02, M('#c9c9c9'), 151, .45, 386.64);
    vp(2.6, 1.5, sign(['WEEK OF 9/22', 'CHRIS — CARTS', 'MADISON — CARTS', 'RYAN — LANE 3', 'ANDREW — BREAK??'], { bg:'#f4f4f0', fg:'#1a1a1a', size:26, w:384, h:220 }), 160, 2, 387.82, Math.PI);
    vp(1.2, .9, sign(['EMPLOYEE', 'OF THE MONTH', '(NOT CHRIS)'], { bg:'#c8a23a', fg:'#2a1a0a', size:24, w:256, h:190 }), 154.5, 2, 387.82, Math.PI);
    [158.6, 161.4].forEach(x => { deco(.5, .45, .5, M('#4a3a5a'), x, 0, 376.2); deco(.5, .5, .08, M('#4a3a5a'), x, .45, 375.95); });
    cylP(169, 387, '#6a4a2a', '#3d7a2e'); const rug = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), M('#5a2a2a')); rug.rotation.x = -Math.PI / 2; rug.position.set(160, .035, 378.5); S.add(rug); }
  // ---- restroom (x 150..170, z 342..354): stalls, sinks + mirror, hand dryer, wet-floor sign
  { const st = M('#9aa8b0'); [162, 164.4, 166.8].forEach(x => { deco(.06, 1.9, 2, st, x, .2, 343.2); deco(1, 1.8, .05, st, x + 1.2, .25, 344.2); });
    [[163.2, 343], [165.6, 343]].forEach(([x, z]) => { deco(.45, .4, .6, M('#f4f4f0'), x, 0, z); deco(.45, .5, .2, M('#f4f4f0'), x, .4, z - .25); });
    deco(3.2, .12, .5, M('#e8e4da'), 153.4, .82, 352.4); [152.4, 153.4, 154.4].forEach(x => deco(.4, .1, .32, M('#f4f4f0'), x, .86, 352.4)); vp(3.2, .9, new THREE.MeshLambertMaterial({ color:0xcfe0ea, emissive:0x40505a }), 153.4, 1.75, 353.82, Math.PI);
    deco(.3, .35, .2, M('#e8e8e8'), 150.4, 1.2, 349); const wf = new THREE.Mesh(new THREE.ConeGeometry(.3, .7, 4), M('#f2d030')); wf.position.set(157, .35, 348); S.add(wf); }
  // ---- staff corridor by the time clock: bulletin board, water cooler, mop bucket, lockers
  vp(2, 1.2, sign(['STAFF NOTICES', 'WASH YOUR HANDS', 'CART RUNS ON THE HOUR', 'NO SKATEBOARDS'], { bg:'#c8a26a', fg:'#1a1a1a', size:26, w:320, h:190 }), 169.72, 1.9, 359.5, -Math.PI / 2);
  deco(.4, 1, .4, M('#e8e8e8'), 151.2, 0, 362.6); deco(.3, .45, .3, M('#9fd0f2'), 151.2, 1, 362.6); deco(.5, .4, .5, M('#e8c832'), 152.4, 0, 355.2); deco(.04, 1.3, .04, M('#8a6a44'), 152.5, .2, 355.2);
  // a couple of coworkers stocking (static)
  [[106, 352.5, Math.PI / 2, { shirt:'#f0f0f0', pants:'#2a2a3a', vest:'#c8102e', hairStyle:'buzz', hair:'#6a4a2a' }], [56, 352, -Math.PI / 2, { shirt:'#f0f0f0', pants:'#2a2a3a', vest:'#c8102e', hairStyle:'pony', hair:'#c9a15a', lips:'#b5505a' }]].forEach(([x, z, ry, l]) => { const p = makePerson(l); p.position.set(x, 0, z); p.rotation.y = ry; S.add(p); G.colliders.push({ x0:x - .3, x1:x + .3, z0:z - .3, z1:z + .3, y0:0, y1:1.8 }); (G.storeStaff = G.storeStaff || []).push(p); });
}
