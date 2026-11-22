// Back in the 2000s: The Game — Draft #1 missions M04 (book) and S01 (game original)
import * as E from './engine.js';
import { H, mnpc, mtick, minter, fail, clock, setMissions, SV, save, fillCorral, emptyCorrals, startPushing, grabFrom, deliver, train, clearTrain, park } from './game.js';
import { LOOK, two, face, faceP, pos } from './missions.js';
const { G, P } = E; const $ = id => document.getElementById(id);
const C = 'Chris', day4 = 'SEPTEMBER 26TH 2003';
const vest = '#c8102e';
const W = G.CAST = { // 2003 work cast + 1989 cast
  eric:{ shirt:'#e9e9e9', pants:'#30323a', hair:'#5d5d5d', beard:'#6a6a6a', wide:1.12, scale:1.04 }, jacob:{ shirt:'#d8dde6', pants:'#30323a', hair:'#8a8a8a', glasses:true, wide:1.08 },
  andrew:{ shirt:'#e8e0c8', pants:'#2a2a3a', hair:'#8a5a2a', vest, hairStyle:'sideswept', thin:true }, madison:{ shirt:'#f0f0f0', pants:'#2a2a3a', hair:'#3a2414', hairStyle:'pony', vest, lips:'#b5505a', scale:.95 },
  ryan:{ shirt:'#f0f0f0', pants:'#2a2a3a', hair:'#151515', skin:'#b07a52', vest, hairStyle:'afro' }, mia:{ shirt:'#f0f0f0', pants:'#2a2a3a', hair:'#c9a15a', hairStyle:'pigtails', vest, lips:'#b5505a', scale:.94 },
  jack:{ shirt:'#f0f0f0', pants:'#2a2a3a', hair:'#6a4a2a', vest, hairStyle:'buzz', wide:1.1 }, doris:{ shirt:'#a87aa8', pants:'#6a5a7a', hair:'#dcdcdc', hairStyle:'bun', glasses:true, lips:'#a05060', scale:.92 },
  sparks:{ shirt:'#7a4a6a', pants:'#3a3a4a', hair:'#9a9a9a', hairStyle:'bun', glasses:true, bottom:'skirt' }, cust:{ shirt:'#6a8a3a', pants:'#3a3a3a', hair:'#3a2a1a', beard:'#3a2a1a' },
  eric89:{ shirt:'#cc0000', pants:'#3a4a6a', hair:'#3a2414' }, jacob89:{ shirt:'#f4f4f4', pants:'#2b3550', hair:'#6a4a2a' }, lilly:{ shirt:'#cc0000', pants:'#2b3550', hair:'#e0c070', long:true, lips:'#c0505a' },
  guy:{ shirt:'#7bafd4', pants:'#334', hair:'#2a1a0a' } };
const work = { vest };

// ---- mini-games ----
function towelGame(){ return new Promise(done => { const c = $('mg'), g = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight; c.style.display = 'block'; G.ctl = false; E.unlock();
  const w = c.width, h = c.height, can = { x:w / 2, y:h * .5, r:62 };
  let made = 0, tries = 0, aim = 0, power = 0, charging = false, fly = null, msg = 'Aim with the mouse (or A / D). HOLD click or SPACE to charge, RELEASE to throw.', mt = 0, dir = 1, last = performance.now();
  G.mgSkip = () => { made = 10; };
  const start = () => { if(!fly){ charging = true; power = 0; dir = 1; } };
  const release = () => { if(!charging || fly) return; charging = false; tries++;
    const ok = power > .62 && power < .84 && Math.abs(aim) < .17; fly = { t:0, p:power, a:aim, ok }; };
  const kd = e => { if(['Space', 'KeyE', 'Enter'].includes(e.code)){ e.preventDefault(); if(!e.repeat) start(); } if(e.code === 'KeyA') aim = Math.max(-1, aim - .06); if(e.code === 'KeyD') aim = Math.min(1, aim + .06); };
  const ku = e => { if(['Space', 'KeyE', 'Enter'].includes(e.code)) release(); };
  const mm = e => { aim = Math.max(-1, Math.min(1, (e.clientX - w / 2) / (w * .35))); };
  addEventListener('keydown', kd); addEventListener('keyup', ku); c.addEventListener('mousemove', mm); c.onmousedown = start; c.onmouseup = release;
  const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now;
    if(charging){ power += dir * dt * .9; if(power >= 1){ power = 1; dir = -1; } if(power <= 0){ power = 0; dir = 1; } }
    // bathroom
    g.fillStyle = '#dfe7ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9d4d8'; for(let x = 0; x < w; x += 48) for(let y = 0; y < h * .62; y += 48) g.strokeRect(x, y, 48, 48);
    g.fillStyle = '#9fb0b6'; g.fillRect(0, h * .62, w, h * .38); g.fillStyle = '#b9c6ca'; for(let x = 0; x < w; x += 80) g.fillRect(x, h * .62, 2, h * .38);
    g.fillStyle = '#e8eef0'; g.fillRect(w * .08, h * .2, 140, 190); g.fillStyle = '#cfd8dc'; g.fillRect(w * .08 + 20, h * .2 + 120, 100, 40); // paper towel dispenser
    // can
    g.fillStyle = '#4a5a64'; g.beginPath(); g.moveTo(can.x - 70, can.y - 60); g.lineTo(can.x + 70, can.y - 60); g.lineTo(can.x + 54, can.y + 80); g.lineTo(can.x - 54, can.y + 80); g.fill();
    g.fillStyle = '#26323a'; g.beginPath(); g.ellipse(can.x, can.y - 60, 72, 16, 0, 0, 7); g.fill(); g.fillStyle = '#11181d'; g.beginPath(); g.ellipse(can.x, can.y - 60, 60, 11, 0, 0, 7); g.fill();
    // aim line from the hand
    const hx = w / 2, hy = h - 40, tx = can.x + aim * w * .35; g.setLineDash([10, 10]); g.strokeStyle = Math.abs(aim) < .17 ? '#2e7d32' : '#555'; g.lineWidth = 4; g.beginPath(); g.moveTo(hx, hy); g.lineTo(tx, can.y - 40); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#f2c9a0'; g.beginPath(); g.ellipse(hx, hy + 10, 46, 30, 0, 0, 7); g.fill();
    // power meter
    const mx = w - 90, my = h * .2, mh = h * .5; g.fillStyle = '#222'; g.fillRect(mx, my, 34, mh); g.fillStyle = '#4caf50'; g.fillRect(mx, my + mh * (1 - .84), 34, mh * .22);
    g.fillStyle = charging ? '#ffd23f' : '#888'; g.fillRect(mx + 4, my + mh * (1 - power), 26, mh * power); g.strokeStyle = '#fff'; g.strokeRect(mx, my, 34, mh);
    // towel flight
    if(fly){ fly.t += dt * 1.3; const u = Math.min(1, fly.t), ex = can.x + fly.a * w * .35, ey = can.y - 50 + (fly.p - .73) * -500;
      const x = hx + (ex - hx) * u, y = hy + (ey - hy) * u - Math.sin(u * Math.PI) * h * .3; g.fillStyle = '#fafafa'; g.strokeStyle = '#bbb';
      g.beginPath(); g.ellipse(x, y, 18 * (1 - u * .35), 12 * (1 - u * .35), u * 7, 0, 7); g.fill(); g.stroke();
      if(u >= 1){ if(fly.ok){ made++; E.sfx('ok'); msg = made >= 10 ? 'TEN! FINALLY.' : ['SWISH.', 'Nothing but trash can.', 'Counts.'][made % 3]; }
        else { E.sfx('miss'); msg = fly.p >= .84 ? 'Way too hard. Off the wall.' : fly.p <= .62 ? 'Too soft. Wet towel on the floor.' : 'Nope. Aim straight.'; } fly = null; mt = 1.4; } }
    g.fillStyle = '#111'; g.textAlign = 'center'; g.font = 'bold 24px "Press Start 2P", monospace'; g.fillText(`WET TOWEL THROWS: ${made} / 10`, w / 2, 64);
    g.font = '12px "Press Start 2P", monospace'; g.fillText(mt > 0 ? msg : 'Aim: mouse or A/D · HOLD click / SPACE to charge · RELEASE in the green', w / 2, 100); mt -= dt; g.fillText(`Tries: ${tries}`, w / 2, 126);
    if(made >= 10 && !fly){ removeEventListener('keydown', kd); removeEventListener('keyup', ku); setTimeout(() => { c.style.display = 'none'; G.ctl = true; done(tries); }, 900); return; }
    requestAnimationFrame(loop); }; requestAnimationFrame(loop); }); }
function footballMontage(){ return new Promise(async done => { const tv = $('tv'); tv.style.display = 'flex';
  tv.innerHTML = `<div style="width:min(860px,94vw);aspect-ratio:4/3;background:linear-gradient(#2e7d32,#1b5e20);border:16px solid #222;border-radius:30px;position:relative;overflow:hidden;font-family:'Press Start 2P'">
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9%,#ffffff55 9% 9.4%)"></div>
    <div style="position:absolute;left:0;right:0;top:0;background:#000c;color:#fff;font-size:clamp(10px,1.6vw,16px);padding:10px;display:flex;justify-content:space-around"><span>RAMS <b id="sR">0</b></span><span id="sQ">1ST 15:00</span><span>PANTHERS <b id="sP">0</b></span></div>
    <div id="sMsg" style="position:absolute;left:0;right:0;top:44%;text-align:center;color:#ffd23f;font-size:clamp(14px,2.4vw,26px);text-shadow:3px 3px 0 #000"></div>
    <div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;color:#fff;font-size:10px">PRO FOOTBALL 2002 (in the book: Madden 2002) · Rams vs Panthers</div></div>`;
  const plays = [['TOUCHDOWN PANTHERS', 7, '1ST 6:12'], ['INTERCEPTION...', 7, '2ND 11:40'], ['TOUCHDOWN PANTHERS', 14, '2ND 2:03'], ['FUMBLE. OF COURSE.', 14, '3RD 9:30'], ['FIELD GOAL PANTHERS', 17, '3RD 1:15'], ['TOUCHDOWN PANTHERS', 24, '4TH 8:44'], ['FIELD GOAL PANTHERS', 27, '4TH 3:02']];
  for(const [m, s, q] of plays){ await E.wait(1100); $('sMsg').textContent = m; $('sP').textContent = s; $('sQ').textContent = q; E.tone(m.includes('TOUCH') ? 300 : 200, 0, .3, 'square', .04); }
  await E.wait(900); $('sMsg').textContent = '27 – 0'; await E.wait(1400); $('sMsg').textContent = 'RAGE QUIT'; E.sfx('fail'); await E.wait(1300); tv.style.display = 'none'; done(); }); }
function hockeyTV(on){ if(!G.breakTV) return; if(on){ const c = document.createElement('canvas'); c.width = 128; c.height = 90; const g = c.getContext('2d'); const t = new E.THREE.CanvasTexture(c);
    G.breakTV.material = new E.THREE.MeshBasicMaterial({ map:t }); G.hockeyStop = mtick(() => { g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, 128, 90); g.strokeStyle = '#c00'; g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 90); g.stroke();
      for(let i = 0; i < 6; i++){ g.fillStyle = i % 2 ? '#c00' : '#036'; g.fillRect(64 + Math.sin(G.t * 2 + i) * 40 + (i - 3) * 6, 45 + Math.cos(G.t * 3 + i * 2) * 22, 6, 10); }
      g.fillStyle = '#000'; g.fillRect(60 + Math.sin(G.t * 5) * 20, 40, 3, 3); t.needsUpdate = true; }); } }

// carts helper for M04 rows
async function cartRun(corralIdx, need, prompt = 'GRAB CARTS'){
  const c = G.corrals[corralIdx]; fillCorral(c, need); startPushing(); G.blips.push({ x:c.x, z:c.z, c:'#ffd23f' });
  E.obj(`Grab the carts from corral C${String(c.n).padStart(2, '0')}.`); await H.reach(c.x, c.z - 3.6, 2.4); await H.interact(c.x, c.z - 3.6, prompt, 3); grabFrom(c, 12);
  E.obj('Push them inside to the cart return.'); await H.reach(G.cartBay.x, G.cartBay.z, 3); await H.interact(G.cartBay.x, G.cartBay.z, 'RETURN CARTS', 3.5); deliver(); E.sfx('ok'); G.blips = []; }

// =================== M04 — OLD DUDE (BOOK: September 26, 2003) ===================
export const M04 = { title:'Old Dude', sub:'SEPTEMBER 26TH 2003', where:'front entrance of Belleville West High School', needs:'M03', start:{ x:-126, z:150 },
  setup(i){ E.setTime(i >= 6 ? 'night' : i >= 4 ? 'dusk' : 'day'); E.setOutfit(i >= 2 && i < 9 ? work : {}); clock(day4, ''); G.noTraffic = false; G.storeOpen = true; },
  stages:[
    async () => { const cl = G.classroom; E.place(cl.chris.x, cl.chris.z, -Math.PI / 2); clock(day4, '2:45 PM');
      const sp = mnpc('Mrs. Sparks', W.sparks, cl.sparks.x, cl.sparks.z, { face:Math.PI / 2 }); const jax = mnpc('Jax', LOOK.jax, cl.jax.x, cl.jax.z, { face:-Math.PI / 2 });
      for(let i = 0; i < 6; i++) E.sit(mnpc('student', { shirt:['#8a5a9a', '#3a7a6a', '#a8743a', '#5a6aa8', '#aa5544', '#557755'][i], hair:['#222', '#a87a4a', '#3a2414'][i % 3], long:i % 2 === 1 }, cl.seats[[0, 2, 7, 9, 12, 14][i]].x, cl.seats[[0, 2, 7, 9, 12, 14][i]].z, { face:-Math.PI / 2 }).o, true);
      E.cut(true); await H.shot(cl.cam[0], cl.cam[1], 0); await H.card(day4, '', 2200);
      await H.say([['Mrs. Sparks', 'That is all for class today, feel free to do whatever you want for the last 5 minutes'],
        ['', 'god she really dragged out those damn computer lessons, I wish she knew we weren\'t dumbasses. I walked over to Jax’s desk to talk to him.']]); E.cut(false);
      E.obj('Talk to Jax.'); await H.interact(() => jax.p.x, () => jax.p.z, 'TALK TO JAX', 2.6); E.cut(true); face(jax, P.p); faceP(jax); await two(P.p, jax);
      await H.say([[C, 'Yo Jax'], ['Jax', 'Yeah Chris?'], [C, 'Thoughts on this amazing, perfectly crafted assignment that Mrs. Sparks made'], ['Jax', 'Does she think we are stupid?'],
        [C, 'I think so, although Zeke might be'], ['Jax', 'Got that right dude, he\'s so dumb'], [C, 'For sure bro, You got any plans tonight?'],
        ['Jax', 'Not really… wait don’t you have work right after school till 11'], [C, 'Yeah but i don’t ever do my job anyways'],
        ['Jax', 'Shouldn’t you do your job? Wouldn\'t that make you a good worker and you can get promoted'], [C, 'Why would i want to get promoted, that place sucks ass'], ['Jax', 'Fair point i guess']]);
      E.sfx('bell'); await H.card('SCHOOL BELL RINGS', '', 1400); await H.say([[C, 'Finally']]); E.cut(false);
      E.obj('LEAVE CLASS WHEN THE BELL RINGS.'); await H.reach(G.classroom.door.x, G.classroom.door.z, 2.6); },
    async () => { park(-134.5, 186.5, Math.PI / 2); E.place(-130.5, 186.5, -Math.PI / 2); E.cut(false); G.blips.push({ x:-134.5, z:186.5, c:'#4fc3ff' });
      E.say([['', 'i ran out of that building like it was on FIRE.']], { auto:true });
      E.obj('GET IN YOUR CAR. (E)'); await H.until(() => G.driving); G.noExit = true; E.obj('DRIVE TO WORK — SCHNUCKS SWANSEA. Park by the staff entrance.'); G.blips = [];
      await H.reach(180, 352, 5, { color:0x4fc3ff }); E.toast('Stop the car to park (S / SPACE)', 2500); await H.until(() => Math.abs(G.driving.speed) < 1.2); G.noExit = false; E.exitCar(); clock(day4, '3:58 PM');
      await H.say([['', 'I drove to work and changed into my shirt while I was in my car.']]);
      await H.say([['', 'I then walked inside, not ready for a lame ass day of work. 7 whole hours of torture.']]);
      E.obj('CLOCK IN AND PICK UP YOUR VEST.'); await H.reach(171, 357.5, 2.2);
      const andrew = mnpc('Andrew', W.andrew, 164, 358.6); face(andrew, { x:158, z:358 });
      await H.reach(166.5, 358.4, 2, { noMarker:true }); E.cut(true); face(andrew, P.p); faceP(andrew); await two(P.p, andrew);
      await H.say([['', 'I turned around the corner, and walked to the time clock. There I saw Andrew, and he looked like he was seeing ghosts.'], [C, 'Yo Andrew'], ['Andrew', 'SHH'],
        ['Andrew', 'Be quiet, Jacob is around the corner'], [C, 'Oh alright'], [C, 'I’ll be quiet'], ['Andrew', 'God Jacob is such a dick'],
        [C, 'Tell me about it, he\'s always on me for \'not doing my job\' and \'horsing around too much\''], [C, 'I DONT EVEN OWN A DAMN HORSE']]);
      const eric = mnpc('Eric', W.eric, 160, 361); face(eric, P.p); await two(P.p, eric, -1);
      await H.say([['Eric', 'Alright dumbasses, work needs to get done'], [C, 'I haven\'t even clocked in yet'], ['', 'I said, knowing he does this stuff all the time.'],
        ['Eric', 'Don’t care, clock in and get carts we need them'], ['', 'Eric says as Andrew runs away like he\'s a scared damn dog.'], [C, 'Fine']]);
      andrew.go([[150, 358], [140, 350]], 6); eric.go([[158, 368], [160, 380]], 3); E.cut(false);
      E.obj('CLOCK IN.'); await H.interact(G.timeClock.x, G.timeClock.z, 'CLOCK IN', 2); E.sfx('ok'); E.toast('CLOCKED IN · 4:01 PM', 2000);
      E.obj('PICK UP YOUR VEST.'); await H.interact(G.vests.x, G.vests.z, 'GRAB YOUR VEST', 2); E.setOutfit(work); },
    async () => { E.place(150, 358, Math.PI); E.setOutfit(work); E.obj('HEAD OUTSIDE TO GET CARTS.');
      const eric = mnpc('Eric', W.eric, 111, 322); const jacob = mnpc('Jacob', W.jacob, 113, 321); face(eric, jacob); face(jacob, eric);
      await H.reach(105, 326.5, 3);
      E.cut(true); await H.shot([105, 2, 326], [112, 1.6, 321.5], 700);
      await H.say([['', 'i walked and grabbed my vest and headed outside but when i walked outside, i saw my bosses Eric and Jacob standing there, talking about some back in my day this and im old as fuck that type of stuff.']]);
      await H.fade(true, 700); await H.card('SEPTEMBER 1989', '', 2000);
      const Y = G.Y89.campus, e89 = mnpc('Eric', W.eric89, Y.x - .8, -20), j89 = mnpc('Jacob', W.jacob89, Y.x + .8, -20); E.setTime('after');
      e89.go([[Y.x - .8, 24]], 1.3); j89.go([[Y.x + .8, 24]], 1.3);
      E.camTrack(() => [[Y.x + 4.5, 2.4, j89.p.z + 4.5], [Y.x, 1.5, j89.p.z]]); await H.fade(false, 700);
      await H.say([['Jacob', 'Man, i tell ya, i never envisioned college being this hard'], ['Eric', 'Well… at least you go to the greatest damn school in the country. North Carolina State University'],
        ['Jacob', 'That\'s true,'], ['Jacob', 'How’s your girlfriend Lilly doing?'], ['Eric', 'Shes fine, we’re actually going to the NC State football game tonight North Carolina, its gonna be awesome'],
        ['Jacob', 'Hell yeah man, we are gonna whoop the tar heels asses!'], ['', 'we walked to our dorm continuing to talk'], ['Eric', 'Did you get the drinks?'],
        ['Jacob', 'I got some Pepsi and Mountain Dew but that\'s about it'], ['Eric', 'No.. Jacob… the booze.. Liquor.. Scootch..'],
        ['Jacob', 'Alright I understand now Eric, and the answer is no, we can’t have any, we are only 18. That will get us arrested during our freshman year. Terrible idea man.'],
        ['Eric', 'Like you said it’s our freshman year, 4 years of time to make mistakes, lets make one now'], ['Jacob', 'Alright but how will you even acquire this liquor'], ['Eric', 'I got a guy']]);
      E.setTime('day'); G.camOverride = null; E.place(105, 325, 0); await H.shot([106, 2, 323], [111, 1.6, 322], 0); face(eric, P.p);
      await H.say([['Eric', 'Stop standing there Chris, get some carts'], [C, 'Alright']]); E.cut(false); },
    async () => { E.place(105, 325, 0); E.setOutfit(work); clock(day4, '4:20 PM');
      await H.say([['', 'thank goodness it\'s a cool day, I walk around and grab the carts and something pops into my mind.']]);
      await cartRun(2, 6); clock(day4, '5:40 PM');
      await H.say([['', 'Jax’s friend is hosting a rager this Friday, and I\'m off. This sounds like an amazing idea. I guess I\'ll save it for later, if I can remember.']]);
      const mad = mnpc('Madison', W.madison, 96, 320); mad.blip = '#4fc3ff'; await cartRun(9, 5); clock(day4, '6:55 PM');
      E.cut(true); E.place(103.8, 320.5, 0); mad.at(106.6, 322.2); face(mad, P.p); faceP(mad); await H.shot([107.3, 2.2, 318.1], [105.2, 1.5, 321.4], 600);
      await H.say([['', 'My awesome thoughts get interrupted by Madison.'], ['Madison', 'Why aren’t you pushing more carts? We need them!'], [C, 'Why are you pushing so many carts, how about that'],
        ['Madison', 'Real funny Chris, how long did it take you to think that one up'], [C, 'Only 5 minutes'], ['Madison', 'Exactly'],
        ['', 'Madison said pushing carts in, I followed behind, she works too much for my liking, always stealing those extra shifts, getting all the credit. It sucks.']]);
      mad.go([[105, 334], [96, 345]], 3); E.cut(false); },
    async () => { E.place(104, 337, Math.PI); E.setOutfit(work); clock(day4, '7:10 PM'); const L = G.lanes[2];
      const ryan = mnpc('Ryan', W.ryan, L.x + .2, L.z - 1, { face:-Math.PI / 2 }); const doris = mnpc('Doris', W.doris, L.x - 1.6, L.z - 2.6); ryan.blip = '#4fc3ff';
      await H.say([['Ryan', 'Chris come here']]); E.obj('GO TO RYAN\'S CHECKLANE.'); await H.interact(() => ryan.p.x, () => ryan.p.z, 'TALK TO RYAN', 2.6);
      E.cut(true); face(ryan, P.p); faceP(ryan); await two(P.p, ryan);
      await H.say([[C, 'Yes Ryan?'], ['', 'i said as i walked up to his lane'], ['Ryan', 'I need you to do a carryout for this lady, her name is Doris.'], ['Ryan', 'Be nice'], [C, 'Alright dude i will']]); E.cut(false);
      const cart = (await import('./game.js')).newCart(); train.push(cart); G.scene.add(cart); cart.userData.from = { delivered:0 }; startPushing();
      doris.follow(P, 2.4, 3.2); E.obj('HELP DORIS TO HER CAR.');
      await H.say([[C, 'Hello, Doris! Lovely day we are having here. Really beautiful…'], ['Doris', 'You seem like a nice young man'], [C, 'I sure hope so'], ['Doris', 'Whats with that tone son'],
        [C, 'What. Huh. Oh. Nothing i was just thinking out loud'], ['Doris', 'That\'s very weird son']]);
      const dc = E.makeCar('#8a7a5a'); dc.position.set(G.parkDoris.x, 0, G.parkDoris.z); dc.rotation.y = .1; G.scene.add(dc); G.dorisCar = dc;
      await H.reach(G.parkDoris.x - 2.2, G.parkDoris.z - 3.2, 2.6); await H.interact(G.parkDoris.x - 1.6, G.parkDoris.z - 2.8, 'LOAD THE GROCERIES', 3);
      doris.stop(); doris.at(G.parkDoris.x - 1.4, G.parkDoris.z - 1); E.sfx('door');
      await H.say([['', 'as we arrived at her beat up to hell car. I set her groceries in her car with like a million things in her damn trunk like she\'s a traveling circus. As i grab her cart and walk away, i overhear']]);
      await H.wait(1200); E.cut(true); face(doris, P.p); faceP(doris); await two(P.p, doris, 1, 4.4);
      await H.say([['Doris', 'Jackass'], ['', 'from the old lady, that kinda pissed me off'], [C, 'You’re a loser you old hag'], ['', 'i said just loud enough for her to hear but not loud enough for my bosses to hear'],
        ['Doris', 'THATS IT'], ['Doris', 'I wanna talk to your manager']]);
      E.sfx('ring'); await H.say([['Walkie (GAME ORIGINAL)', '*kssht* ...need a manager out in the lot, please. *kssht*']]);
      const eric = mnpc('Eric', W.eric, 105, 333); await H.shot([G.parkDoris.x - 8, 2.4, G.parkDoris.z - 8], [105, 1.4, 326], 600); await H.go(eric, [[105, 326], [G.parkDoris.x - 3.5, G.parkDoris.z - 3.2]], 5.5); face(eric, doris); await two(doris, eric, 1, 4.4);
      await H.say([['', 'As she said that Eric looks my way, absolutely pissed and comes over to where we are at.'], ['Eric', 'I am so sorry ma’am, we will have a talk with him'],
        ['Eric', 'Chris, push a row of carts then go to my office.'], [C, 'Damn it'], ['', 'I muttered under my breath.']]); G.flags.doris_complaint = true;
      eric.go([[105, 326], [150, 362]], 4); E.cut(false); },
    async () => { E.setOutfit(work); clock(day4, '7:35 PM'); clearTrain(); E.place(150, 300, Math.PI); if(!G.dorisCar){ }
      await cartRun(11, 6, 'GRAB A ROW OF CARTS');
      const L = G.lanes[2]; const ryan = mnpc('Ryan', W.ryan, L.x + .2, L.z - 1, { face:-Math.PI / 2 });
      E.obj('REPORT TO ERIC\'S OFFICE.'); E.setWay(G.office.door.x, G.office.door.z + 1); await H.until(() => Math.hypot(P.p.x - ryan.p.x, P.p.z - ryan.p.z) < 6 || P.p.x > 140);
      if(Math.hypot(P.p.x - ryan.p.x, P.p.z - ryan.p.z) < 9) await H.say([[C, 'Fuck you dude, got me in trouble'], ['Ryan', 'Not my fault you\'re an idiot']]);
      await H.reach(G.office.door.x, G.office.door.z + 1, 2); },
    async () => { E.setOutfit(work); clock(day4, '7:45 PM'); const O = G.office; E.place(O.chair.x, O.chair.z, 0);
      const eric = mnpc('Eric', W.eric, O.eric.x, O.eric.z, { face:Math.PI }); E.cut(true); await H.shot([157, 2.3, 375], [160, 1.5, 381], 0);
      await H.say([['', 'I get to Eric’s office and he\'s sitting there PISSED.'], ['Eric', 'Sit down Chris'], ['Eric', 'Alright, I\'ve punished you way too many times. It doesn’t hit deep enough. So i am gonna give you some life advice'],
        [C, 'Fine with me man, as long as I don\'t have to work.'], ['Eric', 'Alright then… It was September 1989.'], [C, 'Man you are old'], ['Eric', 'Shut it and listen to the story'], [C, 'Why should i'],
        ['Eric', 'Its important maybe you’ll actually learn something'], [C, 'Learn? I thought learning was only for those harvard guys'], ['Eric', 'JUST LISTEN TO IT CHRIS'],
        [C, 'Fine, only because i am getting paid'], ['Eric', 'So, it was your boss was about to make a huge mistake']]);
      await H.shot([160, 1.75, 380.4], [160, 1.7, 382], 900); await H.fade(true, 800); await H.card('SEPTEMBER 1989 (CONT.)', 'As told by Eric', 2200);
      // Scene A — dorm
      const D = G.Y89.dorm; E.setTime('indoor'); const j = mnpc('Jacob', W.jacob89, D.x + 1.2, 0), e = mnpc('Eric', W.eric89, D.x - 1.2, 0); face(j, e); face(e, j);
      const can = new E.THREE.Mesh(new E.THREE.CylinderGeometry(.04, .04, .12, 8), E.mat('#c8a84a')); can.position.set(D.x + 1.4, 1.1, .3); G.scene.add(can);
      await two(e, j, 1, 3.4, 0); await H.fade(false, 600);
      await H.say([['Jacob', 'I finally got some Coors Banquets'], ['', 'Jacob said, grinning like it was the 4th of July'],
        ['Eric', 'Wait, so you\'re telling me you want to illegally drink beer, and of all the beers you are going to break the law over, you chose Coors Banquet?'],
        ['Jacob', 'Yes Eric, I chose Coord Banquet, do you want some or not!'], ['Eric', 'No dude, in fact i don’t want you having it your gonna get yourself in trouble'],
        ['', 'Eric says as Jacob opens up a can of beer'], ['Jacob', 'Fine, if you dont want any ill keep it'], ['', 'Jacob says as he walks off.']]);
      await H.go(j, [[D.x + 4, 4]], 2.5); j.o.visible = false; G.scene.remove(can);
      await H.say([['Eric (2003)', 'At this point I don\'t even want to go to the football game. I headed back to the apartment complex in which we lived, it was called the University Towers.'],
        ['Chris (2003)', 'Is this even necessary'], ['Eric (2003)', 'Yes it is!'], ['', 'eric said boringly,'], ['Eric (2003)', 'As i was sitting in our apartment i got a call']]);
      // Scene B — University Towers, phone
      await H.fade(true, 500); const A = G.Y89.apt; e.at(A.x - 2.5, -1.5); e.face = Math.PI / 2; await H.shot([A.x - 4, 2.2, 3.5], [A.x, 1.4, -1], 0); await H.fade(false, 500);
      for(let i = 0; i < 3; i++){ E.sfx('ring'); await H.wait(700); } await H.go(e, [[G.aptPhone.x - .6, G.aptPhone.z]], 2.5);
      await H.say([['Lilly (phone)', 'Hello! Hello! Eric, are you there!!'], ['', 'lilly screamed through the phone'], ['Eric', 'Yeah i am here whats the matter'],
        ['Lilly (phone)', 'Jacob is going crazy at the game, he\'s trying to pick fights with people'], ['Eric', 'I knew it. I am on my way.'],
        ['', 'I race to my car like it was the end of days. I finally made it to the stadium and bought a ticket so i can get in, thats $30 i’ll never get back.']]);
      // Scene C — stadium
      await H.fade(true, 500); E.setTime('dusk'); const St = G.stadium; j.o.visible = true; j.at(St.jacob.x, St.jacob.z, Math.PI / 2); const guy = mnpc('Random guy', W.guy, St.guy.x, St.guy.z, { face:-Math.PI / 2 });
      const lil = mnpc('Lilly', W.lilly, St.lilly.x, St.lilly.z, { face:Math.PI / 2 }); e.at(St.gate.x, St.gate.z, 0);
      const crowd = mtick(() => G.crowd.forEach((p, i) => p.position.y = (i % 5) * .5 + .5 + Math.abs(Math.sin(G.t * 4 + i)) * .12));
      await two(j, guy, -1, 4, 0); await H.fade(false, 500);
      await H.say([['Jacob', 'I know you want some of this, your team sucks ASS'], ['', 'Jacob said to a random guy'], ['Random guy', 'I am not trying to pick a fight man, just trying to watch the game'],
        ['Jacob', 'No you are not! Your team is Assss, Assssss'], ['Lilly', 'Jacob, stop it!']]);
      await H.go(e, [[St.jacob.x - 1.4, St.jacob.z - 1]], 6); face(e, lil); await two(e, lil, -1, 3.6);
      await H.say([['Eric', 'Thanks for trying to handle it the best you can babe'], ['Lilly', 'Did the best i could'], ['Eric', 'Jacob its time you go home'], ['', 'i said as i grab him'],
        ['Jacob', 'No ERIC just because i am awesome and popular here doesn\'t mean you get to be jealous'], ['Eric', 'Alright buddy, a little too much to drink, let\'s head home'],
        ['', 'I said, dragging him like he was a million pounds. We brought him to our apartment and then set him down and he slept immediately. He woke up the next day in a complete daze.']]);
      // Scene D — next morning
      await H.fade(true, 600); crowd(); guy.remove(); lil.remove(); E.setTime('indoor'); j.at(A.x + 1.5, 3, Math.PI); e.at(A.x - 1, 1.5, 0); face(e, j); face(j, e);
      await two(e, j, 1, 3.4, 0); await H.card('THE NEXT MORNING', '', 1400); await H.fade(false, 500);
      await H.say([['Jacob', 'What happened'], ['Eric', 'You got hammered, tried to fight some dudes and luckily Lilly was at the game and called me on the payphone to bring you home'],
        ['Eric', 'That is $30.50 we will never get back'], ['Jacob', 'You don’t know how much i owe you'], ['Eric', 'You don’t either.']]);
      await H.fade(true, 700); j.remove(); e.remove(); E.setTime('day'); await H.shot([157, 2.3, 375], [160, 1.5, 381], 0); await H.fade(false, 600);
      await H.say([[C, 'Man Jacob was one cool dude, it\'s unfortunate he turned into a total bitch'], ['Eric', 'CHRIS COME ONE DUDE, DID YOU LEARN ANYTHING??'],
        [C, 'I learned that drinking is only cool if it isn’t a Coors Banquet'], ['Eric', 'Get out of my office and back to work.'], ['', 'man these people suck.']]);
      G.flags.heard_1989 = true; E.cut(false); },
    async () => { E.setOutfit(work); clock(day4, '8:40 PM'); E.place(160, 362, Math.PI); E.obj('RETURN TO THE SALES FLOOR.');
      const mia = mnpc('Mia', W.mia, 112, 349); const cust = mnpc('Customer', W.cust, 62, 351); const jack = mnpc('Jack', W.jack, G.custService.x, G.custService.z - 4.6, { face:0 });
      await H.reach(118, 351, 4); E.cut(true); face(mia, P.p); faceP(mia); await two(P.p, mia);
      await H.say([['', 'I went back to work and continued to get carts. Until Mia continues to get on me for some reason.'], ['Mia', 'CHRIS!'], [C, 'Yo.'], ['Mia', 'Why have you not been bagging, isn’t that your job'],
        [C, 'I don’t know, carts have been like biting me'], ['Mia', 'That makes no sense, start bagging'], [C, 'No i am good'], ['Mia', 'Your doing such a great job chris keep it up'],
        [C, 'Yes i am'], ['', 'i said walking away, Mia gave nice compliments. I continue to do my job lame as hell. Communicating with the customers very well.']]); E.cut(false);
      E.obj('HELP CUSTOMERS ON THE FLOOR.'); cust.blip = '#4fc3ff'; await H.interact(() => cust.p.x, () => cust.p.z, 'HELP THE CUSTOMER', 2.6);
      E.cut(true); face(cust, P.p); faceP(cust); await two(P.p, cust);
      const apple = new E.THREE.Mesh(new E.THREE.SphereGeometry(.09, 10, 8), E.mat('#c8202a')); apple.position.set(0, -.86, .12); P.model.userData.aR.add(apple); P.model.userData.aR.rotation.x = -1.4;
      await H.say([['', 'A customer came up to me at the same time asking where the apples are at']]); await H.shot([P.p.x + Math.sin(P.yaw) * 1.6, 1.9, P.p.z + Math.cos(P.yaw) * 1.6], [P.p.x, 1.55, P.p.z], 400);
      await H.say([[C, 'THISSSS ISSSSS AN APPPPLEEEE, CAN YOU SAY APPPPPPLEEEEEEE'], ['Customer', 'Do you think i am retarded'],
        [C, 'Well you sure didn’t know where the apples are, even i know they are in produce'], ['Customer', 'Your job is to help me buddy, calm down'], [C, 'Whatever i got like work stuff to handle'],
        ['', 'i said walking away, customer interactions suck. Jack called me over to customer service']]); P.model.userData.aR.remove(apple); P.model.userData.aR.rotation.x = 0; E.cut(false);
      E.obj('GO TO CUSTOMER SERVICE.'); jack.blip = '#4fc3ff'; await H.interact(G.custService.x, G.custService.z, 'TALK TO JACK', 2.6);
      await H.say([[C, 'Yeah Jack'], ['Jack', 'Time for your break'], [C, 'Thank god']]); },
    async () => { E.setOutfit(work); clock(day4, '9:05 PM'); E.place(145, 342, Math.PI); E.obj('TAKE YOUR BREAK. (Grab snacks from the vending machine, then head to the break room)');
      minter({ x:G.vending.x, z:G.vending.z, y:G.vending.y, r:2, prompt:'BUY DORITOS 3D + A REESE\'S CUP', use:() => { G.flags.snacks = true; E.sfx('ok'); E.toast('Doritos 3D — they looked cool<br>+ a Reese\'s peanut butter cup', 3000); } });
      await H.interact(G.breakRoom.x, G.breakRoom.z, 'SIT DOWN AND WATCH HOCKEY', 2.4, 3.6); hockeyTV(true); E.cut(true); await H.shot([74, 5.4, 380], [79, 5.5, 387], 600);
      await H.say([['', `${G.flags.snacks ? 'I bought some snacks, Doritos 3D, they looked cool and a Reese\'s peanut butter cup and headed to the breakroom.' : 'I headed to the breakroom.'} They had some hockey on and I love hockey, dudes beating other dudes up, that\'s sick as hell.`],
        ['', 'It was a fight heavy game as well, the only bad part is it was on for so long it was 30 minutes. Usually those dumbasses tell me to get a move on after 15 so I was fine with going back.']]);
      await H.card('30 MINUTES LATER', '', 1400); E.cut(false);
      E.obj('TELL JACK, THEN VISIT THE RESTROOM.'); await H.reach(G.restroom.x, G.restroom.z, 3);
      await H.say([['', 'Now that I am back from break I let Jack know I was going to the bathroom. I walked to the bathroom and had one goal, i am not leaving until i make 10 wet towel throws into the trash can.']]);
      const tries = await live2(towelGame()); E.toast(`10 throws made · ${tries} tries`, 3000);
      await H.say([['', 'It took awhile but my aim sucks like balls. Luckily it was time to go home by then and all the bosses went there like cocoons or whatever they are called.']]); clock(day4, '11:00 PM'); },
    async () => { E.setTime('night'); E.setOutfit({}); clock(day4, '11:05 PM'); park(180, 352, Math.PI); E.place(177.5, 349, Math.PI); E.cut(false);
      E.obj('DRIVE HOME. (E to get in)'); await H.until(() => G.driving); G.noExit = true; E.say([['', 'I drove home, that was the best part of the night. The air was like cold but it was nice and warm and the music I was listening to was awesome. (music placeholder)']], { auto:true });
      E.obj('DRIVE HOME — park in your driveway.'); await H.reach(10.5, 10, 4, { color:0x4fc3ff }); await H.until(() => Math.abs(G.driving.speed) < 1.2); G.noExit = false; E.exitCar();
      await H.fade(true, 400); E.place(-4.5, -6, Math.PI); E.cut(true); await H.fade(false, 400);
      const dad = mnpc('Dad', LOOK.dad, -5.3, -10.3, { face:0 }); const mom = mnpc('Mom', LOOK.mom, -3.7, -10.3, { face:0 }); [dad, mom].forEach(n => n.p.y = .25);
      await H.shot([-1.5, 2.4, -5], [-4.5, 1.2, -10], 0); mtick(() => G.tvScreen.material.color.setHSL((G.t * .2) % 1, .4, .45));
      await H.say([['', 'I got home and mom and dad were like on the couch watching a gay movie'], ['Dad', 'Welcome home chris'], ['Mom', 'Welcome home chrissy'],
        [C, 'Don’t say that again mom, where\'s the food'], [C, 'i hate when she calls me that, feel like a mistake'], ['Mom', 'It\'s in the microwave']]); E.cut(false);
      E.obj('EAT DINNER.'); await H.interact(G.micro.x, G.micro.z, 'HEAT UP THE LEFTOVERS', 2); E.tone(440, 0, 1.2, 'sine', .03); await H.wait(1300); E.sfx('ok');
      await H.say([['', 'I walked over to the microwave and heated up the leftovers. I ate it, and they make some good food.']]);
      E.obj('GO TO YOUR ROOM.'); await H.reach(4, -6, 2, { y:3.2 }); E.obj('PLAY MADDEN 2002.'); await H.interact(G.console.x, G.console.z, 'PLAY MADDEN 2002', 2, 3.2);
      await H.say([['', 'I walked over to my room, sat down and played some Madden 2002. The Rams were gonna win against the Panthers because they had, the one, the only Christopher Storbach, if only it was Staubach, I\'d have cooler parents.'],
        ['', 'However, I got pissed cause my team kinda sucked bad this game for some reason and I was getting my ass handed to me.']]);
      await live2(footballMontage());
      await H.say([['', 'I may or may not have rage quit. Once it hit 27-0 I gave up. I hate this fucking game.']]);
      await H.banner('MISSION PASSED', 'OLD DUDE'); Object.assign(G.flags, { M04_complete:true, Draft1_main_complete:true, S01_available:true });
      E.toast('SIDE MISSION AVAILABLE: A LITTLE EXTRA CASH<br>(blue marker at the Schnucks staff entrance)', 5000); } ],
  done(){ G.roamTime = 'night'; } };
const live2 = p => p; // mini-games run to completion

// =================== S01 — A LITTLE EXTRA CASH (GAME ORIGINAL) ===================
export const S01 = { title:'A Little Extra Cash', sub:'SIDE MISSION · GAME ORIGINAL', where:'Schnucks staff entrance', needs:'M04', start:{ x:174, z:357.5 },
  setup(i){ E.setTime('night'); E.setOutfit(work); clock('CLOSING SHIFT', ''); G.storeOpen = true; },
  stages:[
    async () => { E.place(168, 357.5, -Math.PI / 2); const eric = mnpc('Eric', W.eric, 163, 360); const jacob = mnpc('Jacob', W.jacob, 163, 356.5); [eric, jacob].forEach(n => face(n, P.p));
      E.obj('Talk to Eric and Jacob.'); await H.interact(164, 358.2, 'ASK ABOUT EXTRA SHIFT', 3.2);
      E.cut(true); faceP(eric); await H.shot([168.5, 2.2, 352.5], [164, 1.5, 358.5], 600);
      await H.say([['Jacob', 'Hey Chris. Want to make a little extra money tonight?'], [C, 'How little is \'a little\'?'], ['Eric', 'We need the lot cleared before closing.'], [C, 'Okay. How bad is it?'],
        ['Jacob', 'Fourteen corrals. All the carts. Inside the store. You\'ve got one hour.'], [C, 'Fourteen? Did every person in Belleville come shopping today?'], ['Eric', 'You taking the shift or not?']]);
      const k = await H.choose(['Take the shift', 'Maybe later']); if(k === 1){ await H.say([[C, 'Maybe later.']]); E.cut(false); G.s01Declined = true; G.noComplete = true; return; }
      await H.say([[C, 'Fine. But if I turn into a shopping cart, I\'m blaming both of you.']]); E.cut(false); },
    async () => { if(G.s01Declined){ G.s01Declined = false; return; }
      E.cut(true); G.corrals.forEach(c => fillCorral(c, 6)); const total = G.corrals.reduce((a, c) => a + c.initial, 0); clearTrain(); startPushing();
      await H.shot([112, 40, 250], [112, 0, 305], 0); await H.wait(900);
      for(const c of G.corrals){ G.blips.push({ x:c.x, z:c.z, c:'#ffd23f' }); } await H.shot([112, 9, 318], [112, 2, 334], 2600);
      await H.card('CLOSING SHIFT — 60:00', `14 CORRALS · CARTS RETURNED: 0 / ${total}`, 2600);
      await H.say([['Eric (radio)', 'Bring them through the entrance and put them in the cart bay. Outside doesn\'t count.'], [C, 'Obviously. Why would this be easy?']]);
      E.place(105, 322, Math.PI); E.cut(false); E.obj('Clear all 14 corrals and return every cart indoors before time runs out.');
      let left = 3600, started = false, said = {}; const sx = P.p.x, sz = P.p.z; const tEl = $('timer'), cEl = $('carts'); tEl.style.display = 'block'; cEl.style.display = 'block';
      const delivered = () => G.corrals.reduce((a, c) => a + c.delivered, 0);
      const draw = () => { const m = Math.max(0, left); tEl.textContent = `${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60 | 0).padStart(2, '0')}`; tEl.style.color = m < 300 ? '#ff5252' : '#fff';
        cEl.textContent = `RETURNED ${delivered()} / ${total}\nPUSHING ${train.length}/12\n` + G.corrals.map(c => `C${String(c.n).padStart(2, '0')} ${c.carts.length ? c.carts.length + ' left' : '✔'}`).join('\n'); };
      G.corrals.forEach(c => minter({ x:c.x, z:c.z - 3.4, r:3, prompt:`GRAB CARTS (C${String(c.n).padStart(2, '0')})`, when:() => c.carts.length && train.length < 12,
        use:() => { const n = grabFrom(c, 12); if(n && !said.first){ } } }));
      minter({ x:G.cartBay.x, z:G.cartBay.z, r:4, prompt:'RETURN CARTS TO THE CART BAY', when:() => train.length > 0, use:() => { deliver(); E.sfx('ok');
        const d = delivered(); if(!said.a){ said.a = 1; H.say([[C, 'Well, that\'s one. Only about a million left.']]); }
        else if(d >= total / 2 && !said.b){ said.b = 1; H.say([[C, 'My legs officially hate me.']]); } } });
      mtick(dt => { if(!started && Math.hypot(P.p.x - sx, P.p.z - sz) > .5) started = true; if(started && !G.dialogOn) left -= dt; draw();
        if(train.length >= 10 && !said.c){ said.c = 1; H.say([[C, 'This is a terrible idea. Naturally, I\'m doing it anyway.']]); }
        if(left < 900 && !said.d){ said.d = 1; H.say([['Eric (radio)', 'Fifteen minutes, Chris. Don\'t leave any outside.']]); }
        if(left < 300 && !said.e){ said.e = 1; H.say([[C, 'Five minutes? You\'ve gotta be kidding me.']]); } });
      const res = await H.until(() => delivered() >= total || left <= 0).then(() => delivered() >= total ? 'win' : 'lose');
      const outside = total - delivered(), rem = Math.max(0, left), mmss = `${String(rem / 60 | 0).padStart(2, '0')}:${String(rem % 60 | 0).padStart(2, '0')}`;
      tEl.style.display = 'none'; cEl.style.display = 'none'; E.cut(true);
      if(res === 'win'){ await H.shot([108, 2.2, 340], [113, 1, 334], 600); const e = mnpc('Eric', W.eric, 110, 338), j = mnpc('Jacob', W.jacob, 116, 338);
        await H.say([['Eric', 'Well, I\'ll be damned. You actually cleared the whole lot.'], [C, 'Yeah, and I think my arms are gonna fall off.'], ['Jacob', 'Good work. You\'re done for tonight.'],
          [C, 'Thank God. I was about to move into the cart corral.']]);
        if(!SV.s01best || rem > SV.s01best) SV.s01best = rem; save();
        await H.banner('MISSION PASSED', `A LITTLE EXTRA CASH<br>Time remaining: ${mmss} · Carts returned: ${total} / ${total}<br>Reward: $25 [PROPOSED]`, false, 5200); G.flags.S01_completed = true; }
      else { await H.shot([112, 30, 260], [112, 0, 300], 600); await H.say([['Eric (radio)', 'Time\'s up, Chris. We\'re closing.'], [C, 'Well, that\'s just great.']]);
        await H.banner('MISSION FAILED — SHIFT OVER', `Carts remaining: ${outside}`, true, 3600);
        const k = await H.choose(['Retry from start', 'Exit to free roam']); if(k === 0) return fail('Retrying the closing shift.'); G.noComplete = true; }
      emptyCorrals(); clearTrain(); } ],
  done(){ emptyCorrals(); } };
