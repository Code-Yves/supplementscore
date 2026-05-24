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

  /* Locate the article wrapper. Each section uses a different class name; we
     treat them as equivalent. */
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

  /* X-close handler — mirrors the existing .pg-close-fab session-stack logic
     so we preserve the back-navigation behavior the rest of the site uses. */
  function closeArticle(e){
    if (e && e.preventDefault) e.preventDefault();
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

  /* 1. TOP BAR — Prev/Next/Share/X. Prev/Next placeholders are hidden until
     a category manifest (window.RC_PREV_NEXT) populates them. */
  var topBar = el('div', 'rc-top');
  topBar.innerHTML =
    '<div class="rc-top-grp">' +
      '<a class="rc-top-link rc-prev" href="#" hidden aria-label="Previous">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="15 18 9 12 15 6"/></svg> Prev' +
      '</a>' +
      '<a class="rc-top-link rc-next" href="#" hidden aria-label="Next">' +
        'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</a>' +
    '</div>' +
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

  /* Manifest-driven Prev/Next (optional — page can set window.RC_PREV_NEXT) */
  if (window.RC_PREV_NEXT){
    var pn = window.RC_PREV_NEXT;
    if (pn.prev){
      var p = topBar.querySelector('.rc-prev');
      p.setAttribute('href', pn.prev.href);
      p.hidden = false;
    }
    if (pn.next){
      var n = topBar.querySelector('.rc-next');
      n.setAttribute('href', pn.next.href);
      n.hidden = false;
    }
  }

  /* Hide the legacy back buttons / close FABs that the old templates emit —
     our new top bar is now the canonical chrome. Also hide the existing
     kicker / meta lines because the new trust line supersedes them. */
  document.querySelectorAll(
    '.ar-back, .sx-back, .sk-back, .pg-close-fab, ' +
    '.ar-cat, .ar-meta, .ca-kicker, .sk-kicker, .sx-kicker, ' +
    '.ss-last-reviewed'
  ).forEach(function(n){
    n.style.display = 'none';
  });

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

  /* Classify a heading text into one of our known tail-block labels */
  function tailLabel(txt){
    var t = (txt || '').trim().toLowerCase();
    if (/^sources?$/.test(t) || /^references?$/.test(t)) return 'Sources';
    if (/^related articles?$/.test(t) || /^related reading$/.test(t) || /^read more$/.test(t)) return 'Related articles';
    if (/^related supplements?$/.test(t) || /^supplement details$/.test(t) ||
        /^supplements?\s+(mentioned|in this article)$/.test(t) ||
        /^supplements?\s+in this stack$/.test(t)) return 'Supplements';
    return null;
  }

  /* ---------- tail-block normalizer ---------- */

  /* Find each known tail heading inside the wrap, capture its sibling
     <ul>/<ol>, and rewrite as an .rc-aend. Replaces the existing block
     in-place so the markup stays in the right document position. */
  function normalizeTailBlocks(){
    var headings = wrap.querySelectorAll('h2, h3');
    var hits = [];
    for (var i = 0; i < headings.length; i++){
      var h = headings[i];
      var label = tailLabel(h.textContent);
      if (!label) continue;
      hits.push({el: h, label: label});
    }
    hits.forEach(function(hit){
      var h = hit.el;
      /* Grab the next sibling list (ul or ol) */
      var list = h.nextElementSibling;
      while (list && list.nodeType === 1 &&
             list.tagName !== 'UL' && list.tagName !== 'OL' &&
             list.tagName !== 'P' && list.tagName !== 'STRONG' &&
             !/related|supplement|source/i.test(list.className || '')){
        list = list.nextElementSibling;
      }
      if (!list) return;

      var aend;
      if (hit.label === 'Sources'){
        /* Sources — convert li into clean numbered list with hairline rows */
        if (list.tagName !== 'OL') return;
        var n = list.querySelectorAll('li').length;
        var ol = el('ol', 'rc-src-list');
        list.querySelectorAll('li').forEach(function(li){
          var nl = document.createElement('li');
          nl.innerHTML = li.innerHTML;
          ol.appendChild(nl);
        });
        aend = buildAend('Sources', n + ' peer-reviewed', ol);
      } else {
        /* Supplements or Related articles — convert <li><a> into arrow rows */
        if (list.tagName !== 'UL' && list.tagName !== 'OL') return;
        var rows = '';
        var items = list.querySelectorAll('li');
        var nItems = items.length;
        items.forEach(function(li){
          var a = li.querySelector('a');
          if (!a) return;
          var href = a.getAttribute('href') || '#';
          var title = (a.textContent || '').trim();
          /* If the link text contains an em-dash with extra meta after it
             (e.g. "Glycine — full scoring"), split it into title + eyebrow. */
          var eyebrow = '';
          var m = title.match(/^(.+?)\s*[—–-]\s*(.+)$/);
          if (m && m[2].length < 40){
            title = m[1];
            eyebrow = m[2];
          }
          rows += arrowRowHtml(href, title, eyebrow);
        });
        var countText = '';
        var labelDisplay = hit.label;
        if (hit.label === 'Supplements') {
          countText = nItems + ' supplement' + (nItems === 1 ? '' : 's');
          labelDisplay = 'Supplements in this article';
        } else if (hit.label === 'Related articles') {
          countText = nItems + ' related';
        }
        aend = buildAend(labelDisplay, countText, '<div class="rc-rel-list">' + rows + '</div>');
      }

      /* Replace heading + list with the new .rc-aend. Also remove anything
         between them that we may have walked past (rare). */
      var parent = h.parentNode;
      parent.insertBefore(aend, h);
      var node = h;
      while (node && node !== list){
        var nx = node.nextSibling;
        parent.removeChild(node);
        node = nx;
      }
      if (list) parent.removeChild(list);
    });

    /* Also catch standalone "Read more:" labelled blocks that don't have a
       proper heading — common on older /condition/ pages. */
    var readmore = wrap.querySelectorAll('.ca-related');
    readmore.forEach(function(rm){
      if (rm.querySelector('.rc-aend')) return;  /* already done */
      var st = rm.querySelector('strong');
      if (!st || !/read more/i.test(st.textContent)) return;
      var ul = rm.querySelector('ul');
      if (!ul) return;
      var rows = '';
      var items = ul.querySelectorAll('li');
      items.forEach(function(li){
        var a = li.querySelector('a');
        if (!a) return;
        var title = (a.textContent || '').trim();
        var eyebrow = '';
        var m = title.match(/^(.+?)\s*[—–-]\s*(.+)$/);
        if (m && m[2].length < 40){
          title = m[1];
          eyebrow = m[2];
        }
        rows += arrowRowHtml(a.getAttribute('href') || '#', title, eyebrow);
      });
      var aend = buildAend('Related articles', items.length + ' related', '<div class="rc-rel-list">' + rows + '</div>');
      rm.parentNode.replaceChild(aend, rm);
    });
  }

  if (h2s.length >= 2){
    /* Build TOC items */
    var totalMin = readMin;
    var perMin = Math.max(1, Math.round(totalMin / h2s.length));
    var tocItems = '';
    h2s.forEach(function(h, idx){
      var slug = slugify(h.textContent || '') || ('sec-' + (idx + 1));
      h.id = h.id || slug;
      /* Prepend section number label to the h2 (small typographic accent) */
      if (!h.previousElementSibling || !h.previousElementSibling.classList || !h.previousElementSibling.classList.contains('rc-sec-n')){
        var label = el('div', 'rc-sec-n', pad2(idx + 1));
        h.parentNode.insertBefore(label, h);
      }
      tocItems += '<li><a href="#' + h.id + '">' +
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
  }

  /* 5. TAIL BLOCKS — rebuild "Supplements", "Related articles", "Sources"
     into mockup-v7 .rc-aend treatment so they stop being plain link lists. */
  try { normalizeTailBlocks(); } catch(err){ /* fail-safe: never block render */ }
})();
