// Back in the 2000s: The Game — Chris's house, rebuilt: real window/door openings, kitchen, rooms, railings, exterior trim.
// Footprint x -8..8, z -12..4 (front faces +z / Elm Street). Ground floor y 0, upstairs y 3.2. Stairs on the west wall.
import { THREE, G, box, plane, floor, ramp, mat, txMat, noise, makeCar, mapRect } from './engine.js';
import * as PR from './props.js';
import { sidingM, brickM } from './buildings.js';
const S = G.scene, UP = 3.2, T = .22;
const paint = mat('#efe7d6'), trim = mat('#ffffff'), wood = mat('#8a5a32'), cab = mat('#a8794a'), top = mat('#d8d0c0');
const glassM = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.35, emissive:0x223344 });
const sid = sidingM('#e4ddc8', [6, 2]);
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
// wall along X at z (out = +1 means the +z face is outside), with openings [{a, b, lo, hi}] in x
function wallX(x0, x1, z, y0, h, out, ops = []){ const mats = [paint, paint, paint, paint, out > 0 ? sid : paint, out > 0 ? paint : sid];
  const cuts = [...ops].sort((p, q) => p.a - q.a); let x = x0;
  const seg = (a, b, lo, hi) => { if(b - a > .01 && hi - lo > .01) box(b - a, hi - lo, T, mats, (a + b) / 2, lo, z); };
  for(const o of cuts){ seg(x, o.a, y0, y0 + h); seg(o.a, o.b, y0, y0 + o.lo); seg(o.a, o.b, y0 + o.hi, y0 + h); frameX(o, z, y0, out); x = o.b; }
  seg(x, x1, y0, y0 + h); }
function wallZ(z0, z1, x, y0, h, out, ops = []){ const mats = [out > 0 ? sid : paint, out > 0 ? paint : sid, paint, paint, paint, paint];
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
  // ---------- ground floor shell ----------
  const SH = '#2f3e52';
  wallX(-8, 8, 4, 0, UP, 1, [{ a:-6, b:-4, lo:.9, hi:2.3, shutter:SH }, { a:-.8, b:.8, lo:0, hi:2.3, door:true }, { a:4, b:6, lo:.9, hi:2.3, shutter:SH }]);
  wallX(-8, 8, -12, 0, UP, -1, [{ a:-6.6, b:-5, lo:.9, hi:2.3 }, { a:-1.6, b:-.4, lo:0, hi:2.3, door:true }, { a:4.9, b:6.3, lo:1.15, hi:2.2 }]);
  wallZ(-12, 4, -8, 0, UP, -1, [{ a:-10.6, b:-9, lo:.9, hi:2.3 }]);
  wallZ(-12, 4, 8, 0, UP, 1, [{ a:-6.8, b:-4, lo:.9, hi:2.3, noGlass:true }, { a:0, b:1.6, lo:.9, hi:2.3 }]);
  const kw = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.4, 2.8), glassM); kw.position.set(8, 1.6, -5.4); S.add(kw); G.kitchenWindow = kw; deco(.05, 1.4, .05, trim, 8, .9, -5.4);
  // ---------- upstairs shell ----------
  wallX(-8, 8, 4, UP, 3, 1, [{ a:-5, b:-3, lo:.9, hi:2.2, shutter:SH }, { a:3, b:5, lo:.9, hi:2.2, shutter:SH }]);
  wallX(-8, 8, -12, UP, 3, -1, [{ a:-4, b:-2.4, lo:.9, hi:2.2 }, { a:3, b:4.6, lo:.9, hi:2.2 }]);
  wallZ(-12, 4, -8, UP, 3, -1, [{ a:-10.2, b:-8.8, lo:.9, hi:2.2 }]);
  wallZ(-12, 4, 8, UP, 3, 1, [{ a:-8.6, b:-7, lo:.9, hi:2.2 }]);
  // upstairs partitions: Chris's room (x 0..8) door z -2..-.4 ; parents' room (x -8..0, z -12..-8.5) door x -3..-2
  const ip = (w, h, d, x, y, z) => box(w, h, d, paint, x, y, z);
  ip(.15, 3, 7.8, 0, UP, -8.1); ip(.15, 3, 4.2, 0, UP, 1.9); ip(.15, .8, 1.6, 0, UP + 2.2, -1.2);
  ip(5, 3, .15, -5.5, UP, -8.5); ip(2, 3, .15, -1, UP, -8.5); ip(1, .8, .15, -2.5, UP + 2.2, -8.5);
  // ---------- exterior trim, roof, porch ----------
  [[-8, 4], [8, 4], [-8, -12], [8, -12]].forEach(([x, z]) => deco(.3, UP + 3, .3, trim, x, 0, z));
  { const fm2 = mat('#8f8a82'); deco(16.6, .45, .2, fm2, 0, -.3, 4.2); deco(16.6, .45, .2, fm2, 0, -.3, -12.2); deco(.2, .45, 16.6, fm2, -8.2, -.3, -4); deco(.2, .45, 16.6, fm2, 8.2, -.3, -4); } deco(16.5, .25, .3, trim, 0, UP - .1, 4.15); deco(16.5, .25, .3, trim, 0, UP - .1, -12.15);
  const rm = txMat('chroof', (g, w, h) => { noise(g, w, h, '#4a3c38', .25, 3000); for(let y = 0; y < h; y += 10){ g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y, w, 2); for(let x = (y / 10) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 2, 10); } }, [6, 3]);
  { const rh = 3.2, sh = new THREE.Shape(); sh.moveTo(-8, 0); sh.lineTo(8, 0); sh.lineTo(0, rh); sh.closePath();
    const gg = new THREE.ExtrudeGeometry(sh, { depth:16, bevelEnabled:false }); gg.translate(0, 0, -8); gg.rotateY(Math.PI / 2); const gm = new THREE.Mesh(gg, sid); gm.position.set(0, UP + 3, -4); gm.castShadow = true; S.add(gm);
    const ang = Math.atan2(rh, 8), len = Math.hypot(rh, 8) + .7; [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(17, .16, len), rm); r.position.set(0, UP + 3 + rh / 2 + .02, -4 + s * 4.05); r.rotation.x = s * ang; r.castShadow = true; S.add(r); });
    deco(17, .18, .3, mat('#3a3532'), 0, UP + 3 + rh - .05, -4); deco(17.2, .2, .2, trim, 0, UP + 2.95, 4.35); deco(17.2, .2, .2, trim, 0, UP + 2.95, -12.35); }
  box(1.4, 9.2, 1.1, brickM('#7a3a2c'), -8.75, 0, -7); // chimney on the west side
  // porch: slab, steps, columns, roof, light, house number, open front door
  box(5, .35, 2.6, mat('#b9b3a8'), 0, 0, 5.4, { col:false }); G.platforms.push({ x0:-2.5, z0:4, x1:2.5, z1:6.7, y:.35 });
  deco(2.2, .18, .6, mat('#b9b3a8'), 0, 0, 7); [-2.2, 2.2].forEach(x => { deco(.24, 2.7, .24, trim, x, .35, 6.4); deco(.36, .2, .36, trim, x, .35, 6.4); });
  const pr = new THREE.Mesh(new THREE.BoxGeometry(5.6, .16, 3.2), rm); pr.position.set(0, 3.12, 5.6); pr.rotation.x = .17; pr.castShadow = true; S.add(pr); deco(5.6, .3, .1, trim, 0, 2.85, 7.15);
  deco(.16, .3, .12, mat('#222'), 1.2, 1.7, 4.18); const num = new THREE.Mesh(new THREE.PlaneGeometry(.7, .22), new THREE.MeshBasicMaterial({ color:0xd4af37 })); num.position.set(-1.35, 2, 4.13); S.add(num);
  const door = new THREE.Group(); door.position.set(-.8, 0, 3.9); door.rotation.y = -Math.PI * .45; S.add(door); const dl = new THREE.Mesh(new THREE.BoxGeometry(1.55, 2.25, .08), mat('#6b2a22')); dl.position.set(.78, 1.13, 0); door.add(dl);
  // ---------- floors / ceilings / stairs ----------
  floor(-8, -12, 8, 4, 0, null);
  const carpet = txMat('chcarp', (g, w, h) => noise(g, w, h, '#8a7a6a', .18, 3000), [4, 6]), vinyl = txMat('chvin', (g, w, h) => { g.fillStyle = '#efe9da'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8ccb2'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, [8, 12]);
  const oak = txMat('choak', (g, w, h) => { noise(g, w, h, '#a8743f', .14); g.strokeStyle = '#7a5028'; for(let y = 0; y < h; y += 16){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [6, 6]);
  plane(9, 16, carpet, -3.5, .02, -4); plane(7, 16, vinyl, 4.5, .02, -4);
  floor(-5.4, -12, 8, 4, UP, null); floor(-8, -12, -5.4, -6, UP, null); floor(-8, 2.2, -5.4, 4, UP, null);
  plane(16, 6, oak, 0, UP + .02, -9); plane(13.4, 4, oak, 1.3, UP + .02, -4); plane(10.4, 6, oak, 2.8, UP + .02, 1);
  const ceil = new THREE.MeshBasicMaterial({ color:0xe9e5dc }); deco(10.4, .2, 6, ceil, 2.8, UP - .2, 1); deco(16, .2, 6, ceil, 0, UP - .2, -9); deco(13.4, .2, 4, ceil, 1.3, UP - .2, -4); deco(16, .15, 16, ceil, 0, UP + 2.95, -4);
  ramp(-7.8, -6, -5.4, 2.2, 'z', UP, 0);
  for(let i = 0; i < 12; i++){ deco(2.4, i * .267 + .2, .67, paint, -6.6, 0, 1.8 - i * .67); deco(2.4, .07, .67, wood, -6.6, i * .267 + .2, 1.8 - i * .67); deco(2.4, .03, .1, mat('#6a4428'), -6.6, i * .267 + .24, 2.1 - i * .67); }
  box(.12, 1, 8.2, trim, -5.35, UP, -1.9);                                     // upstairs rail (blocks the drop)
  for(let i = 0; i < 12; i++){ deco(.06, .9, .06, trim, -5.35, (11 - i) * .267 + .27, 1.8 - (11 - i) * .67); } { const hr = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, Math.hypot(8, 3.2)), mat('#6a4428')); hr.position.set(-5.35, 1.6 + 1.05, -1.9); hr.rotation.x = Math.atan2(3.2, 8); S.add(hr); }
  for(let z = -5.8; z < 2.2; z += .45) deco(.05, .9, .05, trim, -5.35, UP, z); deco(.1, .08, 8.2, mat('#6a4428'), -5.35, UP + .92, -1.9);
  [[-3.5, -6], [4.5, -7], [-3, UP, -2], [4, -8]].forEach(([x, z, zz]) => { const y = zz !== undefined ? UP + 2.92 : UP - .22, cz = zz !== undefined ? zz : z; const l = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .06, 14), new THREE.MeshBasicMaterial({ color:0xfff6dc })); l.position.set(x, y, cz); S.add(l); });
  // ---------- living room ----------
  PR.sofa(-4.5, -10.7, 0); G.sofaCol = { x0:-5.8, x1:-3.2, z0:-11.2, z1:-10.2, y0:0, y1:1 }; G.colliders.push(G.sofaCol); G.sofa = { x:-4.5, z:-9.6 };
  PR.rug(-4.5, 0, -6.5, 4.4, 5, '#8a5a3a'); PR.lamp(-6.6, 0, -11.2); PR.picture(-7.85, 1.9, -5.5, Math.PI / 2, '#5a8ab8'); PR.picture(-2.4, 1.9, -11.85, 0, '#7a9a5a');
  PR.tvStand(-4.5, -2.6, Math.PI); const tvm = PR.crtTV(-4.5, .68, -2.6, Math.PI); G.colliders.push({ x0:-5.3, x1:-3.7, z0:-3, z1:-2.2, y0:0, y1:1.6 }); G.tvScreen = tvm.screen; G.tvPos = { x:-4.5, z:-4.2 };
  deco(2.2, .45, 1.2, mat('#7a5a3a'), -4.5, 0, -6.4); deco(.5, .04, .4, mat('#c83'), -4.2, .45, -6.4);            // coffee table + magazine
  const arm = PR.sofa(-7.1, -6.6, Math.PI / 2, '#5a6a4a'); arm.scale.set(.42, 1, 1); G.colliders.push({ x0:-7.6, x1:-6.6, z0:-7.2, z1:-6, y0:0, y1:1 });
  deco(.4, 2, 1.6, wood, -7.75, 0, -2.5); for(let k = 0; k < 4; k++) for(let j = 0; j < 5; j++) deco(.25, .32, .12, mat(['#a33', '#36a', '#3a6', '#cb3', '#835'][(j + k) % 5]), -7.6, .1 + k * .48, -3.1 + j * .28); // bookshelf
  // ---------- kitchen ----------
  // base cabinets split around the stove (x 2.8..3.6) and a real sink basin (x 5.2..6.0) — no overlapping faces
  box(.55, .9, .65, cab, 2.525, 0, -11.5); box(4.25, .9, .65, cab, 5.725, 0, -11.5);
  [[2.25, 2.8], [3.6, 5.2], [6, 7.85]].forEach(([a, b]) => deco(b - a, .06, .7, top, (a + b) / 2, .9, -11.48)); deco(.8, .06, .1, top, 5.6, .9, -11.18); deco(.8, .06, .12, top, 5.6, .9, -11.77);
  deco(.8, .03, .48, mat('#9aa0a6'), 5.6, .64, -11.47); deco(.03, .3, .48, mat('#b8bcc0'), 5.21, .64, -11.47); deco(.03, .3, .48, mat('#b8bcc0'), 5.99, .64, -11.47); deco(.8, .3, .03, mat('#b8bcc0'), 5.6, .64, -11.24); deco(.8, .3, .03, mat('#b8bcc0'), 5.6, .64, -11.71);
  for(const x of [2.525, 3.95, 4.65, 5.6, 6.35, 7.05, 7.6]){ deco(x === 5.6 ? .7 : .55, .7, .02, mat('#b8895a'), x, .1, -11.16); deco(.12, .03, .02, mat('#ccc'), x, .72, -11.15); }
  box(.8, .93, .68, mat('#2a2a2a'), 3.2, 0, -11.47); deco(.76, .03, .62, mat('#111'), 3.2, .93, -11.47); deco(.8, .22, .06, mat('#2a2a2a'), 3.2, .93, -11.79); // stove + backguard
  [[-.17, -.15], [.17, -.15], [-.17, .15], [.17, .15]].forEach(([a, b]) => { const r = new THREE.Mesh(new THREE.TorusGeometry(.1, .015, 4, 12), mat('#555')); r.rotation.x = Math.PI / 2; r.position.set(3.2 + a, .975, -11.47 + b); S.add(r); });
  deco(.7, .5, .02, mat('#3a3a3a'), 3.2, .2, -11.12); deco(.6, .03, .03, mat('#bbb'), 3.2, .74, -11.1);                     // oven door + handle
  const fau = new THREE.Mesh(new THREE.TorusGeometry(.14, .025, 6, 10, Math.PI), mat('#ccc')); fau.position.set(5.6, 1.08, -11.72); S.add(fau);
  G.dishes = new THREE.Group(); S.add(G.dishes); for(let i = 0; i < 5; i++){ const d = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .025, 12), mat(['#f4f4f0', '#d8e4ee', '#f4f4f0'][i % 3])); d.position.set(5.45 + (i % 3) * .12, .68 + i * .03, -11.5 + (i % 2) * .08); d.rotation.x = .2; G.dishes.add(d); }
  G.sink = { x:5.6, z:-10.6 };
  [[2.3, 4.5], [6.6, 7.85]].forEach(([a, b]) => { deco(b - a, .8, .38, cab, (a + b) / 2, 1.55, -11.7); for(let x = a + .35; x < b; x += .7) deco(.6, .7, .02, mat('#b8895a'), x, 1.6, -11.5); });
  box(.65, .95, 3, cab, 7.5, 0, -9.2); deco(.7, .06, 3, top, 7.5, .95, -9.2); PR.microwave(7.5, 1.01, -9.4, -Math.PI / 2); G.micro = { x:6.6, z:-9.4 };
  box(3, .95, .9, cab, 4.2, 0, -9.1); deco(3.1, .06, 1, top, 4.2, .95, -9.1); [3.2, 5.2].forEach(x => PR.chair(x, 0, -8.2, Math.PI, '#7a5a3a')); // island + stools
  G.fridgeObj = PR.fridge(1.6, -11.4, 0); G.colliders.push({ x0:1.15, x1:2.05, z0:-11.8, z1:-11, y0:0, y1:1.9 });
  box(1.6, .78, 1.2, mat('#8a6a4a'), 4.2, 0, -5.6); [3.2, 5.2].forEach(x => PR.chair(x, 0, -5.6, x < 4 ? Math.PI / 2 : -Math.PI / 2, '#7a5a3a')); G.window = { x:7, z:-5.4 };
  G.phoneObj = PR.wallPhone(7.84, 1.15, -1.2, -Math.PI / 2); G.phone = { x:7, z:-1.2 }; G.phoneLook = { x:7.84, z:-1.2 };
  // ---------- Chris's room ----------
  PR.bed(6.6, UP, -10.2, 0); G.colliders.push({ x0:5.85, x1:7.35, z0:-11.3, z1:-9.1, y0:UP, y1:UP + 1 }); G.bedSpawn = { x:5, z:-8.6 }; G.bed = { x:5.4, z:-9.8 };
  PR.rug(4, UP, -7, 3, 2.4, '#3a6a8a'); box(2.4, .8, 1, wood, 3.6, UP, -11.4); const pc = PR.crtMonitor(3.4, UP + .8, -11.45, 0); G.monitor = pc.screen; PR.chair(3.5, UP, -10.3, Math.PI); G.desk = { x:3.6, z:-10.2 }; G.monitorPos = [3.4, UP + 1.05, -11.45];
  [['#c83a3a', 2.2, -11.86, 0], ['#2a4a8a', 7.86, -6, -Math.PI / 2], ['#e8a020', 7.86, -3.5, -Math.PI / 2]].forEach(([c, x, z, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), mat(c)); p.position.set(x, UP + 1.8, z); p.rotation.y = ry; S.add(p); }); // posters
  deco(.6, .08, .8, mat('#c83'), 7, UP + .62, -6.8); G.mags = { x:6.4, z:-6.6 }; deco(.5, .5, .3, mat('#2a4a2a'), 1.2, UP, -10.8); G.backpack = { x:1.6, z:-10.2 };
  box(.7, 2.4, 2.4, mat('#f2efe6'), 7.5, UP, -5, {}); deco(.04, 2.3, .04, mat('#bbb'), 7.14, UP, -5); [-5.6, -4.4].forEach(z => deco(.04, .25, .04, mat('#999'), 7.13, UP + 1.1, z)); G.closet = { x:6.6, z:-5 }; // closet (bifold doors)
  box(1.2, 1, .55, wood, 7.5, UP, -1.5); deco(.15, .12, .5, mat('#ddd'), 7.5, UP + 1, -1.5); // dresser
  box(1.2, .5, .7, mat('#3a2a1a'), 1, UP, -5.6); PR.crtTV(1, UP + .5, -5.6, Math.PI / 2, .7); deco(.35, .08, .3, mat('#222'), 1, UP + .5, -5.15); G.console = { x:2.4, z:-5.6 }; // TV + PS2-style console
  // ---------- yard, fence, gate, driveway, car ----------
  const fm = mat('#e8e2d0'); [[-14, -26, 14, -26], [-14, -26, -14, -12], [14, -26, 14, -22], [14, -18, 14, -12]].forEach(([x0, z0, x1, z1]) => {
    const len = Math.hypot(x1 - x0, z1 - z0); box(x1 === x0 ? .12 : len, 1.3, x1 === x0 ? len : .12, fm, (x0 + x1) / 2, 0, (z0 + z1) / 2);
    for(let t = 0; t <= len; t += .4) deco(.1, 1.45, .1, fm, x0 + (x1 - x0) * t / len, 0, z0 + (z1 - z0) * t / len); });
  G.gate = box(.12, 1.3, 4, mat('#cfc6ad'), 14, 0, -20);
  deco(.8, .9, .8, mat('#7a5a3a'), 10, 0, -24); deco(1, .12, 1, mat('#5a3a22'), 10, .9, -24); deco(4.5, .02, 6, mat('#5a4a3a'), -9, .01, -22); // dog house + garden bed
  plane(7, 4, mat('#b9b3a8'), -1, .04, -14.2); deco(1.6, .18, .5, mat('#b9b3a8'), -1, 0, -12.4);
  deco(.6, .9, .45, mat('#222'), 1.5, 0, -14.6); deco(.7, .08, .55, mat('#333'), 1.5, .9, -14.6);
  box(.9, .8, .9, mat('#b8bcc0'), 8.7, 0, -9.5); deco(.7, .02, .7, mat('#555'), 8.7, .81, -9.5);
  [4.25, -12.25].forEach(z => deco(16.4, .14, .14, mat('#e8e8e2'), 0, UP + 2.8, z)); [[-8.1, 4.2], [8.1, 4.2], [-8.1, -12.2], [8.1, -12.2]].forEach(([x, z]) => deco(.1, UP + 2.8, .1, mat('#e8e8e2'), x, 0, z));
  mapRect(-8, -12, 8, 4, '#d8c8a8'); mapRect(-14, -26, 14, -12, '#6a9a4a');
  for(let z = 7.5; z < 20; z += 1.6) plane(1.3, 1.45, mat('#b9b6ad'), 0, .05, z);
  const car = makeCar('#2a5a9a', { type:'sedan', spin:true, lights:true }); car.position.set(10.5, 0, 9); S.add(car); G.colliders.push({ x0:9.5, x1:11.5, z0:6.8, z1:11.2, y0:0, y1:1.6 }); G.chrisCar = car;
  plane(4, 15.5, mat('#a9a59b'), 10.5, .03, 11.6); PR.mailbox(2.4, 19.2, 0);
  [[-6, 5.2], [6, 5.2], [-3.5, 5.2], [3.5, 5.2]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.6, 0), mat('#3d6a2e')); b.position.set(x, .45, z + .2); b.scale.y = .75; b.castShadow = true; S.add(b); });
}
