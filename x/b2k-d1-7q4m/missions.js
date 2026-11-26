// Back in the 2000s: The Game — Draft #1 missions M01–M03 (book dialogue is verbatim; GAME ORIGINAL scenes marked)
import * as E from './engine.js';
import { H, mnpc, mtick, minter, fail, clock, alarmFx, setMissions, SV, save, phoneUp, sitSofa, TV_SHOT } from './game.js';
// close-up from the side the phone is on
function phoneShot(n){ const f = n.face, p = n.p, X = [Math.cos(f), -Math.sin(f)], Z = [Math.sin(f), Math.cos(f)];
  return H.shot([p.x + X[0] * 1.5 + Z[0] * 1.6, p.y + 1.9, p.z + X[1] * 1.5 + Z[1] * 1.6], [p.x, p.y + 1.6, p.z], 500); }
// scripted climb through a window at x = wx along z (dir -1 = heading toward -x)
async function crawl(n, wx, dir, z){ n.stop(); n.manual = true; const o = n.o, u = o.userData; o.rotation.order = 'YXZ'; n.face = dir < 0 ? -Math.PI / 2 : Math.PI / 2; u.pose = true;
  const K = [[-.75, 0, 0, 0], [-.4, .5, .35, -2.6], [0, .95, 1.35, -2.9], [.5, .75, 1, -2.2], [.85, 0, 0, 0]]; // [along, y, lean, arms]
  for(let k = 0; k < K.length - 1; k++){ const a = K[k], b = K[k + 1]; for(let i = 1; i <= 14; i++){ const t = i / 14, L = j => a[j] + (b[j] - a[j]) * t;
    n.p.set(wx + dir * L(0), L(1), z); o.position.copy(n.p); o.rotation.y = n.face; o.rotation.x = L(2); u.aL.rotation.x = u.aR.rotation.x = L(3); u.lL.rotation.x = -L(2) * .6; u.lR.rotation.x = L(2) * .3; await H.wait(28); } }
  o.rotation.x = 0; u.aL.rotation.x = u.aR.rotation.x = u.lL.rotation.x = u.lR.rotation.x = 0; u.pose = false; n.manual = false; n.sync(); }
import { M04, S01 } from './missions2.js';
import { M05 } from './missions3.js';
import { M06, M07 } from './missions4.js';
import { M08, M09 } from './missions5.js';
import { M10 } from './missions7.js';
import { S02, S03, S04, S05, S06, S07 } from './missions6.js';
const { G, P } = E;
export const LOOK = G.LOOK = {
  zeke:{ shirt:'#d8a020', pants:'#3a4a6a', wide:1.32, hat:'capback', cap:'#1d1d1d', hair:'#3a2414', hairStyle:'buzz', top:'jersey', print:'23', bottom:'baggy', chain:'silver', shoes:'#f2f2f2' },
  jax:{ shirt:'#2a6a3a', pants:'#2b3550', hair:'#151515', skin:'#c48a5e', hairStyle:'cornrows', top:'hoodie', bottom:'baggy', shoes:'#f4f4f4', thin:true, scale:1.04 },
  matt:{ shirt:'#8a2a2a', pants:'#5a5a4a', hair:'#c9a15a', hairStyle:'shaggy', top:'flannel', bottom:'cargo', chain:'puka', shoes:'#2a2a2a' },
  milo:{ shirt:'#4a6ab8', pants:'#9a8a6a', hair:'#5a3a1c', glasses:true, hairStyle:'curtains', top:'polo', collar:'#f4f4f0', bottom:'cargo', thin:true },
  dad:{ shirt:'#4a5568', pants:'#5a4a3a', hair:'#4a3a2a', beard:'#5a4a3a', wide:1.15, scale:1.05, top:'polo', hairStyle:'short' }, mom:{ shirt:'#a8557a', pants:'#a8557a', hair:'#7a4a2a', hairStyle:'pony', top:'track', bottom:'track', lips:'#b5505a' },
  pepper:{ dog:true, color:'#efe6d6', dark:'#6a5a4a', size:.8 }, remy:{ dog:true, color:'#3a2a1a', dark:'#1a1a1a' }, levi:{ dog:true, color:'#c9a26b', dark:'#5a3a1a', size:1.1 },
  blackout:{ shirt:'#141414', pants:'#141414', shoes:'#111', top:'hoodie', bottom:'cargo', hat:'beanie', hatColor:'#111' } };
export const black = l => ({ ...l, shirt:'#141414', pants:'#141414', cap:l.cap ? '#111' : undefined });
const C = 'Chris';
export const pos = a => a.p || a;
export function two(a, b, side = 1, d = 3.8, ms = 700){ const A = pos(a), B = pos(b), mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz) || 1;
  const y = Math.max(A.y || 0, B.y || 0); return H.shot([mx - dz / L * d * side, y + 1.9, mz + dx / L * d * side], [mx, y + 1.45, mz], ms); }
export function face(n, t){ const T = pos(t); n.look(T.x, T.z); }
export function faceP(t){ const T = pos(t); P.yaw = Math.atan2(T.x - P.p.x, T.z - P.p.z); P.model.rotation.y = P.yaw; }
export const call = (who, lines) => lines.map(([w, t]) => [w + (w && w !== C && who ? ' (phone)' : ''), t]);
const day1 = 'SEPTEMBER 23RD 2003', day2 = 'SEPTEMBER 24TH 2003';

// =================== M01 — WELCOME TO BELLEVILLE (GAME ORIGINAL) ===================
const M01 = { title:'Welcome to Belleville', sub:'GAME ORIGINAL · TUTORIAL', where:'new game', start:{ x:0, z:7 },
  setup(i){ E.setTime('after'); E.setOutfit({}); clock('BELLEVILLE, ILLINOIS', '2003'); G.noTraffic = false; },
  stages:[
    async () => { const b = G.bedSpawn; E.place(b.x, b.z, Math.PI, 3.2); E.cut(true);
      await H.shot([70, 46, 90], [0, 4, 0], 0); await H.shot([40, 26, 50], [0, 3, -4], 5000); await H.shot([8, 9, 26], [0, 4, -4], 4000);
      await H.shot([-3.7, 4.7, -9.6], [-4.3, 4.1, -11.5], 0); await H.wait(1600); await H.shot([-5.3, 5.2, -6], [-3.3, 3.9, -8.6], 1200);
      await H.card('BELLEVILLE, ILLINOIS | 2003', '', 2600);
      await H.say([[C, 'Belleville, Illinois. Same town, same houses, same boring crap.'], [C, 'I could probably find something to do. Probably.']]); E.cut(false); },
    async () => { E.obj('Look around your room.'); P.moved = 0; P.rotated = 0;
      minter({ x:G.desk.x, z:G.desk.z, y:3.2, r:1.8, prompt:'LOOK AT THE COMPUTER', use:() => H.say([[C, 'This thing takes five years to start up.']]) });
      minter({ x:G.mags.x, z:G.mags.z, y:3.2, r:1.6, prompt:'READ GAME MAGAZINES', use:() => H.say([[C, 'Now THIS is a productive use of time.']]) });
      E.toast('WASD — MOVE · MOUSE / ARROWS — LOOK<br>Click the game to lock the mouse', 5000);
      await H.until(() => P.moved > 4 && P.rotated > .8 && !G.dialogOn);
      await H.say([[C, "Alright, I've seen my room. Groundbreaking."]]);
      E.obj('Head downstairs and leave the house.'); await H.reach(0, 2, 1.6, { y:0 });
      E.toast('E — INTERACT', 3000); await H.interact(0, 3.6, 'OPEN THE FRONT DOOR', 2.2, 0); E.sfx('door');
      await H.fade(true, 300); E.place(0, 6.6, 0); await H.fade(false, 300);
      E.cut(true); await H.shot([3, 2.2, 12], [0, 1.4, 5], 0); await H.say([[C, 'Fresh air. Amazing invention.']]); E.cut(false); },
    async () => { E.obj('Try switching camera views. (V)'); E.toast('V — FIRST / THIRD PERSON', 4000); G.camToggled = false;
      await H.until(() => G.camToggled); await H.wait(600); await H.say([[C, "Okay, that was weird. Moving on."]]); },
    async () => { const J = G.JX, jax = mnpc('Jax', LOOK.jax, J.x, J.z + 1.5, { face:Math.PI }); jax.blip = '#4fc3ff';
      E.obj('Find Jax.'); await H.reach(J.x, J.z - 1.6, 4.5, { noMarker:false }); await H.interact(() => jax.p.x, () => jax.p.z, 'TALK TO JAX', 3.4);
      E.cut(true); face(jax, P.p); faceP(jax); await two(P.p, jax);
      await H.say([['Jax', 'Well, look who finally decided to come outside.'], [C, 'Yeah, yeah. I got bored.'], ['Jax', 'And you came all the way over here just to tell me that?'],
        [C, 'What, you got something better going on?'], ['Jax', 'Not really.'], [C, 'Then shut up.'], ['Jax', "(laughing) Sounds about right. Go look around town. Maybe something interesting'll happen."],
        [C, "In Belleville? Yeah, I'll believe it when I see it."]]); G.flags.met_jax_tutorial = true; E.cut(false); },
    async () => { E.obj('Check out the neighborhood landmark.'); E.toast('M — MAP · SHIFT — SPRINT', 4000); G.blips.push({ x:G.PK.x, z:G.PK.z, c:'#7ad16a' });
      await H.reach(G.PK.x, G.PK.z, 7); await H.say([[C, 'Well, there it is. A whole town full of places I could be bored in.']]); },
    async () => { E.obj('Head back home.'); await H.reach(0, 7.5, 2.2); E.cut(true); await H.shot([-6, 3, 16], [0, 1.6, 6], 900);
      await H.say([[C, 'I went outside, talked to Jax, and came home. What an adventure.'], [C, "Could've been worse."]]);
      await H.banner('MISSION PASSED', 'WELCOME TO BELLEVILLE'); E.toast('FREE ROAM UNLOCKED<br>NEW STORY MISSION AVAILABLE: TRIP TO THE KITCHEN', 5000);
      Object.assign(G.flags, { M01_complete:true, M02_available:true, free_roam:true }); } ] };

// =================== M02 — TRIP TO THE KITCHEN (BOOK: September 23, 2003) ===================
const pj = { shirt:'#7a9ad8', pants:'#5a7ac0', shoes:'#e8b896', sleeve:'short', top:'tee', bottom:'jeans' };
const CHASE = [[-14.2, -3], [-14.4, 10], [-10, 23.5], [45, 23.5], [80, 24], [100, 26], [100, 60], [100, 95], [100, 118]];
const M02 = { title:'Trip to the Kitchen', sub:'SEPTEMBER 23RD 2003', where:"the TV in Chris's living room", needs:'M01', start:{ x:-4.5, z:1.4 },
  setup(i){ E.setTime('after'); E.setOutfit(pj); clock(day1, ''); G.noTraffic = true; },
  stages:[
    async () => { phoneUp(true); E.cut(true); clock(day1, '2:40 PM'); await H.shot([.1, 2.1, -3.4], [3.1, 1.5, -1.2], 0);
      await H.card(day1, '“Drain You” would be playing right now. (music placeholder)', 2600);
      await H.say(call(true, [[C, 'Dude, today is so damn boring'], ['Zeke', 'Bro, I got the coolest idea, let’s skate over some trash cans or something'],
        [C, "That sounds kick-ass but I can't leave the house, I gotta take care of this bratty ass dog, Pepper"], ['Zeke', 'Lame as fuck bro, just ditch like you always do'],
        [C, 'If i get in trouble again i am gonna be moose meat'], ['Zeke', 'I’ll be there soon,']])); phoneUp(false);
      await H.say([['', 'Zeke is one of the sickest dudes ever. We get into all kinds of shit, all of the time. It’s awesome. He works at Journey\'s at the mall, he says it sucks ass and I don\'t blame him.'],
        ['', 'Anyways, i am gonna head to the living room to take care of this lame dog and watch some awesome fucking TV. The new season of this show, Malcolm in the Middle comes on tonight.']]); E.cut(false); },
    async () => { const pep = mnpc('Pepper', LOOK.pepper, -1, -1.1, { speed:1.2 }); pep.blip = '#fff';
      const roam = () => pep.go([[-1 + Math.random() * 4 - 2, -7 + Math.random() * 3]]).then(() => setTimeout(roam, 1200)); roam();
      E.obj('Check on Pepper.'); await H.interact(() => pep.p.x, () => pep.p.z, 'CHECK ON PEPPER', 2); E.sfx('bark'); await H.say([['', 'yip yip, yip yip.'], [C, '...bratty ass dog.']]);
      E.obj('Watch some TV.'); await H.interact(G.sofa.x, G.sofa.z, 'SIT AND WATCH TV', 2.2); sitSofa(true); E.cut(true);
      await H.shot(...TV_SHOT, 600); const flick = mtick(() => G.tvScreen.material.color.setHSL((G.t * .3) % 1, .5, .45)); await H.wait(2200);
      E.sfx('bang'); await H.shot([-4.6, 2, -5.6], [-8, 1.6, -7], 300); await H.wait(400);
      const zeke = mnpc('Zeke', LOOK.zeke, -9.8, -7, { face:Math.PI / 2 }); G.zeke = zeke; await H.shot([-4.5, 1.9, -7], [-9.8, 1.6, -7], 500);
      pep.stop(); pep.at(-5.6, -7.4); E.sfx('bark'); flick(); G.tvScreen.material.color.set(0x4a6aa8);
      await H.say([['Zeke', 'YO'], ['Zeke', 'OPEN THIS DAMN WINDOW'], ['', 'The dog starts to do that annoying fucking bark she always does, yip yip, yip yip.'],
        [C, "Dude. What the hell are you doing here?"], ['Zeke', "We are gonna do this sick idea, you know it's sick."], [C, 'It sounds cool but i can’t do it'], ['Zeke', 'Then i will make you']]);
      E.place(-3.4, -7, -Math.PI / 2); const kw = G.kitchenWindow, ky = kw.position.y; for(let i = 0; i < 12; i++){ kw.position.y = ky + i * .1; await H.wait(30); } E.sfx('door');
      await H.go(zeke, [[-8.75, -7]], 2); await crawl(zeke, -8, 1, -7); await H.go(zeke, [[-5.4, -7.8]], 3); pep.o.visible = false; E.sfx('bark');
      await H.go(zeke, [[-7.25, -7]], 4); await crawl(zeke, -8, -1, -7); await H.go(zeke, [[-9.8, -7], [-11.6, -3.4]], 5);
      kw.position.y = ky; await H.say([['', 'Zeke walks through my fucking window, steals the dog and fucking runs off with it. So now I am chasing this actual idiot with my dog down the street in daytime pajamas. Story of my fucking life.'],
        ['', 'It’s so over when dad gets home.']]);
      await H.card('GET PEPPER BACK', '', 1800); E.cut(false); },
    async () => { const zeke = mnpc('Zeke', LOOK.zeke, 11, -2); const pep = mnpc('Pepper', LOOK.pepper, 11, -2); zeke.blip = '#ff4f4f';
      E.place(-9.4, -7, 0); E.obj('CHASE ZEKE AND GET PEPPER BACK.'); clock(day1, '2:55 PM');
      mtick(() => { pep.p.set(zeke.p.x + Math.sin(zeke.face + 1.6) * .3, zeke.p.y + .75, zeke.p.z + Math.cos(zeke.face + 1.6) * .3); pep.face = zeke.face; pep.sync(); });
      let tired = false; zeke.go(CHASE, 9).then(() => tired = true);
      mtick(() => { const d = Math.hypot(P.p.x - zeke.p.x, P.p.z - zeke.p.z); zeke.speed = tired ? 2.4 : d > 16 ? 6.4 : d < 4 ? 10.6 : 9; if(d > 75) fail('You lost Zeke.'); });
      E.setWay(100, 118); await H.until(() => Math.hypot(P.p.x - zeke.p.x, P.p.z - zeke.p.z) < 2.2 && zeke.p.z > 60); zeke.stop(); E.setWay();
      E.cut(true); face(zeke, P.p); faceP(zeke); await two(P.p, zeke, -1);
      await H.say([['', 'Good thing for me, Zeke is a fat ass and is too slow. I finally caught up to him but we were still a mile to a mile and a half from my house.'],
        [C, 'DAMN IT ZEKE'], ['Zeke', 'DUDE I WAS JUST TRYING TO HAVE SOME FUN'], [C, 'NO MEANS NO DUDE, MEN, WOMEN AND IT MEANS THAT FOR EVERYTHING AND EVERYONE'],
        ['Zeke', 'Alright dude lets just stop yelling'], [C, 'Fine. How are we gonna get this dog home?'], ['Zeke', 'I don’t know… walk?'], [C, 'Jesus']]); E.cut(false); },
    async () => { E.place(99, 112, Math.PI); const zeke = mnpc('Zeke', LOOK.zeke, 101, 113); const pep = mnpc('Pepper', LOOK.pepper, 101, 113);
      mtick(() => { if(!pep.free){ pep.p.set(zeke.p.x + .3, zeke.p.y + .75, zeke.p.z); pep.face = zeke.face; pep.sync(); } });
      E.obj('Walk Pepper home.'); zeke.follow(P, 2.4, 6.2, [1.4, -.4]); await H.reach(100, 92, 3, { noMarker:true });
      zeke.stop(); E.cut(true); pep.free = true; pep.at(zeke.p.x + .8, zeke.p.z - .5); await two(P.p, zeke, 1);
      await H.say([['', 'We start walking, and walking but then Zeke does the most dumbass thing AGAIN. HE DROPS THE DOG TO LET IT USE THE BATHROOM.'],
        [C, 'ZEKE WHAT THE HELL ARE YOU DOING!'], ['Zeke', 'I’M JUST LETTING THE DOG DO ITS BUSINESS.. WAIT']]);
      pep.go([[100, 120]], 10); E.sfx('bark'); await H.wait(700);
      await H.say([['', 'zeke said as the Pepper started to run away, god. damn. It.'], [C, 'WHAT THE FUCK. CHASE AFTER HER'], [C, 'ACT LIKES ITS FOOD'], ['Zeke', 'ALRIGHT']]);
      await H.card('FOLLOW PEPPER', '', 1400); E.cut(false); },
    async () => { const zeke = mnpc('Zeke', LOOK.zeke, 101, 96); const pep = mnpc('Pepper', LOOK.pepper, 100, 122); pep.blip = '#fff'; E.place(100, 99, 0);
      E.obj('FOLLOW PEPPER.'); clock(day1, '3:20 PM'); zeke.follow(P, 1.5, 10.5); let t0 = G.t, revealed = false, tiredSaid = false;
      pep.go([[100, 140], [99, 170], [101, 200], [100, 214]], 9.5);
      mtick(() => { const d = Math.hypot(P.p.x - pep.p.x, P.p.z - pep.p.z); pep.speed = d > 22 ? 4.5 : d < 9 ? 10.8 : 9.5;
        if(G.t - t0 > 90 && !tiredSaid){ tiredSaid = true; zeke.speed = 3; E.toast('Zeke ran out of energy within the first minute and a half.', 3500); }
        if(d > 60) fail('Pepper got away.'); });
      await H.until(() => P.p.z > 150);
      if(!tiredSaid){ tiredSaid = true; zeke.speed = 3; }
      await H.say([['', 'Man is that guy a fat ass. Dude ran as fast as he could but ran out of energy within the first minute and a half. I kept running though because I needed that damn dog.'],
        ['', 'Remy and Levi are at home by themselves and I left them outside. Luckily the fence gate is closed.. wait a fucking second.'],
        [C, 'ZEKE DID YOU LEAVE THE GATE OPEN AT MY HOUSE'], ['Zeke', 'UH I MIGHT OF'], [C, 'HOLY SHIT I MIGHT GO INSANE']], { auto:true });
      E.toast('3 DOGS LOOSE · Parents home in about 2½ hours', 4500); G.flags.three_dogs_loose = true;
      await H.say([['', 'i now have 3 dogs on the loose and two parents who are gonna be pissed in 2 ½ hours when they get home. So i think i have to devise a plan, my teacher taught me that word in class. I still don’t know what it means.']], { auto:true });
      await H.reach(100, 200, 4); pep.go([[100, 251], [140, 256]], 8); },
    async () => { E.place(100, 200, 0); const zeke = mnpc('Zeke', LOOK.zeke, 101.5, 198, { face:0 }); zeke.blip = '#ff4f4f'; clock(day1, '3:35 PM');
      E.cut(true); await two(P.p, zeke);
      await H.say([[C, 'Alright'], ['', 'I said , running for my damn life, out of breath, with the dog in the distance.'],
        [C, 'We are almost 3 miles from Zeke\'s house Zeke, with two other dogs on the loose. I need you to grab your phone and call Jax and Matt.. and maybe Milo because I don\'t know if Matt will be available.'],
        ['Zeke', 'Alright, but i think we need to stop somewhere to eat'], [C, 'PEPPER IS YOUR DINNER, SHES RIGHT THERE'], ['', 'zeke is not eating my damn dog.']]); E.cut(false);
      E.obj('GET ZEKE TO CALL JAX AND MATT.');
      await H.interact(() => zeke.p.x, () => zeke.p.z, 'TELL ZEKE TO CALL JAX', 3); zeke.stop(); face(zeke, P.p); E.cut(true); E.holdPhone(zeke.o, 'nokia'); await phoneShot(zeke);
      await H.say([['Zeke', 'YO! Jax it’s me, Zeke'], ['Zeke', 'Hold on i am putting you on speaker'], ['Jax (phone)', 'Alright.'], ['Zeke', 'ALRIGHT, so we are in a bit of trouble'], ['Jax (phone)', 'What now…'],
        ['Zeke', 'I may have let the dogs out of Chris’ house and they are now scavenging the city.'], ['Jax (phone)', 'Of course… wait do you know what scavenging means'],
        ['Zeke', 'I don’t know, it mean’s somethings gone bad or something'], ['Jax (phone)', 'Alright… where should i meet you and Chris'], ['Zeke', 'Maple Street, as soon as possible!'],
        ['Jax (phone)', 'Alright, give me 5'], ['Zeke', 'See ya'], ['Jax (phone)', 'Yeah.']]); G.flags.Jax_arriving = true; E.holdPhone(zeke.o, null); E.cut(false);
      await H.interact(() => zeke.p.x, () => zeke.p.z, 'TELL ZEKE TO CALL MATT', 3); zeke.stop(); face(zeke, P.p); E.cut(true); E.holdPhone(zeke.o, 'nokia'); await phoneShot(zeke);
      await H.say([[C, 'Are you off the phone Zeke'], ['', 'we are running out of steam running quickly. If only i and zeke hadn’t been so fucking stupid.'], ['Zeke', 'Yeah'], [C, 'Call. Matt. Quickly'],
        ['Zeke', 'Alright'], ['', 'zeke says dialing his phone as if hes a fucking fossil.'], ['Zeke', 'MATT, you there'], ['Matt (phone)', 'YOOOO, whats up'], ['Zeke', 'Situation. Meet us on Maple Street!'],
        ['Matt (phone)', 'Fine with me give me a couple of minutes']]); G.flags.Matt_arriving = true; E.holdPhone(zeke.o, null); E.cut(false);
      await H.say([['', 'Alright well at least we got Matt, Zeke (he\'s a dumbass though) and Jax on the way.'], ['', 'Zeke also called Milo but he said he would be like 25 damn minutes so.']]); G.flags.Milo_delayed = true; },
    async () => { E.place(100, 200, Math.PI); const zeke = mnpc('Zeke', LOOK.zeke, 101.5, 198); const jax = mnpc('Jax', LOOK.jax, 94, 160); const matt = mnpc('Matt', LOOK.matt, 95, 150);
      E.obj('Wait for Jax and Matt.'); jax.blip = matt.blip = '#4fc3ff'; await Promise.all([H.go(jax, [[99, 196]], 3.4), H.go(matt, [[98, 197.5]], 3)]);
      [jax, matt, zeke].forEach(n => face(n, P.p)); await H.say([['', 'After what felt like forever Matt and Jax arrived.'], ['', 'Until the worst thing that could’ve ever fucking happen. I saw a white SUV in the distance and i couldn’t fucking believe it.']]);
      E.cut(true); const suv = E.makeCar('#f2f2f2', { suv:true }); G.scene.add(suv); let sz = 250; suv.rotation.y = Math.PI;
      await H.shot([104, 2.4, 205], [100, 1.5, 235], 600);
      await H.until(() => { sz -= .55; suv.position.set(102.2, 0, sz); return sz < 207; });
      const dad = mnpc('Dad', LOOK.dad, 103.4, 206.5); const mom = mnpc('Mom', LOOK.mom, 101, 207.5); [dad, mom].forEach(n => face(n, P.p));
      await two(P.p, dad, 1, 4.6);
      await H.say([['Dad', 'THERE YOU ARE'], ['', 'said my FUCKING DAD'], ['Mom', 'YOU ARE SO GROUNDED'], ['', 'said my mom, i am so done for.'],
        ['Dad', 'WE SAW WHAT HAPPENED, 3 DOGS LOOSE. ARE YOU KIDDING ME. WE CAN’T TRUST YOU WITH ANYTHING'], ['Dad', 'LUCKILY, WE FOUND REMY BUT LEVI AND PEPPER ARE SOMEWHERE IN THE ENTIRE DAMN TOWN'],
        [C, 'I’ll figure this out dad'], ['Dad', 'GET IN THE DAMN CAR, ALL OF YOU'], ['Jax', 'To be fair… Chris did call us'], ['', 'Jax said like a damn narc.'],
        ['Dad', 'I DON’T GIVE A FUCK.'], ['Dad', 'GET YOUR ASSES IN THE CAR NOW!'], ['Everyone', 'Alright..']]); G.flags.remy_found = true;
      await H.fade(true, 500); [zeke, jax, matt, dad, mom].forEach(n => n.o.visible = false); P.model.visible = false;
      E.obj('HELP FIND LEVI AND PEPPER.'); const route = [[102.2, 205], [102, 120], [100, 30], [70, 22.5], [20, 22.5], [-30, 22.5], [-60, 22.5], [-20, 22.5], [10, 22.5]];
      let seg = 0, sp = new E.THREE.Vector3(102.2, 0, 207); suv.rotation.y = Math.PI;
      E.camTrack(dt => { const t = route[Math.min(seg, route.length - 1)], dx = t[0] - sp.x, dz = t[1] - sp.z, d = Math.hypot(dx, dz);
        if(d < 1 && seg < route.length - 1) seg++; else if(d > .01){ sp.x += dx / d * Math.min(d, 13 * dt); sp.z += dz / d * Math.min(d, 13 * dt); suv.rotation.y = Math.atan2(dx, dz); }
        suv.position.copy(sp); return [[sp.x - Math.sin(suv.rotation.y) * 9 + 3, 4.5, sp.z - Math.cos(suv.rotation.y) * 9], [sp.x, 1.2, sp.z]]; });
      await H.fade(false, 500); await H.card('THE SEARCH', 'Driving around calling out for the dogs', 2000);
      await H.say([['Dad', 'PEPPER! LEVI!'], ['', 'We drove around calling out for our dogs. It was a nightmare. Jax is just sitting there all quiet like he\'s in a museum or something stupid and then Zeke has the actual dumbest comment i have ever heard.'],
        ['Zeke', 'So do I still get to eat the dog?'], ['Dad', 'Shut the hell up now Zeke, your parents are gonna get a call about this'], ['Zeke', 'Damn it.'],
        ['', 'Zeke said as if he missed his fifth damn meal of the day.'], ['', 'We eventually found them, some people called the numbers on the collar, genius invention I guess.'],
        ['', 'My lame stupid loser dad dropped all of us off except for me. Typical targeting of me as per usual.']]);
      G.flags.dogs_safe = true; G.flags.chris_grounded = true; await H.until(() => seg >= route.length - 1);
      await H.shot([sp.x + 6, 2.2, sp.z + 6], [sp.x, 1.3, sp.z], 800);
      await H.say([[C, 'So where did the dogs go?'], ['', 'I asked, cause I kinda forgot.'], ['Dad', 'We have them at the house, they were three blocks over in each direction almost. You know you\'re very much grounded right?'],
        [C, 'Fine.'], ['Dad', 'Also Chris, we won’t be back until 8 PM, so behave for the rest of the night.'], [C, 'I will'], ['Dad', 'Are you sure'], [C, 'I WILL DAD'], ['Dad', 'Alright']]);
      G.suvHome = suv; },
    async () => { E.setTime('dusk'); clock(day1, '5:52 PM'); E.place(3, 15, Math.PI); P.model.visible = true;
      [['remy', -6, -20], ['levi', 6, -22], ['pepper', 2, -18]].forEach(([k, x, z]) => { const d = mnpc(k, LOOK[k], x, z); });
      E.obj('GO HOME AND WATCH TV.'); await H.say([['', 'god this shit sucks, im gonna be grounded when they get back, so I might as well watch some TV.']]);
      await H.interact(G.sofa.x, G.sofa.z, 'WATCH MALCOLM IN THE MIDDLE', 2.2); sitSofa(true); E.cut(true);
      await H.shot(...TV_SHOT, 600); mtick(() => G.tvScreen.material.color.setHSL((G.t * .25) % 1, .45, .5));
      await H.say([['', 'I walk into the house, it\'s starting to get dark inside cause it\'s like night or something. I sit down to watch TV. One of my favorite shows is Malcolm in the Middle, that Reese dude is hella smart.'],
        ['', 'However, that damn phone interrupts my episode.']]);
      const ring = setInterval(() => E.sfx('ring'), 1400); E.cut(false); E.obj('ANSWER THE PHONE.');
      await H.interact(G.phone.x, G.phone.z, 'ANSWER THE PHONE', 2); clearInterval(ring); clock(day1, '6:00 PM');
      E.cut(true); phoneUp(true); await H.shot([.1, 2.1, -3.4], [3.1, 1.5, -1.2], 500);
      await H.say([[C, 'Hello?'], ['Eric (phone)', 'Is this Chris?'], [C, 'Yeah? Who is this now? Are you one of those dumbass telemarketers?'], ['Eric (phone)', 'No, I am your boss, where the hell are you Chris?'],
        [C, 'Eric? That\'s you? Your voice sounds funnier over the phone'], ['Eric (phone)', 'CHRIS, ITS 6 PM AND YOU WERE SUPPOSED TO BE AT WORK 3 HOURS AGO TO CLOSE. GET YOUR ASS HERE NOW'],
        [C, 'What if…. I take the day off'], ['Eric (phone)', 'Get to work… NOW.'], [C, 'I’m good on this one dude, i’ll take the sick day']]); phoneUp(false);
      E.sfx('door'); await H.shot([-4.3, 5, -9], [-4.3, 4.1, -11.5], 1200);
      await H.say([['', 'hanging up the phone like a boss. Now I would call today pretty successful so far. Might get on the computer to end the night, Runescape is so good.']]);
      await H.banner('MISSION PASSED', 'TRIP TO THE KITCHEN'); Object.assign(G.flags, { missed_shift_eric:true, chris_grounded:true, dogs_safe:true, M03_available:true });
      if(G.suvHome) G.scene.remove(G.suvHome); } ],
  done(){ G.roamTime = 'dusk'; G.noTraffic = false; } };

// =================== M03 — ZEKE'S IDEA (BOOK: September 24, 2003) ===================
const M03 = { title:"Zeke's Idea", sub:'SEPTEMBER 24TH 2003', where:"Chris's backyard", needs:'M02', start:{ x:0, z:-19 },
  setup(i){ E.setTime('after'); clock(day2, '2:00 PM'); E.setOutfit(i >= 2 ? LOOK.blackout : {}); G.noTraffic = i >= 2; },
  stages:[
    async () => { E.place(0, -20, Math.PI); E.cut(true); await H.shot([6, 3, -14], [0, 1.2, -21], 0);
      await H.card(day2, '', 2200);
      await H.say([['', 'The fall weather was pretty nice man. Sometimes I enjoy the little things in life; like knocking over the neighbors trash cans but not now, for now i am just gonna chill out in the backyard. 69 degrees, ha; nice.'],
        ['', 'However, I just like the calm sometimes, and sometimes I feel like I got run over like the Arizona Cardinals offensive line. It’s a good year to be a Rams fan.'],
        ['', 'Unfortunately, I just realized I have school tomorrow. Damn it. I guess i have to do that assignment for US History or Mr. Eberle will freak the fuck out as per usual; DBQ’s will always be my mortal enemy.']]);
      E.cut(false); E.obj('FIND YOUR HOMEWORK.'); await H.interact(G.backpack.x, G.backpack.z, 'CHECK YOUR BACKPACK', 1.8, 3.2);
      await H.say([['', 'I head inside and get to my backpack and realize that I left the homework in my damn locker at work. Shit.'],
        ['', 'If i go back there i have to face my manager Eric and he\'s gonna be pissed about yesterday still. I know who i need to call about how to get that homework back.'],
        ['', 'Milo, he knows how to get that paper back, and he can give me the answers! YES! That\'s what I need.']]);
      E.obj('CALL MILO.'); await H.interact(G.phone.x, G.phone.z, 'CALL MILO', 2); E.cut(true); phoneUp(true); await H.shot([.1, 2.1, -3.4], [3.1, 1.5, -1.2], 400);
      await H.say([['Milo (phone)', 'Hello Chris, what do you need, it\'s 2 in the afternoon you usually don’t wake up this early.'], [C, 'How did you know it was me… nevermind besides the point here, I need a plan on how to get my homework back from my work locker.'],
        ['Milo (phone)', 'Why don’t you just get it?'], [C, 'My boss is PISSED at me for forgetting about work then not coming in'], ['Milo (phone)', 'Sounds about right, I\'ll call the others and we can meet at your house in 10'],
        [C, 'Sounds good Milo, i appreciate it'], ['Milo (phone)', 'Yeah.'], ['', 'he said, hanging up the phone. Dude. Uncool. Why would he just hang up on me by just saying “Yeah.” Anyway, I\'m gonna watch TV for now and wait for the gang to get here.']]);
      phoneUp(false); E.cut(false); E.obj('WAIT FOR THE GROUP. (Watch TV to pass the time)'); await Promise.race([H.interact(G.sofa.x, G.sofa.z, 'WATCH TV UNTIL THEY GET HERE', 2.2), H.wait(25000)]);
      await H.fade(true, 600); await H.card('10 MINUTES LATER', '', 1500); },
    async () => { E.place(-4.5, -3, 0); const g = { milo:mnpc('Milo', LOOK.milo, -6.5, .4), zeke:mnpc('Zeke', LOOK.zeke, -2.3, -.2), jax:mnpc('Jax', LOOK.jax, -6.8, -1.8), matt:mnpc('Matt', LOOK.matt, -2, -2) };
      Object.values(g).forEach(n => face(n, P.p)); E.cut(true); await H.shot([-1, 2.6, -4.7], [-4.5, 1.1, -.6], 0);
      await H.say([[C, 'Alright, so how do we attack this'], ['', 'i ask the gang, confused'], ['Milo', 'Alright, what if we just wait till Eric gets off work'], [C, 'Might work'],
        ['Zeke', 'What if? We break into the Schnucks at night'], [C, 'I do like that idea'], ['Milo', 'Are we serious right now'], ['Milo', 'Thats idiotic'], ['Jax', 'I like it'],
        ['Matt', 'Could be fun, but what if we did that but right now instead of at night'], [C, 'Yes.. Yes.. YES'], ['Zeke', 'Agreed'],
        ['Milo', 'What the actual fuck are you guys on. Did you go to a rager or something and get your brains amputated?'], [C, 'Let\'s put it to a vote, alright Milo?'], ['Milo', 'Fine.']]);
      await H.choose(['✋ Raise your hand', '✋ Raise your hand (enthusiastically)']);
      await H.say([[C, 'All in favor or something, i kinda don’t know what that means'], ['', 'Jax, Zeke and I raise our hands and Milo keeps his down'], [C, 'Alright, breaking in wins.'],
        ['Milo', 'Ill go along with it this time but i swear to god if something goes wrong i am gonna be so pissed'], ['Milo', 'You know its 2 PM in the afternoon and your trying to break into Schnucks'],
        ['Zeke', 'It’s closed on Sundays, it’s like Chick-fil-a'], ['', 'pretty smart call by zeke, no wonder why i never work sundays, or never show up that is.'], ['Milo', 'It\'s not clos…. Nevermind,']]);
      G.flags.plan_enter_from_back = true; await H.fade(true, 500); },
    async () => { E.place(0, 7, 0); const L = LOOK, g = ['milo', 'zeke', 'jax', 'matt'].map((k, i) => mnpc(k, black(L[k]), -1.5 + i, 5));
      const FORM = [[-1.6, 1.6], [1.6, 1.8], [-1.4, 3.4], [1.4, 3.6]]; g.forEach((n, i) => { n.follow(P, 2, 6.8, FORM[i]); n.blip = '#4fc3ff'; }); g[1].speed = 5.8;
      E.obj('GO TO SCHNUCKS SWANSEA.'); E.setWay(295, 244); E.toast('Everyone is wearing all black. Very subtle.', 3500);
      await H.say([['', 'So after whatever that was, we started walking to my work, Schnucks Swansea. It\'s only 1 ½ miles away so it should be good.']], { auto:true });
      await H.until(() => P.p.z > 140);
      await H.say([['Zeke', 'It’s so hard to walk…. I’m soooo tired'], ['Milo', 'Maybe thats cause you a dumb fatass'], [C, 'Woah cool it off you two dudes, we\'re almost to the plaza']], { auto:true });
      await H.reach(295, 244, 7);
      await H.say([['', 'We then made it to the Schnucks plaza.'], [C, 'Alright let’s go around the back of the place'], ['Zeke', 'Alright']]); },
    async () => { E.place(295, 246, Math.PI); const g = ['milo', 'zeke', 'jax', 'matt'].map((k, i) => mnpc(k, black(LOOK[k]), 103 + i, 263)); const FORM = [[-1.6, 1.6], [1.6, 1.8], [-1.4, 3.4], [1.4, 3.6]]; g.forEach((n, i) => n.follow(P, 2, 7, FORM[i]));
      E.obj('LEAD THE GROUP AROUND BACK TO THE LOADING DOCK.'); G.storeOpen = true; await H.reach(224, 132, 5); await H.reach(G.hide.x + 2.6, G.hide.z - .5, 2.6); g.forEach(n => n.stop());
      g.forEach((n, i) => { n.at(G.hide.x - 1.2 + (i % 2) * .9, G.hide.z + .4 + (i > 1 ? .9 : 0), Math.PI); n.o.scale.y = .72; });
      E.place(G.hide.x + 2.6, G.hide.z - 1, Math.PI);
      E.cut(true); await H.shot([235.5, 2.6, 89.5], [248, 1.3, 109], 600); G.rearDoor.position.x = 155.5; G.rearDoor.userData.col.off = true; E.sfx('door');
      const eli = mnpc('Eli', { shirt:'#3a5a3a', pants:'#2a2a2a', hair:'#6a4a2a', vest:'#c8102e' }, 248, 111, { face:Math.PI }); await H.go(eli, [[248, 108]], 1.6); face(eli, P.p); faceP(eli);
      await H.say([['', 'The back loading docks, but then we heard the back door open.'], [C, 'DUCK'], ['', 'I said quickly except for some reason I wasn\'t ducking.'],
        ['Eli', 'Hey buddyyyy'], ['', 'said Eli, that lame porter that always pissed everyone off and thinks he\'s friends with them.'], [C, 'Hi Eli, pleasure to see you'],
        ['', 'i said, hating every fucking second of this conversation, and it just started.'], ['Eli', 'Wanna hang out some timeeeeee'], [C, 'I’ll pass thanks.'],
        ['Eli', 'Alright buddyyyyy, ill see you aroundddd'], [C, 'Thats fine but can you leave the door open'], ['Eli', 'Alright buddyyy'], [C, 'STOP'],
        ['', 'I said as he kept continuing that exaggeration every single time.']]);
      await H.go(eli, [[224, 108], [210, 108]], 2.5).catch(() => {}); eli.remove(); g.forEach(n => n.o.scale.y = 1);
      await H.say([[C, 'Alright the coast is clear'], ['Matt', 'Wow thats gay'], ['Zeke', 'You should hang out with him,'], ['', 'Zeke said, clearly joking but I didn\'t want to hear it.']]);
      E.cut(false); E.obj('ENTER THROUGH THE BACK.'); await H.interact(248, 108.5, 'SNEAK INSIDE', 2.4); },
    async () => { E.place(248, 113, 0); G.rearDoor.position.x = 155.5; G.rearDoor.userData.col.off = true; G.storeOpen = true;
      const g = ['milo', 'zeke', 'jax', 'matt'].map((k, i) => mnpc(k, black(LOOK[k]), 151 + i * .7, 400.5)); const FORM = [[-1.2, 1.4], [1.2, 1.5], [-1, 2.8], [1, 2.9]]; g.forEach((n, i) => n.follow(P, 1.8, 7, FORM[i]));
      E.cut(true); await H.shot([254, 5.5, 118], [300, 6.6, 122], 600);
      await H.say([['', 'We walk inside the backroom when I realize there are cameras in every square damn inch of the back. We are also wearing all black clothing, maybe this is a bad idea, but I also need that homework.'],
        ['', 'So we sneak inside and straight onto the shopping area.'], [C, 'Alright, the lockers are upstairs above the pharmacy']]); E.cut(false);
      E.obj('REACH YOUR LOCKER ABOVE THE PHARMACY.'); const blink = mtick(() => G.camerasBack.forEach((l, i) => l.visible = Math.sin(G.t * 6 + i) > 0));
      const andrew = mnpc('Andrew', { shirt:'#e8e0c8', pants:'#2a2a3a', hair:'#8a5a2a', vest:'#c8102e' }, 326, 136.4, { face:Math.PI, y:3.6 }); andrew.face = Math.PI;
      E.setWay(318, 160); await H.until(() => P.p.y > 3 && P.p.z < 144 && P.p.x > 316);
      E.cut(true); E.place(322.8, 138.4, Math.PI, 3.6); g.forEach((n, i) => { n.stop(); n.at(79 + (i % 2) * 1.2, 370.6 - (i > 1 ? 1.2 : 0)); face(n, andrew.p); }); face(andrew, P.p); faceP(andrew);
      await H.shot([327.4, 5.4, 141.8], [324.2, 4.7, 137.2], 600);
      await H.say([['', 'We then have to run into Andrew doing absolutely nothing in the break room.'], ['Andrew', 'Yooo Chris!'], ['Andrew', '..and his gang in all black??'], [C, 'Not gonna explain'], ['Andrew', 'Alright then'],
        ['', 'Andrew said as he went back to doing his thing; and by thing I mean nothing.']]); andrew.face = Math.PI; g.forEach((n, i) => n.follow(P, 1.8, 7, FORM[i])); E.cut(false);
      E.obj('SEARCH YOUR LOCKER.'); await H.interact(G.locker.x, G.locker.z, 'RUMMAGE THROUGH YOUR LOCKER', 2, 3.6);
      E.toast('ITEM: US HISTORY HOMEWORK', 3000); G.flags.has_papers = true; await H.wait(1200); },
    async () => { E.place(343, 128, -Math.PI / 2, 3.6); G.rearDoor.position.x = 152; G.rearDoor.userData.col.off = false;
      const g = ['milo', 'zeke', 'jax', 'matt'].map((k, i) => mnpc(k, black(LOOK[k]), 60 + i, 383, { y:3.6 })); g.forEach((n, i) => n.follow(P, 1.8 + i * 1.1, 5));
      E.sfx('pa'); await H.say([['PA SYSTEM', 'Security scan all aisles, Security scan all aisles'], [C, 'FUCK. We have to dash guys']]);
      E.obj('GET BACK TO THE REAR DOOR — THE WAY YOU CAME IN — BEFORE SECURITY FINDS YOU!'); let left = 70; const tEl = document.getElementById('timer'); tEl.style.display = 'block';
      mtick(dt => { if(!G.dialogOn) left -= dt; tEl.textContent = '0:' + String(Math.max(0, Math.ceil(left))).padStart(2, '0'); tEl.style.color = left < 15 ? '#ff5252' : '#fff'; if(left <= 0) fail('Security caught you. Back to the last checkpoint.'); });
      await H.reach(248, 114, 3); tEl.style.display = 'none';
      E.cut(true); await H.shot([254, 2.4, 118], [248, 1.6, 111], 400);
      await H.say([['', 'we all started running back the way we came but the door was closed.'], [C, 'FUCK!!'], ['', 'i said, knowing this was a sitation that was utterly fucked.'],
        ['Zeke', 'JUST OPEN THE DOOR, IT MAY CAUSE AN ALARM BUT WE CAN GET OUT OF HERE'], [C, 'NO DUMBASS, WE CAN’T DO THAT THE FIRE DEPARTMENT WILL COME AND THEY WILL CHECK THE CAMERAS'],
        ['', 'i said because what the fuck was that game plan'], ['Zeke', 'FINE THEN I’LL DO IT']]);
      const zk = g[1]; zk.stop(); E.place(250.5, 115.5, Math.PI + (Math.PI / 4)); g.forEach((n, i) => { if(n !== zk){ n.stop(); n.at(147.5 + i * .9, 395.2); face(n, { x:248, z:111 }); } }); zk.at(151, 398);
      await H.shot([254.5, 2.4, 117], [247.5, 1.4, 111], 400); await H.go(zk, [[248, 111.6]], 4); E.sfx('door');
      G.rearDoor.position.x = 155.5; G.rearDoor.userData.col.off = true; alarmFx(true);
      await H.say([['', 'zeke says as he shoves open the back door we came in through — the emergency exit — after it was re-armed. Jesus fucking christ this is terrible.']]); E.cut(false); },
    async () => { G.rearDoor.position.x = 155.5; G.rearDoor.userData.col.off = true; G.storeOpen = true; alarmFx(true); E.place(248, 112.5, Math.PI);
      const g = ['milo', 'zeke', 'jax', 'matt'].map((k, i) => mnpc(k, black(LOOK[k]), 150.5 + i, 397.5)); const FORM = [[-1.4, 1.6], [0, 0], [1.4, 1.7], [0, 3]]; g.forEach((n, i) => n.follow(P, 2, 11, FORM[i])); g[1].slow = true; g[1].follow(P, 3, 4.4);
      E.obj('ESCAPE SCHNUCKS WITH THE GROUP.'); E.setWay(248, 102); await H.until(() => P.p.z < 107); alarmFx(false); E.toast('The alarm fades behind you. RUN.', 2500);
      E.obj('RUN HOME.'); g[1].blip = '#ffa040'; await H.say([['', 'So we ran, although Zeke fell behind quickly.']], { auto:true }); await H.reach(0, 7, 2.6); await H.say([['', 'We then finally made it home.']]); await H.fade(true, 500); },
    async () => { E.place(-4.5, -3, 0); const g = { milo:mnpc('Milo', LOOK.milo, -6.5, .4), zeke:mnpc('Zeke', LOOK.zeke, -2.3, -.2), jax:mnpc('Jax', LOOK.jax, -6.8, -1.8), matt:mnpc('Matt', LOOK.matt, -2, -2) };
      Object.values(g).forEach(n => face(n, P.p)); E.cut(true); await H.shot([.2, 2.5, 1.8], [-4.5, 1.2, -1.8], 0); G.rearDoor.position.x = 152; G.rearDoor.userData.col.off = false;
      await H.say([[C, 'Alright, Milo, you can finally help me with tomorrows homework'], ['Milo', 'Does that mean give you the answers'], [C, 'Yes'], ['Zeke', 'Can i get those aswell'],
        ['Milo', 'Sure.'], ['', 'milo said sighing'], ['Milo', 'Wait, Chris'], [C, 'Yeah?']]);
      await H.shot([-5.6, 1.6, -.4], [-6.5, 1.3, .4], 400); await H.say([['Milo', 'This is last week\'s homework']]);
      await H.shot([-3.6, 1.8, -1.7], [-4.5, 1.5, -3], 200); E.sfx('bang'); await H.say([[C, 'GOD DAMN IT!!'], ['', 'i yelled, i just fucked myself over didn’t i.']]);
      await H.banner('MISSION PASSED', "ZEKE'S IDEA"); Object.assign(G.flags, { M03_complete:true, retrieved_wrong_homework:true, missed_shift_eric:true, M04_available:true }); } ],
  done(){ G.roamTime = 'after'; G.noTraffic = false; } };

setMissions({ M01, M02, M03, M04, S01, M05, M06, M07, M08, M09, M10, S02, S03, S04, S05, S06, S07 });
