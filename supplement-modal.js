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
  + '.ssm-bd{position:absolute;inset:0;background:rgba(15,12,10,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);cursor:pointer}'
  + '.ssm-card{position:relative;max-width:980px;width:calc(100% - 32px);margin:32px auto;height:calc(100vh - 64px);background:var(--color-background-secondary,#ebe5d9);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35);display:flex;flex-direction:column;transform:translateY(10px) scale(.99);transition:transform .2s ease;border:1px solid var(--color-border-tertiary,#dcdad7)}'
  + '.ssm.open .ssm-card{transform:translateY(0) scale(1)}'
  + '.ssm-x{position:absolute;top:14px;right:14px;z-index:5;width:36px;height:36px;border-radius:50%;border:1px solid var(--color-border-tertiary,#dcdad7);background:var(--color-background-primary,#f6f2ea);color:var(--color-text-primary,#0c0a09);font-size:20px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;padding:0;transition:all .15s;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.08)}'
  + '.ssm-x:hover{background:var(--color-background-secondary,#ebe5d9);transform:scale(1.06)}'
  + '.ssm-x:focus-visible{outline:2px solid var(--color-brand,#1F7A6B);outline-offset:2px}'
  + '.ssm-x svg{width:16px;height:16px;display:block}'
  /* Share button — sits LEFT of the close X. Same pill height (36px),
     matches the brand chrome. Native share sheet on mobile, copy-link
     fallback on desktop. */
  + '.ssm-share{position:absolute;top:14px;right:60px;z-index:5;height:36px;padding:0 14px;border-radius:18px;border:1px solid var(--color-border-tertiary,#dcdad7);background:var(--color-background-primary,#f6f2ea);color:var(--color-text-primary,#0c0a09);font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1;transition:all .15s;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.08)}'
  + '.ssm-share:hover{background:var(--color-background-secondary,#ebe5d9);transform:scale(1.04)}'
  + '.ssm-share:focus-visible{outline:2px solid var(--color-brand,#1F7A6B);outline-offset:2px}'
  + '.ssm-share.copied{background:#E6F7F5;color:#065F56;border-color:#9DD3CC}'
  + '.ssm-share svg{width:14px;height:14px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
  + '@media(max-width:500px){.ssm-share{padding:0;width:36px;justify-content:center;border-radius:50%}.ssm-share .ssm-share-lbl{display:none}.ssm-share{right:60px}}'
  + '.ssm-toast{position:absolute;top:60px;right:14px;z-index:6;background:#0c0a09;color:#fff;font-size:12.5px;font-weight:500;padding:8px 14px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.18);opacity:0;transform:translateY(-6px);transition:opacity .18s,transform .18s;pointer-events:none;display:flex;align-items:center;gap:6px}'
  + '.ssm-toast.show{opacity:1;transform:translateY(0)}'
  + '.ssm-toast svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}'
  + '.ssm-frame{flex:1;border:none;width:100%;background:var(--color-background-secondary,#ebe5d9)}'
  + '.ssm-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary,#a8a29e);font-size:13px;letter-spacing:.04em;pointer-events:none}'
  + '.ssm.loaded .ssm-loading{display:none}'
  /* Full-bleed at ≤600px to match .art-modal's mobile breakpoint
     (styles.css). Previously 680px, which left a 32px floating
     margin on the 601-680px range while .art-modal already went
     full-bleed there — visually inconsistent. */
  + '@media(max-width:600px){.ssm-card{margin:0;width:100%;height:100vh;border-radius:0;border:none}.ssm-share{right:60px}.ssm-x{top:10px;right:10px}}'
  /* Hide Share + X when the iframe is showing a non-supplement page
     (e.g. a /compare/ guide). That page has its own close FAB at the
     same coordinates; without this rule the two stacks overlap. */
  + '.ssm.hide-chrome .ssm-share,.ssm.hide-chrome .ssm-x{display:none !important}'
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
    +   '<button type="button" class="ssm-share" data-ssm-share aria-label="Share supplement" title="Share — copies link">'
    +     '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'
    +     '<span class="ssm-share-lbl">Share</span>'
    +   '</button>'
    +   '<button type="button" class="ssm-x" data-ssm-close aria-label="Close detail">'
    +     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>'
    +   '</button>'
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
    if (!fromHistory && window.SSModalStack) {
      try {
        var snap = window.SSModalStack.snapshot();
        if (snap && !(snap.type === 'supplement' && snap.slug === slug)) {
          window.SSModalStack.push(snap);
        }
      } catch(_){}
    }
    attachModal();
    openSlug = slug;
    modal.classList.remove('loaded');
    var _x = modal.querySelector('.ssm-x'); if (_x) _x.style.visibility = '';
    frame.src = 'supplement.html?slug=' + encodeURIComponent(slug) + '&modal=1';
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

  // Intercept supplement links anywhere in the document
  document.addEventListener('click', function(e){
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '_self') return;
    var href = a.getAttribute('href') || '';
    if (!/(?:^|[\/?])supplement\.html\?slug=/.test(href)) return;
    var url;
    try { url = new URL(a.href, location.href); } catch(err) { return; }
    var slug = url.searchParams.get('slug');
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
