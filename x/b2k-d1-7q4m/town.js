// Back in the 2000s: The Game — the wider town (Draft 2.5). Everything outside the original four-street loop:
// a street grid laid out from satellite views of Belleville / Swansea (rotated: +x here is "toward downtown"),
// the Public Square roundabout and fountain, Main Street storefronts, the county building, cathedral, Lincoln Theatre,
// Melvin Price Memorial Park, Belle-Clair Fairgrounds, Skyview Drive-In, Walnut Hill Cemetery, Eckert's orchard,
// farm fields, the MetroLink line along the north edge, and a few hundred yards of houses.
// All static: it is merged by the static bake. Nothing here is story canon (world dressing, GAME ORIGINAL layout).
import { THREE, G, box, plane, cyl, mat, txMat, noise, label, mapRect, makeCar, lampGlow } from './engine.js';
import * as BL from './buildings.js';
const S = G.scene;
let s0 = 61803; const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647, pick = a => a[rnd() * a.length | 0];
const C = c => typeof c === 'string' ? mat(c) : c;
const D = (w, h, d, c, x, y, z) => box(w, h, d, C(c), x, y, z, { col:false });
const col = (x0, z0, x1, z1, y1 = 3) => G.colliders.push({ x0, x1, z0, z1, y0:0, y1 });
const sgCache = {}; const sg = (t, o = {}) => sgCache[t + (o.bg || '')] || (sgCache[t + (o.bg || '')] = new THREE.MeshBasicMaterial({ map:label(t, o) }));
const RY = { s:0, n:Math.PI, e:Math.PI / 2, w:-Math.PI / 2 };
const vp = (w, h, m, x, y, z, ry = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), C(m)); p.position.set(x, y, z); p.rotation.y = ry; S.add(p); return p; };
const disc = (r, m, x, y, z, sx = 1, sz = 1, seg = 32) => { const p = new THREE.Mesh(new THREE.CircleGeometry(r, seg), C(m)); p.rotation.x = -Math.PI / 2; p.scale.set(sx, sz, 1); p.position.set(x, y, z); p.receiveShadow = true; S.add(p); return p; };
const pyr = (w, d, h, m, x, y, z) => { const p = new THREE.Mesh(new THREE.ConeGeometry(.7071, 1, 4), C(m)); p.rotation.y = Math.PI / 4; p.scale.set(w, h, d); p.position.set(x, y + h / 2, z); p.castShadow = true; S.add(p); return p; };
// a two-sided text sign on posts
const board = (t, w, h, x, y, z, ry = 0, o = {}) => { const m = sg(t, { w:512, h:Math.max(48, Math.round(512 * h / w)), size:o.size || 44, bg:o.bg || '#1d4a2a', fg:o.fg || '#f3e9c6' });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .14), m); b.position.set(x, y, z); b.rotation.y = ry; S.add(b);
  if(o.posts !== false) [-1, 1].forEach(s => D(.16, y, .16, '#5a4632', x + s * Math.cos(ry) * (w / 2 - .2), 0, z - s * Math.sin(ry) * (w / 2 - .2))); return b; };

export const SQ = { x:560, z:256 };
// full roads (traffic + junction logic); `old` = the stretch world.js already draws, `gap` = the Public Square
export const H = [
  { z:-170, a:-604, b:734, n:'N Charles Street' }, { z:-80, a:-604, b:96, n:'N Church Street' }, { z:-80, a:344, b:734, n:'N Church Street' },
  { z:24, a:-190, b:336, n:'Oakmont Drive', old:[-190, 150] }, { z:90, a:344, b:734, n:'N Jackson Street' },
  { z:256, a:-604, b:734, n:'N Illinois Street', old:[-190, 230], gap:[532, 588] },
  { z:400, a:-604, b:-112, n:'Big Bend Boulevard' }, { z:400, a:344, b:734, n:'N 1st Street' }, { z:560, a:-604, b:734, n:'N 17th Street', wn:[-108, 'Sullivan Drive'] } ];
export const V = [
  { x:-600, a:-174, b:564, n:'Frank Scott Parkway' }, { x:-480, a:260, b:556, n:'Huntwood Road' }, { x:-360, a:-166, b:556, n:'Fullerton Road' },
  { x:-240, a:404, b:470, n:'Deerfield Drive', quiet:true }, { x:-200, a:330, b:396, n:'Thistle Lane', quiet:true },
  { x:-108, a:-166, b:556, n:'Westhaven Road', old:[28, 252] }, { x:100, a:-166, b:252, n:'Maple Street', old:[28, 252] },
  { x:340, a:-166, b:556, n:'N Belt', ew:['N Belt East', 'N Belt West'] }, { x:460, a:-166, b:556, n:'A Street', ew:['E A Street', 'W A Street'] },
  { x:560, a:-166, b:556, n:'Main Street', ew:['E Main Street', 'W Main Street'], gap:[228, 284] },
  { x:650, a:-166, b:404, n:'Washington Street', ew:['E Washington Street', 'W Washington Street'] }, { x:730, a:-174, b:564, n:'Cleveland Avenue' } ];
G.townRoads = { H, V, SQ };

// ---------- land bookkeeping: nothing new is placed on top of roads, the old neighbourhood or another new thing ----------
const used = [];
const take = (x0, z0, x1, z1) => used.push([x0, z0, x1, z1]);
const free = (x0, z0, x1, z1) => !used.some(u => x0 < u[2] && x1 > u[0] && z0 < u[3] && z1 > u[1]);

export function buildTown({ road, tree, M, rep, leafM }){
  const d0 = (G.driveways || []).length;
  const through = (h, x) => h.a <= x - 3.9 && h.b >= x + 3.9;
  const cuts = (seg, list) => { let s = [seg]; for(const r of list) s = s.flatMap(([a, b]) => r[0] >= b || r[1] <= a ? [[a, b]] : [[a, r[0]], [r[1], b]]); return s.filter(([a, b]) => b - a > 1); };
  // ---------- streets ----------
  for(const h of H){ take(h.a, h.z - 6.4, h.b, h.z + 6.4); for(const [a, b] of cuts([h.a, h.b], [h.old, h.gap, h.wn && [h.wn[0], h.wn[0]]].filter(Boolean))) road(a, h.z - 4, b, h.z + 4, h.z === SQ.z && a >= SQ.x ? 'S Illinois Street' : h.wn && b <= h.wn[0] ? h.wn[1] : h.n); }
  for(const v of V){ take(v.x - 6.4, v.a, v.x + 6.4, v.b);
    const cs = H.filter(h => through(h, v.x) && h.z > v.a - 4.5 && h.z < v.b + 4.5).map(h => [h.z - 4, h.z + 4]);
    for(const [a, b] of cuts([v.a, v.b], [...cs, v.old, v.gap].filter(Boolean))) road(v.x - 4, a, v.x + 4, b, v.ew ? v.ew[b <= SQ.z ? 0 : 1] : v.n); }
  take(524, 220, 596, 292); take(-326, -8, -112, 252); take(-192, -30, 152, 56); take(70, 28, 130, 252); take(-104, 56, 70, 252); take(-46, 260, 252, 476); take(290, -110, 318, -84);
  // junction patches: hide the sidewalk strips and centre dashes where streets cross or meet
  const pm = rep(M.asphalt, 2, 2), patch = (x0, z0, x1, z1) => plane(x1 - x0, z1 - z0, pm, (x0 + x1) / 2, .07, (z0 + z1) / 2);
  const abbr = n => n.toUpperCase().replace('STREET', 'ST').replace('ROAD', 'RD').replace('AVENUE', 'AVE').replace('PARKWAY', 'PKWY').replace('DRIVE', 'DR');
  const blade = (t, x, y, z, ry) => { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, .42, .05), sg(abbr(t), { bg:'#1d6b3a', fg:'#fff', size:44, w:512, h:98 })); b.position.set(x, y, z); b.rotation.y = ry; S.add(b); };
  const xwM = txMat('xw2', (g, w, h) => { g.fillStyle = '#3b3d42'; g.fillRect(0, 0, w, h); g.fillStyle = '#eee'; for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 8, h); }, [1, 1]);
  for(const h of H) for(const v of V){ if((v.x === SQ.x && h.z === SQ.z) || h.z < v.a - 4.5 || h.z > v.b + 4.5) continue;
    if(h.old && v.old && v.x > h.old[0] && v.x < h.old[1]) continue;
    if(through(h, v.x)){ const vN = v.a < h.z - 5, vS = v.b > h.z + 5; patch(v.x - 4, h.z - 4 - (vN ? 2.4 : 0), v.x + 4, h.z + 4 + (vS ? 2.4 : 0));
      if(vN) plane(8, 2, xwM, v.x, .075, h.z - 5.2); if(vS) plane(8, 2, xwM, v.x, .075, h.z + 5.2);
      cyl(.05, 3.5, mat('#777'), v.x + 5.2, 0, h.z + 5.2, 6); blade(h.z === SQ.z && v.x > SQ.x ? 'S Illinois Street' : h.wn && v.x < h.wn[0] ? h.wn[1] : h.n, v.x + 5.2, 3.1, h.z + 5.2, 0); blade(v.ew ? v.ew[h.z < SQ.z ? 0 : 1] : v.n, v.x + 5.2, 3.5, h.z + 5.2, Math.PI / 2); }
    else if(Math.abs(h.b - (v.x - 4)) < .6) patch(v.x - 6.4, h.z - 4, v.x - 4, h.z + 4); else if(Math.abs(h.a - (v.x + 4)) < .6) patch(v.x + 4, h.z - 4, v.x + 6.4, h.z + 4); }
  // street lamps
  const lamp = (x, z) => { cyl(.08, 5, mat('#4a4a4a'), x, 0, z, 6); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .9), G.lampM); b.position.set(x, 5.05, z); S.add(b); lampGlow(x, z, 8); };
  const inOld = (r, a) => r.old && a > r.old[0] - 5 && a < r.old[1] + 5, nearSq = (x, z) => Math.hypot(x - SQ.x, z - SQ.z) < 36;
  for(const h of H) for(let x = h.a + 34; x < h.b - 10; x += 66) if(!inOld(h, x) && !V.some(v => Math.abs(v.x - x) < 10) && !nearSq(x, h.z)) lamp(x, h.z - 6.9);
  for(const v of V) for(let z = v.a + 34; z < v.b - 10; z += 66) if(!inOld(v, z) && !H.some(h => Math.abs(h.z - z) < 10 && h.a < v.x + 8 && h.b > v.x - 8) && !nearSq(v.x, z)) lamp(v.x + 6.9, z);

  // ---------- generic pieces ----------
  let seedN = 100;
  const yardTree = (x, z) => { if(free(x - 1, z - 1, x + 1, z + 1)) tree(x, z, .9 + rnd() * .5, rnd() < .55); };
  function houses(ax, c, a0, a1, face, o = {}){ const step = o.step || 25; // a row of houses whose centres sit on the line ax = c
    for(let a = a0 + 10; a <= a1 - 10; a += step){ seedN += 7; const x = ax === 'x' ? a : c, z = ax === 'x' ? c : a, hw = ax === 'x' ? 11.5 : 9.5, hd = ax === 'x' ? 9.5 : 11.5;
      if(!free(x - hw, z - hd, x + hw, z + hd)) continue;
      if(rnd() < (o.skip ?? .14)){ yardTree(x, z); continue; }
      BL.house(x, z, face, seedN, { curb:14 }); take(x - hw, z - hd, x + hw, z + hd);
      const bk = face === 's' ? [x - 6, z - 13] : face === 'n' ? [x + 6, z + 13] : face === 'e' ? [x - 13, z + 6] : [x + 13, z - 6]; if(rnd() < .6) yardTree(bk[0], bk[1]); } }
  const side = (r, sgn) => r + sgn * 18; // house line beside a street centre
  const glassM = mat('#26384a'), shopGlass = mat('#4a6880'), paveM = mat('#b4b0a6'), pave = (x0, z0, x1, z1) => plane(x1 - x0, z1 - z0, paveM, (x0 + x1) / 2, .035, (z0 + z1) / 2), AWN = ['#8a2a2a', '#2a4a7a', '#2f5a3a', '#5a3a6a', '#b8862a', '#333'], BR = ['#8c3b2a', '#7a4a3a', '#a0522d', '#6e3b2e', '#b0603a', '#8a6a4a'];
  function shop(x0, z0, x1, z1, o = {}){ const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = o.h || 5, f = o.face || 's', sx = f === 'e' ? 1 : f === 'w' ? -1 : 0, sz = f === 's' ? 1 : f === 'n' ? -1 : 0, len = sx ? d : w;
    const wall = o.wall ? mat(o.wall) : BL.brickM(o.brick || pick(BR), '#c9bba5', [Math.max(2, Math.round(len / 4)), Math.max(1, Math.round(h / 2.6))], 'tn');
    box(w, h, d, wall, cx, 0, cz); D(w + .5, .45, d + .5, o.trim || '#d8d2c4', cx, h, cz);
    const at = (u, y, off) => sx ? [cx + sx * (w / 2 + off), y, cz + u] : [cx + u, y, cz + sz * (d / 2 + off)], ry = RY[f];
    const P = (pw, ph, m, u, y, off) => vp(pw, ph, m, ...at(u, y, off), ry);
    if(o.front !== false){ P(len - 2.2, 2.2, shopGlass, 0, 1.4, .04); for(let u = -len / 2 + 1.1 + 3; u < len / 2 - 2; u += 3) P(.14, 2.2, '#2a2a2e', u, 1.4, .05); P(1.3, 2.3, o.door || '#3a2a1e', o.doorU ?? -len / 4, 1.15, .06);
      if(o.awn){ const [ax2, , az2] = at(0, 0, .75); D(sx ? 1.5 : len - 1, .14, sx ? len - 1 : 1.5, o.awn, ax2, 2.75, az2); } }
    for(let fl = 1; fl < Math.floor(h / 3.2); fl++) for(let u = -len / 2 + 1.7; u <= len / 2 - 1.7 + .01; u += 2.7) P(1.2, 1.6, glassM, u, fl * 3.2 + 1.55, .04);
    if(o.name){ const sw = Math.max(3.6, Math.min(len - 1, (Array.isArray(o.name) ? Math.max(...o.name.map(t => t.length)) : o.name.length) * .5 + 1.4)), sh = Array.isArray(o.name) ? 1.7 : 1;
      const hp = Math.round(512 * sh / sw); P(sw, sh, sg(o.name, { bg:o.sbg || '#f2ecd8', fg:o.sfg || '#2a2420', size:Math.round(Math.min(64, hp * (Array.isArray(o.name) ? .4 : .76))), w:512, h:hp }), 0, Math.min(h - .7, o.signY || 3.75), .09); }
    mapRect(x0, z0, x1, z1, o.mc || '#a3968a'); take(x0 - 1, z0 - 1, x1 + 1, z1 + 1); return { cx, cz, at, P, len, ry, sx, sz }; }
  const lineM = new THREE.MeshBasicMaterial({ color:0xe4e4dc }), carC = ['#a33', '#335', '#ddd', '#2a6a3a', '#888', '#d8b84a', '#222', '#6a2a6a', '#1a3a6a', '#c8c0b0'];
  function lot(x0, z0, x1, z1, n = 4, o = {}){ plane(x1 - x0, z1 - z0, rep(M.asphalt, (x1 - x0) / 6, (z1 - z0) / 6), (x0 + x1) / 2, .025, (z0 + z1) / 2); mapRect(x0, z0, x1, z1, '#4c4f55'); take(x0, z0, x1, z1);
    const alongX = x1 - x0 >= z1 - z0, rows = alongX ? [z0 + 3.2, z1 - 3.2] : [x0 + 3.2, x1 - 3.2], a0 = (alongX ? x0 : z0) + 2, a1 = (alongX ? x1 : z1) - 2, spots = [];
    rows.forEach(r => { for(let a = a0; a <= a1; a += 2.9){ alongX ? plane(.12, 5, lineM, a, .04, r) : plane(5, .12, lineM, r, .04, a); if(a + 2.9 <= a1) spots.push([a + 1.45, r]); } });
    for(let i = 0; i < n && spots.length; i++){ const [a, r] = spots.splice(rnd() * spots.length | 0, 1)[0], x = alongX ? a : r, z = alongX ? r : a, c = makeCar(pick(carC), { suv:rnd() < .25 }); c.position.set(x, 0, z); c.rotation.y = alongX ? (rnd() < .5 ? 0 : Math.PI) : Math.PI / 2; S.add(c);
      alongX ? col(x - 1, z - 2.3, x + 1, z + 2.3, 1.6) : col(x - 2.3, z - 1, x + 2.3, z + 1, 1.6); } }
  const NAMES = ['MAIN ST. BARBER', 'RECORDS + CDs', 'COMICS & CARDS', 'TUXEDO RENTAL', 'JEWELERS', 'SHOE REPAIR', 'ANTIQUES', 'CAFE', 'TAVERN', 'PAWN', 'INSURANCE', 'LAW OFFICES', 'DINER', 'BAKERY', 'HARDWARE', 'FURNITURE', '1 HR PHOTO', 'CELLULAR + PAGERS', 'INTERNET CAFE', 'GUITARS', 'BRIDAL', 'TRAVEL AGENCY', 'FLORIST', 'USED BOOKS', 'DANCE STUDIO', 'TV + VCR REPAIR', 'PIZZA', 'OPTICAL', 'DRY CLEANERS', 'VACUUMS']; let ni = 0;
  function strip(ax, front, a0, a1, face, o = {}){ const d = o.d || 14, first = (o.first || []).slice(); let a = a0; // a row of joined storefronts, facade on the line ax-perpendicular = front
    while(a < a1 - 5){ const sp = first.shift(); let w = sp ? sp.w : 9 + (rnd() * 4 | 0) * 2; if(a + w > a1 || a1 - a - w < 7) w = a1 - a;
      const r = ax === 'x' ? (face === 's' ? [a, front - d, a + w, front] : [a, front, a + w, front + d]) : (face === 'e' ? [front - d, a, front, a + w] : [front, a, front + d, a + w]);
      ax === 'x' ? pave(a, face === 's' ? front : front - 2.2, a + w, face === 's' ? front + 2.2 : front) : pave(face === 'e' ? front : front - 2.2, a, face === 'e' ? front + 2.2 : front, a + w);
      const b = shop(...r, { h:(sp && sp.h) || 6.6 + (rnd() * 3 | 0) * 2.2, face, name:(sp && sp.name) || NAMES[ni++ % NAMES.length], awn:pick(AWN), ...(sp || {}) }); if(sp && sp.fn) sp.fn(b); a += w; } }
  const copse = (x0, z0, x1, z1, n, big = 1.2) => { for(let i = 0; i < n; i++){ const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if(free(x - 1.5, z - 1.5, x + 1.5, z + 1.5)) tree(x, z, big * (.8 + rnd() * .6), rnd() < .5); } };
  const lite = (x, z, s = 1) => { cyl(.2 * s, 3.4 * s, mat('#5a3d22'), x, 0, z, 5); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3 * s, 0), leafM[rnd() * 5 | 0]); l.position.set(x, 4.6 * s, z); l.scale.y = 1.25; l.rotation.y = rnd() * 3; l.castShadow = true; S.add(l); }; // cheap tree, no collider (beyond the edge walls)
  const fenceLine = (x0, z0, x1, z1, c = '#8a8f96', h = 1.6) => { const dx = x1 - x0, dz = z1 - z0; box(Math.abs(dx) + .1, h, Math.abs(dz) + .1, mat(c), (x0 + x1) / 2, 0, (z0 + z1) / 2); };
  const waterTower = (x, z, name) => { const st = mat('#c9d2d8'); [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, b]) => cyl(.3, 20, st, x + a, 0, z + b, 6)); cyl(.5, 20, st, x, 0, z, 8);
    const tk = new THREE.Mesh(new THREE.SphereGeometry(6.5, 16, 10), mat('#dfe6ea')); tk.scale.y = .62; tk.position.set(x, 23, z); tk.castShadow = true; S.add(tk);
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(ry => vp(7, 1.5, sg(name, { bg:'#dfe6ea', fg:'#1b3a6a', size:70, w:512, h:110 }), x + Math.sin(ry) * 6.56, 23, z + Math.cos(ry) * 6.56, ry)); col(x - 3.4, z - 3.4, x + 3.4, z + 3.4, 20); take(x - 6, z - 6, x + 6, z + 6); mapRect(x - 4, z - 4, x + 4, z + 4, '#c9d2d8'); };

  // ---------- the Public Square: roundabout + Veterans Memorial Fountain ----------
  { const { x, z } = SQ; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => pave(x + (a < 0 ? -36 : 6.4), z + (b < 0 ? -36 : 6.4), x + (a < 0 ? -6.4 : 36), z + (b < 0 ? -6.4 : 36)));
    disc(30, rep(M.asphalt, 10, 10), x, .07, z, 1, 1, 48); mapRect(x - 28, z - 28, x + 28, z + 28, '#5a5d63');
    for(let q = 0; q < 4; q++){ const r = new THREE.Mesh(new THREE.RingGeometry(30, 33.5, 16, 1, q * Math.PI / 2 + .22, Math.PI / 2 - .44), M.walk); r.rotation.x = -Math.PI / 2; r.position.set(x, .065, z); r.receiveShadow = true; S.add(r); }
    cyl(11, .3, mat('#c4c0b6'), x, 0, z, 32); cyl(10.2, .36, mat('#5a9440'), x, 0, z, 32); cyl(5.2, .9, mat('#b8b4aa'), x, 0, z, 20); cyl(4.7, .96, mat('#5aa8d8'), x, 0, z, 20);
    cyl(.8, 3, mat('#a8a49a'), x, 0, z, 10); cyl(.4, .5, mat('#a8a49a'), x, 3, z, 12, 2.4); cyl(2.2, .12, mat('#7cc0e8'), x, 3.5, z, 14); cyl(.35, 1.6, mat('#a8a49a'), x, 3.5, z, 8); cyl(.2, .3, mat('#a8a49a'), x, 5.1, z, 10, 1.1); cyl(.1, 1.4, mat('#cfe6f4'), x, 5.3, z, 6);
    [[1, 1, '#b22234'], [-1, 1, '#f2f2f2'], [1, -1, '#1b3a8a'], [-1, -1, '#b22234']].forEach(([a, b, c]) => { cyl(.07, 7, mat('#c9c9c9'), x + a * 6.6, .3, z + b * 6.6, 6); D(1.6, .95, .04, c, x + a * 6.6 + .85, 6.2, z + b * 6.6); });
    board(['VETERANS MEMORIAL FOUNTAIN', 'BELLEVILLE PUBLIC SQUARE'], 4.4, 1, x, 1.1, z + 9.2, 0, { size:30, bg:'#3a342c' });
    col(x - 8, z - 8, x + 8, z + 8, 2); col(x - 10.4, z - 3.6, x + 10.4, z + 3.6, 2); col(x - 3.6, z - 10.4, x + 3.6, z + 10.4, 2); mapRect(x - 9, z - 9, x + 9, z + 9, '#4f8a3c'); mapRect(x - 4, z - 4, x + 4, z + 4, '#5aa8d8');
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => { lamp(x + a * 25, z + b * 25); cyl(.5, .6, mat('#6a4a3a'), x + a * 28, 0, z + b * 28, 8); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(.7, 0), mat('#c8482a')); f.position.set(x + a * 28, .9, z + b * 28); S.add(f); }); }

  // ---------- downtown ----------
  const marquee = b => { const [x, , z] = b.at(0, 0, 1.5); D(b.sx ? 3 : 9, 1.5, b.sx ? 9 : 3, '#e8dcc0', x, 3.3, z);
    [-1, 1].forEach(s => vp(3, 1.3, sg(['NOW SHOWING', 'PIRATES OF THE CARIBBEAN'], { bg:'#fffbe8', fg:'#111', size:30, w:512, h:222 }), x + (b.sx ? 0 : s * 4.52), 4.05, z + (b.sx ? s * 4.52 : 0), b.sx ? (s > 0 ? 0 : Math.PI) : s * Math.PI / 2));
    b.P(8.6, 1.3, sg('LINCOLN', { bg:'#8a1c1c', fg:'#ffe9a8', size:90, w:512, h:78 }), 0, 4.05, 3.02); const [vx, , vz] = b.at(0, 0, .6); D(b.sx ? 1.2 : .5, 7, b.sx ? .5 : 1.2, '#8a1c1c', vx, 5, vz); };
  strip('z', 552, 98, 222, 'e'); strip('z', 568, 98, 222, 'w', { first:[{ w:13 }, { w:11 }, { w:20, h:11, name:'LINCOLN THEATRE', brick:'#b0603a', awn:null, fn:marquee }] });
  strip('z', 552, 290, 392, 'e', { first:[{ w:13 }, { w:15, name:"FISCHER'S RESTAURANT", h:6.6 }] }); strip('z', 568, 290, 392, 'w');
  strip('x', 248, 468, 526, 's'); strip('x', 264, 468, 526, 'n'); strip('x', 248, 594, 644, 's');
  strip('x', 264, 594, 644, 'n', { first:[{ w:50, h:11, name:'BELLEVILLE NEWS-DEMOCRAT', wall:'#c9c2b2', awn:null }] });
  { // St. Clair County Building (modern slab) + lot
    box(46, 25, 30, mat('#cfc9bc'), 498, 0, 150); for(let f = 0; f < 7; f++) D(46.2, 1.5, 30.2, '#2a3a4a', 498, f * 3.4 + 1.6, 150); D(48, 1, 32, '#b9b3a6', 498, 25, 150); D(14, 3.6, 4, '#b9b3a6', 498, 0, 167);
    vp(16, 1.3, sg('ST. CLAIR COUNTY BUILDING', { bg:'#b9b3a6', fg:'#222', size:40, w:512, h:42 }), 498, 4.4, 169.02); mapRect(475, 135, 521, 165, '#8f8a82'); take(472, 132, 524, 170); lot(470, 178, 530, 228, 9); }
  { const b = shop(596, 106, 640, 134, { h:9.5, face:'n', name:'BELLEVILLE CITY HALL', wall:'#d6cdb8', sbg:'#d6cdb8', awn:null }); cyl(.08, 9, mat('#c9c9c9'), 590, 0, 104, 6); D(1.8, 1.1, .04, '#b22234', 591, 7.7, 104); lot(590, 150, 644, 226, 8); }
  { shop(474, 356, 522, 388, { h:7, face:'s', name:'BELLEVILLE PUBLIC LIBRARY', wall:'#b9a98a', sbg:'#b9a98a', awn:null }); lot(470, 292, 530, 346, 7); }
  { // Cathedral of St. Peter
    const st = mat('#b8ae9c'), rf = mat('#5a5f66'), cx = 614; box(20, 15, 56, st, cx, 0, 338); const r1 = new THREE.Mesh(new THREE.BoxGeometry(13.6, .5, 57), rf); r1.position.set(cx - 5.3, 18.2, 338); r1.rotation.z = .72; r1.castShadow = true; const r2 = r1.clone(); r2.position.x = cx + 5.3; r2.rotation.z = -.72; S.add(r1, r2);
    [310, 366].forEach(z => { const g = new THREE.Shape(); g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(0, 8.6); g.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(g), st); m.material.side = THREE.FrontSide; m.position.set(cx, 15, z); if(z < 338) m.rotation.y = Math.PI; S.add(m); });
    box(9, 28, 9, st, cx, 0, 371.5); pyr(9.4, 9.4, 17, rf, cx, 28, 371.5); D(.25, 3, .25, '#d8c060', cx, 45, 371.5); D(1.5, .25, .25, '#d8c060', cx, 46.8, 371.5);
    vp(2.6, 4.4, '#3a2a1e', cx, 2.2, 376.06); const rw = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), mat('#4a3a9a')); rw.position.set(cx, 12, 376.06); S.add(rw);
    for(let z = 316; z <= 360; z += 7.4) [-1, 1].forEach(s => vp(1.5, 7, '#3a4a8a', cx + s * 10.05, 7, z, s * Math.PI / 2));
    board(['CATHEDRAL OF', 'ST. PETER'], 4, 1.4, cx - 16, 1.6, 388, 0, { size:54, bg:'#3a342c' }); mapRect(604, 310, 624, 376, '#b8ae9c'); take(600, 306, 628, 380); lot(630, 300, 643, 384, 4); copse(588, 300, 600, 390, 5); }
  // edge-of-downtown businesses
  { const mm = shop(352, 226, 372, 244, { h:4.4, face:'e', name:'MOTO MART', wall:'#e8e2d0', sbg:'#c8102e', sfg:'#fff', awn:null }); plane(40, 30, mat('#9a9890'), 386, .03, 232); mapRect(366, 217, 406, 247, '#7a7870'); take(346, 214, 408, 250);
    D(20, .6, 10, '#c8102e', 392, 5, 232); [[384, 229], [400, 229], [384, 235], [400, 235]].forEach(([x, z]) => cyl(.25, 5, mat('#ddd'), x, 0, z, 8)); [386, 392, 398].forEach(x => { box(.8, 1.5, 2, mat('#d8d8d8'), x, 0, 232); });
    board(['MOTO MART', 'UNLEADED 1.49'], 3.6, 2.2, 404, 6, 246, 0, { bg:'#c8102e', fg:'#fff', size:70 });
    shop(420, 224, 446, 244, { h:4.6, face:'s', name:"STEAK 'N SHAKE", wall:'#f2f2f2', sbg:'#111', sfg:'#fff', awn:'#111' }); lot(414, 196, 452, 220, 5);
    shop(664, 224, 704, 244, { h:7, face:'s', name:'FIRST NATIONAL BANK', wall:'#c9c2b2', sbg:'#1b3a6a', sfg:'#fff', awn:null }); lot(660, 196, 716, 220, 5);
    shop(664, 268, 712, 292, { h:5.4, face:'n', name:'WALGREENS', wall:'#d8d0c0', sbg:'#f2f2f2', sfg:'#c8102e', awn:null }); lot(660, 298, 720, 322, 6);
    shop(160, 224, 184, 244, { h:4.4, face:'s', name:'WHITE CASTLE', wall:'#f4f4f0', sbg:'#1b3a8a', sfg:'#fff', awn:'#1b3a8a' }); lot(190, 222, 214, 246, 3);
    shop(226, 222, 256, 244, { h:4.6, face:'s', name:"IMO'S PIZZA", brick:'#8c3b2a', sbg:'#c8102e', sfg:'#fff', awn:'#2f5a3a' }); lot(262, 222, 286, 246, 3);
    shop(294, 222, 326, 244, { h:4.6, face:'s', name:"HARDEE'S", wall:'#e2d6be', sbg:'#f2a020', sfg:'#fff', awn:'#c8102e' }); lot(294, 196, 330, 218, 4);
    shop(292, 270, 320, 292, { h:4.4, face:'e', name:'DAIRY QUEEN', wall:'#f2ece0', sbg:'#c8102e', sfg:'#fff', awn:'#c8102e' }); lot(262, 296, 330, 318, 5);
    shop(288, 334, 324, 358, { h:4.8, face:'e', name:'BELLEVILLE PANCAKE HOUSE', brick:'#7a4a3a', awn:'#b8862a' }); lot(262, 364, 330, 388, 6); }

  // ---------- Melvin Price Memorial Park ----------
  { plane(108, 130, rep(M.grass, 18, 22), 400, .03, 329); mapRect(346, 264, 454, 394, '#4f8a3c'); take(346, 264, 454, 394);
    board(['MELVIN PRICE', 'MEMORIAL PARK'], 5, 1.7, 400, 1.6, 267, 0, { size:58 });
    disc(1, mat('#4a8fc0'), 404, .05, 318, 24, 15); disc(1, mat('#3a7a34'), 404, .045, 318, 25.5, 16.5); mapRect(384, 306, 424, 330, '#4a8fc0');
    const pth = mat('#cfc6ad'); plane(2, 110, pth, 372, .045, 329); plane(74, 2, pth, 409, .045, 344); plane(2, 44, pth, 446, .045, 366); plane(76, 2, pth, 409, .045, 386);
    cyl(5.4, .4, mat('#cfc6ad'), 362, 0, 290, 8); G.platforms.push({ x0:357, z0:285, x1:367, z1:295, y:.4 }); for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; cyl(.16, 3, mat('#f3efe4'), 362 + Math.cos(a) * 4.9, .4, 290 + Math.sin(a) * 4.9, 6); } pyr(12, 12, 2.6, '#7a3a2c', 362, 3.4, 290);
    plane(34, 34, mat('#b8905a'), 426, .045, 368).rotation.z = Math.PI / 4; plane(26, 26, rep(M.grass, 4, 4), 426, .05, 368).rotation.z = Math.PI / 4; [[426, 385], [443, 368], [426, 351], [409, 368]].forEach(([x, z]) => plane(1, 1, mat('#f4f4f0'), x, .06, z));
    box(8, 4, .15, mat('#8a8f96'), 426, 0, 391.4); [[380, 300], [392, 340], [418, 300], [432, 336]].forEach(([x, z]) => { D(2.2, .08, .9, '#8a5a32', x, .72, z); D(2.2, .06, .3, '#8a5a32', x, .42, z - .75); D(2.2, .06, .3, '#8a5a32', x, .42, z + .75); [-.9, .9].forEach(dx => D(.08, .72, 1.5, '#555', x + dx, 0, z)); });
    [[352, 272], [352, 330], [350, 388], [384, 276], [436, 272], [450, 300], [448, 340], [396, 352], [384, 380], [412, 280], [440, 320], [362, 350]].forEach(([x, z]) => tree(x, z, 1.2 + rnd() * .4, rnd() < .6)); }

  // ---------- Belle-Clair Fairgrounds ----------
  { mapRect(568, 408, 722, 551, '#b89a6a'); take(566, 406, 724, 554); const dirt = mat('#a8845a'), wh = mat('#ece8dc');
    disc(1, dirt, 662, .04, 484, 56, 62, 40); disc(1, rep(M.grass, 12, 14), 662, .05, 484, 46, 52, 40); mapRect(622, 440, 702, 528, '#4f8a3c');
    box(20, 7, 96, wh, 580, 0, 488); const rr = new THREE.Mesh(new THREE.BoxGeometry(11.6, .4, 97), mat('#7a8a96')); rr.position.set(575.2, 8.6, 488); rr.rotation.z = .3; rr.castShadow = true; const r2 = rr.clone(); r2.position.x = 584.8; r2.rotation.z = -.3; S.add(rr, r2);
    vp(14, 1.6, sg('EXPOSITION HALL', { bg:'#ece8dc', fg:'#8a1c1c', size:54, w:512, h:58 }), 590.06, 4.6, 488, Math.PI / 2);
    for(let i = 0; i < 6; i++) box(1.3, .5 + i * .5, 60, mat(i % 2 ? '#bcbcbc' : '#a8a8a8'), 596 + i * 1.3, 0, 484, { col:i === 5 }); col(595.4, 454, 603.2, 514, 3);
    [[568, 408, 640, 408], [652, 408, 722, 408], [722, 408, 722, 551], [568, 551, 722, 551], [568, 408, 568, 551]].forEach(a => fenceLine(...a, '#e8e2d0', 1.4));
    D(.4, 6, .4, '#8a1c1c', 640, 0, 408); D(.4, 6, .4, '#8a1c1c', 652, 0, 408); const g = new THREE.Mesh(new THREE.BoxGeometry(13, 1.6, .2), sg('BELLE-CLAIR FAIRGROUNDS', { bg:'#8a1c1c', fg:'#ffe9a8', size:38, w:512, h:63 })); g.position.set(646, 6, 408); S.add(g);
    copse(606, 412, 720, 426, 6); copse(700, 540, 722, 552, 2); }

  // ---------- Walnut Hill Cemetery + the wooded lot beside it ----------
  { mapRect(112, -160, 284, -34, '#6f9a58'); take(110, -162, 286, -32); const wall = '#8f8a80';
    [[112, -160, 284, -160], [284, -160, 284, -34], [112, -34, 284, -34], [112, -160, 112, -104], [112, -92, 112, -34]].forEach(a => fenceLine(...a, wall, 1.1));
    plane(170, 3, mat('#bdb7a6'), 198, .04, -98); plane(3, 120, mat('#bdb7a6'), 198, .04, -98); D(.8, 3.4, .8, wall, 112, 0, -104.4); D(.8, 3.4, .8, wall, 112, 0, -91.6);
    const gs = new THREE.Mesh(new THREE.BoxGeometry(.2, 1.1, 12), sg('WALNUT HILL CEMETERY', { bg:'#2a2a2a', fg:'#d8d0b8', size:40, w:512, h:47 })); gs.position.set(112, 3.9, -98); S.add(gs);
    const stone = [mat('#a8a8a4'), mat('#8f8f8a'), mat('#c4c0b6')];
    for(let z = -152; z <= -42; z += 8.5) for(let x = 120; x <= 278; x += 6.5){ if(Math.abs(z + 98) < 5 || Math.abs(x - 198) < 4 || rnd() < .18) continue; const k = rnd() * 3 | 0; D(.9, k ? .9 : 1.5, .22, stone[k], x + rnd() - .5, 0, z); }
    [[130, -150], [170, -120], [240, -146], [262, -70], [150, -50], [216, -60], [270, -112]].forEach(([x, z]) => tree(x, z, 1.5, true));
    [[294, -106, 316, -106], [294, -88, 316, -88], [294, -106, 294, -88], [316, -106, 316, -88]].forEach(a => fenceLine(...a, '#7a5a3a', 3.2)); copse(290, -160, 334, -112, 14, 1.5); copse(290, -82, 334, -14, 16, 1.5); copse(318, -112, 334, -82, 4, 1.4); mapRect(288, -162, 334, -12, '#3f7434'); }

  // ---------- west side: Eckert's orchard, farm fields, Skyview Drive-In ----------
  { const red = mat('#8a2420'), wh = mat('#ece8dc');
    const barn = (x, z, w, d, sign) => { box(w, 5, d, red, x, 0, z); const a = new THREE.Mesh(new THREE.BoxGeometry(w * .62, .3, d + .6), mat('#3a3a3e')); a.position.set(x - w * .26, 5 + w * .16, z); a.rotation.z = .55; a.castShadow = true; const b = a.clone(); b.position.x = x + w * .26; b.rotation.z = -.55; S.add(a, b);
      [-1, 1].forEach(s => { const g = new THREE.Shape(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.lineTo(0, w * .31); g.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(g), red); m.position.set(x, 5, z + s * d / 2); if(s < 0) m.rotation.y = Math.PI; S.add(m); });
      vp(3.4, 3.6, wh, x, 1.8, z + d / 2 + .05); if(sign) vp(w - 2, 1.3, sg(sign, { bg:'#ece8dc', fg:'#8a2420', size:44, w:512, h:Math.round(512 * 1.3 / (w - 2)) }), x, 4.3, z + d / 2 + .06); mapRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, '#8a2420'); take(x - w / 2 - 1, z - d / 2 - 1, x + w / 2 + 1, z + d / 2 + 1); };
    // Eckert's: country store barn, pumpkin patch, apple rows
    barn(-420, -106, 20, 14, "ECKERT'S COUNTRY STORE"); lot(-404, -112, -372, -92, 4); mapRect(-594, -162, -366, -90, '#5f9a48');
    for(let i = 0; i < 26; i++){ const p = new THREE.Mesh(new THREE.SphereGeometry(.34 + rnd() * .2, 7, 5), mat(i % 5 ? '#e8822a' : '#d86a1a')); p.scale.y = .78; p.position.set(-452 + (i % 7) * 2.2 + rnd(), .28, -98 + (i / 7 | 0) * 2 + rnd()); p.castShadow = true; S.add(p); }
    board(['PICK YOUR OWN', 'PUMPKINS + APPLES'], 4.4, 1.5, -446, 1.6, -89, 0, { bg:'#ece8dc', fg:'#8a2420', size:50 });
    for(let z = -156; z <= -124; z += 16) for(let x = -586; x <= -374; x += 15) tree(x, z, .75, false); for(let x = -586; x <= -470; x += 15) tree(x, -100, .75, false); take(-594, -162, -366, -90);
    // corn + harvested fields, farmhouse, barn, silo
    const corn = txMat('corn', (g, w, h) => { noise(g, w, h, '#b89a4a', .25, 2600); g.fillStyle = 'rgba(70,50,10,.35)'; for(let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); }, [1, 1]);
    const stub = txMat('stub', (g, w, h) => { noise(g, w, h, '#8a744a', .22, 2600); g.fillStyle = 'rgba(40,30,10,.3)'; for(let x = 0; x < w; x += 10) g.fillRect(x, 0, 3, h); }, [1, 1]);
    const field = (x0, z0, x1, z1, tall) => { if(tall){ box(x1 - x0, 1.9, z1 - z0, rep(corn, (x1 - x0) / 5, (z1 - z0) / 5), (x0 + x1) / 2, 0, (z0 + z1) / 2); mapRect(x0, z0, x1, z1, '#b89a4a'); } else { plane(x1 - x0, z1 - z0, rep(stub, (x1 - x0) / 6, (z1 - z0) / 6), (x0 + x1) / 2, .03, (z0 + z1) / 2); mapRect(x0, z0, x1, z1, '#8a744a'); } take(x0, z0, x1, z1); };
    BL.house(-582, 60, 'w', 41, { curb:14 }); take(-594, 48, -570, 72); barn(-540, 20, 16, 22); cyl(3.2, 13, mat('#c9c4b8'), -524, 0, 6, 12); { const cap = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9aa0a6')); cap.position.set(-524, 13, 6); S.add(cap); } col(-527, 3, -521, 9, 13); take(-530, 0, -518, 12);
    field(-590, 100, -470, 244, true); field(-460, 100, -370, 244, false); field(-500, -70, -370, 84, true); field(-590, -70, -590 + 60, 0, false);
    field(-590, 276, -488, 392, false); waterTower(-526, 300, 'SWANSEA'); copse(-354, -70, -328, 250, 16);
    // Skyview Drive-In (off N Belt West)
    { const cx = 401, x0 = 348, x1 = 454; plane(x1 - x0, 143, mat('#8f8878'), cx, .03, 479.5); mapRect(x0, 408, x1, 551, '#8f8878'); take(x0 - 2, 406, x1 + 2, 556);
      box(46, 2, 1.2, mat('#6a6a6e'), cx, 0, 545); [-18, -6, 6, 18].forEach(dx => D(.5, 8, .5, '#6a6a6e', cx + dx, 2, 545.6)); D(46, 19, .6, wh, cx, 7, 545); D(47, 19.6, .3, '#2a2a2e', cx, 6.7, 545.5); mapRect(cx - 23, 543, cx + 23, 547, '#f2f2f2');
      for(let z = 440; z <= 520; z += 16) for(let x = x0 + 8; x <= x1 - 8; x += 8){ if(Math.abs(x - cx) < 9 && z > 460 && z < 500) continue; D(.1, 1.3, .1, '#7a7a7e', x, 0, z); D(.26, .32, .2, '#b8b8b8', x, 1.2, z); }
      box(12, 3.4, 8, mat('#d8cdb0'), cx, 0, 480); D(12.6, .3, 8.6, '#8a2420', cx, 3.4, 480); vp(8, 1, sg('SNACK BAR', { bg:'#8a2420', fg:'#ffe9a8', size:60, w:512, h:64 }), cx, 2.7, 475.94, Math.PI);
      box(3, 2.8, 3, mat('#d8cdb0'), cx, 0, 414); D(3.6, .25, 3.6, '#8a2420', cx, 2.8, 414); fenceLine(x0, 408, cx - 8, 408, '#7a5a3a', 2.2); fenceLine(cx + 8, 408, x1, 408, '#7a5a3a', 2.2); fenceLine(x0, 408, x0, 551, '#7a5a3a', 2.2); fenceLine(x1, 408, x1, 551, '#7a5a3a', 2.2); fenceLine(x0, 551, x1, 551, '#7a5a3a', 2.2);
      D(.5, 9, .5, '#2a4a8a', cx + 14, 0, 407); D(.5, 9, .5, '#2a4a8a', cx + 22, 0, 407); board('SKYVIEW DRIVE-IN', 9, 1.6, cx + 18, 8.4, 407, 0, { bg:'#2a4a8a', fg:'#ffe24a', size:50, posts:false });
      board(['SCHOOL OF ROCK  PG-13', 'KILL BILL VOL. 1  R', 'OPEN FRI · SAT · SUN'], 9, 3.2, cx + 18, 5.6, 407, 0, { bg:'#fffbe8', fg:'#111', size:44, posts:false }); }
    // ---------- Swansea (the village north of Schnucks): Wolf Branch School, Schranz Memorial Park, Village Hall + Fire Dept, Memorial Hospital, two courts ----------
    const diamond = (x, z) => { plane(34, 34, mat('#b8905a'), x, .045, z).rotation.z = Math.PI / 4; plane(26, 26, rep(M.grass, 4, 4), x, .05, z).rotation.z = Math.PI / 4; [[0, 17], [17, 0], [0, -17], [-17, 0]].forEach(([a, b]) => plane(1, 1, mat('#f4f4f0'), x + a, .06, z + b)); box(8, 4, .15, mat('#8a8f96'), x, 0, z + 23.4); };
    board(['WELCOME TO', 'SWANSEA', 'A GREAT PLACE TO LIVE'], 6, 2.6, -584, 2.2, 266, 0, { size:50, bg:'#1b3a6a', fg:'#fff' });
    { // Wolf Branch School on Huntwood Road
      shop(-468, 296, -448, 372, { h:5.2, face:'w', name:'WOLF BRANCH SCHOOL', wall:'#c9a878', sbg:'#c9a878', sfg:'#3a2a1e', awn:null, front:false }); shop(-448, 320, -412, 348, { h:5.2, face:'s', wall:'#c9a878', front:false });
      for(let z = 300; z <= 368; z += 6) if(Math.abs(z - 334) > 8) vp(3, 1.6, glassM, -468.06, 2, z, -Math.PI / 2); vp(3, 2.4, '#3a5a8a', -468.08, 1.2, 334, -Math.PI / 2); cyl(.08, 8, mat('#c9c9c9'), -472, 0, 326, 6); D(1.8, 1.1, .04, '#b22234', -471, 6.9, 326);
      lot(-444, 270, -380, 292, 6); plane(40, 24, mat('#55575c'), -392, .03, 372); mapRect(-412, 360, -372, 384, '#55575c'); [-404, -380].forEach(x => { cyl(.09, 3.2, mat('#888'), x, 0, 372, 6); D(1.3, .9, .06, '#f2f2f2', x + (x < -392 ? .6 : -.6), 2.6, 372); });
      [[-438, 300], [-430, 300]].forEach(([x, z]) => { box(2.6, 2.8, 9, mat('#e8b820'), x, .4, z + 4); D(2.64, .7, 8.6, '#26384a', x, 2, z + 4); }); take(-474, 264, -366, 396); mapRect(-474, 264, -366, 396, '#5f9a48'); }
    { // Schranz Memorial Park
      plane(108, 146, rep(M.grass, 18, 24), -420, .03, 479); mapRect(-474, 406, -366, 552, '#4f8a3c'); take(-474, 406, -366, 552); board(['SCHRANZ', 'MEMORIAL PARK'], 5, 1.7, -470, 1.6, 420, Math.PI / 2, { size:58 });
      diamond(-440, 440); diamond(-398, 500); disc(1, mat('#4a8fc0'), -444, .05, 520, 18, 12); disc(1, mat('#3a7a34'), -444, .045, 520, 19.5, 13.5); mapRect(-460, 510, -428, 530, '#4a8fc0');
      cyl(4.6, .4, mat('#cfc6ad'), -392, 0, 430, 8); for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; cyl(.16, 3, mat('#f3efe4'), -392 + Math.cos(a) * 4.1, .4, 430 + Math.sin(a) * 4.1, 6); } pyr(10.5, 10.5, 2.4, '#2f5a3a', -392, 3.4, 430); G.platforms.push({ x0:-396, z0:426, x1:-388, z1:434, y:.4 });
      [[-470, 470], [-468, 540], [-372, 462], [-374, 544], [-416, 546], [-420, 412], [-452, 482], [-380, 414]].forEach(([x, z]) => tree(x, z, 1.2 + rnd() * .4, rnd() < .6)); }
    { // Village Hall + Fire Department on N Illinois
      shop(-344, 268, -304, 290, { h:6.4, face:'n', name:'SWANSEA VILLAGE HALL', wall:'#c9b48a', sbg:'#c9b48a', sfg:'#2a2420', awn:null }); cyl(.08, 9, mat('#c9c9c9'), -348, 0, 266, 6); D(1.8, 1.1, .04, '#b22234', -347, 7.7, 266);
      shop(-296, 268, -258, 292, { h:6, face:'n', name:'SWANSEA FIRE DEPT.', brick:'#8c3b2a', sbg:'#8c3b2a', sfg:'#fff', awn:null, front:false, signY:5.2 }); [-288, -277, -266].forEach(x => { vp(8, 4, '#c8202a', x, 2, 267.94, Math.PI); for(let y = 1; y < 4; y++) vp(8, .06, '#8a1418', x, y, 267.92, Math.PI); });
      lot(-344, 296, -262, 318, 6); }
    { // Memorial Hospital on Frank Scott Parkway
      box(46, 17, 64, mat('#d8d4c8'), -564, 0, 470); for(let f = 0; f < 5; f++) D(46.2, 1.4, 64.2, '#2a3a4a', -564, f * 3.3 + 1.7, 470); D(48, .8, 66, '#b9b3a6', -564, 17, 470); box(14, 4.2, 12, mat('#d8d4c8'), -534, 0, 470); D(16, .5, 16, '#c8202a', -532, 4.2, 470);
      vp(10, 1.1, sg('EMERGENCY', { bg:'#c8202a', fg:'#fff', size:44, w:512, h:56 }), -523.94, 3.5, 470, Math.PI / 2); vp(22, 2.2, sg('MEMORIAL HOSPITAL', { bg:'#d8d4c8', fg:'#1b3a6a', size:40, w:512, h:51 }), -540.94, 14.6, 470, Math.PI / 2);
      board(['H', 'MEMORIAL HOSPITAL'], 4, 2.2, -490, 2, 414, 0, { bg:'#1b3a8a', fg:'#fff', size:70 }); mapRect(-587, 438, -541, 502, '#d8d4c8'); take(-590, 434, -524, 506); lot(-520, 420, -490, 548, 12); lot(-588, 512, -526, 548, 8); copse(-590, 408, -530, 430, 4); }
    { // the two courts, and a lake in the bend of one
      disc(11, rep(M.asphalt, 4, 4), -240, .07, 476, 1, 1, 28); mapRect(-250, 466, -230, 486, '#5a5d63'); take(-252, 464, -228, 488); BL.house(-240, 501, 'n', 77, { curb:14 }); take(-252, 491, -228, 511);
      disc(11, rep(M.asphalt, 4, 4), -200, .07, 324, 1, 1, 28); mapRect(-210, 314, -190, 334, '#5a5d63'); take(-212, 312, -188, 336); BL.house(-200, 299, 's', 78, { curb:14 }); take(-212, 289, -188, 309);
      disc(1, mat('#4a8fc0'), -296, .05, 480, 20, 13); disc(1, mat('#3a7a34'), -296, .045, 480, 21.5, 14.5); mapRect(-314, 468, -278, 492, '#4a8fc0'); take(-318, 465, -274, 495); } }

  // ---------- small landmarks ----------
  waterTower(232, 132, 'BELLEVILLE');
  { // MetroLink line along the north edge + Belleville station
    const tie = txMat('ties', (g, w, h) => { noise(g, w, h, '#8a857a', .2, 2000); g.fillStyle = '#4a3a2a'; for(let x = 0; x < w; x += 16) g.fillRect(x, 6, 7, h - 12); }, [1, 1]);
    box(1440, 1, 9, mat('#8a857a'), 65, 0, -214, { col:false }); plane(1440, 5, rep(tie, 360, 1), 65, 1.02, -214); [-1, 1].forEach(s => D(1440, .16, .14, '#5a5a60', 65, 1.02, -214 + s * .75));
    [[560, 'BELLEVILLE'], [-108, 'SWANSEA']].forEach(([x, nm]) => { box(90, 1.1, 5, mat('#c4c0b6'), x, 0, -206.5); for(let px = x - 36; px <= x + 36; px += 12) D(.3, 3.2, .3, '#2a4a8a', px, 1.1, -205); D(84, .25, 5.4, '#e8e8e8', x, 4.3, -206.4);
      board(nm, 6, 1.1, x, 3.2, -204.6, 0, { bg:'#1b3a8a', fg:'#fff', size:70, posts:false }); board(['M  METROLINK', nm + ' STATION'], 5, 1.7, x + 12, 1.9, -178, 0, { bg:'#1b3a8a', fg:'#fff', size:56 }); lot(x - 60, -200, x + 60, -178, 9); mapRect(x - 45, -209, x + 45, -204, '#c4c0b6'); });
    [540, 565].forEach(x => { D(23, 3.2, 2.7, '#f2f2f2', x, 1.3, -214); D(23.04, .5, 2.74, '#1b3a8a', x, 1.9, -214); D(23.04, .16, 2.74, '#c8102e', x, 1.7, -214); D(21, .9, 2.76, '#26384a', x, 3, -214); });
    mapRect(-655, -219, 785, -209, '#8a857a'); }

  // ---------- houses ----------
  const CH = -80, CA = -170, JA = 90, IL = 256, F1 = 400, S17 = 560, OK = 24;
  // west, north of Illinois
  houses('x', side(CH, -1), -352, -114, 's'); houses('x', side(CH, 1), -352, -114, 'n'); houses('x', side(CA, 1), -352, -114, 'n'); houses('z', side(-360, 1), -56, 248, 'w', { skip:.3 }); houses('z', side(-108, -1), -70, 12, 'e');
  // between Westhaven and Maple, north of Oakmont
  houses('x', side(CH, -1), -100, 92, 's'); houses('x', side(CH, 1), -100, 92, 'n'); houses('x', side(CA, 1), -100, 92, 'n');
  // Oakmont's new east end, Belt East
  houses('x', side(OK, -1), 160, 332, 's'); houses('x', side(OK, 1), 160, 332, 'n'); houses('z', side(340, -1), 66, 190, 'e');
  // east side (older Belleville streets)
  [[344, 456], [464, 556], [564, 646], [654, 726]].forEach(([a, b]) => { houses('x', side(CH, -1), a, b, 's'); houses('x', side(CH, 1), a, b, 'n'); houses('x', side(CA, 1), a, b, 'n'); houses('x', side(JA, -1), a, b, 's'); });
  [358, 442, 478, 542, 578, 632, 668, 712].forEach((x, i) => houses('z', x, -46, 56, i % 2 ? 'e' : 'w', { skip:.25 }));
  houses('z', side(460, -1), 100, 190, 'e'); houses('z', side(650, 1), 100, 190, 'w'); houses('z', side(730, -1), 100, 190, 'e'); houses('z', side(650, 1), 300, 392, 'w'); houses('z', side(730, -1), 330, 392, 'e');
  houses('x', side(F1, 1), 346, 556, 'n'); houses('x', side(S17, -1), 346, 556, 's'); houses('z', side(340, 1), 430, 530, 'w'); houses('z', side(460, -1), 430, 530, 'e'); houses('z', side(460, 1), 430, 530, 'w'); houses('z', side(560, -1), 430, 530, 'e');
  // south: behind the plaza, Westhaven's south end, Swansea streets
  houses('x', side(S17, -1), -98, 334, 's'); houses('z', side(340, -1), 400, 530, 'e'); houses('z', side(-108, 1), 296, 530, 'w');
  houses('x', side(IL, 1), -352, -116, 'n'); houses('x', side(F1, -1), -352, -116, 's'); houses('x', side(F1, 1), -352, -116, 'n'); houses('x', side(S17, -1), -352, -116, 's'); houses('z', side(-108, -1), 300, 370, 'e'); houses('z', side(-360, 1), 300, 370, 'w'); houses('z', side(-360, 1), 440, 520, 'w'); houses('z', side(-240, -1), 406, 470, 'e', { step:28, skip:0 }); houses('z', side(-240, 1), 406, 470, 'w', { step:28, skip:0 }); houses('z', side(-200, -1), 330, 394, 'e', { step:28, skip:0 }); houses('z', side(-200, 1), 330, 394, 'w', { step:28, skip:0 });
  // leftover land: trees
  copse(136, 62, 304, 190, 34, 1.4); copse(-84, 296, -26, 530, 22, 1.3); copse(-94, 480, 250, 520, 14, 1.2); copse(346, -60, 726, 66, 30, 1.2); copse(-352, -142, 92, -110, 22, 1.2); copse(346, -142, 726, -110, 18, 1.2);
  copse(-352, 296, -116, 364, 12, 1.2); copse(-352, 440, -116, 520, 14, 1.2); copse(346, 440, 556, 520, 12, 1.2); copse(660, 100, 722, 190, 6, 1.2); copse(656, 330, 724, 392, 6, 1.2);

  // parked cars in a third of the new driveways (static, so they are merged; the old street keeps its own list)
  (G.driveways || []).splice(d0).forEach((d, i) => { if(i % 3 !== 1) return; const c = makeCar(pick(carC), { suv:i % 4 === 0 }); c.position.set(d.x, 0, d.z); c.rotation.y = d.ry; S.add(c);
    Math.abs(Math.sin(d.ry)) > .7 ? col(d.x - 2.3, d.z - 1, d.x + 2.3, d.z + 1, 1.6) : col(d.x - 1, d.z - 2.3, d.x + 1, d.z + 2.3, 1.6); });
  // ---------- the edge of the map: tree lines + invisible walls ----------
  for(let x = -646; x <= 776; x += 11 + rnd() * 8){ lite(x, 582 + rnd() * 14, 1.1 + rnd() * .7); lite(x + 5, -226 - rnd() * 12, 1.2 + rnd() * .7); if(rnd() < .6) lite(x + 3, 574 + rnd() * 6, .9); }
  for(let z = -206; z <= 580; z += 11 + rnd() * 8){ lite(-628 - rnd() * 14, z, 1.1 + rnd() * .7); lite(752 + rnd() * 14, z, 1.1 + rnd() * .7); if(rnd() < .5) lite(-618 - rnd() * 4, z + 5, .9); }
  col(-660, -212, -650, 612, 12); col(770, -212, 780, 612, 12); col(-660, 602, 780, 612, 12); col(-660, -216, 780, -209.5, 12);
}

// places for the map screen
export const TOWN_PLACES = [['⛲', 'PUBLIC SQUARE', 560, 256], ['🌳', 'PRICE PARK', 400, 330], ['🎪', 'FAIRGROUNDS', 646, 480], ['🎬', 'SKYVIEW DRIVE-IN', 401, 480], ['🏥', 'MEMORIAL HOSPITAL', -556, 470], ['🏫', 'WOLF BRANCH', -440, 334], ['⚾', 'SCHRANZ PARK', -420, 480], ['🚒', 'SWANSEA VILLAGE HALL', -300, 280], ['🚆', 'SWANSEA METRO', -108, -200], ['⛪', 'CATHEDRAL', 614, 340], ['🚆', 'METROLINK', 560, -200], ['🎃', "ECKERT'S", -440, -120], ['🪦', 'WALNUT HILL', 198, -98], ['🏛', 'COUNTY BLDG', 498, 150]];
