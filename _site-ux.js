/* _site-ux.js — site-wide UX additions injected on every page that loads it.
   - Floating back-to-top button (appears after 600px scroll)
   - Reading progress bar pinned to the top edge (only on /a/ article pages)
   - Tri-language switcher (EN/FR/ES) in the top-right of the page
   - Pause hero auto-rotation on focus-within (covers keyboard users on touch
     devices that have neither mouse nor finger hovering)
   ============================================================ */
(function(){
  if (window.__SS_UX_INIT__) return;
  window.__SS_UX_INIT__ = true;

  /* ---------- shared style block ---------- */
  var css = ''
    /* back-to-top */
  + '.ssux-top{position:fixed;right:18px;bottom:18px;width:42px;height:42px;border-radius:50%;'
  + 'background:var(--color-brand,#1F7A6B);color:#F8F4ED;border:none;cursor:pointer;'
  + 'display:none;align-items:center;justify-content:center;z-index:80;'
  + 'box-shadow:0 6px 18px rgba(15,91,80,.32);transition:transform .15s,background .15s,opacity .2s;'
  + 'opacity:0;font-family:inherit}'
  + '.ssux-top.show{display:flex;opacity:1}'
  + '.ssux-top:hover{transform:translateY(-2px);background:#155b50}'
  + '.ssux-top svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}'
    /* reading progress */
  + '.ssux-rp{position:fixed;top:0;left:0;height:3px;width:0;'
  + 'background:linear-gradient(90deg,#1F7A6B,#E8967A);z-index:120;transition:width .12s linear;pointer-events:none}'
    /* lang switcher */
  + '.ssux-lang{position:fixed;top:14px;right:14px;z-index:90;display:flex;align-items:center;gap:0;'
  + 'background:rgba(248,244,237,.92);border:1px solid rgba(31,122,107,.18);border-radius:999px;'
  + 'padding:3px;font-family:\'Mona Sans\',inherit;backdrop-filter:blur(8px)}'
  + '.ssux-lang button{border:0;background:transparent;color:rgba(15,23,22,.55);'
  + 'font-family:inherit;font-weight:700;font-size:10.5px;letter-spacing:.06em;'
  + 'padding:5px 9px;border-radius:999px;cursor:pointer;text-transform:uppercase;line-height:1;transition:background .12s,color .12s}'
  + '.ssux-lang button.on{background:#1F7A6B;color:#F8F4ED}'
  + '.ssux-lang button:hover:not(.on){color:#155b50}'
  + '.ssux-lang button[disabled]{opacity:.45;cursor:not-allowed}'
  + '@media(max-width:600px){.ssux-lang{top:auto;bottom:74px;right:14px}.ssux-top{bottom:128px}}'
    /* sticky TOC for /a/ articles */
  + '.ssux-toc{position:fixed;top:90px;right:18px;z-index:60;width:230px;'
  + 'background:rgba(248,244,237,.96);border:1px solid rgba(31,122,107,.16);border-radius:14px;'
  + 'padding:14px 16px 12px;box-shadow:0 4px 20px rgba(15,91,80,.10);'
  + 'font-family:inherit;backdrop-filter:blur(6px);max-height:calc(100vh - 120px);overflow-y:auto}'
  + '.ssux-toc-h{font-family:\'Mona Sans\',inherit;font-weight:700;font-size:10px;letter-spacing:.14em;'
  + 'text-transform:uppercase;color:rgba(15,23,22,.55);margin-bottom:10px}'
  + '.ssux-toc a{display:block;font-size:12.5px;line-height:1.45;color:rgba(15,23,22,.7);text-decoration:none;'
  + 'padding:5px 0;border-left:2px solid transparent;padding-left:10px;margin-left:-10px;transition:color .12s,border-color .12s}'
  + '.ssux-toc a:hover{color:#155b50}'
  + '.ssux-toc a.on{color:#155b50;border-left-color:#1F7A6B;font-weight:600}'
  + '@media(max-width:1180px){.ssux-toc{display:none}}'
    /* recently-viewed strip */
  + '.ssux-recent{max-width:1180px;margin:24px auto 0;padding:0 1rem}'
  + '.ssux-recent-h{font-family:\'Mona Sans\',inherit;font-weight:700;font-size:11px;letter-spacing:.14em;'
  + 'text-transform:uppercase;color:rgba(15,23,22,.5);margin-bottom:10px;display:flex;align-items:center;gap:8px}'
  + '.ssux-recent-strip{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}'
  + '.ssux-recent-strip::-webkit-scrollbar{height:4px}'
  + '.ssux-recent-strip::-webkit-scrollbar-thumb{background:rgba(31,122,107,.25);border-radius:4px}'
  + '.ssux-recent-card{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:8px 14px;'
  + 'background:#fff;border:1px solid rgba(31,122,107,.16);border-radius:10px;text-decoration:none;color:inherit;'
  + 'transition:transform .12s,box-shadow .12s}'
  + '.ssux-recent-card:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(15,91,80,.10)}'
  + '.ssux-recent-card-name{font-size:13px;font-weight:600;color:#0E1B19;letter-spacing:-.005em;white-space:nowrap}'
  + '.ssux-recent-card-score{font-family:\'Mona Sans\',inherit;font-weight:800;font-size:12px;color:#1F7A6B;font-variant-numeric:tabular-nums}'
  + '.ssux-recent-clear{font-family:\'Mona Sans\',inherit;font-size:10px;color:rgba(15,23,22,.4);background:none;border:0;cursor:pointer;padding:0;margin-left:auto}'
  + '.ssux-recent-clear:hover{color:#B14F3D}'
    /* clinician handout button */
  + '.ssux-handout{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;'
  + 'background:rgba(31,122,107,.10);border:1px solid rgba(31,122,107,.22);color:#155b50;'
  + 'font-family:\'Mona Sans\',inherit;font-weight:600;font-size:12.5px;cursor:pointer;text-decoration:none;transition:background .12s}'
  + '.ssux-handout:hover{background:rgba(31,122,107,.16)}'
  + '.ssux-handout svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    /* print-only optimized layout (clinician handout uses window.print()) */
  + '@media print{'
  + '  .ssux-top,.ssux-rp,.ssux-lang,.ssux-toc,.ssux-recent,.ssux-handout,'
  + '  .site-nav,.site-footer,.beta-bar,.pg-close-fab,.art-modal,.dc-fact-hero,'
  + '  .hero,.rs-search-wrap,.rs-cat-sticky,.rs-toolbar,#supp-modal,#fb-modal,'
  + '  iframe,.ssm,nav,footer,script,noscript{display:none !important}'
  + '  body{background:#fff !important;color:#000 !important}'
  + '  .ssux-print-banner{display:block !important;border-bottom:2px solid #1F7A6B;padding-bottom:12px;margin-bottom:18px}'
  + '  .ssux-print-banner-brand{font-family:\'Mona Sans\',serif;font-weight:800;font-size:18px;color:#1F7A6B}'
  + '  .ssux-print-banner-tag{font-size:11px;color:#555;margin-top:3px}'
  + '  .ssux-print-banner-meta{font-size:10px;color:#888;margin-top:8px}'
  + '  a{color:#000;text-decoration:underline}'
  + '  h1,h2,h3,h4{color:#000;page-break-after:avoid}'
  + '  p,li{page-break-inside:avoid}'
  + '}'
  + '.ssux-print-banner{display:none}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- back-to-top button ---------- */
  function initBackToTop(){
    if (document.querySelector('.ssux-top')) return;
    var btn = document.createElement('button');
    btn.className = 'ssux-top';
    btn.type = 'button';
    btn.setAttribute('aria-label','Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
    btn.addEventListener('click', function(){window.scrollTo({top:0,behavior:'smooth'});});
    document.body.appendChild(btn);
    var ticking = false;
    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        btn.classList.toggle('show', window.pageYOffset > 600);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, {passive:true});
  }

  /* ---------- reading progress (only on /a/ article pages) ---------- */
  function initReadingProgress(){
    if (!/\/a\//.test(location.pathname)) return;
    if (document.querySelector('.ssux-rp')) return;
    var bar = document.createElement('div');
    bar.className = 'ssux-rp';
    bar.setAttribute('aria-hidden','true');
    document.body.appendChild(bar);
    var ticking = false;
    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var h = document.documentElement;
        var max = (h.scrollHeight - h.clientHeight) || 1;
        var pct = Math.min(100, Math.max(0, (window.pageYOffset / max) * 100));
        bar.style.width = pct + '%';
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---------- tri-language switcher ---------- */
  /* Currently translated paths. Add more as we ship translations.
     A path is shown as ENABLED for a given language only if its translated
     URL exists in the LANG_INDEX below. Otherwise the lang button is shown
     but disabled with a tooltip. */
  var LANG_INDEX = {
    fr: [
      '/landing.html',
      '/condition/anxiety-stack.html',
      '/condition/pcos-protocol.html'
    ],
    es: [] /* Spanish translations not yet shipped */
  };
  function langPathForCurrent(lang){
    if (lang === 'en') return enPathFromCurrent();
    var enPath = enPathFromCurrent();
    var translated = '/' + lang + enPath;
    if ((LANG_INDEX[lang] || []).indexOf(enPath) !== -1) return translated;
    return null;
  }
  function enPathFromCurrent(){
    /* Strip a leading /fr/ or /es/ from the current path so we know the EN equivalent. */
    var p = location.pathname;
    var m = p.match(/^\/(fr|es)(\/.*)$/);
    return m ? m[2] : p;
  }
  function currentLang(){
    var p = location.pathname;
    if (p.indexOf('/fr/') === 0) return 'fr';
    if (p.indexOf('/es/') === 0) return 'es';
    return 'en';
  }
  function initLangSwitcher(){
    if (document.querySelector('.ssux-lang')) return;
    /* Don't render on iframe-embedded pages (supplement-modal.js loads
       supplement.html in an iframe; we don't want a duplicate switcher). */
    var sp = new URLSearchParams(location.search);
    if (sp.get('modal') === '1') return;
    var box = document.createElement('div');
    box.className = 'ssux-lang';
    box.setAttribute('role','group');
    box.setAttribute('aria-label','Language');
    var langs = [{k:'en',l:'EN'},{k:'fr',l:'FR'},{k:'es',l:'ES'}];
    var cur = currentLang();
    langs.forEach(function(L){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = L.l;
      b.setAttribute('aria-label', L.l + (cur === L.k ? ' (current)' : ''));
      if (cur === L.k) b.className = 'on';
      var target = langPathForCurrent(L.k);
      if (!target){
        b.disabled = true;
        b.title = L.k.toUpperCase() + ' translation coming soon';
      } else if (cur !== L.k) {
        b.addEventListener('click', function(){location.href = target + location.hash;});
      }
      box.appendChild(b);
    });
    document.body.appendChild(box);
    /* hreflang link tags so search engines and assistive tech know about
       the alternate URLs. Only emit for languages that actually exist for
       this page. */
    ['en','fr','es'].forEach(function(k){
      var t = langPathForCurrent(k);
      if (!t) return;
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', k);
      link.href = location.origin + t;
      document.head.appendChild(link);
    });
  }

  /* ---------- pause hero auto-rotation on focus-within ---------- */
  function initHeroFocusPause(){
    ['#hero','#dc-fact-hero'].forEach(function(sel){
      var el = document.querySelector(sel);
      if (!el) return;
      el.addEventListener('focusin', function(){
        var ev = new Event('mouseenter');
        el.dispatchEvent(ev);
      });
      el.addEventListener('focusout', function(){
        var ev = new Event('mouseleave');
        el.dispatchEvent(ev);
      });
      /* Make the hero focusable as a region landmark. */
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','-1');
    });
  }

  /* ---------- Sticky TOC for /a/ articles ---------- */
  function initStickyToc(){
    if (!/\/a\//.test(location.pathname)) return;
    var article = document.querySelector('main.ar-wrap, .ar-content');
    if (!article) return;
    var headings = article.querySelectorAll('h2, h3');
    if (headings.length < 3) return; /* not worth a TOC */
    /* Assign ids to any heading missing one */
    var slug = function(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,40);};
    var nav = document.createElement('nav');
    nav.className = 'ssux-toc';
    nav.setAttribute('aria-label','Table of contents');
    nav.innerHTML = '<div class="ssux-toc-h">In this article</div>';
    var links = [];
    Array.prototype.forEach.call(headings, function(h){
      if (!h.id) h.id = 'h-' + slug(h.textContent);
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = (h.textContent||'').trim().replace(/\s+/g,' ');
      a.style.paddingLeft = (h.tagName === 'H3' ? 18 : 10) + 'px';
      nav.appendChild(a);
      links.push({a:a, h:h});
    });
    document.body.appendChild(nav);
    /* Active-section highlight via IntersectionObserver */
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){
            links.forEach(function(L){L.a.classList.toggle('on', L.h === e.target);});
          }
        });
      }, {rootMargin:'-30% 0px -60% 0px', threshold:0});
      links.forEach(function(L){io.observe(L.h);});
    }
  }

  /* ---------- Recently viewed strip (homepage only) ---------- */
  var RV_KEY = 'ss-recently-viewed';
  var RV_MAX = 8;
  function recentlyViewedRecord(name, score, slug){
    if (!name) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch(_){}
    if (!Array.isArray(list)) list = [];
    list = list.filter(function(x){return x && x.name && x.name !== name;});
    list.unshift({name:name, score:score||null, slug:slug||null, t:Date.now()});
    if (list.length > RV_MAX) list = list.slice(0, RV_MAX);
    try { localStorage.setItem(RV_KEY, JSON.stringify(list)); } catch(_){}
  }
  window.ssTrackView = recentlyViewedRecord; /* exposed for app.js to call when modal opens */

  function initRecentlyViewedStrip(){
    /* Only inject on the index/discover/articles pages — i.e. pages with .site-nav */
    var anchor = document.querySelector('.site-nav, nav.site-nav');
    if (!anchor) return;
    /* Don't render on iframe-embedded pages or /a/ */
    var sp = new URLSearchParams(location.search);
    if (sp.get('modal') === '1') return;
    if (/\/a\//.test(location.pathname)) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch(_){}
    if (!Array.isArray(list) || list.length === 0) return;
    var box = document.createElement('div');
    box.className = 'ssux-recent';
    var hdr = '<div class="ssux-recent-h">Recently viewed'
      + '<button type="button" class="ssux-recent-clear" title="Clear">Clear</button></div>';
    var strip = '<div class="ssux-recent-strip">';
    list.forEach(function(it){
      var href = it.slug
        ? 'supplement.html?slug=' + encodeURIComponent(it.slug)
        : 'index.html#search=' + encodeURIComponent(it.name);
      strip += '<a class="ssux-recent-card" href="'+href+'">'
        + '<span class="ssux-recent-card-name">'+escapeHtml(it.name)+'</span>'
        + (it.score?'<span class="ssux-recent-card-score">'+it.score+'</span>':'')
        + '</a>';
    });
    strip += '</div>';
    box.innerHTML = hdr + strip;
    /* Place it right after the nav */
    if (anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
    box.querySelector('.ssux-recent-clear').addEventListener('click', function(){
      try { localStorage.removeItem(RV_KEY); } catch(_){}
      box.remove();
    });
  }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* ---------- Send-to-clinician PDF (window.print() with optimized stylesheet) ---------- */
  function initClinicianHandout(){
    /* Show a 'Print handout' button on supplement detail and on /a/ articles */
    var target = null;
    if (/\/a\//.test(location.pathname)){
      target = document.querySelector('main.ar-wrap');
    } else if (location.pathname.indexOf('/supplement.html') !== -1){
      target = document.querySelector('main, body > div');
    }
    if (!target) return;
    /* Avoid double-injection */
    if (document.querySelector('.ssux-handout')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ssux-handout';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>'
      + 'Print clinician handout';
    btn.title = 'Print a one-page summary you can take to your clinician';
    btn.addEventListener('click', function(){
      /* Inject a print-only banner with brand + URL + date */
      var banner = document.querySelector('.ssux-print-banner');
      if (!banner){
        banner = document.createElement('div');
        banner.className = 'ssux-print-banner';
        var d = new Date();
        banner.innerHTML = '<div class="ssux-print-banner-brand">SupplementScore.org</div>'
          + '<div class="ssux-print-banner-tag">Non-profit, evidence-based supplement reference. 100% independent.</div>'
          + '<div class="ssux-print-banner-meta">'+escapeHtml(location.href.split('?')[0])
          + ' · Printed ' + d.toISOString().substring(0,10)
          + ' · Educational reference, not medical advice. Always consult your clinician.</div>';
        document.body.insertBefore(banner, document.body.firstChild);
      }
      window.print();
    });
    /* Place it inline at the top of the article */
    target.insertBefore(btn, target.firstChild);
  }

  function boot(){
    initBackToTop();
    initReadingProgress();
    initLangSwitcher();
    initHeroFocusPause();
    initStickyToc();
    initRecentlyViewedStrip();
    initClinicianHandout();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
