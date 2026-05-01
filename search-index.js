/* SupplementScore — universal search index.
 *
 * Reads top-level const bindings from data.js (S, CONDITIONS, MEDS,
 * BIOMARKERS, ARTICLES_BY_ID, ARTICLE_MAP, TM). In browsers, separate
 * <script> tags in the same realm share the script-scope, so bare
 * references resolve fine. typeof guards keep this safe if data.js
 * failed to load.
 *
 * Exposes window.SS with search() and per-type lookups + helpers.
 */
(function () {
  'use strict';

  // --- safe readers (return defaults if a binding is missing) ---
  function _S()              { try { return (typeof S              !== 'undefined') ? S              : []; } catch (_) { return []; } }
  function _CONDITIONS()     { try { return (typeof CONDITIONS     !== 'undefined') ? CONDITIONS     : {}; } catch (_) { return {}; } }
  function _MEDS()           { try { return (typeof MEDS           !== 'undefined') ? MEDS           : {}; } catch (_) { return {}; } }
  function _BIOMARKERS()     { try { return (typeof BIOMARKERS     !== 'undefined') ? BIOMARKERS     : {}; } catch (_) { return {}; } }
  function _ARTICLES_BY_ID() { try { return (typeof ARTICLES_BY_ID !== 'undefined') ? ARTICLES_BY_ID : {}; } catch (_) { return {}; } }
  function _ARTICLE_MAP()    { try { return (typeof ARTICLE_MAP    !== 'undefined') ? ARTICLE_MAP    : {}; } catch (_) { return {}; } }
  function _TM()             { try { return (typeof TM             !== 'undefined') ? TM             : null; } catch (_) { return null; } }

  function slugify(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function urlFor(type, key) {
    var k = encodeURIComponent(key);
    if (type === 'article')    return 'article.html?id='     + k;
    if (type === 'supplement') return 'supplement.html?slug=' + k;
    if (type === 'condition')  return 'condition.html?slug='  + k;
    if (type === 'medication') return 'medication.html?slug=' + k;
    if (type === 'biomarker')  return 'biomarker.html?slug='  + k;
    return '#';
  }

  function score(text, q) {
    if (!text || !q) return 0;
    text = String(text).toLowerCase();
    q = String(q).toLowerCase();
    if (text === q) return 100;
    if (text.startsWith(q)) return 80;
    var words = text.split(/[\s/()\-,]+/);
    if (words.some(function (w) { return w.startsWith(q); })) return 60;
    if (text.indexOf(q) >= 0) return 40;
    return 0;
  }

  function combinedScore(parts, q) {
    var tokens = String(q).toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0;
    var totals = parts.map(function (p) {
      var t = p.text || '';
      var w = p.weight || 1;
      var local = score(t, q) * w;
      var tokSum = tokens.reduce(function (acc, tk) {
        var s = score(t, tk);
        return acc + (s > 0 ? s * 0.5 : 0);
      }, 0);
      return Math.max(local, tokSum * w * 0.4);
    });
    return Math.max.apply(null, totals);
  }

  function search(q, opts) {
    q = String(q == null ? '' : q).trim();
    opts = opts || {};
    var perType = opts.limit || 3;
    var out = { supplements: [], conditions: [], medications: [], biomarkers: [], articles: [] };
    if (q.length < 1) return out;

    // Supplements
    var sBuf = [];
    _S().forEach(function (s, i) {
      var sc = combinedScore([
        { text: s.n,    weight: 1.0 },
        { text: s.tag,  weight: 0.7 },
        { text: s.desc, weight: 0.35 },
        { text: s.dose, weight: 0.25 }
      ], q);
      if (sc > 0) {
        sBuf.push({
          type: 'supplement', slug: slugify(s.n), name: s.n,
          tag: s.tag || '', tier: s.t, idx: i, score: sc, ref: s
        });
      }
    });
    sBuf.sort(function (a, b) { return b.score - a.score; });
    out.supplements = sBuf.slice(0, perType);

    // Conditions
    var cBuf = [];
    var COND = _CONDITIONS();
    Object.keys(COND).forEach(function (k) {
      var c = COND[k];
      var sc = combinedScore([
        { text: c.label, weight: 1.0 },
        { text: k,       weight: 0.6 },
        { text: (c.supps || []).join(' '), weight: 0.25 }
      ], q);
      if (sc > 0) cBuf.push({ type: 'condition', slug: k, name: c.label, score: sc, ref: c });
    });
    cBuf.sort(function (a, b) { return b.score - a.score; });
    out.conditions = cBuf.slice(0, perType);

    // Medications
    var mBuf = [];
    var MED = _MEDS();
    Object.keys(MED).forEach(function (k) {
      var m = MED[k];
      var sc = combinedScore([
        { text: m.label, weight: 1.0 },
        { text: k,       weight: 0.6 },
        { text: m.note,  weight: 0.4 },
        { text: (m.avoid   || []).join(' '), weight: 0.2 },
        { text: (m.caution || []).join(' '), weight: 0.2 }
      ], q);
      if (sc > 0) mBuf.push({ type: 'medication', slug: k, name: m.label, score: sc, ref: m });
    });
    mBuf.sort(function (a, b) { return b.score - a.score; });
    out.medications = mBuf.slice(0, perType);

    // Biomarkers
    var bBuf = [];
    var BIO = _BIOMARKERS();
    Object.keys(BIO).forEach(function (k) {
      var b = BIO[k];
      var sc = combinedScore([
        { text: b.name, weight: 1.0 },
        { text: k,      weight: 0.6 },
        { text: b.desc, weight: 0.4 }
      ], q);
      if (sc > 0) bBuf.push({ type: 'biomarker', slug: k, name: b.name, score: sc, ref: b });
    });
    bBuf.sort(function (a, b) { return b.score - a.score; });
    out.biomarkers = bBuf.slice(0, perType);

    // Articles (titles only)
    var aBuf = [];
    var ART = _ARTICLES_BY_ID();
    Object.keys(ART).forEach(function (id) {
      var a = ART[id]; if (!a) return;
      var sc = combinedScore([
        { text: a.t || '', weight: 1.0 },
        { text: a.c || '', weight: 0.4 }
      ], q);
      if (sc > 0) aBuf.push({ type: 'article', slug: id, id: id, name: a.t, category: a.c, score: sc, ref: a });
    });
    aBuf.sort(function (a, b) { return b.score - a.score; });
    out.articles = aBuf.slice(0, perType);

    return out;
  }

  function getSupplement(slug) {
    var t = String(slug || '').toLowerCase();
    return _S().find(function (s) { return slugify(s.n) === t; }) || null;
  }
  function getCondition(slug)  { return _CONDITIONS()[slug] || null; }
  function getMedication(slug) { return _MEDS()[slug] || null; }
  function getBiomarker(slug)  { return _BIOMARKERS()[slug] || null; }
  function getArticle(id) {
    var A = _ARTICLES_BY_ID();
    return A[id] || A[String(id)] || null;
  }

  // Reverse lookups
  function conditionsForSupplement(name) {
    var C = _CONDITIONS();
    return Object.keys(C).filter(function (k) {
      return (C[k].supps || []).indexOf(name) >= 0;
    }).map(function (k) { return { slug: k, name: C[k].label }; });
  }
  function medsForSupplement(name) {
    var M = _MEDS();
    var hits = [];
    Object.keys(M).forEach(function (k) {
      var m = M[k];
      var bucket = null;
      if      ((m.avoid   || []).indexOf(name) >= 0) bucket = 'avoid';
      else if ((m.caution || []).indexOf(name) >= 0) bucket = 'caution';
      else if ((m.extra   || []).indexOf(name) >= 0) bucket = 'extra';
      if (bucket) hits.push({ slug: k, name: m.label, bucket: bucket });
    });
    return hits;
  }
  function articlesForSupplement(name) {
    return _ARTICLE_MAP()[name] || [];
  }
  function biomarkersForSupplement(name) {
    var B = _BIOMARKERS();
    var hits = [];
    Object.keys(B).forEach(function (k) {
      if ((B[k].supps || []).some(function (x) { return x.name === name; })) {
        hits.push({ slug: k, name: B[k].name });
      }
    });
    return hits;
  }

  function tierMeta(tid) {
    var TM = _TM();
    if (TM && TM[tid]) return TM[tid];
    var fallback = {
      t1: { id: 't1', label: 'Tier 1 — Strong Evidence',         badge: 'Effective' },
      t2: { id: 't2', label: 'Tier 2 — Promising / Situational', badge: 'Promising' },
      t3: { id: 't3', label: 'Tier 3 — Trending',                badge: 'Trending'  },
      t4: { id: 't4', label: 'Tier 4 — Risky / Avoid',           badge: 'Risky'     }
    };
    return fallback[tid] || { id: tid, label: tid, badge: '' };
  }

  function compositeScore(s) {
    if (!s) return 0;
    return (s.e || 0) * 7 + (s.s || 0) * 4 + (s.r || 0) * 3 + (s.o || 0) * 2 + (s.c || 0) * 2 + (s.d || 0) * 2;
  }

  // ARTICLE_MAP is read by article.html for reverse lookups; expose it so
  // callers don't need to repeat the typeof guard.
  function getArticleMap() { return _ARTICLE_MAP(); }

  window.SS = {
    slugify: slugify,
    urlFor: urlFor,
    search: search,
    getSupplement: getSupplement,
    getCondition: getCondition,
    getMedication: getMedication,
    getBiomarker: getBiomarker,
    getArticle: getArticle,
    getArticleMap: getArticleMap,
    conditionsForSupplement: conditionsForSupplement,
    medsForSupplement: medsForSupplement,
    articlesForSupplement: articlesForSupplement,
    biomarkersForSupplement: biomarkersForSupplement,
    tierMeta: tierMeta,
    compositeScore: compositeScore
  };
})();
