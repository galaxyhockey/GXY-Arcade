// Back in the 2000s: The Game — Jax's house (M05 "Hair of the Dog"). One-storey house on the corner of Oakmont and Maple.
// Footprint x 110..126, z 37..49, front door faces north (Oakmont). Living room (NW), kitchen (NE), bedroom (SW), closet, back hall.
// Also: the basement set (a sealed room off the map, flashback only) and the M05 continuity props:
//   street props (traffic signal at Maple + N Illinois, stop sign on Jax's corner) and their "morning after" twins
//   (signal in the living room, upside-down stop sign in the backyard, store shelf in the front yard, beer can, closet mouse).
// G.m05World(after) swaps between the two sets. Everything in G.m05Keep stays out of the static bake.
import { THREE, G, box, plane, mat, txMat, noise, label, mapRect } from './engine.js';
import * as PR from './props.js';
import { wallX, wallZ, setSiding } from './chrishouse.js';
import { sidingM } from './buildings.js';
const S = G.scene, H = 3, paint = mat('#e6dfcf'), trim = mat('#ffffff'), wood = mat('#a87844');
const deco = (w, h, d, m, x, y, z) => box(w, h, d, typeof m === 'string' ? mat(m) : m, x, y, z, { col:false });
const col = (x0, z0, x1, z1, y1 = 1) => { const c = { x0, x1, z0, z1, y0:0, y1 }; G.colliders.push(c); return c; };
const grp = (x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); S.add(g); return g; };
const part = (g, geo, m, x, y, z) => { const me = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };

function signalHead(g){ part(g, new THREE.BoxGeometry(.46, 1.3, .42), '#c9a21a', 0, 0, 0); [['#e8281e', .4], ['#f2c21a', 0], ['#2ac84a', -.4]].forEach(([c, y]) => { const l = part(g, new THREE.CircleGeometry(.14, 14), new THREE.MeshBasicMaterial({ color:c }), 0, y, .215); l.castShadow = false; part(g, new THREE.BoxGeometry(.34, .04, .2), '#8a700f', 0, y + .17, .3); }); return g; }
function stopSign(g, flip){ part(g, new THREE.CylinderGeometry(.04, .04, 2.3, 6), '#8a8f96', 0, 1.15, 0); const face = new THREE.MeshBasicMaterial({ map:label(['STOP'], { bg:'#c8141e', fg:'#ffffff', size:92, w:256, h:256 }) });
  const o = part(g, new THREE.CylinderGeometry(.42, .42, .03, 8), [mat('#d8d8d8'), face, mat('#b8b8b8')], 0, 2.2, 0); o.rotation.set(Math.PI / 2, Math.PI * 5 / 8, 0); if(flip) g.rotation.z = Math.PI; return g; }

export function buildJaxHouse(){ const J = G.jax = { door:{ x:117.9, z:35.6 }, in:{ x:117.9, z:38.4 }, bedFloor:{ x:114.6, z:46.4 }, bed:{ x:112, z:47.5 }, sofa:{ x:115.2, z:40.5 }, tv:{ x:111.6, z:40.5 }, lightSpot:{ x:112.6, z:39 },
    cereal:{ x:124.6, z:39.2 }, bowlAt:{ x:124.6, z:41.2 }, fridge:{ x:124.4, z:38.4 }, seat:{ x:122, z:40.05 }, jseat:{ x:122, z:41.95 }, phone:{ x:119.9, z:38.2 }, clock:[122, 2.1, 43.8], closet:{ x:119.9, z:46.2 }, mouse:{ x:119.6, z:48 },
    sign:{ x:115, z:55 }, can:{ x:122.5, z:57.2 }, shelf:{ x:112.4, z:33.4 }, back:{ x:123.6, z:50.4 }, base:{ x:304, z:-96.5 }, bfridge:{ x:306.4, z:-96.5 }, corner:{ x:107.2, z:31.2 }, signal:{ x:106.6, z:249.4 }, drive:{ x:128.6, z:33.5 } };
  // ---------- shell ----------
  setSiding(sidingM('#8ea4b4', [6, 2]));
  wallX(110, 126, 37, 0, H, -1, [{ a:112, b:114.4, lo:.9, hi:2.3, shutter:'#2c3a2c' }, { a:117.2, b:118.6, lo:0, hi:2.25, door:true }, { a:121.5, b:123.5, lo:.9, hi:2.3, shutter:'#2c3a2c' }]);
  wallX(110, 126, 49, 0, H, 1, [{ a:112.2, b:114, lo:.9, hi:2.3 }, { a:123, b:124.2, lo:0, hi:2.25, door:true }]);
  wallZ(37, 49, 110, 0, H, -1, [{ a:45.6, b:47.2, lo:.9, hi:2.3 }]); wallZ(37, 49, 126, 0, H, 1, [{ a:39.4, b:41, lo:1.2, hi:2.3 }]);
  setSiding(null);
  const ip = (x0, z0, x1, z1, y = 0, h = H) => box(Math.max(.15, x1 - x0), h, Math.max(.15, z1 - z0), paint, (x0 + x1) / 2, y, (z0 + z1) / 2);
  ip(119, 37, 119, 39); ip(119, 42, 119, 44); ip(119, 39, 119, 42, 2.25, .75);                                             // living | kitchen (wide archway)
  [[110, 115], [116.2, 119.4], [120.4, 123], [124.2, 126]].forEach(([a, b]) => ip(a, 44, b, 44)); [[115, 116.2], [119.4, 120.4], [123, 124.2]].forEach(([a, b]) => ip(a, 44, b, 44, 2.25, .75));
  ip(118, 44, 118, 49); ip(121, 44, 121, 49);
  // floors, ceiling, roof
  const carpet = txMat('jxcarp', (g, w, h) => noise(g, w, h, '#a8a888', .16, 2600), [5, 4]), vinyl = txMat('jxvin', (g, w, h) => { g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8b89a'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, [8, 8]);
  plane(9, 7, carpet, 114.5, .03, 40.5); plane(7, 7, vinyl, 122.5, .03, 40.5); plane(8, 5, carpet, 114, .03, 46.5); plane(8, 5, vinyl, 122, .03, 46.5);
  deco(16, .15, 12, new THREE.MeshBasicMaterial({ color:0xe9e5dc }), 118, H - .05, 43);
  { const rm = txMat('jxroof', (g, w, h) => { noise(g, w, h, '#3c4046', .25, 3000); for(let y = 0; y < h; y += 10){ g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y, w, 2); } }, [6, 3]), rh = 2.4, sh = new THREE.Shape(); sh.moveTo(-6, 0); sh.lineTo(6, 0); sh.lineTo(0, rh); sh.closePath();
    const gg = new THREE.ExtrudeGeometry(sh, { depth:16, bevelEnabled:false }); gg.translate(0, 0, -8); gg.rotateY(Math.PI / 2); const gm = new THREE.Mesh(gg, mat('#8ea4b4')); gm.position.set(118, H + .1, 43); gm.castShadow = true; S.add(gm);
    const ang = Math.atan2(rh, 6), len = Math.hypot(rh, 6) + .7; [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(17, .16, len), rm); r.position.set(118, H + .1 + rh / 2 + .02, 43 + s * 3.05); r.rotation.x = s * ang; r.castShadow = true; S.add(r); }); deco(17, .18, .3, '#2a2c30', 118, H + rh, 43); }
  mapRect(110, 37, 126, 49, '#9aa8b4'); plane(1.6, 6.4, mat('#b9b3a8'), 117.9, .035, 33.8); plane(3.4, 8, mat('#a8a39a'), 128.6, .035, 33); // front walk + driveway
  { const d = grp(117.2, 0, 37.1); d.rotation.y = Math.PI * .55; part(d, new THREE.BoxGeometry(1.35, 2.2, .07), '#2c3a2c', .68, 1.1, 0); }
  deco(.5, .08, .3, '#f2efe6', 119.2, 1.5, 36.84); // mailbox by the door
  // ---------- living room ----------
  box(1.3, .55, .7, wood, 110.8, 0, 40.5); const tv = PR.crtTV(110.85, .55, 40.5, Math.PI / 2, 1.05); J.tvScreen = tv.screen; col(110.3, 39.7, 111.3, 41.3, 1.6);
  PR.sofa(115.6, 40.5, -Math.PI / 2, '#a8623a'); J.sofaCol = col(115.1, 39.2, 116.1, 41.8); PR.rug(113.4, 0, 40.5, 2.6, 3.2, '#7a3a2a');
  deco(1.1, .4, .6, wood, 113.3, 0, 40.5); deco(.3, .04, .2, '#c83', 113.3, .4, 40.3); [[111.2, 43.2], [118.2, 37.8]].forEach(([x, z]) => { deco(.4, .5, .4, '#6a4a2a', x, 0, z); const l = new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), mat('#3d7a2e')); l.position.set(x, 1, z); S.add(l); });
  [['#c83a3a', 113.4, 43.9, Math.PI], ['#2a4a8a', 116.6, 43.9, Math.PI]].forEach(([c, x, z, ry]) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1, .7), mat(c)); p.position.set(x, 1.9, z); p.rotation.y = ry; S.add(p); });
  // ---------- kitchen ----------
  const cab = mat('#a8794a'), top = mat('#d8d0c0'); box(.75, .9, 4.4, cab, 125.5, 0, 41.2); deco(.8, .05, 4.4, top, 125.5, .9, 41.2); deco(.45, .8, 3.4, cab, 125.7, 1.55, 40.9); deco(.02, .7, .04, '#6a4a2a', 125.46, 1.6, 39.2); deco(.02, .7, .04, '#6a4a2a', 125.46, 1.6, 41.2);
  deco(.6, .12, .5, '#c9ccd0', 125.5, .86, 42.4); deco(.05, .25, .05, '#c9ccd0', 125.75, .95, 42.4);                         // sink
  PR.fridge(125.4, 38, -Math.PI / 2); col(124.9, 37.5, 125.9, 38.5, 1.9); PR.microwave(125.5, .95, 40.2, -Math.PI / 2);
  box(1.4, .06, 1, wood, 122, .74, 41); [[-.6, -.4], [.6, -.4], [-.6, .4], [.6, .4]].forEach(([a, b]) => deco(.07, .74, .07, wood, 122 + a, 0, 41 + b)); PR.chair(122, 0, 40.05, 0, '#6a4a2a'); PR.chair(122, 0, 41.95, Math.PI, '#6a4a2a');
  PR.wallPhone(119.14, 1.4, 38.2, Math.PI / 2);
  { const cm = txMat('jxclock', (g, w, h) => { g.fillStyle = '#e6dfcf'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w * .46, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#222'; g.stroke(); g.fillStyle = '#222'; g.font = 'bold 18px Arial'; g.textAlign = 'center';
      for(let i = 1; i <= 12; i++) g.fillText(i, w / 2 + Math.sin(i * Math.PI / 6) * w * .36, h / 2 - Math.cos(i * Math.PI / 6) * w * .36 + 6); const hand = (a, l, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * l, h / 2 - Math.cos(a) * l); g.stroke(); };
      hand(1.5 * Math.PI / 6, w * .24, 7); hand(Math.PI, w * .36, 4); }, [1, 1], {}, 128, 128); const c = new THREE.Mesh(new THREE.CircleGeometry(.3, 20), cm); c.position.set(...J.clock); c.rotation.y = Math.PI; S.add(c); }
  // breakfast props (hidden until the mission puts them on the table)
  const smorz = grp(125.45, 1.2, 39.2); part(smorz, new THREE.BoxGeometry(.1, .34, .24), [mat('#3a2a6a'), new THREE.MeshBasicMaterial({ map:label(['Smorz'], { bg:'#3a2a6a', fg:'#f2d030', size:40, w:128, h:180 }) }), mat('#3a2a6a'), mat('#3a2a6a'), mat('#3a2a6a'), mat('#3a2a6a')], 0, 0, 0);
  const bowl = grp(122, .8, 40.7); part(bowl, new THREE.CylinderGeometry(.13, .08, .09, 12), '#f4f4f0', 0, .045, 0); part(bowl, new THREE.CylinderGeometry(.115, .115, .02, 12), '#b8854a', 0, .085, 0); bowl.visible = false;
  const eggo = grp(122, .8, 41.3); part(eggo, new THREE.CylinderGeometry(.16, .16, .015, 14), '#f4f4f0', 0, .01, 0); [-.05, .06].forEach(dx => part(eggo, new THREE.CylinderGeometry(.075, .075, .025, 10), '#d8a23a', dx, .03, dx)); eggo.visible = false;
  Object.assign(J, { smorz, bowl, eggo });
  // ---------- bedroom, closet, back hall ----------
  PR.bed(112, 0, 47.5, 0); col(111.25, 46.4, 112.75, 48.6); PR.rug(114.6, 0, 46.4, 2.4, 2, '#3a4a6a'); box(1.2, 1, .55, wood, 116.8, 0, 48.5); deco(.5, .5, .3, '#2a2a2a', 110.7, 0, 44.8);
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.2), mat('#1a1a1a')); p.position.set(117.9, 1.8, 46.5); p.rotation.y = -Math.PI / 2; S.add(p); }
  deco(2.6, .05, .05, '#999', 119.5, 1.9, 48.6); [118.6, 119.1, 119.7, 120.3].forEach((x, i) => deco(.4, .8, .08, ['#8a2a2a', '#2a4a8a', '#3a3a3a', '#6a6a3a'][i], x, 1.05, 48.6)); deco(.7, .4, .5, '#8a6a44', 120.4, 0, 48.4);
  deco(.5, .9, .3, '#3a4a5a', 125.5, 0, 48.4); deco(.8, .03, .5, '#6a5a4a', 123.6, .04, 48.2);
  // back yard: low fence on three sides, patchy grass
  { const fm = mat('#b8a888'); [[108.5, 49, 108.5, 62], [108.5, 62, 127.5, 62], [127.5, 62, 127.5, 49]].forEach(([x0, z0, x1, z1]) => { const len = Math.hypot(x1 - x0, z1 - z0); box(x1 === x0 ? .12 : len, 1.1, x1 === x0 ? len : .12, fm, (x0 + x1) / 2, 0, (z0 + z1) / 2); }); }
  // ---------- basement set (off the map; flashback only) ----------
  { const cm = txMat('jxconc', (g, w, h) => noise(g, w, h, '#8a8a86', .14, 2000), [3, 2]), bx = 304, bz = -96.5; plane(9, 8, cm, bx, .03, bz); box(9, 2.6, .2, cm, bx, 0, bz - 4); box(9, 2.6, .2, cm, bx, 0, bz + 4); box(.2, 2.6, 8, cm, bx - 4.5, 0, bz); box(.2, 2.6, 8, cm, bx + 4.5, 0, bz);
    deco(9, .15, 8, mat('#5a4a3a'), bx, 2.6, bz); for(let i = 0; i < 6; i++) deco(.12, .2, 8, '#4a3a2a', bx - 3.75 + i * 1.5, 2.4, bz);
    const fr = PR.fridge(307.6, bz, -Math.PI / 2); col(307.1, bz - .5, 308.2, bz + .5, 1.9); J.bfridgeObj = fr;
    for(let i = 0; i < 9; i++) deco(.9, i * .2 + .2, .3, '#6a5a44', 300.3, 0, bz - 1.2 + i * .3); deco(1.4, .8, .7, '#5a4a3a', 302, 0, bz + 3.4); deco(.6, .5, .5, '#8a6a44', 306, 0, bz + 3.4); deco(.4, .06, .4, '#f2efe6', 304, 2.36, bz);
    // what is in the fridge (shown in the discovery shot)
    const stash = new THREE.Group(); fr.add(stash); for(let i = 0; i < 15; i++) part(stash, new THREE.CylinderGeometry(.04, .04, .22, 8), ['#7a4a1a', '#2a6a3a', '#d8b03a'][i % 3], -.28 + (i % 5) * .14, [.58, .93, 1.63][i / 5 | 0], .16); stash.visible = false; J.stash = stash; }
  // ---------- M05 props: before / after ----------
  const before = [], after = [], keep = G.m05Keep = [smorz, bowl, eggo, J.stash];
  // street: signal on a mast at Maple + N Illinois, stop sign on Jax's corner
  { const pole = grp(J.signal.x, 0, J.signal.z); part(pole, new THREE.CylinderGeometry(.1, .13, 6.2, 8), '#5a5d63', 0, 3.1, 0); const arm = part(pole, new THREE.CylinderGeometry(.06, .06, 5, 6), '#5a5d63', -2.5, 5.9, 0); arm.rotation.z = Math.PI / 2;
    const head = signalHead(new THREE.Group()); head.position.set(-4.4, 5.2, 0); head.rotation.y = -Math.PI / 2; pole.add(head); J.streetSignal = head; before.push(head); keep.push(pole); col(J.signal.x - .2, J.signal.z - .2, J.signal.x + .2, J.signal.z + .2, 6); }
  { const s = stopSign(grp(J.corner.x, 0, J.corner.z)); s.rotation.y = Math.PI / 2; before.push(s); J.streetStop = s; deco(.08, .12, .08, '#8a8f96', J.corner.x, 0, J.corner.z); }
  // after: signal in the living room, upside-down stop sign in the back yard, store shelf out front, can, mouse
  { const l = signalHead(grp(J.lightSpot.x - .5, .68, J.lightSpot.z - 1)); l.rotation.set(-.12, .7, 0); const st = part(l, new THREE.CylinderGeometry(.06, .06, .5, 6), '#5a5d63', 0, .85, 0); st.rotation.z = .5; after.push(l); J.lightCol = col(111.7, 37.6, 112.5, 38.4, 1.4); }
  { const s = stopSign(grp(J.sign.x, 2.55, J.sign.z), true); s.rotation.y = .3; after.push(s); J.signCol = col(J.sign.x - .2, J.sign.z - .2, J.sign.x + .2, J.sign.z + .2, 2.4); }
  { const g = grp(J.shelf.x, 0, J.shelf.z); g.rotation.y = .25; part(g, new THREE.BoxGeometry(2.4, 1.9, .08), '#c8ccd2', 0, .95, -.25); part(g, new THREE.BoxGeometry(2.4, .12, .6), '#9aa0a8', 0, .06, 0);
    for(let r = 0; r < 4; r++){ part(g, new THREE.BoxGeometry(2.4, .04, .5), '#e8e8e8', 0, .4 + r * .45, 0); part(g, new THREE.BoxGeometry(2.4, .08, .02), '#c8102e', 0, .38 + r * .45, .26); for(let i = 0; i < 5 - r; i++) part(g, new THREE.BoxGeometry(.2, .26, .14), ['#c8202a', '#f2d030', '#2a8a3a', '#2a5a9a'][(i + r) % 4], -.9 + i * .34 + r * .1, .55 + r * .45, -.05); }
    after.push(g); J.shelfCol = col(J.shelf.x - 1.25, J.shelf.z - .45, J.shelf.x + 1.25, J.shelf.z + .45, 1.9); }
  { const g = grp(J.can.x, .034, J.can.z); const c = part(g, new THREE.CylinderGeometry(.034, .034, .125, 10), '#e0b84a', 0, 0, 0); c.rotation.z = Math.PI / 2; part(g, new THREE.CylinderGeometry(.036, .036, .04, 10), '#f4f1e6', 0, 0, 0).rotation.z = Math.PI / 2; after.push(g); }
  { const g = grp(J.mouse.x, .04, J.mouse.z); const b = part(g, new THREE.SphereGeometry(.06, 8, 6), '#7a7a7a', 0, 0, 0); b.scale.set(1.6, .7, .9); part(g, new THREE.SphereGeometry(.035, 6, 5), '#7a7a7a', .1, 0, 0); part(g, new THREE.BoxGeometry(.14, .008, .008), '#c8a0a0', -.15, -.02, 0); after.push(g); }
  { const g = grp(105, 0, 329.75); part(g, new THREE.BoxGeometry(12, 3.2, .08), '#1c2630', 0, 1.6, 0); const s = part(g, new THREE.PlaneGeometry(1.6, .96), new THREE.MeshBasicMaterial({ map:label(['SORRY', 'WE’RE', 'CLOSED'], { bg:'#c8141e', fg:'#ffffff', size:36, w:256, h:154 }) }), 0, 1.6, -.06); s.rotation.y = Math.PI; s.castShadow = false; g.visible = false; J.closed = g; keep.push(g); } // Schnucks after hours (M05 flashback only)
  keep.push(...before, ...after);
  G.m05World = on => { before.forEach(o => o.visible = !on); after.forEach(o => o.visible = !!on); [J.lightCol, J.signCol, J.shelfCol].forEach(c => c.off = !on); }; G.m05World(false); }
