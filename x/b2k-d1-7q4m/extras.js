// Back in the 2000s: The Game — free-roam extras (GAME ORIGINAL): calendar from Fri Sep 26 2003, fall colours + holidays (Halloween,
// Thanksgiving, December lights), daily weather (rain/storms/snow) with a forecast, the morning paper + TV guide, curfew + grounding,
// gas + a station, PS2 + games, skateboard, friends' hangout schedule, phone plans, Friday ragers, AIM chat, side jobs, job reputation,
// kids at the park after school, busier Schnucks on weekends, lit windows at night.
import * as E from './engine.js';
import { playRunner, playDodge, playMeter } from './minigames.js';
import { glassM } from './props.js';
const { THREE, G, P } = E; const $ = id => document.getElementById(id);
let api = null, decor = null, rain = null, lastDay = -1, thunderT = 10, spawned = {}, objs = [];
const rnd = s => { s = Math.sin(s * 9301 + 49297) * 233280; return s - Math.floor(s); };
export const dateOf = dc => new Date(2003, 8, 26 + (dc || 0));
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'];
const absNow = l => (l.dayCount || 0) * 1440 + l.min;
const fmtT = m => { m = ((m % 1440) + 1440) % 1440; const h = m / 60 | 0; return `${(h + 11) % 12 + 1}:${String(m % 60 | 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
function addObj(o){ G.scene.add(o); objs.push(o); return o; }
function mesh(geo, m, x, y, z){ const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); return addObj(me); }

// ---------- weather ----------
export function weatherFor(dc){ const d = dateOf(dc), m = d.getMonth(), r = rnd(dc + 7); if(m === 9 && d.getDate() === 31) return 'clear';
  if(m === 11 && r < .25) return 'snow'; if(r < .5) return 'clear'; if(r < .72) return 'cloudy'; if(r < .93) return 'rain'; return 'storm'; }
const WX_NAME = { clear:'Sunny', cloudy:'Cloudy', rain:'Rain', storm:'Thunderstorms', snow:'Snow' };
function indoors(){ const p = P.p, S = G.SCH; return (G.shops || []).some(s => p.x > s.x0 && p.x < s.x1 && p.z > s.z0 && p.z < s.z1) || (p.x > -8 && p.x < 8 && p.z > -12 && p.z < 4) || (S && p.x > S.x0 && p.x < S.x1 && p.z > S.z0 && p.z < S.z1) || (p.x > -432 && p.x < -250 && p.z > -670 && p.z < -570 && !(p.x > -380 && p.x < -300 && p.z > -640 && p.z < -600)) || (p.z > 162 && p.z < 178 && ((p.x > 351 && p.x < 398) || (p.x > 168 && p.x < 216))); }
function makeRain(){ const n = 2600, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); for(let i = 0; i < n; i++){ a[i * 3] = (Math.random() - .5) * 60; a[i * 3 + 1] = Math.random() * 30; a[i * 3 + 2] = (Math.random() - .5) * 60; }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color:0xa8bcd0, size:.09, transparent:true, opacity:.7, depthWrite:false })); p.frustumCulled = false; G.scene.add(p); return p; }
function applyWeather(){ const w = G.wx || 'clear', wet = w === 'rain' || w === 'storm' || w === 'snow', dim = w === 'cloudy' ? .8 : wet ? .5 : 1;
  G.cloud = w === 'clear' ? .36 : w === 'cloudy' ? .7 : .95; if(G.skyU && G.skyU.cloud) G.skyU.cloud.value = G.cloud;
  if(G.skyU){ G.skyU.top.value.multiplyScalar(dim); G.skyU.bot.value.lerp(new THREE.Color(0x8a9098), 1 - dim); }
  if(G.sun) G.sun.intensity *= wet ? .3 : w === 'cloudy' ? .6 : 1; G.scene.fog.near = wet ? 30 : 70; G.scene.fog.far = wet ? 170 : (G.fogFar || 330); if(wet) G.scene.fog.color.lerp(new THREE.Color(0x8a9098), .5);
  G.wet = wet; if(rain){ rain.material.color.set(w === 'snow' ? 0xffffff : 0xa8bcd0); rain.material.size = w === 'snow' ? .16 : .09; } }
function windows(k){ const night = k === 'night' || k === 'dusk'; glassM.emissive.set(night ? 0x8a6a2a : 0x223344); glassM.opacity = night ? .85 : .5; }
function leaves(dc){ const d = dateOf(dc), m = d.getMonth(), day = d.getDate(), base = ['#3f7a2e', '#4d8a34', '#5c7f2a'], fall = ['#c8641e', '#d89a2a', '#b84a22'], late = ['#7a5a3a', '#8a6a3a', '#6a4a2a'];
  base.forEach((c, i) => { const mt = E.mat(c); const t = m < 9 ? 0 : m === 9 ? day / 31 : 1; const col = new THREE.Color(c).lerp(new THREE.Color(fall[i]), Math.min(1, t * 1.2)); if(m >= 10) col.lerp(new THREE.Color(late[i]), m === 10 ? day / 30 : 1); mt.color.copy(col); }); }

// ---------- holidays + seasonal decor ----------
const NORTH = [-170, -150, -130, -80, -60, -40, 25, 45, 65, 120, 140], SOUTH = [-170, -150, -130, -60, -40, -20, 0, 20, 40, 60, 80, 120, 140];
function buildDecor(dc){ if(decor){ G.scene.remove(decor); decor = null; } const d = dateOf(dc), m = d.getMonth(), day = d.getDate(); decor = new THREE.Group(); G.scene.add(decor);
  const pumpkin = (x, z) => { const p = new THREE.Mesh(new THREE.SphereGeometry(.28, 10, 8), new THREE.MeshLambertMaterial({ color:0xe0701a, emissive:0x000000 })); p.scale.y = .8; p.position.set(x, .22, z); decor.add(p); (decor.userData.glow = decor.userData.glow || []).push(p.material); };
  if(m === 9 && day >= 20 || (m === 10 && day === 1)){ NORTH.forEach(x => pumpkin(x + 1.6, 10.6)); SOUTH.forEach(x => x === 0 ? 0 : pumpkin(x + 1.6, 37.4)); pumpkin(1.4, 6.6); pumpkin(-1.4, 6.6); }
  if(m === 11){ const cols = [0xff3030, 0x30ff60, 0x3070ff, 0xffd030]; [...NORTH.map(x => [x, 10.7]), ...SOUTH.filter(x => x).map(x => [x, 37.3]), [0, 4.3]].forEach(([x, z]) => { for(let i = 0; i < 11; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), new THREE.MeshBasicMaterial({ color:cols[i % 4] })); b.position.set(x - 5 + i, 3.15, z); decor.add(b); } });
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), new THREE.MeshBasicMaterial({ map:E.label('HAPPY HOLIDAYS FROM SCHNUCKS', { bg:'#1a6a2a', fg:'#fff', size:40, w:768, h:110 }) })); ban.position.set(295, 6.6, 180.8); ban.rotation.y = Math.PI; decor.add(ban); }
  if(m === 10 && day >= 20 && day <= 28){ for(let i = 0; i < 12; i++){ const t = new THREE.Mesh(new THREE.BoxGeometry(.6, .35, .5), E.mat('#a8743a')); t.position.set(282 - (i % 4) * .65, .18 + (i / 4 | 0) * .36, 172); decor.add(t); }
    const tb = new THREE.Mesh(new THREE.PlaneGeometry(3, .7), new THREE.MeshBasicMaterial({ map:E.label('TURKEYS 59¢/LB', { bg:'#8a3a1a', fg:'#fff', size:44, w:384, h:90 }) })); tb.position.set(281, 2.2, 172.4); decor.add(tb); }
  windows(G.time); }

// ---------- newspaper ----------
const HEAD = [['RAMS WIN IN OVERTIME, BULGER SHINES'], ['CITY COUNCIL DEBATES NEW STOPLIGHT ON MAIN'], ['LOCAL BAKERY WINS COUNTY FAIR RIBBON'], ['GAS PRICES CREEP UP AGAIN'], ['BLUES OPEN SEASON AT HOME'], ['SWANSEA PLANS NEW BIKE PATH'], ['HOMECOMING PARADE ROUTE ANNOUNCED'], ['CARDINALS FANS STILL HURTING AFTER SEASON'], ['NEW VIDEO GAME STORE RUMORED FOR PLAZA'], ['STUDENTS RAISE $2,000 FOR FOOD PANTRY']];
const ADS = [['2-LITERS', '99¢'], ['FROZEN PIZZA', '2/$7'], ['BANANAS', '39¢/LB'], ['CEREAL', '$1.99'], ['GROUND BEEF', '$1.69/LB'], ['CHIPS', '2/$5'], ['ICE CREAM', '$2.50']];
const TV = [['7:00', 'Game show reruns'], ['7:30', 'Sitcom double feature'], ['8:00', 'Prime-time drama'], ['8:00', 'Monday night football'], ['9:00', 'Reality TV marathon'], ['9:00', 'Movie of the week'], ['10:00', 'Local news'], ['10:35', 'Late-night talk show']];
function paper(){ return new Promise(res => { const l = api.L(), dc = l.dayCount || 0, d = dateOf(dc), jobs = jobsFor(dc); G.uiOpen = true; E.cut(true);
  const pick = (a, n, s) => { const out = []; for(let i = 0; out.length < n && i < 40; i++){ const v = a[Math.floor(rnd(s + i * 3.1) * a.length)]; if(!out.includes(v)) out.push(v); } return out; };
  const hd = pick(HEAD, 3, dc), ad = pick(ADS, 3, dc + 50), tv = pick(TV, 4, dc + 90).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  const extra = d.getMonth() === 9 && d.getDate() >= 24 ? ['HALLOWEEN: TRICK-OR-TREAT 6–8 PM FRIDAY'] : d.getMonth() === 10 && d.getDate() >= 20 && d.getDate() <= 27 ? ['SCHNUCKS: ORDER YOUR THANKSGIVING TURKEY'] : d.getMonth() === 11 ? ['HOLIDAY LIGHTS CONTEST ON OAKMONT'] : [];
  const el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:6vh 8vw;background:#f4efe2;color:#1a1a1a;border:3px solid #2a2a2a;z-index:40;padding:18px 26px;font-family:Georgia,serif;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.5)';
  el.innerHTML = `<div style="text-align:center;font-size:42px;font-weight:bold;letter-spacing:2px;border-bottom:3px double #1a1a1a">THE BELLEVILLE DAILY</div>
  <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0 12px">${['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, 2003<span>50¢</span></div>
  <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px"><div>${[...extra, ...hd.map(h => h[0])].map((h, i) => `<div style="font-size:${i ? 17 : 24}px;font-weight:bold;margin-bottom:8px">${h}</div>`).join('')}
  <div style="margin-top:14px;border-top:1px solid #999;padding-top:8px"><b>CLASSIFIEDS — HELP WANTED</b>${jobs.map((j, i) => `<div style="margin-top:6px">[${i + 1}] <b>${j.title}</b> — ${j.blurb} <i>Pays ${api.money(j.pay)}.</i></div>`).join('')}<div style="font-size:12px;color:#555;margin-top:6px">Press 1 or 2 to take a job.</div></div></div>
  <div><div style="border:2px solid #1a1a1a;padding:8px;margin-bottom:12px"><b>WEATHER</b><br>Today: ${WX_NAME[weatherFor(dc)]}<br>Tomorrow: ${WX_NAME[weatherFor(dc + 1)]}</div>
  <div style="border:2px solid #b3202a;padding:8px;margin-bottom:12px;color:#b3202a"><b>SCHNUCKS WEEKLY AD</b>${ad.map(a => `<div style="display:flex;justify-content:space-between;color:#1a1a1a"><span>${a[0]}</span><b>${a[1]}</b></div>`).join('')}</div>
  <div style="border:2px solid #1a1a1a;padding:8px"><b>TV TONIGHT</b>${tv.map(t => `<div>${t[0]} PM — ${t[1]}</div>`).join('')}</div></div></div>
  <div style="text-align:center;font-size:12px;margin-top:14px;color:#555">E / ESC — fold the paper</div>`;
  document.body.appendChild(el);
  const close = () => { removeEventListener('keydown', key, true); el.remove(); G.uiOpen = false; E.cut(false); res(); };
  const key = e => { e.stopImmediatePropagation(); e.preventDefault(); if(['KeyE', 'Escape', 'Enter'].includes(e.code)) close(); const n = e.code === 'Digit1' ? 0 : e.code === 'Digit2' ? 1 : -1; if(n >= 0 && jobs[n]){ close(); startJob(jobs[n]); } };
  addEventListener('keydown', key, true); }); }

// ---------- side jobs ----------
const JOBS = { mow:{ title:'LAWN MOWING', blurb:'Mr. Davis on Oakmont needs his front lawn cut.', pay:12 }, walk:{ title:'DOG WALKER', blurb:'Linda needs Buster walked to Elmwood Park and back.', pay:8 },
  lost:{ title:'LOST DOG: BISCUIT', blurb:'Small tan terrier. Reward for return to Gary on Oakmont.', pay:15 }, deliver:{ title:'GROCERY DELIVERY', blurb:'Pick up Doris’s order at Schnucks customer service.', pay:10 },
  rake:{ title:'LEAF RAKING', blurb:'Front yard on Oakmont is buried in leaves.', pay:10 } };
export function jobsFor(dc){ const m = dateOf(dc).getMonth(), keys = Object.keys(JOBS).filter(k => k !== 'rake' || m === 9 || m === 10); const a = keys[Math.floor(rnd(dc + 11) * keys.length)]; let b = keys[Math.floor(rnd(dc + 23) * keys.length)]; if(b === a) b = keys[(keys.indexOf(a) + 1) % keys.length]; return [a, b].map(k => ({ k, ...JOBS[k] })); }
let job = null;
function clearJob(){ if(!job) return; (job.objs || []).forEach(o => G.scene.remove(o)); (job.npcs || []).forEach(n => n.remove()); (job.inters || []).forEach(E.delInter); if(job.mk) E.clearMarker(job.mk); if(G.carry === job.carry) G.carry = null; E.setWay(); E.obj(''); job = null; }
function finishJob(){ const j = job, l = api.L(); clearJob(); l.cash += j.pay; if(j.k === 'deliver') l.rep = Math.min(100, (l.rep ?? 50) + 3); api.save(); E.sfx('pass'); E.toast(`JOB DONE: ${j.title} · +${api.money(j.pay)}`, 3200); }
const stepTo = (x, z, text) => { if(job.mk) E.clearMarker(job.mk); job.mk = E.marker(x, z, 0x7ee0ff); E.setWay(x, z); job.target = { x, z }; E.obj(text); };
export function startJob(j){ if(job){ E.toast('Finish your current job first.', 2200); return; } job = { ...j, objs:[], npcs:[], inters:[], step:0 }; E.sfx('ok');
  if(j.k === 'mow'){ const owner = E.npc('Mr. Davis', { shirt:'#8a8a6a', pants:'#4a4a3a', hair:'#c8c8c8', hairStyle:'short', top:'polo' }, -146, 13); owner.look(-150, 20); job.npcs.push(owner);
    const tufts = []; for(let i = 0; i < 8; i++){ const t = new THREE.Mesh(new THREE.ConeGeometry(.35, .5, 5), E.mat('#5a9a3a')); t.position.set([-156, -153.6, -146.4, -144][i % 4], .25, i < 4 ? 12.4 : 15.4); G.scene.add(t); job.objs.push(t); tufts.push(t); }
    const mower = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(.6, .3, .7), E.mat('#c8202a')); body.position.y = .3; const hd = new THREE.Mesh(new THREE.BoxGeometry(.5, .05, .05), E.mat('#222')); hd.position.set(0, 1, -.55); mower.add(body, hd); G.scene.add(mower); job.objs.push(mower);
    job.carry = G.carry = () => { G.pushN = 1; const a = P.model.rotation.y; mower.position.set(P.p.x + Math.sin(a) * .9, P.p.y, P.p.z + Math.cos(a) * .9); mower.rotation.y = a; for(const t of tufts) if(t.visible && (Math.hypot(t.position.x - mower.position.x, t.position.z - mower.position.z) < 1.3 || Math.hypot(t.position.x - P.p.x, t.position.z - P.p.z) < 1.1)){ t.visible = false; E.sfx('cart'); } };
    job.check = () => tufts.every(t => !t.visible); stepTo(-150, 13.9, 'MOW ALL 8 PATCHES OF TALL GRASS IN MR. DAVIS’S FRONT YARD.'); }
  if(j.k === 'rake'){ const piles = []; for(let i = 0; i < 6; i++){ const p = new THREE.Mesh(new THREE.ConeGeometry(.6, .35, 7), E.mat('#c8641e')); p.position.set(62 + (i % 3) * 2.6, .17, 10 + (i / 3 | 0) * 2.4); G.scene.add(p); job.objs.push(p); piles.push(p);
      job.inters.push(E.addInter({ x:p.position.x, z:p.position.z, r:1.5, prompt:'RAKE THE LEAVES', when:() => p.visible, use:() => { p.visible = false; api.passTime(5); E.sfx('cart'); } })); }
    job.check = () => piles.every(p => !p.visible); stepTo(64.6, 11.2, 'RAKE ALL 6 LEAF PILES.'); }
  if(j.k === 'walk'){ const owner = E.npc('Linda', { shirt:'#a8557a', pants:'#334', hair:'#7a4a2a', hairStyle:'pony', top:'track', bottom:'track', lips:'#b5505a' }, 45, 12.5); job.npcs.push(owner);
    const dog = E.npc('Buster', { dog:true, color:'#6a4a2a', dark:'#2a1a0a', size:1.1 }, 46, 13.5, { speed:5 }); job.npcs.push(dog); dog.follow(P, 1.6, 6.5); job.leg = 0; stepTo(-80, 70, 'WALK BUSTER TO ELMWOOD PARK.');
    job.check = () => { if(job.leg === 0 && Math.hypot(P.p.x + 80, P.p.z - 70) < 4){ job.leg = 1; stepTo(45, 14, 'BRING BUSTER BACK TO LINDA.'); E.sfx('bark'); } return job.leg === 1 && Math.hypot(P.p.x - 45, P.p.z - 14) < 3; }; }
  if(j.k === 'lost'){ const spots = [[-315, -620], [225, 190], [-62, 84], [124, 186]], s = spots[Math.floor(Math.random() * spots.length)];
    const dog = E.npc('Biscuit', { dog:true, color:'#c9a26b', dark:'#6a4a2a', size:.7 }, s[0], s[1], { speed:5.5 }); job.npcs.push(dog); const owner = E.npc('Gary', { shirt:'#5a6a4a', pants:'#3a3a3a', hair:'#4a3a2a', beard:'#4a3a2a', wide:1.15 }, 120, 36.5); job.npcs.push(owner);
    job.leg = 0; E.obj('FIND BISCUIT. Gary heard barking near ' + ['the high school', 'the plaza', 'Elmwood Park', 'Maple Street'][spots.indexOf(s)] + '.'); E.setWay(s[0], s[1]);
    job.check = () => { if(job.leg === 0 && Math.hypot(P.p.x - dog.p.x, P.p.z - dog.p.z) < 2.5){ job.leg = 1; dog.follow(P, 1.5, 6.5); E.sfx('bark'); stepTo(120, 37.5, 'BRING BISCUIT HOME TO GARY.'); } return job.leg === 1 && Math.hypot(P.p.x - 120, P.p.z - 37.5) < 3; }; }
  if(j.k === 'deliver'){ job.leg = 0; stepTo(G.custService.x, G.custService.z, 'PICK UP DORIS’S GROCERIES AT SCHNUCKS CUSTOMER SERVICE.');
    job.check = () => { if(job.leg === 0 && Math.hypot(P.p.x - G.custService.x, P.p.z - G.custService.z) < 2.2){ job.leg = 1; const bag = new THREE.Mesh(new THREE.BoxGeometry(.35, .4, .25), E.mat('#c9a878')); bag.position.set(.12, -.55, .14); P.model.userData.aR.userData.el.add(bag); job.bag = bag; stepTo(91, 103, 'DELIVER THE GROCERIES TO DORIS ON MAPLE.'); E.sfx('ok'); }
      if(job.leg === 1 && job.bag && !job.bag.parent) P.model.userData.aR.userData.el.add(job.bag); const done = job.leg === 1 && Math.hypot(P.p.x - 91, P.p.z - 103) < 3; if(done && job.bag) job.bag.parent && job.bag.parent.remove(job.bag); return done; }; }
  E.toast(`JOB TAKEN: ${j.title}`, 2400); }

// ---------- friends: schedule, hangouts, plans, ragers, AIM ----------
const FRIENDS = { Zeke:'sk8rzeke03', Jax:'jaxattack', Matt:'mattdaman15', Milo:'m1lo_the_brain' };
const PLACES = { 'Elmwood Park':[-80, 72], 'the plaza (Video World)':[374, 180.5], 'the Schnucks lot':[304, 226], 'your house':[0, 9] };
function schedule(l){ const d = dateOf(l.dayCount).getDay(), wk = d > 0 && d < 6, t = l.min, wet = G.wet, out = []; if(G.flags.GROUNDING_ACTIVE) return out; // Draft #2: grounded after M08 — school, home, work only
  if(wk && t >= 930 && t < 1110) out.push(['Zeke', wet ? [374, 180.5] : [-82, 68]]); if(!wk && t >= 720 && t < 1020) out.push(['Jax', [376, 180.5]]); if(wk && t >= 1080 && t < 1200) out.push(['Jax', [-78, 72]]);
  if(!wk && t >= 840 && t < 1080) out.push(['Matt', [304, 226]]); if(wk && t >= 1020 && t < 1140) out.push(['Milo', [195, 171.5]]); return out; }
const TALK = { Zeke:[['Zeke', 'Bro I almost landed a kickflip today. Almost.'], ['Zeke', 'Journeys made me wear the shirt tucked in. TUCKED IN, Chris.'], ['Zeke', 'You think if I eat enough Hot Pockets I get powers?']],
  Jax:[['Jax', 'My friend is throwing a rager Friday. You coming or are you working, like always?'], ['Jax', 'You look tired. Did Eric make you push carts in the rain again?'], ['Jax', 'I’m thinking about getting frosted tips. Don’t laugh.']],
  Matt:[['Matt', 'YOOOO. Wanna see me ride a cart down the hill?'], ['Matt', 'My mom’s been in Schnucks for an HOUR. For milk.'], ['Matt', 'I burned a CD with 80 songs on it. It skips on every single one.']],
  Milo:[['Milo', 'Do you even know what a DBQ is?'], ['Milo', 'I already finished next week’s homework. Don’t ask.'], ['Milo', 'General Tso’s chicken is the only thing keeping me sane.']] };
const ACT = { Zeke:['Skate with Zeke (needs your board)', 45, 'We skated until Zeke ate it on the curb. He says it didn’t hurt. It hurt.'], Jax:['Grab food at China Garden ($5.95)', 40, 'Jax ordered the spiciest thing on the menu to prove a point. He cried. Point not proven.'],
  Matt:['Cart surf the Schnucks lot', 20, 'Matt rode a cart into a light pole. Ryan saw. Nobody tell Eric.'], Milo:['Get homework help', 60, 'Milo explained DBQs. I understood about 30 percent. That’s a personal best.'] };
async function hangout(name, bonus){ const l = api.L(); if(G.flags.GROUNDING_ACTIVE){ await E.say([['', 'Dad would kill me if I left...']]); return; } l.fr = l.fr || {}; E.cut(true); if(bonus) await E.say([[name, 'Oh you actually showed up. Look at you.']]); const t = TALK[name][Math.random() * 3 | 0]; await E.say([t, ['Chris', ['Classic.', 'Dude.', 'No way.', 'Sure, man.'][Math.random() * 4 | 0]]]);
  const a = ACT[name], k = await E.choose([a[0], 'Just talk', 'Catch you later']);
  if(k === 0){ if(name === 'Zeke' && !l.owned?.includes('board')){ await E.say([['Zeke', 'Where’s your board, bro? Grab it off your porch.']]); }
    else if(name === 'Jax' && !api.pay(5.95)){ } else { await E.fade(true, 400); api.passTime(a[1]); await E.fade(false, 400); await E.say([['', a[2]]]); l.fr[name] = (l.fr[name] || 0) + 3; } }
  else if(k === 1){ api.passTime(15); l.fr[name] = (l.fr[name] || 0) + 1; await E.say([TALK[name][(Math.random() * 3 | 0)]]); }
  api.save(); E.cut(false); }
async function makePlans(){ const l = api.L(); if(G.flags.GROUNDING_ACTIVE){ await E.say([['', 'Dad would kill me if I left...']]); return; } if(grounded(l)){ await E.say([['', 'Dad took the phone. Grounded. Great.']]); return; } const names = Object.keys(FRIENDS); const w = await E.choose([...names.map(n => 'Call ' + n), 'Never mind']); if(w >= names.length) return;
  const places = Object.keys(PLACES); const p = await E.choose(places); const tms = [['In an hour', 60], ['Tonight at 7', null], ['Tomorrow at 4 PM', 'tmr']], t = await E.choose(tms.map(x => x[0]));
  const now = absNow(l); let at = t === 0 ? now + 60 : t === 1 ? (l.dayCount || 0) * 1440 + 19 * 60 : ((l.dayCount || 0) + 1) * 1440 + 16 * 60; if(t === 1 && at < now) at += 1440;
  l.plan = { who:names[w], place:places[p], at }; api.save(); for(let i = 0; i < 2; i++){ E.sfx('ring'); await E.wait(700); } await E.say([[names[w] + ' (phone)', ['Bet. See you there.', 'Fine. Don’t be late.', 'YES. Okay. Yes.', 'If I must.'][w]]]); }
async function aim(){ const l = api.L(); l.fr = l.fr || {}; const on = Object.keys(FRIENDS).filter(n => l.min > 900 && l.min < 1410 && rnd(absNow(l) / 97 + n.length) > .3);
  E.sfx('door'); const opts = Object.keys(FRIENDS).map(n => `${FRIENDS[n]} ${on.includes(n) ? '● online' : '(away)'}`); const k = await E.choose([...opts, 'Sign off']); if(k >= opts.length){ E.sfx('door'); return; }
  const n = Object.keys(FRIENDS)[k], sn = FRIENDS[n]; if(!on.includes(n)){ await E.say([[sn + ' (away)', ['skatin. leave a msg', 'at work. kill me', 'homework. go away', 'eating. brb'][k]]]); return; }
  const fri = dateOf(l.dayCount).getDay() === 5, flake = l.flaked === n;
  const msg = flake ? `u flaked on me yesterday. not cool` : fri && n === 'Jax' ? `rager 2nite on maple. 9pm. u in?` : TALK[n][Math.random() * 3 | 0][1].toLowerCase();
  E.tone(880, 0, .08, 'sine', .04); await E.say([[sn, msg]]); const r = await E.choose(flake ? ['my bad dude', 'i was busy'] : ['lol', 'wanna hang out?', 'brb']);
  if(flake){ l.flaked = null; if(r === 0){ l.fr[n] = (l.fr[n] || 0) + 1; await E.say([[sn, 'its fine. just dont do it again']]); } else await E.say([[sn, 'busy doin what. pushing carts?']]); }
  else if(r === 1){ await E.say([[sn, 'sure. call me']]); } else if(r === 0){ l.fr[n] = (l.fr[n] || 0) + 1; await E.say([[sn, ['lmao', 'haha ya', 'lol ok', ':P'][k]]]); }
  api.save(); }
// fines come straight out of Chris's cash; if he is short he owes the rest (cash goes negative until the next paycheck covers it)
const watch = {};
function fine(n, why){ const l = api.L(); if(G.t - (fine.t || -9) < 2.5) return; fine.t = G.t; l.cash -= n; api.save(); E.sfx('miss'); E.tone(880, 0, .18, 'square', .05); E.tone(660, .2, .22, 'square', .05); E.toast(`<b>${why}</b> &nbsp;−$${n.toFixed(2)}` + (l.cash < 0 ? `<br>You are broke. You owe Dad $${(-l.cash).toFixed(2)}.` : ''), 4200); }
G.onCrash = av => { if(G.mission || !api || av < 8 || G.t - (G.onCrash.t || -99) < 10) return; G.onCrash.t = G.t; fine(Math.min(60, Math.round(av * 2.5)), 'CRASH: body shop bill'); };
// GAME ORIGINAL: what the walk-in shops sell. [item, price, Chris's take, minutes it takes (meals), fills stamina]
const SHOPS = {
  'WALGREENS':{ who:'Cashier', hi:'Find everything okay?', items:[['Bottle of soda', .99, 'Cold. Fizzy. Gone in four seconds.', 0, 1], ['Candy bar', .65, 'Breakfast of champions.', 0, 1], ['Pack of gum', .35, 'Winterfresh. I am now unstoppable.'], ['Disposable camera', 6.99, '27 exposures. I will waste 20 of them on Pepper.'], ['Birthday card', 1.99, 'Somebody always has a birthday. Now I am ready.'], ['AA batteries', 3.49, 'For the remote. And the other remote.']] },
  'MOTO MART':{ who:'Clerk', hi:'Pump or just snacks?', items:[['44 oz fountain soda', .89, 'This cup is the size of my head.', 0, 1], ['Hot dog off the roller', 1.29, 'It has been rolling since 1998. Still good.', 0, 1], ['Slushie', .99, 'Brain freeze. Worth it.', 0, 1], ['Beef jerky', 2.49, 'Chewing this is a part-time job.', 0, 1]] },
  "STEAK 'N SHAKE":{ who:'Server', hi:'Welcome in. What can I get you?', items:[['Steakburger and fries', 3.99, 'Thin fries. Thin burger. Somehow perfect.', 25, 1], ['Chili', 2.29, 'Chili in a diner at any hour. America.', 15, 1], ['Chocolate shake', 2.49, 'They give you the extra in the metal cup. Respect.', 10, 1]] },
  'WHITE CASTLE':{ who:'Cashier', hi:'Welcome to White Castle.', items:[['Sack of 10 sliders', 4.90, 'I regret nothing. Yet.', 20, 1], ['4 sliders', 1.96, 'A responsible amount of sliders.', 12, 1], ['Onion chips', 1.09, 'My breath is a weapon now.', 5, 1]] },
  "IMO'S PIZZA":{ who:'Counter Guy', hi:'Pick-up or eating here?', items:[['Small pizza', 6.50, 'Square slices. Cracker crust. Provel. This is how pizza works here.', 30, 1], ['Toasted ravioli', 3.99, 'If you are not from here you would not get it.', 15, 1], ['Fountain drink', .99, 'Refills are free and I intend to prove it.', 5, 1]] },
  "HARDEE'S":{ who:'Cashier', hi:'Hi, what can I get started for you?', items:[['Burger combo', 4.59, 'That burger had its own gravity.', 20, 1], ['Curly fries', 1.39, 'The curly ones just taste better. Science.', 8, 1], ['Biscuit and gravy', 1.49, 'Breakfast all day should be a law.', 10, 1]] },
  'DAIRY QUEEN':{ who:'Cashier', hi:'Hi there! What sounds good?', items:[['Blizzard', 2.39, 'They flipped it upside down. It stayed. Witchcraft.', 10, 1], ['Dipped cone', 1.19, 'Ate the shell first. As is tradition.', 6, 1], ['Chili dog', 1.59, 'A chili dog from an ice cream place. Bold. Good.', 10, 1]] },
  'BELLEVILLE PANCAKE HOUSE':{ who:'Waitress', hi:'Sit anywhere, hon. What are we having?', items:[['Short stack', 3.25, 'Three pancakes. More syrup than pancake.', 25, 1], ['Big breakfast', 5.25, 'Eggs, bacon, hash browns, toast. I need a nap.', 35, 1], ['Coffee', .95, 'I do not even like coffee. I feel very grown up.', 8]] },
  'FIRST NATIONAL BANK':{ who:'Teller', hi:'Good afternoon. How can I help you?' } };
let shopN = [];
async function useShop(s){ const c = SHOPS[s.name], l = api.L(); if(!c) return; E.cut(true); await E.say([[c.who, c.hi]]);
  if(s.kind === 'bank'){ for(;;){ l.bank = l.bank || 0; const k = await E.choose(['Deposit $20', 'Deposit all my cash', 'Withdraw $20', 'Withdraw everything', 'Leave']); if(k === 4) break; const amt = k === 0 ? 20 : k === 1 ? Math.max(0, l.cash) : k === 2 ? Math.min(20, l.bank) : l.bank;
      if(k < 2){ if(amt <= 0 || l.cash < amt){ await E.say([[c.who, 'You do not have that much on you.']]); continue; } l.cash -= amt; l.bank += amt; } else { if(amt <= 0){ await E.say([[c.who, 'There is nothing in the account to withdraw.']]); continue; } l.bank -= amt; l.cash += amt; }
      api.save(); E.sfx('ok'); await E.say([[c.who, `All set. Your savings balance is ${api.money(l.bank)}.`]]); } E.cut(false); return; }
  for(;;){ const k = await E.choose([...c.items.map(i => `${i[0]} · ${api.money(i[1])}`), 'Leave']); if(k >= c.items.length) break; const it = c.items[k]; if(!api.pay(it[1])) break;
    if(it[3]){ await E.fade(true, 400); api.passTime(it[3]); await E.fade(false, 400); } if(it[4]){ P.stam = 1; P.tired = false; } await E.say([['', it[2]]]); if(s.kind === 'diner') break; }
  E.cut(false); }
function grounded(l){ return l.groundedDay != null && l.groundedDay === (l.dayCount || 0); }

// ---------- PS2 + games (sold at Video World) ----------
const GAMES = [['PlayStation 2 console', 199.99, 'ps2'], ['Madden NFL 2004', 49.99, 'madden'], ['GTA: Vice City', 49.99, 'vc'], ['Tony Hawk’s Pro Skater 4', 19.99, 'thps4'], ['SSX Tricky', 19.99, 'ssx'], ['Need for Speed: Hot Pursuit 2', 19.99, 'nfs']];
const PLAY = { madden:'Ran the same play 40 times. It worked 40 times.', vc:'Stole a car, drove it into the ocean, did it again. Educational.', thps4:'Landed a 900. Screamed. Mom yelled up the stairs.', ssx:'Won the race by doing a trick off a helicopter. Realistic.', nfs:'Got away from the cops by driving through a gas station. Respect.' };
async function shopGames(){ const l = api.L(); l.owned = l.owned || []; const list = GAMES.filter(g => !l.owned.includes(g[2]));
  if(!list.length){ await E.say([['Clerk', 'Dude, you own literally everything we have.']]); return; }
  const k = await E.choose([...list.map(g => `${g[0]} — ${api.money(g[1])}`), 'Never mind']); if(k >= list.length) return;
  if(list[k][2] !== 'ps2' && !l.owned.includes('ps2')) await E.say([['Clerk', 'You know you need a PS2 for that, right?']]);
  if(api.pay(list[k][1])){ l.owned.push(list[k][2]); api.save(); await E.say([['Clerk', list[k][2] === 'ps2' ? 'Welcome to the future, man.' : 'Good pick.']]); } }
async function playPS2(){ const l = api.L(), games = GAMES.filter(g => g[2] !== 'ps2' && l.owned.includes(g[2])); if(!games.length){ await E.say([['', 'A PS2 and zero games. Smart.']]); return false; }
  const k = await E.choose([...games.map(g => g[0]), 'Never mind']); if(k >= games.length) return false; const id = games[k][2], sc = await ({ thps4:() => playRunner({ title:'SKATE JAM' }), ssx:() => playRunner({ title:'SNOW JAM', skin:'snow' }), nfs:() => playDodge({ title:'HIGHWAY RUN' }), vc:() => playDodge({ title:'CITY CRUISE' }), madden:() => playMeter({ kind:'kick' }) })[id]();
  l.hi = l.hi || {}; const best = sc > (l.hi[id] || 0); if(best) l.hi[id] = sc; api.passTime(60); api.save(); E.toast(`${PLAY[id]}<br>SCORE ${sc}${best ? ' · NEW BEST' : ' · best ' + l.hi[id]} · an hour went by`, 4200); return true; }

// ---------- gas station (west end of the plaza lot) ----------
function gasStation(){ const pad = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), E.mat('#9a9890')); pad.rotation.x = -Math.PI / 2; pad.position.set(428, .03, 236); addObj(pad); E.mapRect(413, 224, 443, 248, '#7a7870');
  const can = mesh(new THREE.BoxGeometry(20, .6, 10), E.mat('#f2f2ee'), 428, 5.2, 236); const band = mesh(new THREE.BoxGeometry(20.2, .5, 10.2), E.mat('#1f4aa8'), 428, 4.75, 236);
  [[437, 240], [419, 240], [437, 232], [419, 232]].forEach(([x, z]) => { mesh(new THREE.BoxGeometry(.4, 5, .4), E.mat('#f2f2ee'), x, 2.5, z); G.colliders.push({ x0:x - .25, x1:x + .25, z0:z - .25, z1:z + .25, y0:0, y1:5 }); });
  [[432, 236], [424, 236]].forEach(([x, z]) => { mesh(new THREE.BoxGeometry(1, 1.8, .7), E.mat('#d8d8d0'), x, .9, z); mesh(new THREE.PlaneGeometry(.7, .4), new THREE.MeshBasicMaterial({ color:0x2a6a3a }), x, 1.4, z - .36).rotation.y = Math.PI; G.colliders.push({ x0:x - .55, x1:x + .55, z0:z - .4, z1:z + .4, y0:0, y1:1.8 }); });
  const kiosk = mesh(new THREE.BoxGeometry(8, 3.2, 5), E.mat('#e8e2d0'), 428, 1.6, 226); G.colliders.push({ x0:424, x1:432, z0:223.5, z1:228.5, y0:0, y1:3.2 });
  const sg = mesh(new THREE.PlaneGeometry(6, .9), new THREE.MeshBasicMaterial({ map:E.label('GAS · FOOD · ICE', { bg:'#1f4aa8', fg:'#fff', size:56, w:512, h:80 }) }), 428, 2.8, 228.55);
  const pole = mesh(new THREE.BoxGeometry(.3, 6, .3), E.mat('#777'), 442, 3, 246); const ps = mesh(new THREE.BoxGeometry(2.4, 1.6, .2), new THREE.MeshBasicMaterial({ map:E.label(['UNLEADED', '$1.59⁹'], { bg:'#1a1a1a', fg:'#ffd030', size:44, w:256, h:170 }) }), 442, 6.4, 246);
  [[432, 237.4], [424, 237.4]].forEach(([x, z]) => api.add({ x, z, r:2, prompt:'FILL UP THE TANK', when:() => !G.mission && G.ctl && !G.driving && !G.uiOpen && G.chrisCar && Math.hypot(G.chrisCar.position.x - x, G.chrisCar.position.z - z) < 7,
    use:async () => { const need = Math.max(0, 10 - G.gas), cost = Math.round(need * 1.599 * 100) / 100; if(need < .2){ E.toast('Tank’s already full.', 2000); return; } if(api.pay(cost)){ G.gas = 10; api.L().gas = 10; api.save(); E.toast(`Filled up: ${need.toFixed(1)} gal for ${api.money(cost)}.`, 2600); } } })); }

// ---------- switch on ----------
export function extrasOn(a){ api = a; objs.forEach(o => G.scene.remove(o)); objs = []; spawned = {}; clearJob(); const l = api.L();
  l.rep = l.rep ?? 50; l.owned = l.owned || []; G.gas = l.gas ?? 7.5; G.LIFE_API = api;
  shopN.forEach(n => n.remove()); shopN = (G.shops || []).filter(s => SHOPS[s.name]).map((s, i) => { api.add({ x:s.at[0], z:s.at[1], r:1.9, prompt:s.kind === 'bank' ? 'TALK TO THE TELLER' : s.kind === 'diner' ? 'ORDER FOOD' : 'BUY SOMETHING', use:() => useShop(s) });
    return E.npc(SHOPS[s.name].who, api.randomLook(i % 2 === 0), s.clerk[0], s.clerk[1], { face:s.face, y:G.terrain ? G.terrain(s.clerk[0], s.clerk[1]) : 0 }); });
  api.onOff(() => { shopN.forEach(n => n.remove()); shopN = []; });
  G.ext = { makePlans, aim, shopGames, playPS2, owned:k => (l.owned || []).includes(k), grounded:() => grounded(l), paper };
  // skateboard on the porch (free) — B hops on/off once you own it
  const board = mesh(new THREE.BoxGeometry(.26, .05, .82), E.mat('#2a2a2a'), 2.2, .4, 5.6); board.rotation.y = .4; board.visible = !l.owned.includes('board');
  api.add({ x:2.2, z:6.2, r:1.4, prompt:'GRAB YOUR SKATEBOARD', when:() => !G.mission && G.ctl && !l.owned.includes('board'), use:() => { l.owned.push('board'); board.visible = false; api.save(); E.toast('Skateboard! Press B to hop on or off.', 3200); E.sfx('ok'); } });
  api.add({ x:1.2, z:9.2, r:1.6, prompt:'READ THE NEWSPAPER', when:() => !G.mission && G.ctl && !G.uiOpen && l.min >= 300 && l.min < 1200, use:paper });
  api.add({ x:G.timeClock.x, z:G.timeClock.z - 1.6, r:1.4, prompt:'CHECK THE WORK SCHEDULE', use:async () => { E.cut(true); const r = l.rep ?? 50;
    await E.say([['', `Posted by Eric: ${r >= 90 ? 'CHRIS — SHIFT LEAD TRAINEE. $8.25/hr. (Who is this?)' : r >= 75 ? 'CHRIS — on the good list. Raise to $7.75/hr.' : r >= 40 ? 'CHRIS — $7.25/hr. Carts. As usual.' : r >= 25 ? 'CHRIS — final warning. Carts only.' : 'CHRIS — WRITTEN UP. $7.00/hr until you shape up.'}`], ['', `Reputation with Eric: ${Math.round(r)}/100`]]); E.cut(false); } });
  gasStation();
  api.add({ x:1.2, z:6.9, r:1.6, prompt:'HAND OUT CANDY', when:() => { const d = dateOf(l.dayCount); return !G.mission && G.ctl && d.getMonth() === 9 && d.getDate() === 31 && l.min >= 1080 && l.min < 1260; }, use:async () => { E.cut(true); await E.say([['Trick-or-treaters', 'TRICK OR TREAT!'], ['Chris', 'One each. ONE. ...Fine, take two.']]); api.passTime(10); E.cut(false); } });
  api.add({ x:-4.1, z:-5.2, r:1.8, prompt:'THANKSGIVING DINNER', when:() => { const d = dateOf(l.dayCount); return !G.mission && G.ctl && d.getMonth() === 10 && d.getDate() === 27 && l.min >= 900 && l.min < 1200 && !l.tg; }, use:async () => { l.tg = true; E.cut(true); await E.fade(true, 500); await E.card('THANKSGIVING', 'THE FAMILY TABLE', 1600); await E.fade(false, 500);
    await E.say([['Mom', 'Chrissy, say what you are thankful for.'], ['Chris', 'Pepper. Video games. Not being at work.'], ['Dad', 'He is thankful for his job.'], ['Chris', 'I said what I said.'], ['Mom', 'Grandma sent you twenty dollars. Do not spend it all at the video store.']]);
    l.cash += 20; api.passTime(90); api.save(); E.cut(false); } });
  // seasons / weather / decor on the current day
  lastDay = -1; if(!rain) rain = makeRain();
  G.onTime = k => { applyWeather(); windows(k); };
  const tick = dt => { if(G.mission) { if(rain) rain.visible = false; return; } const dc = l.dayCount || 0;
    if(dc !== lastDay){ lastDay = dc; G.wx = weatherFor(dc); leaves(dc); buildDecor(dc); E.setTime(G.time || 'day'); G.dayShift = dateOf(dc).getMonth() >= 10 || (dateOf(dc).getMonth() === 9 && dateOf(dc).getDate() >= 26) ? 60 : 0;
      if(l.groundedDay === dc) E.toast('GROUNDED TODAY: no phone, no car.', 3600); }
    // rain / snow particles around the camera (hidden indoors)
    const wet = G.wet, ind = indoors(); G.indoors = ind; rain.visible = wet && !ind; if(rain.visible){ const a = rain.geometry.attributes.position.array, sp = G.wx === 'snow' ? 3 : 22, c = G.cam.position;
      for(let i = 0; i < a.length; i += 3){ a[i + 1] -= sp * dt; if(G.wx === 'snow') a[i] += Math.sin(G.t + i) * dt * .4; if(a[i + 1] < 0) a[i + 1] += 30; } rain.position.set(c.x, c.y - 12, c.z); rain.geometry.attributes.position.needsUpdate = true; }
    if(G.wx === 'storm' && !ind && (thunderT -= dt) <= 0){ thunderT = 15 + Math.random() * 25; const h = G.hemi, i0 = h.intensity; h.intensity = 2.4; setTimeout(() => h.intensity = i0, 120); E.tone(55, .4, 1.6, 'sawtooth', .06, 30); }
    // curfew: 11 PM Sun–Thu, 12:30 AM Fri/Sat
    const dow = dateOf(dc).getDay(), cf = dow === 5 || dow === 6 ? 1470 : 1380, t = l.min < 360 ? l.min + 1440 : l.min, home = P.p.x > -8 && P.p.x < 8 && P.p.z > -12 && P.p.z < 4;
    if(!l.late && t >= cf && !home && !G.onShift){ l.late = true; E.toast('<b>Dad (phone):</b> It’s past curfew. Get. Home. Now.', 4200); E.sfx('ring'); }
    if(l.late && home && G.ctl && !G.uiOpen){ l.late = false; const gd = l.min < 360 ? dc : dc + 1, again = l.groundedDay != null && gd - l.groundedDay >= 0 && gd - l.groundedDay <= 1; if(!again) l.groundedDay = gd; api.save();
      (async () => { E.cut(true); await E.say(again ? [['Dad', 'Late. Again.'], ['Chris', '...Am I grounded tomorrow too?'], ['Dad', 'No. I am not doing this two days in a row. Go to bed.']] : [['Dad', 'Do you know what time it is?'], ['Chris', '...Not past curfew o’clock?'], ['Dad', 'You’re grounded tomorrow. No phone, no car.']]); E.cut(false); })(); }
    if(grounded(l) && G.driving && !G.mission){ E.exitCar(); E.toast('You’re grounded. Keys are on Dad’s dresser.', 2600); }
    { const c = G.driving; if(c && !G.mission && G.driveRule){ const p = c.car.position, w = watch, mx = p.x - (w.x ?? p.x), mz = p.z - (w.z ?? p.z), m = Math.hypot(mx, mz); w.x = p.x; w.z = p.z; const sp = Math.abs(c.speed), R = m > 1e-4 && m < 3 ? G.driveRule(p.x, p.z, mx / m, mz / m, 30) : null, k = w.k;
        if(R && (!k || k.j !== R.j)) w.k = { j:R.j, g:R.g, stop:R.stop, minV:99, d:R.d, red:false };
        else if(R){ if(R.d < 22) k.minV = Math.min(k.minV, sp); if(k.d > 8.2 && R.d <= 8.2) k.red = R.j.type === 'signal' && G.signalPhase(R.j, R.g) === 'r'; k.d = R.d; }
        else if(k){ if(k.d < 9 && Math.hypot(p.x - k.j.x, p.z - k.j.z) < 9 && sp > 2){ if(k.red) fine(30, 'TICKET: ran a red light'); else if(k.stop && k.minV > 1.6) fine(15, 'TICKET: ran a stop sign'); } if(m > 1e-4) w.k = null; } }
      else { watch.k = null; watch.x = null; } }
    if(G.gas != null) l.gas = G.gas;
    // friends hanging out on their schedule + planned meetups + Friday ragers
    const want = {}; schedule(l).forEach(([n, at]) => want[n] = { at }); const pl = l.plan, now = absNow(l);
    if(pl && now >= pl.at - 15 && now <= pl.at + 90) want[pl.who] = { at:PLACES[pl.place], plan:true }; if(pl && now > pl.at + 90){ l.flaked = pl.who; l.fr = l.fr || {}; l.fr[pl.who] = (l.fr[pl.who] || 0) - 2; l.plan = null; E.toast(`You flaked on ${pl.who}. They noticed.`, 3000); }
    const rager = dow === 5 && (l.min >= 1260 || l.min < 60) || dow === 6 && l.min < 60; if(rager) want.__rager = { at:[110, 129] };
    for(const k of Object.keys(spawned)) if(!want[k] && !['__kids', '__busy', '__tot'].includes(k)){ spawned[k].forEach(x => x.remove ? x.remove() : E.delInter(x)); delete spawned[k]; }
    for(const [k, v] of Object.entries(want)) if(!spawned[k]){ const [x, z] = v.at; spawned[k] = [];
      if(k === '__rager'){ for(let i = 0; i < 7; i++){ const n = E.npc('Partygoer', api.randomLook(i % 2 === 0), x - 3 + (i % 4) * 2, z - 3 + (i / 4 | 0) * 3, { face:i }); n.townie = true; spawned[k].push(n); }
        spawned[k].push(E.addInter({ x, z, r:4, prompt:'JOIN THE RAGER', when:() => G.ctl && !G.mission, use:async () => { E.cut(true); await E.say([['Jax', 'You actually came. Chris came, everybody!'], ['Matt', 'CHRIIIIS!'], ['', 'Somebody is blasting music out of a car. Zeke is attempting a keg stand on a cooler of Capri Suns.'], ['Chris', 'This is the greatest night of my life.']]);
          await E.fade(true, 600); api.passTime(120); await E.card('2 HOURS LATER', 'BEST. NIGHT. EVER.', 1500); await E.fade(false, 600); l.fr = l.fr || {}; ['Jax', 'Matt', 'Zeke'].forEach(n => l.fr[n] = (l.fr[n] || 0) + 2); api.save(); E.cut(false); } }));
        continue; }
      const look = (G.LOOK || {})[k.toLowerCase()] || {}; const n = E.npc(k, look, x, z, { face:Math.random() * 6 }); n.blip = '#4fc3ff'; spawned[k].push(n);
      spawned[k].push(E.addInter({ x:() => n.p.x, z:() => n.p.z, r:2.2, prompt:`HANG OUT WITH ${k.toUpperCase()}`, when:() => G.ctl && !G.mission && !G.uiOpen, use:async () => { const plan = l.plan && l.plan.who === k; if(plan) l.plan = null; n.look(P.p.x, P.p.z); await hangout(k, plan); } })); }
    // after school at the park, busy weekends at Schnucks
    const kids = (dow > 0 && dow < 6 && l.min >= 900 && l.min < 1080) || ((dow === 0 || dow === 6) && l.min >= 600 && l.min < 1080), busy = (dow === 0 || dow === 6) && l.min >= 540 && l.min < 1140 && !G.wet;
    const crowd = (key, on, make) => { if(on && !spawned[key]){ spawned[key] = make(); } if(!on && spawned[key]){ spawned[key].forEach(n => n.remove()); delete spawned[key]; } };
    crowd('__kids', kids && !G.wet, () => [0, 1, 2, 3].map(i => { const n = E.npc('Kid', { ...api.randomLook(i % 2 === 1), scale:.72 }, -86 + i * 3, 66 + (i % 2) * 5, { speed:2.6 }); n.townie = true; const loop = () => { if(!G.npcs.includes(n)) return; n.go([[-92 + Math.random() * 24, 60 + Math.random() * 20]]).then(() => setTimeout(loop, 600)); }; loop(); return n; }));
    crowd('__busy', busy, () => [0, 1, 2, 3, 4].map(i => { const n = E.npc('Shopper', api.randomLook(i % 2 === 0), 70 + i * 18, 382, { speed:1.4 }); n.townie = true; const pts = [[334, 160], [252, 160], [252, 130], [334, 130]]; let j = i % 4; const loop = () => { if(!G.npcs.includes(n)) return; n.go([pts[j]]).then(() => { j = (j + 1) % 4; setTimeout(loop, 1500); }); }; loop(); return n; }));
    const dd = dateOf(dc), hal = dd.getMonth() === 9 && dd.getDate() === 31 && l.min >= 1080 && l.min < 1260;
    crowd('__tot', hal && !G.wet, () => ['ghost', 'witch', 'pirate', 'superhero'].map((c, i) => { const look = { ...api.randomLook(i % 2 === 1), scale:.7, ...(c === 'ghost' ? { shirt:'#f4f4f4', pants:'#f4f4f4', hairStyle:'bald', top:'tee', bottom:'jeans' } : c === 'witch' ? { shirt:'#2a1a3a', pants:'#2a1a3a', hat:'beanie', hatColor:'#111' } : c === 'pirate' ? { hat:'bandana', hatColor:'#c8202a', shirt:'#f2f2f2' } : { shirt:'#2a4ab8', pants:'#c8202a' }) };
      const n = E.npc('Trick-or-treater', look, -40 + i * 12, 17.5, { speed:2.2 }); n.townie = true; const loop = () => { if(!G.npcs.includes(n)) return; n.go([[-60 + Math.random() * 120, 16.5 + Math.random() * 2]]).then(() => setTimeout(loop, 1200)); }; loop(); return n; }));
    for(const arr of Object.values(spawned)) for(const n of arr) if(n.o) n.o.visible = Math.hypot(n.p.x - P.p.x, n.p.z - P.p.z) < (G.npcDist || 70);
    // side job progress
    if(job && job.check && job.check()) finishJob(); };
  api.addTick(tick);
  // B = skateboard on/off
  const bk = e => { if(e.code === 'KeyB' && !G.mission && G.ctl && !G.driving && !G.uiOpen && l.owned.includes('board')){ P.board = !P.board; E.sfx('cart'); } };
  addEventListener('keydown', bk); api.onOff(() => { removeEventListener('keydown', bk); P.board = false; Object.values(spawned).forEach(a => a.forEach(x => x.remove ? x.remove() : E.delInter(x))); spawned = {}; clearJob(); objs.forEach(o => G.scene.remove(o)); objs = []; if(rain) rain.visible = false; if(decor){ G.scene.remove(decor); decor = null; } G.onTime = null; G.wet = false; G.ext = null; G.cloud = .42; G.indoors = false; G.scene.fog.near = 70; G.scene.fog.far = G.fogFar || 330; leaves(0); windows('day'); }); }
// rep changes from shifts (shift.js)
export function repDelta(d){ const l = api && api.L(); if(!l) return; l.rep = Math.max(0, Math.min(100, (l.rep ?? 50) + d)); api.save(); }
export const wage = () => { const r = api ? (api.L().rep ?? 50) : 50; return r >= 90 ? 8.25 : r >= 75 ? 7.75 : r < 25 ? 7 : 7.25; };
