/* Brand Clicker '27 — code-only Schnucks brands (ids 230-232). Redeem in More → Trade. */
(function(){
const { S, R, props, layer } = window.BC_RM_KIT;
const LOGO = 'bc27/logos/schnucks.png';
// Optional: YouTube video IDs of 2000s Schnucks commercials. If set, the TV plays them; otherwise it plays a built-in retro ad loop.
const ADS = [];
const css = document.createElement('style');
css.textContent = `@keyframes schSlide{0%,22%{transform:translateX(0)}25%,47%{transform:translateX(-100%)}50%,72%{transform:translateX(-200%)}75%,97%{transform:translateX(-300%)}100%{transform:translateX(-400%)}}
@keyframes schStatic{0%{background-position:0 0}100%{background-position:40px 60px}}
@keyframes schFloor{to{background-position:0 64px}}
@keyframes schGloss{0%,100%{opacity:.35}50%{opacity:.7}}`;
document.head.appendChild(css);
function tv(el){ // a silver 2000s CRT on a stand, right of the logo
  const t = document.createElement('div'); t.className = 'rmF';
  t.style.cssText = 'right:18px;bottom:40px;width:150px;height:124px;border-radius:14px;background:linear-gradient(#e8e8ec,#9a9aa4);box-shadow:0 8px 20px #0008,inset 0 2px 0 #fff;padding:10px 10px 22px;pointer-events:auto';
  const scr = document.createElement('div');
  scr.style.cssText = 'position:relative;width:100%;height:100%;border-radius:12px/18px;overflow:hidden;background:#000;box-shadow:inset 0 0 18px #000';
  if(ADS.length){ const id = ADS[Math.floor(Math.random() * ADS.length)];
    scr.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0" style="width:100%;height:100%;border:0" allow="autoplay;encrypted-media"></iframe>`; }
  else { const slide = (bg, inner) => `<div style="flex:0 0 100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${bg};color:#fff;font:bold 11px Arial;text-align:center;gap:4px">${inner}</div>`;
    scr.innerHTML = `<div style="display:flex;width:100%;height:100%;animation:schSlide 12s steps(1,end) infinite">` +
      slide('#fff', `<img src="${LOGO}" style="width:86%">`) +
      slide('linear-gradient(#2e7d32,#1b5e20)', '<span style="font-size:26px">🥦🍎🥕</span>FRESH PRODUCE') +
      slide('#e21836', '<span style="font-size:22px">🛒</span>THIS WEEK\'S<br>SPECIALS') +
      slide('linear-gradient(#ffe082,#ffb300)', '<span style="font-size:24px">🥖🧀</span><span style="color:#5a2d00">BAKERY & DELI</span>') +
      slide('#fff', `<img src="${LOGO}" style="width:86%">`) + '</div>'; }
  scr.innerHTML += `<div style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,#0003 0 1px,transparent 1px 3px)"></div>
    <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 30% 20%,#ffffff30,transparent 50%)"></div>`;
  t.appendChild(scr);
  t.insertAdjacentHTML('beforeend', '<div style="position:absolute;bottom:6px;left:12px;width:8px;height:8px;border-radius:50%;background:#3f3;box-shadow:0 0 6px #3f3"></div><div style="position:absolute;bottom:4px;right:12px;font:bold 7px Arial;color:#555">GXY TRINITRON</div><div style="position:absolute;left:40px;right:40px;bottom:-34px;height:34px;background:linear-gradient(#5a3a22,#3a2414);border-radius:3px"></div>');
  el.appendChild(t); }
Object.assign(S, {
  230:{ acc:'#e21836', f:el => { layer(el, 'linear-gradient(180deg,#fff,#f1f1f1)'); // Schnucks: grocery aisles + carts
      layer(el, 'repeating-linear-gradient(90deg,#e21836 0 10px,transparent 10px 110px)', 'top:0;height:30%;opacity:.9');
      layer(el, 'repeating-linear-gradient(180deg,transparent 0 46px,#d0d0d0 46px 50px)', 'top:30%;bottom:20%;opacity:.8');
      layer(el, 'linear-gradient(#e0e0e0,#c8c8c8)', 'top:80%');
      props(el, i => `<div style="font-size:22px">${['🍎','🥖','🥛','🧀','🥕','🍌'][i % 6]}</div>`, 12, 'rmBob', 2, 4, .8, 1.2);
      props(el, '<div style="font-size:26px">🛒</div>', 3, 'rmDrift', 8, 14, 1, 1.3, 'left'); } },
  231:{ acc:'#e21836', f:el => { // Schnucks 3D: early-2000s 3D living room with a CRT playing Schnucks ads
      layer(el, 'linear-gradient(180deg,#9ec9e8 0 58%,#6d8fb0 58%)');
      layer(el, 'radial-gradient(circle at 20% 20%,#ffffff55,transparent 30%)', 'animation:schGloss 4s ease-in-out infinite');
      const f = document.createElement('div'); f.className = 'rmF';
      f.style.cssText = 'left:-60%;width:220%;top:58%;height:600px;transform-origin:top;transform:perspective(300px) rotateX(70deg);background:repeating-conic-gradient(#c62828 0 25%,#f5f5f5 0 50%) 0 0/64px 64px;animation:schFloor 2s linear infinite';
      el.appendChild(f);
      const win = document.createElement('div'); win.className = 'rmF';
      win.style.cssText = 'left:24px;top:28px;width:110px;height:80px;border:6px solid #f5f5f5;background:linear-gradient(#7ec8ff,#d6f0ff);box-shadow:inset 0 0 0 2px #ccc';
      el.appendChild(win);
      props(el, '<div style="width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#7ec8ff 40%,#1e6fd8);box-shadow:0 4px 10px #0004"></div>', 6, 'rmBob', 2, 4, .7, 1.2);
      tv(el); } },
  232:{ acc:'#00a0e0', f:el => { // Schnucks 2000s: Y2K glossy "aero" store look
      layer(el, 'linear-gradient(180deg,#bfe9ff,#3aa7e0 55%,#0b5fa5)');
      layer(el, 'radial-gradient(ellipse 140% 50% at 50% 0%,#ffffffaa,transparent 60%)', 'animation:schGloss 3s ease-in-out infinite');
      layer(el, 'repeating-linear-gradient(0deg,#ffffff10 0 1px,transparent 1px 3px)');
      props(el, () => `<div style="width:${R(14, 34)}px;height:${R(14, 34)}px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#ffffff22 45%,#ffffff08);border:1px solid #ffffff88"></div>`, 22, 'rmRise', 6, 12, .7, 1.4);
      props(el, '<div style="width:90px;height:90px;border-radius:50%;background:radial-gradient(#ffffff,#ffffff00 60%)"></div>', 3, 'rmPulse', 2, 4, .8, 1.5);
      props(el, '<div style="width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e21836 45%,#7a0a18);box-shadow:0 6px 12px #0005"></div>', 4, 'rmBob', 2.5, 4, .7, 1.1); } }
});
window.BC_CODES = { SCHNUCKS:{ id:230, name:'Schnucks' }, SCH3D:{ id:231, name:'Schnucks 3D', is3d:true }, BLASTTOPASTSCH:{ id:232, name:'Schnucks 2000s', retro:true } };
window.BC_CODE_LOGO = LOGO;
})();
