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
  if (window.__rcInit) {
    document.documentElement.classList.add('rc-ready');
    return;
  }
  window.__rcInit = true;
  try {

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
      var dtv = time.getAttribute('datetime') || time.textContent;
      /* Parse bare YYYY-MM-DD as a local date — new Date('2026-05-23') is UTC
         midnight and renders as the previous day west of Greenwich. */
      var ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dtv || '').trim());
      var d = ymd ? new Date(+ymd[1], +ymd[2] - 1, +ymd[3]) : new Date(dtv);
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

  /* Where X goes if there is no same-site page to return to, and if JS
     never runs. Articles return to the Research section; other templates
     return to their own index. */
  function closeFallback(){
    var path = location.pathname || '';
    if (path.indexOf('/compare/') === 0) return '/compare/';
    if (path.indexOf('/condition/') === 0) return '/condition/';
    if (path.indexOf('/stack/') === 0) return '/stack/';
    if (path.indexOf('/for/') === 0) return '/';
    if (path.indexOf('/a/') === 0) return '/#research';
    return '/';
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

  function articleSection(){
    var nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < nodes.length; i++){
      try {
        var data = JSON.parse(nodes[i].textContent);
        if (data && data.articleSection) return String(data.articleSection);
        var graph = data && data['@graph'];
        if (graph){
          for (var g = 0; g < graph.length; g++){
            if (graph[g] && graph[g].articleSection) return String(graph[g].articleSection);
          }
        }
      } catch (e) {}
    }
    return '';
  }

  function titleFromHref(href){
    var file = String(href || '').split('/').pop().replace(/\.html.*$/, '').replace(/[-_]+/g, ' ');
    return file.replace(/\b[a-z]/g, function(c){ return c.toUpperCase(); });
  }

  function decodeEntities(raw){
    var s = String(raw || '');
    var prev;
    do {
      prev = s;
      s = s.replace(/&amp;/g, '&');
    } while (s !== prev && s.indexOf('&amp;') !== -1);
    return s
      .replace(/&#39;|&#x27;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&#(\d+);/g, function(_, n){ var c = parseInt(n, 10); return c > 0 ? String.fromCodePoint(c) : _; })
      .replace(/&#x([0-9a-f]+);/gi, function(_, n){ var c = parseInt(n, 16); return c > 0 ? String.fromCodePoint(c) : _; })
      .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013').replace(/&hellip;/g, '\u2026')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  function plainTitle(raw){
    return decodeEntities(raw)
      .replace(/\s*(?:\||\u2014|\u2013|-)\s*SupplementScore\s*$/i, '')
      .replace(/-/g, '\u2011')
      .trim();
  }
  function decodeText(root){
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(n){
      if (n.nodeValue && n.nodeValue.indexOf('&') !== -1) n.nodeValue = decodeEntities(n.nodeValue);
    });
  }

  function injectArticleLayout(){
    if (document.getElementById('ar-layout')) return;
    var css = ''
      + 'html.rc-chrome-active main.ar-wrap,html.rc-chrome-active main.sx-wrap,html.rc-chrome-active main.ca-wrap,html.rc-chrome-active main.sk-wrap{max-width:1024px;margin:0 auto;padding:16px 24px 64px;box-sizing:border-box;background:transparent}'
      + 'html.rc-chrome-active main.ar-wrap .ar-column,html.rc-chrome-active main.sx-wrap .ar-column,html.rc-chrome-active main.ca-wrap .ar-column,html.rc-chrome-active main.sk-wrap .ar-column{max-width:700px;min-width:0;width:100%;font-size:18px;line-height:1.6;color:#0c0a09}'
      + 'html.rc-chrome-active main.ar-wrap .ar-column p:not(.ar-kicker):not(.ar-byline),html.rc-chrome-active main.sx-wrap .ar-column p:not(.ar-kicker):not(.ar-byline),html.rc-chrome-active main.ca-wrap .ar-column p:not(.ar-kicker):not(.ar-byline),html.rc-chrome-active main.sk-wrap .ar-column p:not(.ar-kicker):not(.ar-byline){font-size:18px;line-height:1.6;color:#0c0a09}'
      + 'html.rc-chrome-active .ar-titleblock h1{text-wrap:balance;max-width:22em}'
      + 'html.rc-chrome-active .ar-titleblock .ar-kicker{margin:0 0 8px;color:#155A50;font-size:13px;font-weight:700;letter-spacing:.04em;line-height:1.4}'
      + 'html.rc-chrome-active .ar-titleblock .ar-dek{margin:0 0 8px;font-size:18px;line-height:1.6;color:#0c0a09;text-wrap:balance}'
      + 'html.rc-chrome-active .ar-titleblock .ar-byline{margin:0 0 16px;font-size:14px;line-height:1.5;color:#57534e}'
      + 'html.rc-chrome-active .ar-byline a{color:#155A50;text-decoration:underline;text-underline-offset:2px}'
      + 'html.rc-chrome-active .ar-toc{width:200px;max-width:200px;box-sizing:border-box}'
      + 'html.rc-chrome-active .ar-toc summary{display:flex;align-items:center;min-height:48px;font-weight:700;color:#0c0a09;cursor:pointer}'
      + 'html.rc-chrome-active main.ar-wrap .ar-bottomline-label,html.rc-chrome-active main.ar-wrap .ss-mentioned-k,html.rc-chrome-active main.ar-wrap .ss-mentioned>h2,html.rc-chrome-active main.ar-wrap .ar-toc summary,html.rc-chrome-active main.ar-wrap .rc-aend-k,html.rc-chrome-active main.ar-wrap .ar-editorial>strong,html.rc-chrome-active main.ar-wrap footer.ar-foot>strong{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#57534e}'
      + 'html.rc-chrome-active main.ar-wrap .ar-editorial>strong,html.rc-chrome-active main.ar-wrap footer.ar-foot>strong{display:block;margin:0 0 8px}'
      + 'html.rc-chrome-active main.ar-wrap .ar-column .ar-end nav.ss-mentioned ul,html.rc-chrome-active main.ar-wrap .ar-column .ar-end nav.ss-mentioned li{margin-left:0;padding-left:0;list-style:none}'
      + 'html.rc-chrome-active .ar-toc a{display:flex;align-items:center;width:100%;box-sizing:border-box;min-height:44px;padding:4px 0;color:#0c0a09;text-decoration:none}'
      + 'html.rc-chrome-active .ar-toc a:focus-visible,html.rc-chrome-active .ar-toc summary:focus-visible{outline:2px solid #155A50;outline-offset:2px}'
      + 'html.rc-chrome-active .ar-end>*+*{margin-top:8px}'
      + 'html.rc-chrome-active .ar-prevnext{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}'
      + 'html.rc-chrome-active .ar-prevnext a{min-height:48px;display:inline-flex;align-items:center;padding:8px 12px;color:#155A50}'
      + 'html.rc-chrome-active .ssux-toc,html.rc-chrome-active .mag-side,html.rc-chrome-active #hero.mag{display:none}'
      + '@media(min-width:901px){'
      + 'html.rc-chrome-active main.ar-wrap,html.rc-chrome-active main.sx-wrap,html.rc-chrome-active main.ca-wrap,html.rc-chrome-active main.sk-wrap{display:grid;grid-template-columns:200px minmax(0,700px);column-gap:32px;align-items:start;justify-content:start}'
      + 'html.rc-chrome-active main.ar-wrap.ar-no-toc>.ar-column{grid-column:2}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-toc,html.rc-chrome-active main.sx-wrap>.ar-toc,html.rc-chrome-active main.ca-wrap>.ar-toc,html.rc-chrome-active main.sk-wrap>.ar-toc{position:sticky;top:24px;align-self:start;width:200px}'
      + '}'
      + '@media(max-width:900px){'
      + 'html.rc-chrome-active main.ar-wrap,html.rc-chrome-active main.sx-wrap,html.rc-chrome-active main.ca-wrap,html.rc-chrome-active main.sk-wrap{display:flex;flex-direction:column;padding:16px 16px 64px;max-width:none}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-column,html.rc-chrome-active main.sx-wrap>.ar-column,html.rc-chrome-active main.ca-wrap>.ar-column,html.rc-chrome-active main.sk-wrap>.ar-column{display:contents}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-column>*,html.rc-chrome-active main.sx-wrap>.ar-column>*,html.rc-chrome-active main.ca-wrap>.ar-column>*,html.rc-chrome-active main.sk-wrap>.ar-column>*{order:4}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-column>.rc-top,html.rc-chrome-active main.sx-wrap>.ar-column>.rc-top,html.rc-chrome-active main.ca-wrap>.ar-column>.rc-top,html.rc-chrome-active main.sk-wrap>.ar-column>.rc-top{order:0}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-column>.ar-titleblock,html.rc-chrome-active main.sx-wrap>.ar-column>.ar-titleblock,html.rc-chrome-active main.ca-wrap>.ar-column>.ar-titleblock,html.rc-chrome-active main.sk-wrap>.ar-column>.ar-titleblock{order:1}'
      + 'html.rc-chrome-active main.ar-wrap>.ar-toc,html.rc-chrome-active main.sx-wrap>.ar-toc,html.rc-chrome-active main.ca-wrap>.ar-toc,html.rc-chrome-active main.sk-wrap>.ar-toc{order:2;width:100%;max-width:none}'
      + 'html.rc-chrome-active .ar-toc a{min-height:48px}'
      + '}';
    var style = document.createElement('style');
    style.id = 'ar-layout';
    style.textContent = css;
    document.head.appendChild(style);
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

  /* Prev/Next live at the end of the article, after the disclaimer. */
  var leftGrp = '<div class="rc-top-grp" aria-hidden="true"></div>';

  var topBar = el('div', 'rc-top');
  topBar.innerHTML = leftGrp +
    '<div class="rc-top-grp">' +
      '<button type="button" class="rc-top-link rc-share" aria-label="Share">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share' +
      '</button>' +
      '<span class="rc-top-sep" aria-hidden="true"></span>' +
      '<a class="rc-top-link rc-close ss-x" href="' + closeFallback() + '" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></a>' +
    '</div>';
  wrap.insertBefore(topBar, wrap.firstChild);
  topBar.querySelector('.rc-share').addEventListener('click', share);
  /* Close is a real link. _site-ux.js goes back when the previous page is
     on this site, and otherwise lets this href load. No second listener:
     preventDefault + history.back() from two handlers cancelled the
     navigation on iPhone and the X appeared dead. */

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

  decodeText(wrap);
  if (document.title && document.title.indexOf('&') !== -1) document.title = decodeEntities(document.title);
  injectArticleLayout();

  /* Plain title block: teal category, balanced headline, dek, byline.
     No magazine card and no side column of other articles. */
  var category = detectCategory();
  var reviewed = detectReviewedDate();
  var updated = reviewed;
  var stamp = (wrap.innerHTML || '').match(/last-reviewed:\s*(\d{4}-\d{2}-\d{2})/);
  if (stamp){
    var parts = stamp[1].split('-');
    reviewed = formatDate(new Date(+parts[0], +parts[1] - 1, +parts[2]));
  }
  var updTime = wrap.querySelector('.ss-last-reviewed time, .ar-meta time, .sx-meta time, .ca-meta time, .sk-meta time');
  if (updTime){
    var dtv = (updTime.getAttribute('datetime') || updTime.textContent || '').trim();
    var ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(dtv);
    var d = ymd ? new Date(+ymd[1], +ymd[2] - 1, +ymd[3]) : new Date(dtv);
    if (!isNaN(d.getTime())) updated = formatDate(d);
  }

  var sectionName = articleSection() || category || '';
  var block = el('header', 'ar-titleblock');
  var kicker = el('p', 'ar-kicker', sectionName);
  block.appendChild(kicker);
  if (h1.textContent.indexOf('-') !== -1) h1.textContent = h1.textContent.replace(/-/g, '\u2011');
  block.appendChild(h1);

  /* Dek is one sentence from the page description. The opening paragraph
     stays in the column. Collapse spaces that were left inside parentheses. */
  var descMeta = document.querySelector('meta[name="description"]') || document.querySelector('meta[property="og:description"]');
  var descText = descMeta ? (descMeta.getAttribute('content') || '') : '';
  descText = descText.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
  var descSentence = descText.match(/^[\s\S]*?[.!?](?=\s|$)/);
  if (descSentence) descText = descSentence[0].trim();
  if (descText){
    var dek = document.createElement('p');
    dek.className = 'ar-dek';
    dek.textContent = descText;
    block.appendChild(dek);
  }

  var authorLink = wrap.querySelector('.ar-meta a[rel="author"], .sx-meta a[rel="author"], .ca-meta a[rel="author"], .sk-meta a[rel="author"]');
  var byHtml = '';
  if (authorLink){
    byHtml += 'By <a href="' + authorLink.getAttribute('href') + '" rel="author">' + authorLink.textContent + '</a>';
  }
  if (updated) byHtml += (byHtml ? ' \u00b7 ' : '') + 'Updated ' + updated;
  if (reviewed) byHtml += (byHtml ? ' \u00b7 ' : '') + 'Reviewed ' + reviewed;
  if (byHtml){
    var byline = el('p', 'ar-byline', byHtml);
    block.appendChild(byline);
  }
  if (topBar.nextSibling) wrap.insertBefore(block, topBar.nextSibling);
  else wrap.appendChild(block);

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
      if (/^common questions$/.test(txt)) continue;
      if (node.closest && node.closest('.ar-faq')) continue;
      out.push(node);
    }
    return out;
  }
  var h2s = collectBodyHeadings('h2');
  /* Article contents use real h2 sections only. Other templates still fall
     back to h3s when a page never uses h2. */
  if (!wrap.classList.contains('ar-wrap') && h2s.length === 0){
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
    var href = (window.SS && window.SS.urlFor)
      ? window.SS.urlFor('supplement', slug)
      : ('/supplement/' + slug + '.html');
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
    var m = href.match(/\/supplement\/([a-z0-9-]+)\.html(?:$|[?#])/i);
    if (m) return m[1].toLowerCase();
    /* supplement.html?slug=<slug> — older article links, still valid. */
    m = href.match(/supplement\.html\?(?:[^#]*[?&])?slug=([^&#]+)/);
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
      /* Split only on a SPACED em/en-dash (or spaced hyphen) used as a real
         separator ("Glycine — full scoring"). Requiring whitespace on both
         sides prevents splitting hyphenated words inside a title, e.g.
         "Safer Than Locker-Room Rumors" or "The 10 Most-Studied …" (fixed
         2026-06-06 — those were rendering a bogus uppercase eyebrow). */
      var m = title.match(/^(.+?)\s+[—–-]\s+(.+)$/);
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

  function aendByLabel(label){
    var found = null;
    wrap.querySelectorAll('.rc-aend').forEach(function(n){
      var k = n.querySelector('.rc-aend-k span');
      var name = k ? (k.textContent || '').trim().toLowerCase() : '';
      if (name === label) found = n;
    });
    return found;
  }

  /* Supplements mentioned is rebuilt from supplement links in the article
     body. Related blocks and the generated #ss-mentioned nav are not sources. */
  function mentionedFromBody(){
    var seen = {};
    var items = [];
    wrap.querySelectorAll('a[href]').forEach(function(a){
      if (a.closest('.rc-aend, .ar-related, .ca-related, .sx-related, .sk-related, .ss-mentioned')) return;
      var href = a.getAttribute('href') || '';
      var slug = slugFromHref(href);
      if (!slug || seen[slug]) return;
      var name = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!name) return;
      seen[slug] = true;
      items.push({ href: href, name: name });
    });
    var nav = document.getElementById('ss-mentioned');
    if (!items.length){
      if (nav && nav.parentNode) nav.parentNode.removeChild(nav);
      return null;
    }
    if (!nav){
      nav = document.createElement('nav');
      nav.id = 'ss-mentioned';
      nav.setAttribute('aria-label', 'Supplements mentioned');
      wrap.appendChild(nav);
    }
    nav.className = 'ss-mentioned';
    nav.innerHTML = '';
    var label = document.createElement('div');
    label.className = 'ss-mentioned-k rc-aend-k';
    label.textContent = 'Supplements mentioned';
    nav.appendChild(label);
    var ul = document.createElement('ul');
    items.forEach(function(item){
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.name;
      li.appendChild(link);
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    applyDisplayNames(nav);
    return nav;
  }

  /* Body links are often the lowercase slug ("omega-3"). The mentioned
     list uses the supplement's display name once the catalog loads.
     A label that is already proper case stays as written. */
  function applyDisplayNames(nav){
    if (!nav) return;
    loadSupplementMeta().then(function(meta){
      nav.querySelectorAll('a[href]').forEach(function(a){
        var slug = slugFromHref(a.getAttribute('href') || '');
        var label = (a.textContent || '').replace(/\s+/g, ' ').trim();
        var display = slug && meta[slug] && meta[slug].name;
        if (display && label && label === label.toLowerCase()) a.textContent = display;
      });
      nav.setAttribute('data-names', 'display');
    });
  }

  function filterOwnSupplements(nav){
    if (!wrap.classList.contains('ar-wrap')) return nav;
    return mentionedFromBody();
  }

  function buildReadingColumn(){
    var article = wrap.classList.contains('ar-wrap');
    var items = [];
    if (!article){
      var bl = wrap.querySelector('.ar-bottomline, .rc-bl, .bl');
      if (bl){
        if (!bl.id) bl.id = 'bottom-line';
        items.push({ id: bl.id, label: 'Bottom line' });
      }
    }
    h2s.forEach(function(h, idx){
      var slug = h.id || slugify(h.textContent || '') || ('sec-' + (idx + 1));
      h.id = slug;
      var label = (h.textContent || '').trim().replace(/\s+/g, ' ');
      if (label) items.push({ id: slug, label: label });
    });
    var sources = aendByLabel('sources');
    if (sources){
      if (!sources.id) sources.id = 'sources';
      items.push({ id: sources.id, label: 'Sources' });
    }

    var mentioned = filterOwnSupplements(document.getElementById('ss-mentioned'));
    var supplements = aendByLabel('supplements in this article');
    if (mentioned && supplements && supplements.parentNode) supplements.parentNode.removeChild(supplements);
    if (!mentioned && supplements){
      var lab = supplements.querySelector('.rc-aend-k span');
      if (lab) lab.textContent = 'Supplements mentioned';
      if (!supplements.id) supplements.id = 'ss-mentioned';
      mentioned = supplements;
    }
    var related = aendByLabel('related articles');
    if (wrap.classList.contains('ar-wrap')){
      wrap.querySelectorAll('.ar-editorial > strong, footer.ar-foot > strong').forEach(function(s){
        s.removeAttribute('style');
        s.textContent = (s.textContent || '').replace(/[.\s]+$/, '');
      });
    }
    var note = wrap.querySelector('.ar-editorial, .ca-editorial, .sk-editorial, .sx-editorial');
    var disclaimer = wrap.querySelector('footer.ar-foot, footer.sx-foot, footer.ca-foot, footer.sk-foot');
    var end = el('div', 'ar-end');
    [sources, mentioned, related, note, disclaimer].forEach(function(node){
      if (node && node.parentNode) end.appendChild(node);
    });
    if (prevHref || nextHref){
      var jump = document.createElement('nav');
      jump.className = 'ar-prevnext';
      jump.setAttribute('aria-label', 'Previous and next articles');
      if (prevHref){
        var prevA = document.createElement('a');
        prevA.href = prevHref;
        prevA.textContent = 'Previous';
        jump.appendChild(prevA);
      }
      if (nextHref){
        var nextA = document.createElement('a');
        nextA.href = nextHref;
        nextA.textContent = 'Next';
        jump.appendChild(nextA);
      }
      end.appendChild(jump);
    }

    if (article && mentioned){
      if (!mentioned.id) mentioned.id = 'ss-mentioned';
      items.push({ id: mentioned.id, label: 'Supplements mentioned' });
    }
    /* A contents list of one or two entries is noise. Hide it. */
    if (article && items.length < 3){
      items = [];
      wrap.classList.add('ar-no-toc');
    }

    var toc = null;
    if (items.length){
      toc = document.createElement('nav');
      toc.className = 'ar-toc';
      toc.setAttribute('aria-label', 'On this page');
      var details = document.createElement('details');
      details.className = 'ar-toc-details';
      var summary = document.createElement('summary');
      summary.textContent = 'On this page';
      details.appendChild(summary);
      var ol = document.createElement('ol');
      items.forEach(function(item){
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + item.id;
        a.textContent = item.label;
        li.appendChild(a);
        ol.appendChild(li);
      });
      details.appendChild(ol);
      toc.appendChild(details);
      var wide = window.matchMedia('(min-width: 901px)');
      function syncToc(){ details.open = !!wide.matches; }
      syncToc();
      if (wide.addEventListener) wide.addEventListener('change', syncToc);
    }

    var column = el('div', 'ar-column');
    while (wrap.firstChild) column.appendChild(wrap.firstChild);
    column.appendChild(end);
    if (toc) wrap.appendChild(toc);
    wrap.appendChild(column);
  }

  /* 5. TAIL BLOCKS — rebuild "Supplements", "Related articles", "Sources"
     into mockup-v7 .rc-aend treatment so they stop being plain link lists. */
  try { normalizeTailBlocks(); } catch(err){ /* fail-safe: never block render */ }
  try { buildReadingColumn(); } catch(err){ /* keep the article readable */ }
  } catch (err) { /* reveal the article even if chrome setup throws */ }
  finally {
    document.documentElement.classList.add('rc-chrome-active');
    document.documentElement.classList.add('rc-ready');
  }
})();
