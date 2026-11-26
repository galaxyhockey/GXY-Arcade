// BACK IN THE 2000s — real TV on the living-room set. Clips are passcode-locked in ./tvx/ (made by tv/lock.js from the
// git-ignored tv/ folder) and unlocked with the same passcode as the radio. tvx/index.json lists the channels:
//   { channels:[{ name:'Cartoon Network', from:6, to:12, clips:['Dexter’s Laboratory', ...] }] }   (from/to = hours it is on; omit = all day)
// With no footage the TV falls back to the old text channels.
import { G, toast, THREE } from './engine.js';
let idx = null; const vid = document.createElement('video'); vid.playsInline = true; vid.preload = 'auto'; let blob = null, tex = null;
fetch('tvx/index.json').then(r => r.ok ? r.json() : null).then(j => { idx = j; }).catch(() => {});
const onAir = (c, hr) => c.from == null || (c.from <= c.to ? hr >= c.from && hr < c.to : hr >= c.from || hr < c.to);
export function tvChannels(hr){ return idx ? idx.channels.map((c, i) => ({ ...c, i })).filter(c => c.name !== 'ads' && onAir(c, hr) && c.clips.length) : []; }
// a commercial from the 'ads' folder (null if there is none)
export function tvAd(scr){ const i = idx ? idx.channels.findIndex(c => c.name === 'ads') : -1; return i < 0 ? null : tvPlay({ ...idx.channels[i], i }, scr); }
export async function tvReady(){ if(!idx) return false; const R = G.radio; if(R && !R.key){ const p = localStorage.b2kRadioKey || prompt('Passcode for the TV (same as the radio)'); if(!p || !(await R.unlock(p))){ toast('📺 Wrong passcode'); return false; } } return !!(R && R.key); }
// play a random clip of channel c on the given screen material; resolves with the clip title
export async function tvPlay(c, scr){ const k = Math.random() * c.clips.length | 0; toast(`📺 ${c.name} · loading…`, 1500);
  const b = new Blob([await G.radio.open(`tvx/${String(c.i).padStart(2, '0')}/${String(k).padStart(2, '0')}.bin`)], { type:'video/mp4' }); if(blob) URL.revokeObjectURL(blob); vid.src = blob = URL.createObjectURL(b);
  vid.volume = Math.min(1, (G.set.music + G.set.sfx) / 2); vid.loop = true; await new Promise(r => { vid.onloadedmetadata = r; vid.onerror = r; }); if(vid.duration > 30) vid.currentTime = Math.random() * vid.duration * .7;
  await vid.play().catch(() => {}); if(!tex){ tex = new THREE.VideoTexture(vid); tex.colorSpace = THREE.SRGBColorSpace; } scr.map = tex; scr.color.set(0xffffff); scr.needsUpdate = true; return c.clips[k]; }
export function tvOff(scr){ vid.pause(); if(scr.map === tex){ scr.map = null; scr.needsUpdate = true; } }
