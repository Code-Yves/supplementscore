/* Interaction checker. Reads #ix-data on /interactions/. No tracking. */
(function () {
  var node = document.getElementById('ix-data');
  if (!node) return;
  var data;
  try { data = JSON.parse(node.textContent); } catch (e) { return; }

  var sevMeta = {
    avoid: 'Do not combine on your own',
    caution: 'Ask before you combine',
    separate: 'Separate the doses',
    labs: 'Can skew a lab test',
    monitor: 'A reason to check levels'
  };
  var sevRank = { avoid: 1, caution: 2, separate: 3, labs: 4, monitor: 5 };

  var medBox = document.getElementById('ix-meds');
  var supBox = document.getElementById('ix-sups');
  var medQ = document.getElementById('ix-med-q');
  var supQ = document.getElementById('ix-sup-q');
  var selectedEl = document.getElementById('ix-selected');
  var resultsEl = document.getElementById('ix-results');
  if (!medBox || !supBox || !resultsEl) return;

  var medOn = {};
  var supOn = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var supplements = [];
  var seenSup = {};
  (data.interactions || []).forEach(function (row) {
    (row.supplements || []).forEach(function (s) {
      if (!seenSup[s.slug]) {
        seenSup[s.slug] = true;
        supplements.push(s);
      }
    });
  });
  supplements.sort(function (a, b) { return a.name.localeCompare(b.name); });

  function choiceText(c) {
    return (c.label + ' ' + (c.aliases || []).join(' ')).toLowerCase();
  }

  function renderPicks() {
    var mq = (medQ && medQ.value || '').trim().toLowerCase();
    var sq = (supQ && supQ.value || '').trim().toLowerCase();
    var meds = (data.choices || []).filter(function (c) {
      return !mq || choiceText(c).indexOf(mq) !== -1 || c.label.toLowerCase().indexOf(mq) !== -1;
    });
    medBox.innerHTML = meds.map(function (c) {
      var on = medOn[c.id] ? ' aria-pressed="true" class="on"' : ' aria-pressed="false"';
      return '<button type="button" data-med="' + esc(c.id) + '"' + on + '>' + esc(c.label) + '</button>';
    }).join('') || '<p class="ix-empty">No medicine matches that search.</p>';
    var sups = supplements.filter(function (s) {
      return !sq || s.name.toLowerCase().indexOf(sq) !== -1;
    });
    supBox.innerHTML = sups.map(function (s) {
      var on = supOn[s.slug] ? ' aria-pressed="true" class="on"' : ' aria-pressed="false"';
      return '<button type="button" data-sup="' + esc(s.slug) + '"' + on + '>' + esc(s.name) + '</button>';
    }).join('') || '<p class="ix-empty">No supplement matches that search.</p>';
  }

  function activeClasses() {
    var set = {};
    (data.choices || []).forEach(function (c) {
      if (!medOn[c.id]) return;
      (c.classes || []).forEach(function (id) { set[id] = true; });
    });
    return set;
  }

  function cardHtml(row) {
    var links = (row.supplements || []).map(function (s) {
      var mark = supOn[s.slug] ? ' ix-hit' : '';
      return '<a class="ix-supp' + mark + '" href="/supplement/' + esc(s.slug) + '.html">' + esc(s.name) + '</a>';
    }).join('');
    var sources = (row.sources || []).map(function (src) {
      return '<li><a href="' + esc(src.url) + '" rel="noopener noreferrer">' + esc(src.label) + '</a> <span class="ix-kind">' + esc(src.kind) + '</span></li>';
    }).join('');
    return '<article class="ix-card ix-' + esc(row.severity) + '">'
      + '<p class="ix-sev">' + esc(sevMeta[row.severity] || row.severity) + '</p>'
      + '<h3>' + esc(row.title) + '</h3>'
      + '<p>' + esc(row.explanation) + '</p>'
      + '<p class="ix-supps">' + links + '</p>'
      + '<ol class="ix-sources">' + sources + '</ol>'
      + '</article>';
  }

  function renderResults() {
    var classes = activeClasses();
    var classIds = Object.keys(classes);
    var supIds = Object.keys(supOn);
    var chips = [];
    (data.choices || []).forEach(function (c) {
      if (medOn[c.id]) chips.push('<button type="button" class="ix-chip" data-clear-med="' + esc(c.id) + '">' + esc(c.label) + ' <span aria-hidden="true">×</span></button>');
    });
    supplements.forEach(function (s) {
      if (supOn[s.slug]) chips.push('<button type="button" class="ix-chip" data-clear-sup="' + esc(s.slug) + '">' + esc(s.name) + ' <span aria-hidden="true">×</span></button>');
    });
    selectedEl.innerHTML = chips.length
      ? chips.join('') + '<button type="button" class="ix-clear" id="ix-clear-all">Clear</button>'
      : '';

    if (!classIds.length && !supIds.length) {
      resultsEl.innerHTML = '<p class="ix-prompt">Pick at least one medicine or supplement. The pages further down are the same lists, written out for search engines and for phones with scripts off.</p>';
      return;
    }

    var rows = (data.interactions || []).filter(function (row) {
      var classHit = !classIds.length || (row.classes || []).some(function (id) { return classes[id]; });
      var supHit = !supIds.length || (row.supplements || []).some(function (s) { return supOn[s.slug]; });
      return classHit && supHit;
    });
    rows.sort(function (a, b) {
      return (sevRank[a.severity] || 9) - (sevRank[b.severity] || 9);
    });

    if (!rows.length) {
      resultsEl.innerHTML = '<div class="ix-none" role="status"><p><strong>No cited interaction in this checker for that combination.</strong></p><p>That is not a safety clearance. Many real interactions are not on this list because we only publish a pair when we can point at a public source. Ask a pharmacist before you combine them.</p></div>';
      return;
    }
    resultsEl.innerHTML = '<h2 class="ix-results-h">' + rows.length + (rows.length === 1 ? ' cited flag' : ' cited flags') + '</h2>' + rows.map(cardHtml).join('');
  }

  function paint() {
    renderPicks();
    renderResults();
  }

  document.getElementById('checker').addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'ix-clear-all') {
      medOn = {};
      supOn = {};
      paint();
      return;
    }
    if (t.hasAttribute('data-med')) {
      var id = t.getAttribute('data-med');
      if (medOn[id]) delete medOn[id]; else medOn[id] = true;
      paint();
      return;
    }
    if (t.hasAttribute('data-sup')) {
      var slug = t.getAttribute('data-sup');
      if (supOn[slug]) delete supOn[slug]; else supOn[slug] = true;
      paint();
      return;
    }
    if (t.hasAttribute('data-clear-med')) {
      delete medOn[t.getAttribute('data-clear-med')];
      paint();
      return;
    }
    if (t.hasAttribute('data-clear-sup')) {
      delete supOn[t.getAttribute('data-clear-sup')];
      paint();
    }
  });

  if (medQ) medQ.addEventListener('input', renderPicks);
  if (supQ) supQ.addEventListener('input', renderPicks);

  function fromHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return;
    var q = new URLSearchParams(raw);
    var s = q.get('s');
    var d = q.get('d');
    if (s && seenSup[s]) supOn[s] = true;
    if (d) {
      (data.choices || []).forEach(function (c) {
        if (c.id === d) medOn[c.id] = true;
      });
      (data.pages || []).forEach(function (p) {
        if (p.slug === d) {
          (data.choices || []).forEach(function (c) {
            if (c.id === p.slug || (p.classes || []).indexOf(c.id) !== -1) {
              /* prefer an explicit choice whose id matches the page slug */
            }
          });
          var chip = (data.choices || []).find(function (c) { return c.id === p.slug; });
          if (!chip) {
            (data.choices || []).forEach(function (c) {
              if ((c.classes || []).some(function (id) { return (p.classes || []).indexOf(id) !== -1; }) && c.kind === 'class' && (c.classes || []).join() === (p.classes || []).join()) {
                medOn[c.id] = true;
              }
            });
          }
        }
      });
    }
  }
  fromHash();
  paint();
})();
