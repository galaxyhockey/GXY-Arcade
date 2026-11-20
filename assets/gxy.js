/* GXY platform: player profile + XP, achievements, weekly arcade challenges, cosmetic rewards,
   universal gamepad support and GXY Cloud (cross-device saves, via assets/gxy-cloud.js).
   Include on every page:  <script src="[root]assets/gxy.js"></script>
   Games report what happens with:  GXY.event('game-id', 'type', value)
*/
(function(){
  if(window.GXY) return;
  const ROOT = (document.currentScript && document.currentScript.src || '').replace(/assets\/gxy\.js.*$/, '');
  const get = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? d; }catch(e){ return d; } };
  const set = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

  const GAMES = {
    'supermarket-wars':'Supermarket Wars', 'transit-tycoon':'Transit Tycoon', 'airport-empire':'Airport Empire', 'tv-battles':'TV Battles',
    'gxy-tech-empire':'Technology Empire', 'neon-siege':'Neon Siege', 'gxy-hockey':'GXY Hockey', 'gxy-football':'YOUFL Football',
    'trivia':'GXY Trivia', 'price-guess':'Price Guess', 'gxy-daily':'Daily Word', 'arcade':'GXY Arcade' };

  /* ---------------- cosmetics ---------------- */
  const COSMETICS = [
    // frames (ring around your avatar)
    { id:'frame-basic',  type:'frame', name:'Basic',        css:'#3b82f6', free:true },
    { id:'frame-gold',   type:'frame', name:'Gold',         css:'linear-gradient(135deg,#fde68a,#b45309)' },
    { id:'frame-neon',   type:'frame', name:'Neon',         css:'linear-gradient(135deg,#ec4899,#22d3ee)' },
    { id:'frame-ice',    type:'frame', name:'Ice',          css:'linear-gradient(135deg,#e0f2fe,#0ea5e9)' },
    { id:'frame-fire',   type:'frame', name:'Fire',         css:'linear-gradient(135deg,#facc15,#dc2626)' },
    { id:'frame-jungle', type:'frame', name:'Jungle',       css:'linear-gradient(135deg,#86efac,#166534)' },
    { id:'frame-galaxy', type:'frame', name:'Galaxy',       css:'conic-gradient(#6366f1,#ec4899,#22d3ee,#6366f1)' },
    { id:'frame-rainbow',type:'frame', name:'Rainbow',      css:'conic-gradient(#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7,#ef4444)' },
    // titles (shown under your name)
    { id:'title-rookie',  type:'title', name:'Rookie', free:true },
    { id:'title-tycoon',  type:'title', name:'Tycoon' },
    { id:'title-sniper',  type:'title', name:'Sniper' },
    { id:'title-brain',   type:'title', name:'Big Brain' },
    { id:'title-legend',  type:'title', name:'Arcade Legend' },
    { id:'title-commuter',type:'title', name:'Super Commuter' },
    { id:'title-captain', type:'title', name:'Captain' },
    { id:'title-champ',   type:'title', name:'Weekly Champ' },
    { id:'title-collector',type:'title', name:'Collector' },
    // avatars
    ...['🎮','😎','🦊','🐼','🤖','👾','🚀','🏒','🏈','🛒','🚇','✈️','🧠','🔥','👑','🐉'].map((e,i) => ({ id:'av-'+i, type:'avatar', name:e, emoji:e, free:i < 6 })),
    // shelf themes for the launcher
    { id:'shelf-oak',    type:'shelf', name:'Oak',          css:'#8b5a2b', free:true },
    { id:'shelf-walnut', type:'shelf', name:'Walnut',       css:'#4a2c17' },
    { id:'shelf-white',  type:'shelf', name:'White Oak',    css:'#c8b08a' },
    { id:'shelf-neon',   type:'shelf', name:'Neon Arcade',  css:'#1e1b4b' },
  ];

  /* ---------------- achievements ---------------- */
  // stat: counter name in GXY stats; at: threshold. max-stats keep the best value instead of a total.
  const A = (game, id, icon, name, desc, xp, stat, at, reward) => ({ game, id, icon, name, desc, xp, stat, at, reward });
  const ACH = [
    A('arcade','first-play','🕹️','Press Start','Play any game',25,'arcade.plays',1),
    A('arcade','five-games','📚','Collector','Play 5 different games',100,'arcade.unique',5,'title-collector'),
    A('arcade','all-games','🏛️','Completionist','Play every game in the library',300,'arcade.unique',11,'frame-galaxy'),
    A('arcade','level5','⭐','Rising Star','Reach level 5',0,'arcade.level',5,'av-6'),
    A('arcade','level10','🌟','Arcade Regular','Reach level 10',0,'arcade.level',10,'frame-gold'),
    A('arcade','level25','👑','Arcade Royalty','Reach level 25',0,'arcade.level',25,'title-legend'),
    A('arcade','weekly1','📅','Challenger','Complete a weekly challenge',50,'arcade.weekly',1),
    A('arcade','weekly10','🏅','Challenge Hunter','Complete 10 weekly challenges',200,'arcade.weekly',10,'title-champ'),
    A('arcade','cloud','☁️','In the Cloud','Sign in to GXY Cloud',50,'arcade.cloud',1),
    A('arcade','gamepad','🎮','Plugged In','Play with a controller',50,'arcade.gamepad',1,'av-0'),
    A('gxy-hockey','hk-goal','🏒','Lamp Lighter','Score a goal in GXY Hockey',25,'gxy-hockey.goal',1),
    A('gxy-hockey','hk-100','🚨','Sniper','Score 100 goals in GXY Hockey',200,'gxy-hockey.goal',100,'title-sniper'),
    A('gxy-hockey','hk-streak','🔥','On Fire','Score 5 goals in a row',75,'gxy-hockey.streak',5,'frame-ice'),
    A('gxy-football','fb-td','🏈','Six Points','Score a touchdown',25,'gxy-football.td',1),
    A('gxy-football','fb-50','🏟️','Highlight Reel','Score 50 touchdowns',150,'gxy-football.td',50,'av-8'),
    A('neon-siege','ns-5','🛡️','Holding the Line','Clear wave 5 in Neon Siege',50,'neon-siege.wave',5),
    A('neon-siege','ns-15','⚡','Grid Guardian','Clear wave 15 in Neon Siege',150,'neon-siege.wave',15,'frame-neon'),
    A('neon-siege','ns-30','👾','Unbreakable','Clear wave 30 in Neon Siege',300,'neon-siege.wave',30,'av-5'),
    A('price-guess','pg-bull','🎯','Bullseye','Guess a price within 5%',50,'price-guess.bullseye',1),
    A('price-guess','pg-4k','🛒','Bargain Hunter','Score 4,000+ in a Price Guess Daily 5',150,'price-guess.daily',4000,'av-9'),
    A('gxy-daily','dw-solve','🔤','Wordsmith','Solve the Daily Word',25,'gxy-daily.solve',1),
    A('gxy-daily','dw-2','💡','Mind Reader','Solve the Daily Word in 2 guesses or fewer',150,'gxy-daily.fast',1,'title-brain'),
    A('trivia','tv-10','🧠','Know-It-All','Answer 100 trivia questions right',100,'trivia.right',100,'av-12'),
    A('trivia','tv-streak','🔥','Hot Streak','Get 10 trivia answers right in a row',100,'trivia.streak',10),
    A('trivia','tv-logo','🏷️','Brand Expert','Name 50 logos',100,'trivia.logo',50),
    A('trivia','tv-online','📱','Party Host','Play an Online Room game',50,'trivia.online',1),
    A('supermarket-wars','smw-10','🛒','Open for Business','Play 10 weeks of Supermarket Wars',50,'supermarket-wars.weeks',10),
    A('supermarket-wars','smw-100','🏬','Grocery Giant','Play 100 weeks of Supermarket Wars',200,'supermarket-wars.weeks',100,'title-tycoon'),
    A('tv-battles','tvb-10','📺','On the Air','Run 10 weeks of TV Battles',50,'tv-battles.weeks',10),
    A('gxy-tech-empire','te-8','💻','Startup','Play 8 quarters of Technology Empire',50,'gxy-tech-empire.quarters',8),
    A('transit-tycoon','tt-line','🚌','First Route','Open your first transit line',25,'transit-tycoon.lines',1),
    A('transit-tycoon','tt-sub','🚇','Going Underground','Open a subway line',75,'transit-tycoon.subway',1,'av-10'),
    A('transit-tycoon','tt-1m','🎫','A Million Riders','Carry 1,000,000 passengers in total',200,'transit-tycoon.riders',1000000,'title-commuter'),
    A('transit-tycoon','tt-city','🏙️','Going National','Run transit in 3 cities',200,'transit-tycoon.cities',3,'shelf-white'),
    A('airport-empire','ae-flight','✈️','Cleared for Takeoff','Handle your first flight',25,'airport-empire.flights',1),
    A('airport-empire','ae-10k','🛫','Hub Status','Handle 10,000 flights',200,'airport-empire.flights',10000,'title-captain'),
    A('airport-empire','ae-terms','🏢','Concourse King','Run 4 terminals at once',150,'airport-empire.terminals',4,'av-11'),
    A('airport-empire','ae-top','🏆','Busiest in the Region','Out-fly every rival airport in a month',250,'airport-empire.top',1,'frame-fire'),
    A('gxy-hockey','hk-cup','🏆','Cup Champion','Win the GXY Hockey Playoffs',200,'gxy-hockey.cup',1,'title-champ'),
    A('gxy-hockey','hk-ch','⚔️','Called Out',"Beat a friend's Shootout Challenge",75,'gxy-hockey.challengewin',1),
    A('gxy-daily','dw-battle','⚔️','Word Warrior','Win a Word Battle round',50,'gxy-daily.battle',1),
    A('trivia','tv-tourney','🏆','Tournament Champion','Finish a trivia tournament',75,'trivia.tourney',1),
    A('price-guess','pg-hist','📜','Time Traveler','Score 7,000+ in a Time Machine run',100,'price-guess.history',7000),
    A('gxy-tech-empire','te-review','📰',"Critics' Darling",'Launch a device that reviews 9.0+',150,'gxy-tech-empire.review',90),
    A('tv-battles','tvb-plus','🚀','Streaming Mogul','Reach 3 million GXY+ subscribers',150,'tv-battles.plus',3000000),
    A('supermarket-wars','smw-recess','📉','Recession Proof','Make it through a recession',100,'supermarket-wars.survived',1),
    A('gxy-football','fb-league','🛠️','Commissioner','Create a custom YOUFL league',50,'gxy-football.leagues',1),
  ];
  const MAX_STATS = /\.(streak|wave|daily|level|unique|terminals|cities|history|review|plus|teams|leagues|free)$/;

  /* ---------------- weekly challenges ---------------- */
  // Three per week, from different games, chosen the same way for everyone by the week number.
  const POOL = [
    { id:'hk-goals', game:'gxy-hockey', stat:'goal', target:25, text:'Score 25 goals in GXY Hockey', xp:150 },
    { id:'hk-goals2', game:'gxy-hockey', stat:'goal', target:60, text:'Score 60 goals in GXY Hockey', xp:300 },
    { id:'ns-wave', game:'neon-siege', stat:'wave', max:true, target:10, text:'Survive Neon Siege wave 10', xp:150 },
    { id:'ns-wave2', game:'neon-siege', stat:'wave', max:true, target:20, text:'Survive Neon Siege wave 20', xp:300 },
    { id:'pg-daily', game:'price-guess', stat:'daily', max:true, target:3000, text:'Beat 3,000 points in a Price Guess Daily 5', xp:150 },
    { id:'pg-free', game:'price-guess', stat:'free', max:true, target:5000, text:'Score 5,000 in one Price Guess Free Play run', xp:200 },
    { id:'tv-right', game:'trivia', stat:'right', target:40, text:'Answer 40 trivia questions right', xp:150 },
    { id:'tv-logos', game:'trivia', stat:'logo', target:25, text:'Name 25 logos in the Logo Quiz', xp:150 },
    { id:'dw-solve', game:'gxy-daily', stat:'solve', target:4, text:'Solve the Daily Word on 4 days', xp:200 },
    { id:'fb-td', game:'gxy-football', stat:'td', target:12, text:'Score 12 touchdowns in YOUFL Football', xp:150 },
    { id:'smw-weeks', game:'supermarket-wars', stat:'weeks', target:20, text:'Run 20 weeks in Supermarket Wars', xp:150 },
    { id:'tvb-weeks', game:'tv-battles', stat:'weeks', target:12, text:'Run 12 weeks in TV Battles', xp:150 },
    { id:'te-q', game:'gxy-tech-empire', stat:'quarters', target:8, text:'Play 8 quarters of Technology Empire', xp:150 },
    { id:'tt-riders', game:'transit-tycoon', stat:'riders', target:250000, text:'Carry 250,000 transit riders', xp:200 },
    { id:'tt-lines', game:'transit-tycoon', stat:'lines', target:3, text:'Open 3 new transit lines', xp:150 },
    { id:'ae-flights', game:'airport-empire', stat:'flights', target:1500, text:'Handle 1,500 flights at Airport Empire', xp:200 },
    { id:'ae-weather', game:'airport-empire', stat:'storms', target:3, text:'Keep flying through 3 storms', xp:150 },
  ];
  const REWARDS = COSMETICS.filter(c => !c.free).map(c => c.id);
  function weekKey(d = new Date()){
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, '0');
  }
  function seeded(str){ let s = 0; for(const c of str) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function weekly(){
    const wk = weekKey(), R = seeded('gxy' + wk), out = [], games = new Set();
    for(const c of POOL.map(c => [R(), c]).sort((a,b) => a[0] - b[0]).map(x => x[1])){ if(!games.has(c.game)){ games.add(c.game); out.push(c); } if(out.length === 3) break; }
    const rw = REWARDS.map(r => [R(), r]).sort((a,b) => a[0] - b[0]).map(x => x[1]);
    let st = get('gxy_weekly', {}); if(st.week !== wk) st = { week:wk, prog:{}, done:{} };
    const ends = new Date(); ends.setDate(ends.getDate() + ((8 - (ends.getDay() || 7)) % 7 || 7)); ends.setHours(0,0,0,0);
    return { week:wk, ends, list:out.map((c,i) => ({ ...c, reward:rw[i], prog:st.prog[c.id] || 0, done:!!st.done[c.id] })), state:st };
  }

  /* ---------------- profile / XP ---------------- */
  const P0 = { name:'Player', avatar:'av-0', frame:'frame-basic', title:'title-rookie', shelf:'shelf-oak', xp:0, owned:[], created:Date.now() };
  const profile = () => Object.assign({}, P0, get('gxy_profile', {}));
  const saveProfile = p => { set('gxy_profile', p); emit(); };
  const levelOf = xp => Math.floor((1 + Math.sqrt(1 + 8 * xp / 100)) / 2);      // L needs 100·(L−1) more XP than L−1
  const xpFor = L => 50 * L * (L - 1);
  const owns = (p, id) => { const c = COSMETICS.find(x => x.id === id); return !!c && (c.free || p.owned.includes(id)); };
  function grant(id){ const p = profile(); if(!id || owns(p, id)) return; p.owned.push(id); saveProfile(p); const c = COSMETICS.find(x => x.id === id); toast('🎁', 'Reward unlocked', `${c.type === 'avatar' ? c.emoji + ' avatar' : c.name + ' ' + c.type}`); }
  function addXP(n, why){
    if(!n) return; const p = profile(), before = levelOf(p.xp); p.xp += n; saveProfile(p);
    const after = levelOf(p.xp);
    toast('✨', `+${n} XP`, why || '');
    if(after > before){ toast('⬆️', `Level ${after}!`, 'You leveled up'); bump('arcade', 'level', after); }
  }

  /* ---------------- stats + events ---------------- */
  const stats = () => get('gxy_stats', {});
  function bump(game, type, val = 1){
    const k = game + '.' + type, s = stats(), isMax = MAX_STATS.test(k);
    s[k] = isMax ? Math.max(s[k] || 0, val) : (s[k] || 0) + val; set('gxy_stats', s);
    checkAch(k, s[k]);
    return s[k];
  }
  function checkAch(k, v){
    const got = get('gxy_ach', {});
    ACH.filter(a => a.stat === k && !got[a.id] && v >= a.at).forEach(a => {
      got[a.id] = Date.now(); set('gxy_ach', got);
      toast(a.icon, 'Achievement unlocked', a.name);
      if(a.xp) addXP(a.xp, a.name);
      if(a.reward) grant(a.reward);
    });
  }
  function event(game, type, val = 1){
    try{
      bump(game, type, val);
      // weekly challenges
      const w = weekly(), st = w.state;
      w.list.filter(c => c.game === game && c.stat === type && !c.done).forEach(c => {
        st.prog[c.id] = c.max ? Math.max(st.prog[c.id] || 0, val) : (st.prog[c.id] || 0) + val;
        if(st.prog[c.id] >= c.target){ st.done[c.id] = Date.now(); toast('📅', 'Weekly challenge complete', c.text); addXP(c.xp, 'Weekly challenge'); grant(c.reward); bump('arcade', 'weekly'); }
      });
      set('gxy_weekly', st); emit();
    }catch(e){ console.warn('GXY.event', e); }
  }
  function played(game){
    const seen = get('gxy_played', []); if(!seen.includes(game)){ seen.push(game); set('gxy_played', seen); }
    bump('arcade', 'plays'); bump('arcade', 'unique', seen.length);
  }

  /* ---------------- toasts ---------------- */
  let tq = [], showing = false;
  function toast(icon, title, sub){ tq.push([icon, title, sub]); if(!showing) nextToast(); }
  function nextToast(){
    const t = tq.shift(); if(!t){ showing = false; return; } showing = true;
    let box = document.getElementById('gxyToast');
    if(!box){
      const css = document.createElement('style');
      css.textContent = `#gxyToast{position:fixed;left:50%;top:14px;transform:translate(-50%,-140%);z-index:2147483000;display:flex;gap:10px;align-items:center;background:#0f1424f2;color:#eef0ff;border:1px solid #f59e0b88;border-radius:14px;padding:10px 16px 10px 12px;box-shadow:0 12px 30px #000a;font:600 14px system-ui,sans-serif;transition:transform .35s cubic-bezier(.2,.9,.3,1.3);pointer-events:none;max-width:92vw}
        #gxyToast.on{transform:translate(-50%,0)}#gxyToast i{font-style:normal;font-size:24px}#gxyToast small{display:block;color:#9aa0c3;font-weight:500}`;
      document.head.appendChild(css);
      box = document.createElement('div'); box.id = 'gxyToast'; document.body.appendChild(box);
    }
    box.innerHTML = `<i>${t[0]}</i><div>${t[1]}${t[2] ? `<small>${String(t[2]).replace(/</g,'&lt;')}</small>` : ''}</div>`;
    requestAnimationFrame(() => box.classList.add('on'));
    setTimeout(() => { box.classList.remove('on'); setTimeout(nextToast, 400); }, 2600);
  }

  /* ---------------- listeners ---------------- */
  const cbs = [];
  function emit(){ cbs.forEach(f => { try{ f(); }catch(e){} }); }

  /* ---------------- gamepad ---------------- */
  // Maps any standard controller to the keys games already use, and lets the D-pad move between buttons on menus.
  // A = Enter/click, B = Escape/back, X = Space, Y = Tab, Start = Enter, D-pad/left stick = arrow keys.
  const KEYMAP = { 12:'ArrowUp', 13:'ArrowDown', 14:'ArrowLeft', 15:'ArrowRight', 0:'Enter', 1:'Escape', 2:' ', 3:'Tab', 9:'Enter' };
  const CODES = { ArrowUp:'ArrowUp', ArrowDown:'ArrowDown', ArrowLeft:'ArrowLeft', ArrowRight:'ArrowRight', Enter:'Enter', Escape:'Escape', ' ':'Space', Tab:'Tab' };
  const KC = { ArrowUp:38, ArrowDown:40, ArrowLeft:37, ArrowRight:39, Enter:13, Escape:27, ' ':32, Tab:9 };
  let padOn = false, prev = {}, focusRing = null;
  function key(type, k){
    const init = { key:k, code:CODES[k], keyCode:KC[k], which:KC[k], bubbles:true, cancelable:true };
    const ev = new KeyboardEvent(type, init); Object.defineProperty(ev, 'keyCode', { get:() => KC[k] }); Object.defineProperty(ev, 'which', { get:() => KC[k] });
    (document.activeElement || document.body).dispatchEvent(ev);
    return ev.defaultPrevented;
  }
  const bigCanvas = () => [...document.querySelectorAll('canvas')].some(c => { const r = c.getBoundingClientRect(); return r.width * r.height > innerWidth * innerHeight * 0.3 && r.bottom > 0 && r.top < innerHeight; });
  const focusables = () => [...document.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]):not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"]),.case,.tile,.opt')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'); })
    .filter(e => { const d = e.closest('dialog'); const open = document.querySelector('dialog[open]'); return open ? d === open : !d; });
  function moveFocus(dir){
    const els = focusables(); if(!els.length) return;
    const cur = document.activeElement && els.includes(document.activeElement) ? document.activeElement : null;
    if(!cur){ els[0].focus(); ring(els[0]); return; }
    const a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bd = Infinity;
    els.forEach(e => {
      if(e === cur) return; const b = e.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - ax, dy = by - ay;
      const ok = dir === 'ArrowUp' ? dy < -4 : dir === 'ArrowDown' ? dy > 4 : dir === 'ArrowLeft' ? dx < -4 : dx > 4; if(!ok) return;
      const main = dir === 'ArrowUp' || dir === 'ArrowDown' ? Math.abs(dy) : Math.abs(dx), off = dir === 'ArrowUp' || dir === 'ArrowDown' ? Math.abs(dx) : Math.abs(dy);
      const d = main + off * 2.2; if(d < bd){ bd = d; best = e; }
    });
    if(best){ best.focus({ preventScroll:true }); best.scrollIntoView({ block:'nearest', inline:'nearest', behavior:'smooth' }); ring(best); }
  }
  function ring(el){
    if(!focusRing){ focusRing = document.createElement('style'); focusRing.textContent = '.gxy-pad-focus{outline:3px solid #f59e0b!important;outline-offset:3px!important}'; document.head.appendChild(focusRing); }
    document.querySelectorAll('.gxy-pad-focus').forEach(e => e.classList.remove('gxy-pad-focus')); el.classList.add('gxy-pad-focus');
  }
  function press(btn){
    const k = KEYMAP[btn]; if(!k) return;
    const menu = !bigCanvas(), el = document.activeElement;
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.type !== 'checkbox' && el.type !== 'range';
    if(menu && k.startsWith('Arrow')){ if(!key('keydown', k) || typing) moveFocus(k); return; }   // D-pad never moves a text caret
    if(menu && k === 'Enter' && el && el !== document.body && !typing){ el.click(); return; }
    if(menu && k === 'Escape'){ const d = document.querySelector('dialog[open]'); if(d){ d.close(); return; } }
    key('keydown', k);
  }
  function poll(){
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    if(pads.length){
      if(!padOn){ padOn = true; toast('🎮', 'Controller connected', 'D-pad to move · A to select · B to go back'); bump('arcade', 'gamepad'); }
      const p = pads[0], now = {};
      p.buttons.forEach((b, i) => now[i] = b.pressed || b.value > 0.5);
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if(ay < -0.6) now[12] = true; if(ay > 0.6) now[13] = true; if(ax < -0.6) now[14] = true; if(ax > 0.6) now[15] = true;
      Object.keys(now).forEach(i => {
        const k = KEYMAP[i];
        if(now[i] && !prev[i]){ press(+i); prev['t' + i] = performance.now() + 380; }
        else if(now[i] && prev[i] && k && k.startsWith('Arrow') && performance.now() > prev['t' + i]){ press(+i); prev['t' + i] = performance.now() + 110; }   // hold to repeat
        else if(!now[i] && prev[i] && k && bigCanvas()) key('keyup', k);
        prev[i] = now[i];
      });
    }
  }
  if(navigator.getGamepads) setInterval(poll, 16);   // a timer (not rAF) so it keeps working in every webview

  /* ---------------- cloud ---------------- */
  // Every localStorage write is time-stamped so the cloud can sync only what changed and keep the newest copy.
  const TS = 'gxy_save_times', SKIP = /^(firebase|gxy_save_times|gxy_cloud_meta|tv_seen|_)/;
  try{
    const S = Storage.prototype, oSet = S.setItem, oRem = S.removeItem;
    const stamp = k => { if(SKIP.test(k)) return; try{ const t = JSON.parse(localStorage.getItem(TS) || '{}'); t[k] = Date.now(); oSet.call(localStorage, TS, JSON.stringify(t)); }catch(e){} cloudDirty(); };
    S.setItem = function(k, v){ oSet.call(this, k, v); if(this === localStorage) stamp(k); };
    S.removeItem = function(k){ oRem.call(this, k); if(this === localStorage) stamp(k); };
  }catch(e){}
  let cloudMod = null, dirtyT = null;
  function cloud(){ return cloudMod || (cloudMod = import(ROOT + 'assets/gxy-cloud.js').then(m => (m.start({ toast, bump, emit, ROOT }), m))); }
  function cloudDirty(){ clearTimeout(dirtyT); dirtyT = setTimeout(() => { if(get('gxy_cloud_meta', {}).on) cloud().then(m => m.push()).catch(()=>{}); }, 4000); }
  if(get('gxy_cloud_meta', {}).on) setTimeout(() => cloud().then(m => m.pull()).catch(()=>{}), 300);

  /* ---------------- public API ---------------- */
  window.GXY = { ROOT, GAMES, COSMETICS, ACH, event, played, addXP, toast, profile, saveProfile, levelOf, xpFor, owns, grant, weekly, stats,
    achievements:() => get('gxy_ach', {}), onChange:f => cbs.push(f), cloud, padConnected:() => padOn };

  // Count a play for the current game page.
  const page = (location.pathname.match(/games\/([\w-]+)\.html/) || [])[1];
  const id = page === 'quickplay' ? 'supermarket-wars' : page;
  if(id && GAMES[id]) played(id);
})();
