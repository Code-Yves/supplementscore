/* index.js
 * Extracted from index.html on 2026-05-01. Loaded with `defer` so it runs after
 * data.js / app.js (matches original execution order).
 *
 * IMPORTANT: blocks are concatenated at top-level (no IIFE wrap) because inline
 * onclick="..." attributes in index.html depend on these functions being globals.
 */

/* ===== Block 1 (from line 1571, 7 lines) ===== */
    /* Toggle .on state when a category is clicked */
    function rsActivateCat(el){
      var nav = el.closest('.rs-cat');
      if (!nav) return;
      nav.querySelectorAll('a').forEach(function(a){ a.classList.remove('on'); });
      el.classList.add('on');
    }

    /* ----- Articles category dropdown (compact toolbar version) -----
       The .rs-cat panel inside .rs-cat-dd-panel is the option list. The
       button is a summary that mirrors the active option. */
    function rsCatDdToggle(e){
      if (e && e.stopPropagation) e.stopPropagation();
      var dd = document.getElementById('rs-cat-dd');
      if (!dd) return;
      var btn = dd.querySelector('.rs-cat-dd-btn');
      var panel = dd.querySelector('.rs-cat-dd-panel');
      if (!btn || !panel) return;
      var open = !panel.hasAttribute('hidden');
      if (open) {
        panel.setAttribute('hidden','');
        btn.setAttribute('aria-expanded','false');
      } else {
        panel.removeAttribute('hidden');
        btn.setAttribute('aria-expanded','true');
      }
    }
    function rsCatDdClose(){
      var dd = document.getElementById('rs-cat-dd');
      if (!dd) return;
      var btn = dd.querySelector('.rs-cat-dd-btn');
      var panel = dd.querySelector('.rs-cat-dd-panel');
      if (panel) panel.setAttribute('hidden','');
      if (btn) btn.setAttribute('aria-expanded','false');
    }
    /* Mirror the active option's label + count + tint onto the button. */
    function rsCatDdSync(){
      var dd = document.getElementById('rs-cat-dd');
      if (!dd) return;
      var active = dd.querySelector('.rs-cat-dd-panel a.on') ||
                   dd.querySelector('.rs-cat-dd-panel a[data-cat="all"]');
      if (!active) return;
      var labelEl = document.getElementById('rs-cat-dd-label');
      var countEl = document.getElementById('rs-cat-dd-count');
      if (labelEl) {
        var lbl = active.querySelector('.lbl');
        labelEl.textContent = lbl ? lbl.textContent : 'All';
        labelEl.setAttribute('data-cat', active.getAttribute('data-cat') || 'all');
      }
      if (countEl) {
        var n = active.querySelector('.n');
        countEl.textContent = n ? n.textContent : '0';
      }
    }
    /* Close on outside click */
    document.addEventListener('click', function(e){
      var dd = document.getElementById('rs-cat-dd');
      if (!dd) return;
      var panel = dd.querySelector('.rs-cat-dd-panel');
      if (!panel || panel.hasAttribute('hidden')) return;
      if (!dd.contains(e.target)) rsCatDdClose();
    });
    /* Close on Esc */
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') rsCatDdClose();
    });
    /* Initial sync once the count-population code has run.
       The data-cat-count attributes are filled by the loop further
       down in this file; we wait two animation frames to let that
       finish before mirroring numbers onto the button. */
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', function(){
        requestAnimationFrame(function(){
          requestAnimationFrame(rsCatDdSync);
        });
      });
    }

/* ===== Block 2 (from line 16567, 323 lines) ===== */
function _renderArticleInline(n) {
  document.getElementById('research-list-view').style.display = 'none';
  var target = document.getElementById('article-' + n);
  if (!target) return;
  var isReader = document.body.classList.contains('reader-mode');
  /* Hide (or remove, in reader mode) all other articles */
  var all = document.querySelectorAll('.article-full');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el === target) continue;
    if (isReader) {
      if (el.parentNode) el.parentNode.removeChild(el);
    } else {
      el.style.display = 'none';
    }
  }
  target.style.display = 'block';
  /* Inject key points at top, supplement cards at bottom */
  var existing = target.querySelector('.art-supps-section');
  if (existing) existing.remove();
  var existingKp = target.querySelector('.art-kp-card');
  if (existingKp) existingKp.remove();
  var existingRel = target.querySelector('.art-related-section');
  if (existingRel) existingRel.remove();
  var inner = target.querySelector('[style*="padding"]');
  if (inner) {
    /* Key points — inject after .article-meta */
    if (typeof articleKeyPointsHtml === 'function') {
      var kpHtml = articleKeyPointsHtml(inner);
      if (kpHtml) {
        var metaEl = inner.querySelector('.article-meta');
        if (metaEl) {
          metaEl.style.marginBottom = '0';
          metaEl.insertAdjacentHTML('afterend', kpHtml);
          var firstP = inner.querySelector('p');
          if (firstP) firstP.classList.add('art-body-first');
        }
      }
    }
    if (typeof processArticleSources === 'function') {
      processArticleSources(inner);
    }
    /* Supplement cards at bottom (original position) */
    if (typeof articleSuppsHtml === 'function') {
      var suppHtml = articleSuppsHtml(n);
      if (suppHtml) {
        var sourcesDiv = inner.querySelector('.art-sources');
        if (sourcesDiv) sourcesDiv.insertAdjacentHTML('beforebegin', suppHtml);
        else inner.insertAdjacentHTML('beforeend', suppHtml);
      }
    }
    /* Related articles at very bottom */
    if (typeof articleRelatedHtml === 'function') {
      var relHtml = articleRelatedHtml(n);
      if (relHtml) inner.insertAdjacentHTML('beforeend', relHtml);
    }
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function showArticle(n) {
  goArticle(n);
}
function readerClose() {
  /* Always navigate to the main page in-tab for a reliable, clean transition.
     If the tab was opened via window.open(), it will just land on the main view; the user can close the tab themselves. */
  window.location.href = window.location.pathname;
}
function toggleSrcCat(btn) {
  var cat = btn.closest('.abt-src-cat');
  if (cat) cat.classList.toggle('collapsed');
}
function showArticleList() {
  for (var i = 1; i <= 141; i++) {
    var el = document.getElementById('article-' + i);
    if (el) el.style.display = 'none';
  }
  document.getElementById('research-list-view').style.display = 'block';
  document.getElementById('research-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window._articleCategoryFilter = 'all';
window._articleSearchQuery = '';
const ARTICLE_CAT_LABELS={all:'All Articles',guide:'Guides',breakthrough:'Breakthroughs',myth:'Reality Check',safety:'Safety Alerts',kids:'Kids'};
function filterArticles(cat, shouldScroll) {
  if(shouldScroll === undefined) shouldScroll = true;
  window._articleCategoryFilter = cat || 'all';
  // Sync the compact toolbar dropdown — mark active option, mirror to button
  document.querySelectorAll('.rs-cat-dd-panel a').forEach(function(a){
    a.classList.toggle('on', a.getAttribute('data-cat') === window._articleCategoryFilter);
  });
  if (typeof rsCatDdSync === 'function') rsCatDdSync();
  if (typeof rsCatDdClose === 'function') rsCatDdClose();
  applyArticleFilter();
  // Scroll to the toolbar so it sits at the top of the viewport and the first article appears fully below it
  if(shouldScroll){
    const toolbar = document.querySelector('.rs-toolbar');
    if(toolbar){
      const y = toolbar.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({top: Math.max(0, y), behavior: 'smooth'});
    }
  }
}
function applyArticleFilter() {
  const cat = window._articleCategoryFilter || 'all';
  const q = window._articleSearchQuery || '';
  const cards = document.querySelectorAll('.article-card,.article-featured');
  let visibleCount = 0;
  cards.forEach(c => {
    const catMatch = (cat === 'all') || (c.dataset.category === cat);
    let textMatch = true;
    if (q) {
      const title = (c.querySelector('.article-title')?.textContent || '').toLowerCase();
      const desc = (c.querySelector('.article-desc')?.textContent || '').toLowerCase();
      const catText = (c.querySelector('.article-cat')?.textContent || '').toLowerCase();
      textMatch = title.includes(q) || desc.includes(q) || catText.includes(q);
    }
    const show = catMatch && textMatch;
    c.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });
  // Also show/hide kids section based on filter
  const kidsSection = document.querySelector('[data-kids-section]');
  if (kidsSection) kidsSection.style.display = (cat === 'kids' && !q) ? '' : 'none';
  // Handle load-more button + article-hidden class
  const lmBtn = document.getElementById('article-load-more');
  if (lmBtn) {
    if (cat === 'all' && !q) {
      document.querySelectorAll('.article-card').forEach((c, i) => {
        if (i >= 10) c.classList.add('article-hidden');
        else c.classList.remove('article-hidden');
      });
      const rem = document.querySelectorAll('.article-card.article-hidden').length;
      if (rem) { lmBtn.style.display = ''; lmBtn.textContent = 'Load more (' + rem + ' remaining)'; }
      else lmBtn.style.display = 'none';
    } else {
      // When filtering, reveal all matching cards (ignore article-hidden)
      document.querySelectorAll('.article-card').forEach(c => c.classList.remove('article-hidden'));
      lmBtn.style.display = 'none';
    }
  }
  // No-results state
  const noRes = document.getElementById('articles-no-results');
  if (noRes) noRes.style.display = (visibleCount === 0) ? '' : 'none';
}
function initArticleLoadMore() {
  const cards = document.querySelectorAll('.article-card');
  cards.forEach((c, i) => { if (i >= 10) c.classList.add('article-hidden'); c.dataset.articleIndex = i; });
  if (cards.length > 5) {
    const btn = document.createElement('button');
    btn.id = 'article-load-more';
    btn.textContent = 'Load more (' + (cards.length - 5) + ' remaining)';
    btn.style.cssText = 'width:100%;padding:10px;border:1px solid var(--color-border-tertiary);border-radius:10px;background:none;font-size:12px;color:var(--color-text-secondary);cursor:pointer;margin-top:8px;font-family:inherit';
    btn.onclick = function() {
      const hidden = document.querySelectorAll('.article-card.article-hidden');
      let shown = 0;
      hidden.forEach(c => { if (shown < 10) { c.classList.remove('article-hidden'); shown++; } });
      const rem = document.querySelectorAll('.article-card.article-hidden').length;
      if (!rem) btn.remove();
      else btn.textContent = 'Load more (' + rem + ' remaining)';
    };
    document.querySelector('.article-list')?.appendChild(btn);
  }
}
/* Reorder article cards by engagement potential — shock/trending first, then practical/useful, then niche */
const ARTICLE_PRIORITY=[55,18,5,3,9,11,2,47,8,67,45,91,84,88,104,65,15,4,127,6,100,7,16,54,85,107,52,121,124,31,10,17,12,13,59,96,82,56,115,92,14,21,34,69,78,23,75,87,102,20,26,22,72,36,24,66,37,64,81,35,73,111,119,99,27,30,62,49,80,110,98,113,118,130,131,132,133,134,135,136,137,138,139,140,141,90,32,33,105,112,53,71,125,93,40,28,39,42,44,50,51,60,63,70,74,76,79,94,106,108,114,116,123,129,29,41,46,58,86,95,101,120,126,19,25,38,43,48,57,61,68,77,83,89,97,103,109,117,122,128];
function reorderArticles(){
  const list=document.querySelector('.article-list');if(!list)return;
  const cards=[...list.querySelectorAll('.article-card')];
  const map={};cards.forEach(c=>{const m=c.getAttribute('onclick')?.match(/showArticle\((\d+)\)/);if(m)map[m[1]]=c;});
  ARTICLE_PRIORITY.forEach(id=>{const c=map[id];if(c)list.appendChild(c);});
  /* append any remaining cards not in the priority list */
  cards.forEach(c=>{if(!c.parentElement||c.parentElement!==list)list.appendChild(c);});
}
function catCardClick(cat){
  filterArticles(cat);
}
/* Hero carousel */
(function(){
  const SLIDES=document.querySelectorAll('.hero-slide');
  const TOTAL=SLIDES.length;
  if(!TOTAL) return;
  let current=0, timer;
  const dotsEl=document.getElementById('hero-dots');
  const counterEl=document.getElementById('hero-current');
  const PATTERNS=document.querySelectorAll('.hero-pattern-bg');
  const PCOUNT=PATTERNS.length;
  let lastPattern=-1;
  function rotatePattern(){
    if(!PCOUNT) return;
    let idx;
    if(PCOUNT===1){idx=0;}
    else{do{idx=Math.floor(Math.random()*PCOUNT);}while(idx===lastPattern);}
    PATTERNS.forEach((p,i)=>p.classList.toggle('active',i===idx));
    lastPattern=idx;
  }
  function renderDots(){
    if(!dotsEl) return;
    dotsEl.innerHTML='';
    for(let i=0;i<TOTAL;i++){
      const d=document.createElement('button');
      d.className='hero-dot'+(i===current?' active':'');
      d.onclick=(e)=>{e.stopPropagation();window.heroGoto(i);};
      dotsEl.appendChild(d);
    }
  }
  const progressEl=document.getElementById('hero-progress-fill');
  function restartProgress(){
    if(!progressEl) return;
    progressEl.classList.remove('run');
    /* force reflow so the animation restarts */
    void progressEl.offsetWidth;
    progressEl.classList.add('run');
  }
  window.heroGoto=function(i){
    SLIDES.forEach((s,idx)=>s.classList.toggle('active',idx===i));
    current=i;
    if(counterEl) counterEl.textContent=(i+1)+' / '+TOTAL;
    renderDots();
    rotatePattern();
    restartProgress();
    resetTimer();
  };
  window.heroNext=function(){window.heroGoto((current+1)%TOTAL);};
  window.heroPrev=function(){window.heroGoto((current-1+TOTAL)%TOTAL);};
  /* Click the CTA → open the currently-active slide's article */
  window.heroReadActive=function(){
    const active=SLIDES[current];
    if(!active) return;
    /* Each slide has onclick="showArticle(<id>)" — extract the id and call directly */
    const oc=active.getAttribute('onclick')||'';
    const m=oc.match(/showArticle\s*\(\s*(\d+)\s*\)/);
    if(m && typeof window.showArticle==='function'){window.showArticle(parseInt(m[1],10));return;}
    /* Fallback: synthesize a click */
    active.click();
  };
  function resetTimer(){
    clearInterval(timer);
    timer=setInterval(()=>window.heroGoto((current+1)%TOTAL),6000);
  }
  rotatePattern();
  renderDots();
  if(counterEl) counterEl.textContent='1 / '+TOTAL;
  restartProgress();
  resetTimer();
  const hero=document.getElementById('hero');
  if(hero){
    hero.addEventListener('mouseenter',()=>{clearInterval(timer);if(progressEl)progressEl.style.animationPlayState='paused';});
    hero.addEventListener('mouseleave',()=>{if(progressEl)progressEl.style.animationPlayState='';resetTimer();});
  }
})();
function initCatCardCounts(){
  const counts={};
  document.querySelectorAll('.article-card[data-category],.article-featured[data-category]').forEach(c=>{
    const cat=c.dataset.category;counts[cat]=(counts[cat]||0)+1;
  });
  document.querySelectorAll('[data-cat-count]').forEach(el=>{
    el.textContent=counts[el.dataset.catCount]||0;
  });
  // Total — populates [data-total-count] in the toolbar dropdown's "All" option,
  // which the dropdown sync function then mirrors onto the trigger button.
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  document.querySelectorAll('[data-total-count]').forEach(el=>{el.textContent=total;});
  if (typeof rsCatDdSync === 'function') rsCatDdSync();
}
if (document.querySelector('.article-list')) { reorderArticles(); initArticleLoadMore(); initCatCardCounts(); }
/* Category-hero rotating carousel removed — markup #cat-hero no longer exists. */

/* ===== Block 3 (from line 17014, 3 lines) ===== */
/* Dark mode disabled site-wide — theme is forced to light at the top of <head>.
   The theme toggle button is kept hidden in markup; this stub is a no-op kept
   only so any older cached link to it doesn't error. */

/* Live-counter ticker moved to nav-search.js so every page that loads it
   gets the same animation behavior. (Nav search submit is also handled there.) */

/* Tab routing on load.
   - With no hash (or an unrecognized one) → force the Index tab.
   - With #research / #about / #profile / #supplements → open that tab.
   This guarantees Index is the landing tab no matter what state we
   arrived from. */
(function(){
  var allowed = {research:1, about:1, profile:1, supplements:1};
  function applyHash(){
    if (typeof switchTab !== 'function') return false;
    var h = (location.hash || '').replace(/^#/, '').toLowerCase();
    switchTab(allowed[h] ? h : 'supplements');
    // Drop the anti-flash override now that switchTab has set inline display
    // rules on the views. Leaving it in place would block in-page tab clicks
    // (e.g. Index → Articles → Index) since the !important rule beats the
    // empty inline style switchTab uses for the active tab.
    document.documentElement.removeAttribute('data-pre-tab');
    return true;
  }
  if(!applyHash()){
    var tries = 0;
    var iv = setInterval(function(){
      if(applyHash() || ++tries > 40) clearInterval(iv);
    }, 50);
  }
  window.addEventListener('hashchange', applyHash);
})();

/* ===== Block 5 (from line 17072, 61 lines) ===== */
// ── Sort-by dropdown ────────────────────────────────────────────────────────
window._sortMode = 'score';

function _applySort() {
  const mode = window._sortMode;
  const content = document.getElementById('s-content');
  if (!content) return;

  // Collect ALL cards from every tier section (includes tier-hidden ones)
  const allCards = [];
  content.querySelectorAll('.scards').forEach(function(container) {
    Array.from(container.querySelectorAll(':scope > .sc')).forEach(function(c) {
      allCards.push(c);
    });
  });
  if (!allCards.length) return;

  allCards.sort(function(a, b) {
    if (mode === 'az') {
      const na = (a.querySelector('.lc-name') || {}).textContent || '';
      const nb = (b.querySelector('.lc-name') || {}).textContent || '';
      return na.localeCompare(nb);
    }
    if (mode === 'recent') {
      const na = (a.querySelector('.lc-name') || {}).textContent || '';
      const nb = (b.querySelector('.lc-name') || {}).textContent || '';
      const da = (typeof lastReviewedFor === 'function') ? lastReviewedFor(na) : '';
      const db = (typeof lastReviewedFor === 'function') ? lastReviewedFor(nb) : '';
      const cmp = (db || '').localeCompare(da || '');
      return cmp !== 0 ? cmp : na.localeCompare(nb);
    }
    // score high → low (default)
    const sa = parseInt((a.querySelector('.lc-score-num') || {}).textContent || '0', 10);
    const sb = parseInt((b.querySelector('.lc-score-num') || {}).textContent || '0', 10);
    return sb - sa;
  });

  // Replace entire content with one flat sorted list — removes tier banners & load-more bars
  content.innerHTML = '<div class="scards"></div>';
  const flat = content.querySelector('.scards');
  allCards.forEach(function(c) {
    c.classList.remove('tier-hidden');
    flat.appendChild(c);
  });
}

window.setSortMode = function(val) {
  window._sortMode = val;
  // Just re-sort whatever is currently displayed — never re-render,
  // because renderAll() doesn't know about category/population filters.
  _applySort();
};

// Patch renderAll so every render respects the current sort
if (typeof renderAll === 'function') {
  const _origRenderAll = renderAll;
  window.renderAll = function() {
    _origRenderAll.apply(this, arguments);
    _applySort();
  };
}

/* ===== Block 6 (from line 17135, 154 lines) ===== */
(function(){
  const inp = document.getElementById('ix-hero-search');
  const ac  = document.getElementById('ix-ac');
  if (!inp || !ac) return;

  // Typewriter placeholder removed 2026-05-02 — replaced with a static
  // descriptive placeholder set in the HTML ("Search supplements, categories,
  // or conditions…"). The animation pulled focus from the rest of the hero,
  // and a static example list reads better for screen readers and tab-focused
  // users. The userTyped flag is preserved because the autocomplete logic
  // below references it.
  let userTyped=false;

  // ── Autocomplete ────────────────────────────────────────────────────────
  function escH(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function escA(s){return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  let ixAcIdx=-1;

  // Scroll the page to the supplement list
  function scrollToList(){
    const el=document.getElementById('s-content')||document.getElementById('main-ui');
    if(!el)return;
    const sticky=document.querySelector('.sticky-bar');
    const offset=sticky?sticky.getBoundingClientRect().bottom+8:80;
    window.scrollTo({top:el.getBoundingClientRect().top+window.pageYOffset-offset,behavior:'smooth'});
  }

  function showIxAc(q){
    q=String(q||'').trim();
    if(!q){hideIxAc();return;}
    if(typeof S==='undefined'||!S.length){hideIxAc();return;}
    const ql=q.toLowerCase();

    // ── Supplements (max 5) ──
    const swS=S.filter(s=>s.n.toLowerCase().startsWith(ql));
    const incS=S.filter(s=>!s.n.toLowerCase().startsWith(ql)&&s.n.toLowerCase().includes(ql));
    const suppHits=[...swS,...incS].slice(0,5);

    // ── Conditions (max 3) ──
    const condHits=[];
    if(typeof CONDITIONS!=='undefined'){
      Object.entries(CONDITIONS).forEach(([key,cond])=>{
        if(cond.label.toLowerCase().includes(ql))condHits.push({key,label:cond.label});
      });
      condHits.sort((a,b)=>a.label.toLowerCase().startsWith(ql)?-1:b.label.toLowerCase().startsWith(ql)?1:0);
      condHits.splice(3);
    }

    // ── Categories (max 2) ──
    const catHits=[];
    if(typeof CATS!=='undefined'){
      CATS.forEach(c=>{if(c.toLowerCase().includes(ql))catHits.push(c);});
      catHits.sort((a,b)=>a.toLowerCase().startsWith(ql)?-1:b.toLowerCase().startsWith(ql)?1:0);
      catHits.splice(2);
    }

    if(!suppHits.length&&!condHits.length&&!catHits.length){hideIxAc();return;}
    ixAcIdx=-1;

    let html='';
    if(suppHits.length){
      html+=`<div class="gs-ac-hdr">Supplements</div>`;
      html+=suppHits.map(s=>`<div class="gs-ac-item" role="option" data-type="supp" data-name="${escA(s.n)}" onmousedown="event.preventDefault()"><span>${escH(s.n)}</span><span class="gs-ac-tag">${escH((s.tag||'').split(' · ')[0])}</span></div>`).join('');
    }
    if(condHits.length){
      html+=`<div class="gs-ac-hdr">Conditions &amp; Goals</div>`;
      html+=condHits.map(c=>`<div class="gs-ac-item" role="option" data-type="cond" data-key="${escA(c.key)}" data-name="${escA(c.label)}" onmousedown="event.preventDefault()"><span>${escH(c.label)}</span><span class="gs-ac-tag">Condition</span></div>`).join('');
    }
    if(catHits.length){
      html+=`<div class="gs-ac-hdr">Categories</div>`;
      html+=catHits.map(c=>`<div class="gs-ac-item" role="option" data-type="cat" data-name="${escA(c)}" onmousedown="event.preventDefault()"><span>${escH(c)}</span><span class="gs-ac-tag">Category</span></div>`).join('');
    }
    ac.innerHTML=html;
    ac.classList.add('vis');
  }

  function hideIxAc(){setTimeout(()=>ac.classList.remove('vis'),150);}

  function pickIxAc(item){
    const type=item.dataset.type||'supp';
    ac.classList.remove('vis');ixAcIdx=-1;
    if(type==='supp'){
      inp.value=item.dataset.name;
      inp.form.submit();
    } else if(type==='cond'){
      // Show supplements for this condition from the CONDITIONS list
      inp.value='';
      const key=item.dataset.key;
      if(typeof CONDITIONS!=='undefined'&&CONDITIONS[key]){
        const wanted=new Set(CONDITIONS[key].supps);
        const items=(typeof S!=='undefined'?S:[]).filter(s=>wanted.has(s.n));
        const content=document.getElementById('s-content');
        if(content&&typeof renderCard==='function'){
          content.innerHTML='<div class="scards">'+items.map(s=>renderCard(s,'')).join('')+'</div>';
          scrollToList();
        }
      }
    } else if(type==='cat'){
      inp.value='';
      if(typeof setCatFilter==='function'){setCatFilter(item.dataset.name);scrollToList();}
    }
  }

  // Click on suggestion
  ac.addEventListener('click',e=>{
    const item=e.target.closest('.gs-ac-item');
    if(item)pickIxAc(item);
  });

  const debIx=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};};
  const debouncedShow=debIx(showIxAc,120);

  inp.addEventListener('input',e=>{
    userTyped=true;
    debouncedShow(e.target.value);
  });
  inp.addEventListener('focus',e=>{
    if(e.target.value.trim())showIxAc(e.target.value);
  });
  inp.addEventListener('blur',hideIxAc);
  inp.addEventListener('keydown',e=>{
    const items=ac.classList.contains('vis')?ac.querySelectorAll('.gs-ac-item'):[];
    if(e.key==='ArrowDown'&&items.length){
      e.preventDefault();ixAcIdx=Math.min(ixAcIdx+1,items.length-1);
      items.forEach((it,i)=>it.classList.toggle('active',i===ixAcIdx));
    } else if(e.key==='ArrowUp'&&items.length){
      e.preventDefault();ixAcIdx=Math.max(ixAcIdx-1,0);
      items.forEach((it,i)=>it.classList.toggle('active',i===ixAcIdx));
    } else if(e.key==='Enter'){
      if(ixAcIdx>=0&&items[ixAcIdx]){e.preventDefault();pickIxAc(items[ixAcIdx]);}
      // else let the form submit naturally
      ac.classList.remove('vis');
    } else if(e.key==='Escape'){
      ac.classList.remove('vis');ixAcIdx=-1;
    }
  });
})();

/* ===== Block 7 (from line 17370, 4 lines) ===== */
  // Close sources modal on Escape
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') document.getElementById('sources-modal').classList.remove('open');
  });

/* ===== Block 8 (from line 17376, 62 lines) ===== */
(function(){
  var heroForm   = document.getElementById('ix-hero-form');
  var stickyBar  = document.getElementById('ix-sticky-bar');
  var filterBar  = document.getElementById('main-sticky');
  var stickyInput = document.getElementById('ix-sticky-search');
  var heroInput   = document.getElementById('ix-hero-search');
  if(!heroForm || !stickyBar) return;

  var NAV_TOP = window.innerWidth <= 600 ? 62 : 90;

  function setFilterTop(searchVisible) {
    if(!filterBar) return;
    if(searchVisible) {
      // sticky search is showing — measure its rendered height and offset
      var h = stickyBar.getBoundingClientRect().height || 67;
      filterBar.style.top = (NAV_TOP + h) + 'px';
    } else {
      filterBar.style.top = NAV_TOP + 'px';
    }
  }

  // Track which tab is active so the observer can gate on it
  var indexSections = { '': 1, 'supplements': 1 };
  function isOnIndex() {
    var h = (location.hash || '').replace(/^#/, '').toLowerCase();
    return !!indexSections[h];
  }

  // Show/hide sticky search when hero search scrolls out of view
  var obs = new IntersectionObserver(function(entries){
    var heroVisible = entries[0].isIntersecting;
    var searchShowing = !heroVisible && isOnIndex();
    stickyBar.classList.toggle('visible', searchShowing);
    stickyBar.setAttribute('aria-hidden', searchShowing ? 'false' : 'true');
    stickyInput.setAttribute('tabindex', searchShowing ? '0' : '-1');
    // Delay slightly so the sticky search transition has started before measuring
    setTimeout(function(){ setFilterTop(searchShowing); }, 10);
  }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
  obs.observe(heroForm);

  // Keep both inputs in sync so switching feels seamless
  heroInput.addEventListener('input', function(){ stickyInput.value = heroInput.value; });
  stickyInput.addEventListener('input', function(){ heroInput.value = stickyInput.value; });

  // Recalc on resize
  window.addEventListener('resize', function(){
    NAV_TOP = window.innerWidth <= 600 ? 62 : 90;
  });

  // Hide sticky search bar when navigating away from the Index tab
  function onTabChange() {
    if (!isOnIndex()) {
      stickyBar.classList.remove('visible');
      stickyBar.setAttribute('aria-hidden', 'true');
      stickyInput.setAttribute('tabindex', '-1');
      if (filterBar) filterBar.style.top = NAV_TOP + 'px';
    }
    // When returning to index, the IntersectionObserver re-evaluates via isOnIndex()
  }
  window.addEventListener('hashchange', onTabChange);
  onTabChange(); // apply on initial load
})();

/* ===== Per-article JSON-LD MedicalScholarlyArticle injection (added 2026-05-01) =====
 * When the user opens an inlined article via showArticle(n), inject a
 * MedicalScholarlyArticle JSON-LD block in the document head so search engines
 * can crawl per-article structured data. The block is replaced when the user
 * navigates to a different article. Removed when the user returns to the list. */
(function(){
  function getArticleMeta(n) {
    var div = document.getElementById('article-' + n);
    if (!div) return null;
    var titleEl = div.querySelector('h2');
    var title = titleEl ? titleEl.textContent.trim() : '';
    // Date: text like "Apr 11, 2026" inside .article-meta
    var metaEl = div.querySelector('.article-meta');
    var dateMatch = metaEl ? metaEl.textContent.match(/[A-Z][a-z]{2}\s+\d{1,2},\s*\d{4}/) : null;
    var datePub = dateMatch ? dateMatch[0] : null;
    // Reviewed date from the comment <!-- last-reviewed: YYYY-MM-DD -->
    var html = div.outerHTML;
    var reviewedMatch = html.match(/last-reviewed:\s*(\d{4}-\d{2}-\d{2})/);
    var dateReviewed = reviewedMatch ? reviewedMatch[1] : null;
    // First paragraph as description
    var p = div.querySelector('p');
    var desc = p ? p.textContent.trim().slice(0, 280) : '';
    // Citations: gather all <li data-pmid> or <a href*=pubmed/doi>
    var cites = [];
    div.querySelectorAll('a[href*="pubmed.ncbi"], a[href*="doi.org"]').forEach(function(a){
      var url = a.getAttribute('href');
      if (cites.indexOf(url) === -1) cites.push(url);
    });
    return {n: n, title: title, datePub: datePub, dateReviewed: dateReviewed, desc: desc, cites: cites};
  }

  function injectArticleJsonLd(n) {
    removeArticleJsonLd();
    var meta = getArticleMeta(n);
    if (!meta || !meta.title) return;
    var ld = {
      "@context": "https://schema.org",
      "@type": "MedicalScholarlyArticle",
      "headline": meta.title,
      "name": meta.title,
      "description": meta.desc,
      "url": location.origin + location.pathname + '#article-' + n,
      "isPartOf": { "@type": "WebSite", "name": "SupplementScore", "url": location.origin },
      "publisher": { "@type": "Organization", "name": "SupplementScore" }
    };
    if (meta.datePub) ld.datePublished = new Date(meta.datePub).toISOString().slice(0,10);
    if (meta.dateReviewed) ld.dateModified = meta.dateReviewed;
    if (meta.cites.length) ld.citation = meta.cites.slice(0, 12);
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = '__article-jsonld';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  function removeArticleJsonLd() {
    var existing = document.getElementById('__article-jsonld');
    if (existing) existing.remove();
  }

  // Hook the existing showArticle/_renderArticleInline functions if present
  if (typeof window.showArticle === 'function') {
    var origShow = window.showArticle;
    window.showArticle = function(n) {
      origShow.apply(this, arguments);
      injectArticleJsonLd(n);
    };
  }
  if (typeof window.showArticleList === 'function') {
    var origList = window.showArticleList;
    window.showArticleList = function() {
      origList.apply(this, arguments);
      removeArticleJsonLd();
    };
  }
})();

/* ============================================================
   Articles tab — typeahead search (rs-search)
   Filters the visible article cards as the user types AND
   shows a dropdown of matching titles. Click/Enter opens the
   article via the existing showArticle(id).
   ============================================================ */
(function(){
  var input=document.getElementById('rs-search-input');
  if(!input)return;
  var ac=document.getElementById('rs-search-ac');
  var noResults=document.getElementById('articles-no-results');

  /* Build index from .article-card elements */
  var INDEX=[];
  function buildIndex(){
    INDEX=[];
    document.querySelectorAll('.article-card[onclick]').forEach(function(card){
      var oc=card.getAttribute('onclick')||'';
      var m=oc.match(/showArticle\s*\(\s*(\d+)\s*\)/);
      if(!m)return;
      var titleEl=card.querySelector('.article-title');
      if(!titleEl)return;
      var title=(titleEl.textContent||'').trim();
      var cat=card.getAttribute('data-category')||'';
      var descEl=card.querySelector('.article-desc');
      var desc=descEl?(descEl.textContent||'').trim():'';
      var minRead=(card.querySelector('.article-side-stat')||{}).textContent||'';
      INDEX.push({id:parseInt(m[1],10),title:title,cat:cat,desc:desc,min:minRead,el:card});
    });
  }
  buildIndex();

  var CAT_LABEL={guide:'Guide',breakthrough:'Breakthrough',myth:'Reality Check',safety:'Safety Alert',kids:'Kids'};

  function escHtml(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function highlight(text,q){
    if(!q)return escHtml(text);
    var idx=text.toLowerCase().indexOf(q.toLowerCase());
    if(idx<0)return escHtml(text);
    return escHtml(text.substring(0,idx))+'<mark>'+escHtml(text.substring(idx,idx+q.length))+'</mark>'+escHtml(text.substring(idx+q.length));
  }
  function score(item,q){
    var t=item.title.toLowerCase(),lq=q.toLowerCase();
    if(t.startsWith(lq))return 0;
    var i=t.indexOf(lq);
    if(i>-1)return 10+i;
    if(item.desc.toLowerCase().indexOf(lq)>-1)return 100;
    return 1000;
  }
  function search(q){
    if(!q)return [];
    return INDEX
      .map(function(it){return {it:it,s:score(it,q)};})
      .filter(function(x){return x.s<1000;})
      .sort(function(a,b){return a.s-b.s;})
      .slice(0,8)
      .map(function(x){return x.it;});
  }

  var activeIdx=-1, lastQuery='';

  function renderAc(matches,q){
    if(!matches.length){
      ac.innerHTML='<div class="rs-ac-empty">No articles matching &ldquo;'+escHtml(q)+'&rdquo;</div>';
      ac.hidden=false;input.setAttribute('aria-expanded','true');
      activeIdx=-1;return;
    }
    ac.innerHTML=matches.map(function(it,i){
      return '<a class="rs-ac-item'+(i===activeIdx?' active':'')+'" data-id="'+it.id+'" role="option" href="#article-'+it.id+'">'+
        '<span class="rs-ac-cat" data-cat="'+escHtml(it.cat)+'">'+escHtml(CAT_LABEL[it.cat]||it.cat)+'</span>'+
        '<span class="rs-ac-body"><span class="rs-ac-title">'+highlight(it.title,q)+'</span>'+
        (it.min?'<span class="rs-ac-meta">'+escHtml(it.min)+' min read</span>':'')+'</span>'+
      '</a>';
    }).join('');
    ac.hidden=false;input.setAttribute('aria-expanded','true');
  }

  function hideAc(){ac.hidden=true;ac.innerHTML='';input.setAttribute('aria-expanded','false');activeIdx=-1;}

  /* Filter the visible cards in the list to match the query.
     Empty query → restore all (delegate to filterArticles if available, else show all). */
  function filterCards(q){
    var anyVisible=false;
    if(!q){
      /* Re-apply current category filter if one is active */
      var activeCat=document.querySelector('.rs-cat a.on');
      var cat=activeCat?activeCat.getAttribute('data-cat'):'all';
      if(typeof window.filterArticles==='function'){window.filterArticles(cat);return;}
      INDEX.forEach(function(it){it.el.style.display='';anyVisible=true;});
    } else {
      var lq=q.toLowerCase();
      INDEX.forEach(function(it){
        var match=it.title.toLowerCase().indexOf(lq)>-1 || it.desc.toLowerCase().indexOf(lq)>-1 || (CAT_LABEL[it.cat]||'').toLowerCase().indexOf(lq)>-1;
        it.el.style.display=match?'':'none';
        if(match)anyVisible=true;
      });
    }
    if(noResults)noResults.style.display=anyVisible?'none':'';
  }

  var debounceTimer;
  input.addEventListener('input',function(){
    var q=input.value.trim();
    lastQuery=q;
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(function(){
      filterCards(q);
      if(q){renderAc(search(q),q);}else{hideAc();}
    },80);
  });

  input.addEventListener('keydown',function(e){
    var items=ac.querySelectorAll('.rs-ac-item');
    if(e.key==='ArrowDown'){
      if(ac.hidden && lastQuery){renderAc(search(lastQuery),lastQuery);return;}
      e.preventDefault();
      activeIdx=Math.min(items.length-1,activeIdx+1);
      items.forEach(function(el,i){el.classList.toggle('active',i===activeIdx);});
      if(items[activeIdx])items[activeIdx].scrollIntoView({block:'nearest'});
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      activeIdx=Math.max(-1,activeIdx-1);
      items.forEach(function(el,i){el.classList.toggle('active',i===activeIdx);});
      if(items[activeIdx])items[activeIdx].scrollIntoView({block:'nearest'});
    } else if(e.key==='Enter'){
      var pick=activeIdx>=0?items[activeIdx]:items[0];
      if(pick){e.preventDefault();var id=parseInt(pick.getAttribute('data-id'),10);if(typeof window.showArticle==='function')window.showArticle(id);hideAc();input.blur();}
    } else if(e.key==='Escape'){
      if(!ac.hidden){hideAc();}else if(input.value){input.value='';filterCards('');}
    }
  });

  input.addEventListener('focus',function(){if(lastQuery)renderAc(search(lastQuery),lastQuery);});

  /* Click on a suggestion */
  ac.addEventListener('click',function(e){
    var item=e.target.closest('.rs-ac-item');
    if(!item)return;
    e.preventDefault();
    var id=parseInt(item.getAttribute('data-id'),10);
    if(typeof window.showArticle==='function')window.showArticle(id);
    hideAc();input.blur();
  });


  /* Click outside hides dropdown */
  document.addEventListener('click',function(e){
    if(ac.hidden)return;
    if(e.target.closest('.rs-search'))return;
    hideAc();
  });
})();
