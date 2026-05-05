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
  + '@media(max-width:600px){.ssux-lang{top:auto;bottom:74px;right:14px}.ssux-top{bottom:128px}}';
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

  function boot(){
    initBackToTop();
    initReadingProgress();
    initLangSwitcher();
    initHeroFocusPause();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
