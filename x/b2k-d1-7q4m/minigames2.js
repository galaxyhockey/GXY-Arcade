// Back in the 2000s: The Game — Draft #2 mini-games on the #mg canvas (GAME ORIGINAL mechanics).
// Anything the book fixes (Sam's strikes, Chris scoring and blocking in PE) is fixed here too, whatever the player does.
//   duel      — 1 on 1 basketball (PE with Zeke, pickup game with Jax and Milo)
//   bowling   — three frames with Sam
//   airHockey — The Edge, against Jax
//   bag       — bagging groceries: heavy on the bottom, fragile on top
import * as E from './engine.js';
import { open, run } from './minigames.js';
const W = 960, H = 540;
const meter = (g, m, zone) => { g.fillStyle = '#0a0e1e'; g.fillRect(180, 462, 600, 30); g.fillStyle = '#c8202a'; g.fillRect(184, 466, 592, 22); g.fillStyle = '#3ad86a'; g.fillRect(184 + 592 * zone[0], 466, 592 * zone[1], 22); g.fillStyle = '#fff'; g.fillRect(184 + 592 * m - 3, 458, 6, 38); };
const sweep = (s, dt, sp) => { s.m += s.dir * sp * dt; if(s.m > 1){ s.m = 1; s.dir = -1; } if(s.m < 0){ s.m = 0; s.dir = 1; } };
const guy = (g, x, y, shirt, skin = '#efc29e') => { g.fillStyle = shirt; g.fillRect(x - 13, y - 60, 26, 60); g.fillStyle = skin; g.fillRect(x - 11, y - 88, 22, 26); g.fillStyle = '#3a4a6a'; g.fillRect(x - 13, y, 26, 24); };

// Offense: stop the marker in the green to score. Defense: stop it in the green to block.
// o.script (e.g. ['o','d','o']) plays fixed beats, each repeated until you get it.
export async function playDuel(o = {}){ const foe = o.foe || 'Zeke', to = o.to || 11, script = o.script, ui = open(o.title || '1 ON 1', 'OFFENSE: SPACE in the green to score - DEFENSE: SPACE in the green to block - ESC quit'), { g, press, text } = ui;
  let me = o.start ? o.start[0] : 0, cpu = o.start ? o.start[1] : 0, k = 0, ph = 'o', s = { m:0, dir:1 }, zone = [.4, .2], st = 'aim', anim = 0, good = false, foeMade = false, sweeps = 0;
  const next = p => { ph = p; st = 'aim'; s.m = Math.random() * .15; s.dir = 1; sweeps = 0; const w = script ? .3 : Math.max(.1, .2 - (me + cpu) * .005); zone = [.2 + Math.random() * (.6 - w), w]; }; next(script ? script[0] : 'o');
  const shoot = hit => { good = hit; foeMade = ph === 'd' && !hit && !script && Math.random() < (o.skill ?? .55); st = 'fly'; anim = 0; E.sfx('cart'); };
  return run(ui, dt => { for(const p of press.splice(0)){ if(p === 'quit') return { me, cpu, quit:true }; if(p === 'act' && st === 'aim') shoot(s.m >= zone[0] && s.m <= zone[0] + zone[1]); }
    if(st === 'aim'){ const d0 = s.dir; sweep(s, dt, .8 + (script ? 0 : (me + cpu) * .025)); if(s.dir !== d0 && ph === 'd' && ++sweeps >= 3) shoot(false); }
    else if((anim += dt) >= 1.1){ if(ph === 'o' && good) me += 2; if(foeMade) cpu += 2; E.sfx(good ? 'ok' : 'miss');
      if(script){ if(good){ if(++k >= script.length) return { me, cpu }; next(script[k]); } else next(ph); }
      else { if(me >= to || cpu >= to) return { me, cpu }; next(ph === 'o' ? 'd' : 'o'); } }
    g.fillStyle = o.indoor ? '#6f6a62' : '#7fb6ea'; g.fillRect(0, 0, W, H); if(o.indoor){ g.fillStyle = '#6e1a26'; g.fillRect(0, 200, W, 26); } g.fillStyle = o.indoor ? '#d9b98a' : '#7d7f86'; g.fillRect(0, 380, W, 160);
    g.fillStyle = '#9aa0a6'; g.fillRect(760, 150, 10, 230); g.fillStyle = '#f4f4f0'; g.fillRect(700, 130, 70, 90); g.strokeStyle = '#e05a1a'; g.lineWidth = 6; g.beginPath(); g.ellipse(672, 222, 34, 9, 0, 0, 7); g.stroke();
    const off = ph === 'o', ax = 300, dx = 392; guy(g, off ? ax : dx, 356, '#2f5d8a'); guy(g, off ? dx : ax, 356, o.shirt || '#d8a020', o.skin);
    let bx = ax + 26, by = 300; if(st === 'fly'){ const u = Math.min(1, anim / .9), sc = off ? good : foeMade, blocked = !off && good;
      if(blocked){ bx = ax + 26 + u * 60 - u * u * 260; by = 300 - Math.sin(u * 3) * 90 + u * 80; } else { const miss = sc ? 0 : 70; bx = ax + 26 + (672 + miss - ax - 26) * u; by = 300 + (222 - 300) * u - Math.sin(u * Math.PI) * 190; }
      if(anim > .7) text(off ? (good ? 'BUCKET!' : 'BRICK') : (good ? 'BLOCKED!' : foeMade ? `${foe.toUpperCase()} SCORES` : script ? 'TOO LATE - AGAIN' : `${foe.toUpperCase()} MISSES`), W / 2, 120, 22, (off ? good : good || !foeMade) ? '#3ad86a' : '#ff5a6a', 'center'); }
    g.fillStyle = '#e05a1a'; g.beginPath(); g.arc(bx, by, 14, 0, 7); g.fill(); meter(g, s.m, zone); ui.frame();
    text(off ? 'YOUR BALL' : `${foe.toUpperCase()} HAS THE BALL - DEFEND`, W / 2, 40, 14, off ? '#3ad86a' : '#ffd23f', 'center'); text(`CHRIS ${me}  -  ${cpu} ${foe.toUpperCase()}`, W - 24, 40, 14, '#fff', 'right'); if(!script) text(`FIRST TO ${to}`, W - 24, 66, 9, '#9bb4ff', 'right'); }); }

// Stop the aim arrow near the middle of the lane. Sam's balls are always strikes.
// o.frames (default 3); o.sam === 'only' plays one Sam strike and ends; o.strikes = strikes Sam already has on the board.
export async function playBowling(o = {}){ const frames = o.frames || 3, only = o.sam === 'only', ui = open(o.title || 'BOWLING', only ? '' : 'SPACE to roll when the arrow is where you want it - ESC quit'), { g, press, text } = ui;
  const L0 = 380, LW = 200, pinsXY = []; for(let r = 0; r < 4; r++) for(let k = 0; k <= r; k++) pinsXY.push([L0 + LW / 2 + (k - r / 2) * 34, 132 - r * 22]);
  let f = 0, ball = 1, who = only ? 'sam' : 'chris', s = { m:.1, dir:1 }, st = only ? 'wait' : 'aim', anim = 0, tx = .5, up = pinsXY.map(() => true), fell = 0, total = 0, samX = o.strikes || 0, card = [], msg = '';
  const hit = (off, rem) => Math.abs(off) < .045 ? rem : Math.max(0, Math.min(rem, Math.round(rem - Math.abs(off) * 26 - Math.random() * 2)));
  const knock = n => { pinsXY.map((p, i) => [Math.abs(p[0] - (L0 + LW * tx)), i]).filter(a => up[a[1]]).sort((a, b) => a[0] - b[0]).slice(0, n).forEach(a => up[a[1]] = false); };
  const reset = () => { up = pinsXY.map(() => true); s.m = Math.random() * .2; s.dir = 1; };
  return run(ui, dt => { for(const p of press.splice(0)){ if(p === 'quit') return { chris:total, sam:samX, quit:true }; if(p === 'act' && st === 'aim'){ tx = s.m; st = 'roll'; anim = 0; E.sfx('cart'); } }
    if(st === 'aim') sweep(s, dt, .95 + f * .12);
    else if(st === 'wait'){ if((anim += dt) > .9){ tx = .5; st = 'roll'; anim = 0; E.sfx('cart'); } }
    else if(st === 'roll'){ if((anim += dt / 1.1) >= 1){ const rem = up.filter(Boolean).length; fell = who === 'sam' ? rem : hit(tx - .5, rem); knock(fell); st = 'show'; anim = 0; E.sfx(fell === rem ? 'ok' : fell ? 'cart' : 'miss');
        msg = fell === rem ? (ball === 1 || who === 'sam' ? 'STRIKE!' : 'SPARE!') : fell ? `${fell} PIN${fell > 1 ? 'S' : ''}` : 'GUTTER'; if(who === 'sam') samX++; else { total += fell; card[f] = (card[f] || '') + (fell === rem && ball === 1 ? 'X' : fell === rem ? '/' : fell) + ' '; } } }
    else if((anim += dt) > 1.3){ const clear = !up.some(Boolean);
      if(who === 'sam'){ if(only || ++f >= frames) return { chris:total, sam:samX }; who = 'chris'; ball = 1; reset(); st = 'aim'; }
      else if(ball === 1 && !clear){ ball = 2; s.m = Math.random() * .2; s.dir = 1; st = 'aim'; }
      else { who = 'sam'; ball = 1; reset(); st = 'wait'; anim = 0; } }
    g.fillStyle = '#1a1830'; g.fillRect(0, 0, W, H); g.fillStyle = '#141420'; g.fillRect(L0 - 26, 40, LW + 52, 420); g.fillStyle = '#c9a264'; g.fillRect(L0, 40, LW, 420); g.strokeStyle = 'rgba(120,90,40,.5)'; g.lineWidth = 1; for(let x = L0 + 20; x < L0 + LW; x += 20){ g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 460); g.stroke(); }
    g.fillStyle = '#7a5a2a'; [-60, -30, 0, 30, 60].forEach(d => { g.beginPath(); g.moveTo(L0 + LW / 2 + d, 330); g.lineTo(L0 + LW / 2 + d - 5, 344); g.lineTo(L0 + LW / 2 + d + 5, 344); g.fill(); });
    pinsXY.forEach((p, i) => { if(up[i]){ g.fillStyle = '#f4f2ea'; g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); g.fill(); g.fillStyle = '#c8202a'; g.fillRect(p[0] - 6, p[1] - 2, 12, 3); } });
    const bxp = L0 + LW * (st === 'aim' ? s.m : tx), byp = st === 'roll' ? 440 - anim * 330 : 440; if(st !== 'show'){ g.fillStyle = who === 'sam' ? '#c8202a' : '#2a5ac8'; g.beginPath(); g.arc(bxp, byp, 15, 0, 7); g.fill(); }
    if(st === 'aim'){ g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bxp, 400); g.lineTo(bxp - 8, 416); g.lineTo(bxp + 8, 416); g.fill(); }
    ui.frame(); text(who === 'sam' ? 'SAM IS UP' : `CHRIS - BALL ${ball}`, W / 2, 30, 14, who === 'sam' ? '#ff8ad0' : '#9bd0ff', 'center'); if(st === 'show') text(msg, W / 2, 250, 26, msg.includes('STRIKE') || msg.includes('SPARE') ? '#3ad86a' : '#fff', 'center');
    text('CHRIS', 40, 110, 12, '#9bd0ff'); if(!only){ for(let i = 0; i < frames; i++) text(card[i] || '-', 40, 140 + i * 26, 12); text(`PINS ${total}`, 40, 150 + frames * 26, 12, '#ffd23f'); }
    text('SAM', 700, 110, 12, '#ff8ad0'); text('X '.repeat(samX), 700, 140, 12); text(`${samX} STRIKE${samX === 1 ? '' : 'S'} IN A ROW`, 700, 170, 9, '#ffd23f'); }); }

// A/D (or arrows) to slide your paddle. First to o.to. Returns [chris, foe].
export async function playAirHockey(o = {}){ const foe = o.foe || 'Jax', to = o.to || 3, ui = open(o.title || 'AIR HOCKEY', 'A / D or ARROWS move your paddle - ESC quit'), { g, press, keys, text } = ui;
  const X0 = 300, X1 = 660, Y0 = 50, Y1 = 470, GW = 130; let px = 480, ax = 480, me = 0, cpu = 0, pk, pause = .8; const serve = d => { pk = { x:480, y:260, vx:(Math.random() - .5) * 240, vy:d * 250 }; pause = .7; }; serve(1);
  return run(ui, dt => { for(const p of press.splice(0)) if(p === 'quit') return [me, cpu, true];
    const mv = (keys.KeyA || keys.ArrowLeft ? -1 : 0) + (keys.KeyD || keys.ArrowRight ? 1 : 0); px = Math.max(X0 + 40, Math.min(X1 - 40, px + mv * 420 * dt)); const want = pk.vy < 0 ? pk.x : 480, sp = (o.speed || 230) * dt; ax += Math.max(-sp, Math.min(sp, want - ax)); ax = Math.max(X0 + 40, Math.min(X1 - 40, ax));
    if(pause > 0) pause -= dt; else { pk.x += pk.vx * dt; pk.y += pk.vy * dt; if(pk.x < X0 + 12){ pk.x = X0 + 12; pk.vx = Math.abs(pk.vx); } if(pk.x > X1 - 12){ pk.x = X1 - 12; pk.vx = -Math.abs(pk.vx); }
      const bat = (bx, by, dir) => { if(Math.abs(pk.y - by) < 20 && Math.abs(pk.x - bx) < 52 && pk.vy * dir < 0){ pk.vy = dir * Math.min(560, Math.abs(pk.vy) * 1.06 + 14); pk.vx = Math.max(-420, Math.min(420, pk.vx + (pk.x - bx) * 5)); E.sfx('cart'); } }; bat(px, Y1 - 34, -1); bat(ax, Y0 + 34, 1);
      const inGoal = Math.abs(pk.x - 480) < GW / 2; if(pk.y < Y0 + 10){ if(inGoal){ me++; E.sfx('ok'); if(me >= to) return [me, cpu]; serve(1); } else { pk.y = Y0 + 10; pk.vy = Math.abs(pk.vy); } }
      if(pk.y > Y1 - 10){ if(inGoal){ cpu++; E.sfx('miss'); if(cpu >= to) return [me, cpu]; serve(-1); } else { pk.y = Y1 - 10; pk.vy = -Math.abs(pk.vy); } } }
    g.fillStyle = '#10121c'; g.fillRect(0, 0, W, H); g.fillStyle = '#1f4a8a'; g.fillRect(X0 - 14, Y0 - 14, X1 - X0 + 28, Y1 - Y0 + 28); g.fillStyle = '#eef4ff'; g.fillRect(X0, Y0, X1 - X0, Y1 - Y0); g.strokeStyle = '#c8202a'; g.lineWidth = 3; g.beginPath(); g.moveTo(X0, 260); g.lineTo(X1, 260); g.stroke(); g.beginPath(); g.arc(480, 260, 46, 0, 7); g.stroke();
    g.fillStyle = '#10121c'; g.fillRect(480 - GW / 2, Y0 - 14, GW, 14); g.fillRect(480 - GW / 2, Y1, GW, 14); g.fillStyle = '#2a5ac8'; g.beginPath(); g.arc(px, Y1 - 34, 24, 0, 7); g.fill(); g.fillStyle = o.color || '#2a6a3a'; g.beginPath(); g.arc(ax, Y0 + 34, 24, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(pk.x, pk.y, 12, 0, 7); g.fill();
    ui.frame(); text(`CHRIS ${me}`, 40, 420, 14, '#9bd0ff'); text(`${foe.toUpperCase()} ${cpu}`, 40, 110, 14, '#ffd23f'); text(`FIRST TO ${to}`, 40, 260, 9, '#9bb4ff'); }); }

// A/D picks an item, SPACE bags it. Never put an item on top of something lighter.
// o.orders = [[names...]] plays those orders; o.time (seconds) plays random orders until the shift clock runs out. Returns { clean, total }.
const GROC = { 'Canned soup':3, 'Milk':3, '2-liter soda':3, 'Dog food':3, 'Laundry soap':3, 'Cereal':2, 'Frozen pizza':2, 'Lunch meat':2, 'Apples':2, 'Bananas':2, 'Ice cream':2, 'Chips':1, 'Paper towels':1, 'Tortillas':1, 'Bread':0, 'Eggs':0 };
const TAG = ['FRAGILE', 'LIGHT', 'MEDIUM', 'HEAVY'], TCOL = ['#ff8ad0', '#9bd0ff', '#ffd23f', '#ff7a4a'];
export async function playBag(o = {}){ const ui = open(o.title || 'BAGGING', 'A / D pick an item - SPACE bag it - heavy first, fragile last - ESC quit'), { g, press, text } = ui, names = Object.keys(GROC);
  const rnd = () => { const n = 3 + (Math.random() * 3 | 0), set = []; while(set.length < n){ const k = names[Math.random() * names.length | 0]; if(!set.includes(k)) set.push(k); } if(!set.some(k => GROC[k] === 0)) set[0] = Math.random() < .5 ? 'Bread' : 'Eggs'; if(!set.some(k => GROC[k] === 3)) set[1] = 'Milk'; return set.sort(() => Math.random() - .5); };
  let q = (o.orders || []).map(a => a.slice()), belt = [], bag = [], cur = 0, clean = 0, total = 0, dirty = false, left = o.time || 0, flash = 0, msg = '', gap = 0, roll = 0;
  const load = () => { belt = (q.length ? q.shift() : rnd()).slice(); bag = []; cur = 0; dirty = false; }; load();
  return run(ui, dt => { if(o.time && (left -= dt) <= 0) return { clean, total }; flash -= dt; roll += dt * 40;
    for(const p of press.splice(0)){ if(p === 'quit') return { clean, total, quit:true }; if(gap > 0 || !belt.length) continue; if(p === 'left') cur = (cur + belt.length - 1) % belt.length; if(p === 'right') cur = (cur + 1) % belt.length;
      if(p === 'act'){ const it = belt.splice(cur, 1)[0], top = bag[bag.length - 1]; if(top && GROC[it] > GROC[top]){ dirty = true; msg = `${it.toUpperCase()} ON THE ${top.toUpperCase()}. CRUSHED.`; flash = 1.4; E.sfx('miss'); } else E.sfx('cart'); bag.push(it); cur = Math.min(cur, Math.max(0, belt.length - 1));
        if(!belt.length){ total++; if(!dirty){ clean++; msg = 'CLEAN ORDER'; E.sfx('ok'); } flash = 1.1; gap = .9; } } }
    if(gap > 0 && (gap -= dt) <= 0){ if(!o.time && !q.length) return { clean, total }; load(); }
    g.fillStyle = '#e9e4d6'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8102e'; g.fillRect(0, 0, W, 64); g.fillStyle = '#3a3a3e'; g.fillRect(40, 300, 620, 90); g.fillStyle = '#55555a'; for(let x = 40 + (roll % 40); x < 656; x += 40) g.fillRect(x, 300, 4, 90);
    belt.forEach((it, i) => { const x = 60 + i * 120, w = GROC[it], top = 230 - w * 14; g.fillStyle = i === cur ? '#fff' : '#d8d2c0'; g.fillRect(x, top, 104, 70 + w * 14); g.strokeStyle = i === cur ? '#c8102e' : '#8a8478'; g.lineWidth = i === cur ? 5 : 2; g.strokeRect(x, top, 104, 70 + w * 14);
      g.font = '10px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillStyle = '#222'; it.split(' ').forEach((wd, k) => g.fillText(wd, x + 52, top + 28 + k * 14)); g.fillStyle = TCOL[w]; g.fillRect(x, 284, 104, 16); g.fillStyle = '#111'; g.font = '8px "Press Start 2P", monospace'; g.fillText(TAG[w], x + 52, 296); });
    g.fillStyle = '#b89a6a'; g.fillRect(720, 150, 190, 300); g.fillStyle = '#a0845a'; g.fillRect(720, 150, 190, 12); bag.forEach((it, i) => { const y = 404 - i * 46; g.fillStyle = TCOL[GROC[it]]; g.fillRect(734, y, 162, 40); g.fillStyle = '#111'; g.font = '9px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText(it, 815, y + 25); });
    ui.frame(); text(o.who ? `ORDER FOR ${o.who}` : `CLEAN ORDERS ${clean} / ${total}`, W - 24, 40, 12, '#fff', 'right'); if(o.time){ const u = 1 - Math.max(0, left) / o.time, m = 18 * 60 + u * 240; text(`${(m / 60 | 0) - 12}:${String(m % 60 | 0).padStart(2, '0')} PM`, W / 2, 40, 16, '#fff', 'center'); text(o.label || '', W / 2, 92, 9, '#555', 'center'); }
    text('BAG', 815, 140, 12, '#5a4a2a', 'center'); if(flash > 0) text(msg, 350, 150, 14, msg.includes('CLEAN') ? '#1f8a3a' : '#c8102e', 'center'); }); }
