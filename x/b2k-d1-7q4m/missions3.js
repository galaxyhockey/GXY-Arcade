// Back in the 2000s: The Game — Draft #1.75 mission M05 "Hair of the Dog" (BOOK: "Week 2 - September 30th 2003", PDF pages 22–30).
// PROVISIONAL CHAPTER: the author may revise it. All book text lives in the D table below (in book order) so a revised
// chapter can be dropped in without touching the mission flow. '' = Chris's narration (book prose). Nothing in D is game-original.
// Adaptation notes (flagged for the author, not silent fixes):
//  - No weekday is shown on screen (the heading says September 30th, the characters say Saturday).
//  - The closed-store exchange is printed twice on PDF p.28; it plays once, using the later, fuller version.
//  - "Basically around 10 PM... you guys when rambunctious" is attributed to Jax in the book; Milo is the one explaining, so Milo says it here.
//  - Nobody explains the shelf in the front yard, so the game does not either.
import * as E from './engine.js';
import { H, mnpc, mtick, minter, clock } from './game.js';
import { LOOK, two, face, faceP } from './missions.js';
const { THREE, G, P } = E; const C = 'Chris', JX = 'Jax', MI = 'Milo', ZK = 'Zeke', day5 = 'SEPTEMBER 30TH 2003';

const D = {
  wake0:[['', 'I woke up with a wicked headache. I felt like I had just been hit with a sledgehammer.'], ['', 'I got up off the floor and I saw Jax on the bed almost fully off the bed except from his knees to his feet. I walked up to him and tried to wake the butthole up.']],
  wake:[[C, 'Jax wake up'], [JX, 'Huhhh'], [C, 'Wake up dumbass, its time for school'], [JX, 'Time for school? Alright.'], [C, 'No dumbass, it\'s Saturday wake up.'], [JX, 'Ok']],
  wake2:[['', 'he said as he fell on his head and stood up and we walked to the living room']],
  light:[[C, 'Jax why is there a stop light in your living room'], [JX, 'I don’t know actually, good question']],
  kitchen0:[['', 'i walked over to the kitchen area in his house and started rummaging through the cabinets']],
  kitchen:[[C, 'Is there any breakfast in this damn house'], [JX, 'Uhh, maybe?'], [C, 'Maybe doesn\'t make me any less hungry jackass'], [JX, 'You know i don’t have to let you eat Chris'], [C, 'Fine.'], [JX, 'Theres some cereal in the cabinet'], [C, 'Alright.'],
    ['', 'i wonder what the fuck we did last night, eh who cares, food comes first.']],
  smorz:[['', 'I opened the cabinet and found…'], [C, 'Smorz?'], [JX, 'Yeah what about it'], [C, 'What the fuck is Smorz?'], [JX, 'It’s good cereal that\'s what it is'], [C, 'If this cereal is ass I am gonna be pissed'], ['', 'still not knowing why someone would want to have ‘Smorz indoors’.']],
  milk:[['', 'I grabbed the milk from the fridge and a bowl from the cabinet.']],
  eat:[['', 'I poured some smorz, saw that it rhymes at least and I sat down and ate. While I was eating, Jax sat down across the table from me with some Eggo waffles. Show off, we can’t afford eggos.'],
    [C, 'Do you have any clue what happened last night?'], ['', 'still kinda in one of those head daze things'], [JX, 'No, we had a part thats all i can remember'],
    [C, 'Well we did something because there\'s a traffic light in the living room, a stop sign in the backyard and one of those shelves we have at work for like the products in the front yard.'], [JX, 'Strange.'], [C, 'Makes you look like one of those hoarders'], [JX, 'Yeah you’re probably right']],
  clock0:[['', 'we sat in the kitchen, when we finally actually looked at the clock.']],
  clock:[[C, 'Wait why are we eating breakfast its 1:30 in the afternoon'], [JX, 'I don’t know'], [C, 'Good point'],
    ['', 'I still wonder how we got that shelf from the stop sign and the traffic light. It was one of those mundane mornings, good thing I learned that word in class as well.'], ['', 'We finished eating breakfast when Jax’s phone rang.']],
  phone:[['', 'Jax picked up the phone.'], [C, 'Who is it, Jax?'], [JX, 'It’s Milo and Zeke'], [C, 'Put them on speakerphone!'], [JX, 'Alright'], ['', 'Jax said, clicking the button on the wall phone'],
    ['Milo (phone)', 'Rise and shine little buddies'], [C, 'Shut the hell up Milo'], ['', 'flipping off the phone, wishing these things had cameras.'], ['Milo (phone)', 'Someone is a little angry'], [JX, 'He has been he\'s had a headache'], [C, 'FOR NO REASON I MIGHT ADD!!'],
    ['Zeke (phone)', 'No, for good reason.'], [JX, 'Well you better come over and explain'], ['Milo (phone)', 'Alright, we’ll head on our way'], [C, 'And bring some pain medicine!!'], ['', 'I needed that, my brain felt it was like throbbing.']],
  look0:[['', 'As me and Jax are waiting for them to arrive, look around the house to see what might have happened.']],
  mouse:[['', 'I noticed a dead mouse in the closet but I don\'t think that there is anything to do about us. I guess we had a party last night?']],
  yard:[['', 'I walked outside to the backyard and the sun felt like it was hot and really close to me and it made my headache worse.']],
  sign:[[C, 'Jax, where do you think this stop sign comes from and why is it upside down?'], [JX, 'I don’t remember anything you don’t remember'], [C, 'Alright then']],
  can:[['', 'I said walking around the backyard when I found a can. I picked it up. Coors Banquet. Now I know I had a bad night.']],
  knock:[['', 'I heard someone knock on the door so me and Jax headed to see if it was Milo and Zeke.']],
  door:[['', 'It definitely was, we opened the door to Milo and Zeke holding cameras.'], [JX, 'This isn’t good'], [MI, 'Oh no it isn’t'], [C, 'Do you have my pain medicine'], [MI, 'Zeke should have it'], [ZK, 'Here you go'],
    ['', 'Zeke said, handing me what maybe he thought was some sort of pain cream, it was VAGASIL.'], [C, 'GOD DAMN IT ZEKE I DON’T HAVE A VAGINA'], [ZK, 'Wait, why does that matter? I thought that was pain medicine?']],
  door2:[['', 'I threw the bottle at him and pulled him and Milo inside.'], [JX, 'Just tell us what happened.'], [MI, 'Alright so we are gonna explain what happened but we also have some footage so lets go to the living room'], [C, 'Fine with me']],
  recap:[['', 'We all sat down when Milo prepared his ‘statements’.'], [MI, 'So here\'s basically what happened']],
  fb7a:[[JX, 'This is gonna be THE party tonight'], [JX, 'All we need is to see if we have some Fruit Punch or maybe some like lemonade'], [MI, 'Lemonade is the bomb brother']],
  fb7b:[['', 'Jax opens his fridge in the basement. Jax opens his eyes like he\'s opened a chest full of loot.'], [MI, 'What is it'], [JX, 'It’s all the alcohol we could ever drink!'], [C, 'Awesome, best party ever!!'], [MI, 'We know how this is gonna go'],
    [JX, 'Don’t tell me your gonna abstain from this again Mr. Zeke'], [ZK, 'I will be abstanding whatever that means, still a good idea though'], [C, 'Fine, you’re just losing out then']],
  react7:[[C, 'So we found alcohol. What does that have to do with anything?'], [C, 'We only drink like twice a month'], ['', 'i added very confidently knowing we couldn’t have done anything bad.'], [MI, 'Well basically, you and Jax did everything.'], [MI, 'Basically the party started and you guys started out with good intentions']],
  fb8a:[[JX, 'Welcome in Emma, enjoy the party'], ['Emma', 'I will!'], ['', 'Jax then turns to us four as we stand by him greeting the guests.'], [ZK, 'How many guests do we have again other than us 4'], [JX, 'About 16'], [C, 'How do you swing that'], [JX, 'Got the word out quickly ya hear'], [C, 'Whatever ya here means']],
  fb8b:[['', 'Jax then turns and greets many more people'], [JX, 'Welcome in Jalen, Mac and Charise'], [JX, 'Enjoy the party'], ['Jalen', 'Thanks bro']],
  fb8c:[['', 'Jalen said fist bumping Jax as they walked in, their guests continued to come in until there were 24 people.']],
  fb8d:[[JX, 'Welcome to the party everyone, there are refreshments, anything from beer to wine to fruit punch if that\'s not your flow. We also have plenty of snacks and pizza on the way'], [C, 'Awesome!'], ['', 'the party had started and it was lit.']],
  react8:[[C, 'If the party was lit then how did we unlit it?'], [MI, 'You guys were fine for like the first 2 hours'], [MI, 'If you guys didn’t get crazy everybody would’ve stayed, they still thought it was fun just no hosts is kinda like lame.'], [JX, 'I see'], [C, 'Continue with what happened'],
    [MI, 'Basically around 10 PM or something like that you guys when rambunctious']],
  fb10a:[[C, 'Hey Jax'], [JX, 'Whatttt, whattt'], [C, 'I just realized, i have like work i have to go to, and i am gonna be lateeeee'], [JX, 'Letsss drive there thennn, can’t let you get fireddd'], [MI, 'Woah, you are not driving'], [JX, 'Why nottt'], [MI, 'I’ll drive, you guys are hammered'],
    [C, 'Fine, if you wanna be an ignoranus that\'s cool'], [MI, 'Just get in the car while i tell the guest, we’ll be back soon'], [JX, 'Uhhh'], [MI, 'Taking that as a yes']],
  fb10b:[['', 'after a period of time he walks back to the car but this time with a camera. He hands the camera to Zeke and drives us towards Schnucks.']],
  fb10c:[['', 'As we drive towards Schnucks we hit a stop light when Jax has an idea.'], [JX, 'I am gonna steal that stoplight and turn it green for happiness'], ['', 'jax says as he unbuckles his seatbelt and walks out the car'], [C, 'I LOVE that idea Jax, gimme gimme'], ['', 'I said, running out of the car.'],
    [MI, 'Stop it you guys!'], [MI, 'This is a bad idea!'], [JX, 'Then don’t be included dopey'], [MI, 'Hand me the camera'], ['', 'Milo and Zeke then get out of the car, however'], [ZK, 'This would be a good souvenir though'], [MI, 'Please don’t'], [ZK, 'Nope. My mind is already set on it'],
    ['', 'Zeke says running towards me and Jax trying to get the traffic light down.'], [MI, 'Damn it']],
  video0:[[MI, 'Alright and I have some footage. I can show you guys aswell'], [C, 'Oh god no'], [ZK, 'YES YES YES!!!'], [ZK, 'THIS WAS SO FUN!!'], [MI, 'Alright'], ['', 'Milo said pointing toward the TV']],
  tape1:[[MI, 'Are you guys enjoying your new traffic light?'], [JX, 'I LOVE IT'], ['', 'Jax says smiling as if he just got a million dollars'], [C, 'Why isn’t it yellow?? I WANT IT YELLOW!!'], [JX, 'WELL I WANT IT GREEN'], [ZK, 'Settle down and get in the car'], [ZK, 'We already got a traffic light we don’t need a drunken fight'],
    [MI, 'Most coherent thing you’ve said in the last year'], [ZK, 'Thank you Milo!'], ['', 'we all piled back into the car.']],
  store0:[['', 'We drove to Schnucks and then Zeke gets out of the car and reads the sign on the door.']],
  store:[[ZK, 'It says the store is clo-sed'], [MI, 'How did you get past the first grade'], [ZK, 'By passing duh'], [C, 'NO STORE!!'], ['', 'I groaned and yelled at the same time.'], [MI, 'Yes Chris, we are going home now'],
    [MI, 'Get back in the car and call the house and tell them the party ends in an hour, we need them out of here, I don\'t need more people to contain'], [ZK, 'Sir yes ma\'am'], [MI, 'Just do it,']],
  ret0:[['', 'We then drive to Jax\'s house while Zeke is calling them. When we get to Jax\'s house there\'s about 3 people left other than the original 4.']],
  ret:[[MI, 'Alright you two get some sleep, we are leaving'], [C, 'SO are we!'], [JX, 'Yes we are!'], ['', 'as we walked out the door, we headed towards the street when Jax said'], [JX, 'Lets take the sign, it would TOTALLY round out the collection'], [MI, 'Jesus Christ can this night just end']],
  ret2:[['', 'we all walked outside, Jax lived on a small intersection. They grabbed the sign.']],
  cut:[[C, 'We grabbed the sign?'], ['', 'I said wondering why that damn video cut out then'], [MI, 'I honestly don\'t remember lets fast forward']],
  tape2:[[JX, 'Everybodys gone but I still know how to stripppp'], [C, 'That\'s so gay'], [MI, 'Keep this on camera we need this'], [ZK, 'I am leaving i gotta go to bed man'], [MI, 'Alright see ya'], [ZK, 'Have fun!']],
  wrap:[[C, 'Please tell me that\'s done'], [MI, 'Yeah that\'s it'], [JX, 'Why didn\'t you drink with us though, usually you do'], [MI, 'Its because you and Jax have two different sides, each of you are either calm and fun or crazy and wanting to go to jail'], [C, 'That does sound about right'],
    [C, 'Why didn’t you want to drink though Zeke'], [ZK, 'I don’t need to be drunk to be awesome'], [C, 'True that'], [C, 'So what do you guys want to do today then'], ['Jax + Zeke', 'I don\'t know']],
  last:[[C, 'Can we get me some real pain medicine then?']],
};

// ---------- staging helpers ----------
const GUEST = { emma:{ shirt:'#e88ab0', pants:'#3a4a7a', hair:'#c9a15a', hairStyle:'pony', lips:'#c0505a', scale:.95 }, jalen:{ shirt:'#c8202a', pants:'#2a2a2a', hair:'#151515', skin:'#8a5a3a', hairStyle:'buzz', top:'jersey', print:'3', bottom:'baggy' },
  mac:{ shirt:'#e8e8e8', pants:'#5a5a4a', hair:'#8a5a2a', hairStyle:'shaggy', bottom:'cargo', wide:1.15 }, charise:{ shirt:'#7a3a9a', pants:'#2b3550', hair:'#1a1a1a', skin:'#a8704a', long:true, lips:'#a04060', scale:.94 } };
const rndLook = i => ({ shirt:['#3a7a6a', '#a8743a', '#5a6aa8', '#aa5544', '#557755', '#d8a020', '#8a5a9a', '#2a2a2a'][i % 8], pants:['#2b3550', '#3a3a3a', '#5a5a4a'][i % 3], hair:['#222', '#a87a4a', '#3a2414', '#c9a15a'][i % 4], long:i % 3 === 1, skin:['#efc29e', '#c48a5e', '#8a5a3a'][i % 3], hairStyle:['short', 'shaggy', 'buzz', 'pony'][i % 4] });
let fxEl = null, undo = [];
export const later = fn => { undo.push(fn); (G.cleanups = G.cleanups || []).push(fn); };
export function film(mode){ const cv = G.R.domElement; cv.style.filter = mode === 'fb' ? 'sepia(.3) saturate(.8) contrast(1.05)' : mode === 'tape' ? 'saturate(.6) contrast(1.2) brightness(1.08)' : '';
  if(!fxEl){ fxEl = document.createElement('div'); fxEl.style.cssText = 'position:fixed;inset:0;z-index:4;pointer-events:none;display:none;font-family:"VT323",monospace;color:#fff;font-size:34px;text-shadow:2px 2px 0 #000';
    fxEl.innerHTML = '<div style="position:absolute;inset:0;background:repeating-linear-gradient(rgba(0,0,0,.14) 0 2px,transparent 2px 4px)"></div><div style="position:absolute;left:0;top:0;bottom:0;width:calc((100vw - 133.33vh)/2);min-width:0;background:#000"></div><div style="position:absolute;right:0;top:0;bottom:0;width:calc((100vw - 133.33vh)/2);background:#000"></div>'
      + '<div style="position:absolute;left:calc(max(0px,(100vw - 133.33vh)/2) + 28px);top:15vh">PLAY ▶</div><div id="fxT" style="position:absolute;right:calc(max(0px,(100vw - 133.33vh)/2) + 28px);top:15vh">SP 0:00:00</div><div id="fxN" style="position:absolute;inset:0;background:#0a0a0c;display:none;align-items:center;justify-content:center;font-size:44px">- - - - -</div>'; document.body.appendChild(fxEl); }
  fxEl.style.display = mode === 'tape' ? 'block' : 'none'; fxEl.querySelector('#fxN').style.display = 'none'; if(mode) later(() => film(null)); }
const tapeAt = t => { if(fxEl) fxEl.querySelector('#fxT').textContent = 'SP ' + t; };
async function tapeGap(){ fxEl.querySelector('#fxN').style.display = 'flex'; await H.wait(1500); fxEl.querySelector('#fxN').style.display = 'none'; }
function camcorder(n){ const u = n.o.userData, el = u.aR && u.aR.userData.el; if(!el) return; const g = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(.11, .12, .22), E.mat('#2a2a2e')), l = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .08, 8), E.mat('#111')); l.rotation.x = Math.PI / 2; l.position.z = .14; g.add(b, l); g.position.set(-.04, -.5, .06); el.add(g); u.aR.rotation.x = -.5; }
const note = t => E.toast('NOTED: ' + t, 3200);
const J = () => G.jax;
function seatN(n, z){ n.stop(); n.p.set(115.35, 0, z); n.face = -Math.PI / 2; n.sync(); E.sit(n.o, true); }
// present-day living room: Chris, Jax and Zeke on the sofa, Milo standing by the TV with the camera
function present(){ film(null); E.setTime('day'); G.m05World(true); clock(day5, ''); const jax = mnpc(JX, LOOK.jax, 115.35, 39.74), zeke = mnpc(ZK, LOOK.zeke, 115.35, 41.26), milo = mnpc(MI, LOOK.milo, 112.3, 41.9, { face:Math.PI / 2 });
  seatN(jax, 39.74); seatN(zeke, 41.26); camcorder(milo); E.place(115.35, 40.5, -Math.PI / 2); P.model.rotation.y = -Math.PI / 2; E.sit(P.model, true); J().sofaCol.off = true; later(() => { J().sofaCol.off = false; }); E.cut(true); return { jax, zeke, milo }; }
const WIDE = [[118.4, 2.1, 43.2], [113.4, 1, 39.9]], ONMILO = [[115, 1.5, 40.2], [112.3, 1.4, 41.9]], ONSOFA = [[112.6, 1.4, 40.5], [115.35, 1.05, 40.5]];
async function night(big, small, mode = 'fb'){ await H.fade(true, 600); await H.card(big, small, 2200); E.setTime('night'); film(mode); E.sit(P.model, false); }
function guests(n, from = 0){ const spots = [[112.2, 42.6], [113.6, 38.4], [116.4, 42.9], [111.4, 39.4], [121, 38.6], [123.4, 39.2], [120.6, 42.8], [124, 42.6], [111.2, 41.6], [122.6, 43.2], [122.4, 38.2], [120.2, 40.2], [116.8, 38.2], [123.8, 37.9], [112.9, 43.4], [124.6, 41]];
  return spots.slice(from, from + n).map(([x, z], i) => mnpc('guest', rndLook(i + from), x, z, { face:(i * 2.4) % 6.28 })); }
export function drive(car, pts, speed, cam){ let i = 0, done = false; mtick(dt => { if(done) return; const p = car.position, [tx, tz] = pts[i], dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), st = speed * dt;
    if(d <= st){ p.x = tx; p.z = tz; if(++i >= pts.length) done = true; } else { p.x += dx / d * st; p.z += dz / d * st; const a = Math.atan2(dx, dz); let da = a - car.rotation.y; while(da > Math.PI) da -= 6.283; while(da < -Math.PI) da += 6.283; car.rotation.y += da * Math.min(1, dt * 4); }
    (car.userData.wheels || []).forEach(w => w.rotation.x += st / .36); });
  E.camTrack(() => { const p = car.position, a = car.rotation.y; return cam ? cam(p, a) : [[p.x - Math.sin(a) * 9, 4.2, p.z - Math.cos(a) * 9], [p.x + Math.sin(a) * 4, 1.2, p.z + Math.cos(a) * 4]]; }); return H.until(() => done); }
export function miloCar(x, z, ry){ const car = E.makeCar('#7a8088', { type:'sedan', spin:true, lights:true }); car.position.set(x, 0, z); car.rotation.y = ry; G.scene.add(car); later(() => G.scene.remove(car)); return car; }

export const M05 = { title:'Hair of the Dog', sub:day5, where:'Jax’s house, corner of Oakmont and Maple', needs:'M04', start:{ x:117.9, z:34.6 },
  setup(i){ undo.splice(0).forEach(f => f()); E.setTime('day'); E.setOutfit({}); clock(day5, ''); G.noTraffic = false; G.storeOpen = false; G.m05World(true); const j = J(); j.sofaCol.off = false; j.stash.visible = false; j.bfridgeObj.userData.door.rotation.y = 0;
    j.smorz.position.set(...(i >= 2 ? [122.5, .97, 40.8] : [125.45, 1.2, 39.2])); j.smorz.visible = i >= 2; j.bowl.visible = j.eggo.visible = i >= 2; j.streetSignal.visible = false; j.streetStop.visible = false; j.closed.visible = false; },
  stages:[
    // ---- M05_00_WAKE + M05_01_ODDITIES ----
    async () => { const j = J(); E.place(j.bedFloor.x, j.bedFloor.z, -Math.PI / 2); const jax = mnpc(JX, LOOK.jax, 113.4, 47.5); jax.manual = true; jax.o.position.set(112.35, .78, 47.5); jax.o.rotation.set(0, 0, -1.9);
      const body = E.makePerson(G.chrisLook); body.position.set(116.2, .14, 46.4); body.rotation.set(0, 0, Math.PI / 2); G.scene.add(body); later(() => G.scene.remove(body));
      E.cut(true); P.model.visible = false; await H.shot([116.6, .4, 44.9], [113.6, .5, 47.2], 0); await H.say(D.wake0.slice(0, 1)); G.scene.remove(body); P.model.visible = true; await H.shot([116.8, 1.5, 44.9], [113, .9, 47.4], 1200); await H.say(D.wake0.slice(1)); E.cut(false);
      const sp = P.speed; P.speed = sp * .6; let t = 0; const slow = () => { P.speed = sp; }; later(slow); mtick(dt => { if((t += dt) > 60) slow(); }); // hangover: slower for the first minute, no screen effects
      E.obj('Wake Jax up.'); await H.interact(113.5, 47.5, 'WAKE JAX', 2.4); E.cut(true); faceP({ x:112.4, z:47.5 }); await H.shot([115.2, 1.5, 45.3], [112.9, .8, 47.5], 600); await H.say(D.wake);
      jax.o.rotation.set(0, 0, 0); jax.manual = false; jax.p.set(113.7, 0, 47.2); jax.face = Math.PI / 2; jax.sync(); E.sfx('bang'); await H.say(D.wake2); G.flags.jax_awake = true; E.cut(false);
      E.obj('Follow Jax into the living room.'); jax.go([[115.6, 45.4], [115.6, 43], [114, 39.4]], 2.6); await H.reach(114.2, 40.6, 2.2); await H.until(() => !jax.path); face(jax, j.lightSpot);
      E.obj('Figure out what’s in the living room.'); await H.interact(j.lightSpot.x, j.lightSpot.z, 'EXAMINE THE TRAFFIC LIGHT', 2.3); E.cut(true); faceP({ x:112.1, z:38 }); await H.shot([115.4, 1.7, 41.4], [P.p.x, 1.5, P.p.z], 0); await H.shot([115.2, 1.6, 41.2], [112.1, 1, 38], 1400);
      await H.say(D.light); G.flags.saw_light = true; note('Traffic light — why is it inside?'); E.cut(false); },
    // ---- M05_02_BREAKFAST + M05_03_PHONE ----
    async () => { const j = J(); E.place(114.4, 40.4, Math.PI / 2); const jax = mnpc(JX, LOOK.jax, 114, 39.2, { face:Math.PI / 2 }); E.cut(false);
      E.obj('Get something to eat.'); await H.reach(121.6, 39.2, 2); jax.go([[120, 40.4], [121, 42.8]], 2.8); E.cut(true); await H.say(D.kitchen0); await two(P.p, jax, -1); await H.say(D.kitchen); E.cut(false);
      E.obj('Get something to eat: check the cabinet.'); await H.interact(j.cereal.x, j.cereal.z, 'OPEN THE CABINET', 2); E.cut(true); await H.shot([123.4, 1.7, 40.6], [125.4, 1.4, 39.2], 500); await H.say(D.smorz); j.smorz.visible = true; E.cut(false);
      jax.go([[124.2, 38.8]], 2.6); E.obj('Get something to eat: milk from the fridge.'); await H.interact(j.fridge.x, j.fridge.z, 'GRAB THE MILK', 2); E.sfx('ok'); jax.go([[122.9, 42.2]], 2.6);
      E.obj('Get something to eat: a bowl from the cabinet.'); await H.interact(j.bowlAt.x, j.bowlAt.z, 'GRAB A BOWL', 2); E.sfx('ok'); H.say(D.milk, { auto:true });
      E.obj('Sit down and eat.'); await H.interact(j.seat.x, j.seat.z, 'SIT DOWN AND EAT', 2); E.cut(true); j.smorz.position.set(122.5, .97, 40.8); j.bowl.visible = j.eggo.visible = true;
      E.place(j.seat.x, j.seat.z + .2, 0); P.model.rotation.y = 0; E.sit(P.model, true); jax.stop(); jax.p.set(j.jseat.x, 0, j.jseat.z - .2); jax.face = Math.PI; jax.sync(); E.sit(jax.o, true);
      await H.shot([119.8, 1.7, 41], [122.2, .95, 41], 700); await H.say(D.eat); await H.say(D.clock0); await H.shot([122, 1.6, 41.6], [j.clock[0], j.clock[1], j.clock[2]], 0); await H.shot([122, 2, 42.9], [j.clock[0], j.clock[1], j.clock[2]], 1800); clock(day5, '1:30 PM');
      await H.wait(900); await H.shot([119.8, 1.7, 41], [122.2, .95, 41], 500); await H.say(D.clock); G.flags.ate_breakfast = true;
      let rt = 0, ringing = true; mtick(dt => { if(ringing && (rt -= dt) <= 0){ rt = 1.6; E.sfx('ring'); } }); E.sit(jax.o, false); jax.go([[120.6, 41.6], [120, 38.4]], 3); E.sit(P.model, false); E.place(120.6, 39.6, -Math.PI / 2); E.cut(false);
      E.obj('Answer the ringing phone.'); await H.interact(j.phone.x, j.phone.z, 'PUT IT ON SPEAKERPHONE', 2.3); ringing = false; E.cut(true); face(jax, { x:119, z:38.2 }); await H.shot([122.2, 1.7, 39.6], [119.4, 1.35, 38.2], 600); await H.say(D.phone); G.flags.call_finished = true; E.cut(false); },
    // ---- M05_04_INVESTIGATE ----
    async () => { const j = J(); E.place(120.6, 39.4, Math.PI); const jax = mnpc(JX, LOOK.jax, 120, 38.4, { face:Math.PI / 2 }); jax.follow(P, 2.4, 5); E.cut(false); H.say(D.look0, { auto:true });
      const found = {}, n = () => Object.keys(found).length, upd = () => E.obj(`Look around for clues from last night. (${n()} / 4) — check the back yard.`); upd();
      const clue = (k, at, y, prompt, lines, text) => { const it = minter({ x:at.x, z:at.z, r:2.3, prompt, when:() => G.ctl && !found[k], use:async () => { found[k] = true; if(lines){ E.cut(true); if(k === 'sign'){ face(jax, P.p); await two(P.p, at, 1, 4); } await H.say(lines); E.cut(false); } note(text); E.sfx('ok'); upd(); } }); return it; };
      clue('mouse', j.mouse, 0, 'LOOK IN THE CLOSET', D.mouse, 'Dead mouse — in the closet.'); clue('sign', j.sign, 0, 'EXAMINE THE STOP SIGN', D.sign, 'Stop sign — upside down in the back yard.');
      clue('can', j.can, 0, 'PICK UP THE CAN', D.can, 'Coors Banquet can — back yard.'); clue('shelf', j.shelf, 0, 'LOOK AT THE SHELF', null, 'Store shelf — in the front yard.');
      let yard = false; mtick(() => { if(!yard && P.p.z > 50 && P.p.x > 108 && P.p.x < 128){ yard = true; H.say(D.yard, { auto:true }); } });
      await H.until(() => found.sign && found.can && G.ctl); G.flags.investigation_done = true; await H.wait(600); E.sfx('bang'); await H.wait(260); E.sfx('bang'); await H.wait(260); E.sfx('bang'); H.say(D.knock, { auto:true });
      const milo = mnpc(MI, LOOK.milo, 117.3, 35.2), zeke = mnpc(ZK, LOOK.zeke, 118.6, 35.3); camcorder(milo); camcorder(zeke); E.obj('Let Milo and Zeke inside.'); await H.interact(j.in.x, j.in.z, 'OPEN THE DOOR', 2.2); },
    // ---- M05_05_ARRIVAL + M05_06_RECAP_START + M05_F1_7PM + M05_07_REACT ----
    async () => { const j = J(); E.place(j.in.x, j.in.z + .3, Math.PI); const jax = mnpc(JX, LOOK.jax, 116.6, 38.9, { face:Math.PI }), milo = mnpc(MI, LOOK.milo, 117.3, 35.6), zeke = mnpc(ZK, LOOK.zeke, 118.6, 35.7); camcorder(milo); camcorder(zeke);
      E.cut(true); await H.shot([121.4, 2.1, 32.8], [117.9, 1.3, 36.9], 0); await H.say(D.door); E.sfx('bang'); await H.say(D.door2); G.flags.friends_inside = true; E.cut(false);
      milo.go([[117.9, 38.4], [113.2, 41.6], [112.3, 41.9]], 3.2); zeke.go([[117.9, 37.6], [116.6, 41.4]], 3.2); jax.go([[116.6, 39.8]], 3);
      E.obj('Sit down and hear Milo’s explanation.'); await H.interact(114.6, 40.5, 'SIT DOWN', 2.2); [jax, zeke, milo].forEach(n => n.remove()); const s = present(); await H.shot(...WIDE, 700); await H.say(D.recap.slice(0, 1)); await H.shot(...ONMILO, 500); await H.say(D.recap.slice(1)); G.flags.recap_open = true;
      // previous night, around 7 PM: the basement fridge
      await night('PREVIOUS NIGHT', 'AROUND 7 PM'); Object.values(s).forEach(n => n.remove()); clock('PREVIOUS NIGHT', '7 PM'); E.place(302.4, j.base.z + 1.2, Math.PI / 2);
      const bj = mnpc(JX, LOOK.jax, 303.6, j.base.z - .4, { face:Math.PI / 2 }), bm = mnpc(MI, LOOK.milo, 302.6, j.base.z - 1.4, { face:Math.PI / 2 }), bz = mnpc(ZK, LOOK.zeke, 301.6, j.base.z + .2, { face:Math.PI / 2 });
      E.cut(true); await H.shot([306.6, 2, j.base.z + 2.6], [303, 1.2, j.base.z - .4], 0); await H.fade(false, 500); await H.say(D.fb7a); E.cut(false); bj.go([[306.2, j.base.z - .7]], 2.6);
      E.obj('Previous night: Check the basement fridge.'); await H.interact(j.bfridge.x, j.bfridge.z, 'CHECK THE FRIDGE WITH JAX', 2.2); E.cut(true); face(bj, { x:308, z:j.base.z }); j.stash.visible = true; const dr = j.bfridgeObj.userData.door; let o = 0; mtick(dt => { o = Math.min(1, o + dt * 2); dr.rotation.y = -1.9 * o; });
      await H.shot([304.6, 1.6, j.base.z + 1.6], [307.3, 1.1, j.base.z], 800); await H.say(D.fb7b.slice(0, 3)); await H.shot([306.9, 1.7, j.base.z + 2.4], [303.4, 1.2, j.base.z - .4], 600); await H.say(D.fb7b.slice(3)); G.flags.fb_7_done = true;
      await H.fade(true, 600); [bj, bm, bz].forEach(n => n.remove()); present(); await H.shot(...ONSOFA, 0); await H.fade(false, 500); await H.say(D.react7.slice(0, 3)); await H.shot(...ONMILO, 400); await H.say(D.react7.slice(3)); G.flags.fb_8_unlocked = true; },
    // ---- M05_F2_8PM + M05_08_REACT ----
    async () => { const j = J(); await H.fade(true, 0); await H.card('PREVIOUS NIGHT', 'AROUND 8 PM', 2200); E.setTime('night'); film('fb'); clock('PREVIOUS NIGHT', '8 PM'); G.m05World(false); E.place(116.4, 39.6, Math.PI);
      const jax = mnpc(JX, LOOK.jax, 117.9, 38.5, { face:Math.PI }), zeke = mnpc(ZK, LOOK.zeke, 119, 39.4, { face:Math.PI }), milo = mnpc(MI, LOOK.milo, 115.2, 38.8, { face:Math.PI }); await H.fade(false, 500); E.cut(false);
      const arrive = (list, d) => list.map(([nm, lk], i) => { const g = mnpc(nm, lk, 117.9 + (i - (list.length - 1) / 2) * .9, 35.4 - (i % 2) * .7, { face:0 }); return g; });
      const walkIn = (gs, spots) => gs.forEach((g, i) => g.go([[117.9, 37.8], spots[i]], 2.6));
      E.obj('Previous night: Greet the party guests. (open the door)'); await H.interact(j.in.x, j.in.z, 'OPEN THE DOOR', 2.2); const g1 = arrive([['Emma', GUEST.emma]]); E.cut(true); await H.shot([121.4, 2.1, 32.8], [117.9, 1.3, 36.9], 500); await H.say(D.fb8a.slice(0, 2)); walkIn(g1, [[113.4, 42.4]]);
      face(jax, P.p); await H.say(D.fb8a.slice(2)); face(jax, { x:117.9, z:34 }); E.cut(false);
      E.obj('Previous night: Greet the party guests. (more at the door)'); await H.interact(j.in.x, j.in.z, 'OPEN THE DOOR', 2.2); const g2 = arrive([['Jalen', GUEST.jalen], ['Mac', GUEST.mac], ['Charise', GUEST.charise]]); E.cut(true); await H.shot([121.8, 2.2, 32.4], [117.9, 1.3, 36.6], 500);
      await H.say(D.fb8b); walkIn(g2, [[112.6, 39.2], [121.4, 39], [116.6, 42.8]]); await H.say(D.fb8c); E.cut(false);
      E.obj('Previous night: Greet the party guests. (everybody else)'); await H.interact(j.in.x, j.in.z, 'OPEN THE DOOR', 2.2); await H.fade(true, 400); guests(14); await H.fade(false, 500); E.toast('24 people. In Jax’s house.', 2600);
      jax.go([[116, 40.4]], 3); E.obj('Previous night: Join Jax for the announcement.'); await H.interact(116.6, 40.6, 'STAND WITH JAX', 2.4); E.cut(true); face(jax, { x:120, z:40.4 }); await H.shot([118.7, 2.6, 43.5], [115.7, 1.2, 40.2], 800); await H.say(D.fb8d); G.flags.fb_8_done = true;
      await H.fade(true, 600); G.npcs.filter(n => ['guest', 'Emma', 'Jalen', 'Mac', 'Charise', JX, ZK, MI].includes(n.name)).forEach(n => n.remove()); present(); await H.shot(...ONSOFA, 0); await H.fade(false, 500); await H.say(D.react8.slice(0, 1)); await H.shot(...ONMILO, 400); await H.say(D.react8.slice(1, 3));
      await H.shot(...WIDE, 500); await H.say(D.react8.slice(3)); G.flags.fb_10_unlocked = true; },
    // ---- M05_F3_10PM ----
    async () => { const j = J(); await H.fade(true, 0); await H.card('PREVIOUS NIGHT', 'AROUND 10 PM', 2200); E.setTime('night'); film('fb'); clock('PREVIOUS NIGHT', '10 PM'); G.noTraffic = true; j.streetSignal.visible = true; j.streetStop.visible = true; G.m05World(false); j.streetSignal.visible = true;
      E.place(114.4, 41.6, 0); const jax = mnpc(JX, LOOK.jax, 113.6, 39.4, { face:0 }), milo = mnpc(MI, LOOK.milo, 117.2, 40.8, { face:-Math.PI / 2 }), zeke = mnpc(ZK, LOOK.zeke, 118.4, 42.4, { face:-Math.PI / 2 }); guests(12, 2); const car = miloCar(118, 26.4, -Math.PI / 2);
      await H.fade(false, 500); E.cut(false); E.obj('Previous night: Talk to Jax.'); await H.interact(() => jax.p.x, () => jax.p.z, 'TALK TO JAX', 2.4); E.cut(true); face(jax, P.p); faceP(jax); await two(P.p, jax); await H.say(D.fb10a.slice(0, 4)); face(milo, P.p); await H.shot([112.4, 1.7, 41.8], [117.2, 1.4, 40.8], 500); await H.say(D.fb10a.slice(4)); E.cut(false);
      jax.go([[117.9, 38.4], [117.9, 34], [119.4, 28.4]], 3); zeke.go([[117.9, 38.8], [117.9, 34.4], [116.8, 28.4]], 3.2);
      E.obj('Previous night: Go with Milo to the car.'); await H.interact(118, 28.2, 'GET IN THE BACK SEAT', 2.6); E.cut(true); await H.fade(true, 400); [jax, zeke, milo].forEach(n => n.remove()); G.npcs.filter(n => n.name === 'guest').forEach(n => n.remove()); P.model.visible = false; E.place(118, 30, 0);
      H.fade(false, 500); H.say(D.fb10b, { auto:true }); await drive(car, [[104, 26.4], [101.6, 30], [101.6, 236]], 17); P.model.visible = false; await H.say(D.fb10c.slice(0, 1));
      // at the light: a short staged scene, then a cut. Nobody plays through taking it.
      await H.fade(true, 350); E.place(104.4, 245.4, 2.4); P.model.visible = true; const j2 = mnpc(JX, LOOK.jax, 103.2, 247.6, { face:.8 }), m2 = mnpc(MI, LOOK.milo, 103.6, 239.6, { face:0 }), z2 = mnpc(ZK, LOOK.zeke, 100.4, 239.8, { face:0 }); camcorder(z2);
      await H.shot([108.6, 2.4, 240.4], [103.4, 3.2, 247.6], 0); await H.fade(false, 400); await H.say(D.fb10c.slice(1, 8)); z2.o.userData.aR.rotation.x = 0; camcorder(m2); await H.say(D.fb10c.slice(8, 13)); z2.go([[102.4, 246.4]], 6); await H.say(D.fb10c.slice(13));
      await H.fade(true, 500); j.streetSignal.visible = false; E.sfx('bang'); await H.wait(700); G.flags.fb_10_done = true; },
    // ---- M05_09_VIDEO + M05_F4_STORE ----
    async () => { const j = J(); await H.fade(true, 0); const s = present(); await H.shot(...ONMILO, 0); await H.fade(false, 500); await H.say(D.video0.slice(0, 2)); await H.shot(...ONSOFA, 400); await H.say(D.video0.slice(2, 4)); await H.shot([114.6, 1.5, 42.6], [110.9, 1, 40.5], 700); await H.say(D.video0.slice(4));
      E.obj('Watch Milo’s footage.'); await H.fade(true, 500); Object.values(s).forEach(n => n.remove()); E.setTime('night'); film('tape'); tapeAt('0:12:41'); clock('', ''); G.noTraffic = true; G.m05World(false); j.streetSignal.visible = false; E.sit(P.model, false);
      const car = miloCar(101.6, 238, 0); E.place(105.4, 247.7, -2.4); P.model.visible = true; const tj = mnpc(JX, LOOK.jax, 102.5, 247.5, { face:2.4 }), tz = mnpc(ZK, LOOK.zeke, 101.4, 245.2, { face:.9 });
      const head = j.streetSignal.clone(); head.visible = true; head.position.set(103.9, .68, 246.9); head.rotation.set(0, -1.9, 0); G.scene.add(head); later(() => G.scene.remove(head));
      let sway = 0; E.camTrack(dt => { sway += dt; return [[105.6 + Math.sin(sway * 2.1) * .06, 1.55 + Math.sin(sway * 3.3) * .05, 242.6], [103.9, 1 + Math.sin(sway * 1.7) * .04, 246.9]]; }); await H.fade(false, 400); await H.say(D.tape1); G.flags.video_played = true;
      // Schnucks is closed (Zeke reads the sign: the player walks Zeke to the door)
      await H.fade(true, 500); G.scene.remove(head); [tj, tz].forEach(n => n.remove()); film('fb'); clock('PREVIOUS NIGHT', 'LATER'); car.position.set(105, 0, 316); car.rotation.y = Math.PI / 2;
      j.closed.visible = true; later(() => { j.closed.visible = false; }); E.setOutfit({ ...LOOK.zeke, tips:undefined }); E.place(295, 193, Math.PI); const cc = mnpc(C, G.chrisLook, 292.8, 193.4, { face:Math.PI}), cj = mnpc(JX, LOOK.jax, 291.4, 192.8, { face:Math.PI}), cm = mnpc(MI, LOOK.milo, 297, 193.6, { face:Math.PI}); camcorder(cm);
      E.cut(true); await H.shot([302, 3, 200], [295, 2, 182], 0); await H.fade(false, 500); await H.say(D.store0); E.cut(false); E.obj('Previous night: Check the store entrance.'); await H.interact(295, 183.4, 'READ THE SIGN', 2.4);
      E.cut(true); faceP({ x:295, z:181 }); await H.shot([296.8, 1.7, 185.6], [295, 1.6, 182], 600); await H.say(D.store.slice(0, 1)); [cc, cj, cm].forEach(n => face(n, P.p)); await H.shot([290.4, 1.9, 189.4], [295, 1.3, 192], 600); await H.say(D.store.slice(1)); G.flags.store_done = true; await H.fade(true, 500); E.setOutfit({}); },
    // ---- M05_F5_RETURN + M05_10_WRAP ----
    async () => { const j = J(); await H.fade(true, 0); E.setTime('night'); film('fb'); clock('PREVIOUS NIGHT', 'LATER THAT NIGHT'); G.noTraffic = true; G.m05World(false); j.streetStop.visible = true; const car = miloCar(118, 26.4, -Math.PI / 2);
      E.place(118.6, 29, 0); const jax = mnpc(JX, LOOK.jax, 117, 29.4, { face:0 }), milo = mnpc(MI, LOOK.milo, 119.8, 29.6, { face:0 }), zeke = mnpc(ZK, LOOK.zeke, 116, 28.6, { face:0 }); camcorder(milo); guests(3, 5);
      E.cut(true); await H.shot([123, 2.6, 27], [118, 1.4, 34], 0); await H.fade(false, 500); await H.say(D.ret0); E.cut(false); [jax, milo, zeke].forEach((n, i) => n.follow(P, 2 + i * .8, 5));
      E.obj('Previous night: Return to Jax’s place.'); await H.reach(j.in.x, j.in.z + .6, 1.8); E.cut(true); [jax, milo, zeke].forEach(n => n.stop()); milo.p.set(117, 0, 40.4); milo.sync(); face(milo, P.p); jax.p.set(118.8, 0, 39.6); jax.sync(); await H.shot([120.6, 1.8, 41.6], [117.6, 1.4, 39.6], 500); await H.say(D.ret.slice(0, 3));
      await H.fade(true, 400); E.place(109.4, 33, -1.2); jax.p.set(108.6, 0, 32.2); jax.face = -1.2; jax.sync(); milo.p.set(113, 0, 35.6); milo.sync(); face(milo, j.corner); zeke.p.set(113.9, 0, 36.6); zeke.sync(); face(zeke, j.corner);
      film('tape'); tapeAt('1:04:17'); let sway = 0; E.camTrack(dt => { sway += dt; return [[112.2 + Math.sin(sway * 2) * .06, 1.55 + Math.sin(sway * 3.1) * .05, 34.6], [107.6, 1.5, 31.4]]; }); await H.fade(false, 400); await H.say(D.ret.slice(3)); await H.say(D.ret2);
      await tapeGap(); G.flags.night_recap_done = true; // the footage cuts here, exactly like the book. What happened in the gap is not shown.
      [jax, milo, zeke].forEach(n => n.remove()); G.npcs.filter(n => n.name === 'guest').forEach(n => n.remove()); G.scene.remove(car); const s = present(); await H.shot(...ONSOFA, 0); await H.say(D.cut.slice(0, 2)); await H.shot(...ONMILO, 400); await H.say(D.cut.slice(2));
      // fast forward: last piece of tape
      await H.fade(true, 400); Object.values(s).forEach(n => n.remove()); E.setTime('night'); film('tape'); tapeAt('2:31:55'); G.m05World(true); E.sit(P.model, false); E.place(115.35, 40.5, -Math.PI / 2); E.sit(P.model, true);
      const dj = mnpc(JX, LOOK.jax, 113, 40.4, { face:Math.PI / 2 }), dz = mnpc(ZK, LOOK.zeke, 116.8, 38.6, { face:-2 }); let spin = 0; mtick(dt => { spin += dt; dj.face = Math.PI / 2 + Math.sin(spin * 5) * .9; dj.sync(); });
      sway = 0; E.camTrack(dt => { sway += dt; return [[117.6 + Math.sin(sway * 2) * .05, 1.5 + Math.sin(sway * 3) * .05, 42.6], [113.4, 1.2, 40.2]]; }); await H.fade(false, 400); await H.say(D.tape2.slice(0, 4)); dz.go([[117.9, 38.2], [117.9, 34]], 3); await H.say(D.tape2.slice(4));
      // wrap
      await H.fade(true, 500); [dj, dz].forEach(n => n.remove()); present(); await H.shot(...WIDE, 0); await H.fade(false, 600); await H.say(D.wrap.slice(0, 2)); await H.shot(...ONMILO, 400); await H.say(D.wrap.slice(2, 4)); await H.shot(...ONSOFA, 400); await H.say(D.wrap.slice(4, 8)); await H.shot(...WIDE, 600); await H.say(D.wrap.slice(8));
      await H.shot([113.6, 1.25, 40.5], [115.35, 1.2, 40.5], 900); await H.say(D.last); await H.wait(1400); await H.fade(true, 700);
      E.sit(P.model, false); E.place(114.2, 40.5, -Math.PI / 2); await H.banner('MISSION PASSED', 'HAIR OF THE DOG'); Object.assign(G.flags, { M05_complete:true, M06_available_when_installed:true }); E.cut(false); await H.fade(false, 700); } ],
  done(){ G.roamTime = 'after'; G.noTraffic = false; G.storeOpen = true; undo.splice(0).forEach(f => f()); } };
