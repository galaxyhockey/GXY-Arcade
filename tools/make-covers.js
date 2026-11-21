// Generates PS2-style portrait covers (135x190mm ratio) into ../covers. Run: node tools/make-covers.js
const fs = require('fs'), path = require('path');
const W = 540, H = 760, TOP = 70, BOT = 680;

const r = (n, a, b) => { let s = n * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280, a + (s / 233280) * (b - a)); };
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

const GAMES = {
  'supermarket-wars': { title: ['SUPERMARKET', 'WARS'], sub: 'EMPIRE + QUICK PLAY', tag: 'Build the biggest grocery chain in the nation.', rating: '10+', c: ['#0b3d24', '#0f9b4a', '#ffd23f'],
    art: () => { const R = r(1, 0, 1);
      return `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(9, i => { const h = 120 + R() * 260, x = i * 62 - 10; return `<rect x="${x}" y="${560 - h}" width="58" height="${h}" fill="#052016"/>${rep(Math.floor(h / 34), j => `<rect x="${x + 10 + (j % 2) * 22}" y="${560 - h + 14 + j * 30}" width="14" height="12" fill="#ffd23f" opacity="${0.3 + R() * 0.6}"/>`)}`; })}
      <rect x="40" y="420" width="460" height="160" rx="6" fill="#0f9b4a" stroke="#ffd23f" stroke-width="5"/>
      <rect x="40" y="420" width="460" height="40" fill="#ffd23f"/><text x="270" y="450" font-family="Arial Black,Impact" font-size="28" text-anchor="middle" fill="#0b3d24">GXY FRESH MARKET</text>
      ${rep(4, i => `<rect x="${70 + i * 110}" y="480" width="80" height="100" fill="#bdf3d1" opacity=".85"/>`)}
      <g transform="translate(300 470) rotate(-8)" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-160 -40 h40 l40 140 h160 l30 -110 h-210"/><circle cx="-60" cy="140" r="16" fill="#fff"/><circle cx="90" cy="140" r="16" fill="#fff"/>
        <path d="M-70 10 h190 M-55 55 h160" stroke-width="6"/></g>
      ${[[90, 160, '$1.99'], [400, 220, '50%'], [150, 300, 'SALE']].map(([x, y, t]) => `<g transform="translate(${x} ${y}) rotate(${x > 200 ? 12 : -14})"><path d="M-50 -24 h80 l24 24 -24 24 h-80z" fill="#ff3d3d" stroke="#fff" stroke-width="3"/><text x="0" y="9" font-family="Arial Black" font-size="24" fill="#fff" text-anchor="middle">${t}</text></g>`).join('')}`; } },


  'tv-battles': { title: ['TV', 'BATTLES'], sub: 'STATION TYCOON', tag: 'Own the airwaves. Win primetime.', rating: '10+', c: ['#140f3a', '#7c3aed', '#f472b6'],
    art: () => { const tv = (x, y, s, col) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-80" y="-60" width="160" height="120" rx="18" fill="#2a2050" stroke="#0b0820" stroke-width="6"/><rect x="-66" y="-46" width="110" height="92" rx="14" fill="${col}"/><circle cx="60" cy="-20" r="7" fill="#f472b6"/><circle cx="60" cy="6" r="7" fill="#a78bfa"/><path d="M-30 -60 l-30 -50 M30 -60 l30 -50" stroke="#ccc" stroke-width="5"/>${rep(6, i => `<rect x="-66" y="${-46 + i * 16}" width="110" height="4" fill="#000" opacity=".15"/>`)}</g>`;
      return `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(5, i => `<circle cx="270" cy="250" r="${80 + i * 70}" fill="none" stroke="#f472b6" stroke-width="4" opacity="${0.5 - i * 0.08}"/>`)}
      ${tv(140, 470, 1.3, '#22d3ee')}${tv(400, 470, 1.3, '#facc15')}${tv(270, 380, 1.6, '#f472b6')}
      <text x="270" y="400" font-family="Arial Black" font-size="34" text-anchor="middle" fill="#140f3a">ON AIR</text>`; } },

  'gxy-tech-empire': { title: ['TECHNOLOGY', 'EMPIRE'], sub: 'GARAGE TO GLOBAL', tag: 'Five eras. One trillion-dollar dream.', rating: '10+', c: ['#0a1430', '#2563eb', '#38bdf8'],
    art: () => { const R = r(4, 0, 1);
      return `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(26, i => { const x = R() * W, y = 100 + R() * 560; return `<path d="M${x} ${y} h${30 + R() * 60} v${30 + R() * 40}" fill="none" stroke="#38bdf8" stroke-width="2" opacity=".35"/><circle cx="${x}" cy="${y}" r="4" fill="#38bdf8" opacity=".6"/>`; })}
      <path d="M200 640 V200 L270 150 L340 200 V640Z" fill="#0f1d44" stroke="#38bdf8" stroke-width="4"/>
      ${rep(12, i => `<rect x="215" y="${215 + i * 35}" width="110" height="16" fill="#38bdf8" opacity="${i % 3 ? 0.7 : 0.25}"/>`)}
      <rect x="60" y="560" width="110" height="80" fill="#1e293b" stroke="#64748b" stroke-width="3"/><path d="M50 560 L115 520 L180 560" fill="#334155"/><rect x="80" y="590" width="70" height="50" fill="#facc15" opacity=".5"/>
      <g transform="translate(420 470) rotate(12)"><rect x="-50" y="-95" width="100" height="190" rx="16" fill="#0b1020" stroke="#e2e8f0" stroke-width="5"/><rect x="-40" y="-80" width="80" height="150" rx="6" fill="url(#hi)"/><circle cy="82" r="6" fill="#e2e8f0"/></g>`; } },

  'neon-siege': { title: ['NEON', 'SIEGE'], sub: 'TOWER DEFENSE', tag: 'Hold the grid. Burn the swarm.', rating: '12+', c: ['#070a24', '#ec4899', '#22d3ee'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      <circle cx="270" cy="330" r="120" fill="#ec4899" opacity=".35"/>
      ${rep(9, i => `<rect x="0" y="${320 - i * 26}" width="${W}" height="${8 - i * 0.8}" fill="#070a24"/>`)}
      ${rep(13, i => `<line x1="270" y1="380" x2="${-500 + i * 128}" y2="680" stroke="#22d3ee" stroke-width="2" opacity=".6"/>`)}
      ${rep(8, i => `<line x1="0" y1="${390 + i * i * 5}" x2="${W}" y2="${390 + i * i * 5}" stroke="#22d3ee" stroke-width="2" opacity=".6"/>`)}
      ${[[120, 560], [420, 560], [270, 470]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M-30 60 L-18 -30 H18 L30 60Z" fill="#1e1b4b" stroke="#ec4899" stroke-width="4"/><circle cy="-40" r="18" fill="#22d3ee"/><line x1="0" y1="-40" x2="${(270 - x) * 0.6 + (x === 270 ? 40 : 0)}" y2="-260" stroke="#22d3ee" stroke-width="5" opacity=".9"/></g>`).join('')}
      ${rep(7, i => `<path transform="translate(${90 + i * 60} ${170 + (i % 3) * 40})" d="M0 -16 L16 0 L0 16 L-16 0Z" fill="#ec4899" stroke="#fff" stroke-width="2"/>`)}` },

  'gxy-hockey': { title: ['GXY', 'HOCKEY'], sub: 'ICE LEGENDS', tag: 'Shootouts, careers and legends on ice.', rating: 'E', c: ['#0b2440', '#0ea5e9', '#e11d48'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      <path d="M0 420 Q270 340 540 420 V680 H0Z" fill="#e0f2fe"/>
      <path d="M0 470 Q270 400 540 470" stroke="#e11d48" stroke-width="8" fill="none"/><path d="M0 560 Q270 500 540 560" stroke="#0ea5e9" stroke-width="6" fill="none"/>
      <g transform="translate(270 400)"><path d="M-110 0 V-110 H110 V0" fill="none" stroke="#e11d48" stroke-width="10"/>${rep(10, i => `<line x1="${-100 + i * 22}" y1="-105" x2="${-100 + i * 22}" y2="0" stroke="#fff" stroke-width="2" opacity=".7"/>`)}${rep(5, i => `<line x1="-105" y1="${-95 + i * 22}" x2="105" y2="${-95 + i * 22}" stroke="#fff" stroke-width="2" opacity=".7"/>`)}</g>
      <g transform="translate(330 560) rotate(-35)"><rect x="-10" y="-260" width="20" height="260" fill="#7c4a1e"/><path d="M-10 0 h120 q14 0 14 18 v8 h-134z" fill="#111"/></g>
      <ellipse cx="200" cy="600" rx="34" ry="12" fill="#111"/><rect x="166" y="588" width="68" height="12" fill="#111"/>
      ${rep(5, i => `<path d="M${240 + i * 6} ${590 - i * 4} q60 -20 140 -${20 + i * 8}" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`)}` },

  'gxy-football': { title: ['YOUFL', 'FOOTBALL'], sub: 'FRANCHISE EDITION', tag: 'Call every down. Build a dynasty.', rating: 'E', c: ['#1a0b0b', '#b91c1c', '#f8fafc'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${[80, 460].map(x => `<rect x="${x - 4}" y="100" width="8" height="260" fill="#333"/><rect x="${x - 50}" y="90" width="100" height="40" fill="#222"/>${rep(8, i => `<circle cx="${x - 40 + (i % 4) * 26}" cy="${102 + Math.floor(i / 4) * 18}" r="7" fill="#fff8d0"/>`)}<path d="M${x} 130 L${x > 270 ? 200 : 340} 680 H${x > 270 ? 540 : 0}Z" fill="#fff8d0" opacity=".1"/>`).join('')}
      <path d="M0 440 L540 440 L540 680 L0 680Z" fill="#166534"/>
      ${rep(7, i => `<line x1="${-60 + i * 110}" y1="680" x2="${100 + i * 57}" y2="440" stroke="#fff" stroke-width="4" opacity=".8"/>`)}
      <g transform="translate(270 360) rotate(-25)"><ellipse rx="140" ry="80" fill="#7c2d12" stroke="#3b1406" stroke-width="6"/><path d="M-110 -30 q-20 30 0 60 M110 -30 q20 30 0 60" stroke="#fff" stroke-width="8" fill="none"/><line x1="-60" x2="60" stroke="#fff" stroke-width="6"/>${rep(6, i => `<line x1="${-45 + i * 18}" y1="-14" x2="${-45 + i * 18}" y2="14" stroke="#fff" stroke-width="5"/>`)}</g>` },

  'gxy-daily': { title: ['DAILY', 'WORD'], sub: 'ONE PUZZLE A DAY', tag: 'Six guesses. Keep the streak alive.', rating: 'E', c: ['#2a1206', '#f59e0b', '#22c55e'],
    art: () => { const rows = ['BIKES', 'CRAFT', 'BLOCK', 'WORLD']; const col = ['#3f3f46', '#f59e0b', '#22c55e'];
      return `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      <g transform="translate(270 400) rotate(-6)">${rows.map((w, j) => [...w].map((ch, i) => { const c = j === 3 ? 2 : (i * 7 + j * 3) % 3; return `<g transform="translate(${(i - 2) * 86} ${(j - 1.5) * 86})"><rect x="-38" y="-38" width="76" height="76" rx="8" fill="${col[c]}" stroke="#fff" stroke-width="3"/><text y="18" font-family="Arial Black" font-size="48" fill="#fff" text-anchor="middle">${ch}</text></g>`; }).join('')).join('')}</g>`; } },
  "price-guess": { title: ["PRICE", "GUESS"], sub: "REAL STORE PRICES", tag: "Real shelves. Real tags. How close can you get?", rating: "E", c: ["#05230f", "#22c55e", "#facc15"],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(4, j => `<rect x="40" y="${190 + j * 120}" width="460" height="12" fill="#14532d"/>` + rep(6, i => `<rect x="${60 + i * 72}" y="${120 + j * 120 + (i % 2) * 14}" width="56" height="${70 - (i % 2) * 14}" rx="6" fill="${["#ef4444","#3b82f6","#f59e0b","#a855f7","#22c55e","#ec4899"][(i + j) % 6]}" opacity=".85"/>`))}
      <g transform="translate(270 430) rotate(-8)"><path d="M-150 -70 H120 L170 0 L120 70 H-150Z" fill="#facc15" stroke="#fff" stroke-width="6"/><circle cx="125" cy="0" r="14" fill="#05230f"/><text x="-20" y="30" font-family="Arial Black" font-size="86" fill="#05230f" text-anchor="middle">$?.??</text></g>` },
  'trivia': { title: ['GXY', 'TRIVIA'], sub: 'TV TRIVIA', tag: 'Pass the phone. Prove you know your shows.', rating: 'T', c: ['#1c0b02', '#f97316', '#facc15'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(14, i => `<line x1="270" y1="380" x2="${-200 + i * 70}" y2="${i % 2 ? 680 : 70}" stroke="#facc15" stroke-width="3" opacity=".18"/>`)}
      <g transform="translate(270 430) scale(.72)"><rect x="-190" y="-150" width="380" height="270" rx="34" fill="#111827" stroke="#f97316" stroke-width="10"/>
        <rect x="-160" y="-120" width="320" height="210" rx="18" fill="#1e3a8a"/>
        <text y="40" font-family="Arial Black" font-size="170" fill="#facc15" text-anchor="middle">?</text>
        <line x1="-70" y1="-150" x2="-130" y2="-230" stroke="#f97316" stroke-width="8"/><line x1="70" y1="-150" x2="130" y2="-230" stroke="#f97316" stroke-width="8"/>
        <rect x="-120" y="120" width="30" height="40" fill="#111827"/><rect x="90" y="120" width="30" height="40" fill="#111827"/></g>
      ${['A', 'B', 'C', 'D'].map((l, i) => `<g transform="translate(${105 + i * 110} 590) scale(.8)"><circle r="38" fill="${['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i]}" stroke="#fff" stroke-width="4"/><text y="17" font-family="Arial Black" font-size="46" fill="#fff" text-anchor="middle">${l}</text></g>`).join('')}` },
  'transit-tycoon': { title: ['TRANSIT', 'TYCOON'], sub: 'SUBWAYS AND BUSES', tag: 'Draw the lines. Beat the rush.', rating: 'E', c: ['#04201f', '#14b8a6', '#facc15'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(9, i => `<rect x="${20 + i * 58}" y="${300 - (i % 3) * 40 - (i % 2) * 30}" width="46" height="${380 + (i % 3) * 40}" fill="#0b2b2a" stroke="#14b8a6" stroke-opacity=".35"/>` + rep(6, j => `<rect x="${28 + i * 58}" y="${320 - (i % 3) * 40 - (i % 2) * 30 + j * 26}" width="30" height="10" fill="#facc15" opacity="${(i + j) % 3 ? .55 : .15}"/>`))}
      <path d="M40 520 C160 440 260 600 400 470 S520 430 540 440" stroke="#ef4444" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M0 600 C120 560 220 520 300 560 S460 640 540 560" stroke="#3b82f6" stroke-width="16" fill="none" stroke-linecap="round"/>
      ${[[120,478],[300,515],[440,452],[90,580],[300,560],[470,610]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="14" fill="#fff" stroke="#111" stroke-width="5"/>`).join('')}
      <g transform="translate(200 610)"><rect x="-90" y="-40" width="180" height="60" rx="16" fill="#e2e8f0"/><rect x="-80" y="-30" width="40" height="22" rx="4" fill="#0f172a"/><rect x="-30" y="-30" width="40" height="22" rx="4" fill="#0f172a"/><rect x="20" y="-30" width="40" height="22" rx="4" fill="#0f172a"/><rect x="-90" y="2" width="180" height="8" fill="#14b8a6"/><circle cx="-55" cy="22" r="10" fill="#111"/><circle cx="55" cy="22" r="10" fill="#111"/></g>` },

  'airport-empire': { title: ['AIRPORT', 'EMPIRE'], sub: 'BUILD THE HUB', tag: 'Runways, gates, weather and rivals.', rating: 'E', c: ['#06142e', '#38bdf8', '#f8fafc'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      <circle cx="420" cy="230" r="70" fill="#fde68a" opacity=".5"/>
      <path d="M0 560 L540 470 L540 680 L0 680Z" fill="#1f2937"/>
      ${rep(8, i => `<path d="M${20 + i * 66} ${555 - i * 11} l40 -7" stroke="#f8fafc" stroke-width="6"/>`)}
      <rect x="40" y="590" width="300" height="70" rx="10" fill="#cbd5e1"/>${rep(7, i => `<rect x="${55 + i * 40}" y="605" width="24" height="30" fill="#0f172a" opacity=".75"/>`)}
      <rect x="440" y="470" width="22" height="150" fill="#e2e8f0"/><rect x="420" y="440" width="62" height="36" rx="6" fill="#38bdf8"/>
      <g transform="translate(250 320) rotate(-18) scale(5)"><path d="M-16 0 L14 0 L18 2 L14 4 L-16 4 Z" fill="#f8fafc"/><path d="M-2 2 L-10 -10 L-5 -10 L6 2 Z M-2 2 L-10 14 L-5 14 L6 2 Z" fill="#38bdf8"/><path d="M-16 2 L-20 -5 L-16 -5 L-12 2Z" fill="#ef4444"/></g>
      ${rep(5, i => `<path d="M${40 + i * 30} ${380 + i * 8} l-60 18" stroke="#fff" stroke-opacity=".35" stroke-width="3"/>`)}` },
  'brand-clicker-27': { title: ['BRAND', "CLICKER '27"], sub: 'COLLECTOR’S REVIVAL', tag: 'Tap. Unbox. Collect every brand.', rating: 'E', c: ['#1a0f02', '#facc15', '#ec4899'],
    art: () => `<rect y="${TOP}" width="${W}" height="610" fill="url(#sky)"/>
      ${rep(5, i => `<g transform="translate(${90 + i * 90} ${300 + (i % 2) * 40}) rotate(${-14 + i * 7})"><rect x="-55" y="-72" width="110" height="144" rx="10" fill="${['#94a3b8','#22c55e','#3b82f6','#a855f7','#f59e0b'][i]}" stroke="#fff" stroke-width="4"/><rect x="-45" y="-60" width="90" height="70" rx="6" fill="#0f172a"/><text y="48" font-family="Arial Black" font-size="16" fill="#fff" text-anchor="middle">${['STARTER','UNCOMMON','RARE','EPIC','LEGEND'][i]}</text></g>`)}
      <g transform="translate(270 560)"><circle r="70" fill="#facc15" stroke="#fff" stroke-width="6"/><path d="M-14 -36 L22 10 L4 10 L18 40 L6 46 L-8 16 L-22 30 Z" fill="#1a0f02"/></g>
      ${rep(8, i => `<text x="${40 + i * 62}" y="${190 + (i % 3) * 18}" font-size="22">✨</text>`)}` },
};

const svg = (id, g) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.c[0]}"/><stop offset="1" stop-color="${g.c[1]}"/></linearGradient>
 <linearGradient id="hi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.c[2]}"/><stop offset="1" stop-color="${g.c[1]}"/></linearGradient>
 <linearGradient id="band" x1="0" x2="1"><stop offset="0" stop-color="#05060c"/><stop offset=".6" stop-color="#101426"/><stop offset="1" stop-color="#1d3a8a"/></linearGradient>
 <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <filter id="sh"><feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity=".7"/></filter>
</defs>
${g.art()}
<rect y="${TOP}" width="${W}" height="200" fill="#000" opacity=".25"/>
<g filter="url(#sh)" font-family="Impact,'Arial Black',sans-serif" text-anchor="middle">
 <text x="270" y="${TOP + 80}" font-size="${g.title[0].length > 8 ? 62 : 78}" fill="#fff" stroke="${g.c[0]}" stroke-width="3" letter-spacing="2">${g.title[0]}</text>
 <text x="270" y="${TOP + 170}" font-size="${g.title[1].length > 8 ? 84 : 104}" fill="${g.c[2]}" stroke="#000" stroke-width="4" letter-spacing="3">${g.title[1]}</text>
 <rect x="${270 - g.sub.length * 9}" y="${TOP + 188}" width="${g.sub.length * 18}" height="32" fill="${g.c[0]}" stroke="${g.c[2]}" stroke-width="2"/>
 <text x="270" y="${TOP + 212}" font-family="Arial,sans-serif" font-weight="700" font-size="18" fill="#fff" letter-spacing="3">${g.sub}</text>
</g>
<text x="270" y="${BOT - 18}" font-family="Arial,sans-serif" font-style="italic" font-weight="700" font-size="20" fill="#fff" text-anchor="middle" filter="url(#sh)">${g.tag}</text>
<rect width="${W}" height="${TOP}" fill="url(#band)"/>
<text x="22" y="46" font-family="Arial Black,sans-serif" font-size="30" fill="#fff" font-style="italic">GXY<tspan fill="#3b82f6">ARCADE</tspan></text>
<text x="${W - 22}" y="44" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#c7d2fe" text-anchor="end" letter-spacing="2">WEB EDITION</text>
<rect y="${BOT}" width="${W}" height="${H - BOT}" fill="#05060c"/>
<g transform="translate(22 ${BOT + 10})"><rect width="54" height="62" fill="#fff"/><rect x="3" y="3" width="48" height="40" fill="#000"/><text x="27" y="34" font-family="Arial Black" font-size="${g.rating.length > 1 ? 20 : 30}" fill="#fff" text-anchor="middle">${g.rating}</text><text x="27" y="56" font-family="Arial" font-weight="700" font-size="10" text-anchor="middle">AGES</text></g>
<text x="270" y="${BOT + 38}" font-family="Arial Black,sans-serif" font-size="18" fill="#fff" text-anchor="middle" letter-spacing="1">BIKING PEOPLE WORLD</text>
<text x="270" y="${BOT + 60}" font-family="Arial,sans-serif" font-size="12" fill="#9aa0c3" text-anchor="middle" letter-spacing="3">GXY STUDIOS</text>
<g transform="translate(${W - 110} ${BOT + 14})"><rect width="88" height="52" fill="#fff"/>${rep(22, i => `<rect x="${6 + i * 3.5}" y="6" width="${i % 3 ? 1.5 : 2.5}" height="34" fill="#000"/>`)}<text x="44" y="49" font-family="monospace" font-size="8" text-anchor="middle">GXY-${id.length}${id.charCodeAt(0)}</text></g>
<rect width="${W}" height="${H}" fill="url(#gloss)"/>
<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="#000" stroke-width="3"/>
</svg>`;

const out = path.join(__dirname, '..', 'covers');
for (const [id, g] of Object.entries(GAMES)) fs.writeFileSync(path.join(out, id + '.svg'), svg(id, g));
console.log('wrote', Object.keys(GAMES).length, 'covers');
