/* Reports what happens in the older arcade games to GXY (achievements + weekly challenges) without editing them:
   each game's own functions are wrapped after the page loads. Load after assets/gxy.js. */
(function(){
  if(!window.GXY) return;
  const page = (location.pathname.match(/games\/([\w-]+)\.html/) || [])[1];
  const wrap = (name, after) => {
    const f = window[name]; if(typeof f !== 'function' || f._gxy) return false;
    const w = function(){ const r = f.apply(this, arguments); try{ after.apply(this, arguments); }catch(e){} return r; };
    w._gxy = true; window[name] = w; return true;
  };
  // games keep their state in a top-level `let G`, which isn't on window; an indirect eval can still see it
  const G = () => { try{ return (0, eval)('typeof G !== "undefined" ? G : {}') || {}; }catch(e){ return {}; } };
  const HOOKS = {
    'gxy-hockey': () => wrap('score', () => { GXY.event('gxy-hockey', 'goal'); GXY.event('gxy-hockey', 'streak', G().streak || 0); }),
    'neon-siege': () => wrap('waveComplete', () => GXY.event('neon-siege', 'wave', G().wave || 0)),
    'gxy-daily': () => wrap('finish', won => { if(won){ GXY.event('gxy-daily', 'solve'); if((G().guesses || []).length <= 2) GXY.event('gxy-daily', 'fast'); } }),
    'gxy-football': () => wrap('pnTouchdown', () => GXY.event('gxy-football', 'td')),
    'gxy-tech-empire': () => { wrap('advanceQuarter', () => GXY.event('gxy-tech-empire', 'quarters')); wrap('advanceCareerQuarter', () => GXY.event('gxy-tech-empire', 'quarters')); },
    'tv-battles': () => wrap('advanceWeek', () => GXY.event('tv-battles', 'weeks')),
    'supermarket-wars': () => wrap('smwRunWeek', () => GXY.event('supermarket-wars', 'weeks')),
  };
  const run = () => HOOKS[page] && HOOKS[page]();
  if(document.readyState === 'complete') setTimeout(run, 300); else addEventListener('load', () => setTimeout(run, 300));
})();
