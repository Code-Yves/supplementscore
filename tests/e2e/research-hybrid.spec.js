const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { install, goto, trackConsole } = require('./helpers');

async function openResearch(page, width, height) {
  await page.setViewportSize({ width: width, height: height });
  await goto(page, '/#research');
  await page.waitForSelector('#rh-root', { timeout: 60000 });
  await page.waitForFunction(() => {
    const list = document.querySelector('#rh-source .article-list');
    const ready = document.getElementById('rh-root');
    return list && list.dataset.deferredLoaded === '1' && ready && Number(ready.dataset.ready) > 200;
  }, null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    if (!links.some((link) => /research-hybrid\.css/.test(link.href))) return false;
    return links.filter((link) => /styles\.css|index\.css|research-hybrid\.css/.test(link.href)).every((link) => !!link.sheet);
  }, null, { timeout: 20000 });
}

async function viewState(page) {
  return page.evaluate(() => {
    function shown(sel) {
      const el = document.querySelector(sel);
      if (!el) return false;
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }
    function left(sel) {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().left) : null;
    }
    const section = document.querySelector('#research-view > .articles-section');
    const css = getComputedStyle(section);
    const search = document.querySelector('#rs-search-input');
    const box = document.querySelector('.rh-search');
    const menu = document.getElementById('rh-type-menu');
    return {
      sections: shown('#rh-sections'),
      list: shown('#rh-list'),
      allcats: shown('#rh-allcats'),
      seeAll: shown('.rh-seeall'),
      loadMore: shown('#rh-more'),
      edges: [left('.rh-index'), left('.rh-mast h1'), left('.rh-bar'), left(shown('#rh-sections') ? '.rh-sec-h' : '.rh-status')].filter((n) => n != null),
      maxWidth: css.maxWidth,
      marginLeft: css.marginLeft,
      marginRight: css.marginRight,
      inlineMargin: section.style.marginLeft,
      searchHeight: Math.round(box.getBoundingClientRect().height),
      searchExpanded: search.getAttribute('aria-expanded'),
      h1: document.querySelector('.rh-mast h1').textContent.trim(),
      h1Align: getComputedStyle(document.querySelector('.rh-mast h1')).textAlign,
      h1Color: getComputedStyle(document.querySelector('.rh-mast h1')).color,
      kickerColor: getComputedStyle(document.querySelector('.rh-kicker')).color,
      indexText: document.querySelector('.rh-index').textContent.replace(/\s+/g, ' ').trim(),
      indexRadius: getComputedStyle(document.querySelector('.rh-index')).borderRadius,
      indexHeight: Math.round(document.querySelector('.rh-index').getBoundingClientRect().height),
      menuPosition: menu ? getComputedStyle(menu).position : '',
      menuCols: menu ? getComputedStyle(menu).gridTemplateColumns : '',
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

async function axeClean(page) {
  const results = await new AxeBuilder({ page }).include('#rh-root').analyze();
  const bad = results.violations.filter((v) => v.impact !== 'minor');
  const summary = bad.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.slice(0, 8).map((node) => ({
      target: node.target,
      html: (node.html || '').slice(0, 180),
    })),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('research hybrid at 1280', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const errors = trackConsole(page);
  await openResearch(page, 1280, 900);
  const state = await viewState(page);
  expect(state.sections, 'sections view at 1280').toBe(true);
  expect(state.list, 'list hidden at 1280').toBe(false);
  expect(state.seeAll).toBe(true);
  expect(state.h1).toBe('What the trials actually show.');
  expect(state.h1Align).toBe('left');
  expect(state.h1Color).toBe('rgb(12, 10, 9)');
  expect(state.kickerColor).toBe('rgb(21, 90, 80)');
  expect(state.indexText).toBe('← Index');
  expect(state.indexRadius).toBe('0px');
  expect(state.indexHeight).toBeGreaterThanOrEqual(44);
  expect(state.maxWidth).toBe('1024px');
  expect(state.marginLeft).toBe(state.marginRight);
  expect(state.inlineMargin).toBe('');
  expect(Math.max(...state.edges) - Math.min(...state.edges)).toBeLessThanOrEqual(1);
  expect(state.searchExpanded).toBeNull();
  expect(state.searchHeight).toBeGreaterThanOrEqual(48);
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);

  await page.evaluate(() => document.getElementById('rh-type-btn').click());
  const open = await page.evaluate(() => {
    const menu = document.getElementById('rh-type-menu');
    const next = document.getElementById('rh-sections');
    const mr = menu.getBoundingClientRect();
    const nr = next.getBoundingClientRect();
    const opts = [...menu.querySelectorAll('[role="option"]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { h: r.height, w: r.width };
    });
    return {
      hidden: menu.hidden,
      position: getComputedStyle(menu).position,
      overlap: mr.bottom > nr.top + 1,
      menuRight: mr.right,
      client: document.documentElement.clientWidth,
      short: opts.filter((o) => o.h < 44 || o.w < 44),
      cols: getComputedStyle(menu).gridTemplateColumns.split(' ').length,
    };
  });
  expect(open.hidden).toBe(false);
  expect(open.position).not.toBe('absolute');
  expect(open.position).not.toBe('fixed');
  expect(open.overlap).toBe(false);
  expect(open.menuRight).toBeLessThanOrEqual(open.client + 1);
  expect(open.short).toEqual([]);
  expect(open.cols).toBe(3);
  await axeClean(page);
  await page.evaluate(() => document.querySelector('.rh-mast h1').click());
  await page.waitForFunction(() => document.getElementById('rh-type-menu').hidden);

  await page.evaluate(() => document.querySelector('.rh-seeall[data-cat="safety"]').click());
  const afterSee = await viewState(page);
  expect(afterSee.sections).toBe(false);
  expect(afterSee.list).toBe(true);
  expect(afterSee.allcats).toBe(true);
  const safety = await page.evaluate(() => ({
    status: document.getElementById('rh-status').textContent,
    cats: [...document.querySelectorAll('#rh-rows .rh-row')].map((row) => row.getAttribute('data-cat')),
    n: document.querySelectorAll('#rh-rows .rh-row').length,
    focus: document.activeElement && document.activeElement.id,
  }));
  expect(safety.n).toBe(24);
  expect(safety.cats.every((cat) => cat === 'safety')).toBe(true);
  expect(safety.status).toMatch(/^Showing 24 of \d+ · Newest$/);
  expect(safety.focus).toBe('rh-status');

  await page.evaluate(() => document.getElementById('rh-more').click());
  await expect.poll(() => page.locator('#rh-rows .rh-row').count()).toBe(48);
  const moreLabel = await page.locator('#rh-more').innerText();
  expect(moreLabel).toMatch(/^Load 24 more \(48 of \d+\)$/);

  await page.evaluate(() => document.getElementById('rh-allcats').click());
  const back = await viewState(page);
  expect(back.sections).toBe(true);
  expect(back.list).toBe(false);
  expect(await page.locator('#rh-type-label').innerText()).toBe('All');

  await page.evaluate(() => { window.RH.setType('all'); window.RH.setSort('new'); window.RH.setShown(10000); });
  const newest = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#rh-rows .rh-row')];
    const dates = rows.map((row) => row.getAttribute('data-date'));
    const titles = rows.map((row) => row.querySelector('.rh-title').textContent);
    const labels = rows.map((row) => row.querySelector('.rh-meta').textContent);
    const mag = titles.findIndex((t) => t.indexOf('Best magnesium for sleep') !== -1);
    const danger = titles.findIndex((t) => t.indexOf('10 Most Dangerous') !== -1);
    return {
      first: dates[0],
      max: dates.slice().sort().pop(),
      descending: dates.every((d, i) => i === 0 || dates[i - 1] >= d),
      magBeforeDanger: mag > -1 && danger > -1 && mag < danger,
      isoLabel: labels.some((label) => /\d{4}-\d{2}-\d{2}/.test(label)),
      magLabel: labels[mag] || '',
    };
  });
  expect(newest.first).toBe(newest.max);
  expect(newest.descending).toBe(true);
  expect(newest.magBeforeDanger).toBe(true);
  expect(newest.isoLabel).toBe(false);
  expect(newest.magLabel).toContain('Oct 15, 2026');

  await page.evaluate(() => { window.RH.setSort('old'); window.RH.setShown(10000); });
  const oldest = await page.evaluate(() => {
    const dates = [...document.querySelectorAll('#rh-rows .rh-row')].map((row) => row.getAttribute('data-date'));
    const all = [...document.querySelectorAll('#rh-source [data-date]')].map((el) => el.getAttribute('data-date')).filter(Boolean).sort();
    return { first: dates[0], min: all[0], ascending: dates.every((d, i) => i === 0 || dates[i - 1] <= d) };
  });
  expect(oldest.first).toBe(oldest.min);
  expect(oldest.ascending).toBe(true);

  await page.evaluate(() => window.RH.setQuery('ADHD protocol'));
  const adhd = await page.evaluate(() => {
    const row = [...document.querySelectorAll('#rh-rows .rh-row')].find((el) => /ADHD:/.test(el.querySelector('.rh-title').textContent));
    return row ? row.querySelector('.rh-sum').textContent : '';
  });
  expect(adhd).toContain('Omega-3');
  expect(adhd).not.toBe('The Evidence-Based Supplement Protocol');
  const shared = await page.evaluate(() => [...document.querySelectorAll('#rh-rows .rh-sum, #rh-sections .rh-sum')].filter((el) => el.textContent.trim() === 'The Evidence-Based Supplement Protocol').length);
  expect(shared).toBe(0);

  const readMore = await page.evaluate(() => getComputedStyle(document.querySelector('.rh-readmore')).color);
  expect(readMore).toBe('rgb(21, 90, 80)');
  const metaColor = await page.evaluate(() => getComputedStyle(document.querySelector('#rh-rows .rh-meta')).color);
  expect(metaColor).toBe('rgb(87, 83, 78)');
  const sideVisible = await page.evaluate(() => {
    function visible(el) {
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
      }
      return true;
    }
    return [...document.querySelectorAll('.article-side')].some(visible);
  });
  expect(sideVisible).toBe(false);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('research hybrid at 768', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openResearch(page, 768, 900);
  const state = await viewState(page);
  expect(state.sections).toBe(true);
  expect(state.list).toBe(false);
  expect(Math.max(...state.edges) - Math.min(...state.edges)).toBeLessThanOrEqual(1);
  expect(state.maxWidth).toBe('1024px');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  await page.evaluate(() => document.querySelector('.rh-seeall[data-cat="guide"]').click());
  expect(await viewState(page)).toMatchObject({ sections: false, list: true, allcats: true });
  const before = await page.locator('#rh-rows .rh-row').count();
  expect(before).toBe(24);
  await page.evaluate(() => document.getElementById('rh-more').click());
  await expect.poll(() => page.locator('#rh-rows .rh-row').count()).toBe(48);
  await page.evaluate(() => document.getElementById('rh-allcats').click());
  expect((await viewState(page)).sections).toBe(true);
  await axeClean(page);
});

test('research hybrid at 767', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openResearch(page, 767, 900);
  const state = await viewState(page);
  expect(state.sections).toBe(false);
  expect(state.list).toBe(true);
  expect(state.allcats).toBe(false);
  expect(state.seeAll).toBe(false);
  expect(state.loadMore).toBe(true);
  expect(state.searchHeight).toBe(44);
  expect(Math.max(...state.edges) - Math.min(...state.edges)).toBeLessThanOrEqual(1);
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  const n = await page.locator('#rh-rows .rh-row').count();
  expect(n).toBe(24);
  await page.evaluate(() => document.getElementById('rh-more').click());
  await expect.poll(() => page.locator('#rh-rows .rh-row').count()).toBe(48);
  await page.evaluate(() => document.getElementById('rh-type-btn').click());
  const menu = await page.evaluate(() => {
    const el = document.getElementById('rh-type-menu');
    const next = document.querySelector('#rh-list .rh-status');
    return {
      cols: getComputedStyle(el).gridTemplateColumns.split(' ').length,
      overlap: el.getBoundingClientRect().bottom > next.getBoundingClientRect().top + 1,
      position: getComputedStyle(el).position,
    };
  });
  expect(menu.cols).toBe(1);
  expect(menu.overlap).toBe(false);
  expect(menu.position).not.toBe('absolute');
  await page.evaluate(() => document.querySelector('#rh-type-menu [data-value="condition"]').click());
  const cond = await page.evaluate(() => ({
    sections: getComputedStyle(document.getElementById('rh-sections')).display,
    cats: [...new Set([...document.querySelectorAll('#rh-rows .rh-row')].map((row) => row.getAttribute('data-cat')))],
    shared: [...document.querySelectorAll('#rh-rows .rh-sum')].filter((el) => el.textContent.trim() === 'The Evidence-Based Supplement Protocol').length,
  }));
  expect(cond.sections).toBe('none');
  expect(cond.cats).toEqual(['condition']);
  expect(cond.shared).toBe(0);
  await axeClean(page);
});

test('research hybrid at 390', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone');
  const errors = trackConsole(page);
  await openResearch(page, 390, 844);
  const state = await viewState(page);
  expect(state.sections).toBe(false);
  expect(state.list).toBe(true);
  expect(state.allcats).toBe(false);
  expect(state.searchHeight).toBe(44);
  expect(state.searchExpanded).toBeNull();
  expect(state.indexHeight).toBeGreaterThanOrEqual(44);
  expect(Math.max(...state.edges) - Math.min(...state.edges)).toBeLessThanOrEqual(1);
  expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1);
  expect(await page.locator('#rh-rows .rh-row').count()).toBe(24);
  await page.evaluate(() => document.getElementById('rh-more').click());
  await expect.poll(() => page.locator('#rh-rows .rh-row').count()).toBe(48);
  const meta = await page.evaluate(() => {
    const el = document.querySelector('#rh-rows .rh-meta');
    const row = el.parentElement.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return { color: getComputedStyle(el).color, below: box.top >= row.top + 20 };
  });
  expect(meta.color).toBe('rgb(87, 83, 78)');
  expect(meta.below).toBe(true);
  await page.evaluate(() => document.getElementById('rh-sort-btn').click());
  await page.evaluate(() => document.querySelector('#rh-sort-menu [data-value="old"]').click());
  const oldest = await page.evaluate(() => {
    const dates = [...document.querySelectorAll('#rh-rows .rh-row')].map((row) => row.getAttribute('data-date'));
    return dates.every((d, i) => i === 0 || dates[i - 1] <= d);
  });
  expect(oldest).toBe(true);
  await axeClean(page);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('research hybrid follows the width without a script offset', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openResearch(page, 1280, 900);
  expect((await viewState(page)).sections).toBe(true);
  await page.setViewportSize({ width: 767, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const narrow = await viewState(page);
  expect(narrow.sections).toBe(false);
  expect(narrow.list).toBe(true);
  expect(narrow.searchHeight).toBe(44);
  expect(narrow.inlineMargin).toBe('');
  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await viewState(page)).sections).toBe(true);
});
