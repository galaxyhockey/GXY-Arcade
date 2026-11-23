// Back in the 2000s: The Game — Draft #2 missions M06 "The Project" and M07 "Forgetting the Damn Project".
// BOOK: "Week 3 - October 1st 2003" (PDF pp. 31–37) and "Week 3 - October 3rd 2003" (PDF pp. 38–43).
// All book text lives in the D6 / D7 tables (book order, spelling as printed). '' = Chris's narration. Speech tags ("i said") are dropped.
// GAME ORIGINAL text is limited to objectives, prompts, the computer screens of the project puzzle, and the lines marked GO below.
// Adaptation notes (flagged for the author, not silent fixes):
//  - No weekday is shown on screen; chapters are dated the way the book dates them.
//  - M06 lunch: "movie night" and "King of the Hill" can be raised in either order (the Bible asks for a topic choice). Every line is still spoken once.
//  - M07 follows the BOOK's order: park walk -> Friday -> yesterday's messages -> bowling at 8:30 PM -> the project. (The Bible lists bowling before Friday.)
//  - M07: the book prints “Fair.” i said, right after Chris's own line. It reads as Zeke's answer, so Zeke says it here.
//  - Sam's screen name is shown as CaptainSammi06 (first spelling in the book) everywhere.
//  - The project puzzle never decides anything: whatever Chris builds, Sam has finished hers and hers is turned in.
import * as E from './engine.js';
import { H, mnpc, mtick, minter, clock, SV, park, fillCorral, startPushing, grabFrom, deliver, sitSofa, phoneUp, TV_SHOT } from './game.js';
import { LOOK, two, face, faceP } from './missions.js';
import { later, film } from './missions3.js';
import { pc, pcOff, pcClock, friends, logHTML, chat } from './pc.js';
import { playDuel, playBowling, playBag } from './minigames2.js';
const { THREE, G, P } = E; const C = 'Chris', ZK = 'Zeke', MT = 'Matt', JX = 'Jax', SM = 'Sam', SP = 'Mrs. Sparks', MOM = 'Mom', DAD = 'Dad', MIA = 'Mia', JC = 'Jacob', AN = 'Andrew';
const day6 = 'OCTOBER 1ST 2003', day7 = 'OCTOBER 3RD 2003', ME = 'chrisscape88', SAM = 'CaptainSammi06';

// ---------- Draft #2 cast ----------
export const CAST2 = { sam:{ shirt:'#c9a0e8', pants:'#3f5f9a', shoes:'#f4f4f0', hair:'#8a3f1e', hairStyle:'long', fringe:true, lash:true, fem:true, glasses:'round', lips:'#d0506e', top:'tee', bottom:'flare', scale:.93 },
  emily:{ shirt:'#d86a8a', pants:'#2b3550', hair:'#c9a15a', long:true, lips:'#b5505a', scale:.95 }, abby:{ shirt:'#e8c84a', pants:'#3a4a7a', hair:'#3a2414', hairStyle:'pigtails', lips:'#b5505a', scale:.94 },
  debra:{ shirt:'#7aa8a0', pants:'#5a5a6a', hair:'#e4e4e4', hairStyle:'bun', glasses:true, lips:'#a05060', scale:.9 }, innocent:{ shirt:'#5a7a4a', pants:'#4a4a4a', hair:'#3a2a1a', beard:'#3a2a1a', wide:1.1 },
  thief:{ shirt:'#1a1a1a', pants:'#2a2a2a', hair:'#111', top:'hoodie', hat:'beanie', hatColor:'#111' }, attendant:{ shirt:'#1c3d6e', pants:'#1c2a44', hair:'#3a2414', hairStyle:'bun', lips:'#b5505a', collar:'#f4f4f0', top:'polo' },
  'flight attendant':{ shirt:'#1c3d6e', pants:'#1c2a44', hair:'#c9a15a', hairStyle:'bun', lips:'#b5505a', top:'polo', collar:'#f4f4f0' }, 'taxi driver':{ shirt:'#c8a84a', pants:'#3a3a3a', hair:'#222', beard:'#222', skin:'#b07a52', hat:'cap', cap:'#333' },
  'police officer':{ shirt:'#1c2a4a', pants:'#141c30', hair:'#3a2a1a', hat:'cap', cap:'#141c30', wide:1.12, scale:1.04 }, representative:{ shirt:'#a8282e', pants:'#2a2a2a', hair:'#5a3a1c', top:'polo', thin:true },
  jacob87:{ shirt:'#f4f4f4', pants:'#3a5a8a', hair:'#6a4a2a', hairStyle:'shaggy', top:'tee', scale:.97 }, eric87:{ shirt:'#cc2a2a', pants:'#3a4a6a', hair:'#3a2414', hairStyle:'shaggy', top:'flannel', scale:.98 },
  emma87:{ shirt:'#e86ab0', pants:'#3a5a8a', hair:'#c9a15a', long:true, lips:'#c0505a', scale:.94 }, lilly87:{ shirt:'#5ac8c0', pants:'#2b3550', hair:'#e0c070', hairStyle:'pony', lips:'#c0505a', scale:.94 } };
export const PE = { shirt:'#9aa0a6', pants:'#6e1a26', top:'tee', bottom:'jeans' };
export const reg = () => { const W = G.CAST || {}; Object.assign(G.LOOK, CAST2, { 'mrs. sparks':W.sparks, customer:CAST2.innocent }); };
// ---------- shared staging helpers (also used by missions5 / missions6) ----------
export const sitN = (n, x, z, f) => { n.stop(); n.p.set(x, n.p.y, z); n.face = f; n.sync(); E.sit(n.o, true); return n; };
export const sitP = (x, z, f, y) => { E.place(x, z, f, y); P.model.rotation.y = f; E.sit(P.model, true); };
export const standP = (x, z, f, y) => { E.sit(P.model, false); E.place(x, z, f, y); P.model.rotation.y = f; };
export const tvOn = () => mtick(() => G.tvScreen.material.color.setHSL((G.t * .2) % 1, .4, .45));
export const armUp = (n, a) => { const u = n.o.userData; if(u.aR) u.aR.rotation.x = a; };
export const pcShot = async (ms = 500) => { const [x, y, z] = G.monitorPos; await H.shot([x + .2, y + .3, z + 1.4], [x, y, z], ms); };
export async function cartRun(idx, n, prompt = 'GRAB CARTS'){ const c = G.corrals[idx]; fillCorral(c, n); startPushing(); G.blips.push({ x:c.x, z:c.z, c:'#ffd23f' });
  E.obj(`Grab the carts from corral C${String(c.n).padStart(2, '0')}.`); await H.interact(c.x, c.z - 3.6, prompt, 3); grabFrom(c, 12);
  E.obj('Push them inside to the cart return.'); await H.interact(G.cartBay.x, G.cartBay.z, 'RETURN CARTS', 3.5); deliver(); E.sfx('ok'); G.blips = []; }
export async function carTrip(from, to, o1, o2){ park(from[0], from[1], from[2]); G.blips.push({ x:from[0], z:from[1], c:'#4fc3ff' }); E.obj(o1); await H.until(() => G.driving); G.noExit = true; G.blips = []; E.obj(o2);
  await H.reach(to[0], to[1], to[2] || 4, { color:0x4fc3ff }); E.toast('Stop the car to park (S / SPACE)', 2500); await H.until(() => !G.driving || Math.abs(G.driving.speed) < 1.2); G.noExit = false; if(G.driving) E.exitCar(); }
// the Computer Applications room, seated. Jax seat 4, Abby 5, Chris's station 10, Sam 11, Emily 12 (the back)
export function klass(o = {}){ const cl = G.classroom, s = cl.seats, st = i => E.sit(mnpc('student', { shirt:['#8a5a9a', '#3a7a6a', '#a8743a', '#5a6aa8', '#aa5544', '#557755'][i % 6], hair:['#222', '#a87a4a', '#3a2414'][i % 3], long:i % 2 === 1 }, s[i].x, s[i].z, { face:-Math.PI / 2 }).o, true);
  [0, 2, 7, 9, 14, 15].forEach(st); const seated = (nm, lk, i) => { const n = mnpc(nm, lk, s[i].x, s[i].z, { face:-Math.PI / 2 }); E.sit(n.o, true); return n; };
  return { cl, sp:mnpc(SP, G.CAST.sparks, cl.sparks.x, cl.sparks.z, { face:Math.PI / 2 }), jax:seated(JX, LOOK.jax, 4), abby:seated('Abby', CAST2.abby, 5), sam:seated(SM, CAST2.sam, 11), emily:seated('Emily', CAST2.emily, 12) }; }

// =================== M06 — THE PROJECT (BOOK: October 1st 2003) ===================
const D6 = {
  lunch0:[['', `The bell finally did what it needed to do earlier. Ring. Mrs. Ruiz’s class has become the most boring class I have ever taken in my entire life. I then walked to lunch and met up the gang. I sat down at our table.`]],
  lunch:[[C, `What’s up gang`], [ZK, `Yo`], [MT, `Howdy`], [C, `Wait a second… where is Jax`], [MT, `He got in trouble, hes in lunch detention`], [ZK, `I went to go visit him earlier, he’s fine`]],
  movie:[[C, `Should we have a movie night eventually?`], ['', `eating my pizza that looked like cardboard.`], [MT, `I don’t know maybe`], [ZK, `I would be down, as long as its good`], ['', `then there was a long pause.`]],
  koth:[[C, `Any of you guys seen that rerun of King of the Hill last night on Adult Swim`], [ZK, `I did, how Bill ever can find love and not me is beyond me.`], [MT, `Sad but alright`], [MT, `It was a good episode, i heard the new season drops early in November, should we do a watch party?`], [ZK, `That’s fine with me`],
    [C, `Let’s just not do too many watch parties, they are fun but too many may be boring`], [C, `We already have one for later this month for South Park`], [MT, `True`]],
  al:[[MT, `Any of you guys hear, any of that Weird Al music`], ['', `but in between the pause Zeke said`], [ZK, `I absolutely love that guy!! He’s got SUCH great music`], [MT, `Oh i was gonna say his music sucks`], [ZK, `Oh.`], [C, `Yeah he is kinda Weird Zeke`]],
  bell1:[['', `Then the bell rang. I walked with Zeke to my PE class down the hall.`]],
  hall1:[[C, `Man zeke, you are one dumbass`], [ZK, `Don’t you call me that i am smart`], ['', `Zeke says, as he holds up his Test and points to the grade`], [C, `Zeke that says F`], [ZK, `No it doesn’t!`], ['', `he then turns and looks at the paper like an idiot`], [ZK, `Oh.`]],
  hall2:[[C, `Anyways`], ['', `i continue walking down the hall to the Gym for PE.`], [C, `What’s the plan for tonight, we gonna hang out.`], [ZK, `Probably not dude, Jax told me you guys have a project in 7th period`], [C, `AGAIN. GOD that teacher sucks ASS!`], [ZK, `Good thing i am not smart enough for computers`], [C, `You just said you were smart`], [ZK, `Nuh uh`]],
  hall3:[[C, `Alright you go change`], ['', `i said walking inside. I changed then headed out to play 1 on 1 basketball against Zeke.`]],
  gym1:[[ZK, `You are so going down, old dude`], [C, `I am not even old`]],
  gym2:[['', `i juked him out like crazy and made the nastiest lay-up ever.`], [ZK, `I see you, I see you`], [ZK, `but you are not gonna get this one`]],
  gym3:[['', `i did indeed get it and block it, and then scored a cermonious layup.`], [ZK, `Fine, i rage quit anyways`]],
  gym4:[['', `Unfortunately for me and fortunately for him, the bell rang. I changed in the locker room and walked down to Computer Applications class, i really hope me and Jax are partners again.`]],
  class0:[['', `I arrived and seen Jax in the his seat. With about 2 mins before the bell rings for the start of 7th period, i talked to Jax.`]],
  jax:[[C, `So how was detention`], [JX, `How do you think`], [C, `Probably pretty boring`], [JX, `Well Zeke was supposed to be there, was he at lunch?`], [C, `Yup`], [JX, `Sound’s about right`], [C, `He told me you told him we have a project today`], [JX, `Yeah, i heard from someone in the 1st Hour Computer Applications class.`],
    [C, `Good to know! Are you ready to be partners!`], [JX, `Actually i heard partners are random this time`], [C, `What.`], [JX, `Yeah i think they might be random`], [C, `Damn it.`]],
  jax2:[['', `i said as the bell rang. I went to my seat as Mrs. Sparks started class.`]],
  sparks:[[SP, `Good afternoon class!`], [SP, `Today, we are going to be doing a project on creating business packages for a business!`], ['Emily', `Boo`], ['', `emily yelled from the back`], [SP, `Stop that emily`],
    [SP, `You have 3 days, it is due Friday and you have to use 3 Microsoft Office 2003 programs on the project. I will now assign partners randomly this time to avoid you guys goofing off.`], ['', `Shit, I thought. I don’t wanna get someone i don’t know that would be lame aswell.`],
    [SP, `Alright, here are our partners`], [SP, `Emily will be with Jason. Tia will be with Morgan. Alex will be with Jace. Abby will be with Jax.`], ['', `Damn it, i thought. I am gonna be with somebody i don’t know and i can’t cheat off of.`],
    [SP, `...and lastly Chris will be with Sam`], ['', `Is this good or bad? She’s a loser but shes also a nerd. It’s not Jax though. So this is a loss in my book.`], [SP, `Alright get together in your partner groups.`], ['', `I walked over to Sam and it was very awkward.`]],
  sam1:[[C, `Hi`], [SM, `Hey.`], ['', `we kinda just looked like two cats seeing each other for the first time, but really awkwardly.`], [C, `So what should we start on first.`], [SM, `I think we should do Microsoft Publisher 2003`], [C, `What even is that`],
    [SM, `It’s a publishing program from Microsoft that focuses on page layout and graphic design rather than heavy text composition`], [C, `I understood like three of those words weirdo`]],
  sam2:[['', `Sam raises her hand`], [SP, `Yes Sam.`], [SM, `Chris is being mean, i don’t wanna work with him`], [C, `Well then don’t be a loser`], [SP, `HEY, be nice you two, this isn’t kindergarten`], [C, `Whatever`]],
  sam3:[[SM, `Alright, i am into second chances. I know we may of not of gotten of on the right foot but lets just be nice`], [C, `Fine with me. My name is Chris, i like Runescape, sports and doing stupid things.`], [SM, `I love runescape!`], [C, `Wait really`], ['', `maybe shes not as much of a loser as i thought.`],
    [C, `Hey, i am sorry for being an asshole. I am not a very big people person.`], [SM, `I am the same way its fine`], ['', `there are now 10 mins left in class.`]],
  sam4:[[C, `Alright so what should we make?`], [SM, `What if our fictional business is a cyber cafe set in the 2020s!`], ['', `Sam said enthusiastically`], [C, `Not my favorite idea but i have nothing so lets go for it!`], ['', `8 minutes wined down and we continue to plan.`]],
  sam5:[[SM, `How about we meet-up after school for the project?`], [C, `I can’t tonight because of work but i can tomorrow after 6`], [SM, `Alright, here.`], ['', `Sam said, handing me a piece of paper that says, CaptainSammi06.`], [SM, `Text me tonight about the project and we can work online`], [C, `Sounds good`],
    ['', `i said as the bell rang. Done for the day. I placed the paper in my pocket and got in my car.`]],
  drive:[['', `I tuned the radio to my favorite station and drove home.`]],
  mom0:[['', `I walked inside the house to see my mom watching tv, gay tv that is it was Oprah or something.`]],
  mom:[[MOM, `Welcome home chrissy!!`], [C, `I told you to stop calling me that`], [MOM, `I will never`], ['', `she said, i walked upstairs and went to my computer.`]],
  aim0:[['', `I added Sam onto AOL Messenger, it said she was offline. I then opened up a convo with Jax since he was online.`]],
  chat:[[ME, `Yo`], ['jaxattack', `Heyo`], [ME, `How is your project going with Abby`], ['jaxattack', `We are really clicking, we only have a couple more things left to fix`], [ME, `Awesome`], ['jaxattack', `You and Sam seem to be getting along… really well… super well…`],
    [ME, `keep it in your pants Jax, therse websites for that stuff.`], ['jaxattack', `Don’t hate the messenger telling you the truth.`], ['jaxattack', `Well, i have to go to work at Best Buy. See ya.`], [ME, `bye`]],
  work0:[['', `He has a point, so i got offline, changed into my work shirt and drove to work. 6 PM to 10 PM what an amazing closing weekday shift.`]],
  work1:[['', `I drove to work and arrived to the pleasant sight of Mia pushing carts. She pushes her carts over to the front of the outside of the store and runs over.`]],
  mia:[[MIA, `Chris!! Chris!!`], [MIA, `We need you really bad, come clock in and bag!`], [C, `Uh. Alright.`]],
  punch:[['', `i walked inside and hit the timeclock and punched in. I was then approached by Jacob.`]],
  jacob:[[JC, `Hey go bag, we need baggers its busy`], [C, `Mia already told me, idiot`], [JC, `Watch your words`], ['', `Jacob said walking away. I walked over and started bagging. Talking to my good friend Andrew while he was checking.`]],
  andrew:[[C, `So what would happen if someone came in and bought EVERYTHING at 10 PM and you were by yourself`], [AN, `First off, i’d kill the person shopping, second of all i’d kill you for abandoning me`], [C, `Oh please, you couldn’t even kill a fly`], [AN, `Don’t test me`]],
  andrew2:[[C, `Fine.`], ['', `i said finishing the order. The line was backed up but i had to go outside for carts.`]],
  out:[['', `After 4 hours my shift finally ended. I hung up my safety vest and punched out.`]],
  home:[['', `I drove home listening to the radio and walked inside the house. I was greeted by the smell of lasagna and the TV.`]],
  dad:[[DAD, `Welcome home Chris! Mom’s upstairs, shes not feeling 100%. Lasagna from dinner is in the microwave, your welcome to join me and watch hockey.`], [C, `I’ll join you after i check my computer real quick`], [DAD, `Seats open when your ready`]],
  pc0:[['', `i walked upstairs and opened my computer. Awesome, Sam accepted my request. She even sent a text.`]],
  samMsg:`Wanna add me on Runescape?`, reply:`For sure but i’ll have to play tomorrow after we are done, heres my username: Chrisscape88`,
  end1:[['', `I then went downstairs and grabbed dinner and watched hockey with my dad. Easy blues win cause the ducks suck actual ass.`]], end2:[['', `I walked upstairs and fell into bed. What a night.`]] };
const BUDS = [['sk8rzeke03', 'away'], ['jaxattack', 'online'], ['mattdaman15', 'away'], ['m1lo_the_brain', 'away']];
const TB = { x:-173.5, z:143 }; // the gang's lunch table

export const M06 = { title:'The Project', sub:day6, where:'front entrance of Belleville West High School', needs:'M05', start:{ x:-126, z:150 },
  setup(i){ reg(); film(null); pcOff(); E.setTime(i < 3 ? 'day' : i === 3 ? 'after' : i === 4 ? 'dusk' : 'night'); E.setOutfit(i === 1 ? PE : i === 4 ? { shirt:'#f0f0f0', top:'polo' } : {}); clock(day6, ''); G.noTraffic = false; G.storeOpen = true; },
  stages:[
    // ---- 06.01 lunch + the walk to PE ----
    async () => { E.place(-146, 150, -Math.PI / 2); clock(day6, 'LUNCH'); const matt = sitN(mnpc(MT, LOOK.matt, 0, 0), TB.x + 1.3, TB.z, -Math.PI / 2), zeke = sitN(mnpc(ZK, LOOK.zeke, 0, 0), TB.x, TB.z + 1.3, Math.PI);
      [[-182, 136], [-165, 157], [-156.5, 136], [-148, 164], [-182, 164]].forEach(([x, z], i) => [0, 1, 2].forEach(k => { const a = k * Math.PI / 2 + i; sitN(mnpc('student', { shirt:['#8a5a9a', '#3a7a6a', '#a8743a', '#5a6aa8', '#aa5544'][(i + k) % 5], pants:'#334', hair:['#222', '#a87a4a', '#3a2414'][k], long:(i + k) % 2 === 1 }, 0, 0), x + Math.cos(a) * 1.3, z + Math.sin(a) * 1.3, Math.atan2(-Math.cos(a), -Math.sin(a))); }));
      E.cut(true); await H.shot([-150, 3.4, 156], [TB.x, 1, TB.z], 0); await H.say(D6.lunch0); E.cut(false);
      E.obj('FIND YOUR FRIENDS AT LUNCH.'); await H.interact(TB.x - 1.9, TB.z, 'SIT DOWN', 2.4); E.cut(true); sitP(TB.x - 1.3, TB.z, Math.PI / 2); await H.shot([TB.x - 1.2, 2, TB.z - 3.4], [TB.x + .2, 1, TB.z + .2], 600); await H.say(D6.lunch);
      await H.shot([TB.x, 1.5, TB.z - 2.6], [TB.x, .9, TB.z - 1.3], 500); await H.wait(900); await H.shot([TB.x - 1.2, 2, TB.z - 3.4], [TB.x + .2, 1, TB.z + .2], 500); // Jax's empty seat
      const topics = [['Bring up a movie night', D6.movie], ['Bring up King of the Hill', D6.koth]]; while(topics.length){ const k = topics.length > 1 ? await H.choose(topics.map(t => t[0])) : 0; await H.say(topics.splice(k, 1)[0][1]); }
      await H.say(D6.al); E.sfx('bell'); await H.say(D6.bell1); standP(TB.x - 2.2, TB.z, 0); E.sit(zeke.o, false); zeke.p.set(TB.x - .6, 0, TB.z + 2.4); zeke.follow(P, 2, 5); E.cut(false);
      E.obj('HEAD TO PE.'); await H.reach(-170, 131, 2.6); await H.fade(true, 400); [matt].forEach(n => n.remove()); G.npcs.filter(n => n.name === 'student').forEach(n => n.remove());
      E.place(-200, 117, -Math.PI / 2); zeke.stop(); zeke.at(-201.2, 118.3, -Math.PI / 2); E.cut(true); face(zeke, P.p); faceP(zeke); await two(P.p, zeke, 1, 3.4, 0); await H.fade(false, 400);
      await H.say(D6.hall1.slice(0, 2)); armUp(zeke, -1.5); await H.say(D6.hall1.slice(2, 5)); armUp(zeke, -.9); await H.say(D6.hall1.slice(5)); armUp(zeke, 0); E.cut(false); zeke.follow(P, 1.8, 5, [1.2, 0]);
      E.obj('GET TO PE. (walk down the hall with Zeke)'); H.say(D6.hall2, { auto:true }); await H.reach(-256, 117, 2.6); E.cut(true); zeke.stop(); face(zeke, P.p); await two(P.p, zeke, -1, 3.4); await H.say(D6.hall3); await H.fade(true, 500); },
    // ---- 06.02 the gym ----
    async () => { const gy = G.gym.center; E.place(gy.x, gy.z + 3, Math.PI); clock(day6, 'PE'); const zeke = mnpc(ZK, { ...LOOK.zeke, ...PE, hat:undefined }, gy.x, gy.z - 1.2, { face:0 });
      E.cut(true); await H.shot([gy.x + 5, 2.2, gy.z + 5], [gy.x, 1.3, gy.z], 0); await H.say(D6.gym1); E.obj('PLAY A QUICK GAME WITH ZEKE.');
      await playDuel({ title:'PE: 1 ON 1 VS ZEKE', foe:'Zeke', script:['o'], indoor:true }); E.cut(true); await H.say(D6.gym2);
      await playDuel({ title:'PE: 1 ON 1 VS ZEKE', foe:'Zeke', script:['d', 'o'], indoor:true }); E.cut(true); await H.say(D6.gym3); E.sfx('bell'); E.obj('CHANGE AND HEAD TO COMPUTER APPLICATIONS.'); await H.say(D6.gym4); await H.fade(true, 500); },
    // ---- 06.03 partners ----
    async () => { const k = klass(), cl = k.cl; E.place(-190, 113, -Math.PI / 2); clock(day6, '7TH PERIOD'); E.cut(true); await H.shot(cl.cam[0], cl.cam[1], 0); await H.say(D6.class0); E.cut(false);
      E.obj('TALK TO JAX.'); await H.interact(() => k.jax.p.x + 1.4, () => k.jax.p.z, 'TALK TO JAX', 2.4); E.cut(true); faceP(k.jax); await two(P.p, k.jax, 1, 3.4); await H.say(D6.jax); E.sfx('bell'); await H.say(D6.jax2); E.cut(false);
      E.obj('GO TO YOUR SEAT.'); await H.interact(cl.chris.x + 1, cl.chris.z, 'SIT DOWN', 2); E.cut(true); sitP(cl.chris.x, cl.chris.z, -Math.PI / 2); await H.shot([cl.sparks.x + 3.4, 2.8, cl.sparks.z + .3], [cl.sparks.x, 1.5, cl.sparks.z], 700); await H.say(D6.sparks.slice(0, 2));
      await H.shot([cl.sparks.x + 4, 2, cl.sparks.z - 1], [k.emily.p.x, 1.1, k.emily.p.z], 500); await H.say(D6.sparks.slice(2, 4)); await H.shot([cl.sparks.x + 3.4, 2.8, cl.sparks.z + .3], [cl.sparks.x, 1.5, cl.sparks.z], 500); await H.say(D6.sparks.slice(4, 9));
      await H.shot([cl.chris.x - 2.2, 1.5, cl.chris.z - .6], [cl.chris.x, 1.1, cl.chris.z], 600); await H.say(D6.sparks.slice(9, 10)); await H.shot([cl.sparks.x + 3.4, 2.8, cl.sparks.z + .3], [cl.sparks.x, 1.5, cl.sparks.z], 400); await H.say(D6.sparks.slice(10, 11));
      await H.shot([k.sam.p.x - 2.4, 1.5, k.sam.p.z - 1.4], [k.sam.p.x, 1.1, k.sam.p.z], 700); await H.say(D6.sparks.slice(11, 12)); await H.shot(cl.cam[0], cl.cam[1], 500); await H.say(D6.sparks.slice(12)); standP(cl.chris.x + 1, cl.chris.z, -Math.PI / 2); E.cut(false);
      const SX = () => k.sam.p.x + 1.3, SZ = () => k.sam.p.z + .1, shotSam = ms => H.shot([k.sam.p.x - 1.6, 1.6, k.sam.p.z - 2.6], [k.sam.p.x + .5, 1.1, k.sam.p.z], ms);
      E.obj('MEET YOUR PARTNER.'); await H.interact(SX, SZ, 'TALK TO SAM', 2.2); E.cut(true); E.place(k.sam.p.x + 1.2, k.sam.p.z + .1, -Math.PI / 2); k.sam.face = Math.PI / 2; k.sam.sync(); await shotSam(600); await H.say(D6.sam1);
      armUp(k.sam, -2.9); await H.say(D6.sam2.slice(0, 1)); await H.shot([cl.sparks.x + 3.4, 2.8, cl.sparks.z + .3], [cl.sparks.x, 1.5, cl.sparks.z], 500); await H.say(D6.sam2.slice(1, 2)); armUp(k.sam, 0); await shotSam(500); await H.say(D6.sam2.slice(2, 4));
      await H.shot([cl.sparks.x + 3.4, 2.8, cl.sparks.z + .3], [cl.sparks.x, 1.5, cl.sparks.z], 400); await H.say(D6.sam2.slice(4, 5)); await shotSam(400); await H.say(D6.sam2.slice(5)); await H.say(D6.sam3); G.flags.SAM_RECONCILED = true; E.cut(false);
      E.obj('PLAN THE CYBER CAFÉ.'); await H.interact(SX, SZ, 'PLAN THE PROJECT WITH SAM', 2.2); E.cut(true); await shotSam(400); await H.say(D6.sam4); E.cut(false);
      E.obj('GET SAM’S SCREEN NAME.'); await H.interact(SX, SZ, 'TAKE THE PAPER', 2.2); E.cut(true); await shotSam(400); await H.say(D6.sam5.slice(0, 4)); E.toast('A piece of paper: <b>CaptainSammi06</b>', 3600); await H.say(D6.sam5.slice(4, 6)); E.sfx('bell'); await H.say(D6.sam5.slice(6)); G.flags.SAM_SCREEN_NAME = true; await H.fade(true, 500); },
    // ---- 06.04 home, the messenger window ----
    async () => { E.place(-130.5, 186.5, -Math.PI / 2); clock(day6, 'AFTER SCHOOL'); E.cut(false); H.say(D6.drive, { auto:true }); await carTrip([-134.5, 186.5, Math.PI / 2], [-17, 10], 'GET IN YOUR CAR. (E)', 'DRIVE HOME — park in your driveway.');
      const mom = sitN(mnpc(MOM, LOOK.mom, 0, 0), -3.7, -3.9, 0); tvOn(); E.obj('GO INSIDE.'); await H.reach(0, 2.4, 1.7); E.cut(true); await H.shot([-1.5, 2.4, 1.4], [-4.2, 1.1, -3.8], 600); await H.say(D6.mom0); await H.say(D6.mom); E.cut(false);
      E.obj('ADD SAM ON AOL. (your computer is upstairs)'); await H.interact(G.desk.x, G.desk.z, 'USE THE COMPUTER', 2, 3.2); E.cut(true); await pcShot(); pc(friends(BUDS), { clock:'3:42 PM' });
      await H.choose(['Add a Friend: type CaptainSammi06']); await H.say([['', `I should probably learn where the 'send' button is before I ruin another friendship.`]]); // GO (Bible, optional inner thought)
      pc(friends(BUDS, SAM)); await H.choose(['Click ADD']); E.sfx('ok'); pc(friends([...BUDS, [SAM, 'offline']])); G.flags.SAM_ADDED = true; await H.say(D6.aim0);
      E.obj('CHECK YOUR MESSAGES.'); await H.choose(['Open a conversation with jaxattack']); await chat(D6.chat, ME); await H.say(D6.work0); pcOff(); await H.fade(true, 600); },
    // ---- 06.05 6–10 PM at Schnucks ----
    async () => { park(180, 352, Math.PI); E.place(177.5, 349, -Math.PI / 2); clock(day6, '6:00 PM'); const mia = mnpc(MIA, G.CAST.mia, 128, 326); E.cut(true); await H.shot([172, 3, 344], [150, 1.4, 334], 0); mia.go([[160, 340], [175.4, 348.6]], 7); await H.say(D6.work1); await H.until(() => !mia.path);
      face(mia, P.p); faceP(mia); await two(P.p, mia, 1, 3.6); await H.say(D6.mia); E.cut(false); mia.go([[160, 340], [128, 326]], 5);
      E.obj('CLOCK IN.'); await H.interact(G.timeClock.x, G.timeClock.z, 'CLOCK IN', 2); E.sfx('ok'); E.toast('CLOCKED IN · 6:00 PM', 2000); E.setOutfit({ shirt:'#f0f0f0', top:'polo', vest:'#c8102e' }); await H.say(D6.punch);
      const jacob = mnpc(JC, G.CAST.jacob, 160, 361); E.cut(true); await H.go(jacob, [[P.p.x - 1.8, P.p.z - .4]], 4); face(jacob, P.p); faceP(jacob); await two(P.p, jacob, -1, 3.4); await H.say(D6.jacob.slice(0, 3)); jacob.go([[158, 368], [160, 380]], 3); await H.say(D6.jacob.slice(3)); E.cut(false);
      const L = G.lanes[2], andrew = mnpc(AN, G.CAST.andrew, L.x + .2, L.z - 1, { face:-Math.PI / 2 }); andrew.blip = '#4fc3ff'; E.obj('BAG THE WAITING ORDERS. (Andrew’s checklane)'); await H.interact(() => andrew.p.x, () => andrew.p.z, 'START BAGGING', 2.8);
      await playBag({ title:'BAGGING · LANE 3', orders:[['Bread', 'Canned soup', 'Cereal', 'Chips']] }); clock(day6, '7:10 PM'); E.cut(true); face(andrew, P.p); faceP(andrew); await two(P.p, andrew, 1, 3.4); await H.say(D6.andrew);
      await playBag({ title:'BAGGING · LANE 3', orders:[['Eggs', 'Milk', 'Apples', 'Paper towels'], ['2-liter soda', 'Bread', 'Lunch meat', 'Chips', 'Dog food']] }); // a badly packed bag changes nothing: the book has no line about it
      E.cut(true); clock(day6, '8:05 PM'); await H.say(D6.andrew2); E.cut(false); E.setTime('night'); E.obj('GRAB SOME CARTS.'); await cartRun(2, 6); clock(day6, '10:00 PM');
      E.cut(true); await H.fade(true, 500); await H.card('4 HOURS LATER', '10:00 PM', 1800); E.place(166, 363.5, 0); await H.fade(false, 500); await H.say(D6.out); E.cut(false);
      E.obj('CLOCK OUT. (hang up your vest first)'); await H.interact(G.vests.x, G.vests.z, 'HANG UP YOUR VEST', 2); E.setOutfit({ shirt:'#f0f0f0', top:'polo' }); await H.interact(G.timeClock.x, G.timeClock.z, 'CLOCK OUT', 2); E.sfx('ok'); E.toast('CLOCKED OUT · 10:00 PM', 2000); await H.fade(true, 600); },
    // ---- 06.06 dinner, hockey, Sam accepts ----
    async () => { park(-17, 10, 0); E.place(0, 2.2, Math.PI); clock(day6, '10:20 PM'); const dad = sitN(mnpc(DAD, LOOK.dad, 0, 0), -5.3, -3.9, 0); tvOn(); E.cut(true); await H.shot([-1.2, 2.4, 1.8], [-5, 1.1, -3.8], 0); await H.say(D6.home); await H.say(D6.dad); E.cut(false);
      E.obj('CHECK YOUR COMPUTER.'); await H.interact(G.desk.x, G.desk.z, 'USE THE COMPUTER', 2, 3.2); E.cut(true); await pcShot(); const list = friends([...BUDS.map(b => [b[0], 'away']), [SAM, 'online']]); pc(list, { clock:'10:24 PM' }); await H.say(D6.pc0);
      pc(logHTML([[SAM, D6.samMsg]], ME)); E.tone(880, 0, .08, 'sine', .04); await H.wait(900); await chat([[ME, D6.reply]], ME, { before:[[SAM, D6.samMsg]] }); pcOff(); E.cut(false);
      E.obj('JOIN DAD FOR DINNER. (the lasagna is in the microwave)'); await H.interact(G.micro.x, G.micro.z, 'GRAB THE LASAGNA', 2); E.tone(440, 0, 1.2, 'sine', .03); await H.wait(1300); E.sfx('ok');
      await H.interact(G.sofa.x, G.sofa.z, 'SIT DOWN AND WATCH HOCKEY', 2.2); E.cut(true); sitSofa(true); await H.shot(...TV_SHOT, 700); await H.say(D6.end1); sitSofa(false); E.cut(false);
      E.obj('GO TO BED.'); await H.interact(G.bed.x, G.bed.z, 'GO TO BED', 2.2, 3.2); E.cut(true); await H.fade(true, 700); await H.say(D6.end2);
      await H.banner('MISSION PASSED', 'THE PROJECT'); Object.assign(G.flags, { M06_DONE:true, SAM_FRIENDSHIP_STARTED:true, PROJECT_DUE:true }); E.place(G.bedSpawn.x, G.bedSpawn.z, Math.PI, 3.2); E.cut(false); await H.fade(false, 700);
      E.toast('SIDE MISSION AVAILABLE: MIDNIGHT RESEARCH<br>(blue marker at your computer, until you start the next mission)', 5200); } ],
  done(){ G.roamTime = 'night'; } };

// =================== M07 — FORGETTING THE DAMN PROJECT (BOOK: October 3rd 2003, with October 2nd flashbacks) ===================
const D7 = {
  open:[['', `Man, yesterday was so fun. Sam is suprising really cool and also kickass at Runescape. Man i just can’t remember what we were supposed to do last night.`]],
  park0:[['', `Man, is she gonna arrive yet. Standing at the park at sunset is weird alone. As i waited i swung on the swings and then i saw her.`]],
  park:[[C, `Hey!`], [SM, `Hello!`], [C, `Alrighty lets walk to my house to start the project.`], [SM, `Perfect`], ['', `we started walking towards my house as i tried to spark som conversation.`]],
  walk1:[[C, `So how did you enjoy class today`], [SM, `It was fine, i hate my Spanish class, my teacher is a total d-bag`], [SM, `But i enjoyed class with you today`], ['', `and then my mind actually did something, it turned. She said she enjoyed class because of me. That’s weird.`], [C, `Yeah`],
    [SM, `Let’s not talk school, we gotta do our project when we get to your house anyways`], [SM, `I wanna hear more about you.`], [C, `About… me??`]],
  walk2:[[SM, `Well, yeah, do your friends not pick your brain about things`], ['', `and my brain started turning back on for the first time in months. Nobodys ever asked about me. I don’t know what to say honestly.`], [C, `Uhhh`],
    [C, `Well, i’ve loved sports since i was young, I’ve been a Rams fan since they were in LA. I love the Blues they are awesome. As you know i love Runescape.`], [SM, `What level are you, if you don’t mind me asking`], [C, `Level 15`], [SM, `Ha! I’m level 35`], ['', `a bit hurting of my eego whatever that means.`]],
  walk3:[[C, `Haha. Anyways, i have two brothers, Malcolm the older one and Josh the younger one. I got a job at Schnucks Swansea. I love dogs and cats alike and all animals honestly.`], [SM, `So two questions, whats your favorite animal and do you own any pets?`], [C, `Yeah i have 3 dogs and i gotta be real with you, i love pandas`],
    [SM, `NO WAY`], [SM, `I love pandas, i also love polar bears, the cold weather is awesome!`], [C, `Man, i don’t ever have friends that like stuff that i like, or that aren’t total dumbasses`], [SM, `I am only friends with people who are nerds like me haha`], [C, `Nah your not a nerd, nerds are losers, youre not a loser`], [SM, `Well thats nice of you`]],
  door0:[['', `we arrived at my house and as i was about to open the door, Sam stopped me from opening it.`]],
  door:[[SM, `What if we just ditched the project tonight, we can do it tomorrow before school.`], [C, `Oooo risky for you haha`], [C, `Since my car is here lets drive to the bowling alley, its been forever since i played`], [SM, `Ooooh that sounds super fun`]],
  fri:[['', `Oh fuck. The project and its first period English. I gotta ditch school so i can get this project done. So i snuck out of class and drove home.`]], fri2:[['', `I hopped on the computer and opened AOL Messenger first to look at yesterdays messages.`]],
  log:[[null, `October 2nd, 2003 —-`], [SAM, `Last night was fun, we should go to the bowling alley again sometime.`], ['Chrisscape88', `Sounds good with me, i still can’t believe you got 5 strikes in a row. Who knew a nerd could bowl right.`], [SAM, `Lol`], [SAM, `I have to head to bed, Goodnight`], ['Chrisscape88', `cya`]],
  what:[['', `Man what was i supposed to make again…`]],
  bowl1:[[C, `Man you are good at bowling, i mean 3 strikes in a row is crazy`], [SM, `You’re not too bad yourself`], [C, `So what is this project gonna use and be about, i know were ditching but you never know.`], [SM, `Oh yeah, we would use Publisher to make a brochure for our cyber cafe then make a spreadsheet in Excel…`], [C, `Whats Excel`],
    [SM, `Its where you can make graphs and use different data points`], [C, `Alright i understood most of that`], ['', `i said as sam laughs`], [SM, `It’s fine, then we are gonna make a Powerpoint to pitch our business`], [C, `Sounds good to me!`], [SM, `Now watch this strike`], ['', `sam said right before she bowl’d her 4th strike in a row.`]],
  bowl2:[[C, `DAMN GIRL, thats crazy`], [SM, `I told you, nerds can bowl, we are smart for a reason`]],
  proj0:[['', `Alright so i need to make a Publisher or something. Shit. I give up, i am so gonna fail this class. I don’t wanna make Sam mad at me she seems like the first person i know that actually seems cool and wants to pick my brain about stuff as she says.`],
    ['', `Alright, game plan. I am not really techy smart like Sam so i need to figure this out. I am gonna use the internet, maybe theres a tutorial on there.`]],
  proj1:[['', `I failed many times. I felt like i was gonna let my friend down, my biggest fear. I’ve had it since i got embarrsed failing Milo on something or a promise i think.`]],
  proj2:[['', `Eventually after many, many hours of working, i got it on the flash drive Mrs. Sparks gave me and Jax from the last project.`]],
  pe0:[['', `I snuck back into school somehow and it just in time for PE, PE more like Perfect! Oh that was really bad. I walked up to Zeke and started a chat as we walked around the track.`]],
  pe1:[[C, `What’s up dude`], [ZK, `Where have you been, you missed lunch and everything.`], [C, `I was umm…. At work`], [ZK, `Fair.`], [ZK, `You just wanna chat`], [C, `Alright`]],
  pe2:[[C, `Any good video games you know of?`], [ZK, `Not right now, most of the ones i play are really stabby and vio-lent`], [C, `Violent couldn’t possible of been such a big word where you have to split it into two sections`], [ZK, `What can i say i am not smart`]],
  pe3:[[ZK, `Hey, where were you at Thursday we were supposed to hangout along with Jax`], [C, `I was working on the project in 7th period`], [ZK, `Yeah did your partner suck as much as you thought`], [C, `Well thats a little mean, they are fine`]],
  pe4:[['', `and then the bell rang. I walked to 7th period, slightly nervous because i kinda can’t afford to fail this project. I arrive early something Jax points out to me`]],
  c1:[[JX, `Way to show up early buddy! Good job!`], [C, `Whatever`], ['', `i said back, i then walk over to my station next to Sam.`]],
  c2:[[C, `Hello!`], [SM, `Fun night right`], [C, `So fun`], [SM, `Did you finish the project`], [C, `I did, it took me ditching 2nd thru 5th period and not eating lunch but i did it`], [SM, `Oh. Well i finished it aswell.`], ['', `huh, did she just say she finished it aswell. I just wasted my time.`],
    [C, `Yours is probably better than mine`], [SM, `Maybe, we’ll use mine if thats okay with you`], [C, `Go for it`], ['', `man thats hours down the drain.`]],
  c3:[['', `We then turn in our USB drives, well, sams USB drive.`]],
  c4:[['', `We work on our assignments and before the end of the school day. Sam turns to me and says`], [SM, `See you on Runescape tonight?`], [C, `Absoluetly`], ['', `no work tonight and runescape with my new friend. Awesome. I hear the bell ring and then drive home.`]],
  home:[['', `I arrive home and head straight to the fridge and then the couch. This will be a fun afternoon. Until.`]],
  ring:[['', `I pick up the phone, no caller id.`]],
  call:[['Caller (phone)', `Hello is this Chris?`], [C, `Yeah who is this`], ['Jacob (phone)', `This is Jacob from work`], [C, `Oh god, what do you need`], ['Jacob (phone)', `I need you to come in and close, Mia called off and yeah. Could you come in an hour`], [C, `Absolutely not`], ['Jacob (phone)', `Why not, we are counting on you`],
    [C, `I want to play runscape with Sam tonight`], ['Jacob (phone)', `It’s okay if your gay Chris we support you but we really do need you`], [C, `The answer is no but a confused no because i am really really confused now`]],
  end:[['', `Man Jacobs a loser. He needs to go back to college beating up people drunk and drinking Coors Banquets.`]] };

// The rushed project (GAME ORIGINAL screens). Wrong picks only cost time on the clock; it cannot be failed and it does not change the ending.
async function office(){ const notes = !!G.flags.RESEARCH_NOTES_COLLECTED; let t = 8 * 60 + 25, wrong = 0, said = false; const tick = m => { t = Math.min(12 * 60 + 35, t + m); pcClock(`${(t / 60 | 0) > 12 ? (t / 60 | 0) - 12 : t / 60 | 0}:${String(t % 60).padStart(2, '0')} ${t < 720 ? 'AM' : 'PM'}`); };
  const ask = async (html, title, opts, right, hint) => { for(;;){ pc(html, { title, task:'WINDOWS XP | ' + title }); tick(0); const list = [...opts, 'Search the internet for a tutorial', ...(notes ? ['Open CAFENOTES.TXT'] : [])], k = await H.choose(list);
      if(k === right){ E.sfx('ok'); tick(25); return; } if(k === opts.length){ tick(20); E.toast('TUTORIAL: ' + hint, 4200); continue; }
      if(k === opts.length + 1){ E.toast('ENCARTA NOTES FOUND<br>' + hint, 4200); if(!said){ said = true; await H.say([[C, `At least I know what a café is now`]]); } continue; } // GO (Bible line)
      wrong++; tick(35); E.sfx('miss'); E.toast('That is not it. Try again.', 2200); if(wrong === 1) await H.say(D7.proj1); } };
  await ask('<h3>New Publication</h3><p>What kind of publication is this?</p>', 'Microsoft Publisher 2003', ['Greeting card', 'Brochure (3 panels)', 'Paper airplane'], 1, 'A business hands out a BROCHURE.');
  await ask('<h3>Brochure — front panel</h3><div class="bro"><div><b>?</b></div><div>Coffee<br>Internet<br>Games</div><div>Open late</div></div><p>Pick the headline:</p>', 'Microsoft Publisher 2003', ['LOST DOG', 'GARAGE SALE', 'CYBER CAFE 2020'], 2, 'The headline is the name of the business.');
  if(!wrong) await H.say(D7.proj1);
  const sheet = (a, b, c) => `<h3>Book1.xls</h3><table><tr><td class="h">Item</td><td class="h">Value</td></tr><tr><td>Coffee, per cup</td><td>${a}</td></tr><tr><td>Internet, per hour</td><td>${b}</td></tr><tr><td>Customers per day</td><td>${c}</td></tr><tr><td class="h">Money per day</td><td class="h">${a !== '?' && b !== '?' && c !== '?' ? '$330.00' : '?'}</td></tr></table>`;
  await ask(sheet('?', '?', '?') + '<p>Coffee, per cup:</p>', 'Microsoft Excel 2003', ['$150.00', '$1.50', '-$3.00'], 1, 'A cup of coffee costs about a dollar fifty.');
  await ask(sheet('$1.50', '?', '?') + '<p>Internet, per hour:</p>', 'Microsoft Excel 2003', ['$4.00', '$4,000.00', 'Free forever'], 0, 'A few dollars an hour. A business has to charge something.');
  await ask(sheet('$1.50', '$4.00', '?') + '<p>Customers per day:</p>', 'Microsoft Excel 2003', ['0', '6,000,000', '60'], 2, 'A small shop sees a few dozen people a day.');
  const deck = ['Cyber Cafe 2020', 'What we sell', 'Prices', 'Thank you'], done = []; while(done.length < 4){ const rest = deck.filter(d => !done.includes(d)).sort((a, b) => a.length - b.length), want = deck[done.length];
    await ask(`<h3>Presentation1.ppt</h3>${done.map((d, i) => `<span class="slide"><b>${i + 1}</b><br>${d}</span>`).join('')}<span class="slide">?</span><p>Slide ${done.length + 1} of 4 — which slide comes next?</p>`, 'Microsoft PowerPoint 2003', rest, rest.indexOf(want), 'Title first, then what you sell, then prices. Say thank you last.'); done.push(want); }
  tick(999); pc(sheet('$1.50', '$4.00', '60') + deck.map((d, i) => `<span class="slide"><b>${i + 1}</b><br>${d}</span>`).join(''), { title:'My Documents', task:'WINDOWS XP | Removable Disk (E:)' }); await H.choose(['Save everything to the flash drive']); E.sfx('ok'); E.toast('Saved to Removable Disk (E:)', 2600); }

export const M07 = { title:'Forgetting the Damn Project', sub:day7, where:'front entrance of Belleville West High School', needs:'M06', start:{ x:-126, z:153 },
  setup(i){ reg(); film(null); pcOff(); E.setTime(i === 4 ? 'after' : 'day'); E.setOutfit(i === 3 ? PE : {}); clock(day7, ''); G.noTraffic = false; G.storeOpen = true; },
  stages:[
    // ---- 07.01 what did we forget? + 07.02 park + 07.03 the doorstep (October 2nd, 6 PM) ----
    async () => { E.place(-230, 117, Math.PI / 2); clock(day7, '1ST PERIOD'); E.cut(true); await H.shot([-227.4, 1.75, 117.4], [-230, 1.6, 117], 0); await H.say(D7.open); E.obj('REMEMBER LAST NIGHT.');
      await H.fade(true, 600); await H.card('YESTERDAY (10/2)', '6 PM', 2200); E.setTime('dusk'); film('fb'); clock('OCTOBER 2ND 2003', '6:00 PM'); E.place(-94.2, 70, Math.PI / 2); await H.shot([-89.6, 2, 66.6], [-94.2, 1.3, 70], 0); await H.fade(false, 500); await H.say(D7.park0); E.cut(false);
      let swung = false, t0 = 0; minter({ x:-95, z:70, r:2.2, prompt:'SWING ON THE SWINGS', when:() => G.ctl && !swung, use:async () => { swung = true; E.cut(true); let a = 0; const stop = mtick(dt => { a += dt; P.model.position.y = P.p.y + .35 + Math.abs(Math.sin(a * 2.4)) * .35; P.model.rotation.x = Math.sin(a * 2.4) * .35; }); await H.shot([-90.5, 1.8, 73], [-95, 1.4, 70], 500); await H.wait(3200); stop(); P.model.rotation.x = 0; E.cut(false); } });
      E.obj('MEET SAM. (wait by the swings)'); mtick(dt => { t0 += dt; }); await H.until(() => (swung || t0 > 9) && G.ctl); const sam = mnpc(SM, CAST2.sam, -70, 57, { speed:3.4 }); sam.blip = '#4fc3ff'; sam.follow(P, 2.2, 3.6); await H.until(() => Math.hypot(sam.p.x - P.p.x, sam.p.z - P.p.z) < 3.2 && G.ctl);
      E.cut(true); sam.stop(); face(sam, P.p); faceP(sam); await two(P.p, sam, 1, 3.6); await H.say(D7.park); await H.say(D7.walk1); E.cut(false); sam.follow(P, 1.7, 4.4, [1.2, 0]);
      const leg = async (x, z, lines) => { await H.reach(x, z, 3.2); E.cut(true); sam.stop(); face(sam, P.p); faceP(sam); await two(P.p, sam, 1, 3.6); await H.say(lines); E.cut(false); sam.follow(P, 1.7, 4.4, [1.2, 0]); };
      E.obj('WALK HOME TOGETHER.'); await leg(-58, 33, D7.walk2); await leg(-24, 30, D7.walk3); await H.reach(0, 7.4, 2); E.cut(true); sam.stop(); sam.at(1.2, 7.2); face(sam, P.p); faceP(sam); await H.say(D7.door0); await two(P.p, sam, -1, 3.4); await H.say(D7.door); E.obj('GO BOWLING WITH SAM.'); G.flags.DITCHED_PROJECT = true; await H.fade(true, 600); },
    // ---- 07.05 (opening) Friday: yesterday's messages + 07.04 bowling (October 2nd, 8:30 PM) ----
    async () => { E.place(-126, 148, Math.PI / 2); clock(day7, '1ST PERIOD'); E.cut(true); await H.shot([-112, 5, 142], [-140, 5, 150], 0); await H.say(D7.fri); await H.fade(true, 500); E.place(-4.8, -10.3, Math.PI, 3.2); await pcShot(0); pc(logHTML(D7.log, 'Chrisscape88'), { clock:'8:20 AM' }); await H.fade(false, 500); await H.say(D7.fri2); await H.choose(['Read yesterday’s messages']); await H.say(D7.what); pcOff();
      await H.fade(true, 600); await H.card('YESTERDAY (10/2)', '8:30 PM', 2200); const B = G.T.bowl; E.setTime('indoor'); film('fb'); clock('OCTOBER 2ND 2003', '8:30 PM'); E.place(B.chris.x, B.chris.z, Math.PI / 2); const sam = mnpc(SM, CAST2.sam, B.sam.x, B.sam.z, { face:-Math.PI / 2 });
      await H.shot(...B.wide, 0); await H.fade(false, 500); E.obj('PLAY A FEW FRAMES.'); await H.wait(700); const r = await playBowling({ title:'BOWLING WITH SAM', frames:3 }); G.flags.bowl_pins = r.chris; E.cut(true); await H.shot(...B.cam, 500); E.obj('ASK SAM ABOUT THE PROJECT.'); await H.say(D7.bowl1);
      await playBowling({ title:'BOWLING WITH SAM', sam:'only', strikes:3 }); E.cut(true); await H.shot(...B.cam, 0); await H.say(D7.bowl2); await H.fade(true, 600); film(null); },
    // ---- 07.05 the deadline: build the package ----
    async () => { E.place(-4.8, -10.3, Math.PI, 3.2); clock(day7, '2ND PERIOD'); E.cut(true); await pcShot(0); pc('<h3>Desktop</h3><p>Microsoft Publisher 2003</p><p>Microsoft Excel 2003</p><p>Microsoft PowerPoint 2003</p><p>Internet Explorer</p>', { title:'My Computer', task:'WINDOWS XP', clock:'8:25 AM' }); await H.say(D7.proj0);
      E.obj('BUILD THE PROJECT PACKAGE.'); await office(); E.obj('SAVE IT TO THE USB DRIVE.'); await H.say(D7.proj2); G.flags.CHRIS_VERSION_SAVED = true; pcOff(); await H.fade(true, 600); },
    // ---- 07.06 PE on the track, then class ----
    async () => { E.place(-214, 205.4, -Math.PI / 2); clock(day7, 'PE'); const zeke = mnpc(ZK, { ...LOOK.zeke, ...PE, hat:undefined }, -216, 206.6, { face:-Math.PI / 2 }); E.cut(true); await H.shot([-208, 2.6, 208.6], [-216, 1.3, 205.6], 0); await H.say(D7.pe0); face(zeke, P.p); faceP(zeke); await two(P.p, zeke, 1, 3.4); await H.say(D7.pe1); E.cut(false);
      zeke.follow(P, 1.8, 5, [1.2, 0]); const leg = async (x, lines) => { await H.reach(x, 205.4, 3); E.cut(true); zeke.stop(); face(zeke, P.p); faceP(zeke); await two(P.p, zeke, 1, 3.4); await H.say(lines); E.cut(false); zeke.follow(P, 1.8, 5, [1.2, 0]); };
      E.obj('WALK THE TRACK WITH ZEKE.'); await leg(-240, D7.pe2); await leg(-268, D7.pe3); E.sfx('bell'); await H.say(D7.pe4); await H.fade(true, 500); zeke.remove(); E.setOutfit({});
      const k = klass(), cl = k.cl, s = cl.seats; clock(day7, '7TH PERIOD'); E.place(-188.4, 113, -Math.PI / 2); E.cut(true); await H.shot([k.jax.p.x + 3.4, 1.7, k.jax.p.z + 1.6], [k.jax.p.x, 1.1, k.jax.p.z], 0); await H.fade(false, 500); await H.say(D7.c1); E.cut(false);
      E.obj('MEET SAM. (your station is next to hers)'); await H.interact(s[10].x + 1, s[10].z, 'SIT DOWN NEXT TO SAM', 2.2); E.cut(true); sitP(s[10].x, s[10].z, -Math.PI / 2); await H.shot([s[10].x - 2.4, 1.5, s[10].z + .6], [s[10].x, 1.1, s[10].z + .6], 600); await H.say(D7.c2); standP(s[10].x + 1, s[10].z, -Math.PI / 2); E.cut(false);
      E.obj('TURN IN THE PROJECT.'); await H.interact(cl.sparks.x + 1.6, cl.sparks.z + 1.4, 'HAND IN SAM’S USB DRIVE', 2.4); E.sfx('ok'); E.toast('Turned in: Sam’s USB drive', 3000); await H.say(D7.c3); G.flags.PROJECT_SUBMITTED_SAMS = true; E.cut(true); sitP(s[10].x, s[10].z, -Math.PI / 2); await H.shot([s[10].x - 2.4, 1.5, s[10].z + .6], [s[10].x, 1.1, s[10].z + .6], 0);
      await H.say(D7.c4.slice(0, 3)); E.sfx('bell'); await H.say(D7.c4.slice(3)); await H.fade(true, 600); },
    // ---- 07.07 Jacob's phone call ----
    async () => { park(-17, 10, 0); E.place(0, 2.2, Math.PI); clock(day7, 'AFTER SCHOOL'); E.cut(false); H.say(D7.home, { auto:true }); E.obj('GRAB SOMETHING FROM THE FRIDGE.'); await H.interact(-6.7, -10.3, 'OPEN THE FRIDGE', 2); E.sfx('door');
      E.obj('HIT THE COUCH.'); await H.interact(G.sofa.x, G.sofa.z, 'SIT DOWN', 2.2); E.cut(true); sitSofa(true); tvOn(); await H.shot(...TV_SHOT, 600); await H.wait(1500); for(let i = 0; i < 2; i++){ E.sfx('ring'); await H.wait(900); } sitSofa(false); E.cut(false);
      let rt = 0, ringing = true; mtick(dt => { if(ringing && (rt -= dt) <= 0){ rt = 1.8; E.sfx('ring'); } }); E.obj('ANSWER THE HOUSE PHONE.'); await H.interact(G.phone.x, G.phone.z, 'PICK UP THE PHONE', 2); ringing = false; E.cut(true); phoneUp(true); await H.shot([.1, 2.1, -3.4], [3.1, 1.5, -1.2], 500);
      await H.say(D7.ring); await H.say(D7.call); phoneUp(false); E.sfx('door'); await H.say(D7.end);
      await H.banner('MISSION PASSED', 'FORGETTING THE DAMN PROJECT'); Object.assign(G.flags, { M07_DONE:true, PROJECT_SUBMITTED:true, PROJECT_SUBMITTED_SAMS:true, SAM_FRIENDSHIP_GROWING:true }); E.cut(false); } ],
  done(){ G.roamTime = 'after'; film(null); } };
void THREE; void later; void SV;
