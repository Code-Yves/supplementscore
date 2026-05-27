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
    /* Language row — sits in the brand column directly under the © line.
       Matches .site-footer-meta: 11px, same color, no border. */
  + '.ssux-lang-foot{font-family:inherit;font-size:11px;line-height:1.4;'
  + 'color:rgba(248,244,237,.55);margin-top:8px}'
  + '.ssux-lang-foot a{color:rgba(248,244,237,.78);text-decoration:none;font-weight:600;transition:color .12s}'
  + '.ssux-lang-foot a:hover{color:#F8F4ED;text-decoration:underline;text-underline-offset:3px}'
  + '.ssux-lang-foot .on{color:#F8F4ED;font-weight:700}'
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
  /* Recently-viewed strip — sits ABOVE the footer (bottom of page content,
     not above the hero). Smaller chrome, with an actually-visible Clear pill. */
  + '.ssux-recent{max-width:1200px;margin:36px auto 16px;padding:0 1rem}'
  + '.ssux-recent-h{font-family:\'Mona Sans\',inherit;font-weight:700;font-size:10px;letter-spacing:.12em;'
  + 'text-transform:uppercase;color:rgba(15,23,22,.5);margin-bottom:8px;display:flex;align-items:center;gap:10px}'
  + '.ssux-recent-strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;flex-wrap:wrap}'
  + '.ssux-recent-strip::-webkit-scrollbar{height:4px}'
  + '.ssux-recent-strip::-webkit-scrollbar-thumb{background:rgba(31,122,107,.25);border-radius:4px}'
  /* Compact pill: smaller padding, smaller font, less prominent. */
  + '.ssux-recent-card{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:5px 11px;'
  + 'background:#fff;border:1px solid rgba(31,122,107,.16);border-radius:999px;text-decoration:none;color:inherit;'
  + 'transition:border-color .12s,background .12s;line-height:1.1}'
  + '.ssux-recent-card:hover{border-color:rgba(31,122,107,.4);background:rgba(31,122,107,.04)}'
  + '.ssux-recent-card-name{font-size:11.5px;font-weight:600;color:#0E1B19;letter-spacing:-.005em;white-space:nowrap}'
  + '.ssux-recent-card-score{font-family:\'Mona Sans\',inherit;font-weight:800;font-size:11px;color:#1F7A6B;font-variant-numeric:tabular-nums}'
  /* Clear button — real bordered pill, sits inline with the header label. */
  + '.ssux-recent-clear{font-family:\'Mona Sans\',inherit;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;'
  + 'color:#9b3a2c;background:rgba(232,150,122,.12);border:1px solid rgba(232,150,122,.45);border-radius:999px;cursor:pointer;padding:3px 10px 3px 8px;'
  + 'margin-left:auto;display:inline-flex;align-items:center;gap:4px;line-height:1;transition:background .12s,border-color .12s,color .12s}'
  + '.ssux-recent-clear:hover{background:rgba(232,150,122,.22);border-color:rgba(232,150,122,.7);color:#7a2c20}'
  + '.ssux-recent-clear svg{width:9px;height:9px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round}'
    /* 2026-05-24 — ssux-handout (Print clinician handout) CSS removed. The
       feature was deleted site-wide; the matching JS function was deleted
       too. Keep print-media rules below; they still apply to the rest of
       the chrome (.site-nav, .site-footer, etc.) when the user uses the
       browser's native Print menu. */
    /* breadcrumbs */
  + '.ssux-bc{font-family:\'Mona Sans\',inherit;font-size:11.5px;color:rgba(15,23,22,.55);'
  + 'padding:8px 4px 14px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;letter-spacing:.005em;line-height:1.4}'
  + '.ssux-bc a{color:rgba(15,23,22,.55);text-decoration:none;transition:color .12s}'
  + '.ssux-bc a:hover{color:#155b50}'
  + '.ssux-bc-sep{color:rgba(15,23,22,.32);font-weight:300;padding:0 2px}'
  + '.ssux-bc-cur{color:rgba(15,23,22,.85);font-weight:600}'
  + '@media(max-width:600px){.ssux-bc{font-size:11px;padding:6px 4px 10px}.ssux-bc a,.ssux-bc-cur{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}'
    /* PubMed badge */
  + '.ssux-pmbadge{display:inline-flex;align-items:center;gap:5px;'
  + 'background:rgba(31,122,107,.10);color:#155b50;padding:3px 9px;border-radius:999px;'
  + 'font-family:\'Mona Sans\',inherit;font-size:11px;font-weight:600;letter-spacing:.005em;text-decoration:none;line-height:1.2;'
  + 'border:1px solid rgba(31,122,107,.16);transition:background .12s}'
  + '.ssux-pmbadge:hover{background:rgba(31,122,107,.18)}'
  + '.ssux-pmbadge svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}'
  + '.ssux-pmbadge strong{font-weight:800;font-variant-numeric:tabular-nums}'
  + '@media print{'
  + '  .ssux-top,.ssux-rp,.ssux-lang,.ssux-toc,.ssux-recent,'
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
  + 'html.ss-in-iframe .hub-close-fab,'
  + 'html.ss-in-iframe .ssux-lang{display:none !important}'
    /* ============================================================
       Share FAB — V2 chrome pill, auto-injected next to .pg-close-fab
       (2026-05-19). Echoes the article modal's Share button so deep-
       dive pages (condition / compare / about / terms / standalone
       articles) share the same chrome treatment. The button is added
       by initShareFab() below — no per-page markup needed. New pages
       inherit the treatment as long as they include the standard
       .pg-close-fab anchor.
       ============================================================ */
  + '.pg-share-fab{position:fixed;top:16px;right:68px;height:40px;padding:0 14px 0 12px;'
  +   'border-radius:20px;background:var(--color-background-primary,#f6f2ea);'
  +   'border:1px solid var(--color-border-secondary,#d6d3d1);'
  +   'box-shadow:0 2px 12px rgba(0,0,0,.14);color:var(--color-text-secondary,#57534e);'
  +   'cursor:pointer;display:inline-flex;align-items:center;gap:6px;'
  +   'font-family:inherit;font-size:13px;font-weight:600;z-index:50;'
  +   'transition:transform .15s,color .15s,background .15s,border-color .15s}'
  + '.pg-share-fab svg{width:14px;height:14px;fill:none;stroke:currentColor;'
  +   'stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}'
  + '.pg-share-fab:hover{transform:scale(1.04);color:var(--color-text-primary,#0c0a09)}'
  + '.pg-share-fab:focus-visible{outline:2px solid var(--color-brand,#1F7A6B);outline-offset:2px}'
  + '.pg-share-fab.copied{background:#E6F7F5;color:#065F56;border-color:#9DD3CC}'
  + '@media(max-width:760px){'
  +   '.pg-share-fab{top:12px;right:60px;height:36px;padding:0;width:36px;'
  +     'justify-content:center;border-radius:50%}'
  +   '.pg-share-fab .pg-share-lbl{display:none}'
  + '}'
  + '.pg-share-toast{position:fixed;top:64px;right:16px;background:#0c0a09;color:#fff;'
  +   'font-size:12.5px;font-weight:500;padding:8px 14px;border-radius:8px;'
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
  +   'padding:10px 12px;background:var(--color-background-primary,#f8f4ed);'
  +   'border-bottom:1px solid var(--color-border-tertiary,#dcdad7);border-radius:20px 20px 0 0}'
  + '.ssa-chrome .art-modal-nav{display:flex;align-items:center;gap:8px}'
  + '.ssa-chrome .art-modal-actions{display:flex;align-items:center;gap:8px}'
  + '.ssa-body{flex:1;padding:0;overflow:visible}'
  + '.ssa-body .ar-wrap{max-width:none;margin:0;padding:24px 28px 56px}'
  + '@media(max-width:600px){.ssa-modal{padding:0}.ssa-pane{border-radius:0;border:none;min-height:100vh;max-width:100%}'
  +   '.ssa-chrome{border-radius:0}.ssa-body .ar-wrap{padding:16px 18px 40px}}';
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
    es: [
      '/landing.html',
      '/condition/anxiety-stack.html',
      '/condition/pcos-protocol.html'
    ]
  };
  function langPathForCurrent(lang){
    if (lang === 'en') return enPathFromCurrent();
    var enPath = enPathFromCurrent();
    var direct = '/' + lang + enPath;
    if ((LANG_INDEX[lang] || []).indexOf(enPath) !== -1) return direct;
    return null;
  }
  /* Language link target: always go to that language's INDEX page (the
     supplement directory), never the marketing landing page. The user
     explicitly asked for this — clicking a language link should land you
     on the directory in that language so you can browse from there.
       EN → /index.html
       FR → /fr/index.html
       ES → /es/index.html
     /fr/index.html and /es/index.html exist as light wrappers that load
     the main directory with a translated "directory currently EN-only"
     banner; build proper translated directories over time. */
  function langIndexPath(lang){
    return lang === 'en' ? '/index.html' : '/' + lang + '/index.html';
  }
  /* Convert a repo-absolute path (e.g. '/fr/landing.html') to a path that
     resolves correctly from the CURRENT page, regardless of whether the
     site is being viewed via http(s) or file://. We compute depth based on
     where we are relative to the repo root.
       /sources.html              → depth 0 → 'fr/landing.html'
       /a/foo.html                → depth 1 → '../fr/landing.html'
       /fr/condition/bar.html     → depth 2 → '../../landing.html'
     For file:// URLs we anchor on the literal '/supplementscore-repo/'
     directory name in the path. */
  function langRelPath(targetAbsPath){
    var here = location.pathname;
    var REPO = '/supplementscore-repo/';
    var anchorIdx = here.indexOf(REPO);
    var afterRepo = anchorIdx >= 0
      ? here.substring(anchorIdx + REPO.length)
      : here.replace(/^\//,'');
    var depth = (afterRepo.match(/\//g) || []).length;
    var prefix = depth === 0 ? '' : new Array(depth + 1).join('../');
    return prefix + targetAbsPath.replace(/^\//,'');
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
    /* TEMPORARILY HIDDEN — 2026-05-05.
       Per user: hide the language options until the FR/ES translations
       are complete enough to be advertised site-wide. The /fr/ and /es/
       URL trees still exist and the pages still work if linked
       directly; we just don't surface the switcher in the UI yet.
       To re-enable: delete this early-return line. */
    return;
    if (document.querySelector('.ssux-lang') || document.querySelector('.ssux-lang-foot')) return;
    /* Don't render on iframe-embedded pages (supplement-modal.js loads
       supplement.html in an iframe; we don't want a duplicate switcher). */
    var sp = new URLSearchParams(location.search);
    if (sp.get('modal') === '1') return;

    var langs = [{k:'en',l:'EN'},{k:'fr',l:'FR'},{k:'es',l:'ES'}];
    var cur = currentLang();

    /* Always emit hreflang link tags so search engines and assistive tech
       know about the alternate URLs. Only emit for languages that actually
       exist for this page. */
    ['en','fr','es'].forEach(function(k){
      var t = langPathForCurrent(k);
      if (!t) return;
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', k);
      link.href = location.origin + t;
      document.head.appendChild(link);
    });

    /* Preferred placement: a small inline row in the brand column,
       directly under the "© 2026 · CC-BY 4.0" meta line. Falls back to
       the floating top-right pill on pages with no .site-footer (e.g.
       /a/ static articles, /condition/ deep dives, /fr/ landing). */
    var copyMeta = document.querySelector('.site-footer-meta');
    if (copyMeta){
      var row = document.createElement('div');
      row.className = 'ssux-lang-foot';
      row.setAttribute('aria-label','Language');
      langs.forEach(function(L, idx){
        if (idx > 0) row.appendChild(document.createTextNode(' · '));
        if (cur === L.k){
          var span = document.createElement('span');
          span.className = 'on';
          span.textContent = L.l;
          span.setAttribute('aria-current','true');
          row.appendChild(span);
        } else {
          var a = document.createElement('a');
          /* Repo-relative path so the link works on file:// AND https:// */
          a.href = langRelPath(langIndexPath(L.k));
          a.textContent = L.l;
          a.setAttribute('hreflang', L.k);
          row.appendChild(a);
        }
      });
      copyMeta.parentNode.insertBefore(row, copyMeta.nextSibling);
      return;
    }

    /* Fallback: floating top-right pill (kept identical to the original
       behavior so detail pages without a .site-footer still get a switcher). */
    var box = document.createElement('div');
    box.className = 'ssux-lang';
    box.setAttribute('role','group');
    box.setAttribute('aria-label','Language');
    langs.forEach(function(L){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = L.l;
      b.setAttribute('aria-label', L.l + (cur === L.k ? ' (current)' : ''));
      if (cur === L.k) b.className = 'on';
      if (cur !== L.k){
        var target = langRelPath(langIndexPath(L.k));
        b.addEventListener('click', function(){location.href = target;});
      }
      box.appendChild(b);
    });
    document.body.appendChild(box);
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
        ? '/supplement.html?slug=' + encodeURIComponent(it.slug)
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

  /* ---------- PubMed live citation count badge ---------- */
  /* Adds a small "Cited in N PubMed papers · last new study <date>" pill to
     supplement modals and /a/ articles. Cached in localStorage for 7 days
     to stay well under PubMed's 3-req/sec rate limit. */
  var PM_TTL = 7 * 24 * 3600 * 1000;
  function pubmedBadge(query, mountEl){
    if (!query || !mountEl) return;
    if (mountEl.querySelector('.ssux-pmbadge')) return;
    var key = 'ss-pmcount:' + query.toLowerCase();
    var cached = null;
    try {
      var raw = localStorage.getItem(key);
      if (raw) cached = JSON.parse(raw);
    } catch(_){}
    if (cached && (Date.now() - (cached.t||0)) < PM_TTL){
      renderBadge(mountEl, cached);
      return;
    }
    var url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
      + '?db=pubmed&term=' + encodeURIComponent(query)
      + '&retmode=json&retmax=1&sort=date';
    fetch(url).then(function(r){return r.ok ? r.json() : null;}).then(function(j){
      if (!j || !j.esearchresult) return;
      var c = parseInt(j.esearchresult.count || '0', 10);
      var topId = (j.esearchresult.idlist||[])[0] || null;
      var data = {count:c, topId:topId, t:Date.now()};
      try { localStorage.setItem(key, JSON.stringify(data)); } catch(_){}
      renderBadge(mountEl, data);
    }).catch(function(){});
  }
  function renderBadge(mount, data){
    if (!data || !data.count) return;
    var pretty = data.count > 999 ? Math.round(data.count/1000) + 'k' : data.count;
    var url = data.topId
      ? 'https://pubmed.ncbi.nlm.nih.gov/' + data.topId + '/'
      : 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(mount.dataset.pmq||'');
    var el = document.createElement('a');
    el.className = 'ssux-pmbadge';
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.href = url;
    el.title = data.count.toLocaleString() + ' papers indexed in PubMed';
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>'
      + '<span><strong>' + pretty + '</strong> on PubMed</span>';
    mount.appendChild(el);
  }
  /* Hook: app.js can call this when it opens the supplement modal */
  window.ssPubMedBadgeFor = pubmedBadge;
  /* Also auto-attach on /a/ article pages where the H1 is the supplement title */
  function initPubMedOnArticle(){
    if (!/\/a\//.test(location.pathname)) return;
    var h1 = document.querySelector('h1');
    var meta = document.querySelector('.ar-meta');
    if (!h1 || !meta) return;
    /* Try to extract a sensible PubMed query from the H1 */
    var title = (h1.textContent||'').trim();
    var m = title.split(/[:—–\-]/)[0].trim();
    if (m.length < 3) return;
    var mount = document.createElement('span');
    mount.className = 'ssux-pmbadge-mount';
    mount.dataset.pmq = m;
    meta.appendChild(document.createTextNode(' '));
    meta.appendChild(mount);
    pubmedBadge(m, mount);
  }

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

  function boot(){
    initBackToTop();
    initReadingProgress();
    initLangSwitcher();
    initHeroFocusPause();
    initStickyToc();
    initRecentlyViewedStrip();
    initBreadcrumbs();
    initPubMedOnArticle();
    initShareFab();
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
})();
