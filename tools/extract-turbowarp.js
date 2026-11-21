// Rebuilds the original Scratch project (.sb3 zip) from a TurboWarp-packaged HTML file (base85 "data" chunks).
// Usage: node tools/extract-turbowarp.js <game.html> <out.sb3>
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const html = fs.readFileSync(src, 'latin1');
const size = +(html.match(/projectDecodeBuffer = new ArrayBuffer\((\d+)\)/) || [])[1];
if(!size) throw new Error('no base85 project buffer found (not a TurboWarp base85 package?)');
const val = c => { if(c === 0x28) c = 0x3c; if(c === 0x29) c = 0x3e; return c - 0x2a; };
const buf = new ArrayBuffer(size), view = new DataView(buf);
let off = 0, n = 0;
const re = /<script data="([^"]*)">decodeChunk\((\d+)\)<\/script>/g;
for(const m of html.matchAll(re)){
  const s = m[1], chunk = +m[2];
  for(let i = 0, j = off; i < s.length && j + 4 <= size; i += 5, j += 4)
    view.setUint32(j, val(s.charCodeAt(i + 4)) * 52200625 + val(s.charCodeAt(i + 3)) * 614125 + val(s.charCodeAt(i + 2)) * 7225 + val(s.charCodeAt(i + 1)) * 85 + val(s.charCodeAt(i)), true);
  off += chunk; n++;
}
fs.writeFileSync(out, Buffer.from(buf, 0, size));
console.log(`${n} chunks, ${size} bytes -> ${out}`);
