// Back in the 2000s: The Game — front end: intro (production logos + advisory), main menu over a live fly-around of the town,
// settings (graphics, mouse, camera, audio, language), keyboard/controller menu navigation.
import * as E from './engine.js';
const { G } = E; const $ = id => document.getElementById(id);

// ---------- settings ----------
const ROWS = [
  { k:'gfx', label:'GRAPHICS', type:'pick', opts:['LOW', 'MEDIUM', 'HIGH'], get:() => G.quality || 'MEDIUM', set:v => { E.setQuality(v); try{ localStorage.setItem('b2k_gfx', v); }catch(e){} } },
  { k:'sens', label:'MOUSE / STICK SENSITIVITY', type:'range', min:.3, max:2.5, step:.1 },
  { k:'invY', label:'INVERT LOOK UP/DOWN', type:'bool' },
  { k:'shoulder', label:'OVER-THE-SHOULDER CAMERA', type:'bool' },
  { k:'music', label:'MUSIC VOLUME', type:'range', min:0, max:1, step:.05 },
  { k:'amb', label:'AMBIENCE VOLUME', type:'range', min:0, max:1, step:.05 },
  { k:'sfx', label:'EFFECTS + TEXT BLIPS', type:'range', min:0, max:1, step:.05 },
  { k:'admin', label:'ADMIN MODE (PLAY ANY MISSION)', type:'bool' },
  { k:'filter', label:'STRONG LANGUAGE', type:'pick', opts:['SHOWN', 'FILTERED'], get:() => G.filter ? 'FILTERED' : 'SHOWN', set:v => { G.filter = v === 'FILTERED'; G.saveNow && G.saveNow(); } },
];
const saveSet = () => { try{ localStorage.setItem('b2k_settings', JSON.stringify(G.set)); }catch(e){} };
function drawSettings(){ const el = $('setBody'); el.innerHTML = ROWS.map((r, i) => { const v = r.get ? r.get() : G.set[r.k];
  const ctl = r.type === 'range' ? `<input type="range" data-i="${i}" min="${r.min}" max="${r.max}" step="${r.step}" value="${v}"><b>${r.max <= 1 ? Math.round(v * 100) + '%' : (+v).toFixed(1) + '×'}</b>`
    : `<button data-i="${i}">◀ ${r.type === 'bool' ? (v ? 'ON' : 'OFF') : v} ▶</button>`; return `<div class="srow"><span>${r.label}</span>${ctl}</div>`; }).join('');
  el.querySelectorAll('input').forEach(inp => inp.oninput = () => { const r = ROWS[+inp.dataset.i]; G.set[r.k] = +inp.value; saveSet(); inp.nextElementSibling.textContent = r.max <= 1 ? Math.round(inp.value * 100) + '%' : (+inp.value).toFixed(1) + '×'; if(r.k === 'sfx') E.sfx('ok'); });
  el.querySelectorAll('button').forEach(b => b.onclick = () => { const i = +b.dataset.i, r = ROWS[i]; if(r.type === 'bool'){ G.set[r.k] = !G.set[r.k]; saveSet(); G.onAdmin && G.onAdmin(); } else { const cur = r.get(), n = r.opts[(r.opts.indexOf(cur) + 1) % r.opts.length]; r.set(n); }
    drawSettings(); const nb = el.querySelector(`[data-i="${i}"]`); nb && nb.focus(); if($('pGfx')) $('pGfx').textContent = 'GRAPHICS: ' + G.quality; }); }
export function openSettings(on){ $('settings').style.display = on ? 'flex' : 'none'; if(on){ drawSettings(); const f = $('setBody').querySelector('button,input'); f && f.focus(); } else focusFirst(); }

// ---------- menu navigation (keyboard + controller) ----------
const open = id => { const e = $(id); return e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'; };
const top = () => ['intro', 'slots', 'settings', 'about', 'help', 'pause', 'title'].find(open);
function items(){ const t = top(); return t && t !== 'intro' ? [...$(t).querySelectorAll('button:not(:disabled),input[type=range]')].filter(e => e.offsetParent) : []; }
function focusFirst(){ const it = items(); if(it.length && !it.includes(document.activeElement)) it[0].focus(); }
addEventListener('keydown', e => { const t = top(); if(!t) return;
  if(t === 'intro'){ if(['Space', 'Enter', 'Escape', 'KeyE'].includes(e.code)) skipIntro(); e.stopImmediatePropagation(); return; }
  const it = items(), i = it.indexOf(document.activeElement);
  if(['ArrowDown', 'KeyS'].includes(e.code)){ it[(i + 1) % it.length]?.focus(); e.preventDefault(); e.stopImmediatePropagation(); }
  else if(['ArrowUp', 'KeyW'].includes(e.code)){ it[(i + it.length - 1) % it.length]?.focus(); e.preventDefault(); e.stopImmediatePropagation(); }
  else if(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code) && document.activeElement?.type === 'range'){ const a = document.activeElement, d = ['ArrowRight', 'KeyD'].includes(e.code) ? 1 : -1; if(!e.isTrusted || e.code.startsWith('Key')){ a.value = +a.value + d * +a.step; a.dispatchEvent(new Event('input')); e.preventDefault(); } e.stopImmediatePropagation(); }
  else if(['Space', 'Enter', 'KeyE'].includes(e.code)){ if(!e.isTrusted || e.code === 'KeyE'){ document.activeElement?.click?.(); } e.stopImmediatePropagation(); }
  else if(e.code === 'Escape' && ['settings', 'about', 'help', 'slots'].includes(t)){ if(t === 'settings') openSettings(false); else { $(t).style.display = 'none'; focusFirst(); } e.stopImmediatePropagation(); }
  else if(t !== 'pause') e.stopImmediatePropagation();
}, true);
new MutationObserver(() => { document.body.classList.toggle('inmenu', open('title')); setTimeout(focusFirst, 30); }).observe(document.body, { attributes:true, subtree:true, attributeFilter:['style'] });

// ---------- save slots ----------
const slotKey = n => 'b2k_save_' + n;
function drawSlots(){ const el = $('slotBody'); el.innerHTML = [1, 2, 3].map(n => { let d = null; try{ d = JSON.parse(localStorage.getItem(slotKey(n))); }catch(e){}
    const used = d && (d.cp || Object.keys(d.done || {}).length || d.life), l = d && d.life, when = l ? new Date(2003, 8, 26 + (l.dayCount || 0)).toDateString().slice(0, 10) : 'Sep 26';
    const info = used ? `${Object.keys(d.done || {}).length} MISSIONS · ${when} 2003${l ? ' · $' + (l.cash || 0).toFixed(2) : ''}${d.savedAt ? '<br>LAST PLAYED ' + new Date(d.savedAt).toLocaleDateString() : ''}` : 'EMPTY';
    return `<div class="slot${n === G.slot ? ' cur' : ''}"><button data-n="${n}"><b>SLOT ${n}${n === G.slot ? ' · IN USE' : ''}</b><small>${info}</small></button>${used ? `<button class="del" data-del="${n}">ERASE</button>` : ''}</div>`; }).join('');
  el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const n = +b.dataset.n; if(n === G.slot){ $('slots').style.display = 'none'; focusFirst(); return; } try{ localStorage.setItem('b2k_slot', n); }catch(e){} location.reload(); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const n = +b.dataset.del; if(!confirm('Erase save slot ' + n + '? This cannot be undone.')) return; try{ localStorage.removeItem(slotKey(n)); }catch(e){} if(n === G.slot) location.reload(); else drawSlots(); }); }

// ---------- intro ----------
let introT = [], introDone = false;
function skipIntro(){ if(introDone) return; introDone = true; introT.forEach(clearTimeout); const el = $('intro'); el.style.opacity = 0; setTimeout(() => { el.style.display = 'none'; focusFirst(); }, 500); try{ sessionStorage.setItem('b2k_intro', '1'); }catch(e){} }
function intro(){ const el = $('intro'), cards = [...el.querySelectorAll('.icard')]; let seen = false; try{ seen = sessionStorage.getItem('b2k_intro') === '1'; }catch(e){}
  if(seen || new URLSearchParams(location.search).has('nointro')){ el.style.display = 'none'; introDone = true; focusFirst(); return; }
  el.onclick = skipIntro; let t = 300; cards.forEach((c, i) => { const hold = +c.dataset.ms || 2600; introT.push(setTimeout(() => { cards.forEach(x => x.classList.remove('on')); c.classList.add('on'); }, t)); t += hold; }); introT.push(setTimeout(skipIntro, t)); }

// ---------- main menu over the live town ----------
export function initUI(){ let a = 0; E.setTime('after'); E.camTrack(dt => { a += dt * .045; return [[Math.cos(a) * 62, 24 + Math.sin(a * .7) * 5, 14 + Math.sin(a) * 62], [0, 4, 10]]; });
  $('bSet').onclick = () => openSettings(true); $('pSet').onclick = () => openSettings(true); $('setClose').onclick = () => openSettings(false);
  $('bSlots').textContent = 'SAVE SLOT ' + G.slot; $('bSlots').onclick = () => { $('slots').style.display = 'flex'; drawSlots(); }; $('slotClose').onclick = () => { $('slots').style.display = 'none'; focusFirst(); };
  $('bAbout').onclick = () => { $('about').style.display = 'flex'; }; $('aboutClose').onclick = () => { $('about').style.display = 'none'; focusFirst(); };
  addEventListener('gamepadconnected', () => E.toast('Controller connected.', 2200));
  document.body.classList.add('inmenu'); intro(); }
