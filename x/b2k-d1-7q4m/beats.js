// Back in the 2000s: The Game — story beats between missions (free roam). All lines here are GAME ORIGINAL and stay inside canon:
// Eric is the boss who is always short-staffed, Mom calls him "Chrissy", Milo is the smart one, Zeke has bad ideas, Pepper escapes.
// One beat can run at a time; each fires once per save, with a few game-hours between them.
import * as E from './engine.js';
const { THREE, G, P } = E;
let api = null, active = null, checkT = 3, stuff = [];
const L = () => api.L(), now = l => (l.dayCount || 0) * 1440 + l.min, atHome = () => P.p.x > -8 && P.p.x < 8 && P.p.z > -12 && P.p.z < 4;
const done = (id, toast) => { const l = L(); (l.beats = l.beats || {})[id] = true; l.beatAt = now(l); end(); api.save(); if(toast) E.toast(toast, 3600); E.sfx('pass'); };
function end(){ stuff.forEach(x => x.remove ? x.remove() : x.isObject3D ? G.scene.remove(x) : E.delInter(x)); stuff = []; if(active && active.mk) E.clearMarker(active.mk); active = null; E.setWay(); E.obj(''); }
const npc = (name, look, x, z, o) => { const n = E.npc(name, look, x, z, o); stuff.push(n); return n; };
const inter = o => { const i = E.addInter({ when:() => G.ctl && !G.mission && !G.uiOpen, ...o }); stuff.push(i); return i; };
const goal = (x, z, text) => { if(active.mk) E.clearMarker(active.mk); active.mk = E.marker(x, z, 0xff8ad8); E.setWay(x, z); E.obj(text); };
const LK = k => (G.LOOK || {})[k] || {};

const BEATS = [
  { id:'eric_call', when:l => atHome() && P.p.y < 1 && l.min > 600 && l.min < 960 && (G.SVdone || {}).M02, start(){ const ring = setInterval(() => active && active.id === 'eric_call' && !active.answered && E.sfx('ring'), 1500); stuff.push({ remove:() => clearInterval(ring) });
      goal(G.phone.x, G.phone.z, 'The phone is ringing.'); inter({ x:G.phone.x, z:G.phone.z, r:1.8, prompt:'ANSWER THE PHONE', use:async () => { active.answered = true; E.cut(true); api.phoneUp(true); await E.camShot([4.4, 2.1, -3.4], [7.4, 1.5, -1.2], 400);
        await E.say([['Eric (phone)', 'Chris. Two people called out. I need you on carts tonight.'], ['Chris', 'It’s my day off, Eric.'], ['Eric (phone)', 'I know what day it is. Are you coming in or not?']]);
        const k = await E.choose(['Fine. I’ll be there by 6.', 'Can’t. I’m super busy.']); const l = L();
        if(k === 0){ await E.say([['Eric (phone)', 'Six o’clock. Don’t make me regret this.']]); l.owed = { by:(l.dayCount || 0) * 1440 + 18 * 60 + 15 }; api.phoneUp(false); E.cut(false); done('eric_call', 'Clock in at Schnucks before 6:15 PM.'); }
        else { await E.say([['Eric (phone)', 'Busy doing what? ...Forget it.'], ['', 'He hung up. Worth it.']]); api.rep(-4); api.phoneUp(false); E.cut(false); done('eric_call'); } } }); } },
  { id:'mom_list', when:l => atHome() && P.p.y < 1 && l.min > 480 && l.min < 1020 && [0, 6].includes(new Date(2003, 8, 26 + (l.dayCount || 0)).getDay()), start(){ const mom = npc('Mom', LK('mom'), 4.6, -7.4, { face:Math.PI }); let got = 0, paid = false;
      goal(4.6, -6.4, 'Mom wants you in the kitchen.'); inter({ x:() => mom.p.x, z:() => mom.p.z, r:2.2, prompt:'TALK TO MOM', when:() => G.ctl && !active.given, use:async () => { E.cut(true); mom.look(P.p.x, P.p.z);
        await E.say([['Mom', 'Chrissy, be a dear and run to Schnucks for me.'], ['Chris', 'Mom. Chris. It’s Chris.'], ['Mom', 'Milk, eggs and bread, Chrissy. Here’s ten dollars. Bring back the change.']]); L().cash += 10; active.given = true; E.cut(false);
        goal(160, 384, 'SCHNUCKS RUN: grab milk (dairy), eggs (dairy) and bread (bakery). 0 / 3'); } });
      [[158, 384.6, 'GRAB MILK'], [162.5, 384.6, 'GRAB EGGS'], [59, 355, 'GRAB BREAD']].forEach(([x, z, p]) => { const it = inter({ x, z, r:2, prompt:p, when:() => G.ctl && active.given && !it.got, use:() => { it.got = true; got++; E.sfx('ok');
        if(got < 3) E.obj(`SCHNUCKS RUN: grab milk (dairy), eggs (dairy) and bread (bakery). ${got} / 3`); else goal(G.lanes[2].x, 345.5, 'Pay at a checklane.'); } }); });
      inter({ x:() => G.lanes[2].x, z:() => 345.5, r:2.4, prompt:'PAY ($7.63)', when:() => G.ctl && got === 3 && !paid, use:() => { if(!api.pay(7.63)) return; paid = true; goal(4.6, -6.4, 'Bring the groceries home to Mom.'); } });
      inter({ x:() => mom.p.x, z:() => mom.p.z, r:2.2, prompt:'GIVE MOM THE GROCERIES', when:() => G.ctl && paid, use:async () => { E.cut(true); await E.say([['Mom', 'Thank you, Chrissy. Did you get the change?'], ['Chris', '...There was no change.'], ['Mom', 'Mm-hm. Keep it. You’re a good boy.']]); E.cut(false); done('mom_list', 'ERRAND DONE · kept the change'); } }); } },
  { id:'milo_tape', when:l => (G.SVdone || {}).M03 && Math.hypot(P.p.x - 60, P.p.z - 310) < 90 && l.min > 600 && l.min < 1200, start(){ const milo = npc('Milo', LK('milo'), 38, 331.6, { face:Math.PI });
      goal(38, 330.4, 'Milo is waving at you outside Video World.'); inter({ x:() => milo.p.x, z:() => milo.p.z, r:2.4, prompt:'TALK TO MILO', when:() => G.ctl && !active.given, use:async () => { E.cut(true); milo.look(P.p.x, P.p.z);
        await E.say([['Milo', 'Chris. I need a favor and I need you to not ask questions.'], ['Chris', 'What did you do.'], ['Milo', 'This tape is eleven days late. I can’t go in there. The clerk knows my face.'], ['Milo', 'Here’s fifteen bucks. Pay the fee. Keep what’s left.']]);
        L().cash += 15; active.given = true; E.cut(false); goal(31, 335.9, 'Return Milo’s tape at the Video World counter.'); } });
      inter({ x:31, z:335.9, r:2, prompt:'RETURN MILO’S TAPE ($11 LATE FEE)', when:() => G.ctl && active.given, use:async () => { if(!api.pay(11)) return; E.cut(true); await E.say([['Clerk', 'Eleven days. “Kangaroo Jack.” Tell your friend he has to live with this.'], ['Chris', 'Oh, I will tell everybody.']]); E.cut(false); api.friend('Milo', 4); done('milo_tape', 'FAVOR DONE · kept $4 · Milo owes you one'); } }); } },
  { id:'zeke_dare', when:l => (L().owned || []).includes('board') && Math.hypot(P.p.x + 80, P.p.z - 60) < 45 && l.min > 780 && l.min < 1140 && !G.wet, start(){ const zeke = npc('Zeke', LK('zeke'), -80, 58, { face:Math.PI });
      goal(-80, 56.6, 'Zeke is yelling something at you in the park.'); inter({ x:() => zeke.p.x, z:() => zeke.p.z, r:2.4, prompt:'TALK TO ZEKE', when:() => G.ctl && !active.run, use:async () => { E.cut(true); zeke.look(P.p.x, P.p.z);
        await E.say([['Zeke', 'BRO. Five bucks says you can’t skate around the whole park in thirty seconds.'], ['Chris', 'You don’t have five bucks.'], ['Zeke', 'I have five bucks of CONFIDENCE.']]);
        if(await E.choose(['You’re on.', 'Not today.'])){ E.cut(false); done('zeke_dare'); return; } E.cut(false); P.board = true; const pts = [[-100, 56], [-100, 85], [-60, 85], [-60, 56], [-80, 56]]; let i = 0, left = 30; active.run = true; goal(pts[0][0], pts[0][1], 'SKATE THE LAP! 30');
        const t = dt => { if(!active || !active.run) return; left -= dt; E.obj(`SKATE THE LAP! ${Math.max(0, Math.ceil(left))}`); if(Math.hypot(P.p.x - pts[i][0], P.p.z - pts[i][1]) < 4){ i++; E.sfx('ok'); if(i < pts.length) goal(pts[i][0], pts[i][1], ''); }
          if(i >= pts.length){ active.run = false; L().cash += 5; api.friend('Zeke', 3); (async () => { E.cut(true); await E.say([['Zeke', 'NO WAY. Okay, okay. Here. It’s mostly quarters.']]); E.cut(false); done('zeke_dare', 'DARE WON · +$5.00 (in quarters)'); })(); }
          else if(left <= 0){ active.run = false; (async () => { E.cut(true); await E.say([['Zeke', 'HA! Too slow! You owe me five bucks of respect.']]); E.cut(false); done('zeke_dare'); })(); } };
        api.addTick(t); } }); } },
  { id:'pepper_out', when:l => atHome() && l.min > 420 && l.min < 1080 && (G.SVdone || {}).M02 && (l.dayCount || 0) >= 2, start(){ const spots = [[-80, 72], [60, 34], [96, 120], [-40, 16]], s = spots[Math.random() * spots.length | 0];
      const pep = npc('Pepper', { dog:true, color:'#efe6d6', dark:'#6a5a4a', size:.8 }, s[0], s[1], { speed:5 }); pep.blip = '#fff'; G.hidePepper = true; stuff.push({ remove:() => { G.hidePepper = false; } }); let found = false;
      E.toast('<b>Mom:</b> CHRISSY! The gate was open. Pepper is GONE!', 4200); E.sfx('bark'); goal(s[0], s[1], 'Pepper got out again. Find her. (white dot on the map)');
      const t = () => { if(!active || active.id !== 'pepper_out') return; if(!found && Math.hypot(P.p.x - pep.p.x, P.p.z - pep.p.z) < 2.6){ found = true; pep.follow(P, 1.5, 7); E.sfx('bark'); goal(0, -19, 'Bring Pepper back to the yard.'); }
        if(found && P.p.z < -13 && Math.abs(P.p.x) < 13){ api.friend('Mom', 1); L().cash += 5; done('pepper_out', 'PEPPER IS HOME · Mom slipped you $5'); } };
      api.addTick(t); } },
];

export function beatsOn(a){ api = a; end(); checkT = 6;
  api.addTick(dt => { if(G.mission || !G.ctl || G.uiOpen || G.onShift || G.driving) return; const l = L();
    // promised Eric a shift: clocking in (playing or skipping a shift) before the deadline counts; missing it costs reputation
    if(l.owed){ if(G.shiftStarted && now(l) <= l.owed.by + 5){ l.owed = null; G.shiftStarted = false; api.rep(6); E.toast('You showed up like you promised. Eric is almost impressed.', 3600); } else if(now(l) > l.owed.by){ l.owed = null; api.rep(-10); E.toast('<b>Eric (phone):</b> You said SIX. Unbelievable.', 4000); E.sfx('ring'); } }
    if(active || (checkT -= dt) > 0) return; checkT = 4; if(l.beatAt != null && now(l) - l.beatAt < 200) return; l.beats = l.beats || {};
    const b = BEATS.find(b => !l.beats[b.id] && b.when(l)); if(b){ active = { id:b.id }; b.start(); } });
  api.onOff(() => end()); }
