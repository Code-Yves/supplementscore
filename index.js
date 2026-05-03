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
  // Update dropdown items active state
  document.querySelectorAll('.articles-dd-item').forEach(p => {
    p.classList.toggle('active', p.dataset.cat === window._articleCategoryFilter);
  });
  // Update dropdown button label + count
  const labelEl = document.getElementById('articles-dd-label');
  const countEl = document.getElementById('articles-dd-count');
  if(labelEl) labelEl.textContent = ARTICLE_CAT_LABELS[window._articleCategoryFilter] || 'All Articles';
  if(countEl){
    if(window._articleCategoryFilter === 'all'){
      const tot = document.querySelector('[data-total-count]');
      countEl.textContent = tot ? tot.textContent : '0';
    } else {
      const src = document.querySelector('.articles-dd-item[data-cat="'+window._articleCategoryFilter+'"] .articles-dd-item-count');
      countEl.textContent = src ? src.textContent : '0';
    }
  }
  // Close dropdown
  const dd = document.getElementById('articles-dd');
  if(dd) dd.classList.remove('open');
  applyArticleFilter();
  // Scroll to the filter row so it sits at the top of the viewport and the first article appears fully below it
  if(shouldScroll){
    const filterRow = document.querySelector('.articles-filter-row');
    if(filterRow){
      const y = filterRow.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({top: Math.max(0, y), behavior: 'smooth'});
    }
  }
}
function toggleArticlesDropdown(e){
  if(e){e.stopPropagation();}
  const dd = document.getElementById('articles-dd');
  if(dd) dd.classList.toggle('open');
}
document.addEventListener('click', function(e){
  const dd = document.getElementById('articles-dd');
  if(dd && dd.classList.contains('open') && !dd.contains(e.target)){
    dd.classList.remove('open');
  }
});
function searchArticles(query) {
  window._articleSearchQuery = (query || '').trim().toLowerCase();
  const clr = document.getElementById('articles-search-clear');
  if (clr) clr.style.display = window._articleSearchQuery ? '' : 'none';
  applyArticleFilter();
}
function clearArticleSearch() {
  const inp = document.getElementById('articles-search-input');
  if (inp) inp.value = '';
  searchArticles('');
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
  window.heroGoto=function(i){
    SLIDES.forEach((s,idx)=>s.classList.toggle('active',idx===i));
    current=i;
    if(counterEl) counterEl.textContent=i+1;
    renderDots();
    rotatePattern();
    resetTimer();
  };
  window.heroNext=function(){window.heroGoto((current+1)%TOTAL);};
  window.heroPrev=function(){window.heroGoto((current-1+TOTAL)%TOTAL);};
  function resetTimer(){
    clearInterval(timer);
    timer=setInterval(()=>window.heroGoto((current+1)%TOTAL),6000);
  }
  rotatePattern();
  renderDots();
  resetTimer();
  const hero=document.getElementById('hero');
  if(hero){
    hero.addEventListener('mouseenter',()=>clearInterval(timer));
    hero.addEventListener('mouseleave',resetTimer);
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
  // Total for "All Articles" badge in the filter dropdown
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  document.querySelectorAll('[data-total-count]').forEach(el=>{el.textContent=total;});
  const ddCount=document.getElementById('articles-dd-count');
  if(ddCount && (!window._articleCategoryFilter || window._articleCategoryFilter==='all')){
    ddCount.textContent=total;
  }
}
if (document.querySelector('.article-list')) { reorderArticles(); initArticleLoadMore(); initCatCardCounts(); }
/* Category hero rotating carousel */
(function(){
  const hero=document.getElementById('cat-hero');
  if(!hero) return;
  const SLIDES=hero.querySelectorAll('.cat-hero-slide');
  const BGS=hero.querySelectorAll('.cat-hero-bg');
  const counterEl=document.getElementById('cat-hero-current');
  const TOTAL=SLIDES.length;
  if(!TOTAL) return;
  let current=0, timer;
  function go(i){
    current=i;
    SLIDES.forEach((s,idx)=>s.classList.toggle('active',idx===i));
    BGS.forEach((b,idx)=>b.classList.toggle('active',idx===i));
    if(counterEl) counterEl.textContent=i+1;
  }
  function reset(){clearInterval(timer);timer=setInterval(()=>go((current+1)%TOTAL),4000);}
  window.catHeroNext=function(){go((current+1)%TOTAL);reset();};
  window.catHeroPrev=function(){go((current-1+TOTAL)%TOTAL);reset();};
  hero.addEventListener('click',(e)=>{
    if(e.target.closest('.cat-hero-nav')) return;
    const cat=SLIDES[current].dataset.cat;
    if(typeof catCardClick==='function') catCardClick(cat);
  });
  hero.addEventListener('mouseenter',()=>clearInterval(timer));
  hero.addEventListener('mouseleave',reset);
  reset();
})();
// Clear any browser autofill value that persisted in the search input on page load
(function(){
  const si = document.getElementById('articles-search-input');
  if(!si) return;
  const clear = () => { if(si.value) { si.value=''; if(typeof searchArticles==='function') searchArticles(''); } };
  // Run multiple times to catch lazy autofill (Chrome/Safari/Firefox differ)
  clear();
  requestAnimationFrame(clear);
  setTimeout(clear, 50);
  setTimeout(clear, 250);
  setTimeout(clear, 600);
  setTimeout(clear, 1200);
  // Also clear on first focus in case the browser fills on focus
  si.addEventListener('focus', function once(){ clear(); si.removeEventListener('focus', once); });
})();

/* ===== Block 3 (from line 17014, 3 lines) ===== */
/* Dark mode disabled site-wide — theme is forced to light at the top of <head>.
   The theme toggle button is kept hidden in markup; this stub is a no-op kept
   only so any older cached link to it doesn't error. */

/* ===== Block 4 (from line 17019, 51 lines) ===== */
/* Live counter for the top banner — gives the bar a subtle "always updating" feel.
   Base count anchored to a known epoch (in studies/72h). The displayed number
   drifts up at the long-run rate of new reviews so refreshes a day later look
   plausibly larger, with small idle ticks while the page is open. */
(function(){
  var el = document.getElementById('ss-live-count');
  if(!el) return;
  // Anchor: 1247 studies as of 2026-04-27 12:00 UTC. ~14 studies/hour rate.
  var EPOCH = Date.UTC(2026, 3, 27, 12, 0, 0); // month is 0-indexed
  var BASE  = 1247;
  var RATE_PER_HOUR = 14;
  function fmt(n){ return n.toLocaleString('en-US'); }
  function currentCount(){
    var hours = (Date.now() - EPOCH) / 3600000;
    return Math.max(BASE, Math.round(BASE + hours * RATE_PER_HOUR));
  }
  var n = currentCount();
  el.textContent = fmt(n);
  // Idle drift: while the tab is open, occasionally bump by 1 so the user can
  // see the number breathe. Pauses when the tab is hidden.
  setInterval(function(){
    if(document.hidden) return;
    if(Math.random() < 0.35){
      n += 1;
      el.textContent = fmt(n);
    }
  }, 9000);
})();
/* (Nav search submit is handled by nav-search.js, which routes to search.html?q=…) */

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
