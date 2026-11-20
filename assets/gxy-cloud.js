/* GXY Cloud: cross-device saves for every arcade game.
   Signs in with the existing GXY / Biking People World account (email + password) and mirrors the arcade's
   localStorage to Firestore: gxy_saves/{uid}/keys/{key} = { v: value, t: last-changed time }.
   On each device the newest copy of every key wins. Loaded on demand by assets/gxy.js. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = getApps()[0] || initializeApp({
  apiKey: "AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ", authDomain: "gxyhockey.firebaseapp.com", projectId: "gxyhockey",
  storageBucket: "gxyhockey.firebasestorage.app", messagingSenderId: "474584991663", appId: "1:474584991663:web:b8986544418d6b85fa115a" });
const auth = getAuth(app), db = getFirestore(app);
const SKIP = /^(firebase|gxy_save_times|gxy_cloud_meta|tv_seen|_)/, MAX = 900000;   // Firestore documents top out near 1 MB
const enc = k => encodeURIComponent(k).replace(/\./g, '%2E'), dec = k => decodeURIComponent(k);
let H = null, busy = false;
const meta = () => { try{ return JSON.parse(localStorage.getItem('gxy_cloud_meta') || '{}'); }catch(e){ return {}; } };
const setMeta = m => localStorage.setItem('gxy_cloud_meta', JSON.stringify(m));
const times = () => { try{ return JSON.parse(localStorage.getItem('gxy_save_times') || '{}'); }catch(e){ return {}; } };

export function start(h){ H = h; }
export async function user(){ await auth.authStateReady(); const u = auth.currentUser; return u && !u.isAnonymous ? u : null; }
export async function status(){ const u = await user(), m = meta(); return { user:u ? u.email : null, on:!!(u && m.on), last:m.last || 0, big:m.big || [] }; }

const ERR = { 'auth/invalid-credential':'Wrong email or password.', 'auth/invalid-email':'That email doesn\'t look right.', 'auth/email-already-in-use':'That email already has an account. Sign in instead.',
  'auth/weak-password':'Use at least 6 characters.', 'auth/too-many-requests':'Too many tries. Wait a minute and try again.', 'auth/network-request-failed':'No internet connection.',
  'permission-denied':'GXY Cloud isn\'t switched on for this arcade yet (Firebase rule needed).' };
export const errText = e => ERR[e && e.code] || 'Something went wrong. Try again.';

export async function signIn(email, pass, create){
  if(auth.currentUser && auth.currentUser.isAnonymous) await signOut(auth);      // trivia rooms may have signed in anonymously
  if(create) await createUserWithEmailAndPassword(auth, email, pass); else await signInWithEmailAndPassword(auth, email, pass);
  setMeta({ ...meta(), on:true });
  H.bump('arcade', 'cloud');
  const n = await pull(true); await push(true);
  return n;
}
export async function out(){ setMeta({}); await signOut(auth); H.emit(); }
export const reset = email => sendPasswordResetEmail(auth, email);

// Download: take any key whose cloud copy is newer than this device's.
export async function pull(quiet){
  const u = await user(); if(!u || busy) return 0; busy = true;
  try{
    const snap = await getDocs(collection(db, 'gxy_saves', u.uid, 'keys')), t = times(); let n = 0;
    snap.forEach(d => {
      const k = dec(d.id), r = d.data();
      if(SKIP.test(k) || (t[k] || 0) >= r.t) return;
      if(r.del) localStorage.removeItem(k); else localStorage.setItem(k, r.v);
      t[k] = r.t; n++;
    });
    localStorage.setItem('gxy_save_times', JSON.stringify(t));
    setMeta({ ...meta(), last:Date.now() });
    if(n && !quiet) H.toast('☁️', 'Cloud saves loaded', `${n} save${n > 1 ? 's' : ''} updated from your other device`);
    H.emit(); return n;
  } finally { busy = false; }
}
// Upload: every key changed since the last upload.
export async function push(all){
  const u = await user(); if(!u) return 0;
  const m = meta(), t = times(), since = all ? 0 : (m.pushed || 0), big = []; let n = 0;
  const keys = new Set([...Object.keys(localStorage), ...Object.keys(t)]);
  for(const k of keys){
    if(SKIP.test(k) || (t[k] || 0) <= since && !(all && !t[k])) continue;
    const v = localStorage.getItem(k), ref = doc(db, 'gxy_saves', u.uid, 'keys', enc(k));
    if(v === null){ await setDoc(ref, { del:true, t:t[k] || Date.now() }); n++; continue; }
    if(v.length > MAX){ big.push(k); continue; }
    await setDoc(ref, { v, t:t[k] || Date.now() }); n++;
  }
  setMeta({ ...meta(), pushed:Date.now(), last:Date.now(), big });
  H.emit(); return n;
}
