/* Brand Clicker '27 — ultra-rare 3D editions: real CSS 3D scenes (perspective, translateZ, rotating geometry). ids 100+ */
(function(){
const { S, R } = window.BC_RM_KIT;
const css = document.createElement('style');
css.textContent = `.d3{position:absolute;inset:0;perspective:420px;perspective-origin:50% 50%;overflow:hidden}
.d3 *{position:absolute;transform-style:preserve-3d}
@keyframes d3Fly{from{transform:translateZ(-1400px);opacity:0}15%{opacity:1}to{transform:translateZ(400px);opacity:1}}
@keyframes d3Floor{from{background-position:0 0}to{background-position:0 80px}}
@keyframes d3Spin{from{transform:rotateX(0) rotateY(0)}to{transform:rotateX(360deg) rotateY(720deg)}}
@keyframes d3Orb{from{transform:rotateX(70deg) rotateZ(0)}to{transform:rotateX(70deg) rotateZ(360deg)}}
@keyframes d3Orb2{from{transform:rotateY(70deg) rotateZ(0)}to{transform:rotateY(70deg) rotateZ(-360deg)}}
@keyframes d3Bob{0%,100%{margin-top:0}50%{margin-top:-18px}}`;
document.head.appendChild(css);
const root = (el, bg) => { el.style.background = bg; const d = document.createElement('div'); d.className = 'd3'; el.appendChild(d); return d; };
const add = (p, html) => { const t = document.createElement('div'); t.innerHTML = html; const n = t.firstChild; p.appendChild(n); return n; };
// motifs
function tunnel(d, cols, shape = 'square', n = 14, dur = 5){
  for(let i = 0; i < n; i++) add(d, `<div style="left:50%;top:50%;width:300px;height:220px;margin:-110px -150px;border:4px solid ${cols[i % cols.length]};${shape === 'circle' ? 'border-radius:50%;' : 'border-radius:14px;'}box-shadow:0 0 18px ${cols[i % cols.length]};animation:d3Fly ${dur}s ${-i * dur / n}s linear infinite"></div>`); }
function floor(d, line, sky, sun){
  add(d, `<div style="inset:0;background:${sky}"></div>`);
  add(d, `<div style="left:50%;top:32%;width:150px;height:150px;margin-left:-75px;border-radius:50%;background:${sun};box-shadow:0 0 60px ${sun}"></div>`);
  add(d, `<div style="left:-60%;width:220%;top:52%;height:900px;transform-origin:top;transform:rotateX(78deg);background:linear-gradient(${line} 2px,transparent 2px) 0 0/100% 40px,linear-gradient(90deg,${line} 2px,transparent 2px) 0 0/40px 100%;animation:d3Floor .5s linear infinite"></div>`); }
function cubes(d, face, edge, n = 7, label = ''){
  for(let i = 0; i < n; i++){ const s = R(34, 70), f = (t) => `<div style="width:${s}px;height:${s}px;background:${face};border:2px solid ${edge};box-shadow:inset 0 0 12px ${edge};transform:${t} translateZ(${s / 2}px);display:flex;align-items:center;justify-content:center;color:${edge};font:900 ${s / 2}px sans-serif">${label}</div>`;
    add(d, `<div style="left:${R(10, 440)}px;top:${R(20, 300)}px;width:${s}px;height:${s}px;animation:d3Spin ${R(6, 14)}s ${-R(0, 10)}s linear infinite,d3Bob ${R(2, 4)}s ease-in-out infinite">${['', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'].map(f).join('')}</div>`); } }
function orbits(d, cols, core){
  add(d, `<div style="left:50%;top:50%;width:90px;height:90px;margin:-45px;border-radius:50%;background:${core};box-shadow:0 0 60px ${core}"></div>`);
  cols.forEach((c, i) => add(d, `<div style="left:50%;top:50%;width:${260 + i * 70}px;height:${260 + i * 70}px;margin:${-(130 + i * 35)}px;border-radius:50%;border:3px solid ${c};box-shadow:0 0 14px ${c};animation:${i % 2 ? 'd3Orb2' : 'd3Orb'} ${6 + i * 2}s linear infinite"><div style="left:-8px;top:50%;width:16px;height:16px;border-radius:50%;background:${c};box-shadow:0 0 12px ${c}"></div></div>`)); }
function warp(d, col, n = 70){
  for(let i = 0; i < n; i++){ const a = R(0, 360), r = R(20, 260);
    add(d, `<div style="left:${240 + Math.cos(a) * r}px;top:${180 + Math.sin(a) * r}px;width:3px;height:${R(10, 40)}px;background:${col};box-shadow:0 0 6px ${col};transform:rotate(${a * 57.3 + 90}deg);animation:d3Fly ${R(1.2, 3)}s ${-R(0, 3)}s linear infinite"></div>`); } }
const D3 = {
  100:{ acc:'#76b900', f:el => { const d = root(el, 'radial-gradient(circle,#132400,#000 70%)'); cubes(d, '#76b90022', '#76b900', 8); warp(d, '#a3ff3c', 30); } },          // NVIDIA 3D: RTX cubes
  101:{ acc:'#5b8cff', f:el => { const d = root(el, 'radial-gradient(circle,#1a2a7a,#02040e 70%)'); orbits(d, ['#ffffff', '#5b8cff', '#ffffff'], '#c9d4ff'); } },             // PS5 3D: console orbit
  102:{ acc:'#e82127', f:el => { const d = root(el, '#000'); warp(d, '#ffffff', 90); tunnel(d, ['#e82127'], 'circle', 6, 3); } },                                         // Tesla 3D: hyperspace
  103:{ acc:'#ffeb00', f:el => { const d = root(el, '#000'); floor(d, '#ffeb00', 'linear-gradient(#3a0000,#d40000)', '#ffeb00'); } },                                       // Ferrari 3D: retro-wave track
  104:{ acc:'#bf5af2', f:el => { const d = root(el, 'radial-gradient(circle,#1d1d1f,#000 70%)'); orbits(d, ['#ff375f', '#ff9f0a', '#30d158', '#0a84ff'], '#f5f5f7'); } },   // Apple 3D: rainbow rings
  105:{ acc:'#e60012', f:el => { const d = root(el, 'linear-gradient(#5c94fc,#8fb8ff)'); cubes(d, '#f8b800', '#8a4b00', 9, '?'); } },                                       // Nintendo 3D: spinning ? blocks
  106:{ acc:'#ffcc00', f:el => { const d = root(el, 'radial-gradient(circle,#1c3f9e,#050a24 70%)'); tunnel(d, ['#db0a40', '#ffcc00'], 'circle', 16, 4); } },               // Red Bull 3D: wing tunnel
  107:{ acc:'#e50914', f:el => { const d = root(el, '#000'); tunnel(d, ['#e50914', '#b20710', '#ff3d47'], 'square', 18, 6); } },                                            // Netflix 3D: binge tunnel
  108:{ acc:'#d4af37', f:el => { const d = root(el, '#000'); floor(d, '#d4af37', 'linear-gradient(#0a0a0a,#2a2410)', '#d4af37'); cubes(d, '#d4af3722', '#d4af37', 4); } }, // Lamborghini 3D: gold grid
  109:{ acc:'#ff4500', f:el => { const d = root(el, 'radial-gradient(circle,#2b0a00,#000 70%)'); warp(d, '#ff4500', 60); orbits(d, ['#ff4500', '#ffffff'], '#ff8c1a'); } } // LTT 3D: screwdriver orbit
};
Object.assign(S, D3);
window.BC_D3 = { root, tunnel, floor, cubes, orbits, warp };
window.BC_3D = [[100, 27, 'NVIDIA'], [101, 25, 'PS5'], [102, 49, 'Tesla'], [103, 75, 'Ferrari'], [104, 19, 'Apple'], [105, 23, 'Nintendo'], [106, 62, 'Red Bull'], [107, 16, 'Netflix'], [108, 74, 'Lamborghini'], [109, 0, 'Linus Tech Tips']];
})();
