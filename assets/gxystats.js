/* GXY Stats — shared reader for the mod's stats.json (schema from jacobsmultitool).
   stats.json shape:
     { schemaVersion, server, generatedAt,
       players:[ { uuid, name, scores:{ objective:int } } ],
       global:[ { holder, objective, value, present } ] }
   Usage (module):
     import { loadStats } from '[root]assets/gxystats.js';
     const s = await loadStats('[root]');    // {meta, stats, players, leaderboard(obj), playerByName(name)}
*/
export async function loadStats(root){
  root = root || '';
  const bust = '?_=' + Date.now();
  let stats = null, meta = null;
  try { stats = await (await fetch(root+'data/stats.json'+bust)).json(); } catch(e){ stats = null; }
  try { meta  = await (await fetch(root+'data/stats-meta.json'+bust)).json(); } catch(e){ meta = null; }

  const players = (stats && stats.players) || [];

  function playerByName(name){
    if(!name) return null;
    const l = String(name).toLowerCase();
    return players.find(p => String(p.name||'').toLowerCase() === l) || null;
  }

  // ranked leaderboard for one objective
  function leaderboard(objective, lowerBetter){
    const rows = players
      .filter(p => p.scores && p.scores[objective] !== undefined)
      .map(p => ({ name:p.name, value:p.scores[objective] }));
    rows.sort((a,b)=> lowerBetter ? a.value-b.value : b.value-a.value);
    return rows;
  }

  // player's rank (1-based) for an objective, or null
  function rankOf(name, objective, lowerBetter){
    const lb = leaderboard(objective, lowerBetter);
    const i = lb.findIndex(r => String(r.name).toLowerCase() === String(name).toLowerCase());
    return i<0 ? null : i+1;
  }

  return { raw:stats, meta, players, playerByName, leaderboard, rankOf,
           updated: stats && stats.generatedAt, server: stats && stats.server };
}
