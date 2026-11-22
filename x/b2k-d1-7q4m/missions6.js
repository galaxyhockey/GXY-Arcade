// Back in the 2000s: The Game — Draft #2 side missions S02–S07. ALL GAME ORIGINAL (Draft #2 Bible), none of it is from the book.
// Quoted lines are the Bible's lines, word for word. Where the Bible only DESCRIBES a beat and gives no line, the game uses the
// shortest possible stand-in, marked GO-STANDIN below, so the author can replace it:
//   S02 ending (pay / "family work") · S03 "Dad calls the time" · S04 ending (Andrew asks, Chris inflates, Mia corrects) ·
//   S05 losing prompt · S06 ending (Milo deadpan, Jax offended, Chris wants food) · S07 opening (company delayed) and ending (Dad's thanks).
// Timing rules from the Bible: S02 and S06 are offered after M05 and before M08. S03 after M06 and before M07. S07 after M08.
// S04 and S05 after M09, at work. None of them changes a story flag that a main mission depends on, and none can be failed for good.
import * as E from './engine.js';
import { H, mnpc, mtick, minter, clock, SV, save, fail, fillCorral, emptyCorrals, startPushing, grabFrom, deliver, train, clearTrain } from './game.js';
import { LOOK, two, face, faceP } from './missions.js';
import { later, film } from './missions3.js';
import { pc, pcOff, pcClock } from './pc.js';
import { playDuel, playBag } from './minigames2.js';
import { reg, sitN, standP, pcShot } from './missions4.js';
const { G, P } = E; const $ = id => document.getElementById(id); const C = 'Chris', MOM = 'Mom', DAD = 'Dad', JC = 'Jacob', MIA = 'Mia', AN = 'Andrew', MD = 'Madison', JX = 'Jax', MI = 'Milo';
const work = { shirt:'#f0f0f0', top:'polo', vest:'#c8102e' };
const base = () => { reg(); film(null); pcOff(); G.noTraffic = false; G.storeOpen = true; };
// a multiple-choice screen that repeats until the right answer is picked. Returns how many wrong picks it took.
async function pick(html, o, opts, right, wrongMsg){ let n = 0; for(;;){ pc(html, o); const k = await H.choose(opts); if(k === right){ E.sfx('ok'); return n; } n++; E.sfx('miss'); E.toast(Array.isArray(wrongMsg) ? wrongMsg[k] || wrongMsg[0] : wrongMsg, 3000); } }

// =================== S02 — COMPUTER TROUBLES ===================
export const S02 = { title:'Computer Troubles', sub:'SIDE MISSION · GAME ORIGINAL', where:'the family computer, by your front door', needs:'M05', avail:d => d.M05 && !d.M08, start:{ x:3.9, z:2.8 },
  setup(){ base(); E.setTime('after'); E.setOutfit({}); clock('SIDE MISSION', ''); },
  stages:[ async () => { const F = G.famPC; E.place(-1.2, -3.4, 0); const mom = sitN(mnpc(MOM, LOOK.mom, 0, 0), 2.4, 2.55, 0); E.cut(true); await H.shot([-.4, 1.9, .4], [2.4, 1.1, 3], 0); await H.say([[MOM, `Chris! I think I broke the computer.`]]); E.cut(false);
      E.obj('FIND MOM.'); await H.interact(F.x - 1.2, F.z - .2, 'CHECK THE COMPUTER', 2.2); E.cut(true); faceP(mom); await H.shot([.2, 1.8, .8], [2.4, 1.1, 3.2], 500);
      await H.say([[C, `How do you break something that just sits on a desk?`], [MOM, `I was typing a letter, and now it's gone.`], [C, `Alright, move. Don't click anything. Especially the little X.`]]); E.sit(mom.o, false); mom.at(3.6, 1.8); face(mom, { x:2.4, z:3.4 });
      E.obj('CHECK THE COMPUTER.'); await H.shot([F.look[0], F.look[1] + .25, F.look[2] - 1.3], F.look, 500); const o = { title:'Desktop', task:'start | Solitaire | Document1 - Microsoft Word | Printers', clock:'4:12 PM' };
      await pick('<h3>The screen is frozen.</h3><p>Three things are open on the taskbar. Which one is Mom’s letter?</p>', o, ['Solitaire', 'Document1 - Microsoft Word (Not Responding)', 'Printers and Faxes'], 1, 'That is not the letter.');
      await pick('<h3>Document1 - Microsoft Word (Not Responding)</h3><p class="dim">The window is white. The hourglass is spinning.</p>', { ...o, title:'Microsoft Word' }, ['Click the little X', 'Wait for it, then open Document Recovery', 'Unplug the computer'], 1, ['No. That closes it without saving.', '', 'Mom: “Don’t you dare.”']);
      await pick('<h3>Document Recovery</h3><p>Word found these files:</p><p>Document1 [Original] — 0 KB</p><p>Document1 [Autosaved] — 24 KB — 4:09 PM</p><p>CHRIS_HOMEWORK.doc — 1 KB</p>', { ...o, title:'Microsoft Word' }, ['Document1 [Original]', 'CHRIS_HOMEWORK.doc', 'Document1 [Autosaved]'], 2, ['That one is empty.', 'That is one sentence of homework.']);
      await pick('<h3>Save As</h3><p>The letter is back. Where does it go?</p>', { ...o, title:'Save As' }, ['Recycle Bin', 'My Documents', 'Don’t save'], 1, 'Not there.');
      await pick('<h3>Print</h3><p>Name: <u>?</u></p><p>Pick the printer:</p>', { ...o, title:'Print' }, ['Fax', 'Microsoft Office Document Image Writer', 'DeskJet on LPT1 (Ready)'], 2, 'PAPER JAM. Wrong printer. Try again.');
      pc('<h3>Print</h3><p>Name: <u>DeskJet on LPT1 (Ready)</u></p><p>Pages: 1</p>', { ...o, title:'Print' }); await H.choose(['Print one test page']); E.tone(180, 0, 1.6, 'sawtooth', .03, 240); await H.wait(1700); E.sfx('ok'); pcOff();
      E.obj('SHOW MOM THE LETTER.'); face(mom, P.p); faceP(mom); await two(P.p, mom, 1, 3.4); await H.say([[MOM, `You really are good with these things.`], [C, `Compared to Zeke? Absolutely. Compared to literally anyone else? Debatable.`], ['', `I asked what the job paid. Mom called it family work.`]]); // last line GO-STANDIN
      await H.banner('SIDE MISSION PASSED', 'COMPUTER TROUBLES'); G.flags.S02_DONE = true; E.cut(false); } ] };

// =================== S03 — MIDNIGHT RESEARCH ===================
// Notes only. Chris does NOT finish the project here: M07 still plays out exactly as the book has it.
const SUBJ = [
  ['coffeehouse', ['coffin', 'coffeehouse', 'Costa Rica'], 1, ['A coffin is a box. Not helpful.', '', 'Nice beaches. Wrong project.'],
    ['Coffee grows on a shrub. The beans are the seeds of its fruit.', 'A coffeehouse sells drinks and light food and gives people a place to sit, talk and read.', 'An early web camera was pointed at a coffee pot.'], 1],
  ['small business', ['show business', 'small intestine', 'small business'], 2, ['Wrong kind of business.', 'About six metres long. Not helpful.', ''],
    ['A small business needs a plan: what it sells, what that costs, and who will buy it.', 'The smallest country in the world is Vatican City.', 'Monopoly is a board game about buying property.'], 0],
  ['computer networks', ['computer networks', 'fishing nets', 'computer solitaire'], 0, ['', 'Nets. For fish.', 'Tempting. No.'],
    ['An early electronic computer filled a whole room.', 'A spider builds its web out of silk.', 'A network joins computers together so they can share one internet connection and one printer.'], 2] ];
export const S03 = { title:'Midnight Research', sub:'SIDE MISSION · GAME ORIGINAL', where:'your bedroom computer', needs:'M06', avail:d => d.M06 && !d.M07, start:{ x:1.3, z:-8.6, y:3.2 },
  setup(){ base(); E.setTime('night'); E.setOutfit({}); clock('OCTOBER 1ST 2003', 'LATE'); },
  stages:[ async () => { E.place(3.5, -9.4, Math.PI, 3.2); E.cut(true); await pcShot(0); await H.say([['Dad', `Chris, you've got ten minutes before I need the phone line.`], [C, `A whole ten minutes? Might as well get my PhD while I'm at it.`]]);
      const long = (await H.choose(['10:00 on the clock', '15:00 on the clock (more time)'])) === 1; let left = long ? 900 : 600, out = null; const o = { title:'Encyclopedia 2003', task:'WINDOWS XP | Encyclopedia 2003' }, lost = new Promise(r => out = r);
      const fmt = () => `PHONE LINE ${String(left / 60 | 0).padStart(2, '0')}:${String(left % 60 | 0).padStart(2, '0')}`; mtick(dt => { if(left > 0 && (left -= dt) <= 0){ left = 0; out('time'); } pcClock(fmt()); });
      const timed = p => Promise.race([p, lost]), notes = []; E.obj('OPEN THE ENCYCLOPEDIA. Find three subjects and save your notes before the timer runs out.');
      const run = async () => { pc('<h3>Encyclopedia 2003</h3><p class="dim">Insert Disc 2 for video clips.</p><p>Type a subject to search.</p>', o); await H.choose(['Open the encyclopedia']);
        for(const [name, qs, qr, qw, ps, pr] of SUBJ){ await pick(`<h3>Search</h3><p>Subject ${notes.length + 1} of 3. You need: <b>${name}</b></p><p>Find:</p>`, o, qs, qr, qw);
          await pick(`<h3>${name}</h3>${ps.map((p, i) => `<p><b>${i + 1}.</b> ${p}</p>`).join('')}<p class="dim">Which passage helps a cyber cafe?</p>`, o, ['Passage 1', 'Passage 2', 'Passage 3'], pr, 'True, maybe. Useless for a cafe.'); notes.push(ps[pr]); }
        pc(`<h3>Notepad</h3>${notes.map((n, i) => `<p>${i + 1}. ${n}</p>`).join('')}`, { ...o, title:'Untitled - Notepad' }); E.obj('WRITE THREE NOTES.'); await H.choose(['Write the three notes']); E.obj('SAVE NOTES.'); await H.choose(['Save as CAFENOTES.TXT']); return 'saved'; };
      const res = await timed(run()); E.killDialog(); left = 0; pcOff();
      if(res !== 'saved'){ E.sfx('miss'); await H.say([['', `The screen goes dark. Dad needs the phone line.`]]); G.flags.S03_ATTEMPTED = true; G.noComplete = true; await H.banner('OUT OF TIME', `MIDNIGHT RESEARCH · notes found: ${notes.length} / 3 · you can try again`, true, 3600); E.cut(false); return; } // narration GO-STANDIN
      E.sfx('ok'); E.toast('Saved: CAFENOTES.TXT', 2600); await H.say([['', `The screen goes dark. Dad needs the phone line.`], [C, `Perfect. I researched a business I still haven't made. That sounds about right.`]]);
      await H.banner('SIDE MISSION PASSED', 'MIDNIGHT RESEARCH<br>Research notes collected. (The project is not done.)'); Object.assign(G.flags, { S03_DONE:true, RESEARCH_NOTES_COLLECTED:true, ENCARTA_RESEARCH_NOTES:true }); E.cut(false); } ] };

// =================== S04 — PICKUP SHIFT ===================
const SHIFT = 480; // real seconds for the four in-story hours (6:00–10:00 PM)
export const S04 = { title:'Pickup Shift', sub:'SIDE MISSION · GAME ORIGINAL', where:'Schnucks staff entrance', needs:'M09', start:{ x:177, z:354 },
  setup(){ base(); E.setTime('dusk'); E.setOutfit(work); clock('PICKUP SHIFT', '6:00 PM'); },
  stages:[ async () => { E.place(168.6, 359, -Math.PI / 2); const jacob = mnpc(JC, G.CAST.jacob, 164.6, 360.4), mia = mnpc(MIA, G.CAST.mia, 164.2, 357.6), L = G.lanes[1]; [jacob, mia].forEach(n => face(n, P.p)); E.cut(true); faceP(jacob); await H.shot([169, 2.1, 354.6], [165, 1.4, 359.4], 0);
      await H.say([[JC, `Chris, we've got a four-hour pickup shift. How many orders can you bag without making somebody cry?`], [C, `Is that a requirement or a challenge?`], [MIA, `Please just put the eggs on top.`]]); E.cut(false);
      E.obj('CLOCK IN.'); await H.interact(G.timeClock.x, G.timeClock.z, 'CLOCK IN', 2); E.sfx('ok'); mia.go([[150, 356], [L.x + .2, L.z - 1]], 6); const andrew = mnpc(AN, G.CAST.andrew, G.lanes[2].x + .2, G.lanes[2].z - 1, { face:-Math.PI / 2 });
      E.obj('BAG AS MANY ORDERS AS POSSIBLE.'); await H.interact(L.x - .6, L.z - 2.4, 'START THE SHIFT', 3); const r = await playBag({ title:'PICKUP SHIFT', time:SHIFT, label:'4-HOUR SHIFT (COMPRESSED)' }); E.setTime('night'); clock('PICKUP SHIFT', '10:00 PM');
      if(!SV.s04best || r.clean > SV.s04best) SV.s04best = r.clean; save(); E.obj('CLOCK OUT.'); await H.interact(G.timeClock.x, G.timeClock.z, 'CLOCK OUT', 2); E.sfx('ok'); andrew.at(165.4, 360.6); mia.stop(); mia.at(165, 358.2); [andrew, mia].forEach(n => face(n, P.p)); E.cut(true); faceP(andrew); await two(P.p, andrew, 1, 3.6);
      await H.say([[AN, `How many did you get through?`], [C, `${r.clean * 2 + 3}.`], [MIA, `It was ${r.clean}.`]]); // GO-STANDIN (the Bible describes this beat, no lines)
      await H.banner('SIDE MISSION PASSED', `PICKUP SHIFT<br>Clean orders: ${r.clean} of ${r.total} bagged · Best: ${SV.s04best}`, false, 5200); G.flags.S04_DONE = true; E.cut(false); E.obj('RETURN HOME.'); } ] };

// =================== S05 — THE LONGEST TRAIN ===================
const BASELINE = 12, MAXTRAIN = 20;
export const S05 = { title:'The Longest Train', sub:'SIDE MISSION · GAME ORIGINAL', where:'the Schnucks parking lot', needs:'M09', start:{ x:105, z:314 },
  setup(){ base(); E.setTime('after'); E.setOutfit(work); clock('THE LONGEST TRAIN', ''); },
  stages:[ async () => { E.place(105, 318, 0); const mad = mnpc(MD, G.CAST.madison, 107.4, 321.4); face(mad, P.p); E.obj('HEAR MADISON’S CHALLENGE.'); await H.interact(() => mad.p.x, () => mad.p.z, 'TALK TO MADISON', 2.6); E.cut(true); faceP(mad); await two(P.p, mad, 1, 3.6);
      await H.say([[MD, `Bet you can't push a longer row than me.`], [C, `You're talking to the worst bagger in the county. Carts are my specialty.`], [MD, `That is not the brag you think it is.`]]); E.cut(false); },
    async () => { E.place(105, 322, Math.PI); const mad = mnpc(MD, G.CAST.madison, 109, 334, { face:Math.PI }); G.corrals.forEach(c => fillCorral(c, 5)); clearTrain(); startPushing(); const tEl = $('timer'), cEl = $('carts'); tEl.style.display = cEl.style.display = 'block';
      const sp = P.speed, spr = P.sprint; later(() => { P.speed = sp; P.sprint = spr; }); let prep = 180, lap = false, lost = 0, last = P.model.rotation.y, hot = 0;
      G.corrals.forEach(c => minter({ x:c.x, z:c.z - 3.4, r:3, prompt:`GRAB CARTS (C${String(c.n).padStart(2, '0')})`, when:() => !lap && c.carts.length && train.length < MAXTRAIN, use:() => grabFrom(c, MAXTRAIN) }));
      mtick(dt => { const n = train.length, k = Math.max(.42, 1 - n * .028); P.speed = sp * k; P.sprint = spr * k; if(!lap) prep -= dt; let d = P.model.rotation.y - last; last = P.model.rotation.y; while(d > Math.PI) d -= 6.283; while(d < -Math.PI) d += 6.283;
        const rate = Math.abs(d) / Math.max(dt, .001); hot = n > 6 && rate > 3.4 - n * .11 ? hot + dt : 0; if(hot > .22){ hot = 0; const c = train.pop(); lost++; later(() => G.scene.remove(c)); E.sfx('miss'); E.toast('A cart broke away. Wide turns with a long train.', 2400); }
        tEl.textContent = lap ? 'LAP' : `${String(Math.max(0, prep) / 60 | 0).padStart(2, '0')}:${String(Math.max(0, prep) % 60 | 0).padStart(2, '0')}`; cEl.textContent = `TRAIN ${n}\nMADISON ${BASELINE}\nBROKE AWAY ${lost}`; });
      E.obj(`BUILD A CART TRAIN. (3 minutes — more than ${BASELINE} carts beats Madison) Then start the lap at the store entrance.`); let go = false; minter({ x:105, z:326.5, r:3, prompt:'START THE LAP', when:() => !lap && train.length > 0, use:() => { go = true; } }); await H.until(() => go || prep <= 0); lap = true; E.sfx('bell');
      if(!train.length){ tEl.style.display = cEl.style.display = 'none'; emptyCorrals(); return fail('You never built a train.'); }
      E.obj('PUSH IT THROUGH THE COURSE. (around the lot, then into the cart bay)'); await H.reach(66, 298, 5); await H.reach(144, 298, 5); await H.interact(G.cartBay.x, G.cartBay.z, 'PARK THE TRAIN', 4); const n = train.length; deliver(); E.sfx('ok'); tEl.style.display = cEl.style.display = 'none'; P.speed = sp; P.sprint = spr;
      if(!SV.s05best || n > SV.s05best) SV.s05best = n; save(); E.obj('COMPARE RESULTS.'); E.cut(true); mad.at(P.p.x + 1.6, P.p.z + 2); face(mad, P.p); faceP(mad); await two(P.p, mad, 1, 3.6);
      if(n > BASELINE){ await H.say([[MD, `Fine. You win. Just don't tell Eric I said that.`], [C, `I am telling Eric immediately.`]]); await H.banner('SIDE MISSION PASSED', `THE LONGEST TRAIN<br>Your train: ${n} · Madison: ${BASELINE} · Best: ${SV.s05best}`, false, 5200); G.flags.S05_DONE = true; }
      else { await H.banner('MADISON WINS', `Your train: ${n} · Madison: ${BASELINE}`, true, 3400); const k = await H.choose(['Go again', 'Call it a day']); if(k === 0){ emptyCorrals(); return fail('Madison is waiting.'); } G.noComplete = true; } // losing prompt GO-STANDIN
      emptyCorrals(); clearTrain(); E.cut(false); } ],
  done(){ emptyCorrals(); } };

// =================== S06 — PICKUP GAME ===================
export const S06 = { title:'Pickup Game', sub:'SIDE MISSION · GAME ORIGINAL', where:'the court at Elmwood Park', needs:'M05', avail:d => d.M05 && !d.M08, start:{ x:-67, z:63 },
  setup(){ base(); E.setTime('after'); E.setOutfit({}); clock('SIDE MISSION', ''); },
  stages:[ async () => { E.place(-66, 64.4, .6); const jax = mnpc(JX, LOOK.jax, -63.6, 67.6), milo = mnpc(MI, LOOK.milo, -61.4, 66); [jax, milo].forEach(n => face(n, P.p)); E.cut(true); faceP(jax); await H.shot([-68.4, 2, 61.6], [-63, 1.4, 67], 0);
      await H.say([[C, `I better not be the only one here who knows what a free throw is.`], [MI, `I'll count. Because apparently neither of you passed math.`], [JX, `Bro, it's basketball, not your SAT.`]]);
      const a = await playDuel({ title:'PICKUP GAME · VS JAX', foe:'Jax', to:11, skill:.55, shirt:'#2a6a3a', skin:'#c48a5e' }); E.cut(true); E.toast(`CHRIS ${a.me} · JAX ${a.cpu}`, 3000); await H.wait(1400);
      const b = a.quit ? { me:0, cpu:0, quit:true } : await playDuel({ title:'PICKUP GAME · VS MILO', foe:'Milo', to:11, skill:.42, shirt:'#4a6ab8' }); E.cut(true); if(a.quit || b.quit){ G.noComplete = true; E.cut(false); return; }
      const wins = (a.me > a.cpu) + (b.me > b.cpu); await H.shot([-68.4, 2, 61.6], [-63, 1.4, 67], 400); await H.say([['', `Milo read out the final scores like a tax return. Jax took it personally. I asked if we could all just go eat.`]]); // GO-STANDIN
      await H.banner('SIDE MISSION PASSED', `PICKUP GAME<br>vs Jax ${a.me}–${a.cpu} · vs Milo ${b.me}–${b.cpu} · ${wins} of 2 won`, false, 5200); G.flags.S06_DONE = true; E.cut(false); } ] };

// =================== S07 — PHONE TROUBLES ===================
// Household checks only: handsets and a plug-in cord. No wiring, no poles, no outside box.
export const S07 = { title:'Phone Troubles', sub:'SIDE MISSION · GAME ORIGINAL', where:'your kitchen', needs:'M08', avail:d => d.M08, start:{ x:4.8, z:-3 },
  setup(){ base(); E.setTime('dusk'); E.setOutfit({}); clock('GROUNDED', ''); },
  stages:[ async () => { E.place(3.4, -3.2, Math.PI / 2); const dad = mnpc(DAD, LOOK.dad, 5.6, -2.2), mom = mnpc(MOM, LOOK.mom, 3.2, -6.4); [dad, mom].forEach(n => face(n, P.p)); const crackle = () => { for(let i = 0; i < 6; i++) E.tone(900 + Math.random() * 2400, i * .07, .05, 'square', .02); }, tone = () => { E.tone(350, 0, 1.4, 'sine', .04); E.tone(440, 0, 1.4, 'sine', .04); };
      E.cut(true); faceP(dad); crackle(); await two(P.p, dad, 1, 3.8); await H.say([['', `The landline crackled. The repair company was delayed. Again.`], [C, `So the phone company has a phone they can answer, but we don't? That's poetic.`], [DAD, `Since you can't go anywhere, you can at least help me figure this out.`], [MOM, `Don't make it worse.`]]); E.cut(false); // first line GO-STANDIN
      E.obj('PICK UP THE PHONE.'); await H.interact(G.phone.x, G.phone.z, 'PICK UP THE KITCHEN PHONE', 2); crackle(); E.toast('Static. No dial tone.', 2600);
      E.obj('CHECK HOUSE HANDSETS. (the cordless in the living room)'); await H.interact(G.phone2.x, G.phone2.z, 'TRY THE CORDLESS', 2); crackle(); E.toast('Same static. So it is not just one phone.', 3000);
      E.obj('CHECK HOUSE HANDSETS. (back at the kitchen phone)'); await H.interact(G.phone.x, G.phone.z, 'CHECK THE KITCHEN PHONE', 2); E.cut(true); await H.shot([4.4, 2.1, -3.4], [7.4, 1.5, -1.2], 500);
      for(;;){ const k = await H.choose(['Push the handset cord back in', 'Look at the long extension cord to the wall', 'Shake the phone']); if(k === 1) break; crackle(); E.toast(k === 0 ? 'It was already in. Still static.' : 'Mom: “Don’t make it worse.”', 2600); }
      E.toast('The extension cord is kinked and cracked near the plug.', 3200); E.sfx('ok'); E.cut(false);
      E.obj('FIND SPARE CORD. (the junk box in your closet, upstairs)'); await H.interact(G.closet.x, G.closet.z, 'DIG OUT A SPARE PHONE CORD', 2, 3.2); E.sfx('ok'); E.toast('One spare phone cord. Still in the twist tie.', 2600);
      E.obj('TEST DIAL TONE. (swap the cord at the kitchen phone)'); await H.interact(G.phone.x, G.phone.z, 'SWAP THE CORD', 2); E.sfx('door'); await H.wait(600); tone(); E.toast('Dial tone.', 2400); await H.wait(1500);
      E.obj('CONFIRM THE PHONE WORKS.'); await H.interact(() => dad.p.x, () => dad.p.z, 'TELL DAD IT WORKS', 2.6); E.cut(true); face(dad, P.p); faceP(dad); await two(P.p, dad, 1, 3.6); await H.say([['', `Dad said thanks. Barely. Even my grounding has side quests.`]]); // GO-STANDIN
      await H.banner('SIDE MISSION PASSED', 'PHONE TROUBLES'); Object.assign(G.flags, { S07_DONE:true, PHONE_FIXED:true }); E.cut(false); } ] };
void standP;
