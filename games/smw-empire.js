/* Supermarket Wars — empire pack (loaded after smw-features.js).
   Long sims + Year in Review, seasonal look, suppliers + shortages, rival stock market,
   news ticker, endgame goals + Hall of Fame. State lives in G.emp, lazily created. */
(function(){
const P = () => { if(!G.emp) G.emp = { supply:{}, short:{}, stocks:{ own:{}, price:{}, hist:{} }, news:[], goal:null, won:false }; return G.emp; };
const sfx = k => window.smwSfx && window.smwSfx(k);
const pick = a => a[Math.floor(Math.random()*a.length)];
const modalOpen = () => document.getElementById('modal').classList.contains('show');
const pref = (k,d) => { try{ const v = localStorage.getItem('smw_'+k); return v===null?d:v==='1'; }catch(e){ return d; } };
const setPref = (k,v) => { try{ localStorage.setItem('smw_'+k, v?'1':'0'); }catch(e){} };
function headline(t){ const e = P(); e.news.unshift(t); e.news.length = Math.min(e.news.length, 10); }

/* ================= SUPPLIERS + SHORTAGES ================= */
const DEPTS = ['🥦 Produce','🥩 Meat','🥛 Dairy','🥖 Bakery','🍿 Snacks','🧊 Frozen','🥤 Beverages','🧻 Household'];
const TIERS = {
  cheap:   { name:'Bargain',  margin:0.03,  sat:-0.15, risk:0.06 },
  local:   { name:'Local',    margin:0,     sat:0.10,  risk:0.025 },
  premium: { name:'Premium',  margin:-0.03, sat:0.30,  risk:0.012 },
};
const tierOf = d => TIERS[P().supply[d] || 'local'];
const supplyAvg = k => DEPTS.reduce((a,d)=>a+tierOf(d)[k],0)/DEPTS.length;
window.setSupplier = function(d, t){ P().supply[d] = t; sfx('click'); openSuppliers(); saveGame(false); };
window.openSuppliers = function(){
  const e = P();
  showModal(`<h2>🚛 Suppliers</h2>
    <p style="color:var(--dim);font-size:13px;margin:6px 0 12px;">Pick a supplier for each department. Bargain = more profit, worse food, more shortages. Premium = happier shoppers, thinner margins, reliable. A shortage cuts traffic, and hurts twice if that department is in your flyer.</p>
    ${DEPTS.map(d=>{ const cur = e.supply[d]||'local', out = e.short[d];
      return `<div class="store" style="margin-bottom:8px;padding:10px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><b>${d}</b>${out?`<span style="color:var(--bad);font-size:12px;font-weight:700;">⚠️ Shortage · ${out} wk</span>`:''}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">${Object.keys(TIERS).map(t=>`<button class="btn sm ${cur===t?'':'ghost'}" onclick="setSupplier('${d}','${t}')">${TIERS[t].name}</button>`).join('')}</div></div>`; }).join('')}
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:8px;">Done</button>`);
};
// shortages and the flyer clash feed demand through the shared season multiplier
const _sem = window.seasonEventMult;
window.seasonEventMult = function(){
  let m = _sem(); if(!G || !G.emp) return m;
  const fly = (G.upd && G.upd.flyer) || [];
  Object.keys(G.emp.short).forEach(d => { m *= fly.includes(d) ? 0.95 : 0.98; });
  return m;
};

/* ================= RIVAL STOCK MARKET ================= */
const SHARES = 100000;
function chainTotals(){
  const out = {};
  Object.keys(G.metros).filter(k=>G.metros[k].unlocked && G.metros[k].chains).forEach(mk => G.metros[mk].chains.forEach(ch => {
    const o = out[ch.name] = out[ch.name] || { name:ch.name, stores:0, cash:0 };
    o.stores += ch.stores.length; o.cash += Math.max(0, ch.cash||0);
  }));
  return out;
}
const fair = c => Math.max(1, (c.stores*60000 + c.cash*0.5) / SHARES);
function tickStocks(){
  const s = P().stocks, tot = chainTotals();
  Object.values(tot).forEach(c => {
    const prev = s.price[c.name] || fair(c);
    const next = Math.max(0.5, prev*0.75 + fair(c)*0.25) * (1 + (Math.random()-0.5)*0.08);
    s.price[c.name] = +next.toFixed(2);
    const h = s.hist[c.name] = s.hist[c.name] || []; h.push(s.price[c.name]); if(h.length > 40) h.shift();
    if(h.length > 2){ const ch = (next/h[h.length-2]-1)*100; if(Math.abs(ch) > 6) headline(`📈 ${c.name} shares ${ch>0?'jump':'slide'} ${Math.abs(ch).toFixed(1)}%`); }
  });
}
const holdingsValue = () => { const s = G.emp && G.emp.stocks; if(!s) return 0; return Object.keys(s.own).reduce((a,n)=>a+(s.own[n]||0)*(s.price[n]||0),0); };
const _nw = window.netWorth;
window.netWorth = function(){ return Math.round(_nw() + holdingsValue()); };
window.trade = function(name, qty){
  const s = P().stocks, price = s.price[name]; if(!price) return;
  const have = s.own[name] || 0;
  if(qty > 0){ const cost = price*qty*1.01; if(G.cash < cost){ toast('Not enough cash.'); return; } if(have+qty > SHARES*0.49){ toast('Regulators cap you at 49%. Use an acquisition to take full control.'); return; } G.cash -= cost; s.own[name] = have + qty; }
  else { const n = Math.min(have, -qty); if(!n) return; G.cash += price*n*0.99; s.own[name] = have - n; }
  sfx('cash'); refreshHUD(); openMarkets(); saveGame(false);
};
window.openMarkets = function(){
  const s = P().stocks, tot = chainTotals(); if(!Object.keys(s.price).length) tickStocks();
  const rows = Object.values(tot).sort((a,b)=>b.stores-a.stores).map(c => {
    const p = s.price[c.name] || fair(c), h = s.hist[c.name] || [p], own = s.own[c.name] || 0;
    const mx = Math.max(...h), mn = Math.min(...h), path = h.map((v,i)=>`${i?'L':'M'}${(i/Math.max(1,h.length-1)*120).toFixed(1)},${(24-(v-mn)/((mx-mn)||1)*22).toFixed(1)}`).join(' ');
    const up = h.length < 2 || h[h.length-1] >= h[0];
    return `<div class="store" style="margin-bottom:8px;padding:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><div><div class="snm">${esc(c.name)}</div><div class="sloc">${c.stores} stores · stake ${(own/SHARES*100).toFixed(1)}%</div></div>
        <svg viewBox="0 0 120 26" style="width:110px;height:26px;"><path d="${path}" fill="none" stroke="${up?'var(--good)':'var(--bad)'}" stroke-width="2"/></svg>
        <div class="mono" style="font-weight:700;">${money(p)}</div></div>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
        <button class="btn sm" onclick="trade('${jsq(c.name)}',1000)">Buy 1k (${money(p*1000)})</button>
        <button class="btn sm" onclick="trade('${jsq(c.name)}',10000)">Buy 10k</button>
        <button class="btn ghost sm" ${own?'':'disabled'} onclick="trade('${jsq(c.name)}',-${own})">Sell all${own?' ('+money(own*p)+')':''}</button></div></div>`;
  }).join('');
  showModal(`<h2>📈 Rival Stock Market</h2>
    <p style="color:var(--dim);font-size:13px;margin:6px 0 12px;">Buy shares in rival chains. Prices follow how big and rich each chain gets. Your stake counts toward net worth, and lowers the price if you later acquire that company. Max stake 49%, 1% trading fee.</p>
    <div class="store" style="margin-bottom:10px;padding:10px;">Portfolio value: <b class="mono">${money(holdingsValue())}</b></div>
    ${rows || '<div class="empty-hint">No rival chains in your metros yet.</div>'}
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:8px;">Close</button>`);
};
// owning shares makes a takeover cheaper; buying the company cashes out your stake
const _cv = window.companyValuation;
window.companyValuation = function(c){ const v = _cv(c), own = (G.emp && G.emp.stocks.own[c.name]) || 0; return Math.round(v * (1 - own/SHARES) / 10000) * 10000; };
const _da = window.doAcquire;
window.doAcquire = function(name, mode){ const before = (G._acquiredChains||[]).length; _da(name, mode); if((G._acquiredChains||[]).length > before && G.emp){ delete G.emp.stocks.own[name]; headline(`🤝 ${G.chainName} buys ${name} in a blockbuster deal`); } };

/* ================= ENDGAME GOALS + HALL OF FAME ================= */
const GOALS = {
  rank1:   { e:'🥇', name:'#1 in the Nation',     dd:'Become the top grocery chain nationally', test:()=>myRank()===1, prog:()=>'Rank #'+myRank() },
  billion: { e:'💎', name:'Billion-Dollar Empire', dd:'Reach $1,000,000,000 net worth',          test:()=>netWorth()>=1e9, prog:()=>money(netWorth())+' / $1B' },
  metros:  { e:'🗺️', name:'Coast to Coast',        dd:'Operate in 10 metros',                    test:()=>Object.keys(G.metros).filter(k=>G.metros[k].unlocked).length>=10, prog:()=>Object.keys(G.metros).filter(k=>G.metros[k].unlocked).length+' / 10 metros' },
  stores:  { e:'🏬', name:'Store Titan',           dd:'Own 300 stores',                          test:()=>G.stores.length>=300, prog:()=>G.stores.length+' / 300 stores' },
  takeover:{ e:'🦈', name:'Corporate Raider',      dd:'Acquire 3 rival companies',               test:()=>(G._acquiredChains||[]).length>=3, prog:()=>(G._acquiredChains||[]).length+' / 3 companies' },
};
window.pickEndgame = function(){
  showModal(`<h2>🏁 Choose Your Endgame Goal</h2><p style="color:var(--dim);font-size:13px;margin:6px 0 12px;">Win the game by reaching it. Your score goes to the Hall of Fame, and the faster you get there, the higher it is. You can keep playing afterwards.</p>
    <div style="display:grid;gap:8px;">${Object.keys(GOALS).map(k=>`<button class="btn ghost" style="text-align:left;padding:12px;" onclick="setEndgame('${k}')"><div style="font-weight:700;">${GOALS[k].e} ${GOALS[k].name}</div><div style="color:var(--dim);font-size:12px;text-transform:none;">${GOALS[k].dd}</div></button>`).join('')}</div>
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:10px;">Later</button>`);
};
window.setEndgame = function(k){ P().goal = k; P().goalStart = (G.f2&&G.f2.weeks)||0; closeModal('modal'); toast(GOALS[k].e+' Goal set: '+GOALS[k].name); switchTab('overview'); saveGame(false); };
const HOF = 'smw_hall_of_fame';
const hof = () => { try{ return JSON.parse(localStorage.getItem(HOF)||'[]'); }catch(e){ return []; } };
function checkWin(){
  const e = P(); if(!e.goal || e.won || !GOALS[e.goal].test()) return;
  e.won = true;
  const weeks = Math.max(1, ((G.f2&&G.f2.weeks)||0)), years = (weeks/52).toFixed(1);
  const score = Math.round(netWorth()/1000 * Math.max(0.5, 3 - weeks/104));
  const list = hof(); list.push({ chain:G.chainName, goal:GOALS[e.goal].name, score, years, date:new Date().toLocaleDateString() });
  list.sort((a,b)=>b.score-a.score); try{ localStorage.setItem(HOF, JSON.stringify(list.slice(0,10))); }catch(_){}
  headline(`🏁 ${G.chainName} achieves "${GOALS[e.goal].name}"`);
  setTimeout(()=>{ sfx('open'); showModal(`<h2>🏆 You Win!</h2><div style="font-size:44px;">${GOALS[e.goal].e}</div>
    <p style="color:var(--dim);margin:8px 0;"><b>${esc(G.chainName)}</b> completed <b>${GOALS[e.goal].name}</b> in ${years} years.</p>
    <div class="cond" style="font-size:40px;font-weight:700;color:var(--good);">${score.toLocaleString()} pts</div>
    <button class="btn" onclick="openHallOfFame()" style="margin-top:12px;">Hall of Fame</button>
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:8px;">Keep playing</button>`); }, 400);
}
window.openHallOfFame = function(){
  const list = hof();
  showModal(`<h2>🏛️ Hall of Fame</h2>${list.length ? list.map((r,i)=>`<div class="store" style="margin-bottom:6px;padding:10px;display:flex;gap:10px;align-items:center;"><b style="width:28px;">${['🥇','🥈','🥉'][i]||(i+1)+'.'}</b><div style="flex:1;"><b>${esc(r.chain)}</b><div class="sloc">${esc(r.goal)} · ${r.years} yrs · ${esc(r.date)}</div></div><span class="mono" style="color:var(--good);">${r.score.toLocaleString()}</span></div>`).join('') : '<div class="empty-hint">No wins yet. Pick an endgame goal and get there first.</div>'}
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:10px;">Close</button>`);
};
const _ro = window.renderOverview;
window.renderOverview = function(){
  _ro(); const e = P(), g = GOALS[e.goal];
  const box = document.createElement('div');
  box.innerHTML = g
    ? `<div class="store" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;"><div style="font-size:30px;">${g.e}</div><div style="flex:1;"><div class="section-title">Endgame Goal${e.won?' · ✅ Won':''}</div><div style="font-weight:700;">${g.name}</div><div style="color:var(--dim);font-size:12px;">${g.prog()}</div></div><button class="btn ghost sm" onclick="openHallOfFame()">🏛️</button></div>`
    : `<button class="btn" style="width:100%;margin-bottom:16px;" onclick="pickEndgame()">🏁 Choose your endgame goal</button>`;
  const pane = document.getElementById('pane-overview'); pane.insertBefore(box, pane.firstChild);
};

/* ================= WEEKLY TICK (runs inside each simulated week) ================= */
const _rw = window.smwRunWeek;
function weekTick(){
  const e = P();
  // supplier effects on money and ratings
  let extra = 0; const m = supplyAvg('margin'), sb = supplyAvg('sat');
  G.stores.forEach(s => { extra += (s.lastRev||0)*(1-1/s.priceMult)*m; if(s.sat) s.sat = Math.max(1, Math.min(5, s.sat + sb*0.3)); });
  G.cash += extra; G.lastWeeklyNet = Math.round(G.lastWeeklyNet + extra);
  // shortages tick down, new ones roll
  Object.keys(e.short).forEach(d => { if(--e.short[d] <= 0) delete e.short[d]; });
  DEPTS.forEach(d => { if(!e.short[d] && Math.random() < tierOf(d).risk){ e.short[d] = 2 + Math.floor(Math.random()*2); headline(`⚠️ ${d.slice(2)} shortage hits ${G.chainName}${(G.upd&&G.upd.flyer||[]).includes(d)?', and it was in this week\'s flyer!':''}`); } });
  tickStocks();
  // headlines from the week
  const net = G.lastWeeklyNet;
  e.best = Math.max(e.best||0, net);
  if(net >= e.best && net > 0) headline('🏆 Record week! '+G.chainName+' earns '+money(net));
  else if(net < 0 || Math.random() < 0.15) headline(net >= 0 ? `💵 ${G.chainName} posts ${money(net)} weekly profit` : `📉 ${G.chainName} loses ${money(-net)} this week`);
  try{ const ph = ECON_PHASES[G.economy.phase]; if(Math.random()<0.3) headline(`${ph.emoji} Economy watch: ${ph.name}`); }catch(_){}
  const tot = Object.values(chainTotals()).sort((a,b)=>b.stores-a.stores)[0];
  if(tot && Math.random()<0.4) headline(`🏢 ${tot.name} leads rivals with ${tot.stores} stores in your markets`);
  checkWin();
}
window.smwRunWeek = function(){ const r = _rw(); if(r) weekTick(); return r; };
const _adv = window.advanceWeek;
window.advanceWeek = function(){ _adv(); renderTicker(); };

/* ================= LONG SIMS + YEAR IN REVIEW ================= */
window.openSimMenu = function(){
  const ad = pref('autodecide', true);
  showModal(`<h2>⏩ Simulate</h2><p style="color:var(--dim);font-size:13px;margin:6px 0 12px;">Run several weeks at once and get one report at the end. The sim stops early if you are about to go broke.</p>
    <div style="display:grid;gap:8px;">
      <button class="btn" onclick="simWeeks(4)">1 Month · 4 weeks</button>
      <button class="btn" onclick="simWeeks(13)">1 Quarter · 13 weeks</button>
      <button class="btn pink" onclick="simWeeks(52)">1 Year · 52 weeks</button></div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:14px;font-size:13px;"><input type="checkbox" ${ad?'checked':''} onchange="smwSetAuto(this.checked)" style="width:20px;height:20px;"> Auto-pick the safe choice on decisions (otherwise the sim stops for you to decide)</label>
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:12px;">Cancel</button>`);
};
window.smwSetAuto = v => setPref('autodecide', v);
window.simWeeks = function(n){
  if(!G) return; closeModal('modal');
  const autoPick = pref('autodecide', true);
  const start = { cash:G.cash, nw:netWorth(), stores:G.stores.length, tech:Object.keys((G.tech&&G.tech.done)||{}), ach:[...((G.f2&&G.f2.ach)||[])], rivals:chainTotals(), week:G.week, year:G.year };
  const nets = [], decisions = []; let stopped = '';
  try{
    for(let i=0;i<n;i++){
      const r = window.smwRunWeek(); if(!r){ stopped = 'The week could not run.'; break; }
      nets.push(G.lastWeeklyNet);
      if(G.f2 && G.f2.pending != null){
        if(autoPick){ const p = G.f2.pending; decisions.push('🤔 '+window.smwResolve(p, window.smwSafeChoice(p))); }
        else { stopped = 'Stopped for a decision.'; break; }
      }
      if(G._failed){ stopped = 'Your company failed.'; break; }
      if(G.cash < 0 && netWorth() < 0){ stopped = '⚠️ Stopped early: you are about to go broke.'; break; }
      if(G.daily && G.daily.done) break;
    }
  } finally {}
  refreshHUD(); switchTab(document.querySelector('#gameTabs .tab.on').dataset.tab); saveGame(false); renderTicker();
  if(G.daily && G.daily.done) return;
  showReview(start, nets, decisions, stopped);
  if(stopped === 'Stopped for a decision.') {} // review's Continue opens the pending decision
};
function grade(pct){ return pct>=100?'A+':pct>=50?'A':pct>=20?'B':pct>=0?'C':pct>=-20?'D':'F'; }
function showReview(start, nets, decisions, stopped){
  const weeks = nets.length, isYear = weeks >= 52;
  const profit = Math.round(G.cash - start.cash), nwPct = (netWorth()/Math.max(1,start.nw)-1)*100;
  const q = []; for(let i=0;i<nets.length;i+=13) q.push(nets.slice(i,i+13).reduce((a,b)=>a+b,0));
  const mx = Math.max(1, ...q.map(Math.abs));
  const ranked = [...G.stores].sort((a,b)=>(b.lastNet||0)-(a.lastNet||0));
  const newTech = Object.keys((G.tech&&G.tech.done)||{}).filter(t=>!start.tech.includes(t)).length;
  const newAch = ((G.f2&&G.f2.ach)||[]).filter(a=>!start.ach.includes(a)).length;
  const rivalNow = chainTotals(), rivalLines = Object.values(rivalNow).sort((a,b)=>b.stores-a.stores).slice(0,4).map(c=>{ const d = c.stores - ((start.rivals[c.name]||{}).stores||0); return `${esc(c.name)}: ${c.stores} stores (${d>=0?'+':''}${d})`; });
  const g = grade(nwPct);
  showModal(`<div style="color:var(--muted);font-size:11px;font-family:'Space Mono';">${isYear?'YEAR IN REVIEW':weeks+' WEEK REPORT'} · ${start.year} WK${start.week} → ${G.year} WK${G.week}</div>
    <div style="display:flex;align-items:center;gap:14px;margin:8px 0 12px;">
      <div style="font-size:54px;font-weight:900;font-family:'Barlow Condensed';color:${g[0]==='A'?'var(--good)':g==='B'||g==='C'?'var(--tag)':'var(--bad)'};">${g}</div>
      <div><div class="cond" style="font-size:30px;font-weight:700;color:${profit>=0?'var(--good)':'var(--bad)'};">${profit>=0?'+':''}${money(profit)}</div><div style="color:var(--dim);font-size:12px;">cash change · net worth ${nwPct>=0?'+':''}${nwPct.toFixed(0)}%</div></div></div>
    ${stopped?`<div class="store" style="margin-bottom:10px;padding:10px;color:var(--warn);">${stopped}</div>`:''}
    ${q.length>1?`<div class="section-title">Profit by quarter</div><div style="display:flex;gap:8px;align-items:flex-end;height:70px;margin-bottom:12px;">${q.map((v,i)=>`<div style="flex:1;text-align:center;"><div style="height:${Math.round(Math.abs(v)/mx*52)}px;background:${v>=0?'var(--good)':'var(--bad)'};border-radius:4px 4px 0 0;"></div><div style="font-size:10px;color:var(--dim);">Q${i+1}</div></div>`).join('')}</div>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <div class="store" style="padding:10px;"><div class="section-title">🏆 Best</div><b>${esc(ranked[0].town)}</b><div class="mono net-pos">${money(ranked[0].lastNet||0)}/wk</div></div>
      <div class="store" style="padding:10px;"><div class="section-title">🐢 Worst</div><b>${esc(ranked[ranked.length-1].town)}</b><div class="mono">${money(ranked[ranked.length-1].lastNet||0)}/wk</div></div>
      <div class="store" style="padding:10px;"><div class="section-title">🏪 Stores</div><b>${start.stores} → ${G.stores.length}</b></div>
      <div class="store" style="padding:10px;"><div class="section-title">🔬 / 🏅</div><b>${newTech} tech · ${newAch} badges</b></div></div>
    ${rivalLines.length?`<div class="section-title">Rivals</div><div style="font-size:13px;line-height:1.7;margin-bottom:10px;">${rivalLines.join('<br>')}</div>`:''}
    ${decisions.length?`<div class="section-title">Decisions made for you</div><div style="font-size:12px;line-height:1.6;color:var(--dim);margin-bottom:10px;max-height:140px;overflow:auto;">${decisions.map(esc).join('<br>')}</div>`:''}
    <button class="btn" onclick="smwAfterSummary()">Continue</button>`);
  sfx(profit >= 0 ? 'cash' : 'loss');
}

/* ================= NEWS TICKER + SEASONAL LOOK ================= */
function renderTicker(){
  const el = document.getElementById('smwTicker'); if(!el || !G) return;
  const items = P().news.length ? P().news : ['📰 Welcome to the GXY Business Wire. Advance a week for the latest headlines.'];
  el.firstElementChild.innerHTML = items.concat(items).map(t=>`<span>${esc(t)}</span>`).join('');
  el.firstElementChild.style.animationDuration = Math.max(20, items.length*7)+'s';
}
const HOLI = [[6,'🏈'],[21,'🌭'],[22,'🌭'],[27,'🎆'],[33,'🎒'],[34,'🎒'],[47,'🦃'],[51,'🎄'],[52,'🎄']];
const _rh = window.refreshHUD;
window.refreshHUD = function(){
  _rh(); if(!G) return;
  try{ document.body.dataset.season = currentSeason().name.toLowerCase(); }catch(_){}
  const h = HOLI.find(x=>x[0]===G.week); document.body.dataset.holiday = h ? h[1] : '';
  const deco = document.getElementById('smwDeco'); if(deco) deco.textContent = (h ? h[1]+' ' : '') + ({spring:'🌸 🌷 🌸',summer:'☀️ 🌻 ☀️',fall:'🍂 🎃 🍂',winter:'❄️ ☃️ ❄️'}[document.body.dataset.season]||'');
};

/* ================= BOOT ================= */
function boot(){
  const skip = document.getElementById('btnSkip'); if(skip){ skip.onclick = openSimMenu; skip.title = 'Simulate a month, quarter or year'; }
  const help = [...document.querySelectorAll('#scr-game .hud button')].find(b=>b.textContent.trim()==='?');
  if(help && !document.getElementById('btnSupply')) help.insertAdjacentHTML('beforebegin',
    `<button class="btn ghost sm" id="btnSupply" title="Suppliers" onclick="openSuppliers()">🚛</button><button class="btn ghost sm" id="btnMarket" title="Rival stock market" onclick="openMarkets()">📈</button>`);
  const hud = document.querySelector('#scr-game .hud');
  if(hud && !document.getElementById('smwTicker')) hud.insertAdjacentHTML('afterend', `<div id="smwTicker" class="smw-ticker"><div></div></div>`);
  const bar = document.querySelector('.gxy-gamebar .gt');
  if(bar && !document.getElementById('smwDeco')) bar.insertAdjacentHTML('afterend', `<span id="smwDeco" class="smw-deco"></span>`);
  const grid = document.querySelector('#scr-mode .mode-grid');
  if(grid && !document.getElementById('hofCard')) grid.insertAdjacentHTML('beforeend', `<div class="mode-card" id="hofCard" onclick="openHallOfFame()"><div class="mi">🏛️</div><div class="mn">Hall of Fame</div><div class="md">Your fastest wins. Pick an endgame goal in any campaign, reach it, and get your chain on the wall.</div></div>`);
  renderTicker();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,60)); else setTimeout(boot,60);
})();
