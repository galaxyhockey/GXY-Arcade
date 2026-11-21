// Back in the 2000s: The Game — detailed props & buildings (low-poly but modeled, not blocks)
import { THREE, G, mat, txMat, noise, label } from './engine.js';
const S = G.scene;
const M = (c, o) => mat(c, o);
function mesh(geo, m, x = 0, y = 0, z = 0, p){ const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; (p || S).add(me); return me; }
const B = (w, h, d, m, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, p); // y = bottom
const Cy = (r, h, m, x, y, z, p, seg = 12, rt) => mesh(new THREE.CylinderGeometry(rt ?? r, r, h, seg), m, x, y + h / 2, z, p);
export const glassM = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.5, emissive:0x223344 });
const white = M('#f4f2ec'), black = M('#1a1a1a'), dark = M('#2a2a2a'), metal = M('#b8bcc4'), wood = M('#8a5a32'), cream = M('#efe8d8');

// ---------- furniture / electronics ----------
export function crtTV(x, y, z, ry = 0, scale = 1){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(scale); S.add(g);
  B(1.2, .95, .55, M('#2b2b2e'), 0, 0, .1, g); B(1, .8, .5, M('#232326'), 0, .05, -.38, g);               // body + tube back
  B(1.08, .1, .06, M('#3a3a3e'), 0, .82, .39, g); B(1.08, .1, .06, M('#3a3a3e'), 0, .02, .39, g);              // bezel
  const scr = mesh(new THREE.PlaneGeometry(.92, .68), new THREE.MeshBasicMaterial({ color:0x2a3a5a }), 0, .47, .385, g);
  B(.06, .06, .02, M('#c33', { emissive:0x660000 }), .48, .06, .4, g); [-.3, -.18].forEach(dx => Cy(.03, .02, M('#888'), .52 + dx * 0, .1, .4, g, 8));
  return { g, screen:scr }; }
export function tvStand(x, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  B(1.6, .06, .6, wood, 0, .62, 0, g); B(1.6, .06, .6, wood, 0, .02, 0, g); [-.77, .77].forEach(dx => B(.06, .62, .6, wood, dx, 0, 0, g)); B(.5, .12, .35, black, -.3, .1, 0, g); return g; } // VCR on shelf
export function wallPhone(x, y, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g);
  B(.22, .34, .08, cream, 0, 0, 0, g); B(.07, .3, .07, cream, -.13, .02, .06, g);                         // base + handset
  for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++) B(.035, .03, .01, M('#999'), -.03 + j * .05, .12 + i * .05, .045, g);
  const cord = mesh(new THREE.TorusGeometry(.04, .008, 4, 10, Math.PI * 5), black, -.13, -.08, .07, g); cord.rotation.z = Math.PI / 2; return g; }
export function microwave(x, y, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g);
  B(.75, .42, .45, M('#e8e8e8'), 0, 0, 0, g); mesh(new THREE.PlaneGeometry(.48, .3), M('#222', { emissive:0x111111 }), -.1, .21, .226, g);
  B(.15, .3, .01, M('#555'), .25, .06, .226, g); mesh(new THREE.PlaneGeometry(.1, .04), new THREE.MeshBasicMaterial({ color:0x44ff66 }), .25, .32, .232, g); return g; }
export function fridge(x, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  B(.85, 1.9, .75, M('#ecebe6'), 0, 0, 0, g); B(.86, .02, .76, M('#bbb'), 0, 1.28, 0, g); B(.04, .45, .05, M('#999'), .34, 1.4, .4, g); B(.04, .6, .05, M('#999'), .34, .55, .4, g);
  [[-.2, 1.6, '#e44'], [.05, 1.5, '#4ae'], [-.1, 1.1, '#fd3']].forEach(([dx, dy, c]) => B(.08, .08, .01, M(c), dx, dy, .38, g)); return g; } // fridge magnets
export function sofa(x, z, ry = 0, col = '#6a4a7a'){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); const c = M(col), c2 = M(shade(col, -.15));
  B(2.4, .42, .9, c2, 0, 0, 0, g); [-1, 0, 1].forEach(k => B(.74, .16, .78, c, k * .76, .42, .04, g)); B(2.4, .6, .22, c, 0, .42, -.38, g); [-1.28, 1.28].forEach(dx => B(.24, .7, .92, c2, dx, 0, 0, g));
  [-.8, .8].forEach(dx => B(.34, .3, .12, M('#c9b27a'), dx, .62, -.24, g)); return g; }
export function bed(x, y, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g);
  B(1.5, .34, 2.1, wood, 0, 0, 0, g); B(1.42, .22, 2, white, 0, .34, 0, g); B(1.46, .14, 1.4, M('#3a5a8a'), 0, .5, .3, g); B(.9, .14, .4, white, 0, .56, -.75, g); B(1.5, .9, .1, wood, 0, 0, -1.05, g); return g; }
export function chair(x, y, z, ry = 0, col = '#333'){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g); const c = M(col);
  B(.5, .08, .5, c, 0, .45, 0, g); B(.5, .55, .07, c, 0, .53, -.22, g); Cy(.04, .45, metal, 0, 0, 0, g, 6); B(.5, .03, .05, metal, 0, 0, 0, g); B(.05, .03, .5, metal, 0, 0, 0, g); return g; }
export function lamp(x, y, z){ const g = new THREE.Group(); g.position.set(x, y, z); S.add(g); Cy(.12, .04, metal, 0, 0, 0, g); Cy(.025, .55, metal, 0, .04, 0, g, 6);
  Cy(.2, .25, M('#f0e6c8', { emissive:0x332a10 }), 0, .55, 0, g, 12, .12); return g; }
export function rug(x, y, z, w, d, col){ const r = mesh(new THREE.PlaneGeometry(w, d), M(col), x, y + .015, z); r.rotation.x = -Math.PI / 2; r.castShadow = false; return r; }
export function picture(x, y, z, ry, col){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g); B(.7, .5, .04, wood, 0, 0, 0, g); mesh(new THREE.PlaneGeometry(.6, .4), M(col), 0, .25, .025, g); return g; }
export function crtMonitor(x, y, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g);
  B(.48, .4, .45, M('#d8d0b8'), 0, .06, -.04, g); B(.3, .3, .2, M('#cfc6ad'), 0, .1, -.32, g); B(.3, .06, .3, M('#cfc6ad'), 0, 0, 0, g);
  const s = mesh(new THREE.PlaneGeometry(.38, .3), new THREE.MeshBasicMaterial({ color:0x2a7a5a }), 0, .27, .185, g); B(.6, .03, .2, M('#d8d0b8'), 0, 0, .42, g); // keyboard
  B(.38, .32, .5, M('#cfc6ad'), .62, 0, -.05, g); return { g, screen:s }; } // tower
export function dumpster(x, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  B(3.2, 1.5, 1.8, M('#2f5a3a'), 0, .15, 0, g); B(3.3, .1, 1.1, M('#1f3a28'), 0, 1.65, -.35, g); B(3.3, .1, 1.1, M('#1f3a28'), 0, 1.62, .4, g);
  [-1.4, 1.4].forEach(dx => [-.7, .7].forEach(dz => Cy(.1, .15, black, dx, 0, dz, g, 8))); return g; }
export function trashCan(x, z, col = '#3a4a5a'){ const g = new THREE.Group(); g.position.set(x, 0, z); S.add(g); Cy(.3, .95, M(col), 0, 0, 0, g, 10, .34); Cy(.36, .08, M(shade(col, -.2)), 0, .95, 0, g, 10); return g; }
export function mailbox(x, z, ry = 0){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); B(.08, 1.05, .08, wood, 0, 0, 0, g);
  const b = mesh(new THREE.CylinderGeometry(.16, .16, .5, 10, 1, false, 0, Math.PI), M('#2a2a2a'), 0, 1.15, 0, g); b.rotation.x = Math.PI / 2; b.rotation.z = Math.PI / 2; B(.32, .16, .5, M('#2a2a2a'), 0, 1.0, 0, g);
  B(.03, .14, .08, M('#c33'), .17, 1.12, -.1, g); return g; }
// store shelving gondola with product facings
const prodCols = ['#e8463a', '#f4c430', '#4a8ad8', '#5ab04a', '#e88a2a', '#9a5ad8', '#e8e8e8', '#d84a8a', '#3ac0c0', '#a86a3a'];
export function gondola(x, z, len, ry = 0){ const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
  B(.12, 2.1, len, M('#c8ccd2'), 0, 0, 0, g); B(1.5, .12, len, M('#9aa0a8'), 0, 0, 0, g);
  for(let k = 0; k < 4; k++){ const y = .14 + k * .5; B(1.5, .04, len, M('#d8dce2'), 0, y, 0, g);
    for(const side of [-1, 1]){ let zz = -len / 2 + .2; while(zz < len / 2 - .2){ const w = .18 + Math.random() * .3, h = .2 + Math.random() * .22, c = prodCols[(Math.random() * prodCols.length) | 0];
        if(Math.random() > .08) B(.34, h, w - .03, M(c), side * .48, y + .04, zz + w / 2, g); zz += w; } } }
  B(1.5, .3, .06, M('#c8102e'), 0, 2.1, len / 2, g); B(1.5, .3, .06, M('#c8102e'), 0, 2.1, -len / 2, g); return g; }
export function shade(hex, f){ const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return '#' + c.getHexString(); }

// ---------- houses: gable roof, porch, framed windows w/ shutters, garage + driveway; faces the street ----------
const sidingT = {}; const sidingM = c => sidingT[c] || (sidingT[c] = txMat('hs' + c, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.12)'; for(let y = 0; y < h; y += 10) g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.08)'; for(let y = 2; y < h; y += 10) g.fillRect(0, y, w, 1); }, [3, 2]));
const shingT = {}; const shingM = c => shingT[c] || (shingT[c] = txMat('sh' + c, (g, w, h) => { noise(g, w, h, c, .22); g.fillStyle = 'rgba(0,0,0,.25)'; for(let y = 0; y < h; y += 12){ g.fillRect(0, y, w, 2); for(let x = (y / 12) % 2 ? 0 : 10; x < w; x += 20) g.fillRect(x, y, 2, 12); } }, [4, 3]));
const garageM = txMat('gdoor', (g, w, h) => { g.fillStyle = '#efefea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9c9c2'; for(let y = 0; y < h; y += h / 4) g.fillRect(0, y, w, 3); for(let x = 0; x < w; x += w / 4){ for(let y = 6; y < h; y += h / 4) g.strokeRect(x + 6, y, w / 4 - 12, h / 4 - 12); } }, [1, 1]);
function prism(w, d, rh, m){ const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth:w, bevelEnabled:false }); geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2); return new THREE.Mesh(geo, m); }
function windowUnit(p, x, y, z, w = 1.2, h = 1.3, shutters = '#2f3e52'){ B(w + .2, h + .2, .08, white, x, y - .1, z, p); mesh(new THREE.PlaneGeometry(w, h), glassM, x, y + h / 2 - .1, z + .05, p);
  B(.06, h, .03, white, x, y - .1, z + .06, p); B(w, .06, .03, white, x, y + h / 2 - .13, z + .06, p); B(w + .3, .08, .18, white, x, y - .18, z + .08, p);
  if(shutters){ const sm = M(shutters); B(.38, h + .1, .05, sm, x - w / 2 - .3, y - .15, z + .03, p); B(.38, h + .1, .05, sm, x + w / 2 + .3, y - .15, z + .03, p); } }
export function house(cx, cz, facing, col, o = {}){ // facing: 's' (+z), 'n' (-z), 'e' (+x), 'w' (-x)
  const g = new THREE.Group(), w = o.w || 11, d = o.d || 8.5, two = o.two ?? true, h = two ? 5.6 : 3.1, rh = o.rh || 2.4, sm = sidingM(col), rm = shingM(o.roof || '#4d4340');
  B(w, h, d, sm, 0, 0, 0, g); B(w + .1, .4, d + .1, M('#8a8580'), 0, 0, 0, g); // foundation
  const gab = prism(w, d, rh, sm); gab.position.y = h; g.add(gab);
  const ang = Math.atan2(rh, d / 2), len = Math.hypot(rh, d / 2) + .55;
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(w + .9, .14, len), rm); r.position.set(0, h + rh / 2 + .05, s * (d / 4 + .02)); r.rotation.x = s * -ang; r.castShadow = true; g.add(r); });
  B(w + .9, .16, .3, M('#3a3532'), 0, h + rh - .02, 0, g); // ridge cap
  if(o.chimney) B(.9, rh + 1.6, .9, M('#8c4a36'), w / 2 - 1.6, h, -d / 4, g);
  const fz = d / 2;
  // front door + porch
  const dx = o.doorX ?? -1.2; B(1.2, 2.3, .12, white, dx, .4, fz + .02, g); B(1, 2.1, .1, M(o.door || '#6b2a22'), dx, .4, fz + .06, g); Cy(.04, .04, M('#d4af37'), dx + .35, 1.4, fz + .12, g, 8);
  B(3.2, .4, 2, M('#b9b3a8'), dx, 0, fz + 1, g); B(2, .2, .5, M('#b9b3a8'), dx, 0, fz + 2.2, g);
  if(o.porch !== false){ [-1.4, 1.4].forEach(px => B(.16, 2.6, .16, white, dx + px, .4, fz + 1.8, g)); const pr = new THREE.Mesh(new THREE.BoxGeometry(3.6, .14, 2.3), rm); pr.position.set(dx, 3.1, fz + 1.1); pr.rotation.x = .18; pr.castShadow = true; g.add(pr); }
  // windows
  [dx - 2.8, dx + 3.2, dx + 5.2].filter(x => Math.abs(x) < w / 2 - .9).forEach(x => windowUnit(g, x, 1.3, fz + .04, 1.2, 1.3, o.shutter));
  if(two) [-w / 4 - .6, 0, w / 4 + .6].forEach(x => windowUnit(g, x, 3.9, fz + .04, 1.1, 1.2, o.shutter));
  [[-1, w / 2], [1, w / 2]].forEach(([s]) => { const side = new THREE.Group(); side.position.set(s * (w / 2 + .04), 0, 0); side.rotation.y = s * Math.PI / 2; g.add(side); windowUnit(side, 0, 1.4, 0, 1, 1.1, null); if(two) windowUnit(side, 0, 3.9, 0, 1, 1.1, null); });
  // garage + driveway
  if(o.garage){ const gx = w / 2 + 2.9; B(5.6, 3, 6.4, sm, gx, 0, fz - 3.2 + .2, g); const gr = prism(5.8, 6.6, 1.4, sm); gr.position.set(gx, 3, fz - 3); gr.rotation.y = 0; g.add(gr);
    [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(6.4, .12, Math.hypot(1.4, 3.3) + .4), rm); r.position.set(gx, 3.7, fz - 3 + s * 1.65); r.rotation.x = s * -Math.atan2(1.4, 3.3); g.add(r); });
    mesh(new THREE.PlaneGeometry(4.6, 2.5), garageM, gx, 1.25, fz + .22, g); }
  const drv = o.drive || 9, dX = o.garage ? w / 2 + 2.9 : w / 2 - 1.5; const dm = mesh(new THREE.PlaneGeometry(3.6, drv), M('#a9a59b'), dX, .03, fz + drv / 2, g); dm.rotation.x = -Math.PI / 2; dm.castShadow = false;
  const wk = mesh(new THREE.PlaneGeometry(1.2, drv - 2), M('#b9b6ad'), dx, .035, fz + 2.4 + (drv - 2) / 2 - .5, g); wk.rotation.x = -Math.PI / 2; wk.castShadow = false;
  mailbox(0, 0, 0); const mb = S.children[S.children.length - 1]; S.remove(mb); mb.position.set(dx + 1.2, 0, fz + drv - .3); g.add(mb);
  if(o.car){ G.makeCar && 0; }
  const rot = { s:0, n:Math.PI, e:Math.PI / 2, w:-Math.PI / 2 }[facing]; g.rotation.y = rot; g.position.set(cx, 0, cz); S.add(g);
  // collider (rotations are multiples of 90°)
  const sw = facing === 'e' || facing === 'w', hw = (sw ? d : w) / 2, hd = (sw ? w : d) / 2;
  G.colliders.push({ x0:cx - hw, x1:cx + hw, z0:cz - hd, z1:cz + hd, y0:0, y1:h + rh });
  if(o.garage){ const off = w / 2 + 2.9, gxw = Math.cos(rot) * off, gzw = -Math.sin(rot) * off, gzo = Math.cos(rot) * (fz - 3), gxo = Math.sin(rot) * (fz - 3);
    const ccx = cx + gxw + gxo, ccz = cz + gzw + gzo; G.colliders.push({ x0:ccx - 3.2, x1:ccx + 3.2, z0:ccz - 3.2, z1:ccz + 3.2, y0:0, y1:4 }); }
  return g; }
