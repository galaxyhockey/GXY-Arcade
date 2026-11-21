// Extracts the original Brand Clicker (Full Game - PC Edition) look and rules from its Scratch project.
// Usage: node tools/make-bc27-orig.js <unzipped-sb3-folder>
// Writes games/bc27/orig/ (original sprite/backdrop files, unchanged) and games/bc27/orig.js (layout, brands, boxes).
const fs = require('fs'), path = require('path');
const dir = process.argv[2], P = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
const out = path.join(__dirname, '..', 'games', 'bc27', 'orig'); fs.mkdirSync(out, { recursive:true });
const T = n => P.targets.find(t => n === 'Stage' ? t.isStage : t.name === n);
const used = new Set();
const cos = c => { used.add(c.md5ext); return { name:c.name, file:c.md5ext, rcx:c.rotationCenterX, rcy:c.rotationCenterY, res:c.bitmapResolution || 1 }; };

// read "if Background = N then switch costume/backdrop to X" tables from a target's scripts
function table(target, varName, opcode, field){
  const B = target.blocks, map = {};
  for(const b of Object.values(B)){
    if(b.opcode !== 'control_if') continue;
    const c = B[b.inputs.CONDITION && b.inputs.CONDITION[1]]; if(!c || c.opcode !== 'operator_equals') continue;
    const o1 = c.inputs.OPERAND1[1], o2 = c.inputs.OPERAND2[1];
    if(!(Array.isArray(o1) && o1[1] === varName)) continue;
    const n = Array.isArray(o2) ? o2[1] : null; if(n == null) continue;
    let s = B[b.inputs.SUBSTACK && b.inputs.SUBSTACK[1]];
    while(s){ if(s.opcode === opcode){ const m = B[s.inputs[field][1]]; map[n] = m && m.fields[field === 'BACKDROP' ? 'BACKDROP' : 'COSTUME'][0]; break; } s = B[s.next]; }
  }
  return map;
}
// box tables: each "if random(1..K) = slot then set Brand Win to id, broadcast X" adds weight to that brand
function box(name){
  const t = T(name), B = t.blocks, w = {}; let K = 0;
  for(const b of Object.values(B)){
    if(b.opcode !== 'control_if') continue;
    const c = B[b.inputs.CONDITION[1]]; if(!c || c.opcode !== 'operator_equals') continue;
    const r = B[c.inputs.OPERAND1[1]]; if(!r || r.opcode !== 'operator_random') continue;
    K = +B[r.inputs.TO[1]] ? 0 : +r.inputs.TO[1][1];
    let s = B[b.inputs.SUBSTACK[1]], id = null, bc = null;
    while(s){ if(s.opcode === 'data_setvariableto' && s.fields.VARIABLE[0] === 'Brand Win') id = s.inputs.VALUE[1][1];
      if(s.opcode === 'event_broadcast') bc = s.inputs.BROADCAST_INPUT[1][1]; s = B[s.next]; }
    if(bc){ w[bc] = w[bc] || { weight:0, id }; w[bc].weight++; if(id) w[bc].id = id; }
  }
  return { range:K, weights:w };
}

const stage = T('Stage');
const backdropOf = table(stage, '☁ Background', 'looks_switchbackdropto', 'BACKDROP');
const logoOf = table(T('5cb77510a7c7755bf004c0fe'), '☁ Background', 'looks_switchcostumeto', 'COSTUME');
// broadcast name -> reveal name card (Sprite5) and reveal logo (Brand Win sprites)
const cardOf = {}, revealLogoOf = {};
for(const sn of ['Sprite5', 'Brand Win', 'Brand Win2', 'Brand Win3']){
  const B = T(sn).blocks;
  for(const b of Object.values(B)){
    if(b.opcode !== 'event_whenbroadcastreceived') continue;
    const s = B[b.next]; if(s && s.opcode === 'looks_switchcostumeto'){ const m = B[s.inputs.COSTUME[1]]; if(sn === 'Sprite5') cardOf[b.fields.BROADCAST_OPTION[0]] = m.fields.COSTUME[0]; }
  }
  if(sn !== 'Sprite5') for(const b of Object.values(B)){
    if(b.opcode !== 'control_if') continue; let s = B[b.inputs.SUBSTACK && b.inputs.SUBSTACK[1]], bc = null, lg = null;
    while(s){ if(s.opcode === 'event_broadcast') bc = s.inputs.BROADCAST_INPUT[1][1]; if(s.opcode === 'looks_switchcostumeto'){ const m = B[s.inputs.COSTUME[1]]; lg = m && m.fields.COSTUME[0]; } s = B[s.next]; }
    if(bc && lg) revealLogoOf[bc] = { sprite:sn, costume:lg };
  }
}
// Ethereum paid on CLAIM & APPLY, per Brand Win id (Sprite6)
const eth = {}; { const B = T('Sprite6').blocks;
  for(const b of Object.values(B)){ if(b.opcode !== 'control_if') continue; const c = B[b.inputs.CONDITION[1]]; if(!c || c.opcode !== 'operator_equals') continue;
    const o1 = c.inputs.OPERAND1[1]; if(!(Array.isArray(o1) && o1[1] === 'Brand Win')) continue; const id = c.inputs.OPERAND2[1][1];
    let s = B[b.inputs.SUBSTACK[1]]; while(s){ if(s.opcode === 'data_changevariableby' && s.fields.VARIABLE[0] === '☁ Ethereum') eth[id] = +s.inputs.VALUE[1][1]; s = B[s.next]; } } }

const boxes = { standard:box('Brand Win'), nhl:box('Brand Win2'), xmas:box('Brand Win3') };
const rarityOf = n => (n.match(/\((Starter|Common|Uncommon|Rare|Epic|Legendary|Chroma|Teslic)/) || [])[1] || 'Common';
const brands = {};
for(const [id, bd] of Object.entries(backdropOf)){
  const bc = Object.entries(boxes).flatMap(([, b]) => Object.entries(b.weights)).find(([, v]) => String(v.id) === id);
  const bcName = bc && bc[0];
  brands[id] = { id:+id, backdrop:bd, rarity:rarityOf(bd), name:bd.replace(/\s*Menu.*$/, '').replace(/\s*-\s*\(.*$/, '').trim(),
    logo:logoOf[id] || null, broadcast:bcName || null, card:bcName ? cardOf[bcName] || null : null,
    reveal:bcName ? revealLogoOf[bcName] || null : null, eth:eth[id] || 0 };
}
// sprites we rebuild, with original stage positions (Scratch coords: 480x360, origin center)
const SPR = { logo:'5cb77510a7c7755bf004c0fe', shop:'Sprite3', home:'Sprite7', trade:'Sprite16', settings:'Sprite20', pc:'Sprite23',
  boxStd:'Sprite4', boxNhl:'Sprite8', boxXmas:'Sprite11', next:'Sprite13', last:'Sprite14', claim:'Sprite6', card:'Sprite5',
  win:'Brand Win', win2:'Brand Win2', win3:'Brand Win3', box1980:'Sprite15', up1:'Sprite1', up2:'Sprite2' };
const sprites = {};
for(const [k, n] of Object.entries(SPR)){ const t = T(n); sprites[k] = { name:n, x:t.x, y:t.y, size:t.size, cur:t.currentCostume, costumes:t.costumes.map(cos) }; }
const backdrops = stage.costumes.map(cos);
for(const f of used) fs.copyFileSync(path.join(dir, f), path.join(out, f));
fs.writeFileSync(path.join(__dirname, '..', 'games', 'bc27', 'orig.js'),
`/* Brand Clicker! (The Brand Clicker Game) - Full Game - PC Edition, by Kraken2022: original layout, art and rules,
   extracted unchanged from the Scratch project by tools/make-bc27-orig.js. Brand names/logos belong to their owners. */
window.BC_ORIG = ${JSON.stringify({ sprites, backdrops, brands:Object.values(brands), boxes, prices:{ standard:125, nhl:55, xmas:0, shopUnlock:50, perClick:5 } })};
`);
console.log(Object.keys(brands).length + ' brands, ' + used.size + ' files');
console.log(JSON.stringify(boxes.standard.range), Object.keys(boxes.standard.weights).length + ' std entries', JSON.stringify(boxes.nhl.weights), JSON.stringify(boxes.xmas.weights));
Object.values(brands).forEach(b => { if(!b.logo || !b.card) console.log('note:', b.id, b.name, 'logo=' + b.logo, 'card=' + b.card); });
