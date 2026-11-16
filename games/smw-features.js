/* Supermarket Wars — feature pack 2 (loaded after smw-updates.js).
   Week summary, skip/auto turns, choice events, rival CEOs, goals + achievements,
   town map, daily challenge, haptics + swipe, nationwide acquisitions.
   New state lives in G.f2 and is created lazily, so old saves keep working. */
(function(){
const F = () => { if(!G.f2) G.f2 = { goal:null, goalsDone:0, ach:[], known:null, pending:null }; return G.f2; };
const sfx = k => window.smwSfx && window.smwSfx(k);
const hash = s => { let h = 2166136261; for(const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const clampRep = v => Math.max(0.7, Math.min(1.4, v));
const allStoresRep = d => G.stores.forEach(s => s.reputation = clampRep(s.reputation + d));
const modalOpen = () => document.getElementById('modal').classList.contains('show');

/* ================= RIVAL CEOs ================= */
const CEO_NAMES = ['Rex Bargain','Victoria Prime','Duke Dumont','Penny Pincher','Sterling Vale','Gus Grubb','Margo Markdown','Chad Volume','Ivy Organic','Hank Hoarder'];
const STYLES = {
  slasher:  { label:'Price Slasher',  emoji:'🔪', taunts:['You call those prices low? Cute.','I will undercut you until you cry.','Every penny you charge, I charge less.'] },
  snob:     { label:'Premium Snob',   emoji:'🍷', taunts:['Your produce is an embarrassment.','Quality is not for everyone, clearly.','My shoppers would never set foot in your aisles.'] },
  expander: { label:'Expansion Maniac',emoji:'🏗️', taunts:['I will have a store on every corner by spring.','Your towns? Soon they are mine.','Growth, growth, growth!'] },
  grinder:  { label:'Cold Grinder',   emoji:'🧊', taunts:['Efficiency wins. Feelings do not.','I have run the numbers. You lose.','Patience. You will make a mistake.'] },
};
function ceoFor(chain){ const h = hash(chain); const style = Object.keys(STYLES)[h % 4]; return { name:CEO_NAMES[(h>>3) % CEO_NAMES.length], style, ...STYLES[style] }; }
function activeChains(){ const out = []; Object.keys(G.metros).filter(k=>G.metros[k].unlocked && G.metros[k].chains).forEach(mk=>G.metros[mk].chains.forEach(ch=>out.push({ch, mk}))); return out; }
// rivals react when you open a store in a town where they operate
function ceoReactions(newStores){
  const notes = [];
  newStores.forEach(s => activeChains().forEach(({ch, mk}) => {
    if(mk !== s.metro) return;
    const theirs = ch.stores.filter(r => r.town === s.town); if(!theirs.length) return;
    const c = ceoFor(ch.name);
    if(c.style==='slasher'){ theirs.forEach(r => r.priceMult = Math.max(1.02, r.priceMult*0.92)); notes.push(`${c.emoji} ${c.name} (${ch.name}) slashed prices in ${s.town} to fight your new store!`); }
    else if(c.style==='snob'){ theirs.forEach(r => r.quality = Math.min(1.6, r.quality+0.06)); notes.push(`${c.emoji} ${c.name} (${ch.name}) upgraded their ${s.town} store to look down on yours.`); }
    else if(c.style==='expander'){ const t = GXY_METROS[mk].towns.find(t => !ch.stores.some(r=>r.town===t.name)); if(t){ chainOpenStore(ch, t, mk); notes.push(`${c.emoji} ${c.name} (${ch.name}) answered by opening a store in ${t.name}.`); } }
    else { theirs.forEach(r => r.marketing = (r.marketing||0) + 0.3); notes.push(`${c.emoji} ${c.name} (${ch.name}) launched a quiet ad blitz in ${s.town}.`); }
  }));
  return notes;
}
const _rc = window.renderCompetition;
window.renderCompetition = function(){
  _rc();
  const seen = new Set(), cards = activeChains().filter(({ch}) => !seen.has(ch.name) && seen.add(ch.name)).map(({ch}) => {
    const c = ceoFor(ch.name);
    return `<div class="store"><div style="font-size:28px;">${c.emoji}</div><div class="snm">${esc(c.name)}</div><div class="sloc">CEO of <b>${esc(ch.name)}</b> · ${c.label}</div><div style="color:var(--dim);font-size:12px;margin-top:6px;font-style:italic;">“${esc(c.taunts[0])}”</div></div>`;
  });
  if(!cards.length) return;
  const box = document.createElement('div');
  box.innerHTML = `<div class="section-title">Rival CEOs</div><div class="store-list" style="margin-bottom:20px;">${cards.join('')}</div>`;
  const pane = document.getElementById('pane-competition'); pane.insertBefore(box, pane.firstChild);
};

/* ================= CHOICE EVENTS ================= */
const k = () => Math.max(1, G.stores.length/3);
const randStore = () => pick(G.stores);
const EVENTS = [
  { t:'🥚 Cheap Egg Deal', d:'A new supplier offers eggs at half price. Word is their farm has had safety problems.',
    o:[ ['Take the deal', ()=>{ const gain=Math.round(4000*k()); G.cash+=gain; if(Math.random()<0.3){ allStoresRep(-0.08); G.cash-=Math.round(6000*k()); return 'Recall! Customers were not happy, and the cleanup cost more than you saved.'; } return 'Saved '+money(gain)+'. Nobody got sick. This time.'; }],
        ['Stick with our supplier', ()=>'Safe and boring. Your shoppers never knew.'] ] },
  { t:'✊ Workers Want a Raise', d:'Staff across your stores are asking for better pay.',
    o:[ ['Approve it', ()=>{ G.cash-=Math.round(2400*k()); allStoresRep(0.05); return 'Happy staff, happier shoppers. Ratings will rise.'; }],
        ['Negotiate', ()=>{ G.cash-=Math.round(1200*k()); if(Math.random()<0.5){ allStoresRep(-0.03); return 'A partial deal. Some grumbling at the registers.'; } return 'Both sides met in the middle. Crisis averted.'; }],
        ['Refuse', ()=>{ if(Math.random()<0.45){ G.cash-=Math.round(5000*k()); allStoresRep(-0.06); return 'Walkout! Stores ran short-staffed all week.'; } return 'They backed down. For now.'; }] ] },
  { t:'📺 TV Interview', d:'Local news wants you live on air to talk about your stores.',
    o:[ ['Go on air', ()=>{ if(Math.random()<0.75){ allStoresRep(0.05); return 'You nailed it. Shoppers loved you.'; } allStoresRep(-0.03); return 'You called a cantaloupe a watermelon on live TV. Oops.'; }],
        ['Decline', ()=>'They interviewed a rival CEO instead.'] ] },
  { t:'🧊 Freezer Failure', d:'The freezers at one of your stores are dying.',
    o:[ ['Replace them ($6,000)', ()=>{ G.cash-=6000; return 'Brand-new freezers. Ice cream is safe.'; }],
        ['Patch it ($1,500)', ()=>{ G.cash-=1500; if(Math.random()<0.5){ const s=randStore(); s.quality=Math.max(0.7,s.quality-0.06); return 'The patch failed at '+s.town+'. Spoiled stock hurt quality.'; } return 'Duct tape holds. Somehow.'; }] ] },
  { t:'🤳 Influencer Offer', d:'A big local influencer will promote your chain for $3,000.',
    o:[ ['Pay up', ()=>{ G.cash-=3000; G.stores.forEach(s=>s.marketing=(s.marketing||0)+0.25); return 'The video went viral. Traffic is up.'; }],
        ['Pass', ()=>'They promoted a rival. The comments were mean anyway.'] ] },
  { t:'🥫 Food Bank Drive', d:'The local food bank asks for a $2,000 donation.',
    o:[ ['Donate', ()=>{ G.cash-=2000; allStoresRep(0.06); return 'The town noticed. Your reputation grew.'; }],
        ['Decline', ()=>{ allStoresRep(-0.01); return 'A few shoppers were disappointed.'; }] ] },
  { t:'💼 Buyout Offer', d:'A rival offers to buy your weakest store for 1.5× its value.',
    o:[ ['Sell it', ()=>{ if(G.stores.length<2) return 'You only have one store. You kept it.'; const s=[...G.stores].sort((a,b)=>(a.lastNet||0)-(b.lastNet||0))[0]; const val=Math.round(s.capacity*8*E.ageAppeal(s)*1.5); G.cash+=val; G.stores.splice(G.stores.indexOf(s),1); return 'Sold '+s.name+' for '+money(val)+'.'; }],
        ['Refuse', ()=>'Not for sale.'] ] },
  { t:'🧪 Health Inspection', d:'An inspector is coming next week.',
    o:[ ['Deep clean ($2,500)', ()=>{ G.cash-=2500; return 'Spotless. You passed with flying colours.'; }],
        ['Risk it', ()=>{ if(Math.random()<0.6) return 'You passed. Barely.'; G.cash-=8000; allStoresRep(-0.05); return 'Failed! An $8,000 fine and bad headlines.'; }] ] },
];
function showEvent(i){
  const ev = EVENTS[i];
  showModal(`<div style="color:var(--muted);font-size:11px;font-family:'Space Mono';">DECISION</div><h2>${ev.t}</h2>
    <p style="color:var(--dim);margin:8px 0 16px;line-height:1.5;">${ev.d}</p>
    <div style="display:grid;gap:8px;">${ev.o.map((o,j)=>`<button class="btn ${j?'ghost':''}" onclick="smwChoose(${i},${j})">${o[0]}</button>`).join('')}</div>`);
  sfx('click');
}
window.smwChoose = function(i, j){
  const msg = EVENTS[i].o[j][1]();
  F().pending = null; refreshHUD();
  showModal(`<h2>${EVENTS[i].t}</h2><p style="color:var(--dim);margin:10px 0 16px;line-height:1.5;">${msg}</p><button class="btn" onclick="closeModal('modal')">Continue</button>`);
  saveGame(false);
};

/* ================= GOALS + ACHIEVEMENTS ================= */
function newGoal(){
  const avgNet = Math.max(3000, Math.abs(G.lastWeeklyNet||0));
  const reward = Math.round((3000 + G.stores.length*1200)/500)*500;
  const opts = [
    { type:'net',   text:`Earn ${money(Math.round(avgNet*1.25/500)*500)} in one week`, target:Math.round(avgNet*1.25/500)*500 },
    { type:'open',  text:'Open a new store', target:G.stores.length+1 },
    { type:'stars', text:'Get any store to ★★★★ (4.0+)', target:4 },
    { type:'cash',  text:`Reach ${money(Math.round((G.cash+avgNet*3)/1000)*1000)} cash`, target:Math.round((G.cash+avgNet*3)/1000)*1000 },
    { type:'avg',   text:'Average 3.5★ across all stores', target:3.5 },
  ];
  F().goal = { ...pick(opts), reward, until:(G.f2.weeks||0)+4 };
}
function goalMet(g){
  if(g.type==='net') return G.lastWeeklyNet >= g.target;
  if(g.type==='open') return G.stores.length >= g.target;
  if(g.type==='stars') return G.stores.some(s => (s.sat||0) >= g.target);
  if(g.type==='cash') return G.cash >= g.target;
  if(g.type==='avg'){ const r=G.stores.filter(s=>s.sat); return r.length && r.reduce((a,s)=>a+s.sat,0)/r.length >= g.target; }
}
const ACH = [
  ['profit','💵','First Profit','Finish a week in the green', ()=>G.lastWeeklyNet>0],
  ['five','🏪','Local Chain','Own 5 stores', ()=>G.stores.length>=5],
  ['fifteen','🏙️','Metro Power','Own 15 stores', ()=>G.stores.length>=15],
  ['fifty','🗺️','Regional Giant','Own 50 stores', ()=>G.stores.length>=50],
  ['hundredk','💰','Six Figures','Hold $100,000 cash', ()=>G.cash>=100000],
  ['million','🏦','Millionaire','Reach $1M net worth', ()=>netWorth()>=1e6],
  ['fourstar','⭐','Crowd Favourite','Get a store to 4 stars', ()=>G.stores.some(s=>(s.sat||0)>=4)],
  ['fivestar','🌟','Perfection','Get a store to 4.7 stars', ()=>G.stores.some(s=>(s.sat||0)>=4.7)],
  ['online','🚚','Clicks & Bricks','Launch online delivery', ()=>G.stores.some(s=>s.online)],
  ['acquire','🤝','Hostile Takeover','Acquire a rival company', ()=>(G._acquiredChains||[]).length>0],
  ['ipo','📈','Ring the Bell','Take the company public', ()=>G.ipo && G.ipo.public],
  ['metros','✈️','Multi-Metro','Operate in 3 metros', ()=>Object.keys(G.metros).filter(k=>G.metros[k].unlocked).length>=3],
  ['year','📅','Survivor','Run your chain for a full year', ()=>(G.f2.weeks||0)>=52],
  ['goals','🎯','Overachiever','Complete 10 weekly goals', ()=>G.f2.goalsDone>=10],
];
function checkAch(){
  const got = [];
  ACH.forEach(([id,e,n,d,test]) => { try{ if(!F().ach.includes(id) && test()){ G.f2.ach.push(id); got.push(e+' '+n); } }catch(_){} });
  return got;
}
const _rs = window.renderStats;
window.renderStats = function(){
  _rs();
  const box = document.createElement('div');
  box.innerHTML = `<div class="section-title" style="margin-top:20px;">Achievements · ${F().ach.length}/${ACH.length}</div>
  <div class="store-list">${ACH.map(([id,e,n,d])=>{ const on=G.f2.ach.includes(id); return `<div class="store" style="display:flex;gap:12px;align-items:center;${on?'':'opacity:.45;filter:grayscale(1);'}"><div style="font-size:30px;">${e}</div><div><div class="snm">${n}</div><div class="sloc">${d}</div></div></div>`; }).join('')}</div>`;
  document.getElementById('pane-stats').appendChild(box);
};

/* ================= TOWN MAP (in each store's panel) ================= */
function townMapSVG(s){
  const town = townByName(s.metro, s.town);
  const list = [...myStoresIn(s.metro, s.town).map(x=>({x, mine:true})), ...rivalsInTown(s.metro, town).map(x=>({x, mine:false}))];
  const W=320, H=200, cols=5, rows=3, cw=W/cols, rh=H/rows;
  const used = new Set();
  const col = o => o.mine ? '#22c55e' : o.x.kind==='discounter' ? '#fb923c' : o.x.kind==='premium' ? '#a78bfa' : '#60a5fa';
  const blocks = list.map(o => {
    let slot = hash(o.x.id||o.x.name) % (cols*rows); while(used.has(slot)) slot = (slot+1) % (cols*rows); used.add(slot);
    const bx = (slot%cols)*cw + cw/2, by = Math.floor(slot/cols)*rh + rh/2;
    const sz = Math.min(44, 18 + (o.x.capacity||1200)/80), age = Math.min(1, (o.x.ageWeeks||0)/520);
    const busy = (o.x.share||0) > 0.3;
    const label = o.mine ? 'YOU' : String(o.x.name||'').replace(' '+s.town,'').slice(0,10);
    return `${busy?`<circle cx="${bx}" cy="${by}" r="${sz*0.85}" fill="${col(o)}" opacity=".25"><animate attributeName="opacity" values=".1;.35;.1" dur="2s" repeatCount="indefinite"/></circle>`:''}
      <rect x="${bx-sz/2}" y="${by-sz/2}" width="${sz}" height="${sz*0.75}" rx="3" fill="${col(o)}" opacity="${1-age*0.45}" stroke="#000" stroke-width="1.5"/>
      <rect x="${bx-sz/2}" y="${by-sz/2}" width="${sz}" height="${sz*0.18}" fill="#000" opacity=".35"/>
      <text x="${bx}" y="${by+sz*0.5}" font-size="9" fill="#e5e7eb" text-anchor="middle" font-family="Arial" font-weight="700">${esc(label)}</text>`;
  }).join('');
  const roads = [...Array(cols-1)].map((_,i)=>`<rect x="${(i+1)*cw-3}" y="0" width="6" height="${H}" fill="#2b332e"/>`).join('') + [...Array(rows-1)].map((_,i)=>`<rect x="0" y="${(i+1)*rh-3}" width="${W}" height="6" fill="#2b332e"/>`).join('');
  return `<div class="section-title">Town Map · ${esc(s.town)}</div>
    <div class="store" style="margin-bottom:14px;padding:8px;"><svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block;border-radius:10px;background:#18201b;">${roads}${blocks}</svg>
    <div style="font-size:11px;color:var(--dim);margin-top:6px;">🟩 You · 🟧 Discounter · 🟦 Balanced · 🟪 Premium · glowing = busy · faded = old</div></div>`;
}
const _sd = window.storeDetailHTML;
window.storeDetailHTML = function(s, town){ const h = _sd(s, town); try{ return h.replace('<div class="section-title" style="margin-top:6px;">Customer Satisfaction', townMapSVG(s)+'<div class="section-title" style="margin-top:6px;">Customer Satisfaction'); }catch(e){ return h; } };

/* ================= WEEK LOOP: summary, skip, auto ================= */
let auto = null;
const _adv = window.advanceWeek;
function runWeek(){
  const before = { cash:G.cash, week:G.week, year:G.year, ids:new Set(G.stores.map(s=>s.id)) };
  _adv();
  if(!G || (G.week===before.week && G.year===before.year)) return null;
  const f = F(); f.weeks = (f.weeks||0) + 1;
  const res = { notes:[], ach:[], goal:null };
  // rival reactions to stores opened since last week
  const fresh = G.stores.filter(s => f.known && !f.known.includes(s.id));
  res.notes = ceoReactions(fresh);
  f.known = G.stores.map(s=>s.id);
  // goals
  if(!f.goal) newGoal();
  else if(goalMet(f.goal)){ G.cash += f.goal.reward; f.goalsDone++; res.goal = '🎯 Goal complete: '+f.goal.text+' (+'+money(f.goal.reward)+')'; sfx('open'); newGoal(); }
  else if(f.weeks >= f.goal.until){ res.goal = '⌛ Goal expired: '+f.goal.text; newGoal(); }
  res.ach = checkAch();
  // taunt + decision
  const ch = activeChains(); if(ch.length && Math.random()<0.3){ const c = ceoFor(pick(ch).ch.name); res.notes.push(`${c.emoji} ${c.name}: “${pick(c.taunts)}”`); }
  if(!f.pending && Math.random() < 0.18) f.pending = Math.floor(Math.random()*EVENTS.length);
  dailyTick();
  refreshHUD(); saveGame(false);
  return { before, res };
}
function bestWorst(){ const s=[...G.stores].sort((a,b)=>(b.lastNet||0)-(a.lastNet||0)); return [s[0], s[s.length-1]]; }
function showSummary(first, results){
  const weeks = results.length, delta = Math.round(G.cash - first.before.cash);
  const [best, worst] = bestWorst();
  const rev = G.stores.flatMap(s=>(s.reviews||[]).slice(0,1).map(r=>({...r, town:s.town}))).sort(()=>Math.random()-.5)[0];
  const lines = results.flatMap(r=>[...r.res.notes, ...(r.res.goal?[r.res.goal]:[]), ...r.res.ach.map(a=>'🏅 Achievement unlocked: '+a)]);
  const next = F().pending != null;
  showModal(`<div style="color:var(--muted);font-size:11px;font-family:'Space Mono';">${weeks>1?weeks+' WEEKS':'WEEK '+first.before.week} REPORT</div>
    <h2>${delta>=0?'📈 A good '+(weeks>1?'stretch':'week'):'📉 A rough '+(weeks>1?'stretch':'week')}</h2>
    <div class="cond" id="sumNum" style="font-size:46px;font-weight:700;color:${delta>=0?'var(--good)':'var(--bad)'};margin:6px 0 12px;">${delta>=0?'+':''}${money(0)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
      <div class="store" style="padding:10px;"><div class="section-title">🏆 Best store</div><div style="font-weight:700;">${esc(best.town)}</div><div class="net-pos mono">${money(best.lastNet||0)}</div></div>
      <div class="store" style="padding:10px;"><div class="section-title">🐢 Worst store</div><div style="font-weight:700;">${esc(worst.town)}</div><div class="${(worst.lastNet||0)>=0?'net-pos':'net-neg'} mono">${money(worst.lastNet||0)}</div></div>
    </div>
    ${rev?`<div class="store" style="padding:10px;margin-bottom:12px;font-size:13px;"><span style="color:#f5c518;">${'★'.repeat(rev.st)}</span> <b>${esc(rev.who)}</b> in ${esc(rev.town)}: “${esc(rev.text)}”</div>`:''}
    ${lines.length?`<div style="font-size:13px;line-height:1.7;margin-bottom:12px;">${lines.map(l=>`<div>${esc(l)}</div>`).join('')}</div>`:''}
    <button class="btn" onclick="smwAfterSummary()">${next?'Continue → Decision':'Continue'}</button>`);
  const el = document.getElementById('sumNum'), t0 = performance.now();
  (function tick(t){ const p = Math.min(1,(t-t0)/700); if(el) el.textContent = (delta>=0?'+':'') + money(delta*p); if(p<1) requestAnimationFrame(tick); })(t0);
}
// hooks for the empire pack (long sims resolve decisions without a modal)
window.smwRunWeek = runWeek;
window.smwResolve = (i,j) => { const m = EVENTS[i].o[j][1](); F().pending = null; return EVENTS[i].t+': '+m; };
window.smwSafeChoice = i => [1,0,1,0,1,0,1,0][i];
window.smwSafeName = i => EVENTS[i].o[[1,0,1,0,1,0,1,0][i]][0];
window.smwAfterSummary = function(){ const p = F().pending; if(p != null) showEvent(p); else closeModal('modal'); };
window.advanceWeek = function(){
  if(!G) return; if(modalOpen() && !auto) return;
  const r = window.smwRunWeek(); if(!r) return;
  if(auto){ const l = [...r.res.notes, ...(r.res.goal?[r.res.goal]:[]), ...r.res.ach]; if(l.length) toast(l[0]); if(F().pending!=null){ stopAuto(); showEvent(F().pending); } return; }
  showSummary(r, [r]);
};
window.skipWeeks = function(n){
  if(!G || modalOpen()) return;
  const rs = []; for(let i=0;i<n;i++){ const r = window.smwRunWeek(); if(!r) break; rs.push(r); if(F().pending!=null || G._failed) break; }
  if(rs.length) showSummary(rs[0], rs);
};
function stopAuto(){ clearInterval(auto); auto = null; const b=document.getElementById('btnAuto'); if(b){ b.textContent='▶▶'; b.style.background=''; } }
window.toggleAuto = function(){
  if(auto) return stopAuto();
  auto = setInterval(()=>{ if(!G || !document.getElementById('scr-game').classList.contains('active')) return stopAuto(); if(modalOpen()) return; window.advanceWeek(); }, 1400);
  const b=document.getElementById('btnAuto'); if(b){ b.textContent='⏸'; b.style.background='var(--brand)'; }
};

/* goal card on the overview */
const _ro = window.renderOverview;
window.renderOverview = function(){
  _ro(); const g = F().goal; if(!g) return;
  const left = Math.max(0, g.until - (G.f2.weeks||0));
  const box = document.createElement('div');
  box.innerHTML = `<div class="store" style="margin-bottom:16px;display:flex;gap:12px;align-items:center;border-color:var(--tag);"><div style="font-size:30px;">🎯</div><div style="flex:1;"><div class="section-title">Weekly Goal · ${left} week${left!==1?'s':''} left</div><div style="font-weight:700;">${esc(g.text)}</div><div style="color:var(--good);font-size:12px;">Reward: ${money(g.reward)}</div></div></div>`;
  const pane = document.getElementById('pane-overview'); pane.insertBefore(box, pane.firstChild);
};

/* ================= DAILY CHALLENGE ================= */
const DAILY_WEEKS = 20;
const today = () => new Date().toISOString().slice(0,10);
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const realRandom = Math.random;
window.startDaily = function(){
  const date = today(), rng = mulberry(hash('smw-daily-'+date));
  const metros = Object.keys(GXY_METROS).filter(k => !GXY_METROS[k].intl && GXY_METROS[k].towns.length >= 8);
  const mk = metros[Math.floor(rng()*metros.length)];
  const towns = [...GXY_METROS[mk].towns].sort((a,b)=>b.pop-a.pop).slice(0,10);
  Math.random = rng;   // same seed = same events and rivals for everyone today
  SETUP = { mode:'sandbox', realism:'moderate', metro:mk, town:towns[Math.floor(rng()*towns.length)].name, chainName:'Daily Mart' };
  currentSlot = null; window._smwNoTutorial = true;
  const inp = document.getElementById('chainName'); if(inp) inp.value = 'Daily Mart';
  foundChain(); window._smwNoTutorial = false;
  G.daily = { date, weeks:0 };
  showModal(`<h2>📅 Daily Challenge · ${date}</h2><p style="color:var(--dim);margin:10px 0 16px;line-height:1.6;">Everyone gets the same town today: <b>${esc(SETUP.town)}, ${esc(GXY_METROS[mk].name)}</b>. You have <b>${DAILY_WEEKS} weeks</b>. Highest net worth wins.</p><button class="btn" onclick="closeModal('modal')">Start</button>`);
};
function dailyTick(){
  if(!G.daily) return;
  if(++G.daily.weeks < DAILY_WEEKS) return;
  const score = netWorth(), key = 'smw_daily_'+G.daily.date;
  let best = 0; try{ best = +localStorage.getItem(key) || 0; if(score > best) localStorage.setItem(key, score); }catch(e){}
  const share = `🛒 Supermarket Wars Daily ${G.daily.date}: ${money(score)} net worth in ${DAILY_WEEKS} weeks`;
  const slot = currentSlot; G.daily.done = true;
  setTimeout(()=>{
    showModal(`<h2>📅 Daily Challenge Complete</h2><div class="cond" style="font-size:44px;font-weight:700;color:var(--good);">${money(score)}</div>
      <p style="color:var(--dim);margin:6px 0 14px;">${score>best?'🏅 New personal best for today!':'Your best today: '+money(best)}</p>
      <button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(share).replace(/"/g,'&quot;')});toast('Copied! Share it with friends.')">Copy my score</button>
      <button class="btn ghost" style="margin-top:8px;" onclick="closeModal('modal');quitToMenu();">Main menu</button>`);
    try{ const all = localSaves(); delete all['slot'+slot]; writeLocal(all); }catch(e){}
  }, 50);
}
const _q = window.quitToMenu;
window.quitToMenu = function(){ Math.random = realRandom; if(G && G.daily && G.daily.done){ G = null; showScreen('scr-mode'); renderSaveSlots(); return; } _q(); };

/* ================= NATIONWIDE ACQUISITIONS ================= */
// A chain's national presence = every metro whose roster puts it on the map (the first pick in a tier).
function nationalMetros(name){
  return Object.keys(GXY_METROS).filter(mk => { const p = rivalRosterFor(mk); return ['budget','mid','premium'].some(t => p[t] && p[t][0] && p[t][0].name === name); });
}
function companyNational(name){
  const metros = new Set(nationalMetros(name)); let live = 0, kind = 'balanced';
  Object.keys(G.metros).filter(k=>G.metros[k].unlocked && G.metros[k].chains).forEach(mk => G.metros[mk].chains.forEach(ch => { if(ch.name===name){ live += ch.stores.length; metros.add(mk); kind = ch.kind; } }));
  const unopened = [...metros].filter(mk => !(G.metros[mk] && G.metros[mk].unlocked));
  return { name, kind, metros:[...metros], unopened, live, estimated: unopened.length*3, stores: live + unopened.length*3 };
}
window.companyValuation = function(c){
  const comp = c.unopened ? c : companyNational(c.name);
  const perStore = comp.kind==='premium' ? 260000 : comp.kind==='discounter' ? 190000 : 220000;
  const control = 1 + Math.min(2.5, comp.stores*0.04);            // bigger chains demand a bigger premium
  const reach = 1 + comp.metros.length*0.12;                        // national brands cost more
  return Math.round(comp.stores * perStore * control * reach / 10000) * 10000;
};
window.openAcquisitionsModal = function(){
  ensureV5State();
  const comps = listAcquirableCompanies().map(c => companyNational(c.name)).sort((a,b)=>b.stores-a.stores);
  showModal(`<h2>🤝 Mergers & Acquisitions</h2>
    <div style="color:var(--dim);font-size:13px;margin-bottom:14px;">Buy an entire company: every store in every metro it operates in, including metros you haven't entered yet. These are the biggest deals in the game.</div>
    ${comps.length ? comps.map(c => { const val = companyValuation(c); const ok = G.cash >= val; return `<div class="store" style="margin-bottom:10px;">
      <div class="snm">${esc(c.name)}</div><div class="sloc">${c.unopened.length?"~":""}${c.stores} stores nationwide · ${c.metros.length} metro${c.metros.length!==1?'s':''} · ${c.kind}${c.unopened.length?` · ${c.unopened.length} new metro${c.unopened.length!==1?'s':''} for you`:''}</div>
      <div class="srow" style="margin-top:8px;"><span class="k">Acquisition price</span><span class="v ${ok?'':'net-neg'}">${money(val)}</span></div>
      <div class="sactions"><button class="btn sm" ${ok?'':'disabled'} onclick="openAcquireOptions('${jsq(c.name)}')">${ok?'Acquire…':'Need '+money(val)}</button></div></div>`; }).join('') : '<div class="empty-hint">No companies to acquire yet.</div>'}
    <button class="btn ghost" onclick="closeModal('modal')" style="margin-top:14px;">Close</button>`);
};
window.openAcquireOptions = function(name){
  const c = companyNational(name), val = companyValuation(c), salvage = c.stores*45000;
  showModal(`<h2>Acquire ${esc(name)}</h2>
    <div style="color:var(--dim);font-size:13px;margin-bottom:8px;">${c.unopened.length?"~":""}${c.stores} stores · ${c.metros.length} metros · <b>${money(val)}</b></div>
    ${c.unopened.length?`<div class="store" style="margin-bottom:10px;font-size:12px;">This deal also brings you into: ${c.unopened.map(mk=>esc(GXY_METROS[mk].name)).join(', ')}</div>`:''}
    <div class="section-title">Integration strategy</div>
    <div style="display:grid;gap:8px;">
      <button class="btn ghost" style="text-align:left;padding:13px;" onclick="doAcquire('${jsq(name)}','absorb')"><div style="font-weight:700;">🔄 Absorb & Rebrand</div><div style="color:var(--dim);font-size:12px;">Every store becomes ${esc(G.chainName)}.</div></button>
      <button class="btn ghost" style="text-align:left;padding:13px;" onclick="doAcquire('${jsq(name)}','banner')"><div style="font-weight:700;">🏷️ Keep as Banner</div><div style="color:var(--dim);font-size:12px;">Run them as ${esc(name)}, a subsidiary. Keeps local loyalty.</div></button>
      <button class="btn ghost" style="text-align:left;padding:13px;" onclick="doAcquire('${jsq(name)}','liquidate')"><div style="font-weight:700;">💰 Acquire & Liquidate</div><div style="color:var(--dim);font-size:12px;">Shut them down nationwide and sell the buildings for ~${money(salvage)}. Net cost ${money(val-salvage)}.</div></button>
    </div>
    <button class="btn ghost" onclick="openAcquisitionsModal()" style="margin-top:14px;">← Back</button>`);
};
window.doAcquire = function(name, mode){
  ensureV5State();
  const c = companyNational(name), val = companyValuation(c);
  if(G.cash < val){ toast('Not enough cash.'); return; }
  G.cash -= val;
  // enter every metro the company operates in, so its stores there exist
  c.unopened.forEach(mk => { G.metros[mk] = { unlocked:true, chains:null, indep:{} }; initMetroRivals(mk); });
  let added = 0, salvage = 0;
  c.metros.forEach(mk => {
    const M = G.metros[mk]; if(!M || !M.chains) return;
    M.chains.filter(ch => ch.name === name).forEach(ch => ch.stores.forEach(r => {
      if(mode === 'liquidate'){ salvage += 45000; return; }
      const s = E.newStore((mode==='banner'?name:G.chainName)+' '+r.town, r.town, r.capacity);
      s.metro = mk; s.priceMult = defaultPriceForStrategy(); s.quality = Math.max(0.9, r.quality); s.ageWeeks = r.ageWeeks;
      if(mode==='banner') s.banner = name;
      G.stores.push(s); added++;
    }));
    M.chains = M.chains.filter(ch => ch.name !== name);
  });
  if(mode==='liquidate') G.cash += salvage;
  if(mode==='banner') G.reputation = Math.min(1.5, (G.reputation||1) + 0.08);
  G._acquiredChains = G._acquiredChains || []; G._acquiredChains.push(name);
  refreshHUD(); closeModal('modal'); sfx('open');
  toast(mode==='liquidate' ? '💰 '+name+' is gone nationwide. Recovered '+money(salvage) : '🤝 Acquired '+name+': '+added+' stores across '+c.metros.length+' metros!');
  switchTab('stores'); saveGame(false);
};
// an acquired company never comes back in a metro you enter later
const _imr = window.initMetroRivals;
window.initMetroRivals = function(mk){ const r = _imr(mk); const gone = (G && G._acquiredChains) || []; if(gone.length && G.metros[mk].chains) G.metros[mk].chains = G.metros[mk].chains.filter(ch => !gone.includes(ch.name)); return G.metros[mk].chains || r; };

/* ================= HAPTICS + SWIPE ================= */
// (vibration patterns live in smw-updates.js sfx())
let tx=null, ty=null;
document.addEventListener('touchstart', e => { if(!document.getElementById('scr-game').classList.contains('active') || e.target.closest('#gameTabs,.hud,.modal,svg,canvas,input,select')) { tx=null; return; } tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, {passive:true});
document.addEventListener('touchend', e => {
  if(tx==null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
  if(Math.abs(dx) < 70 || Math.abs(dy) > 50) return;
  const tabs = [...document.querySelectorAll('#gameTabs .tab')], i = tabs.findIndex(t=>t.classList.contains('on'));
  const n = tabs[i + (dx<0?1:-1)]; if(n){ switchTab(n.dataset.tab); window.smwSfx('click'); }
}, {passive:true});

/* ================= BOOT: buttons + mode card ================= */
function boot(){
  const help = [...document.querySelectorAll('#scr-game .hud button')].find(b=>b.textContent.trim()==='?');
  if(help && !document.getElementById('btnSkip')) help.insertAdjacentHTML('beforebegin',
    `<button class="btn ghost sm" id="btnSkip" title="Skip 4 weeks" onclick="skipWeeks(4)">⏩</button><button class="btn ghost sm" id="btnAuto" title="Auto-advance" onclick="toggleAuto()">▶▶</button>`);
  const grid = document.querySelector('#scr-mode .mode-grid');
  if(grid && !document.getElementById('dailyCard')){
    let best = 0; try{ best = +localStorage.getItem('smw_daily_'+today()) || 0; }catch(e){}
    grid.insertAdjacentHTML('beforeend', `<div class="mode-card" id="dailyCard" onclick="startDaily()"><div class="mi">📅</div><div class="mn">Daily Challenge</div><div class="md">Same town and same luck for everyone today. ${DAILY_WEEKS} weeks to build the biggest net worth.${best?' Your best today: '+money(best)+'.':''}</div></div>`);
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,20)); else setTimeout(boot,20);
})();
