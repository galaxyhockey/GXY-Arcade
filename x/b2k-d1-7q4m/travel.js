// Back in the 2000s: The Game — Draft #2 sets. Compact story-instance locations built OFF the Belleville map
// (the open world is NOT connected to them; missions cut to them with a card):
//   bowling alley (M07) · The Edge arcade, Chesterfield (M08) · airport hall + curb (Lambert AND San Antonio, M08) ·
//   airliner cabin (M08) · San Antonio River Walk (M08) · November 1987: Jacob's room, the house, the street, the water tower (M09)
// Also two small props in Chris's house: the family PC by the front door (S02) and a second phone (S07).
// Everything here is static and gets merged by the static bake. Anything a mission needs to change is created by the mission.
import { THREE, G, box, plane, mat, txMat, noise, label, makeCar } from './engine.js';
import * as PR from './props.js';
const S = G.scene;
const M = c => typeof c === 'string' ? mat(c) : c;
const deco = (w, h, d, m, x, y, z) => box(w, h, d, M(m), x, y, z, { col:false });
const solid = (w, h, d, m, x, y, z) => box(w, h, d, M(m), x, y, z);
const col = (x0, z0, x1, z1, y1 = 2) => { const c = { x0, x1, z0, z1, y0:0, y1 }; G.colliders.push(c); return c; };
const sign = (t, w, h, x, y, z, ry = 0, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:label(t, o) })); m.position.set(x, y, z); m.rotation.y = ry; S.add(m); return m; };
const glow = (w, h, c, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color:c })); m.position.set(x, y, z); m.rotation.y = ry; S.add(m); return m; };
const cylD = (r, h, m, x, y, z, seg = 10, rt) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt ?? r, r, h, seg), M(m)); me.position.set(x, y + h / 2, z); me.castShadow = true; S.add(me); return me; };
// a walled room: floor, four walls (with optional door gaps along each side), ceiling seen only from below
function room(x0, z0, x1, z1, h, fm, wm, gaps = {}, ceil = 0xdedbd2){ plane(x1 - x0, z1 - z0, fm, (x0 + x1) / 2, .03, (z0 + z1) / 2); wm = M(wm);
  const run = (a, b, fixed, ax, gs = []) => { let p = a; for(const [ga, gb] of [...gs, [b, b]]){ if(ga > p){ const L = ga - p, m = (ga + p) / 2; if(ax === 'x') solid(L, h, .3, wm, m, 0, fixed); else solid(.3, h, L, wm, fixed, 0, m); } p = gb; } };
  run(x0, x1, z0, 'x', gaps.n); run(x0, x1, z1, 'x', gaps.s); run(z0, z1, x0, 'z', gaps.w); run(z0, z1, x1, 'z', gaps.e);
  if(ceil != null){ const c = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ color:ceil })); c.rotation.x = Math.PI / 2; c.position.set((x0 + x1) / 2, h, (z0 + z1) / 2); S.add(c); } }
const lights = (x0, z0, x1, z1, y, n = 3) => { for(let i = 0; i < n; i++) for(let k = 0; k < 2; k++){ const l = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .5), new THREE.MeshBasicMaterial({ color:0xfffbe8 })); l.rotation.x = Math.PI / 2; l.position.set(x0 + (x1 - x0) * (i + .5) / n, y - .03, z0 + (z1 - z0) * (k + .5) / 2); S.add(l); } };
const seat = (x, z, ry, c = '#3a4a6a') => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); const a = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(m)); b.position.set(px, py + h / 2, pz); g.add(b); }; a(.5, .1, .5, c, 0, .42, 0); a(.5, .55, .08, c, 0, .5, -.24); a(.06, .42, .06, '#8a8f96', -.2, 0, 0); a(.06, .42, .06, '#8a8f96', .2, 0, 0); return g; };

export function buildTravel(){ const T = G.T = {};
  const carpet = (k, c) => txMat(k, (g, w, h) => noise(g, w, h, c, .16, 2600), [8, 6]);
  const wood = txMat('tvwood', (g, w, h) => { noise(g, w, h, '#c9a264', .1); g.strokeStyle = '#a07c44'; for(let x = 0; x < w; x += 10){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } }, [1, 4]);

  // ---------- bowling alley (x 380..404, z -412..-388). Lanes run north (-z); pins at z -410.6 ----------
  { const x0 = 380, x1 = 404, z0 = -412, z1 = -388; room(x0, z0, x1, z1, 4.6, carpet('tvbowlc', '#3a2a5a'), '#2a2440', {}, 0x1a1830); lights(x0, z0, x1, z1, 4.6, 3);
    [384, 387.4, 390.8, 394.2, 397.6].forEach((lx, i) => { plane(1.5, 13, wood, lx, .05, -404.5); deco(.3, .12, 13, '#1c1c22', lx - .95, 0, -404.5); deco(.3, .12, 13, '#1c1c22', lx + .95, 0, -404.5);
      for(let r = 0, n = 0; r < 4; r++) for(let k = 0; k <= r; k++, n++) cylD(.06, .38, '#f4f2ea', lx + (k - r / 2) * .28, .05, -409.9 - r * .24, 8, .045);
      deco(1.9, 1.4, .2, '#141420', lx, 1.5, -411.3); sign(String(i + 1), .5, .5, lx, 2.3, -411.15, 0, { bg:'#141420', fg:'#ff5ad0', size:90, w:128, h:128 }); col(lx - 1.1, -411.4, lx + 1.1, -398.2, 1); });
    deco(22, .5, .5, '#ff3ab0', 392, 3.2, -411.4); sign('BOWLING', 9, 1.5, 392, 3.9, -411.6, 0, { bg:'#1a1830', fg:'#5af0ff', size:96, w:512, h:96, font:'Arial Black' });
    [385.7, 392.5, 399.3].forEach(bx => { solid(.7, .7, 2.2, '#5a2a6a', bx, 0, -396.6); [0, .5, 1].forEach((k, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), M(['#c8202a', '#2a5ac8', '#2aa84a'][i])); b.position.set(bx, .86, -397.3 + k * .6); S.add(b); }); });
    [[384, -393], [388, -393], [395, -393], [399, -393]].forEach(([x, z]) => { solid(2.6, .45, .7, '#7a3a8a', x, 0, z); deco(2.6, .6, .14, '#7a3a8a', x, .45, z + .3); });
    solid(7, 1.05, 1, '#3a2a1a', 400, 0, -389.4); sign(['SHOE RENTAL  $2', 'GAMES  $2.75'], 3, .8, 400, 2.4, -388.2, Math.PI, { bg:'#141420', fg:'#ffd23f', size:38, w:384, h:110 });
    glow(.5, 3.4, 0x5af0ff, x0 + .2, 2.2, -400, Math.PI / 2); glow(.5, 3.4, 0xff3ab0, x1 - .2, 2.2, -400, -Math.PI / 2);
    T.bowl = { chris:{ x:390.2, z:-395.2 }, sam:{ x:391.6, z:-395 }, lane:{ x:390.8, z:-398.4 }, cam:[[387.2, 2, -392.6], [391, 1.2, -396.6]], wide:[[390.8, 3.6, -391.4], [390.8, .6, -404]] }; }

  // ---------- The Edge arcade, Chesterfield (x 440..458, z -410..-396) ----------
  { const x0 = 440, x1 = 458, z0 = -410, z1 = -396; room(x0, z0, x1, z1, 4, carpet('tvedgec', '#1c2a4a'), '#161a2a', { s:[[448, 450]] }, 0x10121c); lights(x0, z0, x1, z1, 4, 2);
    sign('THE EDGE', 6, 1.3, 449, 3.1, z0 + .2, 0, { bg:'#10121c', fg:'#39ff8a', size:96, w:512, h:110, font:'Arial Black', italic:true });
    const cab = (x, z, ry, c, s) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g); const a = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(m)); b.position.set(px, py + h / 2, pz); g.add(b); return b; };
      a(.8, 1.9, .8, c, 0, 0, 0); a(.82, .35, .82, '#111', 0, 1.9, 0); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.6, .5), new THREE.MeshBasicMaterial({ color:s })); sc.position.set(0, 1.35, .41); g.add(sc); a(.7, .08, .3, '#222', 0, .95, .5); };
    ['#c8202a', '#2a5ac8', '#d8a020', '#7a3a9a', '#2aa84a', '#c8202a'].forEach((c, i) => { cab(441 + i * 1.5 + (i > 2 ? 2 : 0), z0 + .8, 0, c, [0x5af0ff, 0xffd23f, 0xff5ad0][i % 3]); });
    [0, 1, 2, 3].forEach(i => cab(x1 - .8, -407.5 + i * 2.4, -Math.PI / 2, ['#2a5ac8', '#d8a020', '#2aa84a', '#7a3a9a'][i], [0xffd23f, 0x5af0ff, 0xff5ad0, 0x39ff8a][i])); col(440.3, z0, 451.6, z0 + 1.3); col(x1 - 1.3, -408.2, x1, -399.5);
    // basketball machine (west wall) and air-hockey table (middle)
    solid(1.4, 1, 2.6, '#c8202a', 441.2, 0, -402); deco(1.3, 1.6, .1, '#e8e8e8', 441.2, 1.9, -403.25); const rim = new THREE.Mesh(new THREE.TorusGeometry(.2, .025, 6, 14), M('#e05a1a')); rim.rotation.x = Math.PI / 2; rim.position.set(441.2, 2.2, -402.95); S.add(rim);
    sign('HOOPS', 1.2, .4, 441.2, 3.1, -403.2, 0, { bg:'#c8202a', fg:'#fff', size:60, w:256, h:84, font:'Arial Black' });
    solid(1.5, .85, 2.8, '#1f4a8a', 449.5, 0, -402.5); deco(1.3, .03, 2.6, '#eef4ff', 449.5, .85, -402.5); deco(1.5, .12, .08, '#c8202a', 449.5, .85, -403.9); deco(1.5, .12, .08, '#c8202a', 449.5, .85, -401.1);
    solid(3, 1, 1, '#3a2a1a', 454.5, 0, -397.2); sign(['TOKENS', '4 FOR $1'], 1.4, .7, 454.5, 2.2, z1 - .2, Math.PI, { bg:'#10121c', fg:'#ffd23f', size:44, w:256, h:128 });
    T.edge = { spawn:{ x:449, z:-398 }, hoops:{ x:442.6, z:-401.4 }, hockey:{ x:451, z:-402.5 }, exit:{ x:449, z:-396.6 }, cam:[[455, 2.6, -398], [447, 1.2, -403]] }; }

  // ---------- airport: departures hall (x 500..560, z -410..-394) + curb to the west. Used for Lambert and for San Antonio ----------
  { const x0 = 500, x1 = 560, z0 = -410, z1 = -394, tile = txMat('tvairt', (g, w, h) => { g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b9b5a8'; g.strokeRect(0, 0, w, h); noise(g, w, h, 'rgba(0,0,0,0)', .04, 300); }, [30, 8]);
    room(x0, z0, x1, z1, 5.4, tile, '#cfd3d8', { w:[[-404, -400]], e:[[-403.2, -400.8]] }, 0xe6e8ea); lights(x0, z0, x1, z1, 5.4, 6);
    // ticket counter (north wall, x 510..522)
    solid(12, 1.1, 1.1, '#3a4a6a', 516, 0, -408.4); deco(12, .06, 1.2, '#c9ccd0', 516, 1.1, -408.4); sign('TICKETS  ·  CHECK-IN', 9, .9, 516, 3.6, z0 + .2, 0, { bg:'#1c3d6e', fg:'#fff', size:60, w:640, h:72 });
    [512, 516, 520].forEach(x => { deco(.5, .4, .4, '#2a2a2e', x, 1.16, -408.6); glow(.36, .26, 0x2a5aa8, x, 1.4, -408.38); });
    [[511, -405.6], [515, -405.6], [519, -405.6]].forEach(([x, z]) => { cylD(.05, 1, '#9a9a9a', x, 0, z, 6); cylD(.05, 1, '#9a9a9a', x + 2, 0, z, 6); deco(2, .05, .04, '#1c3d6e', x + 1, .92, z); });
    // security wall (x 530) with one lane, metal detector frame
    solid(.3, 5.4, 5.6, '#cfd3d8', 530, 0, -407.2); solid(.3, 5.4, 5.6, '#cfd3d8', 530, 0, -396.8); deco(.3, 3, 4.8, '#cfd3d8', 530, 2.4, -402);
    [-403.3, -400.7].forEach(z => deco(.25, 2.3, .12, '#6a6f78', 532, 0, z)); deco(.25, .12, 2.7, '#6a6f78', 532, 2.3, -402); solid(3, .8, .9, '#8a8f96', 533, 0, -405.2); deco(.9, .9, 1, '#5a5f66', 533, .8, -405.2);
    sign('SECURITY CHECKPOINT', 5, .6, 529.8, 3.6, -402, -Math.PI / 2, { bg:'#7a1a1a', fg:'#fff', size:44, w:512, h:60 }); sign('GATES  ➜', 3, .6, 506, 3.6, z0 + .2, 0, { bg:'#1c3d6e', fg:'#ffd23f', size:48, w:300, h:60 });
    // gate area: seats, window wall, jet-bridge door
    for(let r = 0; r < 3; r++) for(let k = 0; k < 6; k++){ seat(540 + k * .62, -398.4 - r * 2.4, r === 0 ? Math.PI : 0, '#2a3a5a'); } col(539.6, -403.6, 543.6, -402.9, .9); col(539.6, -401.2, 543.6, -400.5, .9); col(539.6, -398.8, 543.6, -398.1, .9);
    for(let r = 0; r < 2; r++) for(let k = 0; k < 6; k++) seat(549 + k * .62, -398.4 - r * 2.4, r === 0 ? Math.PI : 0, '#2a3a5a'); col(548.6, -401.2, 552.6, -400.5, .9); col(548.6, -398.8, 552.6, -398.1, .9);
    glow(24, 2.6, 0x9fc6e6, 546, 2.6, z1 - .18, Math.PI); for(let x = 534; x <= 558; x += 3) deco(.12, 2.8, .1, '#eee', x, 1.2, z1 - .2);
    solid(2.6, 1.1, .9, '#3a4a6a', 556.4, 0, -405.4); sign('GATE C10', 2.2, .6, 559.8, 3.2, -402, -Math.PI / 2, { bg:'#1c3d6e', fg:'#fff', size:56, w:300, h:80 }); deco(.1, 2.4, 2.4, '#4a5560', x1 + .05, 0, -402);
    // curb outside (west): roadway, shelter
    plane(10, 22, M('#46484c'), 494, .02, -402); plane(3, 22, M('#c9c3b5'), 498.4, .04, -402); deco(4, .25, 10, '#e8e8e8', 498, 4.2, -402); [-406.5, -397.5].forEach(z => cylD(.12, 4.2, '#bbb', 496.4, 0, z, 8));
    sign('DEPARTURES', 4.2, .7, 499.8, 4.6, -402, -Math.PI / 2, { bg:'#1c3d6e', fg:'#fff', size:60, w:420, h:70 }); col(488.8, -413, 489.2, -391); col(489, -413.2, 500, -412.8); col(489, -391.2, 500, -390.8);
    T.air = { in:{ x:503, z:-402 }, hall:{ x:508, z:-402 }, counter:{ x:516, z:-406.6 }, agent:{ x:516, z:-409.4 }, tsa:{ x:532, z:-402 }, gate:{ x:546, z:-404.6 }, board:[540, 3.2, z0 + .2], door:{ x:558.8, z:-402 }, curb:{ x:497.4, z:-402 }, taxi:{ x:493.6, z:-402 },
      seats:[[540, -398.4], [540.62, -398.4], [541.24, -398.4], [541.86, -398.4], [542.48, -398.4]] }; }

  // ---------- airliner cabin (x 600..604, z -421..-401). Nose is north (-z). 3 + 3 seats ----------
  { const x0 = 600, x1 = 604, z0 = -421, z1 = -401; room(x0, z0, x1, z1, 2.25, carpet('tvplanec', '#2a3a5a'), '#e4e6ea', {}, 0xf2f3f5);
    const rows = []; for(let r = 0; r < 12; r++){ const z = -419.2 + r * 1.45; rows.push(z); [.5, 1.05, 1.6, 2.4, 2.95, 3.5].forEach(dx => seat(x0 + dx, z, Math.PI, '#34507a')); glow(.34, .26, 0xbfe4ff, x0 + .17, 1.25, z, Math.PI / 2); glow(.34, .26, 0xbfe4ff, x1 - .17, 1.25, z, -Math.PI / 2); }
    deco(1.4, .3, 20, '#d4d7dc', x0 + .85, 1.85, -411); deco(1.4, .3, 20, '#d4d7dc', x1 - .85, 1.85, -411); for(let z = -420; z < -401; z += 2.2){ const l = new THREE.Mesh(new THREE.PlaneGeometry(.5, .9), new THREE.MeshBasicMaterial({ color:0xfffbe8 })); l.rotation.x = Math.PI / 2; l.position.set(602, 2.2, z); S.add(l); }
    T.plane = { rows, win:x0 + .5, mid:x0 + 1.05, aisle:x0 + 1.6, aisleX:x0 + 2, r:5 }; }

  // ---------- San Antonio River Walk (x 660..740). River z -403..-397, walks either side, patio restaurant on the south bank ----------
  { const stone = txMat('tvstone', (g, w, h) => { noise(g, w, h, '#c9b48e', .14, 1600); g.strokeStyle = 'rgba(90,70,40,.5)'; for(let y = 0; y < h; y += 16) for(let x = (y / 16 % 2) * 16; x < w; x += 32) g.strokeRect(x, y, 32, 16); }, [30, 4]);
    const flag = txMat('tvflag', (g, w, h) => { noise(g, w, h, '#b9a888', .12, 1200); g.strokeStyle = 'rgba(70,60,40,.45)'; g.strokeRect(0, 0, w, h); g.strokeRect(0, 0, w / 2, h / 2); }, [40, 4]);
    plane(84, 30, M('#5a7a4a'), 700, .015, -400); plane(80, 6, new THREE.MeshLambertMaterial({ color:0x2f6a5a, emissive:0x0a2a22 }), 700, .09, -400); plane(80, 6, flag, 700, .05, -406); plane(80, 6, flag, 700, .05, -394);
    [[660, 683.4], [686.6, 718.4], [721.6, 740]].forEach(([a, b]) => { solid(b - a, .35, .4, stone, (a + b) / 2, 0, -403); solid(b - a, .35, .4, stone, (a + b) / 2, 0, -397); col(a, -403, b, -397, 3); });
    [685, 720].forEach(bx => { deco(3.2, .25, 6.4, stone, bx, 0, -400); [-1.5, 1.5].forEach(dx => { solid(.2, .9, 6.4, stone, bx + dx, .1, -400); }); const arch = new THREE.Mesh(new THREE.TorusGeometry(2.9, .18, 6, 14, Math.PI), M('#b9a27a')); arch.position.set(bx - 1.6, .1, -400); arch.rotation.y = Math.PI / 2; arch.scale.y = .3; S.add(arch); });
    // building fronts both banks (x 660..740) + back walls so nobody leaves
    const cols = ['#d8b890', '#c98a6a', '#e0d0a8', '#b87a5a', '#d4c4a0', '#c9a27a', '#e6d8b8'];
    [[-410.4, 0], [-389.6, Math.PI]].forEach(([z, ry], s) => { for(let i = 0; i < 8; i++){ const x = 665 + i * 10, h = 7 + (i * 3 + s * 2) % 4 * 1.5; solid(9.6, h, 1.6, cols[(i + s * 3) % 7], x, 0, z);
        for(let f = 0; f < Math.floor(h / 3); f++) [-2.6, 0, 2.6].forEach(dx => glow(1.3, 1.5, f === 0 ? 0x3a3020 : 0x6f8aa0, x + dx, 1.9 + f * 2.9, z + (s ? -.82 : .82), ry));
        if((i + s) % 2 === 0){ const aw = new THREE.Mesh(new THREE.BoxGeometry(6, .12, 1.6), M(['#a8282e', '#1f6a5a', '#d8a020'][i % 3])); aw.position.set(x, 2.9, z + (s ? -1.5 : 1.5)); aw.rotation.x = s ? -.35 : .35; S.add(aw); } } });
    col(659.6, -412, 660, -388); col(740, -412, 740.4, -388); solid(2, 13, 26, '#b87a5a', 742.4, 0, -400); solid(2, 13, 26, '#c9a27a', 656.6, 0, -400); [-3.5, 3.5].forEach(dz => { glow(1.4, 1.6, 0x6f8aa0, 741.36, 5, -400 + dz, -Math.PI / 2); glow(1.4, 1.6, 0x6f8aa0, 741.36, 8.4, -400 + dz, -Math.PI / 2); });
    [[668, -407.6], [690, -407.8], [712, -407.6], [733, -407.8], [676, -392.4], [728, -392.2]].forEach(([x, z]) => { cylD(.22, 4.6, '#6a5238', x, 0, z, 7, .16); const c = new THREE.Mesh(new THREE.ConeGeometry(1.5, 5.5, 8), M('#3d6a3e')); c.position.set(x, 6.6, z); c.castShadow = true; S.add(c); col(x - .3, z - .3, x + .3, z + .3); });
    // patio restaurant (south bank, x 694..708): tables with umbrellas; the gang's table is the big one at x 700
    sign(['CASA DEL RÍO', 'RESTAURANT  ·  PATIO'], 5, 1, 700, 3.7, -390.3, Math.PI, { bg:'#7a2a1a', fg:'#f6e6c0', size:44, w:512, h:110, font:'Georgia' });
    [[695, -393.6, '#a8282e'], [705.2, -393.6, '#1f6a5a'], [710.4, -393.4, '#d8a020']].forEach(([x, z, c]) => { cylD(.6, .05, '#e8e4da', x, .74, z, 14); cylD(.05, 2.3, '#8a8f96', x, 0, z, 6); const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, .6, 8), M(c)); u.position.set(x, 2.5, z); S.add(u); [[-.9, 0], [.9, 0]].forEach(([dx]) => seat(x + dx, z, dx > 0 ? -Math.PI / 2 : Math.PI / 2, '#5a3a2a')); col(x - .6, z - .6, x + .6, z + .6, .8); });
    solid(2.6, .76, 1.3, '#7a5a3a', 700, 0, -393.4); deco(2.7, .04, 1.4, '#f2efe6', 700, .76, -393.4); cylD(.05, 2.5, '#8a8f96', 700, .76, -393.4, 6); { const u = new THREE.Mesh(new THREE.ConeGeometry(2.2, .7, 8), M('#a8282e')); u.position.set(700, 3.3, -393.4); S.add(u); }
    const tb = [[698.9, -392.4, Math.PI], [701.1, -392.4, Math.PI], [698.9, -394.4, 0], [701.1, -394.4, 0], [697.9, -393.4, Math.PI / 2]]; tb.forEach(([x, z, ry]) => seat(x, z, ry, '#5a3a2a'));
    // street stub + taxi stand at the west end
    plane(8, 12, M('#46484c'), 664.5, .06, -393); sign('RIVER WALK', 3.4, .8, 669.4, 2.6, -391, Math.PI, { bg:'#1f4a3a', fg:'#f6e6c0', size:60, w:420, h:96, font:'Georgia' }); cylD(.07, 2.2, '#3a3a3a', 669.4, 0, -390.6, 6);
    T.river = { taxi:{ x:664, z:-393.4 }, drop:{ x:667.6, z:-394 }, table:{ x:700, z:-393.4 }, seats:tb, edge:{ x:703.6, z:-396.4 }, water:{ x:703.6, z:-400 }, cop:{ x:712, z:-395 }, cam:[[703.4, 2.5, -397.4], [699.6, 1, -393.2]] }; }

  // ---------- November 1987 (x 800..850): Jacob's room · the house with a porch roof · the street · the water tower ----------
  { room(800, -396, 807, -390, 2.7, carpet('tv87c', '#7a5a3a'), '#d8cfa8', {}, 0xe8e2cc); PR.bed(805.6, 0, -394.4, 0); solid(1.6, .8, .7, '#7a5a3a', 801.3, 0, -395.4); glow(1.3, 1.2, 0x1a2a4a, 803.5, 1.7, -395.82);
    [['#c83a3a', 801.2], ['#2a4a8a', 802.4]].forEach(([c, x]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.1), M(c)); p.position.set(x, 1.8, -390.2); p.rotation.y = Math.PI; S.add(p); }); deco(.5, .2, .3, '#2a2a2a', 801.3, .8, -395.4);
    T.y87 = { room:{ j:[803.2, -392.6], e:[804.4, -393.4], em:[802.6, -393.8], l:[805, -392.2], cam:[[801.2, 1.9, -391], [804, 1.2, -393.4]] } };
    // the house (x 812..822, z -416..-408), porch roof on the south side, upstairs window above it
    plane(60, 44, M('#3f6a34'), 826, .012, -402); solid(10, 6.4, 8, '#b9c4cc', 817, 0, -412); { const r = new THREE.Mesh(new THREE.ConeGeometry(7.4, 2.6, 4), M('#4a3a34')); r.rotation.y = Math.PI / 4; r.scale.z = .82; r.position.set(817, 7.7, -412); S.add(r); }
    deco(6, .2, 2.6, '#4a3a34', 817, 2.9, -406.7); [814.3, 819.7].forEach(x => cylD(.1, 2.9, '#f2efe6', x, 0, -405.6, 6)); glow(1.3, 1.5, 0xffe9a8, 817, 4.6, -407.96, 0); glow(1, 2.1, 0x5a3a2a, 817, 1.15, -407.96, 0); glow(1.2, 1.3, 0x2a3040, 814.2, 1.6, -407.96, 0); glow(1.2, 1.3, 0x2a3040, 819.8, 1.6, -407.96, 0);
    // street east to the tower
    plane(50, 5, M('#3a3c40'), 828, .03, -398.5); plane(50, 2, M('#b9b3a4'), 828, .04, -402.2); [808, 822, 836].forEach(x => { cylD(.08, 4.4, '#3a3a3a', x, 0, -403.6, 6); glow(.5, .3, 0xffe9a8, x, 4.3, -403.4, 0); });
    // water tower (x 844, z -406): four legs, tank, catwalk the kids stand on
    const tx = 844, tz = -406; [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]].forEach(([dx, dz]) => { const l = cylD(.16, 12, '#8a9098', tx + dx, 0, tz + dz, 6); l.rotation.set(dz * .03, 0, -dx * .03); });
    cylD(3.6, 4.2, '#c9d2d8', tx, 12, tz, 18); { const cap = new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.4, 18), M('#aab4bc')); cap.position.set(tx, 16.9, tz); S.add(cap); } cylD(4.4, .12, '#6a7078', tx, 11.9, tz, 18);
    for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; cylD(.03, .95, '#6a7078', tx + Math.cos(a) * 4.35, 12, tz + Math.sin(a) * 4.35, 4); } { const rail = new THREE.Mesh(new THREE.TorusGeometry(4.35, .03, 4, 24), M('#6a7078')); rail.rotation.x = Math.PI / 2; rail.position.set(tx, 12.95, tz); S.add(rail); }
    deco(.5, 12, .08, '#6a7078', tx, 0, tz + 4.3); col(tx - 2.6, tz - 2.6, tx + 2.6, tz + 2.6, 3);
    Object.assign(T.y87, { roof:[[816, 3.02, -406.9], [817.1, 3.02, -406.6], [818, 3.02, -407.1], [815.2, 3.02, -406.5]], yard:[[815.6, -403.6], [817, -403.2], [818.2, -403.8], [814.6, -403.2]], street:[836, -402.2], tower:{ x:tx, z:tz, y:12.02, r:4 }, houseCam:[[820.5, 2.2, -399.6], [816.8, 3.6, -407]], towerCam:[[836, 6, -396], [tx, 12.6, tz]] }); }

  // ---------- Chris's house: family PC by the front door (S02), cordless on the coffee table (S07) ----------
  solid(1.5, .76, .7, '#8a6a4a', 2.4, 0, 3.45); PR.crtMonitor(2.4, .76, 3.5, Math.PI); PR.chair(2.4, 0, 2.55, 0, '#5a4a3a'); deco(.5, .14, .4, '#d8d4c8', 3, .76, 3.45);
  G.famPC = { x:2.4, z:2.2, look:[2.4, 1.02, 3.5] };
  deco(.1, .2, .22, '#2a2a2e', -5.1, .48, 0); deco(.2, .05, .26, '#3a3a40', -5.1, .48, 0); G.phone2 = { x:-5.1, z:1.1 };
  void makeCar; }
