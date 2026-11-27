// Back in the 2000s: The Game — the wider town (Draft 2.7), built on real street shapes.
// towndata.js holds street / rail / stream centre lines traced from OpenStreetMap. This file turns them into road ribbons,
// stitches them to the story's own streets (Oakmont, Maple, Westhaven, the plaza's stretch of Illinois, the school's frontage),
// then places the landmarks near where they really are, fills streets with houses and fences the edge of the map.
// Compass: +x = north, +z = east. Nothing here is story canon (world dressing).
import { THREE, G, box, plane, cyl, mat, txMat, noise, label, mapRect, makeCar, lampGlow } from './engine.js';
import * as BL from './buildings.js';
import { ROADS, RAIL, WATER, WORLD, KEEP } from './towndata.js';
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
const board = (t, w, h, x, y, z, ry = 0, o = {}) => { const m = sg(t, { w:512, h:Math.max(48, Math.round(512 * h / w)), size:o.size || 44, bg:o.bg || '#1d4a2a', fg:o.fg || '#f3e9c6' });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, .14), m); b.position.set(x, y, z); b.rotation.y = ry; S.add(b);
  if(o.posts !== false) [-1, 1].forEach(s => D(.16, y, .16, '#5a4632', x + s * Math.cos(ry) * (w / 2 - .2), 0, z - s * Math.sin(ry) * (w / 2 - .2))); return b; };

// ---------- street lines: every drivable street as a centre line (story streets + real ones + the stitches between them) ----------
const P2 = flat => { const o = []; for(let i = 0; i < flat.length; i += 2) o.push([flat[i], flat[i + 1]]); return o; };
export const LINES = [];   // { n, k, p:[[x, z]...] }
const CORE = [['Oakmont Drive', [[-190, 24], [470, 24]]], ['Maple Street', [[100, 28], [100, 252]]], ['Westhaven Road', [[-108, 28], [-108, 252]]], ['N Illinois Street', [[-190, 256], [460, 256]]], ['Frank Scott Parkway West', [[-218, -742], [-218, -518]]]];
export const SQ = { x:0, z:0, r:26 };
// distance from a point to the nearest street centre line (searches a coarse grid of segments)
const SEG = new Map(), SEGW = new Map(), CELL = 48, sk = (i, j) => i + ',' + j;
function addSegs(p, ref, SEG_ = SEG){ const SEG = SEG_; for(let i = 1; i < p.length; i++){ const a = p[i - 1], b = p[i], i0 = Math.floor(Math.min(a[0], b[0]) / CELL), i1 = Math.floor(Math.max(a[0], b[0]) / CELL), j0 = Math.floor(Math.min(a[1], b[1]) / CELL), j1 = Math.floor(Math.max(a[1], b[1]) / CELL);
    for(let u = i0; u <= i1; u++) for(let v = j0; v <= j1; v++){ const k = sk(u, v); if(!SEG.has(k)) SEG.set(k, []); SEG.get(k).push([a[0], a[1], b[0], b[1], ref]); } } }
export function roadNear(x, z, R = 60, SEG_ = SEG){ const SEG = SEG_; let best = R, ref = null, px = x, pz = z; const c = Math.ceil(R / CELL), ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
  for(let u = ci - c; u <= ci + c; u++) for(let v = cj - c; v <= cj + c; v++){ const a = SEG.get(sk(u, v)); if(!a) continue;
    for(const s of a){ const dx = s[2] - s[0], dz = s[3] - s[1], L = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / L)), qx = s[0] + dx * t, qz = s[1] + dz * t, d = Math.hypot(x - qx, z - qz); if(d < best){ best = d; ref = s[4]; px = qx; pz = qz; } } }
  return { d:best, line:ref, x:px, z:pz }; }
G.roadName = (x, z) => { const r = roadNear(x, z, 7); return r.line ? r.line.n : ''; };

// ---------- land bookkeeping ----------
const used = []; let OX = 0, OZ = 0;   // OX/OZ: where the block being built will end up (see block())
const take = (x0, z0, x1, z1) => used.push([x0, z0, x1, z1]);
const free = (x0, z0, x1, z1) => { x0 += OX; x1 += OX; z0 += OZ; z1 += OZ; return !used.some(u => x0 < u[2] && x1 > u[0] && z0 < u[3] && z1 > u[1]); };
const inWorld = (x0, z0, x1, z1, m = 14) => x0 > WORLD.x0 + m && x1 < WORLD.x1 - m && z0 > WORLD.z0 + m && z1 < WORLD.z1 - m;
const offRoad = (x0, z0, x1, z1, gap = 7) => { x0 += OX; x1 += OX; z0 += OZ; z1 += OZ; const sx = Math.max(4, Math.min(9, (x1 - x0) / 2)), sz = Math.max(4, Math.min(9, (z1 - z0) / 2)); for(let x = x0; x <= x1 + .01; x += sx) for(let z = z0; z <= z1 + .01; z += sz) if(roadNear(x, z, gap + 1).d < gap || roadNear(x, z, 8, SEGW).d < 7) return false; return true; };
// build something at the coordinates it was written in, then slide the whole thing by (ox, oz)
function block(ox, oz, fn){ const c0 = S.children.length, k0 = G.colliders.length, p0 = G.platforms.length, m0 = G.mapShapes.length, d0 = (G.driveways || []).length; OX = ox; OZ = oz; fn(); OX = OZ = 0;
  for(let i = c0; i < S.children.length; i++){ S.children[i].position.x += ox; S.children[i].position.z += oz; }
  const mv = r => { r.x0 += ox; r.x1 += ox; r.z0 += oz; r.z1 += oz; }; for(let i = k0; i < G.colliders.length; i++) mv(G.colliders[i]); for(let i = p0; i < G.platforms.length; i++) mv(G.platforms[i]); for(let i = m0; i < G.mapShapes.length; i++) mv(G.mapShapes[i]);
  for(let i = d0; i < (G.driveways || []).length; i++){ G.driveways[i].x += ox; G.driveways[i].z += oz; } }
// the nearest clear w x d patch of land to (nx, nz): off the streets, inside the map, not on anything else
function findSpot(w, d, nx, nz, gap = 8){ for(let r = 0; r <= 560; r += 10){ const n = r ? Math.ceil(2 * Math.PI * r / 14) : 1; for(let i = 0; i < n; i++){ const a = i / n * Math.PI * 2 + r * .37, cx = nx + Math.cos(a) * r, cz = nz + Math.sin(a) * r, x0 = cx - w / 2, z0 = cz - d / 2, x1 = cx + w / 2, z1 = cz + d / 2;
      if(inWorld(x0, z0, x1, z1) && free(x0, z0, x1, z1) && offRoad(x0, z0, x1, z1, gap)) return [Math.round(cx), Math.round(cz)]; } } return null; }
const ZONES = [];   // patches of land kept level: { x0, z0, x1, z1, m (blend distance), lv (height, filled in later) }
const zone = (x0, z0, x1, z1, m = 46) => ZONES.push({ x0, z0, x1, z1, m });
const PLACED = {};   // name -> [x, z] of what got built (for the map screen)
export const placed = () => PLACED;

export function buildTown({ road, tree, M, rep, leafM }){
  const d0 = (G.driveways || []).length, C0 = S.children.length, K0 = G.colliders.length, PL0 = G.platforms.length;
  // ---------- 1. story streets extended to the edge of the old neighbourhood, then stitched to the real network ----------
  road(230, 252, 460, 260, 'N Illinois Street'); road(150, 20, 470, 28, 'Oakmont Drive'); road(-222, -742, -214, -518, 'Frank Scott Parkway West');
  ROADS.forEach(r => LINES.push({ n:r.n, k:r.k, p:P2(r.p) })); LINES.forEach(l => addSegs(l.p, l));
  const stitches = []; for(const [n, port] of [['N Illinois Street', [460, 256]], ['S Illinois Street', [-190, 256]], ['Oakmont Drive', [470, 24]], ['Oakmont Drive', [-190, 24]], ['Frank Scott Parkway West', [-218, -742]], ['Frank Scott Parkway West', [-218, -518]]]){
    const hit = roadNear(port[0], port[1], 260); if(hit.line) stitches.push({ n, k:2, p:[port, [hit.x, hit.z]], stitch:true }); }
  stitches.forEach(l => { LINES.push(l); addSegs(l.p, l); });
  const coreLines = CORE.map(([n, p]) => ({ n, k:n === 'N Illinois Street' ? 0 : 2, p, core:true }));
  take(-198, -32, 160, 56); take(70, 28, 132, 252); take(-116, 28, -100, 252); take(-104, 52, -56, 90); take(-198, 246, 466, 266); take(150, 36, 452, 252); take(140, 12, 476, 36); take(-462, -794, -208, -506); take(282, -118, 328, -78); KEEP.slice(3).forEach(k => take(...k));
  const caps = []; { const onEdge = (x, z) => KEEP.slice(0, 2).some(k => x > k[0] - 2 && x < k[2] + 2 && z > k[1] - 2 && z < k[3] + 2);
    const nearCore = (x, z) => { let b = null; for(const l of coreLines) for(let i = 1; i < l.p.length; i++){ const a = l.p[i - 1], c = l.p[i], dx = c[0] - a[0], dz = c[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if(!b || d < b.d) b = { d, x:qx, z:qz, l }; } return b; };
    for(const l of LINES.slice()){ if(l.stitch) continue; for(const e of [l.p[0], l.p[l.p.length - 1]]){ if(!onEdge(e[0], e[1])) continue; const c = nearCore(e[0], e[1]); let ok = c && c.d < 150 && c.d > 3;
        if(ok) for(let t = .12; t < .9; t += .08){ const x = e[0] + (c.x - e[0]) * t, z = e[1] + (c.z - e[1]) * t; if(!free(x - 5, z - 5, x + 5, z + 5)){ ok = false; break; } }
        if(ok){ const j = { n:l.n || c.l.n, k:Math.max(2, l.k), p:[[e[0], e[1]], [c.x, c.z]], stitch:true }; LINES.push(j); addSegs(j.p, j); } else if(c && c.d > 3) caps.push(e); } } }
  coreLines.forEach(l => addSegs(l.p, l));
  // ---------- 2. road ribbons ----------
  const roadM = txMat('twroad', (g, w, h) => { noise(g, w, h, '#4b4d53', .2, 3400); g.fillStyle = '#e2c444'; g.fillRect(w / 2 - 1.5, 0, 3, h * .5); }, [1, 1]); roadM.map.wrapS = roadM.map.wrapT = THREE.RepeatWrapping;
  const hwyM = txMat('twhwy', (g, w, h) => { noise(g, w, h, '#484a50', .2, 3400); g.fillStyle = '#e2c444'; g.fillRect(w / 2 - 3, 0, 2, h); g.fillRect(w / 2 + 1, 0, 2, h); g.fillStyle = '#e8e8e0'; g.fillRect(w * .25 - 1, 0, 2, h * .5); g.fillRect(w * .75 - 1, 0, 2, h * .5); }, [1, 1]); hwyM.map.wrapS = hwyM.map.wrapT = THREE.RepeatWrapping;
  const walkM = mat('#b4b1a8'), waterM = mat('#4a8fc0'), bankM = mat('#3f7a38');
  const tieM = txMat('twties', (g, w, h) => { noise(g, w, h, '#8a857a', .2, 2000); g.fillStyle = '#4a3a2a'; g.fillRect(6, 0, w - 12, h * .45); g.fillStyle = '#5a5a60'; g.fillRect(w * .28, 0, 3, h); g.fillRect(w * .72 - 3, 0, 3, h); }, [1, 1]); tieM.map.wrapS = tieM.map.wrapT = THREE.RepeatWrapping;
  const dense = p => { const o = [p[0]]; for(let i = 1; i < p.length; i++){ const a = p[i - 1], b = p[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 8)); for(let k = 1; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return o; };
  function ribbon(pts0, hw, y, m, off = 0, vs = 6){ const pts = dense(pts0), n = pts.length, pos = [], uv = [], idx = []; let L = 0;
    for(let i = 0; i < n; i++){ const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], p = pts[i]; let tx = b[0] - a[0], tz = b[1] - a[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl; const nx = -tz, nz = tx; let mt = 1;
      if(i){ L += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); if(i < n - 1){ const ax = p[0] - a[0], az = p[1] - a[1], bx = b[0] - p[0], bz = b[1] - p[1], cs = (ax * bx + az * bz) / ((Math.hypot(ax, az) || 1) * (Math.hypot(bx, bz) || 1)); mt = 1 / Math.max(.55, Math.sqrt(Math.max(0, (1 + cs) / 2))); } }
      const cx = p[0] + nx * off * mt, cz = p[1] + nz * off * mt; pos.push(cx + nx * hw * mt, y, cz + nz * hw * mt, cx - nx * hw * mt, y, cz - nz * hw * mt); uv.push(0, L / vs, 1, L / vs);
      if(i){ const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); } }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals(); const me = new THREE.Mesh(ge, m); me.receiveShadow = true; me.userData.ribbon = true; S.add(me); return me; }
  G.mapLines = [];
  LINES.forEach((l, i) => { const hw = l.k === 0 ? 5 : 4; if(l.k) [-1, 1].forEach(s => ribbon(l.p, 1.2, .014, walkM, s * (hw + 1.3))); ribbon(l.p, hw, .03 + (i % 6) * .004, l.k === 0 ? hwyM : roadM); l.hw = hw; G.mapLines.push({ p:l.p, w:hw * 2, c:l.k === 0 ? '#6a6d74' : '#5a5d63' }); });
  const waterLines = WATER.map(P2); waterLines.forEach(p => { addSegs(p, { n:'' }, SEGW); ribbon(p, 5, .012, bankM); ribbon(p, 3.2, .02, waterM); G.mapLines.push({ p, w:6, c:'#4a8fc0' }); });
  const railLines = RAIL.map(P2); railLines.forEach(p => { addSegs(p, { n:'' }, SEGW); ribbon(p, 2.2, .05, tieM, 0, 2.4); G.mapLines.push({ p, w:3, c:'#8a857a' }); });
  coreLines.forEach(l => l.hw = 4); G.townLines = [...LINES, ...coreLines];
  // junctions: where streets cross or meet. Each gets a plain patch of asphalt and a rule:
  //   'signal' = traffic lights (two big roads), 'stop' = stop signs (the smaller road stops; all-way if they are equals), 'none'.
  // Each arm (a street passing through) is in group 0 (the main road's direction) or group 1 (the cross street).
  { const jm = rep(M.asphalt, 2, 2), TL = G.townLines, segs = [], JS = [], white = new THREE.MeshBasicMaterial({ color:0xe8e8e0 }), stopM = sg('STOP', { bg:'#c8102e', fg:'#fff', size:42, w:128, h:128 }), steel = mat('#70757c'), dark = mat('#1c1e22');
    TL.forEach((l, li) => { let c = 0; for(let k = 1; k < l.p.length; k++){ const L = Math.hypot(l.p[k][0] - l.p[k - 1][0], l.p[k][1] - l.p[k - 1][1]); segs.push([l.p[k - 1][0], l.p[k - 1][1], l.p[k][0], l.p[k][1], li, c, L]); c += L; } l.len = c; });
    const jAt = (x, z) => { let q = JS.find(q => Math.hypot(q.x - x, q.z - z) < 7); if(!q){ q = { x, z, arms:[] }; JS.push(q); } return q; }, arm = (q, li, u) => { if(!q.arms.some(r => r.li === li)) q.arms.push({ li, u }); };
    for(let a0 = 0; a0 < segs.length; a0++){ const a = segs[a0]; for(let b0 = a0 + 1; b0 < segs.length; b0++){ const b = segs[b0]; if(a[4] === b[4]) continue; if(Math.max(a[0], a[2]) < Math.min(b[0], b[2]) - 6 || Math.max(b[0], b[2]) < Math.min(a[0], a[2]) - 6 || Math.max(a[1], a[3]) < Math.min(b[1], b[3]) - 6 || Math.max(b[1], b[3]) < Math.min(a[1], a[3]) - 6) continue;
        const d1x = a[2] - a[0], d1z = a[3] - a[1], d2x = b[2] - b[0], d2z = b[3] - b[1], den = d1x * d2z - d1z * d2x; if(Math.abs(den) < 1e-6) continue; const t = ((b[0] - a[0]) * d2z - (b[1] - a[1]) * d2x) / den, u = ((b[0] - a[0]) * d1z - (b[1] - a[1]) * d1x) / den;
        if(t > -5 / a[6] && t < 1 + 5 / a[6] && u > -5 / b[6] && u < 1 + 5 / b[6]){ const q = jAt(a[0] + d1x * t, a[1] + d1z * t); arm(q, a[4], a[5] + Math.max(0, Math.min(1, t)) * a[6]); arm(q, b[4], b[5] + Math.max(0, Math.min(1, u)) * b[6]); } } }
    const tan = (l, u) => { let c = 0; for(let k = 1; k < l.p.length; k++){ const L = Math.hypot(l.p[k][0] - l.p[k - 1][0], l.p[k][1] - l.p[k - 1][1]); if(u <= c + L + .01 || k === l.p.length - 1) return [(l.p[k][0] - l.p[k - 1][0]) / (L || 1), (l.p[k][1] - l.p[k - 1][1]) / (L || 1)]; c += L; } return [1, 0]; };
    for(const q of JS){ const big = q.arms.some(r => TL[r.li].k === 0); disc(big ? 7.6 : 6.4, jm, q.x, .062, q.z, 1, 1, 18).userData.flat = true; q.type = 'none';
      if(Math.hypot(q.x - SQ.x, q.z - SQ.z) < 46) continue;
      q.arms.forEach(r => { r.t = tan(TL[r.li], r.u); r.k = TL[r.li].k; }); const main = q.arms.slice().sort((a, b) => a.k - b.k || TL[b.li].len - TL[a.li].len)[0];
      q.arms.forEach(r => { r.g = Math.abs(r.t[0] * main.t[0] + r.t[1] * main.t[1]) > .8 ? 0 : 1; }); if(!q.arms.some(r => r.g === 1)) continue;
      const kA = Math.min(...q.arms.filter(r => !r.g).map(r => r.k)), kB = Math.min(...q.arms.filter(r => r.g).map(r => r.k));
      q.type = (kA <= 1 && kB <= 1) || (kA === 0 && kB <= 2) ? 'signal' : 'stop'; q.arms.forEach(r => { r.stop = q.type === 'stop' && (kA === kB || r.g === 1); }); q.heads = [];
      for(const r of q.arms){ const l = TL[r.li], hw = l.hw || 4; for(const dir of [1, -1]){ if(dir > 0 ? r.u < 9 : l.len - r.u < 9) continue;                       // no traffic arrives from a side the street does not have
          const dx = r.t[0] * dir, dz = r.t[1] * dir, rx = -dz, rz = dx, px = q.x - dx * 8.6 + rx * (hw + 2.3), pz = q.z - dz * 8.6 + rz * (hw + 2.3), ry = Math.atan2(-dx, -dz);
          if(q.type === 'signal' || r.stop){ const cx = q.x - dx * 7.4 + rx * hw / 2, cz = q.z - dz * 7.4 + rz * hw / 2; ribbon([[cx - rx * hw / 2, cz - rz * hw / 2], [cx + rx * hw / 2, cz + rz * hw / 2]], .22, .068, white); }
          if(q.type === 'signal'){ cyl(.11, 5.4, steel, px, 0, pz, 8); const hd = new THREE.Mesh(new THREE.BoxGeometry(.46, 1.36, .34), dark); hd.position.set(px - rx * .5, 4.6, pz - rz * .5); hd.rotation.y = ry; hd.castShadow = true; S.add(hd); D(.9, .1, .1, steel, px - rx * .25, 5.2, pz - rz * .25).rotation.y = ry;
            q.heads.push({ x:px - rx * .5 - dx * .19, z:pz - rz * .5 - dz * .19, y:4.6, ry, g:r.g }); }
          else if(r.stop){ cyl(.05, 2.4, mat('#888'), px, 0, pz, 6); const o = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .04, 8), stopM); o.rotation.order = 'YXZ'; o.rotation.set(Math.PI / 2, ry, Math.PI / 8); o.position.set(px, 2.5, pz); S.add(o); G.colliders.push({ x0:px - .1, x1:px + .1, z0:pz - .1, z1:pz + .1, y0:0, y1:2.6 }); } } } }
    caps.forEach(e => { if(JS.some(q => Math.hypot(q.x - e[0], q.z - e[1]) < 9)) return; disc(8.5, jm, e[0], .062, e[1], 1, 1, 18).userData.flat = true; G.mapShapes.push({ x0:e[0] - 6, z0:e[1] - 6, x1:e[0] + 6, z1:e[1] + 6, c:'#5a5d63' }); });
    G.junctions = JS; }
  ZONES.push({ x0:-205, z0:-50, x1:480, z1:270, m:110, lv:0 }, { x0:-470, z0:-800, x1:-200, z1:-500, m:90, lv:0 }, { x0:278, z0:-124, x1:334, z1:-72, m:40, lv:0 }, { x0:330, z0:-900, x1:900, z1:-300, m:60, lv:0 });

  // ---------- generic pieces ----------
  let seedN = 100;
  const yardTree = (x, z) => { if(free(x - 1, z - 1, x + 1, z + 1) && roadNear(x + OX, z + OZ, 8).d >= 7) tree(x, z, .9 + rnd() * .5, rnd() < .55); };
  const glassM = mat('#26384a'), shopGlass = mat('#4a6880'), paveM = mat('#b4b0a6'), pave = (x0, z0, x1, z1) => plane(x1 - x0, z1 - z0, paveM, (x0 + x1) / 2, .035, (z0 + z1) / 2), AWN = ['#8a2a2a', '#2a4a7a', '#2f5a3a', '#5a3a6a', '#b8862a', '#333'], BR = ['#8c3b2a', '#7a4a3a', '#a0522d', '#6e3b2e', '#b0603a', '#8a6a4a'];
  function shop(x0, z0, x1, z1, o = {}){ if(!o.force && (!free(x0, z0, x1, z1) || !offRoad(x0, z0, x1, z1, 6))) return null; const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = o.h || 5, f = o.face || 's', sx = f === 'e' ? 1 : f === 'w' ? -1 : 0, sz = f === 's' ? 1 : f === 'n' ? -1 : 0, len = sx ? d : w;
    const wall = o.wall ? mat(o.wall) : BL.brickM(o.brick || pick(BR), '#c9bba5', [Math.max(2, Math.round(len / 4)), Math.max(1, Math.round(h / 2.6))], 'tn');
    const at = (u, y, off) => sx ? [cx + sx * (w / 2 + off), y, cz + u] : [cx + u, y, cz + sz * (d / 2 + off)], ry = RY[f];
    const P = (pw, ph, m, u, y, off) => vp(pw, ph, m, ...at(u, y, off), ry);
    // ---- walk-in shops (o.inside = 'store' | 'diner' | 'bank'): a hollow shell with an open doorway, lit from inside, furnished by kind ----
    const ins = o.inside, du = o.doorU ?? -len / 4, dep = sx ? w : d, a0 = -len / 2, a1 = len / 2, rf = RY[f], uL = sx ? 0 : Math.PI / 2;
    const loc = (u, v) => sx ? [cx + sx * (w / 2 - v), cz + u] : [cx + u, cz + sz * (d / 2 - v)];          // u = along the shop front, v = metres in from the front wall
    const F = (lu, hh, lv, c, u, y, v, co) => { const [x, z] = loc(u, v); return box(sx ? lv : lu, hh, sx ? lu : lv, C(c), x, y, z, { col:!!co }); };
    const IW = (pw, ph, m, u, y, v, ry) => { const [x, z] = loc(u, v); return vp(pw, ph, m, x, y, z, ry); };
    if(!ins) box(w, h, d, wall, cx, 0, cz);
    else { const TH = .35, dk = (c, e = .5) => mat(c, { emissive:new THREE.Color(c).multiplyScalar(e).getHex() }), inM = dk('#e6e1d4', .46), winM = dk('#bcd6ea', .8), steel = dk('#aeb4ba'), wood = dk('#7a5a3c'), lightM = mat('#ffffff', { emissive:0xffffff });
      F(len, h, TH, wall, 0, 0, dep - TH / 2, 1); F(TH, h, dep, wall, a0 + TH / 2, 0, dep / 2, 1); F(TH, h, dep, wall, a1 - TH / 2, 0, dep / 2, 1);
      F(du - .85 - a0, h, TH, wall, (a0 + du - .85) / 2, 0, TH / 2, 1); F(a1 - du - .85, h, TH, wall, (a1 + du + .85) / 2, 0, TH / 2, 1); F(1.7, h - 2.4, TH, wall, du, 2.4, TH / 2, 0);
      IW(len - 2 * TH, h, inM, 0, h / 2, dep - TH - .02, rf); IW(dep - 2 * TH, h, inM, a0 + TH + .02, h / 2, dep / 2, uL); IW(dep - 2 * TH, h, inM, a1 - TH - .02, h / 2, dep / 2, uL + Math.PI);
      [[a0 + TH, du - .85], [du + .85, a1 - TH]].forEach(([p, q]) => { IW(q - p, h, inM, (p + q) / 2, h / 2, TH + .02, rf + Math.PI); if(q - p > 3){ IW(q - p - 1.6, 1.9, winM, (p + q) / 2, 1.5, TH + .04, rf + Math.PI); P(q - p - 1.2, 2.2, shopGlass, (p + q) / 2, 1.4, .04); } });
      IW(1.7, h - 2.4, inM, du, (h + 2.4) / 2, TH + .02, rf + Math.PI);
      const fl = { store:'#aeb9bd', diner:'#a8744e', bank:'#5a3f3a' }[ins]; plane(w - .6, d - .6, dk(fl, .42), cx, .04, cz);
      { const cl = new THREE.Mesh(new THREE.PlaneGeometry(w - .6, d - .6), dk('#efede6', .6)); cl.rotation.x = Math.PI / 2; cl.position.set(cx, h - .03, cz); S.add(cl); }
      for(let u = a0 + 3; u < a1 - 2; u += 5) for(let v = 3; v < dep - 2; v += 5) F(1.6, .06, .5, lightM, u, h - .1, v);
      let spot, clerk; const bo = [];
      if(ins === 'store'){ const cu = a1 - 2.7; F(.9, 1, 4.6, wood, cu, 0, 4, 1); F(.5, .35, .5, dk('#3a3a40'), cu, 1, 3.2); F(.6, .5, .3, dk('#c8102e'), cu, 1, 5.2); spot = [cu - 1.3, 4]; clerk = [cu + 1.2, 4];
        const cols = o.cols || ['#c8102e', '#f2c230', '#2f6fb8', '#3f9a54', '#e87a2a', '#8a4ab0', '#f2f2f2']; let n = 0;
        for(let u = a0 + 3.2; u < cu - 4; u += 3.4){ const v0 = 3.4, v1 = dep - 4.2, vm = (v0 + v1) / 2; F(1, 1.75, v1 - v0, dk('#d8d4c8'), u, 0, vm, 1); for(let k = 0; k < 3; k++) for(let v = v0 + .2; v < v1 - 1.3; v += 1.45) F(1.08, .3, 1.3, dk(cols[(n += 3) % cols.length]), u, .28 + k * .5, v + .65); F(1.2, .5, .9, dk(cols[n++ % cols.length]), u, 0, v0 - .7); }
        if(!o.noCool){ F(len - 7, 2.2, .8, dk('#dfe6ea'), -2, 0, dep - TH - .42, 1); IW(len - 7.4, 1.7, winM, -2, 1.15, dep - TH - .84, rf + Math.PI); for(let u = a0 + 2; u < a1 - 6; u += 1.5) F(.08, 2.2, .06, steel, u, 0, dep - TH - .86); }
        IW(Math.min(8, len - 8), .9, sg(o.inSign || (/WALG/.test(o.name) ? 'PHARMACY' : 'COLD DRINKS'), { bg:o.sbg || '#c8102e', fg:o.sfg || '#fff', size:58, w:512, h:76 }), -2, 2.9, dep - TH - .86, rf + Math.PI); }
      else if(ins === 'diner'){ const cv = dep - 4.4; F(len - 5, 1.05, .9, dk('#c9c4b8'), 0, 0, cv, 1); F(len - 5, .06, 1, dk(o.sbg || '#c8102e'), 0, 1.05, cv); F(.5, .35, .5, dk('#3a3a40'), 1.5, 1.11, cv); F(len - 3, .95, .8, steel, 0, 0, dep - TH - .45, 1); F(1.2, 1.5, .7, steel, a0 + 2.2, .95, dep - TH - .45);
        IW(Math.min(10, len - 6), 1.1, sg('MENU', { bg:'#1c1c1c', fg:'#f2e9c8', size:70, w:512, h:76 }), 0, 3, dep - TH - .04, rf + Math.PI); spot = [0, cv - 1.3]; clerk = [0, cv + 1.2];
        const seat = dk(o.awn || o.sbg || '#b23a3a'), top = dk('#e8e2d2');
        for(const side of [a0 + TH + 1, a1 - TH - 1]) for(let v = 2.6; v < cv - 2.6; v += 3.3){ if(Math.abs(side - du) < 2.4 && v < 3.4) continue; bo.push({ t:loc(side, v), a:loc(side, v - 1), b:loc(side, v + 1), side:Math.sign(side) }); F(1.6, .07, .95, top, side, .72, v); F(.14, .72, .14, steel, side, 0, v); for(const s of [-1, 1]){ F(1.6, .46, .5, seat, side, 0, v + s * 1, 1); F(1.6, .6, .12, seat, side, .46, v + s * 1.2); } }
        if(len > 22) for(let u = -4; u <= 4; u += 8) for(let v = 3.2; v < cv - 3; v += 3.4){ F(1, .07, 1, top, u, .72, v); F(.14, .72, .14, steel, u, 0, v, 1); for(const s of [-1, 1]) F(.42, .46, .42, seat, u + s * .95, 0, v); } }
      else { const cv = dep - 5.2; F(len - 7, 1.15, 1, wood, -1, 0, cv, 1); F(len - 7, .05, 1.1, dk('#c8b060'), -1, 1.15, cv); for(let u = a0 + 4; u < a1 - 6; u += 3.2) F(.08, 1, .08, dk('#c8b060'), u, 1.2, cv); spot = [-1, cv - 1.4]; clerk = [-1, cv + 1.3];
        F(2.8, 2.9, .22, steel, a1 - 4, 0, dep - TH - .14); F(1, 1, .1, dk('#c8b060'), a1 - 4, 1, dep - TH - .3); F(.16, .16, .3, dk('#3a3a40'), a1 - 4, 1.42, dep - TH - .4);
        for(const v of [3, 6.2]){ F(1.9, .76, .95, wood, a0 + 3, 0, v, 1); F(.5, .5, .5, dk('#2f4a6a'), a0 + 1.4, 0, v); F(.5, .5, .5, dk('#2f4a6a'), a0 + 4.8, 0, v); }
        for(const u of [-3.5, 1.5]) for(const v of [cv - 3.2, cv - 5.6]) cyl(.05, 1, C(dk('#c8b060')), ...((p) => [p[0], 0, p[1]])(loc(u, v)), 8);
        IW(6, .8, sg(o.inSign || 'FIRST NATIONAL', { bg:'#1b3a6a', fg:'#fff', size:54, w:512, h:68 }), -1, 3.4, dep - TH - .04, rf + Math.PI); }
      const [sxw, szw] = loc(spot[0], spot[1]), [cxw, czw] = loc(clerk[0], clerk[1]); (G.shops = G.shops || []).push({ name:Array.isArray(o.name) ? o.name.join(' ') : o.name, kind:ins, at:[sxw, szw], clerk:[cxw, czw], face:Math.atan2(sxw - cxw, szw - czw), x0, z0, x1, z1, booths:bo, door:loc(du, -2.5), out:loc(du + (du < 0 ? 7 : -7), -8.5), along:Math.atan2(...((a, b) => [b[0] - a[0], b[1] - a[1]])(loc(0, 0), loc(1, 0))) }); }
    D(w + .5, .45, d + .5, o.trim || '#d8d2c4', cx, h, cz);
    if(o.front !== false && !ins){ P(len - 2.2, 2.2, shopGlass, 0, 1.4, .04); for(let u = -len / 2 + 4.1; u < len / 2 - 2; u += 3) P(.14, 2.2, '#2a2a2e', u, 1.4, .05); P(1.3, 2.3, o.door || '#3a2a1e', o.doorU ?? -len / 4, 1.15, .06);
    }
    if(o.front !== false && o.awn){ const [ax2, , az2] = at(0, 0, .75); D(sx ? 1.5 : len - 1, .14, sx ? len - 1 : 1.5, o.awn, ax2, 2.75, az2); }
    for(let fl = 1; fl < Math.floor(h / 3.2); fl++) for(let u = -len / 2 + 1.7; u <= len / 2 - 1.7 + .01; u += 2.7) P(1.2, 1.6, glassM, u, fl * 3.2 + 1.55, .04);
    if(o.name){ const sw = Math.max(3.6, Math.min(len - 1, (Array.isArray(o.name) ? Math.max(...o.name.map(t => t.length)) : o.name.length) * .5 + 1.4)), sh = Array.isArray(o.name) ? 1.7 : 1, hp = Math.round(512 * sh / sw);
      P(sw, sh, sg(o.name, { bg:o.sbg || '#f2ecd8', fg:o.sfg || '#2a2420', size:Math.round(Math.min(64, hp * (Array.isArray(o.name) ? .4 : .76))), w:512, h:hp }), 0, Math.min(h - .7, o.signY || 3.75), .09); }
    mapRect(x0, z0, x1, z1, o.mc || '#a3968a'); take(x0 - 1 + OX, z0 - 1 + OZ, x1 + 1 + OX, z1 + 1 + OZ); return { cx, cz, at, P, len, ry, sx, sz }; }
  const lineM = new THREE.MeshBasicMaterial({ color:0xe4e4dc }), carC = ['#a33', '#335', '#ddd', '#2a6a3a', '#888', '#d8b84a', '#222', '#6a2a6a', '#1a3a6a', '#c8c0b0'];
  function lot(x0, z0, x1, z1, n = 4, o = {}){ if(!o.force && (!free(x0, z0, x1, z1) || !offRoad(x0, z0, x1, z1, 5))) return; plane(x1 - x0, z1 - z0, rep(M.asphalt, (x1 - x0) / 6, (z1 - z0) / 6), (x0 + x1) / 2, .025, (z0 + z1) / 2); mapRect(x0, z0, x1, z1, '#4c4f55'); take(x0 + OX, z0 + OZ, x1 + OX, z1 + OZ);
    const alongX = x1 - x0 >= z1 - z0, rows = alongX ? [z0 + 3.2, z1 - 3.2] : [x0 + 3.2, x1 - 3.2], a0 = (alongX ? x0 : z0) + 2, a1 = (alongX ? x1 : z1) - 2, spots = [];
    rows.forEach(r => { for(let a = a0; a <= a1; a += 2.9){ alongX ? plane(.12, 5, lineM, a, .04, r) : plane(5, .12, lineM, r, .04, a); if(a + 2.9 <= a1) spots.push([a + 1.45, r]); } });
    for(let i = 0; i < n && spots.length; i++){ const [a, r] = spots.splice(rnd() * spots.length | 0, 1)[0], x = alongX ? a : r, z = alongX ? r : a, c = makeCar(pick(carC), { suv:rnd() < .25 }); c.position.set(x, 0, z); c.rotation.y = alongX ? (rnd() < .5 ? 0 : Math.PI) : Math.PI / 2; S.add(c);
      alongX ? col(x - 1, z - 2.3, x + 1, z + 2.3, 1.6) : col(x - 2.3, z - 1, x + 2.3, z + 1, 1.6); } }
  const NAMES = ['MAIN ST. BARBER', 'RECORDS + CDs', 'COMICS & CARDS', 'TUXEDO RENTAL', 'JEWELERS', 'SHOE REPAIR', 'ANTIQUES', 'CAFE', 'TAVERN', 'PAWN', 'INSURANCE', 'LAW OFFICES', 'DINER', 'BAKERY', 'HARDWARE', 'FURNITURE', '1 HR PHOTO', 'CELLULAR + PAGERS', 'INTERNET CAFE', 'GUITARS', 'BRIDAL', 'TRAVEL AGENCY', 'FLORIST', 'USED BOOKS', 'DANCE STUDIO', 'TV + VCR REPAIR', 'PIZZA', 'OPTICAL', 'DRY CLEANERS', 'VACUUMS']; let ni = 0;
  function strip(ax, front, a0, a1, face, o = {}){ const d = o.d || 14, first = (o.first || []).slice(); let a = a0;
    while(a < a1 - 5){ const sp = first.shift(); let w = sp ? sp.w : 9 + (rnd() * 4 | 0) * 2; if(a + w > a1 || a1 - a - w < 7) w = a1 - a;
      const r = ax === 'x' ? (face === 's' ? [a, front - d, a + w, front] : [a, front, a + w, front + d]) : (face === 'e' ? [front - d, a, front, a + w] : [front, a, front + d, a + w]);
      const b = shop(...r, { h:(sp && sp.h) || 6.6 + (rnd() * 3 | 0) * 2.2, face, name:(sp && sp.name) || NAMES[ni++ % NAMES.length], awn:pick(AWN), ...(sp || {}) });
      if(b){ ax === 'x' ? pave(a, face === 's' ? front : front - 2.2, a + w, face === 's' ? front + 2.2 : front) : pave(face === 'e' ? front : front - 2.2, a, face === 'e' ? front + 2.2 : front, a + w); if(sp && sp.fn) sp.fn(b); } a += w; } }
  const lite = (x, z, s = 1) => { cyl(.2 * s, 3.4 * s, mat('#5a3d22'), x, 0, z, 5); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3 * s, 0), leafM[rnd() * 5 | 0]); l.position.set(x, 4.6 * s, z); l.scale.y = 1.25; l.rotation.y = rnd() * 3; l.castShadow = true; S.add(l); };
  const fenceLine = (x0, z0, x1, z1, c = '#8a8f96', h = 1.6) => { box(Math.abs(x1 - x0) + .1, h, Math.abs(z1 - z0) + .1, mat(c), (x0 + x1) / 2, 0, (z0 + z1) / 2); };
  const lamp = (x, z) => { cyl(.08, 5, mat('#4a4a4a'), x, 0, z, 6); const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .9), G.lampM); b.position.set(x, 5.05, z); S.add(b); lampGlow(x, z, 8); };
  const waterTower = (name, nx, nz) => { const sp = findSpot(14, 14, nx, nz); if(!sp) return; const [x, z] = sp, st = mat('#c9d2d8'); [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, b]) => cyl(.3, 20, st, x + a, 0, z + b, 6)); cyl(.5, 20, st, x, 0, z, 8);
    const tk = new THREE.Mesh(new THREE.SphereGeometry(6.5, 16, 10), mat('#dfe6ea')); tk.scale.y = .62; tk.position.set(x, 23, z); tk.castShadow = true; S.add(tk);
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(ry => vp(7, 1.5, sg(name, { bg:'#dfe6ea', fg:'#1b3a6a', size:70, w:512, h:110 }), x + Math.sin(ry) * 6.56, 23, z + Math.cos(ry) * 6.56, ry)); col(x - 3.4, z - 3.4, x + 3.4, z + 3.4, 20); take(x - 6, z - 6, x + 6, z + 6); zone(x - 6, z - 6, x + 6, z + 6, 20); mapRect(x - 4, z - 4, x + 4, z + 4, '#c9d2d8'); };
  // place a block written around (cx, cz) with footprint w x d near (nx, nz)
  const put = (name, cx, cz, w, d, nx, nz, fn, gap) => { const sp = findSpot(w, d, nx, nz, gap); if(!sp){ console.warn('no room for', name); return null; } block(sp[0] - cx, sp[1] - cz, fn); take(sp[0] - w / 2, sp[1] - d / 2, sp[0] + w / 2, sp[1] + d / 2); zone(sp[0] - w / 2, sp[1] - d / 2, sp[0] + w / 2, sp[1] + d / 2); PLACED[name] = sp; return sp; };

  // ---------- 3. the Public Square: where Main Street meets Illinois Street ----------
  { let best = null; const ill = LINES.filter(m => /Illinois/.test(m.n)); for(const l of LINES) if(/Main Street/.test(l.n)) for(const p of l.p) for(const m of ill) for(const q of m.p){ const dd = Math.hypot(p[0] - q[0], p[1] - q[1]); if(!best || dd < best.d) best = { d:dd, x:(p[0] + q[0]) / 2, z:(p[1] + q[1]) / 2 }; }
    if(best && best.d < 60){ SQ.x = Math.round(best.x); SQ.z = Math.round(best.z); } else { SQ.x = -426; SQ.z = 252; } G.SQ = SQ; PLACED['PUBLIC SQUARE'] = [SQ.x, SQ.z]; zone(SQ.x - 100, SQ.z - 165, SQ.x + 170, SQ.z + 140, 60);
    block(SQ.x - 560, SQ.z - 256, () => { const x = 560, z = 256; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => pave(x + (a < 0 ? -36 : 6.4), z + (b < 0 ? -36 : 6.4), x + (a < 0 ? -6.4 : 36), z + (b < 0 ? -6.4 : 36)));
      disc(30, rep(M.asphalt, 10, 10), x, .075, z, 1, 1, 48); mapRect(x - 28, z - 28, x + 28, z + 28, '#5a5d63');
      for(let q = 0; q < 4; q++){ const r = new THREE.Mesh(new THREE.RingGeometry(30, 33.5, 16, 1, q * Math.PI / 2 + .22, Math.PI / 2 - .44), M.walk); r.rotation.x = -Math.PI / 2; r.position.set(x, .08, z); r.receiveShadow = true; S.add(r); }
      cyl(11, .3, mat('#c4c0b6'), x, 0, z, 32); cyl(10.2, .36, mat('#5a9440'), x, 0, z, 32); cyl(5.2, .9, mat('#b8b4aa'), x, 0, z, 20); cyl(4.7, .96, mat('#5aa8d8'), x, 0, z, 20);
      cyl(.8, 3, mat('#a8a49a'), x, 0, z, 10); cyl(.4, .5, mat('#a8a49a'), x, 3, z, 12, 2.4); cyl(2.2, .12, mat('#7cc0e8'), x, 3.5, z, 14); cyl(.35, 1.6, mat('#a8a49a'), x, 3.5, z, 8); cyl(.2, .3, mat('#a8a49a'), x, 5.1, z, 10, 1.1); cyl(.1, 1.4, mat('#cfe6f4'), x, 5.3, z, 6);
      [[1, 1, '#b22234'], [-1, 1, '#f2f2f2'], [1, -1, '#1b3a8a'], [-1, -1, '#b22234']].forEach(([a, b, c]) => { cyl(.07, 7, mat('#c9c9c9'), x + a * 6.6, .3, z + b * 6.6, 6); D(1.6, .95, .04, c, x + a * 6.6 + .85, 6.2, z + b * 6.6); });
      board(['VETERANS MEMORIAL FOUNTAIN', 'BELLEVILLE PUBLIC SQUARE'], 4.4, 1, x, 1.1, z + 9.2, 0, { size:30, bg:'#3a342c' });
      col(x - 8, z - 8, x + 8, z + 8, 2); col(x - 10.4, z - 3.6, x + 10.4, z + 3.6, 2); col(x - 3.6, z - 10.4, x + 3.6, z + 10.4, 2); mapRect(x - 9, z - 9, x + 9, z + 9, '#4f8a3c'); mapRect(x - 4, z - 4, x + 4, z + 4, '#5aa8d8');
      [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => lamp(x + a * 25, z + b * 25)); take(524 + OX, 220 + OZ, 596 + OX, 292 + OZ);
      // downtown rows (a building is skipped if a real street runs through its plot)
      const marquee = b => { const [mx, , mz] = b.at(0, 0, 1.5); D(b.sx ? 3 : 9, 1.5, b.sx ? 9 : 3, '#e8dcc0', mx, 3.3, mz);
        [-1, 1].forEach(s => vp(3, 1.3, sg(['NOW SHOWING', 'PIRATES OF THE CARIBBEAN'], { bg:'#fffbe8', fg:'#111', size:30, w:512, h:222 }), mx + (b.sx ? 0 : s * 4.52), 4.05, mz + (b.sx ? s * 4.52 : 0), b.sx ? (s > 0 ? 0 : Math.PI) : s * Math.PI / 2));
        b.P(8.6, 1.3, sg('LINCOLN', { bg:'#8a1c1c', fg:'#ffe9a8', size:90, w:512, h:78 }), 0, 4.05, 3.02); const [vx, , vz] = b.at(0, 0, .6); D(b.sx ? 1.2 : .5, 7, b.sx ? .5 : 1.2, '#8a1c1c', vx, 5, vz); };
      strip('z', 552, 98, 222, 'e'); strip('z', 568, 98, 222, 'w', { first:[{ w:13 }, { w:11 }, { w:20, h:11, name:'LINCOLN THEATRE', brick:'#b0603a', awn:null, fn:marquee }] });
      strip('z', 552, 290, 392, 'e', { first:[{ w:13 }, { w:15, name:"FISCHER'S RESTAURANT", h:6.6 }] }); strip('z', 568, 290, 392, 'w');
      strip('x', 248, 468, 526, 's'); strip('x', 264, 468, 526, 'n'); strip('x', 248, 594, 644, 's'); strip('x', 264, 594, 644, 'n', { first:[{ w:50, h:11, name:'BELLEVILLE NEWS-DEMOCRAT', wall:'#c9c2b2', awn:null }] });
      if(free(472, 132, 524, 170) && offRoad(472, 132, 524, 170)){ box(46, 25, 30, mat('#cfc9bc'), 498, 0, 150); for(let f = 0; f < 7; f++) D(46.2, 1.5, 30.2, '#2a3a4a', 498, f * 3.4 + 1.6, 150); D(48, 1, 32, '#b9b3a6', 498, 25, 150); D(14, 3.6, 4, '#b9b3a6', 498, 0, 167);
        vp(16, 1.3, sg('ST. CLAIR COUNTY BUILDING', { bg:'#b9b3a6', fg:'#222', size:40, w:512, h:42 }), 498, 4.4, 169.02); mapRect(475, 135, 521, 165, '#8f8a82'); take(472 + OX, 132 + OZ, 524 + OX, 170 + OZ); lot(470, 178, 530, 228, 9); PLACED['COUNTY BLDG'] = [498 + OX, 150 + OZ]; }
      shop(596, 106, 640, 134, { h:9.5, face:'n', name:'BELLEVILLE CITY HALL', wall:'#d6cdb8', sbg:'#d6cdb8', awn:null }); lot(590, 150, 644, 226, 8);
      shop(474, 356, 522, 388, { h:7, face:'s', name:'BELLEVILLE PUBLIC LIBRARY', wall:'#b9a98a', sbg:'#b9a98a', awn:null }); lot(470, 292, 530, 346, 7);
      if(free(600, 306, 628, 380) && offRoad(600, 306, 628, 380)){ const st = mat('#b8ae9c'), rf = mat('#5a5f66'), cx = 614; box(20, 15, 56, st, cx, 0, 338); const r1 = new THREE.Mesh(new THREE.BoxGeometry(13.6, .5, 57), rf); r1.position.set(cx - 5.3, 18.2, 338); r1.rotation.z = .72; r1.castShadow = true; const r2 = r1.clone(); r2.position.x = cx + 5.3; r2.rotation.z = -.72; S.add(r1, r2);
        [310, 366].forEach(zz => { const g = new THREE.Shape(); g.moveTo(-10, 0); g.lineTo(10, 0); g.lineTo(0, 8.6); g.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(g), st); m.position.set(cx, 15, zz); if(zz < 338) m.rotation.y = Math.PI; S.add(m); });
        box(9, 28, 9, st, cx, 0, 371.5); pyr(9.4, 9.4, 17, rf, cx, 28, 371.5); D(.25, 3, .25, '#d8c060', cx, 45, 371.5); D(1.5, .25, .25, '#d8c060', cx, 46.8, 371.5); vp(2.6, 4.4, '#3a2a1e', cx, 2.2, 376.06); const rw = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), mat('#4a3a9a')); rw.position.set(cx, 12, 376.06); S.add(rw);
        for(let zz = 316; zz <= 360; zz += 7.4) [-1, 1].forEach(s => vp(1.5, 7, '#3a4a8a', cx + s * 10.05, 7, zz, s * Math.PI / 2)); board(['CATHEDRAL OF', 'ST. PETER'], 4, 1.4, cx - 16, 1.6, 388, 0, { size:54, bg:'#3a342c' }); mapRect(604, 310, 624, 376, '#b8ae9c'); take(600 + OX, 306 + OZ, 628 + OX, 380 + OZ); PLACED['CATHEDRAL'] = [614 + OX, 340 + OZ]; } }); }

  // ---------- 4. landmarks, each put down near where it really is ----------
  put('PRICE PARK', 400, 329, 108, 130, -30, 172, () => { plane(108, 130, rep(M.grass, 18, 22), 400, .03, 329); mapRect(346, 264, 454, 394, '#4f8a3c'); board(['MELVIN PRICE', 'MEMORIAL PARK'], 5, 1.7, 400, 1.6, 267, 0, { size:58 });
    disc(1, mat('#4a8fc0'), 404, .05, 318, 24, 15); disc(1, mat('#3a7a34'), 404, .045, 318, 25.5, 16.5); mapRect(384, 306, 424, 330, '#4a8fc0');
    const pth = mat('#cfc6ad'); plane(2, 110, pth, 372, .045, 329); plane(74, 2, pth, 409, .045, 344); plane(2, 44, pth, 446, .045, 366); plane(76, 2, pth, 409, .045, 386);
    cyl(5.4, .4, mat('#cfc6ad'), 362, 0, 290, 8); G.platforms.push({ x0:357, z0:285, x1:367, z1:295, y:.4 }); for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; cyl(.16, 3, mat('#f3efe4'), 362 + Math.cos(a) * 4.9, .4, 290 + Math.sin(a) * 4.9, 6); } pyr(12, 12, 2.6, '#7a3a2c', 362, 3.4, 290);
    plane(34, 34, mat('#b8905a'), 426, .045, 368).rotation.z = Math.PI / 4; plane(26, 26, rep(M.grass, 4, 4), 426, .05, 368).rotation.z = Math.PI / 4; box(8, 4, .15, mat('#8a8f96'), 426, 0, 391.4);
    [[352, 272], [352, 330], [350, 388], [384, 276], [436, 272], [450, 300], [448, 340], [396, 352], [384, 380], [412, 280], [440, 320], [362, 350]].forEach(([x, z]) => tree(x, z, 1.2 + rnd() * .4, rnd() < .6)); }, 6);
  put('FAIRGROUNDS', 645, 480, 158, 148, -500, 160, () => { mapRect(568, 408, 722, 551, '#b89a6a'); const dirt = mat('#a8845a'), wh = mat('#ece8dc');
    disc(1, dirt, 662, .04, 484, 56, 62, 40); disc(1, rep(M.grass, 12, 14), 662, .05, 484, 46, 52, 40); mapRect(622, 440, 702, 528, '#4f8a3c');
    box(20, 7, 96, wh, 580, 0, 488); const rr = new THREE.Mesh(new THREE.BoxGeometry(11.6, .4, 97), mat('#7a8a96')); rr.position.set(575.2, 8.6, 488); rr.rotation.z = .3; rr.castShadow = true; const r2 = rr.clone(); r2.position.x = 584.8; r2.rotation.z = -.3; S.add(rr, r2);
    vp(14, 1.6, sg('EXPOSITION HALL', { bg:'#ece8dc', fg:'#8a1c1c', size:54, w:512, h:58 }), 590.06, 4.6, 488, Math.PI / 2); for(let i = 0; i < 6; i++) box(1.3, .5 + i * .5, 60, mat(i % 2 ? '#bcbcbc' : '#a8a8a8'), 596 + i * 1.3, 0, 484, { col:i === 5 }); col(595.4, 454, 603.2, 514, 3);
    [[568, 408, 640, 408], [652, 408, 722, 408], [722, 408, 722, 551], [568, 551, 722, 551], [568, 408, 568, 551]].forEach(a => fenceLine(...a, '#e8e2d0', 1.4));
    D(.4, 6, .4, '#8a1c1c', 640, 0, 408); D(.4, 6, .4, '#8a1c1c', 652, 0, 408); const g = new THREE.Mesh(new THREE.BoxGeometry(13, 1.6, .2), sg('BELLE-CLAIR FAIRGROUNDS', { bg:'#8a1c1c', fg:'#ffe9a8', size:38, w:512, h:63 })); g.position.set(646, 6, 408); S.add(g); });
  put('WALNUT HILL', 198, -97, 176, 130, -440, 400, () => { mapRect(112, -160, 284, -34, '#6f9a58'); const wall = '#8f8a80';
    [[112, -160, 284, -160], [284, -160, 284, -34], [112, -34, 284, -34], [112, -160, 112, -104], [112, -92, 112, -34]].forEach(a => fenceLine(...a, wall, 1.1));
    plane(170, 3, mat('#bdb7a6'), 198, .04, -98); plane(3, 120, mat('#bdb7a6'), 198, .04, -98); D(.8, 3.4, .8, wall, 112, 0, -104.4); D(.8, 3.4, .8, wall, 112, 0, -91.6);
    const gs = new THREE.Mesh(new THREE.BoxGeometry(.2, 1.1, 12), sg('WALNUT HILL CEMETERY', { bg:'#2a2a2a', fg:'#d8d0b8', size:40, w:512, h:47 })); gs.position.set(112, 3.9, -98); S.add(gs);
    const stone = [mat('#a8a8a4'), mat('#8f8f8a'), mat('#c4c0b6')]; for(let z = -152; z <= -42; z += 8.5) for(let x = 120; x <= 278; x += 6.5){ if(Math.abs(z + 98) < 5 || Math.abs(x - 198) < 4 || rnd() < .18) continue; const k = rnd() * 3 | 0; D(.9, k ? .9 : 1.5, .22, stone[k], x + rnd() - .5, 0, z); }
    [[130, -150], [170, -120], [240, -146], [262, -70], [150, -50], [216, -60], [270, -112]].forEach(([x, z]) => tree(x, z, 1.5, true)); });
  const barn = (x, z, w, d, sign) => { const red = mat('#8a2420'), wh = mat('#ece8dc'); box(w, 5, d, red, x, 0, z); const a = new THREE.Mesh(new THREE.BoxGeometry(w * .62, .3, d + .6), mat('#3a3a3e')); a.position.set(x - w * .26, 5 + w * .16, z); a.rotation.z = .55; a.castShadow = true; const b = a.clone(); b.position.x = x + w * .26; b.rotation.z = -.55; S.add(a, b);
    [-1, 1].forEach(s => { const g = new THREE.Shape(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.lineTo(0, w * .31); g.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(g), red); m.position.set(x, 5, z + s * d / 2); if(s < 0) m.rotation.y = Math.PI; S.add(m); });
    vp(3.4, 3.6, wh, x, 1.8, z + d / 2 + .05); if(sign) vp(w - 2, 1.3, sg(sign, { bg:'#ece8dc', fg:'#8a2420', size:44, w:512, h:Math.round(512 * 1.3 / (w - 2)) }), x, 4.3, z + d / 2 + .06); mapRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, '#8a2420'); };
  put("ECKERT'S", -480, -125, 228, 74, 60, 400, () => { barn(-420, -106, 20, 14, "ECKERT'S COUNTRY STORE"); lot(-404, -112, -372, -92, 4, { force:true }); mapRect(-594, -162, -366, -90, '#5f9a48');
    for(let i = 0; i < 26; i++){ const p = new THREE.Mesh(new THREE.SphereGeometry(.34 + rnd() * .2, 7, 5), mat(i % 5 ? '#e8822a' : '#d86a1a')); p.scale.y = .78; p.position.set(-452 + (i % 7) * 2.2 + rnd(), .28, -98 + (i / 7 | 0) * 2 + rnd()); p.castShadow = true; S.add(p); }
    board(['PICK YOUR OWN', 'PUMPKINS + APPLES'], 4.4, 1.5, -446, 1.6, -89, 0, { bg:'#ece8dc', fg:'#8a2420', size:50 }); for(let z = -156; z <= -124; z += 16) for(let x = -586; x <= -374; x += 15) tree(x, z, .75, false); for(let x = -586; x <= -470; x += 15) tree(x, -100, .75, false); });
  put('SKYVIEW DRIVE-IN', 401, 481, 110, 150, 126, -548, () => { const wh = mat('#ece8dc'), cx = 401, x0 = 348, x1 = 454; plane(x1 - x0, 143, mat('#8f8878'), cx, .03, 479.5); mapRect(x0, 408, x1, 551, '#8f8878');
    box(46, 2, 1.2, mat('#6a6a6e'), cx, 0, 545); [-18, -6, 6, 18].forEach(dx => D(.5, 8, .5, '#6a6a6e', cx + dx, 2, 545.6)); D(46, 19, .6, wh, cx, 7, 545); D(47, 19.6, .3, '#2a2a2e', cx, 6.7, 545.5); mapRect(cx - 23, 543, cx + 23, 547, '#f2f2f2');
    for(let z = 440; z <= 520; z += 16) for(let x = x0 + 8; x <= x1 - 8; x += 8){ if(Math.abs(x - cx) < 9 && z > 460 && z < 500) continue; D(.1, 1.3, .1, '#7a7a7e', x, 0, z); D(.26, .32, .2, '#b8b8b8', x, 1.2, z); }
    box(12, 3.4, 8, mat('#d8cdb0'), cx, 0, 480); D(12.6, .3, 8.6, '#8a2420', cx, 3.4, 480); vp(8, 1, sg('SNACK BAR', { bg:'#8a2420', fg:'#ffe9a8', size:60, w:512, h:64 }), cx, 2.7, 475.94, Math.PI);
    box(3, 2.8, 3, mat('#d8cdb0'), cx, 0, 414); D(3.6, .25, 3.6, '#8a2420', cx, 2.8, 414); fenceLine(x0, 408, cx - 8, 408, '#7a5a3a', 2.2); fenceLine(cx + 8, 408, x1, 408, '#7a5a3a', 2.2); fenceLine(x0, 408, x0, 551, '#7a5a3a', 2.2); fenceLine(x1, 408, x1, 551, '#7a5a3a', 2.2); fenceLine(x0, 551, x1, 551, '#7a5a3a', 2.2);
    D(.5, 9, .5, '#2a4a8a', cx + 14, 0, 407); D(.5, 9, .5, '#2a4a8a', cx + 22, 0, 407); board('SKYVIEW DRIVE-IN', 9, 1.6, cx + 18, 8.4, 407, 0, { bg:'#2a4a8a', fg:'#ffe24a', size:50, posts:false });
    board(['SCHOOL OF ROCK  PG-13', 'KILL BILL VOL. 1  R', 'OPEN FRI · SAT · SUN'], 9, 3.2, cx + 18, 5.6, 407, 0, { bg:'#fffbe8', fg:'#111', size:44, posts:false }); });
  put('MEMORIAL HOSPITAL', -539, 478, 102, 144, 230, -700, () => { box(46, 17, 64, mat('#d8d4c8'), -564, 0, 470); for(let f = 0; f < 5; f++) D(46.2, 1.4, 64.2, '#2a3a4a', -564, f * 3.3 + 1.7, 470); D(48, .8, 66, '#b9b3a6', -564, 17, 470); box(14, 4.2, 12, mat('#d8d4c8'), -534, 0, 470); D(16, .5, 16, '#c8202a', -532, 4.2, 470);
    vp(10, 1.1, sg('EMERGENCY', { bg:'#c8202a', fg:'#fff', size:44, w:512, h:56 }), -523.94, 3.5, 470, Math.PI / 2); vp(22, 2.2, sg('MEMORIAL HOSPITAL', { bg:'#d8d4c8', fg:'#1b3a6a', size:40, w:512, h:51 }), -540.94, 14.6, 470, Math.PI / 2);
    board(['H', 'MEMORIAL HOSPITAL'], 4, 2.2, -490, 2, 414, 0, { bg:'#1b3a8a', fg:'#fff', size:70 }); mapRect(-587, 438, -541, 502, '#d8d4c8'); lot(-520, 420, -490, 548, 12, { force:true }); lot(-588, 512, -526, 548, 8, { force:true }); });
  const diamond = (x, z) => { plane(34, 34, mat('#b8905a'), x, .045, z).rotation.z = Math.PI / 4; plane(26, 26, rep(M.grass, 4, 4), x, .05, z).rotation.z = Math.PI / 4; [[0, 17], [17, 0], [0, -17], [-17, 0]].forEach(([a, b]) => plane(1, 1, mat('#f4f4f0'), x + a, .06, z + b)); box(8, 4, .15, mat('#8a8f96'), x, 0, z + 23.4); };
  put('WOLF BRANCH', -420, 330, 108, 132, 500, 150, () => { shop(-468, 296, -448, 372, { h:5.2, face:'w', name:'WOLF BRANCH SCHOOL', wall:'#c9a878', sbg:'#c9a878', sfg:'#3a2a1e', awn:null, front:false, force:true }); shop(-448, 320, -412, 348, { h:5.2, face:'s', wall:'#c9a878', front:false, force:true });
    for(let z = 300; z <= 368; z += 6) if(Math.abs(z - 334) > 8) vp(3, 1.6, glassM, -468.06, 2, z, -Math.PI / 2); vp(3, 2.4, '#3a5a8a', -468.08, 1.2, 334, -Math.PI / 2); cyl(.08, 8, mat('#c9c9c9'), -472, 0, 326, 6); D(1.8, 1.1, .04, '#b22234', -471, 6.9, 326);
    lot(-444, 270, -380, 292, 6, { force:true }); plane(40, 24, mat('#55575c'), -392, .03, 372); mapRect(-412, 360, -372, 384, '#55575c'); [[-438, 300], [-430, 300]].forEach(([x, z]) => { box(2.6, 2.8, 9, mat('#e8b820'), x, .4, z + 4); D(2.64, .7, 8.6, '#26384a', x, 2, z + 4); }); mapRect(-474, 264, -366, 396, '#5f9a48'); });
  put('SCHRANZ PARK', -420, 479, 108, 146, 470, 60, () => { plane(108, 146, rep(M.grass, 18, 24), -420, .03, 479); mapRect(-474, 406, -366, 552, '#4f8a3c'); board(['SCHRANZ', 'MEMORIAL PARK'], 5, 1.7, -470, 1.6, 420, Math.PI / 2, { size:58 });
    diamond(-440, 440); diamond(-398, 500); disc(1, mat('#4a8fc0'), -444, .05, 520, 18, 12); disc(1, mat('#3a7a34'), -444, .045, 520, 19.5, 13.5); mapRect(-460, 510, -428, 530, '#4a8fc0');
    cyl(4.6, .4, mat('#cfc6ad'), -392, 0, 430, 8); for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; cyl(.16, 3, mat('#f3efe4'), -392 + Math.cos(a) * 4.1, .4, 430 + Math.sin(a) * 4.1, 6); } pyr(10.5, 10.5, 2.4, '#2f5a3a', -392, 3.4, 430); G.platforms.push({ x0:-396, z0:426, x1:-388, z1:434, y:.4 });
    [[-470, 470], [-468, 540], [-372, 462], [-374, 544], [-416, 546], [-420, 412], [-452, 482], [-380, 414]].forEach(([x, z]) => tree(x, z, 1.2 + rnd() * .4, rnd() < .6)); });
  put('SWANSEA VILLAGE HALL', -301, 293, 94, 58, 40, 300, () => { shop(-344, 268, -304, 290, { h:6.4, face:'n', name:'SWANSEA VILLAGE HALL', wall:'#c9b48a', sbg:'#c9b48a', sfg:'#2a2420', awn:null, force:true }); cyl(.08, 9, mat('#c9c9c9'), -348, 0, 266, 6); D(1.8, 1.1, .04, '#b22234', -347, 7.7, 266);
    shop(-296, 268, -258, 292, { h:6, face:'n', name:'SWANSEA FIRE DEPT.', brick:'#8c3b2a', sbg:'#8c3b2a', sfg:'#fff', awn:null, front:false, signY:5.2, force:true }); [-288, -277, -266].forEach(x => { vp(8, 4, '#c8202a', x, 2, 267.94, Math.PI); for(let y = 1; y < 4; y++) vp(8, .06, '#8a1418', x, y, 267.92, Math.PI); }); lot(-344, 296, -262, 318, 6, { force:true }); });
  // roadside businesses: each finds a plot beside the street nearest its real location and faces it
  const biz = (name, w, d, nx, nz, o = {}) => { const sp = findSpot(w + 4, d + 18, nx, nz, 7); if(!sp) return; const [cx, cz] = sp, r = roadNear(cx, cz, 120), dx = r.x - cx, dz = r.z - cz, f = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'e' : 'w') : (dz > 0 ? 's' : 'n'), ew = f === 'e' || f === 'w', bw = ew ? d : w, bd = ew ? w : d;
    const bx = cx + (f === 'e' ? 6 : f === 'w' ? -6 : 0), bz = cz + (f === 's' ? 6 : f === 'n' ? -6 : 0); shop(bx - bw / 2, bz - bd / 2, bx + bw / 2, bz + bd / 2, { face:f, name, force:true, inside:/MART|WALGREENS/.test(name) ? 'store' : /BANK/.test(name) ? 'bank' : 'diner', ...o });
    const lx = cx - (f === 'e' ? 1 : f === 'w' ? -1 : 0) * (d / 2 + 3), lz = cz - (f === 's' ? 1 : f === 'n' ? -1 : 0) * (d / 2 + 3); lot(lx - (ew ? 5 : w / 2), lz - (ew ? w / 2 : 5), lx + (ew ? 5 : w / 2), lz + (ew ? w / 2 : 5), 3, { force:true }); take(cx - (ew ? d + 18 : w + 4) / 2, cz - (ew ? w + 4 : d + 18) / 2, cx + (ew ? d + 18 : w + 4) / 2, cz + (ew ? w + 4 : d + 18) / 2); zone(cx - (ew ? d + 18 : w + 4) / 2, cz - (ew ? w + 4 : d + 18) / 2, cx + (ew ? d + 18 : w + 4) / 2, cz + (ew ? w + 4 : d + 18) / 2, 30); PLACED[name] = sp; };
  biz('MOTO MART', 22, 16, 96, 284, { h:4.4, wall:'#e8e2d0', sbg:'#c8102e', sfg:'#fff', awn:'#c8102e' }); biz("STEAK 'N SHAKE", 24, 18, 20, 284, { h:4.6, wall:'#f2f2f2', sbg:'#111', sfg:'#fff', awn:'#111' });
  biz('WHITE CASTLE', 22, 18, -60, 284, { h:4.4, wall:'#f4f4f0', sbg:'#1b3a8a', sfg:'#fff', awn:'#1b3a8a' }); biz("IMO'S PIZZA", 26, 18, -140, 284, { h:4.6, brick:'#8c3b2a', sbg:'#c8102e', sfg:'#fff', awn:'#2f5a3a' });
  biz("HARDEE'S", 28, 20, 150, 284, { h:4.6, wall:'#e2d6be', sbg:'#f2a020', sfg:'#fff', awn:'#c8102e' }); biz('DAIRY QUEEN', 26, 18, 240, 284, { h:4.4, wall:'#f2ece0', sbg:'#c8102e', sfg:'#fff', awn:'#c8102e' });
  biz('BELLEVILLE PANCAKE HOUSE', 32, 20, 330, 284, { h:4.8, brick:'#7a4a3a', awn:'#b8862a' }); biz('WALGREENS', 40, 22, -260, 284, { h:5.4, wall:'#d8d0c0', sbg:'#f2f2f2', sfg:'#c8102e', awn:null }); biz('TACO BELL', 26, 18, -205, -560, { h:4.6, wall:'#e6d3a3', sbg:'#5a2a82', sfg:'#ffd23f', awn:'#5a2a82', trim:'#7a4a9a' }); biz('FIRST NATIONAL BANK', 34, 20, -340, 220, { h:7, wall:'#c9c2b2', sbg:'#1b3a6a', sfg:'#fff', awn:null });
  // Draft 2.3: both real Blockbusters (west end on N Belt W near Belleville West, east end in the Carlyle Ave strip), plus the shops Chris would actually use in 2003
  biz('BLOCKBUSTER VIDEO', 28, 20, -150, -560, { h:5.2, brick:'#8a5a3e', sbg:'#2f8ad8', sfg:'#f2c230', awn:null, trim:'#8a8478', cols:['#1a1a1a', '#22263a', '#3a2222', '#1f2f22', '#e8e8e8', '#2a2a2a', '#1a2a4a'], noCool:true, inside:'store', inSign:'NEW RELEASES' });
  biz('BLOCKBUSTER', 26, 20, 430, 300, { h:5, wall:'#b9b6ae', sbg:'#2a5fb8', sfg:'#f2c230', awn:null, trim:'#a8a59c', cols:['#1a1a1a', '#22263a', '#3a2222', '#1f2f22', '#e8e8e8', '#2a2a2a', '#1a2a4a'], noCool:true, inside:'store', inSign:'NEW RELEASES' });
  biz('STREETSIDE RECORDS', 22, 16, -320, 300, { h:4.6, brick:'#5a4a3e', sbg:'#111', sfg:'#e8c832', awn:'#8a2a2a', cols:['#1a1a1a', '#e8e8e8', '#3a3a3a', '#c8202a', '#2a2a2a'], noCool:true, inside:'store', inSign:'NEW MUSIC' });
  biz('WEHRENBERG CINEMAS', 40, 26, 470, 200, { h:6.2, wall:'#d8cfc0', sbg:'#8a1a2a', sfg:'#f2d030', awn:'#8a1a2a', inside:'diner' });
  biz('BELLEVILLE BOWL', 40, 24, -200, 330, { h:6, wall:'#c8b89a', sbg:'#1a4a8a', sfg:'#fff', awn:'#c8202a', inside:'diner' });
  biz('ST. CLAIR SQUARE', 56, 28, 470, 360, { h:6.2, wall:'#d6cbb6', sbg:'#5a2a2a', sfg:'#fff', awn:null, inside:'store', inSign:'FOOD COURT' });
  biz('BELLEVILLE AUTO SALES', 34, 20, 470, 120, { h:5, wall:'#f2f2f2', sbg:'#1b3a8a', sfg:'#fff', awn:'#c8202a', inside:'bank', inSign:'USED CARS' });
  biz('SPLASH CAR WASH', 22, 14, 440, 270, { h:4.4, wall:'#e8f2f8', sbg:'#2a8ad8', sfg:'#fff', awn:'#2a8ad8', noCool:true, inside:'store', inSign:'SELF SERVE' });
  waterTower('SWANSEA', 420, 320); waterTower('BELLEVILLE', -250, 120);
  // MetroLink platforms beside the light-rail line
  { const stn = (nm, nx, nz) => { let best = null; for(const p of railLines) for(let i = 1; i < p.length; i++){ const mx = (p[i][0] + p[i - 1][0]) / 2, mz = (p[i][1] + p[i - 1][1]) / 2, dd = Math.hypot(mx - nx, mz - nz); if(!best || dd < best.d) best = { d:dd, x:mx, z:mz, a:Math.atan2(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) }; } if(!best || best.d > 400) return;
      const g = new THREE.Group(); g.position.set(best.x, 0, best.z); g.rotation.y = best.a + Math.PI / 2; S.add(g); const B = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; g.add(m); return m; };
      B(40, 1, 4, '#c4c0b6', 0, 0, 5); for(let x = -16; x <= 16; x += 8) B(.3, 3, .3, '#2a4a8a', x, 1, 6); B(36, .25, 4.6, '#e8e8e8', 0, 4, 5.2); [-11.5, 11.5].forEach(x => { B(22, 3.2, 2.7, '#f2f2f2', x, .5, 0); B(22.04, .5, 2.74, '#1b3a8a', x, 1.1, 0); B(20, .9, 2.76, '#26384a', x, 2.2, 0); });
      const sgn = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, .14), sg(nm, { bg:'#1b3a8a', fg:'#fff', size:64, w:512, h:80 })); sgn.position.set(0, 3.1, 6.6); g.add(sgn); col(best.x - 6, best.z - 6, best.x + 6, best.z + 6, 3); take(best.x - 24, best.z - 24, best.x + 24, best.z + 24); zone(best.x - 24, best.z - 24, best.x + 24, best.z + 24, 30); mapRect(best.x - 5, best.z - 5, best.x + 5, best.z + 5, '#c4c0b6'); PLACED[nm + ' METRO'] = [Math.round(best.x), Math.round(best.z)]; };
    stn('SWANSEA', -25, 306); stn('BELLEVILLE', -367, 400); stn('MEMORIAL HOSPITAL', 170, -604); }

  // ---------- 5. houses along the smaller streets ----------
  let nh = 0; const HOUSE_CAP = 230;
  const sideOf = (l, step, skip) => { let acc = step * rnd(); for(let i = 1; i < l.p.length; i++){ const a = l.p[i - 1], b = l.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / (L || 1), tz = (b[1] - a[1]) / (L || 1);
      for(; acc < L; acc += step){ for(const s of [-1, 1]){ if(nh >= HOUSE_CAP || rnd() < skip) continue; const x = a[0] + tx * acc - tz * s * 19, z = a[1] + tz * acc + tx * s * 19, dx = tz * s, dz = -tx * s, f = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'e' : 'w') : (dz > 0 ? 's' : 'n'), ew = f === 'e' || f === 'w', hw = ew ? 9.5 : 11.5, hd = ew ? 11.5 : 9.5;
          if(!inWorld(x - hw, z - hd, x + hw, z + hd) || !free(x - hw, z - hd, x + hw, z + hd) || !offRoad(x - hw, z - hd, x + hw, z + hd, 6.5)) continue; seedN += 7; BL.house(x, z, f, seedN, { curb:13 }); take(x - hw, z - hd, x + hw, z + hd); zone(x - hw - 5, z - hd - 5, x + hw + 5, z + hd + 5, 11); nh++; if(rnd() < .5) yardTree(x - dx * 13 + 4, z - dz * 13 + 4); } } acc -= L; } };
  LINES.filter(l => l.k === 3).forEach(l => sideOf(l, 27, .22)); LINES.filter(l => l.k === 2 && !l.stitch).forEach(l => sideOf(l, 30, .5)); LINES.filter(l => l.k === 1).forEach(l => sideOf(l, 34, .72));
  (G.driveways || []).splice(d0).forEach((d, i) => { if(i % 3 !== 1) return; const c = makeCar(pick(carC), { suv:i % 4 === 0 }); c.position.set(d.x, 0, d.z); c.rotation.y = d.ry; S.add(c); Math.abs(Math.sin(d.ry)) > .7 ? col(d.x - 2.3, d.z - 1, d.x + 2.3, d.z + 1, 1.6) : col(d.x - 1, d.z - 2.3, d.x + 1, d.z + 2.3, 1.6); });
  // street lamps along the bigger streets, farm fields and trees on the land that is left
  LINES.filter(l => l.k <= 2).forEach(l => { let acc = 30; for(let i = 1; i < l.p.length; i++){ const a = l.p[i - 1], b = l.p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / (L || 1), tz = (b[1] - a[1]) / (L || 1); for(; acc < L; acc += 72){ const x = a[0] + tx * acc - tz * (l.hw + 2.9), z = a[1] + tz * acc + tx * (l.hw + 2.9); if(free(x - .5, z - .5, x + .5, z + .5)) lamp(x, z); } acc -= L; } });
  const corn = txMat('corn', (g, w, h) => { noise(g, w, h, '#b89a4a', .25, 2600); g.fillStyle = 'rgba(70,50,10,.35)'; for(let x = 0; x < w; x += 8) g.fillRect(x, 0, 2, h); }, [1, 1]), stub = txMat('stub', (g, w, h) => { noise(g, w, h, '#8a744a', .22, 2600); g.fillStyle = 'rgba(40,30,10,.3)'; for(let x = 0; x < w; x += 10) g.fillRect(x, 0, 3, h); }, [1, 1]);
  for(let i = 0, made = 0; i < 260 && made < 16; i++){ const w = 70 + rnd() * 70, d = 60 + rnd() * 70, cx = WORLD.x0 + 60 + rnd() * (WORLD.x1 - WORLD.x0 - 120), cz = WORLD.z0 + 60 + rnd() * (WORLD.z1 - WORLD.z0 - 120), x0 = cx - w / 2, z0 = cz - d / 2, x1 = cx + w / 2, z1 = cz + d / 2;
    if(!free(x0 - 6, z0 - 6, x1 + 6, z1 + 6) || !offRoad(x0, z0, x1, z1, 12) || !inWorld(x0, z0, x1, z1, 20)) continue; const tall = made % 2 === 0;
    if(tall){ box(w, 1.9, d, rep(corn, w / 5, d / 5), cx, 0, cz); mapRect(x0, z0, x1, z1, '#b89a4a'); } else { plane(w, d, rep(stub, w / 6, d / 6), cx, .03, cz); mapRect(x0, z0, x1, z1, '#8a744a'); } take(x0, z0, x1, z1); zone(x0, z0, x1, z1, 40); made++; }
  for(let i = 0, made = 0; i < 2600 && made < 520; i++){ const x = WORLD.x0 + 20 + rnd() * (WORLD.x1 - WORLD.x0 - 40), z = WORLD.z0 + 20 + rnd() * (WORLD.z1 - WORLD.z0 - 40); if(!free(x - 2, z - 2, x + 2, z + 2) || roadNear(x, z, 10).d < 9) continue; if(roadNear(x, z, 7, SEGW).d < 6) continue; made % 3 ? lite(x, z, .9 + rnd() * .6) : tree(x, z, 1 + rnd() * .6, rnd() < .5); made++; }

  // ---------- 6. the edge of the map ----------
  for(let x = WORLD.x0 - 20; x <= WORLD.x1 + 20; x += 11 + rnd() * 8){ lite(x, WORLD.z1 + 8 + rnd() * 14, 1.1 + rnd() * .7); lite(x + 5, WORLD.z0 - 8 - rnd() * 14, 1.2 + rnd() * .7); }
  for(let z = WORLD.z0 - 20; z <= WORLD.z1 + 20; z += 11 + rnd() * 8){ lite(WORLD.x0 - 8 - rnd() * 14, z, 1.1 + rnd() * .7); lite(WORLD.x1 + 8 + rnd() * 14, z, 1.1 + rnd() * .7); }
  const edge = (x0, z0, x1, z1) => G.colliders.push({ x0, x1, z0, z1, y0:-30, y1:60 });
  edge(WORLD.x0 - 12, WORLD.z0 - 12, WORLD.x0 - 2, WORLD.z1 + 12, 12); edge(WORLD.x1 + 2, WORLD.z0 - 12, WORLD.x1 + 12, WORLD.z1 + 12, 12); edge(WORLD.x0 - 12, WORLD.z0 - 12, WORLD.x1 + 12, WORLD.z0 - 2, 12); edge(WORLD.x0 - 12, WORLD.z1 + 2, WORLD.x1 + 12, WORLD.z1 + 12, 12);
  edge(326, WORLD.z0 - 12, 334, -300, 12); edge(326, -304, WORLD.x1 + 12, -296, 12); for(let z = WORLD.z0; z < -300; z += 9) lite(338 + rnd() * 10, z, 1.4 + rnd() * .6); for(let x = 334; x < WORLD.x1; x += 9) lite(x, -310 - rnd() * 10, 1.4 + rnd() * .6);
  { const fw = '#7a5a3a'; [[294, -106, 316, -106], [294, -88, 316, -88], [294, -106, 294, -88], [316, -106, 316, -88]].forEach(a => fenceLine(...a, fw, 3.2)); for(let i = 0; i < 26; i++){ const x = 284 + rnd() * 44, z = -122 + rnd() * 48; if(x > 292 && x < 318 && z > -108 && z < -86) continue; tree(x, z, 1.5 + rnd() * .5, rnd() < .5); } }
  // ---------- 7. hills ----------
  // Rolling ground everywhere except the level patches above (the story neighbourhood, the plaza, the school and each landmark),
  // with a shallow valley along the creek. Heights are stored on an 8-unit grid; G.terrain(x, z) reads it.
  { const CS = 5, MG = 120, gx0 = WORLD.x0 - MG, gz0 = WORLD.z0 - MG, nx = Math.ceil((WORLD.x1 - WORLD.x0 + 2 * MG) / CS) + 1, nz = Math.ceil((WORLD.z1 - WORLD.z0 + 2 * MG) / CS) + 1, H = new Float32Array(nx * nz), sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    // 1) the natural ground: long gentle hills, a valley along the creek, level where the story lives, flat beyond the map edge
    const fixed = ZONES.filter(q => q.lv != null), pads = ZONES.filter(q => q.lv == null), zb = (h, x, z, list) => { for(const q of list){ const dx = Math.max(q.x0 - x, 0, x - q.x1), dz = Math.max(q.z0 - z, 0, z - q.z1), d = Math.hypot(dx, dz); if(d < q.m) h += (q.lv - h) * sm(1 - d / q.m); } return h; };
    const base0 = (x, z) => { let h = Math.max(0, 3.2 + 4.4 * Math.sin(x * .0125 + 1.3) * Math.cos(z * .0105 + .4) + 1.5 * Math.sin(x * .027 + z * .019 + 2) + .5 * Math.sin(z * .04 - x * .015)); h *= .2 + .8 * sm(roadNear(x, z, 60, SEGW).d / 60); h = zb(h, x, z, fixed);
      const e = Math.min(x - WORLD.x0, WORLD.x1 - x, z - WORLD.z0, WORLD.z1 - z); return h * sm((e + MG) / MG); };
    // 2) every pad (house, shop, landmark, field) sits at the height of the street it faces
    pads.forEach(q => { const cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, r = roadNear(cx, cz, 300); q.lv = r.line ? base0(r.x, r.z) : base0(cx, cz); });
    // 3) the ground is cut level across every street: within the roadway it takes the height of the centre line, then eases back to the natural ground
    const hAt = (x, z) => { let h = zb(base0(x, z), x, z, pads); const r = roadNear(x, z, 26); if(r.line){ const w = sm((r.d - ((r.line.hw || 4) + 4)) / 13); if(w < 1){ const hr = base0(r.x, r.z); h = hr + (h - hr) * w; } } return h; };
    for(let i = 0; i < nx; i++) for(let j = 0; j < nz; j++) H[i * nz + j] = hAt(gx0 + i * CS, gz0 + j * CS);
    G.terrain = (x, z) => { const fx = (x - gx0) / CS, fz = (z - gz0) / CS, i = Math.floor(fx), j = Math.floor(fz); if(i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return 0; const u = fx - i, v = fz - j, a = H[i * nz + j], b = H[(i + 1) * nz + j], c = H[i * nz + j + 1], d = H[(i + 1) * nz + j + 1]; return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v; };
    const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = []; for(let i = 0; i < nx; i++) for(let j = 0; j < nz; j++){ const k = i * nz + j; pos[k * 3] = gx0 + i * CS; pos[k * 3 + 1] = H[k] - .035; pos[k * 3 + 2] = gz0 + j * CS; uv[k * 2] = (gx0 + i * CS) / 7.5; uv[k * 2 + 1] = (gz0 + j * CS) / 7.5; if(i < nx - 1 && j < nz - 1) idx.push(k, k + 1, k + nz, k + 1, k + nz + 1, k + nz); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); ge.setIndex(idx); ge.computeVertexNormals(); const gm = rep(M.grass, 1, 1); gm.map.wrapS = gm.map.wrapT = THREE.RepeatWrapping; const land = new THREE.Mesh(ge, gm); land.receiveShadow = true; S.add(land); G.land = land;
    // lift everything this file built onto the ground
    const T = G.terrain; for(let i = C0; i < S.children.length; i++){ const o = S.children[i]; if(o === land) continue;
      if(o.userData.ribbon){ const p = o.geometry.attributes.position; for(let k = 0; k < p.count; k++) p.setY(k, p.getY(k) + T(p.getX(k) + o.position.x, p.getZ(k) + o.position.z) + .05); p.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere(); continue; }
      const x = o.position.x, z = o.position.z; if(o.userData.flat){ const p = o.geometry.attributes.position; for(let k = 0; k < p.count; k++) p.setZ(k, T(x + p.getX(k), z - p.getY(k)) + .075); p.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere(); continue; }
      o.position.y += T(x, z); }
    // grade: the ground is then shaped to what lies on it, so nothing pokes through. Every grid point under or beside a flat surface
    // (road, car park, lawn, path) is set just below that surface: cut down where a hill rose through it, filled where it hung in the air.
    { S.updateMatrixWorld(true); const cov = new Float32Array(nx * nz).fill(1e9), cap = new Float32Array(nx * nz).fill(1e9), fill = new Uint8Array(nx * nz), pits = G.pits || [], W = (e, p, k) => { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); return [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]; };
      S.traverse(o => { if(!o.isMesh || o === land || !o.geometry.attributes.position || o.material.transparent) return; const g = o.geometry, p = g.attributes.position, ix = g.index, e = o.matrixWorld.elements, tc = (ix ? ix.count : p.count) / 3, soft = o.userData.ribbon || o.userData.flat || g.type === 'PlaneGeometry' || g.type === 'CircleGeometry';
        if(!g.boundingSphere) g.computeBoundingSphere(); if(g.boundingSphere.radius > 400) return;                                   // the backdrop plane under the whole map is not something to grade to
        for(let t = 0; t < tc; t++){ const a = W(e, p, ix ? ix.getX(t * 3) : t * 3), b = W(e, p, ix ? ix.getX(t * 3 + 1) : t * 3 + 1), c = W(e, p, ix ? ix.getX(t * 3 + 2) : t * 3 + 2);
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2], ny = uz * vx - ux * vz, nl = Math.hypot(uy * vz - uz * vy, ny, ux * vy - uy * vx); if(nl < .02 || ny / nl < .96) continue;
          const mx = (a[0] + b[0] + c[0]) / 3, my = (a[1] + b[1] + c[1]) / 3, mz = (a[2] + b[2] + c[2]) / 3, dh = my - T(mx, mz); if(dh > 1.3 || dh < -1.5 || pits.some(q => mx > q.x0 - 1 && mx < q.x1 + 1 && mz > q.z0 - 1 && mz < q.z1 + 1)) continue;
          const big = soft && nl / 2 >= 6 && dh < .7, den = ux * vz - vx * uz; if(Math.abs(den) < 1e-9) continue;
          const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0], c[0]) - gx0) / CS) - 1), i1 = Math.min(nx - 1, Math.ceil((Math.max(a[0], b[0], c[0]) - gx0) / CS) + 1), j0 = Math.max(0, Math.floor((Math.min(a[2], b[2], c[2]) - gz0) / CS) - 1), j1 = Math.min(nz - 1, Math.ceil((Math.max(a[2], b[2], c[2]) - gz0) / CS) + 1);
          for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const X = gx0 + i * CS, Z = gz0 + j * CS, k = i * nz + j; let s = ((X - a[0]) * vz - (Z - a[2]) * vx) / den, r = ((Z - a[2]) * ux - (X - a[0]) * uz) / den;   // point = a + s*u + r*v
            if(s >= -1e-6 && r >= -1e-6 && s + r <= 1 + 1e-6){ const y = a[1] + s * uy + r * vy; if(y < cov[k]) cov[k] = y; if(big) fill[k] = 1; continue; }
            let bd = 1e9, by = 0; for(const [P, Q] of [[a, b], [b, c], [c, a]]){ const ex = Q[0] - P[0], ez = Q[2] - P[2], q = Math.max(0, Math.min(1, ((X - P[0]) * ex + (Z - P[2]) * ez) / (ex * ex + ez * ez || 1))), d = Math.hypot(P[0] + ex * q - X, P[2] + ez * q - Z); if(d < bd){ bd = d; by = P[1] + (Q[1] - P[1]) * q; } }
            if(bd <= CS * 1.45 && by < cap[k]) cap[k] = by; } } });
      const p = land.geometry.attributes.position; for(let k = 0; k < nx * nz; k++){ let h = H[k] - .035; if(cov[k] < 1e8) h = fill[k] ? cov[k] - .06 : Math.min(h, cov[k] - .06); if(cap[k] < 1e8) h = Math.min(h, cap[k] - .06); H[k] = h; p.setY(k, h); } p.needsUpdate = true; land.geometry.computeVertexNormals(); land.geometry.computeBoundingSphere();
      for(let i = C0; i < S.children.length; i++){ const o = S.children[i]; if(o.material === G.glowM){ const x = o.position.x, z = o.position.z, r = o.geometry.parameters.width / 2; o.position.y = Math.max(G.terrain(x, z), G.terrain(x - r, z), G.terrain(x + r, z), G.terrain(x, z - r), G.terrain(x, z + r)) + .09; } }   // light pools sit clear of the slope
      // walking and driving use exactly the triangles that are drawn
      G.terrain = (x, z) => { const fx = (x - gx0) / CS, fz = (z - gz0) / CS, i = Math.floor(fx), j = Math.floor(fz); if(i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return 0; const u = fx - i, v = fz - j, k = i * nz + j, a = H[k], b = H[k + nz], c = H[k + 1], d = H[k + nz + 1]; return (u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v)) + .035; }; }
    for(let i = K0; i < G.colliders.length; i++){ const c = G.colliders[i], h = T((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2); c.y0 += h - 1.5; c.y1 += h + .6; } for(let i = PL0; i < G.platforms.length; i++){ const p = G.platforms[i]; p.y += T((p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2); } }
  (G.junctions || []).forEach(q => (q.heads || []).forEach(h => { h.y += G.terrain(h.x, h.z); }));
  G.townHouses = nh; G.townPlaced = PLACED;
}
