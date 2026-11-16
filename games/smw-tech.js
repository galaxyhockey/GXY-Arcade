/* Supermarket Wars — technology + customers pack (loaded after smw-updates.js, before smw-features.js).
   Tech Lab (cash-funded research by era), store attractions + buzz + loyalty members,
   customer types per town, and tech-driven events. State lives in G.tech, lazily created. */
(function(){
const T = () => { if(!G.tech) G.tech = { done:{}, active:[], members:0, news:[] }; return G.tech; };
const has = id => !!T().done[id];
const hash = s => { let h = 2166136261; for(const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const sfx = k => window.smwSfx && window.smwSfx(k);

/* ================= TECH TREE ================= */
const ERAS = [
  { n:1, name:'Corner Store',  need:1,  emoji:'🏪' },
  { n:2, name:'Local Chain',   need:5,  emoji:'🏬' },
  { n:3, name:'Metro Power',   need:15, emoji:'🏙️' },
  { n:4, name:'National Giant',need:40, emoji:'🌎' },
];
const TECH = {
  scanners:   { era:1, e:'📟', name:'Barcode Scanners',     cost:8000,   wk:2, dd:'−5% store upkeep',              fx:{upkeep:0.95} },
  pricetags:  { era:1, e:'🏷️', name:'Digital Price Tags',   cost:10000,  wk:2, dd:'+2% profit margin',             fx:{margin:1.02} },
  cameras:    { era:1, e:'📹', name:'Security Cameras',     cost:6000,   wk:1, dd:'−25% theft & spoilage',         fx:{shrink:0.75} },
  webads:     { era:1, e:'🖱️', name:'Online Ads',           cost:9000,   wk:2, dd:'+3% more shoppers',             fx:{demand:1.03} },
  loyalty:    { era:2, e:'📱', name:'Loyalty App',          cost:30000,  wk:4, dd:'Unlocks loyalty members, who shop more often', fx:{demand:1.02}, req:'webads' },
  selfcheck:  { era:2, e:'🖥️', name:'Self-Checkout Rollout',cost:25000,  wk:3, dd:'Installs self-checkout in every store (now and future)', fx:{} },
  inventory:  { era:2, e:'📦', name:'Smart Inventory',      cost:35000,  wk:4, dd:'−30% spoilage, +8% store capacity', fx:{shrink:0.7, capacity:1.08}, req:'scanners' },
  coldchain:  { era:2, e:'❄️', name:'Cold Chain',           cost:28000,  wk:3, dd:'Fresher food: +0.3★ ratings',   fx:{sat:0.3} },
  cyber:      { era:2, e:'🛡️', name:'Cyber Security',       cost:20000,  wk:2, dd:'Protects against outages and data breaches', fx:{} },
  aipricing:  { era:3, e:'🤖', name:'AI Pricing',           cost:120000, wk:6, dd:'+4% profit margin',             fx:{margin:1.04}, req:'pricetags' },
  lockers:    { era:3, e:'🔐', name:'Pickup Lockers',       cost:90000,  wk:5, dd:'+40% online order profit',      fx:{online:1.4} },
  analytics:  { era:3, e:'📊', name:'Shopper Analytics',    cost:110000, wk:6, dd:'+5% more shoppers',             fx:{demand:1.05}, req:'loyalty' },
  campus:     { era:3, e:'🧪', name:'R&D Campus',           cost:150000, wk:6, dd:'Research two technologies at once', fx:{} },
  drones:     { era:4, e:'🚁', name:'Drone Delivery',       cost:450000, wk:8, dd:'+80% online order profit',      fx:{online:1.8}, req:'lockers' },
  robots:     { era:4, e:'🦾', name:'Robot Warehouses',     cost:500000, wk:8, dd:'−10% store upkeep',             fx:{upkeep:0.9}, req:'inventory' },
  cashierless:{ era:4, e:'🚶', name:'Cashierless Stores',   cost:600000, wk:8, dd:'Walk in, walk out: −8% upkeep, +0.4★', fx:{upkeep:0.92, sat:0.4}, req:'selfcheck' },
  aishopper:  { era:4, e:'🧠', name:'Personal AI Shopper',  cost:550000, wk:8, dd:'+6% more shoppers',             fx:{demand:1.06}, req:'analytics' },
};
const eraOf = () => ERAS.filter(e => G.stores.length >= e.need).pop().n;
function fx(type){ let m = type==='sat' ? 0 : 1; Object.keys(T().done).forEach(id => { const v = TECH[id] && TECH[id].fx[type]; if(v !== undefined){ if(type==='sat') m += v; else m *= v; } }); return m; }
const slots = () => has('campus') ? 2 : 1;
window.startResearch = function(id){
  const t = TECH[id], st = T();
  if(!t || has(id) || st.active.some(a=>a.id===id)) return;
  if(st.active.length >= slots()){ toast('Your lab is busy. '+(has('campus')?'':'Research R&D Campus to run two projects.')); return; }
  if(t.era > eraOf()){ toast('Unlocks at '+ERAS[t.era-1].need+' stores.'); return; }
  if(t.req && !has(t.req)){ toast('Requires '+TECH[t.req].name+' first.'); return; }
  if(G.cash < t.cost){ toast('Not enough cash.'); return; }
  G.cash -= t.cost; st.active.push({ id, left:t.wk });
  sfx('click'); refreshHUD(); switchTab('rnd'); saveGame(false);
};
function finishTech(id){
  T().done[id] = true;
  if(id==='selfcheck') G.stores.forEach(s => s.selfCheckout = true);
  if(id==='inventory') G.stores.forEach(s => s.capacity = Math.round(s.capacity*1.08));
  T().news.push('🔬 Research complete: '+TECH[id].e+' '+TECH[id].name+'!');
}

/* ================= ATTRACTIONS (customer draws) ================= */
const ADDONS = {
  bakery:   { e:'🥐', name:'Bakery',          cost:12000, wk:300, buzz:8 },
  cafe:     { e:'☕', name:'Café',            cost:15000, wk:400, buzz:10 },
  pharmacy: { e:'💊', name:'Pharmacy',        cost:25000, wk:600, buzz:8 },
  gas:      { e:'⛽', name:'Gas Station',     cost:30000, wk:700, buzz:6 },
  kids:     { e:'🧸', name:'Kids Play Area',  cost:8000,  wk:150, buzz:6 },
  deli:     { e:'🥪', name:'Hot Deli',        cost:14000, wk:350, buzz:8 },
};
/* ================= CUSTOMER TYPES ================= */
const TYPES = {
  families: { e:'👨‍👩‍👧', name:'Families',        likes:['kids','bakery','gas'],    price:0.5 },
  students: { e:'🎓', name:'Students',          likes:['cafe','deli'],            price:0.8 },
  seniors:  { e:'👵', name:'Seniors',           likes:['pharmacy','bakery'],      price:0.4 },
  foodies:  { e:'🍷', name:'Foodies',           likes:['cafe','deli','bakery'],   price:0.1 },
  bargain:  { e:'💸', name:'Bargain Hunters',   likes:['gas'],                    price:1 },
};
function townMix(town){
  const h = hash(town.name), inc = town.income;
  const raw = {
    families: 22 + (h%9),
    students: 8 + ((h>>4)%14) + (town.pop>60?8:0),
    seniors:  10 + ((h>>8)%12),
    foodies:  4 + inc*5 + ((h>>12)%6),
    bargain:  30 - inc*5 + ((h>>16)%8),
  };
  const sum = Object.values(raw).reduce((a,b)=>a+b,0), mix = {};
  Object.keys(raw).forEach(k => mix[k] = raw[k]/sum);
  return mix;
}
// how strongly this store's attractions match who lives in its town
function drawMult(s){
  const town = townByName(s.metro, s.town); if(!town) return 1;
  const mix = townMix(town), add = s.addons || {};
  let m = 1;
  Object.keys(add).forEach(a => { let pull = 0; Object.keys(TYPES).forEach(t => { if(TYPES[t].likes.includes(a)) pull += mix[t]; }); m += 0.03 + pull*0.18; });
  // price fit: price-sensitive crowds punish high prices a little more
  const sens = Object.keys(TYPES).reduce((a,t)=>a+mix[t]*TYPES[t].price,0);
  m *= 1 - Math.max(0, s.priceMult-1.35)*sens*0.25;
  m *= 1 + Math.min(100, s.buzz||0)/400;                         // buzz: up to +25%
  if(has('loyalty')) m *= 1 + Math.min(0.12, (T().members||0) / Math.max(1, G.stores.length*25000));
  return Math.max(0.6, m);
}
// apply draws inside the sim: lift each of your stores' pull for that town's calculation only
const _sim = E.simTown;
E.simTown = function(town, mine, rivals){
  const saved = mine.map(s => s.reputation);
  mine.forEach(s => s.reputation = s.reputation * drawMult(s));
  try{ return _sim(town, mine, rivals); } finally { mine.forEach((s,i) => s.reputation = saved[i]); }
};
window.buyAddon = function(id, a){
  const s = G.stores.find(x=>x.id===id), d = ADDONS[a]; if(!s || !d || G.cash < d.cost) return;
  G.cash -= d.cost; (s.addons = s.addons || {})[a] = true; s.buzz = Math.min(100, (s.buzz||0) + 25);
  sfx('open'); toast(d.e+' '+d.name+' opened at '+s.town+'!'); refreshHUD(); refreshStoreModal(id); saveGame(false);
};
window.hostEvent = function(id){
  const s = G.stores.find(x=>x.id===id); if(!s || G.cash < 2000) return;
  G.cash -= 2000; s.buzz = Math.min(100, (s.buzz||0) + 35);
  toast('🎉 Tasting day at '+s.town+'! Buzz is up.'); sfx('cash'); refreshHUD(); refreshStoreModal(id); saveGame(false);
};

/* ================= demand hook (shared) ================= */
const _sem = window.seasonEventMult;
window.seasonEventMult = function(){ return _sem() * (G ? fx('demand') : 1); };

/* ================= WEEKLY TICK (wraps the week before the summary pack sees it) ================= */
const _adv = window.advanceWeek;
window.advanceWeek = function(){
  if(!G) return _adv();
  const wk = G.week, yr = G.year;
  _adv();
  if(!G || (G.week===wk && G.year===yr)) return;
  const st = T(), u = G.upd || {};
  // research progress
  st.active.forEach(a => a.left--);
  st.active.filter(a => a.left <= 0).forEach(a => finishTech(a.id));
  st.active = st.active.filter(a => a.left > 0);
  if(has('selfcheck')) G.stores.forEach(s => s.selfCheckout = true);
  // money effects of finished tech
  let extra = 0;
  G.stores.forEach(s => {
    extra += E.storeUpkeep(s) * (1 - fx('upkeep'));
    extra += (s.lastRev||0) * (1 - 1/s.priceMult) * (fx('margin') - 1);
    if(s.addons) Object.keys(s.addons).forEach(a => extra -= ADDONS[a].wk);              // attraction running costs
    if(s.addons) extra += (s.lastRev||0) * 0.01 * Object.keys(s.addons).length;          // their own sales (coffee, fuel, prescriptions)
    // ratings: tech bonus (steady-state ≈ fx('sat')), attractions add a little too
    const bonus = fx('sat') + Object.keys(s.addons||{}).length*0.08;
    if(s.sat) s.sat = Math.min(5, s.sat + bonus*0.3);
    s.buzz = Math.max(0, (s.buzz||0)*0.9 + Object.keys(s.addons||{}).reduce((a,k)=>a+ADDONS[k].buzz*0.1,0));
  });
  extra += (u.shrink||0) * (1 - fx('shrink'));
  if((u.online||0) > 0) extra += u.online * (fx('online') - 1);
  // loyalty members grow with happy shoppers
  if(has('loyalty')){
    const avg = G.stores.reduce((a,s)=>a+(s.sat||3),0)/Math.max(1,G.stores.length);
    st.members = Math.max(0, Math.round(st.members + G.stores.length*(avg-2.5)*180));
  }
  techEvent();
  G.cash += extra; G.lastWeeklyNet = Math.round(G.lastWeeklyNet + extra);
  const h = G.history[G.history.length-1]; if(h){ h.net = G.lastWeeklyNet; h.nw = netWorth(); }
  if(st.news.length){ const n = st.news.splice(0); setTimeout(()=>n.forEach((m,i)=>setTimeout(()=>toast(m), i*2700)), 1200); }
  refreshHUD();
};

/* ================= TECH EVENTS ================= */
function techEvent(){
  const n = Object.keys(T().done).length; if(n < 2 || Math.random() > 0.12) return;
  const st = T(), roll = Math.random();
  if(roll < 0.3){
    if(has('cyber')){ st.news.push('🛡️ Your security team stopped a system outage before it hit the registers.'); return; }
    const loss = Math.round(G.stores.reduce((a,s)=>a+(s.lastRev||0),0)*0.04); G.cash -= loss;
    st.news.push('💥 System outage! Registers went down for a day. Lost '+money(loss)+'. (Cyber Security prevents this.)');
  } else if(roll < 0.5 && has('loyalty')){
    if(has('cyber')){ st.news.push('🛡️ Hackers tried to breach the loyalty app. Cyber Security held.'); return; }
    st.members = Math.round(st.members*0.85); G.stores.forEach(s => s.reputation = Math.max(0.7, s.reputation-0.04));
    st.news.push('🔓 Data breach scare on the loyalty app! Members left and trust dipped.');
  } else if(roll < 0.75 && has('loyalty')){
    const gain = 4000 + G.stores.length*900; st.members += gain;
    st.news.push('📲 Your app went viral! +'+gain.toLocaleString()+' new loyalty members.');
  } else {
    const ids = Object.keys(st.done), t = TECH[ids[Math.floor(Math.random()*ids.length)]];
    Object.keys(G.metros).forEach(mk => (G.metros[mk].chains||[]).forEach(ch => ch.stores.forEach(r => r.quality = Math.min(1.6, r.quality+0.02))));
    st.news.push('🕵️ Rivals copied your '+t.name+'. Their stores got a little better.');
  }
}

/* ================= UI: Tech Lab tab ================= */
const _rr = window.renderRnd;
window.renderRnd = function(){
  _rr();
  const st = T(), era = eraOf();
  const card = id => {
    const t = TECH[id], done = has(id), run = st.active.find(a=>a.id===id);
    const locked = t.era > era || (t.req && !has(t.req));
    const pct = run ? Math.round((1 - run.left/t.wk)*100) : 0;
    return `<div class="store" style="${locked&&!done?'opacity:.5;':''}${done?'border-color:var(--brand);':''}">
      <div style="display:flex;gap:10px;align-items:center;"><div style="font-size:28px;">${t.e}</div><div style="flex:1;"><div class="snm">${t.name}</div><div class="sloc">${t.dd}</div></div></div>
      ${done ? '<div style="color:var(--good);font-size:12px;margin-top:8px;font-weight:700;">✓ Researched</div>'
        : run ? `<div style="margin-top:10px;height:8px;background:var(--line);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--brand);"></div></div><div style="font-size:11px;color:var(--dim);margin-top:4px;">Researching · ${run.left} week${run.left!==1?'s':''} left</div>`
        : `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;"><span style="font-size:11px;color:var(--dim);">${money(t.cost)} · ${t.wk} wk${t.req?' · needs '+TECH[t.req].name:''}</span><button class="btn sm" ${locked||G.cash<t.cost?'disabled':''} onclick="startResearch('${id}')">Research</button></div>`}
    </div>`;
  };
  const box = document.createElement('div');
  box.innerHTML = `<div class="section-title">🔬 Technology Lab · ${st.active.length}/${slots()} project${slots()>1?'s':''} running</div>
    <p style="color:var(--dim);font-size:13px;margin:-4px 0 14px;">Fund research with cash. New eras unlock as your chain grows. ${Object.keys(st.done).length} of ${Object.keys(TECH).length} technologies researched.</p>
    ${ERAS.map(e => `<div style="margin:16px 0 8px;font-weight:700;${e.n>era?'color:var(--muted);':''}">${e.emoji} Era ${e.n}: ${e.name} ${e.n>era?`<span style="font-weight:400;font-size:12px;">· unlocks at ${e.need} stores</span>`:''}</div>
      <div class="store-list">${Object.keys(TECH).filter(id=>TECH[id].era===e.n).map(card).join('')}</div>`).join('')}
    <div class="section-title" style="margin-top:26px;">Classic R&D (points)</div>`;
  const pane = document.getElementById('pane-rnd'); pane.insertBefore(box, pane.firstChild);
};

/* ================= UI: store panel ================= */
const _sd = window.storeDetailHTML;
window.storeDetailHTML = function(s, town){
  const h = _sd(s, town), mix = townMix(town), add = s.addons || {};
  const wants = a => Object.keys(TYPES).filter(t => TYPES[t].likes.includes(a)).reduce((x,t)=>x+mix[t],0);
  const buzz = Math.round(Math.min(100, s.buzz||0));
  const html = `
    <div class="section-title">Who Shops Here</div>
    <div class="store" style="margin-bottom:14px;">${Object.keys(TYPES).sort((a,b)=>mix[b]-mix[a]).map(t=>`<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0;"><span style="width:130px;">${TYPES[t].e} ${TYPES[t].name}</span><div style="flex:1;height:7px;background:var(--line);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${Math.round(mix[t]*100)}%;background:var(--brand);"></div></div><span class="mono" style="width:34px;text-align:right;">${Math.round(mix[t]*100)}%</span></div>`).join('')}
      <div style="font-size:11px;color:var(--dim);margin-top:6px;">Attractions this crowd wants are marked 🔥. Store pull: <b>${Math.round((drawMult(s)-1)*100)>=0?'+':''}${Math.round((drawMult(s)-1)*100)}%</b></div></div>
    <div class="section-title">Attractions · Buzz ${buzz}/100</div>
    <div style="height:8px;background:var(--line);border-radius:4px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:${buzz}%;background:linear-gradient(90deg,var(--brand),var(--tag));"></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:8px;">
      ${Object.keys(ADDONS).map(a => { const d = ADDONS[a], hot = wants(a) >= 0.3; return add[a]
        ? `<div class="store" style="padding:10px;border-color:var(--brand);font-size:13px;">${d.e} <b>${d.name}</b><div style="color:var(--good);font-size:11px;">Open · ${money(d.wk)}/wk</div></div>`
        : `<button class="btn ghost" style="text-align:left;padding:10px;" ${G.cash<d.cost?'disabled':''} onclick="buyAddon('${s.id}','${a}')"><div>${d.e} ${d.name}${hot?' 🔥':''}</div><div style="font-size:11px;color:var(--dim);text-transform:none;">${money(d.cost)} · ${money(d.wk)}/wk</div></button>`; }).join('')}
    </div>
    <button class="btn ghost" style="width:100%;margin-bottom:14px;" ${G.cash<2000?'disabled':''} onclick="hostEvent('${s.id}')">🎉 Host a tasting day — ${money(2000)} (+buzz)</button>`;
  return h.replace('<div class="section-title">Upgrades', html + '<div class="section-title">Upgrades');
};

/* ================= UI: overview card + tab name ================= */
const _ro = window.renderOverview;
window.renderOverview = function(){
  _ro(); const st = T();
  const run = st.active.map(a => `${TECH[a.id].e} ${TECH[a.id].name} · ${a.left} wk`).join('<br>') || '<span style="color:var(--brand);cursor:pointer;" onclick="switchTab(\'rnd\')">Nothing researching. Open the Tech Lab →</span>';
  const box = document.createElement('div');
  box.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px;">
    <div class="store"><div class="section-title">🔬 Research</div><div style="font-size:13px;line-height:1.6;">${run}</div></div>
    <div class="store"><div class="section-title">📱 Loyalty Members</div><div class="cond" style="font-size:24px;font-weight:700;">${has('loyalty')?(st.members||0).toLocaleString():'—'}</div><div style="color:var(--dim);font-size:12px;">${has('loyalty')?'Happy shoppers join; members shop more often':'Research the Loyalty App to start'}</div></div></div>`;
  const pane = document.getElementById('pane-overview'), anchor = [...pane.querySelectorAll('.section-title')].find(e=>/Market Intelligence/.test(e.textContent));
  pane.insertBefore(box, anchor || null);
};
function renameTab(){ const t = document.querySelector('#gameTabs .tab[data-tab="rnd"]'); if(t){ const lbl = t.querySelector('span:last-child') || t; lbl.textContent = 'Tech Lab'; } }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(renameTab,30)); else setTimeout(renameTab,30);
})();
