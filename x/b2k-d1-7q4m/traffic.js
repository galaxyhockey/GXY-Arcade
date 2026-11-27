// Back in the 2000s: The Game — traffic rules: signals, stop signs, the cars that obey them, and people on the sidewalks.
// town.js works out every junction (G.junctions) and whether it is a 'signal', a 'stop' or uncontrolled, and builds the poles,
// signs and stop lines. This file runs them:
//   - every signal cycles: main road green 14 s, yellow 3 s, all red 1.5 s, cross street green 14 s, yellow 3 s, all red 1.5 s
//   - cars keep to their lane, slow for the car in front, stop on red, stop at stop signs and take turns, and wait for people crossing
//   - pedestrians walk the sidewalks and cross with the light (or when the road is clear at a stop sign)
//   - G.driveRule / G.signalPhase / G.pedHold let scripted story cars and walking story characters follow the same rules
import * as E from './engine.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const { THREE, G, P } = E;
const CYC = 37;
export function phase(j, g){ const t = ((G.t + j.off) % CYC + CYC) % CYC; return g === 0 ? (t < 14 ? 'g' : t < 17 ? 'y' : 'r') : (t >= 18.5 && t < 32.5 ? 'g' : t >= 32.5 && t < 35.5 ? 'y' : 'r'); }
const greenLeft = (j, g) => { const t = ((G.t + j.off) % CYC + CYC) % CYC; return g === 0 ? 14 - t : t >= 18.5 ? 32.5 - t : -1; };

export function initTraffic(){ const TL = G.townLines || [], JS = G.junctions || [], T = G.terrain || (() => 0);
  TL.forEach(l => { l.cum = [0]; let c = 0; for(let i = 1; i < l.p.length; i++){ c += Math.hypot(l.p[i][0] - l.p[i - 1][0], l.p[i][1] - l.p[i - 1][1]); l.cum.push(c); } l.len = c; l.stops = []; l.lanes = { 1:[], '-1':[] }; });
  JS.forEach((j, ji) => { j.off = (ji * 7.3) % CYC; j.occ = null; j.thruT = -9; j.pedT = -9; if(j.type !== 'none') j.arms.forEach(r => TL[r.li].stops.push({ u:r.u, j, g:r.g, stop:!!r.stop })); });
  TL.forEach(l => l.stops.sort((a, b) => a.u - b.u));
  const ctl = JS.filter(j => j.type !== 'none'), sig = JS.filter(j => j.type === 'signal');
  // nearest controlled junction ahead of something heading (fx, fz)
  const ahead = (x, z, fx, fz, R = 30, list = ctl) => { let best = null; for(const j of list){ const dx = j.x - x, dz = j.z - z; if(Math.abs(dx) > R || Math.abs(dz) > R) continue; const a = dx * fx + dz * fz, s = Math.abs(dx * fz - dz * fx);
      if(a > 0 && a < R && s < 5.5 && (!best || a < best.d)){ let arm = null, bc = -1; for(const r of j.arms){ const c = Math.abs(r.t[0] * fx + r.t[1] * fz); if(c > bc){ bc = c; arm = r; } } best = { j, d:a, g:arm.g, stop:!!arm.stop }; } } return best; };
  G.driveRule = ahead; G.signalPhase = phase;
  // walking story characters wait at the kerb when the light is against them (runners and followers are left alone)
  G.pedHold = (n, tgt) => { const dx = tgt.x - n.p.x, dz = tgt.z - n.p.z, d = Math.hypot(dx, dz); if(d < .01) return false; const r = ahead(n.p.x, n.p.z, dx / d, dz / d, 11.5, sig); return !!(r && r.d > 8.8 && phase(r.j, r.g) !== 'g'); };

  // ---------- signal lamps (one small mesh per colour per direction group, switched on and off) ----------
  const lampG = new THREE.BoxGeometry(.26, .26, .06), DIM = { r:0x3a0a0a, y:0x3a300a, g:0x0a3018 }, LIT = { r:0xff2a1a, y:0xffc21a, g:0x2aff6a };
  sig.forEach(j => { j.grp = new THREE.Group(); j.lm = [{}, {}]; for(const g of [0, 1]) [['r', .43], ['y', 0], ['g', -.43]].forEach(([c, dy]) => { const gs = (j.heads || []).filter(h => h.g === g).map(h => { const ge = lampG.clone(); ge.rotateY(h.ry); ge.translate(h.x, h.y + dy, h.z); return ge; }); if(!gs.length) return;
      const m = new THREE.Mesh(mergeGeometries(gs, false), new THREE.MeshBasicMaterial({ color:DIM[c] })); j.grp.add(m); j.lm[g][c] = m.material; });
    j.walk = [0, 1].map(g => { const gs = (j.heads || []).filter(h => h.g === g).map(h => { const ge = new THREE.BoxGeometry(.3, .26, .07); ge.rotateY(h.ry); ge.translate(h.x, Math.max(2.4, h.y - 2.2), h.z); return ge; }); if(!gs.length) return null; const m = new THREE.Mesh(mergeGeometries(gs, false), new THREE.MeshBasicMaterial({ color:0xff7a1a })); j.grp.add(m); return m.material; }); G.scene.add(j.grp); });

  // ---------- cars ----------
  const cols = ['#a33', '#335', '#ddd', '#2a6a3a', '#d8b84a', '#6a2a6a', '#8a8a8a', '#1a3a6a', '#c87a2a'], cars = [];
  TL.forEach((l, li) => { if(l.len < 70) return; const n = Math.max(1, Math.round(l.len / (l.k === 3 ? 280 : 180)));
    for(const dir of [1, -1]) for(let k = 0; k < n; k++){ const car = E.makeCar(cols[(li * 3 + k + (dir > 0 ? 0 : 4)) % 9], { suv:(li + k) % 3 === 0, lights:true }); car.rotation.order = 'YXZ'; G.scene.add(car);
      const col = { x0:0, x1:0, z0:0, z1:0, y0:0, y1:1.6 }; G.colliders.push(col); const c = { car, col, l, dir, s:l.len * ((k + (dir > 0 ? .25 : .75)) / n), v:8, seg:1, waitT:0, cleared:null, vmax:l.k === 0 ? 15 : l.k === 3 ? 9 : 12 }; cars.push(c); l.lanes[dir].push(c); } });
  // a school bus on the street nearest Belleville West: stops every half minute
  { const bl = TL.filter(l => l.len > 200).sort((a, b) => Math.hypot(a.p[0][0] + 218, a.p[0][1] + 630) - Math.hypot(b.p[0][0] + 218, b.p[0][1] + 630))[0]; if(bl){ const car = E.makeCar('#f2c21a', { type:'van' }); car.scale.set(1.15, 1.3, 2.1); car.rotation.order = 'YXZ'; G.scene.add(car); const col = { x0:0, x1:0, z0:0, z1:0, y0:0, y1:2.4 }; G.colliders.push(col); const c = { car, col, l:bl, dir:1, s:5, v:6, seg:1, waitT:0, cleared:null, vmax:9, bus:true }; cars.push(c); bl.lanes[1].push(c); } }
  const tick = dt => { const off = !!G.noTraffic, px0 = P.p.x, pz0 = P.p.z;
    for(const j of sig){ const near = Math.abs(j.x - px0) + Math.abs(j.z - pz0) < 240; j.grp.visible = near; if(!near) continue; for(const g of [0, 1]){ const ph = phase(j, g), m = j.lm[g]; for(const c of ['r', 'y', 'g']) if(m[c]) m[c].color.setHex(ph === c ? LIT[c] : DIM[c]); const w = j.walk && j.walk[g]; if(w) w.color.setHex(ph === 'g' && greenLeft(j, g) > 5 ? 0xf2f2f2 : (ph === 'g' && Math.floor(G.t * 2) % 2) ? 0x3a1a0a : 0xff7a1a); } }
    for(const c of cars){ const l = c.l, total = l.len, cum = l.cum, dir = c.dir, u = dir > 0 ? c.s : total - c.s; let seg = c.seg; while(seg < cum.length - 1 && cum[seg] < u) seg++; while(seg > 1 && cum[seg - 1] > u) seg--; c.seg = seg;
      const a = l.p[seg - 1], b = l.p[seg], L = cum[seg] - cum[seg - 1] || 1, f = (u - cum[seg - 1]) / L; let fx = (b[0] - a[0]) / L * dir, fz = (b[1] - a[1]) / L * dir, px = a[0] + (b[0] - a[0]) * f - fz * 1.9, pz = a[1] + (b[1] - a[1]) * f + fx * 1.9;
      const Q = G.SQ; if(Q){ const dx = px - Q.x, dz = pz - Q.z, dd = Math.hypot(dx, dz); if(dd < 19 && dd > .01){ px = Q.x + dx / dd * 19; pz = Q.z + dz / dd * 19; let tx = -dz / dd, tz = dx / dd; if(tx * fx + tz * fz < 0){ tx = -tx; tz = -tz; } fx = tx; fz = tz; } }
      // the next controlled junction on this street, in the direction of travel
      let stp = null, ds = 0; const arr = l.stops; for(let k = 0; k < arr.length; k++){ const st = arr[dir > 0 ? k : arr.length - 1 - k], d = (st.u - u) * dir; if(d < -9) continue; stp = st; ds = d; break; }
      if(stp && ds < .6 && ds > -1.5 && c.turnJ !== stp.j && !c.bus){ c.turnJ = stp.j; const arms = stp.j.arms.filter(r => TL[r.li] !== l && TL[r.li].len >= 70); if(arms.length && Math.random() < .35){ const r = arms[Math.random() * arms.length | 0], nl = TL[r.li], nd = r.u < 12 ? 1 : r.u > nl.len - 12 ? -1 : (Math.random() < .5 ? 1 : -1);
          if(stp.j.occ === c) stp.j.occ = null; c.cleared = null; l.lanes[dir].splice(l.lanes[dir].indexOf(c), 1); nl.lanes[nd].push(c); c.l = nl; c.dir = nd; const u2 = r.u + nd * 1.6; c.s = nd > 0 ? u2 : nl.len - u2; c.seg = 1; c.turnJ = stp.j; c.vmax = nl.k === 0 ? 15 : nl.k === 3 ? 9 : 12; c.v = Math.min(c.v, 6); continue; } }
      if(c.cleared && (!stp || stp.j !== c.cleared)){ if(c.cleared.occ === c) c.cleared.occ = null; c.cleared = null; }
      let vT = c.vmax; if(c.bus){ c.busT = (c.busT || 0) + dt; if(c.busT % 34 > 27) vT = 0; }
      if(stp && ds < 60){ const j = stp.j, dl = ds - 8.2; let must = false;                                    // dl = distance to the stop line
        if(j.occ && G.t - j.occT > 14) j.occ = null;                                                            // nobody holds a junction for ever
        if(j.type === 'signal'){ const ph = phase(j, stp.g); must = dl > -3 && (ph === 'r' || (ph === 'y' && dl > 5)); }
        else if(stp.stop){ if(c.cleared !== j && dl > -3){ must = true; if(dl < 1.4 && c.v < .5){ c.waitT += dt; if(c.waitT > .9 && !j.occ && G.t - j.thruT > .6 && G.t > j.pedT){ c.cleared = j; j.occ = c; j.occT = G.t; c.waitT = 0; must = false; } } } }
        else { if(ds < 26 && ds > -6) j.thruT = G.t; if(G.t < j.pedT && dl > -1 && dl < 40) must = true; }       // through traffic has right of way, but yields to someone already crossing
        if(must){ vT = dl <= .9 ? 0 : Math.min(vT, Math.sqrt(6 * (dl - .8))); if(dl <= .5) c.v = 0; } }
      for(const o of l.lanes[dir]){ if(o === c) continue; const gap = ((o.s - c.s) % total + total) % total; if(gap < 13 + c.v) vT = Math.min(vT, Math.max(0, (gap - 6.5) * 1.4)); }
      const rx = px0 - px, rz = pz0 - pz, ah = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx); if(ah > 0 && ah < 9 && side < 2.6) vT = 0;
      c.v += (vT - c.v) * Math.min(1, dt * (vT < c.v ? 5 : 1.1)); if(c.v < .02) c.v = 0; c.s += c.v * dt; if(c.s > total){ c.s -= total; c.waitT = 0; if(c.cleared){ if(c.cleared.occ === c) c.cleared.occ = null; c.cleared = null; } }
      const py = T(px, pz); c.car.position.set(px, py, pz); c.car.rotation.y = Math.atan2(fx, fz); c.car.rotation.x = -Math.atan((T(px + fx * 2, pz + fz * 2) - T(px - fx * 2, pz - fz * 2)) / 4);
      const lx = Math.abs(fx) > Math.abs(fz), col = c.col; if(lx){ col.x0 = px - 2.2; col.x1 = px + 2.2; col.z0 = pz - 1; col.z1 = pz + 1; } else { col.x0 = px - 1; col.x1 = px + 1; col.z0 = pz - 2.2; col.z1 = pz + 2.2; } col.y0 = py - .5; col.y1 = py + 1.6; col.off = off;
      c.car.visible = !off && Math.abs(px - px0) + Math.abs(pz - pz0) < 170; }
    // ---------- pedestrians ----------
    for(const p of peds){ const n = p.n; if(n.path) continue;
      if(p.wait){ const st = p.wait, j = st.j, ok = j.type === 'signal' ? greenLeft(j, st.g) > 7 : (G.t - j.thruT > 1.3 && !j.occ); if(ok){ if(j.type !== 'signal') j.pedT = G.t + 19 / p.sp + .5; go(p, st.u + p.dir * 9.5); p.wait = null; } continue; }
      let st = null; for(let k = 0; k < p.l.stops.length; k++){ const q = p.l.stops[p.dir > 0 ? k : p.l.stops.length - 1 - k]; if((q.u - p.u) * p.dir > 9.4){ st = q; break; } }
      const tgt = st ? st.u - p.dir * 9.5 : (p.dir > 0 ? p.l.len - 3 : 3); if((tgt - p.u) * p.dir > 1) go(p, tgt); else if(st) p.wait = st; else p.dir = -p.dir; } };
  // a point u along a street, pushed sideways onto its sidewalk
  const at = (l, u, side) => { let seg = 1; while(seg < l.cum.length - 1 && l.cum[seg] < u) seg++; const a = l.p[seg - 1], b = l.p[seg], L = l.cum[seg] - l.cum[seg - 1] || 1, f = Math.max(0, Math.min(1, (u - l.cum[seg - 1]) / L)), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, o = side * ((l.hw || 4) + 1.3); return [a[0] + (b[0] - a[0]) * f - tz * o, a[1] + (b[1] - a[1]) * f + tx * o]; };
  const go = (p, u1) => { const pts = [], n = Math.max(1, Math.ceil(Math.abs(u1 - p.u) / 7)); for(let k = 1; k <= n; k++) pts.push(at(p.l, p.u + (u1 - p.u) * k / n, p.side)); p.u = u1; p.n.go(pts, p.sp); };
  const peds = []; { let seed = 4711; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[rnd() * a.length | 0];
    const anchors = [[100, 150], [290, 240], [0, 24], [(G.SQ || {}).x || -428, (G.SQ || {}).z || 257], [-218, -630]], mid = l => l.p[l.p.length >> 1], near = l => Math.min(...anchors.map(a => Math.hypot(mid(l)[0] - a[0], mid(l)[1] - a[1])));
    const lines = TL.filter(l => !l.core && l.k >= 1 && l.len > 110).sort((a, b) => near(a) - near(b)).slice(0, 16);
    lines.forEach((l, i) => { for(let k = 0; k < 2; k++){ const fem = rnd() < .5, look = { shirt:pick(['#8a5a9a', '#3a7a6a', '#a8743a', '#5a6aa8', '#aa5544', '#557755', '#d8d0c0', '#2a2a3a', '#c8a020']), pants:pick(['#334', '#2a3a5a', '#4a4a4a', '#5a4a3a', '#1f2a3a']), hair:pick(['#222', '#a87a4a', '#3a2414', '#ddd', '#6a3a1a']), long:fem, skin:pick(['#e8b890', '#c68642', '#8d5524', '#f1c27d']) };
        const p = { l, side:k ? 1 : -1, dir:k ? 1 : -1, u:l.len * (.2 + .6 * rnd()), sp:1.4 + rnd() * .6, wait:null }, [x, z] = at(l, p.u, p.side), n = E.npc('', look, x, z, { speed:p.sp }); n.townie = true; n.noLaw = true; p.n = n; peds.push(p); } }); }
  G.townPeds = peds; G.trafficCars = cars; tick.amb = true; G.ticks.push(tick); }
