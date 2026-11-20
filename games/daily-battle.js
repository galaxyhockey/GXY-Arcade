/* Daily Word add-on: ⚔️ Word Battle, head-to-head on one device.
   Two players race to crack the same secret word (not today's puzzle), taking turns. Each sees both boards,
   so a rival's colored tiles can be clues for you too. First to solve wins the round; play a best-of series.
   Uses the page's ANSWERS, VALID_SET and WORDLEN. */
(function(){
  const COL = ['#38bdf8', '#f472b6'];
  let B = null;
  const css = document.createElement('style');
  css.textContent = `#wb{position:fixed;inset:0;z-index:50;background:#0b1020;overflow:auto;padding:12px 10px 20px;color:#eaf1fb;font-family:Inter,system-ui,sans-serif}
    #wb .hd{display:flex;align-items:center;justify-content:space-between;max-width:620px;margin:0 auto 10px}
    #wb h2{font:700 1.4rem 'Barlow Condensed';text-transform:uppercase}
    #wb .xb{background:#18233c;border:1px solid #243352;color:#93a8c6;border-radius:9px;padding:6px 10px;cursor:pointer}
    #wb .boards{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:620px;margin:0 auto}
    #wb .pb{border:2px solid #243352;border-radius:14px;padding:8px;transition:border-color .2s,box-shadow .2s}
    #wb .pb.turn{box-shadow:0 0 0 3px var(--pc)}
    #wb .pn{display:flex;justify-content:space-between;font-weight:800;margin-bottom:6px;color:var(--pc)}
    #wb .g{display:grid;grid-template-rows:repeat(6,1fr);gap:4px}
    #wb .r{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
    #wb .c{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:clamp(.9rem,4vw,1.3rem);border:2px solid #243352;border-radius:6px;text-transform:uppercase;background:#121a2e}
    #wb .c.correct{background:#22c55e;border-color:#22c55e;color:#04210f}#wb .c.present{background:#eab308;border-color:#eab308;color:#241c00}#wb .c.absent{background:#1c2740;border-color:#1c2740;color:#93a8c6}
    #wb .msg{text-align:center;min-height:1.6em;margin:10px 0;font-weight:700}
    #wb .kb{max-width:520px;margin:0 auto;display:grid;gap:5px}
    #wb .kr{display:flex;gap:4px;justify-content:center}
    #wb .k{flex:1;max-width:44px;height:50px;border-radius:7px;border:0;background:#3a4763;color:#fff;font-weight:800;cursor:pointer}
    #wb .k.wide{max-width:66px;font-size:.75rem}
    #wb .k.correct{background:#22c55e;color:#04210f}#wb .k.present{background:#eab308;color:#241c00}#wb .k.absent{background:#1c2740;color:#5d7093}
    #wb input{width:100%;font-size:16px;padding:.6rem;border-radius:10px;border:1px solid #243352;background:#18233c;color:#fff;margin:.3rem 0 .6rem}
    #wb .go{display:block;width:100%;padding:.85rem;border-radius:12px;border:0;background:linear-gradient(120deg,#22c55e,#16a34a);color:#04210f;font-weight:800;cursor:pointer;margin-top:.5rem}
    #wb .seg{display:flex;gap:6px}#wb .seg button{flex:1;padding:.55rem;border-radius:10px;background:#18233c;border:1px solid #243352;color:#eaf1fb;font-weight:700;cursor:pointer}#wb .seg .on{border-color:#22c55e}
    #wb .card{max-width:420px;margin:30px auto;background:#121a2e;border:1px solid #243352;border-radius:16px;padding:16px}`;
  document.head.appendChild(css);

  const box = () => document.getElementById('wb') || document.body.appendChild(Object.assign(document.createElement('div'), { id:'wb' }));
  const close = () => { const b = document.getElementById('wb'); if(b) b.remove(); B = null; };
  window.wordBattle = function(){
    const names = JSON.parse(localStorage.getItem('gxy_wb_names') || '["Player 1","Player 2"]');
    box().innerHTML = `<div class="card"><h2>⚔️ Word Battle</h2><p style="color:#93a8c6;font-size:.88rem;margin:.4rem 0 .8rem">Two players, one secret word. Take turns guessing on the same phone. You can see each other's colors, so every guess is a clue for your rival too. First to crack it wins the round.</p>
      <label>Player 1</label><input id="wbA" maxlength="12" value="${esc(names[0])}"><label>Player 2</label><input id="wbB" maxlength="12" value="${esc(names[1])}">
      <label>Series</label><div class="seg" id="wbS">${[1,3,5].map(n => `<button class="${n === 3 ? 'on' : ''}" data-n="${n}" onclick="[...this.parentNode.children].forEach(b=>b.classList.toggle('on',b===this))">${n === 1 ? 'One round' : 'Best of ' + n}</button>`).join('')}</div>
      <button class="go" onclick="wbStart()">Start battle</button><button class="xb" style="width:100%;margin-top:.5rem;padding:.7rem" onclick="wbClose()">Back to the daily puzzle</button></div>`;
  };
  window.wbClose = close;
  window.wbStart = function(){
    const p = [document.getElementById('wbA').value.trim() || 'Player 1', document.getElementById('wbB').value.trim() || 'Player 2'];
    localStorage.setItem('gxy_wb_names', JSON.stringify(p));
    B = { names:p, wins:[0, 0], need:Math.ceil(+document.querySelector('#wbS .on').dataset.n / 2), round:0, starter:Math.random() < .5 ? 0 : 1 };
    newRound();
  };
  function newRound(){
    B.round++; B.word = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    B.rows = [[], []]; B.cur = ''; B.turn = (B.starter + B.round - 1) % 2; B.over = false; B.msg = `${B.names[B.turn]} goes first`;
    draw();
  }
  function score(g){
    const ans = B.word.split(''), res = Array(5), cnt = {};
    ans.forEach(c => cnt[c] = (cnt[c] || 0) + 1);
    for(let i = 0; i < 5; i++) if(g[i] === ans[i]){ res[i] = 'correct'; cnt[g[i]]--; }
    for(let i = 0; i < 5; i++) if(!res[i]){ if(cnt[g[i]] > 0){ res[i] = 'present'; cnt[g[i]]--; } else res[i] = 'absent'; }
    return res;
  }
  function keyStates(){ const st = {}, rank = { absent:1, present:2, correct:3 };
    B.rows.flat().forEach(r => r.g.split('').forEach((c, i) => { if((rank[r.s[i]] || 0) > (rank[st[c]] || 0)) st[c] = r.s[i]; })); return st; }
  function draw(){
    const ks = keyStates();
    box().innerHTML = `<div class="hd"><button class="xb" onclick="wbClose()">✕</button><h2>⚔️ Round ${B.round}</h2><span style="font-weight:800"><span style="color:${COL[0]}">${B.wins[0]}</span> – <span style="color:${COL[1]}">${B.wins[1]}</span></span></div>
      <div class="boards">${[0, 1].map(p => `<div class="pb ${B.turn === p && !B.over ? 'turn' : ''}" style="--pc:${COL[p]}"><div class="pn"><span>${esc(B.names[p])}</span><span>${B.turn === p && !B.over ? '✍️' : ''}</span></div>
        <div class="g">${Array.from({ length:6 }, (_, r) => { const row = B.rows[p][r], typing = !row && r === B.rows[p].length && B.turn === p && !B.over;
          return `<div class="r">${Array.from({ length:5 }, (_, c) => row ? `<div class="c ${row.s[c]}">${row.g[c]}</div>` : `<div class="c">${typing ? (B.cur[c] || '') : ''}</div>`).join('')}</div>`; }).join('')}</div></div>`).join('')}</div>
      <div class="msg">${B.msg}</div>
      ${B.over ? `<button class="go" style="max-width:420px;margin:0 auto" onclick="wbNext()">${B.wins.some(w => w >= B.need) ? 'New battle' : 'Next round'}</button>`
        : `<div class="kb">${['QWERTYUIOP','ASDFGHJKL','<ZXCVBNM>'].map(row => `<div class="kr">${row.split('').map(k => k === '<' ? '<button class="k wide" data-k="Enter">ENTER</button>' : k === '>' ? '<button class="k wide" data-k="Backspace">⌫</button>' : `<button class="k ${ks[k] || ''}" data-k="${k}">${k}</button>`).join('')}</div>`).join('')}</div>`}`;
    box().querySelectorAll('[data-k]').forEach(b => b.onclick = () => key(b.dataset.k));
  }
  function key(k){
    if(!B || B.over) return;
    if(k === 'Enter') return submit();
    if(k === 'Backspace'){ B.cur = B.cur.slice(0, -1); return draw(); }
    if(/^[a-z]$/i.test(k) && B.cur.length < 5){ B.cur += k.toUpperCase(); draw(); }
  }
  function submit(){
    const g = B.cur, p = B.turn;
    if(g.length < 5){ B.msg = 'Five letters, please'; return draw(); }
    if(!VALID_SET.has(g)){ B.msg = `“${g.toUpperCase()}” isn't in the word list`; return draw(); }
    const s = score(g); B.rows[p].push({ g, s }); B.cur = '';
    if(g === B.word){ B.over = true; B.wins[p]++; B.msg = `🎉 ${esc(B.names[p])} cracked it in ${B.rows[p].length}! The word was <b>${B.word.toUpperCase()}</b>.`;
      if(B.wins[p] >= B.need) B.msg += `<br>🏆 <b>${esc(B.names[p])} wins the battle ${B.wins[p]}–${B.wins[1 - p]}!</b>`;
      if(window.GXY) GXY.event('gxy-daily', 'battle'); if(navigator.vibrate) navigator.vibrate([40, 50, 40]); }
    else if(B.rows[0].length >= 6 && B.rows[1].length >= 6){ B.over = true; B.msg = `Nobody got it! The word was <b>${B.word.toUpperCase()}</b>. No point this round.`; }
    else { B.turn = B.rows[1 - p].length < 6 ? 1 - p : p; B.msg = `${esc(B.names[B.turn])}'s turn`; }
    draw();
  }
  window.wbNext = function(){ if(B.wins.some(w => w >= B.need)) return wordBattle(); newRound(); };
  // the battle overlay takes the physical keyboard while it's open
  window.addEventListener('keydown', e => {
    if(!document.getElementById('wb') || !B || e.target.tagName === 'INPUT') return;
    e.stopImmediatePropagation(); e.preventDefault(); key(e.key.length === 1 ? e.key : e.key);
  }, true);
  // header button
  const btns = document.querySelector('.top .btns');
  if(btns) btns.insertAdjacentHTML('afterbegin', '<button class="ibtn" onclick="wordBattle()" title="Word Battle: head-to-head">⚔️</button>');
})();
