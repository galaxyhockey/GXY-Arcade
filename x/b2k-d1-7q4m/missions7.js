// Back in the 2000s: The Game — Draft #2.25 mission M10 "The Battle of the Sauce".
// BOOK: "Week 4 - October 10th 2003" (66-page manuscript, PDF pp. 59–63). All book text lives in D10 (book order, spelling as printed).
// '' = Chris's narration. Nothing in D10 is game-original; the few game-original lines are in G10 and marked.
// Fixed by the book, whatever the player does: Sam stays at school (perfect attendance). The five leave by the back gym door and
// Matt drives. Zeke orders first. Sauces: Zeke Fire, Matt Verde, Jax Hot, Milo Mild, Chris agrees with Milo. Chris wins at PE.
// Chris is still grounded from M08; nothing here punishes or ungrounds anyone. Sam's Sunday hangout is set; no romance flag.
// Adaptation notes (flagged for the author, not silent fixes):
//  - The book's locker talk is upstairs; the game plays it at the 2nd-floor lockers, then cuts to the commons ("i walk downstairs").
//  - The cashier's recap and the $21.65 total are kept as printed. Chris hands over $22; the receipt shows $0.35 change (author to approve).
//  - Leaving: the gang walks toward the gym, the back door is a cut, and Matt's car waits in the school lot. The drive is a cut.
//  - Taco Bell is a walk-in restaurant on the map (it stays open in free roam). Its menu and prices in free roam are GAME ORIGINAL.
//  - Each sauce argument is started with a prompt, but always in the book's order, so the rebuttals still answer each other.
import * as E from './engine.js';
import { H, mnpc, mtick, clock, park } from './game.js';
import { LOOK, two, face, faceP } from './missions.js';
import { later, film } from './missions3.js';
import { playDuel } from './minigames2.js';
import { CAST2, reg, sitN, sitP, standP, PE } from './missions4.js';
const { THREE, G, P } = E; const C = 'Chris', ZK = 'Zeke', MT = 'Matt', JX = 'Jax', MI = 'Milo', SM = 'Sam', TB = 'Taco Bell worker';
const day10 = 'OCTOBER 10TH 2003', LUNCH = { x:-283.5, z:-627 };
const D10 = {
  lock:[[C, `I never knew Mr. Ruiz could make Biology so boring`], ['', `i said standing at my lockers with Sam`], [SM, `I always heard he was a lame teacher`], [C, `He treats it like a college class`],
    ['', `i said, then i closed my locker and said`], [C, `So do you want to ditch next period and go get lunch at Taco Bell with me and the gang?`],
    [SM, `I wish i could meet your friends but i can’t, i gotta keep that perfect attendance like a boss`], [C, `Nerd`], ['', `i said snickering`], [SM, `Stop that`], ['', `sam said hitting me in the arm,`], [SM, `Well you have a fun time`], [C, `See ya`]],
  walk:[['', `i said as i walked to the cafeteria to meet up with the four amigos, maybe if we kill zeke it would be accurate to the three amigos. I walk downstairs and then down the hall and arrive at the cafeteria to see everybody at the lunch table.`]],
  caf:[[C, `Alright we ready for Taco Bell?`], ['', `i said`], [`${MT} & ${MI}`, `Yup`], [JX, `For sure`], [ZK, `FOR SURE`], ['', `zeke said with pure hunger in mind`], [C, `Ok fatass lets go to the car`]],
  out:[['', `i said, we snuck out the back gym door and Matt drove us to Taco Bell.`]], inside:[['', `We walk inside to that amazing feeling and vibe of Taco Bell. We walk up to the counter and order.`]],
  order:[[C, `You wanna start first zeke, since we all know your ordering the most`], ['', `i said`], [ZK, `Sure`], ['', `zeke says turning toward the employee`], [ZK, `I will get a beef fiesta burrito, mexican pizza, cinnamon twists and a fountain drink`], ['', `i then walk forward next`],
    [C, `I will get a beef chalupa and also some cinnamon twists and a fountain drink`], ['', `i said`], [MT, `I will also get a mexican pizza and a fountain drink`], ['', `matt said`], [JX, `Same for me`], ['', `jax said`], [MI, `I’ll take a steak grilled stuft burrito and a fountain drink`], ['', `milo said`],
    [TB, `Alright so that is a beef fiesta burrito, 3 mexican pizzas, 2 cinnamon twists, a beef chalupa, a steak grilled stuft burrito and 5 fountain drinks`], ['', `the worker said`], [C, `Yup`], ['', `i said`], [TB, `Alright that will be $21.65`]],
  pay:[[C, `Man thats expensive`], ['', `i say handing them a $20 and two dollar bills. We walk over to the table and zeke grabs every sauce known to man.`]],
  grounded:[[C, `So anything of you guys get ungrounded yet from the trip yet`], ['', `i asked`], [JX, `Nope`], ['', `jax said`], [MT, `I got a week left on my sentence`], ['', `matt said`], [MI, `Same here`], ['', `milo said`], [ZK, `I never got grounded`], ['', `zeke said`],
    [C, `You never got grounded and YOU’RE the one who made this master plan`], ['', `i said`], [ZK, `My parents didn’t notice me leaving or coming back`], ['', `zeke said`], [MT, `I don’t know if thats cool or a sign of bad parenting`],
    ['', `matt said as out food arrived, we grabbed each of our different items and started eating. I then asked a cool hypothetical to get the conversation going again.`]],
  s0:[[C, `What is your favorite taco bell sauce`], ['', `i asked`]],
  sZeke:[[ZK, `Fire all the way`], ['', `zeke said`]],
  sMatt:[[MT, `Fire?`], ['', `matt said`], [MT, `What a weird choice`], [ZK, `Well lets hear your choice professor`], ['', `zeke said`], [MT, `Verde`], ['', `matt said`], [ZK, `Verde??`], ['', `zeke said in shock`], [ZK, `Are you an old grandma theres no spice to it, might aswell serve it in a nursing home.`]],
  sJax:[[JX, `You guys are both wrong, the correct answer is Hot`], ['', `jax says jumping in,`], [JX, `It’s spicy without losing its good flavor profile`], [ZK, `If your getting Hot you might aswell be getting Fire, its literally just more spicy and retains its flavor profile, whatever that means`], ['', `zeke says`]],
  sMilo:[[MI, `Mild is honestly the best`], ['', `milo says`], [MI, `It doesn’t leave any lingering burning flavor`]],
  sChris:[[C, `I have to agree with Milo on this one`], ['', `i said`]],
  s2:[[ZK, `You two are losers, the burn is what makes taco bell sauce so good, without it might aswell be green ketchup`], ['', `zeke said`], [MT, `See i don’t agree, i don’t want my bathroom to end up like a gas station after eating Hot or Fire`], ['', `matt said`], [MT, `I’ve seen your bathroom zeke`],
    [ZK, `Whatever`], ['', `Zeke says, then turning to jax`], [ZK, `See what i don’t get is that if you like Hot why not like Fire, Jax. It’s like the same thing`], [JX, `I like that it tastes a little bit like ketchup`], ['', `jax said`],
    [C, `What kind of blasphemy just came out of your mouth Jax`], ['', `i said`], [C, `Taco sauce should NOT taste like ketchup, i understand if it tastes a little tomatoey but full on ketchup is actual disrespect to mexicans everywhere who travelled here and spread there food.`],
    [ZK, `Doesn’t that eliminate Verde sauce then, its literally ketchup`], ['', `zeke says`], [C, `I’ll leave that up to you zeke`], ['', `i said`], [C, `Alright since you guys are so fiery about this topic`], [ZK, `Except Matt because he doesn’t like any heat like a grandma`], ['', `zeke interrupts`]],
  m0:[[C, `Anyways, like i was saying, what is your favorite Taco Bell menu item`], [MT, `It’s gotta be the mexican pizza`], ['', `matt said`], [ZK, `I have to agree with you grandma`], ['', `zeke says`], [MI, `This steak stuft burrito is the best item in Taco Bell history`], ['', `milo says`],
    [ZK, `BLASHPMY IN THIS HOLY ESTABLISHMENT`], ['', `zeke yells as he points at milo`], [ZK, `SEND HIM TO THE GULAG`], [C, `Alright zeke calm down, while he does have an invalid take on the issue its fine`], ['', `i said`], [MI, `So whats your favorite tuff guy`], ['', `milo says`]],
  m1:[[C, `The mexican pizza, it combines the greatness of a pizza and the best parts of a soft shell taco.`], ['', `i said`], [MI, `You’re at a mexican restaurant, chose a mexican item not an amalgamation of two different cultures that offends both of them`], ['', `milo says`],
    [JX, `I have to disagree i like the beefy chalupa over the mexican pizza`], ['', `jax interjects`], [C, `Okay so you are all wrong`], ['', `i said`],
    [C, `We all know milo doesn’t know what the word amalgamation means he reads the dictionary all the time like a weirdo. Second of all, the grilled stuft burrito isn’t even a permanent item it should’nt count.`],
    [MI, `Is it not an item still?`], ['', `milo said`], [C, `A limited time one yes`], ['', `i said`], [MI, `Well its still an item then`], ['', `milo said`], [MI, `I win, you are all wrong, and also Jax a beefy chalupa just say you like old women vagina already jesus.`],
    ['', `milo gets up and then says`], [MI, `I am going to the bathroom to get rid of this bad taste in my mouth you all have given me`]],
  m2:[['', `As he walks away i say`], [C, `Are you sure it isn’t your terrible choice of a burrito`], [MI, `Take that back`], ['', `milo yells as he enters the restroom.`]],
  drink:[[C, `At least you all agree Tropicana Pink Lemonade is the best drink right?`], ['', `i said to the rest of the table`], [ZK, `Yeah i’d say so`], ['', `zeke said`], [MT, `For sure`], ['', `matt said`], [JX, `Absoluetly`], ['', `jax said`],
    [C, `Well at least we all agree except maybe milo he is weird like that`], ['', `i said,`], [C, `So any good conversation starters you guys`], [ZK, `Uhh, Milo has bad food takes`], ['', `zeke said`], [C, `Agreed`], ['', `i said as we all nodded,`], [C, `Alright let’s head back to school`]],
  back:[[MI, `Sounds good`], ['', `milo yells back as he exits the bathroom, we drive back to school and i head to PE class with zeke. When in the middle of nowhere.`]],
  sam:[[SM, `Fun time at the Taco Bell`], ['', `sam said`], [ZK, `Uhh, who is this person`], ['', `zeke said`], [C, `She’s my friend zeke from 7th period`], ['', `i said`], [ZK, `Oh ok..`], ['', `zeke said, he extends his hand out for a handshake and says`], [ZK, `My name is Zeke and i am a dumbass`],
    [SM, `Well…. Hello dumbass?`], ['', `sam says`], [SM, `Anyways i wanted to see if you wanted to hang out on sunday`], [C, `Sounds good`], ['', `i said, she waves goodbye and we go our separate ways.`]],
  gf:[[ZK, `So is she your girl friend or a friend that is a girl`], ['', `zeke said`], [C, `A friend that is a girl zeke, i know you don’t get many of those`], ['', `i said`], [ZK, `True dat`], ['', `zeke said as we entered the locker room.`]],
  pe:[['', `We changed, played a game of basketball as per usual, a lot closer, i think i lost my edge at the beginning, but as the comeback king that i am, i won.`]],
  end:[['', `I changed in the locker room again, headed to 7th period, man did that fly by and then headed home. A good day, and a good weekend ahead, Matt invited us to his friend’s keg party on Saturday and then a i have a hangout with Sam on Sunday. What a good Friday. Don’t get many of these anymore.`]] };
// GAME ORIGINAL (from the author's screenplay list; idle lines only, never over book dialogue)
const G10 = { car:[[MT, `Everybody in. I'm not listening to Zeke pick the radio station again.`]], cashier:[[TB, `I get paid by the hour. Not enough, apparently.`]] };

const gang = (pts, o = {}) => { const g = {}; [['zeke', ZK], ['matt', MT], ['jax', JX], ['milo', MI]].forEach(([k, nm], i) => { if(pts[i]) g[k] = mnpc(nm, LOOK[k], pts[i][0], pts[i][1], { face:pts[i][2] ?? 0, ...o }); }); return g; };
const trail = g => Object.values(g).forEach((n, i) => n.follow(P, 1.8 + i * .9, 5));
const tacoBell = () => (G.shops || []).find(s => s.name === 'TACO BELL');
const ang = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
const prop = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), E.mat(c)); m.position.set(x, y + h / 2, z); G.scene.add(m); later(() => G.scene.remove(m)); return m; };
// Matt's car (colour is game original; the book does not say)
const mattCar = (x, z, ry) => { const car = E.makeCar('#2a4a7a', { type:'sedan', lights:true }); car.position.set(x, G.terrain ? G.terrain(x, z) : 0, z); car.rotation.y = ry; G.scene.add(car); later(() => G.scene.remove(car)); return car; };
const cars = [];

export const M10 = { title:'The Battle of the Sauce', sub:day10, where:'front entrance of Belleville West High School', needs:'M09', start:{ x:-236, z:-623 },
  setup(i){ reg(); film(null); E.setTime(i < 2 ? 'day' : 'after'); E.setOutfit({}); clock(day10, ''); G.noTraffic = false; G.storeOpen = true; P.model.rotation.x = 0; },
  stages:[
    // ---- 10.01 lockers · 10.02 cafeteria · 10.03 out the back and into Matt's car ----
    async () => { const UP = 4.2, lx = -340, lz = -654.6; clock(day10, 'AFTER BIOLOGY'); standP(lx, lz, Math.PI, UP); const sam = mnpc(SM, CAST2.sam, lx + 1.3, lz, { face:Math.PI, y:UP });
      E.cut(true); await H.shot([lx + .6, UP + 1.8, lz + 3.4], [lx + .6, UP + 1.2, lz - .4], 0); await H.say(D10.lock.slice(0, 5)); E.sfx('door'); faceP(sam); face(sam, P.p); await H.say(D10.lock.slice(5)); await H.say(D10.walk);
      await H.fade(true, 500); sam.remove(); E.place(-256, -620, -Math.PI / 2); clock(day10, 'LUNCH'); const L = LUNCH, g = gang([[L.x, L.z + 1.3, Math.PI], [L.x + 1.3, L.z, -Math.PI / 2], [L.x, L.z - 1.3, 0], [L.x + 1.3, L.z + 1.3, -2.4]]);
      Object.values(g).forEach(n => { n.p.y = 0; }); sitN(g.zeke, L.x, L.z + 1.3, Math.PI); sitN(g.matt, L.x + 1.3, L.z, -Math.PI / 2); sitN(g.jax, L.x, L.z - 1.3, 0); sitN(g.milo, L.x + 1.3, L.z + 1.1, -2.4); E.cut(false); await H.fade(false, 400);
      E.obj('FIND THE GANG IN THE CAFETERIA.'); await H.reach(L.x - 1.9, L.z, 2.4); E.cut(true); faceP({ x:L.x, z:L.z }); await H.shot([L.x - 3.4, 2.1, L.z - 2.6], [L.x + .4, 1, L.z + .2], 500); await H.say(D10.caf);
      Object.values(g).forEach(n => { E.sit(n.o, false); }); g.matt.go([[-280, -639]], 4.4); [g.zeke, g.jax, g.milo].forEach((n, i) => n.follow(g.matt, 1.6 + i * .9, 4.6)); E.cut(false);
      E.obj('FOLLOW MATT TO THE BACK GYM DOORS.'); await H.reach(-280, -639, 2.8); await H.say(D10.out);
      await H.fade(true, 500); Object.values(g).forEach(n => n.remove()); const car = mattCar(-237, -568, 0); E.place(-234.6, -566, -Math.PI / 2); const g2 = gang([[-233.8, -570.5], [-238.6, -565.4, 0], [-233.6, -568.6], [-234, -564.4]]);
      G.blips.push({ x:-235.6, z:-568, c:'#4fc3ff' }); E.cut(false); await H.fade(false, 400); H.say(G10.car, { auto:true });
      E.obj('GET INTO MATT’S CAR.'); await H.interact(-235.6, -568, 'GET IN (PASSENGER SEAT)', 2.2); G.blips = []; E.sfx('door'); Object.values(g2).forEach(n => n.remove()); void car; await H.fade(true, 500); },
    // ---- 10.04 the order · 10.05 roll call · 10.06 sauces · 10.07 menu items ----
    async () => { const s = tacoBell(); if(!s){ E.toast('Taco Bell is missing from the map.', 4000); return; } clock(day10, 'LUNCH · TACO BELL');
      const [ox, oz] = s.out, car = mattCar(ox, oz, s.along); void car; const [dx, dz] = s.door; E.place(dx + Math.sin(s.along) * 1.2, dz + Math.cos(s.along) * 1.2, ang([dx, dz], s.at));
      const g = gang([[dx - 1, dz - .6], [dx + 1.6, dz - 1.2], [dx - 1.8, dz - 1.4], [dx + .4, dz - 2]]); trail(g);
      E.cut(true); await H.shot([ox + Math.sin(s.along) * 9, 3, oz + Math.cos(s.along) * 9], [dx, 1.6, dz], 0); await H.fade(false, 500); await H.say(D10.inside);
      E.cut(false); E.obj('WALK UP TO THE COUNTER.'); await H.reach(s.at[0], s.at[1], 2.2); E.cut(true);
      // the line: Zeke orders first, then Chris, Matt, Jax, Milo
      const [ax, az] = s.at, [kx, kz] = s.clerk, bk = [ax - (kx - ax) * .9, az - (kz - az) * .9]; Object.values(g).forEach(n => n.stop());
      g.zeke.at(ax, az, ang(s.at, s.clerk)); E.place(bk[0], bk[1], ang(bk, s.at)); [g.matt, g.jax, g.milo].forEach((n, i) => n.at(bk[0] + Math.sin(s.along) * (1 + i * .9), bk[1] + Math.cos(s.along) * (1 + i * .9), ang(bk, s.at)));
      await H.shot([ax + Math.sin(s.along) * 3.4, 2.3, az + Math.cos(s.along) * 3.4], [kx, 1.3, kz], 500); await H.say(D10.order.slice(0, 6)); g.zeke.at(bk[0] - Math.sin(s.along) * 1.2, bk[1] - Math.cos(s.along) * 1.2); E.place(ax, az, ang(s.at, s.clerk));
      E.obj('ORDER (the beef chalupa, twists and a drink).'); await H.choose(['“I will get a beef chalupa and also some cinnamon twists and a fountain drink”']); await H.say(D10.order.slice(6, 8)); await H.say(D10.order.slice(8));
      E.sfx('ok'); E.toast('<b>TACO BELL</b> · TOTAL $21.65<br>PAID $22.00 · CHANGE $0.35', 4200); await H.say(D10.pay.slice(0, 1)); await H.say(G10.cashier, { auto:true }); await H.say(D10.pay.slice(1));
      // the table
      const bo = s.booths.slice().sort((p, q) => Math.hypot(p.t[0] - kx, p.t[1] - kz) - Math.hypot(q.t[0] - kx, q.t[1] - kz))[0], u = [Math.sin(s.along), Math.cos(s.along)], aisle = -bo.side;
      const at = (p, k) => [p[0] + u[0] * k, p[1] + u[1] * k], T = bo.t, fz = p => ang(p, T), dl = Math.hypot(bo.b[0] - bo.a[0], bo.b[1] - bo.a[1]) || 1, dv = [(bo.b[0] - bo.a[0]) / dl, (bo.b[1] - bo.a[1]) / dl];
      await H.fade(true, 400); const ca = at(bo.a, aisle * .42), mi = at(bo.a, -aisle * .42), ma = at(bo.b, aisle * .42), ja = at(bo.b, -aisle * .42), ze0 = at(T, aisle * 1.15), ze = [ze0[0] - dv[0] * .45, ze0[1] - dv[1] * .45];
      sitP(ca[0], ca[1], fz(ca), P.p.y); sitN(g.milo, mi[0], mi[1], fz(mi)); sitN(g.matt, ma[0], ma[1], fz(ma)); sitN(g.jax, ja[0], ja[1], fz(ja)); g.zeke.at(ze[0], ze[1], fz(ze));
      const ty = (G.terrain ? G.terrain(T[0], T[1]) : 0) + .79; [[-.5, '#5a2a82'], [.5, '#c8a040']].forEach(([k, c]) => { const p = at(T, k * .6); prop(.5, .03, .34, c, p[0], ty, p[1]); });
      for(let i = 0; i < 14; i++){ const p = at(T, aisle * .55); prop(.08, .02, .05, ['#d0242a', '#e8761a', '#2f8a3a', '#f2c230'][i % 4], p[0] + (i % 4) * .06 - .1, ty + .04 + (i / 4 | 0) * .022, p[1] + (i % 3) * .05 - .05); } // Zeke's sauce pile
      const wide = [T[0] + u[0] * aisle * 2.4 + dv[0] * 2.6, 2.9, T[1] + u[1] * aisle * 2.4 + dv[1] * 2.6], look = [T[0], .8, T[1]], ctr = (n, m) => { const mx = (n.p.x + m.p.x) / 2, mz = (n.p.z + m.p.z) / 2, s = Math.sign((mx - T[0]) * dv[0] + (mz - T[1]) * dv[1]) || 1; return [[mx + dv[0] * s * 1.9 + u[0] * aisle * 1.3, 1.75, mz + dv[1] * s * 1.9 + u[1] * aisle * 1.3], [mx, 1.05, mz]]; };
      await H.shot(wide, look, 0); await H.fade(false, 400);
      E.obj('SIT WITH THE GANG.'); await H.say(D10.grounded.slice(0, 8)); await H.shot([g.zeke.p.x + u[0] * aisle * 1.6, 1.8, g.zeke.p.z + u[1] * aisle * 1.6], [g.zeke.p.x, 1.4, g.zeke.p.z], 250); await H.say(D10.grounded.slice(8, 10)); await H.shot(wide, look, 400); await H.say(D10.grounded.slice(10));
      // round one: the sauces (always in the book's order)
      E.obj('HEAR EVERYBODY’S SAUCE ARGUMENT.'); await H.say(D10.s0);
      for(const [who, key, n, m] of [['Zeke', 'sZeke', g.zeke, g.zeke], ['Matt', 'sMatt', g.matt, g.zeke], ['Jax', 'sJax', g.jax, g.zeke], ['Milo', 'sMilo', g.milo, g.milo]]){ await H.choose([`Ask ${who}`]); const [cp, cl] = ctr(n, m); await H.shot(cp, cl, 300); await H.say(D10[key]); }
      await H.shot(...ctr(g.milo, g.milo), 300); await H.say(D10.sChris); await H.shot(wide, look, 400); await H.say(D10.s2);
      // round two: menu items
      E.obj('FAVORITE MENU ITEM?'); await H.say(D10.m0.slice(0, 7)); await H.shot(...ctr(g.zeke, g.milo), 250); await H.say(D10.m0.slice(7, 10)); await H.shot(wide, look, 300); await H.say(D10.m0.slice(10));
      await H.choose(['Defend the Mexican Pizza']); await H.say(D10.m1.slice(0, 18));
      E.sit(g.milo.o, false); await H.say(D10.m1.slice(18)); const back = [kx + (kx - ax) * .1, kz + (kz - az) * .1]; g.milo.go([[ax + u[0] * 4, az + u[1] * 4], [back[0] + u[0] * 4, back[1] + u[1] * 4]], 3.4); await H.say(D10.m2); g.milo.o.visible = false;
      await H.shot([T[0], 4.4, T[1] + .01], look, 500); await H.say(D10.drink); g.milo.o.visible = true; g.milo.stop(); g.milo.at(ax + u[0] * 3, az + u[1] * 3); await H.say(D10.back.slice(0, 1)); G.flags.M10_SAUCE_DEBATE_SEEN = G.flags.M10_MENU_DEBATE_SEEN = true; await H.fade(true, 500); },
    // ---- 10.08 back at school, Sam meets Zeke · 10.09 PE · 10.10 home ----
    async () => { clock(day10, 'BACK AT SCHOOL'); E.place(-318, -652.6, -Math.PI / 2); const zeke = mnpc(ZK, LOOK.zeke, -316.4, -652, { face:-Math.PI / 2 }); zeke.follow(P, 1.8, 5, [1.2, 0]);
      E.cut(true); await H.shot([-312, 2.2, -652.4], [-322, 1.3, -652.6], 0); await H.fade(false, 400); await H.say(D10.back.slice(1)); E.cut(false);
      E.obj('WALK TO PE WITH ZEKE.'); await H.reach(-334, -652.8, 2.4); const sam = mnpc(SM, CAST2.sam, -337.6, -653.6, { face:Math.PI / 2 }); E.cut(true); zeke.stop(); E.place(-335.2, -653.4, -Math.PI / 2); zeke.at(-334.6, -652.2); face(sam, P.p); faceP(sam); face(zeke, sam.p);
      const hall = [[-336.2, 1.75, -650.6], [-336.4, 1.15, -653.4]]; await H.shot(...hall, 400); await H.say(D10.sam.slice(0, 7));
      face(zeke, sam.p); face(sam, zeke.p); await H.say(D10.sam.slice(7, 10)); face(sam, P.p); await H.say(D10.sam.slice(10));
      G.flags.SAM_SUNDAY_PLAN = true; sam.go([[-366, -653.4]], 3); face(zeke, P.p); faceP(zeke); await H.say(D10.gf); sam.remove(); E.cut(false); zeke.follow(P, 1.8, 5, [1.2, 0]);
      E.obj('GET TO PE.'); await H.reach(-366, -653, 2.6); await H.fade(true, 500); zeke.remove();
      const gy = G.gym.center; E.setOutfit(PE); E.place(gy.x, gy.z + 3, Math.PI); clock(day10, 'PE'); const z2 = mnpc(ZK, { ...LOOK.zeke, ...PE, hat:undefined }, gy.x, gy.z - 1.2, { face:0 }); void z2;
      E.cut(true); await H.shot([gy.x + 5, 2.2, gy.z + 5], [gy.x, 1.3, gy.z], 0); await H.fade(false, 400); E.obj('PLAY A GAME OF BASKETBALL AGAINST ZEKE.');
      // a lot closer this time: Zeke starts ahead, Chris comes back (every possession must be made, so the game cannot be lost)
      await playDuel({ title:'PE: 1 ON 1 VS ZEKE', foe:'Zeke', start:[4, 10], script:['o', 'd', 'o', 'd', 'o', 'o'], indoor:true }); G.flags.M10_PE_COMPLETE = true; E.cut(true); await H.say(D10.pe);
      await H.fade(true, 600); E.setOutfit({}); E.setTime('after'); clock(day10, '3:10 PM'); E.place(.6, 11, Math.PI); await H.shot([6, 2.2, 22], [0, 1.8, 6], 0); await H.fade(false, 700); await H.say(D10.end); await H.wait(800); await H.fade(true, 700);
      await H.banner('MISSION PASSED', 'THE BATTLE OF THE SAUCE'); Object.assign(G.flags, { M10_DONE:true, M10_COMPLETE:true, GROUNDING_ACTIVE:true, M10_SAM_INVITED:false, KEG_PARTY_SATURDAY:true }); E.cut(false); await H.fade(false, 700); } ],
  done(){ G.roamTime = 'after'; film(null); } };
void mtick; void park; void cars;
