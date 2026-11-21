// Back in the 2000s: The Game — engine (renderer, player, cameras, collisions, NPCs, text boxes, cutscenes, HUD)
import * as THREE from 'three';
export { THREE };
const $ = id => document.getElementById(id);
export const G = { flags:{}, colliders:[], platforms:[], ramps:[], inter:[], npcs:[], ticks:[], blips:[], mapShapes:[], keys:{}, camMode:'tp', ctl:true, paused:false, filter:false, t:0 };

// ---------- renderer / scene ----------
const canvas = $('c');
const R = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 1)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); G.scene = scene; G.R = R; G.skyU = null;
const cam = new THREE.PerspectiveCamera(62, 1, .1, 420); G.cam = cam;
function resize(){ R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a4a30, .75); scene.add(hemi); G.hemi = hemi;
const sun = new THREE.DirectionalLight(0xfff1d6, 1.6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left:-45, right:45, top:45, bottom:-45, near:1, far:240 }); sun.shadow.autoUpdate = false; // re-rendered every 3rd frame (biggest per-frame cost around Schnucks) sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
scene.add(sun, sun.target); G.sun = sun;
const skyU = G.skyU = { top:{ value:new THREE.Color(0x3d7fd8) }, bot:{ value:new THREE.Color(0xcfe6ff) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(390, 24, 12), new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, uniforms:skyU,
  vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 p;void main(){float h=clamp(p.y*1.6+.12,0.,1.);gl_FragColor=vec4(mix(bot,top,h),1.);}' }));
scene.add(sky); scene.fog = new THREE.Fog(0xcfe6ff, 70, 330);
const TIMES = {
  day:{ top:0x3d7fd8, bot:0xd8ecff, fog:0xcfe6ff, sun:0xfff1d6, si:1.7, hi:.85, dir:[70, 100, 6] },
  after:{ top:0x4a86d6, bot:0xffe2b8, fog:0xf0dcc0, sun:0xffd9a0, si:1.5, hi:.75, dir:[-70, 65, 6] },
  dusk:{ top:0x2a2a6a, bot:0xff9a6a, fog:0xc98a7a, sun:0xff9a5a, si:1.0, hi:.55, dir:[-80, 22, 10] },
  night:{ top:0x0a1030, bot:0x2a3a6a, fog:0x1a2448, sun:0xa8b8ff, si:.7, hi:.7, dir:[40, 80, -30] },
  indoor:{ top:0x3d7fd8, bot:0xd8ecff, fog:0xcfe6ff, sun:0xfff1d6, si:1.2, hi:.95, dir:[60, 90, 40] } };
export function setTime(k){ const t = TIMES[k]; G.time = k; skyU.top.value.set(t.top); skyU.bot.value.set(t.bot); scene.fog.color.set(t.fog);
  sun.color.set(t.sun); sun.intensity = t.si; hemi.intensity = t.hi; G.sunDir = new THREE.Vector3(...t.dir).normalize();
  G.lamps && G.lamps.forEach(l => l.visible = k === 'night' || k === 'dusk'); G.onTime && G.onTime(k); }
setTime('day');

// ---------- canvas textures ----------
const texCache = {};
export function tex(key, draw, w = 128, h = 128, rep = [1, 1]){
  if(!texCache[key]){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texCache[key] = t; }
  const t = texCache[key].clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]); return t; }
export const noise = (g, w, h, base, amt, n = 1800) => { g.fillStyle = base; g.fillRect(0, 0, w, h);
  for(let i = 0; i < n; i++){ const v = (Math.random() - .5) * amt; g.fillStyle = `rgba(${v > 0 ? '255,255,255' : '0,0,0'},${Math.abs(v)})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } };
const matCache = {};
export function mat(c, o = {}){ const k = c + JSON.stringify(o); if(!o.map && matCache[k]) return matCache[k];
  const m = new THREE.MeshLambertMaterial({ color:c, ...o }); if(!o.map) matCache[k] = m; return m; }
export function txMat(key, draw, rep, o = {}, w, h){ return new THREE.MeshLambertMaterial({ map:tex(key, draw, w, h, rep), ...o }); }
export function label(text, o = {}){ // canvas sign texture
  const w = o.w || 512, h = o.h || 128, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = o.bg || '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = o.fg || '#111'; g.font = `${o.weight || 'bold'} ${o.size || 64}px ${o.font || 'Arial'}`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; if(o.italic) g.font = 'italic ' + g.font;
  (Array.isArray(text) ? text : [text]).forEach((t, i, a) => g.fillText(t, w / 2, h / 2 + (i - (a.length - 1) / 2) * (o.size || 64) * 1.1));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// ---------- geometry helpers ----------
// box(w,h,d, material, x, yBottom, z, {col, ry, cast, y1}) — adds a collider (axis aligned) unless col:false
export function box(w, h, d, m, x, y, z, o = {}){
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y + h / 2, z);
  if(o.ry) me.rotation.y = o.ry; me.castShadow = o.cast !== false; me.receiveShadow = true; (o.parent || scene).add(me);
  if(o.col !== false){ const sw = o.ry && Math.abs(Math.sin(o.ry)) > .5; const hw = (sw ? d : w) / 2, hd = (sw ? w : d) / 2;
    const c = { x0:x - hw, x1:x + hw, z0:z - hd, z1:z + hd, y0:y, y1:y + h, mesh:me }; G.colliders.push(c); me.userData.col = c; }
  return me; }
export function plane(w, d, m, x, y, z, o = {}){ const me = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); me.rotation.x = -Math.PI / 2;
  me.position.set(x, y, z); if(o.ry) me.rotation.z = o.ry; me.receiveShadow = true; (o.parent || scene).add(me); return me; }
export function floor(x0, z0, x1, z1, y, m, o = {}){ G.platforms.push({ x0, z0, x1, z1, y }); if(m) plane(x1 - x0, z1 - z0, m, (x0 + x1) / 2, y + .01, (z0 + z1) / 2); if(o.slab) box(x1 - x0, .25, z1 - z0, o.slab, (x0 + x1) / 2, y - .25, (z0 + z1) / 2, { col:false }); }
export function ramp(x0, z0, x1, z1, axis, ya, yb){ G.ramps.push({ x0, z0, x1, z1, axis, ya, yb }); }
export function removeCol(c){ const i = G.colliders.indexOf(c); if(i >= 0) G.colliders.splice(i, 1); }
export function cyl(r, h, m, x, y, z, seg = 12, rt){ const me = new THREE.Mesh(new THREE.CylinderGeometry(rt ?? r, r, h, seg), m); me.position.set(x, y + h / 2, z); me.castShadow = true; me.receiveShadow = true; scene.add(me); return me; }
export function mapRect(x0, z0, x1, z1, c){ G.mapShapes.push({ x0, z0, x1, z1, c }); }

export function groundAt(x, z, y){
  let best = 0;
  for(const p of G.platforms) if(x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && p.y <= y + .7 && p.y > best) best = p.y;
  for(const r of G.ramps) if(x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1){
    const t = r.axis === 'x' ? (x - r.x0) / (r.x1 - r.x0) : (z - r.z0) / (r.z1 - r.z0), h = r.ya + (r.yb - r.ya) * t;
    if(h <= y + .9 && h > best) best = h; }
  return best; }
function collide(p, rad){
  for(const c of G.colliders){ if(c.off || p.y + 1.5 < c.y0 || p.y > c.y1 - .35) continue;
    const cx = Math.max(c.x0, Math.min(p.x, c.x1)), cz = Math.max(c.z0, Math.min(p.z, c.z1)), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if(d2 < rad * rad){ if(d2 > 1e-6){ const d = Math.sqrt(d2), k = (rad - d) / d; p.x += dx * k; p.z += dz * k; }
      else { const o = [p.x - c.x0, c.x1 - p.x, p.z - c.z0, c.z1 - p.z], m = Math.min(...o);
        if(m === o[0]) p.x = c.x0 - rad; else if(m === o[1]) p.x = c.x1 + rad; else if(m === o[2]) p.z = c.z0 - rad; else p.z = c.z1 + rad; } } } }

// ---------- characters ----------
const faceTex = {};
function face(skin, o){ const k = skin + (o.glasses ? 'g' : '') + (o.beard || '') + (o.lips || '');
  if(!faceTex[k]){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = skin; g.fillRect(0, 0, 64, 64); g.fillStyle = '#1a1a1a'; g.fillRect(17, 26, 7, 8); g.fillRect(40, 26, 7, 8);
    g.fillStyle = '#fff'; g.fillRect(18, 27, 3, 3); g.fillRect(41, 27, 3, 3); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(16, 21, 10, 2); g.fillRect(38, 21, 10, 2);
    g.fillStyle = o.lips || '#8a4a3a'; g.fillRect(24, 46, 16, 3);
    if(o.glasses){ g.strokeStyle = '#222'; g.lineWidth = 2; g.strokeRect(13, 23, 15, 13); g.strokeRect(36, 23, 15, 13); g.beginPath(); g.moveTo(28, 28); g.lineTo(36, 28); g.stroke(); }
    if(o.beard){ g.fillStyle = o.beard; g.fillRect(12, 42, 40, 22); g.fillStyle = o.lips || '#8a4a3a'; g.fillRect(24, 46, 16, 3); }
    faceTex[k] = new THREE.CanvasTexture(c); faceTex[k].colorSpace = THREE.SRGBColorSpace; faceTex[k].magFilter = THREE.NearestFilter; }
  return faceTex[k]; }
// ---------- early-2000s wardrobe ----------
// hairStyle: short | spiky (frosted tips) | curtains (middle part) | buzz | shaggy (skater) | cornrows | afro | sideswept | long | pony | bun | pigtails | bald
// top: tee | graphic | jersey | hoodie | polo (popped collar) | track (jacket stripes) | flannel | tank | babytee
// bottom: jeans | baggy | cargo | shorts (cargo shorts) | track | flare | skirt ; hat: cap | capback | trucker | beanie | bandana ; chain: puka | silver
export const WARDROBE = {
  hairStyle:['short', 'spiky', 'curtains', 'buzz', 'shaggy', 'cornrows', 'afro', 'sideswept', 'long', 'pony', 'bun', 'pigtails', 'bald'],
  top:['tee', 'graphic', 'jersey', 'hoodie', 'polo', 'track', 'flannel', 'tank', 'babytee'], bottom:['jeans', 'baggy', 'cargo', 'shorts', 'track', 'flare', 'skirt'],
  hat:['', 'cap', 'capback', 'trucker', 'beanie', 'bandana'], chain:['', 'puka', 'silver'] };
const shirtTexCache = {};
function shirtTex(kind, color, print){ const k = kind + color + print; if(shirtTexCache[k]) return shirtTexCache[k];
  const c = document.createElement('canvas'); c.width = 64; c.height = 76; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 64, 76);
  const lt = new THREE.Color(color).getHSL({}).l > .55, ink = lt ? '#1a1a1a' : '#f4f1ea';
  if(kind === 'flannel'){ g.globalAlpha = .35; g.fillStyle = '#111'; for(let i = 0; i < 64; i += 16){ g.fillRect(i, 0, 6, 76); g.fillRect(0, i + 4, 64, 6); } g.globalAlpha = 1; }
  if(kind === 'graphic'){ g.fillStyle = ink; g.beginPath(); g.arc(32, 32, 14, 0, 7); g.fill(); g.fillStyle = color; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText(print || 'XTRM', 32, 37); }
  if(kind === 'jersey' && print){ g.fillStyle = ink; g.font = 'bold 30px Arial Black'; g.textAlign = 'center'; g.fillText(print, 32, 50); }
  if(kind === 'polo'){ g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(28, 0, 8, 22); }
  if(kind === 'track'){ g.fillStyle = '#f4f4f0'; g.fillRect(30, 0, 4, 76); }
  if(kind === 'hoodie'){ g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(14, 50, 36, 16); g.fillStyle = ink; g.fillRect(26, 6, 2, 18); g.fillRect(36, 6, 2, 18); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return shirtTexCache[k] = new THREE.MeshLambertMaterial({ map:t }); }
export function makePerson(o = {}){
  const skin = o.skin || '#e8b896', g = new THREE.Group(), sk = mat(skin), sh = mat(o.shirt || '#3a6ea5'), pa = mat(o.pants || '#2b3550'), sho = mat(o.shoes || '#222');
  const s = o.scale || 1, wide = (o.wide || 1) * (o.thin ? .88 : 1), top = o.top || 'tee', bot = o.bottom || 'jeans', hs = o.hairStyle || (o.long ? 'long' : 'short');
  const legW = bot === 'baggy' ? .25 : bot === 'flare' ? .22 : .2;
  const leg = side => { const p = new THREE.Group(); p.position.set(side * .13 * wide, .9, 0); const parts = [];
    if(bot === 'shorts'){ const u = new THREE.Mesh(new THREE.BoxGeometry(.23 * wide, .5, .24), pa); u.position.y = -.25; const d = new THREE.Mesh(new THREE.BoxGeometry(.15, .34, .15), sk); d.position.y = -.65; parts.push(u, d); }
    else { const l = new THREE.Mesh(new THREE.BoxGeometry(legW * wide, bot === 'baggy' ? .86 : .82, legW + .02), pa); l.position.y = bot === 'baggy' ? -.45 : -.41; parts.push(l);
      if(bot === 'flare'){ const fl = new THREE.Mesh(new THREE.BoxGeometry(.27 * wide, .16, .28), pa); fl.position.y = -.76; parts.push(fl); }
      if(bot === 'track'){ const st = new THREE.Mesh(new THREE.BoxGeometry(.02, .8, .05), mat('#f4f4f0')); st.position.set(side * (legW * wide / 2 + .005), -.41, 0); parts.push(st); } }
    if(bot === 'cargo' || bot === 'shorts'){ const pk = new THREE.Mesh(new THREE.BoxGeometry(.04, .14, .14), pa); pk.position.set(side * (.12 * wide), -.36, 0); parts.push(pk); }
    const f = new THREE.Mesh(new THREE.BoxGeometry(.23 * wide, .12, .34), sho); f.position.set(0, -.86, .05); parts.push(f);
    p.add(...parts); parts.forEach(m => m.castShadow = true); return p; };
  const sleeveSk = o.sleeve === 'short' || ['tee', 'graphic', 'polo', 'babytee'].includes(top) && o.sleeve !== 'long', bare = top === 'jersey' || top === 'tank';
  const arm = side => { const p = new THREE.Group(); p.position.set(side * (.32 * wide + .03), 1.5, 0);
    const a = new THREE.Mesh(new THREE.BoxGeometry(.15, .38, .17), bare ? sk : sh); a.position.y = -.19; const el = new THREE.Group(); el.position.y = -.38; const fa = new THREE.Mesh(new THREE.BoxGeometry(.13, .38, .14), sleeveSk || bare ? sk : sh); fa.position.y = -.17;
    const h = new THREE.Mesh(new THREE.BoxGeometry(.13, .13, .13), sk); h.position.y = -.41; el.add(fa, h); p.add(a, el); p.userData.el = el; [a, fa].forEach(m => m.castShadow = true);
    if(top === 'track'){ const st = new THREE.Mesh(new THREE.BoxGeometry(.02, .74, .05), mat('#f4f4f0')); st.position.set(side * .08, -.37, 0); p.add(st); } return p; };
  const lL = leg(-1), lR = leg(1), aL = arm(-1), aR = arm(1);
  const tw = .54 * wide, tz = .3 * Math.max(1, wide * .9), fm = ['graphic', 'jersey', 'polo', 'track', 'hoodie', 'flannel'].includes(top) ? shirtTex(top, o.shirt || '#3a6ea5', o.print) : sh;
  const torsoH = top === 'babytee' ? .5 : .64, torso = new THREE.Mesh(new THREE.BoxGeometry(tw, torsoH, tz), [sh, sh, sh, sh, fm, top === 'jersey' ? fm : sh]); torso.position.y = 1.22 + (.64 - torsoH) / 2; torso.castShadow = true;
  const extra = [];
  if(top === 'babytee'){ const mid = new THREE.Mesh(new THREE.BoxGeometry(tw * .96, .14, tz * .96), sk); mid.position.y = 0.97; extra.push(mid); }
  if(top === 'hoodie'){ const hood = new THREE.Mesh(new THREE.BoxGeometry(.4, .22, .12), sh); hood.position.set(0, 1.52, -.17); extra.push(hood); }
  if(top === 'polo'){ const col = new THREE.Mesh(new THREE.BoxGeometry(.3, .1, .2), o.collar ? mat(o.collar) : sh); col.position.set(0, 1.58, 0); extra.push(col); }
  if(top === 'jersey' || top === 'tank'){ [-1, 1].forEach(sd => { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .1, tz), sk); b.position.set(sd * (tw / 2 - .03), 1.5, 0); extra.push(b); }); }
  if(bot === 'skirt'){ const sk2 = new THREE.Mesh(new THREE.BoxGeometry(.56 * wide, .34, .34), pa); sk2.position.y = .78; extra.push(sk2); }
  if(o.chain){ const ch = new THREE.Mesh(new THREE.TorusGeometry(.12, .018, 4, 14), mat(o.chain === 'puka' ? '#f4efe0' : '#c9ccd0')); ch.position.set(0, 1.5, .1); ch.rotation.x = 1.2; extra.push(ch); }
  const neck = new THREE.Mesh(new THREE.BoxGeometry(.14, .08, .14), sk); neck.position.y = 1.57;
  const head = new THREE.Group(); head.position.y = 1.62;
  const hm = [sk, sk, sk, sk, new THREE.MeshLambertMaterial({ map:face(skin, o) }), sk];
  const hd = new THREE.Mesh(new THREE.BoxGeometry(.36, .38, .34), hm); hd.position.y = .2; hd.castShadow = true; head.add(hd);
  const hc = mat(o.hair || '#3a2414'), H = (w, h, d, x, y, z, m = hc, rx = 0, rz = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); head.add(b); return b; };
  if(o.hair !== 'none' && hs !== 'bald'){
    if(hs === 'buzz') H(.37, .05, .35, 0, .405, 0, mat(new THREE.Color(o.hair || '#3a2414').offsetHSL(0, -.1, .05).getStyle()));
    else if(hs === 'afro'){ H(.5, .32, .48, 0, .48, -.02); }
    else { H(.38, .12, .36, 0, .42, 0); H(.38, ['long', 'pony', 'pigtails'].includes(hs) ? .5 : hs === 'shaggy' ? .36 : .26, .08, 0, ['long', 'pony', 'pigtails'].includes(hs) ? .17 : hs === 'shaggy' ? .22 : .28, -.15); }
    if(hs === 'spiky'){ const tip = mat(o.tips || '#f0dc9a'); for(let i = 0; i < 7; i++){ const sp = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 4), i % 2 ? tip : hc); sp.position.set(-.15 + i * .05, .53, -.05 + (i % 3) * .06); sp.rotation.x = -.25; head.add(sp); } }
    if(hs === 'curtains'){ H(.17, .06, .05, -.09, .37, .17, hc, 0, .35); H(.17, .06, .05, .09, .37, .17, hc, 0, -.35); }
    if(hs === 'shaggy'){ H(.38, .1, .06, 0, .36, .17); [-1, 1].forEach(sd => H(.05, .22, .3, sd * .19, .3, -.02)); }
    if(hs === 'sideswept'){ H(.26, .1, .05, .05, .33, .17, hc, 0, -.25); }
    if(hs === 'cornrows'){ for(let i = 0; i < 5; i++) H(.03, .03, .34, -.14 + i * .07, .485, 0, mat('#111')); }
    if(hs === 'long' || hs === 'pigtails'){ [-1, 1].forEach(sd => H(.06, .42, .3, sd * .19, .2, -.02)); }
    if(hs === 'pony'){ H(.1, .3, .1, 0, .2, -.24); }
    if(hs === 'bun'){ const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), hc); b.position.set(0, .5, -.16); head.add(b); }
    if(hs === 'pigtails'){ [-1, 1].forEach(sd => H(.08, .26, .08, sd * .24, .12, -.05)); } }
  const hat = o.hat || (o.cap ? 'cap' : ''), hm3 = mat(o.cap || o.hatColor || '#1d1d1d');
  if(hat === 'cap' || hat === 'capback' || hat === 'trucker'){ H(.4, .12, .38, 0, .45, 0, hm3); H(.34, .04, .2, 0, .41, hat === 'capback' ? -.27 : .27, hm3);
    if(hat === 'trucker'){ H(.41, .1, .3, 0, .46, -.05, mat('#f4f4f0')); } }
  if(hat === 'beanie'){ H(.4, .18, .38, 0, .44, 0, hm3); H(.41, .05, .39, 0, .36, 0, mat(new THREE.Color(o.cap || o.hatColor || '#1d1d1d').offsetHSL(0, 0, .1).getStyle())); }
  if(hat === 'bandana'){ H(.39, .08, .37, 0, .43, 0, mat(o.hatColor || '#2a3a8a')); }
  if(o.vest){ const v = new THREE.Mesh(new THREE.BoxGeometry(.56 * wide, .5, .32 * Math.max(1, wide * .9)), mat(o.vest)); v.position.y = 1.2; g.add(v); }
  g.add(lL, lR, aL, aR, torso, neck, head, ...extra); g.scale.setScalar(s);
  g.userData = { lL, lR, aL, aR, head, torso, phase:0, seed:Math.random() * 6, look:o }; return g; }
export function makeDog(color = '#c9a26b', o = {}){
  const g = new THREE.Group(), m = mat(color), d = mat(o.dark || '#3a2a1a'), s = o.size || 1;
  const body = new THREE.Mesh(new THREE.BoxGeometry(.3, .26, .6), m); body.position.y = .38; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(.24, .22, .24), m); head.position.set(0, .55, .38);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(.13, .1, .14), d); snout.position.set(0, .5, .54);
  const ears = [-1, 1].map(sd => { const e = new THREE.Mesh(new THREE.BoxGeometry(.06, .12, .06), d); e.position.set(sd * .09, .7, .36); return e; });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .22), m); tail.position.set(0, .48, -.36); tail.rotation.x = .6;
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b]) => { const p = new THREE.Group(); p.position.set(a * .1, .28, b * .22); const l = new THREE.Mesh(new THREE.BoxGeometry(.07, .28, .07), m); l.position.y = -.14; p.add(l); return p; });
  g.add(body, head, snout, ...ears, tail, ...legs); g.scale.setScalar(s); g.userData = { dog:true, legs, tail, phase:0 }; return g; }
export function makeCar(color = '#b23', o = {}){
  const g = new THREE.Group(), m = mat(color), gl = mat('#9fc6e6', { emissive:0x111a22 }), dk = mat('#151515'), L = o.suv ? 4.7 : 4.3, H = o.suv ? .95 : .7;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, H, L), m); body.position.y = .35 + H / 2; body.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, o.suv ? .8 : .62, o.suv ? 3 : 2.1), m); cab.position.set(0, .35 + H + (o.suv ? .4 : .31), o.suv ? -.4 : -.15); cab.castShadow = true;
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.72, o.suv ? .58 : .44, o.suv ? 2.9 : 2), gl); win.position.copy(cab.position); win.position.y += .04;
  g.add(body, cab, win);
  [[-.9, 1.4], [.9, 1.4], [-.9, -1.4], [.9, -1.4]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .26, 12), dk); w.rotation.z = Math.PI / 2; w.position.set(x, .36, z * (L / 4.3)); g.add(w); });
  [-.6, .6].forEach(x => { const hl = new THREE.Mesh(new THREE.BoxGeometry(.32, .14, .04), mat('#fff8d0', { emissive:0x777755 })); hl.position.set(x, .62, L / 2 + .01);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(.3, .12, .04), mat('#c00', { emissive:0x550000 })); tl.position.set(x, .66, -L / 2 - .01); g.add(hl, tl); });
  mergeChildren(g); g.userData.len = L; return g; }
function mergeChildren(g){ const by = new Map(); g.children.slice().forEach(c => { if(!c.isMesh || Array.isArray(c.material)) return; const k = c.material.uuid; if(!by.has(k)) by.set(k, []); by.get(k).push(c); });
  for(const list of by.values()){ if(list.length < 2) continue; const geos = list.map(c => { const gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); c.updateMatrix(); gg.applyMatrix4(c.matrix); for(const a of Object.keys(gg.attributes)) if(!['position', 'normal', 'uv'].includes(a)) gg.deleteAttribute(a); gg.clearGroups(); return gg; });
    const m = mergeGeometries(geos, false); if(!m) continue; const me = new THREE.Mesh(m, list[0].material); me.castShadow = list.some(c => c.castShadow); me.receiveShadow = true; g.add(me); list.forEach(c => g.remove(c)); } }

// ---------- NPCs ----------
export class NPC {
  constructor(name, model, x, z, o = {}){ this.name = name; this.o = model; this.p = new THREE.Vector3(x, o.y || 0, z); this.speed = o.speed || 3.2; this.path = null; this.face = o.face || 0;
    this.r = o.r || 2.2; scene.add(model); model.traverse(m => m.isMesh && (m.castShadow = true)); this.sync(); G.npcs.push(this); }
  sync(){ this.o.position.copy(this.p); this.o.rotation.y = this.face; }
  go(pts, speed){ this.path = pts.map(a => new THREE.Vector3(a[0], 0, a[1])); if(speed) this.speed = speed; return new Promise(r => this.done = r); }
  follow(t, gap = 2.2, speed, off){ this.fol = t; this.gap = gap; this.off = off; if(speed) this.speed = speed; } // off = [side, back] slot in the leader's frame
  stop(){ this.path = null; this.fol = null; }
  look(x, z){ this.face = Math.atan2(x - this.p.x, z - this.p.z); this.sync(); }
  at(x, z, f){ this.p.set(x, groundAt(x, z, this.p.y + .3), z); if(f !== undefined) this.face = f; this.path = null; this.sync(); }
  remove(){ scene.remove(this.o); G.npcs.splice(G.npcs.indexOf(this), 1); }
  update(dt){ if(this.manual) return; let moving = 0, tgt = null;
    if(this.path && this.path.length){ tgt = this.path[0]; if(Math.hypot(tgt.x - this.p.x, tgt.z - this.p.z) < .35){ this.path.shift(); if(!this.path.length){ this.path = null; this.done && this.done(); } } }
    else if(this.fol){ let f = this.fol.p || this.fol;
      if(this.off){ const h = this.fol === P ? P.model.rotation.y : (this.fol.face || 0), [sx, bz] = this.off; f = { x:f.x + Math.cos(h) * sx - Math.sin(h) * bz, z:f.z - Math.sin(h) * sx - Math.cos(h) * bz, y:f.y }; }
      const d = Math.hypot(f.x - this.p.x, f.z - this.p.z);
      if((d > 26 || Math.abs((f.y || 0) - this.p.y) > 2.5) && !this.slow){ this.lost = (this.lost || 0) + dt; if(this.lost > 2.5){ this.p.set(f.x, f.y || 0, f.z); this.lost = 0; } } else this.lost = 0;
      if(d > (this.off ? .5 : this.gap)) tgt = f; }
    if(tgt){ const dx = tgt.x - this.p.x, dz = tgt.z - this.p.z, d = Math.hypot(dx, dz) || 1, sp = this.fol && !this.path ? Math.min(this.speed * (d > 8 ? 1.6 : 1), d * 3) : this.speed;
      this.p.x += dx / d * sp * dt; this.p.z += dz / d * sp * dt; this.face = Math.atan2(dx, dz); moving = sp; }
    const gy = groundAt(this.p.x, this.p.z, this.p.y); this.p.y += (gy - this.p.y) * Math.min(1, dt * 12);
    if(this.o.userData) this.o.userData.talking = !!G.speaking && G.speaking.toLowerCase() === this.name.toLowerCase();
    animate(this.o, moving, dt); this.sync(); } }
export function animate(o, speed, dt){ const u = o.userData; if(!u) return; u.phase += dt * (speed > 0 ? 3 + speed * 1.6 : 0); const s = speed > 0 ? Math.sin(u.phase) * Math.min(.8, .25 + speed * .1) : 0;
  if(u.dog){ u.legs.forEach((l, i) => l.rotation.x = (i % 3 ? 1 : -1) * s); u.tail.rotation.y = Math.sin(G.t * 12) * .5; return; }
  if(u.sitting){ u.lL.rotation.x = u.lR.rotation.x = -1.45; u.aL.rotation.x = u.aR.rotation.x = -.35; if(u.torso) u.torso.scale.y = 1; o.position.y -= .42; if(u.head) u.head.rotation.y = Math.sin(G.t * .4) * .05; return; }
  u.lL.rotation.x = s; u.lR.rotation.x = -s; if(!u.pose){ u.aL.rotation.x = -s * .8; if(!u.phone) u.aR.rotation.x = s * .8; }
  // idle: breathing + glancing around; talking: nods + hand gestures
  const t = G.t + (u.seed || 0), still = speed <= 0;
  if(u.torso) u.torso.scale.y = 1 + (still ? Math.sin(t * 2.2) * .012 : 0);
  if(u.head && !u.pose){ u.head.rotation.y = u.talking ? Math.sin(t * 1.7) * .12 : still ? Math.sin(t * .45) * .22 * Math.max(0, Math.sin(t * .17)) : 0; u.head.rotation.x = u.talking ? Math.sin(t * 8) * .07 : 0; }
  if(u.talking && still && !u.pose && !u.phone){ const el = u.aR.userData.el; u.aR.rotation.x = -.45 + Math.sin(t * 3.1) * .25; u.aR.rotation.z = .12; if(el) el.rotation.x = -.7 + Math.sin(t * 4.3) * .2; u.aL.rotation.x = Math.sin(t * 2.3) * .12; }
  else if(!u.phone && !u.pose){ u.aR.rotation.z = 0; const el = u.aR.userData.el; if(el) el.rotation.x = 0; if(still){ u.aR.rotation.x = Math.sin(t * 1.1) * .04; u.aL.rotation.x = -Math.sin(t * 1.1) * .04; } } }
export function sit(model, on){ model.userData.sitting = !!on; if(!on) model.position.y = P.p.y; }
// phone in the right hand at the ear: kind 'nokia' | 'handset' | null (put it away)
export function holdPhone(model, kind){ const u = model.userData, aR = u.aR, el = aR.userData.el; if(u.phone){ el.remove(u.phone); u.phone = null; } aR.rotation.set(0, 0, 0); el.rotation.set(0, 0, 0); if(!kind) return;
  const g = new THREE.Group(); if(kind === 'nokia'){ const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .13, .03), mat('#2c3a48')); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.04, .035), new THREE.MeshBasicMaterial({ color:0x9fc25a })); sc.position.set(0, .03, .016); const an = new THREE.Mesh(new THREE.BoxGeometry(.015, .03, .015), mat('#222')); an.position.set(.018, .08, 0); g.add(b, sc, an); }
  else { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .24, .06), mat('#efe6cf')); [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.BoxGeometry(.08, .06, .08), mat('#efe6cf')); c.position.y = s * .12; g.add(c); }); g.add(b); }
  g.position.set(-.06, -.47, .05); g.rotation.set(.2, 0, 0); el.add(g); u.phone = g; aR.rotation.set(-1.7, 0, .9); el.rotation.set(-2.5, -.5, 0); }
export function npc(name, look, x, z, o){ return new NPC(name, look.dog ? makeDog(look.color, look) : makePerson(look), x, z, o); }

// ---------- player ----------
export const P = { p:new THREE.Vector3(0, 0, 0), yaw:0, pitch:-.12, vy:0, model:null, speed:6.4, sprint:11.5, rad:.34, moved:0, rotated:0, stam:1, tired:false };
P.model = makePerson({ shirt:'#2f5d8a', pants:'#4a5a78', hair:'#5a3a1c', skin:'#efc29e' }); scene.add(P.model);
// Chris's everyday look (changed in his closet / at the barber); mission outfits layer on top
G.chrisLook = { shirt:'#2f5d8a', pants:'#4a5a78', hair:'#5a3a1c', skin:'#efc29e', hairStyle:'spiky', tips:'#e8cf8a', top:'graphic', print:'SK8', bottom:'baggy', shoes:'#3a3a3a' };
export function setOutfit(o){ scene.remove(P.model); P.model = makePerson({ ...G.chrisLook, ...o }); P.model.rotation.y = P.yaw; scene.add(P.model); }
export function place(x, z, yaw = 0, y){ if(P.model && P.model.userData.sitting){ P.model.userData.sitting = false; if(G.sofaCol) G.sofaCol.off = false; } P.p.set(x, y ?? groundAt(x, z, .3), z); P.yaw = yaw; P.vy = 0; }
const camP = new THREE.Vector3(), camL = new THREE.Vector3();
// ---------- driving (any car registered with makeDrivable) ----------
export const CARS = [];
export function makeDrivable(car, col){ const c = { car, col, speed:0, head:car.rotation.y }; CARS.push(c);
  addInter({ x:() => car.position.x, z:() => car.position.z, r:3.4, prompt:'DRIVE', persist:true, amb:true, when:() => !G.driving && !G.noDrive && car.visible, use:() => enterCar(c) }); return c; }
export function enterCar(c){ G.driving = c; c.head = c.car.rotation.y; c.speed = 0; if(c.col) c.col.off = true; P.model.visible = false; sfx('door'); }
export function exitCar(){ const c = G.driving; if(!c) return; G.driving = null; const a = c.head + Math.PI / 2;
  place(c.car.position.x + Math.sin(a) * 2, c.car.position.z + Math.cos(a) * 2, c.head); P.model.visible = true;
  if(c.col){ const x = c.car.position.x, z = c.car.position.z, sw = Math.abs(Math.sin(c.head)) > .7; Object.assign(c.col, sw ? { x0:x - 2.3, x1:x + 2.3, z0:z - 1, z1:z + 1 } : { x0:x - 1, x1:x + 1, z0:z - 2.3, z1:z + 2.3 }); c.col.off = false; } sfx('door'); }
const carP = new THREE.Vector3();
function updateDriving(dt){ const c = G.driving, k = G.keys, ctl = G.ctl && !G.paused;
  let th = ctl ? (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) : 0;
  if(G.gas != null && !G.mission){ G.gas = Math.max(0, G.gas - Math.abs(c.speed) * dt * 6e-4); if(G.gas <= 0 && th > 0){ th = 0; if(!G.gasWarn){ G.gasWarn = 1; toast('Out of gas. Should have stopped at the station.', 3000); } } } else G.gasWarn = 0;
  const st = ctl ? (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0) : 0;
  if(th > 0) c.speed += (c.speed < 0 ? 26 : 11) * dt; else if(th < 0) c.speed -= (c.speed > 0 ? 24 : 7) * dt; else c.speed *= Math.pow(.45, dt);
  if(k.Space && ctl) c.speed *= Math.pow(.05, dt); c.speed = Math.max(-7, Math.min(24, c.speed));
  c.head += st * dt * Math.min(1, Math.abs(c.speed) / 6) * 1.7 * Math.sign(c.speed || 1);
  carP.copy(c.car.position); carP.x += Math.sin(c.head) * c.speed * dt; carP.z += Math.cos(c.head) * c.speed * dt; carP.y = 0;
  const bx = carP.x, bz = carP.z; collide(carP, 1.25); if(Math.hypot(carP.x - bx, carP.z - bz) > .01){ c.speed *= .4; }
  c.car.position.set(carP.x, groundAt(carP.x, carP.z, .3), carP.z); c.car.rotation.y = c.head; P.p.set(carP.x, 0, carP.z); P.yaw = c.head; P.mv = Math.abs(c.speed); }

function updatePlayer(dt){
  if(G.driving){ updateDriving(dt); return; }
  const k = G.keys; let f = 0, s = 0;
  if(G.ctl && !G.paused){ if(k.KeyW) f++; if(k.KeyS) f--; if(k.KeyA) s--; if(k.KeyD) s++;
    if(k.ArrowLeft){ P.yaw += dt * 2.2; P.rotated += dt * 2.2; } if(k.ArrowRight){ P.yaw -= dt * 2.2; P.rotated += dt * 2.2; }
    if(k.ArrowUp) P.pitch = Math.min(.9, P.pitch + dt); if(k.ArrowDown) P.pitch = Math.max(-1.1, P.pitch - dt); }
  const want = (k.ShiftLeft || k.ShiftRight) && G.ctl && Math.hypot(f, s);
  if(P.stam <= 0) P.tired = true; if(P.stam > .3) P.tired = false;
  const run = want && !P.tired && !P.board; P.stam = Math.max(0, Math.min(1, P.stam + (run ? -.16 : .22) * dt));
  const sp = (P.board ? 13.5 : run ? P.sprint : P.speed) * (G.carry && G.wet ? .8 : 1), mv = Math.hypot(f, s) ? sp : 0;
  if(P.board && !P.model.userData.board){ const b = new THREE.Group(), dk = new THREE.Mesh(new THREE.BoxGeometry(.26, .04, .82), mat('#2a2a2a')); dk.position.y = .1; b.add(dk); [-.3, .3].forEach(z => [-.09, .09].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .04, 8), mat('#f2f2e8')); w.rotation.z = Math.PI / 2; w.position.set(x, .04, z); b.add(w); })); P.model.add(b); P.model.userData.board = b; }
  if(!P.board && P.model.userData.board){ P.model.remove(P.model.userData.board); P.model.userData.board = null; }
  if(mv){ const a = P.yaw + Math.atan2(-s, f), ox = P.p.x, oz = P.p.z; P.p.x += Math.sin(a) * mv * dt; P.p.z += Math.cos(a) * mv * dt;
    P.moved += Math.hypot(P.p.x - ox, P.p.z - oz); P.model.rotation.y = a; }
  if(G.carry) G.carry(dt, mv);
  collide(P.p, P.rad);
  const gy = groundAt(P.p.x, P.p.z, P.p.y); if(P.p.y > gy + .05){ P.vy -= 22 * dt; P.p.y = Math.max(gy, P.p.y + P.vy * dt); } else { P.p.y += (gy - P.p.y) * Math.min(1, dt * 15); P.vy = 0; }
  if(mv && P.model.userData.sitting){ P.model.userData.sitting = false; if(G.sofaCol) G.sofaCol.off = false; } P.model.userData.talking = G.speaking === 'Chris'; P.model.position.copy(P.p); if(P.board) P.model.position.y += .12; animate(P.model, P.board ? 0 : mv, dt); P.mv = mv; }
function camBlocked(a, b){ // shorten 3rd-person camera when a wall is between player and camera
  let t = 1; const steps = 12;
  for(let i = 1; i <= steps; i++){ const u = i / steps, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u, y = a.y + (b.y - a.y) * u;
    for(const c of G.colliders) if(!c.off && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && y > c.y0 && y < c.y1){ return Math.max(.12, (i - 1.5) / steps); } }
  return t; }
function updateCam(dt){
  if(G.camOverride){ G.camOverride(dt); return; }
  if(G.driving){ const c = G.driving.car, h = G.driving.head, want = new THREE.Vector3(c.position.x - Math.sin(h) * 8.5, 3.6, c.position.z - Math.cos(h) * 8.5);
    camP.lerp(want, Math.min(1, dt * 5)); if(camP.distanceTo(want) > 20) camP.copy(want); cam.position.copy(camP); cam.lookAt(c.position.x + Math.sin(h) * 4, 1.2, c.position.z + Math.cos(h) * 4); return; }
  const fp = G.camMode === 'fp'; P.model.visible = !fp;
  const head = new THREE.Vector3(P.p.x, P.p.y + 1.62, P.p.z), dir = new THREE.Vector3(Math.sin(P.yaw) * Math.cos(P.pitch), Math.sin(P.pitch), Math.cos(P.yaw) * Math.cos(P.pitch));
  if(fp){ cam.position.copy(head).addScaledVector(dir, .12); cam.lookAt(head.clone().add(dir)); return; }
  const want = head.clone().addScaledVector(dir, -4.3); want.y += .55; const t = camBlocked(head, want); want.lerpVectors(head, want, t);
  camP.lerp(want, Math.min(1, dt * 10)); if(camP.distanceTo(want) > 8) camP.copy(want); cam.position.copy(camP);
  camL.copy(head).addScaledVector(dir, 3); cam.lookAt(camL); }

// ---------- input ----------
addEventListener('keydown', e => { G.keys[e.code] = true; if(['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); G.onKey && G.onKey(e); });
addEventListener('keyup', e => G.keys[e.code] = false);
addEventListener('blur', () => G.keys = {});
canvas.addEventListener('click', () => { if(G.ctl && !G.paused && !G.noLock) canvas.requestPointerLock?.(); });
addEventListener('mousemove', e => { if(document.pointerLockElement !== canvas || !G.ctl || G.paused) return;
  P.yaw -= e.movementX * .0024; P.pitch = Math.max(-1.1, Math.min(.9, P.pitch - e.movementY * .0022)); P.rotated += Math.abs(e.movementX) * .0024; });
export const unlock = () => document.pointerLockElement && document.exitPointerLock();

// ---------- interactions / markers / blips ----------
export function addInter(o){ G.inter.push(o); return o; } // {x,z,y?,r,prompt,use,when?}
export function delInter(o){ const i = G.inter.indexOf(o); if(i >= 0) G.inter.splice(i, 1); }
export function interact(x, z, prompt, r = 2.2, y){ const st = typeof x === 'number', mk = st ? marker(x, z, 0x7ee0ff, y, .5) : null; if(st) setWay(x, z);
  return new Promise(res => { const o = addInter({ x, z, y, r, prompt, use:() => { delInter(o); clearMarker(mk); if(st) setWay(); res(); } }); }); }
const mkGeo = new THREE.CylinderGeometry(.9, .9, 2.4, 24, 1, true);
export function marker(x, z, color = 0xffd23f, y, sc = 1){ const g = new THREE.Group(); g.scale.setScalar(sc);
  const m = new THREE.Mesh(mkGeo, new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.38, side:THREE.DoubleSide, depthWrite:false }));
  m.position.y = 1.2; const ar = new THREE.Mesh(new THREE.ConeGeometry(.35, .6, 4), new THREE.MeshBasicMaterial({ color })); ar.rotation.x = Math.PI; ar.position.y = 3;
  g.add(m, ar); g.position.set(x, y ?? groundAt(x, z, .3), z); scene.add(g); g.userData.ar = ar; G.markers = (G.markers || []).concat(g); return g; }
export function clearMarker(m){ if(!m) return; scene.remove(m); G.markers = (G.markers || []).filter(x => x !== m); }
export function setWay(x, z, label){ G.way = x == null ? null : { x, z, label }; }
export function reach(x, z, r = 2.5, o = {}){ const mk = o.noMarker ? null : marker(x, z, o.color, o.y); setWay(x, z);
  return new Promise(res => { const t = () => { if(Math.hypot(P.p.x - x, P.p.z - z) < r && (o.y == null || Math.abs(P.p.y - o.y) < 2)){ G.ticks.splice(G.ticks.indexOf(t), 1); clearMarker(mk); setWay(); res(); } }; G.ticks.push(t); }); }
export function tick(fn){ G.ticks.push(fn); return () => { const i = G.ticks.indexOf(fn); if(i >= 0) G.ticks.splice(i, 1); }; }

// ---------- HUD / text boxes ----------
export const obj = t => { $('obj').textContent = t || ''; };
const SWEAR = /\b(fuck\w*|shit\w*|damn\w*|ass(es|hole)?|bitch\w*|hell|retarded|gay|fatass)\b/gi;
export const clean = s => G.filter ? s.replace(SWEAR, m => m[0] + '*'.repeat(m.length - 1)) : s;
let adv = null;
G.onKey = e => { if(G.dialogOn && ['KeyE', 'Space', 'Enter'].includes(e.code)){ adv && adv(); return; }
  if(G.driving){ if(e.code === 'KeyE' && G.ctl && !G.paused && !G.noExit && Math.abs(G.driving.speed) < 3) exitCar(); G.hotkey && G.hotkey(e); return; }
  if(e.code === 'Space' && G.ctl && !G.paused && !G.choiceOn && P.vy === 0 && P.p.y - groundAt(P.p.x, P.p.z, P.p.y) < .1){ P.vy = 7.2; P.p.y += .06; }
  if(G.choiceOn) return G.choiceKey(e);
  if(e.code === 'KeyE' && G.ctl && !G.paused){ const it = nearestInter(); if(it){ it.use(); } }
  if(e.code === 'KeyV' && G.ctl && !G.paused){ G.camMode = G.camMode === 'tp' ? 'fp' : 'tp'; G.camToggled = true; }
  G.hotkey && G.hotkey(e); };
$('dlg').addEventListener('click', () => adv && adv());
export function say(lines, o = {}){ // lines: [[who, text], ...]; who '' = narration (Chris's thoughts). o.auto: plays while you keep walking
  return new Promise(async done => { const box = $('dlg'), who = box.querySelector('.who'), txt = box.querySelector('.txt'), ar = box.querySelector('.arrow');
    if(o.auto){ while(G.dialogOn || G.autoTalk) await wait(200); G.autoTalk = true; box.classList.add('auto');
      for(const [w, t] of lines){ const text = clean(t); G.speaking = w; who.style.display = w ? '' : 'none'; who.textContent = w; box.classList.toggle('thought', !w); ar.style.display = 'none'; box.style.display = 'block';
        for(let i = 0; i <= text.length; i += 2){ txt.textContent = text.slice(0, i); if(i % 6 === 0) blip(w); await wait(14); } await wait(Math.max(1500, text.length * 38)); }
      box.style.display = 'none'; box.classList.remove('auto'); G.autoTalk = false; G.speaking = null; done(); return; }
    G.dialogOn = true; box.style.display = 'block'; $('prompt').style.display = 'none';
    for(const [w, t] of lines){ const text = clean(t); G.speaking = w; who.style.display = w ? '' : 'none'; who.textContent = w; box.classList.toggle('thought', !w);
      ar.style.display = 'none'; let i = 0, skip = false; txt.textContent = '';
      await new Promise(r => { adv = () => { skip = true; }; const iv = setInterval(() => { i += skip ? 999 : 2; txt.textContent = text.slice(0, i); if(i % 6 === 0 && !skip) blip(w);
        if(i >= text.length){ clearInterval(iv); r(); } }, 13); });
      ar.style.display = 'block'; await new Promise(r => { adv = r; }); }
    adv = null; G.dialogOn = false; G.speaking = null; box.style.display = 'none'; done(); }); }
export function choose(opts){ return new Promise(res => { const el = $('choices'); let k = 0; G.choiceOn = true;
  const draw = () => { el.innerHTML = opts.map((o, i) => `<div class="${i === k ? 'on' : ''}" data-i="${i}">${o}</div>`).join(''); el.querySelectorAll('div').forEach(d => d.onclick = () => fin(+d.dataset.i)); };
  const fin = i => { G.choiceOn = false; el.style.display = 'none'; res(i); };
  G.choiceKey = e => { if(['KeyW', 'ArrowUp'].includes(e.code)){ k = (k + opts.length - 1) % opts.length; draw(); } else if(['KeyS', 'ArrowDown'].includes(e.code)){ k = (k + 1) % opts.length; draw(); } else if(['KeyE', 'Space', 'Enter'].includes(e.code)) fin(k); };
  el.style.display = 'block'; draw(); }); }
export const wait = ms => new Promise(r => setTimeout(r, ms));
export async function fade(on, ms = 600){ const f = $('fade'); f.style.transition = `opacity ${ms}ms`; f.style.opacity = on ? 1 : 0; await wait(ms); }
export async function card(big, small = '', ms = 2600){ const c = $('card'); c.innerHTML = `<b>${big}</b><span>${small}</span>`; c.style.display = 'flex'; await wait(ms); c.style.display = 'none'; }
export async function banner(big, small = '', fail = false, ms = 4200){ const b = $('banner'); b.className = fail ? 'fail' : ''; b.innerHTML = `<b>${big}</b><span>${small}</span>`; b.style.display = 'block'; sfx(fail ? 'fail' : 'pass'); await wait(ms); b.style.display = 'none'; }
export function toast(t, ms = 2600){ const e = $('toast'); e.innerHTML = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = 'none', ms); }
export function killDialog(){ adv = null; G.dialogOn = false; G.choiceOn = false; $('dlg').style.display = 'none'; $('choices').style.display = 'none'; }
export function cut(on){ G.ctl = !on; P.model.visible = true; document.body.classList.toggle('bars', !!on); if(on){ unlock(); $('prompt').style.display = 'none'; } else G.camOverride = null; }
// cutscene cameras never sit behind a wall: ray from the subject to the camera, stop in front of the first solid surface
const shotRay = new THREE.Raycaster();
export function clearShot(b, lk){ const d = b.clone().sub(lk), L = d.length(); if(L < .6) return b; d.divideScalar(L); shotRay.set(lk, d); shotRay.far = L;
  const skip = new Set([P.model, sky, ...G.npcs.map(n => n.o), ...(G.markers || [])]);
  for(const h of shotRay.intersectObjects(scene.children, true)){ const o = h.object, m = Array.isArray(o.material) ? o.material[0] : o.material; let bad = false;
    for(let p = o; p && !bad; p = p.parent) if(skip.has(p) || !p.visible) bad = true;
    if(bad || !m || m.isShaderMaterial || (m.transparent && m.opacity < .7) || h.distance < .7) continue;
    return lk.clone().addScaledVector(d, Math.max(.9, h.distance - .35)); }
  return b; }
export function camShot(pos, look, ms = 0){ const a = cam.position.clone(), lk = new THREE.Vector3(...look), b = clearShot(new THREE.Vector3(...pos), lk), q0 = cam.quaternion.clone();
  const tmp = new THREE.PerspectiveCamera(); tmp.position.copy(b); tmp.lookAt(lk); const q1 = tmp.quaternion.clone(); let t = 0;
  return new Promise(res => { G.camOverride = dt => { t += dt * 1000; const u = ms ? Math.min(1, t / ms) : 1, e = u * u * (3 - 2 * u);
    cam.position.lerpVectors(a, b, e); cam.quaternion.slerpQuaternions(q0, q1, e); if(u >= 1 && res){ const r = res; res = null; r(); } }; }); }
export function camTrack(fn){ G.camOverride = dt => { const [p, l] = fn(dt); cam.position.set(...p); cam.lookAt(...l); }; }

// ---------- audio (all generated, original) ----------
let AC; const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
export function tone(f, t0, d, type = 'square', v = .05, slide){ try{ const a = ac(), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
  if(slide) o.frequency.linearRampToValueAtTime(slide, a.currentTime + t0 + d); g.gain.setValueAtTime(v, a.currentTime + t0); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + t0 + d);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + d + .02); }catch(e){} }
let lastBlip = 0; function blip(w){ const n = performance.now(); if(n - lastBlip < 55) return; lastBlip = n; tone(w ? 520 + (w.charCodeAt(0) % 7) * 40 : 380, 0, .04, 'square', .025); }
export function sfx(k){ if(k === 'pass') [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .12, .35, 'square', .05));
  else if(k === 'fail') [392, 330, 262].forEach((f, i) => tone(f, i * .18, .4, 'sawtooth', .05));
  else if(k === 'bang') tone(120, 0, .25, 'square', .12, 50); else if(k === 'bark') { tone(700, 0, .07, 'sawtooth', .06, 400); tone(760, .12, .07, 'sawtooth', .06, 420); }
  else if(k === 'ring') for(let i = 0; i < 4; i++) tone(i % 2 ? 1300 : 1100, i * .09, .08, 'square', .035);
  else if(k === 'bell') [880, 880, 880].forEach((f, i) => tone(f, i * .25, .2, 'square', .04));
  else if(k === 'alarm') for(let i = 0; i < 8; i++) tone(i % 2 ? 900 : 650, i * .25, .24, 'sawtooth', .05);
  else if(k === 'door') tone(200, 0, .12, 'triangle', .06, 140); else if(k === 'cart') tone(180, 0, .1, 'square', .03, 220);
  else if(k === 'pa') [660, 880, 1100].forEach((f, i) => tone(f, i * .18, .3, 'sine', .06));
  else if(k === 'ok') tone(880, 0, .1, 'square', .04, 1320); else if(k === 'miss') tone(300, 0, .15, 'triangle', .05, 180); }

// ---------- minimap ----------
const mini = $('mini').getContext('2d');
export function drawMap(g, size, cx, cz, scale, rot){ g.save(); g.clearRect(0, 0, size, size); g.fillStyle = '#3b6a34'; g.fillRect(0, 0, size, size);
  g.translate(size / 2, size / 2); if(rot !== undefined) g.rotate(rot); g.scale(scale, scale); g.translate(-cx, -cz);
  for(const s of G.mapShapes){ g.fillStyle = s.c; g.fillRect(s.x0, s.z0, s.x1 - s.x0, s.z1 - s.z0); }
  const dot = (x, z, c, r) => { g.fillStyle = c; g.beginPath(); g.arc(x, z, r / scale, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5 / scale; g.stroke(); };
  for(const b of G.blips) dot(b.x, b.z, b.c || '#4fc3ff', 5);
  for(const n of G.npcs) if(n.blip) dot(n.p.x, n.p.z, n.blip, 5);
  if(G.way){ dot(G.way.x, G.way.z, '#ffd23f', 8); }
  g.restore();
  g.save(); g.translate(size / 2, size / 2); if(rot === undefined){ g.translate((P.p.x - cx) * scale, (P.p.z - cz) * scale); g.rotate(-P.yaw + Math.PI); }
  g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore(); }
function hud(){
  drawMap(mini, 360, P.p.x, P.p.z, 2.2, P.yaw - Math.PI);
  if(G.way){ const dx = G.way.x - P.p.x, dz = G.way.z - P.p.z, d = Math.hypot(dx, dz), a = Math.atan2(dx, dz) - P.yaw;
    const arrows = ['⬆', '⬉', '⬅', '⬋', '⬇', '⬊', '➡', '⬈'], i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
    $('compass').textContent = `${arrows[i]} ${Math.round(d)} m`; } else $('compass').textContent = '';
  const it = G.ctl && !G.dialogOn && !G.driving ? nearestInter() : null, pr = $('prompt');
  const sb = $('stam'); if(sb){ sb.style.display = P.stam < .99 && !G.driving ? 'block' : 'none'; sb.firstChild.style.width = P.stam * 100 + '%'; sb.firstChild.style.background = P.tired ? '#ff5252' : '#7ee07e'; }
  $('speedo') && ($('speedo').style.display = G.driving ? 'block' : 'none', G.driving && ($('speedo').textContent = Math.round(Math.abs(G.driving.speed) * 2.24) + ' MPH' + (G.gas != null && !G.mission ? '  ·  GAS ' + G.gas.toFixed(1) + ' gal' : '') + '  ·  E — EXIT (when stopped)'));
  if(G.driving && !G.dialogOn){ pr.style.display = 'none'; return; }
  if(it){ pr.textContent = 'E — ' + it.prompt; pr.style.display = 'block'; } else pr.style.display = 'none'; }
function nearestInter(){ let best = null, bd = 1e9;
  for(const it of G.inter){ if(it.when && !it.when()) continue; const x = typeof it.x === 'function' ? it.x() : it.x, z = typeof it.z === 'function' ? it.z() : it.z;
    const d = Math.hypot(P.p.x - x, P.p.z - z); if(d < (it.r || 2.2) && d < bd && (it.y == null || Math.abs(P.p.y - it.y) < 2.2)){ bd = d; best = it; } }
  return best; }

// ---------- main loop ----------
let last = performance.now();
function frame(now){ requestAnimationFrame(frame); step(now); }
function step(now){ const dt = Math.min(.05, (now - last) / 1000); last = now; if(G.paused){ R.render(scene, cam); return; }
  G.t += dt; updatePlayer(dt); for(const n of G.npcs.slice()) n.update(dt); for(const t of G.ticks.slice()) t(dt);
  (G.markers || []).forEach(m => { m.userData.ar.position.y = 3 + Math.sin(G.t * 3) * .25; m.userData.ar.rotation.y += dt * 2; });
  updateCam(dt);
  const fx = G.camOverride ? cam.position : P.p, sx = Math.round(fx.x / 4) * 4, sz = Math.round(fx.z / 4) * 4; sun.position.set(sx + G.sunDir.x * 120, G.sunDir.y * 120, sz + G.sunDir.z * 120); sun.target.position.set(sx, 0, sz);
  G.frameN = (G.frameN || 0) + 1; if(G.detail && G.frameN % 6 === 0){ const cx = cam.position.x, cz = cam.position.z, D = G.detailDist || 95; for(const d of G.detail){ const dx = d.x - cx, dz = d.z - cz, lim = D + d.r * 8; d.m.visible = dx * dx + dz * dz < lim * lim; } } if((G.frameN % 3 === 0 && !G.indoors) || G.shadowNow){ sun.shadow.needsUpdate = true; G.shadowNow = false; }
  sky.position.copy(cam.position); hud(); R.render(scene, cam); }
requestAnimationFrame(frame);
G.advance = sec => { for(let i = 0; i < sec * 20; i++){ last = performance.now() - 50; step(performance.now()); } }; // debug/testing aid
setInterval(() => { const n = performance.now(); if(n - last > 160) step(n); }, 40); // keeps running when rAF is throttled

// ---------- performance: merge every static mesh that shares a material into one draw call ----------
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
// graphics quality (pause menu): LOW = no shadows, 75% resolution, shorter draw distance; HIGH = sharper shadows + resolution
export function setQuality(q){ G.quality = q; const dpr = Math.min(devicePixelRatio, q === 'HIGH' ? 1.5 : 1) * (q === 'LOW' ? .75 : 1); R.setPixelRatio(dpr); resize();
  sun.castShadow = q !== 'LOW'; sun.shadow.mapSize.set(q === 'HIGH' ? 2048 : 1024, q === 'HIGH' ? 2048 : 1024); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; }
  G.fogFar = q === 'LOW' ? 210 : 330; scene.fog.far = Math.min(scene.fog.far, G.fogFar); cam.far = q === 'LOW' ? 260 : 420; cam.updateProjectionMatrix(); G.npcDist = q === 'LOW' ? 45 : q === 'HIGH' ? 95 : 70; G.detailDist = q === 'LOW' ? 60 : q === 'HIGH' ? 140 : 95; G.shadowNow = true; }
export function bakeStatic(keepList = []){
  const keep = new Set(keepList.filter(Boolean)); keep.add(sky); keep.add(P.model); G.npcs.forEach(n => keep.add(n.o));
  scene.updateMatrixWorld(true); const groups = new Map(); let n0 = 0;
  scene.traverse(o => { if(!o.isMesh || Array.isArray(o.material) || o.material.isShaderMaterial) return;
    for(let p = o; p && p !== scene; p = p.parent) if(keep.has(p)) return;
    if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere, c = bs.center.clone().applyMatrix4(o.matrixWorld), big = bs.radius * o.matrixWorld.getMaxScaleOnAxis() > 80;
    const cell = big ? 'big' : Math.floor(c.x / 140) + ',' + Math.floor(c.z / 140);
    const mt = o.material, k = (mt.map ? 'T' + (mt.map.source ? mt.map.source.uuid : mt.map.uuid) + mt.map.repeat.x.toFixed(3) + ',' + mt.map.repeat.y.toFixed(3) + ',' + mt.map.offset.x.toFixed(3) + ',' + mt.map.offset.y.toFixed(3) + mt.type + (mt.color ? mt.color.getHexString() : '') + (mt.emissive ? mt.emissive.getHexString() : '') + mt.transparent + mt.opacity + mt.side : mt.type + (mt.color ? mt.color.getHexString() : '') + (mt.emissive ? mt.emissive.getHexString() : '') + mt.opacity + mt.transparent + mt.side) + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + '|' + cell; if(!groups.has(k)) groups.set(k, []); groups.get(k).push(o); n0++; });
  let n1 = 0;
  for(const list of groups.values()){ if(list.length < 2) continue;
    const geos = list.map(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      for(const a of Object.keys(g.attributes)) if(!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if(!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if(!g.attributes.normal) g.computeVertexNormals(); g.clearGroups(); return g; });
    const merged = mergeGeometries(geos, false); if(!merged) continue;
    merged.computeBoundingSphere(); const m = new THREE.Mesh(merged, list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.matrixAutoUpdate = false; scene.add(m);
    list.forEach(o => o.parent && o.parent.remove(o)); geos.forEach(g => g.dispose()); n1++; }
  scene.traverse(o => { if(!o.isMesh) return; for(let p = o; p && p !== scene; p = p.parent) if(keep.has(p)) return; o.matrixAutoUpdate = false; o.updateMatrix(); });
  // small leftover static pieces (signs, labels, props) are hidden when far from the camera
  G.detail = []; scene.children.forEach(o => { if(!o.isMesh || keep.has(o) || o.matrixAutoUpdate) return; if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); if(r > 6) return;
    const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); G.detail.push({ m:o, x:c.x, z:c.z, r }); });
  G.perf = { before:n0, groups:n1, detail:G.detail.length }; return G.perf; }
