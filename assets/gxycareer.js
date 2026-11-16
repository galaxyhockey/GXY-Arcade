/* ============================================================
   GXY Career Engine — shared season/playoff/player-career logic
   Used by Football Madness and GXY Hockey Arcade (Career mode).
   Sport-agnostic: configured per game via a config object.

   window.GXYCareer.*
   ============================================================ */
(function(){
  function rnd(a,b){return a+Math.random()*(b-a);}
  function ri(a,b){return Math.floor(rnd(a,b+1));}
  function pick(a){return a[Math.floor(Math.random()*a.length)];}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function gauss(){ // ~N(0,1)
    let u=0,v=0; while(u===0)u=Math.random(); while(v===0)v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  /* ---- league creation from a city list ---- */
  function makeLeague(cfg){
    const cities=cfg.cities.slice();
    const teams=cities.map((c,i)=>({
      id:i, city:c.city, name:c.name||'', abbr:c.abbr, color:c.color||'#3b82f6', color2:c.color2||'#ffffff', logo:c.logo||'', icon:c.icon||null,
      rating: cfg.fixedRatings? c.rating : Math.round(rnd(62,90)),
      wins:0, losses:0, ties:0, pf:0, pa:0, streak:0, conf:0, div:0
    }));
    // conference + division assignment
    const T=teams.length, nConf=cfg.conferences||2, nDiv=cfg.divisions||0;
    teams.forEach((t,i)=>{
      if(nDiv>0 && T>=nConf*nDiv){
        const perConf=Math.floor(T/nConf);
        t.conf=Math.min(nConf-1, Math.floor(i/perConf));
        const idxInConf=i - t.conf*perConf;
        const perDiv=Math.max(1, Math.floor(perConf/nDiv));
        t.div=Math.min(nDiv-1, Math.floor(idxInConf/perDiv));
      } else { t.conf=i%nConf; t.div=0; }
    });
    return { teams, week:0, season:1, schedule:buildSchedule(teams,cfg), results:[], champion:null, cfg, nConf, nDiv };
  }
  function buildSchedule(teams,cfg){
    const N=cfg.seasonLength||14;
    const ids=teams.map(t=>t.id);
    const T=ids.length;
    const weeks=Array.from({length:N},()=>[]);
    if(cfg.byes && T%2===0 && N>=6){
      // one bye per team, spread across the middle weeks, even count per bye week to keep pairings clean
      const byeStart=Math.max(1,Math.floor(N*0.22));
      const byeEnd=Math.min(N-2,Math.floor(N*0.72));
      const avail=[]; for(let w=byeStart;w<=byeEnd;w++) avail.push(w);
      let perWeek=2;
      while((T%perWeek!==0 || T/perWeek>avail.length) && perWeek<T) perWeek+=2;
      const shuffled=ids.slice().sort(()=>Math.random()-0.5);
      const byeOf={}; let bi=0;
      for(const w of avail){ for(let k=0;k<perWeek && bi<T;k++){ byeOf[shuffled[bi++]]=w; } if(bi>=T) break; }
      ids.forEach(id=>{ if(byeOf[id]==null) byeOf[id]=avail[avail.length-1]; });
      for(let w=0;w<N;w++){
        const elig=ids.filter(id=>byeOf[id]!==w).sort(()=>Math.random()-0.5);
        for(let i=0;i+1<elig.length;i+=2){ weeks[w].push({home:elig[i],away:elig[i+1],played:false,hs:0,as:0}); }
      }
      return weeks;
    }
    // default: everyone plays every week (no byes)
    for(let w=0;w<N;w++){
      const order=ids.slice().sort(()=>Math.random()-0.5);
      for(let i=0;i+1<order.length;i+=2){ weeks[w].push({home:order[i],away:order[i+1],played:false,hs:0,as:0}); }
    }
    return weeks;
  }

  /* ---- game simulation: returns {hs,as} scores ---- */
  function simScore(rating,opp,cfg){
    const m=cfg.score; // {base, per, spread, min, max, step}
    let s = m.base + (rating-opp)*m.per + gauss()*m.spread;
    s = clamp(Math.round(s), m.min, m.max);
    if(m.step && m.step>1) s = Math.round(s/m.step)*m.step;
    return s;
  }
  function simGame(home,away,cfg){
    const HFA=cfg.homeAdv||2;
    let hs=simScore(home.rating+HFA, away.rating, cfg);
    let as=simScore(away.rating, home.rating+HFA, cfg);
    if(hs===as && !cfg.allowTies){ if(Math.random()<0.5)hs+=(cfg.score.step||1); else as+=(cfg.score.step||1); }
    return {hs,as};
  }
  function applyResult(league,g){
    const T=league.teams, h=T[g.home], a=T[g.away];
    h.pf+=g.hs; h.pa+=g.as; a.pf+=g.as; a.pa+=g.hs;
    if(g.hs>g.as){ h.wins++; a.losses++; h.streak=Math.max(1,h.streak+1); a.streak=Math.min(-1,a.streak-1); }
    else if(g.as>g.hs){ a.wins++; h.losses++; a.streak=Math.max(1,a.streak+1); h.streak=Math.min(-1,h.streak-1); }
    else { h.ties++; a.ties++; h.streak=0; a.streak=0; }
  }
  /* sim one week; optionally skip a specific game (the user's, handled elsewhere) */
  function simWeek(league, skipTeamId){
    const games=league.schedule[league.week]; if(!games) return [];
    games.forEach(g=>{
      if(g.played) return;
      if(skipTeamId!=null && (g.home===skipTeamId||g.away===skipTeamId)) return;
      const r=simGame(league.teams[g.home],league.teams[g.away],league.cfg);
      g.hs=r.hs; g.as=r.as; g.played=true; applyResult(league,g);
    });
    return games;
  }
  function recordUserGame(league, teamId, oppId, myScore, oppScore){
    const games=league.schedule[league.week]||[];
    let g=games.find(x=>(x.home===teamId||x.away===teamId));
    if(!g){ g={home:teamId,away:oppId,played:false,hs:0,as:0}; games.push(g); }
    if(g.home===teamId){ g.hs=myScore; g.as=oppScore; } else { g.hs=oppScore; g.as=myScore; }
    g.played=true; applyResult(league,g);
    return g;
  }
  function advanceWeek(league){ league.week++; }
  function seasonDone(league){ return league.week>=league.schedule.length; }

  function stdCmp(a,b){
    const wpa=(a.wins+a.ties*0.5)/Math.max(1,a.wins+a.losses+a.ties);
    const wpb=(b.wins+b.ties*0.5)/Math.max(1,b.wins+b.losses+b.ties);
    return wpb-wpa || (b.pf-b.pa)-(a.pf-a.pa) || b.pf-a.pf;
  }
  function standings(league){ return league.teams.slice().sort(stdCmp); }
  function sortTeams(list){ return list.slice().sort(stdCmp); }
  // grouped standings: [{conf, divs:[{div, teams:[...sorted]}]}]
  function divisionStandings(league){
    const out=[];
    for(let c=0;c<(league.nConf||2);c++){
      const divs=[];
      const nd=league.nDiv||1;
      for(let d=0;d<Math.max(1,nd);d++){
        const teams=sortTeams(league.teams.filter(t=>t.conf===c && t.div===d));
        if(teams.length) divs.push({div:d, teams});
      }
      out.push({conf:c, divs});
    }
    return out;
  }
  // seed a conference: division winners first (by record), then wild cards to fill n
  function conferenceSeeds(league, conf, n){
    const teams=league.teams.filter(t=>t.conf===conf);
    const byDiv={};
    teams.forEach(t=>{ (byDiv[t.div]=byDiv[t.div]||[]).push(t); });
    const winners=Object.keys(byDiv).map(d=>sortTeams(byDiv[d])[0]).filter(Boolean);
    const seeded=sortTeams(winners).map(t=>t.id);
    if(n>seeded.length){
      const rest=sortTeams(teams.filter(t=>!seeded.includes(t.id)));
      for(const t of rest){ if(seeded.length>=n) break; seeded.push(t.id); }
    }
    return seeded.slice(0,n);
  }

  /* ---- playoffs: conference-seeded single elimination (confs meet in the final) ---- */
  function makePlayoffs(league, teamsIn){
    const nConf=league.nConf||2;
    if(nConf===2 && (league.nDiv||0)>=1){
      const per=Math.max(2, Math.round((teamsIn||8)/2));
      const A=conferenceSeeds(league,0,per), B=conferenceSeeds(league,1,per);
      // interleave so each half of the flat bracket is a single conference; they meet only in the final
      const seeds=[];
      if(per===4){ seeds.push(A[0],B[0],B[1],A[1],A[2],B[2],B[3],A[3]); }
      else { // generic: A occupies outer/left slots, B inner/right — fallback simple interleave
        for(let i=0;i<per;i++){ seeds.push(A[i]); seeds.push(B[i]); }
      }
      const clean=seeds.filter(x=>x!=null);
      return { round:0, alive:clean.slice(), seeds:clean.slice(), games:[], done:false, champion:null, confSeeds:{0:A,1:B}, byConf:true };
    }
    const n=teamsIn||8; const seeds=standings(league).slice(0,n);
    return { round:0, alive:seeds.map(t=>t.id), seeds:seeds.map(t=>t.id), games:[], done:false, champion:null };
  }
  function simPlayoffRound(league, po, userTeamId, userWon){
    const alive=po.alive.slice(); const next=[]; const games=[];
    // pair 1v last, etc.
    for(let i=0;i<alive.length/2;i++){
      const aId=alive[i], bId=alive[alive.length-1-i];
      let winner;
      if(userTeamId!=null && (aId===userTeamId||bId===userTeamId) && userWon!=null){
        winner = userWon ? userTeamId : (aId===userTeamId?bId:aId);
        games.push({a:aId,b:bId,winner,user:true});
      } else {
        const A=league.teams[aId], B=league.teams[bId];
        const r=simGame(A,B,league.cfg);
        winner = r.hs>=r.as? aId : bId;
        games.push({a:aId,b:bId,winner,hs:r.hs,as:r.as});
      }
      next.push(winner);
    }
    po.games.push(games); po.alive=next; po.round++;
    if(next.length===1){ po.done=true; po.champion=next[0]; league.champion=next[0]; }
    return games;
  }

  /* ---- player career ---- */
  function makePlayer(cfg, opts){
    opts=opts||{};
    const pos=opts.position||pick(cfg.positions.map(p=>p.key));
    const posDef=cfg.positions.find(p=>p.key===pos);
    return {
      name:opts.name||'Rookie', position:pos, posName:posDef.name,
      overall: opts.overall||ri(58,68), age:21, season:1, teamId:null,
      career:{}, seasonStats:{}, awards:[], history:[]
    };
  }
  function draftPlayer(league, player){
    // worse teams draft first; player lands on a lower-rated team, weighted
    const order=standings(league).slice().reverse();
    const spot=ri(0, Math.min(order.length-1, 6));
    player.teamId=order[spot].id;
    player.draftPick=spot+1;
    return order[spot];
  }
  function simPlayerGame(cfg, player, oppRating){
    const posDef=cfg.positions.find(p=>p.key===player.position);
    const form = clamp((player.overall - oppRating)/40 + 0.5 + gauss()*0.18, 0.05, 1.3);
    const line={};
    posDef.stats.forEach(st=>{
      const base=st.avg*form*rnd(0.6,1.4);
      line[st.key]=Math.max(0, Math.round(base*(st.round||1))/(st.round||1));
    });
    // grade 0-100
    let grade=clamp(Math.round(55 + (form-0.5)*70 + gauss()*6), 10, 99);
    line.grade=grade;
    return line;
  }
  function addStats(dst,line,cfg,player){
    const posDef=cfg.positions.find(p=>p.key===player.position);
    posDef.stats.forEach(st=>{ dst[st.key]=(dst[st.key]||0)+(line[st.key]||0); });
    dst.games=(dst.games||0)+1; dst.gradeSum=(dst.gradeSum||0)+line.grade;
  }
  function progressPlayer(player){
    player.age++; player.season++;
    let delta;
    if(player.age<=25) delta=ri(1,4);
    else if(player.age<=29) delta=ri(-1,2);
    else delta=ri(-4,0);
    player.overall=clamp(player.overall+delta,40,99);
  }

  window.GXYCareer={ makeLeague, simGame, simWeek, recordUserGame, advanceWeek, seasonDone,
    standings, sortTeams, divisionStandings, conferenceSeeds, makePlayoffs, simPlayoffRound, makePlayer, draftPlayer, simPlayerGame, addStats,
    progressPlayer, _util:{rnd,ri,pick,clamp,gauss} };
})();
