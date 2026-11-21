// Deterministic schedule + catalog tests for the GXY XP Store. Run: node store/store.test.js
const assert = require('assert');
const S = require('./store-core.js');
let pass = 0; const t = (name, fn) => { try{ fn(); pass++; }catch(e){ console.error('FAIL', name, '\n ', e.message); process.exitCode = 1; } };
const CT = (y, m, d, h, mi = 0, s = 0) => S.chicagoToUtc(y, m, d, h, mi, s);   // a Chicago wall-clock instant
const at = (...a) => S.rotation(CT(...a));

/* catalog */
t('17 catalog records', () => assert.strictEqual(S.CATALOG.length, 17));
t('12 daily items, 4 per group', () => { const d = S.CATALOG.filter(x => x.shopSection === 'daily'); assert.strictEqual(d.length, 12); ['A','B','C'].forEach(g => assert.strictEqual(d.filter(x => x.rotationGroup === g).length, 4)); });
t('3 weekly, 2 featured', () => { assert.strictEqual(S.CATALOG.filter(x => x.shopSection === 'weekly').length, 3); assert.strictEqual(S.CATALOG.filter(x => x.shopSection === 'featured').length, 2); });
t('Boss Rush is not in the catalog', () => assert(!S.CATALOG.some(x => /boss.?rush/i.test(x.id + x.title))));
t('unique ids', () => assert.strictEqual(new Set(S.CATALOG.map(x => x.id)).size, 17));
t('exact group membership', () => {
  const g = k => S.CATALOG.filter(x => x.rotationGroup === k).map(x => x.id).sort().join();
  assert.strictEqual(g('A'), ['kraken2022-archives','storm-season','vice-city-theme','sports-legends'].sort().join());
  assert.strictEqual(g('B'), ['brand-clicker-27','hockey-play-now','metro-builder','galaxy-profile-pack'].sort().join());
  assert.strictEqual(g('C'), ['vice-city-transit','technologies','disaster-pack','classic-theme'].sort().join());
});
t("Brand Clicker '27 is still a hidden placeholder", () => assert(S.byId('brand-clicker-27').hidden));
t('Kraken2022 Archives is visible', () => assert(!S.byId('kraken2022-archives').hidden));
t('nothing is released yet (no phantom inventory)', () => assert(S.CATALOG.every(x => x.releaseState === 'coming_soon')));
t('transit DLCs point at the real game id', () => ['metro-builder','vice-city-transit'].forEach(id => assert.strictEqual(S.byId(id).baseGameId, 'transit-tycoon')));

/* daily rotation (brief table) */
const days = [[23,'A','retro-retail'],[24,'B','retro-retail'],[25,'C','retro-retail'],[26,'A','retro-retail'],[27,'B','retro-retail'],[28,'C','retro-retail'],[29,'A','retro-retail'],[30,'B','cable-boom']];
days.forEach(([d, g, w]) => t(`Nov ${d} 18:00 CT → ${g} / ${w}`, () => { const r = at(2026, 11, d, 18); assert.strictEqual(r.dailyGroup, g); assert.deepStrictEqual(r.weekly, [w]); }));
t('Dec 1 18:00 → C / cable-boom', () => { const r = at(2026, 12, 1, 18); assert.strictEqual(r.dailyGroup, 'C'); assert.deepStrictEqual(r.weekly, ['cable-boom']); });
t('weekly cycle Dec 7/14/21/28', () => [[7,'after-dark'],[14,'retro-retail'],[21,'cable-boom'],[28,'after-dark']].forEach(([d, w]) => assert.deepStrictEqual(at(2026, 12, d, 18).weekly, [w])));
t('17:59:59 keeps the previous day; 18:00:00 switches', () => {
  assert.strictEqual(at(2026, 11, 24, 17, 59, 59).dailyGroup, 'A');
  assert.strictEqual(at(2026, 11, 24, 18, 0, 0).dailyGroup, 'B');
});
t('weekly switches Monday 18:00, not midnight', () => {
  assert.deepStrictEqual(at(2026, 11, 30, 0, 0, 1).weekly, ['retro-retail']);
  assert.deepStrictEqual(at(2026, 11, 30, 17, 59, 59).weekly, ['retro-retail']);
  assert.deepStrictEqual(at(2026, 11, 30, 18, 0, 0).weekly, ['cable-boom']);
});
t('store day spans midnight (Nov 24 02:00 is still the Nov 23 day)', () => assert.strictEqual(at(2026, 11, 24, 2).storeDate, '2026-11-23'));

/* featured cutoff */
t('featured shown Dec 31 18:00', () => assert.strictEqual(at(2026, 12, 31, 18).featured.length, 2));
t('featured shown Jan 1 17:59:59', () => assert.strictEqual(at(2027, 1, 1, 17, 59, 59).featured.length, 2));
t('featured gone Jan 1 18:00', () => assert.strictEqual(at(2027, 1, 1, 18).featured.length, 0));

/* time zones + DST */
t('18:00 Chicago is 19:00 New York, winter and summer', () => {
  const ny = ms => +new Intl.DateTimeFormat('en-US', { timeZone:'America/New_York', hour:'numeric', hourCycle:'h23' }).format(ms);
  assert.strictEqual(ny(CT(2026, 12, 1, 18)), 19);   // CST/EST
  assert.strictEqual(ny(CT(2027, 7, 1, 18)), 19);    // CDT/EDT
});
t('refresh stays 18:00 across DST start (Mar 14→15 2027) and end (Nov 6→7 2027)', () => {
  [[2027, 3, 14], [2027, 3, 15], [2027, 11, 6], [2027, 11, 7]].forEach(([y, m, d]) => {
    const r = at(y, m, d, 18), p = S.chicagoParts(r.nextRefreshAt);
    assert.strictEqual(p.hour, 18); assert.strictEqual(r.storeDate, `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  });
  // a 23-hour and a 25-hour store day still advance by exactly one group
  assert.strictEqual((S.CONFIG.dailyGroupIds.indexOf(at(2027, 3, 14, 18).dailyGroup) + 1) % 3, S.CONFIG.dailyGroupIds.indexOf(at(2027, 3, 15, 18).dailyGroup));
});
t('same answer regardless of device time zone (pure UTC instants in, Chicago math inside)', () => {
  const ms = Date.UTC(2026, 10, 25, 3, 30);   // = Nov 24 21:30 CST
  assert.strictEqual(S.rotation(ms).dailyGroup, 'B');
});
t('before the anchor the store reports not launched', () => assert.strictEqual(at(2026, 11, 22, 12).launched, false));
t('nextRefreshAt is the next 18:00 Chicago', () => { const r = at(2026, 11, 25, 9), p = S.chicagoParts(r.nextRefreshAt); assert.deepStrictEqual([p.month, p.day, p.hour], [11, 25, 18]); });

console.log(`${pass} tests passed${process.exitCode ? ', some FAILED' : ''}`);
