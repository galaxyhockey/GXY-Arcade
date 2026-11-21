/* GXY XP Store core: the one catalog, the rotation engine and the store clock.
   Works in the browser (window.GXYStore) and in Node (module.exports) so the schedule can be tested.

   Owner-approved facts (GXY_Arcade_XP_Store_and_DLCs brief, v1.3):
   - 17 items: 3 Weekly Spotlight, 2 Limited-Time Featured, 12 Daily Discoveries in groups A/B/C.
   - Store day starts at 18:00 America/Chicago (19:00 Eastern year-round). Daily group A→B→C, weekly pool cycles every 7 store days.
   - Anchor: store day Monday 2026-11-23. Featured shelf ends 2027-01-01 18:00 Chicago (exclusive).
   - XP prices are PROVISIONAL. Nothing is purchasable unless releaseState === 'released'.
   Canonical game IDs come from the repo: the transit game is `transit-tycoon` (the brief also calls it "Transit Empire"). */
(function(root){
  const CONFIG = {
    version: 1,
    timezone: 'America/Chicago',
    refreshHour: 18,
    anchorStoreDate: '2026-11-23',
    dailyGroupIds: ['A', 'B', 'C'],
    weeklySpotlightIds: ['retro-retail', 'cable-boom', 'after-dark'],
    featuredIds: ['gridiron-dynasty', 'cartoon-classics'],
    featuredEndExclusiveLocal: '2027-01-01T18:00:00',   // configurable cutoff (Chicago local time)
  };

  // kind: dlc | cosmetic | cosmetic_bundle | game | game_collection
  // releaseState: coming_soon | released.  hidden: true = don't reveal the title yet (placeholder card instead).
  const I = (id, title, kind, baseGameId, section, group, priceXP, description, extra = {}) =>
    ({ id, title, kind, baseGameId, shopSection:section, rotationGroup:group, priceXP, priceIsProvisional:true, releaseState:'coming_soon',
       entitlement:'permanent', minimumPlatformVersion:'1.3', description, hidden:false, icon:'🎁', ...extra });
  const CATALOG = [
    // Weekly Spotlight pool (one per week)
    I('retro-retail', 'Supermarket Wars: Retro Retail', 'dlc', 'supermarket-wars', 'weekly', null, 6000, 'Build a grocery chain from the 1950s neighborhood grocer to modern retail: eras, store formats, a historical tech tree and era events.', { icon:'🏪' }),
    I('cable-boom', 'TV Battles: Cable Boom', 'dlc', 'tv-battles', 'weekly', null, 7500, 'Launch national cable networks from 1980 to 2010: carriage deals, channel genres, a classic cable guide and multi-network portfolios.', { icon:'📡' }),
    I('after-dark', 'Neon Siege: After Dark', 'dlc', 'neon-siege', 'weekly', null, 4000, 'Night-time tower defense: EMP drones, splitters, stealth crawlers, four new towers, blackout maps and a Nightfall campaign.', { icon:'🌙' }),
    // Limited-Time Featured (fixed until the cutoff)
    I('gridiron-dynasty', 'YOUFL Football: Gridiron Dynasty', 'dlc', 'gxy-football', 'featured', null, 10000, 'Run a franchise for decades: drafts, scouting, contracts, the salary cap, player aging, records and a Hall of Fame.', { icon:'🏈' }),
    I('cartoon-classics', 'GXY Trivia: Cartoon Classics', 'dlc', 'trivia', 'featured', null, 2500, 'Expert-level animated TV trivia with Cartoon Showdown, Expert Marathon, Episode Detective and more.', { icon:'📺' }),
    // Daily Discoveries: group A
    I('kraken2022-archives', 'Kraken2022 Archives', 'game_collection', null, 'daily', 'A', 3500, '29 original Scratch-era games by Kraken2022, preserved exactly as they were made: Brand Clicker editions, Spotify on Scratch, NHL Chase! and more. Not remastered; built for keyboard and mouse.', { icon:'🗄️', playUrl:'https://galaxyhockey.github.io/Kraken2022-Archives/', releaseState:'released', publishedVersion:'1.0' }),
    I('storm-season', 'Airport Empire: Storm Season', 'dlc', 'airport-empire', 'daily', 'A', 3000, 'A weather-disruption scenario pack: hurricanes, blizzards and ground stops with recovery goals.', { icon:'🌀' }),
    I('vice-city-theme', 'Vice City Theme', 'cosmetic', null, 'daily', 'A', 750, 'A neon pink-and-teal sunset theme for the arcade launcher. Cosmetic only.', { icon:'🌴' }),
    I('sports-legends', 'GXY Trivia: Sports Legends', 'dlc', 'trivia', 'daily', 'A', 2000, 'A sports trivia pack with sourced questions, difficulty tiers and accepted-answer aliases.', { icon:'🏆' }),
    // group B
    I('brand-clicker-27', "Brand Clicker '27", 'game', null, 'daily', 'B', 4500, 'A brand-new revival of the original Scratch-era clicker.', { hidden:true, icon:'🖱️' }),
    I('hockey-play-now', 'GXY Hockey: Play Now', 'dlc', 'gxy-hockey', 'daily', 'B', 2000, 'A dedicated quick-match hockey experience built on the existing controls and teams.', { icon:'🏒' }),
    I('metro-builder', 'Transit Empire: Metro Builder', 'dlc', 'transit-tycoon', 'daily', 'B', 3000, 'Expanded subway construction scenarios and tools for Transit Tycoon.', { icon:'🚇', note:'Base game in the arcade: Transit Tycoon' }),
    I('galaxy-profile-pack', 'GXY Arcade: Galaxy Profile Pack', 'cosmetic_bundle', null, 'daily', 'B', 600, 'Profile backgrounds, frames and avatar cosmetics. Cosmetic only.', { icon:'🌌' }),
    // group C
    I('vice-city-transit', 'Transit Tycoon: Vice City', 'dlc', 'transit-tycoon', 'daily', 'C', 3000, 'A new coastal city for Transit Tycoon with its own map, routes and objectives.', { icon:'🌆' }),
    I('technologies', 'Technology Empire: Technologies', 'dlc', 'gxy-tech-empire', 'daily', 'C', 3500, 'New research tree additions, components and strategic decisions.', { icon:'🔬' }),
    I('disaster-pack', 'Supermarket Wars: Disaster Pack', 'dlc', 'supermarket-wars', 'daily', 'C', 2500, 'Supply disruptions, emergencies and extra scenarios.', { icon:'🌪️' }),
    I('classic-theme', 'GXY Arcade: Classic Theme', 'cosmetic', null, 'daily', 'C', 500, 'A nostalgic early-2000s browser-game-portal skin for the launcher. Cosmetic only.', { icon:'🕹️' }),
  ];
  const byId = id => CATALOG.find(x => x.id === id);

  /* ---------------- Chicago time (DST-safe, no client-clock date math) ---------------- */
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone:CONFIG.timezone, hourCycle:'h23', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
  function chicagoParts(ms){
    const p = {}; fmt.formatToParts(new Date(ms)).forEach(x => { if(x.type !== 'literal') p[x.type] = +x.value; });
    return p;   // { year, month, day, hour, minute, second } in Chicago local time
  }
  // UTC instant of a Chicago local wall-clock time (tries both possible offsets: CST −6 and CDT −5)
  function chicagoToUtc(y, mo, d, h = 0, mi = 0, s = 0){
    for(const off of [5, 6]){ const t = Date.UTC(y, mo - 1, d, h + off, mi, s), p = chicagoParts(t); if(p.year === y && p.month === mo && p.day === d && p.hour === h && p.minute === mi) return t; }
    return Date.UTC(y, mo - 1, d, h + 6, mi, s);
  }
  const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 864e5);   // calendar-day number, no DST involved
  const fromDayNum = n => { const t = new Date(n * 864e5); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
  const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const mod = (a, n) => ((a % n) + n) % n;

  // The store day that is open at `now`: it began at the latest Chicago 18:00 at or before now.
  function storeDay(nowMs){
    const p = chicagoParts(nowMs);
    let n = dayNum(p.year, p.month, p.day); if(p.hour < CONFIG.refreshHour) n -= 1;
    const [y, m, d] = fromDayNum(n);
    const [ay, am, ad] = CONFIG.anchorStoreDate.split('-').map(Number), since = n - dayNum(ay, am, ad);
    const [ny, nm, nd] = fromDayNum(n + 1);
    return { date:iso(y, m, d), dayIndex:since, startsAt:chicagoToUtc(y, m, d, CONFIG.refreshHour), nextRefreshAt:chicagoToUtc(ny, nm, nd, CONFIG.refreshHour) };
  }
  function rotation(nowMs){
    const sd = storeDay(nowMs);
    const [fy, fm, fd, fh] = CONFIG.featuredEndExclusiveLocal.match(/\d+/g).map(Number);
    const featuredEnd = chicagoToUtc(fy, fm, fd, fh);
    const group = CONFIG.dailyGroupIds[mod(sd.dayIndex, CONFIG.dailyGroupIds.length)];
    const weeklyId = CONFIG.weeklySpotlightIds[mod(Math.floor(sd.dayIndex / 7), CONFIG.weeklySpotlightIds.length)];
    // next Monday 18:00: the weekly cycle runs from the anchor Monday in 7-day blocks
    const nextWeekStartDay = CONFIG.anchorStoreDate.split('-').map(Number);
    const weekStartIdx = Math.floor(sd.dayIndex / 7) * 7 + 7;
    const [wy, wm, wd] = fromDayNum(dayNum(...nextWeekStartDay) + weekStartIdx);
    return {
      launched: sd.dayIndex >= 0,
      storeDate: sd.date, dayIndex: sd.dayIndex, nextRefreshAt: sd.nextRefreshAt, nextWeeklyAt: chicagoToUtc(wy, wm, wd, CONFIG.refreshHour),
      dailyGroup: group,
      daily: CATALOG.filter(x => x.shopSection === 'daily' && x.rotationGroup === group).map(x => x.id),
      weekly: [weeklyId],
      featured: nowMs < featuredEnd ? CONFIG.featuredIds.slice() : [],
      featuredEndsAt: featuredEnd,
    };
  }
  const inRotation = (id, nowMs) => { const r = rotation(nowMs); return r.launched && [...r.daily, ...r.weekly, ...r.featured].includes(id); };

  /* ---------------- store clock: server time, not the device clock ---------------- */
  // GitHub Pages sends a Date header on every response; we use it to correct the device clock.
  let offset = 0, verified = false;
  async function syncClock(url){
    try{
      const t0 = Date.now(), r = await fetch(url, { method:'HEAD', cache:'no-store' }), t1 = Date.now(), d = Date.parse(r.headers.get('date'));
      if(isFinite(d)){ offset = d + (t1 - t0) / 2 - t1; verified = true; }
    }catch(e){}
    return { verified, offset };
  }
  const now = () => Date.now() + offset;

  const api = { CONFIG, CATALOG, byId, storeDay, rotation, inRotation, chicagoParts, chicagoToUtc, syncClock, now, clockVerified:() => verified };
  if(typeof module !== 'undefined' && module.exports) module.exports = api; else root.GXYStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
