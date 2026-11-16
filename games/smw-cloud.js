/* Supermarket Wars — cloud saves. Signs in to the existing GXY / Biking People World
   account (Firebase email + password) so saveGame()/renderSaveSlots() sync through
   gxyAccount. Also offers save-file export/import as an offline backup. */
import { gxyAccount } from '../assets/gxyaccount.js';
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const auth = getAuth(getApps()[0]);
const ERR = {
  'auth/invalid-credential':'Wrong email or password.', 'auth/invalid-email':'That email doesn\'t look right.',
  'auth/email-already-in-use':'That email already has an account. Sign in instead.', 'auth/weak-password':'Use at least 6 characters.',
  'auth/too-many-requests':'Too many tries. Wait a minute and try again.', 'auth/network-request-failed':'No internet connection.',
};
const msg = e => ERR[e && e.code] || 'Something went wrong. Try again.';

function card(){
  const u = auth.currentUser, el = document.getElementById('cloudCard'); if(!el) return;
  el.querySelector('.md').textContent = u ? `Signed in as ${u.email}. Your saves sync between your phone and computer.` : 'Sign in with your GXY account to sync saves between the app and the website.';
}
window.openCloud = function(){
  const u = auth.currentUser;
  showModal(u ? `<h2>☁️ Cloud Saves</h2><p style="color:var(--dim);margin:8px 0 14px;">Signed in as <b>${esc(u.email)}</b>. Saves upload whenever the game saves, and the newest copy of each slot is loaded on any device.</p>
      <button class="btn" onclick="smwSyncNow()">Sync now</button>
      <button class="btn ghost" style="margin-top:8px;" onclick="smwSignOut()">Sign out</button>
      ${backupHTML()}<button class="btn ghost" onclick="closeModal('modal')" style="margin-top:8px;">Close</button>`
    : `<h2>☁️ Cloud Saves</h2><p style="color:var(--dim);margin:8px 0 12px;">Use the same account on the website and the app to keep your empires in sync.</p>
      <div class="field"><label>Email</label><input id="cEmail" type="email" autocomplete="email"></div>
      <div class="field"><label>Password</label><input id="cPass" type="password" autocomplete="current-password"></div>
      <div id="cErr" style="color:var(--bad);font-size:13px;min-height:18px;margin-bottom:6px;"></div>
      <button class="btn" onclick="smwAuth('in')">Sign in</button>
      <button class="btn ghost" style="margin-top:8px;" onclick="smwAuth('up')">Create account</button>
      <a style="display:block;margin-top:10px;font-size:12px;color:var(--brand);cursor:pointer;" onclick="smwAuth('reset')">Forgot password?</a>
      ${backupHTML()}<button class="btn ghost" onclick="closeModal('modal')" style="margin-top:8px;">Close</button>`);
};
window.smwAuth = async function(kind){
  const email = document.getElementById('cEmail').value.trim(), pass = document.getElementById('cPass').value, err = document.getElementById('cErr');
  err.textContent = '';
  try{
    if(kind==='reset'){ await sendPasswordResetEmail(auth, email); err.style.color='var(--good)'; err.textContent = 'Reset email sent.'; return; }
    if(kind==='up') await createUserWithEmailAndPassword(auth, email, pass); else await signInWithEmailAndPassword(auth, email, pass);
    toast('☁️ Signed in. Syncing your saves…'); closeModal('modal');
  }catch(e){ err.textContent = msg(e); }
};
window.smwSignOut = async function(){ await signOut(auth); closeModal('modal'); toast('Signed out. Saves stay on this device.'); };
window.smwSyncNow = async function(){ await gxyAccount.ready(); if(window.G && typeof saveGame==='function') await saveGame(false); await renderSaveSlots(); toast('☁️ Synced'); };

/* ---- backup files ---- */
function backupHTML(){
  return `<div class="section-title" style="margin-top:18px;">Backup file</div>
    <p style="color:var(--dim);font-size:12px;margin-bottom:8px;">Save an empire to a file, or load one from a file. Works without an account.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button class="btn ghost sm" onclick="smwExport()">⬇ Export saves</button>
      <label class="btn ghost sm" style="text-align:center;">⬆ Import<input type="file" accept=".json,application/json" style="display:none;" onchange="smwImport(this.files[0])"></label></div>`;
}
window.smwExport = async function(){
  const data = JSON.stringify(localSaves());
  const file = new File([data], 'supermarket-wars-saves.json', { type:'application/json' });
  try{ if(navigator.canShare && navigator.canShare({ files:[file] })){ await navigator.share({ files:[file], title:'Supermarket Wars saves' }); return; } }catch(e){ if(e.name==='AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
};
window.smwImport = async function(f){
  if(!f) return;
  try{
    const data = JSON.parse(await f.text()), all = localSaves(); let n = 0;
    Object.keys(data).filter(k=>/^slot\d$/.test(k) && data[k] && data[k].G).forEach(k => {
      let slot = k; if(all[slot]){ for(let i=1;i<=6;i++) if(!all['slot'+i]){ slot = 'slot'+i; break; } }   // don't overwrite: use a free slot
      if(all[slot] && slot===k) return;
      data[k].G.slot = +slot.slice(4); all[slot] = data[k]; n++;
    });
    writeLocal(all); await renderSaveSlots(); closeModal('modal');
    toast(n ? `Imported ${n} save${n>1?'s':''}.` : 'No free slots or no saves in that file.');
  }catch(e){ toast('That file isn\'t a Supermarket Wars save.'); }
};

onAuthStateChanged(auth, async () => { card(); await gxyAccount.ready(); await new Promise(r=>setTimeout(r,1500)); /* let gxyAccount finish loading the cloud doc */ try{ await renderSaveSlots(); }catch(e){} });
function boot(){
  const grid = document.querySelector('#scr-mode .mode-grid');
  if(grid && !document.getElementById('cloudCard')) grid.insertAdjacentHTML('beforeend', `<div class="mode-card" id="cloudCard" onclick="openCloud()"><div class="mi">☁️</div><div class="mn">Cloud Saves</div><div class="md"></div></div>`);
  card();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(boot,80)); else setTimeout(boot,80);
