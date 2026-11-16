/* Supermarket Wars — update pack (loaded after the main game script).
   Adds: store satisfaction + reviews, weekly flyer + rival flyers, holiday rushes,
   theft & spoilage, online delivery, sound + music, tutorial.
   All new state is lazy-initialised so old saves keep working. */
(function(){
const DEPTS = ['🥦 Produce','🥩 Meat','🥛 Dairy','🥖 Bakery','🍿 Snacks','🧊 Frozen','🥤 Beverages','🧻 Household'];
const HOLIDAYS = [ // week (1-52), length, demand boost, favoured departments
  {wk:6,  len:1, name:'🏈 Big Game Sunday',   boost:1.10, depts:['🍿 Snacks','🥤 Beverages']},
  {wk:21, len:2, name:'🌭 Cookout Weekend',   boost:1.08, depts:['🥩 Meat','🥤 Beverages']},
  {wk:27, len:1, name:'🎆 Fourth of July',    boost:1.10, depts:['🥩 Meat','🍿 Snacks']},
  {wk:33, len:2, name:'🎒 Back to School',    boost:1.06, depts:['🍿 Snacks','🥖 Bakery']},
  {wk:47, len:1, name:'🦃 Thanksgiving',      boost:1.15, depts:['🥩 Meat','🥖 Bakery','🥦 Produce']},
  {wk:51, len:2, name:'🎄 Holiday Feast',     boost:1.12, depts:['🥖 Bakery','🥛 Dairy','🥤 Beverages']},
];
const ONLINE_COST = 25000, ONLINE_UPKEEP = 600, ONLINE_MIN_STORES = 5, SECURITY_COST = 5000;

function U(){ if(!G.upd) G.upd = { flyer:[], rivalFlyer:null, shrink:0, online:0, tutorialDone:false }; return G.upd; }
const holidayAt = w => HOLIDAYS.find(h => w >= h.wk && w < h.wk + h.len);
const nextHoliday = w => HOLIDAYS.map(h => ({h, d:(h.wk - w + 52) % 52})).sort((a,b)=>a.d-b.d)[0];
const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

/* ---------- demand: flyer + holidays plug into the existing season multiplier ---------- */
function flyerDemandMult(){
  const u = U(), hol = holidayAt(G.week);
  let m = hol ? hol.boost : 1;
  u.flyer.forEach(d => {
    let b = 0.04;                                   // each featured department lifts traffic
    if(hol && hol.depts.includes(d)) b *= 2;        // featuring what the holiday wants doubles it
    if(u.rivalFlyer === d) b *= 0.5;                // a rival featuring the same thing halves it
    m *= 1 + b;
  });
  return m;
}
const _sem = window.seasonEventMult;
window.seasonEventMult = function(){ return _sem() * (G && G.upd ? flyerDemandMult() : 1); };

/* ---------- satisfaction ---------- */
function rateStore(s){
  const town = townByName(s.metro, s.town);
  const fair = town.income <= 2 ? 1.25 : town.income >= 4 ? 1.55 : 1.38;  // what shoppers think is fair here
  const soldOut = (s.lastRev||0) >= s.capacity * 48 * 0.99;
  const parts = {
    price: Math.max(0, Math.min(1, 1 - (s.priceMult - fair) * 2.2)),
    quality: Math.max(0, Math.min(1, (s.quality - 0.7) / 0.8)),
    condition: Math.max(0, Math.min(1, (E.ageAppeal(s) - 0.62) / 0.38)),
    stock: soldOut ? 0.2 : 1,
    lines: s.selfCheckout ? 1 : soldOut ? 0.3 : 0.7,
  };
  const score = 1 + 4 * (parts.price*0.3 + parts.quality*0.25 + parts.condition*0.2 + parts.stock*0.15 + parts.lines*0.1);
  return { score, parts };
}
const REVIEW = {
  price:     ['Prices here are a ripoff.', 'Way pricier than the place down the road.', 'Great deals every week!', 'Fair prices, I always come back.'],
  quality:   ['Produce was wilted again.', 'Meat looked questionable.', 'Everything is so fresh!', 'Best quality in town.'],
  condition: ['Store looks run down.', 'Flickering lights and sticky floors.', 'Clean and bright, love it.', 'Feels brand new inside.'],
  stock:     ['Shelves were empty AGAIN.', 'Sold out of everything I needed.', 'Always well stocked.', 'Found everything on my list.'],
  lines:     ['Lines were out the door.', 'Waited 20 minutes to check out.', 'In and out in five minutes.', 'Self-checkout is a lifesaver.'],
};
const NAMES = ['Dana','Marcus','Priya','Jo','Luis','Kim','Tasha','Owen','Mei','Ray','Bea','Sam'];
function writeReview(s, r){
  const keys = Object.keys(r.parts);
  const key = keys[Math.floor(Math.random()*keys.length)];
  const good = r.parts[key] >= 0.55;
  const pool = REVIEW[key], text = pool[(good?2:0) + Math.floor(Math.random()*2)];
  const st = Math.max(1, Math.min(5, Math.round(r.score + (good?0.5:-0.5) + (Math.random()-0.5))));
  (s.reviews = s.reviews || []).unshift({ who:NAMES[Math.floor(Math.random()*NAMES.length)], st, text, wk:G.week, yr:G.year });
  s.reviews.length = Math.min(s.reviews.length, 5);
}
function avgSat(){ const r = G.stores.filter(s=>s.sat); return r.length ? r.reduce((a,s)=>a+s.sat,0)/r.length : 0; }

/* ---------- weekly wrapper ---------- */
const _adv = window.advanceWeek;
window.advanceWeek = function(){
  if(!G) return _adv();
  const u = U(), wkBefore = G.week, cashBefore = G.cash;
  const hol = holidayAt(wkBefore);
  _adv();
  if(G.week === wkBefore) return;                   // week didn't run (failed / blocked)

  let extra = 0, shrink = 0, online = 0;
  G.stores.forEach(s => {
    const rev = s.lastRev || 0;
    // satisfaction moves gradually and nudges reputation (which the sim uses)
    const r = rateStore(s);
    s.sat = s.sat ? s.sat*0.7 + r.score*0.3 : r.score;
    s.reputation = Math.max(0.7, Math.min(1.4, s.reputation + (s.sat - 3) * 0.006));
    if(Math.random() < 0.6) writeReview(s, r);
    // theft & spoilage
    const soldOut = rev >= s.capacity * 48 * 0.99;
    let rate = 0.012 + (s.ageWeeks/52)*0.0008 + (soldOut ? 0 : 0.008);   // unsold stock spoils
    if(s.security) rate -= 0.006;
    if(typeof storeSupplyDiscount === 'function' && storeSupplyDiscount(s) > 0) rate -= 0.004;
    shrink += rev * Math.max(0.003, rate);
    // online delivery
    if(s.online){ online += rev * 0.08 * (1 - 1/s.priceMult) * (s.sat/5) * 1.6 - ONLINE_UPKEEP; }
  });
  // flyer cost: discounted items eat margin
  const flyerCost = G.stores.reduce((a,s)=>a+(s.lastRev||0),0) * 0.012 * u.flyer.length;
  extra = online - shrink - flyerCost;
  u.shrink = Math.round(shrink); u.online = Math.round(online); u.flyerCost = Math.round(flyerCost);
  G.cash += extra;
  G.lastWeeklyNet = Math.round(G.lastWeeklyNet + extra);
  const h = G.history[G.history.length-1]; if(h){ h.net = G.lastWeeklyNet; h.nw = netWorth(); }
  // rivals pick their own flyer for next week
  u.rivalFlyer = DEPTS[Math.floor(Math.random()*DEPTS.length)];
  const nh = holidayAt(G.week);
  if(nh && nh !== hol) setTimeout(()=>toast(nh.name+' rush is here! Feature '+nh.depts.join(', ')+' in your flyer.'), 900);
  refreshHUD(); switchTab(document.querySelector('#gameTabs .tab.on').dataset.tab); saveGame(false);
  sfx(G.cash >= cashBefore ? 'cash' : 'loss');
};

/* ---------- UI: flyer modal ---------- */
window.openFlyer = function(){
  const u = U(), hol = holidayAt(G.week), nh = nextHoliday(G.week);
  showModal(`<h2>📰 Weekly Flyer</h2>
    <p style="color:var(--dim);font-size:13px;margin:6px 0 12px;">Feature up to 3 departments. Each one brings in ~4% more shoppers but costs ~1.2% of sales in discounts.
    Holiday favourites count double; if a rival features the same department, you only get half.</p>
    ${hol?`<div class="store" style="margin-bottom:10px;"><b>${hol.name}</b> is on now. Shoppers want: ${hol.depts.join(', ')}</div>`
         :`<div style="color:var(--dim);font-size:12px;margin-bottom:10px;">Next rush: <b>${nh.h.name}</b> in ${nh.d} week${nh.d!==1?'s':''} (${nh.h.depts.join(', ')})</div>`}
    <div style="color:var(--dim);font-size:12px;margin-bottom:10px;">🕵️ Rival flyer this week: <b>${u.rivalFlyer||'unknown'}</b></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">
      ${DEPTS.map(d=>`<button class="btn ${u.flyer.includes(d)?'':'ghost'}" onclick="toggleFlyer('${d}')">${d}${hol&&hol.depts.includes(d)?' 🔥':''}</button>`).join('')}
    </div>
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:16px;">Done</button>`);
};
window.toggleFlyer = function(d){
  const u = U(), i = u.flyer.indexOf(d);
  if(i >= 0) u.flyer.splice(i,1); else if(u.flyer.length < 3) u.flyer.push(d); else toast('Flyer is full: 3 departments max.');
  sfx('click'); openFlyer();
};

/* ---------- UI: store panel additions ---------- */
const _sd = window.storeDetailHTML;
window.storeDetailHTML = function(s, town){
  const html = _sd(s, town);
  const sat = s.sat || rateStore(s).score;
  const unlocked = G.stores.length >= ONLINE_MIN_STORES;
  const add = `
    <div class="section-title" style="margin-top:6px;">Customer Satisfaction</div>
    <div class="store" style="margin-bottom:14px;">
      <div style="font-size:22px;color:#f5c518;letter-spacing:2px;">${stars(sat)} <span style="color:var(--dim);font-size:14px;">${sat.toFixed(1)} / 5</span></div>
      ${(s.reviews||[]).map(r=>`<div style="font-size:12px;margin-top:6px;"><span style="color:#f5c518;">${'★'.repeat(r.st)}</span> <b>${esc(r.who)}</b>: “${esc(r.text)}”</div>`).join('') || '<div style="color:var(--dim);font-size:12px;margin-top:6px;">No reviews yet. Advance a week.</div>'}
    </div>
    <div class="section-title">Upgrades</div>
    <div style="display:grid;gap:8px;margin-bottom:14px;">
      ${s.security?'<div style="color:var(--good);font-size:12px;">🔒 Security system installed (less theft)</div>'
        :`<button class="btn ghost" style="text-align:left;" onclick="buyUpgrade('${s.id}','security')" ${G.cash<SECURITY_COST?'disabled':''}>🔒 Security system — ${money(SECURITY_COST)} <span style="color:var(--dim);font-size:12px;">(cuts theft)</span></button>`}
      ${s.online?'<div style="color:var(--good);font-size:12px;">🚚 Online orders & delivery active</div>'
        : unlocked?`<button class="btn ghost" style="text-align:left;" onclick="buyUpgrade('${s.id}','online')" ${G.cash<ONLINE_COST?'disabled':''}>🚚 Online orders & delivery — ${money(ONLINE_COST)} <span style="color:var(--dim);font-size:12px;">(+${money(ONLINE_UPKEEP)}/wk upkeep, earns more with happy customers)</span></button>`
        :`<div style="color:var(--muted);font-size:12px;">🚚 Online delivery unlocks at ${ONLINE_MIN_STORES} stores.</div>`}
    </div>`;
  return html.replace('<div class="section-title">Pricing', add + '<div class="section-title">Pricing');
};
window.buyUpgrade = function(id, kind){
  const s = G.stores.find(x=>x.id===id), cost = kind==='online'?ONLINE_COST:SECURITY_COST;
  if(!s || G.cash < cost) return;
  G.cash -= cost; s[kind] = true; sfx('open');
  toast(kind==='online' ? '🚚 '+s.town+' now takes online orders!' : '🔒 Security installed at '+s.town);
  refreshHUD(); refreshStoreModal(id); saveGame(false);
};

/* ---------- UI: overview card ---------- */
const _ro = window.renderOverview;
window.renderOverview = function(){
  _ro();
  const u = U(), hol = holidayAt(G.week), nh = nextHoliday(G.week), a = avgSat();
  const box = document.createElement('div');
  box.innerHTML = `<div class="section-title">This Week</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px;">
    <div class="store"><div class="section-title">Customer Rating</div><div style="font-size:22px;color:#f5c518;">${a?stars(a):'—'}</div><div style="color:var(--dim);font-size:12px;">${a?a.toFixed(1)+' avg across stores':'Rated after your first week'}</div></div>
    <div class="store" style="cursor:pointer;" onclick="openFlyer()"><div class="section-title">📰 Weekly Flyer</div><div style="font-size:13px;line-height:1.6;">${u.flyer.length?u.flyer.join('<br>'):'Nothing featured. <span style="color:var(--brand);">Tap to plan.</span>'}</div></div>
    <div class="store"><div class="section-title">${hol?'Holiday Rush':'Next Holiday'}</div><div class="cond" style="font-size:20px;font-weight:700;">${hol?hol.name:nh.h.name}</div><div style="color:var(--dim);font-size:12px;">${hol?'Demand is up! Wants '+hol.depts.join(', '):'In '+nh.d+' week'+(nh.d!==1?'s':'')}</div></div>
    <div class="store"><div class="section-title">Theft & Spoilage</div><div class="cond" style="font-size:22px;font-weight:700;color:var(--bad);">-${money(u.shrink||0)}</div><div style="color:var(--dim);font-size:12px;">${u.online?'🚚 Online: '+(u.online>=0?'+':'')+money(u.online)+' · ':''}Flyer discounts: -${money(u.flyerCost||0)}</div></div>
  </div>`;
  const pane = document.getElementById('pane-overview');
  pane.insertBefore(box, pane.children[1] || null);
};

/* ---------- sound + music (synthesised, no files) ---------- */
let ac = null, musicOn = false, musicTimer = null;
const pref = (k,d) => { try{ const v = localStorage.getItem('smw_'+k); return v===null?d:v==='1'; }catch(e){ return d; } };
const setPref = (k,v) => { try{ localStorage.setItem('smw_'+k, v?'1':'0'); }catch(e){} };
let sfxOn = pref('sfx', true);
function ctx(){ if(!ac){ try{ ac = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(ac && ac.state==='suspended') ac.resume(); return ac; }
function tone(f, t0, dur, type='square', vol=0.08){
  const a = ctx(); if(!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, a.currentTime+t0);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+t0+dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime+t0); o.stop(a.currentTime+t0+dur+0.02);
}
function sfx(kind){
  try{ const p={cash:15,loss:[40,40,40],open:[20,30,60],click:8}[kind]; if(p && navigator.vibrate) navigator.vibrate(p); }catch(e){}   // haptics on phones
  if(!sfxOn) return;
  if(kind==='cash'){ tone(1568,0,0.08); tone(2093,0.07,0.25,'triangle',0.1); }          // cha-ching
  else if(kind==='loss'){ tone(220,0,0.15,'sawtooth',0.06); tone(165,0.12,0.25,'sawtooth',0.06); }
  else if(kind==='open'){ [523,659,784,1047].forEach((f,i)=>tone(f,i*0.09,0.18,'triangle',0.09)); }
  else if(kind==='click'){ tone(880,0,0.04,'square',0.04); }
}
window.smwSfx = sfx;
const SONG = [262,330,392,330, 294,349,440,349, 262,330,392,523, 494,392,330,294]; // easy-listening store muzak
function playMusic(){
  let i = 0; clearInterval(musicTimer);
  musicTimer = setInterval(()=>{ const f = SONG[i++ % SONG.length]; tone(f,0,0.32,'triangle',0.035); if(i%4===1) tone(f/2,0,0.6,'sine',0.04); }, 340);
}
function setMusic(on){ musicOn = on; setPref('music', on); if(on){ ctx(); playMusic(); } else clearInterval(musicTimer); updateAudioBtns(); }
function updateAudioBtns(){
  const m = document.getElementById('btnMusic'), s = document.getElementById('btnSfx');
  if(m){ m.textContent = '🎵'; m.style.opacity = musicOn?1:0.45; }
  if(s) s.textContent = sfxOn ? '🔊' : '🔇';
}
window.toggleMusic = () => setMusic(!musicOn);
window.toggleSfx = () => { sfxOn = !sfxOn; setPref('sfx', sfxOn); updateAudioBtns(); sfx('click'); };
// jingle whenever a new store opens, wherever it was opened from
let lastCount = null;
setInterval(()=>{ if(!G) { lastCount = null; return; } if(lastCount !== null && G.stores.length > lastCount) sfx('open'); lastCount = G.stores.length; }, 400);

/* ---------- tutorial ---------- */
const STEPS = [
  ['👋 Welcome to Supermarket Wars', 'You run a grocery chain. Every week, shoppers in each town split their spending between you and the rival stores. The goal is to grow from one store into a national empire.'],
  ['▶ Advance Week', 'Press <b>Advance Week</b> (or Enter) to run one week. Your stores earn money, pay their costs, and the top bar updates your cash and weekly profit.'],
  ['🏪 My Stores', 'Open <b>My Stores</b> and tap a store to set its price. Budget towns want low prices, rich towns want quality. Check the star rating and reviews to see what shoppers think.'],
  ['📰 Weekly Flyer', 'Use the <b>📰</b> button to feature up to 3 departments each week. Match the holiday rush (🔥) for double the effect, and avoid whatever the rival is featuring.'],
  ['🗺️ Expand', 'Once you have cash to spare, use <b>Expand</b> or the <b>Metro Map</b> to open more stores. At 5 stores you unlock online delivery.'],
  ['🎉 You\'re ready', 'Watch out for theft, spoilage and aging stores. Use 🔊 and 🎵 to switch sounds and music, and <b>?</b> to replay this guide any time. Good luck!'],
];
window.showTutorial = function(i=0){
  const [t, b] = STEPS[i];
  showModal(`<div style="color:var(--muted);font-size:11px;font-family:'Space Mono';">STEP ${i+1} OF ${STEPS.length}</div><h2>${t}</h2>
    <p style="color:var(--dim);line-height:1.6;margin:10px 0 18px;">${b}</p>
    <div style="display:flex;gap:8px;">
      ${i<STEPS.length-1?`<button class="btn" onclick="showTutorial(${i+1})">Next →</button><button class="btn ghost" onclick="endTutorial()">Skip</button>`
        :`<button class="btn" onclick="endTutorial()">Let's go!</button>`}
    </div>`);
  sfx('click');
};
window.endTutorial = function(){ closeModal('modal'); if(G){ U().tutorialDone = true; saveGame(false); } };
const _fc = window.foundChain;
window.foundChain = function(){ _fc(); if(G && !U().tutorialDone && !window._smwNoTutorial) setTimeout(()=>showTutorial(0), 600); sfx('open'); };

/* ---------- HUD buttons + mode screen ---------- */
function boot(){
  const gear = document.querySelector('#scr-game .hud button[onclick="openSettings()"]');
  if(gear && !document.getElementById('btnFlyer')){
    gear.insertAdjacentHTML('beforebegin',
      `<button class="btn ghost sm" id="btnFlyer" title="Weekly flyer" onclick="openFlyer()">📰</button>
       <button class="btn ghost sm" id="btnSfx" title="Sound effects" onclick="toggleSfx()">🔊</button>
       <button class="btn ghost sm" id="btnMusic" title="Music" onclick="toggleMusic()">🎵</button>
       <button class="btn ghost sm" title="How to play" onclick="showTutorial(0)">?</button>`);
  }
  musicOn = pref('music', false); updateAudioBtns();
  // browsers only allow audio after a click, so start music on the first one
  if(musicOn) document.addEventListener('click', ()=>setMusic(true), { once:true });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* UI redesign helpers: tab icons (styles live in smw-ui.css) */
(function(){
  const ICONS = {overview:'🏠', map:'🏙️', stores:'🏪', competition:'⚔️', ranking:'🏆', stats:'📊', rnd:'🔬', ads:'📣', geomap:'🗺️', expand:'🚀'};
  function addIcons(){
    document.querySelectorAll('#gameTabs .tab').forEach(t=>{
      if(t.querySelector('.ti')) return;
      const label = t.textContent.replace('🏆','').trim();
      t.innerHTML = `<span class="ti">${ICONS[t.dataset.tab]||'•'}</span><span>${label}</span>`;
    });
  }
  // keep the chosen tab visible in the scrolling phone nav bar
  const _st = window.switchTab;
  window.switchTab = function(n){ _st(n); const t=document.querySelector('#gameTabs .tab.on'); if(t && innerWidth<=700) t.scrollIntoView({inline:'center',block:'nearest'}); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', addIcons); else addIcons();
})();

/* group the week badge + HUD buttons so the phone layout can give them their own swipeable row */
(function(){
  function wrapTools(){
    const hud = document.querySelector('#scr-game .hud'); if(!hud || hud.querySelector('.hud-tools')) return;
    const box = document.createElement('div'); box.className = 'hud-tools';
    [...hud.children].filter(el => !el.classList.contains('stat') && !el.classList.contains('spacer')).forEach(el => box.appendChild(el));
    hud.appendChild(box);
  }
  // runs after boot() adds the flyer/sound/help buttons
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(wrapTools)); else setTimeout(wrapTools);
})();
