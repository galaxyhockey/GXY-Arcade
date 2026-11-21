/* Brand Clicker '27 — Remastered backgrounds: a hand-themed scene per brand (480x360 stage).
   Each scene = base gradient + a brand motif tile (SVG) + animated brand props. BC_REMASTER(id, el) -> accent colour. */
(function(){
const css = document.createElement('style');
css.textContent = `.rmL{position:absolute;inset:0;pointer-events:none}.rmF{position:absolute;pointer-events:none;will-change:transform}
@keyframes rmRise{from{transform:translateY(420px)}to{transform:translateY(-80px)}}
@keyframes rmFall{from{transform:translateY(-80px) rotate(0)}to{transform:translateY(420px) rotate(360deg)}}
@keyframes rmDrift{from{transform:translateX(-120px)}to{transform:translateX(620px)}}
@keyframes rmBob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-14px) rotate(6deg)}}
@keyframes rmPulse{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:.9;transform:scale(1.1)}}
@keyframes rmBar{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
@keyframes rmSpin{to{transform:rotate(360deg)}}
@keyframes rmPan{to{background-position:240px 0}}
@keyframes rmFlick{0%,100%{opacity:.55;transform:scaleY(1)}50%{opacity:.9;transform:scaleY(1.15)}}`;
document.head.appendChild(css);
const svg = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;
const R = (a, b) => a + Math.random() * (b - a);
// floaters: html for one prop, count, animation, duration range, size range
function props(el, html, n, anim, d0, d1, s0 = 1, s1 = 1, from = 'any'){
  for(let i = 0; i < n; i++){ const f = document.createElement('div'); f.className = 'rmF'; f.innerHTML = typeof html === 'function' ? html(i) : html;
    const s = R(s0, s1), d = R(d0, d1);
    f.style.left = (from === 'left' ? 0 : R(-20, 470)) + 'px'; f.style.top = (anim === 'rmRise' || anim === 'rmFall' ? 0 : R(0, 340)) + 'px';
    f.style.animation = `${anim} ${d}s ${-R(0, d)}s linear infinite${anim === 'rmBob' || anim === 'rmPulse' ? ' alternate' : ''}`;
    f.style.zoom = s; el.appendChild(f); } }
const layer = (el, bg, extra = '') => { const l = document.createElement('div'); l.className = 'rmL'; l.style.cssText += `background:${bg};${extra}`; el.appendChild(l); return l; };
const bubble = (c, a = .5) => `<div style="width:14px;height:14px;border-radius:50%;border:2px solid ${c};opacity:${a}"></div>`;
const ice = (c1, c2) => (el) => { layer(el, 'linear-gradient(180deg,#eef6ff,#cfe3f5)');
  layer(el, `linear-gradient(90deg,transparent 49.6%,${c1} 49.6% 50.4%,transparent 50.4%),radial-gradient(circle at 50% 50%,transparent 58px,${c2} 58px 61px,transparent 61px),linear-gradient(180deg,transparent 22%,${c2}88 22% 23%,transparent 23% 77%,${c2}88 77% 78%,transparent 78%)`);
  layer(el, svg(60, 60, `<path d='M5 20 L40 8 M10 50 L55 38' stroke='#fff' stroke-width='1.2' opacity='.7'/>`)); };
const S = {
  0:{ acc:'#ff6a00', f:el => { layer(el, 'linear-gradient(135deg,#141414,#2b2b2b)'); // LTT: tech desk / screwdriver orange
      layer(el, svg(48, 48, `<path d='M0 24h18l6-6h24M24 0v12' stroke='#ff6a00' stroke-width='1.5' fill='none' opacity='.35'/><circle cx='24' cy='18' r='2.5' fill='#ff6a00' opacity='.5'/>`));
      props(el, `<div style="width:60px;height:6px;background:#ff6a00;border-radius:3px;box-shadow:0 0 8px #ff6a00"></div>`, 6, 'rmDrift', 8, 14, .6, 1.2, 'left'); } },
  1:{ acc:'#c8e600', f:el => { layer(el, 'radial-gradient(circle at 50% 120%,#7ad100,#00632f 60%,#003a1b)'); // Sprite: lemon-lime fizz
      props(el, () => bubble('#e9ff8a', R(.3, .8)), 38, 'rmRise', 4, 9, .4, 1.4);
      props(el, `<div style="width:26px;height:26px;border-radius:50%;background:radial-gradient(#fff86a,#c8e600);border:3px solid #fffbc2;opacity:.55"></div>`, 5, 'rmBob', 3, 5, .8, 1.4); } },
  2:{ acc:'#ff7a00', f:el => { layer(el, 'radial-gradient(circle at 50% 50%,#ff9a2e,#ff7a00 45%,#b84d00)'); // Reese's: peanut butter cup ridges
      layer(el, 'repeating-conic-gradient(from 0deg at 50% 50%,#4a231166 0 6deg,transparent 6deg 12deg)');
      layer(el, 'radial-gradient(circle at 50% 50%,transparent 150px,#4a2311 150px 175px,transparent 176px)'); } },
  3:{ acc:'#4fc3f7', f:el => { layer(el, 'linear-gradient(180deg,#0a3d91,#00205b)'); // Powerade: ion water + drops
      layer(el, svg(120, 40, `<path d='M0 20 Q30 0 60 20 T120 20' stroke='#4fc3f7' stroke-width='2' fill='none' opacity='.5'/>`), 'animation:rmPan 6s linear infinite');
      props(el, `<div style="width:12px;height:16px;background:#7fd8ff;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;opacity:.7"></div>`, 24, 'rmFall', 2, 4, .6, 1.3); } },
  4:{ acc:'#ff6f00', f:el => { layer(el, 'linear-gradient(160deg,#1a1a1a,#000)'); // Gatorade: bolt + splash
      layer(el, 'radial-gradient(ellipse at 50% 110%,#ff6f0099,transparent 60%)');
      props(el, `<svg width="30" height="50" viewBox="0 0 30 50"><path d="M18 0L2 28h11L8 50 28 18H16z" fill="#ff6f00"/></svg>`, 7, 'rmPulse', 1.2, 2.4, .7, 1.4); } },
  5:{ acc:'#00a77f', f:el => { layer(el, 'linear-gradient(135deg,#000,#0c1a16)'); // AMD: circuit traces
      layer(el, svg(80, 80, `<g stroke='#00a77f' stroke-width='1.4' fill='none' opacity='.45'><path d='M0 20h30l10 10v50M80 50H55l-10-10V0'/><circle cx='40' cy='30' r='3'/><circle cx='45' cy='40' r='3'/></g>`));
      props(el, `<div style="width:10px;height:3px;background:#3dffd1;box-shadow:0 0 6px #3dffd1"></div>`, 14, 'rmDrift', 3, 6, 1, 2, 'left'); } },
  6:{ acc:'#f5a623', f:el => { layer(el, 'linear-gradient(180deg,#f5ebdc,#e8c79a)'); // Burger King: flame-grill
      layer(el, 'repeating-linear-gradient(160deg,transparent 0 30px,#3b1d0b 30px 38px)');
      props(el, `<div style="width:24px;height:40px;background:radial-gradient(ellipse at 50% 80%,#ffd23f,#ff5a1f 55%,transparent 70%);transform-origin:bottom"></div>`, 14, 'rmFlick', .4, .9, .8, 1.5); } },
  7:{ acc:'#1c69d4', f:el => { layer(el, 'linear-gradient(180deg,#0a1a33,#030812)'); // BMW: M stripes + speed
      layer(el, 'linear-gradient(105deg,transparent 30%,#5fb7ff 30% 33%,#1c3f94 33% 36%,#e4002b 36% 39%,transparent 39%)');
      props(el, `<div style="width:90px;height:2px;background:linear-gradient(90deg,transparent,#cfe3ff)"></div>`, 20, 'rmDrift', .6, 1.4, .6, 1.6, 'left'); } },
  8:{ acc:'#e8f5e9', f:el => { layer(el, 'radial-gradient(circle at 50% 30%,#b3123e,#5e0016)'); // Sprite Cranberry: holiday fizz
      props(el, () => bubble('#ffd1dc', R(.3, .7)), 26, 'rmRise', 5, 10, .5, 1.3);
      props(el, `<div style="width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff4d6d,#8a0022)"></div>`, 8, 'rmFall', 6, 10, .7, 1.2);
      props(el, `<div style="color:#fff;font-size:14px;opacity:.8">❄</div>`, 18, 'rmFall', 5, 9, .7, 1.4); } },
  9:{ acc:'#8a8a8a', f:el => { layer(el, 'linear-gradient(160deg,#0a0a0a,#1f1f1f)'); // Stealth (Lightning blackout)
      layer(el, svg(60, 60, `<path d='M30 0L60 30 30 60 0 30z' fill='none' stroke='#3a3a3a' stroke-width='1.5'/>`));
      props(el, `<svg width="34" height="60" viewBox="0 0 30 50"><path d="M18 0L2 28h11L8 50 28 18H16z" fill="#bfbfbf"/></svg>`, 3, 'rmPulse', .8, 1.6, .8, 1.6); } },
  10:{ acc:'#b388ff', f:el => { layer(el, 'radial-gradient(circle at 50% 50%,#3a0d7a,#120030 70%)'); // WJH: purple stage lights
      layer(el, 'conic-gradient(from 200deg at 15% 0%,transparent 0 10deg,#b388ff44 10deg 18deg,transparent 18deg),conic-gradient(from 130deg at 85% 0%,transparent 0 10deg,#ff80ff44 10deg 18deg,transparent 18deg)');
      props(el, `<div style="width:6px;height:6px;border-radius:50%;background:#e9d7ff;box-shadow:0 0 8px #b388ff"></div>`, 30, 'rmPulse', 1, 3, .6, 1.4); } },
  11:{ acc:'#0071c5', f:el => { layer(el, 'linear-gradient(135deg,#00122b,#002a5c)'); // Intel: silicon wafer dies
      layer(el, 'radial-gradient(circle at 50% 50%,#0a4c94 0 170px,transparent 171px)');
      layer(el, svg(26, 26, `<rect x='2' y='2' width='22' height='22' fill='#0071c5' opacity='.35' stroke='#7fc4ff' stroke-width='.6'/>`), '-webkit-mask:radial-gradient(circle at 50% 50%,#000 0 168px,transparent 170px);mask:radial-gradient(circle at 50% 50%,#000 0 168px,transparent 170px)'); } },
  12:{ acc:'#fcb514', f:ice('#c8102e', '#002f87') },       // St. Louis Blues
  13:{ acc:'#99d9d9', f:ice('#c8102e', '#001628') },       // Seattle Kraken
  14:{ acc:'#ce1126', f:el => { ice('#c8102e', '#ce1126')(el); // Carolina: storm warning flags
      props(el, `<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 0v30" stroke="#333" stroke-width="2"/><path d="M3 2h20l-6 7 6 7H3z" fill="#ce1126"/><rect x="9" y="6" width="6" height="6" fill="#000"/></svg>`, 4, 'rmBob', 2, 3.5, .9, 1.3); } },
  15:{ acc:'#e31837', f:el => { layer(el, 'linear-gradient(180deg,#d9dde3,#9aa4b0)'); // Costco: warehouse racking
      layer(el, 'repeating-linear-gradient(90deg,#005daa 0 8px,transparent 8px 120px),repeating-linear-gradient(180deg,transparent 0 80px,#e37b1f 80px 86px)');
      props(el, `<div style="width:30px;height:22px;background:#c9a26b;border:2px solid #8b6a3e"></div>`, 10, 'rmDrift', 10, 16, .7, 1.2, 'left'); } },
  16:{ acc:'#e50914', f:el => { layer(el, 'radial-gradient(ellipse at 50% 120%,#e5091488,#000 65%)'); // Netflix: curtain + ribbon
      layer(el, 'repeating-linear-gradient(90deg,#3a0002 0 14px,#160000 14px 28px)', 'opacity:.75;-webkit-mask:linear-gradient(90deg,#000 0 22%,transparent 28% 72%,#000 78%);mask:linear-gradient(90deg,#000 0 22%,transparent 28% 72%,#000 78%)');
      props(el, `<div style="width:4px;height:80px;background:linear-gradient(#e50914,transparent);opacity:.8"></div>`, 16, 'rmFall', 2, 4, .6, 1.4); } },
  17:{ acc:'#ff9900', f:el => { layer(el, 'linear-gradient(180deg,#232f3e,#131921)'); // Amazon: parcels on conveyor + smile
      layer(el, 'repeating-linear-gradient(90deg,#3d4a5c 0 4px,transparent 4px 20px) 0 300px/100% 14px no-repeat', 'animation:rmPan 3s linear infinite');
      props(el, `<div style="width:34px;height:26px;background:#c49a6c;border:2px solid #8a6a43;position:relative"><svg width="22" height="8" viewBox="0 0 22 8" style="position:absolute;left:4px;bottom:3px"><path d="M1 1Q11 9 21 1" stroke="#ff9900" stroke-width="2" fill="none"/></svg></div>`, 9, 'rmDrift', 7, 12, .7, 1.3, 'left'); } },
  18:{ acc:'#1ce783', f:el => { layer(el, 'linear-gradient(135deg,#0b0c0f,#10231a)'); // Hulu: streaming tiles
      layer(el, svg(90, 56, `<rect x='4' y='4' width='82' height='48' rx='6' fill='none' stroke='#1ce783' stroke-width='1.2' opacity='.35'/><path d='M40 20l12 8-12 8z' fill='#1ce783' opacity='.4'/>`), 'animation:rmPan 10s linear infinite'); } },
  19:{ acc:'#a1a1a6', f:el => { layer(el, 'linear-gradient(180deg,#f5f5f7,#d2d2d7)'); // Apple: clean keynote rings
      layer(el, 'radial-gradient(circle at 50% 50%,transparent 120px,#ffffff 121px 124px,transparent 125px 160px,#e8e8ed 161px 164px,transparent 165px)');
      props(el, `<div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(#ff375f,#ff9f0a,#30d158,#0a84ff,#bf5af2,#ff375f);filter:blur(40px);opacity:.35"></div>`, 2, 'rmBob', 4, 6, 1, 1.4); } },
  20:{ acc:'#cc0000', f:el => { layer(el, 'repeating-radial-gradient(circle at 50% 50%,#cc0000 0 34px,#fff 34px 68px)'); // Target: bullseye
      layer(el, 'linear-gradient(transparent,#0005)'); } },
  21:{ acc:'#1db954', f:el => { layer(el, 'linear-gradient(180deg,#121212,#0a2a17)'); // Spotify: live equalizer
      for(let i = 0; i < 24; i++){ const b = document.createElement('div'); b.className = 'rmF';
        b.style.cssText = `left:${i * 20 + 2}px;bottom:0;width:14px;height:${R(80, 220)}px;background:linear-gradient(#1ed760,#1db95422);border-radius:4px 4px 0 0;transform-origin:bottom;animation:rmBar ${R(.5, 1.2)}s ${-R(0, 1)}s ease-in-out infinite`;
        el.appendChild(b); } } },
  22:{ acc:'#ffc72c', f:el => { layer(el, 'linear-gradient(180deg,#da291c,#a51c11)'); // McDonald's: arches + fries
      layer(el, svg(80, 50, `<path d='M8 46 C8 0 34 0 34 46 M34 46 C34 0 60 0 60 46' stroke='#ffc72c' stroke-width='5' fill='none' opacity='.22'/>`));
      props(el, `<div style="width:7px;height:34px;background:#ffd24a;border-radius:2px;box-shadow:9px 4px 0 #ffcd30,-9px 6px 0 #ffd65c"></div>`, 10, 'rmFall', 4, 7, .7, 1.2); } },
  23:{ acc:'#e60012', f:el => { layer(el, 'linear-gradient(180deg,#5c94fc,#8fb8ff)'); // Nintendo: pixel blocks + clouds
      layer(el, svg(32, 32, `<rect width='32' height='32' fill='#c84c0c'/><path d='M0 15h32M16 0v15M8 15v17M24 15v17' stroke='#000' stroke-width='2'/>`) + ' 0 328px/32px 32px repeat-x');
      props(el, `<div style="width:24px;height:24px;background:#f8b800;border:2px solid #8a4b00;color:#8a4b00;font:bold 16px monospace;display:flex;align-items:center;justify-content:center">?</div>`, 5, 'rmBob', 1.5, 2.5, .9, 1.3);
      props(el, `<div style="width:60px;height:20px;background:#fff;border-radius:12px;box-shadow:16px -8px 0 #fff,-16px -4px 0 #fff"></div>`, 4, 'rmDrift', 16, 26, .8, 1.3, 'left'); } },
  24:{ acc:'#00439c', f:el => { layer(el, 'linear-gradient(180deg,#001a45,#003087)'); // PS4: wave + shapes
      layer(el, 'radial-gradient(ellipse 140% 40% at 50% 100%,#3a7bd5aa,transparent 70%)');
      props(el, i => `<div style="color:#9cc4ff;font-size:22px;opacity:.6">${'△○✕□'[i % 4]}</div>`, 16, 'rmBob', 2, 4, .7, 1.6); } },
  25:{ acc:'#e5e7ff', f:el => { layer(el, 'radial-gradient(circle at 50% 50%,#1f2a6b,#05070f 70%)'); // PS5: white console fins + glow
      layer(el, 'linear-gradient(100deg,transparent 0 6%,#f1f2ff 6% 13%,transparent 13% 87%,#f1f2ff 87% 94%,transparent 94%)', 'opacity:.85');
      props(el, i => `<div style="color:#fff;font-size:20px;opacity:.5">${'△○✕□'[i % 4]}</div>`, 12, 'rmRise', 8, 14, .7, 1.4); } },
  26:{ acc:'#5b6dcd', f:el => { layer(el, 'linear-gradient(135deg,#101820,#1c2632)'); // Oreo: embossed cookies
      props(el, `<div style="width:56px;height:56px;border-radius:50%;background:repeating-conic-gradient(#1a1a1a 0 15deg,#2c2c2c 15deg 30deg);border:4px solid #262626;box-shadow:0 6px 0 #f4f1ea,0 10px 0 #222"></div>`, 9, 'rmBob', 3, 5, .6, 1.2); } },
  27:{ acc:'#76b900', f:el => { layer(el, 'radial-gradient(circle at 50% 50%,#1b2a00,#000 70%)'); // NVIDIA: GPU hex + RTX rays
      layer(el, svg(40, 46, `<path d='M20 1l18 11v22L20 45 2 34V12z' fill='none' stroke='#76b900' stroke-width='1' opacity='.35'/>`));
      props(el, `<div style="width:120px;height:2px;background:linear-gradient(90deg,transparent,#a3ff3c,transparent)"></div>`, 10, 'rmDrift', 1.5, 3, .7, 1.4, 'left'); } },
  28:{ acc:'#00704a', f:el => { layer(el, 'linear-gradient(180deg,#f2f0eb,#d4e9e2)'); // Starbucks: cups + steam
      layer(el, 'radial-gradient(circle at 50% 50%,transparent 160px,#00704a 160px 172px,transparent 173px)');
      props(el, `<div style="width:24px;height:30px;background:#fff;border:2px solid #ccc;border-radius:0 0 6px 6px;position:relative"><div style="position:absolute;top:9px;left:5px;width:12px;height:12px;border-radius:50%;background:#00704a"></div></div>`, 6, 'rmBob', 2.5, 4, .8, 1.2);
      props(el, `<div style="width:8px;height:40px;border-left:3px solid #8a7a6a55;border-radius:50%"></div>`, 10, 'rmRise', 4, 7, .8, 1.3); } },
  29:{ acc:'#ffde00', f:el => { layer(el, 'conic-gradient(from 45deg at 50% 50%,#ed1c24 0 25%,#ffde00 0 50%,#00a651 0 75%,#0072bc 0)'); // UNO: four colours + cards
      layer(el, 'radial-gradient(circle,#0000 40%,#0006)');
      props(el, i => `<div style="width:30px;height:44px;border-radius:5px;background:${['#ed1c24','#ffde00','#00a651','#0072bc'][i % 4]};border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font:900 16px sans-serif;text-shadow:1px 1px #000">${['7','⟲','+2','⊘'][i % 4]}</div>`, 10, 'rmFall', 5, 9, .7, 1.2); } },
  30:{ acc:'#a81612', f:el => { layer(el, 'linear-gradient(180deg,#5a1f0c,#2a0d03)'); // Chipotle: foil + peppers
      layer(el, 'repeating-linear-gradient(115deg,#c7c7c722 0 6px,transparent 6px 14px)');
      props(el, `<svg width="36" height="20" viewBox="0 0 36 20"><path d="M4 10Q14 0 30 6Q36 10 30 14Q14 20 4 10z" fill="#a81612"/><path d="M4 10Q0 6 2 3" stroke="#3a7a1f" stroke-width="3" fill="none"/></svg>`, 9, 'rmFall', 4, 8, .8, 1.4); } },
  31:{ acc:'#00b8fc', f:el => { layer(el, 'linear-gradient(135deg,#000,#0c1620)'); // Logitech: RGB keyboard grid
      layer(el, svg(30, 30, `<rect x='3' y='3' width='24' height='24' rx='4' fill='none' stroke='#00b8fc' stroke-width='1.2' opacity='.35'/>`));
      layer(el, 'linear-gradient(90deg,#ff004433,#ffd00033,#00ff8833,#00b8fc33,#b000ff33,#ff004433) 0 0/480px 100%', 'animation:rmPan 3s linear infinite;mix-blend-mode:screen'); } },
  32:{ acc:'#a50034', f:el => { layer(el, 'linear-gradient(180deg,#6e0f24,#3a0612)'); // Dr Pepper: 10-2-4 clocks + fizz
      props(el, () => bubble('#ff9fb6', R(.25, .6)), 30, 'rmRise', 4, 9, .5, 1.3);
      props(el, `<div style="width:40px;height:40px;border-radius:50%;border:3px solid #f3e1c7;position:relative;opacity:.6"><div style="position:absolute;left:17px;top:5px;width:3px;height:16px;background:#f3e1c7;transform-origin:bottom;animation:rmSpin 4s linear infinite"></div></div>`, 3, 'rmBob', 3, 5, .9, 1.3); } },
  33:{ acc:'#e2203d', f:el => { layer(el, 'linear-gradient(90deg,#e2203d55 50%,transparent 50%) 0 0/36px 36px,linear-gradient(#e2203d55 50%,#fff 50%) 0 0/36px 36px'); // Wendy's: gingham
      props(el, `<div style="width:40px;height:16px;background:#f5c26b;border-radius:20px 20px 4px 4px;box-shadow:0 5px 0 #6b3a1f,0 9px 0 #4caf50,0 14px 0 #f5c26b"></div>`, 6, 'rmBob', 2, 4, .8, 1.3); } },
  34:{ acc:'#f7b600', f:el => { layer(el, 'linear-gradient(135deg,#1a1f71,#0b0e3a)'); // VISA: card + chip
      layer(el, 'linear-gradient(180deg,transparent 80%,#f7b600 80% 86%,transparent 86%)');
      props(el, `<div style="width:64px;height:40px;border-radius:6px;background:linear-gradient(135deg,#2a3399,#1a1f71);border:1px solid #6a74d8;position:relative"><div style="position:absolute;left:8px;top:12px;width:14px;height:11px;border-radius:2px;background:linear-gradient(135deg,#f9d77e,#c9962b)"></div></div>`, 7, 'rmBob', 3, 5, .7, 1.2); } },
  35:{ acc:'#e4002b', f:el => { layer(el, 'repeating-conic-gradient(from 0deg at 50% 100%,#002d72 0 8deg,#e4002b 8deg 16deg)'); // RC Cola: retro sunburst
      layer(el, 'radial-gradient(circle at 50% 100%,#fff6 0 60px,transparent 61px)'); props(el, () => bubble('#fff', R(.3, .6)), 18, 'rmRise', 5, 9, .5, 1.2); } },
  36:{ acc:'#c62828', f:el => { layer(el, 'linear-gradient(180deg,#2a1810,#1a0e08)'); // Stocker: fireplace mantel + stockings
      layer(el, 'radial-gradient(ellipse 60% 35% at 50% 100%,#ff7a1a,#c62828 40%,transparent 70%)');
      props(el, `<svg width="26" height="36" viewBox="0 0 26 36"><path d="M6 0h12v20q0 6 8 10l-4 6q-14-2-16-14z" fill="#c62828"/><rect x="5" width="14" height="7" fill="#fff"/></svg>`, 6, 'rmBob', 2.5, 4, .9, 1.3);
      props(el, `<div style="width:24px;height:40px;background:radial-gradient(ellipse at 50% 80%,#ffd23f,#ff5a1f 55%,transparent 70%);transform-origin:bottom"></div>`, 10, 'rmFlick', .4, .9, .9, 1.6); } },
  37:{ acc:'#ffd54f', f:el => { layer(el, 'linear-gradient(180deg,#3b1d12,#1a0d08)'); // Grand Hall Tree: hall + lights
      layer(el, 'repeating-linear-gradient(90deg,#5a2e1a 0 60px,#4a2414 60px 64px)');
      props(el, i => `<div style="width:7px;height:7px;border-radius:50%;background:${['#ffd54f','#ff5252','#69f0ae','#40c4ff'][i % 4]};box-shadow:0 0 8px currentColor"></div>`, 40, 'rmPulse', .8, 2, .8, 1.3); } },
  38:{ acc:'#ff5252', f:el => { layer(el, 'linear-gradient(180deg,#0b1f3a,#081c10)'); // Tree Dynamic: falling snow + twinkle
      layer(el, 'linear-gradient(180deg,transparent 80%,#f0f6ff 80%)');
      props(el, `<div style="color:#fff;font-size:12px">❄</div>`, 40, 'rmFall', 5, 10, .6, 1.5);
      props(el, i => `<div style="width:6px;height:6px;border-radius:50%;background:${['#ff5252','#ffd54f','#69f0ae'][i % 3]};box-shadow:0 0 8px #fff"></div>`, 20, 'rmPulse', .7, 1.6); } },
  39:{ acc:'#fc4c02', f:el => { ice('#c8102e', '#fc4c02')(el); // Anaheim Ducks
      props(el, `<svg width="30" height="16" viewBox="0 0 30 16"><path d="M2 10 Q10 2 18 8 L28 6 L22 12 Q12 16 2 10z" fill="#111"/><path d="M18 8l10-2-6 6z" fill="#fc4c02"/></svg>`, 4, 'rmDrift', 6, 10, .9, 1.4, 'left'); } }
};
window.BC_RM_KIT = { svg, R, props, layer, bubble, ice, S };
window.BC_REMASTER = function(id, el){ const s = S[id] || S[0]; el.innerHTML = ''; el.style.background = '#000'; s.f(el); return s.acc; };
window.BC_REMASTER_BASE = id => { const s = S[id] || S[0]; const l = document.createElement('div'); s.f(l); return (l.firstChild && l.firstChild.style.background) || '#000'; };
})();
