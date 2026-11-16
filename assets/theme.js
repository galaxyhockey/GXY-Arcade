/* GXY sitewide theme system — Modern <-> Retro (2000s)
   Include on any page:
     <script src="[root]assets/theme.js" data-root="[root]"></script>
   Optional page-specific retro layout:
     data-retro-extra="news"      -> also loads assets/retro-news.css
     data-retro-extra="weather"   -> also loads assets/retro-weather.css
   Options:
     data-no-toggle="true"        -> don't inject the floating toggle
*/
(function(){
  var s = document.currentScript;
  var root = (s && s.getAttribute('data-root')) || '';
  var extra = s && s.getAttribute('data-retro-extra');
  var noToggle = s && s.getAttribute('data-no-toggle') === 'true';
  var noCss = s && s.getAttribute('data-no-css') === 'true';
  var noRegion = s && s.getAttribute('data-no-region') === 'true';
  var KEY = 'gxy_theme';

  /* --- load the sitewide region system (once) ---
     region.js reads window.__gxyRoot for its asset paths. Pages can opt
     out with data-no-region="true" on the theme.js tag. --- */
  if(!noRegion && !document.getElementById('gxy-region-js')){
    try{ window.__gxyRoot = root; }catch(e){}
    // published gating rules (from the Admin Console) — load first so region.js picks them up
    var rr = document.createElement('script');
    rr.src = root+'assets/region-rules.js'; rr.id='gxy-region-rules'; rr.defer=true;
    rr.onerror=function(){}; // fine if it doesn't exist yet
    (document.head||document.documentElement).appendChild(rr);
    var rj = document.createElement('script');
    rj.src = root+'assets/region.js'; rj.id='gxy-region-js'; rj.defer=true;
    (document.head||document.documentElement).appendChild(rj);
    // language system (i18n) — loads after region so it can auto-pick by country
    var lj = document.createElement('script');
    lj.src = root+'assets/lang.js'; lj.id='gxy-lang-js'; lj.defer=true;
    (document.head||document.documentElement).appendChild(lj);
  }

  /* --- inject the sitewide modern design system (once) --- */
  if(!noCss && !document.getElementById('gxy-modern-css')){
    var ml = document.createElement('link');
    ml.rel='stylesheet'; ml.id='gxy-modern-css'; ml.href=root+'assets/gxy-modern.css';
    (document.head||document.documentElement).appendChild(ml);
  }

  /* --- PWA: manifest link + theme-color + service worker registration --- */
  (function(){
    try{
      if(!document.querySelector('link[rel="manifest"]')){
        var mf=document.createElement('link');
        mf.rel='manifest'; mf.href=root+'manifest.webmanifest';
        (document.head||document.documentElement).appendChild(mf);
      }
      if(!document.querySelector('meta[name="theme-color"]')){
        var tc=document.createElement('meta');
        tc.name='theme-color'; tc.content='#1D2671';
        (document.head||document.documentElement).appendChild(tc);
      }
      if(!document.querySelector('link[rel="apple-touch-icon"]')){
        var at=document.createElement('link');
        at.rel='apple-touch-icon'; at.href=root+'icons/apple-touch-icon.png';
        (document.head||document.documentElement).appendChild(at);
      }
      // iOS standalone hints
      var amc=document.createElement('meta'); amc.name='apple-mobile-web-app-capable'; amc.content='yes';
      (document.head||document.documentElement).appendChild(amc);
      if('serviceWorker' in navigator){
        window.addEventListener('load', function(){
          navigator.serviceWorker.register(root+'sw.js', { scope: root }).then(function(reg){
            // check for updates on load and periodically
            try { reg.update(); } catch(e){}
            setInterval(function(){ try { reg.update(); } catch(e){} }, 60*60*1000);
            // when a new worker takes over, reload once so the fresh files show
            reg.addEventListener('updatefound', function(){
              var nw = reg.installing;
              if(!nw) return;
              nw.addEventListener('statechange', function(){
                if(nw.state==='installed' && navigator.serviceWorker.controller){
                  // a new version is ready and an old one is controlling — activate it
                  try { nw.postMessage('skipWaiting'); } catch(e){}
                }
              });
            });
          }).catch(function(){});
          // reload the page once, when control passes to the new worker
          var refreshed=false;
          navigator.serviceWorker.addEventListener('controllerchange', function(){
            if(refreshed) return; refreshed=true;
            window.location.reload();
          });
        });
      }
    }catch(e){}
  })();

  /* --- newspaper modern skin (unless the reader enabled Legacy) --- */
  function newsLegacyOn(){ try { return localStorage.getItem('gxy_news_legacy')==='1'; } catch(e){ return false; } }
  function applyNewsSkin(){
    var isNews = extra === 'news';
    var link = document.getElementById('gxy-news-modern-css');
    var wantModern = isNews && !newsLegacyOn() && document.documentElement.getAttribute('data-theme')==='modern';
    if(wantModern && !link){
      link = document.createElement('link');
      link.rel='stylesheet'; link.id='gxy-news-modern-css'; link.href=root+'assets/news-modern.css';
      (document.head||document.documentElement).appendChild(link);
    } else if(!wantModern && link){
      link.parentNode.removeChild(link);
    }
  }
  window.gxyApplyNewsSkin = applyNewsSkin;

  /* --- scroll reveal: fade/slide elements marked .gxy-reveal into view --- */
  function initReveal(){
    if(document.documentElement.getAttribute('data-theme')==='retro') return;
    var els = document.querySelectorAll('.gxy-reveal');
    if(!els.length || !('IntersectionObserver' in window)){
      els.forEach(function(e){ e.classList.add('gxy-in'); }); return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('gxy-in'); io.unobserve(en.target); } });
    }, { threshold:.12, rootMargin:'0px 0px -8% 0px' });
    els.forEach(function(e){ io.observe(e); });
  }
  if(document.readyState!=='loading') setTimeout(initReveal,0);
  else document.addEventListener('DOMContentLoaded', initReveal);
  window.gxyInitReveal = initReveal;

  function current(){ try { return localStorage.getItem(KEY) || 'modern'; } catch(e){ return 'modern'; } }

  var links = [];
  function addCss(href, id){
    if(document.getElementById(id)) return;
    var l = document.createElement('link');
    l.rel='stylesheet'; l.id=id; l.href=href;
    document.head.appendChild(l); links.push(l);
  }
  function clearCss(){
    links.forEach(function(l){ if(l.parentNode) l.parentNode.removeChild(l); });
    links = [];
  }

  function apply(theme){
    var VALID = {modern:1, retro:1, aero:1, liquid:1, 'liquid-light':1};
    if(!VALID[theme]) theme='modern';
    document.documentElement.setAttribute('data-theme', theme);
    clearCss();
    if(theme==='retro'){
      addCss(root+'assets/retro.css','gxy-retro-css');
      if(extra) addCss(root+'assets/retro-'+extra+'.css','gxy-retro-'+extra+'-css');
    } else if(theme==='aero'){
      addCss(root+'assets/aero.css','gxy-aero-css');
      if(extra==='news') addCss(root+'assets/aero-news.css','gxy-aero-news-css');
    } else if(theme==='liquid' || theme==='liquid-light'){
      addCss(root+'assets/liquid.css','gxy-liquid-css');
    }
    var btn = document.getElementById('gxy-theme-toggle');
    if(btn){
      var label = { modern:'&#127760; Modern', retro:'&#128421;&#65039; 2000s', aero:'&#127754; Aero', liquid:'&#128142; Liquid', 'liquid-light':'&#128142; Liquid' }[theme] || 'Mode';
      btn.innerHTML = label;
    }
    applyNewsSkin();
  }

  function set(t){ try{ localStorage.setItem(KEY,t); }catch(e){} apply(t); }
  window.gxySetTheme = set;
  // floating toggle now cycles Modern -> Aero -> 2000s -> Modern
  window.gxyToggleTheme = function(){
    var cur = current();
    var next = cur==='modern' ? 'aero' : (cur==='aero' ? 'retro' : 'modern');
    set(next);
  };
  window.gxyCurrentTheme = current;

  apply(current());

  /* The floating view toggle has been removed — mode switching now lives in
     Account Settings (2000s / Modern / Frutiger Aero). The theming engine
     (gxySetTheme / gxyToggleTheme) remains available for that page to call. */
})();

/* Arcade mobile pass: bigger tap targets on touch screens, no double-tap zoom delay,
   no accidental text selection while playing. Applies to every game that loads theme.js. */
(function(){
  if(document.getElementById('gxy-mobile-css')) return;
  var st = document.createElement('style'); st.id = 'gxy-mobile-css';
  st.textContent =
    'html{-webkit-text-size-adjust:100%}body{touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    'canvas{touch-action:none;-webkit-user-select:none;user-select:none}' +
    '@media (pointer:coarse){button,.btn,[role=button],nav a,header a,.topbar a,.hud a,[class*=gamebar] a,[class*=topnav] a{min-height:40px;min-width:40px}' +
    'nav a,header a,.topbar a,[class*=gamebar] a,[class*=topnav] a{display:inline-flex;align-items:center}' +
    'input,select,textarea{font-size:16px}}';   /* 16px stops iOS zooming into form fields */
  (document.head || document.documentElement).appendChild(st);
})();
