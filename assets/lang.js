/* ============================================================
   GXY Language System — lightweight i18n for Biking People World
   ------------------------------------------------------------
   Loaded automatically by theme.js on every page. Translates any
   element tagged with data-i18n, and auto-picks a language from the
   visitor's region (with a manual switcher that always wins).

     <h1 data-i18n="home.title">Welcome</h1>
     <input data-i18n-ph="search.placeholder">        (placeholder)
     <a data-i18n-title="nav.home.tip">Home</a>        (title attr)

   API:
     window.gxyLang.ready(fn)   -> run fn once translations are loaded
     window.gxyLang.code        -> "en" | "es" | "fr"
     window.gxyLang.t(key)      -> translated string (or the key)
     window.gxyLang.set(code)   -> switch language (persists)
     window.gxyLang.open()      -> open the language picker
     window.gxyLang.apply(root) -> re-translate a subtree (after DOM inserts)

   Dictionaries live in assets/i18n/<code>.json — add a language by
   adding one file and one entry in LANGS below. Machine-assisted
   translations; a native speaker should proofread public copy.
   ============================================================ */
(function(){
  var KEY='gxy_lang';
  var root=(window.__gxyRoot)||'';
  var LANGS={
    en:{name:'English', flag:'🇬🇧', native:'English'},
    es:{name:'Spanish', flag:'🇪🇸', native:'Español'},
    fr:{name:'French',  flag:'🇫🇷', native:'Français'}
  };
  // country -> default language
  var COUNTRY_LANG={
    ES:'es', MX:'es', AR:'es', CO:'es', CL:'es', PE:'es', VE:'es',
    FR:'fr', BE:'fr', // (Belgium leans FR here for simplicity)
    // CA handled specially below (EN default, FR offered)
  };

  var dict={}, fallback={}, current='en';
  var L={
    code:'en', langs:LANGS, _ready:false, _cbs:[],
    ready:function(fn){ if(this._ready){ try{fn(this);}catch(e){} } else this._cbs.push(fn); },
    t:function(key){ return lookup(key); },
    set:function(c){ setLang(c, true); },
    open:openPicker,
    apply:function(rootEl){ translate(rootEl||document); }
  };
  window.gxyLang=L;

  function lookup(key){
    if(dict && dict[key]!=null) return dict[key];
    if(fallback && fallback[key]!=null) return fallback[key];
    return key; // last resort: show the key so missing strings are obvious
  }

  function translate(rootEl){
    rootEl=rootEl||document;
    var els=rootEl.querySelectorAll('[data-i18n]');
    els.forEach(function(el){
      var key=el.getAttribute('data-i18n');
      var val=lookup(key);
      if(val!==key || !el.getAttribute('data-i18n-keep')){
        // allow simple <b>/<br> in translations
        if(/[<&]/.test(val)) el.innerHTML=val; else el.textContent=val;
      }
    });
    rootEl.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      el.setAttribute('placeholder', lookup(el.getAttribute('data-i18n-ph')));
    });
    rootEl.querySelectorAll('[data-i18n-title]').forEach(function(el){
      el.setAttribute('title', lookup(el.getAttribute('data-i18n-title')));
    });
    rootEl.querySelectorAll('[data-i18n-html]').forEach(function(el){
      el.innerHTML=lookup(el.getAttribute('data-i18n-html'));
    });
    document.documentElement.setAttribute('lang', current);
  }

  function fetchDict(code){
    return fetch(root+'assets/i18n/'+code+'.json',{cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('no dict'); return r.json(); })
      .catch(function(){ return {}; });
  }

  function applyLang(){
    L.code=current;
    translate(document);
    reflectChips();
    try{ document.dispatchEvent(new CustomEvent('gxy-lang',{detail:{code:current}})); }catch(e){}
  }

  function setLang(code, manual){
    if(!LANGS[code]) code='en';
    if(manual){ try{ localStorage.setItem(KEY,code); }catch(e){} }
    current=code;
    // always ensure English fallback is loaded, then the target language
    var need=[];
    if(!Object.keys(fallback).length && code!=='en') need.push(fetchDict('en').then(function(d){ fallback=d; }));
    need.push(fetchDict(code).then(function(d){ dict = code==='en' ? d : d; if(code==='en') fallback=d; }));
    Promise.all(need).then(function(){
      applyLang();
      if(!L._ready){ L._ready=true; var cbs=L._cbs.slice(); L._cbs.length=0; cbs.forEach(function(fn){ try{fn(L);}catch(e){} }); }
    });
  }

  /* choose the starting language: saved manual > region > browser > en */
  function pickInitial(){
    var saved=null; try{ saved=localStorage.getItem(KEY); }catch(e){}
    if(saved && LANGS[saved]) return setLang(saved, false);
    function fromRegion(code){
      var lang = COUNTRY_LANG[code] || null;
      if(!lang){
        // browser language as a secondary hint
        try{ var b=(navigator.languages&&navigator.languages[0])||navigator.language||''; b=b.slice(0,2).toLowerCase(); if(LANGS[b]) lang=b; }catch(e){}
      }
      setLang(lang||'en', false);
    }
    if(window.gxyRegion){ window.gxyRegion.ready(function(R){ fromRegion(R.code); }); }
    else {
      // region not present: use browser language
      var b=''; try{ b=((navigator.languages&&navigator.languages[0])||navigator.language||'').slice(0,2).toLowerCase(); }catch(e){}
      setLang(LANGS[b]?b:'en', false);
    }
  }

  /* reflect current language into chips + floating button */
  function reflectChips(){
    var chips=document.querySelectorAll('[data-lang-chip]');
    chips.forEach(function(c){
      if(!c.classList.contains('gxy-lang-chip')) c.classList.add('gxy-lang-chip');
      c.innerHTML=LANGS[current].flag+' <span>'+LANGS[current].native+'</span>';
      c.title='Language: '+LANGS[current].native+' — tap to change';
      if(!c._b){ c._b=1; c.addEventListener('click',openPicker); }
    });
    var floatOn=document.documentElement.getAttribute('data-lang-float')!=='off';
    var hasInline=chips.length>0;
    var fb=document.getElementById('gxy-lang-float');
    if(floatOn && !hasInline){
      if(!fb){ fb=document.createElement('button'); fb.id='gxy-lang-float'; fb.type='button'; fb.className='gxy-lang-chip gxy-lang-float'; fb.addEventListener('click',openPicker); (document.body||document.documentElement).appendChild(fb); }
      fb.innerHTML=LANGS[current].flag+' <span>'+LANGS[current].native+'</span>';
    } else if(fb && hasInline){ fb.remove(); }
  }

  function openPicker(){
    var old=document.getElementById('gxy-lang-modal'); if(old) old.remove();
    var wrap=document.createElement('div'); wrap.id='gxy-lang-modal'; wrap.className='gxy-lang-modal';
    var rows=Object.keys(LANGS).map(function(c){
      return '<button class="glm-row'+(c===current?' on':'')+'" data-code="'+c+'"><span class="glm-flag">'+LANGS[c].flag+'</span><span class="glm-name">'+LANGS[c].native+'</span><span class="glm-sub">'+LANGS[c].name+'</span></button>';
    }).join('');
    wrap.innerHTML='<div class="glm-box" role="dialog" aria-label="Choose language"><div class="glm-head"><div class="glm-title">🌐 Language</div><button class="glm-x" type="button" aria-label="Close">✕</button></div><div class="glm-list">'+rows+'</div></div>';
    document.body.appendChild(wrap);
    function close(){ wrap.remove(); }
    wrap.addEventListener('click',function(e){ if(e.target===wrap) close(); });
    wrap.querySelector('.glm-x').addEventListener('click',close);
    wrap.querySelectorAll('.glm-row').forEach(function(r){ r.addEventListener('click',function(){ setLang(r.getAttribute('data-code'), true); close(); }); });
  }

  function injectCss(){
    if(document.getElementById('gxy-lang-css')) return;
    var css=''+
    '.gxy-lang-chip{display:inline-flex;align-items:center;gap:.35em;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:inherit;font:inherit;font-weight:700;padding:.28em .6em;border-radius:999px;line-height:1;font-size:.85em;backdrop-filter:blur(6px);transition:.15s;}'+
    '.gxy-lang-chip:hover{border-color:rgba(255,255,255,.6);transform:translateY(-1px);}'+
    '.gxy-lang-float{position:fixed;right:14px;bottom:58px;z-index:9000;background:rgba(14,20,36,.9);border:1px solid #31406b;color:#e9edfb;padding:.5em .8em;font-size:.9em;box-shadow:0 8px 24px rgba(0,0,0,.4);}'+
    '.gxy-lang-float:hover{border-color:#3b6fe0;}'+
    '@media(max-width:640px){.gxy-lang-float{right:10px;bottom:calc(56px + env(safe-area-inset-bottom,0px));}}'+
    '.gxy-lang-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);}'+
    '.glm-box{background:#0e1424;color:#e9edfb;border:1px solid #31406b;border-radius:16px;width:100%;max-width:360px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}'+
    '.glm-head{display:flex;justify-content:space-between;align-items:center;padding:1.1rem 1.1rem .6rem;}'+
    '.glm-title{font-weight:800;font-size:1.15rem;}'+
    '.glm-x{background:transparent;border:none;color:#93a0c6;font-size:1.1rem;cursor:pointer;padding:.2rem .4rem;border-radius:7px;}'+
    '.glm-x:hover{background:rgba(255,255,255,.08);color:#fff;}'+
    '.glm-list{padding:.4rem .6rem 1rem;}'+
    '.glm-row{display:flex;align-items:center;gap:.7rem;width:100%;text-align:left;background:transparent;border:none;border-radius:10px;padding:.7rem;cursor:pointer;color:#e9edfb;font:inherit;}'+
    '.glm-row:hover{background:rgba(59,111,224,.14);}'+
    '.glm-row.on{background:rgba(59,111,224,.24);}'+
    '.glm-flag{font-size:1.4rem;}'+
    '.glm-name{flex:1;font-weight:700;}'+
    '.glm-sub{font-size:.74rem;color:#93a0c6;}';
    var st=document.createElement('style'); st.id='gxy-lang-css'; st.textContent=css;
    (document.head||document.documentElement).appendChild(st);
  }

  injectCss();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',pickInitial);
  else pickInitial();
  document.addEventListener('gxy-lang-refresh',function(){ translate(document); });
})();
