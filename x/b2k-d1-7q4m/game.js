// Back in the 2000s: The Game — Draft #1 runner: saves, mission flow, checkpoints, free roam, carts, menus
import * as E from './engine.js';
import './world.js';
import './audio.js';
import * as LIFE from './life.js';
const { THREE, G, P } = E; const $ = id => document.getElementById(id);
E.bakeStatic([G.fridgeObj, G.dishes, G.barberPole, G.phoneObj, G.rearDoor, G.exitDoor, G.kitchenWindow, G.tvScreen, G.monitor, G.breakTV, G.gate, G.chrisCar, ...(G.crowd || []), ...(G.camerasBack || []).map(l => l.parent)]);
const KEY = 'b2k_draft1_save';
export const SV = { done:{}, cp:null, flags:{}, pos:null, cam:'tp', filter:false, s01best:null, ver:1 };
try{ Object.assign(SV, JSON.parse(localStorage.getItem(KEY)) || {}); }catch(e){}
export function save(){ SV.pos = [P.p.x, P.p.z, P.yaw]; SV.cam = G.camMode; SV.filter = G.filter; try{ localStorage.setItem(KEY, JSON.stringify(SV)); }catch(e){} }
G.flags = SV.flags; G.filter = !!SV.filter; G.camMode = SV.cam || 'tp';

// ---------- mission plumbing: stale-safe helpers, checkpoint retry ----------
let gen = 0, failRes = null;
const live = p => { const g = gen; return p.then(v => g === gen ? v : new Promise(() => {})); };
export const H = {
  say:(l, o) => live(E.say(l, o)), wait:ms => live(E.wait(ms)), reach:(x, z, r, o) => live(E.reach(x, z, r, o)), interact:(x, z, pr, r, y) => live(E.interact(x, z, pr, r, y)),
  choose:o => live(E.choose(o)), fade:(on, ms) => live(E.fade(on, ms)), card:(a, b, ms) => live(E.card(a, b, ms)), shot:(p, l, ms) => live(E.camShot(p, l, ms)),
  until:fn => live(new Promise(r => { const t = E.tick(() => { if(fn()){ t(); r(); } }); mt.push(t); })),
  go:(n, pts, sp) => live(n.go(pts, sp)), banner:(a, b, f, ms) => live(E.banner(a, b, f, ms)) };
let mNpcs = [], mt = [], mInter = [];
export function mnpc(name, look, x, z, o){ const n = E.npc(name, look, x, z, o); mNpcs.push(n); return n; }
export function mtick(fn){ const t = E.tick(fn); mt.push(t); return t; }
export function minter(o){ o.persist = true; mInter.push(o); return E.addInter(o); }
export function fail(msg){ failRes && failRes(msg); }
function cleanup(){ gen++; phoneUp(false); sitSofa(false); G.noExit = false; if(G.driving) E.exitCar(); mNpcs.forEach(n => G.npcs.includes(n) && n.remove()); mNpcs = []; mt.forEach(t => t()); mt = []; mInter.forEach(E.delInter); mInter = [];
  G.ticks = G.ticks.filter(t => t.amb); (G.markers || []).slice().forEach(E.clearMarker); E.setWay(); E.killDialog(); E.cut(false); E.obj('');
  G.carry = null; clearTrain(); G.camOverride = null; $('timer').style.display = 'none'; $('carts').style.display = 'none'; alarmFx(false); G.blips = []; }
export let MIS = {}; export const setMissions = m => MIS = m;
G.mission = null;
export async function play(id, i = 0){
  cleanup(); G.mission = id; const m = MIS[id]; freeRoam(false);
  if(i === 0){ await E.fade(true, 400); await E.card(m.title.toUpperCase(), m.sub || '', 2400); }
  while(i < m.stages.length){
    SV.cp = { id, i }; save(); cleanup(); G.mission = id;
    if(m.setup) m.setup(i);
    await E.fade(false, 500);
    const r = await Promise.race([m.stages[i](), new Promise(res => failRes = res)]); failRes = null;
    if(typeof r === 'string'){ cleanup(); E.cut(true); await E.banner('MISSION FAILED', r, true, 3200); await E.fade(true, 500); continue; }
    i++; }
  cleanup(); if(!G.noComplete){ SV.done[id] = true; if(['M02', 'M03', 'M04'].includes(id) && !SV.replaying) SV.needSleep = id; } G.noComplete = false; SV.cp = null; if(m.done) m.done(); save(); G.mission = null; freeRoam(true); }
export async function restartCP(){ if(!SV.cp) return; await E.fade(true, 300); play(SV.cp.id, SV.cp.i); }

// ---------- clock / HUD helpers ----------
export const clock = (d, t) => { $('clock').innerHTML = d ? `${d}<br>${t || ''}` : ''; };
let alarmEl = null, alarmT = 0;
export function alarmFx(on){ if(on && !alarmEl){ alarmEl = document.createElement('div'); alarmEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;background:#f00;opacity:0;transition:opacity .2s'; document.body.appendChild(alarmEl);
    alarmT = setInterval(() => { alarmEl.style.opacity = alarmEl.style.opacity === '0' ? '.22' : '0'; E.sfx('alarm'); }, 1000); }
  if(!on && alarmEl){ clearInterval(alarmT); alarmEl.remove(); alarmEl = null; } }

// ---------- carts (shared by M04 + S01) ----------
const cartGeo = (() => { const g = new THREE.Group(), m = E.mat('#b8bcc4'), r = E.mat('#c8102e');
  const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .9), m); b.position.y = .75; const h = new THREE.Mesh(new THREE.BoxGeometry(.62, .06, .06), r); h.position.set(0, 1.05, -.5);
  const base = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .8), m); base.position.y = .2; g.add(b, h, base);
  [[-.22, .35], [.22, .35], [-.22, -.35], [.22, -.35]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.BoxGeometry(.06, .14, .14), E.mat('#222')); w.position.set(x, .07, z); g.add(w); });
  return g; })();
export const newCart = () => cartGeo.clone();
export const train = []; // meshes following the player
export function clearTrain(){ train.forEach(c => G.scene.remove(c)); train.length = 0; }
export function fillCorral(c, n){ c.carts.forEach(m => G.scene.remove(m)); c.carts = []; c.initial = n; c.delivered = 0;
  for(let i = 0; i < n; i++){ const m = newCart(); m.position.set(c.x, 0, c.z + 2.2 - i * .55); m.rotation.y = Math.PI; G.scene.add(m); c.carts.push(m); } }
export function emptyCorrals(){ G.corrals.forEach(c => fillCorral(c, 0)); }
export function startPushing(){ G.carry = (dt, mv) => { // carts nest into a line Chris pushes IN FRONT of him
    if(!train.length) return; const a = P.model.rotation.y, fx = Math.sin(a), fz = Math.cos(a);
    for(let i = 0; i < train.length; i++){ const d = 1.05 + i * .5; train[i].position.set(P.p.x + fx * d, P.p.y, P.p.z + fz * d); train[i].rotation.y = a + Math.PI; } }; }
export function park(x, z, ry){ const c = G.chrisDrive; c.car.position.set(x, 0, z); c.car.rotation.y = ry; c.head = ry; c.car.visible = true; const sw = Math.abs(Math.sin(ry)) > .7;
  Object.assign(G.chrisCarCol, sw ? { x0:x - 2.3, x1:x + 2.3, z0:z - 1, z1:z + 1 } : { x0:x - 1, x1:x + 1, z0:z - 2.3, z1:z + 2.3 }); G.chrisCarCol.off = false; }
export function grabFrom(c, max){ const n = Math.min(max - train.length, c.carts.length); for(let i = 0; i < n; i++){ const m = c.carts.pop(); train.push(m); (m.userData.from = c); } if(n) E.sfx('cart'); return n; }
export function deliver(){ const n = train.length; train.forEach(m => { m.userData.from.delivered++; G.scene.remove(m); }); train.length = 0; return n; }

// ---------- free roam: mission markers, ambient life ----------
const ORDER = ['M01', 'M02', 'M03', 'M04', 'S01'];
let roamMarks = [];
const NEXT_DAY = { M02:'SEPTEMBER 24TH 2003', M03:'SEPTEMBER 26TH 2003', M04:'THE NEXT DAY' };
// Chris sits on the living-room sofa facing the TV; the camera looks over his shoulder so he never blocks the screen
export const TV_SHOT = [[-5.9, 2.3, -11.4], [-4.5, 1.1, -2.6]];
export function sitSofa(on){ if(on){ E.place(-4.5, -10.45, 0); if(G.sofaCol) G.sofaCol.off = true; P.model.rotation.y = 0; E.sit(P.model, true); } else if(P.model.userData.sitting){ E.place(-4.5, -9.3, 0); } }
// Chris takes the kitchen wall phone off the hook (handset at his ear) / hangs it up
export function phoneUp(on){ const hs = G.phoneObj && G.phoneObj.userData.hs; if(hs) hs.visible = !on; E.holdPhone(P.model, on ? 'handset' : null);
  if(on){ E.place(G.phone.x, G.phone.z, Math.atan2(G.phoneLook.x - G.phone.x, G.phoneLook.z - G.phone.z)); P.model.rotation.y = P.yaw; } }
export function freeRoam(on){ roamMarks.forEach(r => { E.clearMarker(r.mk); E.delInter(r.it); r.stop && r.stop(); }); roamMarks = []; E.setWay(); G.blips = [];
  LIFE.lifeOn(false); if(!on) return; if(G.roamTime){ G.roamFrom = G.roamTime; G.roamTime = null; } if(SV.needSleep) G.roamFrom = 'night'; LIFE.lifeOn(true);
  if(SV.needSleep){ const b = G.bed, mk = E.marker(b.x, b.z, 0x9a7cff, 3.2); G.blips.push({ x:b.x, z:b.z, c:'#9a7cff' }); E.setWay(b.x, b.z);
    const it = E.addInter({ x:b.x, z:b.z, y:3.2, r:2.2, prompt:'SLEEP UNTIL TOMORROW', use:async () => { freeRoam(false); E.cut(true); await E.fade(true, 900);
      const day = NEXT_DAY[SV.needSleep] || 'THE NEXT DAY'; SV.needSleep = false; G.roamFrom = 'morning'; G.roamTime = null; LIFE.passTime(0); SV.life && (SV.life.dayCount = (SV.life.dayCount || 0) + 1, SV.life.day = (SV.life.day + 1) % 7); save(); await E.card('THE NEXT MORNING', day, 2600);
      E.place(G.bedSpawn.x, G.bedSpawn.z, Math.PI, 3.2); E.cut(false); await E.fade(false, 700); freeRoam(true); } });
    roamMarks.push({ mk, it }); E.obj("It's late. Go home and sleep — your bed is upstairs."); return; }
  const next = ORDER.find(id => !SV.done[id] && MIS[id] && (!MIS[id].needs || SV.done[MIS[id].needs]));
  const avail = ORDER.filter(id => MIS[id] && (id === next || (id === 'S01' && SV.done.M04)));
  avail.forEach(id => { const m = MIS[id], s = m.start, mk = E.marker(s.x, s.z, id[0] === 'S' ? 0x4fc3ff : 0xffd23f, s.y);
    const stop = E.tick(() => { if(!G.mission && G.ctl && !G.driving && Math.hypot(P.p.x - s.x, P.p.z - s.z) < 1.4 && Math.abs(P.p.y - (s.y || 0)) < 2){ freeRoam(false); play(id, 0); } });
    roamMarks.push({ mk, stop }); G.blips.push({ x:s.x, z:s.z, c:id[0] === 'S' ? '#4fc3ff' : '#ffd23f' }); });
  if(next){ E.obj(`${MIS[next].title}: go to the ${next[0] === 'S' ? 'blue' : 'yellow'} marker (${MIS[next].where}).`); E.setWay(MIS[next].start.x, MIS[next].start.z); } else E.obj('Free roam. Replay missions from the pause menu.'); }
// ambient traffic: drives on the right on every road, stops for Chris (on foot or driving)
{ const lanes = [
    { ax:'x', c:25.8, a0:-188, a1:148, dir:1 }, { ax:'x', c:22.2, a0:148, a1:-188, dir:-1 },
    { ax:'x', c:257.8, a0:-188, a1:228, dir:1 }, { ax:'x', c:254.2, a0:228, a1:-188, dir:-1 },
    { ax:'z', c:98, a0:30, a1:250, dir:1 }, { ax:'z', c:102, a0:250, a1:30, dir:-1 },
    { ax:'z', c:-110, a0:30, a1:250, dir:1 }, { ax:'z', c:-106, a0:250, a1:30, dir:-1 } ];
  const cols = ['#a33', '#335', '#ddd', '#2a6a3a', '#d8b84a', '#6a2a6a', '#8a8a8a', '#1a3a6a', '#c87a2a'];
  lanes.forEach((l, i) => { const n = l.ax === 'x' ? 4 : 3; for(let k = 0; k < n; k++){ const car = E.makeCar(cols[(i * 3 + k) % 9], { suv:(i + k) % 3 === 0 }); G.scene.add(car);
    const col = { x0:0, x1:0, z0:0, z1:0, y0:0, y1:1.6 }; G.colliders.push(col); let a = l.a0 + (l.a1 - l.a0) * ((k + (i % 2) * .5) / n), v = 12;
    const t = dt => { const px = l.ax === 'x' ? a : l.c, pz = l.ax === 'x' ? l.c : a, fx = l.ax === 'x' ? l.dir : 0, fz = l.ax === 'z' ? l.dir : 0;
      const rx = P.p.x - px, rz = P.p.z - pz, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
      const block = ahead > 0 && ahead < 9 && side < 2.6; v += ((block ? 0 : 12) - v) * Math.min(1, dt * (block ? 6 : 1.5));
      a += l.dir * v * dt; if((l.dir > 0 && a > l.a1) || (l.dir < 0 && a < l.a1)) a = l.a0;
      car.position.set(px, 0, pz); car.rotation.y = l.ax === 'x' ? (l.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (l.dir > 0 ? 0 : Math.PI);
      Object.assign(col, l.ax === 'x' ? { x0:px - 2.2, x1:px + 2.2, z0:pz - 1, z1:pz + 1 } : { x0:px - 1, x1:px + 1, z0:pz - 2.2, z1:pz + 2.2 }); col.off = !!G.noTraffic; car.visible = !G.noTraffic && Math.abs(px - P.p.x) + Math.abs(pz - P.p.z) < 170; };
    t.amb = true; G.ticks.push(t); } }); }
// parked cars in some driveways + Chris's own car (drivable)
(G.driveways || []).filter((d, i) => i % 3 === 1).map(d => [d.x, d.z, d.ry]).forEach(([x, z, ry], i) => { const c = E.makeCar(['#7a2a2a', '#ccc', '#2a4a6a', '#e8e8e8', '#3a3a3a', '#6a5a2a', '#1f5a3a', '#8a8a92'][i % 8], { suv:i % 3 === 0 }); c.position.set(x, 0, z); c.rotation.y = ry; G.scene.add(c);
  const sw = Math.abs(Math.sin(ry)) > .7; G.colliders.push(sw ? { x0:x - 2.3, x1:x + 2.3, z0:z - 1, z1:z + 1, y0:0, y1:1.6 } : { x0:x - 1, x1:x + 1, z0:z - 2.3, z1:z + 2.3, y0:0, y1:1.6 }); });
G.chrisCarCol = G.colliders.find(c => c.x0 === 9.5 && c.z0 === 6.8); G.chrisDrive = E.makeDrivable(G.chrisCar, G.chrisCarCol);
{ const barks = ['"Afternoon."', '"Watch the road, kid."', '"Nice weather, huh?"'];
  const peds = [[[-150, 17], [-20, 17]], [[20, 31], [140, 31]], [[94, 60], [94, 230]]];
  peds.forEach((path, i) => { const n = E.npc('ped' + i, { shirt:['#8a5a9a', '#3a7a6a', '#a8743a'][i], pants:'#334', hair:['#222', '#a87a4a', '#ddd'][i], long:i === 1 }, path[0][0], path[0][1], { speed:1.6 });
    let leg = 1; const loop = () => n.go([path[leg]]).then(() => { leg = 1 - leg; loop(); }); loop(); let cd = 0;
    const t = dt => { cd -= dt; n.o.visible = !G.mission || G.mission === 'M01'; if(cd <= 0 && !G.dialogOn && n.o.visible && Math.hypot(P.p.x - n.p.x, P.p.z - n.p.z) < 3){ cd = 25; E.toast(barks[i], 2000); } }; t.amb = true; G.ticks.push(t); }); }

// ---------- menus ----------
function openPause(on){ G.paused = on; $('pause').style.display = on ? 'flex' : 'none'; if(on){ E.unlock(); $('pLang').textContent = 'STRONG LANGUAGE: ' + (G.filter ? 'FILTERED' : 'SHOWN'); $('pRestart').disabled = !SV.cp; } }
G.hotkey = e => { if(['Escape', 'KeyP'].includes(e.code) && !$('title').offsetParent){ if($('mapv').style.display === 'flex'){ $('mapv').style.display = 'none'; G.paused = false; return; } openPause(!G.paused); }
  if(e.code === 'KeyM'){ if($('mapv').style.display === 'flex'){ $('mapv').style.display = 'none'; G.paused = false; } else if(!G.paused && G.ctl){ $('mapv').style.display = 'flex'; G.paused = true; E.unlock(); E.drawMap($('mapc').getContext('2d'), 900, 20, 195, 1.9); } } };
$('pResume').onclick = () => openPause(false);
{ const QS = ['LOW', 'MEDIUM', 'HIGH']; let q = 'MEDIUM'; try{ q = localStorage.getItem('b2k_gfx') || 'MEDIUM'; }catch(e){} E.setQuality(q); const lab = () => $('pGfx').textContent = 'GRAPHICS: ' + G.quality;
  lab(); $('pGfx').onclick = () => { const n = QS[(QS.indexOf(G.quality) + 1) % 3]; E.setQuality(n); try{ localStorage.setItem('b2k_gfx', n); }catch(e){} lab(); }; }
$('pRestart').onclick = () => { openPause(false); restartCP(); };
$('pLang').onclick = () => { G.filter = !G.filter; save(); $('pLang').textContent = 'STRONG LANGUAGE: ' + (G.filter ? 'FILTERED' : 'SHOWN'); };
$('pMissions').onclick = async () => { const list = ORDER.filter(id => SV.done[id]); if(!list.length){ E.toast('Finish a mission first.'); return; } openPause(false);
  if(G.mission) cleanup(); G.mission = 'menu'; E.cut(true); const k = await E.choose([...list.map(id => `${id} · ${MIS[id].title}`), 'Cancel']); E.cut(false); G.mission = null;
  if(k < list.length) play(list[k], 0); else freeRoam(true); };
$('pExport').onclick = () => { save(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(SV, null, 1)], { type:'application/json' })); a.download = 'b2k-draft1-save.json'; a.click(); };
$('pImport').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try{ const d = JSON.parse(await i.files[0].text()); localStorage.setItem(KEY, JSON.stringify(d)); location.reload(); }catch(e){ E.toast('That file is not a save.'); } }; i.click(); };
$('pBug').onclick = () => { const r = { build:'Draft #1', mission:G.mission, checkpoint:SV.cp, pos:[+P.p.x.toFixed(1), +P.p.y.toFixed(1), +P.p.z.toFixed(1)], done:SV.done, cam:G.camMode, ua:navigator.userAgent, time:new Date().toISOString() };
  const t = 'BUG REPORT — Back in the 2000s Draft #1\nWhat happened: \nWhat I expected: \n\n' + JSON.stringify(r, null, 1);
  navigator.clipboard?.writeText(t).then(() => E.toast('Bug report copied. Paste it into a message with what went wrong.'), () => prompt('Copy this:', t)); };
$('pTitle').onclick = () => { save(); location.reload(); };
$('bHelp').onclick = () => $('help').style.display = 'flex'; $('hClose').onclick = () => $('help').style.display = 'none';
if(SV.done.M01 || SV.cp) $('bCont').disabled = false;
function startGame(){ $('title').style.display = 'none'; E.sfx('ok'); E.cut(false); }
$('bNew').onclick = () => { if((SV.done.M01 || SV.cp) && !confirm('Start a new game? Your current save will be replaced.')) return;
  Object.assign(SV, { done:{}, cp:null, flags:{}, pos:null, s01best:null }); G.flags = SV.flags; save(); startGame(); play('M01', 0); };
$('bCont').onclick = () => { startGame(); if(SV.cp) play(SV.cp.id, SV.cp.i); else { const p = SV.pos || [0, 9, 0]; E.place(p[0], p[1], p[2]); freeRoam(true); } };
E.place(0, 9, Math.PI); E.camShot([40, 30, 70], [0, 2, 0], 0); E.cut(true); G.noLock = false;
setInterval(() => { if(!G.paused && !G.mission && $('title').style.display === 'none') save(); }, 5000);
$('bNew').disabled = $('bCont').disabled = true;
import('./missions.js').then(() => { $('bNew').disabled = false; if(SV.done.M01 || SV.cp) $('bCont').disabled = false; }, e => alert('Game failed to load: ' + e.message));
