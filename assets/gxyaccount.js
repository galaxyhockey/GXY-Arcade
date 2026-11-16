/* GXY Account — shared Firestore-backed account layer.
   Handles: linked Minecraft username, profile fields, and dashboard prefs.
   Falls back to localStorage automatically if Firestore is unavailable, so
   nothing breaks if the database is ever unreachable.

   Usage (module):
     import { gxyAccount } from '[root]assets/gxyaccount.js';
     await gxyAccount.ready();               // resolves once auth+doc are loaded
     gxyAccount.user                          // Firebase user or null
     gxyAccount.data                          // { mcUsername, dashboard, theme, dtheme, ... }
     await gxyAccount.linkUsername('Name')    // set + reserve username
     await gxyAccount.save({ ... })           // merge-save fields
     gxyAccount.onChange(cb)                  // subscribe to data changes
*/
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ",
  authDomain: "gxyhockey.firebaseapp.com",
  projectId: "gxyhockey",
  storageBucket: "gxyhockey.firebasestorage.app",
  messagingSenderId: "474584991663",
  appId: "1:474584991663:web:b8986544418d6b85fa115a",
  measurementId: "G-1S6M1F62RE"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
let db = null;
try { db = getFirestore(app); } catch(e){ db = null; }

const LS_KEY = 'gxy_account';
function lsLoad(){ try { return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); } catch(e){ return {}; } }
function lsSave(d){ try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch(e){} }

const state = {
  user: null,
  data: {},          // account document
  usesCloud: false,  // did we successfully read/write Firestore?
  _cbs: [],
  _readyResolvers: [],
  _ready: false
};

function emit(){ state._cbs.forEach(cb=>{ try{ cb(state.data); }catch(e){} }); }

function markReady(){
  state._ready = true;
  state._readyResolvers.forEach(r=>r());
  state._readyResolvers = [];
}

async function loadDoc(uid){
  // try Firestore first, fall back to localStorage merge
  const local = lsLoad();
  if(db){
    try{
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if(snap.exists()){
        state.data = snap.data() || {};
        state.usesCloud = true;
        // opportunistically push any local-only keys up (first migration)
        const merged = Object.assign({}, local, state.data);
        state.data = merged;
      } else {
        // create doc from whatever we have locally
        state.data = Object.assign({}, local, { createdAt: Date.now() });
        await setDoc(ref, state.data, { merge:true });
        state.usesCloud = true;
      }
      lsSave(state.data); // keep a local mirror
      return;
    }catch(e){
      // Firestore blocked/disabled — fall back silently
      state.usesCloud = false;
    }
  }
  state.data = local;
}

onAuthStateChanged(auth, async (user)=>{
  state.user = user || null;
  if(user){
    await loadDoc(user.uid);
  } else {
    state.data = lsLoad(); // anonymous: local only
  }
  emit();
  markReady();
});

export const gxyAccount = {
  get user(){ return state.user; },
  get data(){ return state.data; },
  get usesCloud(){ return state.usesCloud; },

  ready(){
    if(state._ready) return Promise.resolve();
    return new Promise(res=>state._readyResolvers.push(res));
  },

  onChange(cb){ state._cbs.push(cb); if(state._ready) cb(state.data); return ()=>{
    state._cbs = state._cbs.filter(x=>x!==cb);
  }; },

  async save(patch){
    state.data = Object.assign({}, state.data, patch);
    lsSave(state.data);
    emit();
    if(db && state.user){
      try{
        await setDoc(doc(db,'users',state.user.uid), Object.assign({}, patch, { updatedAt: Date.now() }), { merge:true });
        state.usesCloud = true;
      }catch(e){ state.usesCloud = false; }
    }
    return state.data;
  },

  // Link a Minecraft username. Simple (trust-based) for now, but also writes a
  // /usernames/<lower> reservation so profiles can be looked up and (later)
  // verified. Returns {ok, reason}.
  async linkUsername(name){
    name = String(name||'').trim();
    if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){
      return { ok:false, reason:'Enter a valid Minecraft username (3–16 letters, numbers, or underscore).' };
    }
    await this.save({ mcUsername: name, mcUsernameLower: name.toLowerCase(), linkedAt: Date.now() });
    if(db && state.user){
      try{
        await setDoc(doc(db,'usernames', name.toLowerCase()),
          { uid: state.user.uid, mcUsername: name, updatedAt: Date.now() }, { merge:true });
      }catch(e){}
    }
    return { ok:true };
  },

  async unlinkUsername(){
    await this.save({ mcUsername: null, mcUsernameLower: null, linkedAt: null });
    return { ok:true };
  },

  // Directory of all linked players (for the players list page)
  async listLinkedPlayers(){
    if(!db) return [];
    try{
      const snap = await getDocs(collection(db,'usernames'));
      const out = [];
      snap.forEach(d=>{ const v=d.data(); if(v && v.mcUsername) out.push(v); });
      return out;
    }catch(e){ return []; }
  },

  // Look up a single player's account doc by username (for profile pages)
  async findByUsername(name){
    if(!db) return null;
    const lower = String(name||'').toLowerCase();
    try{
      const unameSnap = await getDoc(doc(db,'usernames',lower));
      if(unameSnap.exists()){
        const uid = unameSnap.data().uid;
        const userSnap = await getDoc(doc(db,'users',uid));
        if(userSnap.exists()) return userSnap.data();
        return { mcUsername: unameSnap.data().mcUsername };
      }
    }catch(e){}
    return null;
  }
};

window.gxyAccount = gxyAccount; // also expose globally for non-module callers
