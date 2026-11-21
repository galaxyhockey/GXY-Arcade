/* Brand Clicker '27 v0.3 content: Season 2 pass, weekly event boxes, more 3D editions, and their scenes. */
(function(){
const { S, R, props, layer, svg, bubble } = window.BC_RM_KIT, D = window.BC_D3;
// ---------- scenes: Season 2 exclusives (210-214) ----------
Object.assign(S, {
  210:{ acc:'#e60012', f:el => { layer(el, 'linear-gradient(90deg,#00c3e3 0 50%,#ff4554 50%)'); // Nintendo Switch: Joy-Con split + console dock
      layer(el, 'linear-gradient(90deg,transparent 30%,#222 30% 70%,transparent 70%)', 'top:20%;bottom:20%;border-radius:20px;opacity:.85');
      props(el, i => `<div style="width:14px;height:14px;border-radius:50%;background:#333;border:3px solid ${i % 2 ? '#ff4554' : '#00c3e3'}"></div>`, 10, 'rmBob', 1.5, 3); } },
  211:{ acc:'#541bae', f:el => { layer(el, 'radial-gradient(circle at 50% 50%,#2a0e5a,#05010d 70%)'); // Alienware: alien head lighting + scanlines
      layer(el, 'repeating-linear-gradient(0deg,#00e5ff12 0 2px,transparent 2px 6px)');
      props(el, `<div style="width:30px;height:40px;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;border:2px solid #00e5ff;box-shadow:0 0 12px #00e5ff"></div>`, 6, 'rmPulse', 1.5, 3, .8, 1.3); } },
  212:{ acc:'#cf0a2c', f:el => { layer(el, 'linear-gradient(180deg,#d9d9d9,#a8a8a8)'); // New Balance: grey suede + running track lines
      layer(el, 'repeating-linear-gradient(115deg,#cf0a2c 0 6px,transparent 6px 46px)', 'opacity:.35');
      props(el, `<div style="width:70px;height:3px;background:linear-gradient(90deg,transparent,#cf0a2c)"></div>`, 12, 'rmDrift', 1, 2, .8, 1.4, 'left'); } },
  213:{ acc:'#ffe600', f:el => { layer(el, '#0b0b0b'); // Corsair: sails + RGB fans
      props(el, i => `<div style="width:60px;height:60px;border-radius:50%;border:5px solid hsl(${i * 70},100%,55%);box-shadow:0 0 14px hsl(${i * 70},100%,55%);background:repeating-conic-gradient(#222 0 30deg,#444 30deg 60deg);animation:rmSpin 1s linear infinite"></div>`, 5, 'rmBob', 3, 5, .7, 1.2); } },
  214:{ acc:'#ff0000', f:el => { layer(el, 'linear-gradient(135deg,#140000,#000)'); // MSI: dragon-red circuit
      layer(el, svg(70, 70, `<path d='M0 35h20l10-10h20l10 10h10M35 0v15M35 55v15' stroke='#ff0000' stroke-width='1.3' fill='none' opacity='.45'/>`));
      layer(el, 'radial-gradient(ellipse at 50% 120%,#ff000066,transparent 60%)'); } },
  // ---------- event-only brands (220-227) ----------
  220:{ acc:'#fccc12', f:el => { layer(el, 'linear-gradient(180deg,#1a1a2e,#0f3460)'); // NBC: peacock feather fan
      layer(el, 'repeating-conic-gradient(from 270deg at 50% 100%,#fccc12 0 15deg,#ff9100 15deg 30deg,#e1251b 30deg 45deg,#6460aa 45deg 60deg,#0089d0 60deg 75deg,#0db14b 75deg 90deg)', 'opacity:.35'); } },
  221:{ acc:'#ffd400', f:el => { layer(el, 'linear-gradient(180deg,#00205b,#000)'); // FOX: searchlights
      layer(el, 'conic-gradient(from 160deg at 30% 100%,transparent 0 10deg,#ffffff33 10deg 16deg,transparent 16deg),conic-gradient(from 185deg at 70% 100%,transparent 0 10deg,#ffffff33 10deg 16deg,transparent 16deg)', 'animation:rmBob 4s ease-in-out infinite'); } },
  222:{ acc:'#004db4', f:el => { layer(el, 'linear-gradient(180deg,#87ceeb,#e8d9a8)'); // Warner Bros: shield on a studio backlot
      layer(el, 'linear-gradient(90deg,#c8a96b 0 0)', 'top:70%');
      props(el, `<div style="width:60px;height:40px;background:#004db4;border:3px solid #ffd700;border-radius:4px 4px 30px 30px"></div>`, 4, 'rmBob', 3, 5, .7, 1.2); } },
  223:{ acc:'#8a2be2', f:el => { layer(el, '#000'); // HBO: static + premium purple
      layer(el, 'repeating-radial-gradient(circle at 30% 40%,#ffffff10 0 1px,transparent 1px 3px)', 'animation:rmFlick .15s infinite');
      layer(el, 'radial-gradient(circle at 50% 50%,#8a2be255,transparent 60%)'); } },
  224:{ acc:'#f47521', f:el => { layer(el, 'linear-gradient(180deg,#ffb38a,#f47521 50%,#7a2e0e)'); // Crunchyroll: anime sunset + cherry blossoms
      layer(el, 'radial-gradient(circle at 50% 60%,#fff3 0 70px,transparent 71px)');
      props(el, `<div style="width:12px;height:10px;border-radius:60% 0;background:#ffc0cb"></div>`, 30, 'rmFall', 4, 8, .7, 1.4); } },
  225:{ acc:'#00a3ff', f:el => { layer(el, 'linear-gradient(135deg,#000,#0a1a2a)'); // ASUS ROG: angular slashes
      layer(el, 'linear-gradient(120deg,transparent 40%,#00a3ff55 40% 42%,transparent 42% 60%,#ff004455 60% 62%,transparent 62%)');
      props(el, `<div style="width:80px;height:2px;background:#00a3ff;transform:rotate(-30deg);box-shadow:0 0 8px #00a3ff"></div>`, 8, 'rmDrift', 1, 2, .8, 1.3, 'left'); } },
  226:{ acc:'#e4002b', f:el => { layer(el, 'linear-gradient(180deg,#ffffff,#e6e6e6)'); // FILA: tennis court
      layer(el, 'linear-gradient(90deg,transparent 49.6%,#002d62 49.6% 50.4%,transparent 50.4%),linear-gradient(180deg,transparent 20%,#002d62 20% 21%,transparent 21% 79%,#e4002b 79% 80%,transparent 80%)', 'opacity:.6');
      props(el, `<div style="width:16px;height:16px;border-radius:50%;background:#d6f442;border:1px solid #9bb52a"></div>`, 3, 'rmDrift', 1, 2, 1, 1.2, 'left'); } },
  227:{ acc:'#026cdf', f:el => { layer(el, 'linear-gradient(180deg,#000,#0c1d3a)'); // Ticketmaster: concert crowd + stage lights
      layer(el, 'conic-gradient(from 160deg at 50% 0%,transparent 0 6deg,#026cdf55 6deg 12deg,transparent 12deg 24deg,#ff2d9555 24deg 30deg,transparent 30deg)');
      props(el, `<div style="width:10px;height:22px;border-radius:5px 5px 0 0;background:#111;box-shadow:0 0 0 2px #026cdf33"></div>`, 30, 'rmBob', .6, 1.4, .8, 1.3);
      props(el, `<div style="width:4px;height:4px;border-radius:50%;background:#fff;box-shadow:0 0 8px #fff"></div>`, 20, 'rmPulse', .5, 1.5); } },
  // ---------- more 3D editions (110-114) ----------
  110:{ acc:'#1db954', f:el => { const d = D.root(el, '#000'); D.tunnel(d, ['#1db954', '#1ed760'], 'circle', 20, 3); } },                                  // Spotify 3D: soundwave tunnel
  111:{ acc:'#ffc72c', f:el => { const d = D.root(el, 'radial-gradient(circle,#da291c,#5a0a05 70%)'); D.cubes(d, '#ffc72c33', '#ffc72c', 8, 'M'); } }, // McDonald's 3D: golden M cubes
  112:{ acc:'#ffffff', f:el => { const d = D.root(el, 'radial-gradient(circle,#e2001a,#300004 70%)'); D.warp(d, '#ffffff', 80); D.orbits(d, ['#ffffff'], '#e2001a'); } }, // Coca-Cola 3D: fizz warp
  113:{ acc:'#ff6a00', f:el => { const d = D.root(el, '#000'); D.floor(d, '#ff6a00', 'linear-gradient(#000,#331400)', '#ffffff'); } },                     // Nike 3D: night track
  114:{ acc:'#4285f4', f:el => { const d = D.root(el, '#fff'); D.orbits(d, ['#4285f4', '#ea4335', '#fbbc05', '#34a853'], '#ffffff'); } }           // Google 3D: four-colour orbit
});
window.BC_3D.push([110, 21, 'Spotify'], [111, 22, "McDonald's"], [112, 43, 'Coca-Cola'], [113, 55, 'Nike'], [114, 47, 'Google']);
// ---------- Season 2 ----------
window.BC_SEASON2 = {
  key:'s2', name:'Season 2 · Frostbite', premium:20000, xpPerTier:600, tiers:30,
  brands:[[210, 'Nintendo Switch', 'nintendoswitch'], [211, 'Alienware', 'alienware'], [212, 'New Balance', 'newbalance'], [213, 'Corsair', 'corsair'], [214, 'MSI', 'msi']],
  track:(() => { const t = {};
    for(let i = 1; i <= 30; i++) t[i] = { free:i % 3 === 0 ? ['eth', 300 * i] : ['bi', 2500 * i], prem:i % 2 ? ['bi', 6000 * i] : ['key', i >= 20 ? 3 : 1] };
    t[5].free = ['brand', 212]; t[10].prem = ['brand', 213]; t[15].free = ['brand', 214]; t[20].prem = ['theme', 'ice']; t[25].prem = ['brand', 211]; t[30].prem = ['brand', 210];
    return t; })()
};
// ---------- weekly events: one per week, rotating ----------
window.BC_EVENTS = [
  { k:'tv', name:'TV Night Week', emoji:'📺', bg:'linear-gradient(135deg,#6460aa,#0089d0)', brands:[[220, 'NBC', 'nbc'], [221, 'FOX', 'fox']], extra:[16, 18, 50] },
  { k:'movie', name:'Movie Week', emoji:'🎬', bg:'linear-gradient(135deg,#8a2be2,#004db4)', brands:[[222, 'Warner Bros.', 'warnerbros'], [223, 'HBO', 'hbo']], extra:[16, 17, 19] },
  { k:'anime', name:'Anime & Gaming Week', emoji:'🍥', bg:'linear-gradient(135deg,#f47521,#00a3ff)', brands:[[224, 'Crunchyroll', 'crunchyroll'], [225, 'ASUS', 'asus']], extra:[23, 63, 66] },
  { k:'sport', name:'Game Day Week', emoji:'🏟️', bg:'linear-gradient(135deg,#026cdf,#e4002b)', brands:[[226, 'FILA', 'fila'], [227, 'Ticketmaster', 'ticketmaster']], extra:[55, 59, 60] }
];
})();
