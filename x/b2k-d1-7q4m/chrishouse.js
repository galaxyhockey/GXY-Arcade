// Back in the 2000s: The Game — Chris's house, rebuilt: real window/door openings, kitchen, rooms, railings, exterior trim.
// Footprint x -8..8, z -12..4 plus a sunroom to the west (front faces +z / Oakmont Drive). Ground floor y 0, upstairs y 3.2.
import { THREE, G, box, plane, floor, ramp, mat, txMat, noise, makeCar, mapRect } from './engine.js';
import * as PR from './props.js';
import { sidingM, brickM } from './buildings.js';
const S = G.scene, UP = 3.2, T = .22;
const paint = mat('#efe7d6'), trim = mat('#ffffff'), wood = mat('#8a5a32'), cab = mat('#a8794a'), top = mat('#d8d0c0');
const glassM = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.35, emissive:0x223344 });
const sid0 = sidingM('#e4ddc8', [6, 2]); let sid = sid0, inP = paint; // inP = the inside-face paint of outer walls
export function setSiding(m){ sid = m || sid0; }
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
// wall along X at z (out = +1 means the +z face is outside), with openings [{a, b, lo, hi}] in x
export function wallX(x0, x1, z, y0, h, out, ops = []){ const mats = [inP, inP, inP, inP, out > 0 ? sid : inP, out > 0 ? inP : sid];
  const cuts = [...ops].sort((p, q) => p.a - q.a); let x = x0;
  const seg = (a, b, lo, hi) => { if(b - a > .01 && hi - lo > .01) box(b - a, hi - lo, T, mats, (a + b) / 2, lo, z); };
  for(const o of cuts){ seg(x, o.a, y0, y0 + h); seg(o.a, o.b, y0, y0 + o.lo); seg(o.a, o.b, y0 + o.hi, y0 + h); frameX(o, z, y0, out); x = o.b; }
  seg(x, x1, y0, y0 + h); }
export function wallZ(z0, z1, x, y0, h, out, ops = []){ const mats = [out > 0 ? sid : inP, out > 0 ? inP : sid, inP, inP, inP, inP];
  const cuts = [...ops].sort((p, q) => p.a - q.a); let z = z0;
  const seg = (a, b, lo, hi) => { if(b - a > .01 && hi - lo > .01) box(T, hi - lo, b - a, mats, x, lo, (a + b) / 2); };
  for(const o of cuts){ seg(z, o.a, y0, y0 + h); seg(o.a, o.b, y0, y0 + o.lo); seg(o.a, o.b, y0 + o.hi, y0 + h); frameZ(o, x, y0, out); z = o.b; }
  seg(z, z1, y0, y0 + h); }
function frameX(o, z, y0, out){ const w = o.b - o.a, cx = (o.a + o.b) / 2, lo = y0 + o.lo, hi = y0 + o.hi;
  [-1, 1].forEach(s => { const fz = z + s * (T / 2 + .03); deco(w + .2, .1, .06, trim, cx, hi, fz); deco(.1, hi - lo, .06, trim, o.a - .05, lo, fz); deco(.1, hi - lo, .06, trim, o.b + .05, lo, fz); if(!o.door) deco(w + .3, .07, .16, trim, cx, lo - .07, fz); });
  if(!o.door && !o.noGlass){ const g = new THREE.Mesh(new THREE.PlaneGeometry(w, hi - lo), glassM); g.position.set(cx, (lo + hi) / 2, z); S.add(g); deco(.05, hi - lo, .05, trim, cx, lo, z); deco(w, .05, .05, trim, cx, (lo + hi) / 2, z); }
  if(o.shutter){ const sm = mat(o.shutter); [-1, 1].forEach(s => deco(w * .45, hi - lo + .05, .05, sm, cx + s * (w / 2 + w * .26 + .08), lo - .02, z + out * (T / 2 + .04))); } }
function frameZ(o, x, y0, out){ const w = o.b - o.a, cz = (o.a + o.b) / 2, lo = y0 + o.lo, hi = y0 + o.hi;
  [-1, 1].forEach(s => { const fx = x + s * (T / 2 + .03); deco(.06, .1, w + .2, trim, fx, hi, cz); deco(.06, hi - lo, .1, trim, fx, lo, o.a - .05); deco(.06, hi - lo, .1, trim, fx, lo, o.b + .05); if(!o.door) deco(.16, .07, w + .3, trim, fx, lo - .07, cz); });
  if(!o.door && !o.noGlass){ const g = new THREE.Mesh(new THREE.PlaneGeometry(w, hi - lo), glassM); g.rotation.y = Math.PI / 2; g.position.set(x, (lo + hi) / 2, cz); S.add(g); deco(.05, hi - lo, .05, trim, x, lo, cz); } }

export function buildChrisHouse(){
  // Layout follows the author's floor-plan sketches (street = +z, driveway + garage = west, back yard = north, bedrooms = east).
  // MAIN FLOOR  living x -8..3.6 z -5..4 | parents' bedroom x 3.6..8 z -5..4 | kitchen x -8..-.4 z -12..-5 | hall z -7..-5 |
  //             stairs x -.4..2 z -12..-7 (west flight up, east flight = basement door) | bath x 2..4.4 | bedroom 2 x 4.4..8 | sunroom x -13..-8 z -1.4..4
  // UPSTAIRS    Chris's room x -8..-.4 (whole depth, gable window west) | bath in the middle | U-shaped hall round it | bedroom x 4.4..8
  const gray = mat('#c6c3be', { emissive:0x45433f }); inP = gray; const CREAM = brickM('#f3e8c2', '#dcd2b0', [5, 2], 'chb'), MAR = mat('#6e2a34'), stucco = mat('#f4ead0', { emissive:0x1c1a14 }), conc = mat('#b9b3a8'), K = x => x - 8.3, L = z => z + 6.4;
  const paintW = paint, TAN = .84, hAt = z => Math.min(3, 1.2 + TAN * (8 - Math.abs(z + 4))); // upstairs wall height under the roof slope
  sid = CREAM;
  const col = (x0, z0, x1, z1, y0, y1) => G.colliders.push({ x0, x1, z0, z1, y0, y1 });
  // interior walls (painted both sides) with door gaps [a, b]
  const iwX = (x0, x1, z, y0, h, doors = [], m = gray) => { let x = x0; for(const [a, b] of [...doors].sort((p, q) => p[0] - q[0])){ if(a - x > .01) box(a - x, h, .14, m, (x + a) / 2, y0, z); if(h > 2.25) box(b - a, h - 2.2, .14, m, (a + b) / 2, y0 + 2.2, z, { col:false }); [a, b].forEach(e => deco(.08, 2.2, .2, trim, e, y0, z)); x = b; } if(x1 - x > .01) box(x1 - x, h, .14, m, (x + x1) / 2, y0, z); };
  const iwZ = (z0, z1, x, y0, h, doors = [], m = gray) => { let z = z0; for(const [a, b] of [...doors].sort((p, q) => p[0] - q[0])){ if(a - z > .01) box(.14, h, a - z, m, x, y0, (z + a) / 2); if(h > 2.25) box(.14, h - 2.2, b - a, m, x, y0 + 2.2, (a + b) / 2, { col:false }); [a, b].forEach(e => deco(.2, 2.2, .08, trim, x, y0, e)); z = b; } if(z1 - z > .01) box(.14, h, z1 - z, m, x, y0, (z + z1) / 2); };
  // an upstairs wall running front-to-back, clipped to the roof slope (so nothing pokes through the shingles)
  const slopeZ = (z0, z1, x, doors = [], m = gray, thick = .14, hole) => { let z = z0; const hX = zz => (x >= -.45 && x <= 4.45 && zz < -4) ? 3 : hAt(zz); const piece = (a, b, lo) => { if(b - a < .02) return; const sh = new THREE.Shape(), pts = [[a, lo], [b, lo], [b, hX(b)]]; [1.857, -4, -9.857].forEach(k => { if(k > a && k < b) pts.push([k, hX(k)]); }); pts.push([a, hX(a)]);
      pts.forEach(([zz, y], i) => i ? sh.lineTo(-zz, y) : sh.moveTo(-zz, y)); sh.closePath(); if(hole && hole[0] >= a && hole[1] <= b){ const hp = new THREE.Path(); hp.moveTo(-hole[0], hole[2]); hp.lineTo(-hole[1], hole[2]); hp.lineTo(-hole[1], hole[3]); hp.lineTo(-hole[0], hole[3]); hp.closePath(); sh.holes.push(hp); }
      const g = new THREE.ExtrudeGeometry(sh, { depth:thick, bevelEnabled:false }); g.translate(0, 0, -thick / 2); g.rotateY(Math.PI / 2); const me = new THREE.Mesh(g, m); me.position.set(x, UP, 0); me.castShadow = true; me.receiveShadow = true; S.add(me); if(lo === 0) col(x - thick / 2, a, x + thick / 2, b, UP, UP + Math.max(hX(a), hX(b))); };
    for(const [a, b] of [...doors].sort((p, q) => p[0] - q[0])){ piece(z, a, 0); piece(a, b, 2.2); [a, b].forEach(e => deco(.2, 2.2, .08, trim, x, UP, e)); z = b; } piece(z, z1, 0); };
  // full gable end (knee wall to ridge) with an optional window hole [z0, z1, lo, hi]
  const gable = (x, hole) => { const sh = new THREE.Shape(); [[-12, 0], [4, 0], [4, 1.2], [-4, 7.92], [-12, 1.2]].forEach(([zz, y], i) => i ? sh.lineTo(-zz, y) : sh.moveTo(-zz, y)); sh.closePath();
    if(hole){ const hp = new THREE.Path(); hp.moveTo(-hole[0], hole[2]); hp.lineTo(-hole[1], hole[2]); hp.lineTo(-hole[1], hole[3]); hp.lineTo(-hole[0], hole[3]); hp.closePath(); sh.holes.push(hp); }
    const g = new THREE.ExtrudeGeometry(sh, { depth:T, bevelEnabled:false }); g.translate(0, 0, -T / 2); g.rotateY(Math.PI / 2); const me = new THREE.Mesh(g, stucco); me.position.set(x, UP, 0); me.castShadow = true; me.receiveShadow = true; S.add(me); col(x - T / 2, -12, x + T / 2, 4, UP, UP + 8);
    const o = x < 0 ? -1 : 1; [[4, 1.2, -4, 7.92], [-12, 1.2, -4, 7.92]].forEach(([za, ya, zb, yb]) => { const len = Math.hypot(zb - za, yb - ya), r = new THREE.Mesh(new THREE.BoxGeometry(.12, .28, len + .5), MAR); r.position.set(x + o * (T / 2 + .08), UP + (ya + yb) / 2 - .05, (za + zb) / 2); r.rotation.x = Math.atan2(yb - ya, za - zb) * (za > zb ? 1 : 1); S.add(r); });
    if(hole){ const cz = (hole[0] + hole[1]) / 2, w = hole[1] - hole[0], gl = new THREE.Mesh(new THREE.PlaneGeometry(w, hole[3] - hole[2]), glassM); gl.rotation.y = Math.PI / 2; gl.position.set(x, UP + (hole[2] + hole[3]) / 2, cz); S.add(gl);
      [-1, 1].forEach(s => { const fx = x + s * (T / 2 + .03); deco(.06, .1, w + .24, trim, fx, UP + hole[3], cz); deco(.16, .07, w + .3, trim, fx, UP + hole[2] - .07, cz); deco(.06, hole[3] - hole[2], .1, trim, fx, UP + hole[2], hole[0] - .05); deco(.06, hole[3] - hole[2], .1, trim, fx, UP + hole[2], hole[1] + .05); deco(.06, hole[3] - hole[2], .12, trim, fx, UP + hole[2], cz); }); } };

  // ---------- ground floor shell (cream brick, real openings) ----------
  wallX(-8, 8, 4, 0, UP, 1, [{ a:-7.6, b:-6.2, lo:.9, hi:2.3 }, { a:-2.8, b:-1.4, lo:.9, hi:2.3 }, { a:-.8, b:.8, lo:0, hi:2.3, door:true }, { a:4.9, b:6.7, lo:.9, hi:2.3 }]);
  wallX(-8, 8, -12, 0, UP, -1, [{ a:-3.4, b:-2, lo:1.15, hi:2.2 }, { a:2.9, b:3.5, lo:1.5, hi:2.2 }, { a:5.4, b:6.8, lo:.9, hi:2.3 }]);
  wallZ(-12, 4, -8, 0, UP, -1, [{ a:-11.2, b:-10, lo:0, hi:2.3, door:true }, { a:-8.4, b:-5.6, lo:.9, hi:2.3, noGlass:true }, { a:1, b:2.2, lo:0, hi:2.3, door:true }]);
  wallZ(-12, 4, 8, 0, UP, 1, [{ a:-10.4, b:-9, lo:.9, hi:2.3 }, { a:-1.4, b:.2, lo:.9, hi:2.3 }]);
  const kw = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.4, 2.8), glassM); kw.position.set(-8, 1.6, -7); S.add(kw); G.kitchenWindow = kw; deco(.05, 1.4, .05, trim, -8, .9, -7);
  // knee walls + gable ends upstairs, maroon fascia, foundation
  wallX(-8, 8, 4, UP, 1.2, 1); wallX(-8, 8, -12, UP, 1.2, -1); gable(-8, [-5.3, -2.7, .9, 2.3]); gable(8, [-4.8, -3.2, .9, 2.2]);
  { const fm2 = mat('#8f8a82'); deco(16.6, .45, .2, fm2, 0, -.3, 4.2); deco(16.6, .45, .2, fm2, 0, -.3, -12.2); deco(.2, .45, 16.6, fm2, -8.2, -.3, -4); deco(.2, .45, 16.6, fm2, 8.2, -.3, -4); }
  const rm = txMat('chroof', (g, w, h) => { noise(g, w, h, '#7a5a44', .22, 3000); for(let y = 0; y < h; y += 10){ g.fillStyle = 'rgba(40,20,10,.3)'; g.fillRect(0, y, w, 2); for(let x = (y / 10) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 2, 10); } }, [6, 4]);
  { const ang = Math.atan(TAN), len = Math.hypot(8, 8 * TAN) + 1; [-1, 1].forEach(s => { (s > 0 ? [[17.3, 0]] : [[8.25, -4.525], [4.25, 6.525]]).forEach(([w, cx]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, .18, len), rm); r.position.set(cx, UP + 1.2 + 4 * TAN + .04, -4 + s * 4.12); r.rotation.x = s * ang; r.castShadow = true; S.add(r); });
      if(s < 0){ const L2 = 5.86 / Math.cos(ang) + .3, r = new THREE.Mesh(new THREE.BoxGeometry(4.8, .18, L2), rm); r.position.set(2, UP + 1.2 + 5.07 * TAN + .04, -6.93); r.rotation.x = s * ang; r.castShadow = true; S.add(r);
        const dr = new THREE.Mesh(new THREE.BoxGeometry(5.5, .16, 2.9), rm); dr.position.set(2, UP + 3.12, -10.85); dr.rotation.x = .05; dr.castShadow = true; S.add(dr); box(4.94, 1.84, T, stucco, 2, UP + 1.2, -12); deco(5.1, .16, .1, MAR, 2, UP + 2.96, -12.16);
        const dw = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), glassM); dw.rotation.y = Math.PI; dw.position.set(2.6, UP + 2.1, -12.12); S.add(dw); [[1.7, .08, 0, .54], [1.7, .08, 0, -.54], [.08, 1.1, .82, 0], [.08, 1.1, -.82, 0]].forEach(([w, h, dx, dy]) => deco(w, h, .06, trim, 2.6 + dx, UP + 2.1 + dy - h / 2, -12.14));
        [-.47, 4.47].forEach(x => { const sh = new THREE.Shape(); sh.moveTo(12, 1.2); sh.lineTo(9.86, 3); sh.lineTo(12, 3); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth:.1, bevelEnabled:false }); g.translate(0, 0, -.05); g.rotateY(Math.PI / 2); const m = new THREE.Mesh(g, stucco); m.position.set(x, UP, 0); S.add(m); }); }
      deco(17.3, .26, .14, MAR, 0, UP + 1.02, -4 + s * 8.5); deco(17.1, .12, .16, mat('#e8e8e2'), 0, UP + .92, -4 + s * 8.6);                                   // fascia + gutter
      (s > 0 ? [[15.7, 0]] : [[7.42, -4.16], [3.42, 6.16]]).forEach(([w, cx]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, .08, 2.86), paintW); c.position.set(cx, UP + 1.2 + 1.07 * TAN - .22, -4 + s * (8 - 1.07)); c.rotation.x = s * ang; S.add(c); }); });   // sloped ceiling inside
    deco(17.3, .2, .34, mat('#5a4030'), 0, UP + 1.2 + 8 * TAN - .02, -4); deco(15.7, .08, 11.72, new THREE.MeshBasicMaterial({ color:0xe9e5dc }), 0, UP + 3, -4); deco(4.9, .08, 2.2, new THREE.MeshBasicMaterial({ color:0xe9e5dc }), 2, UP + 3, -10.94); }
  box(1.3, 12.4, 1.1, brickM('#8a4a36'), 8.7, 0, -8.6);                                                                        // brick chimney
  // ---------- front stoop, door with the oval glass, coach lights, shrubs ----------
  box(2.8, .2, 1.5, conc, 0, 0, 4.75, { col:false }); G.platforms.push({ x0:-1.4, z0:4, x1:1.4, z1:5.5, y:.2 }); deco(3.4, .1, .5, conc, 0, 0, 5.7);
  [-1.25, 1.25].forEach(x => { deco(.1, .1, .14, mat('#2a2420'), x, 2.05, 4.16); deco(.16, .3, .16, mat('#fff3c8', { emissive:0x8a7a40 }), x, 1.75, 4.22); deco(.2, .06, .2, mat('#2a2420'), x, 2.05, 4.22); });
  deco(1.9, .16, .12, MAR, 0, 2.34, 4.16); [-.92, .92].forEach(x => deco(.12, 2.4, .12, trim, x, 0, 4.16));
  const door = new THREE.Group(); door.position.set(-.8, 0, 3.9); door.rotation.y = -Math.PI * .45; S.add(door); const dl = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.25, .08), mat('#f1eee6')); dl.position.set(.78, 1.13, 0); door.add(dl);
  [-1, 1].forEach(s => { const ov = new THREE.Mesh(new THREE.CircleGeometry(.5, 20), mat('#9fb8c8')); ov.scale.set(.56, 1.3, 1); ov.position.set(.78, 1.3, s * .045); if(s < 0) ov.rotation.y = Math.PI; door.add(ov); });
  [[-6.6, 1.5], [-4.4, 1.25], [-2.2, 1.05], [2.3, 1.2], [4, 1.5], [6.4, 1.3]].forEach(([x, s]) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.95 * s, 1), mat(x > 3 ? '#2f5a34' : '#27482a')); b.position.set(x, .6 * s, 5.5); b.scale.set(1.15, .8, .95); b.castShadow = true; S.add(b); });
  { const sp = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.6, 7), mat('#2f5a4a')); sp.position.set(9.6, 2.3, 4.6); sp.castShadow = true; S.add(sp); col(9.2, 4.2, 10, 5, 0, 3); }               // the blue spruce at the corner
  // ---------- sunroom (west of the living room) ----------
  wallX(-13, -8, 4, 0, 2.8, 1, [{ a:-12.4, b:-8.6, lo:.7, hi:2.4 }]); wallX(-13, -8, -1.4, 0, 2.8, -1, [{ a:-11.4, b:-10.4, lo:0, hi:2.2, door:true }, { a:-9.8, b:-8.5, lo:.7, hi:2.4 }]); wallZ(-1.4, 4, -13, 0, 2.8, -1, [{ a:-.8, b:3.4, lo:.7, hi:2.4 }]);
  deco(5.6, .22, 6, mat('#5a4a40'), -10.6, 2.8, 1.3); deco(5.7, .2, .14, MAR, -10.6, 2.72, 4.34); plane(5, 5.4, txMat('chsun', (g, w, h) => { g.fillStyle = '#b8a890'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8f8068'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [5, 5]), -10.5, .02, 1.3);
  deco(5, .1, 5.4, new THREE.MeshBasicMaterial({ color:0xe9e5dc }), -10.5, 2.7, 1.3); PR.sofa(-10.6, 3.2, Math.PI, '#b9a98a'); col(-11.9, 2.7, -9.3, 3.7, 0, 1); deco(1, .45, .6, wood, -10.6, 0, 1.4);
  [[-12.4, .3], [-8.7, -.8]].forEach(([x, z]) => { cylp(x, z); });
  function cylp(x, z){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .17, .4, 10), mat('#f4f4f0')); p.position.set(x, .2, z); S.add(p); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 0), mat('#3f8a3a')); l.position.set(x, .72, z); S.add(l); }
  // ---------- floors / ceilings / stairs ----------
  [[-8, -12, .8, 4], [2, -12, 8, 4], [.8, -7.2, 2, 4]].forEach(r => floor(...r, 0, null)); floor(-13, -1.4, -8, 4, 0, null);   // the main floor, minus the basement stairwell
  const oak = txMat('choak', (g, w, h) => { noise(g, w, h, '#b07a44', .12); g.strokeStyle = '#8a5a2c'; g.lineWidth = 1; for(let y = 0; y < h; y += 16){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for(let x = (y * 7) % 40; x < w; x += 44){ g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } }, [1, 1]);
  const rp = (m, x, y) => { const c = m.clone(); c.map = m.map.clone(); c.map.needsUpdate = true; c.map.repeat.set(x, y); return c; };
  const stone = txMat('chstone', (g, w, h) => { noise(g, w, h, '#a8a6a0', .12, 2600); g.strokeStyle = '#8a8882'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, [1, 1]);
  const btile = txMat('chbt', (g, w, h) => { g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9c2ae'; g.lineWidth = 2; for(let i = 0; i <= 4; i++){ g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); } }, [1, 1]);
  const carpet = txMat('chcarp', (g, w, h) => noise(g, w, h, '#8f8c88', .2, 3000), [1, 1]);
  plane(11.6, 9, rp(oak, 6, 5), -2.2, .02, -.5); plane(8.4, 2, rp(oak, 5, 1), 3.8, .02, -6); plane(4.4, 9, rp(carpet, 3, 6), 5.8, .021, -.5); plane(3.6, 5, rp(carpet, 3, 4), 6.2, .021, -9.5);
  plane(7.6, 7, rp(stone, 5, 5), -4.2, .02, -8.5); plane(2.4, 5, rp(btile, 2, 4), 3.2, .02, -9.5);
  const ceil = new THREE.MeshBasicMaterial({ color:0xe9e5dc });
  // upstairs floor: everything except the stairwell (x -.4...8, z -11.4..-7)
  [[-8, -12, -.4, 4], [.8, -12, 8, 4], [-.4, -12, .8, -10.8], [-.4, -7, .8, 4]].forEach(([x0, z0, x1, z1]) => { floor(x0, z0, x1, z1, UP, null); deco(x1 - x0, .2, z1 - z0, ceil, (x0 + x1) / 2, UP - .2, (z0 + z1) / 2); });
  plane(7.6, 16, rp(carpet, 5, 10), -4.2, UP + .02, -4); plane(8.4, 16, rp(oak, 5, 9), 3.8, UP + .02, -4); plane(1.2, 1.2, rp(oak, 1, 1), .2, UP + .02, -11.4); plane(1.2, 11, rp(oak, 1, 6), .2, UP + .021, -1.5);
  ramp(-.4, -10.8, .8, -7, 'z', UP, 0);
  for(let i = 0; i < 12; i++){ const z = -7 - (i + .5) * (3.8 / 12); deco(1.2, (i + 1) * .267, 3.8 / 12, gray, .2, 0, z); deco(1.2, .06, 3.8 / 12 + .04, wood, .2, (i + 1) * .267, z); }
  deco(.06, .06, 4.9, mat('#6a4428'), -.28, 1.9, -8.9).rotation.x = -Math.atan2(3.2, 3.8);                                         // handrail
  // ---------- ground-floor partitions ----------
  iwX(-8, 3.6, -5, 0, UP, [[-7.7, -6.5], [.2, 1.8]]); iwX(3.6, 8, -5, 0, UP, [[5.6, 6.6]]); iwZ(-5, 4, 3.6, 0, UP);
  iwZ(-12, -5, -.4, 0, UP, [[-6.6, -5.4]]); iwX(.8, 8, -7, 0, UP, [[.95, 1.85], [2.7, 3.6], [6, 7]]); iwZ(-12, -7, .8, 0, UP); iwZ(-12, -7, 2, 0, UP); iwZ(-12, -7, 4.4, 0, UP);
  deco(5.9, .95, .03, trim, -3.45, 0, -5.09);                                               // kitchen wainscot
  // ---------- upstairs partitions (bath in the middle, hall wraps round it) ----------
  slopeZ(-12, 4, -.4, [[-1, .1]]); slopeZ(-12, 4, 4.4, [[-5, -4]]); slopeZ(-10.8, -7, .8); slopeZ(-10.6, -1.4, 3, [[-4.6, -3.7]]);
  box(2.2, 3, .14, gray, 1.9, UP, -10.6); box(3.4, 3, .14, gray, 1.3, UP, -1.4); box(1.2, 3, .14, gray, .2, UP, -7); box(4.8, 3, .14, gray, 2, UP, .2);
  [[-3, 2.95, -1], [-4.2, 2.95, -8.5], [4, 2.95, -6], [5.8, 2.95, -1], [-4.2, UP + 2.93, -4], [3.7, UP + 2.93, -6], [6.2, UP + 2.93, -4]].forEach(([x, y, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .06, 14), new THREE.MeshBasicMaterial({ color:0xfff6dc })); l.position.set(x, y, z); S.add(l); });


  // ---------- basement (from the author's sketch): one big L along the street side and the east end, a laundry room with a
  //            bathroom in the back-west corner, a small empty room under the stairs. Chris's desk corner is the street-side
  //            east corner: white panelling, gray carpet, the tube TV and the push-button phone. ----------
  { const BY = -2.9, BH = 2.7, pan = txMat('chpanel', (g, w, h) => { g.fillStyle = '#ecebe6'; g.fillRect(0, 0, w, h); g.fillStyle = '#cfcec8'; for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 2, h); }, [1, 1]), PN = n => rp(pan, Math.max(1, Math.round(n)), 1), wh = mat('#f1eee6');
    G.pits = [{ x0:-8, z0:-12, x1:8, z1:4 }]; floor(-8, -12, 8, 4, BY, null); plane(16, 16, rp(carpet, 10, 10), 0, BY + .02, -4); plane(8.6, 8.8, rp(stone, 6, 6), -3.7, BY + .025, -7.5);
    [[-8, -12, .8, 4], [2, -12, 8, 4], [.8, -7.2, 2, 4]].forEach(([x0, z0, x1, z1]) => deco(x1 - x0, .1, z1 - z0, ceil, (x0 + x1) / 2, -.34, (z0 + z1) / 2));
    box(16.4, BH, .2, PN(10), 0, BY, 4.06); box(16.4, BH, .2, PN(10), 0, BY, -12.06); box(.2, BH, 16, PN(10), -8.06, BY, -4); box(.2, BH, 16, PN(10), 8.06, BY, -4);
    const bwX = (x0, x1, z, doors = []) => { let x = x0; for(const [a, b] of doors){ if(a - x > .01) box(a - x, BH, .12, PN((a - x) / 1.6), (x + a) / 2, BY, z); box(b - a, BH - 2.1, .12, PN(1), (a + b) / 2, BY + 2.1, z, { col:false }); x = b; } if(x1 - x > .01) box(x1 - x, BH, .12, PN((x1 - x) / 1.6), (x + x1) / 2, BY, z); };
    const bwZ = (z0, z1, x, doors = []) => { let z = z0; for(const [a, b] of doors){ if(a - z > .01) box(.12, BH, a - z, PN((a - z) / 1.6), x, BY, (z + a) / 2); box(.12, BH - 2.1, b - a, PN(1), x, BY + 2.1, (a + b) / 2, { col:false }); z = b; } if(z1 - z > .01) box(.12, BH, z1 - z, PN((z1 - z) / 1.6), x, BY, (z + z1) / 2); };
    bwX(-8, .8, -3, [[-3.2, -2.2]]); bwZ(-12, -3, .8); bwZ(-10.8, -7.2, 2); bwX(.8, 2, -7.2, [[.95, 1.85]]); box(1.2, .95, .12, PN(1), 1.4, BY, -9.7); bwZ(-12, -3, -5.2, [[-8, -7]]);
    // stairs down from the hall: open treads, so the little room underneath stays empty
    ramp(.8, -11.4, 2, -7, 'z', BY, 0); for(let i = 0; i < 12; i++){ const z = -7 - (i + .5) * (4.4 / 12); deco(1.2, .07, 4.4 / 12 + .05, wood, 1.4, -(i + 1) * (2.9 / 12), z); } deco(.06, .06, 5.3, mat('#6a4428'), 1.9, -.55, -9.2).rotation.x = Math.atan2(2.9, 4.4);
    // laundry room: washer + dryer, water heater, furnace, sink, the chute and its basket; bathroom at the west end
    box(.75, .95, .7, wh, -.1, BY, -11.5); box(.75, .95, .7, wh, -1, BY, -11.5); deco(.5, .06, .5, mat('#9aa0a6'), -.1, BY + .95, -11.5); deco(.3, .3, .02, mat('#26384a'), -1, BY + .5, -11.14);
    { const wt = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, 1.6, 12), mat('#d8d8d4')); wt.position.set(-2.4, BY + .8, -11.5); S.add(wt); } box(.9, 1.5, .8, mat('#9aa0a6'), -3.8, BY, -11.4); deco(.3, 1.2, .3, mat('#b8bcc0'), -3.8, BY + 1.5, -11.4);
    box(.7, .85, .55, wh, -4.7, BY, -3.5); deco(.5, .5, .5, mat('#b8bcc0'), -4.6, -.82, -6); deco(.7, .5, .7, mat('#c9b48a'), -4.6, BY, -6);
    box(.45, .42, .6, mat('#f4f4f0'), -7.4, BY, -11.4); box(.55, .85, .4, wh, -7.6, BY, -8.6); box(.9, 2, .9, mat('#cfe0ea'), -7.4, BY, -3.7);
    // the big L: old couch + TV, storage shelves and boxes
    PR.sofa(-4.6, 3.3, Math.PI, '#6a5a4a').position.y = BY; col(-5.9, 2.8, -3.3, 3.8, BY, BY + 1); PR.rug(-4.6, BY, 1, 3.4, 2.6, '#5a4a4a'); box(1.2, .5, .6, mat('#3a2a1a'), -4.6, BY, -2.5); PR.crtTV(-4.6, BY + .5, -2.5, 0, .8);
    [[-7.6, 0], [-7.6, -1.6]].forEach(([x, z]) => { box(.6, 1.9, 1.4, mat('#8a8f96'), x, BY, z); for(let k = 0; k < 3; k++) deco(.5, .36, .5, mat(['#b8935a', '#a8834a', '#c9a878'][k]), x + .05, BY + .2 + k * .6, z + (k % 2 ? .3 : -.3)); });
    [[6.9, -11.2], [7.4, -10.1], [6.2, -11.3]].forEach(([x, z], i) => { box(.9, .7, .8, mat(i % 2 ? '#a8834a' : '#b8935a'), x, BY, z); }); deco(.8, .5, .7, mat('#b8935a'), 6.9, BY + .7, -11.2);
    // Chris's desk corner
    box(3.2, .76, .9, mat('#6a3328'), 5.9, BY, 3.4); PR.crtTV(4.9, BY + .76, 3.45, Math.PI, .8); deco(.42, .08, .34, mat('#16181a'), 6.1, BY + .76, 3.5); deco(.2, .07, .09, mat('#16181a'), 6.1, BY + .86, 3.5); deco(.12, .12, .2, mat('#16181a'), 5.93, BY + .82, 3.42); deco(.12, .12, .2, mat('#16181a'), 6.27, BY + .82, 3.42);
    deco(1, .04, .34, mat('#1a1a1c'), 5.7, BY + .76, 3.05); deco(.5, .12, .9, mat('#2a2a2e'), 6.9, BY + .76, 3.5); PR.chair(5.8, BY, 2.4, Math.PI, '#333'); box(.6, 1.2, .8, mat('#b8a890'), 7.6, BY, 3.4); deco(.44, .03, .04, mat('#888'), 7.6, BY + .9, 2.98); deco(.44, .03, .04, mat('#888'), 7.6, BY + .4, 2.98);
    PR.rug(6, BY, 1.6, 2.6, 1.8, '#3a4a6a'); G.bdesk = { x:5.8, z:2.2, y:BY };
    [[-4, BY + BH - .06, 1], [5.5, BY + BH - .06, 0], [5, BY + BH - .06, -8], [-2, BY + BH - .06, -7.5]].forEach(([x, y, z]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(1.4, .06, .3), new THREE.MeshBasicMaterial({ color:0xfffbe8 })); l.position.set(x, y, z); S.add(l); }); }
  // ---------- living room (gray walls, oak floor; the old TV sits on the antique dresser) ----------
  const LEA = '#7a5a3c', CRM = '#d8cfb8';
  PR.sofa(-4.5, L(-10.7) - .05, 0, LEA); G.sofaCol = { x0:-5.8, x1:-3.2, z0:L(-11.2), z1:L(-10.2), y0:0, y1:1 }; G.colliders.push(G.sofaCol); G.sofa = { x:-4.5, z:L(-9.6) };
  PR.rug(-4.5, 0, L(-6.5), 4.6, 4.4, '#4a4a58'); deco(4.2, .012, 4, mat('#6a6a78'), -4.5, .02, L(-6.5));
  box(2.6, .78, .7, mat('#5a3a22'), -4.5, 0, 3.5); for(let i = 0; i < 3; i++) deco(.7, .2, .03, mat('#3e2716'), -5.3 + i * .8, .32, 3.14); const tvm = PR.crtTV(-4.5, .78, 3.5, Math.PI, 1.15); G.tvScreen = tvm.screen; G.tvPos = { x:-4.5, z:L(-4.2) };
  box(1.7, 1.5, .6, mat('#4a2f1c'), -7, 0, 3.6); deco(1.74, .06, .64, mat('#3e2716'), -7, 1.5, 3.6); deco(.5, .4, .3, mat('#c9a878'), -7.2, 1.56, 3.6);       // antique cabinet + lamp shade
  deco(2.2, .45, 1.2, mat('#7a5a3a'), -4.5, 0, L(-6.4)); deco(2.3, .03, 1.3, mat('#e8e2d0'), -4.5, .45, L(-6.4)); deco(.5, .04, .4, mat('#c83'), -4.2, .48, L(-6.4));  // coffee table + doily + magazine
  [[-7.1, L(-6.6)], [-7.1, L(-9)]].forEach(([x, z]) => { const r = PR.sofa(x, z, Math.PI / 2, CRM); r.scale.set(.44, 1.05, 1); col(x - .5, z - .6, x + .5, z + .6, 0, 1); });      // the two cream recliners
  box(1.9, .95, .5, mat('#3a9aa8'), -1.6, 0, -4.66); for(let r = 0; r < 3; r++) for(let c = 0; c < 4; c++) deco(.32, .2, .03, mat('#b8863a'), -2.26 + c * .44, .12 + r * .28, -4.4);   // teal drawer chest
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), txMat('chbirds', (g, w, h) => { g.fillStyle = '#c9d8d4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; [h * .3, h * .62].forEach(y => { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 6); g.stroke(); });
      ['#c8502a', '#3a6aa8', '#d8a020', '#5a8a3a', '#3a6aa8', '#c8502a', '#d8a020'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.ellipse(14 + i * 17, (i % 2 ? h * .62 : h * .3) - 8, 7, 9, 0, 0, 7); g.fill(); }); }, [1, 1])); p.position.set(-1.6, 2, -4.92); S.add(p); }
  PR.lamp(3.1, 0, -4.4); PR.picture(-7.85, 1.9, 2.9, Math.PI / 2, '#5a8ab8'); [[2.6, 1.9, -4.92, 0], [3.52, 1.9, 1.6, -Math.PI / 2]].forEach(([x, y, z, ry]) => PR.picture(x, y, z, ry, '#d8d2c4'));
  G.phoneObj = PR.wallPhone(3.48, 1.15, -1.2, -Math.PI / 2); G.phone = { x:2.7, z:-1.2 }; G.phoneLook = { x:3.52, z:-1.2 };
  // ---------- kitchen (stone-look floor, white wainscot) ----------
  box(.55, .9, .65, cab, K(2.525), 0, -11.5); box(4.25, .9, .65, cab, K(5.725), 0, -11.5);
  [[2.25, 2.8], [3.6, 5.2], [6, 7.85]].forEach(([a, b]) => deco(b - a, .06, .7, top, K((a + b) / 2), .9, -11.48)); deco(.8, .06, .1, top, K(5.6), .9, -11.18); deco(.8, .06, .12, top, K(5.6), .9, -11.77);
  deco(.8, .03, .48, mat('#9aa0a6'), K(5.6), .64, -11.47); deco(.03, .3, .48, mat('#b8bcc0'), K(5.21), .64, -11.47); deco(.03, .3, .48, mat('#b8bcc0'), K(5.99), .64, -11.47); deco(.8, .3, .03, mat('#b8bcc0'), K(5.6), .64, -11.24); deco(.8, .3, .03, mat('#b8bcc0'), K(5.6), .64, -11.71);
  for(const x of [2.525, 3.95, 4.65, 5.6, 6.35, 7.05, 7.6]){ deco(x === 5.6 ? .7 : .55, .7, .02, mat('#b8895a'), K(x), .1, -11.16); deco(.12, .03, .02, mat('#ccc'), K(x), .72, -11.15); }
  box(.8, .93, .68, mat('#e8e6e0'), K(3.2), 0, -11.47); deco(.76, .03, .62, mat('#111'), K(3.2), .93, -11.47); deco(.8, .22, .06, mat('#e8e6e0'), K(3.2), .93, -11.79);
  [[-.17, -.15], [.17, -.15], [-.17, .15], [.17, .15]].forEach(([a, b]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(.1, .015, 4, 12), mat('#555')); r.rotation.x = Math.PI / 2; r.position.set(K(3.2) + a, .975, -11.47 + b); S.add(r); });
  deco(.7, .5, .02, mat('#3a3a3a'), K(3.2), .2, -11.12); deco(.6, .03, .03, mat('#bbb'), K(3.2), .74, -11.1);
  const fau = new THREE.Mesh(new THREE.TorusGeometry(.14, .025, 6, 10, Math.PI), mat('#ccc')); fau.position.set(K(5.6), 1.08, -11.72); S.add(fau);
  G.dishes = new THREE.Group(); S.add(G.dishes); for(let i = 0; i < 5; i++){ const d = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .025, 12), mat(['#f4f4f0', '#d8e4ee', '#f4f4f0'][i % 3])); d.position.set(K(5.45) + (i % 3) * .12, .68 + i * .03, -11.5 + (i % 2) * .08); d.rotation.x = .2; G.dishes.add(d); }
  G.sink = { x:K(5.6), z:-10.6 };
  [[2.3, 4.5], [6.6, 7.85]].forEach(([a, b]) => { deco(b - a, .8, .38, cab, K((a + b) / 2), 1.55, -11.7); for(let x = a + .35; x < b; x += .7) deco(.6, .7, .02, mat('#b8895a'), K(x), 1.6, -11.5); });
  box(.65, .95, 3, cab, K(7.5), 0, -9.2); deco(.7, .06, 3, top, K(7.5), .95, -9.2); PR.microwave(K(7.5), 1.01, -9.4, -Math.PI / 2); G.micro = { x:K(6.6), z:-9.4 };
  box(3, .95, .9, cab, K(4.2), 0, -9.1); deco(3.1, .06, 1, mat('#c9a878'), K(4.2), .95, -9.1); [3.2, 5.2].forEach(x => PR.chair(K(x), 0, -8.2, Math.PI, '#f1eee6'));
  G.fridgeObj = PR.fridge(K(1.6), -11.4, 0); col(K(1.15), -11.8, K(2.05), -11, 0, 1.9);
  box(1.6, .78, 1.1, mat('#c9a878'), K(4.2), 0, -5.9); [3.2, 5.2].forEach(x => PR.chair(K(x), 0, -5.9, x < 4 ? Math.PI / 2 : -Math.PI / 2, '#f1eee6')); G.window = { x:-7, z:-7 };
  { const wb = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .8), mat('#f4f4f0')); wb.rotation.y = -Math.PI / 2; wb.position.set(-.48, 1.7, -8.6); S.add(wb); }   // whiteboard by the hall door
  // ---------- hall, bathroom, bedrooms on the main floor ----------
  PR.rug(3.6, 0, -6, 5, 1.1, '#6a6458');
  box(.75, .55, 1.7, mat('#f4f4f0'), 2.45, 0, -11); deco(.6, .04, 1.5, mat('#cfe0ea'), 2.45, .5, -11); box(.45, .42, .6, mat('#f4f4f0'), 3.95, 0, -11.4); deco(.42, .5, .2, mat('#f4f4f0'), 3.95, .42, -11.65); box(.6, .85, .45, mat('#f1eee6'), 4, 0, -8.4); deco(.5, .7, .04, mat('#b8c8d0'), 4.3, 1.2, -8.4);
  PR.bed(6.4, 0, 2.3, Math.PI); col(5.6, 1.2, 7.2, 3.4, 0, 1); box(1.5, 1, .55, mat('#4a2f1c'), 4.5, 0, -4.6); PR.lamp(7.5, 0, 3.4); PR.rug(5.8, 0, -1, 2.6, 2.2, '#7a6a6a');
  PR.bed(7.1, 0, -10.6, 0); col(6.3, -11.7, 7.9, -9.5, 0, 1); box(1.1, .9, .5, wood, 5.1, 0, -11.6);
  // ---------- Chris's room (upstairs, driveway side) ----------
  PR.bed(K(6.6), UP, -10.2, 0); col(K(5.85), -11.3, K(7.35), -9.1, UP, UP + 1); G.bedSpawn = { x:K(5), z:-8.6 }; G.bed = { x:K(5.4), z:-9.8 };
  PR.rug(K(4), UP, -7, 3, 2.4, '#3a6a8a'); box(2.4, .8, 1, wood, K(3.6), UP, -11.3); const pc = PR.crtMonitor(K(3.4), UP + .8, -11.35, 0); G.monitor = pc.screen; PR.chair(K(3.5), UP, -10.2, Math.PI); G.desk = { x:K(3.6), z:-10.1 }; G.monitorPos = [K(3.4), UP + 1.05, -11.35];
  [['#2a4a8a', -.49, -6.9, -Math.PI / 2], ['#e8a020', -.49, -2.9, -Math.PI / 2], ['#c83a3a', -7.86, -7.5, Math.PI / 2]].forEach(([c, x, z, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), mat(c)); p.position.set(x, UP + 1.7, z); p.rotation.y = ry; S.add(p); });
  deco(.6, .08, .8, mat('#c83'), K(7), UP + .62, -6.8); G.mags = { x:K(6.4), z:-6.6 }; deco(.5, .5, .3, mat('#2a4a2a'), K(1.2), UP, -10.6); G.backpack = { x:K(1.6), z:-10 };
  box(.7, 2.4, 2.4, mat('#f2efe6'), K(7.5), UP, -5, {}); deco(.04, 2.3, .04, mat('#bbb'), K(7.14), UP, -5); [-5.6, -4.4].forEach(z => deco(.04, .25, .04, mat('#999'), K(7.13), UP + 1.1, z)); G.closet = { x:K(6.6), z:-5 };
  box(1.2, 1, .55, wood, K(7.5), UP, -1.9); deco(.15, .12, .5, mat('#ddd'), K(7.5), UP + 1, -1.9);
  box(1.2, .5, .7, mat('#3a2a1a'), K(1), UP, -5.6); PR.crtTV(K(1), UP + .5, -5.6, Math.PI / 2, .7); deco(.35, .08, .3, mat('#222'), K(1), UP + .5, -5.15); G.console = { x:K(2.4), z:-5.6 };
  // upstairs bath + the other bedroom
  box(.7, .55, 1.6, mat('#f4f4f0'), 2.5, UP, -9.6); box(.45, .42, .6, mat('#f4f4f0'), 1.3, UP, -8); box(.6, .85, .45, mat('#f1eee6'), 1.4, UP, -2); plane(3.3, 9, rp(btile, 3, 8), 1.3, UP + .03, -5.9);
  PR.bed(6.9, UP, -9, 0); col(6.1, -10.1, 7.7, -7.9, UP, UP + 1); box(1.2, 1, .55, wood, 7.5, UP, -1.5); PR.rug(6.2, UP, -5, 2.6, 2.2, '#7a5a4a');

  // ---------- outside: driveway + detached garage (west), covered porch, patio, wood fence, back yard ----------
  plane(4.2, 8.5, conc, -17, .03, -9.8); plane(4.2, 23.2, mat('#5f6064'), -17, .031, 6); mapRect(-19.1, -14, -14.9, 17.6, '#8a8a8a');
  { const gx = -17, gz = -18, gw = 5.6, gd = 7.4, gh = 2.7; box(gw, gh, gd, CREAM, gx, 0, gz); mapRect(gx - gw / 2, gz - gd / 2, gx + gw / 2, gz + gd / 2, '#d8c8a8');
    const ang = Math.atan2(1.9, gw / 2), len = Math.hypot(1.9, gw / 2) + .5; [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(len, .16, gd + .8), rm); r.position.set(gx + s * (gw / 4 + .1), gh + .95, gz); r.rotation.z = -s * ang; r.castShadow = true; S.add(r); });
    [-1, 1].forEach(s => { const sh = new THREE.Shape(); sh.moveTo(-gw / 2, 0); sh.lineTo(gw / 2, 0); sh.lineTo(0, 1.9); sh.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat('#c9a98a')); m.position.set(gx, gh, gz + s * (gd / 2 + .01)); if(s < 0) m.rotation.y = Math.PI; S.add(m); });
    [[0, 0], [-.5, .28], [.5, -.28]].forEach(([dx, rz]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, dx ? 1.5 : 1.6, .06), trim); b.position.set(gx + dx * 1.3, gh + (dx ? .5 : .8), gz + gd / 2 + .04); b.rotation.z = rz * 2.2; S.add(b); }); deco(gw + .5, .2, .1, MAR, gx, gh - .05, gz + gd / 2 + .06);
    deco(3.6, 2.2, .08, mat('#f4f2ec'), gx - .2, 0, gz + gd / 2 + .04); for(let i = 1; i < 4; i++) deco(3.5, .04, .03, mat('#d0cec6'), gx - .2, i * .55, gz + gd / 2 + .09);
    [-2.3, 1.9].forEach(dx => deco(.16, .3, .16, mat('#fff3c8', { emissive:0x8a7a40 }), gx + dx, 1.9, gz + gd / 2 + .12)); box(.9, .9, .9, mat('#f1eee6'), gx, gh + 2, gz, { col:false }); const cu = new THREE.Mesh(new THREE.ConeGeometry(.85, .6, 4), rm); cu.rotation.y = Math.PI / 4; cu.position.set(gx, gh + 3.2, gz); S.add(cu); }
  box(.7, 1, .8, mat('#22262a'), -14.6, 0, -13.2); deco(.74, .08, .84, mat('#15181b'), -14.6, 1, -13.2);                                    // wheelie bin by the garage
  // covered porch along the kitchen wall (back door + the kitchen window)
  box(3, .16, 7, conc, -9.5, 0, -8.7, { col:false }); G.platforms.push({ x0:-11, z0:-12.2, x1:-8, z1:-5.2, y:.16 }); deco(3.3, .14, 7.4, mat('#5a4a40'), -9.6, 2.7, -8.7); deco(.2, .2, 7.4, MAR, -11.2, 2.56, -8.7);
  [-12, -8.7, -5.4].forEach(z => { deco(.07, 2.55, .07, mat('#2a2420'), -11, .16, z); deco(.5, .04, .04, mat('#2a2420'), -10.8, 2.3, z); }); [-10.5, -7.4].forEach(z => deco(.05, .9, .05, mat('#1a1a1a'), -10.4, 1.7, z));
  deco(1.4, .7, .7, mat('#3a3028'), -10.2, .16, -6.2); deco(1.3, .12, .6, mat('#b9b0a0'), -10.2, .5, -6.2);                                 // wicker loveseat
  // patios, grills, the big tree, fire pit, lamp post, clothesline pole, birdbath, vegetable patch
  plane(7.4, 3.4, conc, 3.6, .04, -13.8); plane(4.4, 3.4, txMat('chpav', (g, w, h) => { g.fillStyle = '#9a968e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6f6c66'; g.lineWidth = 2; for(let y = 0; y < h; y += 16) for(let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) g.strokeRect(x, y, 32, 16); }, [3, 3]), -4.6, .04, -13.8);
  { const kx = 5.4, kz = -14.2; [[-.25, -.2], [.25, -.2], [0, .28]].forEach(([a, b]) => deco(.04, .7, .04, mat('#b8b8b8'), kx + a, 0, kz + b)); const k = new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10), mat('#16181a')); k.scale.y = .82; k.position.set(kx, .95, kz); k.castShadow = true; S.add(k); col(kx - .4, kz - .4, kx + .4, kz + .4, 0, 1.3); }
  box(1.4, .9, .7, mat('#1c1e22'), -4.6, 0, -12.9); deco(1.5, .06, .8, mat('#d8d8d8'), -4.6, .9, -12.9);                                    // covered flat-top grill
  [[2.2, -13.4], [3.4, -14.6]].forEach(([x, z]) => { deco(.7, .45, .7, mat('#3a3028'), x, 0, z); deco(.7, .5, .12, mat('#3a3028'), x, .45, z - .3); });
  { const tx = -8.5, tz = -19.5; const tr = new THREE.Mesh(new THREE.CylinderGeometry(.5, .7, 5, 9), mat('#5a4632')); tr.position.set(tx, 2.5, tz); tr.castShadow = true; S.add(tr); col(tx - .6, tz - .6, tx + .6, tz + .6, 0, 4);
    [[0, 7.5, 0, 4.6], [2.6, 6.4, 1.4, 3.2], [-2.4, 6.6, -1.6, 3.3], [.6, 9.6, -.8, 3], [-1, 6, 2.6, 2.8]].forEach(([dx, y, dz, r]) => { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#3f8a2e')); l.position.set(tx + dx, y, tz + dz); l.castShadow = true; S.add(l); }); }
  { const fx = -2.6, fz = -17.6, f = new THREE.Mesh(new THREE.CylinderGeometry(.62, .5, .42, 12, 1, true), mat('#5a3a2a', { side:THREE.DoubleSide })); f.position.set(fx, .36, fz); S.add(f); deco(.8, .08, .8, mat('#a8a49a'), fx, 0, fz); col(fx - .6, fz - .6, fx + .6, fz + .6, 0, .7); }
  deco(.09, 2, .09, mat('#6a8a9a'), -5.4, 0, -16); deco(.3, .34, .3, mat('#7a9aa8'), -5.4, 2, -16); deco(.08, 2.1, .08, mat('#5a7aa8'), 1.2, 0, -21.5); deco(1.4, .06, .06, mat('#5a7aa8'), 1.2, 2.04, -21.5);
  deco(.16, .7, .16, mat('#b8b4aa'), 11.6, 0, -16); deco(.6, .08, .6, mat('#b8b4aa'), 11.6, .7, -16);
  deco(5, .03, 3.4, mat('#5a4a3a'), 10.6, .01, -22.6); [[9.2, -23], [10.6, -22.2], [12, -23]].forEach(([x, z]) => { for(let k = 0; k < 3; k++){ const rg = new THREE.Mesh(new THREE.TorusGeometry(.22 + k * .04, .012, 4, 10), mat('#3a8a4a')); rg.rotation.x = Math.PI / 2; rg.position.set(x, .3 + k * .32, z); S.add(rg); } const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(.3, 0), mat('#3f8a3a')); pl.position.set(x, .45, z); S.add(pl); });
  deco(.8, .9, .8, mat('#7a5a3a'), 6.5, 0, -24.6); deco(1, .12, 1, mat('#5a3a22'), 6.5, .9, -24.6);                                          // dog house
  box(.9, .8, .9, mat('#b8bcc0'), 8.7, 0, -5.5); deco(.7, .02, .7, mat('#555'), 8.7, .81, -5.5);                                             // A/C unit
  // wooden privacy fence round the back yard (the east gate is used by the story) + the fence and gate beside the garage
  const fw = mat('#a8885c'), fwd = mat('#8f7248'); [[-14, -26, 14, -26], [-14, -26, -14, -12.6], [14, -26, 14, -22], [14, -18, 14, -12]].forEach(([x0, z0, x1, z1]) => { const len = Math.hypot(x1 - x0, z1 - z0); box(x1 === x0 ? .1 : len, 1.8, x1 === x0 ? len : .1, fw, (x0 + x1) / 2, 0, (z0 + z1) / 2);
    for(let t = 0; t <= len; t += 2.4) deco(.14, 1.9, .14, fwd, x0 + (x1 - x0) * t / len, 0, z0 + (z1 - z0) * t / len); });
  box(2.9, 1.8, .1, fw, -12.5, 0, -12.6); box(6, 1.8, .1, fw, 11, 0, -12);
  G.gate = box(.1, 1.8, 4, fwd, 14, 0, -20);
  mapRect(-8, -12, 8, 4, '#d8c8a8'); mapRect(-13, -1.4, -8, 4, '#cfc0a0'); mapRect(-14, -26, 14, -12, '#6a9a4a');
  for(let i = 0; i < 9; i++) plane(1.3, 1.5, mat('#b9b6ad'), Math.sin(i * .5) * .7, .05, 6.6 + i * 1.5);                                     // the curving front walk
  const car = makeCar('#2a5a9a', { type:'taurus', spin:true, lights:true }); car.position.set(-17, 0, 9); S.add(car); G.colliders.push({ x0:-18, x1:-16, z0:6.8, z1:11.2, y0:0, y1:1.6 }); G.chrisCar = car;
  PR.mailbox(2.4, 19.2, 0); sid = sid0; inP = paint;
}
