// Back in the 2000s: The Game — the map screen (M): town map with labelled places, friends, your objective, plus Chris's
// planner (date, weather, money, job standing, curfew, plans, rentals, errands, friends, stuff you own).
// Also: bedroom upgrades ordered on the computer (arrive next morning) and car upgrades at the gas station's auto counter.
import * as E from './engine.js';
import { SV } from './game.js';
import { dateOf, weatherFor } from './extras.js';
import { fmt } from './life.js';
import { playMeter } from './minigames.js';
import { placed } from './town.js';
const { THREE, G, P } = E; const $ = id => document.getElementById(id);
const PLACES = [['🏠', 'HOME', 0, -4], ['🛒', 'SCHNUCKS', 290, 146], ['📼', 'VIDEO WORLD', 374, 169], ['⛽', 'GAS + AUTO', 428, 234], ['🏫', 'BELLEVILLE WEST', -315, -620], ['🏀', 'ELMWOOD PARK', -80, 70]];
const ICON = { 'PUBLIC SQUARE':'⛲', 'PRICE PARK':'🌳', 'FAIRGROUNDS':'🎪', 'SKYVIEW DRIVE-IN':'🎬', 'CATHEDRAL':'⛪', "ECKERT'S":'🎃', 'WALNUT HILL':'🪦', 'MEMORIAL HOSPITAL':'🏥', 'WOLF BRANCH':'🏫', 'SCHRANZ PARK':'⚾', 'SWANSEA VILLAGE HALL':'🚒', 'SWANSEA METRO':'🚆', 'BELLEVILLE METRO':'🚆' };
const WX = { clear:'☀ Sunny', cloudy:'☁ Cloudy', rain:'🌧 Rain', storm:'⛈ Storms', snow:'❄ Snow' }, DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
export function initPlanner(){ G.onMap = (g, cx, cz, sc, size) => { const X = (x, z) => (z - cz) * sc + size / 2, Y = (x, z) => size / 2 - (x - cx) * sc;   // north is up: +x = north, +z = east
  g.save(); g.textAlign = 'center';
  // one name per street, along its longest stretch
  g.font = 'bold 11px Arial'; const seen = {}; for(const l of G.townLines || []){ if(!l.n) continue; let L = 0, bi = 1, bl = 0; for(let i = 1; i < l.p.length; i++){ const d = Math.hypot(l.p[i][0] - l.p[i - 1][0], l.p[i][1] - l.p[i - 1][1]); L += d; if(d > bl){ bl = d; bi = i; } } if(!seen[l.n] || L > seen[l.n].L) seen[l.n] = { L, a:l.p[bi - 1], b:l.p[bi] }; }
  for(const [n, s] of Object.entries(seen)){ if(s.L * sc < 60) continue; const x0 = X(...s.a), y0 = Y(...s.a), x1 = X(...s.b), y1 = Y(...s.b); let ang = Math.atan2(y1 - y0, x1 - x0); if(ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI; g.save(); g.translate((x0 + x1) / 2, (y0 + y1) / 2); g.rotate(ang); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.55)'; g.strokeText(n.toUpperCase(), 0, -5); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(n.toUpperCase(), 0, -5); g.restore(); }
  const all = [...PLACES, ...Object.entries(placed()).filter(([n]) => ICON[n]).map(([n, p]) => [ICON[n], n, p[0], p[1]])];
  for(const [ic, name, x, z] of all){ g.font = '24px Arial'; g.fillText(ic, X(x, z), Y(x, z) + 8); g.font = 'bold 12px Arial'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(name, X(x, z), Y(x, z) + 24); g.fillStyle = '#fff'; g.fillText(name, X(x, z), Y(x, z) + 24); }
  g.font = 'bold 15px Arial'; for(const n of G.npcs) if(n.blip && !n.dog && n.name.length < 12){ g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(n.name, X(n.p.x, n.p.z), Y(n.p.x, n.p.z) - 10); g.fillStyle = '#7ee0ff'; g.fillText(n.name, X(n.p.x, n.p.z), Y(n.p.x, n.p.z) - 10); }
  if(G.way){ g.fillStyle = '#ffd23f'; g.fillText('▼ ' + (G.way.label || 'GO HERE'), X(G.way.x, G.way.z), Y(G.way.x, G.way.z) - 14); }
  g.fillStyle = '#fff'; g.font = 'bold 16px Arial'; g.fillText('N', size - 24, 30); g.fillText('▲', size - 24, 16); g.restore();
  // planner
  const l = SV.life, el = $('mapside'); if(!el) return; const row = (a, b) => `<div class="prow"><span>${a}</span><b>${b}</b></div>`, sec = t => `<h3>${t}</h3>`; let h = '';
  if(G.mission){ h = sec('MISSION') + `<p>${$('obj').textContent || '—'}</p>`; }
  else if(l){ const dc = l.dayCount || 0, d = dateOf(dc), dow = d.getDay(), now = dc * 1440 + l.min, r = Math.round(l.rep ?? 50);
    h += `<div class="pdate">${DAYS[dow]}, ${MON[d.getMonth()]} ${d.getDate()}<small>${fmt(l.min)} · 2003</small></div>`;
    h += row('Today', WX[weatherFor(dc)]) + row('Tomorrow', WX[weatherFor(dc + 1)]) + row('Cash', '$' + l.cash.toFixed(2)) + row('Curfew', dow === 5 || dow === 6 ? '12:30 AM' : '11:00 PM') + row('Eric thinks you are', r >= 90 ? 'a miracle' : r >= 75 ? 'reliable-ish' : r >= 40 ? 'Chris' : r >= 25 ? 'on thin ice' : 'a problem') + row('Gas', (l.gas ?? 7.5).toFixed(1) + ' gal');
    const todo = []; if(l.groundedDay === dc) todo.push('GROUNDED today (no phone, no car)'); if(l.owed) todo.push('Clock in at Schnucks by ' + fmt(l.owed.by % 1440)); if(l.plan) todo.push(`Meet ${l.plan.who} at ${l.plan.place} — ${Math.floor(l.plan.at / 1440) === dc ? 'today' : 'tomorrow'} ${fmt(l.plan.at % 1440)}`);
    (l.rentals || []).forEach(x => todo.push(`Return “${x.t}” ${x.dueAbs - dc <= 0 ? '— LATE' : 'in ' + (x.dueAbs - dc) + ' day' + (x.dueAbs - dc > 1 ? 's' : '')}`)); (l.orders || []).forEach(o => todo.push(`Package arriving: ${o.name}`)); if(dow === 5) todo.push('Rager on Maple tonight, 9 PM');
    h += sec('TO DO') + (todo.length ? todo.map(t => `<p>• ${t}</p>`).join('') : '<p class="dim">Nothing. Classic Chris.</p>');
    h += sec('FRIENDS') + ['Zeke', 'Jax', 'Matt', 'Milo'].map(n => { const v = Math.max(0, Math.min(10, (l.fr || {})[n] || 0)); return row(n, '<i class="bar">' + '█'.repeat(Math.round(v)) + '░'.repeat(10 - Math.round(v)) + '</i>'); }).join('');
    const own = (l.owned || []).length; h += sec('STUFF') + `<p class="dim">${own ? (l.owned || []).map(k => NAMES[k] || k).join(' · ') : 'A bed, a desk and a dream.'}</p>`; }
  el.innerHTML = h; }; }
const NAMES = { board:'Skateboard', ps2:'PlayStation 2', madden:'Madden 2004', vc:'Vice City', thps4:'Pro Skater 4', ssx:'SSX Tricky', nfs:'Hot Pursuit 2', poster_sk8:'Skate poster', poster_band:'Band poster', lava:'Lava lamp', beanbag:'Bean bag', stereo:'Boombox', bigtv:'27-inch TV' };

// ---------- bedroom + car upgrades ----------
const ROOM = [['poster_sk8', 'Skate poster', 7.99], ['poster_band', 'Band poster', 7.99], ['lava', 'Lava lamp', 14.99], ['beanbag', 'Bean bag chair', 24.99], ['stereo', 'Boombox with CD player', 59.99], ['bigtv', '27-inch TV for your room', 119.99]];
const PAINT = [['#2a5a9a', 'Factory blue'], ['#c8202a', 'Arrest-me red'], ['#1a1a1a', 'Midnight black'], ['#e8e8e8', 'Rental white'], ['#3a8a3a', 'Lime-ish green'], ['#e8a020', 'School-bus yellow'], ['#7a3a9a', 'Grape']];
let api = null, decor = null;
function drawRoom(){ const l = api.L(), own = k => (l.owned || []).includes(k), UP = 3.2, S = G.scene; if(decor) S.remove(decor); decor = new THREE.Group(); decor.position.x = -8; S.add(decor); // Chris's room is now on the west side upstairs
  const A = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; decor.add(me); return me; }, lab = (t, o) => new THREE.MeshBasicMaterial({ map:E.label(t, o) });
  if(own('poster_sk8')) A(new THREE.PlaneGeometry(1, 1.4), lab(['SK8', 'OR', 'DIE'], { bg:'#1a1a1a', fg:'#3ad86a', size:60, w:200, h:280 }), .13, UP + 1.8, -8.3).rotation.y = Math.PI / 2;
  if(own('poster_band')) A(new THREE.PlaneGeometry(1, 1.4), lab(['THE', 'GARAGE', 'KINGS', 'TOUR 03'], { bg:'#7a1a2a', fg:'#f2d030', size:44, w:200, h:280 }), .13, UP + 1.8, -3.5).rotation.y = Math.PI / 2;
  if(own('lava')){ A(new THREE.CylinderGeometry(.07, .1, .12, 8), E.mat('#9aa0a6'), 4.5, UP + .86, -11.5); A(new THREE.CylinderGeometry(.05, .09, .34, 8), new THREE.MeshBasicMaterial({ color:0xb040e0 }), 4.5, UP + 1.09, -11.5); }
  if(own('beanbag')){ const b = A(new THREE.SphereGeometry(.55, 10, 8), E.mat('#c8202a'), 2.7, UP + .3, -4.2); b.scale.y = .6; }
  if(own('stereo')){ A(new THREE.BoxGeometry(.3, .35, .8), E.mat('#3a3a3a'), 7.6, UP + 1.2, -1.5); [-.25, .25].forEach(dz => A(new THREE.CylinderGeometry(.12, .12, .02, 10), E.mat('#111'), 7.44, UP + 1.2, -1.5 + dz).rotation.z = Math.PI / 2); }
  { const games = ['madden', 'vc', 'thps4', 'ssx', 'nfs'].filter(own); games.forEach((g, i) => A(new THREE.BoxGeometry(.14, .02, .19), E.mat(['#2a6a2a', '#e86aa8', '#2a2a6a', '#e8a020', '#c8202a'][i]), 5.6, UP + .02 + i * .022, -5.1));
    const cds = l.cds || []; cds.forEach((c, i) => { A(new THREE.BoxGeometry(.13, .14, .02), E.mat(['#1a1a1a', '#c8202a', '#2a4a8a', '#e8c832', '#3a7a3a'][i % 5]), 7.5, UP + .9 - (i / 8 | 0) * .17, -2.4 + (i % 8) * .03).rotation.y = Math.PI / 2; });
    if((l.cards || []).length >= 10) A(new THREE.BoxGeometry(.3, .06, .34), E.mat('#1a2a6a'), 2.4, UP + .62, -9.2);
    if((l.hi || {}).bowl >= 1) A(new THREE.CylinderGeometry(.05, .08, .3, 8), E.mat('#d8b040'), 4.7, UP + .95, -11.4);
    (l.trinkets || []).forEach((t, i) => A(new THREE.BoxGeometry(.14, .14, .14), E.mat(['#6a6a6a', '#c8a0e0', '#3ac8e0', '#1a1a1a'][i % 4]), 7.5, UP + 1.7, -4 + i * .2));
    if(l.cell) A(new THREE.BoxGeometry(.05, .02, .1), E.mat('#9aa0a8'), 4.2, UP + .82, -11.1); }
  if(own('bigtv')){ A(new THREE.BoxGeometry(.9, .8, 1.1), E.mat('#2a2a2a'), 1, UP + .9, -5.6); A(new THREE.PlaneGeometry(.9, .62), new THREE.MeshBasicMaterial({ color:0x3a6ab8 }), 1.46, UP + .92, -5.6).rotation.y = Math.PI / 2; } }
function drawCar(){ const l = api.L(), c = l.car || {}, car = G.chrisCar; if(!car) return; const n = E.makeCar(c.color || '#2a5a9a', { type:c.type || 'taurus', spin:true, lights:true, spoiler:c.spoiler, rims:c.rims, flames:c.flames, tint:c.tint }); car.clear(); [...n.children].forEach(ch => car.add(ch)); car.userData.wheels = n.userData.wheels; }
async function shopOnline(){ const l = api.L(); l.owned = l.owned || []; l.orders = l.orders || []; const list = ROOM.filter(r => !l.owned.includes(r[0]) && !l.orders.some(o => o.id === r[0]));
  if(!list.length){ await E.say([['', 'BidZone has nothing left that I want. I have peaked.']]); return; } const k = await E.choose([...list.map(r => `${r[1]} — $${r[2].toFixed(2)}`), 'Close the browser']); if(k >= list.length) return;
  if(api.pay(list[k][2])){ l.orders.push({ id:list[k][0], name:list[k][1], at:(l.dayCount || 0) + 1 }); api.save(); await E.say([['', `Ordered: ${list[k][1]}. Dial-up took four minutes to load the checkout page. It arrives tomorrow.`]]); } }
async function autoShop(){ const l = api.L(); l.car = l.car || {}; E.cut(true); await E.say([['Mechanic', 'Auto counter. What are we doing to it?']]);
  for(;;){ const c = l.car, opts = ['New paint — $60', c.rims ? 'Rims (installed)' : 'Chrome rims — $80', c.spoiler ? 'Spoiler (installed)' : 'Spoiler — $45', c.flames ? 'Flame decals (installed)' : 'Flame decals — $30', c.tint ? 'Window tint (installed)' : 'Window tint — $40', 'That’s it'], k = await E.choose(opts); if(k === 5) break;
    if(k === 0){ const p = await E.choose([...PAINT.map(x => x[1]), 'Never mind']); if(p < PAINT.length && api.pay(60)){ c.color = PAINT[p][0]; drawCar(); } }
    else { const key = ['', 'rims', 'spoiler', 'flames', 'tint'][k], cost = [0, 80, 45, 30, 40][k]; if(c[key]){ await E.say([['Mechanic', 'Already on there, chief.']]); continue; } if(api.pay(cost)){ c[key] = key === 'rims' ? '#e8e8f0' : true; drawCar(); if(key === 'flames') await E.say([['Mechanic', 'Flames. Adds at least five horsepower.']]); } } api.save(); }
  E.cut(false); }
export function upgradesOn(a){ api = a; const l = api.L(); drawRoom(); if(l.car) drawCar(); G.shopOnline = shopOnline; G.drawRoom = drawRoom; G.drawCar = drawCar;
  api.add({ x:-62.5, z:68, r:2.6, prompt:'SHOOT HOOPS', use:async () => { const r = await playMeter({ kind:'hoops' }); api.passTime(20); l.hi = l.hi || {}; const best = r > (l.hi.hoops || 0); if(best) l.hi.hoops = r; api.save(); E.toast(`${r} / 10 at the park${best ? ' · NEW BEST' : ' · best ' + l.hi.hoops}`, 3200); } });
  api.add({ x:428, z:229.4, r:2.2, prompt:'AUTO COUNTER (CAR UPGRADES)', use:autoShop });
  api.addTick(() => { if(G.mission || !l.orders || !l.orders.length) return; const dc = l.dayCount || 0, due = l.orders.filter(o => o.at <= dc && l.min >= 420); if(!due.length) return; due.forEach(o => l.owned.push(o.id)); l.orders = l.orders.filter(o => !due.includes(o)); drawRoom(); api.save(); E.sfx('ok'); E.toast(`📦 Package arrived: ${due.map(o => o.name).join(', ')}. It’s in your room.`, 4200); }); }
