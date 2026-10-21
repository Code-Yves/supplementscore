/* Browse page search.
   Same pill as the homepage. Typing filters the list against the full
   supplement database (data.js), not only the 200 names in the HTML.
   The dropdown is the homepage suggestion list: supplements and conditions.
   Enter with nothing highlighted submits the form to /search.html. */
(function () {
  'use strict';

  var list = document.getElementById('bro-list');
  var input = document.getElementById('bro-search');
  var ac = document.getElementById('bro-ac');
  var status = document.getElementById('bro-status');
  if (!list || !input || !ac || !status) return;

  var original = list.innerHTML;
  var acIdx = -1;

  var longPh = input.getAttribute('placeholder');
  var shortPh = 'Search supplements or conditions';
  var mq = window.matchMedia('(max-width: 768px)');
  function syncPh() { input.placeholder = mq.matches ? shortPh : longPh; }
  syncPh();
  if (mq.addEventListener) mq.addEventListener('change', syncPh);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function bold(name, q) {
    var src = String(name || '');
    var i = src.toLowerCase().indexOf(String(q || '').toLowerCase());
    if (i < 0) return esc(src);
    return esc(src.slice(0, i)) + '<b>' + esc(src.slice(i, i + q.length)) + '</b>' + esc(src.slice(i + q.length));
  }
  function total() {
    return (typeof S !== 'undefined' && S && S.length) ? S.length : 0;
  }
  function hideAc() {
    ac.classList.remove('vis');
    ac.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    acIdx = -1;
  }
  function restore() {
    list.innerHTML = original;
    list.hidden = false;
    status.textContent = '';
    status.className = 'bro-status';
    hideAc();
  }
  function suggestion(href, labelHtml, tag) {
    return '<a class="gs-ac-item" role="option" href="' + esc(href) + '"><span>' + labelHtml + '</span><span class="gs-ac-tag">' + esc(tag) + '</span></a>';
  }
  function render(q) {
    if (!window.SS || typeof window.SS.search !== 'function' || typeof S === 'undefined') {
      status.textContent = 'Searching the full database…';
      status.className = 'bro-status';
      return;
    }
    var res = window.SS.search(q, { limit: 4000 });
    var supps = res.supplements || [];
    var conds = (res.conditions || []).slice(0, 5);
    var html = '';
    if (supps.length) {
      html += '<div class="gs-ac-hdr">Supplements</div>';
      supps.slice(0, 8).forEach(function (s) {
        var tag = (s.tag || '').split(' · ')[0] || 'Supplement';
        html += suggestion(window.SS.urlFor('supplement', s.slug), bold(s.name, q), tag);
      });
    }
    if (conds.length) {
      html += '<div class="gs-ac-hdr">Conditions</div>';
      conds.forEach(function (c) {
        html += suggestion(window.SS.urlFor('condition', c.slug), bold(c.name, q), 'Condition');
      });
    }
    if (!html) {
      html = '<div class="gs-ac-empty">No matches for &ldquo;<b>' + esc(q) + '</b>&rdquo;.</div>';
    }
    ac.innerHTML = html;
    ac.classList.add('vis');
    input.setAttribute('aria-expanded', 'true');
    acIdx = -1;

    var n = total();
    if (!supps.length) {
      list.innerHTML = '';
      list.hidden = true;
      status.className = 'bro-status is-empty';
      status.innerHTML = 'No matches for &ldquo;<b>' + esc(q) + '</b>&rdquo;' + (n ? ' in ' + n + ' supplements.' : '.');
      return;
    }
    list.hidden = false;
    status.className = 'bro-status';
    status.textContent = supps.length + (supps.length === 1 ? ' match' : ' matches') + (n ? ' in ' + n + ' supplements' : '');
    list.innerHTML = supps.map(function (s) {
      return '<li><a href="' + esc(window.SS.urlFor('supplement', s.slug)) + '">' + esc(s.name) + '</a></li>';
    }).join('');
  }

  var timer;
  function onType() {
    var q = input.value.trim();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!q) restore();
      else render(q);
    }, 40);
  }
  input.addEventListener('input', onType);
  input.addEventListener('focus', function () {
    if (input.value.trim()) render(input.value.trim());
  });
  input.addEventListener('blur', function () {
    setTimeout(hideAc, 160);
  });
  input.addEventListener('keydown', function (e) {
    var items = ac.classList.contains('vis') ? ac.querySelectorAll('.gs-ac-item') : [];
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      acIdx = Math.min(acIdx + 1, items.length - 1);
      items.forEach(function (it, i) { it.classList.toggle('active', i === acIdx); });
      if (items[acIdx].scrollIntoView) items[acIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      acIdx = Math.max(acIdx - 1, 0);
      items.forEach(function (it, i) { it.classList.toggle('active', i === acIdx); });
    } else if (e.key === 'Enter' && acIdx >= 0 && items[acIdx]) {
      e.preventDefault();
      location.href = items[acIdx].href;
    } else if (e.key === 'Escape') {
      hideAc();
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.bro-search')) hideAc();
  });
})();
