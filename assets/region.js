/* ============================================================
   GXY Region System — geo-aware features across Biking People World
   ------------------------------------------------------------
   Loaded automatically by theme.js on every page. Detects the
   visitor's country by IP (with a manual override + cache), then
   exposes a small API pages can use to gate features by region.

     window.gxyRegion.ready(fn)     -> run fn once region is known
     window.gxyRegion.country       -> "United States"
     window.gxyRegion.code          -> "US" (ISO-3166 alpha-2)
     window.gxyRegion.flag          -> "🇺🇸"
     window.gxyRegion.source        -> "geo" | "manual" | "fallback"
     window.gxyRegion.allows(id)    -> true/false for a feature id
     window.gxyRegion.reason(id)    -> short message if blocked
     window.gxyRegion.set(code)     -> manually set the country
     window.gxyRegion.open()        -> open the country switcher

   The gating rules live in GXY_REGION_RULES below — edit freely.
   Detection is best-effort (VPNs, API hiccups); the manual picker
   always lets anyone switch, so nobody is ever truly stuck.
   ============================================================ */
(function(){
  var KEY_CODE='gxy_region_code';        // saved country code
  var KEY_SRC ='gxy_region_source';      // how we got it
  var KEY_TS  ='gxy_region_ts';          // when we cached a geo lookup
  var CACHE_MS=1000*60*60*24*14;         // re-check geo every 2 weeks
  var root=(window.__gxyRoot)||'';

  /* ---- a compact country table (code -> name, flag). Extend as needed. ---- */
  var COUNTRIES={
    US:{n:"United States",f:"🇺🇸"}, CA:{n:"Canada",f:"🇨🇦"}, MX:{n:"Mexico",f:"🇲🇽"},
    GB:{n:"United Kingdom",f:"🇬🇧"}, IE:{n:"Ireland",f:"🇮🇪"}, FR:{n:"France",f:"🇫🇷"},
    DE:{n:"Germany",f:"🇩🇪"}, ES:{n:"Spain",f:"🇪🇸"}, IT:{n:"Italy",f:"🇮🇹"},
    NL:{n:"Netherlands",f:"🇳🇱"}, SE:{n:"Sweden",f:"🇸🇪"}, NO:{n:"Norway",f:"🇳🇴"},
    FI:{n:"Finland",f:"🇫🇮"}, DK:{n:"Denmark",f:"🇩🇰"}, PL:{n:"Poland",f:"🇵🇱"},
    PT:{n:"Portugal",f:"🇵🇹"}, CH:{n:"Switzerland",f:"🇨🇭"}, AT:{n:"Austria",f:"🇦🇹"},
    BE:{n:"Belgium",f:"🇧🇪"}, RU:{n:"Russia",f:"🇷🇺"}, UA:{n:"Ukraine",f:"🇺🇦"},
    JP:{n:"Japan",f:"🇯🇵"}, KR:{n:"South Korea",f:"🇰🇷"}, CN:{n:"China",f:"🇨🇳"},
    IN:{n:"India",f:"🇮🇳"}, ID:{n:"Indonesia",f:"🇮🇩"}, PH:{n:"Philippines",f:"🇵🇭"},
    TH:{n:"Thailand",f:"🇹🇭"}, VN:{n:"Vietnam",f:"🇻🇳"}, SG:{n:"Singapore",f:"🇸🇬"},
    MY:{n:"Malaysia",f:"🇲🇾"}, AU:{n:"Australia",f:"🇦🇺"}, NZ:{n:"New Zealand",f:"🇳🇿"},
    BR:{n:"Brazil",f:"🇧🇷"}, AR:{n:"Argentina",f:"🇦🇷"}, CL:{n:"Chile",f:"🇨🇱"},
    CO:{n:"Colombia",f:"🇨🇴"}, ZA:{n:"South Africa",f:"🇿🇦"}, NG:{n:"Nigeria",f:"🇳🇬"},
    EG:{n:"Egypt",f:"🇪🇬"}, TR:{n:"Turkey",f:"🇹🇷"}, SA:{n:"Saudi Arabia",f:"🇸🇦"},
    AE:{n:"UAE",f:"🇦🇪"}, IL:{n:"Israel",f:"🇮🇱"}
  };
  function nameFor(code){ return (COUNTRIES[code]&&COUNTRIES[code].n)||code||"Unknown"; }
  function flagFor(code){ return (COUNTRIES[code]&&COUNTRIES[code].f)||"🏳️"; }

  /* ---- the region API object ---- */
  var R={
    code:null, country:null, flag:"🏳️", source:"fallback",
    _ready:false, _cbs:[],
    ready:function(fn){ if(this._ready){ try{fn(this);}catch(e){} } else this._cbs.push(fn); },
    allows:function(id){ return gate(id).ok; },
    reason:function(id){ return gate(id).reason||""; },
    set:function(code){ setCountry(code,'manual'); },
    open:openPicker,
    countries:COUNTRIES
  };
  window.gxyRegion=R;

  function fireReady(){
    R._ready=true;
    var cbs=R._cbs.slice(); R._cbs.length=0;
    cbs.forEach(function(fn){ try{fn(R);}catch(e){} });
    try{ document.dispatchEvent(new CustomEvent('gxy-region', {detail:{code:R.code,country:R.country,source:R.source}})); }catch(e){}
    reflect();
  }

  function apply(code,source){
    R.code=code; R.country=nameFor(code); R.flag=flagFor(code); R.source=source;
    document.documentElement.setAttribute('data-region', code||'');
  }
  function setCountry(code,source){
    if(!code) return;
    code=(''+code).toUpperCase();
    try{ localStorage.setItem(KEY_CODE,code); localStorage.setItem(KEY_SRC,source); }catch(e){}
    apply(code,source);
    if(!R._ready) fireReady(); else { reflect(); refreshGates(); }
  }

  /* ---- detection ---- */
  function cachedFresh(){
    try{
      var c=localStorage.getItem(KEY_CODE), s=localStorage.getItem(KEY_SRC), ts=+localStorage.getItem(KEY_TS)||0;
      if(!c) return null;
      if(s==='manual') return {code:c,source:'manual'};           // manual choice never expires
      if(Date.now()-ts < CACHE_MS) return {code:c,source:'geo'};   // fresh geo cache
    }catch(e){}
    return null;
  }
  /* try a couple of free, HTTPS, CORS-friendly geo-IP endpoints in order */
  function detect(){
    var tries=[
      { url:'https://ipwho.is/?fields=country_code', get:function(j){ return j.country_code; } },
      { url:'https://get.geojs.io/v1/ip/country.json', get:function(j){ return j.country; } },
      { url:'https://ipapi.co/json/', get:function(j){ return j.country_code||j.country; } }
    ];
    var i=0;
    function next(){
      if(i>=tries.length){ finishFallback(); return; }
      var t=tries[i++];
      var done=false, to=setTimeout(function(){ if(!done){ done=true; next(); } }, 4000);
      fetch(t.url,{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
        if(done) return; done=true; clearTimeout(to);
        var code=t.get(j);
        if(code && (''+code).length===2){
          try{ localStorage.setItem(KEY_TS,''+Date.now()); }catch(e){}
          setCountry(code,'geo');
        } else next();
      }).catch(function(){ if(!done){ done=true; clearTimeout(to); next(); } });
    }
    next();
  }
  function finishFallback(){
    // last resort: try the browser's locale region, else default US, and let them switch
    var loc=null;
    try{
      var lang=(navigator.languages&&navigator.languages[0])||navigator.language||'';
      var m=lang.match(/[-_]([A-Za-z]{2})$/); if(m) loc=m[1].toUpperCase();
    }catch(e){}
    apply(loc||'US','fallback');
    fireReady();
  }

  function boot(){
    var c=cachedFresh();
    if(c){ apply(c.code,c.source); fireReady(); }
    else { detect(); }
  }

  /* ============================================================
     GATING RULES — EDIT THESE
     Each rule has an id, and one of:
       allow:['US','CA']     only these countries can use it
       block:['CN']          everyone EXCEPT these
     Plus a friendly 'reason' shown when blocked, and optional
     'label' used by region badges.
     A feature with no rule here is allowed everywhere.
     ============================================================ */
  var RULES=window.GXY_REGION_RULES|| {
    // examples — safe to change. These ids are referenced by pages/games.
    'neon-siege':      { block:[],                 reason:"" },
    'supermarket-wars':{ allow:null,               reason:"" },
    'tv-battles':      { allow:null,               reason:"" }
  };
  window.GXY_REGION_RULES=RULES;

  function gate(id){
    var rule=RULES[id];
    if(!rule) return {ok:true};
    var code=R.code||'';
    if(rule.allow && rule.allow.length){
      if(rule.allow.indexOf(code)===-1)
        return {ok:false, reason: rule.reason || ("Only available in: "+rule.allow.map(flagFor).join(' '))};
    }
    if(rule.block && rule.block.length){
      if(rule.block.indexOf(code)!==-1)
        return {ok:false, reason: rule.reason || ("Not available in "+R.flag+" "+R.country)};
    }
    return {ok:true};
  }

  /* ============================================================
     DECLARATIVE GATING via HTML attributes (no JS needed on pages)
       data-region-only="US,CA"     show element only in these
       data-region-block="CN,RU"    hide element in these
       data-region-feature="neon-siege"  gate by a RULES id
     Blocked elements get a lock overlay (for cards) or are hidden
     (for nav items), configurable with data-region-mode:
       "lock"  (default) dim + lock overlay + click intercept
       "hide"  remove from view
       "badge" just add a small region badge, stays usable
     ============================================================ */
  function elBlocked(el){
    var only=el.getAttribute('data-region-only');
    var block=el.getAttribute('data-region-block');
    var feat=el.getAttribute('data-region-feature');
    if(feat){ var g=gate(feat); if(!g.ok) return g.reason; }
    var code=R.code||'';
    if(only){ if(only.toUpperCase().split(/[,\s]+/).filter(Boolean).indexOf(code)===-1) return "Not available in "+R.flag+" "+R.country; }
    if(block){ if(block.toUpperCase().split(/[,\s]+/).filter(Boolean).indexOf(code)!==-1) return "Not available in "+R.flag+" "+R.country; }
    return null;
  }
  function refreshGates(){
    var els=document.querySelectorAll('[data-region-only],[data-region-block],[data-region-feature]');
    els.forEach(function(el){
      var reason=elBlocked(el);
      var mode=el.getAttribute('data-region-mode')||'lock';
      // clean previous state
      el.classList.remove('gxy-region-locked');
      var old=el.querySelector(':scope > .gxy-region-lock'); if(old) old.remove();
      el.style.removeProperty('display');
      if(!reason){ el.removeAttribute('data-region-blocked'); return; }
      el.setAttribute('data-region-blocked','1');
      if(mode==='hide'){ el.style.display='none'; return; }
      if(mode==='badge'){ return; } // CSS adds a small corner badge via [data-region-blocked]
      // default: lock overlay
      el.classList.add('gxy-region-locked');
      var ov=document.createElement('div');
      ov.className='gxy-region-lock';
      ov.innerHTML='<div class="grl-in"><div class="grl-ico">🔒</div><div class="grl-msg">'+esc(reason)+'</div><button class="grl-btn" type="button">Change region</button></div>';
      ov.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); openPicker(); });
      el.appendChild(ov);
    });
  }
  function esc(s){ return (''+s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  /* ---- reflect current region into any badge elements on the page ---- */
  function reflect(){
    var chips=document.querySelectorAll('[data-region-chip]');
    chips.forEach(function(c){
      if(!c.classList.contains('gxy-region-chip')) c.classList.add('gxy-region-chip');
      c.innerHTML=R.flag+' <span class="grc-code">'+ (R.code||'??') +'</span>';
      c.title='Region: '+R.country+' — tap to change';
      if(!c._gxyBound){ c._gxyBound=1; c.addEventListener('click',openPicker); }
    });
    // floating button (only if the page didn't place its own inline chip and didn't opt out)
    var floatEnabled = document.documentElement.getAttribute('data-region-float')!=='off';
    var hasInline = chips.length>0;
    var fb=document.getElementById('gxy-region-float');
    if(floatEnabled && !hasInline){
      if(!fb){
        fb=document.createElement('button');
        fb.id='gxy-region-float'; fb.type='button'; fb.className='gxy-region-chip gxy-region-float';
        fb.addEventListener('click',openPicker);
        (document.body||document.documentElement).appendChild(fb);
      }
      fb.innerHTML=R.flag+' <span class="grc-code">'+(R.code||'??')+'</span>';
      fb.title='Region: '+R.country+' — tap to change';
    } else if(fb && hasInline){ fb.remove(); }
    refreshGates();
  }

  /* ============================================================
     COUNTRY SWITCHER (modal)
     ============================================================ */
  function openPicker(){
    var wrap=document.getElementById('gxy-region-modal');
    if(wrap) wrap.remove();
    wrap=document.createElement('div');
    wrap.id='gxy-region-modal'; wrap.className='gxy-region-modal';
    var codes=Object.keys(COUNTRIES).sort(function(a,b){ return nameFor(a).localeCompare(nameFor(b)); });
    var rows=codes.map(function(c){
      return '<button class="grm-row'+(c===R.code?' on':'')+'" data-code="'+c+'"><span class="grm-flag">'+COUNTRIES[c].f+'</span><span class="grm-name">'+esc(COUNTRIES[c].n)+'</span><span class="grm-code">'+c+'</span></button>';
    }).join('');
    wrap.innerHTML=''+
      '<div class="grm-box" role="dialog" aria-label="Choose your region">'+
        '<div class="grm-head"><div><div class="grm-title">🌍 Choose your region</div>'+
        '<div class="grm-sub">Detected: '+R.flag+' '+esc(R.country)+' <span class="grm-src">('+R.source+')</span></div></div>'+
        '<button class="grm-x" type="button" aria-label="Close">✕</button></div>'+
        '<input class="grm-search" type="text" placeholder="Search countries…" autocomplete="off">'+
        '<div class="grm-list">'+rows+'</div>'+
        '<div class="grm-foot"><button class="grm-detect" type="button">📍 Re-detect automatically</button></div>'+
      '</div>';
    document.body.appendChild(wrap);
    var box=wrap.querySelector('.grm-box');
    function close(){ wrap.remove(); }
    wrap.addEventListener('click',function(e){ if(e.target===wrap) close(); });
    wrap.querySelector('.grm-x').addEventListener('click',close);
    wrap.querySelectorAll('.grm-row').forEach(function(r){
      r.addEventListener('click',function(){ setCountry(r.getAttribute('data-code'),'manual'); close(); });
    });
    wrap.querySelector('.grm-detect').addEventListener('click',function(){
      try{ localStorage.removeItem(KEY_CODE); localStorage.removeItem(KEY_SRC); localStorage.removeItem(KEY_TS); }catch(e){}
      close(); detect();
    });
    var search=wrap.querySelector('.grm-search');
    search.addEventListener('input',function(){
      var q=search.value.toLowerCase();
      wrap.querySelectorAll('.grm-row').forEach(function(r){
        var name=r.querySelector('.grm-name').textContent.toLowerCase();
        var code=r.getAttribute('data-code').toLowerCase();
        r.style.display=(name.indexOf(q)>-1||code.indexOf(q)>-1)?'':'none';
      });
    });
    setTimeout(function(){ try{search.focus();}catch(e){} },30);
  }

  /* ---- inject the CSS the module needs ---- */
  function injectCss(){
    if(document.getElementById('gxy-region-css')) return;
    var css=''+
    '.gxy-region-chip{display:inline-flex;align-items:center;gap:.35em;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:inherit;font:inherit;font-weight:700;padding:.28em .6em;border-radius:999px;line-height:1;font-size:.85em;backdrop-filter:blur(6px);transition:.15s;}'+
    '.gxy-region-chip:hover{border-color:rgba(255,255,255,.6);transform:translateY(-1px);}'+
    '.gxy-region-chip .grc-code{opacity:.85;letter-spacing:.03em;}'+
    '.gxy-region-float{position:fixed;right:14px;bottom:14px;z-index:9000;background:rgba(14,20,36,.9);border:1px solid #31406b;color:#e9edfb;padding:.5em .8em;font-size:.9em;box-shadow:0 8px 24px rgba(0,0,0,.4);}'+
    '.gxy-region-float:hover{border-color:#3b6fe0;}'+
    '@media(max-width:640px){.gxy-region-float{right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));}}'+
    '[data-region-blocked] .gxy-region-chip{}'+
    '.gxy-region-locked{position:relative;}'+
    '.gxy-region-locked>.gxy-region-lock{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;text-align:center;padding:1rem;border-radius:inherit;background:rgba(6,8,18,.78);backdrop-filter:blur(3px);cursor:pointer;}'+
    '.gxy-region-lock .grl-ico{font-size:1.8rem;margin-bottom:.4rem;}'+
    '.gxy-region-lock .grl-msg{font-size:.82rem;font-weight:600;color:#fff;max-width:22ch;margin:0 auto .6rem;line-height:1.35;}'+
    '.gxy-region-lock .grl-btn{font:inherit;font-size:.76rem;font-weight:700;padding:.4rem .8rem;border-radius:8px;border:1px solid rgba(255,255,255,.4);background:rgba(255,255,255,.1);color:#fff;cursor:pointer;}'+
    '.gxy-region-lock .grl-btn:hover{background:rgba(255,255,255,.22);}'+
    '[data-region-blocked][data-region-mode="badge"]{position:relative;}'+
    '[data-region-blocked][data-region-mode="badge"]::after{content:"🔒 region";position:absolute;top:.4rem;right:.4rem;font-size:.6rem;font-weight:800;letter-spacing:.03em;background:rgba(0,0,0,.6);color:#fff;padding:.15rem .4rem;border-radius:5px;z-index:3;}'+
    '.gxy-region-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);}'+
    '.grm-box{background:#0e1424;color:#e9edfb;border:1px solid #31406b;border-radius:16px;width:100%;max-width:440px;max-height:86vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}'+
    '.grm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;padding:1.1rem 1.1rem .7rem;}'+
    '.grm-title{font-weight:800;font-size:1.15rem;}'+
    '.grm-sub{font-size:.78rem;color:#93a0c6;margin-top:.2rem;}'+
    '.grm-src{opacity:.7;}'+
    '.grm-x{background:transparent;border:none;color:#93a0c6;font-size:1.1rem;cursor:pointer;padding:.2rem .4rem;border-radius:7px;}'+
    '.grm-x:hover{background:rgba(255,255,255,.08);color:#fff;}'+
    '.grm-search{margin:0 1.1rem .6rem;padding:.6rem .8rem;border-radius:10px;border:1px solid #31406b;background:#151d33;color:#e9edfb;font:inherit;font-size:.9rem;}'+
    '.grm-search:focus{outline:none;border-color:#3b6fe0;}'+
    '.grm-list{overflow-y:auto;padding:0 .6rem;flex:1;}'+
    '.grm-row{display:flex;align-items:center;gap:.7rem;width:100%;text-align:left;background:transparent;border:none;border-radius:10px;padding:.6rem .7rem;cursor:pointer;color:#e9edfb;font:inherit;}'+
    '.grm-row:hover{background:rgba(59,111,224,.14);}'+
    '.grm-row.on{background:rgba(59,111,224,.24);}'+
    '.grm-flag{font-size:1.3rem;line-height:1;}'+
    '.grm-name{flex:1;font-weight:600;font-size:.92rem;}'+
    '.grm-code{font-size:.72rem;color:#93a0c6;font-weight:700;letter-spacing:.03em;}'+
    '.grm-foot{padding:.7rem 1.1rem 1.1rem;border-top:1px solid #212c4a;}'+
    '.grm-detect{width:100%;padding:.65rem;border-radius:10px;border:1px solid #31406b;background:#151d33;color:#e9edfb;font:inherit;font-weight:700;cursor:pointer;font-size:.86rem;}'+
    '.grm-detect:hover{border-color:#3b6fe0;}';
    var st=document.createElement('style'); st.id='gxy-region-css'; st.textContent=css;
    (document.head||document.documentElement).appendChild(st);
  }

  /* ---- go ---- */
  injectCss();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
  // re-apply gates if the page adds region-tagged nodes later
  document.addEventListener('gxy-region-refresh',refreshGates);
})();
