/* GXY Hockey add-ons: 🏆 Playoff tournament (8-team bracket of shootout games) and ⚔️ Shootout Challenges
   (play a seeded shootout, send the link, your friend faces the same goalie pattern and tries to beat your score).
   Uses the page's SETUP, G, HK_CITIES, startGame, endGame, showScreen2, showModal, closeModal, toast, esc. */
(function(){
  const LS = { get:(k, d) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } }, set:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const realRandom = Math.random;
  let MODE = null;   // 'playoffs' | 'challenge' | null

  /* ================= shared: play one shootout period ================= */
  function playPeriod(diff, seed){
    SETUP.diff = diff;
    if(seed != null) Math.random = mulberry(seed);
    closeModal(); showScreen2('start'); startGame();
  }
  const origEnd = window.endGame;
  window.endGame = function(){
    const was = G && G.over; origEnd.apply(this, arguments);
    Math.random = realRandom;
    if(was || !MODE) return addChallengeButton();
    window._allowClose = true;
    if(MODE === 'playoffs') return playoffResult(G.goals, G.score);
    if(MODE === 'challenge') return challengeResult(G.goals, G.score);
  };

  /* ================= playoffs ================= */
  const teamName = t => `${t.city} (${t.abbr})`;
  window.hkPlayoffs = function(){
    const save = LS.get('hk_po', null);
    if(save && !save.done) return bracket();
    window._allowClose = true;
    showModal(`<h2>🏆 Playoffs</h2><p style="color:var(--dim);font-size:.88rem;margin:.4rem 0 .8rem">Eight teams, three rounds, one Cup. Each game is a shootout period: outscore the other team's shooters to advance. The goalies get tougher every round.</p>
      <div style="font-weight:700;margin-bottom:.4rem">Pick your team</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:46vh;overflow:auto">${HK_CITIES.map((t, i) => `<button class="btn ghost" style="border-left:6px solid ${t.color};text-align:left" onclick="hkPoStart(${i})">${esc(teamName(t))}</button>`).join('')}</div>
      <button class="btn ghost big" style="margin-top:.6rem" onclick="closeModal()">Cancel</button>`);
  };
  window.hkPoStart = function(i){
    const others = HK_CITIES.filter((_, j) => j !== i).sort(() => realRandom() - .5).slice(0, 7);
    const seeds = [HK_CITIES[i], ...others].map(t => ({ ...t, me:t === HK_CITIES[i] }));
    const r0 = []; for(let k = 0; k < 8; k += 2) r0.push({ a:seeds[k], b:seeds[k + 1], sa:null, sb:null });
    LS.set('hk_po', { rounds:[r0, [{}, {}], [{}]], cur:0, done:false });
    bracket();
  };
  const RN = ['Quarterfinal', 'Semifinal', 'Cup Final'], DIFF = ['easy', 'medium', 'hard'];
  function myMatch(po){ const rd = po.rounds[po.cur]; return rd.findIndex(m => m.a && m.b && (m.a.me || m.b.me) && m.sa == null); }
  function bracket(note){
    const po = LS.get('hk_po'); window._allowClose = true;
    const champ = po.rounds[2][0].w;
    const mi = myMatch(po), m = mi >= 0 ? po.rounds[po.cur][mi] : null, opp = m ? (m.a.me ? m.b : m.a) : null;
    showModal(`<h2>🏆 ${champ ? (champ.me ? '🏆 You won the Cup!' : `${esc(champ.city)} won the Cup`) : 'Playoff Bracket'}</h2>${note || ''}
      <div style="display:flex;gap:8px;overflow-x:auto;margin:.6rem 0">${po.rounds.map((rd, r) => `<div style="flex:1;min-width:110px;display:flex;flex-direction:column;justify-content:space-around;gap:8px"><div style="font-size:.72rem;color:var(--dim);text-align:center">${RN[r]}</div>
        ${rd.map(x => `<div style="border:1px solid var(--line);border-radius:8px;overflow:hidden;font-size:.8rem">${['a','b'].map(s => { const t = x[s]; if(!t) return '<div style="padding:4px 6px;color:var(--dim)">TBD</div>';
          const won = x.w && x.w.abbr === t.abbr, lost = x.w && !won;
          return `<div style="padding:4px 6px;border-left:4px solid ${t.color};${t.me ? 'font-weight:800;' : ''}${lost ? 'opacity:.45;' : ''}${won ? 'background:#14532d;' : ''}">${esc(t.abbr)} ${x['s' + s] != null ? `<b style="float:right">${x['s' + s]}</b>` : ''}</div>`; }).join('')}</div>`).join('')}</div>`).join('')}</div>
      ${champ ? `<button class="btn red big" onclick="localStorage.removeItem('hk_po');hkPlayoffs()">New playoffs</button>`
        : opp ? `<p style="margin:.4rem 0">${RN[po.cur]} vs <b>${esc(teamName(opp))}</b> · goalie level: <b>${['Rookie','Pro','All-Star'][po.cur]}</b></p><button class="btn red big" onclick="hkPoPlay()">🏒 Drop the puck</button>`
        : `<p>You've been knocked out.</p><button class="btn red big" onclick="localStorage.removeItem('hk_po');hkPlayoffs()">Try again</button>`}
      <button class="btn ghost big" style="margin-top:.5rem" onclick="closeModal()">Close</button>`);
  }
  window.hkPoPlay = () => { MODE = 'playoffs'; playPeriod(DIFF[LS.get('hk_po').cur]); };
  // the other team's goals scale with how you've been shooting, so it stays a real contest
  function oppGoals(round){
    const hist = LS.get('hk_po_hist', []), avg = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : 6;
    return Math.max(1, Math.round(avg * (0.72 + round * 0.12) + (realRandom() * 4 - 2)));
  }
  function playoffResult(goals){
    MODE = null;
    const hist = LS.get('hk_po_hist', []); hist.push(goals); LS.set('hk_po_hist', hist.slice(-8));
    const po = LS.get('hk_po'), mi = myMatch(po), m = po.rounds[po.cur][mi], meA = m.a.me;
    let og = oppGoals(po.cur), ot = '';
    let mine = goals;
    if(og === goals){ if(realRandom() < .5){ mine++; ot = ' · You won it in overtime!'; } else { og++; ot = ' · Lost in overtime.'; } }   // OT goal decides it
    m.sa = meA ? mine : og; m.sb = meA ? og : mine; m.w = mine > og ? (meA ? m.a : m.b) : (meA ? m.b : m.a);
    goals = mine;
    // simulate the other games in this round
    po.rounds[po.cur].forEach((x, k) => { if(k === mi || x.w || !x.a || !x.b) return; x.sa = 3 + Math.floor(realRandom() * 6); x.sb = 3 + Math.floor(realRandom() * 6); if(x.sa === x.sb) x.sa++; x.w = x.sa > x.sb ? x.a : x.b; });
    const iWon = m.w.me;
    if(po.cur < 2){ po.rounds[po.cur].forEach((x, k) => { const nx = po.rounds[po.cur + 1][Math.floor(k / 2)]; nx[k % 2 ? 'b' : 'a'] = x.w; }); }
    if(iWon && po.cur < 2) po.cur++;
    if(!iWon){ // finish the bracket without you
      for(let r = po.cur + (po.cur < 2 ? 1 : 0); r <= 2; r++){ po.rounds[r].forEach((x, k) => { if(x.w || !x.a || !x.b) return; x.sa = 3 + Math.floor(realRandom() * 6); x.sb = 3 + Math.floor(realRandom() * 6); if(x.sa === x.sb) x.sa++; x.w = x.sa > x.sb ? x.a : x.b; if(r < 2){ const nx = po.rounds[r + 1][Math.floor(k / 2)]; nx[k % 2 ? 'b' : 'a'] = x.w; } }); }
      po.done = true;
    }
    if(po.rounds[2][0].w) po.done = true;
    LS.set('hk_po', po);
    if(window.GXY){ if(iWon) GXY.event('gxy-hockey', 'playoffwin'); if(po.done && po.rounds[2][0].w.me) GXY.event('gxy-hockey', 'cup'); }
    showScreen2('modes');
    bracket(`<p style="font-size:1.1rem;font-weight:800;color:${iWon ? 'var(--gold)' : 'var(--red2)'};margin:.4rem 0">${iWon ? '✅ You win' : '❌ You lose'} ${goals}–${og}${ot}</p>`);
  }

  /* ================= shootout challenges ================= */
  let CH = null;   // incoming challenge { s:seed, d:diff, sc:score, g:goals, n:name }
  window.hkChallenge = function(){
    window._allowClose = true;
    showModal(`<h2>⚔️ Shootout Challenge</h2><p style="color:var(--dim);font-size:.88rem;margin:.4rem 0 .8rem">Play a shootout, then send the link to a friend. They face the exact same goalie pattern and have to beat your score. They can send one right back.</p>
      <label style="font-size:.8rem;color:var(--dim)">Your name</label><input id="hkN" maxlength="14" value="${esc(LS.get('hk_ch_name', ''))}" style="width:100%;padding:.6rem;border-radius:10px;border:1px solid var(--line);background:var(--bg2,#0d1626);color:#fff;font-size:16px;margin:.3rem 0 .6rem">
      <div class="pickrow">${['easy','medium','hard'].map(k => `<div class="pill ${SETUP.diff === k ? 'on' : ''}" onclick="SETUP.diff='${k}';hkChallenge()"><div class="pn">${['Rookie','Pro','All-Star'][['easy','medium','hard'].indexOf(k)]}</div></div>`).join('')}</div>
      <button class="btn red big" style="margin-top:.6rem" onclick="hkChGo()">🏒 Play my challenge shot</button><button class="btn ghost big" style="margin-top:.5rem" onclick="closeModal()">Cancel</button>`);
  };
  window.hkChGo = function(){ LS.set('hk_ch_name', (document.getElementById('hkN').value || '').trim() || 'A friend'); CH = { s:Math.floor(realRandom() * 1e9), d:SETUP.diff, mine:true }; MODE = 'challenge'; playPeriod(CH.d, CH.s); };
  function challengeResult(goals, score){
    MODE = null; const name = LS.get('hk_ch_name', 'A friend');
    const link = o => location.origin + location.pathname + '#hkch=' + enc(o);
    const share = (o, txt) => `<button class="btn red big" onclick='hkShare(${JSON.stringify(link(o))}, ${JSON.stringify(txt)})'>📤 Send challenge</button>`;
    showScreen2('modes');
    if(CH.mine){
      const o = { s:CH.s, d:CH.d, sc:score, g:goals, n:name };
      showModal(`<h2>⚔️ Challenge ready</h2><p style="margin:.4rem 0">You scored <b>${goals} goals</b> and <b>${score.toLocaleString()} points</b>. Send it and see if anyone can beat it.</p>${share(o, `🏒 ${name} scored ${goals} goals (${score} pts) in GXY Hockey. Same goalie, your turn. Beat it:`)}<button class="btn ghost big" style="margin-top:.5rem" onclick="closeModal()">Done</button>`);
    } else {
      const won = score > CH.sc;
      if(window.GXY && won) GXY.event('gxy-hockey', 'challengewin');
      const back = { s:Math.floor(realRandom() * 1e9), d:CH.d, sc:score, g:goals, n:name };
      showModal(`<h2>${won ? '🏆 You beat ' + esc(CH.n) + '!' : '😤 ' + esc(CH.n) + ' wins this one'}</h2>
        <div style="display:flex;gap:.5rem;margin:.8rem 0"><div class="stat-big"><div class="l">You</div><div class="v">${score.toLocaleString()}</div></div><div class="stat-big"><div class="l">${esc(CH.n)}</div><div class="v">${CH.sc.toLocaleString()}</div></div></div>
        ${share(back, `🏒 ${name} ${won ? 'beat' : 'took on'} ${CH.n}'s challenge with ${goals} goals (${score} pts). Your move:`)}<button class="btn ghost big" style="margin-top:.5rem" onclick="closeModal()">Done</button>`);
    }
  }
  window.hkShare = (url, txt) => { if(navigator.share) navigator.share({ text:txt + '\n' + url }).catch(()=>{}); else { navigator.clipboard && navigator.clipboard.writeText(txt + '\n' + url); toast('Challenge link copied!'); } };
  function incoming(o){
    CH = o; window._allowClose = true;
    showModal(`<h2>⚔️ You've been challenged!</h2><p style="margin:.5rem 0"><b>${esc(o.n)}</b> scored <b>${o.g} goals</b> and <b>${(+o.sc).toLocaleString()} points</b> on <b>${['Rookie','Pro','All-Star'][['easy','medium','hard'].indexOf(o.d)] || 'Pro'}</b>. You get the same goalie. Beat it!</p>
      <label style="font-size:.8rem;color:var(--dim)">Your name</label><input id="hkN" maxlength="14" value="${esc(LS.get('hk_ch_name', ''))}" style="width:100%;padding:.6rem;border-radius:10px;border:1px solid var(--line);background:#0d1626;color:#fff;font-size:16px;margin:.3rem 0 .6rem">
      <button class="btn red big" onclick="hkAccept()">🏒 Accept challenge</button><button class="btn ghost big" style="margin-top:.5rem" onclick="closeModal()">Not now</button>`);
  }
  window.hkAccept = () => { LS.set('hk_ch_name', (document.getElementById('hkN').value || '').trim() || 'A friend'); MODE = 'challenge'; playPeriod(['easy','medium','hard'].includes(CH.d) ? CH.d : 'medium', +CH.s); };
  // normal shootouts get a "challenge a friend" shortcut too
  function addChallengeButton(){}

  /* ================= menu ================= */
  const modes = document.getElementById('hkModes');
  if(modes) modes.insertAdjacentHTML('beforeend', `
    <div class="mode" onclick="hkPlayoffs()"><span class="mic">🏆</span><div class="mt"><h3>Playoffs</h3><p>8-team bracket. Win three shootout games against tougher goalies to lift the Cup.</p></div><span class="arrow">→</span></div>
    <div class="mode" onclick="hkChallenge()"><span class="mic">⚔️</span><div class="mt"><h3>Shootout Challenge</h3><p>Set a score, send the link, and make your friends face the same goalie.</p></div><span class="arrow">→</span></div>`);
  const h = location.hash.match(/#hkch=([\w-]+)/);
  if(h){ history.replaceState(null, '', location.pathname); try{ const o = dec(h[1]); if(o && o.s != null) setTimeout(() => incoming(o), 500); }catch(e){} }
})();
