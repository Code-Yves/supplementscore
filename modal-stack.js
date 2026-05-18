/* ============================================================
   modal-stack.js  (2026-05-13)
   ------------------------------------------------------------
   Site-wide modal back-stack. Whenever a modal opens, it records
   the modal that was open *before* it. When a modal closes, the
   stack is popped and that previous modal is re-opened — so the
   user always returns to whatever they were on, not to the bare
   index.

   The stack lives in sessionStorage so it survives the URL
   navigations involved in the article-from-supplement flow
   (clicking "Further Reading" target=_top navigates the parent
   window, which would otherwise blow away any in-memory state).

   Supported modal types — extend as new modals get plumbed in:
     { type: 'supplement', slug: '...' }   → window.SSModal.open(slug)
     { type: 'article',    id:   N    }   → window.goArticle(id)

   API:
     window.SSModalStack.push(entry)   record an entry to come back to
     window.SSModalStack.pop()         remove and return the latest
     window.SSModalStack.peek()        return latest without removing
     window.SSModalStack.snapshot()    detect what modal is currently
                                       open in the DOM and return an
                                       entry shape for it (or null)
     window.SSModalStack.reopen(entry) call the appropriate opener
                                       for an entry; returns true on
                                       success, false on miss
     window.SSModalStack.clear()       empty the stack
   ============================================================ */
(function(){
  if (window.SSModalStack) return;

  var STACK_KEY = 'ss-modal-stack';
  var MAX_DEPTH = 10;

  function readStack(){
    try { var s = sessionStorage.getItem(STACK_KEY); return s ? JSON.parse(s) : []; }
    catch(_){ return []; }
  }
  function writeStack(arr){
    try { sessionStorage.setItem(STACK_KEY, JSON.stringify(arr)); } catch(_){}
  }
  function entryKey(e){
    if (!e || !e.type) return '';
    return e.type + ':' + (e.slug || e.id || e.name || '');
  }

  function push(entry){
    if (!entry || !entry.type) return;
    var s = readStack();
    /* Don't push a duplicate of the current top — happens if the same
       URL navigation fires open twice (auto-open + pushState handlers). */
    if (s.length && entryKey(s[s.length-1]) === entryKey(entry)) return;
    s.push(entry);
    if (s.length > MAX_DEPTH) s = s.slice(-MAX_DEPTH);
    writeStack(s);
  }

  function pop(){
    var s = readStack();
    if (!s.length) return null;
    var top = s.pop();
    writeStack(s);
    return top;
  }

  function peek(){
    var s = readStack();
    return s.length ? s[s.length-1] : null;
  }

  function clear(){ writeStack([]); }

  /* Detect what modal is currently open by inspecting the DOM.
     Used to decide what to push before opening a new modal. */
  function snapshot(){
    /* Article modal (app.js) */
    var art = document.getElementById('art-modal');
    if (art && art.classList.contains('open')) {
      var id = window._currentArticleId || null;
      /* Fall back to URL hash if global isn't set yet. */
      if (!id) {
        var m = (location.hash || '').match(/^#article-(\d+)$/);
        if (m) id = parseInt(m[1], 10);
      }
      if (id) return { type: 'article', id: id };
    }
    /* Supplement modal (supplement-modal.js iframe) */
    var ssm = document.querySelector('.ssm.open');
    if (ssm) {
      var sp = new URLSearchParams(location.search);
      var slug = sp.get('supplement');
      /* History state is the second source of truth — supplement-modal.js
         stores { ssm: slug } via pushState. */
      if (!slug && history.state && history.state.ssm) slug = history.state.ssm;
      if (slug) return { type: 'supplement', slug: slug };
    }
    /* Legacy supp-modal in app.js (different element from .ssm). */
    var legacy = document.getElementById('supp-modal');
    if (legacy && legacy.classList.contains('open')) {
      var nm = window._currentSuppName || null;
      if (nm) return { type: 'supp-legacy', name: nm };
    }
    return null;
  }

  /* Re-open a modal from a stack entry. Returns true on success. */
  function reopen(entry){
    if (!entry || !entry.type) return false;
    if (entry.type === 'supplement' && window.SSModal && typeof window.SSModal.open === 'function') {
      window.SSModal.open(entry.slug);
      return true;
    }
    if (entry.type === 'article' && typeof window.goArticle === 'function') {
      var div = document.getElementById('article-' + entry.id);
      if (!div) return false;
      window.goArticle(entry.id);
      return true;
    }
    /* supp-legacy is index-only and uses showSuppModal(name); skip for now. */
    return false;
  }

  window.SSModalStack = {
    push:     push,
    pop:      pop,
    peek:     peek,
    snapshot: snapshot,
    reopen:   reopen,
    clear:    clear
  };
})();
