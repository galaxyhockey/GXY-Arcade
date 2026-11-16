/* ============================================================
   TV Battles — Show Catalog (EDITABLE)
   ------------------------------------------------------------
   Add, remove, or edit shows freely. Each show:
     title   : display name (keep these ORIGINAL — avoid real
               trademarked show names so the game stays shippable)
     genre   : one of the GENRE keys (news, sitcom, drama, reality,
               kids, sports, talk, movie, gameshow, documentary)
     q       : base quality 0.30–0.98 (how good/appealing it is)
     era     : 'classic' | 'modern' | 'new'  (flavor + trend hooks)
     eps     : episodes per season (series length; 0 = one-off like a movie)
   The game licenses, buys, and schedules these. Originals you
   produce are generated separately from PRODUCIBLE genres.
   ============================================================ */
window.GXY_TV_SHOWS = [
  /* ---------- SITCOMS ---------- */
  {title:"Laugh Track Lane", genre:"sitcom", q:0.80, era:"classic", eps:22},
  {title:"The Brackens", genre:"sitcom", q:0.72, era:"classic", eps:24},
  {title:"Office Hours", genre:"sitcom", q:0.68, era:"modern", eps:22},
  {title:"Roomies", genre:"sitcom", q:0.75, era:"modern", eps:20},
  {title:"The Corner Booth", genre:"sitcom", q:0.83, era:"classic", eps:24},
  {title:"Suburban Static", genre:"sitcom", q:0.63, era:"modern", eps:18},
  {title:"Two Left Feet", genre:"sitcom", q:0.70, era:"new", eps:16},
  {title:"Family Volume", genre:"sitcom", q:0.78, era:"modern", eps:22},

  /* ---------- DRAMAS ---------- */
  {title:"Crown & Country", genre:"drama", q:0.90, era:"modern", eps:13},
  {title:"Precinct 9", genre:"drama", q:0.78, era:"classic", eps:22},
  {title:"Vital Signs", genre:"drama", q:0.85, era:"modern", eps:20},
  {title:"Cold Harbor", genre:"drama", q:0.88, era:"new", eps:10},
  {title:"The Verdict", genre:"drama", q:0.80, era:"modern", eps:16},
  {title:"Ashfall", genre:"drama", q:0.92, era:"new", eps:8},
  {title:"Sterling Avenue", genre:"drama", q:0.74, era:"classic", eps:24},
  {title:"Blood & Oil", genre:"drama", q:0.82, era:"modern", eps:13},

  /* ---------- REALITY ---------- */
  {title:"Island Castaways", genre:"reality", q:0.72, era:"modern", eps:14},
  {title:"Kitchen Wars", genre:"reality", q:0.76, era:"modern", eps:16},
  {title:"Star Search Live", genre:"reality", q:0.70, era:"classic", eps:18},
  {title:"Flip This Block", genre:"reality", q:0.66, era:"modern", eps:12},
  {title:"The Dating Pool", genre:"reality", q:0.68, era:"new", eps:20},
  {title:"Runway Rivals", genre:"reality", q:0.71, era:"modern", eps:14},
  {title:"Roadhouse Rescue", genre:"reality", q:0.64, era:"modern", eps:12},

  /* ---------- KIDS ---------- */
  {title:"Bunny & Friends", genre:"kids", q:0.74, era:"classic", eps:26},
  {title:"Rocket Cadets", genre:"kids", q:0.68, era:"modern", eps:20},
  {title:"Doodle Squad", genre:"kids", q:0.71, era:"new", eps:24},
  {title:"Dino Detectives", genre:"kids", q:0.66, era:"modern", eps:22},
  {title:"The Puzzle Pals", genre:"kids", q:0.62, era:"classic", eps:26},

  /* ---------- SPORTS ---------- */
  {title:"Sunday Gridiron", genre:"sports", q:0.90, era:"modern", eps:18},
  {title:"Court Kings", genre:"sports", q:0.82, era:"modern", eps:26},
  {title:"Fast Lap Racing", genre:"sports", q:0.76, era:"modern", eps:20},
  {title:"The Fight Card", genre:"sports", q:0.79, era:"classic", eps:12},
  {title:"Extra Innings", genre:"sports", q:0.73, era:"classic", eps:30},

  /* ---------- TALK ---------- */
  {title:"Morning Buzz", genre:"talk", q:0.60, era:"modern", eps:200},
  {title:"After Dark w/ Vic", genre:"talk", q:0.72, era:"modern", eps:180},
  {title:"The Roundtable", genre:"talk", q:0.66, era:"classic", eps:150},
  {title:"Real Talk Daily", genre:"talk", q:0.64, era:"new", eps:200},
  {title:"Coffee & Company", genre:"talk", q:0.58, era:"classic", eps:180},

  /* ---------- MOVIES (one-offs) ---------- */
  {title:"Blockbuster Night", genre:"movie", q:0.78, era:"modern", eps:0},
  {title:"Cult Classics", genre:"movie", q:0.62, era:"classic", eps:0},
  {title:"Midnight Premiere", genre:"movie", q:0.84, era:"new", eps:0},
  {title:"Saturday Feature", genre:"movie", q:0.70, era:"classic", eps:0},

  /* ---------- GAME SHOWS ---------- */
  {title:"Spin to Win", genre:"gameshow", q:0.68, era:"classic", eps:100},
  {title:"Trivia Titans", genre:"gameshow", q:0.72, era:"modern", eps:90},
  {title:"The Big Deal", genre:"gameshow", q:0.66, era:"classic", eps:120},
  {title:"Cash Cascade", genre:"gameshow", q:0.63, era:"new", eps:80},

  /* ---------- DOCUMENTARY ---------- */
  {title:"Planet Wild", genre:"documentary", q:0.80, era:"modern", eps:8},
  {title:"History Uncovered", genre:"documentary", q:0.74, era:"classic", eps:10},
  {title:"Deep Dive", genre:"documentary", q:0.77, era:"new", eps:6},
  {title:"The Human Story", genre:"documentary", q:0.82, era:"modern", eps:8},
];
