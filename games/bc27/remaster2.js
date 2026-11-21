/* Brand Clicker '27 v0.2 — remastered scenes for the 42 new brands (ids 40-81), one theme per brand. */
(function(){
const { svg, R, props, layer, bubble, S } = window.BC_RM_KIT;
const bolt = c => `<svg width="30" height="50" viewBox="0 0 30 50"><path d="M18 0L2 28h11L8 50 28 18H16z" fill="${c}"/></svg>`;
const road = (el, line = '#ffd400') => { layer(el, `linear-gradient(180deg,transparent 70%,#2b2b2b 70%)`);
  layer(el, `repeating-linear-gradient(90deg,${line} 0 40px,transparent 40px 80px) 0 300px/100% 5px no-repeat`, 'animation:rmPan .6s linear infinite'); };
const car = (c) => `<svg width="70" height="28" viewBox="0 0 70 28"><path d="M4 20 L10 10 L24 6 L44 6 L58 12 L66 14 L66 22 L4 22z" fill="${c}"/><circle cx="18" cy="22" r="6" fill="#111"/><circle cx="52" cy="22" r="6" fill="#111"/><path d="M26 8 L42 8 L50 13 L22 13z" fill="#9fd3ff"/></svg>`;
const ball = (c, seam) => `<div style="width:26px;height:26px;border-radius:50%;background:${c};border:2px solid ${seam}"></div>`;
const coin = c => `<div style="width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6,${c});border:2px solid #0003"></div>`;
Object.assign(S, {
  40:{ acc:'#e4202e', f:el => { layer(el, 'linear-gradient(180deg,#000,#1a0505)'); // Atari: vector arcade grid + pong
      layer(el, 'linear-gradient(#e4202e55 1px,transparent 1px) 0 0/100% 20px,linear-gradient(90deg,#e4202e55 1px,transparent 1px) 0 0/20px 100%', 'transform:perspective(200px) rotateX(55deg);transform-origin:bottom;top:50%');
      props(el, `<div style="width:8px;height:8px;background:#fff"></div>`, 3, 'rmDrift', 2, 3, 1, 1, 'left');
      props(el, `<div style="width:6px;height:40px;background:#fff"></div>`, 2, 'rmBob', 1, 2, 1, 1); } },
  41:{ acc:'#5c8cff', f:el => { layer(el, '#4040e0'); // Commodore 64: blue boot screen
      layer(el, 'linear-gradient(#8c8cff 0 0) 0 0/100% 26px no-repeat,linear-gradient(#8c8cff 0 0) 0 100%/100% 26px no-repeat,linear-gradient(90deg,#8c8cff 26px,transparent 26px calc(100% - 26px),#8c8cff 0)');
      layer(el, svg(240, 20, `<text x='6' y='15' font-family='monospace' font-size='12' fill='#a5a5ff' opacity='.7'>READY. 10 PRINT "BRAND"</text>`), 'margin:40px'); } },
  42:{ acc:'#0089cf', f:el => { layer(el, 'linear-gradient(180deg,#00a2e8,#0060a8)'); // SEGA: speed loops + rings
      layer(el, 'radial-gradient(circle at 50% 120%,transparent 120px,#3a8a2a 120px 150px,#6b4a24 150px)');
      props(el, `<div style="width:20px;height:20px;border-radius:50%;border:4px solid #ffd700;box-shadow:0 0 6px #ffd700"></div>`, 14, 'rmBob', 1.5, 3, .7, 1.2); } },
  43:{ acc:'#d00013', f:el => { layer(el, 'linear-gradient(180deg,#e2001a,#8a000c)'); // Coca-Cola: dynamic ribbon + fizz
      layer(el, svg(480, 120, `<path d='M0 80 C120 20 240 120 480 50' stroke='#fff' stroke-width='14' fill='none' opacity='.85'/>`) + ' 0 200px/100% 120px no-repeat');
      props(el, () => bubble('#fff', R(.3, .7)), 30, 'rmRise', 3, 7, .4, 1.1); } },
  44:{ acc:'#f2a900', f:el => { layer(el, 'linear-gradient(135deg,#2a2f3a,#0e1014)'); // Walkman: cassette tape reels
      props(el, `<div style="width:90px;height:56px;border-radius:6px;background:#1c1c1c;border:2px solid #444;position:relative"><div style="position:absolute;left:14px;top:16px;width:20px;height:20px;border-radius:50%;border:4px dotted #f2a900;animation:rmSpin 2s linear infinite"></div><div style="position:absolute;right:14px;top:16px;width:20px;height:20px;border-radius:50%;border:4px dotted #f2a900;animation:rmSpin 2s linear infinite"></div></div>`, 4, 'rmBob', 3, 5, .8, 1.2);
      props(el, `<div style="color:#f2a900;font-size:18px;opacity:.6">♪</div>`, 14, 'rmRise', 5, 9, .7, 1.4); } },
  45:{ acc:'#a77bca', f:el => { layer(el, 'linear-gradient(160deg,#38096c,#13002a)'); // Taco Bell: purple bell + tacos
      layer(el, 'radial-gradient(ellipse at 50% 120%,#ff3ea566,transparent 60%)');
      props(el, `<svg width="40" height="24" viewBox="0 0 40 24"><path d="M2 22 Q20 -12 38 22z" fill="#f7c948"/><path d="M6 20 Q20 2 34 20" stroke="#4caf50" stroke-width="4" fill="none"/></svg>`, 10, 'rmFall', 4, 8, .7, 1.3); } },
  46:{ acc:'#f40027', f:el => { layer(el, 'repeating-linear-gradient(90deg,#f40027 0 40px,#fff 40px 80px)'); // KFC: bucket stripes + drumsticks
      layer(el, 'linear-gradient(transparent 55%,#0006)');
      props(el, `<svg width="34" height="24" viewBox="0 0 34 24"><ellipse cx="14" cy="12" rx="13" ry="10" fill="#c8741c"/><rect x="24" y="9" width="9" height="5" rx="2" fill="#f5e6c8"/></svg>`, 9, 'rmBob', 2, 4, .8, 1.3); } },
  47:{ acc:'#4285f4', f:el => { layer(el, '#fff'); // Google: four-colour dots
      props(el, i => `<div style="width:22px;height:22px;border-radius:50%;background:${['#4285f4','#ea4335','#fbbc05','#34a853'][i % 4]}"></div>`, 24, 'rmBob', 1.5, 3, .6, 1.4);
      layer(el, 'linear-gradient(transparent 85%,#f1f3f4)'); } },
  48:{ acc:'#1428a0', f:el => { layer(el, 'radial-gradient(ellipse at 50% 50%,#2a46d8,#0a1450)'); // Samsung: foldable glow panels
      layer(el, 'linear-gradient(90deg,transparent 47%,#ffffff22 47% 53%,transparent 53%)');
      props(el, `<div style="width:44px;height:84px;border-radius:8px;border:2px solid #9fb4ff;background:linear-gradient(160deg,#6a8bff55,#0000)"></div>`, 6, 'rmBob', 3, 5, .7, 1.2); } },
  49:{ acc:'#e82127', f:el => { layer(el, 'linear-gradient(180deg,#0b0b0f,#23232b)'); // Tesla: charging lightning + starfield
      props(el, `<div style="width:2px;height:2px;background:#fff;box-shadow:0 0 4px #fff"></div>`, 50, 'rmPulse', 1, 3);
      props(el, bolt('#e82127'), 5, 'rmPulse', 1, 2, .8, 1.3); road(el, '#e82127'); } },
  50:{ acc:'#ff0000', f:el => { layer(el, 'linear-gradient(180deg,#181818,#0f0f0f)'); // YouTube: video grid + play buttons
      layer(el, svg(96, 64, `<rect x='4' y='4' width='88' height='50' rx='6' fill='#272727'/><rect x='4' y='56' width='60' height='4' rx='2' fill='#3a3a3a'/>`));
      props(el, `<div style="width:40px;height:28px;border-radius:8px;background:#f00;display:flex;align-items:center;justify-content:center"><div style="border-left:12px solid #fff;border-top:7px solid transparent;border-bottom:7px solid transparent"></div></div>`, 6, 'rmBob', 2, 4, .8, 1.3);
      layer(el, 'linear-gradient(90deg,#f00 0 55%,#555 55%) 0 100%/100% 4px no-repeat'); } },
  51:{ acc:'#fe2c55', f:el => { layer(el, '#000'); // TikTok: cyan/red glitch notes
      props(el, i => `<div style="color:${i % 2 ? '#25f4ee' : '#fe2c55'};font-size:28px;font-weight:900;text-shadow:${i % 2 ? '-2px 0 #fe2c55' : '2px 0 #25f4ee'}">♪</div>`, 18, 'rmRise', 4, 8, .7, 1.5);
      layer(el, 'repeating-linear-gradient(180deg,#ffffff06 0 2px,transparent 2px 4px)'); } },
  52:{ acc:'#000', f:el => { layer(el, '#fffc00'); // Snapchat: ghosts + map dots
      props(el, `<svg width="30" height="32" viewBox="0 0 30 32"><path d="M15 2C8 2 6 8 6 12v4l-4 2 4 2-3 5 6-1 6 4 6-4 6 1-3-5 4-2-4-2v-4c0-4-2-10-9-10z" fill="#fff" stroke="#000" stroke-width="1.6"/></svg>`, 10, 'rmBob', 2, 4, .8, 1.4);
      layer(el, 'radial-gradient(#0002 2px,transparent 3px) 0 0/26px 26px'); } },
  53:{ acc:'#ff0069', f:el => { layer(el, 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)'); // Instagram: gradient + polaroids
      props(el, i => `<div style="width:48px;height:56px;background:#fff;padding:4px 4px 12px;transform:rotate(${R(-15, 15)}deg);box-shadow:0 4px 10px #0004"><div style="width:100%;height:100%;background:linear-gradient(${R(0, 360)}deg,#feda75,#d62976,#4f5bd5)"></div></div>`, 7, 'rmBob', 3, 5, .7, 1.1);
      props(el, `<div style="color:#fff;font-size:18px">♥</div>`, 12, 'rmRise', 3, 6, .7, 1.5); } },
  54:{ acc:'#1d9bf0', f:el => { layer(el, '#000'); // X: post timeline
      layer(el, svg(480, 70, `<circle cx='60' cy='24' r='14' fill='#333'/><rect x='84' y='14' width='160' height='8' rx='4' fill='#2f3336'/><rect x='84' y='30' width='260' height='8' rx='4' fill='#202327'/><line x1='0' y1='68' x2='480' y2='68' stroke='#2f3336'/>`), 'animation:rmPan 0s;background-size:100% 70px;animation:none');
      props(el, `<div style="color:#fff;font:900 30px sans-serif;opacity:.15">𝕏</div>`, 10, 'rmRise', 6, 12, .8, 2); } },
  55:{ acc:'#ff6a00', f:el => { layer(el, 'linear-gradient(160deg,#111,#2a2a2a)'); // Nike: swoosh trails + court
      layer(el, svg(160, 60, `<path d='M6 44 Q40 70 150 8 Q60 52 20 30z' fill='#fff' opacity='.06'/>`));
      props(el, `<div style="width:90px;height:3px;background:linear-gradient(90deg,transparent,#ff6a00)"></div>`, 14, 'rmDrift', .8, 1.6, .7, 1.4, 'left'); } },
  56:{ acc:'#fff', f:el => { layer(el, 'linear-gradient(180deg,#0a0a0a,#1c1c1c)'); // adidas: three stripes
      layer(el, 'linear-gradient(120deg,transparent 30%,#fff 30% 34%,transparent 34% 40%,#fff 40% 44%,transparent 44% 50%,#fff 50% 54%,transparent 54%)', 'opacity:.18');
      props(el, ball('#fff', '#111'), 4, 'rmBob', 2, 3.5, .9, 1.3); } },
  57:{ acc:'#ba2b2b', f:el => { layer(el, 'linear-gradient(180deg,#0e1a12,#1d3b25)'); // PUMA: running track
      layer(el, 'repeating-linear-gradient(180deg,#b33a2a 0 34px,#fff 34px 36px)', 'top:55%');
      props(el, `<div style="color:#fff;font-size:22px;opacity:.35">🐆</div>`, 3, 'rmDrift', 3, 5, 1, 1.6, 'left'); } },
  58:{ acc:'#e31b23', f:el => { layer(el, 'linear-gradient(160deg,#1d1d1d,#000)'); // Under Armour: compression weave
      layer(el, svg(24, 24, `<path d='M0 12 L12 0 L24 12 L12 24z' fill='none' stroke='#3a3a3a' stroke-width='2'/>`));
      layer(el, 'radial-gradient(circle at 50% 50%,#e31b2333,transparent 60%)'); } },
  59:{ acc:'#c9082a', f:el => { layer(el, 'linear-gradient(180deg,#c68642,#8f5a28)'); // NBA: hardwood + basketballs
      layer(el, 'repeating-linear-gradient(90deg,#00000014 0 2px,transparent 2px 40px)');
      layer(el, 'radial-gradient(circle at 50% 50%,transparent 70px,#fff 70px 73px,transparent 73px),linear-gradient(90deg,transparent 49.6%,#fff 49.6% 50.4%,transparent 50.4%)');
      props(el, ball('#e66b1f', '#3a1b00'), 6, 'rmBob', 1.2, 2.4, .9, 1.3); } },
  60:{ acc:'#d50032', f:el => { layer(el, 'linear-gradient(180deg,#0b3d91 0 30%,#2e7d32 30%)'); // MLB: diamond + baseballs
      layer(el, 'linear-gradient(45deg,transparent 40%,#c8a26a 40% 60%,transparent 60%)', 'clip-path:polygon(50% 40%,75% 70%,50% 100%,25% 70%)');
      props(el, ball('#fff', '#d50032'), 6, 'rmDrift', 2, 4, .7, 1.2, 'left'); } },
  61:{ acc:'#000', f:el => { layer(el, 'linear-gradient(180deg,#eef6ff,#cfe3f5)'); // NHL: league rink + pucks
      layer(el, 'linear-gradient(90deg,transparent 49.6%,#c8102e 49.6% 50.4%,transparent 50.4%),linear-gradient(90deg,transparent 30%,#00338d 30% 31%,transparent 31% 69%,#00338d 69% 70%,transparent 70%)');
      props(el, `<div style="width:24px;height:10px;border-radius:50%;background:#111"></div>`, 6, 'rmDrift', 1.5, 3, 1, 1.4, 'left'); } },
  62:{ acc:'#ffcc00', f:el => { layer(el, 'linear-gradient(180deg,#0b1b4d,#1c3f9e 60%,#f0c000)'); // Red Bull: sunset + bulls/wings
      layer(el, 'radial-gradient(circle at 50% 65%,#ffcc00 0 46px,transparent 47px)');
      props(el, `<div style="color:#fff;font-size:22px;opacity:.6">🪽</div>`, 8, 'rmRise', 5, 9, .7, 1.3); } },
  63:{ acc:'#e2231a', f:el => { layer(el, 'linear-gradient(180deg,#5aa7ff,#9fd0ff 60%,#3a9a3a 60%)'); // Roblox: baseplate + bricks
      layer(el, svg(32, 32, `<rect width='32' height='32' fill='none' stroke='#2b7a2b' stroke-width='2'/><circle cx='16' cy='16' r='5' fill='#4caf50'/>`), 'top:60%');
      props(el, i => `<div style="width:26px;height:26px;background:${['#e2231a','#0b6ed6','#f9c80e','#7bc043'][i % 4]};border:2px solid #0003;transform:rotate(${R(-20, 20)}deg)"></div>`, 10, 'rmFall', 5, 9, .7, 1.2); } },
  64:{ acc:'#fff', f:el => { layer(el, 'radial-gradient(circle at 50% 40%,#3a3a3a,#121212)'); // Epic Games: storm + battle bus
      layer(el, 'radial-gradient(circle at 50% 50%,transparent 150px,#7b2ff7aa 152px,#3b0a7a 180px)');
      props(el, `<div style="width:56px;height:24px;border-radius:6px;background:#2f8fff;border:2px solid #fff;position:relative"><div style="position:absolute;top:-14px;left:16px;width:24px;height:14px;background:#1e5fb3;border-radius:4px 4px 0 0"></div></div>`, 2, 'rmDrift', 8, 12, 1, 1.3, 'left'); } },
  65:{ acc:'#66c0f4', f:el => { layer(el, 'linear-gradient(180deg,#1b2838,#171a21)'); // Steam: library shelf + sale tags
      layer(el, svg(60, 80, `<rect x='6' y='6' width='48' height='68' rx='3' fill='#2a475e'/><rect x='6' y='6' width='48' height='40' fill='#66c0f422'/>`));
      props(el, `<div style="background:#4c6b22;color:#beee11;font:800 13px sans-serif;padding:3px 6px;border-radius:3px">-${['75','50','90','33'][Math.floor(R(0, 4))]}%</div>`, 8, 'rmBob', 2, 4, .8, 1.2); } },
  66:{ acc:'#9146ff', f:el => { layer(el, 'linear-gradient(160deg,#18181b,#26153f)'); // Twitch: chat stream + emotes
      layer(el, 'linear-gradient(90deg,transparent 72%,#0e0e10 72%)');
      props(el, i => `<div style="font:600 11px sans-serif;color:${['#ff6b6b','#9146ff','#00e0a0','#ffb800'][i % 4]}">${['GG','PogChamp','W','LUL','Clip it!'][i % 5]}</div>`, 18, 'rmRise', 4, 8, .9, 1.3);
      layer(el, 'radial-gradient(circle at 8% 8%,#eb0400 0 6px,transparent 7px)'); } },
  67:{ acc:'#5865f2', f:el => { layer(el, 'linear-gradient(180deg,#404eed,#23272a)'); // Discord: server bubbles + clouds
      layer(el, svg(60, 60, `<circle cx='30' cy='30' r='22' fill='#36393f'/>`) + ' 0 0/60px 60px repeat-y');
      props(el, `<div style="width:40px;height:30px;border-radius:14px;background:#fff8;position:relative"></div>`, 6, 'rmDrift', 10, 16, .8, 1.4, 'left');
      props(el, `<div style="width:10px;height:10px;border-radius:50%;background:#3ba55c;box-shadow:0 0 6px #3ba55c"></div>`, 12, 'rmPulse', 1, 2.5); } },
  68:{ acc:'#2d6ccf', f:el => { layer(el, 'linear-gradient(180deg,#7aa7d9,#d7e6f5 60%)'); road(el); // Ford: highway + pickups
      props(el, car('#00274e'), 4, 'rmDrift', 2.5, 4, .9, 1.3, 'left'); } },
  69:{ acc:'#cd9834', f:el => { layer(el, 'linear-gradient(180deg,#1b1b1b,#3a2f1a)'); // Chevrolet: gold bowtie pattern
      layer(el, svg(60, 30, `<path d='M2 10h20l4-6h8l4 6h20v10H38l-4 6h-8l-4-6H2z' fill='#cd9834' opacity='.22'/>`)); road(el, '#cd9834');
      props(el, car('#cd9834'), 3, 'rmDrift', 2, 3.5, .9, 1.2, 'left'); } },
  70:{ acc:'#eb0a1e', f:el => { layer(el, 'linear-gradient(180deg,#f4f4f4,#cfcfcf)'); // Toyota: rings + rally road
      layer(el, 'radial-gradient(ellipse 140px 90px at 50% 45%,transparent 80px,#eb0a1e22 80px 86px,transparent 86px)'); road(el, '#eb0a1e');
      props(el, car('#eb0a1e'), 3, 'rmDrift', 2.5, 4, .9, 1.3, 'left'); } },
  71:{ acc:'#bb0a30', f:el => { layer(el, 'linear-gradient(180deg,#0d0d0d,#2b2b2b)'); // Audi: four chrome rings
      layer(el, 'radial-gradient(circle at 26% 30%,transparent 34px,#c0c0c0 34px 38px,transparent 38px),radial-gradient(circle at 42% 30%,transparent 34px,#c0c0c0 34px 38px,transparent 38px),radial-gradient(circle at 58% 30%,transparent 34px,#c0c0c0 34px 38px,transparent 38px),radial-gradient(circle at 74% 30%,transparent 34px,#c0c0c0 34px 38px,transparent 38px)', 'opacity:.25');
      road(el, '#bb0a30'); props(el, car('#c0c0c0'), 3, 'rmDrift', 1.5, 2.5, .9, 1.3, 'left'); } },
  72:{ acc:'#00adef', f:el => { layer(el, 'radial-gradient(circle at 50% 40%,#3a3a3a,#0c0c0c)'); // Mercedes: silver star field
      props(el, `<svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke="#c0c0c0" stroke-width="2"/><path d="M15 2 L17 15 L15 15 L13 15z M15 15 L26 22 L25 24 z M15 15 L4 22 L5 24z" fill="#c0c0c0"/></svg>`, 10, 'rmBob', 3, 5, .6, 1.2); road(el, '#c0c0c0'); } },
  73:{ acc:'#b12b28', f:el => { layer(el, 'linear-gradient(180deg,#f2b134,#c0392b 70%)'); // Porsche: Stuttgart crest stripes + racetrack
      layer(el, 'repeating-linear-gradient(0deg,#000a 0 14px,#b12b28aa 14px 28px)', 'clip-path:polygon(0 0,30% 0,30% 100%,0 100%)');
      road(el, '#fff'); props(el, car('#b12b28'), 3, 'rmDrift', 1.2, 2, .9, 1.3, 'left'); } },
  74:{ acc:'#d4af37', f:el => { layer(el, 'linear-gradient(135deg,#0a0a0a,#2a2410)'); // Lamborghini: hexagon gold + bull
      layer(el, svg(40, 46, `<path d='M20 1l18 11v22L20 45 2 34V12z' fill='none' stroke='#d4af37' stroke-width='1.2' opacity='.45'/>`));
      props(el, `<div style="width:120px;height:3px;background:linear-gradient(90deg,transparent,#d4af37)"></div>`, 10, 'rmDrift', .8, 1.5, .7, 1.3, 'left'); } },
  75:{ acc:'#ffeb00', f:el => { layer(el, 'linear-gradient(180deg,#d40000,#7a0000)'); // Ferrari: rosso corsa + prancing-horse yellow shield
      layer(el, 'linear-gradient(90deg,transparent 0 10%,#ffeb00 10% 12%,transparent 12% 88%,#ffeb00 88% 90%,transparent 90%)', 'opacity:.6');
      layer(el, 'linear-gradient(180deg,#009246 0 4px,#fff 4px 8px,#ce2b37 8px 12px,transparent 12px)'); road(el, '#fff');
      props(el, car('#ffeb00'), 2, 'rmDrift', 1, 1.8, 1, 1.4, 'left'); } },
  76:{ acc:'#009cde', f:el => { layer(el, 'linear-gradient(160deg,#003087,#001c64)'); // PayPal: payment pings
      props(el, `<div style="background:#fff;color:#003087;font:800 12px sans-serif;padding:4px 8px;border-radius:12px">Sent ✓</div>`, 6, 'rmRise', 5, 9, .8, 1.2);
      props(el, coin('#009cde'), 12, 'rmFall', 4, 8, .6, 1.2); } },
  77:{ acc:'#f79e1b', f:el => { layer(el, '#1a1a1a'); // Mastercard: interlocking circles
      layer(el, 'radial-gradient(circle at 40% 50%,#eb001b 0 90px,transparent 91px),radial-gradient(circle at 60% 50%,#f79e1b 0 90px,transparent 91px)', 'opacity:.6;mix-blend-mode:screen'); } },
  78:{ acc:'#2e77bc', f:el => { layer(el, 'linear-gradient(135deg,#0f2d5a,#2e77bc)'); // Amex: metal card + centurion blue guilloche
      layer(el, 'repeating-radial-gradient(circle at 50% 50%,transparent 0 6px,#ffffff10 6px 7px)');
      props(el, `<div style="width:70px;height:44px;border-radius:6px;background:linear-gradient(135deg,#d9d9d9,#8c8c8c);border:1px solid #fff"></div>`, 5, 'rmBob', 3, 5, .7, 1.2); } },
  79:{ acc:'#e53238', f:el => { layer(el, '#fff'); // eBay: four-colour price tags + bid hammer
      props(el, i => `<div style="background:${['#e53238','#0064d2','#f5af02','#86b817'][i % 4]};color:#fff;font:800 12px sans-serif;padding:3px 8px;border-radius:3px 10px 10px 3px">$${Math.floor(R(1, 99))}.99</div>`, 14, 'rmBob', 2, 4, .8, 1.3); } },
  80:{ acc:'#ffc220', f:el => { layer(el, 'linear-gradient(180deg,#0071ce,#004c91)'); // Walmart: spark + rollback aisles
      layer(el, 'repeating-linear-gradient(90deg,#ffffff14 0 60px,transparent 60px 120px)');
      props(el, `<svg width="30" height="30" viewBox="-15 -15 30 30"><g fill="#ffc220">${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-2.5" y="-14" width="5" height="9" rx="2.5" transform="rotate(${a})"/>`).join('')}</g></svg>`, 10, 'rmPulse', 1.2, 2.5, .8, 1.4); } },
  81:{ acc:'#ffda1a', f:el => { layer(el, 'linear-gradient(180deg,#0058a3,#003e73)'); // IKEA: flat-pack boxes + allen keys
      layer(el, 'linear-gradient(transparent 80%,#ffda1a 80%)');
      props(el, `<div style="width:44px;height:30px;background:#c9a26b;border:2px solid #8b6a3e;font:700 8px sans-serif;color:#5a3e1e;display:flex;align-items:center;justify-content:center">FLÄT</div>`, 8, 'rmFall', 5, 9, .8, 1.2);
      props(el, `<div style="width:6px;height:30px;background:#9e9e9e;border-radius:2px;box-shadow:8px 22px 0 -1px #9e9e9e"></div>`, 6, 'rmBob', 2, 4); } }
});
})();
