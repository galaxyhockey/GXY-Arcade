// Back in the 2000s: The Game — the home computer screen (Draft #2). A period-style desktop drawn as a page overlay.
// The player never types: every step is a choice from the normal choice box, so keyboard and controller both work
// and nobody can overwrite a chat that the book fixes word for word.
import * as E from './engine.js';
import { H } from './game.js';
const { G } = E; let el = null;
const CSS = `#pcui{position:fixed;inset:0;z-index:15;background:linear-gradient(#3a6ea5,#5a8ec5 60%,#6aa84a 60%,#4a8a3a);font-family:Tahoma,Verdana,sans-serif;color:#111;display:none}
#pcui .win{position:absolute;left:50%;top:4vh;transform:translateX(-50%);width:min(780px,92vw);height:58vh;background:#ece9d8;border:3px solid #0a3ad0;border-radius:8px 8px 0 0;box-shadow:4px 6px 0 #0005;display:flex;flex-direction:column}
#pcui .tb{background:linear-gradient(#2a6af0,#0a3ad0);color:#fff;font-weight:bold;padding:6px 10px;font-size:15px;display:flex;justify-content:space-between;border-radius:5px 5px 0 0}
#pcui .tb b{background:#d8402a;border-radius:3px;padding:0 7px}
#pcui #pcB{flex:1;overflow:hidden;padding:12px 18px;font-size:clamp(13px,1.9vh,17px);line-height:1.45;background:#fff;margin:6px;border:2px inset #aaa}
#pcui #pcB h3{margin:0 0 6px;font-size:1.1em;color:#0a3ad0} #pcui #pcB p{margin:3px 0} #pcui #pcB .me{color:#c8202a;font-weight:bold} #pcui #pcB .you{color:#0a3ad0;font-weight:bold}
#pcui #pcB .in{display:block;margin-top:8px;border:2px inset #aaa;padding:5px 8px;background:#f7f7f2;min-height:1.3em} #pcui #pcB .dim{color:#777}
#pcui #pcB table{border-collapse:collapse;margin:6px 0} #pcui #pcB td{border:1px solid #9ab;padding:3px 10px;min-width:110px} #pcui #pcB td.h{background:#dfe6f2;font-weight:bold}
#pcui #pcB .slide{display:inline-block;width:150px;height:86px;border:2px solid #555;margin:4px;padding:6px;font-size:.8em;background:#fdf6d8;vertical-align:top}
#pcui #pcB .bro{display:flex;gap:6px} #pcui #pcB .bro div{flex:1;border:1px solid #888;height:150px;padding:6px;font-size:.85em;background:#f3f8ff}
#pcui .bar{position:absolute;left:0;right:0;bottom:0;height:34px;background:linear-gradient(#2a62d8,#1a4ab8);color:#fff;font-size:13px;display:flex;align-items:center;gap:14px}
#pcui .start{background:linear-gradient(#4aa84a,#2a7a2a);font-style:italic;font-weight:bold;padding:7px 18px 7px 12px;border-radius:0 12px 12px 0} #pcui #pcClk{margin-left:auto;padding:0 14px;background:#1a8ad8;align-self:stretch;display:flex;align-items:center}`;
export function pc(body, o = {}){ if(!el){ el = document.createElement('div'); el.id = 'pcui'; el.innerHTML = `<style>${CSS}</style><div class="win"><div class="tb"><span id="pcT"></span><b>x</b></div><div id="pcB"></div></div><div class="bar"><span class="start">start</span><span id="pcTask"></span><span id="pcClk"></span></div>`; document.body.appendChild(el); }
  el.style.display = 'block'; el.querySelector('#pcT').textContent = o.title || 'AOL Messenger'; el.querySelector('#pcB').innerHTML = body; el.querySelector('#pcTask').textContent = o.task || 'WINDOWS XP | AOL Messenger | Internet Explorer'; if(o.clock) el.querySelector('#pcClk').textContent = o.clock;
  G.cleanups = G.cleanups || []; if(!G.cleanups.includes(pcOff)) G.cleanups.push(pcOff); }
export function pcOff(){ if(el) el.style.display = 'none'; }
export const pcClock = t => { if(el) el.querySelector('#pcClk').textContent = t; };
// friends list exactly as the book prints it
export const friends = (rows, typed = '_____________________') => `<h3>AOL Messenger:</h3><p>Add a Friend: <u>${typed}</u></p><p>&nbsp;</p><p><b>Friends:</b></p>${rows.map(([n, s]) => `<p>- ${n} (${s})</p>`).join('')}`;
const row = ([sn, t], me) => sn ? `<p><span class="${sn.toLowerCase() === me.toLowerCase() ? 'me' : 'you'}">${sn}:</span> ${t}</p>` : `<p class="dim">${t}</p>`;
export const logHTML = (lines, me, typing = '') => `<h3>AOL Messenger:</h3>${lines.map(l => row(l, me)).join('')}${typing ? `<span class="in">${typing}</span>` : ''}`;
// plays a conversation: the other person's lines arrive on their own, Chris's lines are sent with one button
export async function chat(lines, me, o = {}){ const log = (o.before || []).slice();
  for(const l of lines){ if(l[0] && l[0].toLowerCase() === me.toLowerCase()){ pc(logHTML(log, me, l[1]), o); await H.choose(['Send']); } else if(l[0]){ pc(logHTML(log, me, '<span class="dim">' + l[0] + ' is typing...</span>'), o); await H.wait(o.fast ? 300 : 900); E.tone(880, 0, .08, 'sine', .04); }
    log.push(l); pc(logHTML(log, me), o); } await H.wait(500); return log; }
