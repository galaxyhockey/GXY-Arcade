/* ============================================================
   GXY Meta — cross-game player profiles, XP, levels, streaks, badges
   ------------------------------------------------------------
   One profile doc per player at players/{uid} aggregates activity
   across every game. Games call gxyMeta.recordGame(...) after a run;
   the profile page and homepage read gxyMeta.getProfile().

   Module usage:
     import { gxyMeta } from '[root]assets/gxymeta.js';
     await gxyMeta.recordGame('neonsiege', { score: 5200, won:false });
     const p = await gxyMeta.getProfile();       // your profile
     const p2 = await gxyMeta.getProfile(uid);   // someone else's

   Profile shape (players/{uid}):
     { uid, name, xp, level, totalScore, plays,
       games:{ neonsiege:{best,plays,lastScore}, ... },
       badges:[id,...], streak:{count,best,lastDay},
       firstSeen, updatedAt }
   ============================================================ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { gxyAccount } from './gxyaccount.js';

const cfg={apiKey:"AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ",authDomain:"gxyhockey.firebaseapp.com",projectId:"gxyhockey",storageBucket:"gxyhockey.firebasestorage.app",messagingSenderId:"474584991663",appId:"1:474584991663:web:b8986544418d6b85fa115a"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);
let db=null; try{ db=getFirestore(app); }catch(e){}

/* ---- games registry (id -> label, emoji, higher-is-better) ---- */
export const GAMES={
  empire:    { label:"Supermarket Wars", emoji:"🛒", coll:"scores_empire",     field:"netWorth" },
  supermarket:{label:"Supermarket (Classic)", emoji:"🛒", coll:"scores_supermarket", field:"netWorth" },
  tvbattles: { label:"TV Battles",       emoji:"📺", coll:"scores_tvbattles",  field:"score" },
  neonsiege: { label:"Neon Siege",       emoji:"🛡️", coll:"scores_neonsiege",  field:"score" },
  hockey:    { label:"GXY Arcade Hockey", emoji:"🏒", coll:"scores_hockey",    field:"score" },
  daily:     { label:"Daily Word",       emoji:"🟩", coll:"scores_daily",      field:"score" },
  techempire:{ label:"Technology Empire", emoji:"💻", coll:"scores_techempire", field:"score" },
  football:  { label:"Football Madness",  emoji:"🏈", coll:"scores_football",  field:"score" }
};

/* ---- XP / levels ---- */
// XP earned per game run: a base for playing + a slice of score + win/streak bonuses.
function xpForRun(gameId, info){
  let xp = 20; // showing up
  const sc = +info.score||0;
  xp += Math.min(120, Math.round(sc/2000)); // capped score contribution
  if(info.won) xp += 40;
  if(info.newBest) xp += 25;
  if(info.dailySolved) xp += 30;
  return xp;
}
// level curve: level N needs 100*N*(N+1)/2 total-ish. Keep it gentle and readable.
export function levelForXp(xp){
  let lvl=1, need=100, acc=0;
  while(xp >= acc+need){ acc+=need; lvl++; need=Math.round(need*1.25); }
  return { level:lvl, into:xp-acc, need, floor:acc };
}

/* ---- badges catalog ---- */
export const BADGES = [
  { id:'first_game',   emoji:'🎮', name:'First Game',        desc:'Play any game once.' },
  { id:'all_games',    emoji:'🎯', name:'Jack of All Games', desc:'Play all five arcade games.' },
  { id:'score_10k',    emoji:'💯', name:'Five Figures',      desc:'Score 10,000+ in any game.' },
  { id:'score_100k',   emoji:'💰', name:'Six Figures',       desc:'Score 100,000+ in any game.' },
  { id:'neon_wave20',  emoji:'🌊', name:'Wave Rider',        desc:'Reach wave 20 in Neon Siege.' },
  { id:'tv_champion',  emoji:'🏆', name:'Ratings King',      desc:'Win a TV Battles season at #1.' },
  { id:'hockey_hat',   emoji:'🎩', name:'Hat Trick',         desc:'Score 3+ goals in a Hockey game.' },
  { id:'empire_mogul', emoji:'🏙️', name:'Retail Mogul',      desc:'Build a $1M+ supermarket empire.' },
  { id:'daily_first',  emoji:'🟩', name:'Word Nerd',         desc:'Solve a Daily Word puzzle.' },
  { id:'streak_3',     emoji:'🔥', name:'On a Roll',         desc:'Reach a 3-day streak.' },
  { id:'streak_7',     emoji:'⚡', name:'Week Warrior',      desc:'Reach a 7-day streak.' },
  { id:'streak_30',    emoji:'🌟', name:'Unstoppable',       desc:'Reach a 30-day streak.' },
  { id:'level_5',      emoji:'⭐', name:'Rising Star',       desc:'Reach level 5.' },
  { id:'level_10',     emoji:'✨', name:'Veteran',           desc:'Reach level 10.' },
  { id:'level_20',     emoji:'👑', name:'Legend',            desc:'Reach level 20.' }
];
export function badgeById(id){ return BADGES.find(b=>b.id===id); }

/* ---- date helpers (local day) ---- */
function today(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function dayDiff(a,b){ // b - a in days
  if(!a) return Infinity;
  const pa=a.split('-').map(Number), pb=b.split('-').map(Number);
  const da=Date.UTC(pa[0],pa[1]-1,pa[2]), dbb=Date.UTC(pb[0],pb[1]-1,pb[2]);
  return Math.round((dbb-da)/86400000);
}

function blankProfile(uid,name){
  return { uid, name:name||'', xp:0, level:1, totalScore:0, plays:0,
    games:{}, badges:[], streak:{count:0,best:0,lastDay:null},
    firstSeen:Date.now(), updatedAt:Date.now() };
}

async function fetchProfile(uid){
  if(db){ try{ const s=await getDoc(doc(db,'players',uid)); if(s.exists()) return s.data(); }catch(e){} }
  return null;
}

/* ---- evaluate which badges a profile should now have ---- */
function evalBadges(p, info){
  const have=new Set(p.badges||[]);
  const add=id=>{ if(!have.has(id)){ have.add(id); p._newBadges.push(id); } };
  const gamesPlayed=Object.keys(p.games||{}).filter(g=>g!=='daily');
  if(p.plays>=1) add('first_game');
  if(['empire','tvbattles','neonsiege','hockey','supermarket'].every(g=>p.games&&p.games[g])) add('all_games');
  // score milestones (any game)
  const bestAny=Math.max(0,...Object.values(p.games||{}).map(g=>g.best||0));
  if(bestAny>=10000) add('score_10k');
  if(bestAny>=100000) add('score_100k');
  // per-game specials from run info
  if(info){
    if(info.game==='neonsiege' && info.wave>=20) add('neon_wave20');
    if(info.game==='tvbattles' && info.won) add('tv_champion');
    if(info.game==='hockey' && info.goals>=3) add('hockey_hat');
    if((info.game==='empire'||info.game==='supermarket') && (info.score>=1000000)) add('empire_mogul');
    if(info.game==='daily' && info.dailySolved) add('daily_first');
  }
  // streaks
  if(p.streak.count>=3) add('streak_3');
  if(p.streak.count>=7) add('streak_7');
  if(p.streak.count>=30) add('streak_30');
  // levels
  if(p.level>=5) add('level_5');
  if(p.level>=10) add('level_10');
  if(p.level>=20) add('level_20');
  p.badges=Array.from(have);
}

export const gxyMeta = {
  db, GAMES, BADGES,
  levelForXp, badgeById,

  /* Record one game run. info: {score, won, newBest, wave, goals, dailySolved, ...} */
  async recordGame(gameId, info){
    info=info||{}; info.game=gameId;
    try{ await gxyAccount.ready(); }catch(e){}
    const u=gxyAccount.user;
    const name=(gxyAccount.data&&gxyAccount.data.mcUsername)||'';
    if(!u||!db) return null; // need sign-in + cloud to persist a profile
    let p = await fetchProfile(u.uid) || blankProfile(u.uid,name);
    p.name = name||p.name;
    p._newBadges=[];
    // per-game stats
    const g = p.games[gameId] || {best:0,plays:0,lastScore:0};
    const sc=+info.score||0;
    g.plays++; g.lastScore=sc;
    const isBest = sc>g.best;
    if(isBest) g.best=sc;
    info.newBest=isBest;
    p.games[gameId]=g;
    // totals
    p.plays=(p.plays||0)+1;
    p.totalScore=(p.totalScore||0)+sc;
    // streak (any play advances the daily streak)
    const t=today();
    const diff=dayDiff(p.streak.lastDay, t);
    if(diff===0){ /* already counted today */ }
    else if(diff===1){ p.streak.count++; p.streak.lastDay=t; }
    else { p.streak.count=1; p.streak.lastDay=t; }
    p.streak.best=Math.max(p.streak.best||0, p.streak.count);
    info.streak=p.streak.count;
    // xp + level
    const gained=xpForRun(gameId, info);
    p.xp=(p.xp||0)+gained;
    p.level=levelForXp(p.xp).level;
    // badges
    evalBadges(p, info);
    p.updatedAt=Date.now();
    const newBadges=p._newBadges; delete p._newBadges;
    try{ await setDoc(doc(db,'players',u.uid), p, {merge:true}); }catch(e){}
    return { profile:p, xpGained:gained, newBadges };
  },

  async getProfile(uid){
    if(!uid){ try{ await gxyAccount.ready(); }catch(e){} uid=gxyAccount.user&&gxyAccount.user.uid; }
    if(!uid) return null;
    return await fetchProfile(uid);
  },

  /* top players by xp (for the homepage / profile hub) */
  async topPlayers(n){
    if(!db) return [];
    try{
      const snap=await getDocs(query(collection(db,'players'),orderBy('xp','desc'),limit(n||10)));
      const rows=[]; snap.forEach(d=>rows.push(d.data())); return rows;
    }catch(e){ return []; }
  },

  /* recent champions: the current #1 of each game board */
  async champions(){
    const out=[];
    if(!db) return out;
    for(const id of Object.keys(GAMES)){
      const G=GAMES[id];
      try{
        const snap=await getDocs(query(collection(db,G.coll),orderBy(G.field,'desc'),limit(1)));
        snap.forEach(d=>{ const v=d.data(); out.push({ game:id, label:G.label, emoji:G.emoji, name:v.name||'—', value:v[G.field]||0 }); });
      }catch(e){}
    }
    return out;
  }
};
