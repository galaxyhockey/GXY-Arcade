/* TV Battles add-on: 📈 live ratings graphs and 📡 streaming-service competition.
   - Every week's ratings for you and each rival network are recorded and drawn as a line chart (side panel + week results).
   - Three streaming services grow each week, pulling viewers (and ad money) away from broadcast TV.
   - Fight back: launch your own GXY+ service (subscribers grow with your owned shows), or sell a show to a streamer.
   Uses the page's G, airWeek, showWeekResults, renderRatings, libraryById, showModal, closeModal, toast, money, esc, clamp, rand, pick. */
(function(){
  const STREAMERS = [
    { name:'StreamVault', color:'#22c55e' }, { name:'Nimbus+', color:'#06b6d4' }, { name:'Couchly', color:'#f43f5e' } ];
  const PLUS_COST = 2500000;
  function init(){
    if(!G) return;
    if(!G.tvx) G.tvx = { hist:[], streamers:STREAMERS.map(s => ({ ...s, share:2 + Math.random() * 2, subs:Math.round(rand(1.5, 3) * 1e6) })), plus:null };
  }
  const shareTotal = () => G.tvx.streamers.reduce((a, s) => a + s.share, 0) + (G.tvx.plus ? G.tvx.plus.share : 0);

  /* ---------- weekly: streaming growth and audience drain ---------- */
  const origAir = window.airWeek;
  window.airWeek = function(){
    init();
    const r = origAir.apply(this, arguments), X = G.tvx;
    // streamers grow (cord-cutting), faster when your lineup is weak
    const weak = clamp((50 - G.rating) / 50, -.5, 1);
    X.streamers.forEach(s => { s.share = clamp(s.share + rand(.15, .55) + weak * .25 + (s.boost || 0), 1, 30); s.boost = Math.max(0, (s.boost || 0) * .7); s.subs = Math.round(s.subs * (1 + s.share / 400)); });
    // GXY+ grows with the shows you own and their quality
    let plusRev = 0;
    if(X.plus){
      const owned = G.library.filter(s => s.ownership === 'owned'), q = owned.reduce((a, s) => a + (s.q || 50), 0) / Math.max(1, owned.length);
      X.plus.share = clamp(X.plus.share + .15 + owned.length * .12 + (q - 50) / 120, .5, 35);
      X.plus.subs = Math.round(X.plus.share * 220000);
      plusRev = Math.round(X.plus.subs * 1.1);          // ~$1.10/subscriber/week
    }
    const drain = clamp(X.streamers.reduce((a, s) => a + s.share, 0) / 100 * .6, 0, .45);
    const lost = Math.round((r.revenue - (r.syndIncome || 0)) * drain);
    G.cash += plusRev - lost; r.revenue += plusRev - lost; r.net += plusRev - lost;
    r.streamLost = lost; r.plusRev = plusRev;
    G.rating = clamp(G.rating - drain * .6, 5, 100);
    X.hist.push({ w:G.week, you:+G.rating.toFixed(1), rivals:G.rivals.map(v => +v.rating.toFixed(1)), stream:+shareTotal().toFixed(1) });
    if(X.hist.length > 60) X.hist.shift();
    // a streamer sometimes tries to buy one of your owned hits
    const hits = G.library.filter(s => s.ownership === 'owned' && (s.q || 0) >= 60);
    if(hits.length && Math.random() < .12){ const s = pick(hits), st = pick(X.streamers); X.offer = { showId:s.id, streamer:st.name, price:Math.round(250000 + (s.q || 60) * 9000 * rand(.8, 1.3)) }; }
    if(window.GXY && X.plus) GXY.event('tv-battles', 'plus', X.plus.subs);
    return r;
  };

  /* ---------- chart ---------- */
  function chart(w, h){
    init(); const H = G.tvx.hist; if(H.length < 2) return '<p class="small" style="color:var(--dim)">The graph starts after your second week on air.</p>';
    const all = H.flatMap(p => [p.you, ...p.rivals, p.stream]), mx = Math.max(60, ...all) * 1.05, pad = 26;
    const x = i => pad + i / (H.length - 1) * (w - pad - 6), y = v => h - 18 - v / mx * (h - 28);
    const line = (vals, col, wd, dash) => `<polyline points="${vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linejoin="round" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`;
    let s = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">`;
    [0, .25, .5, .75, 1].forEach(f => { const v = Math.round(mx * f); s += `<line x1="${pad}" x2="${w - 6}" y1="${y(v)}" y2="${y(v)}" stroke="#ffffff14"/><text x="2" y="${y(v) + 4}" font-size="9" fill="#8ea3c7">${v}</text>`; });
    G.rivals.forEach((r, k) => s += line(H.map(p => p.rivals[k] ?? 0), r.color, 1.6));
    s += line(H.map(p => p.stream), '#94a3b8', 1.6, true);
    s += line(H.map(p => p.you), '#facc15', 3.2);
    const last = H[H.length - 1]; s += `<circle cx="${x(H.length - 1)}" cy="${y(last.you)}" r="4" fill="#facc15"><animate attributeName="r" values="3;6;3" dur="1.4s" repeatCount="indefinite"/></circle>`;
    s += `<text x="${pad}" y="${h - 4}" font-size="9" fill="#8ea3c7">Week ${H[0].w}</text><text x="${w - 6}" y="${h - 4}" font-size="9" fill="#8ea3c7" text-anchor="end">Week ${last.w}</text></svg>`;
    s += `<div style="display:flex;flex-wrap:wrap;gap:.5rem;font-size:.7rem;margin-top:.3rem"><span><b style="color:#facc15">━</b> ${esc(G.netName)}</span>${G.rivals.map(r => `<span><b style="color:${r.color}">━</b> ${esc(r.name)}</span>`).join('')}<span><b style="color:#94a3b8">┅</b> All streaming</span></div>`;
    return s;
  }

  /* ---------- side panel ---------- */
  const origRatings = window.renderRatings;
  window.renderRatings = function(){
    origRatings.apply(this, arguments); init(); if(!G) return;
    let box = document.getElementById('tvxPanel');
    if(!box){ box = document.createElement('div'); box.id = 'tvxPanel'; document.getElementById('ratingsBoard').closest('.card').insertAdjacentElement('afterend', box); }
    const X = G.tvx;
    box.innerHTML = `<div class="card"><div class="section-title">📈 Live Ratings</div>${chart(320, 170)}</div>
      <div class="card"><div class="section-title">📡 Streaming Wars</div>
        <div class="small" style="color:var(--dim);margin-bottom:.4rem">Streamers hold <b style="color:var(--ink,#fff)">${shareTotal().toFixed(1)}%</b> of the audience and it's growing. Every point they take cuts your ad money.</div>
        ${[...X.streamers, ...(X.plus ? [{ name:'GXY+ (yours)', color:'#facc15', share:X.plus.share, subs:X.plus.subs }] : [])].sort((a, b) => b.share - a.share).map(s => `<div class="result-line"><span><b style="color:${s.color}">●</b> ${esc(s.name)}</span><span class="n">${s.share.toFixed(1)}% · ${(s.subs / 1e6).toFixed(1)}M subs</span></div>`).join('')}
        ${X.plus ? `<div class="small" style="margin-top:.4rem;color:var(--gold,#facc15)">GXY+ grows with every show you own. Produce originals to feed it.</div>`
          : `<button class="btn sm" style="margin-top:.5rem;width:100%" onclick="tvxLaunch()">🚀 Launch GXY+ (${money(PLUS_COST)})</button>`}
        ${X.offer ? (() => { const s = libraryById(X.offer.showId); return s ? `<div style="margin-top:.6rem;padding:.6rem;border:1px solid var(--gold,#facc15);border-radius:10px"><b>💰 ${esc(X.offer.streamer)}</b> offers <b>${money(X.offer.price)}</b> for exclusive rights to <b>${esc(s.title)}</b>. You'd lose the show, and they'd grow.
          <div style="display:flex;gap:.4rem;margin-top:.4rem"><button class="btn sm" onclick="tvxSell(true)">Sell</button><button class="btn sm" onclick="tvxSell(false)">Keep it</button></div></div>` : ''; })() : ''}</div>`;
  };
  window.tvxLaunch = function(){
    if(G.cash < PLUS_COST) return toast(`You need ${money(PLUS_COST)} to launch a streaming service.`);
    if(!confirm(`Launch GXY+ for ${money(PLUS_COST)}? It earns subscription money every week and grows with the shows you own.`)) return;
    G.cash -= PLUS_COST; G.tvx.plus = { share:1.5, subs:330000 }; toast('🚀 GXY+ is live!'); renderRatings(); refreshHUD();
  };
  window.tvxSell = function(yes){
    const X = G.tvx, o = X.offer; X.offer = null; if(!o) return;
    if(yes){ const s = libraryById(o.showId);
      G.stations.forEach(st => Object.keys(st.schedule).forEach(k => { if(st.schedule[k] === o.showId) st.schedule[k] = null; }));
      G.library = G.library.filter(x => x.id !== o.showId); G.cash += o.price;
      const st = X.streamers.find(x => x.name === o.streamer); if(st) st.boost = 1.2;
      toast(`💰 Sold ${s ? s.title : 'the show'} to ${o.streamer} for ${money(o.price)}.`); }
    renderAll();
  };

  /* ---------- week results: graph + streaming lines ---------- */
  const origResults = window.showWeekResults;
  window.showWeekResults = function(r){
    origResults.apply(this, arguments);
    const box = document.getElementById('modalBox'), btn = box && box.querySelector('button.btn.primary.big:last-of-type');
    if(!box) return;
    const extra = `${r.streamLost ? `<div class="result-line"><span>📡 Viewers lost to streaming</span><span class="n" style="color:var(--red)">−${money(r.streamLost)}</span></div>` : ''}
      ${r.plusRev ? `<div class="result-line"><span>🚀 GXY+ subscriptions</span><span class="n" style="color:var(--green)">+${money(r.plusRev)}</span></div>` : ''}
      <div class="section-title" style="font-size:.9rem;margin-top:.8rem">📈 Ratings race</div>${chart(420, 180)}`;
    const btns = box.querySelectorAll('button'); const last = btns[btns.length - 1];
    if(last) last.insertAdjacentHTML('beforebegin', extra); else box.insertAdjacentHTML('beforeend', extra);
  };
})();
