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
    /* clinician handout button — wrapped in a block so it claims its
       own line above the article H1 (was overlapping the title because
       the button alone was display:inline-flex). Button itself slimmed
       per user 'button too big?' feedback. */
  + '.ssux-handout-wrap{display:block;margin:0 0 14px 0}'
  + '.ssux-handout{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;'
  + 'background:rgba(31,122,107,.10);border:1px solid rgba(31,122,107,.22);color:#155b50;'
  + 'font-family:\'Mona Sans\',inherit;font-weight:600;font-size:11px;letter-spacing:.005em;cursor:pointer;text-decoration:none;transition:background .12s;line-height:1.2}'
  + '.ssux-handout:hover{background:rgba(31,122,107,.16)}'
  + '.ssux-handout svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
    /* print-only optimized layout (clinician handout uses window.print()) */
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
  + '.ssux-print-banner{display:none}'
    /* iframe-context: hide chrome that would collide with the parent
       modal's controls.
       NOTE (2026-05-19): removed `.pg-close-fab` from this hide list.
       Supplement-modal.js already hides its outer X via .hide-chrome when
       the iframe is on a non-supplement page, so hiding the inner FAB too
       left users on condition / compare deep-dives with zero close
       affordance. The inner FAB now stays visible — it's the only X on
       those pages, and its history.back() inside the iframe returns the
       user to the supplement card they came from. */
  + 'html.ss-in-iframe .reader-close-fab,'
  + 'html.ss-in-iframe .hub-close-fab,'
  + 'html.ss-in-iframe .ssux-lang{display:none !important}'
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
  function initClinicianHandout(){
    /* Show a 'Print handout' button on supplement detail and on /a/ articles
       — EXCEPT Quick Reads. Quick Reads are short digest articles distilled
       from the Discover page; a clinician hand-out doesn't make sense for
       a list of 10 supplements with one-liner facts. */
    var target = null;
    if (/\/a\//.test(location.pathname)){
      target = document.querySelector('main.ar-wrap');
      /* Skip Quick Reads articles. The category label is set on .ar-cat. */
      var catEl = document.querySelector('.ar-cat');
      if (catEl && /quick reads/i.test(catEl.textContent || '')) return;
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
    /* Wrap in a block container so the button sits on its own line
       above the H1 (was rendering inline, overlapping the title). */
    var wrap = document.createElement('div');
    wrap.className = 'ssux-handout-wrap';
    wrap.appendChild(btn);
    target.insertBefore(wrap, target.firstChild);
  }

  /* ---------- Breadcrumbs on detail pages ---------- */
  /* Renders a small "Home › Section › Title" trail just below the nav.
     Inferred from the URL path; doesn't require markup changes. */
  function initBreadcrumbs(){
    var p = location.pathname;
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
  function _v2Slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'section'; }
  function _v2AccentFromCat(txt){
    if (!txt) return 'stack';
    var t = String(txt).toLowerCase();
    if (/safety/.test(t)) return 'safety';
    if (/reality|myth/.test(t)) return 'myth';
    if (/breakthrough|research update/.test(t)) return 'breakthrough';
    if (/kids|teen|infant/.test(t)) return 'kids';
    if (/stack/.test(t)) return 'stack';
    if (/quick read/.test(t)) return 'quickread';
    if (/guide|featured/.test(t)) return 'guide';
    return 'stack';
  }
  function _v2ReadMin(text){
    var words = String(text||'').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words/200));
  }
  function _v2CountStudies(wrap){
    var n = 0;
    /* Count distinct PMID references (PubMed links or PMID:N labels). */
    var anchors = wrap.querySelectorAll('a[href*="pubmed"], a[href*="doi.org"]');
    var seen = {};
    for (var i=0; i<anchors.length; i++){
      var k = anchors[i].getAttribute('href') || anchors[i].textContent;
      if (k && !seen[k]){ seen[k] = 1; n++; }
    }
    /* Also pick up inline "PMID 12345678" mentions. */
    var pmidMatches = (wrap.textContent.match(/PMID[:\s]*\d{6,9}/g) || []);
    pmidMatches.forEach(function(p){ if (!seen[p]){ seen[p] = 1; n++; }});
    return n;
  }
  function _v2EvidenceLevel(studies, cat){
    /* Coarse heuristic — myth/safety articles often cite fewer because
       they're rebutting weak claims rather than synthesising RCTs.
       Use the citation count as a proxy. */
    if (studies >= 12) return { label: 'Strong', bars: 3 };
    if (studies >= 6)  return { label: 'Moderate', bars: 2 };
    if (studies >= 1)  return { label: 'Mixed', bars: 1 };
    return { label: 'Limited', bars: 1 };
  }
  function _v2FormatDate(iso){
    try {
      var d = new Date(iso + 'T00:00');
      if (isNaN(d)) return iso;
      return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    } catch(_){ return iso; }
  }
  function initArticleV2(){
    /* Only on standalone /a/<slug>.html pages, when NOT in an iframe */
    if (!/^\/a\/[^/]+\.html$/.test(location.pathname)) return;
    if (window !== window.top) return; /* modal context — skip */
    var wrap = document.querySelector('.ar-wrap');
    if (!wrap) return;
    if (wrap.classList.contains('article-v2')) return; /* idempotent */
    var h1 = wrap.querySelector('h1');
    var cat = wrap.querySelector('.ar-cat');
    var meta = wrap.querySelector('.ar-meta');
    if (!h1) return;
    var catTxt = cat ? cat.textContent.trim() : 'Guide';
    var accentKey = _v2AccentFromCat(catTxt);
    /* Compute studies/words/read-time from the whole wrap, BEFORE we
       inject the new chrome. */
    var bodyText = wrap.textContent || '';
    var studies = _v2CountStudies(wrap);
    var readMin = _v2ReadMin(bodyText);
    var ev = _v2EvidenceLevel(studies, accentKey);
    /* Pull reviewed date from <!-- last-reviewed: YYYY-MM-DD --> comment
       OR from existing meta line if present. */
    var reviewedISO = null;
    var html = document.documentElement.outerHTML;
    var lrm = html.match(/<!--\s*last-reviewed:\s*(\d{4}-\d{2}-\d{2})\s*-->/);
    if (lrm) reviewedISO = lrm[1];
    if (!reviewedISO && meta){
      var mm = meta.textContent.match(/(\w+ \d{1,2}, \d{4})/);
      if (mm) reviewedISO = mm[1]; /* leave as human-formatted */
    }
    var reviewedHuman = reviewedISO && /^\d{4}-\d{2}-\d{2}$/.test(reviewedISO)
      ? _v2FormatDate(reviewedISO) : (reviewedISO || '');
    /* Mark wrap with v2 + accent */
    wrap.classList.add('article-v2');
    wrap.setAttribute('data-accent', accentKey);
    /* Rename .ar-cat → .cat (preserves text) */
    if (cat){ cat.classList.remove('ar-cat'); cat.classList.add('cat'); }
    /* Promote h1 to .v2-h1 */
    h1.classList.add('v2-h1');
    /* Hide the legacy .ar-meta (we'll show a richer trust strip instead).
       Keep it in the DOM as fallback for non-JS / screen-readers. */
    if (meta){ meta.style.display = 'none'; meta.setAttribute('aria-hidden','true'); }
    /* Build the trust strip and insert after h1 */
    var bars = '';
    for (var b=0; b<3; b++) bars += '<span' + (b<ev.bars?' class="on"':'') + '></span>';
    var trustHtml =
        '<div class="trust">'
      +   '<span class="trust-item"><b>' + readMin + ' min</b> read</span>'
      + (studies>0 ? '<span class="trust-item"><b>' + studies + '</b> studies cited</span>' : '')
      +   '<span class="trust-item"><span class="trust-bars">' + bars + '</span><b>' + ev.label + '</b> evidence</span>'
      + (reviewedHuman ? '<span class="trust-rev">Reviewed · ' + reviewedHuman + '</span>' : '')
      + '</div>';
    h1.insertAdjacentHTML('afterend', trustHtml);
    /* Build the Bottom Line — first <p> that follows .trust */
    var firstP = wrap.querySelector('.trust ~ p, .ar-meta + p');
    if (!firstP){
      firstP = wrap.querySelector('p');
    }
    if (firstP && firstP.textContent.trim().length > 40){
      var lede = firstP.textContent.trim();
      /* Use the full first paragraph as the headline, with sensible
         truncation if it overruns. Cap ≈ 320 chars on a sentence
         boundary so it stays readable as a "Bottom Line" callout. */
      var head = lede;
      if (head.length > 320){
        var cut = head.slice(0, 320);
        var lastDot = cut.lastIndexOf('.');
        if (lastDot > 150) head = cut.slice(0, lastDot + 1);
        else head = cut.trim() + '…';
      }
      var blHtml =
          '<div class="bl">'
        +   '<div class="bl-k">The Bottom Line</div>'
        +   '<div class="bl-v">' + head.replace(/[<&]/g, function(c){return c==='<'?'&lt;':'&amp;';}) + '</div>'
        + '</div>';
      firstP.insertAdjacentHTML('beforebegin', blHtml);
    }
    /* Build the TOC from h2/h3 — skips Sources */
    var heads = Array.prototype.slice.call(wrap.querySelectorAll('h2, h3')).filter(function(h){
      var t = (h.textContent||'').trim();
      return t && !/^sources?$/i.test(t) && !/^references?$/i.test(t);
    });
    if (heads.length >= 2){
      var totalMin = 0;
      var items = heads.map(function(h, i){
        if (!h.id) h.id = 'sec-' + (i+1) + '-' + _v2Slug(h.textContent);
        /* Compute per-section text up to next heading */
        var txt = '';
        var cur = h.nextElementSibling;
        while (cur && !/^H[23]$/.test(cur.tagName)){
          txt += ' ' + (cur.textContent||'');
          cur = cur.nextElementSibling;
        }
        var m = _v2ReadMin(txt);
        totalMin += m;
        var num = String(i+1).padStart(2,'0');
        var onCls = i === 0 ? ' on' : '';
        return '<li class="toc-li' + onCls + '"><a href="#' + h.id + '"><span class="toc-num">' + num + '</span><span>' + (h.textContent||'').trim().replace(/[<&]/g, function(c){return c==='<'?'&lt;':'&amp;';}) + '</span><span class="toc-time">' + m + ' min</span></a></li>';
      }).join('');
      var tocHtml =
          '<nav class="toc" aria-label="On this page">'
        +   '<div class="toc-h">On this page'
        +     '<span class="toc-meta">' + heads.length + ' sections · ' + totalMin + ' min</span>'
        +   '</div>'
        +   '<ul class="toc-l">' + items + '</ul>'
        + '</nav>';
      /* Insert TOC after the Bottom Line if present, else after the trust strip */
      var anchor = wrap.querySelector('.bl') || wrap.querySelector('.trust');
      if (anchor) anchor.insertAdjacentHTML('afterend', tocHtml);
      /* Remove the older floating sticky TOC — v2 inline TOC supersedes
         it on this page. The floating .ssux-toc visually clashes with
         the close FAB at top-right and duplicates the same content. */
      var floatingToc = document.querySelector('nav.ssux-toc');
      if (floatingToc && floatingToc.parentNode) floatingToc.parentNode.removeChild(floatingToc);
    }
    /* Wrap the article in a modal-style frame matching the in-modal
       presentation: centered ~780px card on a blurred backdrop, with
       a sticky top chrome carrying Prev/Next + Share + X. Reuses the
       existing .art-modal / .art-modal-pane / .art-modal-chrome
       classes from styles.css so the look is identical. */
    if (!document.querySelector('.ssa-modal')){
      var artTitle = (h1.textContent || '').trim();
      var chromeHtml =
          '<div class="art-modal ssa-modal v2-chrome open" role="dialog" aria-modal="true" aria-label="' + artTitle.replace(/[<&"]/g, function(c){return {'<':'&lt;','&':'&amp;','"':'&quot;'}[c];}) + '">'
        +   '<div class="art-modal-pane ssa-pane">'
        +     '<div class="art-modal-chrome ssa-chrome">'
        +       '<div class="art-modal-nav">'
        +         '<button type="button" id="ssa-prev" class="art-nav-btn" aria-label="Previous article" disabled>'
        +           '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
        +         '</button>'
        +         '<button type="button" id="ssa-next" class="art-nav-btn" aria-label="Next article" disabled>'
        +           '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>'
        +         '</button>'
        +       '</div>'
        +       '<div class="art-modal-actions">'
        +         '<button type="button" id="ssa-share" class="art-share-btn" aria-label="Share article" title="Share article">'
        +           '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'
        +           '<span class="art-share-label">Share</span>'
        +         '</button>'
        +         '<button type="button" id="ssa-close" class="art-modal-close" aria-label="Close">'
        +           '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        +         '</button>'
        +       '</div>'
        +     '</div>'
        +     '<div id="ssa-toast" class="art-share-toast" role="status" aria-live="polite"></div>'
        +     '<div class="art-modal-body ssa-body"></div>'
        +   '</div>'
        + '</div>';
      /* Inject the modal frame into the body, move the existing wrap
         INTO the body slot of the frame, and remove the now-redundant
         legacy close FAB (the chrome X handles closing now). */
      document.body.insertAdjacentHTML('beforeend', chromeHtml);
      var bodySlot = document.querySelector('.ssa-modal .ssa-body');
      bodySlot.appendChild(wrap);
      /* Drop any standalone-page close FAB; the modal chrome owns this now. */
      document.querySelectorAll('.pg-close-fab, .reader-close-fab').forEach(function(el){
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      /* Style the host page: hide overflow on body so the modal owns
         the viewport, drop site-nav/footer if present. */
      document.body.classList.add('ssa-standalone-modal');
      /* Wire chrome buttons */
      var goBack = function(){
        if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1){
          history.back();
        } else {
          location.href = '../index.html#research';
        }
      };
      var closeBtn = document.getElementById('ssa-close');
      if (closeBtn) closeBtn.addEventListener('click', goBack);
      var shareBtn = document.getElementById('ssa-share');
      if (shareBtn) shareBtn.addEventListener('click', function(){
        var url = location.href;
        var data = { title: artTitle + ' — SupplementScore', text: artTitle, url: url };
        var toast = function(msg){
          var t = document.getElementById('ssa-toast');
          if (!t) return;
          t.textContent = msg;
          t.classList.add('show');
          setTimeout(function(){ t.classList.remove('show'); }, 1600);
        };
        if (navigator.share && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)){
          navigator.share(data).catch(function(err){
            if (err && err.name !== 'AbortError'){
              if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ toast('Link copied'); });
            }
          });
        } else if (navigator.clipboard){
          navigator.clipboard.writeText(url).then(function(){ toast('Link copied'); shareBtn.classList.add('copied'); setTimeout(function(){ shareBtn.classList.remove('copied'); }, 1400); });
        }
      });
      /* Esc closes */
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape') goBack();
      });
      /* Wire Prev/Next via sitemap-articles.xml (cached in sessionStorage). */
      _ssaWirePrevNext();
    }
  }

  /* Fetch and cache the article slug ordering, then wire Prev/Next on
     the standalone-article modal frame. Order matches sitemap-articles.xml. */
  function _ssaWirePrevNext(){
    var here = location.pathname.replace(/^.*\/a\//, 'a/');
    var SLUG_CACHE_KEY = 'ssa-article-slugs-v1';
    function attach(slugs){
      if (!slugs || !slugs.length) return;
      var idx = slugs.indexOf(here);
      var prevBtn = document.getElementById('ssa-prev');
      var nextBtn = document.getElementById('ssa-next');
      if (!prevBtn || !nextBtn) return;
      if (idx > 0){
        prevBtn.disabled = false;
        prevBtn.addEventListener('click', function(){ location.href = '../' + slugs[idx-1]; });
      }
      if (idx >= 0 && idx < slugs.length - 1){
        nextBtn.disabled = false;
        nextBtn.addEventListener('click', function(){ location.href = '../' + slugs[idx+1]; });
      }
    }
    try {
      var cached = sessionStorage.getItem(SLUG_CACHE_KEY);
      if (cached){
        var arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length){ attach(arr); return; }
      }
    } catch(_){}
    /* Fetch + parse sitemap-articles.xml at the site root */
    var sitemapUrl = location.pathname.replace(/\/a\/[^/]+$/, '/sitemap-articles.xml');
    if (!/\/sitemap-articles\.xml$/.test(sitemapUrl)) sitemapUrl = '/sitemap-articles.xml';
    fetch(sitemapUrl).then(function(r){ return r.ok ? r.text() : null; }).then(function(text){
      if (!text) return;
      var slugs = [];
      var re = /<loc>https?:\/\/[^/]+\/a\/([^<]+)<\/loc>/g;
      var m;
      while ((m = re.exec(text))){ slugs.push('a/' + m[1]); }
      try { sessionStorage.setItem(SLUG_CACHE_KEY, JSON.stringify(slugs)); } catch(_){}
      attach(slugs);
    }).catch(function(){});
  }

  function boot(){
    initBackToTop();
    initReadingProgress();
    initLangSwitcher();
    initHeroFocusPause();
    initStickyToc();
    initRecentlyViewedStrip();
    initClinicianHandout();
    initBreadcrumbs();
    initPubMedOnArticle();
    initArticleV2();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
