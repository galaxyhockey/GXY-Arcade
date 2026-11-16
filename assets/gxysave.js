/* ============================================================
   GXY Save — shared cross-device cloud-save for GXY Web Arcade
   - Firestore-backed per user+game+slot, with localStorage mirror
   - Works signed-out too (device-local fallback)
   - Never throws into game code: all ops are try/caught
   window.gxySave.*  (also an ES module export)
   ============================================================ */
import { gxyAccount } from './gxyaccount.js';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg={apiKey:"AIzaSyCN4mEtGMjSxdgsTlthhzX6FXIjxltJKHQ",authDomain:"gxyhockey.firebaseapp.com",projectId:"gxyhockey",storageBucket:"gxyhockey.firebasestorage.app",messagingSenderId:"474584991663",appId:"1:474584991663:web:b8986544418d6b85fa115a"};
const app=getApps().length?getApps()[0]:initializeApp(cfg);
let db=null; try{ db=getFirestore(app); }catch(e){}

const lsKey=(g,s)=>'gxysave_'+g+'_'+s;
const docId=(uid,g,s)=>uid+'_'+g+'_'+s;

export const gxySave={
  async ready(){ try{ await gxyAccount.ready(); }catch(e){} },
  _uid(){ try{ return gxyAccount.user && gxyAccount.user.uid; }catch(e){ return null; } },

  /* Save a JSON-serializable blob. Writes localStorage immediately, cloud if signed in. */
  async save(gameId, data, slot){
    slot=slot||'main';
    const payload={data, updated:Date.now()};
    try{ localStorage.setItem(lsKey(gameId,slot), JSON.stringify(payload)); }catch(e){}
    try{
      await this.ready(); const uid=this._uid();
      if(uid && db){
        await setDoc(doc(db,'saves',docId(uid,gameId,slot)),
          {uid, gameId, slot, data:JSON.stringify(data), updated:serverTimestamp()});
        return {ok:true, cloud:true};
      }
    }catch(e){}
    return {ok:true, cloud:false};
  },

  /* Load newest available: prefer cloud, fall back to local mirror. */
  async load(gameId, slot){
    slot=slot||'main';
    let cloud=null, local=null;
    try{
      await this.ready(); const uid=this._uid();
      if(uid && db){ const s=await getDoc(doc(db,'saves',docId(uid,gameId,slot)));
        if(s.exists()){ const d=s.data(); cloud={data:JSON.parse(d.data), updated:(d.updated&&d.updated.toMillis?d.updated.toMillis():Date.now())}; } }
    }catch(e){}
    try{ const raw=localStorage.getItem(lsKey(gameId,slot)); if(raw) local=JSON.parse(raw); }catch(e){}
    // if both exist, prefer the newer; cloud wins ties (authoritative across devices)
    if(cloud && local) return (cloud.updated>=local.updated)? cloud.data : local.data;
    if(cloud) return cloud.data;
    if(local) return local.data;
    return null;
  },

  async has(gameId, slot){ return (await this.load(gameId,slot))!=null; },

  /* Quick synchronous local-only check (for instant UI before cloud resolves). */
  hasLocal(gameId, slot){
    slot=slot||'main';
    try{ return !!localStorage.getItem(lsKey(gameId,slot)); }catch(e){ return false; }
  },

  async remove(gameId, slot){
    slot=slot||'main';
    try{ localStorage.removeItem(lsKey(gameId,slot)); }catch(e){}
    try{ const uid=this._uid(); if(uid && db) await deleteDoc(doc(db,'saves',docId(uid,gameId,slot))); }catch(e){}
  },

  /* Returns a debounced save fn: call it freely; it writes at most every `delay` ms. */
  makeAutosave(gameId, getData, slot, delay){
    slot=slot||'main'; delay=delay||1500; let t=null; const self=this;
    return function(){ clearTimeout(t); t=setTimeout(()=>{ try{ self.save(gameId, getData(), slot); }catch(e){} }, delay); };
  }
};
window.gxySave=gxySave;
