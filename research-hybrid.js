/* Research listing hybrid for /#research only.
   Sections when the viewport is at least 768px, Type is All, and search is
   empty. The width switch is CSS. This file only sets .mode-sections. */
(function () {
  var root = document.getElementById('rh-root');
  if (!root) return;

  var TYPES = [
    ['all', 'All'],
    ['quickread', 'Top 10 Lists'],
    ['guide', 'Guide'],
    ['breakthrough', 'Breakthrough'],
    ['kids', 'Kids'],
    ['myth', 'Reality Check'],
    ['safety', 'Safety Alert'],
    ['research-update', 'Research Update'],
    ['condition', 'Condition'],
    ['stack', 'Stack']
  ];
  var SORTS = [
    ['new', 'Newest'],
    ['old', 'Oldest'],
    ['short', 'Shortest read'],
    ['az', 'A–Z']
  ];
  var TYPE_LABEL = {};
  TYPES.forEach(function (pair) { TYPE_LABEL[pair[0]] = pair[1]; });
  var SORT_LABEL = {};
  SORTS.forEach(function (pair) { SORT_LABEL[pair[0]] = pair[1]; });
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_N = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  var state = { type: 'all', sort: 'new', q: '', shown: 24 };
  var articles = [];
  var openMenu = '';
  var booting = true;

  function textOf(el) {
    return ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function formatISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return '';
    return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }
  function parseDate(raw) {
    var t = String(raw || '').replace(/\s+/g, ' ').trim();
    var found = [];
    var isoRe = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    var m;
    while ((m = isoRe.exec(t))) found.push(m[1] + '-' + m[2] + '-' + m[3]);
    var wordRe = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/gi;
    while ((m = wordRe.exec(t))) {
      found.push(m[3] + '-' + pad(MONTH_N[m[1].slice(0, 3).toLowerCase()]) + '-' + pad(+m[2]));
    }
    if (found.length) return found[found.length - 1];
    var monthOnly = t.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b/i);
    if (monthOnly) return monthOnly[2] + '-' + pad(MONTH_N[monthOnly[1].slice(0, 3).toLowerCase()]) + '-01';
    return '';
  }
  function minutesOf(card, meta) {
    var side = textOf(card.querySelector('.article-side-stat'));
    var n = parseInt(side, 10);
    if (n) return n;
    var m = String(meta || '').match(/(\d+)\s*min/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function hrefFor(card) {
    var href = card.tagName === 'A' ? (card.getAttribute('href') || '') : '';
    var show = ((card.getAttribute('onclick') || '').match(/showArticle\((\d+)\)/) || [])[1] || '';
    if (!href && show && window.__ART_MANIFEST) {
      var file = window.__ART_MANIFEST[show] || window.__ART_MANIFEST[String(show)];
      if (file) href = 'a/' + file;
    }
    return { href: href, show: show };
  }
  function kickerOf(card, cat) {
    var k = textOf(card.querySelector('.article-cat')).replace(/Featured/gi, '').trim();
    return k || TYPE_LABEL[cat] || cat;
  }

  function readCards() {
    var seen = {};
    var out = [];
    document.querySelectorAll('#rh-source .article-card').forEach(function (card) {
      var title = textOf(card.querySelector('.article-title'));
      if (!title || /^See all \d+/i.test(title)) return;
      var link = hrefFor(card);
      var key = (link.href || ('id:' + link.show) || title).toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      var cat = card.getAttribute('data-category') || 'guide';
      var meta = textOf(card.querySelector('.article-meta'));
      var date = card.getAttribute('data-date') || parseDate(meta);
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) date = parseDate(date);
      out.push({
        title: title,
        desc: textOf(card.querySelector('.article-desc')),
        kicker: kickerOf(card, cat),
        cat: cat,
        date: date,
        dateLabel: formatISO(date),
        minutes: minutesOf(card, meta),
        href: link.href,
        show: link.show
      });
    });
    articles = out;
  }

  function counts() {
    var map = { all: articles.length };
    articles.forEach(function (a) { map[a.cat] = (map[a.cat] || 0) + 1; });
    return map;
  }
  function filtered() {
    var q = state.q.trim().toLowerCase();
    var list = articles.filter(function (a) {
      if (state.type !== 'all' && a.cat !== state.type) return false;
      if (!q) return true;
      var blob = (a.title + ' ' + a.desc + ' ' + a.kicker + ' ' + (TYPE_LABEL[a.cat] || '')).toLowerCase();
      return q.split(/\s+/).filter(Boolean).every(function (word) { return blob.indexOf(word) !== -1; });
    });
    var dir = state.sort === 'old' ? 1 : -1;
    list.sort(function (a, b) {
      if (state.sort === 'az') return a.title.localeCompare(b.title) || a.date.localeCompare(b.date);
      if (state.sort === 'short') {
        var am = a.minutes || 9999;
        var bm = b.minutes || 9999;
        if (am !== bm) return am - bm;
        return a.title.localeCompare(b.title);
      }
      var ad = a.date || '';
      var bd = b.date || '';
      if (!ad && bd) return 1;
      if (ad && !bd) return -1;
      if (ad !== bd) return ad < bd ? -dir : dir;
      return a.title.localeCompare(b.title);
    });
    return list;
  }
  function sectionsMode() {
    return state.type === 'all' && !state.q.trim();
  }

  function rowHtml(a, compact) {
    var meta = a.dateLabel || '';
    if (a.minutes) meta += (meta ? ' · ' : '') + a.minutes + ' min read';
    var href = a.href || (a.show ? '#article-' + a.show : '#research');
    var show = a.show ? ' data-show="' + esc(a.show) + '"' : '';
    return '<a class="rh-row" href="' + esc(href) + '"' + show +
      ' data-date="' + esc(a.date) + '" data-cat="' + esc(a.cat) + '">' +
      '<span class="rh-kicker rh-row-kicker">' + esc(a.kicker) + '</span>' +
      '<span class="rh-title">' + esc(a.title) + '</span>' +
      '<span class="rh-sum">' + esc(a.desc) + '</span>' +
      '<span class="rh-meta">' + esc(meta) + '</span>' +
      '</a>';
  }

  function renderMenus(countMap) {
    var typeMenu = document.getElementById('rh-type-menu');
    var sortMenu = document.getElementById('rh-sort-menu');
    if (typeMenu) {
      typeMenu.innerHTML = TYPES.map(function (pair) {
        var n = pair[0] === 'all' ? countMap.all : (countMap[pair[0]] || 0);
        var on = state.type === pair[0];
        return '<button type="button" role="option" data-value="' + pair[0] + '" aria-selected="' + (on ? 'true' : 'false') + '">' +
          '<span>' + esc(pair[1]) + '</span><span class="rh-opt-n">' + n + '</span></button>';
      }).join('');
    }
    if (sortMenu) {
      sortMenu.innerHTML = SORTS.map(function (pair) {
        var on = state.sort === pair[0];
        return '<button type="button" role="option" data-value="' + pair[0] + '" aria-selected="' + (on ? 'true' : 'false') + '">' +
          '<span>' + esc(pair[1]) + '</span></button>';
      }).join('');
    }
    var typeLabel = document.getElementById('rh-type-label');
    var typeCount = document.getElementById('rh-type-count');
    var sortLabel = document.getElementById('rh-sort-label');
    if (typeLabel) typeLabel.textContent = TYPE_LABEL[state.type] || 'All';
    if (typeCount) typeCount.textContent = String(state.type === 'all' ? countMap.all : (countMap[state.type] || 0));
    if (sortLabel) sortLabel.textContent = SORT_LABEL[state.sort] || 'Newest';
    var typeBtn = document.getElementById('rh-type-btn');
    var sortBtn = document.getElementById('rh-sort-btn');
    if (typeBtn) typeBtn.classList.toggle('is-set', state.type !== 'all');
    if (sortBtn) sortBtn.classList.toggle('is-set', state.sort !== 'new');
  }

  function renderSections(countMap) {
    var host = document.getElementById('rh-sections');
    if (!host) return;
    var cats = TYPES.filter(function (pair) { return pair[0] !== 'all' && countMap[pair[0]]; });
    Object.keys(countMap).forEach(function (cat) {
      if (cat !== 'all' && !TYPE_LABEL[cat] && countMap[cat]) cats.push([cat, cat]);
    });
    cats.sort(function (a, b) { return (countMap[b[0]] - countMap[a[0]]) || a[1].localeCompare(b[1]); });
    host.innerHTML = cats.map(function (pair) {
      var cat = pair[0];
      var items = filtered().filter(function (a) { return a.cat === cat; }).slice(0, 3);
      var n = countMap[cat];
      return '<section class="rh-sec">' +
        '<div class="rh-sec-h"><h2>' + esc(pair[1]) + ' <span class="rh-sec-n">' + n + '</span></h2>' +
        '<button type="button" class="rh-seeall" data-cat="' + esc(cat) + '">See all ' + n + ' →</button></div>' +
        '<div class="rh-grid">' + items.map(function (a) { return rowHtml(a, false); }).join('') + '</div>' +
        '</section>';
    }).join('');
  }

  function renderList(rows) {
    var status = document.getElementById('rh-status');
    var live = document.getElementById('rh-live');
    var box = document.getElementById('rh-rows');
    var more = document.getElementById('rh-more');
    var empty = document.getElementById('rh-empty');
    var total = rows.length;
    var shown = Math.min(state.shown, total);
    var label = 'Showing ' + shown + ' of ' + total + ' · ' + (SORT_LABEL[state.sort] || 'Newest');
    if (status) status.textContent = label;
    if (live) live.textContent = label;
    if (box) box.innerHTML = rows.slice(0, shown).map(function (a) { return rowHtml(a, true); }).join('');
    if (more) {
      if (shown < total) {
        more.hidden = false;
        more.textContent = 'Load 24 more (' + shown + ' of ' + total + ')';
      } else {
        more.hidden = true;
      }
    }
    if (empty) empty.hidden = total !== 0;
  }

  function render() {
    readCards();
    var countMap = counts();
    var rows = filtered();
    root.classList.toggle('mode-sections', sectionsMode());
    root.classList.toggle('mode-list', !sectionsMode());
    renderMenus(countMap);
    renderSections(countMap);
    renderList(rows);
    var input = document.getElementById('rs-search-input');
    if (input && input.value !== state.q && document.activeElement !== input) input.value = state.q;
    var clear = document.getElementById('rh-clear');
    if (clear) clear.hidden = !state.q;
    root.setAttribute('data-ready', String(articles.length));
  }

  function hashQuery() {
    var raw = (location.hash || '').replace(/^#/, '');
    var i = raw.indexOf('?');
    return new URLSearchParams(i >= 0 ? raw.slice(i + 1) : '');
  }
  function readUrl() {
    var params = hashQuery();
    var type = params.get('type') || 'all';
    var sort = params.get('sort') || 'new';
    if (!TYPE_LABEL[type]) type = 'all';
    if (!SORT_LABEL[sort]) sort = 'new';
    state.type = type;
    state.sort = sort;
    state.q = params.get('q') || '';
    state.shown = 24;
  }
  function writeUrl(push) {
    if (booting) return;
    var params = new URLSearchParams();
    if (state.type !== 'all') params.set('type', state.type);
    if (state.sort !== 'new') params.set('sort', state.sort);
    if (state.q) params.set('q', state.q);
    var qs = params.toString();
    var hash = '#research' + (qs ? '?' + qs : '');
    if ((location.hash || '#research') === hash) return;
    var url = location.pathname + location.search + hash;
    if (push) history.pushState({ rh: 1 }, '', url);
    else history.replaceState({ rh: 1 }, '', url);
  }
  function listIsShown() {
    var list = document.getElementById('rh-list');
    return !!(list && getComputedStyle(list).display !== 'none');
  }
  function focusStatus() {
    var status = document.getElementById('rh-status');
    if (status && listIsShown()) status.focus();
  }

  function setType(cat, push) {
    state.type = TYPE_LABEL[cat] ? cat : 'all';
    state.shown = 24;
    closeMenus();
    writeUrl(push !== false);
    render();
    focusStatus();
  }
  function setSort(sort) {
    state.sort = SORT_LABEL[sort] ? sort : 'new';
    state.shown = 24;
    closeMenus();
    writeUrl(true);
    render();
    focusStatus();
  }
  function setQuery(q, push) {
    state.q = q;
    state.shown = 24;
    writeUrl(!!push);
    render();
  }

  function closeMenus() {
    openMenu = '';
    ['type', 'sort'].forEach(function (name) {
      var menu = document.getElementById('rh-' + name + '-menu');
      var btn = document.getElementById('rh-' + name + '-btn');
      if (menu) menu.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }
  function toggleMenu(name) {
    var willOpen = openMenu !== name;
    closeMenus();
    if (!willOpen) return;
    openMenu = name;
    var menu = document.getElementById('rh-' + name + '-menu');
    var btn = document.getElementById('rh-' + name + '-btn');
    if (menu) menu.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  root.addEventListener('click', function (e) {
    var see = e.target.closest && e.target.closest('.rh-seeall');
    if (see) {
      e.preventDefault();
      setType(see.getAttribute('data-cat') || 'all', true);
      return;
    }
    var opt = e.target.closest && e.target.closest('#rh-type-menu [role="option"], #rh-sort-menu [role="option"]');
    if (opt) {
      e.preventDefault();
      if (opt.closest('#rh-sort-menu')) setSort(opt.getAttribute('data-value'));
      else setType(opt.getAttribute('data-value'), true);
      return;
    }
    var row = e.target.closest && e.target.closest('a.rh-row[data-show]');
    if (row && !row.getAttribute('href').match(/^(a\/|\/a\/|condition\/|stack\/|m\/)/)) {
      e.preventDefault();
      if (typeof window.showArticle === 'function') window.showArticle(+row.getAttribute('data-show'));
    }
  });

  var typeBtn = document.getElementById('rh-type-btn');
  var sortBtn = document.getElementById('rh-sort-btn');
  if (typeBtn) typeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu('type'); });
  if (sortBtn) sortBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu('sort'); });
  document.addEventListener('click', function (e) {
    if (!openMenu) return;
    if (e.target.closest && e.target.closest('#rh-bar')) return;
    closeMenus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMenu) {
      e.preventDefault();
      var btn = document.getElementById('rh-' + openMenu + '-btn');
      closeMenus();
      if (btn) btn.focus();
    }
  });

  var input = document.getElementById('rs-search-input');
  if (input) {
    input.addEventListener('input', function () {
      closeMenus();
      setQuery(input.value, false);
    });
  }
  var clearBtn = document.getElementById('rh-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      setQuery('', false);
      if (input) input.focus();
    });
  }
  var allBtn = document.getElementById('rh-allcats');
  if (allBtn) {
    allBtn.addEventListener('click', function () {
      state.q = '';
      setType('all', true);
    });
  }
  var more = document.getElementById('rh-more');
  if (more) {
    more.addEventListener('click', function () {
      state.shown += 24;
      render();
    });
  }

  window.addEventListener('hashchange', function () {
    var tab = (location.hash || '').replace(/^#/, '').split('?')[0].toLowerCase();
    if (tab !== 'research') return;
    readUrl();
    closeMenus();
    render();
    if (typeof loadDeferredArticleCards === 'function') loadDeferredArticleCards();
  });
  window.addEventListener('popstate', function () {
    var tab = (location.hash || '').replace(/^#/, '').split('?')[0].toLowerCase();
    if (tab !== 'research') return;
    readUrl();
    closeMenus();
    render();
  });

  var list = document.querySelector('#rh-source .article-list');
  if (list && window.MutationObserver) {
    var timer = 0;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(render, 40);
    }).observe(list, { childList: true });
  }

  readUrl();
  render();
  booting = false;
  if ((location.hash || '').replace(/^#/, '').split('?')[0].toLowerCase() === 'research') {
    if (typeof loadDeferredArticleCards === 'function') loadDeferredArticleCards();
  }

  window.RH = {
    setType: function (cat) { setType(cat, true); },
    setSort: setSort,
    setQuery: function (q) { setQuery(q, false); },
    setShown: function (n) { state.shown = n; render(); }
  };
})();
