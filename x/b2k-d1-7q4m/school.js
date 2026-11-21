// Back in the 2000s: The Game — Belleville West High School, rebuilt from photos of the real campus (Frank Scott Pkwy W, opened 2003):
// three-storey red-brick academic wings with cream stone bands and paired teal windows, "BELLEVILLE WEST" lettering,
// a two-storey glass commons entry under a deep white canopy frame, courtyard between the wings, gym + performing arts centre,
// front lot on Lincoln Ave, maroon/black sign pylon, turf stadium with a maroon track. Playable inside: commons, wing B hallway, computer lab.
import { THREE, G, box, plane, floor, mat, label, mapRect, tex } from './engine.js';
import * as PR from './props.js';
import { bigTree as tree } from './buildings.js';
const S = G.scene, M = mat, HW = 12.6, HC = 9; // wing height (3 storeys), commons height
const deco = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, { col:false });
let YO = 0; // floor offset while building the upper storeys
const col = (x0, z0, x1, z1, y1 = 13) => G.colliders.push({ x0:Math.min(x0, x1), x1:Math.max(x0, x1), z0:Math.min(z0, z1), z1:Math.max(z0, z1), y0:YO, y1:YO + y1 });
function vp(w, h, m, x, y, z, ry){ const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; p.receiveShadow = true; S.add(p); return p; }
const basic = c => new THREE.MeshBasicMaterial({ color:c });
const white = M('#f3f1ea'), cream = M('#e3d6b8'), maroon = M('#6e1a26'), black = M('#1c1c1c'), metal = M('#9aa0a6');
const glass = new THREE.MeshLambertMaterial({ color:0x8fb8c8, transparent:true, opacity:.38, emissive:0x1a2c34, side:THREE.DoubleSide, depthWrite:false });

// ---------- textures ----------
const PX = 32; // pixels per metre
function brick(g, w, h){ g.fillStyle = '#b8a78f'; g.fillRect(0, 0, w, h); for(let y = 0, r = 0; y < h; y += 3, r++) for(let x = r % 2 ? -5 : 0; x < w; x += 10){ const v = 120 + Math.random() * 30 | 0; g.fillStyle = `rgb(${v + 22},${v * .42 | 0},${v * .32 | 0})`; g.fillRect(x, y, 9, 2); } }
function blockRows(g, w, y0, y1, base, jit, speck){ for(let y = y0, r = 0; y < y1; y += 6, r++) for(let x = r % 2 ? -8 : 0; x < w; x += 16){ const c = new THREE.Color(base).offsetHSL(0, 0, (Math.random() - .5) * jit); g.fillStyle = '#' + c.getHexString(); g.fillRect(x + 1, y + 1, 15, 5);
  if(speck) for(let k = 0; k < 6; k++){ g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; g.fillRect(x + 1 + Math.random() * 14, y + 1 + Math.random() * 4, 1, 1); } } }
// outer faces: red brick + cream bands; courtyard faces (from the author's photo): cream block with a darker split-face base band. Sage-green window frames.
const drawFacade = kind => (g, w, h) => { const Y = m => h - m * PX;
  if(kind === 'c'){ g.fillStyle = '#8f877a'; g.fillRect(0, 0, w, h); blockRows(g, w, 0, Y(4.3), '#ddd6c8', .04); blockRows(g, w, Y(4.3), h, '#b5aa96', .08, true); g.fillStyle = '#9c927f'; g.fillRect(0, Y(4.4), w, 3); }
  else { brick(g, w, h); g.fillStyle = '#e3d6b8'; g.fillRect(0, Y(.9), w, .9 * PX); g.fillRect(0, Y(HW), w, 1 * PX); g.fillRect(0, Y(4.3), w, .25 * PX); g.fillRect(0, Y(8.4), w, .25 * PX); }
  for(let f = 0; f < 3; f++){ const sill = 1.3 + f * 4.1; [1.3, 3.9].forEach(x0 => { const x = x0 * PX, y = Y(sill + 2.1), ww = 1.8 * PX, hh = 2.1 * PX;
    const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, '#7fa9b3'); gr.addColorStop(1, '#2f5a63'); g.fillStyle = gr; g.fillRect(x, y, ww, hh);
    g.strokeStyle = '#4f6e5c'; g.lineWidth = 3; g.strokeRect(x, y, ww, hh); g.beginPath(); g.moveTo(x, y + hh * .45); g.lineTo(x + ww, y + hh * .45); g.stroke();
    g.fillStyle = kind === 'c' ? '#c9c0ae' : '#e3d6b8'; g.fillRect(x - 4, y + hh, ww + 8, 5); }); } };
const facade = (nx, part, kind = 'b') => { const m = new THREE.MeshLambertMaterial({ map:tex('bwfac' + kind, drawFacade(kind), 7 * PX, HW * PX, [nx, part ? part[1] : 1]) }); if(part) m.map.offset.y = part[0]; return m; };
// interior walls (author's photos): light split-face block, charcoal course, speckled maroon-brown ground-face band, charcoal base; 4 m x 3.6 m tile
const wainTex = (g, w, h) => { const Y = m => h - m * PX; g.fillStyle = '#6f6a62'; g.fillRect(0, 0, w, h);
  blockRows(g, w, 0, Y(1.4), '#cfcbc2', .05, true); blockRows(g, w, Y(1.4), Y(1.2), '#4a4a4a', .05); blockRows(g, w, Y(1.2), Y(.2), '#7a5550', .07, true); blockRows(g, w, Y(.2), h, '#4a4a4a', .05); };
const wain = (len, y0 = 0, y1 = 3.6) => { const m = new THREE.MeshLambertMaterial({ map:tex('bwwain', wainTex, 4 * PX, 3.6 * PX, [Math.max(.25, len / 4), (y1 - y0) / 3.6]), emissive:0x3a3834 }); m.map.offset.y = y0 / 3.6; return m; };
const upperBlock = len => new THREE.MeshLambertMaterial({ map:tex('bwupb', (g, w, h) => { g.fillStyle = '#6f6a62'; g.fillRect(0, 0, w, h); blockRows(g, w, 0, h, '#cfcbc2', .05, true); }, 128, 115, [len / 4, 1]), emissive:0x3a3834 });
// floors: maroon VCT with white speckled bands (halls), light terrazzo with black bands (entry/commons)
const vct = (lenX, lenZ) => new THREE.MeshLambertMaterial({ map:tex('bwvct', (g, w, h) => { g.fillStyle = '#5a2a3a'; g.fillRect(0, 0, w, h);
  const wt = (x, y, ww, hh) => { g.fillStyle = '#ece8e0'; g.fillRect(x, y, ww, hh); for(let i = 0; i < ww * hh / 40; i++){ g.fillStyle = Math.random() < .5 ? '#8a8a8a' : '#b0a898'; g.fillRect(x + Math.random() * ww, y + Math.random() * hh, 2, 1); } };
  wt(0, 0, w, 19); wt(0, h - 19, w, 19); wt(0, 0, 38, h); g.fillStyle = '#1e1e1e'; g.fillRect(38, 19, 19, 19); g.fillRect(38, h - 38, 19, 19);
  g.strokeStyle = 'rgba(0,0,0,.12)'; for(let x = 0; x < w; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for(let y = 0; y < h; y += 10){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, 256, 192, [lenX / 8, lenZ / 6]), emissive:0x221a1e });
const terrB = (nx, nz) => new THREE.MeshLambertMaterial({ map:tex('bwterrb', (g, w, h) => { g.fillStyle = '#ebe5d9'; g.fillRect(0, 0, w, h); for(let i = 0; i < 1600; i++){ g.fillStyle = ['#b5ad9f', '#8a847a', '#d6ccbb', '#c9bfae'][Math.random() * 4 | 0]; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
  g.fillStyle = '#1e1e1e'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h); }, 192, 192, [nx, nz]), emissive:0x2a2824 });
const tiles = (lx, lz) => new THREE.MeshBasicMaterial({ map:tex('bwceil', (g, w, h) => { g.fillStyle = '#efeee9'; g.fillRect(0, 0, w, h); for(let i = 0; i < 900; i++){ g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); } g.fillStyle = '#c9c7c0'; for(let k = 0; k < w; k += 19.2){ g.fillRect(k, 0, 1.5, h); g.fillRect(0, k, w, 1.5); } }, 128, 128, [lx / 4, lz / 4]) });
const brickOnly = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwbrick', brick, 128, 128, [nx, ny]) });
const block = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwblock', (g, w, h) => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.08)';
  for(let y = 0, r = 0; y < h; y += 16, r++){ g.fillRect(0, y, w, 1); for(let x = r % 2 ? 16 : 0; x < w; x += 32) g.fillRect(x, y, 1, 16); } }, 128, 128, [nx, ny]), emissive:0x6a665c });
const tan = (nx, ny) => new THREE.MeshLambertMaterial({ map:tex('bwtan', (g, w, h) => { g.fillStyle = '#cdbb98'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.07)'; for(let y = 0; y < h; y += 8) g.fillRect(0, y, w, 1); for(let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h); }, 128, 128, [nx, ny]) });
const terr = (nx, nz) => new THREE.MeshLambertMaterial({ map:tex('bwterr', (g, w, h) => { g.fillStyle = '#ddd6c8'; g.fillRect(0, 0, w, h); for(let i = 0; i < 2500; i++){ g.fillStyle = ['#bfb3a0', '#efe9dd', '#a89a88', '#cfc6b6', '#bfb3a0', '#efe9dd', '#a89a88', '#8a4a4a'][Math.random() * 8 | 0]; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }, 128, 128, [nx, nz]), emissive:0x2a2824 });
const sign = (text, o) => new THREE.MeshBasicMaterial({ map:label(text, o), transparent:!!o.clear });

// ---------- pieces ----------
// exterior facade planes on all four faces of a 3-storey wing (faces: list of 'n','s','e','w' with optional x/z spans)
function wingFacades(x0, z0, x1, z1, faces){ const L = x1 - x0, D = z1 - z0;
  for(const [f, a, b, kind] of faces){ const s0 = a ?? (f === 'n' || f === 's' ? x0 : z0), s1 = b ?? (f === 'n' || f === 's' ? x1 : z1), len = s1 - s0, m = facade(Math.max(1, Math.round(len / 7)), null, kind);
    if(f === 's') vp(len, HW, m, (s0 + s1) / 2, HW / 2, z1 + .03, 0); if(f === 'n') vp(len, HW, m, (s0 + s1) / 2, HW / 2, z0 - .03, Math.PI);
    if(f === 'e') vp(len, HW, m, x1 + .03, HW / 2, (s0 + s1) / 2, Math.PI / 2); if(f === 'w') vp(len, HW, m, x0 - .03, HW / 2, (s0 + s1) / 2, -Math.PI / 2); }
  plane(L, D, M('#c9c7c0'), (x0 + x1) / 2, HW, (z0 + z1) / 2); // flat roof
  deco(L + .6, .6, .5, cream, (x0 + x1) / 2, HW, z0); deco(L + .6, .6, .5, cream, (x0 + x1) / 2, HW, z1); deco(.5, .6, D, cream, x0, HW, (z0 + z1) / 2); deco(.5, .6, D, cream, x1, HW, (z0 + z1) / 2);
  mapRect(x0, z0, x1, z1, '#9a4a3a'); }
function letters(text, w, h, x, y, z, ry, fg = '#efe6cf', bg = '#8e3b2c'){ vp(w, h, sign(text, { bg, fg, size:Math.round(Math.min(h * 120 * .75, w * 64 * 1.55 / text.length)), w:Math.round(w * 64), h:Math.round(h * 120), font:'Arial Black' }), x, y, z, ry); }
// glass curtain wall along z at x (two storeys), optional door gap [a,b]
function curtainZ(x, z0, z1, h, gap, faceOut){ vp(z1 - z0, h, glass, x, h / 2, (z0 + z1) / 2, Math.PI / 2);
  const sage = M('#5f7f6a'); for(let z = z0; z <= z1 + .01; z += 3) deco(.18, h, .18, sage, x, 0, z); [0, 3.3, h / 2 + 1, h - .2].forEach(y => deco(.2, .2, z1 - z0, sage, x, y, (z0 + z1) / 2));
  if(gap){ col(x - .2, z0, x + .2, gap[0], h); col(x - .2, gap[1], x + .2, z1, h); deco(.25, .35, gap[1] - gap[0], M('#55595e'), x, 3.0, (gap[0] + gap[1]) / 2); }
  else col(x - .2, z0, x + .2, z1, h); }
function lightsGrid(x0, z0, x1, z1, y, step = 4){ const lm = basic(0xfffdf2); for(let x = x0 + step / 2; x < x1; x += step) for(let z = z0 + step / 2; z < z1; z += step){ const l = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .6), lm); l.rotation.x = Math.PI / 2; l.position.set(x, y - .02, z); S.add(l); } }
function ceiling(x0, z0, x1, z1, y){ const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), tiles(x1 - x0, z1 - z0)); p.rotation.x = Math.PI / 2; p.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); S.add(p); }
function floorP(x0, z0, x1, z1, m){ if(m === 'T') m = terr((x1 - x0) / 4, (z1 - z0) / 4); plane(x1 - x0, z1 - z0, m, (x0 + x1) / 2, .03, (z0 + z1) / 2); }
// interior wall along x at z with door/opening gaps [[a,b,h]], skin material per side
// m: material, or 'W' = block wainscot to 3.6 m + plain block above (textured per piece so blocks keep their size)
function piece(len, y0, y1, m, ax, c, s){ const parts = m === 'W' ? [[y0, Math.min(y1, 3.6), wain], [Math.max(y0, 3.6), y1, upperBlock]] : [[y0, y1, () => m]];
  for(const [a, b, f] of parts){ if(b - a < .01) continue; const mt = f === wain ? wain(len, a, b) : f(len); if(ax === 'x') deco(len, b - a, .25, mt, s, a + YO, c); else deco(.25, b - a, len, mt, c, a + YO, s); } }
function wallX(x0, x1, z, h, m, gaps = [], y1 = h){ let x = x0; for(const [a, b, gh] of [...gaps].sort((p, q) => p[0] - q[0])){ if(a > x){ piece(a - x, 0, h, m, 'x', z, (x + a) / 2); col(x, z - .15, a, z + .15, y1); } if(gh < h) piece(b - a, gh, h, m, 'x', z, (a + b) / 2); x = b; } if(x1 > x){ piece(x1 - x, 0, h, m, 'x', z, (x + x1) / 2); col(x, z - .15, x1, z + .15, y1); } }
function wallZ(z0, z1, x, h, m, gaps = []){ let z = z0; for(const [a, b, gh] of [...gaps].sort((p, q) => p[0] - q[0])){ if(a > z){ piece(a - z, 0, h, m, 'z', x, (z + a) / 2); col(x - .15, z, x + .15, a); } if(gh < h) piece(b - a, gh, h, m, 'z', x, (a + b) / 2); z = b; } if(z1 > z){ piece(z1 - z, 0, h, m, 'z', x, (z + z1) / 2); col(x - .15, z, x + .15, z1); } }
// classroom door: brown wood leaf, maroon steel frame, push bar, room number
function door(x, z, ry, num){ const g = new THREE.Group(); g.position.set(x, YO, z); g.rotation.y = ry; S.add(g); const add = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py + h / 2, pz); g.add(b); };
  add(1.0, 2.2, .06, M('#6a4a30'), 0, 0, .02); [-.56, .56].forEach(px => add(.1, 2.3, .14, maroon, px, 0, 0)); add(1.22, .1, .14, maroon, 0, 2.2, 0); add(.7, .05, .06, M('#b8a070'), 0, 1, .07); add(.18, .5, .02, glass, -.25, 1.4, .06);
  if(num){ const n = new THREE.Mesh(new THREE.PlaneGeometry(.4, .16), sign(num, { bg:'#fff', fg:'#222', size:60, w:128, h:50 })); n.position.set(.85, 1.8, .03); g.add(n); } }
function ledClock(x, y, z, ry){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g); const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .22, .05), M('#2a2c30')); g.add(b);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(.44, .15), sign('8:35', { bg:'#1a0a0e', fg:'#ff3a8a', size:90, w:256, h:90, font:'Courier New' })); f.position.z = .03; g.add(f); }
// built-in lockers flush with the wall (1st floor = maroon)
const lockers = (n, c = '#6a1b2a') => new THREE.MeshLambertMaterial({ map:tex('bwlock' + c, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.45)';
  for(let x = 0; x < w; x += 16) g.fillRect(x, 0, 1, h); g.fillRect(0, h / 2, w, 1); g.fillStyle = 'rgba(0,0,0,.35)'; for(let x = 4; x < w; x += 16) for(let k = 0; k < 4; k++){ g.fillRect(x, 6 + k * 3, 8, 1); g.fillRect(x, h / 2 + 6 + k * 3, 8, 1); }
  g.fillStyle = '#c9c9c9'; for(let x = 12; x < w; x += 16){ g.fillRect(x, h / 2 - 14, 2, 6); g.fillRect(x, h - 14, 2, 6); } }, 128, 64, [n, 1]), emissive:new THREE.Color(c).multiplyScalar(.45) });
function lamp(x, z){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .1, 4.2, 8), black); p.position.set(x, 2.1, z); S.add(p); const h = new THREE.Mesh(new THREE.CylinderGeometry(.22, .14, .5, 8), black); h.position.set(x, 4.4, z); S.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), basic(0xfff3cf)); b.position.set(x, 4.2, z); S.add(b); }

export function buildSchool(){
  // ===== footprint =====
  const WB = [-270, 100, -140, 128], WA = [-270, 172, -140, 200], CM = [-190, 128, -140, 172], GYM = [-322, 100, -272, 150], PAC = [-322, 152, -272, 200];
  // ===== wing A (south, solid) =====
  { const [x0, z0, x1, z1] = WA; box(x1 - x0 - .1, HW, z1 - z0 - .1, M('#8e3b2c'), (x0 + x1) / 2, 0, (z0 + z1) / 2);
    wingFacades(x0, z0, x1, z1, [['s'], ['e'], ['w'], ['n', x0, -190, 'c']]);
    vp(50, HW - HC, facade(7, [HC / HW, (HW - HC) / HW]), -165, (HC + HW) / 2, z0 - .03, Math.PI); // above the commons roof
    letters('BELLEVILLE WEST', 15, 1.1, x1 + .06, HW - 1.6, (z0 + z1) / 2, Math.PI / 2); letters('BELLEVILLE WEST', 15, 1.1, -160, HW - 1.6, z1 + .06, 0); }
  // ===== wing B (north) — ground floor playable =====
  { const [x0, z0, x1, z1] = WB; wingFacades(x0, z0, x1, z1, [['n'], ['e'], ['w'], ['s', x0, -190, 'c']]);
    vp(50, HW - HC, facade(7, [HC / HW, (HW - HC) / HW]), -165, (HC + HW) / 2, z1 + .03, 0);
    letters('BELLEVILLE WEST', 15, 1.1, -160, HW - 1.6, z0 - .06, Math.PI); letters('BELLEVILLE WEST', 15, 1.1, x1 + .06, HW - 1.6, (z0 + z1) / 2, Math.PI / 2);
    col(x0, z0 - .2, x1, z0 + .2); col(x0 - .2, z0, x0 + .2, z1); col(x1 - .2, z0, x1 + .2, z1); col(x0, z1 - .2, -190, z1 + .2);
    // 1st-floor hallway z 114..120 (author's photos): maroon VCT with white speckled bands, block wainscot walls, built-in maroon lockers,
    // brown wood doors in maroon frames, 2x2 drop ceiling, red LED clocks, Trustworthy/Caring/Fair banners
    plane(x1 - x0 - 4, 6, vct(x1 - x0 - 4, 6), (x0 + x1) / 2, .03, 117); ceiling(x0, 113.8, x1, 120.2, 3.6); lightsGrid(x0 + 2, 114, x1 - 2, 120, 3.6, 6);
    wallX(x0 + 2, x1 - 2, 114, 3.6, 'W', [[-185.5, -184.3, 2.3]]); wallX(x0 + 2, x1 - 2, 120, 3.6, 'W', [[-175, -165, 3.6], [-158, -155.6, 2.5]]);
    wallZ(114, 120, x0 + 2, 3.6, 'W'); wallZ(114, 120, x1 - 2, 3.6, 'W'); door(x1 - 2.2, 116.6, -Math.PI / 2); door(x1 - 2.2, 117.8, -Math.PI / 2); door(x0 + 2.2, 117.2, Math.PI / 2);
    for(let x = x0 + 3; x < x1 - 3; x += 12){ const a = x, b = x + 12, skip = ([p, q]) => b > p && a < q, rm = String(100 + ((x - x0) / 12 | 0) * 2);
      if(!skip([-207, -181])) door(x + 6, 114.15, 0, rm); else if(skip([-187, -183])) { /* lab door */ }
      [[x + 1, x + 5], [x + 7, x + 11]].forEach(([p, q]) => { if(skip([-187.5, -182]) && p < -182 && q > -187.5) return; vp(q - p, 2.05, lockers(q - p), (p + q) / 2, 1.08, 114.14, 0); deco(q - p, .08, .1, maroon, (p + q) / 2, 2.1, 114.15); });
      if(!skip([-176, -164]) && !skip([-158.5, -155])){ vp(10, 2.05, lockers(10), x + 6, 1.08, 119.86, Math.PI); deco(10, .08, .1, maroon, x + 6, 2.1, 119.85); } }
    [-185.6, -184.2].forEach(x => deco(.1, 2.3, .3, maroon, x, 0, 114)); deco(1.5, .1, .3, maroon, -184.9, 2.3, 114); vp(.4, .16, sign('118', { bg:'#fff', fg:'#222', size:60, w:128, h:50 }), -183.8, 1.8, 113.84, Math.PI);
    [[-250, 'TRUSTWORTHY'], [-226, 'CARING'], [-202, 'FAIR'], [-152, 'RESPECTFUL']].forEach(([x, t]) => { vp(4.4, .7, sign(t, { bg:'#7a1a2a', fg:'#fff', size:62, w:512, h:82, font:'Arial Black' }), x, 2.75, 119.85, Math.PI); deco(4.6, .1, .03, black, x, 2.36, 119.86); });
    for(let x = x0 + 14; x < x1 - 4; x += 36) ledClock(x, 3.05, 114.2, 0);
    // cross corridor to the commons (x -175..-165, z 120..128)
    floorP(-175, 120, -165, 128.4, terrB(10 / 6, 8.4 / 6)); ceiling(-175, 120, -165, 128.4, 3.6); wallZ(120, 128, -175, 3.6, 'W'); wallZ(120, 128, -165, 3.6, 'W');
    // computer lab (Mrs. Sparks) x -206..-182, z 100..114 — painted block, maroon accent wall at the front, projector screen, red chairs
    const L0 = -206, L1 = -182, paint = block(6, 1); floorP(L0, 100.2, L1, 113.9, M('#8e8a82')); ceiling(L0, 100.2, L1, 113.9, 3.4); lightsGrid(L0, 100.2, L1, 113.9, 3.4, 4);
    wallZ(100.2, 113.9, L0, 3.6, paint); wallZ(100.2, 113.9, L1, 3.6, paint); vp(13.6, 3.4, M('#5a1a22'), L0 + .14, 1.7, 107, Math.PI / 2);
    deco(.06, 2.2, 3.2, M('#f4f4f2'), L0 + .22, 1, 102.4); deco(.12, .12, 3.4, M('#ddd'), L0 + .24, 3.25, 102.4); ledClock(L0 + .18, 2.95, 110.5, Math.PI / 2);
    vp(24, 3.4, new THREE.MeshLambertMaterial({ map:tex('bwlabwin', (g, w, h) => { g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h); for(const x0 of [1.3, 3.9]){ g.fillStyle = '#cfe6f2'; g.fillRect(x0 * 32, 26, 58, 66); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x0 * 32, 26, 58, 66); g.beginPath(); g.moveTo(x0 * 32 + 29, 26); g.lineTo(x0 * 32 + 29, 92); g.stroke(); } }, 224, 109, [24 / 7, 1]) }), -194, 1.7, 100.25, 0);
    deco(.08, 1.3, 5, M('#f7f7f4'), L0 + .15, 1, 107); deco(.1, .08, 5.2, M('#999'), L0 + .2, .95, 107); // whiteboard
    vp(3, .7, sign('COMPUTER APPLICATIONS — MRS. SPARKS', { bg:'#1c3d6e', fg:'#fff', size:34, w:512, h:110 }), -194, 2.9, 113.75, Math.PI);
    box(1.6, .76, .8, M('#7a5a3a'), L0 + 3, 0, 107); // teacher desk
    const seats = [], screens = [];
    for(const cx of [-199, -193, -187]) for(const cz of [103.4, 107.4, 111.4]){ box(.9, .74, 2.6, M('#cfc6b4'), cx - .7, 0, cz);
      [-.6, .6].forEach(dz => { const pc = PR.crtMonitor(cx - .85, .74, cz + dz, Math.PI / 2); screens.push(pc.screen); PR.chair(cx + .1, 0, cz + dz, -Math.PI / 2, '#a8282e'); seats.push({ x:cx + .2, z:cz + dz }); }); }
    // ---- stairwell (x -164.6..-155.4, z 120..128): switchback flights, landings at half-storeys; serves floors 2 and 3
    { const SX0 = -164.6, SX1 = -155.4, rail = M('#5a5f66'), tread = M('#8a8f96');
      wallZ(120, 128, SX0, 12.4, 'W'); wallZ(120, 128, SX1, 12.4, 'W'); floorP(SX0, 120, SX1, 128, terrB(1.5, 1.3)); ceiling(SX0, 120, SX1, 128, 12.4);
      for(const fy of [0, 4.2]){ const mid = fy + 2.1, top = fy + 4.2;
        G.ramps.push({ x0:-162.5, z0:120.4, x1:-157.6, z1:123.7, axis:'x', ya:mid, yb:fy }); G.ramps.push({ x0:-162.5, z0:124.3, x1:-157.6, z1:127.6, axis:'x', ya:mid, yb:top });
        G.platforms.push({ x0:SX0, z0:120.2, x1:-162.5, z1:127.8, y:mid }); deco(2.1, .2, 7.6, tread, -163.55, mid - .2, 124);
        G.platforms.push({ x0:-157.6, z0:119.8, x1:SX1, z1:127.8, y:top }); deco(2.2, .2, 7.6, tread, -156.5, top - .2, 124);
        for(let i = 0; i < 12; i++){ const u = i / 12; deco(.42, .18, 3.3, tread, -157.8 - u * 4.7, fy + u * 2.1, 122.05); deco(.42, .18, 3.3, tread, -162.3 + u * 4.7, mid + u * 2.1, 125.95); }
        deco(4.9, .9, .06, rail, -160.05, mid + 1, 124); col(-162.5, 123.95, -157.6, 124.05, mid + 1); YO = 0; }
      const sg = vp(1.6, .3, sign('STAIRS', { bg:'#7a1a2a', fg:'#fff', size:60, w:256, h:48 }), -156.8, 2.7, 119.85, Math.PI); }
    // ---- floors 2 & 3 hallways: same build as floor 1, lockers blue (2nd) and green (3rd) per the author
    for(const [fy, lc, fl] of [[4.2, '#1f4a8a', 2], [8.4, '#2a6a3a', 3]]){ YO = fy; const lM = n => lockers(n, lc);
      G.platforms.push({ x0:x0 + 2, z0:114, x1:x1 - 2, z1:120, y:fy }); plane(x1 - x0 - 4, 6, vct(x1 - x0 - 4, 6), (x0 + x1) / 2, fy + .03, 117); deco(x1 - x0 - 4, .2, 6, M('#c9c7c0'), (x0 + x1) / 2, fy - .2, 117);
      ceiling(x0, 113.8, x1, 120.2, fy + 3.6); lightsGrid(x0 + 2, 114, x1 - 2, 120, fy + 3.6, 6);
      wallX(x0 + 2, x1 - 2, 114, 3.6, 'W'); wallX(x0 + 2, x1 - 2, 120, 3.6, 'W', [[-158, -155.6, 2.5]]); wallZ(114, 120, x0 + 2, 3.6, 'W'); wallZ(114, 120, x1 - 2, 3.6, 'W');
      for(let x = x0 + 3; x < x1 - 3; x += 12){ const a = x, b = x + 12, skip = ([p, q]) => b > p && a < q; door(x + 6, 114.15, 0, String(fl * 100 + ((x - x0) / 12 | 0) * 2));
        [[x + 1, x + 5], [x + 7, x + 11]].forEach(([p, q]) => { vp(q - p, 2.05, lM(q - p), (p + q) / 2, fy + 1.08, 114.14, 0); deco(q - p, .08, .1, M(lc), (p + q) / 2, fy + 2.1, 114.15); });
        if(!skip([-158.5, -155])){ vp(10, 2.05, lM(10), x + 6, fy + 1.08, 119.86, Math.PI); deco(10, .08, .1, M(lc), x + 6, fy + 2.1, 119.85); } }
      vp(4.4, .7, sign(fl === 2 ? 'SECOND FLOOR' : 'THIRD FLOOR', { bg:lc, fg:'#fff', size:56, w:512, h:82, font:'Arial Black' }), -200, fy + 2.75, 119.85, Math.PI);
      for(let x = x0 + 14; x < x1 - 4; x += 36) ledClock(x, fy + 3.05, 114.2, 0); }
    YO = 0;
    G.classroom = { seats, sparks:{ x:L0 + 3, z:105.6 }, jax:seats[4], chris:seats[17], door:{ x:-184.9, z:117 }, cam:[[-183.5, 3, 113], [-200, 1.2, 104]], screens };
    mapRect(L0, 100, L1, 114, '#b07a6a'); }
  // ===== commons (two storeys, glass front + back) =====
  { const [x0, z0, x1, z1] = CM; box(x1 - x0, .5, z1 - z0, M('#c9c7c0'), (x0 + x1) / 2, HC, (z0 + z1) / 2, { col:false }); deco(x1 - x0 + .6, .8, .6, cream, (x0 + x1) / 2, HC - .2, z1);
    curtainZ(x1, z0 + 4, z1 - 4, HC, [146, 154]); curtainZ(x0, z0 + 4, z1 - 4, HC);
    [[x1, z0 + 2], [x1, z1 - 2], [x0, z0 + 2], [x0, z1 - 2]].forEach(([x, z]) => { box(1, HC, 4, brickOnly(1, 3), x, 0, z); });
    floorP(x0, z0, x1, z1, terrB((x1 - x0) / 6, (z1 - z0) / 6)); plane(4, 9, M('#26272a'), x1 - 2.2, .05, 150); [146.6, 153.4].forEach(z => { const e = new THREE.Mesh(new THREE.PlaneGeometry(.5, .2), sign('EXIT', { bg:'#eee', fg:'#e02020', size:70, w:128, h:50 })); e.position.set(x1 - .3, 3.5, z); e.rotation.y = -Math.PI / 2; S.add(e); }); const em = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshLambertMaterial({ map:label('BW', { bg:'#6e1a26', fg:'#e9dcc0', size:150, w:256, h:256, font:'Georgia' }) }));
    em.rotation.x = -Math.PI / 2; em.position.set(-158, .05, 150); S.add(em);
    ceiling(x0, z0, x1, z1, HC - .05); lightsGrid(x0, z0, x1, z1, HC - .05, 6);
    wallX(x0, x1, z0 + .2, HC, 'W', [[-175, -165, 3.6]], HC); wallX(x0, x1, z1 - .2, HC, 'W', [], HC); ledClock(-158, 3.4, 128.45, 0);
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
  { let [x0, z0, x1, z1] = GYM; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, GH = 13;
    // shell: tan block outside, brick base, maroon band; door in the north wall (x -310..-306)
    const ext = (len, ax, c, s, gaps = []) => { let p = ax === 'x' ? x0 : z0; const end = ax === 'x' ? x1 : z1;
      for(const [a, b] of [...gaps, [end, end]]){ if(a > p){ const L = a - p, m = (a + p) / 2; if(ax === 'x'){ deco(L, GH, .4, tan(L / 6, 3), m, 0, c); col(p, c - .2, a, c + .2); } else { deco(.4, GH, L, tan(L / 6, 3), c, 0, m); col(c - .2, p, c + .2, a); } }
        if(b > a && ax === 'x') deco(b - a, GH - 2.6, .4, tan(1, 2), (a + b) / 2, 2.6, c); p = b; } };
    ext(0, 'x', z0, 0, [[-310, -306]]); ext(0, 'x', z1); ext(0, 'z', x0); ext(0, 'z', x1);
    deco(-310 - x0 + .25, 3, .1, brickOnly(4, 1), (x0 - .25 - 310) / 2, 0, z0 - .25); deco(x1 + .25 + 306, 3, .1, brickOnly(6, 1), (x1 + .25 - 306) / 2, 0, z0 - .25); deco(x1 - x0 + .5, 3, .1, brickOnly(10, 1), cx, 0, z1 + .25); deco(.1, 3, z1 - z0 + .5, brickOnly(10, 1), x0 - .25, 0, cz); deco(.1, 3, z1 - z0 + .5, brickOnly(10, 1), x1 + .25, 0, cz);
    [[cx, z0 - .3, x1 - x0 + .6, .1], [cx, z1 + .3, x1 - x0 + .6, .1], [x0 - .3, cz, .1, z1 - z0 + .6], [x1 + .3, cz, .1, z1 - z0 + .6]].forEach(([x, z, w, d]) => deco(w, 1.2, d, maroon, x, 10.6, z));
    plane(x1 - x0, z1 - z0, M('#c9c7c0'), cx, GH + .02, cz); deco(4.6, .3, 2, white, -308, 2.8, z0 - 1); // door canopy
    // inside (author's video): maple court, maroon centre logo + paint, maroon/grey bleachers both sides, grey block walls with a maroon band, banners, scoreboard
    plane(x1 - x0 - .4, z1 - z0 - .4, new THREE.MeshLambertMaterial({ map:tex('bwcourt', (g, w, h) => { g.fillStyle = '#d9b98a'; g.fillRect(0, 0, w, h); for(let y = 0; y < h; y += 3){ g.fillStyle = `rgba(120,80,40,${Math.random() * .12})`; g.fillRect(0, y, w, 2); }
      const X = m => w / 2 + m * 10, Z = m => h / 2 + m * 10; g.strokeStyle = '#2a2a2a'; g.lineWidth = 3; g.strokeRect(X(-7.5), Z(-14), 150, 280); g.beginPath(); g.moveTo(X(-7.5), Z(0)); g.lineTo(X(7.5), Z(0)); g.stroke();
      g.beginPath(); g.arc(X(0), Z(0), 18, 0, 7); g.stroke(); g.fillStyle = '#6e1a26'; [-1, 1].forEach(s => { g.fillRect(X(-2.45), s < 0 ? Z(-14) : Z(8.2), 49, 58); g.beginPath(); g.arc(X(0), Z(s * 8.2), 18, 0, 7); g.stroke(); });
      g.fillStyle = '#6e1a26'; g.font = 'bold 34px Georgia'; g.textAlign = 'center'; g.fillText('BW', X(0), Z(0) + 12); g.font = 'bold 14px Arial'; g.save(); g.translate(X(-6.6), Z(0)); g.rotate(-Math.PI / 2); g.fillText('MAROONS', 0, 0); g.restore(); }, 256, 512) }), cx, .03, cz);
    const gw = new THREE.MeshLambertMaterial({ map:tex('bwgymw', (g, w, h) => { g.fillStyle = '#6f6a62'; g.fillRect(0, 0, w, h); blockRows(g, w, 0, h, '#a9a7a2', .06, true); g.fillStyle = '#6e1a26'; g.fillRect(0, h * .55, w, h * .08); }, 128, 128, [6, 1]), emissive:0x2a2826 });
    vp(x1 - x0 - .5, GH, gw, cx, GH / 2, z0 + .22, 0); vp(x1 - x0 - .5, GH, gw, cx, GH / 2, z1 - .22, Math.PI); vp(z1 - z0 - .5, GH, gw, x0 + .22, GH / 2, cz, Math.PI / 2); vp(z1 - z0 - .5, GH, gw, x1 - .22, GH / 2, cz, -Math.PI / 2);
    const gc = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), basic(0x3a3c40)); gc.rotation.x = Math.PI / 2; gc.position.set(cx, GH - .1, cz); S.add(gc); lightsGrid(x0, z0, x1, z1, GH - .2, 7);
    [[x0 + 1, 1], [x1 - 1, -1]].forEach(([bx, s]) => { for(let r = 0; r < 8; r++){ box(1, .45, 34, r % 2 ? M('#6e1a26') : M('#7a1e2c'), bx + s * (7 - r), r * .45, cz, { col:false }); deco(1, .06, 34, M('#9aa0a6'), bx + s * (7 - r), r * .45 + .45, cz); } col(Math.min(bx, bx + s * 8), cz - 17, Math.max(bx, bx + s * 8), cz + 17, 4); });
    [[z0 + 3.4, 1], [z1 - 3.4, -1]].forEach(([hz, s]) => { deco(.2, 3.05, .2, M('#3a3a3a'), cx, 0, hz - s * 1); deco(1.8, 1.05, .05, glass, cx, 2.9, hz); const rim = new THREE.Mesh(new THREE.TorusGeometry(.23, .02, 6, 16), M('#e05a1a')); rim.rotation.x = Math.PI / 2; rim.position.set(cx, 3.05, hz + s * .3); S.add(rim); });
    vp(6, 2.4, sign(['HOME  42  GUEST  38', 'PERIOD 4   0:47'], { bg:'#111', fg:'#ff4a3a', size:46, w:512, h:200 }), cx, 8.5, z1 - .3, Math.PI);
    ['2003 REGIONAL CHAMPS', 'SOUTHWESTERN CONF.', 'MAROONS BASKETBALL', 'STATE QUALIFIERS'].forEach((t, i) => vp(3.2, 4.4, sign(['BELLEVILLE WEST', t], { bg:'#6e1a26', fg:'#fff', size:26, w:256, h:350 }), x0 + .3, 8.2, z0 + 9 + i * 10, Math.PI / 2));
    G.gym = { door:{ x:-308, z:z0 - 1.5 }, center:{ x:cx, z:cz } };
    letters('MAROONS', 14, 2.2, x1 + .2, 7.2, (z0 + z1) / 2, Math.PI / 2, '#6e1a26', '#cdbb98'); letters('MAROONS', 14, 2.2, (x0 + x1) / 2, 7.2, z0 - .2, Math.PI, '#6e1a26', '#cdbb98'); mapRect(x0, z0, x1, z1, '#b8a888');
    [x0, z0, x1, z1] = PAC; box(x1 - x0, 10, z1 - z0, brickOnly(12, 3), (x0 + x1) / 2, 0, (z0 + z1) / 2); box(20, 18, 24, tan(5, 4), -296, 0, 176); plane(20, 24, M('#c9c7c0'), -296, 18.02, 176);
    plane(x1 - x0, z1 - z0, M('#c9c7c0'), (x0 + x1) / 2, 10.02, (z0 + z1) / 2); letters('PERFORMING ARTS CENTER', 16, 1, x1 + .2, 8.4, (z0 + z1) / 2, Math.PI / 2, '#efe6cf', '#8e3b2c'); mapRect(x0, z0, x1, z1, '#a06050');
    box(2, 9, 48, M('#8e3b2c'), -271, 0, 150, { col:true }); } // link
  // ===== courtyard between the wings =====
  // (author's photo from a 3rd-floor window): concrete plaza, precast concrete picnic tables + benches, lamp posts
  { const conc = new THREE.MeshLambertMaterial({ map:tex('bwconc', (g, w, h) => { g.fillStyle = '#bdb8ae'; g.fillRect(0, 0, w, h); for(let i = 0; i < 800; i++){ g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); }, 64, 64, [20, 10]) }), pc = M('#a8a196');
    floorP(-266, 132, -192, 168, conc);
    [[-258, 138], [-244, 150], [-230, 140], [-216, 158], [-204, 146], [-250, 162], [-222, 150]].forEach(([x, z]) => { box(2.6, .78, 1.1, pc, x, 0, z); box(2.6, .45, .4, pc, x, 0, z - 1); box(2.6, .45, .4, pc, x, 0, z + 1); });
    [[-262, 131], [-236, 131], [-210, 131], [-262, 169], [-236, 169], [-210, 169]].forEach(([x, z]) => box(2.2, .45, .5, pc, x, 0, z));
    [[-248, 133], [-220, 167]].forEach(([x, z]) => lamp(x, z)); [[-240, 160], [-212, 138]].forEach(([x, z]) => tree(x, z, .9)); }
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
