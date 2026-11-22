// Back in the 2000s: The Game — engine (renderer, player, cameras, collisions, NPCs, text boxes, cutscenes, HUD)
import * as THREE from 'three';
export { THREE };
const $ = id => document.getElementById(id);
export const G = { flags:{}, colliders:[], platforms:[], ramps:[], inter:[], npcs:[], ticks:[], blips:[], mapShapes:[], keys:{}, camMode:'tp', ctl:true, paused:false, filter:false, t:0 };

// ---------- renderer / scene ----------
const canvas = $('c');
const R = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, 1)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.12;
const scene = new THREE.Scene(); G.scene = scene; G.R = R; G.skyU = null;
G.set = { sens:1, invY:false, shoulder:true, music:.8, amb:.8, sfx:.8 }; try{ Object.assign(G.set, JSON.parse(localStorage.getItem('b2k_settings') || '{}')); }catch(e){}
const cam = new THREE.PerspectiveCamera(62, 1, .1, 420); G.cam = cam;
function resize(){ R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6b6252, .75); scene.add(hemi); G.hemi = hemi;
const sun = new THREE.DirectionalLight(0xfff1d6, 1.6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left:-45, right:45, top:45, bottom:-45, near:1, far:240 }); sun.shadow.autoUpdate = false; sun.shadow.bias = -.0006; sun.shadow.normalBias = .03; sun.shadow.radius = 2.2; // shadow map re-rendered every 3rd frame
scene.add(sun, sun.target); G.sun = sun;
const skyU = G.skyU = { top:{ value:new THREE.Color(0x3d7fd8) }, bot:{ value:new THREE.Color(0xcfe6ff) }, sunDir:{ value:new THREE.Vector3(.5, .7, 0) }, sunCol:{ value:new THREE.Color(0xfff1d6) }, cloud:{ value:.42 }, night:{ value:0 }, time:{ value:0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(390, 24, 12), new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, uniforms:skyU,
  vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 top,bot,sunDir,sunCol;uniform float cloud,night,time;varying vec3 p;
float h21(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 v){vec2 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 v){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*ns(v);v*=2.03;a*=.5;}return s;}
void main(){vec3 d=normalize(p);float h=clamp(d.y*1.6+.12,0.,1.);vec3 c=mix(bot,top,h);
 float sd=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(sd,420.)*1.5+pow(sd,14.)*.2)*(1.-night*.55);
 if(night>.01&&d.y>0.){vec2 sv=d.xz/(d.y+.3)*90.;c+=vec3(step(.9972,h21(floor(sv))))*night*.9*smoothstep(0.,.3,d.y);}
 if(d.y>.02){vec2 uv=d.xz/(d.y+.12)*1.3+vec2(time*.004,time*.0015);float n=fbm(uv);float m=smoothstep(1.-cloud,1.28-cloud,n)*smoothstep(.02,.22,d.y);
  vec3 cc=mix(bot*1.05+.08,vec3(1.),.55)*(1.-night*.78);cc=mix(cc*.72,cc,smoothstep(.4,.9,n));c=mix(c,cc,m*.92);}
 gl_FragColor=vec4(c,1.);}` }));
scene.add(sky); scene.fog = new THREE.Fog(0xcfe6ff, 70, 330);
const TIMES = {
  day:{ top:0x2f74d6, bot:0xd8ecff, fog:0xcfe6ff, sun:0xfff0d0, si:1.95, hi:.8, dir:[70, 100, 6] },
  after:{ top:0x4a86d6, bot:0xffe2b8, fog:0xf0dcc0, sun:0xffd9a0, si:1.5, hi:.75, dir:[-70, 65, 6] },
  dusk:{ top:0x2a2a6a, bot:0xff9a6a, fog:0xc98a7a, sun:0xff9a5a, si:1.0, hi:.55, dir:[-80, 22, 10] },
  night:{ top:0x0a1030, bot:0x2a3a6a, fog:0x1a2448, sun:0xa8b8ff, si:.5, hi:.55, dir:[40, 80, -30] },
  indoor:{ top:0x3d7fd8, bot:0xd8ecff, fog:0xcfe6ff, sun:0xfff1d6, si:1.2, hi:.95, dir:[60, 90, 40] } };
export function setTime(k){ const t = TIMES[k]; G.time = k; skyU.top.value.set(t.top); skyU.bot.value.set(t.bot); scene.fog.color.set(t.fog);
  sun.color.set(t.sun); sun.intensity = t.si; hemi.intensity = t.hi; G.sunDir = new THREE.Vector3(...t.dir).normalize();
  skyU.sunDir.value.copy(G.sunDir); skyU.sunCol.value.set(t.sun); skyU.night.value = k === 'night' ? 1 : k === 'dusk' ? .3 : 0; skyU.cloud.value = G.cloud ?? .42;
  const lit = k === 'night' ? 1 : k === 'dusk' ? .55 : 0; if(G.lampM){ G.lampM.color.set(lit ? 0xffe9a8 : 0x8f8c80); G.glowM.opacity = lit * .5; G.glowM.visible = lit > 0; } G.onTime && G.onTime(k); }
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
function face(skin, o){ const k = skin + (o.glasses ? 'g' : '') + (o.beard || '') + (o.lips || '') + (o.eye || '') + (o.lash ? 'f' : '');
  if(!faceTex[k]){ const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), sk = new THREE.Color(skin), dk = '#' + sk.clone().offsetHSL(0, .02, -.1).getHexString();
    g.fillStyle = skin; g.fillRect(0, 0, 512, 256); g.translate(64, 62);
    for(const x of [38, 90]){ g.fillStyle = '#fbfbf6'; g.beginPath(); g.ellipse(x, 60, 11, 9, 0, 0, 7); g.fill(); g.fillStyle = o.eye || '#3a2a1a'; g.beginPath(); g.arc(x, 61, 6.2, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x, 61, 3, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x + 1, 56, 3, 3); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x - 12, 49, 24, 3); g.fillStyle = 'rgba(40,25,15,.75)'; if(o.lash){ g.fillRect(x - 11, 39, 22, 2.5); g.fillStyle = '#111'; g.fillRect(x - 13, 48, 26, 4); const sd = x < 64 ? -1 : 1; for(let i = 0; i < 3; i++){ g.save(); g.translate(x + sd * (6 + i * 3.5), 49); g.rotate(sd * (.5 + i * .25)); g.fillRect(-1, -8, 2.4, 8); g.restore(); } } else g.fillRect(x - 13, 38, 26, 5); }
    g.fillStyle = o.lips || '#8a4a3a'; g.fillRect(46, 98, 36, 5); g.fillRect(42, 95, 5, 4); g.fillRect(81, 95, 5, 4); if(o.lash){ g.beginPath(); g.ellipse(64, 101, 15, 6.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(58, 99, 8, 2); g.fillStyle = 'rgba(240,110,120,.2)'; g.beginPath(); g.arc(22, 84, 12, 0, 7); g.arc(106, 84, 12, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(230,110,90,.16)'; g.beginPath(); g.arc(22, 84, 11, 0, 7); g.arc(106, 84, 11, 0, 7); g.fill();
    if(o.glasses){ g.strokeStyle = '#1a1a1a'; g.lineWidth = 4; g.strokeRect(22, 46, 32, 28); g.strokeRect(74, 46, 32, 28); g.beginPath(); g.moveTo(54, 58); g.lineTo(74, 58); g.moveTo(22, 56); g.lineTo(-30, 52); g.moveTo(106, 56); g.lineTo(158, 52); g.stroke(); g.fillStyle = 'rgba(200,230,255,.18)'; g.fillRect(24, 48, 28, 24); g.fillRect(76, 48, 28, 24); }
    if(o.beard){ g.fillStyle = o.beard; g.fillRect(-30, 90, 188, 110); g.fillRect(-40, 66, 44, 60); g.fillRect(124, 66, 44, 60); g.fillStyle = o.lips || '#8a4a3a'; g.fillRect(46, 98, 36, 5); }
    faceTex[k] = new THREE.CanvasTexture(c); faceTex[k].colorSpace = THREE.SRGBColorSpace; }
  return faceTex[k]; }
// lamps: one shared bulb material + additive ground pools, switched by setTime (dull by day, lit from dusk)
export const lampM = G.lampM = new THREE.MeshBasicMaterial({ color:0x8f8c80 }); G.noVC = new Set([lampM]);
{ const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,224,150,.9)'); gr.addColorStop(.5, 'rgba(255,214,130,.3)'); gr.addColorStop(1, 'rgba(255,210,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  G.glowM = new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, polygonOffset:true, polygonOffsetFactor:-3 }); }
export function lampGlow(x, z, r = 7, y = .07){ const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), G.glowM); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m; }
// soft round contact shadow under characters and cars (grounds them indoors, where the sun shadow is off)
let blobM = null;
function blob(r, d){ if(!blobM){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    blobM = new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, (d || r) * 2), blobM); m.rotation.x = -Math.PI / 2; m.position.y = .03; m.userData.blob = true; return m; }
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
  const c = document.createElement('canvas'); c.width = 256; c.height = 76; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 256, 76);
  const lt = new THREE.Color(color).getHSL({}).l > .55, ink = lt ? '#1a1a1a' : '#f4f1ea';
  if(kind === 'flannel'){ g.globalAlpha = .35; g.fillStyle = '#111'; for(let i = 0; i < 256; i += 16){ g.fillRect(i, 0, 6, 76); } for(let i = 4; i < 76; i += 16) g.fillRect(0, i, 256, 6); g.globalAlpha = 1; }
  g.translate(96, 0);
  if(kind === 'graphic'){ g.fillStyle = ink; g.beginPath(); g.arc(32, 30, 14, 0, 7); g.fill(); g.fillStyle = color; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText(print || 'XTRM', 32, 35); }
  if(kind === 'jersey' && print){ g.fillStyle = ink; g.font = 'bold 30px Arial Black'; g.textAlign = 'center'; g.fillText(print, 32, 48); g.fillText(print, 32 + 128, 48); g.fillText(print, 32 - 128, 48); }
  if(kind === 'polo'){ g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(29, 0, 6, 22); }
  if(kind === 'track'){ g.fillStyle = '#f4f4f0'; g.fillRect(30, 0, 4, 76); }
  if(kind === 'hoodie'){ g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(12, 48, 40, 16); g.fillStyle = ink; g.fillRect(26, 4, 2, 18); g.fillRect(36, 4, 2, 18); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return shirtTexCache[k] = new THREE.MeshLambertMaterial({ map:t }); }
export function makePerson(o = {}){
  const skin = o.skin || '#e8b896', g = new THREE.Group(), sk = mat(skin), sh = mat(o.shirt || '#3a6ea5'), pa = mat(o.pants || '#2b3550'), sho = mat(o.shoes || '#222');
  const s = o.scale || 1, wide = (o.wide || 1) * (o.thin ? .88 : 1), top = o.top || 'tee', bot = o.bottom || 'jeans', hs = o.hairStyle || (o.long ? 'long' : 'short');
  const A = (geo, m, x, y, z, p) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; }, cap = (r, len) => new THREE.CapsuleGeometry(r, len, 3, 8);
  const lr = (bot === 'baggy' ? .122 : .1) * Math.min(1.22, wide), white = mat('#f4f4f0');
  const leg = side => { const p = new THREE.Group(); p.position.set(side * .118 * wide, .9, 0);
    if(bot === 'shorts'){ A(cap(lr + .018, .28), pa, 0, -.24, 0, p); A(cap(.07, .3), sk, 0, -.6, 0, p); }
    else { A(cap(lr, .6), pa, 0, -.41, 0, p); if(bot === 'flare') A(new THREE.CylinderGeometry(lr, lr + .065, .24, 8), pa, 0, -.72, 0, p); if(bot === 'track') A(new THREE.BoxGeometry(.02, .76, .05), white, side * (lr + .004), -.41, 0, p); }
    if(bot === 'cargo' || bot === 'shorts') A(new THREE.BoxGeometry(.05, .15, .15), pa, side * (lr + .012), -.34, 0, p);
    const shoe = A(new THREE.CapsuleGeometry(.082, .17, 2, 6), sho, 0, -.845, .065, p); shoe.rotation.x = Math.PI / 2; shoe.scale.set(1.12 * Math.min(1.2, wide), 1, .78); return p; };
  const sleeveSk = o.sleeve === 'short' || ['tee', 'graphic', 'polo', 'babytee'].includes(top) && o.sleeve !== 'long', bare = top === 'jersey' || top === 'tank';
  const tw = .25 * wide, tz = .62 * Math.max(1, wide * .92);
  const arm = side => { const p = new THREE.Group(); p.position.set(side * (tw * 1.08 + .028), 1.5, 0);
    A(cap(.076, .27), bare ? sk : sh, 0, -.2, 0, p); const el = new THREE.Group(); el.position.y = -.38; A(cap(.066, .26), sleeveSk || bare ? sk : sh, 0, -.15, 0, el); A(new THREE.SphereGeometry(.072, 8, 6), sk, 0, -.39, 0, el); p.add(el); p.userData.el = el;
    if(sleeveSk && !bare) A(new THREE.CylinderGeometry(.08, .082, .06, 8), sh, 0, -.33, 0, p); if(top === 'track') A(new THREE.BoxGeometry(.02, .66, .05), white, side * .078, -.34, 0, p); return p; };
  const lL = leg(-1), lR = leg(1), aL = arm(-1), aR = arm(1);
  const fm = ['graphic', 'jersey', 'polo', 'track', 'hoodie', 'flannel'].includes(top) ? shirtTex(top, o.shirt || '#3a6ea5', o.print) : sh, th = top === 'babytee' ? .46 : .6;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(tw * 1.08, tw * .93, th, 14, 1, false, Math.PI), fm); torso.scale.z = tz; torso.position.y = 1.245 + (.6 - th) / 2; torso.castShadow = true; torso.userData.keep = true;
  const yoke = A(new THREE.SphereGeometry(tw * 1.08, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), bare ? sk : sh, 0, 1.54, 0, g); yoke.scale.set(1, .3, tz);
  const hips = A(new THREE.CylinderGeometry(tw * .94, tw * .9, .16, 12), pa, 0, .905, 0, g); hips.scale.z = tz;
  if(top === 'babytee'){ const mid = A(new THREE.CylinderGeometry(tw * .92, tw * .93, .15, 12), sk, 0, 1.0, 0, g); mid.scale.z = tz; }
  if(top === 'hoodie') A(new THREE.SphereGeometry(.17, 8, 6, 0, Math.PI * 2, 0, Math.PI * .62), sh, 0, 1.55, -.12, g).rotation.x = -.5;
  if(top === 'polo') A(new THREE.CylinderGeometry(.1, .125, .07, 8), o.collar ? mat(o.collar) : sh, 0, 1.575, 0, g);
  if(bot === 'skirt'){ const k2 = A(new THREE.CylinderGeometry(tw * .95, tw * 1.4, .36, 12), pa, 0, .77, 0, g); k2.scale.z = tz * 1.1; }
  if(o.chain){ const ch = A(new THREE.TorusGeometry(.115, .016, 4, 14), mat(o.chain === 'puka' ? '#f4efe0' : '#c9ccd0'), 0, 1.5, .08, g); ch.rotation.x = 1.25; }
  if(o.vest){ const v = A(new THREE.CylinderGeometry(tw * 1.13, tw * .99, .5, 14, 1, true, Math.PI + .32, Math.PI * 2 - .64), mat(o.vest, { side:THREE.DoubleSide }), 0, 1.25, 0, g); v.scale.z = tz; }
  A(new THREE.CylinderGeometry(.062, .07, .1, 8), sk, 0, 1.58, 0, g);
  // head: round, face texture on the front; hair + hats are shaped caps
  const head = new THREE.Group(); head.position.y = 1.62; const HS = [1, 1.1, 1];
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.2, 18, 14), new THREE.MeshLambertMaterial({ map:face(skin, o) })); hd.position.y = .2; hd.scale.set(...HS); hd.castShadow = true; hd.userData.keep = true; head.add(hd);
  [-1, 1].forEach(sd => A(new THREE.SphereGeometry(.042, 6, 5), sk, sd * .198, .19, 0, head)); A(new THREE.SphereGeometry(.034, 6, 5), sk, 0, .168, .197, head);
  const hg = new THREE.Group(); hg.position.y = .2; hg.scale.set(...HS); head.add(hg);
  const hc = mat(o.hair || '#3a2414'), dome = (r, th2, m = hc, y = 0) => A(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, th2), m, 0, y, 0, hg), back = (r, th2, m = hc) => A(new THREE.SphereGeometry(r, 10, 8, Math.PI, Math.PI, 0, th2), m, 0, 0, 0, hg);
  const HB = (w, h, d, x, y, z, m = hc, rx = 0, rz = 0) => { const b = A(new THREE.BoxGeometry(w, h, d), m, x, y, z, hg); b.rotation.set(rx, 0, rz); return b; };
  if(o.hair !== 'none' && hs !== 'bald'){
    if(hs === 'buzz') dome(.2045, 1.3, mat(new THREE.Color(o.hair || '#3a2414').offsetHSL(0, -.1, .06).getStyle()));
    else if(hs === 'afro') A(new THREE.SphereGeometry(.29, 12, 9), hc, 0, .1, -.02, hg);
    else { dome(.213, hs === 'shaggy' ? 1.22 : 1.02); back(.215, ['long', 'pony', 'pigtails'].includes(hs) ? 2.45 : hs === 'shaggy' ? 2.2 : 1.85); }
    if(hs === 'long'){ HB(.34, .3, .1, 0, -.24, -.15); if(o.fringe){ [-1, 1].forEach(sd => { HB(.075, .4, .11, sd * .185, -.2, .02, hc, 0, sd * .08); }); HB(.3, .075, .05, .03, .1, .19, hc, .22, -.22); HB(.36, .2, .09, 0, -.44, -.14); } }
    if(hs === 'spiky'){ const tip = mat(o.tips || '#f0dc9a'); for(let i = 0; i < 9; i++){ const a = i / 9 * 6.28, r = i % 3 ? .1 : .03, sp = A(new THREE.ConeGeometry(.045, .13, 5), i % 2 ? tip : hc, Math.cos(a) * r, .22 - r * .25, Math.sin(a) * r, hg); sp.rotation.set(Math.sin(a) * r * 4, 0, -Math.cos(a) * r * 4); } }
    if(hs === 'curtains'){ HB(.13, .06, .05, -.075, .12, .185, hc, .2, .5); HB(.13, .06, .05, .075, .12, .185, hc, .2, -.5); }
    if(hs === 'shaggy') HB(.3, .07, .05, 0, .1, .195, hc, .25);
    if(hs === 'sideswept') HB(.26, .09, .05, .04, .09, .19, hc, .25, -.3);
    if(hs === 'cornrows') for(let i = 0; i < 5; i++){ const rr = A(new THREE.TorusGeometry(.212, .011, 4, 10, Math.PI * .8), mat('#0a0a0a'), -.12 + i * .06, 0, 0, hg); rr.rotation.set(0, Math.PI / 2, 0); rr.rotation.z = .35; }
    if(hs === 'pony') A(cap(.045, .22), hc, 0, -.08, -.25, hg).rotation.x = .35;
    if(hs === 'bun') A(new THREE.SphereGeometry(.09, 8, 6), hc, 0, .2, -.16, hg);
    if(hs === 'pigtails') [-1, 1].forEach(sd => A(cap(.045, .16), hc, sd * .25, -.08, -.03, hg).rotation.z = sd * .25); }
  const hat = o.hat || (o.cap ? 'cap' : ''), hm3 = mat(o.cap || o.hatColor || '#1d1d1d');
  if(hat === 'cap' || hat === 'capback' || hat === 'trucker'){ dome(.224, 1.2, hm3); HB(.3, .025, .2, 0, .075, hat === 'capback' ? -.29 : .29, hm3, hat === 'capback' ? -.12 : .12);
    if(hat === 'trucker') A(new THREE.SphereGeometry(.228, 8, 6, Math.PI / 2 - .7, 1.4, .3, .85), white, 0, 0, 0, hg); }
  if(hat === 'beanie'){ dome(.226, 1.38, hm3); A(new THREE.CylinderGeometry(.222, .226, .055, 14), mat(new THREE.Color(o.cap || o.hatColor || '#1d1d1d').offsetHSL(0, 0, .1).getStyle()), 0, .055, 0, hg); }
  if(hat === 'bandana') A(new THREE.CylinderGeometry(.213, .216, .07, 14), mat(o.hatColor || '#2a3a8a'), 0, .1, 0, hg);
  g.add(lL, lR, aL, aR, torso, head, blob(.62 * wide)); g.scale.setScalar(s);
  [g, lL, lR, aL, aR, aL.userData.el, aR.userData.el, head, hg].forEach(compact);
  g.userData = { lL, lR, aL, aR, head, torso, phase:0, seed:Math.random() * 6, look:o }; return g; }
export function makeDog(color = '#c9a26b', o = {}){
  const g = new THREE.Group(), m = mat(color), d = mat(o.dark || '#3a2a1a'), s = o.size || 1;
  const body = new THREE.Mesh(new THREE.BoxGeometry(.3, .26, .6), m); body.position.y = .38; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(.24, .22, .24), m); head.position.set(0, .55, .38);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(.13, .1, .14), d); snout.position.set(0, .5, .54);
  const ears = [-1, 1].map(sd => { const e = new THREE.Mesh(new THREE.BoxGeometry(.06, .12, .06), d); e.position.set(sd * .09, .7, .36); return e; });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .22), m); tail.position.set(0, .48, -.36); tail.rotation.x = .6;
  const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([a, b]) => { const p = new THREE.Group(); p.position.set(a * .1, .28, b * .22); const l = new THREE.Mesh(new THREE.BoxGeometry(.07, .28, .07), m); l.position.y = -.14; p.add(l); return p; });
  tail.userData.keep = true; g.add(body, head, snout, ...ears, tail, ...legs); compact(g); g.scale.setScalar(s); g.userData = { dog:true, legs, tail, phase:0 }; return g; }
const CARS_T = { sedan:{ L:4.4, p:[[-2.2, .38], [-2.2, .92], [-1.55, 1], [-1, 1.42], [.35, 1.42], [1, .98], [2.05, .9], [2.2, .62], [2.2, .38]], gl:[[-1.4, 1.03], [-.97, 1.35], [.3, 1.35], [.87, 1.03]], f:[[1, .98], [.35, 1.42]], r:[[-1, 1.42], [-1.55, 1]] },
  suv:{ L:4.7, p:[[-2.35, .42], [-2.35, 1.15], [-2.22, 1.72], [.5, 1.72], [1.1, 1.15], [2.2, 1.05], [2.35, .7], [2.35, .42]], gl:[[-2.2, 1.2], [-2.1, 1.64], [.45, 1.64], [.95, 1.2]], f:[[1.1, 1.15], [.5, 1.72]], r:[[-2.22, 1.72], [-2.35, 1.15]] },
  pickup:{ L:5, p:[[-2.5, .42], [-2.5, 1.05], [-.55, 1.05], [-.5, 1.62], [.55, 1.62], [1.15, 1.08], [2.35, 1], [2.5, .7], [2.5, .42]], gl:[[-.45, 1.12], [-.42, 1.54], [.5, 1.54], [1, 1.12]], f:[[1.15, 1.08], [.55, 1.62]], r:[[-.5, 1.62], [-.55, 1.05]] },
  van:{ L:4.8, p:[[-2.4, .4], [-2.4, 1.2], [-2.27, 1.78], [1, 1.78], [1.75, 1.1], [2.3, .98], [2.4, .65], [2.4, .4]], gl:[[-2.2, 1.22], [-2.12, 1.7], [.95, 1.7], [1.6, 1.22]], f:[[1.75, 1.1], [1, 1.78]], r:[[-2.27, 1.78], [-2.4, 1.2]] } };
const slab = (pts, w) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath(); const ge = new THREE.ExtrudeGeometry(sh, { depth:w, bevelEnabled:false }); ge.translate(0, 0, -w / 2); ge.rotateY(-Math.PI / 2); return ge; };
export function makeCar(color = '#b23', o = {}){ let hsh = 0; for(const ch of color) hsh = (hsh * 31 + ch.charCodeAt(0)) % 997;
  const type = o.type || (o.suv ? 'suv' : ['sedan', 'pickup', 'sedan', 'van', 'sedan'][hsh % 5]), T = CARS_T[type], L = T.L, W = 1.82, g = new THREE.Group(), m = mat(color), gl = o.tint ? mat('#0a0d12') : mat('#27384a', { emissive:0x0c1620 }), dk = mat('#151515'), chrome = mat(o.rims || '#c9ccd0');
  const A = (geo, mt, x, y, z) => { const me = new THREE.Mesh(geo, mt); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  A(slab(T.p, W), m, 0, 0, 0); A(slab(T.gl, W + .03), gl, 0, 0, 0);
  for(const [a, b] of [T.f, T.r]){ const dz = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dz, dy), w = A(new THREE.PlaneGeometry(W - .28, len * .82), gl, 0, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2); w.rotation.x = Math.atan2(dz, dy); w.translateZ(.012); w.castShadow = false; }
  [L / 2, -L / 2].forEach((z, i) => { A(new THREE.BoxGeometry(W + .06, .2, .16), dk, 0, .5, z + (i ? -.02 : .02)); A(new THREE.BoxGeometry(.5, .13, .03), mat('#f2f2ee'), 0, .52, z + (i ? -.11 : .11)); });
  A(new THREE.BoxGeometry(W - .7, .16, .04), dk, 0, .76, L / 2 + .005);
  [-.66, .66].forEach(x => { A(new THREE.BoxGeometry(.34, .15, .05), mat('#fff8d0', { emissive:0x777755 }), x, .78, L / 2 - .02 - (type === 'sedan' ? .06 : 0)); A(new THREE.BoxGeometry(.3, .16, .05), mat('#c00', { emissive:0x550000 }), x, .82, -L / 2 - .012); A(new THREE.BoxGeometry(.12, .1, .2), m, x * 1.5, T.gl[0][1] + .06, T.f[0][0] - .25); });
  if(type === 'pickup'){ const bed = A(new THREE.PlaneGeometry(W - .26, 1.8), dk, 0, 1.055, -1.55); bed.rotation.x = -Math.PI / 2; bed.castShadow = false; }
  if(type === 'suv' || type === 'van') [-.6, .6].forEach(x => A(new THREE.BoxGeometry(.05, .05, 1.9), dk, x, T.p[2][1] + .03, -.7));
  if(o.spoiler){ const sy = T.p[1][1] + .28; A(new THREE.BoxGeometry(W - .1, .05, .34), m, 0, sy, -L / 2 + .3); [-.6, .6].forEach(x => A(new THREE.BoxGeometry(.06, .26, .1), dk, x, sy - .14, -L / 2 + .32)); }
  if(o.flames){ A(slab([[1.9, .5], [1.9, .86], [1.1, .82], [.2, .9], [.8, .74], [-.2, .72], [.7, .64], [0, .56], [.9, .54]], W + .03), mat('#f26a1a'), 0, 0, 0); A(slab([[1.9, .56], [1.9, .8], [1.3, .76], [.8, .8], [1.2, .68], [.7, .62], [1.3, .6]], W + .05), mat('#f2d030'), 0, 0, 0); }
  const wheels = []; [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => { const wg = new THREE.Group(); wg.position.set(sx * (W / 2 - .1), .36, sz * (L / 2 - .82)); const t = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .24, 14), dk); t.rotation.z = Math.PI / 2; const hub = new THREE.Mesh(o.rims ? new THREE.CylinderGeometry(.25, .25, .27, 10) : new THREE.CylinderGeometry(.19, .19, .26, 5), chrome); hub.rotation.z = Math.PI / 2; wg.add(t, hub);
    if(o.spin){ g.add(wg); wheels.push(wg); } else { [t, hub].forEach(p => { p.position.copy(wg.position); p.castShadow = true; g.add(p); }); } });
  compact(g); if(o.lights){ const b = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 7), G.glowM); b.rotation.x = -Math.PI / 2; b.position.set(0, .06, L / 2 + 3.2); g.add(b); }
  g.add(blob(1.5, L * .62)); g.userData.len = L; g.userData.wheels = wheels; return g; }
// Plain-coloured parts are merged into ONE mesh per rigid piece using per-vertex colours (a person: ~28 draw calls -> ~10).
const vcOK = mt => mt && !Array.isArray(mt) && !mt.map && !mt.transparent && mt.opacity === 1 && !mt.vertexColors && (mt.type === 'MeshLambertMaterial' || mt.type === 'MeshBasicMaterial')
  && (!mt.emissive || mt.emissive.getHex() === 0) && mt.side === THREE.FrontSide && !mt.polygonOffset && !(G.noVC && G.noVC.has(mt));
const vcMats = {}, vcMat = type => vcMats[type] || (vcMats[type] = type === 'MeshBasicMaterial' ? new THREE.MeshBasicMaterial({ vertexColors:true }) : new THREE.MeshLambertMaterial({ vertexColors:true }));
function paint(g, c){ const n = g.attributes.position.count, a = new Float32Array(n * 3); for(let i = 0; i < n; i++){ a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
function prep(c, matrix, vc){ const gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); gg.applyMatrix4(matrix); for(const a of Object.keys(gg.attributes)) if(!['position', 'normal', 'uv'].includes(a) && !(a === 'color' && vc && c.material.vertexColors)) gg.deleteAttribute(a);
  if(!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if(!gg.attributes.normal) gg.computeVertexNormals(); if(vc && !gg.attributes.color) paint(gg, c.material.color); gg.clearGroups(); return gg; }
function compact(g){ const by = new Map(); g.children.slice().forEach(c => { if(!c.isMesh || Array.isArray(c.material) || c.userData.keep || c.userData.blob) return; const k = vcOK(c.material) ? 'VC' + c.material.type : c.material.uuid; if(!by.has(k)) by.set(k, []); by.get(k).push(c); });
  for(const [k, list] of by){ if(list.length < 2) continue; const vc = k.startsWith('VC'), geos = list.map(c => { c.updateMatrix(); return prep(c, c.matrix, vc); });
    const m = mergeGeometries(geos, false); if(!m) continue; const me = new THREE.Mesh(m, vc ? vcMat(list[0].material.type) : list[0].material); me.castShadow = list.some(c => c.castShadow); me.receiveShadow = true; g.add(me); list.forEach(c => g.remove(c)); geos.forEach(x => x.dispose()); } }

// ---------- NPCs ----------
export class NPC {
  constructor(name, model, x, z, o = {}){ this.name = name; this.o = model; this.p = new THREE.Vector3(x, o.y || 0, z); this.speed = o.speed || 3.2; this.path = null; this.face = o.face || 0;
    this.r = o.r || 2.2; scene.add(model); model.traverse(m => m.isMesh && !m.userData.blob && (m.castShadow = true)); this.sync(); G.npcs.push(this); }
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
    this.sync(); animate(this.o, moving, dt); } }
export function animate(o, speed, dt){ const u = o.userData; if(!u) return; u.phase += dt * (speed > 0 ? 3 + speed * 1.6 : 0); const s = speed > 0 ? Math.sin(u.phase) * Math.min(.8, .25 + speed * .1) : 0;
  if(u.dog){ u.legs.forEach((l, i) => l.rotation.x = (i % 3 ? 1 : -1) * s); u.tail.rotation.y = Math.sin(G.t * 12) * .5; return; }
  if(u.sitting){ u.lL.rotation.x = u.lR.rotation.x = -1.45; u.aL.rotation.x = u.aR.rotation.x = -.35; if(u.torso) u.torso.scale.y = 1; o.position.y -= .42; if(u.head) u.head.rotation.y = Math.sin(G.t * .4) * .05; return; }
  u.lL.rotation.x = s; u.lR.rotation.x = -s; if(!u.pose){ u.aL.rotation.x = -s * .8; if(!u.phone) u.aR.rotation.x = s * .8; }
  if(u.pushing && !u.pose && !u.phone){ u.aL.rotation.x = u.aR.rotation.x = -1.25; u.aL.rotation.z = u.aR.rotation.z = 0; const e1 = u.aL.userData.el, e2 = u.aR.userData.el; if(e1) e1.rotation.x = -.15; if(e2) e2.rotation.x = -.15; if(u.head) u.head.position.y = 1.62; return; }
  if(u.head) u.head.position.y = 1.62 + (speed > 0 ? Math.abs(Math.sin(u.phase)) * .028 : 0);
  // idle: breathing + glancing around; talking: nods + hand gestures
  const t = G.t + (u.seed || 0), still = speed <= 0;
  if(u.torso) u.torso.scale.y = 1 + (still ? Math.sin(t * 2.2) * .012 : 0);
  if(u.head && !u.pose){ u.head.rotation.y = u.talking ? Math.sin(t * 1.7) * .12 : still ? Math.sin(t * .45) * .22 * Math.max(0, Math.sin(t * .17)) : 0; u.head.rotation.x = u.talking ? Math.sin(t * 8) * .07 : 0; }
  if(u.talking && still && !u.pose && !u.phone){ const el = u.aR.userData.el; u.aR.rotation.x = -.45 + Math.sin(t * 3.1) * .25; u.aR.rotation.z = .12; if(el) el.rotation.x = -.7 + Math.sin(t * 4.3) * .2; u.aL.rotation.x = Math.sin(t * 2.3) * .12; }
  else if(!u.phone && !u.pose){ u.aR.rotation.z = 0; const el = u.aR.userData.el; const bend = still ? 0 : speed > 8 ? -1.3 : -.32, eL = u.aL.userData.el; if(el) el.rotation.x = bend; if(eL) eL.rotation.x = bend; if(still){ u.aR.rotation.x = Math.sin(t * 1.1) * .04; u.aL.rotation.x = -Math.sin(t * 1.1) * .04; } } }
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
export function place(x, z, yaw = 0, y){ P.vx = P.vz = 0; if(P.model && P.model.userData.sitting){ P.model.userData.sitting = false; if(G.sofaCol) G.sofaCol.off = false; } P.p.set(x, y ?? groundAt(x, z, .3), z); P.yaw = yaw; P.vy = 0; }
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
  let th = ctl ? (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) : 0; if(ctl && Math.abs(PAD.gas) > .05) th = PAD.gas;
  if(G.gas != null && !G.mission){ G.gas = Math.max(0, G.gas - Math.abs(c.speed) * dt * 6e-4); if(G.gas <= 0 && th > 0){ th = 0; if(!G.gasWarn){ G.gasWarn = 1; toast('Out of gas. Should have stopped at the station.', 3000); } } } else G.gasWarn = 0;
  const st = ctl ? ((k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0) || PAD.steer) : 0;
  if(th > 0) c.speed += (c.speed < 0 ? 26 : 11) * dt; else if(th < 0) c.speed -= (c.speed > 0 ? 24 : 7) * dt; else c.speed *= Math.pow(.45, dt);
  if((k.Space || PAD.brake) && ctl) c.speed *= Math.pow(.05, dt); c.speed = Math.max(-7, Math.min(24, c.speed));
  c.head += st * dt * Math.min(1, Math.abs(c.speed) / 6) * 1.7 * Math.sign(c.speed || 1);
  carP.copy(c.car.position); carP.x += Math.sin(c.head) * c.speed * dt; carP.z += Math.cos(c.head) * c.speed * dt; carP.y = 0;
  const bx = carP.x, bz = carP.z; collide(carP, 1.25); if(Math.hypot(carP.x - bx, carP.z - bz) > .01){ c.speed *= .4; }
  c.car.position.set(carP.x, groundAt(carP.x, carP.z, .3), carP.z); c.car.rotation.y = c.head; for(const w of c.car.userData.wheels || []) w.rotation.x += c.speed * dt / .36; P.p.set(carP.x, 0, carP.z); P.yaw = c.head; P.mv = Math.abs(c.speed); }

function updatePlayer(dt){
  if(G.driving){ updateDriving(dt); return; }
  const k = G.keys; let f = 0, s = 0;
  if(G.ctl && !G.paused){ if(k.KeyW) f++; if(k.KeyS) f--; if(k.KeyA) s--; if(k.KeyD) s++; if(!f && !s){ f = PAD.f; s = PAD.s; }
    if(k.ArrowLeft){ P.yaw += dt * 2.2; P.rotated += dt * 2.2; } if(k.ArrowRight){ P.yaw -= dt * 2.2; P.rotated += dt * 2.2; }
    if(k.ArrowUp) P.pitch = Math.min(.9, P.pitch + dt); if(k.ArrowDown) P.pitch = Math.max(-1.1, P.pitch - dt); }
  const want = (k.ShiftLeft || k.ShiftRight || PAD.run) && G.ctl && Math.hypot(f, s);
  if(P.stam <= 0) P.tired = true; if(P.stam > .3) P.tired = false;
  const run = want && !P.tired && !P.board; P.stam = Math.max(0, Math.min(1, P.stam + (run ? -.12 : .22) * dt));
  const sp = (P.board ? 13.5 : run ? P.sprint : P.speed) * (G.carry && G.wet ? .8 : 1), mag = Math.min(1, Math.hypot(f, s)), mv = mag > .12 ? sp * Math.max(.35, mag) : 0;
  if(P.board && !P.model.userData.board){ const b = new THREE.Group(), dk = new THREE.Mesh(new THREE.BoxGeometry(.26, .04, .82), mat('#2a2a2a')); dk.position.y = .1; b.add(dk); [-.3, .3].forEach(z => [-.09, .09].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .04, 8), mat('#f2f2e8')); w.rotation.z = Math.PI / 2; w.position.set(x, .04, z); b.add(w); })); P.model.add(b); P.model.userData.board = b; }
  if(!P.board && P.model.userData.board){ P.model.remove(P.model.userData.board); P.model.userData.board = null; }
  const ta = P.yaw + Math.atan2(-s, f), kk = Math.min(1, dt * (mv ? 13 : 10)); P.vx = (P.vx || 0) + ((mv ? Math.sin(ta) * mv : 0) - (P.vx || 0)) * kk; P.vz = (P.vz || 0) + ((mv ? Math.cos(ta) * mv : 0) - (P.vz || 0)) * kk;
  const spd = Math.hypot(P.vx, P.vz); P.run = run && mv > 0;
  if(spd > .05){ const ox = P.p.x, oz = P.p.z; P.p.x += P.vx * dt; P.p.z += P.vz * dt; P.moved += Math.hypot(P.p.x - ox, P.p.z - oz); }
  if(mv){ let da = ta - P.model.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); P.model.rotation.y += da * Math.min(1, dt * 14); }
  if(G.carry) G.carry(dt, mv);
  collide(P.p, P.rad);
  const gy = groundAt(P.p.x, P.p.z, P.p.y); if(P.p.y > gy + .05){ P.vy -= 22 * dt; P.p.y = Math.max(gy, P.p.y + P.vy * dt); } else { P.p.y += (gy - P.p.y) * Math.min(1, dt * 15); P.vy = 0; }
  if(mv && P.model.userData.sitting){ P.model.userData.sitting = false; if(G.sofaCol) G.sofaCol.off = false; } P.model.userData.talking = G.speaking === 'Chris'; P.model.userData.pushing = !!(G.carry && G.pushN); P.model.position.copy(P.p); if(P.board) P.model.position.y += .12; animate(P.model, P.board ? 0 : spd > .5 ? spd : 0, dt); P.mv = spd > .5 ? spd : 0; }
function camBlocked(a, b){ // shorten 3rd-person camera when a wall is between player and camera
  let t = 1; const steps = 12;
  for(let i = 1; i <= steps; i++){ const u = i / steps, x = a.x + (b.x - a.x) * u, z = a.z + (b.z - a.z) * u, y = a.y + (b.y - a.y) * u;
    for(const c of G.colliders) if(!c.off && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && y > c.y0 && y < c.y1){ return Math.max(.12, (i - 1.5) / steps); } }
  return t; }
let rayT = 1;
function updateCam(dt){
  const fovT = G.camOverride ? 62 : G.driving ? 62 + Math.min(8, Math.abs(G.driving.speed) * .35) : P.run ? 67 : 62; if(Math.abs(cam.fov - fovT) > .05){ cam.fov += (fovT - cam.fov) * Math.min(1, dt * 5); cam.updateProjectionMatrix(); }
  if(G.camOverride){ G.camOverride(dt); return; }
  if(G.driving){ const c = G.driving.car, h = G.driving.head, want = new THREE.Vector3(c.position.x - Math.sin(h) * 8.5, 3.6, c.position.z - Math.cos(h) * 8.5);
    camP.lerp(want, Math.min(1, dt * 5)); if(camP.distanceTo(want) > 20) camP.copy(want); cam.position.copy(camP); cam.lookAt(c.position.x + Math.sin(h) * 4, 1.2, c.position.z + Math.cos(h) * 4); return; }
  const fp = G.camMode === 'fp'; P.model.visible = !fp;
  const head = new THREE.Vector3(P.p.x, P.p.y + 1.62, P.p.z), dir = new THREE.Vector3(Math.sin(P.yaw) * Math.cos(P.pitch), Math.sin(P.pitch), Math.cos(P.yaw) * Math.cos(P.pitch));
  if(fp){ cam.position.copy(head).addScaledVector(dir, .12); cam.lookAt(head.clone().add(dir)); return; }
  const sh = G.set.shoulder ? .5 : 0, rx = -Math.cos(P.yaw) * sh, rz = Math.sin(P.yaw) * sh; // shoulder offset: Chris sits left of centre so he never hides what he's facing
  const want = head.clone().addScaledVector(dir, -4.3); want.y += .55; want.x += rx; want.z += rz;
  if((G.frameN || 0) % 4 === 0){ const hit = clearShot(want.clone(), head); rayT = Math.min(1, hit.distanceTo(head) / Math.max(.01, want.distanceTo(head))); }
  const t = Math.min(camBlocked(head, want), rayT < .999 ? Math.max(.14, rayT) : 1); want.lerpVectors(head, want, t);
  camP.lerp(want, Math.min(1, dt * 10)); if(camP.distanceTo(want) > 8) camP.copy(want); cam.position.copy(camP);
  camL.copy(head).addScaledVector(dir, 3); camL.x += rx * t; camL.z += rz * t; cam.lookAt(camL); }

// ---------- input ----------
addEventListener('keydown', e => { G.keys[e.code] = true; if(['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); G.onKey && G.onKey(e); });
addEventListener('keyup', e => G.keys[e.code] = false);
addEventListener('blur', () => G.keys = {});
canvas.addEventListener('click', () => { if(G.ctl && !G.paused && !G.noLock) canvas.requestPointerLock?.(); });
addEventListener('mousemove', e => { PAD.on = false; if(document.pointerLockElement !== canvas || !G.ctl || G.paused) return;
  const sn = G.set.sens; P.yaw -= e.movementX * .0024 * sn; P.pitch = Math.max(-1.1, Math.min(.9, P.pitch - e.movementY * .0022 * sn * (G.set.invY ? -1 : 1))); P.rotated += Math.abs(e.movementX) * .0024; });
// ---------- controller (standard gamepad): left stick move, right stick look, A jump/confirm, X interact, B skateboard, Y camera, RT run/gas, LT brake, START pause, BACK map ----------
const PAD = G.pad = { f:0, s:0, run:false, gas:0, steer:0, brake:false, on:false }, padPrev = [], padNav = { t:0 };
const padKey = code => { for(const type of ['keydown', 'keyup']) document.body.dispatchEvent(new KeyboardEvent(type, { code, bubbles:true })); };
const PADMAP = { 0:'Space', 1:'KeyB', 2:'KeyE', 3:'KeyV', 8:'KeyM', 9:'Escape', 12:'ArrowUp', 13:'ArrowDown', 14:'ArrowLeft', 15:'ArrowRight' };
function pollPad(dt){ const gp = (navigator.getGamepads ? [...navigator.getGamepads()] : []).find(g => g && g.connected && g.buttons.length >= 10); if(!gp){ PAD.f = PAD.s = PAD.gas = PAD.steer = 0; PAD.run = PAD.brake = false; return; }
  const dz = v => Math.abs(v) < .18 ? 0 : (v - Math.sign(v) * .18) / .82, ax = gp.axes, lx = dz(ax[0] || 0), ly = dz(ax[1] || 0), rx = dz(ax[2] || 0), ry = dz(ax[3] || 0), b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), bv = i => gp.buttons[i] ? gp.buttons[i].value : 0;
  if(lx || ly || rx || ry || gp.buttons.some(x => x.pressed)) PAD.on = true;
  PAD.f = -ly; PAD.s = lx; PAD.run = b(7) || b(10) || b(5); PAD.gas = bv(7) - bv(6); PAD.steer = -lx; PAD.brake = b(0);
  if(G.ctl && !G.paused && (rx || ry)){ const sn = G.set.sens; P.yaw -= rx * dt * 2.6 * sn; P.pitch = Math.max(-1.1, Math.min(.9, P.pitch - ry * dt * 1.7 * sn * (G.set.invY ? -1 : 1))); P.rotated += Math.abs(rx) * dt * 2.6; }
  for(const i of Object.keys(PADMAP)){ const p = b(+i); if(p && !padPrev[i]) padKey(PADMAP[i]); padPrev[i] = p; }
  // stick up/down also steps through menus and choices
  padNav.t -= dt; const menu = G.paused || G.choiceOn || !G.ctl; if(menu && Math.abs(ax[1] || 0) > .6){ if(padNav.t <= 0){ padKey(ax[1] < 0 ? 'ArrowUp' : 'ArrowDown'); padNav.t = .28; } } else if(menu && Math.abs(ax[0] || 0) > .6){ if(padNav.t <= 0){ padKey(ax[0] < 0 ? 'ArrowLeft' : 'ArrowRight'); padNav.t = .2; } } else padNav.t = 0; }
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
// portrait of whoever is talking, drawn from their actual look (hair style/colour, skin, shirt, hat, glasses, beard)
function lookOf(w){ const name = w.replace(/\s*\(.*\)$/, '').trim().toLowerCase(); if(!name) return null; if(name === 'chris') return P.model.userData.look || G.chrisLook;
  const n = G.npcs.find(n => n.name.toLowerCase() === name && n.o.userData.look); return n ? n.o.userData.look : (G.LOOK && G.LOOK[name]) || (G.CAST && G.CAST[name]) || null; }
export function portrait(cv, L, phone){ const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const sk = L.skin || '#e8b896', hair = L.hair || '#3a2414', hs = L.hairStyle || (L.long ? 'long' : 'short'), hat = L.hat || (L.cap ? 'cap' : '');
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, phone ? '#d9d2b8' : '#bfd6ff'); gr.addColorStop(1, phone ? '#a89f84' : '#7fa4e6'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = L.vest || L.shirt || '#3a6ea5'; g.fillRect(8, 50, 48, 14); g.fillStyle = sk; g.fillRect(26, 44, 12, 8);
  if(hs === 'afro'){ g.fillStyle = hair; g.fillRect(12, 4, 40, 26); } if(['long', 'pony', 'pigtails'].includes(hs)){ g.fillStyle = hair; g.fillRect(14, 12, 36, 40); }
  g.fillStyle = sk; g.fillRect(18, 14, 28, 32); g.fillRect(15, 26, 3, 8); g.fillRect(46, 26, 3, 8);
  g.fillStyle = hair; if(hs === 'buzz'){ g.globalAlpha = .55; g.fillRect(18, 12, 28, 5); g.globalAlpha = 1; } else if(hs !== 'bald' && L.hair !== 'none'){ g.fillRect(17, 9, 30, 9); if(hs === 'shaggy' || hs === 'sideswept'){ g.fillRect(17, 16, hs === 'shaggy' ? 30 : 18, 5); g.fillRect(15, 14, 4, 14); g.fillRect(45, 14, 4, 14); }
    if(hs === 'curtains'){ g.fillRect(17, 16, 9, 6); g.fillRect(38, 16, 9, 6); } if(hs === 'spiky'){ g.fillStyle = L.tips || '#f0dc9a'; for(let i = 0; i < 6; i++) g.fillRect(18 + i * 5, 4 + (i % 2) * 2, 3, 7); } if(hs === 'bun'){ g.fillRect(26, 2, 12, 9); } if(hs === 'pigtails'){ g.fillRect(8, 20, 7, 20); g.fillRect(49, 20, 7, 20); } if(hs === 'cornrows'){ g.fillStyle = '#111'; for(let i = 0; i < 5; i++) g.fillRect(20 + i * 6, 9, 2, 8); } }
  if(hat){ g.fillStyle = L.cap || L.hatColor || '#1d1d1d'; g.fillRect(16, 6, 32, hat === 'beanie' ? 13 : 10); if(hat === 'cap' || hat === 'trucker') g.fillRect(14, 15, 36, 4); if(hat === 'trucker'){ g.fillStyle = '#f4f4f0'; g.fillRect(24, 7, 16, 8); } }
  g.fillStyle = '#fbfbf6'; g.fillRect(22, 26, 7, 6); g.fillRect(35, 26, 7, 6); g.fillStyle = '#1a1a1a'; g.fillRect(25, 27, 3, 4); g.fillRect(38, 27, 3, 4); g.fillStyle = 'rgba(40,25,15,.8)'; g.fillRect(21, 22, 9, 2); g.fillRect(34, 22, 9, 2);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(31, 30, 3, 6); g.fillStyle = L.lips || '#8a4a3a'; g.fillRect(27, 39, 10, 2); if(L.lash){ g.fillRect(28, 38, 8, 4); g.fillStyle = '#111'; g.fillRect(20, 24, 3, 2); g.fillRect(41, 24, 3, 2); g.fillRect(21, 25, 9, 1); g.fillRect(34, 25, 9, 1); g.fillStyle = 'rgba(240,110,120,.35)'; g.fillRect(19, 33, 5, 4); g.fillRect(40, 33, 5, 4); } if(L.fringe){ g.fillStyle = hair; g.fillRect(17, 16, 20, 4); g.fillRect(15, 14, 5, 34); g.fillRect(44, 14, 5, 34); }
  if(L.beard){ g.fillStyle = L.beard; g.fillRect(18, 36, 28, 10); g.fillStyle = L.lips || '#8a4a3a'; g.fillRect(27, 39, 10, 2); }
  if(L.glasses){ g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5; g.strokeRect(20.5, 24.5, 10, 9); g.strokeRect(33.5, 24.5, 10, 9); g.beginPath(); g.moveTo(30, 28); g.lineTo(34, 28); g.stroke(); } }
function setPortrait(box, w){ const cv = box.querySelector('.face'); if(!cv) return; const L = w ? lookOf(w) : null; box.classList.toggle('noface', !L); if(L) portrait(cv, L, /\((phone|radio)\)/i.test(w)); }
export function say(lines, o = {}){ // lines: [[who, text], ...]; who '' = narration (Chris's thoughts). o.auto: plays while you keep walking
  return new Promise(async done => { const box = $('dlg'), who = box.querySelector('.who'), txt = box.querySelector('.txt'), ar = box.querySelector('.arrow');
    if(o.auto){ while(G.dialogOn || G.autoTalk) await wait(200); G.autoTalk = true; box.classList.add('auto');
      for(const [w, t] of lines){ const text = clean(t); G.speaking = w; setPortrait(box, w); who.style.display = w ? '' : 'none'; who.textContent = w; box.classList.toggle('thought', !w); ar.style.display = 'none'; box.style.display = 'block';
        for(let i = 0; i <= text.length; i += 2){ txt.textContent = text.slice(0, i); if(i % 6 === 0) blip(w); await wait(14); } await wait(Math.max(1500, text.length * 38)); }
      box.style.display = 'none'; box.classList.remove('auto'); G.autoTalk = false; G.speaking = null; done(); return; }
    G.dialogOn = true; box.style.display = 'block'; $('prompt').style.display = 'none';
    for(const [w, t] of lines){ const text = clean(t); G.speaking = w; setPortrait(box, w); who.style.display = w ? '' : 'none'; who.textContent = w; box.classList.toggle('thought', !w);
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
export function tone(f, t0, d, type = 'square', v = .05, slide){ v *= G.set.sfx / .8; if(v <= 0) return; try{ const a = ac(), o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
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
const wayV = new THREE.Vector3(); let wayD = -1;
function hud(){
  drawMap(mini, 360, P.p.x, P.p.z, 2.2, P.yaw - Math.PI);
  { const ob = $('obj'), hide = G.dialogOn && !G.autoTalk; if(ob._h !== hide){ ob._h = hide; ob.style.visibility = hide ? 'hidden' : ''; } }
  const wy = $('way'); if(wy){ const w = G.way, d = w ? Math.hypot(w.x - P.p.x, w.z - P.p.z) : 0;
    if(w && d > 5 && G.ctl && !G.camOverride && !G.dialogOn){ const v = wayV.set(w.x, 1.8, w.z).project(cam), behind = v.z > 1; let x = behind ? -v.x : v.x, y = behind ? -v.y : v.y;
      if(behind || Math.abs(x) > .9 || Math.abs(y) > .84){ if(behind) y = -.84; const m = Math.max(Math.abs(x) / .9, Math.abs(y) / .84, .0001); x /= m; y /= m; }
      wy.style.display = 'block'; wy.style.transform = `translate(${((x * .5 + .5) * innerWidth) | 0}px,${((-y * .5 + .5) * innerHeight) | 0}px) translate(-50%,-50%)`; const dd = Math.round(d); if(dd !== wayD){ wayD = dd; wy.lastChild.textContent = dd + ' m'; } }
    else wy.style.display = 'none'; }
  
  const it = G.ctl && !G.dialogOn && !G.driving ? nearestInter() : null, pr = $('prompt');
  const sb = $('stam'); if(sb){ sb.style.display = P.stam < .99 && !G.driving ? 'block' : 'none'; sb.firstChild.style.width = P.stam * 100 + '%'; sb.firstChild.style.background = P.tired ? '#ff5252' : '#7ee07e'; }
  $('speedo') && ($('speedo').style.display = G.driving ? 'block' : 'none', G.driving && ($('speedo').textContent = Math.round(Math.abs(G.driving.speed) * 2.24) + ' MPH' + (G.gas != null && !G.mission ? '  ·  GAS ' + G.gas.toFixed(1) + ' gal' : '') + '  ·  E — EXIT (when stopped)'));
  if(G.driving && !G.dialogOn){ pr.style.display = 'none'; return; }
  if(it){ if(pr._t !== it.prompt + PAD.on){ pr._t = it.prompt + PAD.on; pr.innerHTML = '<kbd>' + (PAD.on ? 'X' : 'E') + '</kbd>' + it.prompt; } pr.style.display = 'block'; } else pr.style.display = 'none'; }
function nearestInter(){ let best = null, bd = 1e9;
  for(const it of G.inter){ if(it.when && !it.when()) continue; const x = typeof it.x === 'function' ? it.x() : it.x, z = typeof it.z === 'function' ? it.z() : it.z;
    const d = Math.hypot(P.p.x - x, P.p.z - z); if(d < (it.r || 2.2) && d < bd && (it.y == null || Math.abs(P.p.y - it.y) < 2.2)){ bd = d; best = it; } }
  return best; }

// ---------- main loop ----------
let last = performance.now();
function frame(now){ requestAnimationFrame(frame); step(now); }
function step(now){ const dt = Math.min(.05, (now - last) / 1000); last = now; pollPad(dt); if(G.paused){ R.render(scene, cam); return; }
  G.t += dt; updatePlayer(dt); for(const n of G.npcs.slice()) n.update(dt); for(const t of G.ticks.slice()) t(dt);
  (G.markers || []).forEach(m => { m.userData.ar.position.y = 3 + Math.sin(G.t * 3) * .25; m.userData.ar.rotation.y += dt * 2; });
  updateCam(dt);
  const fx = G.camOverride ? cam.position : P.p, sx = Math.round(fx.x / 4) * 4, sz = Math.round(fx.z / 4) * 4; sun.position.set(sx + G.sunDir.x * 120, G.sunDir.y * 120, sz + G.sunDir.z * 120); sun.target.position.set(sx, 0, sz);
  G.frameN = (G.frameN || 0) + 1; if(G.detail && G.frameN % 6 === 0){ const cx = cam.position.x, cz = cam.position.z, D = G.detailDist || 95; for(const d of G.detail){ const dx = d.x - cx, dz = d.z - cz, lim = D + d.r * 8; d.m.visible = dx * dx + dz * dz < lim * lim; } } if((G.frameN % 3 === 0 && !G.indoors) || G.shadowNow){ sun.shadow.needsUpdate = true; G.shadowNow = false; }
  sky.position.copy(cam.position); skyU.time.value = G.t; hud(); R.render(scene, cam); }
requestAnimationFrame(frame);
G.advance = sec => { for(let i = 0; i < sec * 20; i++){ last = performance.now() - 50; step(performance.now()); } }; // debug/testing aid
setInterval(() => { const n = performance.now(); if(n - last > 160) step(n); }, 40); // keeps running when rAF is throttled

// ---------- performance: merge every static mesh that shares a material into one draw call ----------
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
// graphics quality (pause menu): LOW = no shadows, 75% resolution, shorter draw distance; HIGH = sharper shadows + resolution
export function setQuality(q){ G.quality = q; const dpr = Math.min(devicePixelRatio, q === 'HIGH' ? 1.5 : 1) * (q === 'LOW' ? .75 : 1); R.setPixelRatio(dpr); resize();
  sun.castShadow = q !== 'LOW'; sun.shadow.mapSize.set(q === 'HIGH' ? 2048 : 1024, q === 'HIGH' ? 2048 : 1024); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; }
  G.fogFar = q === 'LOW' ? 210 : 330; scene.fog.far = Math.min(scene.fog.far, G.fogFar); cam.far = q === 'LOW' ? 260 : 420; cam.updateProjectionMatrix(); sky.scale.setScalar(q === 'LOW' ? .6 : 1); G.npcDist = q === 'LOW' ? 45 : q === 'HIGH' ? 95 : 70; G.detailDist = q === 'LOW' ? 60 : q === 'HIGH' ? 140 : 95; G.shadowNow = true; }
export function bakeStatic(keepList = []){
  const keep = new Set(keepList.filter(Boolean)); keep.add(sky); keep.add(P.model); G.npcs.forEach(n => keep.add(n.o));
  scene.updateMatrixWorld(true); const groups = new Map(); let n0 = 0;
  scene.traverse(o => { if(!o.isMesh || Array.isArray(o.material) || o.material.isShaderMaterial) return;
    for(let p = o; p && p !== scene; p = p.parent) if(keep.has(p)) return;
    if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere, c = bs.center.clone().applyMatrix4(o.matrixWorld), big = bs.radius * o.matrixWorld.getMaxScaleOnAxis() > 80;
    const cell = big ? 'big' : Math.floor(c.x / 140) + ',' + Math.floor(c.z / 140);
    const mt = o.material, k = (vcOK(mt) || mt === vcMats[mt.type]) ? 'VC' + mt.type + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + '|' + cell : (mt.map ? 'T' + (mt.map.source ? mt.map.source.uuid : mt.map.uuid) + mt.map.repeat.x.toFixed(3) + ',' + mt.map.repeat.y.toFixed(3) + ',' + mt.map.offset.x.toFixed(3) + ',' + mt.map.offset.y.toFixed(3) + mt.type + (mt.color ? mt.color.getHexString() : '') + (mt.emissive ? mt.emissive.getHexString() : '') + mt.transparent + mt.opacity + mt.side : mt.type + (mt.color ? mt.color.getHexString() : '') + (mt.emissive ? mt.emissive.getHexString() : '') + mt.opacity + mt.transparent + mt.side) + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '') + '|' + cell; if(!groups.has(k)) groups.set(k, []); groups.get(k).push(o); n0++; });
  let n1 = 0;
  for(const list of groups.values()){ if(list.length < 2) continue;
    const vc = vcOK(list[0].material) || list[0].material === vcMats[list[0].material.type], geos = list.map(o => prep(o, o.matrixWorld, vc));
    const merged = mergeGeometries(geos, false); if(!merged) continue;
    merged.computeBoundingSphere(); const m = new THREE.Mesh(merged, vc ? vcMat(list[0].material.type) : list[0].material); m.castShadow = list[0].castShadow; m.receiveShadow = list[0].receiveShadow; m.matrixAutoUpdate = false; scene.add(m);
    list.forEach(o => o.parent && o.parent.remove(o)); geos.forEach(g => g.dispose()); n1++; }
  scene.traverse(o => { if(!o.isMesh) return; for(let p = o; p && p !== scene; p = p.parent) if(keep.has(p)) return; o.matrixAutoUpdate = false; o.updateMatrix(); });
  // small leftover static pieces (signs, labels, props) are hidden when far from the camera
  G.detail = []; scene.children.forEach(o => { if(!o.isMesh || keep.has(o) || o.matrixAutoUpdate) return; if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const r = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); if(r > 6) return;
    const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); G.detail.push({ m:o, x:c.x, z:c.z, r }); });
  G.perf = { before:n0, groups:n1, detail:G.detail.length }; return G.perf; }
