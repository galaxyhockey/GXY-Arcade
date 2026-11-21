/* Brand Clicker '27 — GTA VI (code BEFOREGTA6), id 240: an animated Vice City sunset in layered SVG. */
(function(){
const { S, R } = window.BC_RM_KIT;
const css = document.createElement('style');
css.textContent = `
.g6{position:absolute;inset:0;overflow:hidden}
.g6 svg{position:absolute;left:0;top:0;width:100%;height:100%}
@keyframes g6Sun{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
@keyframes g6Cloud{from{transform:translateX(-160px)}to{transform:translateX(640px)}}
@keyframes g6Sway{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
@keyframes g6Glint{0%,100%{transform:scaleX(.6);opacity:.35}50%{transform:scaleX(1.15);opacity:.95}}
@keyframes g6Wave{to{transform:translateX(-60px)}}
@keyframes g6Car{0%{transform:translateX(-140px)}100%{transform:translateX(640px)}}
@keyframes g6Boat{0%{transform:translateX(560px)}100%{transform:translateX(-160px)}}
@keyframes g6Twinkle{0%,100%{opacity:.15}50%{opacity:1}}
@keyframes g6Win{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes g6Bird{0%{transform:translate(-40px,0)}50%{transform:translate(260px,-14px)}100%{transform:translate(560px,6px)}}
@keyframes g6Flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(-.6)}}
@keyframes g6Grain{0%{transform:translate(0,0)}25%{transform:translate(-8px,6px)}50%{transform:translate(6px,-4px)}75%{transform:translate(-4px,-8px)}100%{transform:translate(0,0)}}
@keyframes g6Beam{0%,100%{transform:rotate(-24deg)}50%{transform:rotate(18deg)}}`;
document.head.appendChild(css);

function palm(x, y, s, flip, d){ // silhouette palm: curved trunk + 7 fronds, sways from the base
  const fr = [-160, -125, -90, -55, -20, 15, 45].map((a, i) => { const r = 58 + (i % 2) * 10, rad = a * Math.PI / 180, ex = Math.cos(rad) * r, ey = Math.sin(rad) * r * .6 + 26;
    return `<path d="M0 0 Q ${ex * .5} ${ey * .2 - 18} ${ex} ${ey}" stroke="#12061f" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M0 0 Q ${ex * .5} ${ey * .2 - 12} ${ex} ${ey}" stroke="#1d0b30" stroke-width="2" fill="none" stroke-dasharray="2 5" />`; }).join('');
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g style="transform-origin:0 0;animation:g6Sway ${d}s ease-in-out infinite">
    <path d="M0 0 C 6 -60 -14 -130 6 -200 L 14 -200 C -4 -130 16 -60 10 0 Z" fill="#12061f"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${-1 + Math.sin(i) * 2} ${-16 * i - 8} l 12 -4" stroke="#24103a" stroke-width="1.5"/>`).join('')}
    <g transform="translate(10 -200)">${fr}<circle r="7" fill="#12061f"/></g></g></g>`;
}
S[240] = { acc:'#ff3d8b', f:el => {
  el.style.background = '#1a0638';
  const w = document.createElement('div'); w.className = 'g6'; el.appendChild(w);
  const stars = Array.from({ length: 40 }, () => `<circle cx="${R(0, 480)}" cy="${R(0, 110)}" r="${R(.4, 1.3)}" fill="#fff" style="animation:g6Twinkle ${R(1.5, 4)}s ${-R(0, 4)}s infinite"/>`).join('');
  // skyline: towers with lit windows
  let sky = '', wins = '';
  for(let x = 0, i = 0; x < 480; i++){ const bw = R(14, 34), bh = R(26, 96) * (x > 150 && x < 330 ? 1.25 : 1), top = 222 - bh;
    sky += `<rect x="${x}" y="${top}" width="${bw}" height="${bh}" fill="#2a0d44"/>`;
    if(i % 3 === 0) sky += `<rect x="${x + bw / 2 - 1}" y="${top - 12}" width="2" height="12" fill="#2a0d44"/><circle cx="${x + bw / 2}" cy="${top - 13}" r="1.6" fill="#ff2d55" style="animation:g6Twinkle 1.2s ${-R(0, 1)}s infinite"/>`;
    if(i % 4 === 1) sky += `<rect x="${x}" y="${top}" width="${bw}" height="2" fill="#ff4fd8" opacity=".9"/>`;
    if(i % 5 === 2) sky += `<rect x="${x + bw - 2}" y="${top}" width="2" height="${bh}" fill="#3ef0ff" opacity=".7"/>`;
    for(let wy = top + 5; wy < 218; wy += 7) for(let wx = x + 3; wx < x + bw - 3; wx += 6) if(Math.random() < .38)
      wins += `<rect x="${wx}" y="${wy}" width="2.4" height="3" fill="${Math.random() < .75 ? '#ffd27a' : '#7df9ff'}" style="animation:g6Win ${R(2, 7)}s ${-R(0, 7)}s infinite"/>`;
    x += bw + R(0, 3); }
  const sunStripes = Array.from({ length: 7 }, (_, i) => `<rect x="150" y="${150 + i * 10}" width="180" height="${1.5 + i * .9}" fill="#1a0638"/>`).join('');
  const glints = Array.from({ length: 14 }, (_, i) => `<rect x="${240 - (60 - i * 3)}" y="${232 + i * 9}" width="${120 - i * 6}" height="2.2" rx="1" fill="#ffd36b" style="transform-origin:240px ${233 + i * 9}px;animation:g6Glint ${R(1.2, 2.4)}s ${-R(0, 2)}s ease-in-out infinite"/>`).join('');
  const waves = Array.from({ length: 9 }, (_, i) => `<path d="M0 ${238 + i * 14} q15 -3 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#ff8ad8" stroke-opacity="${.08 + i * .02}" fill="none" style="animation:g6Wave ${4 + i}s linear infinite"/>`).join('');
  w.innerHTML = `<svg viewBox="0 0 480 360" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g6sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0638"/><stop offset=".35" stop-color="#5b1a8c"/><stop offset=".55" stop-color="#d63ea8"/><stop offset=".72" stop-color="#ff7a59"/><stop offset=".86" stop-color="#ffc06a"/></linearGradient>
      <linearGradient id="g6sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".45" stop-color="#ffb13d"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>
      <linearGradient id="g6sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f91"/><stop offset=".25" stop-color="#8e2ca8"/><stop offset="1" stop-color="#14052c"/></linearGradient>
      <radialGradient id="g6glow" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ff3d8b" stop-opacity="0"/></radialGradient>
      <radialGradient id="g6vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient>
      <clipPath id="g6sunclip"><circle cx="240" cy="170" r="78"/></clipPath>
      <filter id="g6blur"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="g6neon"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="480" height="230" fill="url(#g6sky)"/>${stars}
    <ellipse cx="240" cy="176" rx="230" ry="120" fill="url(#g6glow)"/>
    <g style="animation:g6Sun 9s ease-in-out infinite"><g clip-path="url(#g6sunclip)"><rect x="150" y="90" width="180" height="160" fill="url(#g6sun)"/>${sunStripes}</g></g>
    <g filter="url(#g6blur)" opacity=".8">
      <ellipse cx="90" cy="110" rx="70" ry="10" fill="#ff9ccf" style="animation:g6Cloud 70s -10s linear infinite"/>
      <ellipse cx="0" cy="140" rx="90" ry="9" fill="#ffb38a" style="animation:g6Cloud 55s -30s linear infinite"/>
      <ellipse cx="0" cy="82" rx="60" ry="7" fill="#c77dff" style="animation:g6Cloud 85s -50s linear infinite"/></g>
    ${[0, 1].map(k => `<g style="animation:g6Bird ${16 + k * 5}s ${-k * 7}s linear infinite"><g transform="translate(${k * 30} ${120 + k * 12})">${[0, 1, 2].map(j => `<path transform="translate(${j * 14} ${j * 5})" d="M0 0 q5 -5 10 0 q5 -5 10 0" stroke="#2a0d44" stroke-width="1.6" fill="none" style="transform-origin:${j * 14 + 10}px ${j * 5}px;animation:g6Flap .5s ${-j * .15}s infinite"/>`).join('')}</g></g>`).join('')}
    <g style="transform-origin:120px 222px;animation:g6Beam 7s ease-in-out infinite"><polygon points="118,222 122,222 60,40 30,50" fill="#ffffff" opacity=".07"/></g>
    <g style="transform-origin:370px 222px;animation:g6Beam 9s -3s ease-in-out infinite"><polygon points="368,222 372,222 450,40 420,30" fill="#ffffff" opacity=".07"/></g>
    ${sky}${wins}
    <rect x="0" y="221" width="480" height="2" fill="#ff4fd8" filter="url(#g6neon)" opacity=".8"/>
    <rect y="222" width="480" height="138" fill="url(#g6sea)"/>
    <g opacity=".25" transform="translate(0 444) scale(1 -1)">${sky}</g>
    ${glints}${waves}
    <g style="animation:g6Boat 22s linear infinite"><g transform="translate(0 262)"><path d="M0 6 L34 6 L40 0 L6 0 Z" fill="#fff"/><path d="M12 0 L22 -7 L28 0 Z" fill="#3ef0ff"/><path d="M40 4 l60 3 l-60 3 z" fill="#ffffff" opacity=".45"/></g></g>
    <rect y="318" width="480" height="42" fill="#1a0830"/>
    <rect y="318" width="480" height="2" fill="#3ef0ff" filter="url(#g6neon)"/>
    <g opacity=".55">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 44}" y="337" width="22" height="2" fill="#ffd27a"/>`).join('')}</g>
    <g style="animation:g6Car 5.5s linear infinite"><g transform="translate(0 316)">
      <path d="M-70 14 l70 -2 l0 6 z" fill="#ff2d55" opacity=".45" filter="url(#g6neon)"/>
      <path d="M0 12 L6 4 L22 0 L44 0 L56 5 L70 7 L72 14 L0 14 Z" fill="#ff3d8b"/>
      <path d="M24 2 L42 2 L50 6 L20 6 Z" fill="#3ef0ff" opacity=".85"/>
      <rect x="0" y="9" width="3" height="3" fill="#ff2d55" filter="url(#g6neon)"/><path d="M72 10 l60 -6 l0 14 z" fill="#fff7c2" opacity=".35"/>
      <circle cx="16" cy="15" r="4" fill="#0a0410"/><circle cx="58" cy="15" r="4" fill="#0a0410"/>
      <rect x="2" y="16" width="68" height="2" fill="#ff4fd8" filter="url(#g6neon)" opacity=".9"/></g></g>
    ${palm(30, 360, 1.05, false, 6)}${palm(92, 360, .78, true, 7.5)}${palm(450, 360, 1.12, true, 6.8)}${palm(398, 360, .72, false, 8.2)}
    <rect width="480" height="360" fill="url(#g6vig)"/>
  </svg>
  <div style="position:absolute;inset:-20px;opacity:.07;mix-blend-mode:overlay;background:repeating-radial-gradient(circle at 17% 32%,#fff 0 1px,transparent 1px 3px);animation:g6Grain .4s steps(2) infinite"></div>`;
} };
window.BC_CODES.BEFOREGTA6 = { id:240, name:'GTA VI', logo:'bc27/logos/gta6.png' };
})();
