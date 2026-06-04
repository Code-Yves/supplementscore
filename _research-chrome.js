/* SupplementScore — Research chrome injector
   ===========================================
   Adds a cohesive chrome to every long-form page under /a/, /for/,
   /condition/, /stack/. Lives once, runs on each page, no per-page edits.

   Detects the wrapper class (one of .ar-wrap, .sx-wrap, .ca-wrap, .sk-wrap)
   and injects:
     1. Top bar with Share + X close (Prev/Next stub for later manifest wiring)
     2. Trust line under the H1: read time, sources count, reviewed date
     3. "On this page" auto-TOC built from H2 headings inside the wrap
     4. Section-number labels (01, 02, ...) prepended to each H2

   What it does NOT do (intentional):
     - Generate a "Bottom Line" callout — needs authored content
     - Generate evidence-strength bars — needs an authored value
     - Wire Prev/Next — needs a category manifest, hidden until provided

   Loading: included via <script src="/_research-chrome.js?v=..." defer> on
   pages that opt in. The script is idempotent — re-runs are no-ops.
*/
(function(){
  'use strict';

  /* Idempotency guard — don't double-inject if hot-reloaded */
  if (window.__rcInit) return;
  window.__rcInit = true;

  /* If we're rendered inside the homepage's research-modal iframe, swap to
     embedded mode: the parent owns the close chrome, the global footer is
     hidden, and our X postMessages the parent to close. */
  var inIframe = false;
  try { inIframe = window.self !== window.top; } catch(_){ inIframe = true; }
  if (inIframe){
    document.documentElement.classList.add('rc-in-iframe');
  }

  /* Locate the article wrapper. Each section uses a different class name; we
     treat them as equivalent. Chrome is article-archetype only — /s/, /m/,
     /hub/ have their own document structure (supplement detail, medication
     detail, topic hub) and don't fit chrome's TOC + section-numbering. */
  var wrap = document.querySelector('main.ar-wrap, main.sx-wrap, main.ca-wrap, main.sk-wrap');
  if (!wrap) return;

  var h1 = wrap.querySelector('h1');
  if (!h1) return;

  /* ---------- helpers ---------- */

  function el(tag, cls, html){
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function pad2(n){ return n < 10 ? '0' + n : String(n); }

  /* Detect "byline / meta" paragraphs — class-based (ca-meta, sk-meta,
     ar-meta, sx-meta) or pattern-based (starts with "Updated YYYY-MM-DD",
     contains "Reviewed by", etc.). Used by the Bottom Line lede picker so
     it doesn't accidentally lift the byline. */
  function isMetaPara(node){
    if (!node || !node.classList) return false;
    if (node.classList.contains('ca-meta') || node.classList.contains('sk-meta') ||
        node.classList.contains('ar-meta') || node.classList.contains('sx-meta') ||
        node.classList.contains('ss-last-reviewed') ||
        node.classList.contains('ar-byline')){
      return true;
    }
    var txt = (node.textContent || '').trim();
    if (/^Updated\s+\d{4}-\d{2}-\d{2}/.test(txt)) return true;
    if (/^Reviewed by\b/i.test(txt)) return true;
    if (/^By the\b/.test(txt) && /Editorial/i.test(txt)) return true;
    return false;
  }

  /* Read time — fall back to ~200wpm word-count estimate when we can't find
     an explicit "N min read" string anywhere in the existing meta. Some
     templates already include one (.ar-meta, .sk-kicker, .ca-kicker). */
  function detectReadTime(){
    var meta = wrap.querySelector('.ar-meta, .sk-kicker, .ca-kicker, .sx-meta');
    if (meta){
      var m = (meta.textContent || '').match(/(\d+)\s*min\s*read/i);
      if (m) return parseInt(m[1], 10);
    }
    var text = (wrap.textContent || '').trim();
    var words = text.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  /* Sources count — count <li> items inside the page's Sources <ol>. We look
     for either an <h2/h3>Sources</h2> followed by an <ol>, or any <ol> whose
     children have data-funder-type / data-source-key attrs. */
  function detectSourcesCount(){
    var ols = wrap.querySelectorAll('ol');
    for (var i = 0; i < ols.length; i++){
      var ol = ols[i];
      if (ol.querySelector('li[data-source-key], li[data-funder-type], li[data-funder]')){
        return ol.querySelectorAll('li').length;
      }
    }
    /* Fallback: heading-sibling <ol> after a "Sources" h2/h3 */
    var headers = wrap.querySelectorAll('h2, h3');
    for (var j = 0; j < headers.length; j++){
      var h = headers[j];
      if (/^\s*sources?\s*$/i.test(h.textContent || '')){
        var sib = h.nextElementSibling;
        while (sib && sib.tagName !== 'OL') sib = sib.nextElementSibling;
        if (sib) return sib.querySelectorAll('li').length;
      }
    }
    return 0;
  }

  /* Reviewed date — parse one of the existing SEO-LASTREVIEWED blocks, or the
     <meta property="article:modified_time"> tag, or fall back to scanning the
     existing meta line for "Reviewed/Updated <Mon DD, YYYY>". */
  function detectReviewedDate(){
    var time = wrap.querySelector('.ss-last-reviewed time, time[datetime]');
    if (time){
      var d = new Date(time.getAttribute('datetime') || time.textContent);
      if (!isNaN(d.getTime())) return formatDate(d);
    }
    var meta = document.querySelector('meta[property="article:modified_time"], meta[name="last-modified"]');
    if (meta && meta.getAttribute('content')){
      var d2 = new Date(meta.getAttribute('content'));
      if (!isNaN(d2.getTime())) return formatDate(d2);
    }
    var m = (wrap.textContent || '').match(/(?:Reviewed|Updated|Last reviewed)[^A-Za-z0-9]*([A-Za-z]+\s+\d{1,2},\s*\d{4})/);
    if (m) return m[1];
    return '';
  }

  function formatDate(d){
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  /* Slugify a heading's text content into an anchor id */
  function slugify(s){
    return (s || '').toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  /* Determine which category label to show ("Stack", "Population",
     "Condition", "Research" etc.) — try existing kickers first, then derive
     from URL path. */
  function detectCategory(){
    var k = wrap.querySelector('.ar-cat, .ca-kicker, .sk-kicker, .sx-kicker');
    if (k){
      var t = (k.textContent || '').trim();
      var pri = t.split(/[·•|]/)[0].trim();
      if (pri) return pri;
    }
    var p = location.pathname;
    if (p.indexOf('/condition/') === 0) return 'Condition';
    if (p.indexOf('/stack/') === 0) return 'Stack';
    if (p.indexOf('/for/') === 0) return 'Population';
    if (p.indexOf('/a/') === 0) return 'Research';
    return '';
  }

  /* X-close handler — inside the iframe modal, postMessage the parent so
     it closes the overlay (and doesn't navigate the parent away). When
     standalone, mirror the existing .pg-close-fab session-stack logic so
     back-navigation matches the rest of the site. */
  function closeArticle(e){
    if (e && e.preventDefault) e.preventDefault();
    if (inIframe){
      try { window.parent.postMessage({ type: 'rc-close' }, '*'); } catch(_){}
      return;
    }
    var SKIP = 'ss-art-skip-push', KEY = 'ss-art-stack', OLD = 'ss-art-origin';
    var stack = [];
    try { stack = JSON.parse(sessionStorage.getItem(KEY) || '[]'); if (!Array.isArray(stack)) stack = []; } catch(_){ stack = []; }
    if (stack.length){
      var prev = stack.pop();
      try { sessionStorage.setItem(KEY, JSON.stringify(stack)); } catch(_){}
      try { sessionStorage.setItem(SKIP, '1'); } catch(_){}
      location.href = prev;
      return;
    }
    var o = null;
    try { o = sessionStorage.getItem(OLD); } catch(_){}
    if (o){
      try { sessionStorage.removeItem(OLD); } catch(_){}
      location.href = o;
      return;
    }
    if (document.referrer && document.referrer.indexOf(location.origin) === 0 && history.length > 1){
      history.back();
    } else {
      location.href = '/';
    }
  }

  /* Share handler — uses Web Share API where available, falls back to
     copying the URL to clipboard. */
  function share(e){
    if (e && e.preventDefault) e.preventDefault();
    var title = document.title || '';
    var url = location.href;
    if (navigator.share){
      navigator.share({ title: title, url: url }).catch(function(){});
      return;
    }
    try {
      navigator.clipboard.writeText(url).then(function(){
        flash('Link copied');
      }).catch(function(){ flash('Copy failed'); });
    } catch(_){ flash('Copy failed'); }
  }

  /* Small toast for share-copy feedback */
  function flash(text){
    var t = document.getElementById('rc-toast');
    if (!t){
      t = el('div', 'rc-toast');
      t.id = 'rc-toast';
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.classList.add('on');
    clearTimeout(flash._tid);
    flash._tid = setTimeout(function(){ t.classList.remove('on'); }, 1800);
  }

  /* ---------- build the chrome ---------- */

  /* 1. TOP BAR — Prev/Next/Share/X.
     Prev/Next are sourced from <meta name="rc-prev"> / <meta name="rc-next">
     (or window.RC_PREV_NEXT). When neither prev nor next exists, the whole
     left group is omitted so the bar reads cleanly. */
  function metaContent(name){
    var m = document.querySelector('meta[name="' + name + '"]');
    return m ? (m.getAttribute('content') || '').trim() : '';
  }
  var prevHref = metaContent('rc-prev') || (window.RC_PREV_NEXT && window.RC_PREV_NEXT.prev && window.RC_PREV_NEXT.prev.href) || '';
  var nextHref = metaContent('rc-next') || (window.RC_PREV_NEXT && window.RC_PREV_NEXT.next && window.RC_PREV_NEXT.next.href) || '';

  var leftGrp = '';
  if (prevHref || nextHref){
    leftGrp = '<div class="rc-top-grp">';
    if (prevHref){
      leftGrp += '<a class="rc-top-link rc-prev" href="' + prevHref + '" aria-label="Previous">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="15 18 9 12 15 6"/></svg> Prev' +
      '</a>';
    }
    if (nextHref){
      leftGrp += '<a class="rc-top-link rc-next" href="' + nextHref + '" aria-label="Next">' +
        'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</a>';
    }
    leftGrp += '</div>';
  } else {
    /* Empty placeholder keeps Share/Close right-aligned via flex-justify */
    leftGrp = '<div class="rc-top-grp" aria-hidden="true"></div>';
  }

  var topBar = el('div', 'rc-top');
  topBar.innerHTML = leftGrp +
    '<div class="rc-top-grp">' +
      '<button type="button" class="rc-top-link rc-share" aria-label="Share">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share' +
      '</button>' +
      '<span class="rc-top-sep" aria-hidden="true"></span>' +
      '<a class="rc-top-link rc-close" href="/" aria-label="Close">×</a>' +
    '</div>';
  wrap.insertBefore(topBar, wrap.firstChild);
  topBar.querySelector('.rc-share').addEventListener('click', share);
  topBar.querySelector('.rc-close').addEventListener('click', closeArticle);

  /* The legacy markup (back/close FABs, kickers, meta lines, SEO breadcrumb)
     was deleted from every article page by scripts/cleanup_legacy_chrome.py
     on 2026-05-24, so we no longer need a runtime hide-list. The
     rc-chrome-active class is still set on <html> because:
       (a) _site-ux.js's late-binding .pg-share-fab injector keys off it
           and aborts when present.
       (b) Some styles.css rules (e.g. ssa-modal chrome suppression)
           still rely on it to disambiguate the chrome flow.
     Anything that wants to opt out of the chrome can still check this class. */
  document.documentElement.classList.add('rc-chrome-active');

  /* 2. CATEGORY EYEBROW above the H1 — typographic, no fill (consistent
     with the no-filled-callouts site convention). The legacy kickers are
     hidden above, so we always inject this fresh element. */
  var category = detectCategory();
  if (category){
    var eyebrow = el('div', 'rc-cat', category);
    h1.parentNode.insertBefore(eyebrow, h1);
  }

  /* 3. TRUST LINE under H1 — read time, sources count, reviewed date */
  var readMin = detectReadTime();
  var srcCount = detectSourcesCount();
  var reviewed = detectReviewedDate();

  var trustHtml = '';
  trustHtml += '<span class="rc-trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg> ' + readMin + ' min</span>';
  if (srcCount > 0){
    trustHtml += '<span class="rc-trust-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> ' + srcCount + ' source' + (srcCount === 1 ? '' : 's') + '</span>';
  }
  if (reviewed){
    trustHtml += '<span class="rc-trust-item rc-trust-rev">Reviewed · ' + reviewed + '</span>';
  }

  var trust = el('div', 'rc-trust', trustHtml);
  /* Insert trust line right after H1 — and after any kicker that follows H1 */
  h1.parentNode.insertBefore(trust, h1.nextSibling);

  /* 4. TOC + section numbering. Pull body section headings — prefer H2s, but
     fall back to H3s on pages that use h3 throughout (legacy template).
     Trailing housekeeping headings (Sources, Related articles, Supplements
     mentioned) are filtered out — they're tail blocks, not body sections. */
  function collectBodyHeadings(level){
    var out = [];
    var all = wrap.querySelectorAll(level);
    for (var i = 0; i < all.length; i++){
      var node = all[i];
      var txt = (node.textContent || '').trim().toLowerCase();
      /* Stop at the first tail-block heading — same rules the tail-block
         normalizer uses, so tail blocks never leak into the TOC. */
      if (/^sources?$/.test(txt)) break;
      if (/^references?$/.test(txt)) break;
      if (/^related/.test(txt)) break;
      if (/^read more$/.test(txt)) break;
      if (/^supplements?\s+(mentioned|in this article)/.test(txt)) break;
      if (/^supplements?\s+in this stack$/.test(txt)) break;
      if (/^supplement details$/.test(txt)) break;
      out.push(node);
    }
    return out;
  }
  var h2s = collectBodyHeadings('h2');
  /* If a page has zero h2s in its body, fall back to h3s (e.g. older /a/
     templates where every section is an h3). */
  if (h2s.length === 0){
    h2s = collectBodyHeadings('h3');
  }

  /* ---------- helpers for tail-block normalization ---------- */

  /* Build an .rc-aend block (matches mockup-v7 design): eyebrow with right-
     aligned count, hairline below, then a list of arrow-rows. Used for
     "Supplements in this article", "Related articles", "Sources". */
  function buildAend(label, countText, body){
    var aend = el('div', 'rc-aend');
    var k = el('div', 'rc-aend-k');
    k.innerHTML = '<span>' + label + '</span>' + (countText ? '<span class="rc-aend-k-r">' + countText + '</span>' : '');
    aend.appendChild(k);
    if (typeof body === 'string'){
      var b = document.createElement('div');
      b.innerHTML = body;
      while (b.firstChild) aend.appendChild(b.firstChild);
    } else if (body){
      aend.appendChild(body);
    }
    return aend;
  }

  /* Render an arrow row inside an aend list — used for Related Articles and
     Supplement links. Includes optional category eyebrow + read time. */
  function arrowRowHtml(href, title, eyebrow){
    var eb = eyebrow ? '<div class="rc-rel-eb">' + eyebrow + '</div>' : '';
    return '<a class="rc-rel-row" href="' + href + '">' +
      '<div class="rc-rel-body">' + eb +
        '<div class="rc-rel-title">' + title + '</div>' +
      '</div>' +
      '<span class="rc-rel-arrow" aria-hidden="true">→</span>' +
    '</a>';
  }

  /* Render a richer score-card row for a supplement link. Used in the
     "Supplements in this article" aend when supplement-meta.json has a
     match. Score pill on the left, name + efficacy/safety/tag in the
     middle, tier label + arrow on the right.

     The href ALWAYS points to ../supplement.html?slug=<slug> — that's the
     canonical URL the existing supplement-modal.js intercepts on the
     homepage. Click handling further wires iframe-context messages so
     the modal opens cleanly from inside the article overlay too. */
  function suppRowHtml(slug, meta){
    var efS = meta.efficacy && meta.safety ?
      'Efficacy ' + meta.efficacy + '/5 · Safety ' + meta.safety + '/5' : '';
    var sep = efS && meta.tag ? ' · ' : '';
    var metaLine = efS + sep + (meta.tag || '');
    var href = '../supplement.html?slug=' + encodeURIComponent(slug);
    /* Tier pill removed 2026-05-24 — score on the left is the canonical
       metric; tier on the right was duplicative (and the user prefers
       score as the single supplement-strength signal). */
    return '<a class="rc-supp-row" href="' + href + '" data-supp-slug="' + slug + '">' +
      '<span class="rc-supp-row-s rc-supp-s-' + scoreBand(meta.score) + '">' + meta.score + '</span>' +
      '<div class="rc-supp-row-body">' +
        '<div class="rc-supp-row-name">' + meta.name + '</div>' +
        (metaLine ? '<div class="rc-supp-row-meta">' + metaLine + '</div>' : '') +
      '</div>' +
      '<span class="rc-supp-row-arrow" aria-hidden="true">→</span>' +
    '</a>';
  }

  /* Extract a supplement slug from a link URL. Handles, in priority order:
     - supplement.html?slug=<slug>   (current canonical article link form;
       also matches /supplement.html?slug=… and ../supplement.html?slug=…)
     - /s/magnesium-glycinate.html   (and ../s/.../ etc. — legacy tombstones)
     - supplement.html?n=Magnesium+glycinate  (older name-keyed form)
     Returns lower-case slug ready for lookup, or null. */
  function slugFromHref(href){
    if (!href) return null;
    /* supplement.html?slug=<slug> — the link form /a/ articles actually use.
       The [?&] before slug= matches it whether it's the first query param
       (right after ?) or a later one (after &); works across any path prefix
       (/, ../, https://host/, etc.). */
    var m = href.match(/supplement\.html\?(?:[^#]*[?&])?slug=([^&#]+)/);
    if (m){
      try { return decodeURIComponent(m[1]).toLowerCase(); }
      catch(_){ return m[1].toLowerCase(); }
    }
    /* /s/<slug>.html */
    m = href.match(/\/s\/([^/?#]+)\.html(?:[#?]|$)/);
    if (m) return m[1].toLowerCase();
    /* supplement.html?n=<name> */
    m = href.match(/supplement\.html\?[^#]*n=([^&#]+)/);
    if (m){
      try { return decodeURIComponent(m[1]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
      catch(_){ return null; }
    }
    return null;
  }

  /* Fetch the supplement-meta lookup once per page. Returns a promise that
     resolves to the map (or {} on failure — never rejects). */
  function loadSupplementMeta(){
    if (window._rcSupplementMeta) return Promise.resolve(window._rcSupplementMeta);
    if (window._rcSupplementMetaPending) return window._rcSupplementMetaPending;
    /* Path is relative to site root; figure it out from the chrome script's
       own src attribute so we don't hardcode depth. */
    var src = '/supplement-meta.json';
    var ownScript = document.querySelector('script[src*="_research-chrome.js"]');
    if (ownScript){
      var s = ownScript.getAttribute('src') || '';
      src = s.replace(/_research-chrome\.js.*$/, 'supplement-meta.json');
    }
    window._rcSupplementMetaPending = fetch(src, {credentials: 'omit'})
      .then(function(r){ return r.ok ? r.json() : {}; })
      .then(function(m){ window._rcSupplementMeta = m; return m; })
      .catch(function(){ window._rcSupplementMeta = {}; return {}; });
    return window._rcSupplementMetaPending;
  }

  /* The Tier→Score rewrite that used to live here was removed 2026-05-24
     after scripts/cleanup_legacy_chrome.py pre-baked every <span class=
     "tier-pill tX">Tier Y</span> into <span class="score-pill score-…">N
     </span> directly in HTML. Same for the /for/ .sx-tier pills and the
     "TIER" column header. The runtime swap is no longer needed.

     scoreBand() is still used by upgradeSupplementRows() below, so it
     stays. */
  function scoreBand(score){
    if (score >= 80) return 'hi';
    if (score >= 60) return 'mid';
    if (score >= 40) return 'low';
    return 'bad';
  }

  /* After the aend Supplements block is rendered with plain arrow rows,
     upgrade them in-place to .rc-supp-row when supplement-meta loads. */
  function upgradeSupplementRows(aend){
    loadSupplementMeta().then(function(meta){
      var list = aend.querySelector('.rc-rel-list');
      if (!list) return;
      var rows = list.querySelectorAll('.rc-rel-row');
      var upgraded = 0;
      rows.forEach(function(row){
        var href = row.getAttribute('href') || '';
        var slug = slugFromHref(href);
        if (!slug || !meta[slug]) return;
        /* Replace the plain row with the rich supp-row */
        var holder = document.createElement('div');
        holder.innerHTML = suppRowHtml(slug, meta[slug]);
        row.parentNode.replaceChild(holder.firstChild, row);
        upgraded++;
      });
      if (upgraded > 0) aend.classList.add('rc-aend-upgraded');
    });
  }

  /* Click interceptor for supplement links — wire to the canonical
     SSModal supplement overlay when available. Inside the article-iframe,
     postMessage the parent so it opens the supplement modal on top.
     If no modal is available (very old browsers, JS disabled), fall back
     to plain navigation. */
  document.addEventListener('click', function(e){
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('.rc-supp-row[data-supp-slug]');
    if (!a) return;
    var slug = a.getAttribute('data-supp-slug');
    if (!slug) return;
    /* Iframe context — let the parent handle it via SSModal. */
    if (inIframe){
      try {
        window.parent.postMessage({ type: 'rc-open-supp', slug: slug }, '*');
        e.preventDefault();
        return;
      } catch(_){}
    }
    /* Standalone — if SSModal is loaded on this page, use it. Otherwise
       let the link navigate normally. */
    if (window.SSModal && typeof window.SSModal.open === 'function'){
      e.preventDefault();
      window.SSModal.open(slug);
    }
  }, true);

  /* Classify a heading text into one of our known tail-block labels */
  function tailLabel(txt){
    var t = (txt || '').trim().toLowerCase();
    if (/^sources?$/.test(t) || /^references?$/.test(t)) return 'Sources';
    if (/^related articles?$/.test(t) || /^related reading$/.test(t) || /^read more$/.test(t) ||
        /^more comparisons$/.test(t) || /^you may also like$/.test(t) ||
        /^see also$/.test(t) || /^further reading$/.test(t) ||
        /^related conditions?$/.test(t) || /^related stacks?$/.test(t)) return 'Related articles';
    if (/^related supplements?$/.test(t) || /^supplement details$/.test(t) ||
        /^supplements?\s+(mentioned|in this article|in this comparison)$/.test(t) ||
        /^supplements?\s+in this stack$/.test(t) ||
        /^similar supplements?$/.test(t)) return 'Supplements';
    return null;
  }

  /* ---------- tail-block normalizer ---------- */

  /* Extract arrow rows from a <ul>/<ol> of links. Each <li><a> becomes one
     row; em-dashed link text ("Glycine — full scoring") splits into
     title + eyebrow. Returns the joined HTML string. */
  function rowsFromList(list){
    if (!list) return '';
    var rows = '';
    list.querySelectorAll('li').forEach(function(li){
      var a = li.querySelector('a');
      if (!a) return;
      var href = a.getAttribute('href') || '#';
      var title = (a.textContent || '').trim();
      var eyebrow = '';
      var m = title.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (m && m[2].length < 40){
        title = m[1];
        eyebrow = m[2];
      }
      rows += arrowRowHtml(href, title, eyebrow);
    });
    return rows;
  }
  function countItemsInList(list){
    return list ? list.querySelectorAll('li').length : 0;
  }

  /* Find each known tail heading inside the wrap, capture its sibling
     <ul>/<ol>, and rewrite as an .rc-aend. All "Related"-type blocks
     (Related articles, Related reading, Read more, the older
     .ca-related>strong "Related:" mini-list) are MERGED into a single
     "Related Research" aend. Supplements and Sources stay separate. */
  function normalizeTailBlocks(){
    /* 2026-05-25 — Aggressive dedup. Pages can carry up to THREE separate
       related blocks at once:
         (1) an inline `<strong>Related:</strong>` mini-list (.sk-related,
             .ar-related, .ca-related authored variants — /stack/, /m/)
         (2) the auto-injected SS-AUTOLINKS .ca-related block (script-managed)
         (3) an editorial "Related articles/reading" h2/h3 + ul/ol
       Goal: collapse to a single .rc-aend block at the bottom of the
       article. Strategy:
         a. Promote any non-heading "Related:" block (strong-tagged or
            wrapper-class-based) to an editorial h2 + ul so the normalizer
            can rebuild it as .rc-aend.
         b. If an editorial Related h2/h3 already exists alongside the auto
            .ca-related block, strip the autolink dup (autolink is fallback,
            not primary).
         c. Continue into the tail-block walker which now emits .rc-aend
            for Related articles as well (the 2026-05-24 skip was reverted
            per user request 2026-05-25 — they want unified styling). */

    /* Step a — promote inline `<strong>Related:</strong>` mini-list (used
       on /stack/ and /m/) to an editorial heading + ul so the standard
       walker picks it up. The original .sk-related wrapper gets removed
       once we've extracted its list. */
    wrap.querySelectorAll('.sk-related, .ar-related-mini, .mp-related').forEach(function(box){
      var strong = box.querySelector('strong');
      if (!strong) return;
      var lbl = (strong.textContent || '').trim().replace(/[:：]$/, '');
      if (!/^Related/i.test(lbl)) return;
      var list = box.querySelector('ul, ol');
      if (!list) return;
      /* Build a new editorial heading + the existing list, then drop the box */
      var h = document.createElement('h2');
      h.textContent = /reading$/i.test(lbl) ? 'Related reading' : 'Related articles';
      var parent = box.parentNode;
      parent.insertBefore(h, box);
      parent.insertBefore(list, box);
      parent.removeChild(box);
    });

    /* Step b — dedup. If an editorial Related/Read-more heading exists
       (excluding ones inside the autolink block), the autolink block is
       redundant — drop it. */
    var autoRel = wrap.querySelectorAll('.ca-related, .ar-related, .sx-related');
    if (autoRel.length){
      var hasEditorialRelated = false;
      var headingsAll = wrap.querySelectorAll('h2, h3');
      for (var k = 0; k < headingsAll.length; k++){
        var hh = headingsAll[k];
        if (hh.closest && hh.closest('.ca-related, .ar-related, .sx-related')) continue;
        if (tailLabel(hh.textContent) === 'Related articles'){
          hasEditorialRelated = true;
          break;
        }
      }
      if (hasEditorialRelated){
        autoRel.forEach(function(n){ if (n.parentNode) n.parentNode.removeChild(n); });
      }
    }

    var headings = wrap.querySelectorAll('h2, h3');
    var hits = [];
    for (var i = 0; i < headings.length; i++){
      var h = headings[i];
      var label = tailLabel(h.textContent);
      if (!label) continue;
      hits.push({el: h, label: label});
    }

    /* Buckets — accumulate items across multiple matching blocks so we
       can emit one aend per category. */
    var relatedRows = '';
    var relatedCount = 0;
    var relatedAnchor = null;  /* DOM position we'll inject the merged Related aend */
    var nodesToRemove = [];    /* original headings + lists to drop post-merge */

    hits.forEach(function(hit){
      var h = hit.el;
      var list = h.nextElementSibling;
      while (list && list.nodeType === 1 &&
             list.tagName !== 'UL' && list.tagName !== 'OL' &&
             list.tagName !== 'P' && list.tagName !== 'STRONG' &&
             !/related|supplement|source/i.test(list.className || '')){
        list = list.nextElementSibling;
      }
      if (!list) return;

      if (hit.label === 'Sources'){
        if (list.tagName !== 'OL') return;
        var n = list.querySelectorAll('li').length;
        var ol = el('ol', 'rc-src-list');
        list.querySelectorAll('li').forEach(function(li){
          var nl = document.createElement('li');
          nl.innerHTML = li.innerHTML;
          ol.appendChild(nl);
        });
        var sourcesAend = buildAend('Sources', n + ' peer-reviewed', ol);
        h.parentNode.insertBefore(sourcesAend, h);
        nodesToRemove.push(h, list);
        return;
      }

      if (list.tagName !== 'UL' && list.tagName !== 'OL') return;

      if (hit.label === 'Supplements'){
        /* Some templates already render a curated supplement list with
           rich cards / rows. When one of those exists, the auto-injected
           "Supplement details" autolink block is redundant — drop it
           from the DOM and skip our own aend so the page doesn't show
           two parallel supplement lists.
              /for/   pages → .sx-row inside .sx-results
              /cond/  pages → .stack-card blocks (layered supplement detail)
              /stack/ pages → .supp-card blocks (per-supplement detail)
           Two or more matches are required so a single accidental
           occurrence doesn't suppress the aend on otherwise-plain pages. */
        var curatedSuppNodes = wrap.querySelectorAll(
          '.sx-row, .sx-results .sx-row, .stack-card, .supp-card, .sk-row, .sk-results .sk-row, .ca-row, .ca-results .ca-row'
        );
        var hasCuratedSuppList = curatedSuppNodes.length >= 2;
        if (hasCuratedSuppList){
          nodesToRemove.push(h, list);
          return;
        }
        var suppRows = rowsFromList(list);
        var suppCount = countItemsInList(list);
        var suppAend = buildAend(
          'Supplements in this article',
          suppCount + ' supplement' + (suppCount === 1 ? '' : 's'),
          '<div class="rc-rel-list">' + suppRows + '</div>'
        );
        h.parentNode.insertBefore(suppAend, h);
        nodesToRemove.push(h, list);
        upgradeSupplementRows(suppAend);
        return;
      }

      /* Related-type — accumulate into the merged Related aend. 2026-05-25:
         re-enabled per user request — they want one unified .rc-aend block
         styled exactly like Supplements, instead of leaving a plain h3+ul
         that styles differently. */
      relatedRows += rowsFromList(list);
      relatedCount += countItemsInList(list);
      if (!relatedAnchor) relatedAnchor = h;
      nodesToRemove.push(h, list);
      return;
    });

    /* Emit the merged Related aend after the per-heading walk. Single aend
       even if the page had multiple Related blocks (Related articles +
       Related reading + Read more all coalesce). */
    if (relatedCount > 0 && relatedAnchor){
      var relAend = buildAend(
        'Related articles',
        relatedCount + ' related',
        '<div class="rc-rel-list">' + relatedRows + '</div>'
      );
      relatedAnchor.parentNode.insertBefore(relAend, relatedAnchor);
    }

    /* Drop all the originals we replaced. */
    nodesToRemove.forEach(function(n){
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });

    /* Clean up the .ca-related / .ar-related / .sx-related autolink wrappers
       2026-05-25 — when we inserted .rc-aend blocks before the original
       autolink headings, the .rc-aend ended up INSIDE the wrapper (the
       heading's parentNode WAS the wrapper). After removing the original
       h+ul children, the wrapper still surrounds our new .rc-aend with
       its own border/margin styling, creating a duplicate visual frame.
       Strategy: if the wrapper contains ONLY .rc-aend children (plus
       whitespace), unwrap it (move .rc-aend out, delete wrapper). If it's
       entirely empty, just delete. */
    wrap.querySelectorAll('.ca-related, .ar-related, .sx-related').forEach(function(box){
      var meaningful = [];
      for (var i = 0; i < box.children.length; i++){
        meaningful.push(box.children[i]);
      }
      var nonAend = meaningful.filter(function(c){ return !c.classList || !c.classList.contains('rc-aend'); });
      if (meaningful.length === 0){
        /* Fully empty — drop wrapper */
        if (box.parentNode) box.parentNode.removeChild(box);
      } else if (nonAend.length === 0){
        /* Only .rc-aend children — unwrap (move them up, delete wrapper) */
        var parent = box.parentNode;
        if (parent){
          meaningful.forEach(function(child){ parent.insertBefore(child, box); });
          parent.removeChild(box);
        }
      }
      /* Otherwise: wrapper has real content (legitimate authored autolinks
         that didn't get matched as tail blocks). Leave alone. */
    });
  }

  /* Only build the "On this page" TOC for genuinely multi-section articles
     (>=3 h2s). Listicles ("top 10 ...") have their numbered list as the main
     body and only 1-2 trailing h2s ("How to Use", "What Was Excluded"); the TOC
     is then both low-value and mis-placed (it renders before the first h2, which
     on a listicle is near the bottom). Suppressing it for <3 sections fixes that. */
  if (h2s.length >= 3){
    /* Build TOC items */
    var totalMin = readMin;
    var perMin = Math.max(1, Math.round(totalMin / h2s.length));
    var tocItems = '';
    h2s.forEach(function(h, idx){
      var slug = slugify(h.textContent || '') || ('sec-' + (idx + 1));
      h.id = h.id || slug;
      /* Prepend section number label to the h2 (small typographic accent). */
      if (!h.previousElementSibling || !h.previousElementSibling.classList || !h.previousElementSibling.classList.contains('rc-sec-n')){
        var label = el('div', 'rc-sec-n', pad2(idx + 1));
        h.parentNode.insertBefore(label, h);
      }
      /* Per-section "N min" sub-label removed 2026-05-24 — felt noisy under
         each H2. The "N min" total still appears in the trust line and in
         each TOC item (.rc-toc-m), which is sufficient. */
      /* First item gets the active green-bar accent — matches the article
         template's "current section" highlight. */
      var liCls = idx === 0 ? 'rc-toc-li rc-toc-li-on' : 'rc-toc-li';
      tocItems += '<li class="' + liCls + '"><a href="#' + h.id + '">' +
                    '<span class="rc-toc-n">' + pad2(idx + 1) + '</span>' +
                    '<span class="rc-toc-t">' + (h.textContent || '').trim() + '</span>' +
                    '<span class="rc-toc-m">' + perMin + ' min</span>' +
                  '</a></li>';
    });
    var toc = el('div', 'rc-toc');
    toc.innerHTML =
      '<div class="rc-toc-k"><span>On this page</span><span class="rc-toc-k-r">' + h2s.length + ' sections · ' + totalMin + ' min</span></div>' +
      '<ul>' + tocItems + '</ul>';
    /* Place TOC right before the first h2 so it sits above the body content. */
    h2s[0].parentNode.insertBefore(toc, h2s[0].previousElementSibling /* the sec-n we just inserted */ || h2s[0]);

    /* 4b. THE BOTTOM LINE callout. If the article doesn't already have a
       hand-authored .bl block, synthesize one from the article lede.
       Place it BEFORE the TOC. */
    if (!wrap.querySelector('.rc-bl, .bl, .ar-bottomline')){
      var ledeParas = [];

      /* (1) Strongest signal: an explicit lede class on the page template */
      var explicit = wrap.querySelector('.ca-lede, .sk-lede, .ar-lede, .sx-lede, .lede, [data-lede]');
      if (explicit){
        ledeParas.push(explicit);
        /* Optionally include the immediately-following paragraph as sub */
        var nxt = explicit.nextElementSibling;
        if (nxt && nxt.tagName === 'P' && !isMetaPara(nxt)){
          ledeParas.push(nxt);
        }
      }

      /* (2) Fall back: walk back from first h2 collecting paragraphs that
         AREN'T meta/byline paragraphs */
      if (!ledeParas.length){
        var firstH = h2s[0];
        var prev = firstH.previousSibling;
        while (prev && ledeParas.length < 2){
          if (prev.nodeType === 1){
            if (prev.classList && (prev.classList.contains('rc-sec-n') || prev.classList.contains('rc-trust') || prev.classList.contains('rc-cat'))){
              prev = prev.previousSibling;
              continue;
            }
            if (prev.tagName === 'P' && !isMetaPara(prev)){
              ledeParas.unshift(prev);
            } else if (prev.tagName === 'H1'){
              break;
            }
          }
          prev = prev.previousSibling;
        }
      }

      /* (3) Last resort: first non-meta <p> in the wrap */
      if (!ledeParas.length){
        var ps = wrap.querySelectorAll('p');
        for (var i = 0; i < ps.length; i++){
          if (!isMetaPara(ps[i])){
            ledeParas.push(ps[i]);
            break;
          }
        }
      }

      if (ledeParas.length){
        var headlineText = ledeParas[0].innerHTML;
        var subText = ledeParas[1] ? ledeParas[1].innerHTML : '';
        var bl = el('div', 'rc-bl');
        bl.innerHTML =
          '<div class="rc-bl-k">The Bottom Line</div>' +
          '<div class="rc-bl-headline">' + headlineText + '</div>' +
          (subText ? '<div class="rc-bl-sub">' + subText + '</div>' : '');
        toc.parentNode.insertBefore(bl, toc);
        ledeParas.forEach(function(p){ p.style.display = 'none'; });
      }
    }
  }

  /* 5. TAIL BLOCKS — rebuild "Supplements", "Related articles", "Sources"
     into mockup-v7 .rc-aend treatment so they stop being plain link lists. */
  try { normalizeTailBlocks(); } catch(err){ /* fail-safe: never block render */ }
})();
