/* GXY Trivia — Online Room: one device hosts (shows a room code), everyone else joins on their own phone.
   Firestore layout:
     trivia_rooms/{CODE}                 written only by the host: settings, state, current question, results, scores
     trivia_rooms/{CODE}/players/{uid}   written only by that player: name + their answer for the round
   The correct answer is never written until the reveal, so players can't peek at it.
   Uses the trivia.html globals: SETS, deck, isRight, TIME, esc, store, buzz, app, home, $, timerHTML, qHTML. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fbApp = getApps()[0] || initializeApp({
  apiKey: "AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ", authDomain: "gxyhockey.firebaseapp.com", projectId: "gxyhockey",
  storageBucket: "gxyhockey.firebasestorage.app", messagingSenderId: "474584991663", appId: "1:474584991663:web:b8986544418d6b85fa115a" });
const auth = getAuth(fbApp), db = getFirestore(fbApp);
const ROOM = c => doc(db, 'trivia_rooms', c), PL = (c, u) => doc(db, 'trivia_rooms', c, 'players', u), PLS = c => collection(db, 'trivia_rooms', c, 'players');
const COLS = ['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7','#ec4899','#14b8a6','#f97316'];
let unsub = [], hostTick = null, plTick = null, autoT = null;
let graceT = null; // after the host's timer ends, wait a few seconds for answers still travelling from far-away players
const GRACE = 3500;
const stop = () => { unsub.forEach(f => f()); unsub = []; clearInterval(hostTick); clearInterval(plTick); clearTimeout(autoT); clearTimeout(graceT); };

/* ---------- settings ---------- */
const FORMATS = {
  classic:  { icon:'🎯', name:'Classic',  desc:'Everyone answers every question. Faster correct answers score more.' },
  race:     { icon:'⚡', name:'Race',     desc:'Points by finishing order: 1st correct gets the most, then 70%, 50%, 30%.' },
  survival: { icon:'💀', name:'Survival', desc:'Wrong or no answer costs a life. Last player standing wins.' },
};
const DEFAULTS = { format:'classic', rounds:10, lives:3, timer:'auto', diff:'all', sets:null, check:'normal',
  speed:true, streak:true, penalty:false, final:true, early:true, showAll:true, late:true, max:8, auto:'0' };
const OPTS = [
  { k:'rounds', label:'Rounds', type:'range', min:5, max:30, hint:s => s.format === 'survival' ? 'Most rounds before the survivors split the win' : '' },
  { k:'lives', label:'Lives', type:'seg', opts:[1,2,3,5], show:s => s.format === 'survival' },
  { k:'timer', label:'Timer per question', type:'seg', opts:[['auto','Auto'],['20','20s'],['30','30s'],['60','1m'],['90','1½m'],['120','2m']], hint:() => 'Auto: 60s for Hard, 90s for Expert' },
  { k:'diff', label:'Difficulty', type:'seg', opts:[['all','All'],['2','Hard only'],['3','Expert only']] },
  { k:'sets', label:'Quiz sets', type:'sets' },
  { k:'check', label:'Answer checking', type:'seg', opts:[['strict','Strict'],['normal','Normal'],['lenient','Lenient']], hint:s => ({ strict:'Spelling must be exact (capitals and punctuation ignored)', normal:'Small typos are OK', lenient:'Bigger typos are OK' })[s.check] },
  { k:'speed', label:'Speed bonus', type:'toggle', hint:() => 'Answer faster for extra points', show:s => s.format !== 'race' },
  { k:'streak', label:'Streak multipliers', type:'toggle', hint:() => '3 in a row = 1.5×, 5 in a row = 2×' },
  { k:'penalty', label:'Wrong answers lose points', type:'toggle', hint:() => 'Lose half the question\'s value for a wrong answer' },
  { k:'final', label:'Double points final round', type:'toggle' },
  { k:'early', label:'Reveal when everyone has answered', type:'toggle', hint:() => 'Off: always wait for the timer' },
  { k:'showAll', label:'Show everyone\'s answers on phones', type:'toggle' },
  { k:'auto', label:'Auto-advance after reveal', type:'seg', opts:[['0','Off'],['5','5s'],['10','10s'],['15','15s']] },
  { k:'late', label:'Allow late joins', type:'toggle' },
  { k:'max', label:'Max players', type:'seg', opts:[2,4,6,8] },
];
const loadS = () => { const s = Object.assign({}, DEFAULTS, store.get('tv_room_settings', {})); if(!s.sets || !s.sets.length) s.sets = SETS.map(x => x.id); return s; };
const saveS = s => store.set('tv_room_settings', s);
const secsFor = (s, d) => s.timer === 'auto' ? TIME[d] : +s.timer;
function summary(s){
  const f = FORMATS[s.format];
  return [`${f.icon} ${f.name}`, s.format === 'survival' ? `❤️×${s.lives}` : '', `${s.rounds} rounds`, s.timer === 'auto' ? '⏱ auto' : `⏱ ${s.timer}s`,
    { all:'', 2:'Hard only', 3:'Expert only' }[s.diff], s.check !== 'normal' ? `${s.check} answers` : '', s.final && s.format !== 'survival' ? '2× final' : '', s.penalty ? 'wrong = −pts' : '']
    .filter(Boolean).map(x => `<span class="pill">${esc(x)}</span>`).join('');
}

async function me(){
  await auth.authStateReady();
  return auth.currentUser || (await signInAnonymously(auth)).user;  // GXY account users keep their login
}
function oops(e){
  console.error(e);
  const setup = /permission|admin.only|admin-restricted|operation-not-allowed|insufficient/i.test(String(e && (e.code || e.message)));
  app().innerHTML = `<div class="card"><h2>📱 Online Room</h2><p style="color:var(--bad);margin:.5rem 0">${setup
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
    <button class="btn ghost" onclick="onlineHost()">🎙️ Host a room</button>
    <p class="dim" style="font-size:.75rem;margin-top:.4rem">You'll pick the format and settings in the lobby.</p>
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
    const u = await me(), S = loadS();
    let code; for(let i = 0; i < 6; i++){ code = code4(); if(!(await getDoc(ROOM(code))).exists()) break; }
    await setDoc(ROOM(code), { host:u.uid, state:'lobby', round:0, rounds:S.rounds, settings:S, created:Date.now() });
    if(plays) await setDoc(PL(code, u.uid), { name, joined:Date.now() });
    H = { code, uid:u.uid, plays, S, round:0, players:{}, answers:{}, state:'lobby', facts:new Set(), deck:[], tab:'players' };
    unsub.push(onSnapshot(PLS(code), snap => {
      snap.forEach(d => {
        const v = d.data();
        if(!H.players[d.id]){
          if(Object.keys(H.players).length >= H.S.max || (H.state !== 'lobby' && !H.S.late)) return;   // room full / no late joins
          H.players[d.id] = { name:v.name, score:0, streak:0, best:0, right:0, asked:0, lives:H.S.lives, out:false, joinedRound:H.round };
        }
        H.players[d.id].name = v.name;
        if(v.answer && v.answer.round === H.round) H.answers[d.id] = v.answer;
      });
      if(H.state === 'lobby') hostLobbyPlayers(); else if(H.state === 'question') hostQuestionUpdate();
    }, oops));
    hostLobby(); if(window.GXY) GXY.event('trivia', 'online');
  }catch(e){ oops(e); }
};
const joinLink = () => location.origin + location.pathname + '?room=' + H.code;
function hostLobby(){
  app().innerHTML = `<div class="card" style="text-align:center"><h2>📱 Room code</h2>
    <div class="mono" style="font-size:3.4rem;letter-spacing:.25em;color:var(--brand);margin:.2rem 0">${H.code}</div>
    <p class="dim">Open GXY Trivia → 📱 Online Room and enter the code,<br>or open <b style="color:var(--ink);word-break:break-all">${esc(joinLink())}</b></p>
    <button class="btn ghost" onclick="onlineShare()">Share invite</button>
    <div class="seg" style="margin-top:1rem"><button id="tabP" onclick="hostTab('players')">👥 Players</button><button id="tabS" onclick="hostTab('settings')">⚙️ Settings</button></div>
    <div id="lobbyBody" style="text-align:left;margin-top:.6rem"></div>
    <div id="lobbySum" style="margin-top:.6rem"></div>
    <button class="btn" id="startBtn" onclick="hostStart()">Start game</button>
    <button class="btn ghost" onclick="onlineMenu()">Cancel</button></div>`;
  hostTab(H.tab);
}
window.hostTab = function(t){
  H.tab = t; $('tabP').classList.toggle('on', t === 'players'); $('tabS').classList.toggle('on', t === 'settings');
  $('lobbySum').innerHTML = summary(H.S);
  if(t === 'players') hostLobbyPlayers(); else hostSettings();
};
function hostLobbyPlayers(){
  const ps = Object.values(H.players);
  if($('startBtn')) $('startBtn').disabled = !ps.length;
  if(H.tab !== 'players' || !$('lobbyBody')) return;
  $('lobbyBody').innerHTML = `<h2>Players (${ps.length}/${H.S.max})</h2><div class="board">${ps.length
    ? ps.map((p,i) => `<div><span style="color:${COLS[i % 8]}">● <b>${esc(p.name)}</b></span></div>`).join('') : '<p class="dim">Waiting for players to join…</p>'}</div>`;
}
function hostSettings(){
  const S = H.S, row = (o, inner) => `<div style="margin:.75rem 0"><div style="font-weight:700;font-size:.9rem;margin-bottom:.3rem">${o.label}</div>${inner}${o.hint && o.hint(S) ? `<div class="dim" style="font-size:.75rem;margin-top:.25rem">${esc(o.hint(S))}</div>` : ''}</div>`;
  $('lobbyBody').innerHTML = `<h2>Game format</h2>
    <div style="display:grid;gap:6px">${Object.entries(FORMATS).map(([k,f]) => `<button class="tile ${S.format === k ? 'on' : ''}" onclick="setS('format','${k}')"><b>${f.icon} ${f.name}</b><span>${f.desc}</span></button>`).join('')}</div>
    ${OPTS.filter(o => !o.show || o.show(S)).map(o => {
      if(o.type === 'range') return row(o, `<div style="display:flex;gap:10px;align-items:center"><input type="range" min="${o.min}" max="${o.max}" value="${S[o.k]}" oninput="this.nextElementSibling.textContent=this.value" onchange="setS('${o.k}',+this.value)"><b class="mono">${S[o.k]}</b></div>`);
      if(o.type === 'seg') return row(o, `<div class="seg" style="flex-wrap:wrap">${o.opts.map(x => { const [v, l] = Array.isArray(x) ? x : [x, String(x)]; return `<button class="${String(S[o.k]) === String(v) ? 'on' : ''}" onclick="setS('${o.k}',${typeof v === 'number' ? v : `'${v}'`})">${esc(l)}</button>`; }).join('')}</div>`);
      if(o.type === 'toggle') return row(o, `<div class="seg"><button class="${S[o.k] ? 'on' : ''}" onclick="setS('${o.k}',true)">On</button><button class="${S[o.k] ? '' : 'on'}" onclick="setS('${o.k}',false)">Off</button></div>`);
      if(o.type === 'sets') return row(o, `<div style="display:grid;gap:6px">${SETS.map(x => `<button class="tile ${S.sets.includes(x.id) ? 'on' : ''}" onclick="toggleRoomSet('${x.id}')"><b>${esc(x.name.split(': ')[1] || x.name)}</b><span>${x.qs.length} questions</span></button>`).join('')}</div>`);
    }).join('')}
    <button class="btn ghost" onclick="setS('reset')">Reset to defaults</button>`;
}
window.setS = function(k, v){
  if(k === 'reset') H.S = Object.assign({}, DEFAULTS, { sets:SETS.map(x => x.id) }); else H.S[k] = v;
  saveS(H.S); hostTab('settings');
  updateDoc(ROOM(H.code), { settings:H.S, rounds:H.S.rounds }).catch(oops);   // players' lobby shows the summary live
};
window.toggleRoomSet = function(id){ const s = H.S.sets.includes(id) ? H.S.sets.filter(x => x !== id) : H.S.sets.concat(id); if(s.length) setS('sets', s); };
window.onlineShare = function(){
  const t = `Join my GXY Trivia room: ${H.code}\n${joinLink()}`;
  if(navigator.share) navigator.share({ text:t }).catch(()=>{}); else { navigator.clipboard && navigator.clipboard.writeText(t); alert('Invite copied!'); }
};
function drawQ(){
  const ok = x => !H.facts.has(x.r[4]) && (H.S.diff === 'all' || String(x.r[3]) === H.S.diff);
  for(let tries = 0; tries < 2; tries++){
    if(!H.deck.length) H.deck = deck(H.S.sets);
    const i = H.deck.findIndex(ok);
    if(i >= 0){ const x = H.deck.splice(i, 1)[0]; H.facts.add(x.r[4]); const [q, a, acc, d, fact, hint, img] = x.r; return { q, a, acc, d, fact, hint, img }; }
    H.deck = []; H.facts.clear();
  }
  const x = deck(H.S.sets)[0]; const [q, a, acc, d, fact, hint, img] = x.r; return { q, a, acc, d, fact, hint, img };   // filter matched nothing: fall back
}
const alive = () => Object.values(H.players).filter(p => !p.out);
window.hostStart = function(){
  // settings may have changed after people joined: everyone starts fresh with the final settings
  Object.values(H.players).forEach(p => Object.assign(p, { score:0, streak:0, best:0, right:0, asked:0, lives:H.S.lives, out:false }));
  H.facts = new Set(); H.deck = []; H.round = 0; hostNext();
};
window.hostNext = async function(){
  clearInterval(hostTick); clearTimeout(autoT); clearTimeout(graceT); H.overtime = false;
  if(H.round >= H.S.rounds || (H.S.format === 'survival' && H.round > 0 && alive().length <= (Object.keys(H.players).length > 1 ? 1 : 0))) return hostFinish();
  H.round++; H.answers = {}; H.state = 'question';
  const Q = H.Q = drawQ(); Q.secs = secsFor(H.S, Q.d); Q.double = H.S.final && H.round === H.S.rounds && H.S.format !== 'survival'; H.t0 = Date.now();
  try{ await updateDoc(ROOM(H.code), { state:'question', round:H.round, rounds:H.S.rounds, q:{ q:Q.q, hint:Q.hint || '', img:Q.img || '', d:Q.d, secs:Q.secs, double:Q.double }, reveal:null }); }catch(e){ return oops(e); }
  hostQuestion();
};
function hostQuestion(){
  const Q = H.Q, me = H.players[H.uid];
  app().innerHTML = `<div class="card">
    <div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${H.code}</b> · Round ${H.round}/${H.S.rounds}</span><span><span class="diff d${Q.d}">${['','EASY','HARD','EXPERT'][Q.d]}</span> · <span class="mono" id="tl">${Q.secs}s</span></span></div>
    ${Q.double ? '<div class="fb" style="color:var(--gold)">⭐ Final round: double points!</div>' : ''}
    ${qHTML(Q)}
    ${H.plays && me && !me.out ? `<form id="hf" onsubmit="event.preventDefault();hostAnswer()"><input type="password" id="hg" autocomplete="off" placeholder="Your answer (hidden)"><button class="btn" type="submit">Lock it in</button></form>` : ''}
    <div class="board" id="locks" style="margin-top:.8rem"></div>
    <button class="btn ghost" onclick="hostReveal()">Reveal now</button></div>`;
  hostQuestionUpdate();
  hostTick = setInterval(() => {
    const left = Math.max(0, Q.secs - (Date.now() - H.t0) / 1000), pct = left / Q.secs * 100;
    if(!$('tl')) return clearInterval(hostTick);
    $('tl').textContent = left > 0 ? Math.ceil(left) + 's' : 'collecting answers…'; $('tb').style.width = pct + '%'; $('tb').style.background = pct < 25 ? 'var(--bad)' : pct < 50 ? 'var(--gold)' : 'var(--good)';
    if(left <= 0 && !H.overtime){ H.overtime = true; graceT = setTimeout(() => hostReveal(), GRACE); hostQuestionUpdate(); }
  }, 250);
}
window.hostAnswer = async function(){
  const g = $('hg').value; $('hf').innerHTML = '<div class="fb">🔒 Locked in</div>';
  try{ await setDoc(PL(H.code, H.uid), { name:myName(), answer:{ round:H.round, g, t:(Date.now() - H.t0) / 1000 } }, { merge:true }); }catch(e){ oops(e); }
};
function hostQuestionUpdate(){
  if(!$('locks')) return;
  const ids = Object.keys(H.players), live = ids.filter(id => !H.players[id].out);
  $('locks').innerHTML = ids.map((id,i) => { const p = H.players[id];
    return `<div><span style="color:${COLS[i % 8]}">● ${esc(p.name)}${H.S.format === 'survival' ? ` <span class="dim">${p.out ? '💀' : '❤️'.repeat(p.lives)}</span>` : ''}</span><span>${p.out ? 'Out' : H.answers[id] ? '🔒 Locked in' : '⏳ Thinking…'}</span></div>`; }).join('');
  if((H.S.early || H.overtime) && live.length && live.every(id => H.answers[id])) hostReveal();
}

/* ---------- scoring ---------- */
function grade(){
  const Q = H.Q, S = H.S, base = 100 * Q.d * (Q.double ? 2 : 1), results = {};
  const order = Object.entries(H.answers).filter(([id, a]) => !H.players[id]?.out && isRight(a.g, Q, S.check)).sort((x, y) => x[1].t - y[1].t).map(([id]) => id);
  Object.entries(H.players).forEach(([id, p]) => {
    if(p.out){ results[id] = { out:true }; return; }
    const a = H.answers[id], ok = order.includes(id); p.asked++;
    results[id] = { g: a ? a.g : null, ok, pts:0, t: a ? a.t : Q.secs };
    if(ok){ results[id].pts = score(p, id, a.t, order.indexOf(id)); if(id === H.uid) gxyRight(p, Q); }
    else { p.streak = 0;
      if(S.penalty && a && a.g.trim()) { const lose = Math.min(p.score, Math.round(base / 2)); p.score -= lose; results[id].pts = -lose; }
      if(S.format === 'survival'){ p.lives--; results[id].life = true; if(p.lives <= 0){ p.out = true; results[id].elim = true; } } }
  });
  return results;
}
function score(p, id, t, rank){
  const Q = H.Q, S = H.S, base = 100 * Q.d * (Q.double ? 2 : 1);
  p.streak++; p.best = Math.max(p.best, p.streak); p.right++;
  let pts = S.format === 'race' ? Math.round(base * 2 * ([1, .7, .5][rank] ?? .3))
          : base + (S.speed ? Math.round(base * Math.max(0, 1 - t / Q.secs)) : 0);
  if(S.streak) pts = Math.round(pts * (p.streak >= 5 ? 2 : p.streak >= 3 ? 1.5 : 1));
  p.score += pts; return pts;
}
window.hostReveal = async function(){
  if(H.state !== 'question') return; H.state = 'reveal'; clearInterval(hostTick); clearTimeout(graceT); H.overtime = false;
  H.results = grade();
  await hostPublish(); hostRevealScreen(); buzz([30,40,30]);
  if(+H.S.auto) autoT = setTimeout(() => H.state === 'reveal' && hostNext(), +H.S.auto * 1000);
};
async function hostPublish(){
  const scores = {}; Object.entries(H.players).forEach(([id, p]) => scores[id] = { name:p.name, score:p.score, streak:p.streak, lives:p.lives, out:p.out });
  try{ await updateDoc(ROOM(H.code), { state:H.state, reveal:{ a:H.Q.a, acc:H.Q.acc, results:H.results }, scores }); }catch(e){ oops(e); }
}
function standings(scores, survival){
  return Object.values(scores).sort((a,b) => (survival ? (b.out ? 0 : 1) - (a.out ? 0 : 1) || b.lives - a.lives : 0) || b.score - a.score)
    .map((p,i) => `<div><span>${['🥇','🥈','🥉'][i] || (i+1)+'.'} ${esc(p.name)}${survival ? ` <span class="dim">${p.out ? '💀' : '❤️'.repeat(Math.max(0, p.lives))}</span>` : ''}${p.streak >= 2 ? ` <span class="streak">🔥${p.streak}</span>` : ''}</span><span class="mono">${p.score}</span></div>`).join('');
}
function resultLine(name, r){
  if(r.out) return `<b>${esc(name)}</b>: <span class="dim">💀 out</span>`;
  const said = r.g == null ? '⏰' : r.g.trim() ? `"${esc(r.g)}"` : '(blank)';
  const tag = r.ok ? `<span style="color:var(--good)">✅ +${r.pts}</span>` : `<span style="color:var(--bad)">❌${r.pts < 0 ? ' ' + r.pts : ''}${r.elim ? ' 💀 eliminated' : r.life ? ' −❤️' : ''}</span>`;
  return `<b>${esc(name)}</b>: ${said} ${tag}`;
}
function hostRevealScreen(){
  const survEnd = H.S.format === 'survival' && alive().length <= (Object.keys(H.players).length > 1 ? 1 : 0);
  const last = H.round >= H.S.rounds || survEnd;
  app().innerHTML = `<div class="card">
    <div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${H.code}</b> · Round ${H.round}/${H.S.rounds}</span>${+H.S.auto ? `<span class="dim">Next in ${H.S.auto}s</span>` : ''}</div>
    <div class="q">${esc(H.Q.q)}</div>${logoHTML(H.Q)}
    <div class="opt right" style="cursor:default">Answer: <b>${esc(H.Q.a)}</b>${H.Q.acc.length ? `<div class="dim" style="font-size:.78rem;margin-top:.2rem">Also accepted: ${H.Q.acc.map(esc).join(', ')}</div>` : ''}</div>
    <div class="board">${Object.entries(H.results).map(([id, r]) => `<div style="align-items:center"><span style="min-width:0;overflow-wrap:anywhere">${resultLine(H.players[id].name, r)}</span>
      ${!r.ok && !r.out && r.g && r.g.trim() ? `<button onclick="hostCount('${id}')" style="flex:none;padding:.3rem .5rem;border-radius:8px;background:var(--panel2);border:1px solid var(--line);font-size:.75rem">✔ Count it</button>` : ''}</div>`).join('')}</div>
    <h2 style="margin-top:.8rem">Scores</h2><div class="board">${standings(H.players, H.S.format === 'survival')}</div>
    <button class="btn" onclick="hostNext()">${last ? 'Final results' : 'Next question'}</button>
    <button class="btn ghost" onclick="hostFinish()">End game</button></div>`;
}
// Host override for open-ended answers: undo the miss (and any lost life / penalty), then score it as correct.
window.hostCount = async function(id){
  const r = H.results[id], p = H.players[id]; if(!r || r.ok) return;
  if(r.pts < 0) p.score -= r.pts;
  if(r.life){ p.lives++; p.out = false; }
  const rank = Object.values(H.results).filter(x => x.ok && x.t <= r.t).length;
  Object.assign(r, { ok:true, life:false, elim:false, pts:score(p, id, r.t, rank) });
  await hostPublish(); hostRevealScreen();
};
window.hostFinish = async function(){
  clearInterval(hostTick); clearTimeout(autoT); H.state = 'done';
  await hostPublish();
  const surv = H.S.format === 'survival';
  const ranked = Object.values(H.players).sort((a,b) => (surv ? (b.out ? 0 : 1) - (a.out ? 0 : 1) || b.lives - a.lives : 0) || b.score - a.score);
  const lb = store.get('tv_lb_online', []);
  ranked.filter(p => p.asked).forEach(p => lb.push({ n:p.name, s:p.score, b:p.best, r:p.right, a:p.asked, d:new Date().toISOString().slice(0,10) }));
  lb.sort((a,b) => b.s - a.s); store.set('tv_lb_online', lb.slice(0, 15));
  stop();
  app().innerHTML = `<div class="card" style="text-align:center"><h2>🏆 ${ranked[0] ? esc(ranked[0].name) + ' wins!' : 'Game over'}</h2>
    <div>${summary(H.S)}</div>
    <div class="board" style="text-align:left;margin-top:.6rem">${standings(H.players, surv)}</div>
    <button class="btn" onclick="onlineMenu()">New room</button><button class="btn ghost" onclick="home()">Menu</button></div>`;
};

/* ---------- player ---------- */
let P = null;
window.onlineJoin = async function(){
  const name = takeName(); if(!name) return;
  const code = ($('ocode').value || '').trim().toUpperCase();
  if(!/^[A-Z]{4}$/.test(code)){ $('ocode').style.borderColor = 'var(--bad)'; return; }
  app().innerHTML = '<div class="card">Joining…</div>';
  const nope = msg => app().innerHTML = `<div class="card"><p>${msg}</p><button class="btn ghost" onclick="onlineMenu('${esc(code)}')">Back</button></div>`;
  try{
    const u = await me(), snap = await getDoc(ROOM(code)), r = snap.data();
    if(!snap.exists() || r.state === 'done') return nope(`No open room with code <b>${esc(code)}</b>.`);
    const S = r.settings || DEFAULTS, mine = (await getDoc(PL(code, u.uid))).exists();
    if(!mine){
      if(r.state !== 'lobby' && !S.late) return nope('That game has already started and the host isn\'t allowing late joins.');
      if((await getDocs(PLS(code))).size >= S.max) return nope('That room is full.');
    }
    const tj = performance.now(); await setDoc(PL(code, u.uid), { name, joined:Date.now() }, { merge:true }); const rtt = Math.round(performance.now() - tj);
    P = { rtt, code, uid:u.uid, name, round:-1, answered:-1, shown:'' };
    unsub.push(onSnapshot(ROOM(code), s => playerRender(s.data()), oops));
    if(window.GXY) GXY.event('trivia', 'online');
  }catch(e){ oops(e); }
};
function playerRender(r){
  if(!r) return;
  const S = r.settings || DEFAULTS, surv = S.format === 'survival', mine = (r.scores || {})[P.uid];
  const hud = `<div class="hud"><span>Room <b class="mono" style="color:var(--brand)">${P.code}</b>${P.rtt ? ` <span class="dim" title="round trip to the game server">📶 ${P.rtt}ms</span>` : ''} · ${esc(P.name)}${surv && mine ? ` ${mine.out ? '💀' : '❤️'.repeat(Math.max(0, mine.lives))}` : ''}</span><span>${r.round ? `Round ${r.round}/${r.rounds}` : ''}</span></div>`;
  if(r.state === 'lobby'){
    app().innerHTML = `<div class="card pass">${hud}<div class="who">You're in!</div><p class="dim">Waiting for the host to start…</p>
      <div style="margin-top:1rem">${summary(S)}</div><p class="dim" style="font-size:.8rem;margin-top:.4rem">${FORMATS[S.format].desc}</p></div>`;
    return;
  }
  if(r.state === 'question'){
    if(P.round === r.round) return;                 // already showing this question
    P.round = r.round; P.t0 = Date.now(); clearInterval(plTick);
    const Q = r.q, secs = Q.secs || TIME[Q.d];
    const timer = `<div class="hud" style="justify-content:flex-end"><span class="diff d${Q.d}">${['','EASY','HARD','EXPERT'][Q.d]}</span>&nbsp;·&nbsp;<span class="mono" id="tl">${secs}s</span></div>`;
    const out = surv && mine && mine.out;
    app().innerHTML = `<div class="card">${hud}${Q.double ? '<div class="fb" style="color:var(--gold)">⭐ Final round: double points!</div>' : ''}${timer}${qHTML(Q)}
      ${out ? '<div class="fb" style="color:var(--bad)">💀 You\'re out. Watching the rest of the game.</div>'
        : `<form id="pf" onsubmit="event.preventDefault();playerLock()"><input type="text" id="pg" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" enterkeyhint="go">
      <button class="btn" type="submit">Lock it in</button></form>`}</div>`;
    if(out) return;
    setTimeout(() => $('pg') && $('pg').focus(), 50);
    plTick = setInterval(() => {
      const left = Math.max(0, secs - (Date.now() - P.t0) / 1000), pct = left / secs * 100;
      if(!$('tl')) return clearInterval(plTick);
      $('tl').textContent = Math.ceil(left) + 's'; $('tb').style.width = pct + '%'; $('tb').style.background = pct < 25 ? 'var(--bad)' : pct < 50 ? 'var(--gold)' : 'var(--good)';
      if(left <= 0){ clearInterval(plTick); if(P.answered !== P.round) playerLock(); }
    }, 250);
    return;
  }
  clearInterval(plTick);
  const res = r.reveal && r.reveal.results ? r.reveal.results[P.uid] : null;
  const board = `<h2 style="margin-top:.8rem">Scores</h2><div class="board">${standings(r.scores || {}, surv)}</div>`;
  if(r.state === 'reveal'){
    const key = 'r' + r.round + JSON.stringify(res); if(P.shown === key) return; P.shown = key;   // ignore unrelated updates
    const others = S.showAll ? `<div class="board" style="margin-top:.5rem">${Object.entries(r.reveal.results).filter(([id]) => id !== P.uid).map(([id, x]) => `<div><span style="overflow-wrap:anywhere">${resultLine((r.scores[id] || {}).name || '?', x)}</span></div>`).join('')}</div>` : '';
    app().innerHTML = `<div class="card">${hud}
      <div class="fb" style="font-size:1.4rem;color:${res && res.ok ? 'var(--good)' : 'var(--bad)'}">${!res || res.out ? '💀 Spectating' : res.ok ? `✅ Correct! +${res.pts}` : res.g == null ? '⏰ Time\'s up' : '❌ Not quite'}</div>
      ${res && !res.ok && !res.out ? `<div class="dim" style="text-align:center">${res.pts < 0 ? `${res.pts} points. ` : ''}${res.elim ? '💀 You\'ve been eliminated.' : res.life ? 'You lost a life.' : ''}</div>` : ''}
      ${res && res.g ? `<div class="dim" style="text-align:center">You said: "${esc(res.g)}"</div>` : ''}
      <div class="opt right" style="margin-top:.5rem;cursor:default">Answer: <b>${esc(r.reveal.a)}</b></div>${others}${board}
      <p class="dim" style="text-align:center">Waiting for the host…</p></div>`;
    if(res && !res.out) buzz(res.ok ? [30,40,30] : 120);
    if(res && res.ok && window.GXY && P.counted !== r.round){ P.counted = r.round; GXY.event('trivia', 'right'); if(r.q && r.q.img) GXY.event('trivia', 'logo'); }
    return;
  }
  if(r.state === 'done'){
    stop();
    const ranked = Object.values(r.scores || {}).sort((a,b) => (surv ? (b.out ? 0 : 1) - (a.out ? 0 : 1) || b.lives - a.lives : 0) || b.score - a.score);
    app().innerHTML = `<div class="card" style="text-align:center">${hud}<h2>🏆 ${ranked[0] ? esc(ranked[0].name) + ' wins!' : 'Game over'}</h2>
      <div class="board" style="text-align:left">${standings(r.scores || {}, surv)}</div><button class="btn" onclick="home()">Menu</button></div>`;
  }
}
window.playerLock = async function(){
  if(P.answered === P.round) return; P.answered = P.round;
  const g = $('pg') ? $('pg').value : ''; if($('pf')) $('pf').innerHTML = '<div class="fb">🔒 Locked in. Waiting for everyone…</div>';
  buzz(15);
  const t = (Date.now() - P.t0) / 1000, ts = performance.now();
  try{ await setDoc(PL(P.code, P.uid), { name:P.name, answer:{ round:P.round, g, t } }, { merge:true }); P.rtt = Math.round(performance.now() - ts); }catch(e){ oops(e); }
};

// Opening trivia.html?room=ABCD jumps straight to the join screen.
const qsRoom = new URLSearchParams(location.search).get('room');
if(qsRoom) onlineMenu(qsRoom.toUpperCase().slice(0, 4));
