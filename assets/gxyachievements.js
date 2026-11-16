/* ============================================================
   GXY Achievements — shared, cross-game, cross-device unlocks
   Persists via gxySave (cloud + localStorage mirror).
   window.gxyAch.*  (also an ES module export)
   ============================================================ */
import { gxySave } from './gxysave.js';

const REGISTRY = {
  techempire: [
    {id:'te_first_device', emoji:'📱', name:'Shipped It',        desc:'Launch your first device'},
    {id:'te_hit',          emoji:'🔥', name:'Chart Topper',       desc:'Launch a hit device'},
    {id:'te_millionaire',  emoji:'💰', name:'Millionaire',        desc:'Reach a $1M valuation'},
    {id:'te_billionaire',  emoji:'🏦', name:'Tech Titan',         desc:'Reach a $1B valuation'},
    {id:'te_era5',         emoji:'🧠', name:'Age of Intelligence',desc:'Advance to the final tech era'},
    {id:'te_maxline',      emoji:'⚙️', name:'Bleeding Edge',      desc:'Max out a component line'}
  ],
  football: [
    {id:'fb_win',    emoji:'🏈', name:'Gridiron Win',   desc:'Win a game in Play Now'},
    {id:'fb_champ',  emoji:'🏆', name:'Champions',       desc:'Win a franchise championship'},
    {id:'fb_dynasty',emoji:'👑', name:'Dynasty',         desc:'Win 3 championships'},
    {id:'fb_mvp',    emoji:'⭐', name:'League MVP',       desc:'Win MVP in Player Career'},
    {id:'fb_hof',    emoji:'🎖️', name:'Hall of Fame',    desc:'Retire with 3+ career awards'}
  ],
  hockey: [
    {id:'hk_hat',      emoji:'🎩', name:'Hat Trick',      desc:'Score 3 goals in a shootout'},
    {id:'hk_legend',   emoji:'🌟', name:'Legendary Pull', desc:'Pull a Legend card'},
    {id:'hk_fullline', emoji:'🃏', name:'Full Squad',     desc:'Fill a 5-card Ice Legends lineup'},
    {id:'hk_cup',      emoji:'🏆', name:'Cup Champions',  desc:'Win the Cup in Franchise'},
    {id:'hk_collector',emoji:'🗂️', name:'Collector',      desc:'Own 25 Ice Legends cards'}
  ]
};
// flat lookup id -> {ach, gameId}
const BY_ID={};
Object.keys(REGISTRY).forEach(g=>REGISTRY[g].forEach(a=>{ BY_ID[a.id]={ach:a, gameId:g}; }));

let _set=new Set();
let _loaded=false;
const _cbs=[];

function persist(){ try{ gxySave.save('achievements', {ids:[..._set]}, 'main'); }catch(e){} }

export const gxyAch = {
  async load(){
    try{ const d=await gxySave.load('achievements','main'); if(d && Array.isArray(d.ids)) d.ids.forEach(id=>_set.add(id)); }catch(e){}
    _loaded=true; return [..._set];
  },
  has(id){ return _set.has(id); },
  unlocked(){ return [..._set]; },
  registry(){ return REGISTRY; },
  forGame(gameId){ return (REGISTRY[gameId]||[]).map(a=>Object.assign({unlocked:_set.has(a.id)}, a)); },
  onUnlock(cb){ if(typeof cb==='function') _cbs.push(cb); },
  /* unlock an achievement; returns true if it was newly unlocked */
  unlock(id){
    if(!BY_ID[id] || _set.has(id)) return false;
    _set.add(id); persist();
    const entry=BY_ID[id].ach;
    _cbs.forEach(cb=>{ try{ cb(entry); }catch(e){} });
    // default toast if the host page provides one
    try{ if(window.toast) window.toast('🏅 Achievement: '+entry.name+'!'); }catch(e){}
    return true;
  },
  /* HTML for a viewer grid (unlocked highlighted, locked dimmed) */
  viewerHtml(gameId){
    const list=this.forGame(gameId);
    const done=list.filter(a=>a.unlocked).length;
    let h='<div style="text-align:center;color:var(--dim,#9aa);font-size:.82rem;margin-bottom:.8rem;">'+done+' of '+list.length+' unlocked</div>';
    h+='<div style="display:grid;gap:.55rem;">';
    list.forEach(a=>{
      h+='<div style="display:flex;align-items:center;gap:.7rem;padding:.6rem .7rem;border-radius:11px;border:1px solid '+(a.unlocked?'rgba(245,196,81,.5)':'rgba(255,255,255,.08)')+';background:'+(a.unlocked?'rgba(245,196,81,.08)':'rgba(255,255,255,.02)')+';'+(a.unlocked?'':'opacity:.55;')+'">'+
        '<span style="font-size:1.6rem;filter:'+(a.unlocked?'none':'grayscale(1)')+';">'+(a.unlocked?a.emoji:'🔒')+'</span>'+
        '<div style="text-align:left;flex:1;"><div style="font-weight:800;font-size:.9rem;">'+a.name+'</div>'+
        '<div style="font-size:.75rem;color:var(--dim,#9aa);">'+a.desc+'</div></div>'+
        (a.unlocked?'<span style="color:var(--gold,#f5c451);font-weight:800;font-size:.7rem;">✓</span>':'')+'</div>';
    });
    h+='</div>';
    return h;
  }
};
window.gxyAch=gxyAch;
// pull cloud unlocks once account is ready
gxySave.ready().then(()=>gxyAch.load());
