/* ============================================================
   supplement-modal.js
   Drop-in modal that opens supplement detail pages as an
   overlay on top of the current list/search/index page.

   Usage: <script src="supplement-modal.js" defer></script>
     - Auto-injects modal markup + styles
     - Intercepts clicks on a[href*="supplement.html?slug="]
     - X button, Esc key, and backdrop click all close the modal
     - URL is updated to ?supplement=<slug> so back button + deep
       links work; supplement.html?slug=<slug> still works direct
   ============================================================ */
(function(){
  if (window.__SSModalInit) return;
  window.__SSModalInit = true;

  // Don't activate on the standalone supplement page itself —
  // it's the iframe target, not a host page.
  if (/\/supplement\.html(?:$|\?|#)/.test(location.pathname + location.search)) return;

  // ── Styles ──────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent =
    '.ssm{position:fixed;inset:0;z-index:1000;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility 0s linear .18s}'
  + '.ssm.open{opacity:1;visibility:visible;transition:opacity .18s ease}'
  /* Raise above the article modal (.art-modal has z-index:1100) when this
     supplement is opened from inside an article — otherwise it'd render
     behind the article it was launched from. */
  + '.ssm.over-art{z-index:1200}'
  /* Raise above the research-modal iframe overlay (.rc-modal sits at
     z-index 9000) when this supplement is opened from inside a research
     article modal. Otherwise the supplement card renders behind the
     article overlay and is invisible. */
  + '.ssm.over-rc{z-index:9500}'
  + '.ssm-bd{position:absolute;inset:0;background:rgba(15,12,10,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);cursor:pointer}'
  + '.ssm-card{position:relative;max-width:980px;width:calc(100% - 32px);margin:32px auto;height:calc(100vh - 64px);background:var(--color-background-secondary,#ebe5d9);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;transform:translateY(10px) scale(.99);transition:transform .2s ease;border:1px solid var(--color-border-tertiary,#dcdad7)}'
  + '.ssm.open .ssm-card{transform:translateY(0) scale(1)}'
  /* Top chrome (2026-05-20) — V2 chrome bar matching .art-modal.v2-chrome
     in styles.css: a static-positioned, padded bar with a hairline
     border-bottom; transparent inline Share + X buttons separated by a
     thin divider. Replaces the older absolute-positioned floating
     buttons that overlapped iframe content. */
  + '.ssm-chrome{flex-shrink:0;display:flex;align-items:center;justify-content:flex-end;gap:0;padding:14px 22px;background:var(--color-background-secondary,#ebe5d9);border-bottom:1px solid var(--color-border-tertiary,#E8E5DF);position:relative;z-index:5}'
  + '.ssm-actions{display:flex;align-items:center;gap:0;position:relative}'
  /* Hairline divider sits between Share and X via order on the X button */
  + '.ssm-actions::before{content:"";display:inline-block;width:1px;height:14px;background:var(--color-border-tertiary,#E8E5DF);margin:0 6px;align-self:center;order:1}'
  + '.ssm-share{order:0;height:auto;padding:6px 10px;border-radius:6px;border:none;background:transparent;color:#6B7280;font-size:12px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1;transition:color .12s;font-family:inherit}'
  + '.ssm-share:hover{background:transparent;color:#0c0a09;transform:none}'
  + '.ssm-share:focus-visible{outline:2px solid var(--color-brand,#1F7A6B);outline-offset:2px}'
  + '.ssm-share.copied{background:transparent;color:var(--color-brand,#1F7A6B)}'
  + '.ssm-share svg{width:13px;height:13px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
  + '.ssm-x{order:2;width:auto;height:auto;padding:6px 8px;border-radius:6px;border:none;background:transparent;color:#6B7280;font-size:12px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;line-height:1;transition:color .12s;font-family:inherit}'
  + '.ssm-x:hover{background:transparent;color:#0c0a09;transform:none}'
  + '.ssm-x:focus-visible{outline:2px solid var(--color-brand,#1F7A6B);outline-offset:2px}'
  + '.ssm-x svg{width:13px;height:13px;display:block}'
  + '@media(max-width:500px){.ssm-share{padding:14px 12px}.ssm-x{padding:14px 12px}.ssm-share .ssm-share-lbl{display:none}.ssm-chrome{padding:2px 10px}}'
  + '.ssm-toast{position:absolute;top:60px;right:18px;z-index:6;background:#0c0a09;color:#fff;font-size:12.5px;font-weight:500;padding:8px 14px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translateY(-6px);transition:opacity .18s,transform .18s;pointer-events:none;display:flex;align-items:center;gap:6px}'
  + '.ssm-toast.show{opacity:1;transform:translateY(0)}'
  + '.ssm-toast svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}'
  + '.ssm-frame{flex:1;border:none;width:100%;background:var(--color-background-secondary,#ebe5d9)}'
  + '.ssm-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary,#a8a29e);font-size:13px;letter-spacing:.04em;pointer-events:none}'
  + '.ssm.loaded .ssm-loading{display:none}'
  /* Full-bleed at ≤600px to match .art-modal's mobile breakpoint
     (styles.css). Previously 680px, which left a 32px floating
     margin on the 601-680px range while .art-modal already went
     full-bleed there — visually inconsistent. */
  + '@media(max-width:600px){.ssm-card{margin:0;width:100%;height:100vh;border-radius:0;border:none}}'
  /* Hide chrome when the iframe is showing a non-supplement page
     (e.g. a /compare/ guide) — that page owns its own chrome. */
  + '.ssm.hide-chrome .ssm-chrome{display:none !important}'
  + 'body.ssm-locked{overflow:hidden}';
  document.head.appendChild(styleEl);

  // ── Markup ─────────────────────────────────────────────
  var modal = document.createElement('div');
  modal.className = 'ssm';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Supplement detail');
  modal.innerHTML =
      '<div class="ssm-bd" data-ssm-close></div>'
    + '<div class="ssm-card">'
    +   '<div class="ssm-chrome">'
    +     '<div class="ssm-actions">'
    +       '<button type="button" class="ssm-share" data-ssm-share aria-label="Share supplement" title="Share — copies link">'
    +         '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'
    +         '<span class="ssm-share-lbl">Share</span>'
    +       '</button>'
    +       '<button type="button" class="ssm-x" data-ssm-close aria-label="Close detail">'
    +         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>'
    +       '</button>'
    +     '</div>'
    +   '</div>'
    +   '<div class="ssm-toast" role="status" aria-live="polite"></div>'
    +   '<div class="ssm-loading">Loading…</div>'
    +   '<iframe class="ssm-frame" title="Supplement detail" loading="lazy"></iframe>'
    + '</div>';

  function attachModal(){
    if (modal.parentNode) return;
    document.body.appendChild(modal);
  }

  if (document.body) attachModal();
  else document.addEventListener('DOMContentLoaded', attachModal);

  var frame = modal.querySelector('.ssm-frame');
  var openSlug = null;

  frame.addEventListener('load', function(){
    if (openSlug) modal.classList.add('loaded');
    // If the iframe has navigated to a page that isn't the supplement detail
    // (e.g. a /compare/ guide opened from a Head-to-head comparison link),
    // hide our Share/X chrome so it doesn't overlap that page's own close
    // FAB. The chrome comes back the moment the iframe returns to a
    // supplement page (which happens when the user clicks the inner close
    // FAB — it calls history.back inside the iframe).
    try {
      var pn = frame.contentWindow && frame.contentWindow.location && frame.contentWindow.location.pathname || '';
      var isSupplement = /\/supplement\.html$/i.test(pn);
      modal.classList.toggle('hide-chrome', !isSupplement);
    } catch(_){
      // Cross-origin or detached frame — keep chrome visible by default.
      modal.classList.remove('hide-chrome');
    }
  });

  function open(slug, fromHistory) {
    if (!slug) return;
    if (slug === openSlug){
      try { frame.contentWindow && frame.contentWindow.scrollTo(0,0); } catch(e){}
      return;
    }
    /* Snapshot whatever modal is currently open BEFORE we switch to this
       supplement, so closing this supplement returns the user there.
       Excludes the case where we're restoring from the stack ourselves
       (fromHistory) and the case where the current modal IS this same
       supplement (handled by the early-return above). */
    var openingOverArticle = false;
    if (!fromHistory && window.SSModalStack) {
      try {
        var snap = window.SSModalStack.snapshot();
        if (snap && !(snap.type === 'supplement' && snap.slug === slug)) {
          window.SSModalStack.push(snap);
        }
        /* If an article modal is currently open, we need to render above it.
           Article modal sits at z-index 1100; default .ssm is 1000. */
        if (snap && snap.type === 'article') openingOverArticle = true;
      } catch(_){}
    }
    /* Belt-and-braces — also check the DOM directly in case SSModalStack
       isn't loaded yet (initial page load races). */
    if (!openingOverArticle) {
      var artEl = document.getElementById('art-modal');
      if (artEl && artEl.classList.contains('open')) openingOverArticle = true;
    }
    /* Research-modal iframe overlay (#rc-modal) sits at z-index 9000. If
       it's open we need to stack the supplement card ABOVE it via the
       new .ssm.over-rc rule (z-index 9500). Mutually exclusive with the
       legacy .ssm.over-art (z-index 1200) — pick the higher one. */
    var openingOverRc = false;
    var rcEl = document.getElementById('rc-modal');
    if (rcEl && !rcEl.hasAttribute('hidden')) openingOverRc = true;

    attachModal();
    openSlug = slug;
    modal.classList.toggle('over-art', openingOverArticle && !openingOverRc);
    modal.classList.toggle('over-rc', openingOverRc);
    modal.classList.remove('loaded');
    var _x = modal.querySelector('.ssm-x'); if (_x) _x.style.visibility = '';
    /* Absolute origin-rooted path. Without the leading slash, the iframe
       resolves the src relative to its parent's location, which means a
       supplement link clicked from /stack/sleep-onset.html tries to load
       /stack/supplement.html → 404. Bug fixed 2026-05-27. */
    frame.src = '/supplement.html?slug=' + encodeURIComponent(slug) + '&modal=1';
    requestAnimationFrame(function(){ modal.classList.add('open'); });
    document.body.classList.add('ssm-locked');
    if (!fromHistory) {
      try {
        var newUrl = location.pathname + '?supplement=' + encodeURIComponent(slug) + location.hash;
        history.pushState({ ssm: slug }, '', newUrl);
      } catch(e){}
    }
  }

  function close(fromHistory) {
    if (!openSlug) return;
    openSlug = null;
    modal.classList.remove('open');
    modal.classList.remove('loaded');
    modal.classList.remove('over-art');
    modal.classList.remove('over-rc');
    document.body.classList.remove('ssm-locked');
    setTimeout(function(){ if (!openSlug) frame.src = 'about:blank'; }, 220);
    if (!fromHistory && history.state && history.state.ssm) {
      try { history.back(); } catch(e){}
    }
    /* Site-wide modal back-stack (2026-05-13).
       After this supplement modal closes, if SSModalStack has a previous
       modal recorded (e.g. an article modal that opened this supplement
       via a supplement link inside it), re-open that one. The article
       case isn't wired yet (article→supplement→close hasn't been a
       reported flow), but the symmetry is here for free. */
    try {
      if (window.SSModalStack) {
        var prevEntry = window.SSModalStack.pop();
        if (prevEntry) window.SSModalStack.reopen(prevEntry);
      }
    } catch(_){}
  }

  // Click on backdrop or X closes; click on Share copies the deep link.
  modal.addEventListener('click', function(e){
    var c = e.target.closest('[data-ssm-close]');
    if (c){ e.preventDefault(); close(); return; }
    var s = e.target.closest('[data-ssm-share]');
    if (s){ e.preventDefault(); shareCurrent(); return; }
  });

  function _ssmToast(msg){
    var t = modal.querySelector('.ssm-toast');
    if (!t) return;
    t.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>' + String(msg||'').replace(/[<>&]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});
    t.classList.add('show');
    clearTimeout(_ssmToast._t);
    _ssmToast._t = setTimeout(function(){ t.classList.remove('show'); }, 1800);
  }
  function _ssmFlashCopied(){
    var b = modal.querySelector('.ssm-share');
    if (!b) return;
    b.classList.add('copied');
    setTimeout(function(){ b.classList.remove('copied'); }, 1400);
  }
  function _ssmLegacyCopy(txt){
    try {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    } catch(e){}
  }
  function shareCurrent(){
    if (!openSlug) return;
    /* Share the standalone supplement page so the recipient gets the
       full detail view regardless of where they open the link from. */
    var url = location.origin + '/supplement.html?slug=' + encodeURIComponent(openSlug);
    /* Pull the supplement title from the iframe so the share sheet has
       a sensible label. Fall back to a generic if cross-origin. */
    var title = 'SupplementScore';
    try {
      var doc = frame.contentDocument;
      if (doc){
        var h1 = doc.querySelector('h1');
        if (h1 && h1.textContent.trim()) title = h1.textContent.trim() + ' — SupplementScore';
        else if (doc.title) title = doc.title;
      }
    } catch(_){}
    var data = { title: title, text: title, url: url };
    if (navigator.share && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)){
      navigator.share(data).catch(function(err){
        if (err && err.name !== 'AbortError'){
          /* Native sheet failed for some reason — fall back to clipboard. */
          _copyAndToast(url);
        }
      });
    } else {
      _copyAndToast(url);
    }
  }
  function _copyAndToast(url){
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){
        _ssmToast('Link copied'); _ssmFlashCopied();
      }).catch(function(){
        _ssmLegacyCopy(url); _ssmToast('Link copied'); _ssmFlashCopied();
      });
    } else {
      _ssmLegacyCopy(url); _ssmToast('Link copied'); _ssmFlashCopied();
    }
  }

  // Hide our own close X while the iframe child has its article modal open,
  // so the user doesn't see two overlapping X buttons in the same corner.
  // The child posts {type:'ss-art-modal', state:'open'|'close'} from app.js.
  window.addEventListener('message', function(e){
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type !== 'ss-art-modal') return;
    var x = modal.querySelector('.ssm-x');
    var sh = modal.querySelector('.ssm-share');
    if (e.data.state === 'open'){
      if (x) x.style.visibility = 'hidden';
      if (sh) sh.style.visibility = 'hidden';
    } else {
      if (x) x.style.visibility = '';
      if (sh) sh.style.visibility = '';
    }
  });

  // Esc closes
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && openSlug) { e.preventDefault(); close(); }
  });

  // Intercept supplement links anywhere in the document.
  // Two patterns are supported:
  //   (a) supplement.html?slug=<slug>      — modern canonical URL
  //   (b) /s/<slug>.html or ../s/<slug>.html  — legacy static URL (2026-05-25:
  //       legacy /s/ pages were tombstoned to redirect to (a), but internal
  //       links still pointing there should open as modal not hard-navigate,
  //       otherwise users see a redirect flash and lose the overlay UX.)
  var LEGACY_S_RE = /(?:^|\/)s\/([a-z0-9-]+)\.html(?:$|[?#])/i;
  document.addEventListener('click', function(e){
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    var href = a.getAttribute('href') || '';
    var slug = null;
    if (/(?:^|[\/?])supplement\.html\?slug=/.test(href)) {
      var url;
      try { url = new URL(a.href, location.href); } catch(err) { return; }
      slug = url.searchParams.get('slug');
    } else {
      var m = href.match(LEGACY_S_RE);
      if (m) slug = m[1];
    }
    if (!slug) return;
    e.preventDefault();
    open(slug);
  }, false);

  // Forward/back navigation
  window.addEventListener('popstate', function(e){
    var st = e.state && e.state.ssm ? e.state.ssm : null;
    if (st) open(st, true);
    else if (openSlug) close(true);
  });

  // Auto-open if the page was loaded with ?supplement=<slug>
  try {
    var sp = new URLSearchParams(location.search);
    var s = sp.get('supplement');
    if (s) {
      // Make the stripped URL the "back" target so closing returns here cleanly
      var stripped = location.pathname + (location.search.replace(/[?&]supplement=[^&]*/,'').replace(/^&/,'?')) + location.hash;
      try { history.replaceState({ ssmOriginal: true }, '', stripped); } catch(e){}
      open(s);
    }
  } catch(e){}

  window.SSModal = { open: open, close: close };
})();
