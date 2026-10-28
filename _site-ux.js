/* _site-ux.js — site-wide UX additions injected on every page that loads it.
   - Floating back-to-top button (appears after 600px scroll)
   - Reading progress bar pinned to the top edge (only on /a/ article pages)
   - Pause hero auto-rotation on focus-within (covers keyboard users on touch
     devices that have neither mouse nor finger hovering)
   ============================================================ */
(function(){
  if (window.__SS_UX_INIT__) return;
  window.__SS_UX_INIT__ = true;

  /* One trust line, desktop only, at the left of the 1024px column.
     The homepage already has it in the stats bar. Other pages get the
     same element: inside a page bar, or on the body when the page has
     neither. Never the footer, a menu, or a second copy. */
  (function placeTrustLine(){
    var LABEL = 'Independent · No industry funding';
    function ensure(){
      if (!document.body || document.body.classList.contains('is-modal')) return null;
      var el = document.querySelector('.ss-np');
      if (!el) {
        el = document.createElement('span');
        el.className = 'ss-np';
        el.textContent = LABEL;
        var pagebar = document.querySelector('.ss-pagebar-inner');
        if (pagebar) {
          var brand = pagebar.querySelector('.ss-pagebar-brand');
          if (brand) brand.insertAdjacentElement('afterend', el);
          else pagebar.insertBefore(el, pagebar.firstChild);
        } else {
          var banner = document.createElement('header');
          banner.className = 'ss-np-banner';
          banner.appendChild(el);
          document.body.insertBefore(banner, document.body.firstChild);
        }
      } else if (el.parentElement === document.body) {
        var wrap = document.createElement('header');
        wrap.className = 'ss-np-banner';
        el.parentElement.insertBefore(wrap, el);
        wrap.appendChild(el);
      }
      return el;
    }
    /* documentElement.clientWidth includes the scrollbar gutter, but the
       columns are centered in the body's layout width, which does not.
       Reading the body keeps the label on the same edge as the homepage. */
    function columnLeft(){
      var L = document.body.clientWidth;
      var gutter = 16;
      var inner = Math.max(0, L - gutter * 2);
      var col = Math.min(1024, inner);
      return gutter + (inner - col) / 2 + 24;
    }
    function rowCenter(){
      var nodes = document.querySelectorAll('a.rc-close, a.pg-close-fab, a.reader-close-fab, a.hub-close-fab, a.cmp-close-fab, a.bro-close-fab, a.d-close-fab');
      for (var i = 0; i < nodes.length; i++) {
        var s = getComputedStyle(nodes[i]);
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        var r = nodes[i].getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        return r.top + r.height / 2 + window.scrollY;
      }
      return 38;
    }
    function align(){
      var el = ensure();
      if (!el) return;
      var w = el.getBoundingClientRect().width;
      if (w > 40) document.documentElement.style.setProperty('--ss-np-pad', Math.ceil(24 + w + 20) + 'px');
      if (el.closest('.beta-bar, .ss-pagebar')) return;
      if (!window.matchMedia('(min-width:1024px)').matches) return;
      var banner = el.closest('header.ss-np-banner') || el;
      var parent = banner.offsetParent || document.documentElement;
      var pr = parent.getBoundingClientRect();
      var border = parseFloat(getComputedStyle(parent).borderLeftWidth) || 0;
      banner.style.left = (columnLeft() - pr.left - window.scrollX - border) + 'px';
      var h = 32;
      var parentTop = pr.top + window.scrollY;
      banner.style.top = (rowCenter() - h / 2 - parentTop) + 'px';
      banner.style.height = h + 'px';
    }
    window.addEventListener('resize', align);
    window.addEventListener('load', align);
    var tries = 0;
    var timer = setInterval(function(){
      tries++;
      align();
      if (document.querySelector('a.rc-close') || tries > 20) clearInterval(timer);
    }, 100);
    setTimeout(align, 0);
  })();

  /* A refresh was landing on the footer.
     Chromium scroll-anchors to whatever was on screen. Research chrome,
     a stylesheet applied after first paint, and slots filled in after
     load all insert height above that anchor, so the browser adds the
     same amount to scrollY. When little page is left below, that clamps
     to the bottom. WebKit does the matching thing if scroll-behavior is
     smooth while the document is still growing, and it will also scroll
     a footer email into view when it restores focus to that field.
     The blocking CSS sets overflow-anchor:none and scroll-behavior:auto.
     Until late layout finishes, hold the reloaded offset (or the top on
     a fresh visit). A hash, the back button, and a real tap or key win. */
  (function(){
    var navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var navType = navEntry && navEntry.type ? navEntry.type : 'navigate';
    var path = location.pathname || '/';
    var isHome = path === '/' || /\/index\.html$/.test(path);
    var hash = (location.hash || '').replace(/^#/, '');
    var tabHash = hash === 'research' || hash === 'about' || hash === 'profile' || hash === 'supplements';
    function scrollKey(){
      return 'ss-scroll:' + (location.pathname || '/') + (location.hash || '');
    }
    var user = false;
    function markUser(){ user = true; window.__ssScrollUser = true; }
    if (navType !== 'back_forward') {
      ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function(type){
        window.addEventListener(type, markUser, { capture: true, passive: true });
      });
    }
    if (!(isHome && navType !== 'reload')) {
      window.addEventListener('pagehide', function(){
        if (navType === 'reload' && !user) return;
        try { sessionStorage.setItem(scrollKey(), String(Math.round(window.scrollY || 0))); } catch (e) {}
      });
    }
    function blurFooterFocus(){
      if (user) return;
      var ae = document.activeElement;
      if (!ae || !ae.closest || !ae.closest('footer')) return;
      try { ae.blur(); } catch (e) {}
    }
    function armFooter(){
      var fields = document.querySelectorAll('footer input, footer textarea, footer select');
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].getAttribute('autocomplete')) fields[i].setAttribute('autocomplete', 'off');
      }
      blurFooterFocus();
    }
    if (document.body) armFooter();
    else document.addEventListener('DOMContentLoaded', armFooter);
    window.addEventListener('pageshow', blurFooterFocus);

    if (navType === 'back_forward') return;
    if (isHome && navType !== 'reload') return;
    if (hash && !tabHash) return;

    var target = 0;
    /* Homepage reloads stay at the top. A saved offset is for the next
       non-reload visit, and reading it here is what jumped a refresh. */
    if (navType === 'reload' && !tabHash && !isHome) {
      var raw = null;
      try { raw = sessionStorage.getItem(scrollKey()); } catch (e) {}
      /* No saved offset: leave the browser's own restoration alone.
         Forcing the top here would undo a reload that already landed
         in the right place. */
      if (raw === null) return;
      var saved = parseInt(raw, 10);
      if (!isNaN(saved) && saved > 0) target = saved;
    }
    var until = Date.now() + 2200;
    function guard(){
      if (user || Date.now() > until) return;
      var y = window.scrollY || 0;
      var max = Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight);
      var want = target;
      if (navType !== 'reload') {
        /* A fresh visit may only be pulled back if it leapt to the footer
           on its own. A reader scrolling partway down is left alone. */
        /* Only an actual landing on the footer is the refresh bug.
           82% down a long article is still the article, and a TOC or
           hash-less jump to Sources was being snapped back to the top. */
        if (max < 500 || y < max - 80) return;
        want = 0;
      } else if (want > 0 && max + 8 < want) {
        return;
      }
      if (Math.abs(y - want) <= 24) return;
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, want);
      root.style.scrollBehavior = prev;
    }
    guard();
    window.addEventListener('scroll', guard, { passive: true });
    [50, 150, 350, 700, 1100, 1600, 2100].forEach(function(ms){ setTimeout(guard, ms); });
    window.addEventListener('load', function(){
      setTimeout(guard, 0);
      setTimeout(guard, 400);
    });
  })();

  function enableSmoothScroll(){
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.style.scrollBehavior = 'smooth';
  }
  if (document.readyState === 'complete') setTimeout(enableSmoothScroll, 2300);
  else window.addEventListener('load', function(){ setTimeout(enableSmoothScroll, 2300); });

  /* Close / X. Capture phase runs before any inline onclick that calls
     preventDefault + history.back(). On iPhone that pair often does
     nothing (history.length is already > 1, and back is a no-op), which
     swallowed the real href. One handler: go back when the previous page
     is on this site, otherwise follow the link. The link's href is the
     fallback when JS never runs. */
  function closeFallback(){
    var path = location.pathname || '';
    if (path.indexOf('/compare/') === 0) return '/compare/';
    if (path.indexOf('/condition/') === 0) return '/condition/';
    if (path.indexOf('/stack/') === 0) return '/stack/';
    if (path.indexOf('/brand/') === 0) return '/brands.html';
    if (path.indexOf('/m/') === 0 || path.indexOf('/medication') === 0) return '/';
    if (path.indexOf('/sx/') === 0) return '/symptom.html';
    if (path.indexOf('/hub/') === 0) return '/';
    if (path.indexOf('/data') === 0) return '/data/';
    if (path.indexOf('/a/') === 0 || path.indexOf('/for/') === 0) return '/#research';
    return '/';
  }
  function sameSite(url){
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return false;
      if (u.pathname === location.pathname && u.search === location.search && u.hash === location.hash) return false;
      return true;
    } catch (e) { return false; }
  }
  /* Safari can leave a print stylesheet on media=print when it was served
     from cache (onload never fires). Flip those sheets as soon as this
     file runs, including after a bfcache restore. */
  function armPrintSheets(){
    document.querySelectorAll('link[rel="stylesheet"][media="print"]').forEach(function(l){
      if (l.sheet) l.media = 'all';
    });
  }
  armPrintSheets();
  window.addEventListener('pageshow', armPrintSheets);

  /* About / Methodology / Transparency (and any other same-page hash on
     that screen) must not push a history entry. × and Back were popping
     those hashes one at a time, so the overlay stayed open on the previous
     tab. replaceState keeps a single entry for the page itself. */
  var hashHops = 0;
  var ignoreHash = 0;
  window.addEventListener('hashchange', function(){
    if (ignoreHash) { ignoreHash--; return; }
    hashHops++;
  });
  function replacePageHash(id){
    var next = location.pathname + location.search + (id ? '#' + id : '');
    if ((location.pathname + location.search + location.hash) === next) return;
    ignoreHash++;
    try { history.replaceState(history.state, '', next); } catch (e) { ignoreHash = Math.max(0, ignoreHash - 1); }
    try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e2) {}
  }
  document.addEventListener('click', function(ev){
    if (!document.querySelector('.ab-jump')) return;
    if (ev.defaultPrevented) return;
    if (ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a || a.classList.contains('ss-pagebar-x')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname !== location.pathname || url.search !== location.search) return;
    var id = '';
    try { id = decodeURIComponent((url.hash || '').replace(/^#/, '')); } catch (e2) { id = (url.hash || '').replace(/^#/, ''); }
    if (!id || !document.getElementById(id)) return;
    ev.preventDefault();
    var target = document.getElementById(id);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e3) {}
    replacePageHash(id);
  }, true);

  var CLOSE_SEL = 'a.rc-close, a.pg-close-fab, a.reader-close-fab, a.ss-pagebar-x, a.hub-close-fab, a.d-close-fab, a.bro-close-fab, a.cmp-close-fab';

  function leaveDocument(dest){
    var path = location.pathname + location.search;
    var start = location.href;
    var steps = hashHops > 0 ? Math.min(hashHops + 1, 6) : 1;
    hashHops = 0;
    if (!sameSite(document.referrer)) {
      location.href = dest;
      return;
    }
    try { history.go(-steps); } catch (e) { location.href = dest; return; }
    setTimeout(function(){
      var sameDoc = (location.pathname + location.search) === path;
      if (location.href !== start && !sameDoc) return;
      if (sameDoc && sameSite(document.referrer)) {
        var again = location.href;
        try { history.back(); } catch (e2) { location.href = dest; return; }
        setTimeout(function(){
          if (location.href === again || (location.pathname + location.search) === path) location.href = dest;
        }, 300);
        return;
      }
      location.href = dest;
    }, 450);
  }

  function runClose(el){
    if (!el) return;
    var fb = el.getAttribute('data-ss-fallback') || closeFallback();
    var href = el.getAttribute('href');
    if (!href || href === '#' || href === '#/') el.setAttribute('href', fb);
    var dest = el.href || fb;
    var framed = false;
    try { framed = window.self !== window.top; } catch (e) { framed = true; }
    if (framed && el.classList.contains('rc-close')){
      try { window.parent.postMessage({ type: 'rc-close' }, '*'); } catch (e2) {}
      setTimeout(function(){ if (location.href === dest) return; try { if (window.self !== window.top) location.href = dest; } catch (e3) {} }, 400);
      return;
    }
    leaveDocument(dest);
  }

  document.addEventListener('click', function(ev){
    var el = ev.target && ev.target.closest && ev.target.closest(CLOSE_SEL);
    if (!el) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    runClose(el);
  }, true);

  function visibleClose(){
    var list = document.querySelectorAll(CLOSE_SEL);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.closest('[hidden]')) continue;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      return el;
    }
    return null;
  }
  document.addEventListener('keydown', function(ev){
    if (ev.key !== 'Escape' || ev.defaultPrevented) return;
    if (document.querySelector('.cdd-menu.open, .cdd-open')) return;
    var src = document.getElementById('sources-modal');
    if (src && src.classList.contains('open')) {
      ev.preventDefault();
      src.classList.remove('open');
      return;
    }
    var fb = document.getElementById('fb-modal');
    if (fb && fb.classList.contains('open')) {
      ev.preventDefault();
      if (typeof window.closeFeedback === 'function') window.closeFeedback();
      else fb.classList.remove('open');
      return;
    }
    var el = visibleClose();
    if (!el) return;
    ev.preventDefault();
    runClose(el);
  });

  /* ---------- iframe-context detection (2026-05-18) ----------
     When this page is rendered inside the supplement-modal iframe (.ssm)
     or any other parent overlay, the parent already shows its own close
     chrome at the same top-right coordinates as our `.reader-close-fab`.
     Mark <html> with `.ss-in-iframe` so the inner close FAB hides via
     CSS — bulletproofs against the duplicate-X regardless of whether
     the parent's hide-chrome timing wins.                              */
  try {
    if (window !== window.top) {
      document.documentElement.classList.add('ss-in-iframe');
    }
  } catch (_) {
    /* Cross-origin parent — being framed at all is enough to hide our FAB. */
    document.documentElement.classList.add('ss-in-iframe');
  }

  /* ---------- shared style block ---------- */
  var css = ''
    /* back-to-top */
  + '.ssux-top{position:fixed;right:18px;bottom:18px;width:44px;height:44px;min-width:44px;min-height:44px;max-width:44px;max-height:44px;'
  + 'box-sizing:border-box;border-radius:50%;background:#fff;color:#155A50;border:0;cursor:pointer;'
  + 'display:none;align-items:center;justify-content:center;z-index:80;'
  + 'box-shadow:0 0 0 1px #155A50,0 6px 18px rgba(15,91,80,.28);transition:transform .15s,color .15s,opacity .2s;'
  + 'opacity:0;font-family:inherit}'
  + '.ssux-top.show{display:flex;opacity:1}'
  + '.ssux-top:hover{transform:translateY(-2px);background:#fff;color:#0f3d36}'
  + '.ssux-top svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}'
    /* reading progress */
  + '.ssux-rp{position:fixed;top:0;left:0;height:3px;width:0;'
  + 'background:linear-gradient(90deg,#155A50,#E8967A);z-index:120;transition:width .12s linear;pointer-events:none}'
    /* sticky TOC for /a/ articles */
  + '.ssux-toc{position:fixed;top:90px;right:18px;z-index:60;width:230px;'
  + 'background:rgba(248,244,237,.96);border:1px solid rgba(21,90,80,.16);border-radius:14px;'
  + 'padding:16px 16px 12px;box-shadow:0 4px 20px rgba(15,91,80,.10);'
  + 'font-family:inherit;backdrop-filter:blur(6px);max-height:calc(100vh - 120px);overflow-y:auto}'
  + '.ssux-toc-h{font-family:\'Mona Sans\',inherit;font-weight:700;font-size:10px;letter-spacing:.14em;'
  + 'text-transform:uppercase;color:rgba(15,23,22,.55);margin-bottom:8px}'
  + '.ssux-toc a{display:block;font-size:12.5px;line-height:1.45;color:rgba(15,23,22,.7);text-decoration:none;'
  + 'padding:8px 0;border-left:2px solid transparent;padding-left:8px;margin-left:-8px;transition:color .12s,border-color .12s}'
  + '.ssux-toc a:hover{color:#155b50}'
  + '.ssux-toc a.on{color:#155b50;border-left-color:#155A50;font-weight:600}'
  + '@media(max-width:1180px){.ssux-toc{display:none}}'
    /* recently-viewed strip */
  /* Recently-viewed strip — sits ABOVE the footer (bottom of page content,
     not above the hero). Smaller chrome, with an actually-visible Clear pill. */
  + '.ssux-recent{max-width:1200px;margin:36px auto 16px;padding:0 1rem}'
  + '.ssux-recent-h{font-family:\'Mona Sans\',inherit;font-weight:700;font-size:10px;letter-spacing:.12em;'
  + 'text-transform:uppercase;color:rgba(15,23,22,.5);margin-bottom:8px;display:flex;align-items:center;gap:8px}'
  + '.ssux-recent-strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;flex-wrap:wrap}'
  + '.ssux-recent-strip::-webkit-scrollbar{height:4px}'
  + '.ssux-recent-strip::-webkit-scrollbar-thumb{background:rgba(21,90,80,.25);border-radius:4px}'
  /* Compact pill: smaller padding, smaller font, less prominent. */
  + '.ssux-recent-card{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:8px 11px;'
  + 'background:#fff;border:1px solid rgba(21,90,80,.16);border-radius:999px;text-decoration:none;color:inherit;'
  + 'transition:border-color .12s,background .12s;line-height:1.1}'
  + '.ssux-recent-card:hover{border-color:rgba(21,90,80,.4);background:rgba(21,90,80,.04)}'
  + '.ssux-recent-card-name{font-size:12px;font-weight:600;color:#0E1B19;letter-spacing:-.005em;white-space:nowrap}'
  + '.ssux-recent-card-score{font-family:\'Mona Sans\',inherit;font-weight:800;font-size:11px;color:#155A50;font-variant-numeric:tabular-nums}'
  /* Clear button — real bordered pill, sits inline with the header label. */
  + '.ssux-recent-clear{font-family:\'Mona Sans\',inherit;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;'
  + 'color:#9b3a2c;background:rgba(232,150,122,.12);border:1px solid rgba(232,150,122,.45);border-radius:999px;cursor:pointer;padding:3px 8px 3px 8px;'
  + 'margin-left:auto;display:inline-flex;align-items:center;gap:4px;line-height:1;transition:background .12s,border-color .12s,color .12s}'
  + '.ssux-recent-clear:hover{background:rgba(232,150,122,.22);border-color:rgba(232,150,122,.7);color:#7a2c20}'
  + '.ssux-recent-clear svg{width:9px;height:9px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round}'
    /* 2026-05-24 — ssux-handout (Print clinician handout) CSS removed. The
       feature was deleted site-wide; the matching JS function was deleted
       too. Keep print-media rules below; they still apply to the rest of
       the chrome (.site-nav, .site-footer, etc.) when the user uses the
       browser's native Print menu. */
    /* breadcrumbs */
  + '.ssux-bc{font-family:\'Mona Sans\',inherit;font-size:12px;color:#57534e;'
  + 'padding:8px 4px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;letter-spacing:.005em;line-height:1.4}'
  + '.ssux-bc a{color:#57534e;text-decoration:none;transition:color .12s}'
  + '.ssux-bc a:hover{color:#155A50}'
  + '.ssux-bc-sep{color:#57534e;font-weight:300;padding:0 2px}'
  + '.ssux-bc-cur{color:#0c0a09;font-weight:600}'
  + '@media(max-width:600px){.ssux-bc{font-size:11px;padding:8px 4px 8px}.ssux-bc a{max-width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ssux-bc-cur{max-width:100%;white-space:normal}}'
    /* PubMed badge */
  + '.ssux-pmbadge{display:inline-flex;align-items:center;gap:8px;'
  + 'background:rgba(21,90,80,.10);color:#155b50;padding:3px 8px;border-radius:999px;'
  + 'font-family:\'Mona Sans\',inherit;font-size:11px;font-weight:600;letter-spacing:.005em;text-decoration:none;line-height:1.2;'
  + 'border:1px solid rgba(21,90,80,.16);transition:background .12s}'
  + '.ssux-pmbadge:hover{background:rgba(21,90,80,.18)}'
  + '.ssux-pmbadge svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}'
  + '.ssux-pmbadge strong{font-weight:800;font-variant-numeric:tabular-nums}'
  + '@media print{'
  + '  .ssux-top,.ssux-rp,.ssux-toc,.ssux-recent,'
  + '  .site-nav,.site-footer,.beta-bar,.pg-close-fab,.art-modal,.dc-fact-hero,'
  + '  .hero,.rs-search-wrap,.rs-cat-sticky,.rs-toolbar,#supp-modal,#fb-modal,'
  + '  iframe,.ssm,nav,footer,script,noscript{display:none !important}'
  + '  body{background:#fff !important;color:#000 !important}'
  + '  a{color:#000;text-decoration:underline}'
  + '  h1,h2,h3,h4{color:#000;page-break-after:avoid}'
  + '  p,li{page-break-inside:avoid}'
  + '}'
    /* iframe-context: hide chrome that would collide with the parent
       modal's controls.
       NOTE (2026-05-19): removed `.pg-close-fab` from this hide list.
       Supplement-modal.js already hides its outer X via .hide-chrome when
       the iframe is on a non-supplement page, so hiding the inner FAB too
       left users on condition / compare deep-dives with zero close
       affordance. The inner FAB now stays visible — it's the only X on
       those pages, and its history.back() inside the iframe returns the
       user to the supplement card they came from. */
  + 'html.ss-in-iframe .hub-close-fab{display:none !important}'
    /* ============================================================
       Share FAB — V2 chrome pill, auto-injected next to .pg-close-fab
       (2026-05-19). Echoes the article modal's Share button so deep-
       dive pages (condition / compare / about / terms / standalone
       articles) share the same chrome treatment. The button is added
       by initShareFab() below — no per-page markup needed. New pages
       inherit the treatment as long as they include the standard
       .pg-close-fab anchor.
       ============================================================ */
  + '.pg-share-fab{position:fixed;top:16px;right:68px;height:40px;padding:0 16px 0 12px;'
  +   'border-radius:20px;background:var(--color-background-primary,#f6f2ea);'
  +   'border:1px solid var(--color-border-secondary,#d6d3d1);'
  +   'box-shadow:0 2px 12px rgba(0,0,0,.14);color:var(--color-text-secondary,#57534e);'
  +   'cursor:pointer;display:inline-flex;align-items:center;gap:8px;'
  +   'font-family:inherit;font-size:13px;font-weight:600;z-index:50;'
  +   'transition:transform .15s,color .15s,background .15s,border-color .15s}'
  + '.pg-share-fab svg{width:14px;height:14px;fill:none;stroke:currentColor;'
  +   'stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}'
  + '.pg-share-fab:hover{transform:scale(1.04);color:var(--color-text-primary,#0c0a09)}'
  + '.pg-share-fab:focus-visible{outline:2px solid var(--color-brand,#155A50);outline-offset:2px}'
  + '.pg-share-fab.copied{background:#E6F7F5;color:#065F56;border-color:#9DD3CC}'
  + '@media(max-width:760px){'
  +   '.pg-share-fab{top:12px;right:60px;height:36px;padding:0;width:36px;'
  +     'justify-content:center;border-radius:50%}'
  +   '.pg-share-fab .pg-share-lbl{display:none}'
  + '}'
  + '.pg-share-toast{position:fixed;top:64px;right:16px;background:#0c0a09;color:#fff;'
  +   'font-size:12.5px;font-weight:500;padding:8px 16px;border-radius:8px;'
  +   'box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translateY(-6px);'
  +   'transition:opacity .18s,transform .18s;pointer-events:none;z-index:51}'
  + '.pg-share-toast.show{opacity:1;transform:translateY(0)}'
    /* Standalone article — render the page inside an .art-modal-style
       frame so /a/<slug>.html looks identical to opening the article
       from the index modal (matches the v2 chrome treatment). */
  + 'body.ssa-standalone-modal{overflow:hidden;margin:0;height:100vh}'
  + 'body.ssa-standalone-modal > :not(.ssa-modal):not(script):not(.ssux-pmbadge-mount){display:none !important}'
  + '.ssa-modal{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;z-index:1100;'
  +   'background:linear-gradient(180deg, rgba(248,244,237,1) 0%, rgba(235,229,217,.96) 100%);overflow-y:auto;padding:24px 16px}'
  + '.ssa-pane{position:relative;width:100%;max-width:820px;margin:0 auto;background:var(--color-background-primary,#f8f4ed);'
  +   'border-radius:20px;border:1px solid var(--color-border-tertiary,#dcdad7);'
  +   'box-shadow:0 30px 80px rgba(0,0,0,.16);overflow:hidden;display:flex;flex-direction:column;min-height:calc(100vh - 48px)}'
  + '.ssa-chrome{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;'
  +   'padding:8px 12px;background:var(--color-background-primary,#f8f4ed);'
  +   'border-bottom:1px solid var(--color-border-tertiary,#dcdad7);border-radius:20px 20px 0 0}'
  + '.ssa-chrome .art-modal-nav{display:flex;align-items:center;gap:8px}'
  + '.ssa-chrome .art-modal-actions{display:flex;align-items:center;gap:8px}'
  + '.ssa-body{flex:1;padding:0;overflow:visible}'
  + '.ssa-body .ar-wrap{max-width:none;margin:0;padding:24px 28px 56px}'
  + '@media(max-width:600px){.ssa-modal{padding:0}.ssa-pane{border-radius:0;border:none;min-height:100vh;max-width:100%}'
  +   '.ssa-chrome{border-radius:0}.ssa-body .ar-wrap{padding:16px 16px 40px}}'
    /* One close control: 44px round ×. The ring is a shadow, not a border,
       so the border box stays exactly 44px (a 1px border snaps to 43.998). */
  + '.ss-x{width:44px !important;height:44px !important;min-width:44px !important;min-height:44px !important;'
  +   'max-width:44px !important;max-height:44px !important;'
  +   'border-radius:50% !important;background:var(--color-background-primary,#fff) !important;'
  +   'border:0 !important;'
  +   'box-shadow:0 0 0 1px #d6d3d1,0 2px 12px rgba(0,0,0,.14) !important;color:var(--color-text-secondary,#57534e) !important;'
  +   'padding:0 !important;box-sizing:border-box !important;flex-shrink:0 !important;'
  +   'display:inline-flex;align-items:center;justify-content:center;text-decoration:none;'
  +   'line-height:0;cursor:pointer;font-size:0 !important;transform:none !important}'
  + '.ss-x:hover,.ss-x:active{transform:none !important;color:var(--color-text-primary,#0c0a09) !important}'
  + '.ss-x svg{width:18px !important;height:18px !important;display:block !important;flex:none}'
  + 'body:has(main.det-wrap)>a.ss-x.pg-close-fab svg{width:18px !important;height:18px !important}'
  + 'html.rc-chrome-active a.ss-x.reader-close-fab,html.rc-chrome-active a.ss-x.pg-close-fab{display:none !important}'
  + 'body:has(.ss-pagebar) a.ss-x.pg-close-fab,body:has(.ss-pagebar) a.ss-x.hub-close-fab,'
  + 'body:has(.ss-pagebar) a.ss-x.bro-close-fab,body:has(.ss-pagebar) a.ss-x.cmp-close-fab,'
  + 'body:has(.ss-pagebar) a.ss-x.d-close-fab{display:none !important}'
    /* Desktop: every × sits 16px inside the top-right of the panel it closes.
       A viewport right:16px lands outside a centered column once the scrollbar
       gutter is counted. Phone rules below keep the viewport corner. */
  + '@media(min-width:769px){'
  +   '.ss-pagebar-inner{position:relative;min-height:76px;padding:16px 76px 16px 16px;box-sizing:border-box}'
  +   'a.ss-pagebar-x{position:absolute !important;top:16px !important;right:16px !important;z-index:2}'
  +   'html.rc-chrome-active .ar-column,html.rc-chrome-active main.ar-wrap,html.rc-chrome-active main.sx-wrap,'
  +   'html.rc-chrome-active main.ca-wrap,html.rc-chrome-active main.sk-wrap{position:relative}'
  +   'a.ss-x.rc-close{position:absolute !important;top:16px !important;right:16px !important;z-index:5 !important}'
  +   'html.rc-chrome-active .rc-top{box-sizing:border-box;min-height:72px;padding-right:72px;align-items:center}'
  +   'body:has(main.det-wrap):not(.is-modal){position:relative}'
  +   'body:has(main.det-wrap):not(.is-modal)>nav.ss-page-actions{'
  +     'position:absolute;top:0;left:50%;transform:translateX(-50%);'
  +     'width:min(880px,calc(100% - 2rem));height:0;margin:0;padding:0;border:0;'
  +     'overflow:visible;pointer-events:none;z-index:80}'
  +   'body:has(main.det-wrap):not(.is-modal)>nav.ss-page-actions>a.ss-x.pg-close-fab{'
  +     'position:absolute !important;top:16px !important;right:16px !important;z-index:80 !important;pointer-events:auto}'
  +   'body:has(main.det-wrap):not(.is-modal)>nav.ss-page-actions>.pg-share-fab{'
  +     'position:absolute !important;top:16px !important;right:68px !important;pointer-events:auto}'
  +   'body:has(main.det-wrap):not(.is-modal)>main.det-wrap{padding-top:72px}'
  +   '.src-modal-panel,.art-modal-pane{position:relative}'
  +   '.src-modal-head,.art-modal-chrome{position:relative;padding-right:76px}'
  +   '.src-modal-close,.art-modal-close{position:absolute !important;top:16px !important;right:16px !important;z-index:3}'
  +   'body:not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(:has(.beta-bar)):not(.is-modal){position:relative}'
  +   'body:not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(.is-modal)>nav.ss-page-actions>a.ss-x,'
  +   'body:not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(.is-modal)>nav.ss-page-actions>.pg-share-fab{'
  +     'position:absolute !important;top:16px !important;pointer-events:auto;z-index:80 !important}'
  +   'body:not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(.is-modal)>nav.ss-page-actions>a.ss-x{right:16px !important}'
  +   'body:not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(.is-modal)>nav.ss-page-actions>.pg-share-fab{right:68px !important}'
  +   'body:has(>nav.ss-page-actions):not(:has(.ss-pagebar)):not(:has(main.det-wrap)):not(:has(.beta-bar)):not(:has(main.ar-wrap)):not(:has(main.sx-wrap)):not(:has(main.ca-wrap)):not(:has(main.sk-wrap)):not(:has(.rc-top)):not(.is-modal)>main{padding-top:72px !important}'
  + '}'
  + '@media(min-width:1024px){'
  +   'header.ss-np-banner{display:flex;align-items:center;position:absolute;z-index:30;height:32px;margin:0;padding:0;border:0;background:transparent;pointer-events:none}'
  +   'header.ss-np-banner>.ss-np{display:inline-flex;position:static;height:32px;align-items:center}'
  +   'html.rc-chrome-active .ar-toc{padding-top:64px;box-sizing:border-box}'
  +   '.ss-pagebar-inner{justify-content:flex-start;gap:0;padding-left:24px}'
  +   '.ss-pagebar-inner>.ss-np{position:static;height:32px;margin:0 0 0 22px;transform:none}'
  + '}'
  + 'body.is-modal .ss-np{display:none !important}'
    /* Phone: every corner × sits 8px from the top and 16px from the right. */
  + '@media(max-width:768px){'
  +   'a.ss-x.pg-close-fab,a.ss-x.reader-close-fab,a.ss-x.hub-close-fab,a.ss-x.d-close-fab,a.ss-x.bro-close-fab,a.ss-x.cmp-close-fab,'
  +   'html:not(.ss-in-iframe) a.ss-x.rc-close{'
  +     'position:fixed !important;top:8px !important;right:16px !important;z-index:80 !important}'
  +   'button.pg-share-fab{top:8px !important;right:68px !important;width:44px !important;height:44px !important;'
  +     'min-width:44px !important;min-height:44px !important;padding:0 !important;border-radius:50% !important}'
  +   'html.rc-chrome-active:not(.ss-in-iframe) main .rc-top{padding-right:68px !important}'
  + '}'
  + 'body.is-modal>footer.site-footer{display:none !important}'
  + 'nav.ss-page-actions{position:absolute;width:0;height:0;margin:0;padding:0;border:0;overflow:visible}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var XSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var PAINT_SEL = CLOSE_SEL + ', button.ssm-x, button.art-modal-close, button.src-modal-close';
  function paintCloses(root){
    var nodes = [];
    if (root && root.nodeType === 1 && root.matches && root.matches(PAINT_SEL)) nodes.push(root);
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.querySelectorAll) nodes = nodes.concat(Array.prototype.slice.call(scope.querySelectorAll(PAINT_SEL)));
    nodes.forEach(function(el){
      el.classList.add('ss-x');
      if (el.querySelector('svg')) return;
      el.textContent = '';
      el.insertAdjacentHTML('afterbegin', XSVG);
    });
  }
  function startPaint(){
    paintCloses(document);
    if (!document.body || !window.MutationObserver) return;
    var obs = new MutationObserver(function(recs){
      recs.forEach(function(rec){
        Array.prototype.forEach.call(rec.addedNodes || [], function(n){
          if (n.nodeType === 1) paintCloses(n);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) startPaint();
  else document.addEventListener('DOMContentLoaded', startPaint);

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
    /* Article pages draw one TOC from their own headings. This fixed
       right-hand list was a second, overlapping panel. */
    return;
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
    /* Only inject on top-level pages (those with a .site-nav). Skip iframe
       embeds and per-article static pages. */
    var navAnchor = document.querySelector('.site-nav, nav.site-nav');
    if (!navAnchor) return;
    var sp = new URLSearchParams(location.search);
    if (sp.get('modal') === '1') return;
    if (/\/a\//.test(location.pathname)) return;
    /* Round-7: skip the Custom Profile view — the recently-viewed strip
       was eating space at the bottom of the wizard / dashboard. */
    if (/^#profile/.test(location.hash || '')) return;
    /* Also bail if the wizard or its result view is currently visible. */
    if (document.getElementById('p1') && document.getElementById('p1').offsetParent !== null) return;
    var list = [];
    try { list = JSON.parse(localStorage.getItem(RV_KEY) || '[]'); } catch(_){}
    if (!Array.isArray(list) || list.length === 0) return;
    var box = document.createElement('div');
    box.className = 'ssux-recent';
    /* Header with prominent Clear pill (with × icon) on the right. */
    var hdr = '<div class="ssux-recent-h">'
      + '<span>Recently viewed</span>'
      + '<button type="button" class="ssux-recent-clear" title="Clear recently-viewed history" aria-label="Clear recently viewed">'
      +   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      +   '<span>Clear</span>'
      + '</button></div>';
    var strip = '<div class="ssux-recent-strip">';
    list.forEach(function(it){
      /* Use origin-rooted absolute paths — _site-ux.js loads on subdirectory
         pages (/stack/, /a/, /condition/) where relative `supplement.html`
         resolves to e.g. /stack/supplement.html → 404. Bug fixed 2026-05-27. */
      var href = it.slug
        ? ((window.SS && window.SS.urlFor) ? window.SS.urlFor('supplement', it.slug) : ('/supplement/' + encodeURIComponent(it.slug) + '.html'))
        : '/index.html#search=' + encodeURIComponent(it.name);
      strip += '<a class="ssux-recent-card" href="'+href+'">'
        + '<span class="ssux-recent-card-name">'+escapeHtml(it.name)+'</span>'
        + (it.score?'<span class="ssux-recent-card-score">'+it.score+'</span>':'')
        + '</a>';
    });
    strip += '</div>';
    box.innerHTML = hdr + strip;
    /* Place it just BEFORE the .site-footer (or the new dark-green
       .frfoot/.site-footer) so it sits at the bottom of the page content
       — not above the hero where it was eating prime real estate. */
    var footer = document.querySelector('footer.site-footer, footer.frfoot, .site-footer, .frfoot');
    if (footer && footer.parentNode){
      footer.parentNode.insertBefore(box, footer);
    } else {
      /* Fallback: append to body. Pages with no .site-footer (e.g. /condition/
         deep dives) still get the strip at the very end. */
      document.body.appendChild(box);
    }
    box.querySelector('.ssux-recent-clear').addEventListener('click', function(){
      try { localStorage.removeItem(RV_KEY); } catch(_){}
      box.remove();
    });
  }
  function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  /* ---------- Send-to-clinician PDF (window.print() with optimized stylesheet) ---------- */

  /* ---------- Breadcrumbs on detail pages ---------- */
  /* Renders a small "Home › Section › Title" trail just below the nav.
     Inferred from the URL path; doesn't require markup changes. */
  function initBreadcrumbs(){
    var p = location.pathname;
    /* 2026-05-24 — Skip the wrapper-router pages (supplement.html,
       article.html, medication.html). Those pages render a card/detail
       view via JS and should appear chrome-less per user spec. */
    if (/\/(supplement|article|medication)\.html$/.test(p)) return;
    /* Skip non-detail pages */
    var crumbs = inferCrumbs(p);
    if (!crumbs) return;
    if (document.querySelector('.ssux-bc')) return;
    /* If the page already has an inline breadcrumb nav (.ss-breadcrumb
       injected statically by the breadcrumb-schema task), skip — we'd
       otherwise render two stacked breadcrumb rows. */
    if (document.querySelector('nav.ss-breadcrumb')) return;
    var anchor = document.querySelector('main, .ar-wrap, body > div:first-of-type');
    if (!anchor) return;
    var nav = document.createElement('nav');
    nav.className = 'ssux-bc';
    nav.setAttribute('aria-label','Breadcrumb');
    nav.innerHTML = crumbs.map(function(c, i){
      var sep = i > 0 ? '<span class="ssux-bc-sep">›</span>' : '';
      return sep + (c.href
        ? '<a href="'+c.href+'">'+escapeHtml(c.label)+'</a>'
        : '<span class="ssux-bc-cur">'+escapeHtml(c.label)+'</span>');
    }).join('');
    anchor.insertBefore(nav, anchor.firstChild);
  }
  function inferCrumbs(p){
    var sp = new URLSearchParams(location.search);
    /* /a/<slug>.html */
    if (/^\/a\//.test(p)){
      var title = (document.querySelector('h1')||{}).textContent || 'Article';
      return [
        {label:'Home', href:'/'},
        {label:'Articles', href:'/index.html#research'},
        {label:title.trim()}
      ];
    }
    /* /condition/<slug>.html */
    if (/^\/condition\//.test(p) && !/index\.html?$/.test(p)){
      var t = (document.querySelector('h1')||{}).textContent || 'Condition';
      return [
        {label:'Home', href:'/'},
        {label:'Conditions', href:'/condition/index.html'},
        {label:t.trim()}
      ];
    }
    /* /sx/<slug>.html */
    if (/^\/sx\//.test(p) && !/index\.html?$/.test(p)){
      var t2 = (document.querySelector('h1')||{}).textContent || 'Symptom';
      return [
        {label:'Home', href:'/'},
        {label:'By symptom', href:'/sx/index.html'},
        {label:t2.trim()}
      ];
    }
    /* /for/<demo>.html */
    if (/^\/for\//.test(p)){
      var t3 = (document.querySelector('h1')||{}).textContent || 'For';
      return [
        {label:'Home', href:'/'},
        {label:'For', href:'/index.html#supplements'},
        {label:t3.trim()}
      ];
    }
    /* /compare/<slug>.html */
    if (/^\/compare\//.test(p) && !/index\.html?$/.test(p)){
      var t4 = (document.querySelector('h1')||{}).textContent || 'Compare';
      return [
        {label:'Home', href:'/'},
        {label:'Comparisons', href:'/compare/index.html'},
        {label:t4.trim()}
      ];
    }
    /* /supplement/<slug>.html — prerendered detail pages */
    if (/^\/supplement\/[a-z0-9-]+\.html$/i.test(p)) {
      var supName = (document.querySelector('h1')||{}).textContent || 'Supplement';
      return [
        {label:'Home', href:'/'},
        {label:'Supplements', href:'/browse.html'},
        {label:supName.trim()}
      ];
    }
    /* supplement.html?slug=...  (only when not in iframe) */
    if (p.indexOf('/supplement.html') !== -1 && sp.get('modal') !== '1'){
      var slug = sp.get('slug') || '';
      var name = (document.querySelector('h1')||{}).textContent || slug.replace(/-/g,' ');
      return [
        {label:'Home', href:'/'},
        {label:'Index', href:'/index.html#supplements'},
        {label:name.trim()}
      ];
    }
    return null;
  }

  /* PubMed count lookup removed. It fetched eutils.ncbi.nlm.nih.gov, which
     the page CSP does not allow, so the request was refused on every article
     and the badge never appeared. Kept as a no-op for any older caller. */
  window.ssPubMedBadgeFor = function(){};

  /* ---------- article v2 template enhancer (2026-05-18) ----------
     Standalone /a/<slug>.html pages historically used a legacy layout
     (.ar-cat / .ar-meta + flat body). The modal version (app.js
     goArticle()) renders a richer v2 layout: kicker + .v2-h1 + trust
     strip + Bottom Line + On-This-Page TOC + section wrappers.
     This routine applies the same v2 layer in-place on the standalone
     page so the two contexts present identically. Skips when the page
     is in an iframe (modal will apply its own v2). Idempotent. */

  /* Fetch and cache the article slug ordering, then wire Prev/Next on
     the standalone-article modal frame. Order matches sitemap-articles.xml. */

  /* "Reviewed against N sources" is baked into article HTML with a
     gray inline color. Repaint it stone (#57534e) wherever it shows up,
     including lines injected after load. */
  function paintReviewedAgainst(root){
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = [];
    if (scope.matches && scope.matches('p, div, li, span')) nodes.push(scope);
    scope.querySelectorAll('p, div, li, span').forEach(function(el){ nodes.push(el); });
    nodes.forEach(function(el){
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!/^Reviewed against \d+/.test(text) || text.length > 240) return;
      el.style.color = '#57534e';
      el.querySelectorAll('b, strong').forEach(function(child){ child.style.color = '#57534e'; });
    });
  }
  function initReviewedColor(){
    paintReviewedAgainst(document);
    if (!window.MutationObserver || !document.body) return;
    var obs = new MutationObserver(function(records){
      records.forEach(function(record){
        record.addedNodes.forEach(function(node){
          if (!node || node.nodeType !== 1) return;
          if ((node.textContent || '').indexOf('Reviewed against') === -1) return;
          paintReviewedAgainst(node);
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function boot(){
    initReviewedColor();
    initBackToTop();
    initReadingProgress();
    initHeroFocusPause();
    initStickyToc();
    initRecentlyViewedStrip();
    initBreadcrumbs();
    initShareFab();
    placePageActions();
    alignFloatingPanel();
    nameModalMain();
    /* 2026-05-24 — belt-and-braces: also remove any pre-existing
       .ssux-handout buttons in case an older cached page injected one. */
    try {
      document.querySelectorAll('.ssux-handout, .ssux-handout-wrap').forEach(function(el){ el.remove(); });
    } catch(_) {}
  }

  /* ============================================================
     Share FAB auto-injection (2026-05-19)
     ------------------------------------------------------------
     Any page that ships the standard .pg-close-fab (condition deep-
     dives, compare guides, /a/ standalone articles, about, terms,
     accessibility, bibliography) automatically gets a matching
     Share pill rendered to the left of the close X. This means new
     condition pages need NO template changes — they inherit the
     V2 chrome treatment just by including the existing close FAB.

     Behavior:
       Mobile (iOS/Android): native share sheet via navigator.share
       Desktop:              copy canonical URL to clipboard + toast
     ============================================================ */
  function initShareFab(){
    if (document.querySelector('.pg-share-fab')) return;       // already injected
    /* (2026-05-25) Don't inject when the page is rendered inside a
       parent modal that ships its own Share + X chrome. Two such
       cases today:
         (1) supplement.html in the .ssm modal — body.is-modal set by
             the inline body script when ?modal=1 is present.
         (2) /a/*.html in the research-chrome top bar — <html> carries
             .rc-chrome-active set by _research-chrome.js.
       Without this guard, this routine injects a .pg-share-fab next to
       the page's own .pg-close-fab, producing a duplicate Share+X
       beneath the parent chrome bar. */
    if (document.body && document.body.classList.contains('is-modal')) return;
    if (document.documentElement.classList.contains('rc-chrome-active')) return;
    /* Look for either close-FAB variant — condition / standalone-article
       pages use `.pg-close-fab`; /compare/ guides use the visually
       identical `.reader-close-fab`. Both anchor the Share pill the same
       way (top:16 right:16). Take the first one we find. */
    var closeFab = document.querySelector('.pg-close-fab, .reader-close-fab');
    if (!closeFab) return;                                      // no chrome anchor on this page

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pg-share-fab';
    btn.setAttribute('aria-label', 'Share this page');
    btn.title = 'Share — copies link';
    btn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">'
      +   '<circle cx="18" cy="5" r="3"/>'
      +   '<circle cx="6"  cy="12" r="3"/>'
      +   '<circle cx="18" cy="19" r="3"/>'
      +   '<line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>'
      +   '<line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>'
      + '</svg>'
      + '<span class="pg-share-lbl">Share</span>';

    btn.addEventListener('click', function(e){
      e.preventDefault();
      var title = (document.querySelector('h1') || {}).textContent || document.title || 'SupplementScore';
      title = String(title).trim();
      /* Prefer canonical URL if present — gives recipients the clean
         link even when the user is on a tracking-tagged variant. */
      var canonical = document.querySelector('link[rel="canonical"]');
      var url = (canonical && canonical.href) || location.href;
      var data = { title: title, url: url, text: title };
      if (navigator.share && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)){
        navigator.share(data).catch(function(err){
          if (err && err.name !== 'AbortError') _copyShareUrl(url);
        });
      } else {
        _copyShareUrl(url);
      }
    });

    /* Insert BEFORE the close FAB in DOM so screen readers hit Share
       first (matches the article modal's Share→Close order). */
    closeFab.parentNode.insertBefore(btn, closeFab);
  }

  /* The supplement close (and its share control) are body-level, so they
     sit outside every landmark. A zero-size nav keeps them in the
     accessibility tree without taking layout space. Fixed children still
     position against the viewport. */
  function placePageActions(){
    if (document.querySelector('nav.ss-page-actions')) return;
    if (!document.body || document.body.classList.contains('is-modal')) return;
    var closeFab = document.querySelector('.pg-close-fab, .reader-close-fab');
    if (!closeFab) return;
    if (closeFab.closest('main, nav, header, footer, [role="main"], [role="navigation"]')) return;
    var share = document.querySelector('.pg-share-fab');
    var nav = document.createElement('nav');
    nav.className = 'ss-page-actions';
    nav.setAttribute('aria-label', 'Page');
    var before = (share && share.parentNode === closeFab.parentNode) ? share : closeFab;
    closeFab.parentNode.insertBefore(nav, before);
    if (share && share.parentNode === nav.parentNode) nav.appendChild(share);
    nav.appendChild(closeFab);
  }

  /* Pages whose close is a body-level fab (not the supplement column and
     not a page bar) size that fab's nav to the main panel, then the
     desktop rule parks the × 16px inside that box. */
  function alignFloatingPanel(){
    var nav = document.querySelector('nav.ss-page-actions');
    if (!nav) return;
    var desktop = window.matchMedia('(min-width:769px)').matches;
    var skip = !desktop || !document.body || document.body.classList.contains('is-modal')
      || document.querySelector('.ss-pagebar') || document.querySelector('main.det-wrap');
    if (skip) {
      ['position','top','left','width','height','transform','margin','pointer-events','overflow'].forEach(function(prop){
        nav.style.removeProperty(prop);
      });
      return;
    }
    var panel = document.querySelector('main');
    if (!panel) return;
    var pr = panel.getBoundingClientRect();
    var br = document.body.getBoundingClientRect();
    nav.style.setProperty('position', 'absolute', 'important');
    /* Absolute offsets are from the body's padding edge, which lines up
       with the border box when the body has no border. Subtracting
       padding shifts the × a second 16px away from the panel. */
    nav.style.setProperty('top', (pr.top - br.top) + 'px', 'important');
    nav.style.setProperty('left', (pr.left - br.left) + 'px', 'important');
    nav.style.setProperty('width', pr.width + 'px', 'important');
    nav.style.setProperty('height', '0px', 'important');
    nav.style.setProperty('transform', 'none', 'important');
    nav.style.setProperty('margin', '0', 'important');
    nav.style.setProperty('pointer-events', 'none', 'important');
    nav.style.setProperty('overflow', 'visible', 'important');
  }

  /* The supplement card iframe repeats the page's unnamed main and footer.
     Name this main and hide the footer (the stylesheet also hides it) so
     the open card is not a second copy of those landmarks. */
  function nameModalMain(){
    if (!document.body || !document.body.classList.contains('is-modal')) return;
    var main = document.querySelector('main.det-wrap');
    if (main && !main.getAttribute('aria-label')) main.setAttribute('aria-label', 'Supplement detail');
    var footer = document.querySelector('footer.site-footer');
    if (footer) footer.setAttribute('hidden', '');
  }

  function _copyShareUrl(url){
    var done = function(){
      _showShareToast('Link copied');
      var btn = document.querySelector('.pg-share-fab');
      if (btn){ btn.classList.add('copied'); setTimeout(function(){ btn.classList.remove('copied'); }, 1400); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(done).catch(function(){ _legacyCopy(url); done(); });
    } else {
      _legacyCopy(url); done();
    }
  }
  function _legacyCopy(text){
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch(_){}
  }
  function _showShareToast(msg){
    var toast = document.querySelector('.pg-share-toast');
    if (!toast){
      toast = document.createElement('div');
      toast.className = 'pg-share-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    /* requestAnimationFrame so the CSS transition fires reliably even
       when the toast was just created in this tick. */
    requestAnimationFrame(function(){ toast.classList.add('show'); });
    clearTimeout(_showShareToast._t);
    _showShareToast._t = setTimeout(function(){ toast.classList.remove('show'); }, 1800);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('resize', alignFloatingPanel);
  window.addEventListener('load', alignFloatingPanel);

  /* Keep hyphenated headline compounds on one line (Most-Studied). */
  function keepHeadlineCompounds(){
    var nodes = document.querySelectorAll('h1, h2, h3, .article-title, .hub-title, .det-h1');
    for (var i = 0; i < nodes.length; i++){
      var walker = document.createTreeWalker(nodes[i], NodeFilter.SHOW_TEXT);
      var n;
      while ((n = walker.nextNode())){
        if (n.nodeValue && n.nodeValue.indexOf('-') !== -1){
          n.nodeValue = n.nodeValue.replace(/-/g, '\u2011');
        }
      }
    }
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', keepHeadlineCompounds);
  } else {
    keepHeadlineCompounds();
  }
})();
