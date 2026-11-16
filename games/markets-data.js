/* Supermarket Wars 2.0 — market & chain definitions.
   Each rival maps a REAL chain to the sim's kind (discounter/premium/balanced)
   plus tuning (priceMult, quality, marketing, capacity) reflecting its reputation.
   The simulation core is unchanged; this just feeds it varied opponents. */
window.GXY_MARKETS = {
  USA: {
    label: "United States", currency: "$", flag: "🇺🇸",
    cities: {
      STL: { name: "St. Louis", demo:"Balanced Midwest market", rivals:[
        { name:"Schnucks",   kind:"balanced",   priceMult:1.40, quality:1.05, marketing:0.12, capacity:1400, color:"#E5342A", desc:"Dominant local chain. Steady, well-run." },
        { name:"Dierbergs",  kind:"premium",    priceMult:1.60, quality:1.30, marketing:0.18, capacity:1150, color:"#2E9E4F", desc:"Upscale family-owned. Quality focus." },
        { name:"Aldi",       kind:"discounter", priceMult:0.92, quality:0.85, marketing:0.10, capacity:1600, color:"#0B4EA2", desc:"Ruthless discounter. Rock-bottom prices." },
      ]},
      NYC: { name: "New York City", demo:"Dense, competitive, price-aware", rivals:[
        { name:"ShopRite",     kind:"balanced",   priceMult:1.35, quality:1.00, marketing:0.14, capacity:1500, color:"#E5342A", desc:"Big cooperative. Volume player." },
        { name:"Stop & Shop",  kind:"balanced",   priceMult:1.45, quality:1.05, marketing:0.16, capacity:1400, color:"#F59E0B", desc:"Established regional generalist." },
        { name:"Fairway",      kind:"premium",    priceMult:1.65, quality:1.35, marketing:0.20, capacity:1050, color:"#2E9E4F", desc:"Gourmet market. Foodie destination." },
      ]},
      LA: { name: "Los Angeles", demo:"Sprawling market, premium tier huge", rivals:[
        { name:"Ralphs",      kind:"balanced",   priceMult:1.42, quality:1.05, marketing:0.14, capacity:1450, color:"#E5342A", desc:"Kroger-owned mainstay." },
        { name:"Vons",        kind:"balanced",   priceMult:1.44, quality:1.05, marketing:0.15, capacity:1400, color:"#0B4EA2", desc:"Albertsons banner. Broad reach." },
        { name:"Albertsons",  kind:"balanced",   priceMult:1.46, quality:1.08, marketing:0.16, capacity:1400, color:"#1D4ED8", desc:"Large national generalist." },
        { name:"Erewhon",     kind:"premium",    priceMult:2.00, quality:1.50, marketing:0.30, capacity:850,  color:"#8A5CF6", desc:"Ultra-premium. Wellness cult status." },
      ]},
      CHI: { name: "Chicago", demo:"Two strong incumbents", rivals:[
        { name:"Jewel-Osco",  kind:"balanced",   priceMult:1.42, quality:1.05, marketing:0.15, capacity:1500, color:"#E5342A", desc:"Chicago institution. Dominant." },
        { name:"Mariano's",   kind:"premium",    priceMult:1.62, quality:1.32, marketing:0.20, capacity:1150, color:"#2E9E4F", desc:"Upscale experience-driven chain." },
      ]},
      HOU: { name: "Houston", demo:"H-E-B country", rivals:[
        { name:"H-E-B",       kind:"balanced",   priceMult:1.34, quality:1.20, marketing:0.20, capacity:1650, color:"#E5342A", desc:"Beloved Texas juggernaut. Hard to beat." },
        { name:"Kroger",      kind:"balanced",   priceMult:1.44, quality:1.05, marketing:0.15, capacity:1450, color:"#0B4EA2", desc:"National giant. Broad selection." },
        { name:"Randalls",    kind:"premium",    priceMult:1.58, quality:1.25, marketing:0.16, capacity:1100, color:"#2E9E4F", desc:"Albertsons' upscale Texas banner." },
      ]},
      DAL: { name: "Dallas", demo:"Texas showdown", rivals:[
        { name:"Tom Thumb",   kind:"balanced",   priceMult:1.46, quality:1.10, marketing:0.16, capacity:1350, color:"#F59E0B", desc:"Albertsons banner. Local staple." },
        { name:"Kroger",      kind:"balanced",   priceMult:1.44, quality:1.05, marketing:0.15, capacity:1450, color:"#0B4EA2", desc:"National giant. Broad selection." },
        { name:"H-E-B",       kind:"balanced",   priceMult:1.34, quality:1.20, marketing:0.20, capacity:1650, color:"#E5342A", desc:"Texas juggernaut expanding north." },
      ]},
      MIN: { name: "Minneapolis", demo:"Upper-Midwest mix", rivals:[
        { name:"Cub Foods",       kind:"balanced",   priceMult:1.38, quality:1.00, marketing:0.14, capacity:1500, color:"#E5342A", desc:"Value-focused local leader." },
        { name:"Lunds & Byerlys", kind:"premium",    priceMult:1.66, quality:1.38, marketing:0.20, capacity:1050, color:"#2E9E4F", desc:"High-end Twin Cities favorite." },
        { name:"Hy-Vee",          kind:"balanced",   priceMult:1.44, quality:1.12, marketing:0.18, capacity:1400, color:"#0B4EA2", desc:"Employee-owned, service-driven." },
      ]},
    }
  },
  UK: {
    label: "United Kingdom", currency: "£", flag: "🇬🇧",
    cities: {
      LDN: { name: "London", demo:"The Big Four vs the discounters", rivals:[
        { name:"Tesco",       kind:"balanced",   priceMult:1.40, quality:1.08, marketing:0.20, capacity:1650, color:"#0B4EA2", desc:"Market leader. Enormous reach." },
        { name:"Sainsbury's", kind:"balanced",   priceMult:1.46, quality:1.15, marketing:0.18, capacity:1450, color:"#F59E0B", desc:"Quality-leaning big-four rival." },
        { name:"Asda",        kind:"balanced",   priceMult:1.34, quality:1.00, marketing:0.14, capacity:1550, color:"#2E9E4F", desc:"Value-focused superstore." },
        { name:"Aldi",        kind:"discounter", priceMult:0.92, quality:0.88, marketing:0.10, capacity:1600, color:"#0057A6", desc:"Aggressive discounter. Surging share." },
        { name:"Lidl",        kind:"discounter", priceMult:0.94, quality:0.88, marketing:0.10, capacity:1550, color:"#E5342A", desc:"Discounter twin. Relentless on price." },
      ]},
    }
  }
};
