/* ============================================================
   GXY Roster — deep franchise roster engine for Football Madness
   Generated players (IP-safe), development, drafts, trades, HoF.
   window.FBRoster.*
   ============================================================ */
(function(){
  function rnd(a,b){return a+Math.random()*(b-a);}
  function ri(a,b){return Math.floor(rnd(a,b+1));}
  function pick(a){return a[Math.floor(Math.random()*a.length)];}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function gauss(){let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

  /* position groups: side + how many a team carries + starters that count toward rating */
  const POS=['QB','RB','WR','TE','OL','DL','LB','CB','S','K'];
  const POS_NAME={QB:'Quarterback',RB:'Running Back',WR:'Wide Receiver',TE:'Tight End',OL:'O-Line',DL:'D-Line',LB:'Linebacker',CB:'Cornerback',S:'Safety',K:'Kicker'};
  const TEMPLATE=[['QB',2],['RB',2],['WR',3],['TE',1],['OL',3],['DL',3],['LB',3],['CB',3],['S',2],['K',1]];
  const STARTERS={QB:1,RB:1,WR:2,TE:1,OL:2,DL:2,LB:2,CB:2,S:1,K:1};

  const FN=["Jaylen","Marcus","Derek","Tyrell","Cody","Xavier","DeShawn","Trent","Brock","Malik","Cooper","Jaxon","Cameron","Aaron","Isaiah","Diego","Mateo","Luca","Darnell","Kobe","Jamal","Tariq","Bryce","Cole","Devon","Elijah","Grant","Hunter","Jrue","Keon","Lamar","Nico","Owen","Preston","Quinton","Rashad","Silas","Tyree","Zane","Amari","Blake","Chance","Dashawn","Emmett"];
  const LN=["Carter","Brooks","Sanders","Hayes","Woods","Ellis","Grant","Foster","Reed","Cross","Malone","Vance","Boone","Rivers","Steele","Cruz","Ramos","Nash","Bell","Dodd","Fisher","Greer","Hollis","Jennings","Knox","Locke","Meyer","Osei","Pruitt","Rhodes","Sowell","Tate","Underwood","Vaughn","Weeks","York","Ackley","Braxton","Chandler","Dupree","Everett","Fontaine"];
  function genName(){ return pick(FN)+" "+pick(LN); }

  let _uid=1;
  /* per-position attribute templates (labels only; values derived from ovr) */
  const ATTRS={
    QB:['Arm','Accuracy','Awareness','Mobility'], RB:['Speed','Agility','Power','Catching'],
    WR:['Speed','Hands','Route','Jumping'], TE:['Hands','Blocking','Route','Strength'],
    OL:['Strength','Blocking','Awareness','Agility'], DL:['Strength','PassRush','Pursuit','Power'],
    LB:['Speed','Tackling','Coverage','Awareness'], CB:['Speed','Coverage','Hands','Agility'],
    S:['Speed','Coverage','Tackling','Awareness'], K:['Power','Accuracy','Composure','Consistency']
  };
  const DEV_TRAITS=['Normal','Normal','Normal','Star','Superstar','Slow'];
  function genAttrs(pos, ovr){
    const labels=ATTRS[pos]||['Overall']; const a={};
    labels.forEach(l=>{ a[l]=clamp(Math.round(ovr+gauss()*6),35,99); });
    return a;
  }
  function devMult(trait){ return trait==='Superstar'?1.7:trait==='Star'?1.3:trait==='Slow'?0.6:1; }

  function makePlayer(pos, opts){
    opts=opts||{};
    const age=opts.age!=null?opts.age:ri(22,31);
    const ovr=opts.ovr!=null?opts.ovr:clamp(Math.round(rnd(60,88)+gauss()*4),48,99);
    // potential: at/above ovr; younger => bigger ceiling
    const ceil=clamp(ovr+ (age<=24?ri(2,16):age<=27?ri(0,8):ri(0,3)),ovr,99);
    const trait=opts.trait||pick(DEV_TRAITS);
    return {
      id:'p'+(_uid++), name:opts.name||genName(), pos, posName:POS_NAME[pos],
      age, ovr, pot:ceil, years:opts.years!=null?opts.years:Math.max(0,age-22),
      teamId:opts.teamId!=null?opts.teamId:null,
      attrs:genAttrs(pos,ovr), dev:trait, xp:0,
      career:{games:0,seasons:0}, seasonStat:{}, accolades:[], champions:0,
      retired:false, hof:false, peakOvr:ovr
    };
  }

  /* training: spend XP to raise ovr (bounded by potential) */
  function xpToUpgrade(p){ return 40 + Math.max(0, p.ovr-70)*6; }
  function trainPlayer(p, focusAttr){
    if(p.ovr>=p.pot) return {ok:false, reason:'at ceiling'};
    const cost=xpToUpgrade(p);
    if((p.xp||0)<cost) return {ok:false, reason:'not enough XP', cost};
    p.xp-=cost; p.ovr=clamp(p.ovr+1,40,Math.max(p.pot,99));
    if(p.ovr>p.peakOvr)p.peakOvr=p.ovr;
    if(focusAttr && p.attrs && p.attrs[focusAttr]!=null) p.attrs[focusAttr]=clamp(p.attrs[focusAttr]+ri(1,3),35,99);
    else if(p.attrs){ const k=pick(Object.keys(p.attrs)); p.attrs[k]=clamp(p.attrs[k]+1,35,99); }
    return {ok:true};
  }
  // weekly practice: award XP to a chosen focus player (dev trait scales it) + small team-wide XP
  function awardPracticeXp(roster, focusId, mult){
    mult=mult==null?1:mult;
    (roster||[]).forEach(p=>{ const base = p.id===focusId? 34 : 6; p.xp=(p.xp||0)+Math.round(base*devMult(p.dev)*mult); });
  }

  function genRoster(teamId, strength){
    // strength ~ 0..1 nudges overall quality
    const players=[];
    TEMPLATE.forEach(([pos,count])=>{
      for(let i=0;i<count;i++){
        const base=rnd(58,86)+ (strength-0.5)*14 - i*3; // starters better than backups
        const ovr=clamp(Math.round(base+gauss()*3),48,97);
        const p=makePlayer(pos,{ovr,teamId,age:ri(22,32)});
        players.push(p);
      }
    });
    return players;
  }

  /* best N players at a position (by ovr) */
  function topAt(roster,pos,n){ return roster.filter(p=>p.pos===pos&&!p.retired).sort((a,b)=>b.ovr-a.ovr).slice(0,n); }
  function avgOvr(list){ return list.length? list.reduce((s,p)=>s+p.ovr,0)/list.length : 55; }

  function teamRating(roster){
    const off = avgOvr(topAt(roster,'QB',1))*0.32 + avgOvr(topAt(roster,'OL',2))*0.20 +
                avgOvr(topAt(roster,'WR',2))*0.18 + avgOvr(topAt(roster,'RB',1))*0.14 + avgOvr(topAt(roster,'TE',1))*0.10 +
                avgOvr(topAt(roster,'QB',1))*0.06; // slight extra QB tilt
    const def = avgOvr(topAt(roster,'DL',2))*0.30 + avgOvr(topAt(roster,'LB',2))*0.26 +
                avgOvr(topAt(roster,'CB',2))*0.26 + avgOvr(topAt(roster,'S',1))*0.18;
    const ovr = Math.round((off+def)/2);
    return { ovr:clamp(ovr,40,99), off:Math.round(off), def:Math.round(def) };
  }

  /* per-season stat line by position (lightweight, ovr-driven) — feeds leaders/awards/HoF */
  function genSeasonStats(p, teamRating){
    const form = clamp((p.ovr-70)/30 + 0.6 + gauss()*0.12, 0.2, 1.4);
    const s={};
    if(p.pos==='QB'){ s.passYds=Math.round(rnd(2600,4800)*form); s.passTD=Math.round(rnd(14,42)*form); s.int=Math.round(rnd(6,18)*(1.4-form*0.6)); }
    else if(p.pos==='RB'){ s.rushYds=Math.round(rnd(500,1700)*form); s.rushTD=Math.round(rnd(3,18)*form); }
    else if(p.pos==='WR'||p.pos==='TE'){ s.rec=Math.round(rnd(30,110)*form); s.recYds=Math.round(rnd(350,1500)*form); s.recTD=Math.round(rnd(2,14)*form); }
    else if(p.pos==='DL'||p.pos==='LB'){ s.tackles=Math.round(rnd(40,130)*form); s.sacks=Math.round(rnd(1,16)*form); }
    else if(p.pos==='CB'||p.pos==='S'){ s.tackles=Math.round(rnd(30,95)*form); s.ints=Math.round(rnd(0,9)*form); }
    else if(p.pos==='K'){ s.fgMade=Math.round(rnd(15,38)*form); }
    s.rating=Math.round(clamp(50+(p.ovr-70)*1.4+gauss()*6,20,99));
    return s;
  }
  function accStats(p, line){
    p.seasonStat=line;
    Object.keys(line).forEach(k=>{ if(k==='rating')return; p.career[k]=(p.career[k]||0)+line[k]; });
    p.career.games+=17; p.career.seasons+=1;
    if(p.ovr>p.peakOvr) p.peakOvr=p.ovr;
  }

  /* ===================== FANTASY + WEEKLY + ADVANCED (Next Gen) STATS ===================== */
  const FANTASY_MODES={ standard:{key:'standard',name:'Standard',ppr:0}, half:{key:'half',name:'Half-PPR',ppr:0.5}, ppr:{key:'ppr',name:'Full PPR',ppr:1} };
  // one game's stat line for a player, scaled by own rating vs opponent
  function genWeekStats(p, teamRating, oppRating){
    const edge=clamp(((teamRating||70)-(oppRating||70))/40,-0.5,0.5);
    const form=clamp((p.ovr-70)/30 + 0.62 + edge*0.35 + gauss()*0.22, 0.05, 1.7);
    const s={};
    if(p.pos==='QB'){
      s.passYds=Math.max(0,Math.round(rnd(150,320)*form)); s.passTD=Math.max(0,Math.round(rnd(0.4,3.2)*form));
      s.int=Math.max(0,Math.round(rnd(0,1.6)*(1.5-form*0.7))); s.rushYds=Math.max(0,Math.round(rnd(0,32)*form)); s.rushTD=Math.random()<0.06*form?1:0;
      s.cmp=Math.round(rnd(16,30)*clamp(form,.4,1.2)); s.att=s.cmp+Math.round(rnd(6,16));
      // Next Gen
      s.adv={ compPct:Math.round(100*s.cmp/Math.max(1,s.att)), timeToThrow:+(rnd(2.3,3.1)-edge*0.3).toFixed(2), pressuresFaced:Math.max(0,Math.round(rnd(4,16)-edge*4)), sacksTaken:Math.max(0,Math.round(rnd(0,4)-edge*2)), airYds:Math.round(rnd(90,240)*form) };
    } else if(p.pos==='RB'){
      s.rushYds=Math.max(0,Math.round(rnd(20,140)*form)); s.rushTD=Math.random()<0.5*form?1:0; s.rec=Math.max(0,Math.round(rnd(0,6)*form)); s.recYds=Math.max(0,Math.round(s.rec*rnd(4,11))); s.recTD=Math.random()<0.08*form?1:0;
      s.adv={ yardsAfterContact:Math.round(s.rushYds*rnd(0.4,0.65)), brokenTackles:Math.max(0,Math.round(rnd(0,5)*form)), explosive:Math.max(0,Math.round(rnd(0,3)*form)) };
    } else if(p.pos==='WR'||p.pos==='TE'){
      const cap=p.pos==='TE'?0.8:1; s.rec=Math.max(0,Math.round(rnd(1,10)*form*cap)); s.recYds=Math.max(0,Math.round(s.rec*rnd(7,16))); s.recTD=Math.random()<0.45*form*cap?1:0; s.tgt=s.rec+Math.round(rnd(1,6));
      s.adv={ yac:Math.round(s.recYds*rnd(0.25,0.55)), separation:+(rnd(1.8,3.6)+form*0.4).toFixed(1), catchPct:Math.round(100*s.rec/Math.max(1,s.tgt)), drops:Math.random()<0.4?ri(0,2):0 };
    } else if(p.pos==='DL'||p.pos==='LB'){
      s.tackles=Math.max(0,Math.round(rnd(2,9)*form)); s.sacks=Math.random()<0.55*form?ri(0,2):0; s.ffum=Math.random()<0.08?1:0;
      s.adv={ pressures:Math.max(0,Math.round(rnd(1,7)*form)), qbHits:Math.max(0,Math.round(rnd(0,4)*form)), hurries:Math.max(0,Math.round(rnd(0,5)*form)), stuffs:Math.max(0,Math.round(rnd(0,3)*form)) };
    } else if(p.pos==='CB'||p.pos==='S'){
      s.tackles=Math.max(0,Math.round(rnd(2,7)*form)); s.ints=Math.random()<0.16*form?1:0; s.pd=Math.max(0,Math.round(rnd(0,3)*form));
      s.adv={ targets:Math.max(0,Math.round(rnd(3,9))), completionsAllowed:Math.max(0,Math.round(rnd(1,6)*(1.4-form*0.5))), missedTackles:Math.random()<0.4?ri(0,2):0 };
    } else if(p.pos==='K'){
      s.fgMade=Math.max(0,Math.round(rnd(0,4)*form)); s.fgAtt=s.fgMade+(Math.random()<0.4?1:0); s.xp=Math.round(rnd(1,5)*form);
      s.adv={ longest:ri(28,58), fgPct:Math.round(100*s.fgMade/Math.max(1,s.fgAtt)) };
    } else { s.adv={}; }
    s.fp={ standard:+fantasyPoints(s,'standard').toFixed(1), half:+fantasyPoints(s,'half').toFixed(1), ppr:+fantasyPoints(s,'ppr').toFixed(1) };
    return s;
  }
  function fantasyPoints(s, mode){
    const ppr=(FANTASY_MODES[mode]||FANTASY_MODES.standard).ppr;
    let f=0;
    f+=(s.passYds||0)*0.04 + (s.passTD||0)*4 - (s.int||0)*2;
    f+=(s.rushYds||0)*0.1 + (s.rushTD||0)*6;
    f+=(s.recYds||0)*0.1 + (s.recTD||0)*6 + (s.rec||0)*ppr;
    f+=(s.sacks||0)*2 + (s.ints||0)*3 + (s.ffum||0)*2 + (s.pd||0)*1;
    f+=(s.fgMade||0)*3 + (s.xp||0)*1;
    return f;
  }
  // accumulate a weekly line into season totals (and optional per-game log)
  function accWeek(p, line, week, keepLog){
    p.seasonStat=p.seasonStat||{};
    Object.keys(line).forEach(k=>{ if(k==='adv'||k==='fp'||k==='rating')return; p.seasonStat[k]=(p.seasonStat[k]||0)+line[k]; });
    // accumulate advanced
    if(line.adv){ p.seasonStat.adv=p.seasonStat.adv||{}; Object.keys(line.adv).forEach(k=>{ const v=line.adv[k]; if(typeof v==='number'){ p.seasonStat.adv[k]=(p.seasonStat.adv[k]||0)+v; } }); }
    p.seasonStat.gp=(p.seasonStat.gp||0)+1;
    p.seasonStat.fpStd=(p.seasonStat.fpStd||0)+(line.fp?line.fp.standard:0);
    p.seasonStat.fpHalf=(p.seasonStat.fpHalf||0)+(line.fp?line.fp.half:0);
    p.seasonStat.fpPpr=(p.seasonStat.fpPpr||0)+(line.fp?line.fp.ppr:0);
    if(keepLog){ p.gameLog=p.gameLog||[]; p.gameLog.push(Object.assign({week}, line)); }
  }
  function seasonFantasy(p, mode){ const k=mode==='ppr'?'fpPpr':mode==='half'?'fpHalf':'fpStd'; return +((p.seasonStat&&p.seasonStat[k])||0).toFixed(1); }

  /* offseason development: age + move toward potential with variance (breakouts/busts) */
  function developPlayer(p, mult){
    mult=mult==null?1:mult;
    p.age++; p.years++;
    let d;
    if(p.age<=23){ d=ri(1,5)+ (p.pot>p.ovr?ri(0,3):0); }        // growth toward ceiling
    else if(p.age<=27){ d=ri(-1,3); }                            // prime
    else if(p.age<=30){ d=ri(-3,1); }
    else if(p.age<=33){ d=ri(-5,-1); }
    else { d=ri(-8,-2); }
    // breakout / bust rolls for young players
    if(p.age<=25 && Math.random()<0.08) d+=ri(3,7);             // breakout
    if(p.age<=25 && Math.random()<0.06) d-=ri(3,6);             // bust
    if(d>0) d=Math.round(d*mult);                                // progression slider only speeds gains
    p.ovr=clamp(p.ovr+d, 40, Math.max(p.pot,99));
    if(p.ovr>p.peakOvr) p.peakOvr=p.ovr;
    return d;
  }

  function retirementCheck(p){
    if(p.age>=40) return true;
    if(p.age>=37 && Math.random()<0.6) return true;
    if(p.age>=34 && p.ovr<66 && Math.random()<0.5) return true;
    if(p.ovr<52 && p.age>=30 && Math.random()<0.5) return true;
    return false;
  }

  /* Hall of Fame scoring */
  function hofScore(p){
    return Math.round(p.peakOvr*1.0 + (p.career.seasons||0)*3 + (p.accolades.length)*14 + (p.champions||0)*18 + Math.max(0,p.peakOvr-88)*4);
  }
  function hofEligible(p){ return hofScore(p)>=150; }

  /* value for trades & draft ordering */
  function playerValue(p){
    const ageF=(29-p.age)*1.6;
    const potF=Math.max(0,p.pot-p.ovr)*0.8;
    return Math.round(Math.max(1, (p.ovr-40)*2 + potF + ageF));
  }

  /* draft class: prospects (young, lower ovr, spread potential) */
  function genDraftClass(n, year){
    const cls=[];
    const dist=['QB','RB','WR','WR','TE','OL','OL','DL','DL','LB','CB','CB','S','K'];
    for(let i=0;i<n;i++){
      const pos=pick(dist);
      const ovr=clamp(Math.round(rnd(52,72)+gauss()*3),45,80);
      const p=makePlayer(pos,{ovr,age:ri(21,23),years:0});
      p.pot=clamp(ovr+ri(4,26),ovr,99); // prospects have big ceilings
      p.draftYear=year; p.scouted=Math.round(clamp(p.pot+gauss()*6,ovr,99)); // scouted potential (noisy)
      cls.push(p);
    }
    // sort by a blend of ovr + scouted potential (draft board)
    cls.sort((a,b)=>(b.ovr+b.scouted)-(a.ovr+a.scouted));
    return cls;
  }
  function prospectValue(p){ return Math.round((p.ovr-40)*1.5 + (p.scouted-p.ovr)*1.2 + 10); }

  /* trade evaluation from the AI team's perspective.
     give = players the user sends (AI receives); get = players the user receives (AI sends).
     AI accepts if it doesn't lose meaningful value. */
  function evaluateTrade(givePlayers, getPlayers){
    const inVal=givePlayers.reduce((s,p)=>s+playerValue(p),0);   // AI gains
    const outVal=getPlayers.reduce((s,p)=>s+playerValue(p),0);   // AI loses
    const ok = inVal >= outVal*0.92;
    return { ok, inVal, outVal, margin:inVal-outVal };
  }

  /* team need: which positions are weakest vs baseline (for AI draft/trade) */
  function teamNeeds(roster){
    const needs=[];
    Object.keys(STARTERS).forEach(pos=>{
      const starters=topAt(roster,pos,STARTERS[pos]);
      const a=avgOvr(starters);
      needs.push({pos, rating:Math.round(a)});
    });
    return needs.sort((x,y)=>x.rating-y.rating);
  }

  window.FBRoster={ POS, POS_NAME, TEMPLATE, STARTERS, genName, makePlayer, genRoster, teamRating,
    topAt, avgOvr, genSeasonStats, accStats, developPlayer, retirementCheck, hofScore, hofEligible,
    playerValue, genDraftClass, prospectValue, evaluateTrade, teamNeeds, _util:{rnd,ri,pick,clamp,gauss} };

  /* ===================== CONTRACTS & SALARY CAP ===================== */
  const SALARY_CAP = 255; // in $M (all money values are $M)
  // rough market salary from overall + position premium
  function marketSalary(p){
    const posPrem = {QB:1.9, WR:1.25, DL:1.25, CB:1.2, LB:1.1, OL:1.15, TE:1.0, S:1.0, RB:0.9, K:0.4}[p.pos]||1;
    // exponential curve: average players are cheap, stars are expensive
    const t = clamp((p.ovr-56)/44, 0, 1);
    const base = Math.max(0.8, Math.pow(t,1.9)*42);
    const ageAdj = p.age>=31? 0.8 : p.age<=25? 1.05 : 1;
    return Math.max(0.8, +(base*posPrem*ageAdj).toFixed(1));
  }
  function assignContract(p, opts){
    opts=opts||{};
    const salary = opts.salary!=null? opts.salary : marketSalary(p);
    const years = opts.years!=null? opts.years : (p.age<=26? ri(3,5) : p.age<=30? ri(2,4) : ri(1,2));
    p.contract = { salary:+salary.toFixed(1), years, yearsLeft: opts.yearsLeft!=null?opts.yearsLeft:years };
    return p.contract;
  }
  function rosterContract(roster){ (roster||[]).forEach(p=>{ if(!p.contract) assignContract(p); }); return roster; }
  // scale an over-cap roster down so it starts compliant with a little room (like real teams)
  function fitRosterToCap(roster, target){
    target = target || 0.94;
    const used = teamCapUsed(roster);
    const cap = SALARY_CAP*target;
    if(used>cap && used>0){
      const f = cap/used;
      (roster||[]).forEach(p=>{ if(p.contract) p.contract.salary=Math.max(0.6, +(p.contract.salary*f).toFixed(1)); });
    }
    return roster;
  }
  function teamCapUsed(roster){ return +(roster||[]).reduce((s,p)=>s+((p.contract&&p.contract.salary)||0),0).toFixed(1); }
  function teamCapSpace(roster){ return +(SALARY_CAP - teamCapUsed(roster)).toFixed(1); }
  // ---- contract negotiation model ----
  // what a player is asking for, based on OVR, age, accolades and recent form
  function contractDemand(p){
    const mkt=marketSalary(p);
    const acc=(p.accolades?p.accolades.length:0);
    const form=(p.seasonStat&&p.seasonStat.rating)? (p.seasonStat.rating-70)/40 : 0; // -1..~0.7
    const youth = p.age<=26?0.14 : p.age<=29?0.05 : p.age<=32?-0.03 : -0.12;
    const mult = 1 + youth + acc*0.05 + Math.max(-0.1,Math.min(0.18,form*0.2));
    const askSalary=+Math.max(0.8, mkt*mult).toFixed(1);
    const askYears = p.age<=26? ri(4,5) : p.age<=30? ri(3,4) : ri(1,3);
    return { salary:askSalary, years:askYears, mkt:+mkt.toFixed(1) };
  }
  // evaluate a user's offer against demands. returns {result:'accept'|'counter'|'reject', counter?, mood}
  function evaluateOffer(p, offerSalary, offerYears){
    const d=contractDemand(p);
    const salRatio=offerSalary/d.salary;                 // 1.0 = exactly asking
    const yearsOk = Math.abs(offerYears-d.years)<=1;
    if(salRatio>=0.97 && yearsOk) return {result:'accept', demand:d};
    if(salRatio>=0.85){ // close → counter toward the midpoint
      const cSal=+(( d.salary*0.6 + offerSalary*0.4 )).toFixed(1);
      const cYears=d.years;
      return {result:'counter', counter:{salary:cSal, years:cYears}, demand:d};
    }
    return {result:'reject', demand:d};
  }
  function signContract(p, salary, years){ p.contract={ salary:+salary.toFixed(1), years, yearsLeft:years }; return p.contract; }
  // legacy quick-quote kept for compatibility (used by any old callers)
  function extensionQuote(p){ const d=contractDemand(p); return { salary:d.salary, years:d.years }; }
  function canAfford(roster, addSalary, replaceId){
    let used = teamCapUsed(roster);
    if(replaceId){ const r=(roster||[]).find(p=>p.id===replaceId); if(r&&r.contract) used-=r.contract.salary; }
    return (used + addSalary) <= SALARY_CAP;
  }
  // decrement contract years at season rollover; returns {expiring:[...]}
  function tickContracts(roster){
    const expiring=[];
    (roster||[]).forEach(p=>{ if(p.contract){ p.contract.yearsLeft--; if(p.contract.yearsLeft<=0) expiring.push(p); } });
    return expiring;
  }

  /* ===================== MORALE & INJURIES ===================== */
  function initMorale(t){ if(t.morale==null) t.morale=70; }
  function bumpMorale(t, won){ initMorale(t); t.morale = clamp(t.morale + (won? ri(2,6) : -ri(2,6)), 15, 100); }
  // light injury system: chance a starter is dinged 1-4 weeks; returns injured player or null
  function rollInjury(roster, chanceMult){
    chanceMult=chanceMult==null?1:chanceMult;
    if(!roster || Math.random()>0.14*chanceMult) return null;
    const healthy = roster.filter(p=>!p.injuryWeeks || p.injuryWeeks<=0);
    if(!healthy.length) return null;
    const p = pick(healthy);
    p.injuryWeeks = ri(1,4);
    return p;
  }
  function healWeek(roster){ (roster||[]).forEach(p=>{ if(p.injuryWeeks>0) p.injuryWeeks--; }); }
  function teamHealth(roster){
    const all=(roster||[]); if(!all.length) return 100;
    const hurt=all.filter(p=>p.injuryWeeks>0).length;
    return Math.round(100*(all.length-hurt)/all.length);
  }
  // rating that ignores injured players (so injuries actually weaken you)
  function healthyTeamRating(roster){
    const healthy=(roster||[]).filter(p=>!p.injuryWeeks || p.injuryWeeks<=0);
    return teamRating(healthy.length? healthy : roster);
  }

  Object.assign(window.FBRoster, {
    SALARY_CAP, marketSalary, assignContract, rosterContract, fitRosterToCap, teamCapUsed, teamCapSpace,
    extensionQuote, canAfford, tickContracts,
    initMorale, bumpMorale, rollInjury, healWeek, teamHealth, healthyTeamRating
  });

  /* ===================== POSITION RANKINGS ===================== */
  // grade one position group for a roster: overall of its starters (0 if none)
  function positionGrade(roster, pos){
    const starters = topAt(roster, pos, STARTERS[pos]||1);
    if(!starters.length) return 0;
    return Math.round(avgOvr(starters));
  }
  // all position grades for a team, e.g. {QB:88, RB:74, ...}
  function positionGrades(roster){
    const g={};
    POS.forEach(p=>{ g[p]=positionGrade(roster, p); });
    return g;
  }
  // league rank (1 = best) of a team's position group among all teams that have rosters
  function positionLeagueRank(teams, teamId, pos){
    const graded = teams.filter(t=>t.roster).map(t=>({id:t.id, g:positionGrade(t.roster,pos)}))
      .sort((a,b)=>b.g-a.g);
    const idx = graded.findIndex(x=>x.id===teamId);
    return { rank: idx>=0? idx+1 : null, of: graded.length, grade: graded[idx]?graded[idx].g:0 };
  }
  // full team position ranking table with league ranks
  function teamPositionReport(teams, teamId){
    const me = teams.find(t=>t.id===teamId); if(!me||!me.roster) return [];
    return POS.map(pos=>{
      const lr = positionLeagueRank(teams, teamId, pos);
      return { pos, name:POS_NAME[pos], grade:lr.grade, rank:lr.rank, of:lr.of };
    });
  }
  // league leaders at a position (top N teams)
  function positionLeaders(teams, pos, n){
    return teams.filter(t=>t.roster).map(t=>({team:t, grade:positionGrade(t.roster,pos)}))
      .sort((a,b)=>b.grade-a.grade).slice(0, n||5);
  }

  /* ===================== DRAFT PICKS AS ASSETS ===================== */
  // give a team a set of future draft picks (rounds 1..r) for the next `yearsAhead` seasons
  function makePicks(teamId, startYear, rounds, years){
    rounds=rounds||4; years=years||2; const picks=[];
    for(let y=0;y<years;y++){ for(let r=1;r<=rounds;r++){ picks.push({id:'pk'+(_uid++), teamId, year:startYear+y, round:r, orig:teamId}); } }
    return picks;
  }
  // rough trade value of a pick (earlier round + sooner = more)
  function pickValue(pick, curYear){
    const roundVal = {1:34, 2:20, 3:12, 4:7, 5:4}[pick.round] || 3;
    const yearsOut = Math.max(0, (pick.year||curYear) - curYear);
    return Math.max(1, Math.round(roundVal * Math.pow(0.88, yearsOut)));
  }
  function pickLabel(pick){ const r=pick.round; const suf=r===1?'st':r===2?'nd':r===3?'rd':'th'; return pick.year+' '+r+suf+' Rd'; }

  Object.assign(window.FBRoster, {
    positionGrade, positionGrades, positionLeagueRank, teamPositionReport, positionLeaders,
    makePicks, pickValue, pickLabel,
    ATTRS, DEV_TRAITS, genAttrs, devMult, xpToUpgrade, trainPlayer, awardPracticeXp,
    contractDemand, evaluateOffer, signContract,
    FANTASY_MODES, genWeekStats, fantasyPoints, accWeek, seasonFantasy
  });

  /* ===================== COACHING STAFF ===================== */
  const COACH_FN=["Mike","Sean","Dan","Andy","Kyle","Nick","Doug","Matt","Zac","Kevin","Brian","John","Shane","Frank","Todd","Ron","Bill","Pete","Robert","Aaron","Marcus","Terrell"];
  const COACH_LN=["Painter","Rhodes","Callahan","Vance","Whitfield","Booker","Sennett","Hargrove","Prowse","Delgado","Kingsley","Ambrose","Farley","Winters","Cobb","Maddox","Ellison","Barnett","Shaw","Riggs"];
  function coachName(){ return pick(COACH_FN)+' '+pick(COACH_LN); }
  const SCHEMES_OFF=['West Coast','Air Raid','Spread Option','Power Run','Vertical'];
  const SCHEMES_DEF=['4-3 Base','3-4 Base','Cover 3 Zone','Man Press','Multiple'];

  function makeCoach(role, opts){
    opts=opts||{};
    const ovr=opts.ovr!=null?opts.ovr:clamp(Math.round(rnd(58,82)+gauss()*4),50,95);
    return {
      id:'co'+(_uid++), name:opts.name||coachName(), role, // 'HC' | 'OC' | 'DC'
      ovr, level:opts.level||1, xp:0,
      scheme: role==='DC'? pick(SCHEMES_DEF) : pick(SCHEMES_OFF),
      // specialties give small rating nudges to their side of the ball
      bonus: Math.round((ovr-60)/8) // 0..~4
    };
  }
  function makeStaff(strength){
    strength=strength==null?0.5:strength;
    const base=()=>clamp(Math.round(60+strength*22+gauss()*4),50,92);
    return { HC:makeCoach('HC',{ovr:base()}), OC:makeCoach('OC',{ovr:base()}), DC:makeCoach('DC',{ovr:base()}), autoManage:false };
  }
  function coachXpToNext(level){ return 100 + (level-1)*60; }
  function addCoachXp(coach, xp){
    coach.xp += xp;
    let leveled=false;
    while(coach.xp >= coachXpToNext(coach.level)){ coach.xp -= coachXpToNext(coach.level); coach.level++; coach.ovr=clamp(coach.ovr+1,50,99); coach.bonus=Math.round((coach.ovr-60)/8); leveled=true; }
    return leveled;
  }
  // staff effect on team ratings (small, earned): OC boosts OFF, DC boosts DEF, HC boosts both a little
  function staffBonus(staff){
    if(!staff) return {off:0, def:0};
    const hc=staff.HC?Math.round(staff.HC.bonus/2):0;
    return { off:(staff.OC?staff.OC.bonus:0)+hc, def:(staff.DC?staff.DC.bonus:0)+hc };
  }
  // candidate pool for hiring
  function coachMarket(n){ n=n||6; const roles=['HC','OC','DC']; const out=[]; for(let i=0;i<n;i++){ out.push(makeCoach(pick(roles),{ovr:clamp(Math.round(rnd(56,88)+gauss()*4),50,95)})); } return out; }

  Object.assign(window.FBRoster, {
    makeCoach, makeStaff, coachXpToNext, addCoachXp, staffBonus, coachMarket, SCHEMES_OFF, SCHEMES_DEF
  });

})();
