// Back in the 2000s: The Game — playable Schnucks shift (free roam, GAME ORIGINAL). 5 game hours ≈ 5 real minutes.
// Customers drain the cart bay and refill the corrals; Eric radios hourly cart runs; checklanes call for a bagger; some
// orders become carryouts (tips). Eric's patience drops when jobs are ignored or Chris hides in the break room.
import * as E from './engine.js';
import { repDelta, wage } from './extras.js';
import { save, newCart, train, clearTrain, startPushing, grabFrom, deliver, fillCorral, emptyCorrals } from './game.js';
const { G, P } = E; const $ = id => document.getElementById(id);
const SPOTS = [[70, 276], [130, 276], [160, 302], [90, 302], [40, 318], [180, 318], [210, 276], [20, 302]];
const money = n => '$' + n.toFixed(2);

function addCart(c){ const m = newCart(); m.position.set(c.x, 0, c.z + 2.2 - c.carts.length * .55); m.rotation.y = Math.PI; G.scene.add(m); c.carts.push(m); c.initial = (c.initial || 0) + 1; }
export async function playShift(life, randomLook){ const { L, passTime } = life, l = L(); if(G.onShift) return; G.onShift = true;
  const S = { el:0, stock:16, pat:70, tips:0, carts:0, bags:0, outs:0, req:null, run:null, out:null, nextCust:4, nextBag:12, lastHour:Math.floor(l.min / 60), warned:{} };
  const inters = [], marks = []; const addI = o => { inters.push(E.addInter(o)); return o; };
  G.shiftStarted = true; E.setOutfit({ vest:'#c8102e' }); emptyCorrals(); clearTrain(); startPushing();
  G.corrals.slice().sort(() => Math.random() - .5).slice(0, 5).forEach(c => { fillCorral(c, 3 + (Math.random() * 5 | 0)); });
  E.cut(true); await E.card('CLOCKED IN', '5 HOUR SHIFT · CARTS · BAGGING · CARRYOUTS', 2200);
  await E.say([['Eric', 'Keep the cart bay stocked, help the lanes when they call, and stay OUT of the break room.'], ['Chris', 'Define "stay out."']]); E.cut(false);
  const radio = t => { E.sfx('pa'); E.toast(`<b>Eric (radio):</b> ${t}`, 3400); };
  // corrals + cart bay
  G.corrals.forEach(c => addI({ x:c.x, z:c.z - 3.4, r:3, prompt:`GRAB CARTS (C${String(c.n).padStart(2, '0')})`, when:() => G.onShift && c.carts.length && train.length < 12 && !S.out, use:() => grabFrom(c, 12) }));
  addI({ x:G.cartBay.x, z:G.cartBay.z, r:4, prompt:'RETURN CARTS TO THE CART BAY', when:() => G.onShift && train.length > 0 && !S.out, use:() => { const n = deliver(); E.sfx('ok'); S.stock = Math.min(40, S.stock + n); S.carts += n; S.pat = Math.min(100, S.pat + n * .4);
    if(S.run){ S.run.got += n; if(S.run.got >= S.run.need){ S.pat = Math.min(100, S.pat + 8); radio('That’s the cart run. Good.'); S.run = null; } } } });
  // bagging requests at the lanes
  const bag = addI({ x:() => S.req ? S.req.lane.x - .2 : 0, z:() => 342.4, r:1.8, prompt:'BAG GROCERIES', when:() => G.onShift && S.req && !S.out, use:async () => { const r = S.req; S.req = null; E.clearMarker(r.mk); E.cut(true);
    const k = await E.choose(['Cans and jugs on the bottom, bread and eggs on top', 'Bread on the bottom', 'Just throw it all in one bag', 'Juggle the oranges first']);
    if(k === 0){ S.pat = Math.min(100, S.pat + 5); S.bags++; await E.say([['Customer', 'Oh, finally a bagger who knows what he’s doing.']]); }
    else if(k === 3){ S.pat -= 6; await E.say([['', 'I juggle three oranges. I drop all three. The lady stares at me like I’m a raccoon.'], ['Ryan', 'CHRIS.']]); }
    else { S.pat -= 3; S.bags++; await E.say([['Customer', k === 1 ? '...my bread is flat.' : 'One bag? Really?'], ['Chris', 'Yep.']]); }
    if(Math.random() < .45 && !train.length){ const spot = SPOTS[Math.random() * SPOTS.length | 0], cust = E.npc('Customer', randomLook(Math.random() < .5), r.lane.x + 1, 340.5, { speed:3.4 }); cust.follow(P, 2.2, 5);
      const c = newCart(); for(let i = 0; i < 3; i++){ const b = new E.THREE.Mesh(new E.THREE.BoxGeometry(.3, .35, .25), E.mat('#c9a878')); b.position.set(-.15 + i * .15, .7, 0); c.add(b); } G.scene.add(c); c.userData.from = { delivered:0 }; train.length = 0; train.push(c);
      const mk = E.marker(spot[0], spot[1], 0x7ee0ff); E.setWay(spot[0], spot[1]); S.out = { cust, spot, mk, cart:c }; await E.say([['Customer', 'Could you help me out to my car, hon?'], ['Chris', 'Sure thing.']]); }
    E.cut(false); } });
  const t = dt => { if(!G.onShift) return; if(G.paused || G.uiOpen) return; const dm = dt; S.el += dm;
    // customers
    if((S.nextCust -= dm) <= 0){ S.nextCust = 3 + Math.random() * 5; S.stock -= 1 + (Math.random() * 2 | 0); const c = G.corrals[Math.random() * G.corrals.length | 0]; if(c.carts.length < 10) addCart(c); }
    if(S.stock <= 0){ S.stock = 0; S.pat -= .35 * dm; if(!S.warned.out || S.el - S.warned.out > 30){ S.warned.out = S.el; radio('We are OUT of carts up front, Chris!'); } }
    // lanes
    if(!S.req && (S.nextBag -= dm) <= 0){ const lane = G.lanes[Math.random() * G.lanes.length | 0]; S.req = { lane, t:0, mk:E.marker(lane.x - .2, 342.4, 0xffd23f) }; S.nextBag = 14 + Math.random() * 16; radio(`Bagger to lane ${G.lanes.indexOf(lane) + 1}, please.`); }
    if(S.req){ S.req.t += dm; if(S.req.t > 15) S.pat -= .3 * dm; if(S.req.t > 35){ E.clearMarker(S.req.mk); S.req = null; S.pat -= 5; radio('Never mind, Ryan bagged it himself. Thanks for nothing.'); } }
    // hourly cart run
    const hr = Math.floor(l.min / 60); if(hr !== S.lastHour){ S.lastHour = hr; if(S.run && S.run.got < S.run.need){ S.pat -= 8; radio('You missed the cart run, Chris.'); } S.run = { need:8 + (Math.random() * 5 | 0), got:0 }; radio(`Cart run! Bring in ${S.run.need} carts.`); }
    // carryout
    if(S.out && Math.hypot(P.p.x - S.out.spot[0], P.p.z - S.out.spot[1]) < 3.5){ const o = S.out; S.out = null; E.clearMarker(o.mk); E.setWay(); G.scene.remove(o.cart); train.length = 0; const tip = [0, 1, 2, 2, 3, 5][Math.random() * 6 | 0];
      S.tips += tip; S.outs++; S.pat = Math.min(100, S.pat + 6); o.cust.stop(); E.toast(tip ? `Customer tipped you ${money(tip)}. Don’t tell Eric.` : 'Customer: "Thanks, sweetie." No tip. Classic.', 2800); setTimeout(() => o.cust.remove(), 2500); }
    // goofing off in the break room
    if(P.p.y > 3 && P.p.x > 66 && P.p.x < 84 && P.p.z > 366 && P.p.z < 388){ S.pat -= .25 * dm; if(!S.warned.br || S.el - S.warned.br > 25){ S.warned.br = S.el; radio('Chris, are you on break AGAIN?'); } }
    S.pat = Math.max(0, S.pat);
    const left = Math.max(0, 300 - S.el), bar = '█'.repeat(Math.round(S.pat / 10)) + '░'.repeat(10 - Math.round(S.pat / 10));
    const ce = $('carts'); ce.style.display = 'block'; ce.textContent = `SHIFT  ${left / 60 | 0}:${String(left % 60 | 0).padStart(2, '0')} LEFT\nCART BAY  ${S.stock}\nPUSHING  ${S.out ? 'CARRYOUT' : train.length + '/12'}\n` + (S.run ? `CART RUN  ${S.run.got}/${S.run.need}\n` : '') + (S.req ? `LANE ${G.lanes.indexOf(S.req.lane) + 1} NEEDS A BAGGER\n` : '') + `ERIC  ${bar}\nTIPS  ${money(S.tips)}`;
    const far = Math.hypot(P.p.x - 110, P.p.z - 340) > 230; if(S.el >= 300 || S.pat <= 0 || far) end(far ? 'walked' : S.pat <= 0 ? 'sent' : 'done'); };
  t.amb = true; G.ticks.push(t);
  async function end(why){ G.onShift = false; const i = G.ticks.indexOf(t); if(i >= 0) G.ticks.splice(i, 1); inters.forEach(E.delInter); if(S.req) E.clearMarker(S.req.mk); if(S.out){ E.clearMarker(S.out.mk); S.out.cust.remove(); G.scene.remove(S.out.cart); } E.setWay();
    clearTrain(); G.carry = null; emptyCorrals(); $('carts').style.display = 'none';
    const base = Math.round(wage() * S.el / 60 * 100) / 100, bonus = why === 'done' ? (S.pat >= 80 ? 5 : S.pat < 30 ? -8 : 0) : why === 'sent' ? -10 : 0, total = Math.max(0, base + bonus + S.tips);
    l.cash += total; repDelta(why === 'done' ? (S.pat >= 80 ? 8 : S.pat < 30 ? -8 : 2) : why === 'sent' ? -12 : -15); save(); E.setOutfit({}); E.cut(true);
    const line = { done:S.pat >= 80 ? ['Eric', 'Not bad, Chris. Don’t let it go to your head.'] : S.pat < 30 ? ['Eric', 'That was a disaster. I’m docking you.'] : ['Eric', 'You survived. Go home.'],
      sent:['Eric', 'Go home, Chris. Just... go home.'], walked:['Eric (phone)', 'Did you just WALK OFF? You’re only getting paid for what you worked.'] }[why];
    await E.say([line]); await E.banner(why === 'done' ? 'SHIFT COMPLETE' : 'SHIFT OVER', `Carts returned ${S.carts} · Bagged ${S.bags} · Carryouts ${S.outs}<br>Pay ${money(base)} ${bonus ? (bonus > 0 ? '+ bonus ' : '− ') + money(Math.abs(bonus)) : ''} + tips ${money(S.tips)} = <b>${money(total)}</b>`, why !== 'done', 4800);
    E.cut(false); }
}
