/* Supermarket Wars add-on: 📉 economic recessions and 🤝 competitor buyouts.
   Recessions: when the economy tips into recession you choose a strategy; shoppers trade down (discount chains grow,
   premium chains close stores), rival companies get cheap to buy, and a rare Great Recession hits harder.
   Buyouts: rival chains swallow each other, and big rivals make takeover bids for your stores.
   Loaded after smw-empire.js. Uses G, GXY_METROS, ECON_PHASES, econDemandMult, companyValuation, chainOpenStore, netWorth,
   money, esc, showModal, closeModal, toast. State lives in G.smwx. */
(function(){
  const X = () => G.smwx || (G.smwx = { plan:null, great:false, recessions:0, immuneUntil:0, pending:[], lastBid:0 });
  const news = t => { if(!G.emp) return; G.emp.news.unshift(t); G.emp.news.length = Math.min(G.emp.news.length, 10); };
  const inRecession = () => G && G.economy && G.economy.phase === 'recession';
  const modalOpen = () => document.getElementById('modal') && document.getElementById('modal').classList.contains('show');
  const allChains = () => Object.entries(G.metros || {}).flatMap(([mk, M]) => (M.chains || []).map(c => ({ mk, c, M })));
  const PLANS = {
    value:  { t:'🏷️ Value mode', d:'Cut prices and push store brands. Keep shoppers coming, spend ~$900/store/week on discounts.', demand:1.1, cost:900 },
    lean:   { t:'✂️ Run lean', d:'Hiring freeze and shorter hours. Save ~$700/store/week, but some shoppers drift away.', demand:.94, cost:-700 },
    hunt:   { t:'🦈 Go bargain hunting', d:'Hold steady and buy rival companies for an extra 30% off while they\'re weak.', demand:1, cost:0, discount:.5 },
  };

  /* ---------- economy: recession start + strategy ---------- */
  const origTick = window.tickEconomy;
  window.tickEconomy = function(){
    const before = G.economy && G.economy.phase;
    origTick.apply(this, arguments);
    const x = X(), now = G.economy.phase;
    if(now === 'recession' && before !== 'recession'){
      x.great = Math.random() < .3; x.plan = null; x.recessions++;
      if(x.great) G.economy.sentiment *= .85;
      news(x.great ? '🚨 GREAT RECESSION: unemployment spikes and grocery budgets get slashed nationwide' : '📉 Economists confirm a recession. Shoppers are trading down to cheaper stores');
      x.pending.push({ kind:'recession' });
      if(window.GXY) GXY.event('supermarket-wars', 'recessions');
    }
    if(before === 'recession' && now !== 'recession'){ news('🔼 The recession is over. Consumer confidence is returning'); toast(`🔼 Recession over${x.plan ? ' · your ' + PLANS[x.plan].t.replace(/^\S+ /, '') + ' plan ends' : ''}`); x.plan = null; x.great = false; if(window.GXY) GXY.event('supermarket-wars', 'survived'); }
  };
  const origDemand = window.econDemandMult;
  window.econDemandMult = function(){
    let m = origDemand.apply(this, arguments); const x = X();
    if(inRecession()){ if(x.great) m *= .88; if(x.plan) m *= PLANS[x.plan].demand; }
    return m;
  };
  // rivals are worth less in a recession, and bargain hunters get an extra discount
  const origVal = window.companyValuation;
  window.companyValuation = function(comp){
    let v = origVal.apply(this, arguments);
    if(inRecession()){ v *= X().great ? .55 : .7; if(X().plan === 'hunt') v *= PLANS.hunt.discount / .5 * .7; }
    return Math.round(v);
  };

  /* ---------- weekly ---------- */
  const origRun = window.smwRunWeek;
  window.smwRunWeek = function(){
    const r = origRun.apply(this, arguments);
    try{ weekly(); }catch(e){ console.warn('smw-economy', e); }
    return r;
  };
  function weekly(){
    const x = X();
    if(inRecession()){
      // plan cost / savings
      if(x.plan){ const amt = PLANS[x.plan].cost * G.stores.length; G.cash -= amt; }
      // shoppers trade down: premium chains close weak stores, discounters open more
      allChains().forEach(({ mk, c }) => {
        if(c.kind === 'premium' && c.stores.length > 1 && Math.random() < (x.great ? .12 : .06)){ const s = c.stores.pop(); news(`🔒 ${c.name} closes its ${s.town} store as shoppers trade down`); }
        if(c.kind === 'discounter' && Math.random() < (x.great ? .1 : .05)){ const towns = GXY_METROS[mk].towns; const t = towns[Math.floor(Math.random() * Math.min(towns.length, 12))]; chainOpenStore(c, t, mk); news(`🏷️ ${c.name} opens a new store in ${t.name}. Discounters are booming`); }
      });
    }
    // rival consolidation: a bigger chain buys a smaller one in the same metro
    Object.entries(G.metros || {}).forEach(([mk, M]) => {
      const cs = (M.chains || []).filter(c => c.stores.length);
      if(cs.length < 3 || Math.random() > (inRecession() ? .035 : .012)) return;
      cs.sort((a, b) => b.stores.length - a.stores.length);
      const buyer = cs[0], target = cs[cs.length - 1];
      target.stores.forEach(s => { s.chain = buyer.name; s.name = buyer.name; s.kind = buyer.kind; s.priceMult = buyer.priceMult; s.quality = buyer.quality; buyer.stores.push(s); });
      M.chains = M.chains.filter(c => c !== target);
      news(`🤝 ${buyer.name} buys ${target.name} in ${GXY_METROS[mk].name || mk}, taking over ${target.stores.length} stores`);
      x.pending.push({ kind:'merger', text:`${buyer.name} just bought ${target.name} in ${GXY_METROS[mk].name || mk}. They're now a ${buyer.stores.length}-store giant in that metro.` });
    });
    // takeover bid for some of your stores
    const wk = (G.year - 2026) * 52 + G.week;
    if(G.stores.length >= 4 && wk > 20 && wk >= x.immuneUntil && wk - x.lastBid > 20 && Math.random() < (G.cash < 0 ? .25 : inRecession() ? .08 : .03)){
      const big = allChains().sort((a, b) => b.c.stores.length - a.c.stores.length)[0];
      if(big){ x.lastBid = wk; x.pending.push({ kind:'bid', bidder:big.c.name, mk:big.mk }); }
    }
  }

  /* ---------- event screens (shown when no other popup is open) ---------- */
  setInterval(() => {
    if(!G || !G.smwx || !G.smwx.pending.length || modalOpen()) return;
    const ev = G.smwx.pending.shift();
    if(ev.kind === 'recession') recessionModal();
    if(ev.kind === 'merger') { showModal(`<h2>🤝 Industry Shake-Up</h2><p style="margin:10px 0 14px">${esc(ev.text)}</p><p style="color:var(--dim);font-size:13px;margin-bottom:12px">Bigger rivals mean tougher price wars, but also a juicier target if you want to buy them out.</p><button class="btn" onclick="closeModal('modal')">Noted</button>`); }
    if(ev.kind === 'bid') bidModal(ev);
  }, 1200);
  function recessionModal(){
    const x = X();
    showModal(`<h2>${x.great ? '🚨 The Great Recession' : '📉 Recession!'}</h2>
      <p style="margin:8px 0 12px">${x.great ? 'A severe downturn. Grocery budgets are slashed and premium stores are in trouble.' : 'The economy has slipped into recession. Shoppers are counting every penny.'} How will your company respond?</p>
      <div style="font-size:12px;color:var(--dim);margin-bottom:10px">During a recession: discount chains grow, premium chains close stores, and rival companies sell for ${x.great ? '45' : '30'}% less.</div>
      ${Object.entries(PLANS).map(([k, p]) => `<button class="btn ghost" style="display:block;width:100%;text-align:left;margin-bottom:8px" onclick="smwPlan('${k}')"><b>${p.t}</b><br><span style="font-size:12px;color:var(--dim)">${p.d}</span></button>`).join('')}`);
  }
  window.smwPlan = function(k){ X().plan = k; closeModal('modal'); toast(`${PLANS[k].t} until the recession ends`); news(`📣 ${G.chainName || 'Your company'} responds to the recession: ${PLANS[k].t.replace(/^\S+ /, '')}`); };
  function bidModal(ev){
    const weak = [...G.stores].sort((a, b) => (a.lastNet || 0) - (b.lastNet || 0)).slice(0, 2);
    const val = Math.round(Math.max(netWorth() / Math.max(1, G.stores.length), 250000) * weak.length * 1.5);
    const pill = Math.round(Math.max(150000, netWorth() * .03));
    G.smwx.bid = { ...ev, ids:weak.map(s => s.id ?? s.town + '|' + s.metro), val, pill };
    showModal(`<h2>📨 Takeover Bid</h2><p style="margin:8px 0 12px"><b>${esc(ev.bidder)}</b> wants to buy your ${weak.length} weakest stores (${weak.map(s => esc(s.town)).join(' and ')}) for <b>${money(val)}</b>, 1.5× what they're worth.</p>
      <button class="btn" style="margin-bottom:8px" onclick="smwBid('sell')">💰 Sell them (${money(val)})</button>
      <button class="btn ghost" style="margin-bottom:8px" onclick="smwBid('pill')">🛡️ Poison pill: block bids for a year (${money(pill)})</button>
      <button class="btn ghost" onclick="smwBid('no')">✋ Reject</button>`);
  }
  window.smwBid = function(choice){
    const b = G.smwx.bid; closeModal('modal'); if(!b) return;
    if(choice === 'sell'){
      const key = s => s.id ?? s.town + '|' + s.metro, sold = G.stores.filter(s => b.ids.includes(key(s)));
      G.stores = G.stores.filter(s => !b.ids.includes(key(s))); G.cash += b.val;
      const ch = (G.metros[b.mk].chains || []).find(c => c.name === b.bidder);
      sold.forEach(s => { s.isRival = true; s.chain = b.bidder; s.name = b.bidder; if(ch){ s.kind = ch.kind; s.priceMult = ch.priceMult; s.quality = ch.quality; ch.stores.push(s); } });
      news(`🤝 ${b.bidder} buys ${sold.length} stores from ${G.chainName || 'you'} for ${money(b.val)}`); toast(`Sold ${sold.length} stores for ${money(b.val)}`);
    } else if(choice === 'pill'){
      G.cash -= b.pill; G.smwx.immuneUntil = (G.year - 2026) * 52 + G.week + 52; toast('🛡️ No takeover bids for a year'); news(`🛡️ ${G.chainName || 'Your company'} adopts a poison pill to fend off ${b.bidder}`);
    } else { news(`✋ ${G.chainName || 'Your company'} rejects ${b.bidder}'s takeover bid`); if(Math.random() < .3){ G.cash -= 60000; toast('⚖️ The bidder sued. Legal fees: ' + money(60000)); } }
    G.smwx.bid = null;
    if(typeof render === 'function') try{ render(); }catch(e){}
  };

  /* ---------- recession banner in the HUD ---------- */
  setInterval(() => {
    if(!G) return; let el = document.getElementById('smwRecession');
    const on = inRecession(), hud = document.getElementById('smwTicker');
    if(!on){ if(el) el.remove(); return; }
    if(!el && hud){ hud.insertAdjacentHTML('afterend', '<div id="smwRecession" style="margin:6px 0;padding:6px 10px;border-radius:10px;background:#7f1d1d;color:#fecaca;font-size:12px;font-weight:700"></div>'); el = document.getElementById('smwRecession'); }
    if(el) el.textContent = `${X().great ? '🚨 GREAT RECESSION' : '📉 RECESSION'} · week ${G.economy.weeksInPhase + 1} · shoppers trading down · rivals ${X().great ? '45' : '30'}% cheaper to buy${X().plan ? ' · plan: ' + PLANS[X().plan].t.replace(/^\S+ /, '') : ''}`;
  }, 1500);
})();
