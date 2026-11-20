/* GXY Trivia — Online Room: one device hosts (shows a room code), everyone else joins on their own phone.
   Firestore layout:
     trivia_rooms/{CODE}                 written only by the host: state, current question, results, scores
     trivia_rooms/{CODE}/players/{uid}   written only by that player: name + their answer for the round
   The correct answer is never written until the reveal, so players can't peek at it.
   Uses the trivia.html globals: SETS, deck, draw, isRight, award, TIME, esc, store, buzz, cfg, app, home, $. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fbApp = getApps()[0] || initializeApp({
  apiKey: "AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ", authDomain: "gxyhockey.firebaseapp.com", projectId: "gxyhockey",
  storageBucket: "gxyhockey.firebasestorage.app", messagingSenderId: "474584991663", appId: "1:474584991663:web:b8986544418d6b85fa115a" });
const auth = getAuth(fbApp), db = getFirestore(fbApp);
const ROOM = c => doc(db, 'trivia_rooms', c), PL = (c, u) => doc(db, 'trivia_rooms', c, 'players', u);
const MAXP = 8, COLS = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#ec4899','#14b8a6','#f97316'];
let unsub = [], hostTick = null, plTick = null;
const stop = () => { unsub.forEach(f => f()); unsub = []; clearInterval(hostTick); clearInterval(plTick); };

async function me(){
  await auth.authStateReady();
  return auth.currentUser || (await signInAnonymously(auth)).user;  // GXY account users keep their login
}
function oops(e){
  console.error(e);
  const setup = /permission|admin.only|admin-restricted|operation-not-allowed|insufficient/i.test(String(e && (e.code || e.message)));
  app().innerHTML = `<div class="card"><h2>📱 Online Room</h2><p class="err" style="color:var(--bad);margin:.5rem 0">${setup
    ? 'Online rooms aren\'t switched on for this arcade yet (Firebase setup needed).' : 'Couldn\'t connect. Check your internet and try again.'}</p>
    <button class="btn ghost" onclick="onlineMenu()">Back</button></div>`;
}
const myName = () => store.get('tv_name', '') || '';
const code4 = () => Array.from({ length:4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');

/* ---------- menu ---------- */
window.onlineMenu = function(prefill){
  stop();
  app().innerHTML = `<div class="card"><h2>📱 Online Room</h2>
    <p class="dim">Everyone plays on their own phone. One screen hosts and shows the room code; players join from the arcade website or app and type answers in secret.</p>
    <label class="f">Your name</label><input type="text" id="oname" maxlength="14" value="${esc(myName())}" placeholder="Name">
    <label class="f">Join a room</label>
    <div style="display:flex;gap:8px"><input type="text" id="ocode" maxlength="4" value="${esc(prefill || '')}" placeholder="CODE" style="text-transform:uppercase;letter-spacing:.3em;font-weight:800;text-align:center">
      <button class="btn" style="margin:0;width:auto;padding:0 1.2rem" onclick="onlineJoin()">Join</button></div>
    <div class="dim" style="text-align:center;margin:1rem 0 .2rem">— or —</div>
    <label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><input type="checkbox" id="oplay" checked> I'm playing too (not just hosting)</label>
    <button class="btn ghost" onclick="onlineHost()">🎙️ Host a room · ${cfg.rounds} rounds</button>
    <p class="dim" style="font-size:.75rem;margin-top:.4rem">Uses the quiz sets and round count you picked on the main menu.</p>
    <button class="btn ghost" onclick="home()">Back</button></div>`;
};
function takeName(){
  const n = ($('oname').value || '').trim().slice(0, 14);
  if(!n){ $('oname').focus(); $('oname').style.borderColor = 'var(--bad)'; return null; }
  store.set('tv_name', n); return n;
}

/* ---------- host ---------- */
let H = null;
window.onlineHost = async function(){
  const name = takeName(); if(!name) return;
  const plays = $('oplay').checked;
  app().innerHTML = '<div class="card">Creating room…</div>';
  try{
    const u = await me();
    let code; for(let i = 0; i < 6; i++){ code = code4(); if(!(await getDoc(ROOM(code))).exists()) break; }
    await setDoc(ROOM(code), { host:u.uid, state:'lobby', round:0, rounds:cfg.rounds, created:Date.now() });
    if(plays) await setDoc(PL(code, u.uid), { name, joined:Date.now() });
    G = { deck:deck(cfg.sets), facts:new Set(), sets:cfg.sets.slice(), round:0 };   // draw() reads these
    H = { code, uid:u.uid, plays, rounds:cfg.rounds, round:0, players:{}, answers:{}, state:'lobby' };
    unsub.push(onSnapshot(collection(db, 'trivia_rooms', code, 'players'), snap => {
      snap.forEach(d => {
        const v = d.data(), p = H.players[d.id] || (H.players[d.id] = { name:v.name, score:0, streak:0, best:0, right:0, asked:0 });
        p.name = v.name;
        if(v.answer && v.answer.round === H.round) H.answers[d.id] = v.answer;
      });
      if(H.state === 'lobby') hostLobby(); else if(H.state === 'question') hostQuestionUpdate();
    }, oops));
    hostLobby();
  }catch(e){ oops(e); }
};
function joinLink(){ return location.origin + location.pathname + '?room=' + H.code; }
function hostLobby(){
  const ps = Object.values(H.players);
  app().innerHTML = `<div class="card" style="text-align:center"><h2>📱 Room code</h2>
    <div class="mono" style="font-size:3.4rem;letter-spacing:.25em;color:var(--brand);margin:.2rem 0">${H.code}</div>
    <p class="dim">Open GXY Trivia → 📱 Online Room and enter the code,<br>or open <b style="color:var(--ink);word-break:break-all">${esc(joinLink())}</b></p>
    <button class="btn ghost" onclick="onlineShare()">Share invite</button>
    <h2 style="margin-top:1rem">Players (${ps.length}/${MAXP})</h2>
    <div class="board" style="text-align:left">${ps.length ? ps.map((p,i) => `<div><span style="color:${COLS[i % 8]}">● <b>${esc(p.name)}</b></span></div>`).join('') : '<p class="dim">Waiting for players to join…</p>'}</div>
    <button class="btn" ${ps.length ? '' : 'disabled'} onclick="hostNext()">Start game · ${H.rounds} rounds</button>
    <button class="btn ghost" onclick="onlineMenu()">Cancel</button></div>`;
}
window.onlineShare = function(){
  const t = `Join my GXY Trivia room: ${H.code}\n${joinLink()}`;
  if(navigator.share) navigator.share({ text:t }).catch(()=>{}); else { navigator.clipboard && navigator.clipboard.writeText(t); alert('Invite copied!'); }
};
window.hostNext = async function(){
  clearInterval(hostTick);
  if(H.round >= H.rounds) return hostFinish();
  H.round++; G.round = H.round; H.answers = {}; H.state = 'question';
  const Q = H.Q = draw(); H.t0 = Date.now();
  try{ await updateDoc(ROOM(H.code), { state:'question', round:H.round, q:{ q:Q.q, hint:Q.hint || '', d:Q.d }, reveal:null }); }catch(e){ return oops(e); }
  hostQuestion();
};
function hostQuestion(){
  const Q = H.Q;
  app().innerHTML = `<div class="card">
    <div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${H.code}</b> · Round ${H.round}/${H.rounds}</span><span>${timerHTML(Q)}</span></div>
    ${qHTML(Q)}
    ${H.plays ? `<form id="hf" onsubmit="event.preventDefault();hostAnswer()"><input type="password" id="hg" autocomplete="off" placeholder="Your answer (hidden)"><button class="btn" type="submit">Lock it in</button></form>` : ''}
    <div class="board" id="locks" style="margin-top:.8rem"></div>
    <button class="btn ghost" onclick="hostReveal()">Reveal now</button></div>`;
  hostQuestionUpdate();
  hostTick = setInterval(() => {
    const left = Math.max(0, TIME[Q.d] - (Date.now() - H.t0) / 1000), pct = left / TIME[Q.d] * 100;
    if(!$('tl')) return clearInterval(hostTick);
    $('tl').textContent = Math.ceil(left) + 's'; $('tb').style.width = pct + '%'; $('tb').style.background = pct < 25 ? 'var(--bad)' : pct < 50 ? 'var(--gold)' : 'var(--good)';
    if(left <= 0) hostReveal();
  }, 250);
}
window.hostAnswer = async function(){
  const g = $('hg').value; $('hf').innerHTML = '<div class="fb">🔒 Locked in</div>';
  try{ await setDoc(PL(H.code, H.uid), { name:myName(), answer:{ round:H.round, g, t:(Date.now() - H.t0) / 1000 } }, { merge:true }); }catch(e){ oops(e); }
};
function hostQuestionUpdate(){
  if(!$('locks')) return;
  const ids = Object.keys(H.players);
  $('locks').innerHTML = ids.map((id,i) => `<div><span style="color:${COLS[i % 8]}">● ${esc(H.players[id].name)}</span><span>${H.answers[id] ? '🔒 Locked in' : '⏳ Thinking…'}</span></div>`).join('');
  if(ids.length && ids.every(id => H.answers[id])) hostReveal();
}
window.hostReveal = async function(){
  if(H.state !== 'question') return; H.state = 'reveal'; clearInterval(hostTick);
  const Q = H.Q; H.results = {};
  Object.entries(H.players).forEach(([id, p]) => {
    const a = H.answers[id], ok = !!a && isRight(a.g, Q); p.asked++;
    let pts = 0; if(ok) pts = award(p, Q, a.t).pts; else p.streak = 0;
    H.results[id] = { g: a ? a.g : null, ok, pts };
  });
  await hostPublish(); hostRevealScreen(); buzz([30,40,30]);
};
async function hostPublish(){
  const scores = {}; Object.entries(H.players).forEach(([id, p]) => scores[id] = { name:p.name, score:p.score, streak:p.streak });
  try{ await updateDoc(ROOM(H.code), { state:H.state, reveal:{ a:H.Q.a, acc:H.Q.acc, results:H.results }, scores }); }catch(e){ oops(e); }
}
function standings(scores){
  return Object.values(scores).sort((a,b) => b.score - a.score).map((p,i) => `<div><span>${['🥇','🥈','🥉'][i] || (i+1)+'.'} ${esc(p.name)}${p.streak >= 2 ? ` <span class="streak">🔥${p.streak}</span>` : ''}</span><span class="mono">${p.score}</span></div>`).join('');
}
function hostRevealScreen(){
  const last = H.round >= H.rounds;
  app().innerHTML = `<div class="card">
    <div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${H.code}</b> · Round ${H.round}/${H.rounds}</span></div>
    <div class="q">${esc(H.Q.q)}</div>
    <div class="opt right" style="cursor:default">Answer: <b>${esc(H.Q.a)}</b>${H.Q.acc.length ? `<div class="dim" style="font-size:.78rem;margin-top:.2rem">Also accepted: ${H.Q.acc.map(esc).join(', ')}</div>` : ''}</div>
    <div class="board">${Object.entries(H.results).map(([id, r]) => `<div style="align-items:center"><span style="min-width:0;overflow-wrap:anywhere"><b>${esc(H.players[id].name)}</b>: ${r.g == null ? '⏰' : r.g.trim() ? `"${esc(r.g)}"` : '(blank)'} ${r.ok ? `<span style="color:var(--good)">✅ +${r.pts}</span>` : '<span style="color:var(--bad)">❌</span>'}</span>
      ${!r.ok && r.g && r.g.trim() ? `<button onclick="hostCount('${id}')" style="flex:none;padding:.3rem .5rem;border-radius:8px;background:var(--panel2);border:1px solid var(--line);font-size:.75rem">✔ Count it</button>` : ''}</div>`).join('')}</div>
    <h2 style="margin-top:.8rem">Scores</h2><div class="board">${standings(Object.fromEntries(Object.entries(H.players)))}</div>
    <button class="btn" onclick="hostNext()">${last ? 'Final results' : 'Next question'}</button>
    <button class="btn ghost" onclick="hostFinish()">End game</button></div>`;
}
window.hostCount = async function(id){
  const r = H.results[id]; if(!r || r.ok) return;
  r.ok = true; r.pts = award(H.players[id], H.Q, (H.answers[id] || {}).t || TIME[H.Q.d]).pts;
  await hostPublish(); hostRevealScreen();
};
window.hostFinish = async function(){
  clearInterval(hostTick); H.state = 'done';
  await hostPublish();
  const ranked = Object.values(H.players).sort((a,b) => b.score - a.score);
  const lb = store.get('tv_lb_online', []);
  ranked.filter(p => p.asked).forEach(p => lb.push({ n:p.name, s:p.score, b:p.best, r:p.right, a:p.asked, d:new Date().toISOString().slice(0,10) }));
  lb.sort((a,b) => b.s - a.s); store.set('tv_lb_online', lb.slice(0, 15));
  stop();
  app().innerHTML = `<div class="card" style="text-align:center"><h2>🏆 ${ranked[0] ? esc(ranked[0].name) + ' wins!' : 'Game over'}</h2>
    <div class="board" style="text-align:left">${standings(Object.fromEntries(Object.entries(H.players)))}</div>
    <button class="btn" onclick="onlineMenu()">New room</button><button class="btn ghost" onclick="home()">Menu</button></div>`;
};

/* ---------- player ---------- */
let P = null;
window.onlineJoin = async function(){
  const name = takeName(); if(!name) return;
  const code = ($('ocode').value || '').trim().toUpperCase();
  if(!/^[A-Z]{4}$/.test(code)){ $('ocode').style.borderColor = 'var(--bad)'; return; }
  app().innerHTML = '<div class="card">Joining…</div>';
  try{
    const u = await me(), snap = await getDoc(ROOM(code));
    if(!snap.exists() || snap.data().state === 'done'){ app().innerHTML = `<div class="card"><p>No open room with code <b>${esc(code)}</b>.</p><button class="btn ghost" onclick="onlineMenu('${esc(code)}')">Back</button></div>`; return; }
    await setDoc(PL(code, u.uid), { name, joined:Date.now() }, { merge:true });
    P = { code, uid:u.uid, name, round:-1, answered:-1 };
    unsub.push(onSnapshot(ROOM(code), s => playerRender(s.data()), oops));
  }catch(e){ oops(e); }
};
function playerRender(r){
  if(!r) return;
  const hud = `<div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${P.code}</b> · ${esc(P.name)}</span><span>${r.round ? `Round ${r.round}/${r.rounds}` : ''}</span></div>`;
  if(r.state === 'lobby'){ app().innerHTML = `<div class="card pass">${hud}<div class="who">You're in!</div><p class="dim">Waiting for the host to start…</p></div>`; return; }
  if(r.state === 'question'){
    if(P.round === r.round) return;                 // already showing this question
    P.round = r.round; P.t0 = Date.now(); clearInterval(plTick);
    const Q = r.q;
    app().innerHTML = `<div class="card">${hud}${qHTML(Q).replace('<div class="timer">', `<div class="hud" style="justify-content:flex-end">${timerHTML(Q)}</div><div class="timer">`)}
      <form id="pf" onsubmit="event.preventDefault();playerLock()"><input type="text" id="pg" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" enterkeyhint="go">
      <button class="btn" type="submit">Lock it in</button></form></div>`;
    setTimeout(() => $('pg') && $('pg').focus(), 50);
    plTick = setInterval(() => {
      const left = Math.max(0, TIME[Q.d] - (Date.now() - P.t0) / 1000), pct = left / TIME[Q.d] * 100;
      if(!$('tl')) return clearInterval(plTick);
      $('tl').textContent = Math.ceil(left) + 's'; $('tb').style.width = pct + '%'; $('tb').style.background = pct < 25 ? 'var(--bad)' : pct < 50 ? 'var(--gold)' : 'var(--good)';
      if(left <= 0){ clearInterval(plTick); if(P.answered !== P.round) playerLock(); }
    }, 250);
    return;
  }
  clearInterval(plTick);
  const res = r.reveal && r.reveal.results ? r.reveal.results[P.uid] : null;
  const board = `<h2 style="margin-top:.8rem">Scores</h2><div class="board">${standings(r.scores || {})}</div>`;
  if(r.state === 'reveal'){
    app().innerHTML = `<div class="card">${hud}
      <div class="fb" style="font-size:1.4rem;color:${res && res.ok ? 'var(--good)' : 'var(--bad)'}">${res ? (res.ok ? `✅ Correct! +${res.pts}` : res.g == null ? '⏰ Time\'s up' : '❌ Not quite') : 'Answer'}</div>
      ${res && res.g ? `<div class="dim" style="text-align:center">You said: "${esc(res.g)}"</div>` : ''}
      <div class="opt right" style="margin-top:.5rem;cursor:default">Answer: <b>${esc(r.reveal.a)}</b></div>${board}
      <p class="dim" style="text-align:center">Waiting for the host…</p></div>`;
    if(res) buzz(res.ok ? [30,40,30] : 120);
    return;
  }
  if(r.state === 'done'){
    stop();
    const ranked = Object.values(r.scores || {}).sort((a,b) => b.score - a.score);
    app().innerHTML = `<div class="card" style="text-align:center">${hud}<h2>🏆 ${ranked[0] ? esc(ranked[0].name) + ' wins!' : 'Game over'}</h2>
      <div class="board" style="text-align:left">${standings(r.scores || {})}</div><button class="btn" onclick="home()">Menu</button></div>`;
  }
}
window.playerLock = async function(){
  if(P.answered === P.round) return; P.answered = P.round;
  const g = $('pg') ? $('pg').value : ''; if($('pf')) $('pf').innerHTML = '<div class="fb">🔒 Locked in. Waiting for everyone…</div>';
  buzz(15);
  try{ await setDoc(PL(P.code, P.uid), { name:P.name, answer:{ round:P.round, g, t:(Date.now() - P.t0) / 1000 } }, { merge:true }); }catch(e){ oops(e); }
};

// Opening trivia.html?room=ABCD jumps straight to the join screen.
const qsRoom = new URLSearchParams(location.search).get('room');
if(qsRoom) onlineMenu(qsRoom.toUpperCase().slice(0, 4));
