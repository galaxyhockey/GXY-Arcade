// Back in the 2000s: The Game — free-roam life: a running clock (1 real second = 1 game minute) with day/dusk/night,
// cash, Chris's closet + the barber (early-2000s wardrobe), Video World rentals (3-night, late fees), food, shifts at Schnucks,
// home activities (TV, computer, phone, snacks, console, Pepper, sleep), townspeople you can talk to, street-name popups.
// Flavour lines are GAME ORIGINAL.
import * as E from './engine.js';
import { SV, save, phoneUp, sitSofa, TV_SHOT } from './game.js';
import { playShift } from './shift.js';
import { extrasOn, repDelta, wage } from './extras.js';
import { beatsOn } from './beats.js';
import { upgradesOn } from './planner.js';
const { THREE, G, P, WARDROBE } = E; const $ = id => document.getElementById(id);
const L = () => SV.life || (SV.life = { min:15 * 60 + 30, day:5, cash:40, rentals:[], look:null });
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const fmt = m => { m = ((m % 1440) + 1440) % 1440; const h = m / 60 | 0, mm = m % 60 | 0; return `${(h + 11) % 12 + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const money = n => '$' + n.toFixed(2);
const tod = m => { m %= 1440; const s = G.dayShift || 0; return m < 360 ? 'night' : m < 960 - s ? 'day' : m < 1080 - s ? 'after' : m < 1230 - s ? 'dusk' : 'night'; };
let on = false, inters = [], npcs = [], ticks = [];
export function passTime(min){ const l = L(); l.min += min; while(l.min >= 1440){ l.min -= 1440; l.day = (l.day + 1) % 7; l.dayCount = (l.dayCount || 0) + 1; } E.setTime(tod(l.min)); save(); }
function pay(n){ const l = L(); if(l.cash < n){ E.toast(`Not enough cash. You have ${money(l.cash)}.`, 2600); E.sfx('miss'); return false; } l.cash -= n; E.sfx('ok'); save(); return true; }
function hud(){ const l = L(); $('clock').innerHTML = `BELLEVILLE, IL · ${DAYS[l.day]}<br>${fmt(l.min)} · ${money(l.cash)}`; }
const add = (o) => { o.when = o.when || (() => !G.mission && G.ctl && !G.driving && !G.uiOpen); inters.push(E.addInter(o)); };

// ---------- wardrobe / barber UI ----------
const PAL = { shirt:['#2f5d8a', '#c8202a', '#f2f2f2', '#1a1a1a', '#3a7a3a', '#e8a020', '#7a3a9a', '#5ab0d8', '#ff8a1a', '#8a8a8a', '#f0a0c0', '#2a2a5a'],
  pants:['#4a5a78', '#2b3550', '#6a7a9a', '#1a1a1a', '#9a8a6a', '#5a5a4a', '#c8c0a8', '#3a3a3a'], shoes:['#3a3a3a', '#f2f2f2', '#1a1a1a', '#8a5a2a', '#c8202a', '#2a4a9a'],
  hair:['#1a1a1a', '#3a2414', '#5a3a1c', '#8a5a2a', '#c9a15a', '#e8d090', '#a83a1a', '#2a2a6a'], tips:['#f0dc9a', '#ffffff', '#e8a020', '#5ab0d8', '#c8202a'],
  print:['SK8', 'XTRM', 'DUDE', 'PUNK', 'BMX', 'ROCK', 'SURF', '2003'], jersey:['23', '3', '8', '33', '12', '81', '1', '24'], hatColor:['#1d1d1d', '#c8202a', '#2a4a9a', '#f2f2f2', '#3a7a3a', '#e8a020'] };
const NAMES = { tee:'Plain tee', graphic:'Graphic tee', jersey:'Basketball jersey', hoodie:'Hoodie', polo:'Polo (popped collar)', track:'Track jacket', flannel:'Flannel', tank:'Tank top', babytee:'Baby tee',
  jeans:'Jeans', baggy:'Baggy jeans', cargo:'Cargo pants', shorts:'Cargo shorts', track_b:'Track pants', flare:'Flare jeans', skirt:'Skirt',
  short:'Short', spiky:'Spiky w/ frosted tips', curtains:'Curtains (middle part)', buzz:'Buzz cut', shaggy:'Skater shag', cornrows:'Cornrows', afro:'Afro', sideswept:'Side-swept emo', long:'Long', pony:'Ponytail', bun:'Bun', pigtails:'Pigtails', bald:'Shaved',
  '':'None', cap:'Ball cap', capback:'Cap (backwards)', trucker:'Trucker hat', beanie:'Beanie', bandana:'Bandana', puka:'Puka shells', silver:'Silver chain' };
function editor(title, rows, price, spot){ return new Promise(res => { const l = L(), look = { ...G.chrisLook }, before = { ...G.chrisLook }; let k = 0; G.uiOpen = true; E.cut(true);
  if(spot) E.place(spot.x, spot.z, spot.yaw, P.p.y); const yaw = P.yaw; P.model.rotation.y = yaw; E.camShot([P.p.x + Math.sin(yaw) * 3.1 + Math.cos(yaw) * .8, P.p.y + 1.55, P.p.z + Math.cos(yaw) * 3.1 - Math.sin(yaw) * .8], [P.p.x, P.p.y + 1.05, P.p.z], 400);
  const el = document.createElement('div'); el.style.cssText = 'position:fixed;left:24px;top:50%;transform:translateY(-50%);background:#fff;color:#222;border:6px solid #2a2a3a;border-radius:12px;padding:14px 18px;font-family:"Press Start 2P",monospace;font-size:11px;line-height:2.3;z-index:40;min-width:380px';
  document.body.appendChild(el);
  const val = r => { const v = look[r.key] ?? r.list[0]; return r.color ? `<span style="display:inline-block;width:46px;height:12px;background:${v};border:2px solid #222;vertical-align:middle"></span>` : (NAMES[r.key === 'bottom' && v === 'track' ? 'track_b' : v] || v || 'None'); };
  const draw = () => { el.innerHTML = `<div style="color:#7a1a2a;margin-bottom:6px">${title}</div>` + rows.map((r, i) => `<div style="${i === k ? 'background:#ffe9a8;' : ''}padding:0 6px;cursor:pointer" data-i="${i}">${i === k ? '▶ ' : '&nbsp;&nbsp;'}${r.label}: ◀ ${val(r)} ▶</div>`).join('')
    + `<div style="margin-top:8px;font-size:9px;color:#555">W/S choose · A/D change · E ${price ? `pay ${money(price)}` : 'done'} · ESC cancel</div>`;
    el.querySelectorAll('[data-i]').forEach(d => d.onclick = ev => { k = +d.dataset.i; const r = d.getBoundingClientRect(); change(ev.clientX > r.left + r.width / 2 ? 1 : -1); }); };
  const change = dir => { const r = rows[k], cur = look[r.key] ?? r.list[0], i = r.list.indexOf(cur); look[r.key] = r.list[((i < 0 ? 0 : i) + dir + r.list.length) % r.list.length];
    if(r.key === 'top' && look.top === 'jersey' && !PAL.jersey.includes(look.print)) look.print = '23'; if(r.key === 'top' && look.top === 'graphic' && !PAL.print.includes(look.print)) look.print = 'SK8';
    G.chrisLook = look; E.setOutfit({}); P.model.rotation.y = yaw; E.sfx('cart'); draw(); };
  const close = ok => { removeEventListener('keydown', key, true); el.remove(); G.uiOpen = false;
    if(ok && price && !pay(price)) ok = false; if(!ok){ G.chrisLook = before; E.setOutfit({}); } else { l.look = { ...G.chrisLook }; save(); } E.cut(false); res(ok); };
  const key = e => { e.stopImmediatePropagation(); e.preventDefault(); if(['KeyW', 'ArrowUp'].includes(e.code)){ k = (k + rows.length - 1) % rows.length; draw(); } else if(['KeyS', 'ArrowDown'].includes(e.code)){ k = (k + 1) % rows.length; draw(); }
    else if(['KeyA', 'ArrowLeft'].includes(e.code)) change(-1); else if(['KeyD', 'ArrowRight'].includes(e.code)) change(1); else if(['KeyE', 'Enter', 'Space'].includes(e.code)) close(true); else if(e.code === 'Escape') close(false); };
  addEventListener('keydown', key, true); draw(); }); }
const closetRows = () => [{ label:'TOP', key:'top', list:WARDROBE.top }, { label:'SHIRT COLOR', key:'shirt', list:PAL.shirt, color:true }, { label:'PRINT / NUMBER', key:'print', list:[...PAL.print, ...PAL.jersey] },
  { label:'BOTTOMS', key:'bottom', list:WARDROBE.bottom }, { label:'PANTS COLOR', key:'pants', list:PAL.pants, color:true }, { label:'SHOES', key:'shoes', list:PAL.shoes, color:true },
  { label:'HAT', key:'hat', list:WARDROBE.hat }, { label:'HAT COLOR', key:'hatColor', list:PAL.hatColor, color:true }, { label:'NECK', key:'chain', list:WARDROBE.chain }];
const barberRows = () => [{ label:'STYLE', key:'hairStyle', list:WARDROBE.hairStyle }, { label:'COLOR', key:'hair', list:PAL.hair, color:true }, { label:'FROSTED TIPS', key:'tips', list:PAL.tips, color:true }];

// ---------- Video World ----------
const MOVIES = [['Old School', 3.99, 'Okay, that was the funniest thing I have seen all year. Streaking is NOT a plan though.'], ['Jackass: The Movie', 3.99, 'I can never let Zeke see this. He would try every single bit of it.'],
  ['8 Mile', 3.99, 'Rap battles in a parking lot. I could never. Matt definitely thinks he could.'], ['The Ring', 2.99, 'I am not answering the phone for a week. Seven days. Nope.'],
  ['Bringing Down the House', 3.99, 'Steve Martin dancing is a crime against humanity. I laughed anyway.'], ['Daredevil', 3.99, 'Kinda mid, the fight in the playground was sick though.'],
  ['Friday After Next', 2.99, 'Christmas movie in September. Still funny.'], ['Spider-Man', 1.99, 'Third time watching it. Still holds up.'], ['Shanghai Knights', 2.99, 'Jackie Chan never misses.'], ['Kangaroo Jack', 1.99, 'Why did I rent this. Why did they make this.']];
async function videoStore(){ const l = L(); E.cut(true); const opts = ['Rent a movie', ...(l.rentals.length ? ['Return my movies'] : []), 'Buy games & systems', 'Just browsing'];
  await E.say([['Clerk', ['Welcome to Video World. New releases are on the back wall.', 'Be kind, rewind.', 'We got the new ones in on Tuesday.'][Math.random() * 3 | 0]]]);
  const k = await E.choose(opts);
  if(opts[k] === 'Rent a movie'){ const list = MOVIES.filter(m => !l.rentals.some(r => r.t === m[0])); const j = await E.choose([...list.map(m => `${m[0]} — ${money(m[1])}`), 'Never mind']);
    if(j < list.length && pay(list[j][1])){ l.rentals.push({ t:list[j][0], due:l.day + 3 + (l.min > 0 ? 0 : 0), dueAbs:(SV.life.dayCount || 0) + 3 }); save(); await E.say([['Clerk', `${list[j][0]}. Due back in 3 nights. Late fee is a dollar a day.`]]); } }
  else if(opts[k] === 'Buy games & systems' && G.ext){ await G.ext.shopGames(); }
  else if(opts[k] === 'Return my movies'){ const now = l.dayCount || 0; let late = 0; l.rentals.forEach(r => late += Math.max(0, now - r.dueAbs)); l.rentals = [];
    if(late){ l.cash = Math.max(0, l.cash - late); await E.say([['Clerk', `That's ${late} day${late > 1 ? 's' : ''} late. ${money(late)} in late fees.`], ['Chris', 'Worth it.']]); } else await E.say([['Clerk', 'All on time. Look at you.']]); save(); }
  E.cut(false); }
async function watchRental(){ const l = L(); const j = await E.choose([...l.rentals.map(r => r.t), 'Never mind']); if(j >= l.rentals.length) return false;
  const m = MOVIES.find(x => x[0] === l.rentals[j].t); E.sfx('door'); await E.fade(true, 700); passTime(110); await E.card('2 HOURS LATER', l.rentals[j].t.toUpperCase(), 1800); await E.fade(false, 600); await E.say([['Chris', m ? m[2] : 'Not bad.']]); return true; }

// ---------- home ----------
const CHANNELS = [['Channel 4 — local news. Rain all week, apparently.', 0x6a8ab8], ['Channel 5 — the Blues are up 2–1 in the second period.', 0x4a8a5a], ['Channel 11 — an infomercial for a knife that cuts through a shoe.', 0xb88a3a], ['Channel 30 — the music video countdown.', 0x9a4ab8], ['Channel 41 — cartoons. Not bad, honestly.', 0xd86a3a]];
const CALLS = { Zeke:[['Zeke (phone)', 'Yo! Can’t talk, I’m about to ollie a mailbox.']], Jax:[['Jax (phone)', 'What do you want.'], ['Chris', 'Nothing, just bored.'], ['Jax (phone)', '...cool. Bye.']],
  Matt:[['Matt (phone)', 'YOOOO, Chris! What’s up!'], ['Chris', 'Nothin man.'], ['Matt (phone)', 'Same. Later dude.']], Milo:[['Milo (phone)', 'You know it’s rude to call without a reason.'], ['Chris', 'Love you too, Milo.']],
  'China Garden':[['China Garden (phone)', 'China Garden, pick up or delivery?'], ['Chris', 'Uh... I’ll just come by.'], ['China Garden (phone)', 'Okay! Bye bye!']] };
let chan = 0;
async function useTV(){ sitSofa(true); E.cut(true); await E.camShot(...TV_SHOT, 500); const scr = G.tvScreen.material, c0 = scr.color.getHex();
  for(;;){ const [t, c] = CHANNELS[chan % CHANNELS.length]; scr.color.setHex(c); await E.say([['', t]]);
    const opts = ['Change the channel', ...(L().rentals.length ? ['Watch a rented movie'] : []), 'Get up'], k = await E.choose(opts);
    if(opts[k] === 'Get up') break; if(opts[k] === 'Watch a rented movie'){ await watchRental(); continue; } chan++; passTime(15); }
  scr.color.setHex(c0); sitSofa(false); E.cut(false); }
async function usePC(){ E.cut(true); const [x, y, z] = G.monitorPos; await E.camShot([x + .2, y + .3, z + 1.4], [x, y, z], 500); const scr = G.monitor.material, c0 = scr.color.getHex(); scr.color.set(0x2a5aa8);
  for(;;){ const k = await E.choose(['Play RuneScape (1 hr)', 'Check email', 'Instant Messenger', 'Shop online', 'Log off']); if(k === 4) break; if(k === 2 && G.ext){ await G.ext.aim(); continue; } if(k === 3){ if(G.shopOnline) await G.shopOnline(); continue; }
    if(k === 0){ passTime(60); } await E.say([[['', 'An hour of chopping trees later: level 31 woodcutting. Worth it.']], [['', '1 new message: “U HAVE WON A FREE IPOD!!!” Delete.']], [['', 'Nobody’s online. Zeke’s away message just says “skating.”']]][k]); }
  scr.color.setHex(c0); E.cut(false); }
async function usePhone(){ if(G.ext && G.ext.grounded()){ E.toast('Dad took the phone. Grounded.', 2400); return; } E.cut(true); phoneUp(true); await E.camShot([.1, 2.1, -3.4], [3.1, 1.5, -1.2], 400); const names = Object.keys(CALLS);
  if(G.ext && (await E.choose(['Make plans with a friend', 'Just call someone'])) === 0){ await G.ext.makePlans(); phoneUp(false); E.cut(false); return; }
  const k = await E.choose([...names.map(n => 'Call ' + n), 'Hang up']); if(k < names.length){ for(let i = 0; i < 2; i++){ E.sfx('ring'); await E.wait(900); } await E.say(CALLS[names[k]]); }
  phoneUp(false); E.cut(false); }

// ---------- townspeople ----------
const SMALLTALK = [['Did you see the Rams game? Bulger is the real deal.'], ['My kid burned me a CD with like 80 songs on it. Technology, man.'], ['Gas is up to a buck sixty. Can you believe that?'],
  ['You going to the homecoming game Friday?'], ['I got a new flip phone. It has a color screen.'], ['Schnucks has 2-liters for 99 cents this week.'], ['Is it gonna rain? My knee says it’s gonna rain.'],
  ['You see that new Hummer down the street? Who needs that.'], ['My cousin works at the Journeys at the mall. Says it sucks.'], ['I’m saving up for a PS2. Two hundred bucks, man.'],
  ['Don’t walk on my grass, kid.'], ['The Cardinals are gonna choke again, watch.']];
export function randomLook(fem){ const r = a => a[Math.random() * a.length | 0];
  return { shirt:r(PAL.shirt), pants:r(PAL.pants), shoes:r(PAL.shoes), hair:r(PAL.hair.slice(0, 7)), skin:r(['#efc29e', '#e8b896', '#c48a5e', '#8a5a3a', '#f4d0b0']),
    hairStyle:fem ? r(['long', 'pony', 'bun', 'pigtails', 'sideswept']) : r(['short', 'spiky', 'curtains', 'buzz', 'shaggy', 'cornrows', 'afro']), top:fem ? r(['babytee', 'track', 'tee', 'hoodie', 'polo']) : r(['tee', 'graphic', 'jersey', 'hoodie', 'polo', 'flannel']),
    bottom:fem ? r(['flare', 'jeans', 'track', 'skirt', 'cargo']) : r(['jeans', 'baggy', 'cargo', 'shorts']), hat:Math.random() < .25 ? r(['cap', 'capback', 'trucker', 'beanie']) : '', print:r(PAL.print), lips:fem ? '#b5505a' : undefined, scale:fem ? .94 : 1 + Math.random() * .06, wide:Math.random() < .2 ? 1.2 : 1 }; }
function townsperson(name, x, z, path, fem, o = {}){ const n = E.npc(name, randomLook(fem), x, z, { speed:o.speed || 1.4, y:o.y }); n.townie = true; npcs.push(n);
  if(path){ let i = 0; const loop = () => { if(!npcs.includes(n)) return; n.go([path[i]]).then(() => { i = (i + 1) % path.length; setTimeout(loop, 800 + Math.random() * 3000); }); }; loop(); } else n.face = o.face || 0;
  add({ x:() => n.p.x, z:() => n.p.z, y:o.y, r:2, prompt:'TALK', use:async () => { n.stop(); n.look(P.p.x, P.p.z); E.cut(true); const lines = SMALLTALK[Math.random() * SMALLTALK.length | 0];
    await E.say([[name, lines[0]], ['Chris', ['Yeah, totally.', 'Uh huh.', 'Sure, man.', 'Wild.'][Math.random() * 4 | 0]]]); E.cut(false); if(path){ let i = 0; const loop = () => { if(!npcs.includes(n)) return; n.go([path[i]]).then(() => { i = (i + 1) % path.length; setTimeout(loop, 1500); }); }; loop(); } } });
  return n; }

// ---------- switch free-roam life on/off ----------
export function lifeOn(state){ inters.forEach(E.delInter); inters = []; npcs.forEach(n => n.remove()); npcs = []; ticks.forEach(t => t()); ticks = []; on = state; if(!on) return;
  const l = L(); if(l.look) G.chrisLook = { ...G.chrisLook, ...l.look };
  if(G.roamFrom){ l.min = { morning:8 * 60, dusk:19 * 60, after:15 * 60 + 30, day:10 * 60, night:22 * 60 }[G.roamFrom] ?? l.min; G.roamFrom = null; }
  E.setTime(tod(l.min)); E.setOutfit({});
  // home
  add({ x:G.sofa.x, z:G.sofa.z, y:0, r:1.8, prompt:'WATCH TV', use:useTV }); add({ x:G.desk.x, z:G.desk.z, y:3.2, r:1.8, prompt:'USE THE COMPUTER', use:usePC }); add({ x:G.phone.x, z:G.phone.z, y:0, r:1.8, prompt:'USE THE PHONE', use:usePhone, when:() => !G.mission && G.ctl && !G.driving && !G.uiOpen && !G.ringing });
  add({ x:G.closet.x, z:G.closet.z, y:3.2, r:1.6, prompt:'OPEN YOUR CLOSET', use:async () => { E.sfx('door'); await editor("CHRIS'S CLOSET", closetRows(), 0, { x:-3.1, z:-5.4, yaw:-Math.PI / 2 }); } });
  add({ x:-6.7, z:-10.3, y:0, r:1.4, prompt:'GRAB A SNACK', use:async () => { const d = G.fridgeObj && G.fridgeObj.userData.door; E.cut(true); E.place(-6.55, -10.25, Math.PI); P.model.rotation.y = Math.PI; E.camShot([-4.9, 1.9, -9.2], [-6.8, 1.1, -11.2], 400); E.sfx('door');
    for(let i = 1; i <= 10; i++){ if(d) d.rotation.y = -1.75 * i / 10; await E.wait(30); } await E.wait(900); for(let i = 9; i >= 0; i--){ if(d) d.rotation.y = -1.75 * i / 10; await E.wait(25); } E.sfx('door'); E.cut(false); passTime(10); E.toast(['Bagel Bites. A classic.', 'Last Hot Pocket. Sorry, Dad.', 'Gushers. Breakfast of champions.', 'Cold pizza from Friday.'][Math.random() * 4 | 0], 2600); } });
  add({ x:G.console.x, z:G.console.z, y:3.2, r:1.6, prompt:'PLAY VIDEO GAMES (1 HR)', use:async () => { if(G.ext && G.ext.owned('ps2')){ await G.ext.playPS2(); return; } E.cut(true); await E.fade(true, 500); passTime(60); await E.card('1 HOUR LATER', '', 1200); await E.fade(false, 500); E.cut(false);
    E.toast(['Beat my high score in the skate game. Untouchable.', 'Lost every race. The controller is broken. Definitely the controller.', 'Finally beat that boss. Took 40 tries.'][Math.random() * 3 | 0], 3200); } });
  add({ x:G.sink.x, z:G.sink.z, r:1.3, prompt:'DO THE DISHES', when:() => !G.mission && G.ctl && !G.uiOpen && G.dishes && G.dishes.visible, use:async () => { E.cut(true); E.place(G.sink.x, -10.95, Math.PI); P.model.rotation.y = Math.PI; await E.fade(true, 500); passTime(20); G.dishes.visible = false; l.dishesDay = l.dayCount || 0; await E.fade(false, 500); E.cut(false);
    l.cash += 3; save(); E.toast('Dishes done. Mom left $3 on the counter. Allowance, baby.', 3000); } });
  if(G.dishes) G.dishes.visible = (l.dishesDay ?? -1) !== (l.dayCount || 0);
  if(!SV.needSleep) add({ x:G.bed.x, z:G.bed.z, y:3.2, r:2, prompt:'SLEEP', use:async () => { const late = l.min >= 21 * 60 || l.min < 5 * 60; E.cut(true); await E.fade(true, 800);
    if(late){ const add = (24 * 60 - l.min + 8 * 60) % 1440 || 1440; passTime(add); await E.card('THE NEXT MORNING', `${DAYS[l.day]} · 8:00 AM`, 2000); } else { passTime(120); await E.card('NAP TIME', '2 HOURS LATER', 1500); }
    E.place(G.bedSpawn.x, G.bedSpawn.z, Math.PI, 3.2); await E.fade(false, 700); E.cut(false); } });
  { const pep = E.npc('Pepper', { dog:true, color:'#efe6d6', dark:'#6a5a4a', size:.8 }, 2, -20, { speed:1.6 }); npcs.push(pep); const roam = () => { if(!npcs.includes(pep)) return; pep.go([[-10 + Math.random() * 20, -24 + Math.random() * 9]]).then(() => setTimeout(roam, 1500 + Math.random() * 3000)); }; roam();
    add({ x:() => pep.p.x, z:() => pep.p.z, r:1.6, prompt:'PET PEPPER', use:async () => { E.sfx('bark'); E.toast(['Pepper rolls over. Good girl.', 'yip yip. She loves you, apparently.', 'Pepper licks your hand. Gross. Cute.'][Math.random() * 3 | 0], 2400); } }); }
  // plaza shops
  add({ x:369, z:176.1, r:1.8, prompt:'VIDEO WORLD COUNTER', use:videoStore });
  add({ x:192, z:167.4, r:1.8, prompt:'ORDER FOOD ($5.95)', use:async () => { if(!pay(5.95)) return; E.cut(true); await E.say([['China Garden', 'Number one, General Tso! Ready in five minutes.']]); await E.fade(true, 400); passTime(20); await E.fade(false, 400); E.cut(false);
    E.toast('Best General Tso’s in Swansea. Fortune: “You will find what you are looking for.” Hopefully my homework.', 4200); } });
  add({ x:180.4, z:172, r:1.6, prompt:'GET A HAIRCUT ($12)', use:async () => { E.cut(true); await E.say([['Barber', 'Sit down, what are we doing today?']]); const ok = await editor('HAIR CUTS — $12', barberRows(), 12, { x:180.4, z:172, yaw:Math.PI / 2 }); if(ok){ passTime(30); E.toast('Fresh cut. Looking dangerous.', 2400); } } });
  add({ x:360, z:172, r:1.8, prompt:'DO LAUNDRY ($1.50)', use:async () => { if(!pay(1.5)) return; E.cut(true); await E.fade(true, 400); passTime(45); await E.card('45 MINUTES LATER', 'SMELLS LIKE DRYER SHEETS', 1500); await E.fade(false, 400); E.cut(false); } });
  add({ x:390, z:175, r:1.8, prompt:'NAIL SPA', use:async () => { E.cut(true); await E.say([['Nail Tech', 'You want a manicure, honey?'], ['Chris', 'I’m... good. Thanks.']]); E.cut(false); } });
  // Schnucks: pick up a shift, vending machine
  add({ x:G.timeClock.x, z:G.timeClock.z, r:1.6, prompt:'WORK A SHIFT (5 HRS)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.onShift && l.min >= 6 * 60 && l.min < 18 * 60, use:async () => { E.cut(true); const pick = await E.choose(['Play the shift (carts, bagging, carryouts)', `Skip it — coast through 5 hours (${money(wage() * 4)}, no tips)`, 'Never mind']);
    if(pick === 2){ E.cut(false); return; } if(pick === 0){ E.cut(false); G.shiftStarted = true; return playShift({ L, passTime }, randomLook); } await E.fade(true, 600); passTime(300); const pay5 = Math.round(wage() * 5 * .8 * 100) / 100; l.cash += pay5; G.shiftStarted = true; save();
    await E.card('SHIFT DONE', `+${money(pay5)}  ·  COASTED THROUGH 5 HRS`, 2200); await E.fade(false, 600); E.cut(false); E.toast('Pushed carts for 5 hours. Eric only yelled twice. Personal best.', 3400); } });
  add({ x:G.vending.x, z:G.vending.z, y:3.6, r:1.6, prompt:'BUY A SODA ($0.75)', use:async () => { if(pay(.75)) E.toast('*clunk* Ice cold.', 1800); } });
  // townspeople: sidewalks, plaza, Schnucks shoppers, school courtyard kids
  [[-60, 31, [[-60, 31], [60, 31]], false], [80, 17, [[80, 17], [-40, 17]], true], [96, 120, [[94, 120], [94, 210]], false], [340, 194, [[340, 194], [230, 194]], true], [370, 181, [[390, 181], [355, 181]], false],
   [200, 181, [[210, 181], [170, 181]], true], [310, 160, [[310, 160], [260, 160], [260, 132], [310, 132]], true], [280, 130, [[280, 130], [334, 130], [334, 160], [334, 130]], false], [-340, -630, null, false], [-338, -628.5, null, true], [-260, -630, [[-260, -630], [-290, -610]], true]]
    .forEach(([x, z, path, fem], i) => townsperson(fem ? ['Linda', 'Ashley', 'Brittany', 'Tiffany', 'Megan', 'Karen'][i % 6] : ['Mr. Davis', 'Kyle', 'Tyler', 'Dustin', 'Brandon', 'Gary'][i % 6], x, z, path, fem, { face:i }));
  // clock, lighting, street names, far NPCs hidden
  let lastRoad = '', lastT = '', st = 0; const sn = $('street') || Object.assign(document.body.appendChild(document.createElement('div')), { id:'street' });
  sn.style.cssText = 'position:fixed;right:22px;bottom:150px;font-family:"Press Start 2P",monospace;font-size:13px;color:#fff;text-shadow:2px 2px 0 #000;z-index:12;transition:opacity .6s;opacity:0';
  const f = dt => { if(!on || G.mission) return; if(G.ctl && !G.paused && !G.uiOpen){ l.min += dt * .8; if(l.min >= 1440){ l.min -= 1440; l.day = (l.day + 1) % 7; l.dayCount = (l.dayCount || 0) + 1; } }
    const k = tod(l.min); if(k !== lastT){ lastT = k; E.setTime(k); } hud();
    const r = (G.roads || []).find(r => P.p.x >= r.x0 && P.p.x <= r.x1 && P.p.z >= r.z0 && P.p.z <= r.z1); const name = r ? r.name : G.roadName ? G.roadName(P.p.x, P.p.z) : '';
    if(name && name !== lastRoad){ sn.textContent = name.toUpperCase(); sn.style.opacity = 1; st = 3; } lastRoad = name || lastRoad; if(st > 0 && (st -= dt) <= 0) sn.style.opacity = 0;
    for(const n of npcs){ n.o.visible = Math.hypot(n.p.x - P.p.x, n.p.z - P.p.z) < (G.npcDist || 70) && !(G.hidePepper && n.name === 'Pepper'); } };
  f.amb = true; G.ticks.push(f); ticks.push(() => { const i = G.ticks.indexOf(f); if(i >= 0) G.ticks.splice(i, 1); sn.style.opacity = 0; });
  G.SVdone = SV.done; const tk = fn => { fn.amb = true; G.ticks.push(fn); ticks.push(() => { const i = G.ticks.indexOf(fn); if(i >= 0) G.ticks.splice(i, 1); }); };
  beatsOn({ L, passTime, pay, money, save, phoneUp, rep:repDelta, friend:(n, d) => { l.fr = l.fr || {}; l.fr[n] = (l.fr[n] || 0) + d; }, addTick:tk, onOff:fn => ticks.push(fn) });
  upgradesOn({ L, passTime, add, pay, save, addTick:tk });
  extrasOn({ L, passTime, add, pay, money, randomLook, save, addTick:fn => { fn.amb = true; G.ticks.push(fn); ticks.push(() => { const i = G.ticks.indexOf(fn); if(i >= 0) G.ticks.splice(i, 1); }); }, onOff:fn => ticks.push(fn) }); }
