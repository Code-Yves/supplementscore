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
  + '.ssm-frame{flex:1;border:none;width:100%;background:var(--color-background-secondary,#ebe5d9)}'
  + '.ssm-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary,#a8a29e);font-size:13px;letter-spacing:.04em;pointer-events:none}'
  + '.ssm.loaded .ssm-loading{display:none}'
  + '@media(max-width:680px){.ssm-card{margin:0;width:100%;height:100vh;border-radius:0;border:none}}'
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
    +   '<button type="button" class="ssm-x" data-ssm-close aria-label="Close detail">'
    +     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 3 L13 13 M13 3 L3 13"/></svg>'
    +   '</button>'
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
  });

  function open(slug, fromHistory) {
    if (!slug) return;
    if (slug === openSlug){
      try { frame.contentWindow && frame.contentWindow.scrollTo(0,0); } catch(e){}
      return;
    }
    attachModal();
    openSlug = slug;
    modal.classList.remove('loaded');
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
  }

  // Click on backdrop or X closes
  modal.addEventListener('click', function(e){
    var t = e.target.closest('[data-ssm-close]');
    if (t){ e.preventDefault(); close(); }
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
