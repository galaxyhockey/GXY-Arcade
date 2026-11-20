// Builds games/trivia-logos.js from the Simple Icons metadata (CC0 brand icons, https://simpleicons.org).
// Usage: node tools/make-logos.js <simple-icons.json>
// Row: [question, answer, accepted answers, difficulty, id, hint, logo] where logo = "slug|hex".
const fs = require('fs'), path = require('path');
const VERSION = '16.36.0';   // keep in sync with LOGO_CDN in trivia.html
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const icons = Array.isArray(raw) ? raw : raw.icons;

// Brands most people know on sight. Missing slugs are skipped (and reported).
const FAMOUS = `netflix spotify youtube facebook instagram x twitter tiktok snapchat whatsapp messenger telegram discord reddit pinterest linkedin tumblr twitch
google gmail googlechrome googlemaps googledrive googlephotos googleplay android apple appstore applemusic applepay icloud ios macos windows microsoft
microsoftoffice microsoftword microsoftexcel microsoftpowerpoint microsoftoutlook microsoftteams xbox playstation playstation4 playstation5 nintendo nintendoswitch
nintendo3ds steam epicgames roblox minecraft fortnite ea ubisoft activision blizzard riotgames leagueoflegends valorant counterstrike sega bandainamco
amazon amazonprime amazonalexa amazonaws ebay etsy walmart target costco ikea bestbuy homedepot lowes aldi lidl tesco kroger wish shopify alibaba aliexpress temu shein
paypal venmo cashapp visa mastercard americanexpress stripe klarna coinbase bitcoin ethereum dogecoin binance robinhood
uber ubereats lyft airbnb booking expedia tripadvisor doordash grubhub deliveroo
mcdonalds burgerking starbucks kfc subway dominos pizzahut tacobell wendys dunkindonuts chickfila chipotle cocacola pepsi redbull
nike adidas puma reebok newbalance underarmour jordan vans converse thenorthface patagonia levis zara hm uniqlo gucci louisvuitton chanel prada hermes rolex
toyota honda ford chevrolet tesla bmw mercedes audi volkswagen porsche ferrari lamborghini nissan hyundai kia mazda subaru volvo jeep dodge ram fiat peugeot renault
mitsubishi suzuki lexus cadillac buick gmc chrysler landrover jaguar maserati bentley rollsroyce astonmartin bugatti mclaren harleydavidson ducati yamaha kawasaki
shell bp chevron exxonmobil
boeing airbus delta americanairlines unitedairlines southwestairlines emirates qatarairways lufthansa britishairways ryanair easyjet
disney disneyplus hulu hbo hbomax max paramountplus peacock pixar marvel dcentertainment warnerbros universal lionsgate dreamworks
nbc cbs abc fox cnn bbc espn mtv nationalgeographic discovery hgtv
samsung sony lg panasonic philips intel amd nvidia qualcomm ibm hp dell lenovo asus acer msi razer logitech corsair canon nikon fujifilm gopro dji bose jbl beats
sonos garmin fitbit
adobe adobephotoshop adobeillustrator adobepremierepro adobeacrobatreader figma canva notion slack zoom skype dropbox evernote trello asana duolingo
wikipedia mozilla firefox opera brave safari microsoftedge yahoo bing duckduckgo baidu yandex
github gitlab openai chatgpt claude anthropic googlegemini
python javascript java cplusplus csharp php html5 css3 react nodedotjs
wordpress wix squarespace mailchimp hubspot salesforce oracle sap
fedex ups dhl usps
nba nfl mlb nhl fifa uefa premierleague mls nascar formula1 olympics wwe
pringles lego hasbro mattel barbie hotwheels nerf
pokemon sega pacman tetris angrybirds
mercadopago nubank revolut monzo wise n26
vodafone tmobile verizon att orange
huawei xiaomi oneplus oppo vivo motorola nokia blackberry
peloton strava
audible kindle goodreads imdb rottentomatoes letterboxd crunchyroll funimation
soundcloud bandcamp deezer tidal shazam pandora iheartradio
tinder bumble hinge
quora medium substack patreon kickstarter gofundme onlyfans
lufthansa klm airfrance turkishairlines
heineken budweiser guinness coronadotextra jackdaniels
nestle kelloggs mms snickers kitkat oreo nutella heinz
3m ge siemens bosch dyson whirlpool kitchenaid
deutschebank hsbc barclays bankofamerica chase wellsfargo citibank goldmansachs
ted khanacademy coursera udemy
playstationportable gameboy segadreamcast atari`.split(/\s+/).filter(Boolean);

const bySlug = new Map(icons.map(i => [i.slug || '', i]));
const slugOf = i => i.slug;
const missing = FAMOUS.filter(s => !bySlug.has(s));
const famous = [...new Set(FAMOUS.filter(s => bySlug.has(s)))];

const accepted = i => {
  const a = new Set();
  const al = i.aliases || {};
  (al.aka || []).forEach(x => a.add(x));
  (al.dup || []).forEach(x => a.add(x.title));
  Object.values(al.loc || {}).forEach(x => a.add(x));
  // common shorthands: "Node.js" -> "Node", "Adobe Photoshop" -> "Photoshop", "Google Maps" -> "Maps" is too loose, so only brand-prefixed product lines
  const t = i.title;
  if (/\.js$/i.test(t)) a.add(t.replace(/\.js$/i, ''));
  const pre = t.match(/^(Adobe|Microsoft|Apple|Amazon|Autodesk|Atlassian|JetBrains) (.+)$/); if (pre) a.add(pre[2]);
  a.delete(t);
  return [...a];
};
const row = (i, d) => ['Which brand or product does this logo belong to?', i.title, accepted(i), d, 'logo:' + i.slug, '', i.slug + '|' + i.hex];
const famousRows = famous.map(s => row(bySlug.get(s), 1));
const allRows = icons.map(i => row(i, 2));

fs.writeFileSync(path.join(__dirname, '..', 'games', 'trivia-logos.js'),
`/* Logo Quiz for GXY Trivia. Logos: Simple Icons ${VERSION} (CC0, https://simpleicons.org), loaded from jsDelivr.
   All trademarks belong to their owners. Generated by tools/make-logos.js. */
window.TRIVIA_SETS = window.TRIVIA_SETS || [];
window.TRIVIA_SETS.push({ id:'logos1', show:'Logo Quiz', name:'Logo Quiz: Famous Logos', qs:${JSON.stringify(famousRows)} });
window.TRIVIA_SETS.push({ id:'logos2', show:'Logo Quiz', name:'Logo Quiz: Logo Master', qs:${JSON.stringify(allRows)} });
`);
console.log('famous', famousRows.length, 'all', allRows.length, 'missing slugs:', missing.join(' '));
