// Back in the 2000s: The Game — Belleville West High School, rebuilt from photos of the real campus (Frank Scott Pkwy W, opened 2003):
// three-storey red-brick academic wings with cream stone bands and paired teal windows, "BELLEVILLE WEST" lettering,
// a two-storey glass commons entry under a deep white canopy frame, courtyard between the wings, gym + performing arts centre,
// front lot on Lincoln Ave, maroon/black sign pylon, turf stadium with a maroon track. Playable inside: commons, wing B hallway, computer lab.
import { THREE, G, box, plane, floor, mat, label, mapRect, tex } from './engine.js';
import * as PR from './props.js';
import { bigTree as tree } from './buildings.js';
const S = G.scene, M = mat, HW = 12.6, HC = 9; // wing height (3 storeys), commons height
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
const col = (x0, z0, x1, z1, y1 = 13) => G.colliders.push({ x0:Math.min(x0, x1), x1:Math.max(x0, x1), z0:Math.min(z0, z1), z1:Math.max(z0, z1), y0:0, y1 });
function vp(w, h, m, x, y, z, ry){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; S.add(p); return p; }
const basic = c => new THREE.MeshBasicMaterial({ color:c });
const white = M('#f3f1ea'), cream = M('#e3d6b8'), maroon = M('#6e1a26'), black = M('#1c1c1c'), metal = M('#9aa0a6');
const glass = new THREE.MeshLambertMaterial({ color:0x8fb8c8, transparent:true, opacity:.38, emissive:0x1a2c34, side:THREE.DoubleSide, depthWrite:false });

// ---------- textures ----------
const PX = 32; // pixels per metre
function brick(g, w, h){ g.fillStyle = '#b8a78f'; g.fillRect(0, 0, w, h); for(let y = 0, r = 0; y < h; y += 3, r++) for(let x = r % 2 ? -5 : 0; x < w; x += 10){ const v = 120 + Math.random() * 30 | 0; g.fillStyle = `rgb(${v + 22},${v * .42 | 0},${v * .32 | 0})`; g.fillRect(x, y, 9, 2); } }
function drawFacade(g, w, h){ brick(g, w, h); const Y = m => h - m * PX;
  g.fillStyle = '#e3d6b8'; g.fillRect(0, Y(.9), w, .9 * PX); g.fillRect(0, Y(HW), w, 1 * PX); g.fillRect(0, Y(4.3), w, .25 * PX); g.fillRect(0, Y(8.4), w, .25 * PX);
  for(let f = 0; f < 3; f++){ const sill = 1.3 + f * 4.1; [1.3, 3.9].forEach(x0 => { const x = x0 * PX, y = Y(sill + 2.1), ww = 1.8 * PX, hh = 2.1 * PX;
    const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, '#7fa9b3'); gr.addColorStop(1, '#2f5a63'); g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    g.strokeStyle = '#e9e6dc'; g.lineWidth = 3; g.strokeRect(x, y, ww, hh); g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + hh); g.moveTo(x, y + hh * .3); g.lineTo(x + ww, y + hh * .3); g.stroke();
    g.fillStyle = '#e3d6b8'; g.fillRect(x - 4, y + hh, ww + 8, 5); }); } }
const facade = (nx, part) => { const m = new THREE.MeshLambertMaterial({ map:tex('bwfac', drawFacade, 7 * PX, HW * PX, [nx, part ? part[1] : 1]) }); if(part) m.map.offset.y = part[0]; return m; };
const brickOnly = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwbrick', brick, 128, 128, [nx, ny]) });
const block = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwblock', (g, w, h) => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.08)';
  for(let y = 0, r = 0; y < h; y += 16, r++){ g.fillRect(0, y, w, 1); for(let x = r % 2 ? 16 : 0; x < w; x += 32) g.fillRect(x, y, 1, 16); } }, 128, 128, [nx, ny]), emissive:0x6a665c });
const lockers = n => new THREE.MeshLambertMaterial({ map:tex('bwlock', (g, w, h) => { g.fillStyle = '#6e1a26'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.45)';
  for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h); g.fillRect(0, h / 2, w, 1); g.fillStyle = 'rgba(0,0,0,.35)'; for(let x = 4; x < w; x += 16) for(let k = 0; k < 4; k++){ g.fillRect(x, 8 + k * 3, 8, 1); g.fillRect(x, h / 2 + 8 + k * 3, 8, 1); }
  g.fillStyle = '#c9c9c9'; for(let x = 12; x < w; x += 16){ g.fillRect(x, h / 2 - 14, 2, 6); g.fillRect(x, h - 14, 2, 6); } }, 128, 64, [n, 1]), emissive:0x2a0a0e });
const tan = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwtan', (g, w, h) => { g.fillStyle = '#cdbb98'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.07)'; for(let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1); for(let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h); }, 128, 128, [nx, ny]) });
const terr = (nx, nz) => new THREE.MeshLambertMaterial({ map:tex('bwterr', (g, w, h) => { g.fillStyle = '#ddd6c8'; g.fillRect(0, 0, w, h); for(let i = 0; i < 2500; i++){ g.fillStyle = ['#bfb3a0', '#efe9dd', '#a89a88', '#cfc6b6', '#bfb3a0', '#efe9dd', '#a89a88', '#8a4a4a'][Math.random() * 8 | 0]; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }, 128, 128, [nx, nz]), emissive:0x2a2824 });
const sign = (text, o) => new THREE.MeshBasicMaterial({ map:label(text, o), transparent:!!o.clear });

// ---------- pieces ----------
// exterior facade planes on all four faces of a 3-storey wing (faces: list of 'n','s','e','w' with optional x/z spans)
function wingFacades(x0, z0, x1, z1, faces){ const L = x1 - x0, D = z1 - z0;
  for(const [f, a, b] of faces){ const s0 = a ?? (f === 'n' || f === 's' ? x0 : z0), s1 = b ?? (f === 'n' || f === 's' ? x1 : z1), len = s1 - s0, m = facade(Math.max(1, Math.round(len / 7)));
    if(f === 's') vp(len, HW, m, (s0 + s1) / 2, HW / 2, z1 + .03, 0); if(f === 'n') vp(len, HW, m, (s0 + s1) / 2, HW / 2, z0 - .03, Math.PI);
    if(f === 'e') vp(len, HW, m, x1 + .03, HW / 2, (s0 + s1) / 2, Math.PI / 2); if(f === 'w') vp(len, HW, m, x0 - .03, HW / 2, (s0 + s1) / 2, -Math.PI / 2); }
  plane(L, D, M('#c9c7c0'), (x0 + x1) / 2, HW, (z0 + z1) / 2); // flat roof
  deco(L + .6, .6, .5, cream, (x0 + x1) / 2, HW, z0); deco(L + .6, .6, .5, cream, (x0 + x1) / 2, HW, z1); deco(.5, .6, D, cream, x0, HW, (z0 + z1) / 2); deco(.5, .6, D, cream, x1, HW, (z0 + z1) / 2);
  mapRect(x0, z0, x1, z1, '#9a4a3a'); }
function letters(text, w, h, x, y, z, ry, fg = '#efe6cf', bg = '#8e3b2c'){ vp(w, h, sign(text, { bg, fg, size:Math.round(Math.min(h * 120 * .75, w * 64 * 1.55 / text.length)), w:Math.round(w * 64), h:Math.round(h * 120), font:'Arial Black' }), x, y, z, ry); }
// glass curtain wall along z at x (two storeys), optional door gap [a,b]
function curtainZ(x, z0, z1, h, gap, faceOut){ vp(z1 - z0, h, glass, x, h / 2, (z0 + z1) / 2, Math.PI / 2);
  for(let z = z0; z <= z1 + .01; z += 3) deco(.18, h, .18, white, x, 0, z); [0, 3.3, h / 2 + 1, h - .2].forEach(y => deco(.2, .2, z1 - z0, white, x, y, (z0 + z1) / 2));
  if(gap){ col(x - .2, z0, x + .2, gap[0], h); col(x - .2, gap[1], x + .2, z1, h); deco(.25, .35, gap[1] - gap[0], M('#55595e'), x, 3.0, (gap[0] + gap[1]) / 2); }
  else col(x - .2, z0, x + .2, z1, h); }
function lightsGrid(x0, z0, x1, z1, y, step = 4){ const lm = basic(0xfffdf2); for(let x = x0 + step / 2; x < x1; x += step) for(let z = z0 + step / 2; z < z1; z += step){ const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .6), lm); l.rotation.x = Math.PI / 2; l.position.set(x, y - .02, z); S.add(l); } }
function ceiling(x0, z0, x1, z1, y, c = 0xe9e7e0){ const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), basic(c)); p.rotation.x = Math.PI / 2; p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); S.add(p); }
function floorP(x0, z0, x1, z1, m){ if(m === 'T') m = terr((x1 - x0) / 4, (z1 - z0) / 4); plane(x1 - x0, z1 - z0, m, (x0 + x1) / 2, .03, (z0 + z1) / 2); }
// interior wall along x at z with door/opening gaps [[a,b,h]], skin material per side
function wallX(x0, x1, z, h, m, gaps = [], y1 = h){ let x = x0; for(const [a, b, gh] of [...gaps].sort((p, q) => p[0] - q[0])){ if(a > x){ deco(a - x, h, .25, m, (x + a) / 2, 0, z); col(x, z - .15, a, z + .15, y1); } if(gh < h) deco(b - a, h - gh, .25, m, (a + b) / 2, gh, z); x = b; } if(x1 > x){ deco(x1 - x, h, .25, m, (x + x1) / 2, 0, z); col(x, z - .15, x1, z + .15, y1); } }
function wallZ(z0, z1, x, h, m, gaps = []){ let z = z0; for(const [a, b, gh] of [...gaps].sort((p, q) => p[0] - q[0])){ if(a > z){ deco(.25, h, a - z, m, x, 0, (z + a) / 2); col(x - .15, z, x + .15, a); } if(gh < h) deco(.25, h - gh, b - a, m, x, gh, (a + b) / 2); z = b; } if(z1 > z){ deco(.25, h, z1 - z, m, x, 0, (z + z1) / 2); col(x - .15, z, x + .15, z1); } }
function lamp(x, z){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.2, 8), black); p.position.set(x, 2.1, z); S.add(p); const h = new THREE.Mesh(new THREE.CylinderGeometry(.22, .14, .5, 8), black); h.position.set(x, 4.4, z); S.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), basic(0xfff3cf)); b.position.set(x, 4.2, z); S.add(b); }

export function buildSchool(){
  // ===== footprint =====
  const WB = [-270, 100, -140, 128], WA = [-270, 172, -140, 200], CM = [-190, 128, -140, 172], GYM = [-322, 100, -272, 150], PAC = [-322, 152, -272, 200];
  // ===== wing A (south, solid) =====
  { const [x0, z0, x1, z1] = WA; box(x1 - x0 - .1, HW, z1 - z0 - .1, M('#8e3b2c'), (x0 + x1) / 2, 0, (z0 + z1) / 2);
    wingFacades(x0, z0, x1, z1, [['s'], ['e'], ['w'], ['n', x0, -190]]);
    vp(50, HW - HC, facade(7, [HC / HW, (HW - HC) / HW]), -165, (HC + HW) / 2, z0 - .03, Math.PI); // above the commons roof
    letters('BELLEVILLE WEST', 15, 1.1, x1 + .06, HW - 1.6, (z0 + z1) / 2, Math.PI / 2); letters('BELLEVILLE WEST', 15, 1.1, -160, HW - 1.6, z1 + .06, 0); }
  // ===== wing B (north) — ground floor playable =====
  { const [x0, z0, x1, z1] = WB; wingFacades(x0, z0, x1, z1, [['n'], ['e'], ['w'], ['s', x0, -190]]);
    vp(50, HW - HC, facade(7, [HC / HW, (HW - HC) / HW]), -165, (HC + HW) / 2, z1 + .03, 0);
    letters('BELLEVILLE WEST', 15, 1.1, -160, HW - 1.6, z0 - .06, Math.PI); letters('BELLEVILLE WEST', 15, 1.1, x1 + .06, HW - 1.6, (z0 + z1) / 2, Math.PI / 2);
    col(x0, z0 - .2, x1, z0 + .2); col(x0 - .2, z0, x0 + .2, z1); col(x1 - .2, z0, x1 + .2, z1); col(x0, z1 - .2, -190, z1 + .2);
    const bk = block(10, 1);
    // hallway z 114..120 with lockers both sides, terrazzo, drop ceiling + lights
    floorP(x0 + 2, 114, x1 - 2, 120, 'T'); ceiling(x0, 113.8, x1, 120.2, 3.6); lightsGrid(x0 + 2, 114, x1 - 2, 120, 3.6, 6);
    wallX(x0 + 2, x1 - 2, 114, 3.6, bk, [[-185.6, -184.2, 2.3]]); wallX(x0 + 2, x1 - 2, 120, 3.6, bk, [[-175, -165, 3.6]]);
    wallZ(114, 120, x0 + 2, 3.6, bk); wallZ(114, 120, x1 - 2, 3.6, bk); vp(1.6, 2.3, M('#7a6a52'), x1 - 2.15, 1.15, 117, -Math.PI / 2); // end door
    for(let x = x0 + 3; x < x1 - 3; x += 12){ // lockers + classroom doors
      if(x < -206 || x > -182){ vp(1.1, 2.2, M('#8a6a44'), x + 6, 1.1, 113.85, 0); const nm = new THREE.Mesh(new THREE.PlaneGeometry(.5, .2), sign(String(100 + ((x - x0) / 12 | 0) * 2), { bg:'#fff', fg:'#222', size:60, w:128, h:50 })); nm.position.set(x + 6, 2.5, 113.84); S.add(nm); }
      const a = x, b = x + 12, skip = ([p, q]) => b > p && a < q; if(!skip([-187, -183])){ vp(4, 1.9, lockers(4), x + 2.5, 1, 113.86, 0); vp(4, 1.9, lockers(4), x + 9.5, 1, 113.86, 0); }
      if(!skip([-176, -164])) vp(10, 1.9, lockers(10), x + 6, 1, 120.14, Math.PI); }
    [[-230, 'GO MAROONS!'], [-150, 'CLASS OF 2004']].forEach(([x, t]) => vp(5, 1, sign(t, { bg:'#6e1a26', fg:'#f1e3c3', size:60, w:512, h:100 }), x, 2.9, 119.85, Math.PI));
    // cross corridor to the commons (x -175..-165, z 120..128)
    floorP(-175, 120, -165, 128.4, 'T'); ceiling(-175, 120, -165, 128.4, 3.6); wallZ(120, 128, -175, 3.6, bk); wallZ(120, 128, -165, 3.6, bk);
    // computer lab (Mrs. Sparks) x -206..-182, z 100..114
    const L0 = -206, L1 = -182; floorP(L0, 100.2, L1, 113.9, M('#5a6577')); ceiling(L0, 100.2, L1, 113.9, 3.4); lightsGrid(L0, 100.2, L1, 113.9, 3.4, 4);
    wallZ(100.2, 113.9, L0, 3.6, bk); wallZ(100.2, 113.9, L1, 3.6, bk);
    vp(24, 3.4, new THREE.MeshLambertMaterial({ map:tex('bwlabwin', (g, w, h) => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); for(const x0 of [1.3, 3.9]){ g.fillStyle = '#cfe6f2'; g.fillRect(x0 * 32, 26, 58, 66); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x0 * 32, 26, 58, 66); g.beginPath(); g.moveTo(x0 * 32 + 29, 26); g.lineTo(x0 * 32 + 29, 92); g.stroke(); } }, 224, 109, [24 / 7, 1]) }), -194, 1.7, 100.25, 0);
    deco(.08, 1.3, 5, M('#f7f7f4'), L0 + .15, 1, 107); deco(.1, .08, 5.2, M('#999'), L0 + .2, .95, 107); // whiteboard
    const clk = new THREE.Mesh(new THREE.CircleGeometry(.3, 20), white); clk.position.set(L0 + .16, 2.8, 104); clk.rotation.y = Math.PI / 2; S.add(clk);
    vp(3, .7, sign('COMPUTER APPLICATIONS — MRS. SPARKS', { bg:'#1c3d6e', fg:'#fff', size:34, w:512, h:110 }), -194, 2.9, 113.75, Math.PI);
    box(1.6, .76, .8, M('#7a5a3a'), L0 + 3, 0, 107); // teacher desk
    const seats = [], screens = [];
    for(const cx of [-199, -193, -187]) for(const cz of [103.4, 107.4, 111.4]){ box(.9, .74, 2.6, M('#b89a6a'), cx - .7, 0, cz);
      [-.6, .6].forEach(dz => { const pc = PR.crtMonitor(cx - .85, .74, cz + dz, Math.PI / 2); screens.push(pc.screen); PR.chair(cx + .1, 0, cz + dz, -Math.PI / 2, '#2a3a5a'); seats.push({ x:cx + .2, z:cz + dz }); }); }
    G.classroom = { seats, sparks:{ x:L0 + 3, z:105.6 }, jax:seats[4], chris:seats[17], door:{ x:-184.9, z:117 }, cam:[[-183.5, 3, 113], [-200, 1.2, 104]], screens };
    mapRect(L0, 100, L1, 114, '#b07a6a'); }
  // ===== commons (two storeys, glass front + back) =====
  { const [x0, z0, x1, z1] = CM; box(x1 - x0, .5, z1 - z0, M('#c9c7c0'), (x0 + x1) / 2, HC, (z0 + z1) / 2, { col:false }); deco(x1 - x0 + .6, .8, .6, cream, (x0 + x1) / 2, HC - .2, z1);
    curtainZ(x1, z0 + 4, z1 - 4, HC, [146, 154]); curtainZ(x0, z0 + 4, z1 - 4, HC);
    [[x1, z0 + 2], [x1, z1 - 2], [x0, z0 + 2], [x0, z1 - 2]].forEach(([x, z]) => { box(1, HC, 4, brickOnly(1, 3), x, 0, z); });
    floorP(x0, z0, x1, z1, 'T'); const em = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshLambertMaterial({ map:label('BW', { bg:'#6e1a26', fg:'#e9dcc0', size:150, w:256, h:256, font:'Georgia' }) }));
    em.rotation.x = -Math.PI / 2; em.position.set(-158, .05, 150); S.add(em);
    ceiling(x0, z0, x1, z1, HC - .05, 0xf1efe8); lightsGrid(x0, z0, x1, z1, HC - .05, 6);
    const bk = block(10, 2); wallX(x0, x1, z0 + .2, HC, bk, [[-175, -165, 3.6]], HC); wallX(x0, x1, z1 - .2, HC, bk, [], HC);
    // cafeteria serving line, trophy case, banners, tables
    box(16, 1, 1.1, M('#8a8f96'), -178, 0, 169.6); deco(16, .7, .05, glass, -178, 1.15, 169.1); deco(16, .06, .5, metal, -178, 1.85, 169.3);
    vp(8, 1.2, sign('CAFETERIA', { bg:'#6e1a26', fg:'#fff', size:80, w:512, h:120 }), -178, 4.2, 171.7, Math.PI);
    box(8, 2.2, .8, M('#4a2a1a'), -153, 0, 129); deco(7.6, 1.6, .05, glass, -153, .5, 129.45); for(let i = 0; i < 7; i++){ const t = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .5 + (i % 3) * .2, 8), M('#d4af37')); t.position.set(-156.2 + i * 1.05, .9, 129.1); S.add(t); }
    [['MAROONS', -176, 128.5, 0], ['BELLEVILLE WEST', -152, 171.5, Math.PI], ['STATE CHAMPS', -186, 171.5, Math.PI]].forEach(([t, x, z, ry]) => vp(5, 2.4, sign(t, { bg:'#6e1a26', fg:'#e9dcc0', size:70, w:512, h:240 }), x, 6.2, z, ry));
    for(let x = -182; x <= -148; x += 8.5) for(let z = 136; z <= 164; z += 7){ if(Math.hypot(x + 158, z - 150) < 5 || (z === 150 && x > -152)) continue; const t = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .06, 16), M('#e8e4da')); t.position.set(x, .76, z); S.add(t);
      deco(.12, .74, .12, metal, x, 0, z); col(x - .9, z - .9, x + .9, z + .9, .8); for(let k = 0; k < 4; k++){ const a = k * Math.PI / 2, s = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .45, 10), maroon); s.position.set(x + Math.cos(a) * 1.3, .22, z + Math.sin(a) * 1.3); S.add(s); } }
    // entrance canopy: deep white frame on brick piers + lettering + walkway lamps
    deco(9, 1.3, 21, white, x1 + 4.5, 6.6, 150); [141, 159].forEach(z => { box(1.2, 6.6, 1.2, brickOnly(1, 2), x1 + 8.4, 0, z); deco(9, 6.6, .3, white, x1 + 4.5, 0, z + (z < 150 ? -.3 : .3)); });
    letters('BELLEVILLE WEST HIGH SCHOOL', 16, .8, x1 + 9.06, 7.25, 150, Math.PI / 2, '#6e1a26', '#f3f1ea');
    mapRect(x0, z0, x1, z1, '#c9a89a'); }
  // ===== gym + performing arts centre =====
  { let [x0, z0, x1, z1] = GYM; box(x1 - x0, 13, z1 - z0, tan(8, 3), (x0 + x1) / 2, 0, (z0 + z1) / 2); deco(x1 - x0 + .2, 3, z1 - z0 + .2, brickOnly(10, 1), (x0 + x1) / 2, 0, (z0 + z1) / 2);
    deco(x1 - x0 + .3, 1.2, z1 - z0 + .3, maroon, (x0 + x1) / 2, 10.6, (z0 + z1) / 2); plane(x1 - x0, z1 - z0, M('#c9c7c0'), (x0 + x1) / 2, 13.02, (z0 + z1) / 2);
    letters('MAROONS', 14, 2.2, x1 + .2, 7.2, (z0 + z1) / 2, Math.PI / 2, '#6e1a26', '#cdbb98'); letters('MAROONS', 14, 2.2, (x0 + x1) / 2, 7.2, z0 - .2, Math.PI, '#6e1a26', '#cdbb98'); mapRect(x0, z0, x1, z1, '#b8a888');
    [x0, z0, x1, z1] = PAC; box(x1 - x0, 10, z1 - z0, brickOnly(12, 3), (x0 + x1) / 2, 0, (z0 + z1) / 2); box(20, 18, 24, tan(5, 4), -296, 0, 176); plane(20, 24, M('#c9c7c0'), -296, 18.02, 176);
    plane(x1 - x0, z1 - z0, M('#c9c7c0'), (x0 + x1) / 2, 10.02, (z0 + z1) / 2); letters('PERFORMING ARTS CENTER', 16, 1, x1 + .2, 8.4, (z0 + z1) / 2, Math.PI / 2, '#efe6cf', '#8e3b2c'); mapRect(x0, z0, x1, z1, '#a06050');
    box(2, 9, 48, M('#8e3b2c'), -271, 0, 150, { col:true }); } // link
  // ===== courtyard between the wings =====
  floorP(-270, 147, -190, 153, M('#c9c3b5')); [[-255, 138], [-235, 162], [-215, 138], [-200, 162], [-245, 160], [-222, 141]].forEach(([x, z]) => tree(x, z, 1));
  for(let x = -262; x < -195; x += 16){ box(2, .45, .5, M('#7a5a3a'), x, 0, 145.6); box(2, .45, .5, M('#7a5a3a'), x, 0, 154.4); }
  // ===== front: walkway plaza, lamps, planters, flag, sign pylon, lots =====
  floorP(-140, 145, -112, 155, M('#c9c3b5')); for(let x = -136; x > -114; x -= 6){ lamp(x, 144.4); lamp(x, 155.6); }
  [[-131, 141], [-131, 159], [-121, 141], [-121, 159]].forEach(([x, z]) => { box(3.4, .6, 2.4, M('#b9b1a2'), x, 0, z); const s = new THREE.Mesh(new THREE.IcosahedronGeometry(.9, 0), M('#3d6a2e')); s.position.set(x, 1, z); s.scale.y = .6; S.add(s); });
  { const fp = new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 12, 8), M('#ccc')); fp.position.set(-121, 6, 137); S.add(fp); col(-121.2, 136.8, -120.8, 137.2);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), sign(['★★★  ═════', '═══════════'], { bg:'#b22234', fg:'#fff', size:40, w:256, h:150 })); fl.position.set(-121, 11.2, 138.2); fl.rotation.y = Math.PI / 2; fl.material.side = THREE.DoubleSide; S.add(fl); }
  { const g = new THREE.Group(); g.position.set(-118.5, 0, 122); g.rotation.y = Math.PI / 2; S.add(g);
    const pb = (w, h, d, m, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, 0); b.castShadow = true; g.add(b); };
    pb(5.4, .7, 1.2, M('#9a9288'), 0, 0); pb(1.1, 5.6, .9, maroon, -2.1, .7); pb(1.1, 5.6, .9, maroon, 2.1, .7); pb(3.1, 1.4, .7, black, 0, 4.9); pb(3.1, 1.6, .5, black, 0, 2.6);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), sign(['BELLEVILLE', 'WEST'], { bg:'#1c1c1c', fg:'#fff', size:44, w:300, h:120 })); t.position.set(0, 5.6, .36); g.add(t);
    const led = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.4), sign(['WELCOME BACK', 'MAROONS!', 'FOOTBALL FRI 7PM'], { bg:'#120806', fg:'#ffb43a', size:30, w:300, h:150 })); led.position.set(0, 3.4, .26); g.add(led);
    col(-119.3, 119.2, -117.7, 124.8, 6.3); }
  { const asph = new THREE.MeshLambertMaterial({ color:'#46484c' }), line = basic(0xe8e8e0);
    [[96, 141], [159, 246]].forEach(([a, b]) => { floorP(-138, a, -116, b, asph); for(let z = a + 2; z < b - 1; z += 3){ plane(5, .12, line, -134.5, .05, z); plane(5, .12, line, -119.5, .05, z); } mapRect(-138, a, -116, b, '#5a5d63'); });
    [[100, 108], [180, 188], [232, 240]].forEach(([a, b]) => floorP(-116, a, -111.9, b, asph)); }
  // ===== stadium: turf field, maroon track, bleachers, press box, lights =====
  { const tx0 = -312, tx1 = -198, tz0 = 203.5, tz1 = 247.5; plane(tx1 - tx0, tz1 - tz0, M('#7a2a2a'), (tx0 + tx1) / 2, .025, (tz0 + tz1) / 2);
    plane(100, 37, new THREE.MeshLambertMaterial({ map:tex('bwturf', (g, w, h) => { for(let i = 0; i < 10; i++){ g.fillStyle = i % 2 ? '#3f8a3a' : '#468f40'; g.fillRect(i * w / 10, 0, w / 10, h); } g.fillStyle = '#fff'; for(let i = 0; i <= 10; i++) g.fillRect(i * w / 10 - 1, 0, 2, h); }, 512, 128, [1, 1]) }), -255, .04, 225.5);
    [-310, -200].forEach(x => { plane(9, 37, M('#6e1a26'), x + (x < -255 ? 4.5 : -4.5) + (x < -255 ? 0 : 0), .045, 225.5); });
    [-312.5, -197.5].forEach(x => { const gp = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3, 6), M('#e8c832')); gp.position.set(x, 1.5, 225.5); S.add(gp); deco(.15, .15, 5.6, M('#e8c832'), x, 3, 225.5); [-2.8, 2.8].forEach(dz => deco(.12, 3.2, .12, M('#e8c832'), x, 3, 225.5 + dz)); });
    for(let r = 0; r < 7; r++) box(3, .5, 36, metal, -316 - r * .9, r * .45, 225.5, { col:r === 0 }); box(4, 3, 10, maroon, -322, 3.2, 225.5, { col:false }); col(-323.5, 207.5, -314.5, 243.5, 4);
    [[-300, 200], [-210, 200], [-300, 251], [-210, 251]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 22, 8), metal); p.position.set(x, 11, z); S.add(p); deco(3.4, 2, .4, M('#d9d9d2'), x, 21, z); col(x - .3, z - .3, x + .3, z + .3); });
    mapRect(tx0, tz0, tx1, tz1, '#7a2a2a'); mapRect(-305, 207, -205, 244, '#3f8a3a'); }
  // lawn trees along Lincoln
  [[-124, 104], [-124, 132], [-126, 168], [-145, 92], [-185, 92], [-225, 92], [-265, 92], [-145, 206], [-175, 206]].forEach(([x, z]) => tree(x, z, 1.1));
  G.schoolFront = { x:-128, z:150 };
}
