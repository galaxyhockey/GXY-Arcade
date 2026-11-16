/* Supermarket Wars: Empire — simulation engine (built for scale).
   Reuses the attractiveness/share DNA of the classic game but runs a
   LIGHT per-store model so a whole metro (50+ towns, many stores) sims fast.

   A town has demand derived from population + income mix. Your stores and
   local rivals in that town compete for the town's grocery spend via the
   same price/quality/marketing attractiveness curve. Stores AGE, which
   erodes appeal and raises upkeep until remodeled/rebuilt.
*/
(function(){
  const ELAST = 2.0;            // price sensitivity (per-store light model)
  const WEEKLY_SPEND = 38;      // $ grocery spend per person per week
  const BASE_MARGIN = 1.35;     // default price multiplier stores open at

  // income tier (1..5) shifts how shoppers weigh price vs quality
  // budget towns reward low prices; affluent towns reward quality
  function tierWeights(income){
    // returns {priceW, qualW} — higher priceW = more price-sensitive
    const t = Math.max(1, Math.min(5, income));
    return { priceW: 1.4 - (t-1)*0.12, qualW: 0.6 + (t-1)*0.18 };
  }

  // a store's pull in its town
  function storeAppeal(store, town){
    const w = tierWeights(town.income);
    const priceScore = Math.pow(1/store.priceMult, ELAST * w.priceW);
    const ageFactor = ageAppeal(store);              // newer = better
    const qual = Math.pow(store.quality, w.qualW);
    const mkt = (1 + store.marketing*0.5);
    return priceScore * qual * mkt * ageFactor * store.reputation;
  }

  // store age → appeal multiplier (degrades ~ from 1.0 new to ~0.7 at 10yr)
  function ageAppeal(store){
    const yrs = store.ageWeeks/52;
    return Math.max(0.62, 1 - yrs*0.035);
  }
  // upkeep grows with age + size
  function storeUpkeep(store){
    const ageMult = 1 + (store.ageWeeks/52)*0.05;
    return (3200 + store.capacity*4.5) * ageMult * (store.selfCheckout?0.85:1);
  }

  // town total weekly grocery demand ($), grows slightly over time
  function townDemand(town){
    return town.pop*1000 * WEEKLY_SPEND * (town.growth||1);
  }

  // simulate ONE town for one week: returns per-store results
  const BASKET = 48;   // $ average basket per customer visit
  function simTown(town, yourStores, rivalStores){
    const stores = [...yourStores, ...rivalStores];
    if(!stores.length) return [];
    const appeals = stores.map(s=>storeAppeal(s, town));
    const sum = appeals.reduce((a,b)=>a+b,0) || 1;
    const demand$ = townDemand(town);
    return stores.map((s,i)=>{
      const share = appeals[i]/sum;
      let revenue = share * demand$;
      // capacity throttle: a store can only serve capacity*BASKET per week
      const maxRev = s.capacity * BASKET;
      const soldOut = revenue > maxRev;
      if(soldOut) revenue = maxRev;
      // margin: priceMult sets gross margin; typical grocery net margin is thin
      const cogs = revenue / s.priceMult;
      const grossProfit = revenue - cogs;
      const upkeep = storeUpkeep(s);
      const net = grossProfit - upkeep;
      // sold-out hurts reputation slightly (unmet demand)
      return { store:s, share, revenue, cogs, grossProfit, upkeep, net, soldOut };
    });
  }

  // capital cost to open a store in a town (scales with pop + income)
  function openCost(town){
    return Math.round(18000 + town.pop*180 + town.income*4000);
  }
  function remodelCost(store){ return Math.round(9000 + store.capacity*4); }
  function rebuildCost(store){ return Math.round(22000 + store.capacity*6); }
  function expandCost(store){ return Math.round(7000 * Math.pow(1.2,(store.capacity-1000)/300)); }

  // factory for a new store
  function newStore(name, townName, capacity){
    return { id:'s'+Math.random().toString(36).slice(2,8), name, town:townName,
             priceMult:BASE_MARGIN, quality:1.0, marketing:0.1, reputation:1.0,
             capacity:capacity||1200, ageWeeks:0, selfCheckout:false, share:0, lastNet:0 };
  }

  // build the local rival set for a town based on its income tier
  function townRivals(town, NR){
    const tier = town.income<=2 ? 'budget' : town.income>=4 ? 'premium' : 'mid';
    const defs = (NR&&NR[tier]) || [];
    // 2-3 rivals depending on competition strength
    const n = town.comp>1.1 ? 3 : town.comp<0.8 ? 1 : 2;
    return defs.slice(0,n).map(d=>{
      const s = newStore(d.name, town.name, 1100 + Math.round(town.pop*3));
      s.kind = d.kind; s.isRival = true;
      s.priceMult = d.kind==='discounter'?1.12 : d.kind==='premium'?1.7 : 1.4;
      s.quality = d.kind==='premium'?1.35 : d.kind==='discounter'?0.85 : 1.0;
      s.ageWeeks = 52*(2+Math.floor(Math.random()*8)); // established
      return s;
    });
  }

  window.GXY_ENGINE = {
    ELAST, storeAppeal, ageAppeal, storeUpkeep, townDemand, simTown,
    openCost, remodelCost, rebuildCost, expandCost, newStore, townRivals, tierWeights
  };
})();
