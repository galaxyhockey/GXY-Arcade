// BACK IN THE 2000s — the car radio. Real songs are NEVER part of the game's files: they are read from a music folder
// on the player's own computer (picked once with R, remembered by the browser), or from ./radio/<station>/ when the
// game runs from a local copy that has that folder (it is git-ignored). In the car: R = radio on/off. Like a real station, songs cannot be skipped.
// Browsers without a folder picker (phones, Firefox, Safari) pick the song files instead; the browser keeps its own copy of them.
import { G, toast } from './engine.js';

const STATIONS = [{ id:'z1077', name:'Z107.7', tracks:[ // [file name in the folder, artist, title]
  ["Angry White Boy Polka.mp3", '"Weird Al" Yankovic', 'Angry White Boy Polka'],
  ["Citizen King - Better Days (And The Bottom Drops Out) (Official Music Video).mp3", 'Citizen King', 'Better Days (And the Bottom Drops Out)'],
  ["Fat Lip.mp3", 'Sum 41', 'Fat Lip'],
  ["Foo Fighters - Everlong (Official HD Video).mp3", 'Foo Fighters', 'Everlong'],
  ["Foo Fighters - My Hero (Official HD Video).mp3", 'Foo Fighters', 'My Hero'],
  ["Fountains Of Wayne - Stacy's Mom (Official Music Video).mp3", 'Fountains of Wayne', "Stacy's Mom"],
  ["Green Day - Basket Case [Official Music Video] (4K Upgrade).mp3", 'Green Day', 'Basket Case'],
  ["Green Day - Good Riddance (Time of Your Life) [Official Music Video] [4K UPGRADE].mp3", 'Green Day', 'Good Riddance (Time of Your Life)'],
  ["Green Day - Wake Me Up When September Ends [Official Music Video] [4K Upgrade].mp3", 'Green Day', 'Wake Me Up When September Ends'],
  ["Green Day - When I Come Around [Official Music Video] (4K Upgrade).mp3", 'Green Day', 'When I Come Around'],
  ["Hot Chelle Rae - Tonight Tonight (Official Video).mp3", 'Hot Chelle Rae', 'Tonight Tonight'],
  ["In The End [Official HD Music Video] - Linkin Park.mp3", 'Linkin Park', 'In the End'],
  ["Jimmy Eat World - The Middle (4K Official Music Video).mp3", 'Jimmy Eat World', 'The Middle'],
  ["Lit - My Own Worst Enemy (Official Music Video).mp3", 'Lit', 'My Own Worst Enemy'],
  ["My Chemical Romance - Welcome To The Black Parade [Official Music Video] [HD].mp3", 'My Chemical Romance', 'Welcome to the Black Parade'],
  ["Nelly Furtado - Promiscuous (Official Music Video) ft. Timbaland.mp3", 'Nelly Furtado ft. Timbaland', 'Promiscuous'],
  ["Nirvana - All Apologies (MTV Unplugged).mp3", 'Nirvana', 'All Apologies'],
  ["Nirvana - Come As You Are (Official Music Video).mp3", 'Nirvana', 'Come As You Are'],
  ["Nirvana - Drain You (Audio).mp3", 'Nirvana', 'Drain You'],
  ["Nirvana - Lithium (Official Music Video).mp3", 'Nirvana', 'Lithium'],
  ["No Doubt - Don't Speak (Official 4K Music Video).mp3", 'No Doubt', "Don't Speak"],
  ["No Doubt - Just A Girl.mp3", 'No Doubt', 'Just a Girl'],
  ["Panic! At The Disco I Write Sins Not Tragedies [OFFICIAL VIDEO].mp3", 'Panic! at the Disco', 'I Write Sins Not Tragedies'],
  ["Papa Roach - Last Resort (Squeaky Clean Version) (Official Music Video).mp3", 'Papa Roach', 'Last Resort'],
  ["Paramore Ain't It Fun [OFFICIAL VIDEO].mp3", 'Paramore', "Ain't It Fun"],
  ["Pearl Jam - Even Flow (Official Video).mp3", 'Pearl Jam', 'Even Flow'],
  ["Polkarama!.mp3", '"Weird Al" Yankovic', 'Polkarama!'],
  ["Radiohead - Creep.mp3", 'Radiohead', 'Creep'],
  ["Simple Plan - I'm Just A Kid (Official Video) [HD].mp3", 'Simple Plan', "I'm Just a Kid"],
  ["Soundgarden - Black Hole Sun.mp3", 'Soundgarden', 'Black Hole Sun'],
  ["Spin Doctors - Two Princes.mp3", 'Spin Doctors', 'Two Princes'],
  ["Sublime - What I Got (Official Music Video).mp3", 'Sublime', 'What I Got'],
  ["Sum 41 - In Too Deep.mp3", 'Sum 41', 'In Too Deep'],
  ["The All-American Rejects - Dirty Little Secret (Official Music Video).mp3", 'The All-American Rejects', 'Dirty Little Secret'],
  ["The Offspring -  Come Out And Play.mp3", 'The Offspring', 'Come Out and Play'],
  ["The Offspring -  Self Esteem.mp3", 'The Offspring', 'Self Esteem'],
  ["The Smashing Pumpkins- 1979 (Remastered 2012).mp3", 'The Smashing Pumpkins', '1979'],
  ["Third Eye Blind - Semi-Charmed Life (Official Music Video) [HD].mp3", 'Third Eye Blind', 'Semi-Charmed Life'],
  ["Weezer - Beverly Hills.mp3", 'Weezer', 'Beverly Hills'],
  ["Weezer - Island In The Sun (Official Music Video).mp3", 'Weezer', 'Island in the Sun'],
  ["Weezer - Say It Ain't So (2024 Remaster).mp3", 'Weezer', "Say It Ain't So"],
  ["What's New Scooby-Doo.mp3", 'Simple Plan', "What's New, Scooby-Doo?"],
  ["Wheatus - Teenage Dirtbag.mp3", 'Wheatus', 'Teenage Dirtbag'],
  ["blink-182 - What's My Age Again (Official Music Video).mp3", 'blink-182', "What's My Age Again?"],
] }];

const st = STATIONS[0], au = new Audio(); au.preload = 'auto';
let on = localStorage.b2kRadio !== '0', dir = null, src = null, order = [], at = -1, tuned = false, blob = null, files = null;
// the remembered music folder lives in the browser's own storage (IndexedDB), never on a server
const idb = (mode, fn) => new Promise(res => { const o = indexedDB.open('b2k-radio', 1); o.onupgradeneeded = () => o.result.createObjectStore('kv'); o.onerror = () => res(null);
  o.onsuccess = () => { const r = fn(o.result.transaction('kv', mode).objectStore('kv')); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }; });
const shuffle = () => { const all = st.tracks.map((_, i) => i), cd = (G.cdOnly || []).filter(i => all.includes(i)); order = (cd.length ? cd : all).sort(() => Math.random() - .5); at = -1; };
const url = t => `radio/${st.id}/${encodeURIComponent(t[0])}`;
const useFiles = list => { files = new Map([...list].map(f => [f.name, f])); src = 'files'; };
// Streaming from any device: ./radiox/ holds the songs locked with a passcode (AES-256, made by radio/encrypt.js). The passcode is typed once per device and kept in that browser.
let key = null, locked = false;
const open = async u => { const r = await fetch(u); if(!r.ok) throw 0; const b = new Uint8Array(await r.arrayBuffer()); return crypto.subtle.decrypt({ name:'AES-GCM', iv:b.subarray(0, 12) }, key, b.subarray(12)); };
async function unlock(pass){ pass = pass.toLowerCase().replace(/[^a-z0-9]/g, ''); const te = new TextEncoder(), raw = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
  key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt:te.encode('b2k-radio-v1'), iterations:150000, hash:'SHA-256' }, raw, { name:'AES-GCM', length:256 }, false, ['decrypt']);
  try{ await open('radiox/check.bin'); localStorage.b2kRadioKey = pass; src = 'enc'; return true; }catch(e){ key = null; return false; } }
(async () => { dir = await idb('readonly', s => s.get(st.id)); if(Array.isArray(dir)){ useFiles(dir); dir = null; }
  try{ locked = (await fetch('radiox/check.bin', { method:'HEAD' })).ok; if(locked && !src && localStorage.b2kRadioKey) await unlock(localStorage.b2kRadioKey); }catch(e){}
  try{ if((await fetch(url(st.tracks[0]), { method:'HEAD' })).ok && !src) src = 'url'; }catch(e){} })();

let busy = false;
async function next(){ if(!src || busy) return; busy = true; try{ await load(); } finally{ busy = false; } }
async function load(){ if(at + 1 >= order.length) shuffle(); const t = st.tracks[order[++at]];
  try{ if(src === 'url') au.src = url(t); else if(src === 'enc'){ const b = new Blob([await open(`radiox/${st.id}/${String(order[at]).padStart(2, '0')}.bin`)], { type:'audio/mpeg' }); if(blob) URL.revokeObjectURL(blob); au.src = blob = URL.createObjectURL(b); } else { const f = files ? files.get(t[0]) : await (await dir.getFileHandle(t[0])).getFile(); if(!f) throw 0; if(blob) URL.revokeObjectURL(blob); au.src = blob = URL.createObjectURL(f); } }
  catch(e){ if(next.miss = (next.miss || 0) + 1, next.miss < st.tracks.length) return load(); src = null; toast('📻 No songs found in that folder'); return; }
  next.miss = 0; au.onloadedmetadata = () => { if(!tuned){ tuned = true; au.currentTime = Math.random() * au.duration * .6; } };   // first song: you tune in part-way through, like a real station
  toast(`${G.cdOnly ? '💿' : '📻 ' + st.name} &nbsp;·&nbsp; ${t[1]} — ${t[2]}`, 4200); }
au.onended = next; au.onerror = () => { if(src && au.src) next(); };

// R needs a click/key press anyway (browser rule) both to pick the folder and to re-open it on a later visit
async function power(){ if(!src && locked){ const p = prompt('Radio passcode'); if(p && !(await unlock(p))) return toast('📻 Wrong passcode'); if(src) on = false; }
  if(!src){
    try{ if(dir && await dir.requestPermission({ mode:'read' }) === 'granted') src = 'dir';
      else if(window.showDirectoryPicker){ dir = await showDirectoryPicker({ id:'b2kradio', mode:'read' }); await idb('readwrite', s => s.put(dir, st.id)); src = 'dir'; }
      else { const list = await new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.accept = 'audio/*'; i.onchange = () => res([...i.files]); i.click(); }); if(!list.length) return; useFiles(list); idb('readwrite', s => s.put(list, st.id)); } }catch(e){ return; }
    on = true; } else on = !on;
  localStorage.b2kRadio = on ? '1' : '0'; if(!on) toast('📻 Radio off'); else if(au.src) toast(`📻 ${st.name}`); }
addEventListener('keydown', e => { if(!G.driving || G.paused || G.dialogOn || e.repeat) return; if(e.code === 'KeyR') power(); });

let hinted = false;
G.ticks.push(Object.assign(() => { const play = !!((G.driving && on || G.homeStereo) && src && !G.paused && G.set.music > 0 && G.mission !== 'S01' && !G.radioMute);
  G.radioOn = play; au.volume = Math.min(1, G.set.music * .75);
  if(play){ if(!au.src){ if(!busy) next(); } else if(au.paused && au.readyState > 1) au.play().catch(() => {}); } else if(!au.paused) au.pause();
  if(G.driving && !src && !hinted && G.ctl){ hinted = true; toast(dir ? '📻 Press R to turn the radio on' : locked ? '📻 Press R and type the radio passcode' : '📻 Press R to pick your music for the radio', 5200); } }, { amb:true }));
au.oncanplay = () => { if(G.radioOn) au.play().catch(() => {}); };
G.radio = { st, au, next, power, open, unlock, reset:() => { shuffle(); tuned = true; au.pause(); au.removeAttribute('src'); au.load(); }, get src(){ return src; }, get key(){ return key; }, get locked(){ return locked; } };
