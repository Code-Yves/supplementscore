/* SupplementScore — universal nav search autocomplete.
 * Hooks the input #nav-search-inp + dropdown #nav-ac on any page.
 * Requires window.SS (search-index.js) and the data globals it depends on.
 */
(function () {
  'use strict';
  var input = document.getElementById('nav-search-inp');
  var ac    = document.getElementById('nav-ac');
  if (!input || !ac) return;

  var debounceTimer = null;
  var items = [];      // flat list, in dropdown order
  var focusIdx = -1;
  var lastQ = '';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function close() {
    ac.classList.remove('open');
    focusIdx = -1;
  }
  function open() { ac.classList.add('open'); }

  var TYPE_LABEL = {
    supplement: 'Supplements',
    condition:  'Conditions',
    medication: 'Medications',
    biomarker:  'Biomarkers',
    article:    'Articles'
  };

  function tagFor(item) {
    if (item.type === 'supplement') {
      return (item.tag || '').split(' · ')[0] || 'Supplement';
    }
    if (item.type === 'condition')  return 'Condition';
    if (item.type === 'medication') return 'Medication';
    if (item.type === 'biomarker')  return 'Lab test';
    if (item.type === 'article')    return (item.category || 'Article').replace(/^\w/, function(c){return c.toUpperCase();});
    return '';
  }

  function tierBadge(tid) {
    if (!tid) return '';
    var meta = window.SS && window.SS.tierMeta ? window.SS.tierMeta(tid) : null;
    var label = meta ? meta.badge : tid.toUpperCase();
    return '<span class="nav-ac-tier nav-ac-tier-' + tid + '">' + escapeHtml(label) + '</span>';
  }

  function render(q) {
    if (!window.SS) {
      ac.innerHTML = '<div class="nav-ac-empty">Search index loading…</div>';
      open();
      return;
    }
    var r = window.SS.search(q, { limit: 3 });
    var groups = ['supplement', 'condition', 'medication', 'biomarker', 'article']
      .map(function (t) {
        var arr = r[t === 'supplement' ? 'supplements'
                  : t === 'condition'  ? 'conditions'
                  : t === 'medication' ? 'medications'
                  : t === 'biomarker'  ? 'biomarkers'
                  : 'articles'];
        return { type: t, label: TYPE_LABEL[t], items: arr };
      })
      .filter(function (g) { return g.items.length > 0; });

    items = [];
    if (groups.length === 0) {
      ac.innerHTML = '<div class="nav-ac-empty">No matches for &ldquo;<b>' + escapeHtml(q) + '</b>&rdquo;</div>'
        + '<a class="nav-ac-foot" href="search.html?q=' + encodeURIComponent(q) + '"><kbd>↵</kbd>&nbsp; Search the full index for &ldquo;' + escapeHtml(q) + '&rdquo;</a>';
      open();
      return;
    }

    var html = '';
    groups.forEach(function (g) {
      html += '<div class="nav-ac-group"><div class="nav-ac-grp-h">' + escapeHtml(g.label) + '</div>';
      g.items.forEach(function (i) {
        items.push(i);
        var url = window.SS.urlFor(i.type, i.slug);
        var tier = i.type === 'supplement' ? tierBadge(i.tier) : '';
        html += '<a class="nav-ac-item" href="' + url + '" data-idx="' + (items.length - 1) + '">'
              +   '<span class="nav-ac-name">' + tier + '<span>' + escapeHtml(i.name) + '</span></span>'
              +   '<span class="nav-ac-tag">' + escapeHtml(tagFor(i)) + '</span>'
              + '</a>';
      });
      html += '</div>';
    });
    html += '<a class="nav-ac-foot" href="search.html?q=' + encodeURIComponent(q) + '"><kbd>↵</kbd>&nbsp; See all results for &ldquo;' + escapeHtml(q) + '&rdquo;</a>';
    ac.innerHTML = html;
    focusIdx = -1;
    open();
  }

  function paintFocus() {
    var els = ac.querySelectorAll('.nav-ac-item');
    [].forEach.call(els, function (el, i) {
      if (i === focusIdx) el.classList.add('focus');
      else el.classList.remove('focus');
    });
    var el = ac.querySelector('.nav-ac-item.focus');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', function () {
    var q = input.value.trim();
    if (q === lastQ) return;
    lastQ = q;
    clearTimeout(debounceTimer);
    if (!q) { close(); return; }
    debounceTimer = setTimeout(function () { render(q); }, 70);
  });

  input.addEventListener('focus', function () {
    var q = input.value.trim();
    if (q) render(q);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!ac.classList.contains('open')) {
        var q = input.value.trim();
        if (q) render(q);
      }
      focusIdx = Math.min(focusIdx + 1, items.length - 1);
      paintFocus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusIdx = Math.max(focusIdx - 1, -1);
      paintFocus();
    } else if (e.key === 'Enter') {
      if (focusIdx >= 0 && items[focusIdx]) {
        e.preventDefault();
        var it = items[focusIdx];
        // Supplement results route through the modal when it's loaded on this page
        if (it.type === 'supplement' && window.SSModal && typeof window.SSModal.open === 'function') {
          close();
          input.blur();
          window.SSModal.open(it.slug);
        } else {
          location.href = window.SS.urlFor(it.type, it.slug);
        }
      }
      // else default form submit handler in each page (navSearch) routes to search.html?q=
    } else if (e.key === 'Escape') {
      close();
      input.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !ac.contains(e.target)) close();
  });

  // Override navSearch globally to always route to search.html?q=
  window.navSearch = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var q = (input.value || '').trim();
    if (!q) return false;
    location.href = 'search.html?q=' + encodeURIComponent(q);
    return false;
  };
})();

/* Live counter for the top beta-bar — gives the bar a subtle "always updating"
   feel. Base count anchored to a known epoch (in studies/72h). The number drifts
   up at the long-run rate of new reviews, so refreshes a day later look plausibly
   larger; idle ticks while the tab is visible let it breathe in real time. Pauses
   when the tab is hidden. Runs on every page that includes nav-search.js AND has
   <span id="ss-live-count">. */
(function () {
  var el = document.getElementById('ss-live-count');
  if (!el) return;
  var EPOCH = Date.UTC(2026, 3, 27, 12, 0, 0); // 2026-04-27 12:00 UTC, month 0-indexed
  var BASE = 1247;
  var RATE_PER_HOUR = 14;
  function fmt(n) { return n.toLocaleString('en-US'); }
  function currentCount() {
    var hours = (Date.now() - EPOCH) / 3600000;
    return Math.max(BASE, Math.round(BASE + hours * RATE_PER_HOUR));
  }
  var n = currentCount();
  el.textContent = fmt(n);
  setInterval(function () {
    if (document.hidden) return;
    if (Math.random() < 0.35) {
      n += 1;
      el.textContent = fmt(n);
    }
  }, 9000);
})();
