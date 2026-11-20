/* GXY Trivia add-ons: ✏️ user-created question packs (make, edit, share by link) and 🏆 tournament brackets.
   Loaded after trivia.html's main script; uses its globals (SETS, cfg, save, home, startGame, finish, G, store, esc, $, app). */
(function(){
  /* ================= question packs ================= */
  const PK = 'tv_packs';
  const packs = () => store.get(PK, []);
  const savePacks = p => { store.set(PK, p); syncSets(); };
  // packs appear as quiz sets so every mode (and the Online Room) can use them
  function syncSets(){
    for(let i = SETS.length - 1; i >= 0; i--) if(SETS[i].id.startsWith('pack:')) SETS.splice(i, 1);
    packs().forEach(p => { if(p.qs.length) SETS.push({ id:'pack:' + p.id, show:'✏️ My Pack', name:'My Pack: ' + p.name, qs:p.qs.map((q, i) => [q[0], q[1], q[2] || [], q[3] || 2, 'pack' + p.id + ':' + i, '']) }); });
    cfg.sets = cfg.sets.filter(id => SETS.some(s => s.id === id)); if(!cfg.sets.length) cfg.sets = [SETS[0].id];
  }
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  let editing = null;
  window.packsMenu = function(){
    const ps = packs();
    app().innerHTML = `<div class="card"><h2>✏️ Question Packs</h2>
      <p class="dim">Write your own questions about anything: your friends, your class, a show you love. Packs show up as quiz sets in every mode, including the Online Room.</p>
      <div style="margin:.8rem 0">${ps.map(p => `<div class="item" style="display:flex;gap:8px;align-items:center;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:10px;margin-bottom:6px">
        <b style="flex:1">${esc(p.name)} <span class="dim">· ${p.qs.length} question${p.qs.length === 1 ? '' : 's'}</span></b>
        <button class="pill" onclick="packEdit('${p.id}')">Edit</button><button class="pill" onclick="packShare('${p.id}')">Share</button></div>`).join('') || '<p class="dim">No packs yet.</p>'}</div>
      <label class="f">New pack name</label><input type="text" id="pkName" maxlength="40" placeholder="e.g. Our Family Trivia">
      <button class="btn" onclick="packNew()">➕ Create pack</button>
      <label class="f">Got a pack link or code from a friend?</label><input type="text" id="pkCode" placeholder="Paste link or code">
      <button class="btn ghost" onclick="packImport($('pkCode').value)">📥 Import pack</button>
      <button class="btn ghost" onclick="home()">Back</button></div>`;
  };
  window.packNew = function(){
    const n = ($('pkName').value || '').trim(); if(!n){ $('pkName').focus(); return; }
    const ps = packs(), id = Date.now().toString(36); ps.push({ id, name:n, qs:[] }); savePacks(ps); packEdit(id);
  };
  window.packEdit = function(id, msg){
    editing = id; const p = packs().find(x => x.id === id); if(!p) return packsMenu();
    app().innerHTML = `<div class="card"><h2>✏️ ${esc(p.name)}</h2>${msg ? `<p class="fb" style="color:var(--good)">${msg}</p>` : ''}
      <label class="f">Question</label><input type="text" id="qQ" maxlength="200" placeholder="Who scored the winning goal in…?">
      <label class="f">Answer</label><input type="text" id="qA" maxlength="80">
      <label class="f">Also accept (optional, separate with commas)</label><input type="text" id="qAcc" maxlength="200" placeholder="nicknames, short versions…">
      <label class="f">Difficulty</label><div class="seg" id="qD">${[[1,'Easy · 30s'],[2,'Hard · 60s'],[3,'Expert · 90s']].map(([v,l]) => `<button class="${v === 2 ? 'on' : ''}" data-d="${v}" onclick="[...this.parentNode.children].forEach(b=>b.classList.toggle('on',b===this))">${l}</button>`).join('')}</div>
      <button class="btn" onclick="packAdd()">➕ Add question</button>
      <h2 style="margin-top:1rem">Questions (${p.qs.length})</h2>
      <div class="board">${p.qs.map((q, i) => `<div style="align-items:center"><span style="min-width:0;overflow-wrap:anywhere"><b>${esc(q[0])}</b><br><span class="dim">→ ${esc(q[1])}${q[2] && q[2].length ? ' · also: ' + q[2].map(esc).join(', ') : ''}</span></span>
        <button class="pill" onclick="packDel(${i})" aria-label="Delete question">🗑️</button></div>`).join('') || '<p class="dim">Add at least one question to play this pack.</p>'}</div>
      <button class="btn ghost" onclick="packShare('${p.id}')">🔗 Share pack</button>
      <button class="btn ghost" onclick="if(confirm('Delete this whole pack?')){savePacksPublic(packsPublic().filter(x=>x.id!=='${p.id}'));packsMenu()}">Delete pack</button>
      <button class="btn ghost" onclick="packsMenu()">Done</button></div>`;
    setTimeout(() => $('qQ') && $('qQ').focus(), 50);
  };
  window.packsPublic = packs; window.savePacksPublic = savePacks;
  window.packAdd = function(){
    const q = $('qQ').value.trim(), a = $('qA').value.trim(); if(!q || !a) return ($(!q ? 'qQ' : 'qA').style.borderColor = 'var(--bad)');
    const acc = $('qAcc').value.split(',').map(s => s.trim()).filter(Boolean), d = +document.querySelector('#qD .on').dataset.d;
    const ps = packs(), p = ps.find(x => x.id === editing); p.qs.push([q, a, acc, d]); savePacks(ps); packEdit(editing, 'Added! ' + p.qs.length + ' questions so far.');
  };
  window.packDel = function(i){ const ps = packs(), p = ps.find(x => x.id === editing); p.qs.splice(i, 1); savePacks(ps); packEdit(editing); };
  window.packShare = function(id){
    const p = packs().find(x => x.id === id), code = enc({ n:p.name, q:p.qs });
    const link = location.origin + location.pathname + '#pack=' + code;
    const t = `Try my GXY Trivia pack "${p.name}" (${p.qs.length} questions):\n${link}`;
    if(navigator.share) navigator.share({ text:t }).catch(()=>{}); else { navigator.clipboard && navigator.clipboard.writeText(link); alert('Pack link copied! Anyone who opens it can import your pack.'); }
  };
  window.packImport = function(s){
    try{
      const code = String(s || '').trim().replace(/^.*#pack=/, ''), o = dec(code);
      if(!o || !Array.isArray(o.q) || !o.q.length) throw 0;
      const qs = o.q.filter(q => Array.isArray(q) && typeof q[0] === 'string' && typeof q[1] === 'string').slice(0, 500).map(q => [q[0].slice(0, 200), q[1].slice(0, 80), (q[2] || []).map(String).slice(0, 10), [1,2,3].includes(q[3]) ? q[3] : 2]);
      const ps = packs(); ps.push({ id:Date.now().toString(36), name:String(o.n || 'Imported pack').slice(0, 40), qs }); savePacks(ps);
      alert(`Imported "${o.n}" with ${qs.length} questions!`); packsMenu();
    }catch(e){ alert('That doesn\'t look like a pack link or code.'); }
  };

  /* ================= tournament brackets ================= */
  let T = null;   // { players:[names], rounds:[[ [a,b,winner] ]], qs:n, cur:[r,m] }
  window.tourneyMenu = function(){
    const n = store.get('tv_t_n', 4), names = store.get('tv_t_names', ['Player 1','Player 2','Player 3','Player 4','Player 5','Player 6','Player 7','Player 8']);
    app().innerHTML = `<div class="card"><h2>🏆 Tournament</h2><p class="dim">Single elimination. Each match is a head-to-head pass-the-phone duel using the quiz sets picked on the main menu. Winners move on until one champion is left.</p>
      <label class="f">Players</label><div class="seg">${[4,8].map(k => `<button class="${k === n ? 'on' : ''}" onclick="store.set('tv_t_n',${k});tourneyMenu()">${k}</button>`).join('')}</div>
      ${Array.from({ length:n }, (_, i) => `<label class="f">Seed ${i + 1}</label><input type="text" class="tname" maxlength="14" value="${esc(names[i] || 'Player ' + (i + 1))}">`).join('')}
      <label class="f">Questions per player in each match</label><div class="seg" id="tq">${[3,5,7].map(k => `<button class="${k === 5 ? 'on' : ''}" data-q="${k}" onclick="[...this.parentNode.children].forEach(b=>b.classList.toggle('on',b===this))">${k}</button>`).join('')}</div>
      <label style="display:flex;gap:8px;align-items:center;margin-top:.7rem;font-size:.9rem"><input type="checkbox" id="tShuf" checked> Shuffle the seeds</label>
      <button class="btn" onclick="tourneyStart()">Start tournament</button><button class="btn ghost" onclick="home()">Back</button></div>`;
  };
  window.tourneyStart = function(){
    let ps = [...document.querySelectorAll('.tname')].map((e, i) => e.value.trim() || 'Player ' + (i + 1));
    store.set('tv_t_names', ps.concat(store.get('tv_t_names', []).slice(ps.length)));
    if($('tShuf').checked) ps = ps.sort(() => Math.random() - .5);
    const r0 = []; for(let i = 0; i < ps.length; i += 2) r0.push([ps[i], ps[i + 1], null]);
    T = { size:ps.length, rounds:[r0], qs:+document.querySelector('#tq .on').dataset.q };
    for(let n = ps.length / 4; n >= 1; n /= 2) T.rounds.push(Array.from({ length:n }, () => [null, null, null]));
    tourneyBoard();
  };
  const RNAME = (r, total) => r === total - 1 ? 'Final' : r === total - 2 ? 'Semifinals' : 'Quarterfinals';
  function nextMatch(){ for(let r = 0; r < T.rounds.length; r++) for(let m = 0; m < T.rounds[r].length; m++){ const x = T.rounds[r][m]; if(x[0] && x[1] && !x[2]) return [r, m]; } return null; }
  function tourneyBoard(){
    const nm = nextMatch(), champ = T.rounds[T.rounds.length - 1][0][2];
    app().innerHTML = `<div class="card"><h2>🏆 ${champ ? '👑 ' + esc(champ) + ' is the champion!' : 'Tournament bracket'}</h2>
      <div class="bracket">${T.rounds.map((rd, r) => `<div class="bcol"><div class="dim" style="text-align:center;margin-bottom:6px">${RNAME(r, T.rounds.length)}</div>
        ${rd.map(([a, b, w]) => `<div class="bm">${[a, b].map(p => `<div class="${w && p === w ? 'win' : w ? 'lose' : ''}">${p ? esc(p) : '<span class="dim">TBD</span>'}</div>`).join('')}</div>`).join('')}</div>`).join('')}</div>
      ${champ ? `<div class="fb" style="font-size:2rem">🏆</div><button class="btn" onclick="tourneyMenu()">New tournament</button>`
        : `<div class="fb" style="margin-top:.8rem">Next: <b>${esc(T.rounds[nm[0]][nm[1]][0])}</b> vs <b>${esc(T.rounds[nm[0]][nm[1]][1])}</b></div><button class="btn" onclick="tourneyPlay()">▶ Play match</button>`}
      <button class="btn ghost" onclick="if(confirm('Leave the tournament?')){T=null;home()}">Quit</button></div>`;
    if(champ && window.GXY) GXY.event('trivia', 'tourney');
  }
  window.tourneyPlay = function(){
    const [r, m] = T.cur = nextMatch(), [a, b] = T.rounds[r][m];
    const keep = { mode:cfg.mode, players:cfg.players, rounds:cfg.rounds };
    cfg.mode = 'versus'; cfg.players = [a, b]; cfg.rounds = T.qs;
    startGame(); G.tourney = true; Object.assign(cfg, keep);
  };
  // when a tournament match ends, record the winner instead of the normal results screen
  const origFinish = window.finish;
  window.finish = function(){
    if(!(G && G.tourney && T)) return origFinish.apply(this, arguments);
    clearInterval(tick);
    const [x, y] = G.players; let w = x.score === y.score ? (x.right === y.right ? (Math.random() < .5 ? x : y) : x.right > y.right ? x : y) : x.score > y.score ? x : y;
    const tie = x.score === y.score;
    const [r, m] = T.cur, match = T.rounds[r][m]; match[2] = w.name;
    if(r + 1 < T.rounds.length){ const nx = T.rounds[r + 1][Math.floor(m / 2)]; nx[m % 2] = w.name; }
    app().innerHTML = `<div class="card" style="text-align:center"><h2>${esc(w.name)} advances!</h2>
      <div class="board" style="text-align:left">${[x, y].map(p => `<div><span>${p === w ? '✅' : '❌'} ${esc(p.name)}</span><span class="mono">${p.score} pts · ${p.right}/${p.asked}</span></div>`).join('')}</div>
      ${tie ? '<p class="dim">Tied on points, so it went to the most correct answers' + (x.right === y.right ? ', then a coin flip.' : '.') + '</p>' : ''}
      <button class="btn" onclick="tourneyBoardPublic()">See the bracket</button></div>`;
  };
  window.tourneyBoardPublic = tourneyBoard;

  /* ================= wire into the menu ================= */
  const css = document.createElement('style');
  css.textContent = `.bracket{display:flex;gap:10px;overflow-x:auto;padding:4px 0}.bcol{flex:1;min-width:120px;display:flex;flex-direction:column;justify-content:space-around;gap:10px}
    .bm{background:var(--panel2);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:.85rem}.bm div{padding:6px 8px;border-bottom:1px solid var(--line)}.bm div:last-child{border:0}
    .bm .win{background:#14532d;font-weight:800}.bm .lose{opacity:.45;text-decoration:line-through}`;
  document.head.appendChild(css);
  const origHome = window.home;
  window.home = function(){
    origHome.apply(this, arguments);
    const grid = document.querySelector('#app .card:nth-of-type(2) .grid');
    if(grid) grid.insertAdjacentHTML('beforeend', `<button class="tile" onclick="tourneyMenu()"><div class="ic">🏆</div><b>Tournament</b><span>4 or 8 players · bracket</span></button>
      <button class="tile" onclick="packsMenu()"><div class="ic">✏️</div><b>Question Packs</b><span>Write & share your own</span></button>`);
  };
  syncSets();
  const h = location.hash.match(/#pack=([\w-]+)/);
  if(h){ history.replaceState(null, '', location.pathname); setTimeout(() => { if(confirm('Import the trivia pack from this link?')) packImport(h[1]); }, 300); }
  else home();
})();
