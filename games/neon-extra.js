/* Neon Siege add-ons: ♾️ Endless Survival and ✏️ a map editor (draw, save, share custom paths).
   Uses the page's MAPS, SETUP, G, GRID_COLS, GRID_ROWS, TILE, renderStart, toast, showModal, closeModal, esc. */
(function(){
  /* ================= custom maps ================= */
  const MK = 'ns_maps';
  const myMaps = () => { try{ return JSON.parse(localStorage.getItem(MK)) || {}; }catch(e){ return {}; } };
  const saveMaps = m => { try{ localStorage.setItem(MK, JSON.stringify(m)); }catch(e){} loadMaps(); };
  function loadMaps(){
    Object.keys(MAPS).filter(k => k.startsWith('my_')).forEach(k => delete MAPS[k]);
    Object.entries(myMaps()).forEach(([k, m]) => MAPS[k] = { name:'✏️ ' + m.name, dd:`Custom · ${m.len} tiles`, path:m.path, custom:true });
  }
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  const edge = (c, r) => c === 0 || r === 0 || c === GRID_COLS - 1 || r === GRID_ROWS - 1;
  const outside = (c, r) => c === 0 ? [-1, r] : c === GRID_COLS - 1 ? [GRID_COLS, r] : r === 0 ? [c, -1] : [c, GRID_ROWS];
  const lenOf = p => p.slice(1).reduce((s, q, i) => s + Math.abs(q[0] - p[i][0]) + Math.abs(q[1] - p[i][1]), 0);

  let E = null;   // editor state { pts:[[c,r]], done:false }
  window.mapEditor = function(){
    E = { pts:[], done:false };
    window._allowClose = true;
    showModal(`<h2>✏️ Map Editor</h2>
      <p style="color:var(--dim);font-size:.85rem;margin:.3rem 0 .6rem">Tap an <b>edge</b> square to start the path, then tap squares in a straight line (row or column) to lay each stretch; turns are added for you. Finish on another edge square and hit Done.</p>
      <canvas id="edC" width="${GRID_COLS * TILE}" height="${GRID_ROWS * TILE}" style="width:100%;border-radius:10px;background:#05071a;touch-action:none"></canvas>
      <div id="edMsg" style="color:var(--dim);font-size:.85rem;margin:.4rem 0;min-height:1.2em"></div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap"><button class="btn ghost" onclick="edUndo()">↶ Undo</button><button class="btn ghost" onclick="mapEditor()">🗑 Clear</button><button class="btn cyan" onclick="edDone()">✅ Done</button></div>
      <div id="edSave" style="margin-top:.6rem"></div>
      ${Object.keys(myMaps()).length ? `<h3 style="margin-top:1rem">Your maps</h3>${Object.entries(myMaps()).map(([k, m]) => `<div style="display:flex;gap:.4rem;align-items:center;margin:.3rem 0"><b style="flex:1">${esc(m.name)}</b><button class="btn ghost" style="width:auto;padding:.4rem .7rem" onclick="nsShareMap('${k}')">🔗 Share</button><button class="btn ghost" style="width:auto;padding:.4rem .7rem" onclick="nsDelMap('${k}')">🗑</button></div>`).join('')}` : ''}
      <button class="btn ghost" style="margin-top:.6rem" onclick="closeModal();renderStart()">Close</button>`);
    const cv = document.getElementById('edC');
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); edTap(Math.floor((e.clientX - r.left) / r.width * GRID_COLS), Math.floor((e.clientY - r.top) / r.height * GRID_ROWS)); });
    edDraw();
  };
  function msg(t){ const m = document.getElementById('edMsg'); if(m) m.textContent = t; }
  function edTap(c, r){
    if(!E || E.done) return;
    if(!E.pts.length){ if(!edge(c, r)) return msg('Start on an edge square: that\'s where the intruders come in.'); E.pts.push(outside(c, r), [c, r]); return edDraw(); }
    const [lc, lr] = E.pts[E.pts.length - 1];
    if(c === lc && r === lr) return;
    if(c !== lc && r !== lr) E.pts.push([c, lr]);   // auto-corner
    E.pts.push([c, r]); edDraw();
  }
  window.edUndo = () => { if(!E) return; E.done = false; E.pts.pop(); if(E.pts.length === 1) E.pts = []; document.getElementById('edSave').innerHTML = ''; edDraw(); };
  window.edDone = function(){
    if(E.pts.length < 3) return msg('Draw a longer path first.');
    const [c, r] = E.pts[E.pts.length - 1];
    if(!edge(c, r)) return msg('End the path on an edge square: that\'s the exit to your base.');
    const path = E.pts.concat([outside(c, r)]), len = lenOf(path);
    if(len < 18) return msg('That path is too short for a fair fight. Make it at least 18 squares.');
    E.done = true; E.path = path; E.len = len; edDraw();
    document.getElementById('edSave').innerHTML = `<input id="edName" maxlength="20" placeholder="Map name" style="width:100%;padding:.6rem;border-radius:10px;border:1px solid var(--line);background:var(--panel2);color:#fff;font-size:16px">
      <button class="btn gold" style="margin-top:.4rem" onclick="edSave()">💾 Save map (${len} squares)</button>`;
  };
  window.edSave = function(){
    const name = (document.getElementById('edName').value || '').trim() || 'My Map', maps = myMaps(), key = 'my_' + Date.now().toString(36);
    maps[key] = { name, path:E.path, len:E.len }; saveMaps(maps); SETUP.map = key;
    closeModal(); renderStart(); toast('Map saved! It\'s selected and ready.');
  };
  window.nsDelMap = k => { const m = myMaps(); delete m[k]; saveMaps(m); if(SETUP.map === k) SETUP.map = 'zigzag'; mapEditor(); };
  window.nsShareMap = function(k){
    const m = myMaps()[k], link = location.origin + location.pathname + '#map=' + enc(m);
    if(navigator.share) navigator.share({ text:`Can you survive my Neon Siege map "${m.name}"?\n${link}` }).catch(()=>{});
    else { navigator.clipboard && navigator.clipboard.writeText(link); toast('Map link copied!'); }
  };
  function edDraw(){
    const cv = document.getElementById('edC'); if(!cv) return; const x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    x.strokeStyle = '#1e2a5a'; for(let c = 0; c <= GRID_COLS; c++){ x.beginPath(); x.moveTo(c * TILE, 0); x.lineTo(c * TILE, cv.height); x.stroke(); }
    for(let r = 0; r <= GRID_ROWS; r++){ x.beginPath(); x.moveTo(0, r * TILE); x.lineTo(cv.width, r * TILE); x.stroke(); }
    x.fillStyle = '#22d3ee14'; for(let c = 0; c < GRID_COLS; c++) for(let r = 0; r < GRID_ROWS; r++) if(edge(c, r)) x.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
    const pts = (E.done ? E.path : E.pts).map(([c, r]) => [c * TILE + TILE / 2, r * TILE + TILE / 2]);
    if(pts.length > 1){ x.strokeStyle = '#ec4899'; x.lineWidth = TILE * .7; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.stroke(); x.lineWidth = 1; }
    if(pts.length > 1){ x.fillStyle = '#22c55e'; x.beginPath(); x.arc(...pts[1], 9, 0, 7); x.fill(); x.fillStyle = '#ef4444'; x.beginPath(); x.arc(...pts[pts.length - 1], 9, 0, 7); x.fill(); }
    if(!E.done) msg(E.pts.length ? `${lenOf(E.pts)} squares so far. Keep going, then end on an edge.` : 'Tap an edge square to start.');
    else msg('Looks good! Name it and save.');
  }

  /* ================= endless survival ================= */
  SETUP.mode = SETUP.mode || 'classic';
  const origEnemy = window.enemyForWave;
  window.enemyForWave = function(type, n){
    const e = origEnemy(type, n);
    if(SETUP.mode === 'endless'){ const k = 1 + Math.max(0, n - 5) * 0.05; e.maxHp = e.hp = Math.round(e.hp * k); e.speed = e.baseSpeed = e.speed * Math.min(1.6, 1 + n * 0.01); }
    return e;
  };
  let autoT = null, clockT = null;
  const origComplete = window.waveComplete;
  window.waveComplete = function(){
    origComplete.apply(this, arguments);
    if(SETUP.mode !== 'endless' || G.over) return;
    let left = Math.max(4, 10 - Math.floor(G.wave / 5));   // build breaks get shorter
    const btn = document.getElementById('waveBtn'), hint = document.getElementById('waveHint');
    clearInterval(autoT);
    autoT = setInterval(() => {
      if(G.over){ clearInterval(autoT); return; }
      if(G.paused) return;
      left--; if(btn) btn.textContent = `▶ Wave ${G.wave + 1} in ${left}s (tap to go now)`; if(hint) hint.textContent = '♾️ Endless: the next wave starts on its own.';
      if(left <= 0 || G.waveActive){ clearInterval(autoT); if(!G.waveActive) startWave(); }
    }, 1000);
  };
  const origStart = window.startGame;
  window.startGame = function(){
    origStart.apply(this, arguments);
    if(SETUP.mode !== 'endless') return;
    G.endless = true; G.t0 = Date.now(); G.gold += 80;
    toast('♾️ Endless Survival: waves keep coming. How long can you last?');
    const hud = document.getElementById('waveHint');
    clearInterval(clockT);
    clockT = setInterval(() => { if(!G || G.over){ clearInterval(clockT); return; } if(!G.paused) G.alive = (G.alive || 0) + 1; const el = document.getElementById('nsClock'); if(el) el.textContent = fmtT(G.alive); }, 1000);
    if(hud) hud.insertAdjacentHTML('beforebegin', '<div style="font:700 .95rem monospace;color:var(--gold);margin:.3rem 0">⏱ <span id="nsClock">0:00</span> survived</div>');
    setTimeout(() => { if(!G.waveActive && G.wave === 0) startWave(); }, 12000);   // first wave after a 12s build window
  };
  const fmtT = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const origOver = window.gameOver;
  window.gameOver = function(){
    clearInterval(autoT); clearInterval(clockT);
    origOver.apply(this, arguments);
    if(SETUP.mode !== 'endless') return;
    const best = JSON.parse(localStorage.getItem('ns_endless_best') || '{"wave":0,"t":0}'), t = G.alive || 0, nb = G.wave > best.wave || (G.wave === best.wave && t > best.t);
    if(nb) localStorage.setItem('ns_endless_best', JSON.stringify({ wave:G.wave, t }));
    const h = document.querySelector('#modalBox h2');
    if(h) h.insertAdjacentHTML('afterend', `<p style="color:var(--gold);font-weight:800;margin:.3rem 0">♾️ Survived ${fmtT(t)} and reached wave ${G.wave}${nb ? ' · 🏆 New best!' : ` · Best: wave ${best.wave}`}</p>`);
  };

  /* ================= start screen ================= */
  const origRender = window.renderStart;
  window.renderStart = function(){
    origRender.apply(this, arguments);
    const dp = document.getElementById('diffPick'); if(!dp) return;
    let box = document.getElementById('nsExtra');
    if(!box){ box = document.createElement('div'); box.id = 'nsExtra'; dp.insertAdjacentElement('afterend', box); }
    const best = JSON.parse(localStorage.getItem('ns_endless_best') || '{"wave":0,"t":0}');
    box.innerHTML = `<div style="margin-top:.9rem;font-weight:700;font-size:.85rem;color:var(--dim);letter-spacing:.06em;text-transform:uppercase">Mode</div>
      <div class="pickrow">${[['classic','🛡️ Classic','Start each wave yourself'],['endless','♾️ Endless Survival',best.wave ? `Best: wave ${best.wave} · ${fmtT(best.t)}` : 'Waves never stop coming']].map(([k, n, d]) => `<div class="pill ${SETUP.mode === k ? 'on' : ''}" onclick="SETUP.mode='${k}';renderStart()"><div class="pn">${n}</div><div class="pd">${d}</div></div>`).join('')}</div>
      <button class="btn ghost" style="margin-top:.7rem" onclick="mapEditor()">✏️ Map editor</button>`;
  };
  loadMaps();
  const h = location.hash.match(/#map=([\w-]+)/);
  if(h){ history.replaceState(null, '', location.pathname); try{ const m = dec(h[1]); if(Array.isArray(m.path) && m.path.length > 2){ const maps = myMaps(), k = 'my_' + Date.now().toString(36); maps[k] = { name:String(m.name || 'Shared map').slice(0, 20), path:m.path.slice(0, 80).map(p => [+p[0], +p[1]]), len:lenOf(m.path) }; saveMaps(maps); SETUP.map = k; setTimeout(() => toast(`Map "${maps[k].name}" added!`), 400); } }catch(e){} }
  renderStart();
})();
