/* GXY Chat — website ↔ Minecraft chat over Firestore (relay) + verified linking.
   Pairs with gxyaccount.js for identity. Requires Firestore rules from
   CHAT-RELAY-SETUP.txt and the mod from MOD-CHAT-SPEC.txt.

   Exports:
     initChat({onMessage})   -> live subscription to /chat (returns unsubscribe)
     sendChat(text)          -> enqueue a message to Minecraft (/outbound) + optimistic /chat
     requestLinkCode()       -> create a /linkcodes doc, returns the code to type in game
     watchLinkStatus(cb)      -> live-watch whether the user's link is verified
*/
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { gxyAccount } from './gxyaccount.js';

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
let db=null; try{ db=getFirestore(app); }catch(e){ db=null; }

function randomCode(){
  const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let s=''; for(let i=0;i<6;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}

/* live subscription to the unified chat log */
export function initChat({ onMessage, max=60 } = {}){
  if(!db) return ()=>{};
  const q = query(collection(db,'chat'), orderBy('ts','desc'), limit(max));
  return onSnapshot(q, (snap)=>{
    const msgs=[];
    snap.forEach(d=>{ const v=d.data(); msgs.push(Object.assign({id:d.id}, v)); });
    msgs.reverse(); // oldest -> newest for display
    onMessage && onMessage(msgs);
  }, (err)=>{ /* permission or offline */ });
}

/* send a message: enqueue to MC (/outbound) and optimistically add to /chat */
export async function sendChat(text){
  text=String(text||'').trim();
  if(!text) return { ok:false, reason:'empty' };
  if(text.length>256) text=text.slice(0,256);
  const u=gxyAccount.user, d=gxyAccount.data||{};
  if(!u) return { ok:false, reason:'Sign in to chat.' };
  if(!d.mcUsername || !d.verified) return { ok:false, reason:'Verify your Minecraft account first.' };
  if(!db) return { ok:false, reason:'Chat unavailable.' };
  const base={ uid:u.uid, name:d.mcUsername, text:text, ts:serverTimestamp() };
  try{
    // to minecraft
    await addDoc(collection(db,'outbound'), Object.assign({ handled:false }, base));
    // to the website log (so it shows instantly for everyone)
    await addDoc(collection(db,'chat'), Object.assign({ source:'web' }, base));
    return { ok:true };
  }catch(e){ return { ok:false, reason:'Could not send (check that you are verified).' }; }
}

/* verified linking: create a pending code the player types in game */
export async function requestLinkCode(username){
  const u=gxyAccount.user; if(!u) return { ok:false, reason:'Sign in first.' };
  username=String(username||gxyAccount.data.mcUsername||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(username)) return { ok:false, reason:'Enter a valid Minecraft username first.' };
  if(!db) return { ok:false, reason:'Linking unavailable.' };
  const code=randomCode();
  try{
    await setDoc(doc(db,'linkcodes',code), {
      uid:u.uid, requestedName:username, verified:false, createdAt:serverTimestamp()
    });
    return { ok:true, code:code, username:username };
  }catch(e){ return { ok:false, reason:'Could not create code.' }; }
}

/* live-watch the user's account doc for verified flag flip */
export function watchLinkStatus(cb){
  const u=gxyAccount.user; if(!u||!db){ cb && cb(null); return ()=>{}; }
  return onSnapshot(doc(db,'users',u.uid), (snap)=>{
    cb && cb(snap.exists()?snap.data():null);
  }, ()=>{});
}
