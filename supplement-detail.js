/* ============================================================================
   supplement-detail.js
   Detail-page SPA logic. Reads ?slug=<kebab> (or ?n=<Name>) and renders the
   canonical supplement card into <main id="det-root">. Loaded by supplement.html
   only — not used on other pages.

   Extracted from inline <script> in supplement.html on 2026-05-25 for browser
   cacheability and easier editing. The code below is verbatim as it was
   inlined; depends on globals from data.js (OL_SHORT, CL, DL, SS.*).
============================================================================ */

(function(){
  function escHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function escAttr(s){return escHtml(s);}

  // Onset / Cost / Drug labels are global (from data.js): OL_SHORT, CL, DL
  function onsetLabel(v){return (typeof OL_SHORT!=='undefined' && OL_SHORT[v]) || '—';}
  function costLabel(v){return (typeof CL!=='undefined' && CL[v]) || '—';}
  function drugLabel(v){return (typeof DL!=='undefined' && DL[v]) || '—';}

  // First 1–2 sentences of desc (TL;DR for hero) — no lookbehind for older browsers
  function tldrFromDesc(desc){
    if(!desc) return '';
    var parts = desc.match(/[^.!?]+[.!?]+\s*/g) || [desc];
    var out = parts.slice(0, 2).join('').trim();
    if (out.length < 80 && parts.length > 2) out = parts.slice(0, 3).join('').trim();
    return out;
  }

  // Compact dose for hero stat cell — handles ranges ("3-5 g") and singles ("400 mg")
  function compactDose(dose){
    if(!dose) return '—';
    var first = dose.split(/[;,]/)[0].trim();
    // Try X-Y unit first (e.g. "3-5 g/day")
    var m = first.match(/([\d.,]+\s*[–\-]\s*[\d.,]+\s*[a-zA-Zµ]+(?:\/\w+)?)/);
    if(m) return m[1];
    // Then X unit (e.g. "400 mg")
    m = first.match(/([\d.,]+\s*[a-zA-Zµ]+(?:\/\w+)?)/);
    if(m) return m[1];
    // Last resort: first 3 words
    var w = first.split(/\s+/);
    return w.slice(0, Math.min(3, w.length)).join(' ');
  }

  // "Continuous" / "Cycled" derived from cycle prose
  function cycleSummary(cycle){
    if(!cycle) return 'Continuous';
    var c = cycle.toLowerCase();
    if(/cycle\s+\d|wk(?:s)?\s+on|weeks?\s+on|cycle\s+8|cycle\s+6/.test(c)) return 'Cycled';
    if(/continuous|indefinite|no cycling needed/.test(c)) return 'Continuous';
    return 'Continuous';
  }

  function categoriesFromTag(tag){
    if(!tag) return [];
    return tag.split(' · ').map(function(t){return t.trim();}).filter(Boolean);
  }

  // Sub-score bar (5/5 scale)
  function bar(label, val){
    var pct = Math.max(0, Math.min(100, (val||0) * 20));
    return '<div class="det-bar"><div class="det-bar-lbl">'+escHtml(label)+'</div><div class="det-bar-track"><div class="det-bar-fill" style="width:'+pct+'%"></div></div><div class="det-bar-val">'+(val||'-')+'/5</div></div>';
  }

  // Linked entity list cell — caps long lists at 10 visible rows with a
  // "Show N more" toggle so dense supplements (Magnesium, Omega-3 etc.)
  // don't unfurl 20–30-row columns by default.
  var relCellSeq = 0;
  function relCell(title, items, renderItem, count){
    var body;
    if(!items || !items.length){
      body = '<div class="det-rel-empty">None on file.</div>';
    } else if (items.length <= 10) {
      body = '<ul class="det-rel-list">' + items.map(renderItem).join('') + '</ul>';
    } else {
      var visible = items.slice(0, 10);
      var hidden  = items.slice(10);
      var id = 'rel-more-' + (++relCellSeq);
      // Use inline style="display:none" — the [hidden] attribute alone is
      // overridden by author CSS rules with display:flex on the same class.
      body = ''
        + '<ul class="det-rel-list">' + visible.map(renderItem).join('') + '</ul>'
        + '<ul class="det-rel-list det-rel-list--more" id="' + id + '" style="display:none">' + hidden.map(renderItem).join('') + '</ul>'
        + '<button type="button" class="det-rel-more" data-target="' + id + '" data-extra="' + hidden.length + '">'
        +   '<span class="det-rel-more-label">Show ' + hidden.length + ' more</span>'
        +   '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
        + '</button>';
    }
    var cnt = (count != null) ? '<span class="cnt">'+count+'</span>' : '';
    return '<div class="det-rel-cell"><div class="det-rel-h"><span>'+escHtml(title)+'</span>'+cnt+'</div>'+body+'</div>';
  }

  function bucketLabel(b){
    return b === 'avoid' ? 'Avoid' : b === 'caution' ? 'Caution' : b === 'extra' ? 'Synergy' : '';
  }
  function bucketClass(b){
    return b === 'avoid' ? 'avoid' : b === 'caution' ? 'caution' : b === 'extra' ? 'support' : '';
  }

  /* ── Dynamic JSON-LD (DietarySupplement + BreadcrumbList) ───────────────────
     supplement.html ships a static WebPage JSON-LD block as a fallback for
     non-JS crawlers. When we have a real ?slug= and a resolved supplement, we
     inject a richer DietarySupplement block plus a supplement-specific
     BreadcrumbList. Google has executed JS for indexing since 2019 — these
     dynamic blocks are picked up. See [[project_launch_prep_2026_06_06]]. */
  function injectSchema(s, slug){
    if (!s || !slug) return;
    var url = 'https://supplementscore.org/supplement.html?slug=' + encodeURIComponent(slug);
    var name = s.n || '';
    // Extract alternateName from a parenthesized qualifier ("Omega-3 (EPA/DHA)" → "EPA/DHA")
    var altMatch = name.match(/\(([^)]+)\)/);
    var altName = altMatch ? altMatch[1].trim() : null;
    var bareName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
    // Description: cap at ~480 chars to keep JSON-LD lean. Strip newlines.
    var desc = (s.desc || '').replace(/\s+/g, ' ').trim();
    if (desc.length > 480) desc = desc.slice(0, 477).trim() + '…';
    // Tier-derived safetyConsideration. Stable phrasing matters more for schema
    // than mirroring data.js TIERS copy that may evolve.
    var safetyByTier = {
      t1: 'Strong evidence base; safe for adult use at standard doses. SupplementScore Tier 1.',
      t2: 'Promising or situational evidence; benefits depend on indication and dosing. SupplementScore Tier 2.',
      t3: 'Trending in wellness culture but limited clinical evidence. SupplementScore Tier 3.',
      t4: 'Documented safety risks including possible organ damage, drug interactions, or regulatory warnings. Do not use without clinician supervision. SupplementScore Tier 4.'
    };
    var safety = safetyByTier[s.t] || 'See methodology for current evidence rating.';
    // Recommended intake — DietarySupplement inherits a few medical-related
    // properties; recommendedIntake takes a RecommendedDoseSchedule.
    var doseObj = null;
    if (s.dose) {
      doseObj = {
        "@type": "RecommendedDoseSchedule",
        "doseUnit": "varies — see description",
        "doseSchedule": String(s.dose).slice(0, 200)
      };
    }
    var supplementSchema = {
      "@context": "https://schema.org",
      "@type": "DietarySupplement",
      "name": name,
      "description": desc || (name + ' — evidence-based supplement detail.'),
      "activeIngredient": bareName || name,
      "isProprietary": false,
      "safetyConsideration": safety,
      "url": url,
      "image": "https://supplementscore.org/og/default.png",
      "inLanguage": "en-US",
      "publisher": {
        "@type": "Organization",
        "name": "SupplementScore",
        "url": "https://supplementscore.org",
        "logo": {"@type": "ImageObject", "url": "https://supplementscore.org/og/default.png"}
      },
      "mainEntityOfPage": {"@type": "WebPage", "@id": url}
    };
    if (altName) supplementSchema.alternateName = altName;
    if (doseObj) supplementSchema.recommendedIntake = doseObj;

    var breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://supplementscore.org/"},
        {"@type": "ListItem", "position": 2, "name": "Supplements", "item": "https://supplementscore.org/browse.html"},
        {"@type": "ListItem", "position": 3, "name": name, "item": url}
      ]
    };

    function append(obj, id){
      // Update in place if we've emitted this id before (idempotent).
      var existing = document.getElementById(id);
      var el = existing || document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      el.textContent = JSON.stringify(obj);
      if (!existing) document.head.appendChild(el);
    }
    append(supplementSchema, 'ss-jsonld-dietarysupplement');
    append(breadcrumbSchema, 'ss-jsonld-breadcrumb');
  }

  var p = new URLSearchParams(location.search);
  var slug = (p.get('slug') || '').trim();
  var nameParam = (p.get('n') || '').trim();
  /* 2026-05-24 — Accept both ?slug=<kebab> and ?n=<Name+with+spaces>.
     Hundreds of historical links across /for/, /symptom/, /build/ and the
     symptom.html / build.html JS-generated grids use the ?n= form. Before
     this patch, ?n= was silently ignored and every link fell through to
     the "Pick a supplement" picker fallback (which the user reported as
     dead UX). Slugify the name and proceed as if the user had passed
     ?slug= directly. */
  if (!slug && nameParam && window.SS && typeof window.SS.slugify === 'function'){
    slug = window.SS.slugify(nameParam);
  }
  var root = document.getElementById('det-root');
  if (p.get('modal') === '1') document.body.classList.add('is-modal');
  /* window.__ART_MANIFEST is set synchronously by a/manifest.js (loaded above)
     so the Sources & further reading renderer below can use it immediately. */

  if (!slug){
    /* 2026-05-24 — The old "Pick a supplement" picker (8 hard-coded sample
       tiles) was dead UX: users only landed here because something was
       broken (a ?n= link that we now correctly handle, or a manually-typed
       /supplement.html with no query). Redirect to the homepage instead. */
    location.replace('/');
    return;
  }

  var s = window.SS.getSupplement(slug);
  if (!s){
    root.innerHTML = '<a class="det-back" href="search.html?q=' + encodeURIComponent(slug.replace(/-/g,' ')) + '">‹ Back to search</a><h1 class="det-h1">Supplement not found</h1><p style="color:var(--color-text-secondary)">No record for slug "'+escHtml(slug)+'". Try the <a href="search.html">search</a>.</p>';
    return;
  }
  document.title = s.n + ' — SupplementScore';
  // Emit slug-specific DietarySupplement + BreadcrumbList JSON-LD. The static
  // WebPage block in supplement.html remains as a non-JS fallback.
  try { injectSchema(s, slug); } catch (_) { /* schema injection is non-essential */ }

  var meta = window.SS.tierMeta(s.t);
  var compScore = window.SS.compositeScore(s);
  var conds   = window.SS.conditionsForSupplement(s.n) || [];
  var meds    = window.SS.medsForSupplement(s.n) || [];
  var artiles = window.SS.articlesForSupplement(s.n) || [];
  var bioms   = window.SS.biomarkersForSupplement(s.n) || [];

  /* Sources & Further Reading — cap at the 20 most relevant articles
     (2026-05-21 per user feedback). Some supplements have 30–40 mapped
     articles, most of which are general "Top 10" guides only loosely
     related. Re-rank by topical fit, keep curated order as tiebreaker,
     then slice. Scoring tiers:
       3: title contains the full supplement name ("Magnesium for Anxiety")
       2: title contains a meaningful word from the supplement name
          (skip generic forms like "vitamin", "complex")
       1: title contains a short token (D3, K2, B12) as whole word
       0: no match — general guide
     The cap is intentionally generous (20) so power users still get
     plenty of further reading; the order is what changes. */
  if (artiles.length > 20) {
    var SUPP_LC  = String(s.n || '').toLowerCase().trim();
    /* GENERIC stoplist intentionally short — articlesForSupplement returns
       a per-supplement curated list, so even "vitamin" matching within e.g.
       Vitamin D3's curated list is a positive signal (it surfaces "Vitamin
       D: How Much" alongside "Vitamin D3 vs D2"). Only strip words that
       carry no topical weight at all. */
    var GENERIC  = ['extract','complex','supplement','supplements',
                    'powder','capsule','liquid','blend','formula'];
    var SUPP_TOK = SUPP_LC.split(/[^a-z0-9]+/).filter(Boolean);
    var BIG_TOK  = SUPP_TOK.filter(function(w){
      return w.length >= 4 && GENERIC.indexOf(w) < 0;
    });
    var SMALL_TOK = SUPP_TOK.filter(function(w){
      return w.length >= 2 && w.length < 4;
    });
    function _artRelevance(a){
      var t = String(a.t || '').toLowerCase();
      if (!t) return 0;
      if (SUPP_LC && t.indexOf(SUPP_LC) >= 0) return 3;
      for (var i = 0; i < BIG_TOK.length; i++){
        if (t.indexOf(BIG_TOK[i]) >= 0) return 2;
      }
      for (var j = 0; j < SMALL_TOK.length; j++){
        // Whole-word match for short tokens so "d3" doesn't match "od3..."
        if (new RegExp('\\b' + SMALL_TOK[j] + '\\b').test(t)) return 1;
      }
      return 0;
    }
    artiles = artiles
      .map(function(a, i){ return { a:a, i:i, r:_artRelevance(a) }; })
      .sort(function(x, y){
        if (y.r !== x.r) return y.r - x.r;   // higher relevance first
        return x.i - y.i;                    // stable: curated order as tiebreaker
      })
      .slice(0, 20)
      .map(function(o){ return o.a; });
  }

  var tldr = tldrFromDesc(s.desc);
  var dose = compactDose(s.dose);
  var cycle = cycleSummary(s.cycle);
  var cats = categoriesFromTag(s.tag);

  // Alert banner — derive from data
  var avoidMeds = meds.filter(function(m){return m.bucket==='avoid';});
  var alertHtml = '';
  if (s.t === 't4'){
    var a4 = avoidMeds.length
      ? 'Avoid combining with ' + avoidMeds.slice(0, 2).map(function(m){return m.name;}).join(', ') + (avoidMeds.length > 2 ? ', and others.' : '.')
      : 'Significant safety concerns documented. Review the safety section before use.';
    alertHtml = '<div class="det-alert high"><span class="det-alert-icon">⚠︎</span><div><b>Tier 4 — risky / avoid.</b> '+escHtml(a4)+' <a href="#det-related">See related ↓</a></div></div>';
  } else if (avoidMeds.length){
    alertHtml = '<div class="det-alert med"><span class="det-alert-icon">⚠︎</span><div><b>Do not stack</b> with '+avoidMeds.slice(0, 2).map(function(m){return escHtml(m.name);}).join(', ')+(avoidMeds.length > 2 ? ', and others.' : '.')+' <a href="#det-related">See related ↓</a></div></div>';
  }

  // ── Pairings module (Treatment B pilot, 2026-05-13) ──
  // Renders synergy cards for the current supplement using window.SUPP_PAIRINGS
  // (pairings-data.js). Pilot scope: Vitamin D3 only. To roll out site-wide,
  // remove the name check in the early return and the limit of 5 cards.
  var pairingsHtml = (function(){
    if (s.n !== 'Vitamin D3') return '';
    var PAIRS = (typeof window !== 'undefined' && window.SUPP_PAIRINGS) ? window.SUPP_PAIRINGS : [];
    if (!PAIRS.length) return '';

    // Normalise a partner name down to a canonical key so different forms of
    // the same molecule collapse (Mg glycinate / Mg bisglycinate / Mg citrate
    // → "magnesium"; Ca carbonate / Ca citrate → "calcium"; K2 (MK-7) → "k2").
    function canon(name){
      var n = String(name||'').toLowerCase();
      n = n.replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
      if (/\bk2\b/.test(n) || /vitamin\s*k\s*2/.test(n)) return 'k2';
      if (/\bvitamin\s*a\b|retinol/.test(n)) return 'vitamin a';
      if (/magnesium/.test(n)) return 'magnesium';
      if (/\bcalcium\b|hydroxyapatite|mchc/.test(n)) return 'calcium';
      if (/boron/.test(n)) return 'boron';
      if (/\bleucine\b|protein\s+supplementation/.test(n)) return 'protein/leucine';
      if (/\bd3\b|cholecalciferol/.test(n)) return 'd3';
      return n.split(' ').slice(0,3).join(' ');
    }
    function isThisSupp(name){ return canon(name) === 'd3'; }

    // Filter to pairings that include D3, then group by canonical partner-set.
    var d3Pairs = PAIRS.filter(function(p){
      return (p.members||[]).some(isThisSupp);
    });
    var bucket = {};
    d3Pairs.forEach(function(p){
      var others = (p.members||[]).filter(function(m){ return !isThisSupp(m); });
      var key = others.map(canon).sort().join('+');
      if (!bucket[key] || (p.strength||0) > (bucket[key].strength||0)){
        bucket[key] = Object.assign({}, p, { _others: others });
      }
    });
    var rows = Object.keys(bucket).map(function(k){ return bucket[k]; });
    if (!rows.length) return '';

    // Split positive synergies from absorption-conflict ("keep apart at high
    // doses") cases so the conflict cards always survive the slice. Pilot
    // budget: 4 strongest synergies + every conflict (usually 0-1).
    var avoid = rows.filter(function(p){ return p.kind === 'absorption-conflict'; });
    var good  = rows.filter(function(p){ return p.kind !== 'absorption-conflict'; });
    good.sort(function(a,b){ return (b.strength||0) - (a.strength||0); });
    rows = good.slice(0, 4).concat(avoid);

    function kindLabel(kind, goal){
      if (kind === 'absorption-conflict') return 'Keep apart at high doses';
      if (kind === 'mechanism-complementary'){
        if (/whi|post-menopausal/i.test(goal||'')) return 'Synergy · WHI-validated';
        return 'Mechanism-complementary';
      }
      if (kind === 'cofactor') return 'Co-factor';
      if (kind === 'goal-stack') return 'Goal stack';
      if (kind === 'synergy') return 'Synergy';
      if (kind === 'absorption-enhancer') return 'Absorption enhancer';
      return (kind || 'Pair').replace(/-/g,' ');
    }
    function strengthDots(n){
      n = Math.max(0, Math.min(5, n|0));
      var out = '';
      for (var i = 0; i < 5; i++) out += '<i'+(i < n ? ' class="on"' : '')+'></i>';
      return '<span class="det-pair-strength" aria-label="strength '+n+' of 5">'+out+'</span>';
    }
    function suppLink(name){
      var slug = window.SS && window.SS.slugify ? window.SS.slugify(name) : '';
      var url  = window.SS && window.SS.urlFor   ? window.SS.urlFor('supplement', slug) : 'supplement.html?slug='+encodeURIComponent(slug);
      return '<a href="'+escAttr(url)+'">'+escHtml(name)+'</a>';
    }
    function partnersHtml(others){
      // On the D3 page the leading "Vitamin D3 + " is implied by the section
      // header — keep partner names only for a cleaner row.
      return others.map(suppLink).join('<span class="plus">+</span>');
    }

    var rowsHtml = rows.map(function(p){
      var isAvoid = p.kind === 'absorption-conflict';
      var rowCls = 'det-pair-row' + (isAvoid ? ' avoid' : '');
      var goalText = (p.goal ? p.goal + '.' : '') + (p.rationale ? ' ' + p.rationale : '');
      var goal = goalText ? '<p class="det-pair-goal">'+escHtml(goalText)+'</p>' : '';
      var dose = p.dose ? '<div class="det-pair-meta"><b>Dose</b>'+escHtml(p.dose)+'</div>' : '';
      var warn = '';
      if (Array.isArray(p.contraindications) && p.contraindications.length){
        warn = '<div class="det-pair-warn">⚠︎ Caution: '+escHtml(p.contraindications.join('; '))+'.</div>';
      } else if (isAvoid){
        warn = '<div class="det-pair-warn">⚠︎ Balanced AD3K formulas at normal doses are fine.</div>';
      }
      return '<li class="'+rowCls+'">'
        + '<div class="det-pair-row-top">'
        +   '<div class="det-pair-partners">'+partnersHtml(p._others)+'</div>'
        +   '<span class="det-pair-kind">'+escHtml(kindLabel(p.kind, p.goal))+'</span>'
        +   strengthDots(p.strength||0)
        + '</div>'
        + goal
        + dose
        + warn
        + '</li>';
    }).join('');

    return '<div class="det-pair-mod" id="det-pairings">'
      + '<div class="det-pair-mod-head">'
      +   '<span class="det-pair-mod-tag">Pairs well · keep apart</span>'
      +   '<span class="det-pair-mod-meta">Strength reflects mechanism evidence (1–5). <a href="about.html#interactions">How we weight pairings</a></span>'
      + '</div>'
      + '<ul class="det-pair-list">' + rowsHtml + '</ul>'
      + '</div>';
  })();

  // Categories
  var catsHtml = cats.length
    ? cats.map(function(c){return '<span class="det-cat-pill">'+escHtml(c)+'</span>';}).join('')
    : '';

  // Hero stats — Onset / Daily dose / Cost rating
  var statsHtml =
      '<div class="det-stat"><div class="det-stat-lbl">Onset</div><div class="det-stat-val">'+escHtml(onsetLabel(s.o))+'</div><div class="det-stat-sub">to see effects</div></div>'
    + '<div class="det-stat"><div class="det-stat-lbl">Daily dose</div><div class="det-stat-val">'+escHtml(dose)+'</div><div class="det-stat-sub">see protocol</div></div>'
    + '<div class="det-stat"><div class="det-stat-lbl">Cost</div><div class="det-stat-val">'+escHtml(costLabel(s.c))+'</div><div class="det-stat-sub">value rating</div></div>';

  // Hero sub-score bars
  var barsHtml =
      bar('Efficacy', s.e)
    + bar('Safety',   s.s)
    + bar('Research', s.r)
    + bar('Onset',    s.o)
    + bar('Cost',     s.c)
    + bar('Drug-int', s.d);

  // Protocol card rows
  var protocolRows = '';
  if (s.dose) protocolRows += '<div class="det-ref-row"><span class="det-ref-row-lbl">Dose</span><span class="det-ref-row-val">'+escHtml(s.dose)+'</span></div>';
  if (s.tips) protocolRows += '<div class="det-ref-row"><span class="det-ref-row-lbl">How to take</span><span class="det-ref-row-val">'+escHtml(s.tips)+'</span></div>';
  if (s.cycle) protocolRows += '<div class="det-ref-row"><span class="det-ref-row-lbl">Cycling</span><span class="det-ref-row-val">'+escHtml(s.cycle)+'</span></div>';

  // Linked entities cells. Drug interactions render as static rows (not links)
  // — the bucket tag (Caution / Synergy / Avoid) is the meaningful signal;
  // clicking through to a medication page is noise for this audience.
  var medsCellHtml = relCell('Drug interactions', meds, function(m){
    return '<li><span class="det-rel-row det-rel-row--static"><span>'+escHtml(m.name)+'</span><span class="det-ltag '+bucketClass(m.bucket)+'">'+escHtml(bucketLabel(m.bucket))+'</span></span></li>';
  }, meds.length);

  var condsLabel = (s.t === 't4') ? 'Marketed for' : 'Recommended for';
  /* Conditions are rendered as plain (non-clickable) rows by design —
     per user feedback 2026-05-13, the condition pages aren't a useful
     destination, so we surface the relationship visually without an
     active link. Visual styling matches the adjacent medication / lab
     marker rows via the .det-rel-row class added to styles below. */
  var condsCellHtml = relCell(condsLabel, conds, function(c){
    return '<li><span class="det-rel-row det-rel-row--static"><span>'+escHtml(c.name)+'</span><span class="det-ltag">Condition</span></span></li>';
  }, conds.length);

  var biomsCellHtml = relCell('Lab markers', bioms, function(b){
    return '<li><a href="'+escAttr(window.SS.urlFor('biomarker', b.slug))+'"><span>'+escHtml(b.name)+'</span><span class="det-ltag">Biomarker</span></a></li>';
  }, bioms.length);

  // 4th cell — Trending only. Previously rendered an Articles cell here
  // ('Curated reading available — see Sources below.') but the Sources
  // section directly underneath this grid already lists the curated
  // articles, making this filler redundant (user feedback). Drop the
  // cell entirely when not trending — the 2x2 grid gracefully becomes a
  // 3-cell layout (CSS .det-rel-cell:nth-last-child(-n+2) handles
  // border math regardless of cell count).
  var fourthCellHtml = '';
  if (s.tr){
    fourthCellHtml = '<div class="det-rel-cell"><div class="det-rel-h"><span>Trending</span></div><div style="font-size:12px;line-height:1.55;color:var(--color-text-secondary)">Currently popular in wellness culture. Trending ≠ proven — see the score for actual evidence weight.</div></div>';
  }

  // Sources — subtle article icon + read time
  var ART_ICON = '<svg class="det-art-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>';

  var sourcesHtml = '';
  if (artiles.length){
    /* Article URL resolution — route to the v2 article modal on index.html
       (2026-05-13). The previous routing went to a/<filename>.html static
       files, which use the legacy .ar-wrap layout. index.html ships 470
       pre-rendered <div class="article-full" id="article-N"> blocks, and
       app.js's goArticle() handler opens any of them in the art-modal with
       the v2 chrome (trust strip, Bottom Line, TOC, numbered sections,
       related supplements, processed sources) when the URL has the
       matching #article-N fragment.

       target="_top" breaks out of the supplement-modal iframe so the
       article opens on the parent window — otherwise the article modal
       would render inside the supplement modal's iframe (modal-in-modal,
       broken navigation, no v2 chrome wired up).

       For supplement.html viewed standalone (not in modal), _top is the
       current window, so behavior is identical. */
    sourcesHtml = '<div class="det-sources" id="det-sources"><div class="det-sources-h">Sources &amp; further reading</div><div class="det-sources-grid">'
      + artiles.map(function(a){
          var readTime = a.m ? (a.m + ' min') : '';
          /* Thread the current supplement slug through the URL so closing
             the article modal returns to this supplement modal instead of
             the bare index. supplement-modal.js auto-opens any
             ?supplement=<slug> on load while preserving the #article hash,
             so the supplement and article modals open together; the article
             paints on top (z-index bumped in styles.css), and closing it
             reveals the supplement modal underneath.

             We also push the return state to SSModalStack (sessionStorage)
             via the onclick handler — belt-and-suspenders so that even if
             the URL approach fails (browser quirks, History API timing),
             closeArtModal() can pop and re-open this supplement. */
          var artUrl = 'index.html?supplement=' + encodeURIComponent(slug)
            + '#article-' + encodeURIComponent(a.id);
          /* Use top.SSModalStack — inside the supplement iframe, the parent
             window (index.html) holds the live SSModalStack we want to push
             to. Guarded for cross-origin safety. */
          var pushSnippet =
              "try{var T=window.top;"
            + "if(T&&T.SSModalStack){T.SSModalStack.push({type:'supplement',slug:'" + escAttr(slug) + "'});}}"
            + "catch(_){}";
          return '<a href="'+escAttr(artUrl)+'" target="_top" onclick="'+pushSnippet+'">'
            + '<span class="det-art-left">'
            +   ART_ICON
            +   '<span class="det-art-title">'+escHtml(a.t)+'</span>'
            + '</span>'
            + (readTime ? '<span class="det-art-meta">'+escHtml(readTime)+'</span>' : '')
            + '</a>';
        }).join('')
      + '</div></div>';
  }

  /* Jump-nav removed 2026-05-21 per user feedback — the chip row felt
     redundant since users naturally scroll the card, and it added vertical
     weight between the hero and the first content section. Section IDs
     (#det-protocol, #det-evidence, #det-related, #det-sources, #det-pairings)
     remain intact for deep-linking from external pages or search. */

  /* "Compare with another" button removed 2026-05-19 per user feedback —
     was cluttering the top of the supplement card. Comparison guides are
     still surfaced contextually via loadCompares() further down the page.
     CSS rules at .det-compare-btn are now orphaned but harmless; left in
     place in case the button is reintroduced. */
  root.innerHTML =
    '<a class="det-back" href="search.html?q='+encodeURIComponent(s.n)+'">‹ Back to search</a>'
    + '<div class="det-page '+escAttr(s.t)+'">'

      // HERO V5
      + '<div class="det-hero">'
      +   '<div class="det-score-corner">'
      +     '<div class="det-score-lbl">Score</div>'
      +     '<div style="margin-top:2px"><span class="det-score-num">'+compScore+'</span><span class="det-score-suffix">/100</span></div>'
      +   '</div>'
      +   '<div class="det-hero-l">'
      +     '<div class="det-hero-tier-row"><span class="det-tier '+escAttr(s.t)+'">'+escHtml(meta.label)+'</span></div>'
      +     '<h1 class="det-h1">'+escHtml(s.n)+'</h1>'
      +     (catsHtml ? '<div class="det-cats">'+catsHtml+'</div>' : '')
      +     (tldr ? '<p class="det-tldr">'+escHtml(tldr)+'</p>' : '')
      +     '<div class="det-stats">'+statsHtml+'</div>'
      +     '<div class="det-bars">'+barsHtml+'</div>'
      +   '</div>'
      + '</div>'

      // Jump nav removed 2026-05-21 — see comment above the deleted
      // jumpLinks block. Going straight from hero into body now.

      // Body
      + '<div class="det-body">'

      +   alertHtml

      // Protocol
      +   (protocolRows
            ? '<div class="det-ref" id="det-protocol">'
              + '<div class="det-ref-head"><span class="det-ref-tag">Protocol</span><span class="det-ref-meta">'+escHtml(cycle)+'</span></div>'
              + protocolRows
              + '</div>'
            : '')

      // Evidence prose (full s.desc)
      +   (s.desc
            ? '<section class="det-prose" id="det-evidence"><h2 class="det-prose-h">What it is &amp; what the evidence says</h2><p>'+escHtml(s.desc)+'</p></section>'
            : '')

      // Pairings module (Treatment B pilot — Vitamin D3 only)
      +   pairingsHtml

      // Linked entities panel — only render if we have any
      +   ((meds.length || conds.length || bioms.length || s.tr || artiles.length)
            ? '<div class="det-rel" id="det-related">'
              + '<div class="det-rel-head"><span class="det-rel-tag">Interactions, stacking &amp; related entities</span></div>'
              + '<div class="det-rel-grid">'
              +   medsCellHtml
              +   condsCellHtml
              +   biomsCellHtml
              +   fourthCellHtml
              + '</div>'
              + '</div>'
            : '')

      +   sourcesHtml

      +   '<div id="det-compare-slot"></div>'
      +   '<div id="det-related-guides-slot"></div>'
      +   '<div id="det-brands-slot"></div>'

      +   '<p class="det-disclaim">Educational reference, not medical advice. See the <a href="about.html">methodology</a> for how scores are derived. Questions or corrections: <a href="mailto:hello@supplementscore.org">hello@supplementscore.org</a>.</p>'
      + '</div>'
    + '</div>';

  // Wire up the "Show N more" toggles in the related-entities cells. Each
  // button reveals its hidden sibling list and removes itself from view.
  // Uses inline style display so CSS specificity can't override it.
  root.querySelectorAll('.det-rel-more').forEach(function(btn){
    btn.addEventListener('click', function(){
      var t = document.getElementById(btn.dataset.target);
      if (t) t.style.display = '';
      btn.style.display = 'none';
    });
  });

  // ── Head-to-head comparisons layer ──────────────────────────────────────
  // Loads /data/comparisons.json and surfaces all comparisons that mention
  // this supplement. Sits above the Related guides block. Comparison entries
  // are no longer duplicated in the related-guides loader below.
  (function loadCompares(){
    var slot = document.getElementById('det-compare-slot');
    if (!slot) return;
    var name = (s.n || '').trim();
    if (!name) return;

    // Clean the supplement name down to its core ingredient phrase so that
    // names like "Ashwagandha (KSM-66)" or "Omega-3 (EPA/DHA)" can be matched
    // against comparison guides that just use the bare ingredient name.
    //   strip parenthetical clarifiers, trailing "/ alternates", and +/&
    function cleanName(n){
      return n.replace(/\([^)]*\)/g, ' ')
              .replace(/\s*\/.*$/, '')
              .replace(/[+&]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();
    }
    function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function norm(x){ return String(x).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

    var cleaned  = cleanName(name);
    if (!cleaned) return;
    var nameNorm = norm(name);
    var firstWord = cleaned.split(/\s+/)[0];

    // A comparison matches if either:
    //   (1) the cleaned name appears as a whole phrase in the haystack
    //   (2) the supplement's first significant word (≥4 chars) appears, which
    //       catches Latin binomials ("Rhodiola rosea") and substring fits
    //       ("Folate" → "Methylfolate vs Folic Acid")
    function matchesHay(hay){
      if (new RegExp('\\b' + reEsc(cleaned) + '\\b', 'i').test(hay)) return true;
      if (firstWord.length >= 4) {
        if (new RegExp('\\b' + reEsc(firstWord) + '\\b', 'i').test(hay)) return true;
        if (firstWord.length >= 5 && hay.indexOf(firstWord) !== -1) return true;
      }
      return false;
    }

    // Comparisons are loaded via <script src="data/comparisons.js?v=20260521"> in the
    // <head>, which exposes window.SS_COMPARISONS synchronously. This works
    // identically on file:// (where fetch is blocked), local dev servers,
    // and production. The fetch fallback below covers the edge case where
    // the script tag is removed or fails to load.
    function renderFromDb(db){
      if (!db || !db.comparisons) return;
      var matches = db.comparisons.map(function(c){
        // Hyphens in slugs are normalised to spaces so word boundaries work
        var hay = (c.title + ' ' + c.href + ' ' + (c.sides || []).join(' '))
                    .toLowerCase().replace(/-/g, ' ');
        if (!matchesHay(hay)) return null;
        // Identify partner(s): sides that don't themselves match this supplement.
        var partners = (c.sides || []).filter(function(side){
          var sn = norm(side);
          if (sn === nameNorm) return false;
          if (sn.indexOf(nameNorm) !== -1 || nameNorm.indexOf(sn) !== -1) return false;
          // Also skip sides that share the cleaned name (e.g. "Magnesium glycinate")
          if (sn.indexOf(cleaned) !== -1 || cleaned.indexOf(sn) !== -1) return false;
          return true;
        });
        return { href: c.href, title: c.title, topic: c.topic, kind: c.kind, partners: partners, sides: c.sides || [] };
      }).filter(Boolean);
      if (!matches.length) return;

      // Sort: binary first (more direct), then multi-form. Within each, the
      // comparisons whose primary topic appears highest in the page's interest
      // would be ideal — but we don't have that signal yet, so just stable
      // by source order.
      matches.sort(function(a,b){
        if (a.kind !== b.kind) return a.kind === 'binary' ? -1 : 1;
        return 0;
      });

      // Cap to 8 to keep the section compact
      var capped = matches.slice(0, 8);

      function escHtml(s){ var d=document.createElement('div'); d.textContent=String(s||''); return d.innerHTML; }
      // Pull the subtitle from the title after an em-dash, if present
      function subtitle(title){
        var m = String(title).split(/\s+[—–]\s+/);
        return m.length > 1 ? m.slice(1).join(' — ') : '';
      }

      var rows = capped.map(function(m){
        var partnerLbl;
        if (m.kind === 'multi') {
          // Multi-form: show "All N forms compared" or list the other sides briefly
          if (m.sides.length >= 3) {
            partnerLbl = 'all ' + m.sides.length + ' forms compared';
          } else {
            partnerLbl = m.partners.join(', ') || m.sides.join(' vs ');
          }
        } else {
          partnerLbl = m.partners[0] || m.sides.filter(function(x){ return norm(x) !== nameNorm; })[0] || m.sides[0] || '';
        }
        var sub = subtitle(m.title);
        var topicHtml = m.topic && m.topic !== 'Other' ? ' · ' + escHtml(m.topic) : '';
        return ''
          + '<a class="dr-link dc-link" href="' + escHtml(m.href) + '">'
          +   '<span class="dc-vs" aria-hidden="true">vs</span>'
          +   '<span class="dr-body">'
          +     '<span class="dr-title">' + escHtml(partnerLbl) + '</span>'
          +     (sub ? '<span class="dc-sub">' + escHtml(sub) + topicHtml + '</span>'
                    : (m.topic && m.topic !== 'Other' ? '<span class="dc-sub">' + escHtml(m.topic) + '</span>' : ''))
          +   '</span>'
          +   '<svg class="dr-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>'
          + '</a>';
      }).join('');

      // Section footer surfaces a link to the full /compare/ index (the
      // existing guides directory, pre-filtered by this supplement's name)
      // ONLY when more matches exist than we're showing inline. Never links
      // out to the two-supplement search tool — this section is strictly a
      // directory of already-written comparison guides.
      var more = matches.length > capped.length
        ? '<div class="dc-foot"><a class="dc-foot-more" href="compare/index.html#q=' + encodeURIComponent(name) + '">See all ' + matches.length + ' comparison guides →</a></div>'
        : '';

      slot.innerHTML =
        '<section class="det-related-guides det-compare">'
        + '<div class="dr-head">'
        +   '<span class="dr-tag">Head-to-head comparisons</span>'
        +   '<span class="dr-meta">' + matches.length + ' guide' + (matches.length>1?'s':'') + ' mention ' + escHtml(name) + '</span>'
        + '</div>'
        + '<div class="dr-list">' + rows + '</div>'
        + more
        + '</section>';
    }

    // Primary path: the script-tag-loaded global. Synchronous, works on
    // file://, no fetch / CORS issues.
    if (window.SS_COMPARISONS) {
      renderFromDb(window.SS_COMPARISONS);
      return;
    }

    // Fallback: try fetching the JSON. Useful if comparisons.js was removed
    // for some reason but comparisons.json is still served.
    fetch('data/comparisons.json').then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(renderFromDb).catch(function(err){
      try { console.warn('[compare] comparisons data unavailable:', err && err.message || err); } catch(_){}
    });
  })();

  // ── Related guides layer (Direction C, 2026-05-02) ─────────────────────
  // Surfaces relevant /compare/ and /condition/ deep-dive guides on the supplement detail page.
  (function loadRelatedGuides(){
    var slot = document.getElementById('det-related-guides-slot');
    if (!slot) return;
    var name = (s.n || '').toLowerCase();
    var matches = [];

    // Comparison guides are now surfaced by the loadCompares() module above,
    // which sources from /data/comparisons.json (full set of 76 guides).
    // This block only handles condition deep-dives.

    // Condition deep-dives — keyword set per protocol
    var CONDITIONS = [
      { href:'condition/anxiety-stack.html',        title:'The 2026 anxiety supplement stack', keys:['ashwagandha','l-theanine','theanine','magnesium glycinate','saffron','glycine','melatonin','lemon balm'] },
      { href:'condition/migraine-prevention.html',  title:'Migraine prevention stack',         keys:['riboflavin','coq10','feverfew','magnesium'] },
      { href:'condition/pcos-protocol.html',        title:'PCOS supplement protocol',          keys:['inositol','myo-inositol','d-chiro','berberine','spearmint'] },
      { href:'condition/prediabetes-protocol.html', title:'Pre-diabetes supplement protocol',  keys:['berberine','inositol','alpha-lipoic','psyllium','beta-glucan','cinnamon','chromium'] },
      { href:'condition/perimenopause-stack.html',  title:'Perimenopause hot-flash protocol',  keys:['black cohosh','soy isoflavone','equol','vitamin e','vitamin d3','vitamin k2'] },
      { href:'condition/hypothyroidism-stack.html', title:'Hypothyroidism supplement stack',   keys:['selenium','levothyroxine'] },
      { href:'condition/prostate-health.html',      title:'Prostate health protocol',          keys:['saw palmetto','beta-sitosterol','pygeum','lycopene'] },
      { href:'condition/gout-protocol.html',        title:'Gout supplement protocol',          keys:['tart cherry','vitamin c'] },
      { href:'condition/ibs-protocol.html',         title:'IBS supplement protocol',           keys:['peppermint oil','psyllium','saccharomyces boulardii','bifidobacterium lactis'] },
      { href:'condition/gerd-protocol.html',        title:'GERD supplement protocol',          keys:['alginate','dgl','melatonin','slippery elm','marshmallow root'] },
      { href:'condition/chronic-constipation.html', title:'Chronic constipation protocol',     keys:['psyllium','magnesium oxide','bifidobacterium lactis hn019'] },
      { href:'condition/eczema-stack.html',         title:'Eczema (atopic dermatitis) stack',  keys:['lactobacillus rhamnosus','vitamin d3','evening primrose','borage'] },
      { href:'condition/long-covid-evidence.html',  title:'Long COVID supplement evidence',    keys:['coq10','ubiquinol','omega-3'] },
      { href:'condition/me-cfs-evidence.html',      title:'ME-CFS supplement evidence',        keys:['coq10','nadh','d-ribose','l-carnitine','acetyl-l-carnitine'] },
      { href:'condition/gallstone-prevention.html', title:'Gallstone prevention',              keys:['vitamin c','ursodeoxycholic'] }
    ];
    var seen = {};
    CONDITIONS.forEach(function(c){
      if (c.keys.some(function(k){ return name.indexOf(k) !== -1; })) {
        if (!seen[c.href]) { matches.push({ href: c.href, title: c.title, kind: 'condition' }); seen[c.href] = true; }
      }
    });

    if (!matches.length) return;
    var rows = matches.map(function(m){
      var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
      return '<a class="dr-link" href="' + m.href + '"><span class="dr-icon">' + icon + '</span><span class="dr-body"><span class="dr-kind">Condition deep-dive</span><span class="dr-title">' + escHtml(m.title) + '</span></span><svg class="dr-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></a>';
    }).join('');
    slot.innerHTML =
      '<section class="det-related-guides">'
      + '<div class="dr-head">'
      +   '<span class="dr-tag">Condition deep-dives</span>'
      +   '<span class="dr-meta">' + matches.length + ' protocol' + (matches.length>1?'s':'') + ' that use this supplement</span>'
      + '</div>'
      + '<div class="dr-list">' + rows + '</div>'
      + '</section>';
  })();

  // ── Brand-quality layer (Direction C, 2026-05-02) ───────────────────────
  // Loads /data/brands.json and renders verified-tested products for this supplement.
  // Source-of-truth disclaimer: SupplementScore receives no compensation. See brands.json _meta.policy.
  (function loadBrands(){
    var slot = document.getElementById('det-brands-slot');
    if (!slot) return;
    fetch('data/brands.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(db){
      if (!db) return;
      // Key fallback chain. Most data.js supplement names include a parenthesized
      // qualifier ("Omega-3 (EPA/DHA)", "Saffron (Crocus sativus)") that early
      // brands.json keys ("omega-3", "saffron") don't include — so without a paren
      // strip those existing entries are silently orphaned. New 2026-05-28
      // entries use the full lowercase name; this chain lets both shapes resolve.
      // See [[project_brands_json_key_mismatch]].
      var raw = (s.n||'').toLowerCase().trim();
      var paren_stripped = raw.replace(/\s*\([^)]*\)\s*/g,'').trim();
      var candidates = [
        raw,                                  // "omega-3 (epa/dha)"     — new entries
        paren_stripped,                       // "omega-3"                — legacy entries
        raw.replace(/-/g,' '),                // "omega 3 (epa/dha)"      — hyphen→space
        raw.replace(/\s+/g,'-'),              // "omega-3-(epa/dha)"      — space→hyphen
        paren_stripped.replace(/-/g,' '),     // "omega 3"
        paren_stripped.replace(/\s+/g,'-')    // also covers some malformed keys
      ];
      var entries = null;
      for (var ci = 0; ci < candidates.length && !entries; ci++) {
        if (candidates[ci]) entries = db[candidates[ci]];
      }
      if (!entries || !entries.length) return;
      var rows = entries.map(function(b){
        var verified = (b.verified||[]).map(function(v){
          return '<span class="bq-v">'+escHtml(v)+'</span>';
        }).join('');
        // Strip "N servings" from size; keep any parenthetical weight (e.g. "90 servings (450g)" → "450g").
        var sz = (b.size||'').trim();
        var srvParen = sz.match(/^\d+(?:\.\d+)?\s*servings?\s*\((.+)\)\s*$/i);
        if (srvParen) { sz = srvParen[1]; }
        else { sz = sz.replace(/^\d+(?:\.\d+)?\s*servings?\s*/i, '').trim(); }
        var formSize = [b.form, sz].filter(Boolean).join(' · ');
        var sub = [formSize, b.notes].filter(Boolean).join(' — ');
        return ''
          + '<div class="bq-row">'
          +   '<div class="bq-row-head">'
          +     '<div class="bq-name">'+escHtml(b.brand)+'</div>'
          +     '<div class="bq-verified">'+verified+'</div>'
          +   '</div>'
          +   (sub ? '<div class="bq-sub">'+escHtml(sub)+'</div>' : '')
          + '</div>';
      }).join('');
      slot.innerHTML =
        '<section class="det-bq" id="det-brands">'
        + '<div class="bq-head">'
        +   '<span class="bq-tag">Verified brands</span>'
        +   '<span class="bq-meta">Third-party-tested · no affiliate links</span>'
        + '</div>'
        + '<div class="bq-list">'+rows+'</div>'
        + '<p class="bq-foot">Listings are public certifier registries (NSF, USP, ConsumerLab, LabDoor, IFOS) as of 2026-05-02. We earn nothing from any listed product. <a href="about.html#funding">Read our funder policy</a>.</p>'
        + '</section>';
    }).catch(function(){ /* silent — non-essential */ });
  })();
})();
