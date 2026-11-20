/* YOUFL Football add-on: 🛠️ Team Creator + Custom Leagues.
   Make your own franchises (city, name, abbreviation, colors, emblem), then build leagues from any mix of
   official YOUFL teams and your own. The active league replaces the team list used by Play Now, Two-Minute Drill,
   Franchise and Career. Uses the page's FB_CITIES, FB_CFG, showScreen, esc, $. */
(function(){
  const LS = { get:(k, d) => { try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch(e){ return d; } }, set:(k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const OFFICIAL = FB_CITIES.map(t => ({ ...t }));            // keep a pristine copy of the 32 YOUFL teams
  const OFFICIAL_CFG = { conferences:FB_CFG.conferences, divisions:FB_CFG.divisions, seasonLength:FB_CFG.seasonLength };
  const EMBLEMS = ['🦅','🐻','🐺','🦁','🐯','🐂','🐍','⚡','🔥','❄️','⭐','🌪️','🦈','🐉','⚓','🚀','👑','🗡️','🌵','🏔️'];

  // shield logo drawn as an SVG data URL (works anywhere the game shows a team logo)
  function logo(t){
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><path d="M60 4 L112 22 V70 C112 104 88 126 60 136 C32 126 8 104 8 70 V22 Z" fill="${t.color}" stroke="${t.color2}" stroke-width="7"/>`
      + `<text x="60" y="72" font-size="44" text-anchor="middle">${t.emblem || '⭐'}</text><text x="60" y="114" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="${t.color2}" text-anchor="middle">${t.abbr}</text></svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg).replace(/'/g, '%27');
  }
  const myTeams = () => LS.get('fb_my_teams', []);
  const leagues = () => LS.get('fb_leagues', []);
  const toCity = t => ({ city:t.city, name:t.name, abbr:t.abbr, color:t.color, color2:t.color2, logo:logo(t), icon:logo(t), custom:true });
  const allTeams = () => [...OFFICIAL.map(t => ({ ...t, key:'y:' + t.abbr })), ...myTeams().map(t => ({ ...toCity(t), key:'c:' + t.id }))];

  // swap the active league into the game's team list
  function applyLeague(){
    const id = LS.get('fb_active_league', null), L = leagues().find(l => l.id === id);
    const teams = L ? L.teams.map(k => allTeams().find(t => t.key === k)).filter(Boolean) : OFFICIAL.map(t => ({ ...t }));
    FB_CITIES.splice(0, FB_CITIES.length, ...teams.map(({ key, ...t }) => t));
    Object.assign(FB_CFG, L ? { conferences:L.conf, divisions:L.div, seasonLength:L.weeks } : OFFICIAL_CFG);
    const banner = document.getElementById('fbLeagueBanner');
    if(banner) banner.innerHTML = L ? `🛠️ Playing in <b>${esc(L.name)}</b> · ${teams.length} teams <a style="color:var(--gold,#f5c518);cursor:pointer;text-decoration:underline" onclick="fbUse(null)">switch to YOUFL</a>` : '';
  }
  window.fbUse = id => { LS.set('fb_active_league', id); applyLeague(); fbCreator(); };

  /* ---------- screens ---------- */
  window.fbCreator = function(){
    const act = LS.get('fb_active_league', null);
    $('#setupBody').innerHTML = `<div class="logo" style="margin-bottom:1rem"><h1 style="font-size:2rem">🛠️ League &amp; Team Creator</h1><p>Design franchises, then build your own league out of any teams you like.</p></div>
      <div class="card"><div class="field"><label>Active league</label>
        <div class="pickrow">${[{ id:null, name:'YOUFL (official 32)' }, ...leagues()].map(l => `<div class="pill ${act === l.id ? 'on' : ''}" onclick='fbUse(${JSON.stringify(l.id)})'><div class="pn">${esc(l.name)}</div><div class="pd">${l.teams ? l.teams.length + ' teams' : '32 teams'}</div></div>`).join('')}</div></div>
        <p style="color:var(--dim);font-size:.82rem">The active league is used by Play Now, Two-Minute Drill, Franchise and Career.</p></div>
      <div class="card"><div class="field"><label>Your teams (${myTeams().length})</label>
        <div class="teamgrid">${myTeams().map(t => `<div class="tsel" style="--tc:${t.color}" onclick="fbTeamEdit('${t.id}')"><div class="tsel-logo" style="background-image:url('${logo(t)}')"></div><div class="ab">${esc(t.abbr)}</div><div class="ci">${esc(t.city)} ${esc(t.name)}</div><div class="rt">Edit</div></div>`).join('') || '<p style="color:var(--dim)">No custom teams yet.</p>'}</div></div>
        <button class="btn pri big" onclick="fbTeamEdit()">➕ Create a team</button></div>
      <div class="card"><div class="field"><label>Your leagues (${leagues().length})</label>
        ${leagues().map(l => `<div style="display:flex;gap:.5rem;align-items:center;margin:.3rem 0"><b style="flex:1">${esc(l.name)} <span style="color:var(--dim);font-weight:400">· ${l.teams.length} teams · ${l.weeks} weeks</span></b><button class="btn ghost" style="width:auto;padding:.4rem .8rem" onclick="fbLeagueEdit('${l.id}')">Edit</button></div>`).join('') || '<p style="color:var(--dim)">No custom leagues yet.</p>'}</div>
        <button class="btn pri big" onclick="fbLeagueEdit()">➕ Create a league</button></div>`;
    showScreen('setup');
  };
  window.fbTeamEdit = function(id){
    const t = myTeams().find(x => x.id === id) || { city:'', name:'', abbr:'', color:'#1d4ed8', color2:'#facc15', emblem:'🦅' };
    const prev = () => { const v = read(); document.getElementById('fbPrev').style.backgroundImage = `url('${logo(v)}')`; };
    window._fbPrev = prev;
    $('#setupBody').innerHTML = `<div class="logo" style="margin-bottom:1rem"><h1 style="font-size:2rem">${id ? '✏️ Edit team' : '➕ New team'}</h1></div>
      <div class="card"><div id="fbPrev" style="width:120px;height:140px;margin:0 auto 1rem;background:center/contain no-repeat url('${logo(t)}')"></div>
        <div class="field"><label>City</label><input id="tC" maxlength="18" value="${esc(t.city)}" oninput="_fbPrev()" placeholder="e.g. Arlen"></div>
        <div class="field"><label>Team name</label><input id="tN" maxlength="16" value="${esc(t.name)}" oninput="_fbPrev()" placeholder="e.g. Propaners"></div>
        <div class="field"><label>Abbreviation (2–3 letters)</label><input id="tA" maxlength="3" value="${esc(t.abbr)}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'');_fbPrev()" placeholder="ARL"></div>
        <div class="field" style="display:flex;gap:1rem"><div><label>Primary color</label><input type="color" id="tP" value="${t.color}" oninput="_fbPrev()"></div><div><label>Secondary color</label><input type="color" id="tS" value="${t.color2}" oninput="_fbPrev()"></div></div>
        <div class="field"><label>Emblem</label><div class="pickrow" id="tE">${EMBLEMS.map(e => `<div class="pill ${e === t.emblem ? 'on' : ''}" style="min-width:auto;padding:.4rem .6rem;font-size:1.3rem" onclick="[...this.parentNode.children].forEach(p=>p.classList.toggle('on',p===this));_fbPrev()">${e}</div>`).join('')}</div></div>
        <p id="tErr" style="color:var(--red,#ef4444);min-height:1.2em"></p>
        <button class="btn pri big" onclick="fbTeamSave('${t.id || ''}')">💾 Save team</button>
        ${id ? `<button class="btn ghost big" style="margin-top:.5rem" onclick="fbTeamDel('${id}')">Delete team</button>` : ''}
        <button class="btn ghost big" style="margin-top:.5rem" onclick="fbCreator()">Cancel</button></div>`;
  };
  function read(){ const on = document.querySelector('#tE .on');
    return { city:document.getElementById('tC').value.trim(), name:document.getElementById('tN').value.trim(), abbr:document.getElementById('tA').value.trim() || '???',
      color:document.getElementById('tP').value, color2:document.getElementById('tS').value, emblem:on ? on.textContent : '⭐' }; }
  window.fbTeamSave = function(id){
    const v = read(), err = document.getElementById('tErr');
    if(!v.city || !v.name) return err.textContent = 'Give your team a city and a name.';
    if(v.abbr.length < 2) return err.textContent = 'Use a 2–3 letter abbreviation.';
    if(allTeams().some(t => t.abbr === v.abbr && t.key !== 'c:' + id)) return err.textContent = `${v.abbr} is already taken.`;
    const ts = myTeams(), i = ts.findIndex(x => x.id === id);
    if(i >= 0) ts[i] = { ...ts[i], ...v }; else ts.push({ id:Date.now().toString(36), ...v });
    LS.set('fb_my_teams', ts); applyLeague();
    if(window.GXY) GXY.event('gxy-football', 'teams', ts.length);
    fbCreator();
  };
  window.fbTeamDel = function(id){
    if(!confirm('Delete this team? It will be removed from your leagues.')) return;
    LS.set('fb_my_teams', myTeams().filter(t => t.id !== id));
    LS.set('fb_leagues', leagues().map(l => ({ ...l, teams:l.teams.filter(k => k !== 'c:' + id) })));
    applyLeague(); fbCreator();
  };
  window.fbLeagueEdit = function(id){
    const L = leagues().find(l => l.id === id) || { name:'', teams:[], weeks:14, conf:2, div:2 };
    $('#setupBody').innerHTML = `<div class="logo" style="margin-bottom:1rem"><h1 style="font-size:2rem">${id ? '✏️ Edit league' : '➕ New league'}</h1></div>
      <div class="card"><div class="field"><label>League name</label><input id="lN" maxlength="24" value="${esc(L.name)}" placeholder="e.g. Backyard Football League"></div>
        <div class="field"><label>Season length</label><div class="pickrow" id="lW">${[8,10,14,18].map(w => `<div class="pill ${w === L.weeks ? 'on' : ''}" data-v="${w}" onclick="[...this.parentNode.children].forEach(p=>p.classList.toggle('on',p===this))"><div class="pn">${w} weeks</div></div>`).join('')}</div></div>
        <div class="field"><label>Structure</label><div class="pickrow" id="lS">${[[1,0,'One table'],[2,0,'2 conferences'],[2,2,'2 conf · 2 divisions'],[2,4,'2 conf · 4 divisions']].map(([c, d, n]) => `<div class="pill ${c === L.conf && d === L.div ? 'on' : ''}" data-c="${c}" data-d="${d}" onclick="[...this.parentNode.children].forEach(p=>p.classList.toggle('on',p===this))"><div class="pn">${n}</div></div>`).join('')}</div></div>
        <div class="field"><label>Teams (<span id="lCount">${L.teams.length}</span> picked · 4–32, even number)</label>
          <div style="display:flex;gap:.4rem;margin-bottom:.5rem"><button class="btn ghost" style="width:auto;padding:.35rem .7rem" onclick="document.querySelectorAll('#lT .tsel').forEach(e=>e.classList.add('on'));fbCount()">All</button><button class="btn ghost" style="width:auto;padding:.35rem .7rem" onclick="document.querySelectorAll('#lT .tsel').forEach(e=>e.classList.remove('on'));fbCount()">None</button></div>
          <div class="teamgrid" id="lT">${allTeams().map(t => `<div class="tsel ${L.teams.includes(t.key) ? 'on' : ''}" data-k="${t.key}" style="--tc:${t.color}" onclick="this.classList.toggle('on');fbCount()">${t.icon || t.logo ? `<div class="tsel-logo" style="background-image:url('${t.icon || t.logo}')"></div>` : ''}<div class="ab">${esc(t.abbr)}</div><div class="ci">${esc(t.city)} ${esc(t.name || '')}</div><div class="rt">${t.custom ? '🛠️ yours' : 'YOUFL'}</div></div>`).join('')}</div></div>
        <p id="lErr" style="color:var(--red,#ef4444);min-height:1.2em"></p>
        <button class="btn pri big" onclick="fbLeagueSave('${L.id || ''}')">💾 Save &amp; play this league</button>
        ${id ? `<button class="btn ghost big" style="margin-top:.5rem" onclick="fbLeagueDel('${id}')">Delete league</button>` : ''}
        <button class="btn ghost big" style="margin-top:.5rem" onclick="fbCreator()">Cancel</button></div>`;
  };
  window.fbCount = () => document.getElementById('lCount').textContent = document.querySelectorAll('#lT .tsel.on').length;
  window.fbLeagueSave = function(id){
    const name = document.getElementById('lN').value.trim(), teams = [...document.querySelectorAll('#lT .tsel.on')].map(e => e.dataset.k), err = document.getElementById('lErr');
    const s = document.querySelector('#lS .on'), w = document.querySelector('#lW .on');
    if(!name) return err.textContent = 'Name your league.';
    if(teams.length < 4 || teams.length > 32 || teams.length % 2) return err.textContent = 'Pick an even number of teams from 4 to 32.';
    const L = { id:id || Date.now().toString(36), name, teams, weeks:+w.dataset.v, conf:+s.dataset.c, div:+s.dataset.d };
    if(L.div && teams.length < L.conf * L.div * 2){ L.div = 0; }
    const ls = leagues(), i = ls.findIndex(l => l.id === L.id); if(i >= 0) ls[i] = L; else ls.push(L);
    LS.set('fb_leagues', ls); if(window.GXY) GXY.event('gxy-football', 'leagues', ls.length);
    fbUse(L.id);
  };
  window.fbLeagueDel = id => { if(!confirm('Delete this league?')) return; LS.set('fb_leagues', leagues().filter(l => l.id !== id)); if(LS.get('fb_active_league') === id) LS.set('fb_active_league', null); applyLeague(); fbCreator(); };

  /* ---------- menu ---------- */
  const modes = document.querySelector('#scr-modes .modes');
  if(modes){
    modes.insertAdjacentHTML('beforeend', `<div class="mode" onclick="fbCreator()"><span class="mic">🛠️</span><div class="mt"><h3>League &amp; Team Creator</h3><p>Design your own franchises and build a custom league to play in.</p></div><span class="arrow">→</span></div>`);
    modes.insertAdjacentHTML('beforebegin', '<div id="fbLeagueBanner" style="text-align:center;margin:.4rem 0 .8rem;font-size:.9rem"></div>');
  }
  applyLeague();
})();
