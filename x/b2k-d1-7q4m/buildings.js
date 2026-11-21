// Back in the 2000s: The Game — buildings rebuilt from real reference
// Houses: Belleville/Swansea styles (brick ranch, two-story colonial, brick bungalow). Schnucks Swansea (2665 N Illinois St):
// red-brown brick, darker upper band with light trim stripes, red script sign on brick, glass bays between piers,
// landscaped planters, strip-plaza neighbours, tree islands in the lot, woods + service drive behind.
import { THREE, G, mat, txMat, noise, label } from './engine.js';
import { glassM, trashCan } from './props.js';
const S = G.scene;
const M = (c, o) => mat(c, o);
function mesh(geo, m, x = 0, y = 0, z = 0, p){ const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; (p || S).add(me); return me; }
const B = (w, h, d, m, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, p);
const col = (x0, z0, x1, z1, y1 = 4) => G.colliders.push({ x0:Math.min(x0, x1), x1:Math.max(x0, x1), z0:Math.min(z0, z1), z1:Math.max(z0, z1), y0:0, y1 });

// ---------- textures ----------
const cache = {};
export function brickM(base = '#8c3b2a', mortar = '#c9bba5', rep = [4, 2], key = ''){ const k = 'b' + base + mortar + rep + key; if(cache[k]) return cache[k];
  return cache[k] = txMat('brk' + base + mortar, (g, w, h) => { g.fillStyle = mortar; g.fillRect(0, 0, w, h); const c = new THREE.Color(base);
    for(let y = 0, r = 0; y < h; y += 8, r++) for(let x = (r % 2) * -8; x < w; x += 16){ const v = (Math.random() - .5) * .12, cc = c.clone().offsetHSL(0, 0, v); g.fillStyle = '#' + cc.getHexString(); g.fillRect(x + 1, y + 1, 14, 6); } }, rep, {}, 256, 256); }
export const sidingM = (c, rep = [3, 2]) => cache['s' + c + rep] || (cache['s' + c + rep] = txMat('sid2' + c, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h);
  for(let y = 0; y < h; y += 12){ g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, y + 10, w, 2); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, y, w, 1); } }, rep));
const shingle = c => cache['r' + c] || (cache['r' + c] = txMat('shg' + c, (g, w, h) => { noise(g, w, h, c, .25, 3000); for(let y = 0; y < h; y += 10){ g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y, w, 2); for(let x = (y / 10) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 2, 10); } }, [3, 3]));
export const terrazzoM = txMat('terr', (g, w, h) => { noise(g, w, h, '#cfd2d3', .14, 5000); g.strokeStyle = 'rgba(0,0,0,.08)'; g.strokeRect(0, 0, w, h); }, [40, 24]);
const white = M('#f5f4ef'), trim = M('#f2efe6'), dark = M('#2a2a2a');

// ---------- geometry ----------
function hipRoof(w, d, rh, m, over = .5){ const W = w / 2 + over, D = d / 2 + over, rx = Math.max(0, W - D);
  const v = [ -W,0,D,  W,0,D,  rx,rh,0,  -W,0,D,  rx,rh,0,  -rx,rh,0,   W,0,-D,  -W,0,-D,  -rx,rh,0,  W,0,-D,  -rx,rh,0,  rx,rh,0,
    -W,0,-D,  -W,0,D,  -rx,rh,0,   W,0,D,  W,0,-D,  rx,rh,0 ];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  const uv = []; for(let i = 0; i < v.length; i += 3) uv.push(v[i] / 3, (v[i + 2] + v[i + 1]) / 3); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; return me; }
function gableRoof(w, d, rh, m, wallM, over = .5){ const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
  const gg = new THREE.ExtrudeGeometry(sh, { depth:w, bevelEnabled:false }); gg.translate(0, 0, -w / 2); gg.rotateY(Math.PI / 2); g.add(new THREE.Mesh(gg, wallM));
  const ang = Math.atan2(rh, d / 2), len = Math.hypot(rh, d / 2) + over;
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(w + over * 2, .14, len), m); r.position.set(0, rh / 2 + .07 - Math.sin(ang) * over / 2 * 0, s * (d / 4 + Math.cos(ang) * over / 2 - .05)); r.rotation.x = s * ang; r.castShadow = true; g.add(r); });
  B(w + over * 2, .12, .25, M('#3a3532'), 0, rh - .02, 0, g); return g; }
function win(p, x, y, z, w, h, o = {}){ // framed window set into a wall facing +z (local)
  B(w + .22, h + .22, .1, trim, x, y - .11, z + .02, p); mesh(new THREE.PlaneGeometry(w, h), glassM, x, y + h / 2, z + .08, p);
  if(o.grid !== false){ B(.05, h, .03, trim, x, y, z + .09, p); B(w, .05, .03, trim, x, y + h / 2, z + .09, p); }
  B(w + .4, .1, .22, M(o.sill || '#e8e4da'), x, y - .16, z + .1, p);
  if(o.shut){ const sm = M(o.shut); [-1, 1].forEach(s => { B(w * .42, h + .05, .06, sm, x + s * (w / 2 + w * .25 + .08), y - .03, z + .05, p); }); } }
function door(p, x, z, col = '#6b2a22', o = {}){ B(1.25, 2.35, .14, trim, x, 0, z + .02, p); B(1, 2.15, .1, M(col), x, 0, z + .08, p);
  for(let i = 0; i < 2; i++) for(let j = 0; j < 2; j++) B(.32, .7, .03, M(new THREE.Color(col).offsetHSL(0, 0, .06).getStyle()), x - .2 + j * .4, .25 + i * .95, z + .14, p);
  mesh(new THREE.SphereGeometry(.045, 8, 6), M('#d4af37'), x + .36, 1.05, z + .16, p); if(o.light){ B(.14, .26, .1, M('#222'), x + .85, 1.7, z + .1, p); } }
function steps(p, x, z, w = 1.8){ B(w, .18, .9, M('#b9b3a8'), x, 0, z + .45, p); B(w, .18, .5, M('#b9b3a8'), x, .18, z + .25, p); }
const tree = (x, z, s = 1, p) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); (p || S).add(g);
  mesh(new THREE.CylinderGeometry(.18, .3, 3.2, 7), M('#4a3322'), 0, 1.6, 0, g); const leaf = [M('#3d6e2a'), M('#4f7f30'), M('#5e7a2a')][Math.random() * 3 | 0];
  [[0, 4.4, 0, 2.2], [1.2, 3.8, .4, 1.5], [-1.1, 3.9, -.3, 1.6], [.2, 5.4, -.4, 1.4], [-.4, 4.2, 1, 1.4]].forEach(([a, b, c, r]) => mesh(new THREE.IcosahedronGeometry(r, 1), leaf, a, b, c, g));
  if(!p) G.colliders.push({ x0:x - .35, x1:x + .35, z0:z - .35, z1:z + .35, y0:0, y1:3 }); return g; };
export { tree as bigTree };

// ---------- houses ----------
const BRICKS = ['#8c3b2a', '#9a5236', '#7a3a2c', '#a8754e', '#6e4a3a'], SIDING = ['#e9e3d2', '#c9d3d6', '#d8cfa8', '#b9c4b0', '#d3c2b4', '#a9b8c6'];
const SHUT = ['#24364f', '#3a2a22', '#2c3f2c', '#5a2424', '#1f1f1f'], ROOF = ['#3e3936', '#4a4038', '#3a3f46', '#57483c'];
export function house(cx, cz, facing, seed = 0, o = {}){ const g = new THREE.Group(), style = ['ranch', 'colonial', 'bungalow', 'ranch', 'colonial', 'bungalow'][seed % 6];
  const r = k => ((seed * 9301 + k * 49297) % 233280) / 233280, roofM = shingle(ROOF[seed % 4]), shut = r(1) > .25 ? SHUT[seed % 5] : null;
  let w, d, h, front, setback = 0;
  if(style === 'ranch'){ w = 16; d = 9; h = 3; const wm = brickM(BRICKS[seed % 5], '#cbbfa9', [5, 1.2]);
    B(w, h, d, wm, 0, 0, 0, g); B(w + .1, .35, d + .1, M('#8f8a82'), 0, 0, 0, g); const roof = hipRoof(w, d, 2, roofM, .7); roof.position.y = h; g.add(roof);
    B(w + 1.4, .3, .25, trim, 0, h - .3, d / 2 + .6, g); // fascia/gutter
    door(g, -1.5, d / 2, ['#6b2a22', '#24364f', '#2c3f2c', '#f2efe6'][seed % 4], { light:true }); steps(g, -1.5, d / 2);
    win(g, -4.6, 1.05, d / 2, 2.6, 1.45, { shut, grid:true }); win(g, 1.3, 1.25, d / 2, 1.2, 1.1, { shut });
    B(5.4, 2.4, .1, M('#efefea'), 4.9, 0, d / 2 + .04, g); for(let i = 1; i < 4; i++) B(5.2, .05, .02, M('#cfcfc8'), 4.9, i * .6, d / 2 + .1, g); // attached garage door
    [-1, 1].forEach(s => { const side = new THREE.Group(); side.position.set(s * w / 2, 0, 0); side.rotation.y = s * Math.PI / 2; g.add(side); win(side, 0, 1.25, 0, 1.2, 1.1, {}); });
    front = { drive:4.9 }; }
  else if(style === 'colonial'){ w = 11; d = 8.5; h = 5.8; const wm = sidingM(SIDING[seed % 6]);
    B(w, h, d, wm, 0, 0, 0, g); B(w + .1, .45, d + .1, M('#8f8a82'), 0, 0, 0, g); const roof = gableRoof(w, d, 2.6, roofM, wm, .45); roof.position.y = h; g.add(roof);
    B(w + .3, .25, .3, trim, 0, h - .25, d / 2 + .12, g); [-1, 1].forEach(s => B(.25, h, .25, trim, s * (w / 2 - .02), 0, d / 2 + .05, g)); // corner boards
    door(g, 0, d / 2, ['#24364f', '#6b2a22', '#1f1f1f'][seed % 3], { light:true }); steps(g, 0, d / 2, 2.4);
    const pd = new THREE.Shape(); pd.moveTo(-1, 0); pd.lineTo(1, 0); pd.lineTo(0, .55); pd.closePath(); const pg = mesh(new THREE.ExtrudeGeometry(pd, { depth:.2, bevelEnabled:false }), trim, 0, 2.45, d / 2 + .05, g);
    [-3.6, -1.9, 1.9, 3.6].forEach(x => win(g, x, 1.2, d / 2, 1.1, 1.5, { shut })); [-3.6, -1.6, 1.6, 3.6, 0].forEach(x => win(g, x, 3.8, d / 2, x ? 1.1 : .8, x ? 1.4 : 1, { shut:x ? shut : null }));
    if(seed % 2) B(1.1, h + 3.6, 1, brickM('#7a3a2c'), w / 2 - .3, 0, -1, g);
    [-1, 1].forEach(s => { const side = new THREE.Group(); side.position.set(s * w / 2, 0, 0); side.rotation.y = s * Math.PI / 2; g.add(side); win(side, 1.5, 1.2, 0, 1.1, 1.4, {}); win(side, 1.5, 3.8, 0, 1.1, 1.3, {}); });
    if(seed % 3 === 0){ const gw = sidingM(SIDING[seed % 6]); B(5.6, 3, 7, gw, w / 2 + 2.8, 0, .6, g); const gr = gableRoof(5.6, 7, 1.6, roofM, gw, .3); gr.rotation.y = Math.PI / 2; gr.position.set(w / 2 + 2.8, 3, .6); g.add(gr);
      B(4.6, 2.3, .1, M('#efefea'), w / 2 + 2.8, 0, 4.15, g); front = { drive:w / 2 + 2.8 }; } else front = { drive:w / 2 + 1.8 }; }
  else { w = 9; d = 11; h = 3.4; const wm = brickM(BRICKS[(seed + 2) % 5], '#d2c6b0', [3, 1.3]);
    B(w, h, d, wm, 0, 0, 0, g); B(w + .1, .5, d + .1, M('#8f8a82'), 0, 0, 0, g); const roof = gableRoof(d, w, 3.4, roofM, wm, .5); roof.rotation.y = Math.PI / 2; roof.position.y = h; g.add(roof);
    const gw = sidingM(SIDING[(seed + 1) % 6]); const gab = new THREE.Shape(); gab.moveTo(-w / 2, 0); gab.lineTo(w / 2, 0); gab.lineTo(0, 3.4); gab.closePath(); mesh(new THREE.ExtrudeGeometry(gab, { depth:.1, bevelEnabled:false }), gw, 0, h, d / 2 + .02, g);
    win(g, 0, h + .7, d / 2 + .1, 1, 1, {}); // attic window in the front gable
    // full-width front porch with columns + its own roof
    B(w + .4, .55, 2.8, M('#a8a196'), 0, 0, d / 2 + 1.4, g); [-w / 2 + .1, -1.1, 1.1, w / 2 - .1].forEach(x => { B(.5, 1, .5, wm, x, .55, d / 2 + 2.55, g); B(.26, 1.75, .26, trim, x, 1.55, d / 2 + 2.55, g); });
    const pr = new THREE.Mesh(new THREE.BoxGeometry(w + .8, .16, 3.3), roofM); pr.position.set(0, 3.45, d / 2 + 1.5); pr.rotation.x = .2; pr.castShadow = true; g.add(pr);
    door(g, -1.6, d / 2, '#5a3a22'); win(g, 1.8, 1.15, d / 2, 2, 1.5, { shut:null }); steps(g, -1.6, d / 2 + 2.8, 1.6);
    [-1, 1].forEach(s => { const side = new THREE.Group(); side.position.set(s * w / 2, 0, 0); side.rotation.y = s * Math.PI / 2; g.add(side); [-2.5, 2].forEach(z => win(side, z, 1.2, 0, 1, 1.3, {})); });
    front = { drive:w / 2 + 2 }; setback = 1.4; }
  // driveway, front walk, lawn edging, mailbox, shrubs
  const fz = d / 2, drv = o.curb ? o.curb - fz : 9.5 - setback; const dm = mesh(new THREE.PlaneGeometry(3.4, drv + 1), M('#aaa69c'), front.drive, .03, fz + (drv + 1) / 2, g); dm.rotation.x = -Math.PI / 2; dm.castShadow = false;
  const wk = mesh(new THREE.PlaneGeometry(1.1, drv - 1.2), M('#bdb9b0'), style === 'colonial' ? 0 : style === 'ranch' ? -1.5 : -1.6, .032, fz + 1.2 + (drv - 1.2) / 2, g); wk.rotation.x = -Math.PI / 2; wk.castShadow = false;
  for(let i = 0; i < 4; i++){ const sx = -w / 2 + 1.2 + i * (w - 2.4) / 3; if(Math.abs(sx - front.drive) < 2.4) continue; mesh(new THREE.IcosahedronGeometry(.6, 0), M(['#2f5a2a', '#3d6a2e'][i % 2]), sx, .45, fz + .7, g).scale.y = .75; }
  const mb = new THREE.Group(); mb.position.set(front.drive - 2.2, 0, fz + drv - .2); g.add(mb); B(.08, 1.05, .08, M('#5a3d22'), 0, 0, 0, mb); B(.24, .22, .48, M(['#222', '#1d3a5a', '#3a2a1a'][seed % 3]), 0, 1.0, 0, mb);
  tree(front.drive + 6.5 * (seed % 2 ? 1 : -1) * 0 + (seed % 2 ? -w / 2 - 1 : w / 2 + 1.5), fz + 6.5, .9 + r(3) * .4, g);
  const rot = { s:0, n:Math.PI, e:Math.PI / 2, w:-Math.PI / 2 }[facing]; g.rotation.y = rot; g.position.set(cx, 0, cz); S.add(g);
  const sw = facing === 'e' || facing === 'w', hw = (sw ? d : w) / 2 + (style === 'colonial' && seed % 3 === 0 ? 0 : 0), hd = (sw ? w : d) / 2;
  G.colliders.push({ x0:cx - hw, x1:cx + hw, z0:cz - hd, z1:cz + hd, y0:0, y1:h + 3 });
  if(style === 'colonial' && seed % 3 === 0){ const lx = w / 2 + 2.8, lz = .6, wx = cx + lx * Math.cos(rot) + lz * Math.sin(rot), wz = cz - lx * Math.sin(rot) + lz * Math.cos(rot); col(wx - 3.2, wz - 3.2, wx + 3.2, wz + 3.2); }
  if(style === 'bungalow'){ const lz = fz + 1.4, wx = cx + lz * Math.sin(rot), wz = cz + lz * Math.cos(rot); col(wx - (sw ? 1.4 : w / 2 + .2), wz - (sw ? w / 2 + .2 : 1.4), wx + (sw ? 1.4 : w / 2 + .2), wz + (sw ? w / 2 + .2 : 1.4), .55); }
  return g; }

// ---------- Schnucks Swansea exterior + plaza ----------
export function schnucksExterior(SCH){ const { x0, x1, z0, z1 } = SCH, H = 8, f = z0 - .3;
  const red = brickM('#8a3626', '#bfae98', [30, 2.2], 'f'), upper = brickM('#6e2a20', '#a8957f', [30, .9], 'u'), base = brickM('#a0705a', '#c7b8a2', [30, .3], 'b');
  // facade skin over the store's front wall: lower brick + piers, glass bays, light stripe, darker upper band, coping
  B(99 - x0 + .3, 5.2, .25, red, (x0 + 99) / 2 - .15, 0, f); B(x1 - 111 + .3, 5.2, .25, red, (111 + x1) / 2 + .15, 0, f); B(12, .8, .25, red, 105, 4.4, f); B(x1 - x0 + .6, .5, .3, M('#d8ccb6'), (x0 + x1) / 2, 5.2, f); B(x1 - x0 + .6, 2.6, .25, upper, (x0 + x1) / 2, 5.7, f); B(x1 - x0 + 1, .35, .5, M('#cfc4b0'), (x0 + x1) / 2, 8.3, f);
  B(99 - x0, .55, .32, base, (x0 + 99) / 2, 0, f - .02); B(x1 - 111, .55, .32, base, (111 + x1) / 2, 0, f - .02);
  for(let x = x0 + 4; x < x1 - 2; x += 7){ if(x > 95 && x < 115) continue; mesh(new THREE.PlaneGeometry(5.2, 3.2), new THREE.MeshLambertMaterial({ color:0x2a3a48, emissive:0x10202a }), x + 2.6, 2.6, f - .14).rotation.y = Math.PI;
    B(5.4, .14, .2, M('#d8ccb6'), x + 2.6, .95, f - .12); B(.12, 3.3, .14, M('#3a3a3a'), x + 2.6, 1, f - .16); B(1.2, 5.2, .5, red, x - .2, 0, f - .2); }
  // entrance tower: taller brick mass with the red script sign mounted on the brick
  B(7, 10.8, 1.6, red, 95.5, 0, f - .6); B(7, 10.8, 1.6, red, 114.5, 0, f - .6); B(12, 6.4, 1.6, red, 105, 4.4, f - .6); B(26.6, .5, 2, M('#cfc4b0'), 105, 10.8, f - .6); B(26, .5, .4, M('#d8ccb6'), 105, 7.4, f - 1.45);
  new THREE.TextureLoader().load('../../games/bc27/logos/schnucks.png', t => { t.colorSpace = THREE.SRGBColorSpace; const sg = new THREE.Mesh(new THREE.PlaneGeometry(20, 2.5), new THREE.MeshBasicMaterial({ map:t, transparent:true })); sg.position.set(105, 8.9, f - 1.45); sg.rotation.y = Math.PI; S.add(sg); });
  // glass vestibule with automatic doors (open front; sides are walls)
  const vz0 = z0 - 5, vg = new THREE.MeshLambertMaterial({ color:0x9fc6e6, transparent:true, opacity:.35 }); B(12.6, .5, 5.2, M('#5a5a5a'), 105, 3.4, z0 - 2.6);
  [[100.75, 3.5], [109.25, 3.5]].forEach(([x, w]) => { B(w, 3.4, .12, vg, x, 0, vz0 + .4); B(w, .15, .2, M('#4a4a4a'), x, 3.3, vz0 + .4); col(x - w / 2, vz0 + .3, x + w / 2, vz0 + .5); });
  [99, 111].forEach(x => { B(.3, 3.4, 4.6, M('#4a4a4a'), x, 0, z0 - 2.6); col(x - .2, vz0 + .4, x + .2, z0); });
  B(3.6, .5, .1, new THREE.MeshBasicMaterial({ map:label('ENTRANCE', { bg:'#c8102e', fg:'#fff', size:60 }) }), 101.8, 2.6, vz0 + .05); B(3.6, .5, .1, new THREE.MeshBasicMaterial({ map:label('EXIT', { bg:'#c8102e', fg:'#fff', size:60 }) }), 108.2, 2.6, vz0 + .05);
  // landscaped brick planters with ornamental grasses + shrubs (gap at entrance)
  [[x0 + 1, 97], [113, x1 - 1]].forEach(([a, b]) => { B(b - a, .7, 1.8, base, (a + b) / 2, 0, z0 - 1.8); col(a, z0 - 2.7, b, z0 - .9, .7); mesh(new THREE.PlaneGeometry(b - a - .3, 1.5), M('#4a3a2a'), (a + b) / 2, .71, z0 - 1.8).rotation.x = -Math.PI / 2;
    for(let x = a + .7; x < b - .5; x += 1.4){ const grass = x % 4.2 < 1.4; const m = mesh(grass ? new THREE.ConeGeometry(.45, 1.4, 6) : new THREE.IcosahedronGeometry(.55, 0), M(grass ? '#a8a060' : '#3a6a2e'), x, grass ? 1.4 : 1.05, z0 - 1.8 + (x % 2.8 < 1.4 ? .3 : -.3)); if(!grass) m.scale.y = .8; } });
  // strip-plaza neighbours on both sides (brick, storefront glass, sign band)
  const shops = [[10, 'NAIL SPA', '#b23a6a'], [26, 'VIDEO WORLD', '#1f4aa8'], [42, 'LAUNDRY', '#2a7a5a']], shops2 = [[192, 'TAX SERVICE', '#2a5a2a'], [208, 'CHINA GARDEN', '#b8282a'], [224, 'HAIR CUTS', '#7a2a8a']];
  [[2, 49, shops], [184, 232, shops2]].forEach(([a, b, list]) => { const zc = 362, d = 56, zf = zc - d / 2; B(b - a, 6, d, brickM('#8a4a34', '#c2b29c', [12, 1.4], 'p'), (a + b) / 2, 0, zc); col(a, zc - d / 2, b, zc + d / 2, 6);
    B(b - a + .6, .5, d + .6, M('#cfc4b0'), (a + b) / 2, 6, zc); B(b - a, .3, 3, M('#5a5a5a'), (a + b) / 2, 3.6, zf - 1.5); // canopy
    list.forEach(([x, name, c]) => { mesh(new THREE.PlaneGeometry(13, 3), new THREE.MeshLambertMaterial({ color:0x2a3a48, emissive:0x0c1a22 }), x, 1.7, zf - .05).rotation.y = Math.PI;
      const s = mesh(new THREE.PlaneGeometry(11, 1.3), new THREE.MeshBasicMaterial({ map:label(name, { bg:'#f4efe4', fg:c, size:70, w:768, h:110 }) }), x, 4.9, zf - .06); s.rotation.y = Math.PI; }); });
  // lot: landscaped tree islands, light poles, cart-return signs
  [[44, 280], [44, 304], [196, 280], [196, 304], [120, 280], [120, 304], [82, 304], [158, 280]].forEach(([x, z]) => { B(3, .25, 5, M('#9a9a92'), x, 0, z); mesh(new THREE.PlaneGeometry(2.6, 4.6), M('#4f7a30'), x, .26, z).rotation.x = -Math.PI / 2; tree(x, z, .8); });
  for(let x = 60; x <= 160; x += 33) [288, 316].forEach(z => { mesh(new THREE.CylinderGeometry(.12, .16, 9, 8), M('#555'), x, 4.5, z); B(1.4, .3, .7, M('#3a3a3a'), x, 9, z); mesh(new THREE.PlaneGeometry(1.2, .5), new THREE.MeshBasicMaterial({ color:0xfff1c8 }), x, 8.98, z).rotation.x = Math.PI / 2; });
  // behind: service drive + woods
  mesh(new THREE.PlaneGeometry(200, 14), M('#4a4c50'), 110, .025, z1 + 16).rotation.x = -Math.PI / 2;
  for(let i = 0; i < 70; i++){ const x = -20 + (i * 37) % 260, z = z1 + 26 + (i * 13) % 40 + Math.random() * 6; tree(x, z, 1 + Math.random() * .6); }
  [[60, z0 - 4], [150, z0 - 4], [175, 340]].forEach(([x, z]) => trashCan(x, z, '#3a3a3a')); }
// interior re-skin: polished floor, white walls, perimeter departments, end caps, checklane detail
export function schnucksInterior(SCH){ const { x0, x1, z0, z1 } = SCH;
  const wallW = M('#f1efe8'), ceil = new THREE.MeshBasicMaterial({ color:0xdedcd4 }), H = 7.95;
  const skin = (w, x, z, ry) => { const p = mesh(new THREE.PlaneGeometry(w, H), wallW, x, H / 2, z); p.rotation.y = ry; p.castShadow = false; };
  skin(49, 74.5, z0 + .28, 0); skin(59, 140.5, z0 + .28, 0); { const l = mesh(new THREE.PlaneGeometry(12, 3.5), wallW, 105, 6.2, z0 + .28); l.castShadow = false; } skin(72, x0 + .28, 366, Math.PI / 2); skin(72, x1 - .28, 366, -Math.PI / 2); skin(120, 110, z1 - .28, Math.PI);
  const cp = mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), ceil, (x0 + x1) / 2, 7.93, (z0 + z1) / 2); cp.rotation.x = Math.PI / 2; cp.castShadow = false;
  mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0 - 14), terrazzoM, (x0 + x1) / 2, .025, (z0 + z1 - 14) / 2).rotation.x = -Math.PI / 2;
  const woodSign = (t, x, y, z, ry, w = 8) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g); B(w + .4, 1.5, .2, M('#9a6a3a'), 0, 0, 0, g);
    const p = mesh(new THREE.PlaneGeometry(w, 1.1), new THREE.MeshBasicMaterial({ map:label(t, { bg:'#a8743f', fg:'#fff', size:80, w:768, h:110, font:'Georgia' }) }), 0, .75, .11, g); return g; };
  new THREE.TextureLoader().load('../../games/bc27/logos/schnucks.png', t => { t.colorSpace = THREE.SRGBColorSpace; const lm = new THREE.MeshBasicMaterial({ map:t, transparent:true });
    [[80, z0 + .32, 0, 10], [130, z0 + .32, 0, 10], [x1 - .32, 345, -Math.PI / 2, 8]].forEach(([x, z, ry, w]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 8), lm); p.position.set(x, 6.2, z); p.rotation.y = ry; S.add(p); });
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(4, .5), lm); cs.position.set(94, 4.1, 338.75); S.add(cs); });
  woodSign('BAKERY', x0 + .4, 4.6, 348, Math.PI / 2); woodSign('DELI', x0 + .4, 4.6, 364, Math.PI / 2, 6); woodSign('MEAT & SEAFOOD', 104, 4.6, 387.6, Math.PI, 12); woodSign('DAIRY', 160, 4.6, 387.6, Math.PI, 6);
  // perimeter refrigerated cases along the back wall (leave the back-room doors clear)
  [[88, 117], [125, 139], [147, 149]].forEach(([a, b]) => { if(b - a < 3) return; B(b - a, 2.1, 1.4, M('#e8e8e8'), (a + b) / 2, 0, 386.6); mesh(new THREE.PlaneGeometry(b - a - .4, 1.3), new THREE.MeshLambertMaterial({ color:0xbfe3ff, emissive:0x2a4a5a, transparent:true, opacity:.8 }), (a + b) / 2, 1.3, 385.85).rotation.y = Math.PI;
    G.colliders.push({ x0:a, x1:b, z0:385.9, z1:387.4, y0:0, y1:2.1 }); });
  // bakery tables + deli case on the west side
  [[57, 352], [57, 358]].forEach(([x, z]) => { B(2, .9, 3, M('#7a5232'), x + 2, 0, z); for(let i = 0; i < 6; i++) B(.4, .25, .4, M(['#f4d4e4', '#d4f4e4', '#f4e4c4'][i % 3]), x + 1.4 + (i % 2) * .8, .9, z - 1 + (i / 2 | 0)); });
  B(1.3, 1.4, 8, M('#e8e8e8'), 51.2, 0, 364); mesh(new THREE.PlaneGeometry(7.6, .8), new THREE.MeshLambertMaterial({ color:0xbfe3ff, emissive:0x2a4a5a }), 51.9, 1.1, 364).rotation.y = Math.PI / 2;
  // checklane detail: belts, registers, lane lights, candy racks
  (G.lanes || []).forEach(l => { const x = l.x - 1.4; B(.7, .06, 3.6, M('#1a1a1a'), x, 1.0, 344.4); B(.5, .35, .4, M('#d8d8d8'), x + .2, 1.05, 342.4); B(.35, .3, .06, M('#2a6a3a', { emissive:0x0a2a10 }), x + .2, 1.45, 342.3);
    mesh(new THREE.CylinderGeometry(.08, .08, 2.6, 8), M('#bbb'), x - .3, 1.3, 346.8); B(.5, 1.4, 1.2, M('#c8102e'), x + .9, 0, 347.4); });
  // white ceiling panels with recessed square lights (bright, like the real store)
  const lightM = new THREE.MeshBasicMaterial({ color:0xfffdf2 }); for(let x = x0 + 6; x < x1; x += 8) for(let z = z0 + 6; z < 386; z += 8){ const l = mesh(new THREE.PlaneGeometry(1.4, 1.4), lightM, x, 7.9, z); l.rotation.x = Math.PI / 2; l.castShadow = false; }
  }

// ---------- school (Belleville High) ----------
export function school(){ const x0 = -170, x1 = -124, z0 = 112, z1 = 160, tan = brickM('#b58a5e', '#d8cbb2', [12, 2], 's'), band = M('#d8cbb2');
  // taller two-band facade on the east (street) side with ribbon windows + entrance canopy
  B(.4, 9.5, 127 - z0, tan, x1 + .25, 0, (z0 + 127) / 2); B(.4, 9.5, z1 - 131, tan, x1 + .25, 0, (131 + z1) / 2); B(.4, 6.7, 4, tan, x1 + .25, 2.8, 129);
  B(.6, .4, z1 - z0 + .6, band, x1 + .4, 9.5, (z0 + z1) / 2);
  [2.2, 5.8].forEach(y => { for(let z = z0 + 3; z < z1 - 2; z += 4.2){ if(z > 124 && z < 134) continue; const w = mesh(new THREE.PlaneGeometry(3.4, 1.8), new THREE.MeshLambertMaterial({ color:0x35505e, emissive:0x10202a }), x1 + .47, y, z + 1.7); w.rotation.y = Math.PI / 2;
    B(.1, .12, 3.6, band, x1 + .5, y - 1, z + 1.7); } });
  // entrance: recessed doors + flat canopy on columns + letters
  B(6, .4, 9, M('#cfc8b8'), x1 + 3, 3.4, 129); [[x1 + 5.6, 125.2], [x1 + 5.6, 132.8]].forEach(([x, z]) => { mesh(new THREE.CylinderGeometry(.2, .2, 3.4, 10), white, x, 1.7, z); col(x - .25, z - .25, x + .25, z + .25); });
  const letters = mesh(new THREE.PlaneGeometry(16, 1.3), new THREE.MeshBasicMaterial({ map:label('BELLEVILLE HIGH SCHOOL', { bg:'#b58a5e', fg:'#14213d', size:64, w:1400, h:110, font:'Arial Black' }), transparent:false }), x1 + .52, 8, 129);
  letters.rotation.y = Math.PI / 2;
  // flagpole, sign, bus loop, lawn trees
  mesh(new THREE.CylinderGeometry(.07, .1, 11, 8), M('#ccc'), x1 + 12, 5.5, 140); const flag = mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshBasicMaterial({ map:label(['★★★  ═════', '═══════════'], { bg:'#b22234', fg:'#fff', size:40, w:256, h:150 }), side:THREE.DoubleSide }), x1 + 13.1, 10.2, 140);
  const sign = new THREE.Group(); sign.position.set(x1 + 14, 0, 112); S.add(sign); B(5, .6, .8, brickM('#8a4a34'), 0, 0, 0, sign); B(4.4, 1.6, .3, M('#14213d'), 0, .6, 0, sign);
  mesh(new THREE.PlaneGeometry(4.2, 1.4), new THREE.MeshBasicMaterial({ map:label(['BELLEVILLE HIGH', 'HOME OF THE MAROONS'], { bg:'#14213d', fg:'#f2d04a', size:36, w:512, h:170 }) }), 0, 1.4, .16, sign); col(x1 + 11.4, 111.5, x1 + 16.6, 112.5, 2);
  [[x1 + 10, 152], [x1 + 10, 104], [x1 + 4, 166]].forEach(([x, z]) => tree(x, z, 1.1));
  // interior: hallway with lockers + classroom walls (door to the classroom at z 134..137)
  const wallM = M('#e6e1d2'); B(.3, 3.4, 22, wallM, -141, 0, 123); B(.3, 3.4, 23, wallM, -141, 0, 148.5); B(.3, .9, 3, wallM, -141, 2.5, 135.5);
  col(-141.2, 112, -140.8, 134); col(-141.2, 137, -140.8, 160);
  for(let z = 113; z < 159; z += .9){ if(z > 126 && z < 132) continue; B(.5, 2, .8, M(z % 1.8 < .9 ? '#7a1f2a' : '#6a1a24'), -124.6, 0, z + .45); }
  B(.1, .7, 2.4, M('#2a4a2a'), -141.2, 1.3, 140, null);
  mesh(new THREE.PlaneGeometry(14, 46), M('#d8d2c2'), -133, .03, 136).rotation.x = -Math.PI / 2;
  const cl = mesh(new THREE.PlaneGeometry(46, 48), new THREE.MeshBasicMaterial({ color:0xe4e2da }), -147, 3.38, 136); cl.rotation.x = Math.PI / 2;
  const sk = (w, x, z, ry) => { const p = mesh(new THREE.PlaneGeometry(w, 3.4), wallM, x, 1.7, z); p.rotation.y = ry; p.castShadow = false; };
  sk(48, -169.75, 136, Math.PI / 2); sk(46, -147, 112.25, 0); sk(46, -147, 159.75, Math.PI); sk(15, -124.25, 119.5, -Math.PI / 2); sk(29, -124.25, 145.5, -Math.PI / 2);
  B(29, 3.4, .3, wallM, -155.5, 0, 151); col(-170, 150.8, -141, 151.2); [[-160, 150.8, '#2a5a8a'], [-150, 150.8, '#8a2a2a']].forEach(([x, z, c]) => { const p = mesh(new THREE.PlaneGeometry(3, 2), M(c), x, 1.9, z - .02); p.rotation.y = Math.PI; });
  for(let x = -166; x < -126; x += 6) for(let z = 116; z < 158; z += 6){ const l = mesh(new THREE.PlaneGeometry(1.2, 2.4), new THREE.MeshBasicMaterial({ color:0xfffdf2 }), x, 3.36, z); l.rotation.x = Math.PI / 2; }
  B(.08, 1.2, 4, M('#f4f4f0'), -169.7, 1.2, 128); B(.08, 1.2, 4, M('#2a4a2a'), -169.7, 1.2, 140); // whiteboard + chalkboard
  const clock = mesh(new THREE.CircleGeometry(.35, 20), M('#fff'), -169.75, 2.7, 134); clock.rotation.y = Math.PI / 2; }
