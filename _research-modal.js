/* _research-modal.js — homepage-only script that intercepts clicks on
   Research-section cards and opens the destination in an iframe overlay
   instead of full-page navigating.

   Wired up by including <script src="_research-modal.js?v=..."> on index.html.
   The chrome inside the iframe (_research-chrome.js) detects window.self !==
   window.top, hides its footer + close-X, and posts {type:'rc-close'} to the
   parent when the user wants to close.
*/
(function(){
  'use strict';
  if (window.__rcModalInit) return;
  window.__rcModalInit = true;

  /* The URL prefixes whose links we open inside the modal. Plain anchors
     to anywhere else still navigate normally. */
  var INTERCEPT_PREFIXES = ['/a/', '/for/', '/condition/', '/stack/',
                            'a/', 'for/', 'condition/', 'stack/'];

  function isInterceptedHref(href){
    if (!href) return false;
    if (href.charAt(0) === '#') return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    /* Absolute URLs to a different origin */
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return false;
      var path = u.pathname;
      return INTERCEPT_PREFIXES.some(function(p){ return path.indexOf('/' + p.replace(/^\//, '')) === 0; });
    } catch(_){ return false; }
  }

  /* ---------- modal DOM (lazy-built on first open) ---------- */

  var modal, frame, srcStack = [];

  function buildModal(){
    modal = document.createElement('div');
    modal.id = 'rc-modal';
    modal.className = 'rc-modal';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="rc-modal-backdrop" aria-hidden="true"></div>' +
      '<div class="rc-modal-panel" role="dialog" aria-modal="true" aria-label="Article">' +
        '<iframe class="rc-modal-frame" title="Article" src="about:blank"></iframe>' +
      '</div>';
    document.body.appendChild(modal);
    frame = modal.querySelector('.rc-modal-frame');
    modal.querySelector('.rc-modal-backdrop').addEventListener('click', close);
  }

  function open(href){
    if (!modal) buildModal();
    srcStack.push(href);
    frame.setAttribute('src', href);
    modal.removeAttribute('hidden');
    document.documentElement.classList.add('rc-modal-open');
    document.body.style.overflow = 'hidden';
    /* Push a history entry so the browser back button closes the modal */
    try {
      history.pushState({ rcModal: href }, '', '#rc=' + encodeURIComponent(href));
    } catch(_){}
  }

  function close(){
    if (!modal || modal.hasAttribute('hidden')) return;
    modal.setAttribute('hidden', '');
    document.documentElement.classList.remove('rc-modal-open');
    document.body.style.overflow = '';
    frame.setAttribute('src', 'about:blank');
    srcStack = [];
    /* Strip the #rc= hash if we set it */
    try {
      if (location.hash.indexOf('#rc=') === 0){
        history.replaceState(null, '', location.pathname + location.search);
      }
    } catch(_){}
  }

  /* ---------- click interception ---------- */

  document.addEventListener('click', function(e){
    /* Only handle plain left-clicks without modifier keys (so Cmd-click etc.
       can still open in a new tab). */
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.target && a.target !== '' && a.target !== '_self') return;
    var href = a.getAttribute('href');
    if (!isInterceptedHref(href)) return;
    e.preventDefault();
    open(a.href);
  }, true);

  /* ---------- escape key / browser back / cross-frame postMessage ---------- */

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) close();
  });

  window.addEventListener('popstate', function(){
    /* If the user presses back while the modal is open, close it. The
       history.pushState we did above made this work. */
    if (modal && !modal.hasAttribute('hidden')) close();
  });

  window.addEventListener('message', function(e){
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'rc-close') close();
    /* Supplement link clicked inside the article iframe — open the canonical
       supplement modal on top of the article overlay. The existing
       supplement-modal.js exposes window.SSModal.open(slug). */
    if (e.data.type === 'rc-open-supp' && e.data.slug){
      if (window.SSModal && typeof window.SSModal.open === 'function'){
        window.SSModal.open(e.data.slug);
      } else {
        /* SSModal not loaded yet (initial-page-load race). Retry briefly. */
        var tries = 0;
        var iv = setInterval(function(){
          tries++;
          if (window.SSModal && typeof window.SSModal.open === 'function'){
            clearInterval(iv);
            window.SSModal.open(e.data.slug);
          } else if (tries > 20){
            clearInterval(iv);
            /* Last-resort fallback: navigate the article iframe */
            location.href = '/supplement.html?slug=' + encodeURIComponent(e.data.slug);
          }
        }, 100);
      }
    }
  });

  /* If the page loads with #rc=<href> already in the URL (deep link), open
     the modal automatically. */
  if (location.hash.indexOf('#rc=') === 0){
    try {
      var deep = decodeURIComponent(location.hash.slice(4));
      if (isInterceptedHref(deep)) open(deep);
    } catch(_){}
  }
})();
