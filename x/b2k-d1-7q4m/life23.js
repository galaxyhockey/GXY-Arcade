// Back in the 2000s: The Game — Draft 2.3 free roam (GAME ORIGINAL unless noted): shop hours + clerks who remember you,
// two Blockbuster Videos (west end on N Belt W, east end strip mall on Carlyle, built from the author's photos), Streetside Records,
// Wehrenberg cinema, Belleville Bowl, St. Clair Square mall, used-car lot + savings goal, car wash, tires, CD stereo, flip phone,
// pay phones, newspaper boxes, the Skyview drive-in, snow that sticks, night sky + moon phase, cops + speed traps, collectible cards,
// street events, Oakmont neighbours, chores, football Fridays, homecoming bonfire, July 4th, parents noticing, breakroom talk,
// late-night drive-thru runs, era sounds.
import * as E from './engine.js';
import { dateOf, weatherFor } from './extras.js';
import { playRunner, playDodge, playMeter } from './minigames.js';
const { THREE, G, P } = E;
let api = null, objs = [], clerks = [], ev = null, yb = 0;
const T = (x, z) => G.terrain ? G.terrain(x, z) : 0;
const rnd = s => { s = Math.sin(s * 9301 + 49297) * 233280; return s - Math.floor(s); };
const add = o => { G.scene.add(o); objs.push(o); return o; };
const box = (w, h, d, c, x, y, z, ry = 0, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? E.mat(c) : c); m.position.set(x, y + yb + h / 2, z); m.rotation.y = ry; m.castShadow = true; add(m); if(col){ const s = Math.abs(Math.sin(ry)) > .7; const hw = (s ? d : w) / 2, hd = (s ? w : d) / 2; G.colliders.push({ x0:x - hw, x1:x + hw, z0:z - hd, z1:z + hd, y0:y + yb, y1:y + yb + h }); } return m; };
const sign = (t, o, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map:E.label(t, o), side:THREE.DoubleSide })); m.position.set(x, y + yb, z); m.rotation.y = ry; return add(m); };
const shop = n => (G.shops || []).find(s => s.name === n);
const L = () => api.L();
const near = (x, z, r) => Math.hypot(P.p.x - x, P.p.z - z) < r;
const dowOf = l => dateOf(l.dayCount).getDay();

// ---------- hours: stores close at night (min-of-day open, close; close > 1440 = after midnight) ----------
const HOURS = { 'WALGREENS':[480, 1320], 'MOTO MART':[0, 1440], "STEAK 'N SHAKE":[0, 1440], 'WHITE CASTLE':[0, 1440], "IMO'S PIZZA":[660, 1380], "HARDEE'S":[360, 1320], 'DAIRY QUEEN':[660, 1320],
  'BELLEVILLE PANCAKE HOUSE':[360, 900], 'TACO BELL':[600, 1500], 'FIRST NATIONAL BANK':[540, 1020], 'BLOCKBUSTER VIDEO':[600, 1440], 'BLOCKBUSTER':[600, 1440], 'STREETSIDE RECORDS':[600, 1260],
  'WEHRENBERG CINEMAS':[720, 1500], 'BELLEVILLE BOWL':[600, 1440], 'ST. CLAIR SQUARE':[600, 1260], 'BELLEVILLE AUTO SALES':[540, 1200], 'SPLASH CAR WASH':[420, 1260] };
const fmtH = m => { m %= 1440; const h = m / 60 | 0; return `${(h + 11) % 12 + 1}${m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; };
export function shopOpen(name, min = L().min){ const h = HOURS[name]; if(!h) return true; return (min >= h[0] && min < h[1]) || (h[1] > 1440 && min < h[1] - 1440); }
G.shopOpen = shopOpen; G.shopHours = n => HOURS[n] ? (HOURS[n][1] - HOURS[n][0] >= 1440 ? 'Open 24 hours' : `${fmtH(HOURS[n][0])} – ${fmtH(HOURS[n][1])}`) : '';
// clerks remember you
G.greet = (name, hi) => { const l = L(); l.visits = l.visits || {}; const v = l.visits[name] = (l.visits[name] || 0) + 1; return v >= 8 ? ['The usual?', 'You again! Good to see you.', 'Hey, it’s my best customer.'][v % 3] : v >= 3 ? ['Back again?', 'Hey, I know you.', 'Welcome back.'][v % 3] : hi; };
const news = k => { const l = L(); (l.news = l.news || []).push(k); };
G.parentNews = news;

// ---------- shop dressing: a plain helper that works from the shop record (front centre, facing direction) ----------
function frame(s){ yb = T(s.at[0], s.at[1]); const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, dx = s.door[0] - cx, dz = s.door[1] - cz, alongX = Math.abs(dx) > Math.abs(dz);
  const nx = alongX ? Math.sign(dx) : 0, nz = alongX ? 0 : Math.sign(dz), hd = alongX ? (s.x1 - s.x0) / 2 : (s.z1 - s.z0) / 2, hl = alongX ? (s.z1 - s.z0) / 2 : (s.x1 - s.x0) / 2;
  const fx = cx + nx * hd, fz = cz + nz * hd, ry = Math.atan2(nx, nz);
  // point at u along the front (right of the viewer facing the shop is -u... fine), v outward from the front wall, height y
  const at = (u, v) => [fx + nx * v + (alongX ? 0 : 1) * u, fz + nz * v + (alongX ? 1 : 0) * u];
  const inn = (u, v) => at(u, -v); return { cx, cz, nx, nz, hl, hd, ry, at, inn }; }
function clerk(s, name, look){ const n = E.npc(name, look || api.randomLook(Math.random() < .5), s.clerk[0], s.clerk[1], { face:s.face, y:G.terrain ? G.terrain(s.clerk[0], s.clerk[1]) : 0 }); n.shop = s.name; clerks.push(n); return n; }
function counter(s, prompt, use){ api.add({ x:s.at[0], z:s.at[1], r:1.9, prompt, use:async () => { if(!shopOpen(s.name)){ E.toast(`CLOSED · ${G.shopHours(s.name)}`, 2400); return; } await use(); } }); }

// West end Blockbuster Video (N Belt W, 2007 street photo): brick box, dark green metal mansard band with yellow BLOCKBUSTER VIDEO
// letters, a blue awning band under it, glass front with "$2" window posters, small concrete steps.
function blockbusterWest(s){ const f = frame(s), H = 5.2, Lh = f.hl; const [ax, az] = f.at(0, .55);
  box(2 * Lh + .4, .9, 1.1, '#2f8ad8', ax, H - 1.7, az, f.ry); box(2 * Lh + .6, .12, 1.2, '#1f6ab0', ax, H - 1.75, az, f.ry);                                         // blue awning band
  const [mx, mz] = f.at(0, .25); const man = box(2 * Lh + .4, 1.6, .7, '#55786a', mx, H - .8, mz, f.ry); man.rotation.x = 0;                                           // green metal band
  for(let u = -Lh; u <= Lh; u += .5){ const [rx, rz] = f.at(u, .62); box(.04, 1.6, .04, '#2e4638', rx, H - .8, rz, f.ry); }                                          // standing-seam ribs
  const [sx, sz] = f.at(0, .62); sign('BLOCKBUSTER VIDEO', { bg:'rgba(0,0,0,0)', fg:'#f2c230', size:58, w:1024, h:96 }, Math.min(2 * Lh - 2, 14), 1.25, sx, H - .05, sz, f.ry);
  [-.3, .3].forEach((k, i) => { const [px, pz] = f.at(k * Lh, .07); sign(['ALL', 'NEW', 'RELEASES', '$2'], { bg:'#f2c230', fg:'#1f3f9a', size:44, w:256, h:256 }, 1.3, 1.3, px, 1.6, pz, f.ry); });
  const [tx, tz] = f.at(-Lh / 2, 1.2); box(2.4, .18, 1, '#b8b2a6', tx, 0, tz, f.ry); box(2.4, .18, .6, '#b8b2a6', tx, .18, tz - f.nz * .2, f.ry); }
// East end Blockbuster (Carlyle Ave strip mall, 2007 street photos): one unit in a long grey strip with a flat roof, a long blue
// awning with yellow BLOCKBUSTER logos, neighbours with red letter signs, and a tall yellow pylon sign out by the road.
function blockbusterEast(s){ const f = frame(s), H = 5, Lh = f.hl; const [ax, az] = f.at(0, .6);
  box(2 * Lh + .4, 1, 1.2, '#2a5fb8', ax, H - 1.8, az, f.ry); [-.5, .5].forEach(k => { const [lx, lz] = f.at(k * Lh, 1.22); sign('BLOCKBUSTER', { bg:'rgba(0,0,0,0)', fg:'#f2c230', size:54, w:512, h:80 }, 5, .7, lx, H - 1.3, lz, f.ry); });
  // the rest of the strip: grey units on both sides with red letter signs, one taller parapet block
  const nb = [['CHINA KING', '#c8202a'], ['PAYLESS SHOESOURCE', '#c8202a'], ['NAIL SALON', '#a8204a'], ['H&R BLOCK', '#2a7a3a']];
  [-1, 1].forEach((side, si) => [0, 1].forEach(k => { const w = 12, u = side * (Lh + 6.2 + k * 12.2); const [bx, bz] = f.inn(u, f.hd); box(w, H + (si && k ? 1.6 : 0), 2 * f.hd, '#b9b6ae', bx, 0, bz, f.ry, true);
    const [gx, gz] = f.at(u, .05); box(w - 1, 2.3, .05, '#2a3440', gx, .2, gz, f.ry); const [lx, lz] = f.at(u, .1); const t = nb[si * 2 + k]; sign(t[0], { bg:'#d8d4ca', fg:t[1], size:46, w:512, h:70 }, 7, .9, lx, H - .9, lz, f.ry); }));
  { const [lx, lz] = f.at(0, 11); const lot = box(2 * Lh + 52, .04, 19, '#4a4c50', lx, .01, lz, f.ry); lot.receiveShadow = true; for(let u = -Lh - 24; u < Lh + 24; u += 3){ const [sx, sz] = f.at(u, 6); box(.12, .05, 5, '#e8e8e8', sx, .01, sz, f.ry); } }
  // pylon by the road: two tall yellow blocks with the torn-ticket panel
  const [px, pz] = f.at(Lh + 4, 22); box(1.2, 8, 1.2, '#e8c22a', px, 0, pz, f.ry, true); box(2.6, 2.4, 1.6, '#e8c22a', px, 7.6, pz, f.ry); box(2.2, 2, 1.7, '#2a5fb8', px, 5.4, pz, f.ry);
  sign('BLOCKBUSTER', { bg:'#2a5fb8', fg:'#f2c230', size:50, w:512, h:110 }, 2.1, .7, px + f.nx * .87, 6.4, pz + f.nz * .87, f.ry); }
// Inside any Blockbuster: blue walls of VHS + DVD cases, NEW RELEASES wall, a drop box out front for returns
function bbInside(s){ const f = frame(s); const cols = ['#1a1a1a', '#2a2a6a', '#6a1a1a', '#1a4a2a', '#3a3a3a'];
  const [wx, wz] = f.inn(0, f.hd * 2 - .8); sign('NEW RELEASES', { bg:'#1f3f9a', fg:'#f2c230', size:60, w:512, h:76 }, 7, .9, wx, 3.4, wz, f.ry);
  for(let u = -f.hl + 2; u < f.hl - 2; u += .5) for(let r = 0; r < 4; r++){ const [x, z] = f.inn(u, f.hd * 2 - .7); box(.36, .5, .1, cols[Math.abs(Math.round(u * 7 + r * 3)) % 5], x, .4 + r * .62, z, f.ry); }
  const [rx, rz] = f.at(f.hl - 2.5, 1.4); box(1, 1.2, .8, '#1f3f9a', rx, 0, rz, f.ry, true); sign(['RETURNS'], { bg:'#1f3f9a', fg:'#f2c230', size:40, w:256, h:64 }, .9, .25, rx + f.nx * .41, 1, rz + f.nz * .41, f.ry);
  api.add({ x:rx + f.nx * 1.2, z:rz + f.nz * 1.2, r:1.6, prompt:'DROP OFF RENTALS', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && (L().rentals || []).length, use:async () => { const l = L(), now = l.dayCount || 0; let late = 0; l.rentals.forEach(x => late += Math.max(0, now - x.dueAbs)); l.rentals = []; if(late) l.cash -= late; api.save(); E.sfx('door'); E.toast(late ? `Dropped in the slot. ${api.money(late)} in late fees hit your account.` : 'Dropped in the slot. On time.', 3000); } });
  counter(s, 'BLOCKBUSTER COUNTER', () => G.videoStore ? G.videoStore('Blockbuster') : null); clerk(s, 'Clerk', { ...api.randomLook(false), shirt:'#1f3f9a', top:'polo' }); }
function posters(s, list){ const f = frame(s); list.forEach((t, i) => { const u = -f.hl + 3 + i * 2.2; if(u > f.hl - 2) return; const [x, z] = f.inn(u, .45); sign(t[0], { bg:t[1], fg:t[2] || '#fff', size:30, w:200, h:300 }, 1.1, 1.65, x, 2.1, z, f.ry); }); }

// ---------- records, cinema, bowling, mall, car lot ----------
const CDS = () => [...new Set(G.radio.st.tracks.map(t => t[1]))];
const MOVIES03 = [['School of Rock', 2003, 9, 3], ['Lost in Translation', 2003, 9, 12], ['Matchstick Men', 2003, 9, 12], ['Kill Bill: Vol. 1', 2003, 9, 10], ['Mystic River', 2003, 9, 15], ['Scary Movie 3', 2003, 9, 24], ['Brother Bear', 2003, 10, 1], ['Elf', 2003, 10, 7], ['The Matrix Revolutions', 2003, 10, 5], ['Love Actually', 2003, 10, 14], ['Master and Commander', 2003, 10, 14], ['The Last Samurai', 2003, 11, 5], ['The Lord of the Rings: The Return of the King', 2003, 11, 17], ['Cheaper by the Dozen', 2003, 11, 25], ['Big Fish', 2004, 0, 9], ['50 First Dates', 2004, 1, 13], ['Starsky & Hutch', 2004, 2, 5], ['Dawn of the Dead', 2004, 2, 19], ['Mean Girls', 2004, 3, 30], ['Shrek 2', 2004, 4, 19], ['Spider-Man 2', 2004, 5, 30]];
const showing = dc => { const d = dateOf(dc); return MOVIES03.filter(m => { const r = new Date(m[1], m[2], m[3]); return r <= d && (d - r) / 864e5 < 49; }).map(m => m[0]); };
const LINES = { 'School of Rock':'Jack Black yelling at fourth graders about rock. Perfect movie.', 'Kill Bill: Vol. 1':'Way more blood than the trailer said. Matt would love it.', 'Elf':'Will Ferrell in tights for 90 minutes. Laughed the whole time.', 'Scary Movie 3':'Dumb. Laughed anyway.', 'The Matrix Revolutions':'I still don’t know what happened. The fights were sick though.' };
async function records(){ const l = L(); l.cds = l.cds || []; await E.say([['Clerk', G.greet('STREETSIDE RECORDS', 'New stuff came in Tuesday. Listening booth is in the back.')]]);
  for(;;){ const left = CDS().filter(a => !l.cds.includes(a)), k = await E.choose(['Buy a CD ($13.99)', 'Posters ($7.99)', 'Leave']); if(k === 2) break;
    if(k === 0){ if(!left.length){ await E.say([['Clerk', 'You own everything I’d recommend. Respect.']]); continue; } const j = await E.choose([...left, 'Never mind']); if(j < left.length && api.pay(13.99)){ l.cds.push(left[j]); api.save(); G.drawRoom && G.drawRoom(); await E.say([['', `${left[j]} on CD. It goes on the rack in my room, and in the car if I ever get a CD player.`]]); } }
    else { const p = [['poster_band', 'Band poster'], ['poster_sk8', 'Skate poster']].filter(x => !(l.owned || []).includes(x[0])); if(!p.length){ await E.say([['Clerk', 'You got both already.']]); continue; } const j = await E.choose([...p.map(x => x[1]), 'Never mind']); if(j < p.length && api.pay(7.99)){ l.owned.push(p[j][0]); api.save(); G.drawRoom && G.drawRoom(); } } } }
async function cinema(){ const l = L(), list = showing(l.dayCount || 0), mat = l.min < 1080, price = mat ? 4.75 : 7; await E.say([['Box office', G.greet('WEHRENBERG CINEMAS', 'What are we seeing?')]]);
  const k = await E.choose([...list.map(m => `${m} — ${api.money(price)}${mat ? ' (matinee)' : ''}`), 'Never mind']); if(k >= list.length) return; if(!api.pay(price)) return;
  const pop = await E.choose(['Small popcorn and a Coke — $5.50', 'No snacks']); if(pop === 0) api.pay(5.5);
  await E.fade(true, 600); api.passTime(125); await E.card('2 HOURS LATER', list[k].toUpperCase(), 1800); await E.fade(false, 600); await E.say([['', LINES[list[k]] || 'Good movie. The previews were half the fun.']]); (l.seen = l.seen || []).push(list[k]); api.save(); }
async function bowl(){ const l = L(); await E.say([['Front desk', G.greet('BELLEVILLE BOWL', 'Lanes or arcade? Shoes are a buck.')]]);
  for(;;){ const k = await E.choose(['Bowl a game — $3.50 with shoes', 'Arcade: racing cabinet — $0.50', 'Arcade: dodge cabinet — $0.50', 'Leave']); if(k === 3) break;
    const sc = k === 0 ? (api.pay(3.5) ? await playMeter({ kind:'kick' }) : null) : api.pay(.5) ? await (k === 1 ? playRunner({ title:'TURBO RUN' }) : playDodge({ title:'ASTEROID DODGE' })) : null; if(sc == null) break;
    const id = ['bowl', 'arc1', 'arc2'][k]; l.hi = l.hi || {}; const best = sc > (l.hi[id] || 0); if(best) l.hi[id] = sc; api.passTime(k ? 10 : 35); api.save(); E.toast(`SCORE ${sc}${best ? ' · NEW BEST' : ' · best ' + l.hi[id]}`, 2800); if(best && k === 0) G.drawRoom && G.drawRoom(); } }
async function mall(){ const l = L(); await E.say([['', 'St. Clair Square. Smells like Cinnabon and the inside of a Hot Topic.']]);
  for(;;){ const k = await E.choose(['Food court', 'Electronics Boutique (games)', "Spencer's", 'Hot Topic', 'Journeys', 'Sprint store (phones)', 'Leave']); if(k === 6) break;
    if(k === 0){ const j = await E.choose(['Sbarro slice and a drink — $4.29', 'Orange Julius — $2.79', 'Chick-fil-A meal — $4.59', 'Never mind']); if(j < 3 && api.pay([4.29, 2.79, 4.59][j])){ api.passTime(20); P.stam = 1; P.tired = false; E.toast(['Pizza the size of my face.', 'Tastes like a creamsicle. No complaints.', 'Waffle fries. Enough said.'][j], 2600); } }
    if(k === 1 && G.ext) await G.ext.shopGames();
    if(k === 2){ const j = await E.choose(['Lava lamp — $19.99', 'Black-light poster — $9.99', 'Never mind']); const id = ['lava', 'poster_band'][j]; if(j < 2){ if((l.owned || []).includes(id)) await E.say([['Clerk', 'You already got one of those, man.']]); else if(api.pay([19.99, 9.99][j])){ l.owned.push(id); G.drawRoom && G.drawRoom(); } } }
    if(k === 3){ if((l.prints || []).includes('TOUR')){ await E.say([['Clerk', 'We’re out of your size.']]); continue; } if(api.pay(18)){ (l.prints = l.prints || []).push('TOUR'); api.save(); E.toast('Band tee bought. It’s in your closet (print: TOUR).', 2800); } }
    if(k === 4){ await E.say([['Clerk', 'Skate shoes are $54.99. Or you can just look at them, like everyone else.']]); if((await E.choose(['Buy them', 'Just looking'])) === 0 && api.pay(54.99)){ G.chrisLook.shoes = '#f2f2f2'; l.look = { ...G.chrisLook }; E.setOutfit({}); api.save(); } }
    if(k === 5) await phoneStore(); } }
// flip phone: $79.99, $29.99 a month on the 1st, 300 minutes, texts 10 cents
async function phoneStore(){ const l = L(); if(l.cell){ await E.say([['Sprint guy', `You have ${l.cell.min} minutes left this month. Want a faceplate?`]]); if((await E.choose(['Faceplate — $14.99', 'No thanks'])) === 0 && api.pay(14.99)) l.cell.plate = true; return; }
  await E.say([['Sprint guy', 'Flip phone, color screen, 300 minutes for $29.99 a month. Nights and weekends free. Phone is $79.99.'], ['Chris', 'Color screen?'], ['Sprint guy', 'Color screen.']]);
  if((await E.choose(['Buy it ($79.99)', 'Maybe later'])) === 0 && api.pay(79.99)){ l.cell = { min:300, month:dateOf(l.dayCount).getMonth() }; api.save(); news('phone'); E.toast('📱 Flip phone! Press C to open it (not while grounded).', 3600); } }
const CARS = [['1992 Honda Civic', 'sedan', '#9a9aa0', 2400], ['1995 Chevy Cavalier', 'sedan', '#c8202a', 3200], ['1996 Ford Ranger', 'pickup', '#2a4a7a', 4600], ['1997 Jeep Cherokee', 'suv', '#2a4a2a', 5900], ['1998 Ford Taurus SE', 'taurus', '#e8e8e8', 6400]];
async function carLot(){ const l = L(), have = l.cash + (l.bank || 0), trade = 900; await E.say([['Salesman', G.greet('BELLEVILLE AUTO SALES', 'Everything on the lot runs. Mostly. What can I do for you?')]]);
  const k = await E.choose([...CARS.map(c => `${c[0]} — $${c[3].toLocaleString()}`), 'Set one as my savings goal', 'Just looking']); if(k === CARS.length + 1) return;
  if(k === CARS.length){ const j = await E.choose([...CARS.map(c => c[0]), 'Never mind']); if(j < CARS.length){ l.goal = { name:CARS[j][0], cost:CARS[j][3] - trade }; api.save(); E.toast(`🎯 Saving for the ${CARS[j][0]} ($${(CARS[j][3] - trade).toLocaleString()} after trade-in)`, 3600); } return; }
  const c = CARS[k], due = c[3] - trade; await E.say([['Salesman', `With the Taurus as a trade-in, that's $${due.toLocaleString()} out the door. Cash or savings, no financing for 16-year-olds.`]]);
  if(have < due){ await E.say([['Salesman', `You’re about $${Math.ceil(due - have).toLocaleString()} short, chief. Come back.`]]); return; }
  if((await E.choose(['Buy it', 'Let me think'])) !== 0) return; let r = due; const fromCash = Math.min(Math.max(0, l.cash), r); l.cash -= fromCash; r -= fromCash; l.bank = (l.bank || 0) - r;
  l.car = { type:c[1], color:c[2], name:c[0] }; if(l.goal && l.goal.name === c[0]) l.goal = null; api.save(); G.drawCar && G.drawCar(); news('car'); await E.say([['Salesman', 'Keys. Congratulations. It’s parked at your house.'], ['', `My own ${c[0]}. Dad is going to have opinions.`]]); }

// ---------- world dressing ----------
function payPhone(x, z, ry){ yb = T(x, z); box(.12, 1.9, .12, '#7a7a7a', x, 0, z, ry); box(.6, .8, .3, '#a8a8a8', x, 1.1, z, ry, true); sign('PHONE', { bg:'#1a4a9a', fg:'#fff', size:40, w:200, h:60 }, .5, .14, x, 2.05, z, ry);
  api.add({ x, z, r:1.6, prompt:'USE THE PAY PHONE (35¢)', use:async () => { if(G.ext && G.ext.grounded()){ E.toast('Grounded. Even pay phones feel off-limits.', 2400); return; } if(!api.pay(.35)) return; E.cut(true); await G.ext.makePlans(); E.cut(false); } }); }
function paperBox(x, z, ry, col){ yb = T(x, z); box(.5, .95, .45, col, x, 0, z, ry, true); sign('NEWS', { bg:col, fg:'#fff', size:40, w:160, h:60 }, .4, .14, x + Math.sin(ry) * .23, .78, z + Math.cos(ry) * .23, ry);
  api.add({ x, z, r:1.4, prompt:'BUY A PAPER (50¢)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && L().min >= 300, use:async () => { if(api.pay(.5) && G.ext) await G.ext.paper(); } }); }
function cop(x, z, ry){ const c = E.makeCar('#1a1a1a', { type:'taurus' }); c.position.set(x, T(x, z), z); c.rotation.y = ry; add(c); const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, .12, .25), new THREE.MeshBasicMaterial({ color:0xff2020 })); bar.position.set(0, 1.55, -.2); c.add(bar); c.userData.bar = bar; return c; }
// collectible 2003 Cardinals baseball cards on sidewalks around town
function cardSpots(){ const TL = (G.townLines || []).filter(l => l.len > 80 && !l.core), out = []; for(let i = 0; out.length < 25 && i < 400; i++){ const l = TL[(i * 37) % TL.length], p = l.p[Math.floor(rnd(i) * (l.p.length - 1))], q = l.p[Math.min(l.p.length - 1, l.p.indexOf(p) + 1)], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, s = i % 2 ? 1 : -1, o = (l.hw || 4) + 1.4;
    const x = (p[0] + q[0]) / 2 - (q[1] - p[1]) / d * o * s, z = (p[1] + q[1]) / 2 + (q[0] - p[0]) / d * o * s; if(Math.abs(x) < 600 && Math.abs(z) < 800 && !out.some(a => Math.hypot(a[0] - x, a[1] - z) < 60)) out.push([x, z]); } return out; }
const PLAYERS = ['Albert Pujols', 'Jim Edmonds', 'Scott Rolen', 'Edgar Renteria', 'Matt Morris', 'Woody Williams', 'Mike Matheny', 'Tino Martinez', 'J.D. Drew', 'Fernando Viña', 'Jason Isringhausen', 'Kerry Robinson', 'So Taguchi', 'Orlando Palmeiro', 'Miguel Cairo', 'Eduardo Pérez', 'Bo Hart', 'Garrett Stephenson', 'Jason Simontacchi', 'Brett Tomko', 'Cal Eldred', 'Steve Kline', 'Jeff Fassero', 'Tony La Russa', 'Stan Musial (1958 reprint)'];

// ---------- night sky + moon (new moon on Sept 25-26 2003) ----------
let sky = null;
function makeSky(){ const g = new THREE.Group(), n = 1400, a = new Float32Array(n * 3); for(let i = 0; i < n; i++){ const u = rnd(i * 1.7) * Math.PI * 2, v = rnd(i * 3.3) * .95 + .05; a[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * 380; a[i * 3 + 1] = v * 380; a[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * 380; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(a, 3)); const st = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:1.3, sizeAttenuation:false, fog:false, transparent:true, opacity:.85, depthWrite:false })); g.add(st);
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const tx = new THREE.CanvasTexture(cv); const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map:tx, fog:false, transparent:true, depthWrite:false })); moon.scale.set(22, 22, 1); moon.position.set(-150, 250, 220); g.add(moon); moon.raycast = st.raycast = () => {};   // camera line-of-sight checks must ignore the sky
  g.userData = { cv, tx, ph:-1 }; g.renderOrder = -1; G.scene.add(g); return g; }
function drawMoon(dc){ const u = sky.userData, ph = ((dc + 1) % 29.53) / 29.53; if(Math.abs(ph - u.ph) < .01) return; u.ph = ph; const g = u.cv.getContext('2d'); g.clearRect(0, 0, 128, 128);
  g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(64, 64, 40, 0, Math.PI * 2); g.fill(); const k = Math.cos(ph * Math.PI * 2); g.fillStyle = 'rgba(10,14,28,.94)'; g.beginPath();
  if(ph < .5){ g.arc(64, 64, 40.5, Math.PI / 2, -Math.PI / 2, false); g.ellipse(64, 64, Math.abs(k) * 40.5, 40.5, 0, -Math.PI / 2, Math.PI / 2, k < 0); } else { g.arc(64, 64, 40.5, -Math.PI / 2, Math.PI / 2, false); g.ellipse(64, 64, Math.abs(k) * 40.5, 40.5, 0, Math.PI / 2, -Math.PI / 2, k < 0); } g.fill(); u.tx.needsUpdate = true; }

// ---------- snow that sticks: grassy materials go white on snow days ----------
let snowMats = null;
function snow(on){ if(!snowMats){ snowMats = new Map(); G.scene.traverse(o => { const m = o.material; if(!m || Array.isArray(m) || !m.color || m.transparent || snowMats.has(m)) return; const c = m.color; if(c.g > c.r * 1.12 && c.g > c.b * 1.1 && c.g < .75) snowMats.set(m, c.clone()); }); }
  snowMats.forEach((c, m) => { m.color.copy(c); if(on) m.color.lerp(new THREE.Color(0xeef2f6), .72); }); }

// ---------- sounds of the era (all synthesised, quiet) ----------
function amb(dt, l){ const v = G.set.amb ?? .8; if(!v || G.indoors || G.mission) return; amb.t = (amb.t || 0) - dt; if(amb.t > 0) return; amb.t = 3 + Math.random() * 6; const d = dateOf(l.dayCount), m = d.getMonth(), t = l.min;
  if((m >= 5 && m <= 8) && t > 660 && t < 1200 && !G.wet){ for(let i = 0; i < 6; i++) E.tone(4400 + i * 40, i * .18, .16, 'sawtooth', .004 * v); }
  if((t > 1320 || t < 300) && Math.random() < .12){ E.tone(311, 0, 1.8, 'sawtooth', .012 * v); E.tone(370, 0, 1.8, 'sawtooth', .012 * v); E.tone(311, 2.2, 2.6, 'sawtooth', .01 * v); E.tone(370, 2.2, 2.6, 'sawtooth', .01 * v); }
  if(m >= 4 && m <= 8 && t > 840 && t < 1140 && Math.hypot(P.p.x, P.p.z - 24) < 90 && Math.random() < .2){ [659, 587, 523, 587, 659, 659, 659].forEach((f, i) => E.tone(f, i * .28, .22, 'triangle', .02 * v)); } }

// ---------- street events (one a day, somewhere around town) ----------
function streetEvent(l){ if(ev){ ev.objs.forEach(o => G.scene.remove(o)); ev.n.forEach(n => n.remove()); ev.it.forEach(E.delInter); ev = null; }
  const dc = l.dayCount || 0, TL = (G.townLines || []).filter(x => x.len > 120 && !x.core); if(!TL.length) return; const ln = TL[Math.floor(rnd(dc * 5.1) * TL.length)], p = ln.p[ln.p.length >> 1], q = ln.p[(ln.p.length >> 1) - 1] || ln.p[0], d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, sx = -(p[1] - q[1]) / d, sz = (p[0] - q[0]) / d, o = (ln.hw || 4);
  const kind = ['bender', 'lemonade', 'pulled', 'garage'][Math.floor(rnd(dc + .5) * 4)], x = p[0] + sx * (o + 3), z = p[1] + sz * (o + 3), ry = Math.atan2(p[0] - q[0], p[1] - q[1]); ev = { objs:[], n:[], it:[], kind, x, z }; yb = T(x, z);
  const car = (c, dx, dz, rr) => { const m = E.makeCar(c); m.position.set(p[0] + sx * 1.9 + dx, T(p[0], p[1]), p[1] + sz * 1.9 + dz); m.rotation.y = ry + rr; G.scene.add(m); ev.objs.push(m); return m; };
  const person = (nm, dx, dz, look) => { const n = E.npc(nm, look || api.randomLook(Math.random() < .5), x + dx, z + dz, { face:ry }); n.townie = true; ev.n.push(n); return n; };
  const talk = (n, lines, extra) => ev.it.push(E.addInter({ x:() => n.p.x, z:() => n.p.z, r:2, prompt:'TALK', when:() => G.ctl && !G.mission && !G.uiOpen && !G.driving, use:async () => { n.look(P.p.x, P.p.z); E.cut(true); await E.say(lines); if(extra) await extra(); E.cut(false); } }));
  if(kind === 'bender'){ car('#7a7a80', 0, 0, .15); car('#a83a2a', Math.cos(ry) * -4.6, -Math.sin(ry) * -4.6, -.1); const a = person('Driver', 0, 0), b = person('Other driver', 1.5, .8); talk(a, [['Driver', 'She stopped short! Who stops short on a green?'], ['Chris', 'Is everybody okay?'], ['Driver', 'Everybody’s fine. My bumper’s not.']]); talk(b, [['Other driver', 'I had a squirrel. You don’t hit a squirrel.']]); }
  if(kind === 'pulled'){ const c = car('#2a4a6a', 0, 0, 0), k = cop(p[0] + sx * 1.9 - Math.sin(ry) * 7, p[1] + sz * 1.9 - Math.cos(ry) * 7, ry); ev.objs.push(k); objs.splice(objs.indexOf(k), 1); ev.flash = k; const o2 = person('Officer', 0, 0, { shirt:'#2a3a5a', pants:'#1a1a2a', hat:'cap', hatColor:'#1a1a2a', top:'polo' }); talk(o2, [['Officer', 'Keep walking, son. Nothing to see.']]); }
  if(kind === 'lemonade'){ const t = box(1.4, .75, .7, '#c8a878', x, 0, z, ry); objs.pop(); ev.objs.push(t); const s2 = sign('LEMONADE 25¢', { bg:'#f2e04a', fg:'#c8202a', size:40, w:256, h:70 }, 1.3, .35, x, 1.1, z, ry); objs.pop(); ev.objs.push(s2);
    [0, 1].forEach(i => { const k = person('Kid', -.4 + i * .8, -.8, { ...api.randomLook(i === 1), scale:.7 }); if(!i) talk(k, [['Kid', 'Lemonade? It’s a quarter. My sister made it so it’s kinda sour.']], async () => { if((await E.choose(['Buy a cup (25¢)', 'No thanks'])) === 0 && api.pay(.25)){ P.stam = 1; E.toast('Kinda sour. Worth a quarter.', 2200); } }); }); }
  if(kind === 'garage'){ const t = box(2.4, .75, 1, '#8a6a4a', x, 0, z, ry); objs.pop(); ev.objs.push(t); const s2 = sign('GARAGE SALE', { bg:'#fff', fg:'#c8202a', size:44, w:256, h:70 }, 1.4, .4, x + 2, 1.2, z, ry); objs.pop(); ev.objs.push(s2);
    const h = person('Neighbor', 0, -1.2); talk(h, [['Neighbor', 'Everything on the table’s a dollar. The lava lamp works, mostly.']], async () => { if((await E.choose(['Buy something for $1', 'Just looking'])) === 0 && api.pay(1)){ const l2 = L(); const it = ['Old Nintendo cartridge', 'Beanie Baby', 'Tamagotchi', 'Magic 8-Ball'][Math.floor(Math.random() * 4)]; (l2.trinkets = l2.trinkets || []).push(it); api.save(); G.drawRoom && G.drawRoom(); E.toast(`Bought: ${it}. It’s on your shelf.`, 2600); } }); } }

// ---------- switch on ----------
export function life23On(a){ api = a; const l = L(); objs.forEach(o => G.scene.remove(o)); objs = []; clerks.forEach(n => n.remove()); clerks = []; l.visits = l.visits || {}; l.cds = l.cds || []; l.cards = l.cards || [];
  // new shops
  ['BLOCKBUSTER VIDEO', 'BLOCKBUSTER'].forEach((n, i) => { const s = shop(n); if(s){ (i ? blockbusterEast : blockbusterWest)(s); bbInside(s); } });
  { const s = shop('STREETSIDE RECORDS'); if(s){ counter(s, 'RECORD STORE COUNTER', records); clerk(s, 'Clerk', { ...api.randomLook(false), hairStyle:'shaggy', top:'graphic', print:'ROCK' }); posters(s, [['NEW MUSIC TUESDAYS', '#1a1a1a', '#e8c832'], ['TOP 40', '#c8202a'], ['IMPORTS', '#2a4a8a'], ['USED CDS $7.99', '#3a3a3a', '#e8c832']]); } }
  { const s = shop('WEHRENBERG CINEMAS'); if(s){ counter(s, 'BOX OFFICE', cinema); clerk(s, 'Box office', { ...api.randomLook(true), shirt:'#8a1a2a', top:'polo' }); const sh = showing(l.dayCount || 0); posters(s, sh.slice(0, 6).map((m, i) => [m.toUpperCase().split(': ').join(':\n').split('\n'), ['#1a1a2a', '#3a1a1a', '#1a2a3a', '#2a2a1a', '#2a1a2a', '#1a3a2a'][i], '#f2e8c8'])); } }
  { const s = shop('BELLEVILLE BOWL'); if(s){ counter(s, 'FRONT DESK (LANES + ARCADE)', bowl); clerk(s, 'Front desk'); const f = frame(s); for(let i = 0; i < 4; i++){ const [x, z] = f.inn(-f.hl + 3 + i * 2.6, f.hd * 2 - 1.2); box(1, 1.7, .8, ['#2a2a6a', '#6a1a1a', '#1a5a2a', '#3a3a3a'][i], x, 0, z, f.ry, true); const [sx, sz] = f.inn(-f.hl + 3 + i * 2.6, f.hd * 2 - 1.62); sign('INSERT COIN', { bg:'#000', fg:'#3af', size:30, w:200, h:60 }, .8, .25, sx, 1.45, sz, f.ry); } } }
  { const s = shop('ST. CLAIR SQUARE'); if(s){ counter(s, 'WALK THE MALL', mall); const f = frame(s); [["SPENCER'S", '#1a1a1a', '#e8c832'], ['HOT TOPIC', '#111', '#c8202a'], ['JOURNEYS', '#1a1a1a', '#fff'], ['ELECTRONICS BOUTIQUE', '#1a2a6a', '#fff'], ['SPRINT', '#e8c822', '#111'], ['SBARRO', '#2a6a3a', '#fff']].forEach((t, i) => { const [x, z] = f.inn(-f.hl + 4 + i * ((2 * f.hl - 8) / 5), f.hd * 2 - .45); sign(t[0], { bg:t[1], fg:t[2], size:40, w:512, h:80 }, 5, .8, x, 3.6, z, f.ry); }); } }
  { const s = shop('BELLEVILLE AUTO SALES'); if(s){ counter(s, 'TALK TO THE SALESMAN', carLot); clerk(s, 'Salesman', { ...api.randomLook(false), top:'polo', shirt:'#f2f2f2', pants:'#3a3a4a' }); const f = frame(s);
    CARS.forEach((c, i) => { const [x, z] = f.at(-f.hl + 3 + i * ((2 * f.hl - 6) / 4), 9); const m = E.makeCar(c[2], { type:c[1] }); m.position.set(x, T(x, z), z); m.rotation.y = f.ry + Math.PI / 2; add(m); G.colliders.push({ x0:x - 2.4, x1:x + 2.4, z0:z - 2.4, z1:z + 2.4, y0:0, y1:1.6 }); sign(`$${c[3].toLocaleString()}`, { bg:'#fff', fg:'#c8202a', size:60, w:256, h:90 }, .7, .25, x, 1.25, z, f.ry); });
    const [bx, bz] = f.at(0, 15); for(let i = -4; i <= 4; i++){ const [x, z] = f.at(i * 1.4, 15); const fl = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 3), E.mat(['#c8202a', '#f2f2f2', '#1b3a8a'][(i + 9) % 3])); fl.position.set(x, yb + 3.4, z); fl.rotation.z = Math.PI; add(fl); } box(.1, 3.6, .1, '#888', bx + f.nz * 6, 0, bz + f.nx * 6, 0); box(.1, 3.6, .1, '#888', bx - f.nz * 6, 0, bz - f.nx * 6, 0); } }
  { const s = shop('SPLASH CAR WASH'); if(s){ const f = frame(s), [x, z] = f.at(0, 5); api.add({ x, z, r:4, prompt:'CAR WASH ($5)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && G.chrisCar && Math.hypot(G.chrisCar.position.x - x, G.chrisCar.position.z - z) < 10,
      use:async () => { if(!shopOpen(s.name)){ E.toast(`CLOSED · ${G.shopHours(s.name)}`, 2400); return; } if(!api.pay(5)) return; E.cut(true); await E.fade(true, 500); api.passTime(15); L().dirt = 0; dirt(); await E.card('SPOTLESS', 'SPRAY · FOAM · RINSE · WAX', 1500); await E.fade(false, 500); E.cut(false); } }); } }
  // pay phones + newspaper boxes outside the busy spots
  [[372, 190, 0], [300, 230, Math.PI], [430, 222, 0], [-300, -598, Math.PI]].forEach(p => payPhone(...p));
  [[366, 190, 0, '#2a5a9a'], [368, 190, 0, '#c8202a'], [-296, -598, Math.PI, '#2a5a9a'], [6, 15.8, 0, '#2a5a9a']].forEach(p => paperBox(...p));
  // Skyview drive-in (Fri + Sat nights), football Fridays, homecoming bonfire, July 4th
  { const sv = (G.townPlaced || {})['SKYVIEW DRIVE-IN']; if(sv) api.add({ x:sv[0], z:sv[1], r:14, prompt:'WATCH A MOVIE AT THE DRIVE-IN ($6 A CARLOAD)', when:() => { const dw = dowOf(L()); return !G.mission && G.ctl && !G.uiOpen && (dw === 5 || dw === 6) && L().min >= 1170 && L().min < 1410 && G.chrisCar && Math.hypot(G.chrisCar.position.x - sv[0], G.chrisCar.position.z - sv[1]) < 40; },
    use:async () => { if(!api.pay(6)) return; const l2 = L(), list = showing(l2.dayCount || 0), m = list[0] || 'a double feature', fr = Object.entries(l2.fr || {}).filter(x => x[1] >= 3).map(x => x[0])[0]; E.cut(true); await E.fade(true, 600); api.passTime(130); await E.card('THE SKYVIEW', String(m).toUpperCase(), 1800); await E.fade(false, 600);
      await E.say(fr ? [['', `${fr} rode along. We tuned the movie in on the car radio and talked through half of it.`]] : [['', 'Sound comes through the car radio. Bugs come through the window. Still the best way to see a movie.']]); if(fr){ l2.fr[fr]++; } api.save(); E.cut(false); } }); }
  api.add({ x:-365, z:-518, r:8, prompt:'FRIDAY NIGHT FOOTBALL ($4)', when:() => { const d = dateOf(L().dayCount), m = d.getMonth(); return !G.mission && G.ctl && !G.uiOpen && d.getDay() === 5 && m >= 8 && m <= 10 && L().min >= 1140 && L().min < 1320; },
    use:async () => { if(!api.pay(4)) return; E.cut(true); await E.fade(true, 500); api.passTime(150); await E.card('BELLEVILLE WEST MAROONS', ['WIN 28–14', 'LOSE 10–17', 'WIN 35–7', 'LOSE 21–24'][(L().dayCount || 0) % 4], 2000); await E.fade(false, 500); await E.say([['', 'Student section, the band, and nachos that are technically cheese. Classic Friday.']]); E.cut(false); } });
  let fire = null;
  // ponytail: bonfire is a glowing cone + light, swap for particles if it reads too flat
  const bonfire = on => { if(on && !fire){ fire = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 8), new THREE.MeshBasicMaterial({ color:0xff7a1a, transparent:true, opacity:.85 })); c.position.y = 2; const pl = new THREE.PointLight(0xff8a2a, 3, 40); pl.position.y = 3; fire.add(c, pl); fire.position.set(-250, T(-250, -560), -560); G.scene.add(fire); }
    if(!on && fire){ G.scene.remove(fire); fire = null; } };
  // July 4th fireworks over Schranz Park
  let fw = []; const boom = (x, z) => { const n = 60, g = new THREE.BufferGeometry(), a = new Float32Array(n * 3), v = []; for(let i = 0; i < n; i++){ a[i * 3] = x; a[i * 3 + 1] = 40; a[i * 3 + 2] = z; const t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1; v.push([Math.cos(t) * Math.sqrt(1 - u * u) * 9, u * 9, Math.sin(t) * Math.sqrt(1 - u * u) * 9]); } g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color:[0xff3030, 0xffffff, 0x3a7aff, 0xffd030][Math.random() * 4 | 0], size:.9, fog:false, transparent:true })); G.scene.add(p); fw.push({ p, v, t:0 }); E.tone(60, .6, .5, 'sawtooth', .03, 30); };
  // flip phone (C)
  const ck = async e => { if(e.code !== 'KeyC' || G.mission || !G.ctl || G.uiOpen || G.dialogOn || G.paused) return; const l2 = L(); if(!l2.cell) return; if(G.ext && G.ext.grounded()){ E.toast('Dad took your cell phone too.', 2200); return; }
    E.cut(true); const k = await E.choose([`📱 Call someone (${l2.cell.min} min left)`, 'Text a friend (10¢)', 'Snake', 'Close']); if(k === 0){ const free = dowOf(l2) % 6 === 0 || l2.min >= 1260 || l2.min < 420; if(!free) l2.cell.min = Math.max(0, l2.cell.min - 4); if(l2.cell.min <= 0 && !free) await E.say([['', 'Out of minutes. Nights and weekends are free though.']]); else await G.ext.makePlans(); }
    if(k === 1){ const ns = ['Zeke', 'Jax', 'Matt', 'Milo'], j = await E.choose([...ns, 'Never mind']); if(j < 4 && api.pay(.1)){ const f = (l2.fr || {})[ns[j]] || 0; await E.say([[ns[j] + ' (text)', f < -2 ? 'k' : ['wut up', 'hey', 'yo whats good', 'what'][j]]]); l2.fr = l2.fr || {}; l2.fr[ns[j]] = f + .5; } }
    if(k === 2){ const sc = await playDodge({ title:'SNAKE' }); E.toast(`Snake: ${sc}`, 2000); } api.save(); E.cut(false); };
  addEventListener('keydown', ck);
  // car stereo: T plays your CDs instead of the radio (needs the CD stereo); bedroom boombox plays them at home
  const tk = e => { if(e.code !== 'KeyT' || !G.driving || G.paused || G.dialogOn) return; const l2 = L(); if(!(l2.car && l2.car.stereo)){ E.toast('The Taurus only has a tape deck. A CD stereo is at the auto counter.', 2600); return; } if(!l2.cds.length){ E.toast('No CDs. Streetside Records has some.', 2400); return; }
    G.cdOnly = G.cdOnly ? null : G.radio.st.tracks.map((t, i) => l2.cds.includes(t[1]) ? i : -1).filter(i => i >= 0); G.radio.reset && G.radio.reset(); E.toast(G.cdOnly ? '💿 CD' : '📻 Back to the radio', 1800); };
  addEventListener('keydown', tk);
  api.add({ x:-0.9, z:-1.5, y:3.2, r:1.6, prompt:'PLAY A CD ON THE BOOMBOX', when:() => !G.mission && G.ctl && !G.uiOpen && (L().owned || []).includes('stereo') && L().cds.length, use:async () => { const l2 = L();
      if(G.homeStereo){ G.homeStereo = false; G.cdOnly = null; G.radio.reset && G.radio.reset(); E.toast('Music off.', 1600); return; } if(!G.radio.src){ const p = prompt('Music passcode'); if(!p || !(await G.radio.unlock(p))){ E.toast('Wrong passcode.', 2000); return; } }
      const j = await E.choose([...l2.cds, 'Never mind']); if(j >= l2.cds.length) return; G.cdOnly = G.radio.st.tracks.map((t, i) => t[1] === l2.cds[j] ? i : -1).filter(i => i >= 0); G.homeStereo = true; G.radio.reset && G.radio.reset(); E.toast(`💿 ${l2.cds[j]}`, 2200); } });
  // late-night drive-thru run (10 PM – 1 AM, at your car, with a friend who likes you)
  api.add({ x:-17, z:12.5, r:2.4, prompt:'LATE-NIGHT DRIVE-THRU RUN', when:() => { const t = L().min; return !G.mission && G.ctl && !G.uiOpen && !G.driving && (t >= 1320 || t < 60) && !(G.ext && G.ext.grounded()); },
    use:async () => { const l2 = L(), ok = Object.entries(l2.fr || {}).filter(x => x[1] >= 2).map(x => x[0]); if(!ok.length){ await E.say([['', 'Nobody’s picking up. Guess I’m not that cool yet.']]); return; } E.cut(true);
      const w = await E.choose([...ok.map(n => 'Call ' + n), 'Never mind']); if(w >= ok.length){ E.cut(false); return; } const p = await E.choose(['White Castle — $3.50', 'Taco Bell — $4.00', "Steak 'n Shake — $4.50"]); if(!api.pay([3.5, 4, 4.5][p])){ E.cut(false); return; }
      await E.fade(true, 500); api.passTime(50); await E.card('DRIVE-THRU', ['WHITE CASTLE', 'TACO BELL', "STEAK 'N SHAKE"][p], 1500); await E.fade(false, 500);
      await E.say([[ok[w], ['Okay this was a good idea. Don’t tell my mom.', 'Bro. Why is food better at midnight.', 'Ten sliders. No regrets. Some regrets.', 'This is the most fun I’ve had all week, honestly.'][Math.random() * 4 | 0]]]); l2.fr[ok[w]] += 1; api.save(); E.cut(false); } });
  // chores at home
  const chore = (x, z, prompt, ok, mins, pay, line, key) => api.add({ x, z, r:1.8, prompt, when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && ok() && L().chores?.[key] !== (L().dayCount || 0),
    use:async () => { const l2 = L(); E.cut(true); await E.fade(true, 400); api.passTime(mins); l2.cash += pay; (l2.chores = l2.chores || {})[key] = l2.dayCount || 0; api.save(); await E.fade(false, 400); E.cut(false); E.toast(`${line} +${api.money(pay)}`, 2800); } });
  chore(-11, 3, 'MOW THE LAWN', () => dowOf(L()) === 6 && L().min > 540 && L().min < 1140 && !G.wet, 40, 10, 'Lawn mowed. Dad paid up.', 'mow');
  chore(-9, -12.5, 'TAKE OUT THE TRASH', () => dowOf(L()) === 2 && L().min > 1080, 5, 2, 'Trash at the curb.', 'trash');
  chore(-13, 9, "WASH DAD'S CAR", () => dowOf(L()) === 0 && L().min > 600 && L().min < 1140 && !G.wet, 35, 8, "Dad's car is shining. He'll still find a spot I missed.", 'wash');
  // Schnucks breakroom: coworkers to talk to (small talk only)
  if(G.breakTV){ const v = new THREE.Vector3(); G.breakTV.getWorldPosition(v); const BR = [['Deb', 'Bakery’s out of the good donuts again. Don’t look at me like that.'], ['Tony', 'Produce truck was two hours late. I’ve been stacking bananas since six.'], ['Rhonda', 'If one more person asks me for a price check on a cantaloupe...']];
    BR.forEach((b, i) => { const n = E.npc(b[0], api.randomLook(i !== 1), v.x + 1.5 + i * .9, v.z + 2.2, { face:Math.PI, y:v.y - 1.4 }); clerks.push(n); api.add({ x:() => n.p.x, z:() => n.p.z, y:v.y - 1.4, r:1.6, prompt:'TALK', use:async () => { E.cut(true); await E.say([[b[0], b[1]], ['Chris', ['Rough.', 'Same, honestly.', 'Living the dream.'][i]]]); E.cut(false); } }); }); }
  // Oakmont neighbours: a man mowing on weekends, a dog behind a fence, kids on bikes after school, the neighbour who hates loud music
  const mower = E.npc('Mr. Haskins', { shirt:'#8a8a6a', pants:'#4a4a3a', hair:'#c8c8c8', top:'polo' }, -62, 12, { speed:1 }); clerks.push(mower);
  const dogN = E.npc('Rocky', { dog:true, color:'#3a2a1a', dark:'#111', size:1 }, 42, 6, { speed:2 }); clerks.push(dogN);
  const bikers = [0, 1].map(i => { const n = E.npc('Kid', { ...api.randomLook(i === 1), scale:.7 }, -40 + i * 4, 24, { speed:4.2 }); n.townie = true; clerks.push(n); return n; });
  // world state
  const cops = [], TL = (G.townLines || []).filter(x => x.k === 0 && x.len > 200).sort((x, y) => y.len - x.len).slice(0, 3);
  TL.forEach(ln => { const i = ln.p.length >> 1, p = ln.p[i], q = ln.p[i - 1] || ln.p[0], d = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, o = (ln.hw || 4) + 2.6; cops.push(cop(p[0] - (p[1] - q[1]) / d * o, p[1] + (p[0] - q[0]) / d * o, Math.atan2(p[0] - q[0], p[1] - q[1]))); });
  const cs = cardSpots(), cardM = cs.map((c, i) => { if(l.cards.includes(i)) return null; const m = new THREE.Mesh(new THREE.BoxGeometry(.28, .4, .03), new THREE.MeshBasicMaterial({ color:0xd8202a })); m.position.set(c[0], T(c[0], c[1]) + .9, c[1]); return add(m); });
  if(!sky) sky = makeSky(); let lastDc = -1, snowOn = false, speedT = 0, lastHome = false, mowT = 0, barkT = 0, complainDay = -1;
  api.addTick(dt => { if(G.mission){ sky.visible = false; return; } const l2 = L(), dc = l2.dayCount || 0, d = dateOf(dc), t = l2.min;
    if(dc !== lastDc){ lastDc = dc; streetEvent(l2); drawMoon(dc); const sn = weatherFor(dc) === 'snow' || (weatherFor(dc - 1) === 'snow' && d.getMonth() >= 10); if(sn !== snowOn){ snowOn = sn; snow(sn); }
      if(weatherFor(dc) === 'snow' && d.getDay() > 0 && d.getDay() < 6) E.toast('❄ SNOW DAY. School’s closed. The radio said so.', 4000);
      if(l2.cell && d.getMonth() !== l2.cell.month){ l2.cell.month = d.getMonth(); l2.cell.min = 300; l2.cash -= 29.99; E.toast('📱 Sprint bill: −$29.99. Minutes reset to 300.', 3400); }
      l2.dirt = Math.min(1, (l2.dirt || 0) + (G.wet ? .25 : .08)); dirt(); if(!l2.tire && rnd(dc * 2.7) < .05) l2.tire = 'low'; api.save(); }
    sky.visible = (G.time === 'night' || G.time === 'dusk') && !G.indoors && G.wx !== 'cloudy' && !G.wet; if(sky.visible) sky.position.copy(G.cam.position);
    // shop clerks go home when the store closes
    for(const n of clerks) if(n.shop) n.o.visible = shopOpen(n.shop, t) && Math.hypot(n.p.x - P.p.x, n.p.z - P.p.z) < 70;
    // cops: speeding near a parked cruiser gets you pulled over
    const c = G.driving; if(c && G.ctl && !G.uiOpen){ const sp = Math.abs(c.speed); const cp = cops.find(k => Math.hypot(k.position.x - c.car.position.x, k.position.z - c.car.position.z) < 45); if(cp && sp > 21) speedT += dt; else speedT = Math.max(0, speedT - dt);
      if(l2.tire === 'flat') c.speed = Math.max(-5, Math.min(7, c.speed)); else if(l2.tire === 'low') c.speed *= Math.pow(.985, dt * 60);
      if(speedT > 1.2){ speedT = 0; pullOver(c); }
      if(!l2.tire && sp > 6 && rnd(dc * 9.1 + Math.floor(G.t / 60)) < .0006){ l2.tire = 'flat'; E.toast('💥 Flat tire. Limp it to the gas station (auto counter).', 3600); E.tone(90, 0, .3, 'square', .06); } }
    // collectible cards
    if(!G.driving) cardM.forEach((m, i) => { if(!m || !m.visible) return; m.rotation.y += dt * 2; if(Math.hypot(m.position.x - P.p.x, m.position.z - P.p.z) < 1.3){ m.visible = false; l2.cards.push(i); E.sfx('ok'); const n = l2.cards.length;
      E.toast(`⚾ Found a card: ${PLAYERS[i]} (${n}/25)` + (n === 10 ? '<br>Half a binder. Mom says she’ll buy a binder if I stop leaving them on the stairs.' : n === 25 ? '<br>FULL SET! The card shop on Main offered $100. I said no. Obviously.' : ''), 3600); if(n === 25) news('cards'); G.drawRoom && G.drawRoom(); api.save(); } });
    // home: parents react to what happened since the last time you came home
    const home = P.p.x > -8 && P.p.x < 8 && P.p.z > -12 && P.p.z < 4 && P.p.y < 1; if(home && !lastHome && (l2.news || []).length && G.ctl && !G.uiOpen){ const k = l2.news.shift(); api.save(); parents(k); } lastHome = home;
    // neighbours
    const wkend = d.getDay() === 0 || d.getDay() === 6; mower.o.visible = wkend && t > 600 && t < 1020 && !G.wet; if(mower.o.visible && (mowT -= dt) <= 0){ mowT = 6; mower.go([[-70 + Math.random() * 16, 11.6 + Math.random() * 2]]); if(near(-62, 12, 25)) E.tone(110, 0, 1.2, 'sawtooth', .01, 105); }
    if(near(42, 6, 9) && (barkT -= dt) <= 0){ barkT = 5 + Math.random() * 6; E.sfx('bark'); }
    const kids = d.getDay() > 0 && d.getDay() < 6 && t > 930 && t < 1110 && !G.wet; bikers.forEach((n, i) => { n.o.visible = kids; if(kids && !n.path) n.go([[i ? 60 : -60, 23.5 + i]]).then(() => n.go([[i ? -60 : 60, 23.5 + i]])); });
    if((G.radioOn || G.homeStereo) && near(0, 0, 30) && (t > 1320 || t < 420) && complainDay !== dc){ complainDay = dc; E.toast('<b>Mrs. Patterson (next door):</b> It is the middle of the night! Turn that racket DOWN.', 3800); }
    if(G.homeStereo && !near(-4, -6, 9)){ G.homeStereo = false; G.cdOnly = null; G.radio.reset && G.radio.reset(); }
    // events on the calendar
    bonfire(d.getMonth() === 9 && d.getDate() === 9 && t > 1170 && t < 1380);
    if(d.getMonth() === 6 && d.getDate() === 4 && t > 1260 && t < 1320 && Math.random() < dt * .8){ const sp = (G.townPlaced || {})['SCHRANZ PARK'] || [-420, 479]; boom(sp[0] + (Math.random() - .5) * 30, sp[1] + (Math.random() - .5) * 30); }
    fw = fw.filter(f => { f.t += dt; const a = f.p.geometry.attributes.position.array; f.v.forEach((v, i) => { a[i * 3] += v[0] * dt; a[i * 3 + 1] += (v[1] - f.t * 6) * dt; a[i * 3 + 2] += v[2] * dt; }); f.p.geometry.attributes.position.needsUpdate = true; f.p.material.opacity = Math.max(0, 1 - f.t / 2); if(f.t > 2){ G.scene.remove(f.p); return false; } return true; });
    if(ev && ev.flash) ev.flash.userData.bar.material.color.setHex(Math.floor(G.t * 4) % 2 ? 0xff2020 : 0x2040ff);
    amb(dt, l2); });
  // air pump at the gas station
  api.add({ x:438, z:242, r:2, prompt:'AIR PUMP (75¢)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && L().tire === 'low', use:async () => { if(api.pay(.75)){ L().tire = null; api.save(); E.toast('Tire’s back to 32 PSI.', 2200); } } });
  api.add({ x:428, z:229.4, r:2.2, prompt:'FIX THE FLAT ($15) / CD STEREO ($89)', when:() => !G.mission && G.ctl && !G.uiOpen && !G.driving && (L().tire === 'flat' || !(L().car && L().car.stereo)), use:async () => { const l2 = L(); E.cut(true);
      const k = await E.choose([...(l2.tire === 'flat' ? ['Patch the flat — $15'] : []), ...(l2.car && l2.car.stereo ? [] : ['Install a CD stereo — $89']), 'Never mind']); const o = (l2.tire === 'flat' ? ['flat'] : []).concat(l2.car && l2.car.stereo ? [] : ['cd'])[k];
      if(o === 'flat' && api.pay(15)){ l2.tire = null; E.toast('Patched. Good as new. Mostly.', 2200); } if(o === 'cd' && api.pay(89)){ l2.car = l2.car || {}; l2.car.stereo = true; E.toast('CD stereo in. Press T in the car to play your CDs.', 3200); } api.save(); E.cut(false); } });
  api.onOff(() => { removeEventListener('keydown', ck); removeEventListener('keydown', tk); objs.forEach(o => G.scene.remove(o)); objs = []; clerks.forEach(n => n.remove()); clerks = []; cops.length = 0; if(sky) sky.visible = false; if(snowOn) snow(false); bonfire(false); fw.forEach(f => G.scene.remove(f.p)); if(ev){ ev.objs.forEach(o => G.scene.remove(o)); ev.n.forEach(n => n.remove()); ev.it.forEach(E.delInter); ev = null; } G.homeStereo = false; G.cdOnly = null; });
  // map: open/closed shops + savings goal
  if(!G.onMap23){ G.onMap23 = true; const prev = G.onMap; G.onMap = (g, cx, cz, sc, size) => { prev && prev(g, cx, cz, sc, size); if(G.mission) return; const X = (x, z) => (z - cz) * sc + size / 2, Y = (x, z) => size / 2 - (x - cx) * sc; g.save(); g.textAlign = 'center'; g.font = 'bold 11px Arial';
    for(const s of G.shops || []){ const op = shopOpen(s.name); g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(s.name, X(...s.at), Y(...s.at) - 6); g.fillStyle = op ? '#8fe08f' : '#e08f8f'; g.fillText(s.name + (op ? '' : ' (CLOSED)'), X(...s.at), Y(...s.at) - 6); } g.restore();
    const l2 = L(), el = document.getElementById('mapside'); if(el && l2.goal){ const have = l2.cash + (l2.bank || 0), pc = Math.max(0, Math.min(1, have / l2.goal.cost)); el.innerHTML += `<h3>SAVINGS GOAL</h3><p>${l2.goal.name}</p><div class="prow"><span>$${Math.floor(have).toLocaleString()} / $${l2.goal.cost.toLocaleString()}</span><b><i class="bar">${'█'.repeat(Math.round(pc * 10))}${'░'.repeat(10 - Math.round(pc * 10))}</i></b></div>`; }
    if(el) el.innerHTML += `<h3>CARDS</h3><p class="dim">${l2.cards.length} / 25 Cardinals cards found</p>`; }; } }

function dirt(){ const car = G.chrisCar; if(!car) return; const l = L(), b = car.children[0]; if(!b || !b.material) return; const base = new THREE.Color((l.car && l.car.color) || '#2a5a9a'); b.material = b.material.clone(); b.material.color.copy(base.lerp(new THREE.Color('#6a5a44'), (l.dirt || 0) * .45)); }
async function pullOver(c){ const l = L(); G.uiOpen = true; c.speed = 0; E.tone(880, 0, .25, 'square', .04); E.tone(660, .3, .25, 'square', .04); E.tone(880, .6, .25, 'square', .04); E.cut(true);
  const first = !(l.tickets > 0); l.tickets = (l.tickets || 0) + 1; await E.say([['Officer', 'License and registration. You know how fast you were going?'], ['Chris', '...The speed limit?'], first ? ['Officer', 'Nice try. I’m letting you off with a warning. Slow it down.'] : ['Officer', 'Second time I’ve seen this car. That’s a $75 ticket.']]);
  if(!first){ l.cash -= 75; G.parentNews && G.parentNews('speeding'); } api.save(); E.cut(false); G.uiOpen = false; }
const PARENTS = { ticket:[['Dad', 'I got a letter about a ticket. Want to tell me about it?'], ['Chris', 'It was a really short red light.'], ['Dad', 'Uh huh. You’re paying it.']],
  crash:[['Dad', 'Why is there a new dent in the bumper?'], ['Chris', 'There was a... pole.'], ['Dad', 'The pole moved?']], speeding:[['Dad', 'A speeding ticket, Chris? Seventy-five dollars?'], ['Chris', 'I know. I know.'], ['Dad', 'Slow. Down.']],
  car:[['Dad', 'Whose car is that in the driveway?'], ['Chris', 'Mine. I bought it.'], ['Dad', '...Huh. Okay. I’m actually kind of proud of you.'], ['Mom', 'Your father’s going to look under the hood for an hour. Let him.']],
  phone:[['Mom', 'A cell phone? You have a phone. It’s on the wall.'], ['Chris', 'This one’s in my pocket, Mom.'], ['Mom', 'If that bill goes over, it comes out of your check.']],
  cards:[['Mom', 'Did you finish that baseball card thing?'], ['Chris', 'All twenty-five.'], ['Mom', 'Good. Now they can stop living on the stairs.']], late:[['Mom', 'Your dad waited up for you last night.']], big:[['Mom', 'What did you buy now?'], ['Chris', 'Stuff. Good stuff.'], ['Mom', 'Save some of that paycheck, Chrissy.']] };
async function parents(k){ const lines = PARENTS[k]; if(!lines) return; await E.wait(400); E.cut(true); await E.say(lines); E.cut(false); }
