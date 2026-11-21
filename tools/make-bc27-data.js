// Builds Brand Clicker '27 data from the creator's extracted original backgrounds.
// Usage: node tools/make-bc27-data.js <path-to-unzipped-package>
// - Copies every unique background file (by sha256) into games/bc27/bg/ unchanged.
// - Writes games/bc27/brands.js: collectible brands with normalized ids/rarities and one background variant per source version.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const pkg = process.argv[2], out = path.join(__dirname, '..', 'games', 'bc27');
const inv = JSON.parse(fs.readFileSync(path.join(pkg, 'background_inventory.json'), 'utf8'));
const VERSIONS = [['Simple_Beta', 'Simple Beta'], ['Full_Beta', 'Full Beta'], ['PC_Edition', 'PC Edition'], ['Season_1_Nexus', 'Season 1: The Nexus'], ['Season_2_Weather_Havoc', 'Season 2: Weather Havoc']];
const RARITIES = ['Starter', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Chroma', 'Teslic'];
// UI screens and tests from the original projects are archived, not collectible
const NOT_BRAND = /BRAND SHOP|CONTRACTS MENU|TRADE MENU|EVENT WAIT|Clicker Pass|LVI Pass|RAY TRACING|Ray Tracing|^backdrop1$|THEME 2\.0 CONCEPT|Brand Revamp/i;
const rarityOf = n => { const m = n.match(/\((Starter|Common|Uncommon|Rare|Epic|Legendary|Chroma|Teslic|Chro)\b/i); if(!m) return null; const r = m[1].toLowerCase().startsWith('chro') ? 'Chroma' : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(); return RARITIES.includes(r) ? r : null; };
const brandName = n => n.replace(/\s*\((Starter|Common|Uncommon|Rare|Epic|Legendary|Chroma|Teslic|Chro).*$/i, '').replace(/\s+Menu\s*$/i, '').replace(/\s+/g, ' ').trim();
const slug = s => s.toLowerCase().normalize('NFKD').replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

fs.mkdirSync(path.join(out, 'bg'), { recursive:true });
const brands = {}, files = {}, archived = [];
for(const [v, label] of VERSIONS){
  for(const b of inv[v].stage_backdrops){
    const src = path.join(pkg, b.file), buf = fs.readFileSync(src), sha = crypto.createHash('sha256').update(buf).digest('hex');
    if(sha !== b.sha256) throw new Error('hash mismatch ' + b.file);
    const ext = path.extname(b.file), name = sha.slice(0, 16) + ext;
    if(!files[name]){ fs.writeFileSync(path.join(out, 'bg', name), buf); files[name] = 1; }
    const rarity = rarityOf(b.name);
    if(NOT_BRAND.test(b.name) || !rarity){ archived.push({ version:v, name:b.name, file:name }); continue; }
    const display = brandName(b.name), id = slug(display) + '-' + rarity.toLowerCase();
    const br = brands[id] || (brands[id] = { id, name:display, rarity, variants:[] });
    br.rarity = rarity;                                  // latest version's rarity wins
    br.variants.push({ version:v, label, sourceName:b.name, file:name });
  }
}
const list = Object.values(brands).sort((a, b) => RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity) || a.name.localeCompare(b.name));
fs.writeFileSync(path.join(out, 'brands.js'), `/* Brand Clicker '27: collectible brands built from the original Brand Clicker stage backdrops (tools/make-bc27-data.js).
   Each variant is the untouched original background from one source version. Brand names are the creator's; no affiliation with brand owners is implied. */
window.BC27_DATA = ${JSON.stringify({ rarities:RARITIES, versions:VERSIONS.map(([id, label]) => ({ id, label })), brands:list, archivedScreens:archived })};
`);
const by = r => list.filter(b => b.rarity === r).length;
console.log(`${list.length} brands · ${Object.keys(files).length} unique files · ${archived.length} non-brand screens archived`);
console.log(RARITIES.map(r => `${r}:${by(r)}`).join(' '));
