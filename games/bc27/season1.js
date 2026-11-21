/* Brand Clicker '27 — Season 1 "Launch Night" Battle Pass: exclusive brands (ids 200+) with their own scenes, and the Neon Night theme. */
(function(){
const { S, R, props, layer, svg } = window.BC_RM_KIT;
Object.assign(S, {
  200:{ acc:'#ff6b00', f:el => { layer(el, 'linear-gradient(180deg,#000,#0b1026 70%,#1a1a1a 70%)'); // SpaceX: launch pad + rocket plume
      props(el, `<div style="width:2px;height:2px;background:#fff;box-shadow:0 0 3px #fff"></div>`, 40, 'rmPulse', 1, 3);
      layer(el, 'radial-gradient(ellipse 60px 140px at 50% 100%,#fff 0,#ffd27a 25%,#ff6b00 50%,transparent 75%)', 'animation:rmFlick .2s infinite');
      props(el, `<div style="width:30px;height:30px;border-radius:50%;background:#bbb6;filter:blur(6px)"></div>`, 16, 'rmRise', 2, 4, 1, 2.5); } },
  201:{ acc:'#e03c31', f:el => { layer(el, 'radial-gradient(circle at 70% 120%,#1f4fa8 0 140px,#0b3d91 141px 150px,#000 151px)'); // NASA: Earth horizon + orbit
      props(el, `<div style="width:2px;height:2px;background:#fff"></div>`, 60, 'rmPulse', 1, 3);
      layer(el, 'radial-gradient(ellipse 260px 70px at 50% 50%,transparent 66%,#e03c31 67% 69%,transparent 70%)', 'transform:rotate(-18deg)');
      props(el, `<div style="width:26px;height:12px;background:#ddd;border-radius:3px;box-shadow:-16px 0 0 -3px #3b6fd8,16px 0 0 -3px #3b6fd8"></div>`, 2, 'rmDrift', 14, 20, 1, 1.3, 'left'); } },
  202:{ acc:'#ce1141', f:el => { layer(el, 'linear-gradient(135deg,#ce1141,#000 60%)'); // Jordan: elephant print + court
      layer(el, svg(60, 60, `<path d='M5 10 Q20 4 30 14 T55 12 M8 34 Q24 26 36 38 T58 36 M2 52 Q16 46 28 56' stroke='#fff' stroke-width='1.4' fill='none' opacity='.18'/>`));
      props(el, `<div style="width:24px;height:24px;border-radius:50%;background:#e66b1f;border:2px solid #3a1b00"></div>`, 4, 'rmBob', 1, 2, .9, 1.3); } },
  203:{ acc:'#00ff00', f:el => { layer(el, '#050505'); // Razer: RGB keyboard snake
      layer(el, svg(24, 24, `<rect x='2' y='2' width='20' height='20' rx='3' fill='#111' stroke='#00ff0033'/>`));
      for(let i = 0; i < 24; i++){ const b = document.createElement('div'); b.className = 'rmF';
        b.style.cssText = `left:${i * 20}px;top:0;bottom:0;width:20px;background:hsl(${i * 15},100%,50%);opacity:.22;animation:rmPulse 1.6s ${-i * .07}s ease-in-out infinite`; el.appendChild(b); } } },
  204:{ acc:'#ffcb05', f:el => { layer(el, 'linear-gradient(180deg,#78c850 0 55%,#5a9e3a 55%)'); // Pokémon: tall grass + Poké Balls
      layer(el, 'repeating-linear-gradient(90deg,#3f7a28 0 6px,transparent 6px 12px)', 'top:72%;clip-path:polygon(0 30%,4% 0,8% 30%,12% 0,16% 30%,20% 0,24% 30%,28% 0,32% 30%,36% 0,40% 30%,44% 0,48% 30%,52% 0,56% 30%,60% 0,64% 30%,68% 0,72% 30%,76% 0,80% 30%,84% 0,88% 30%,92% 0,96% 30%,100% 0,100% 100%,0 100%)');
      props(el, `<div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(#ee1515 0 46%,#222 46% 54%,#fff 54%);border:2px solid #222;position:relative"><div style="position:absolute;left:8px;top:8px;width:6px;height:6px;border-radius:50%;background:#fff;border:2px solid #222"></div></div>`, 7, 'rmBob', 1.5, 3, .8, 1.3); } }
});
window.BC_SEASON = {
  name:'Season 1 · Launch Night', premium:12000, xpPerTier:500, tiers:30,
  brands:[[200, 'SpaceX', 'spacex'], [201, 'NASA', 'nasa'], [202, 'Jordan', 'jordan'], [203, 'Razer', 'razer'], [204, 'Pokémon', 'pokemon']],
  // tier -> { free, prem }; reward = ['bi', n] | ['eth', n] | ['key', n] | ['brand', id] | ['theme', 'neon']
  track:(() => { const t = {};
    for(let i = 1; i <= 30; i++) t[i] = { free:i % 3 === 0 ? ['eth', 200 * i] : ['bi', 1500 * i], prem:i % 2 ? ['bi', 4000 * i] : ['key', i >= 20 ? 2 : 1] };
    t[5].free = ['brand', 202]; t[10].prem = ['brand', 203]; t[15].free = ['brand', 204]; t[20].prem = ['theme', 'neon']; t[25].prem = ['brand', 201]; t[30].prem = ['brand', 200];
    return t; })()
};
})();
