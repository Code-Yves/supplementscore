const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('headings and category descriptions balance their lines', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'layout covered on desktop');
  await goto(page, '/compare/index.html');
  const wraps = await page.evaluate(() => {
    function textWrap(selector) {
      const el = document.querySelector(selector);
      return el ? getComputedStyle(el).textWrap : '';
    }
    const probe = document.createElement('p');
    probe.className = 'art-blurb';
    document.body.appendChild(probe);
    const blurb = getComputedStyle(probe).textWrap;
    probe.remove();
    return {
      h1: textWrap('h1'),
      h2: textWrap('h2'),
      card: textWrap('.hub-card h2, .hub-card h3'),
      blurb,
    };
  });
  expect(wraps.h1).toBe('balance');
  expect(wraps.h2).toBe('balance');
  expect(wraps.card).toBe('balance');
  expect(wraps.blurb).toBe('balance');
});

test('the funding line is a header label, and prose is a sentence', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'copy covered on desktop and phone');
  await goto(page, '/');
  const home = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.ss-np'));
    const visible = labels.filter((el) => getComputedStyle(el).display !== 'none');
    const label = document.querySelector('.ss-np');
    return {
      lede: document.querySelector('p.lede') ? document.querySelector('p.lede').textContent : '',
      label: label ? label.textContent : '',
      visible: visible.length,
      footer: document.querySelector('.site-footer-contrib-eyebrow').textContent.trim(),
      meta: document.querySelector('meta[name="description"]').getAttribute('content'),
    };
  });
  expect(home.lede).toBe('Derived exclusively from peer-reviewed clinical trials and credible research institutions.');
  expect(home.lede).not.toContain('Independent ·');
  expect(home.lede).not.toMatch(/non-profit/i);
  expect(home.label).toBe('Independent · No industry funding');
  expect(home.footer).toBe('Independent · No industry funding');
  expect(home.meta).toContain('SupplementScore is independent and takes no industry funding.');
  expect(home.meta).not.toContain('Independent ·');
  if (testInfo.project.name === 'desktop') expect(home.visible).toBe(1);
  else expect(home.visible).toBe(0);

  await goto(page, '/about.html');
  const about = await page.locator('main').innerText();
  expect(about).toContain('SupplementScore is a free, independent public reference and takes no industry funding.');
  expect(about).toContain('SupplementScore is independent and takes no industry funding.');
  expect(about).not.toContain('Independent ·');
  expect(about).not.toMatch(/non-profit/i);

  await goto(page, '/editorial-board.html');
  const board = await page.locator('main').innerText();
  expect(board).toContain('SupplementScore is independent and takes no industry funding.');
  expect(board).not.toContain('Independent ·');
});

test('the trust label sits in one spot inside the 1024 column', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop header label');
  async function labelBox() {
    return page.evaluate(() => {
      const el = document.querySelector('.ss-np');
      const shown = el && getComputedStyle(el).display !== 'none';
      const lr = shown ? el.getBoundingClientRect() : null;
      const brand = document.querySelector('.ss-pagebar-brand');
      const br = brand ? brand.getBoundingClientRect() : null;
      const stats = document.querySelector('.beta-bar-stats');
      const sr = stats ? stats.getBoundingClientRect() : null;
      const bar = document.querySelector('.beta-bar');
      const barRect = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
      const close = document.querySelector('a.rc-close, a.pg-close-fab, a.ss-pagebar-x');
      const cr = close && getComputedStyle(close).display !== 'none' ? close.getBoundingClientRect() : null;
      const row = cr || (br && br.width ? br : null) || barRect;
      return {
        shown: !!shown,
        count: document.querySelectorAll('.ss-np').length,
        text: el ? el.textContent : '',
        left: lr ? lr.left : null,
        height: lr ? lr.height : null,
        cy: lr ? lr.top + lr.height / 2 : null,
        rowCy: row ? row.top + row.height / 2 : null,
        brandLeft: br ? br.left : null,
        afterBrand: lr && br ? lr.left - br.right : null,
        statsGap: lr && sr ? sr.left - lr.right : null,
        inHeader: !!(el && el.closest('header, [role="banner"]')),
        inBar: !!(el && el.closest('.beta-bar, .ss-pagebar')),
      };
    });
  }
  function expectColumn(box, home, path) {
    expect(box.shown, path).toBe(true);
    expect(box.count, path).toBe(1);
    expect(box.text, path).toBe('Independent · No industry funding');
    expect(box.height, path).toBeGreaterThanOrEqual(31);
    expect(box.height, path).toBeLessThanOrEqual(33);
    expect(Math.abs(box.cy - box.rowCy), path).toBeLessThanOrEqual(2);
    if (box.afterBrand !== null) {
      expect(box.afterBrand, path).toBeGreaterThanOrEqual(20);
      expect(box.afterBrand, path).toBeLessThanOrEqual(24);
      expect(Math.abs(box.brandLeft - home.left), path).toBeLessThanOrEqual(2);
    } else {
      expect(Math.abs(box.left - home.left), path).toBeLessThanOrEqual(2);
      expect(box.inHeader || box.inBar, path).toBe(true);
    }
    if (box.statsGap !== null) expect(box.statsGap, path).toBeGreaterThanOrEqual(16);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await goto(page, '/');
  const home = await labelBox();
  expectColumn(home, home, '/');
  expect(home.inBar).toBe(true);

  await goto(page, '/#research');
  await page.waitForSelector('#research-view .rh-mast h1');
  const research = await labelBox();
  expectColumn(research, home, '/#research');
  const researchBar = await page.evaluate(() => document.querySelector('.beta-bar').getBoundingClientRect().top);
  expect(researchBar).toBeGreaterThanOrEqual(19);
  expect(researchBar).toBeLessThanOrEqual(21);

  const paths = [
    '/a/berberine-is-it-really-nature-s-ozempic.html',
    '/supplement/l-theanine.html',
    '/condition/dry-eye.html',
    '/hub/index.html',
    '/hub/sleep.html',
    '/brand/thorne.html',
    '/brands.html',
    '/404.html',
    '/sx/sleep.html',
  ];
  for (const path of paths) {
    await goto(page, path);
    await page.waitForSelector('.ss-np');
    if (path.indexOf('/a/') === 0 || path.indexOf('/condition/') === 0 || path.indexOf('/sx/') === 0) {
      await page.waitForSelector('a.rc-close', { timeout: 5000 });
    }
    await page.waitForTimeout(150);
    expectColumn(await labelBox(), home, path);
  }

  await page.setViewportSize({ width: 1024, height: 900 });
  await goto(page, '/');
  const homeNarrow = await labelBox();
  await goto(page, '/#research');
  await page.waitForSelector('#research-view .rh-mast h1');
  const researchNarrow = await labelBox();
  expect(Math.abs(researchNarrow.left - homeNarrow.left)).toBeLessThanOrEqual(2);
  await goto(page, '/a/berberine-is-it-really-nature-s-ozempic.html');
  await page.waitForSelector('a.rc-close');
  await page.waitForTimeout(150);
  const articleNarrow = await labelBox();
  expect(Math.abs(articleNarrow.left - homeNarrow.left)).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, '/');
  const phone = await labelBox();
  expect(phone.shown).toBe(false);
  await goto(page, '/#research');
  await page.waitForSelector('#research-view .rh-mast h1');
  await page.evaluate(() => window.scrollTo(0, 600));
  const pinned = await page.evaluate(() => {
    const bar = document.querySelector('.beta-bar');
    const r = bar.getBoundingClientRect();
    return { top: r.top, position: getComputedStyle(bar).position };
  });
  expect(pinned.position).toBe('fixed');
  expect(Math.abs(pinned.top)).toBeLessThanOrEqual(1);
});

test('symptom detail uses the normal content column', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop column');
  await page.setViewportSize({ width: 1280, height: 900 });
  await goto(page, '/sx/sleep.html');
  await page.waitForSelector('a.rc-close');
  await page.waitForTimeout(100);
  const sleep = await page.evaluate(() => {
    const main = document.querySelector('main.sx-wrap');
    const col = document.querySelector('.ar-column');
    const close = document.querySelector('a.rc-close');
    const bar = document.querySelector('.rc-top');
    return {
      mainW: main.getBoundingClientRect().width,
      colW: col.getBoundingClientRect().width,
      gap: bar.getBoundingClientRect().bottom - close.getBoundingClientRect().bottom,
    };
  });
  expect(sleep.mainW).toBeGreaterThan(900);
  expect(sleep.colW).toBeGreaterThan(700);
  expect(sleep.gap).toBeGreaterThanOrEqual(8);

  await goto(page, '/condition/dry-eye.html');
  await page.waitForSelector('.ar-toc');
  const tocW = await page.evaluate(() => document.querySelector('.ar-toc').getBoundingClientRect().width);
  expect(tocW).toBeGreaterThan(150);
  expect(tocW).toBeLessThan(220);
});

test('the homepage title keeps its offset from main', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop offset');
  await page.setViewportSize({ width: 1280, height: 900 });
  await goto(page, '/');
  const home = await page.evaluate(() => {
    const h1 = document.querySelector('.ix-hero h1');
    const main = document.querySelector('main');
    return {
      top: h1.getBoundingClientRect().top,
      pad: parseFloat(getComputedStyle(main).paddingTop) || 0,
    };
  });
  expect(Math.abs(home.top - 64)).toBeLessThanOrEqual(2);
  expect(home.pad).toBeLessThan(8);

  await goto(page, '/a/berberine-is-it-really-nature-s-ozempic.html');
  await page.waitForSelector('a.rc-close');
  const article = await page.evaluate(() => {
    const main = document.querySelector('main.ar-wrap');
    const close = document.querySelector('a.rc-close');
    const bar = document.querySelector('.rc-top');
    const cr = close.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    return {
      pad: parseFloat(getComputedStyle(main).paddingTop) || 0,
      gap: br.bottom - cr.bottom,
    };
  });
  expect(article.pad).toBeLessThan(40);
  expect(article.gap).toBeGreaterThanOrEqual(8);

  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(50);
  const narrow = await page.evaluate(() => {
    const close = document.querySelector('a.rc-close');
    const bar = document.querySelector('.rc-top');
    return bar.getBoundingClientRect().bottom - close.getBoundingClientRect().bottom;
  });
  expect(narrow).toBeGreaterThanOrEqual(8);
});

test('topic hub index is one column on a phone and has no letter badges', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'hub index covered on phone');
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, '/hub/index.html');
  const hub = await page.evaluate(() => {
    const grid = document.querySelector('.hubidx-grid');
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean);
    return {
      badges: document.querySelectorAll('.hubidx-card-badge').length,
      cols: cols.length,
      title: getComputedStyle(document.querySelector('.hubidx-card-title')).textWrap,
    };
  });
  expect(hub.badges).toBe(0);
  expect(hub.cols).toBe(1);
  expect(hub.title).toBe('balance');
});

test('browse rows read as links and the search box is a combobox', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'browse covered on desktop');
  await goto(page, '/browse.html');
  const row = await page.evaluate(() => {
    const link = document.querySelector('.bro-list a');
    const style = getComputedStyle(link);
    const arrow = getComputedStyle(link, '::after');
    const rect = link.getBoundingClientRect();
    return {
      role: document.querySelector('#bro-search').getAttribute('role'),
      expanded: document.querySelector('#bro-search').getAttribute('aria-expanded'),
      minHeight: parseFloat(style.minHeight),
      height: rect.height,
      fontSize: style.fontSize,
      borderBottom: style.borderBottomWidth,
      arrow: arrow.content,
      arrowColor: arrow.borderTopColor,
      cols: getComputedStyle(document.querySelector('.bro-list')).gridTemplateColumns.split(' ').filter(Boolean).length,
      columnGap: parseFloat(getComputedStyle(document.querySelector('.bro-list')).columnGap) || 0,
      rowBottoms: Array.from(document.querySelectorAll('.bro-list li')).slice(0, 3).map((li) => {
        const a = li.querySelector('a');
        return Math.round(a.getBoundingClientRect().bottom);
      }),
    };
  });
  expect(row.role).toBe('combobox');
  expect(row.expanded).toBe('false');
  expect(row.minHeight).toBeGreaterThanOrEqual(48);
  expect(row.height).toBeGreaterThanOrEqual(48);
  expect(row.fontSize).toBe('16px');
  expect(parseFloat(row.borderBottom)).toBeGreaterThan(0);
  expect(row.arrow).not.toBe('none');
  expect(row.arrowColor).toBe('rgb(21, 90, 80)');
  if (testInfo.project.name === 'desktop') {
    expect(row.cols).toBe(3);
    expect(row.columnGap).toBe(32);
    expect(new Set(row.rowBottoms).size).toBe(1);
  } else {
    expect(row.cols).toBe(1);
  }
});

test('article warning text is amber #92400E', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'warning color covered once');
  await goto(page, '/a/women-s-supplement-guide-evidence-based-picks-by-life-stage.html');
  await page.waitForSelector('.sens-pop-line');
  const color = await page.locator('.sens-pop-line').evaluate((el) => getComputedStyle(el).color);
  const strong = await page.locator('.sens-pop-line strong').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(146, 64, 14)');
  expect(strong).toBe('rgb(146, 64, 14)');
});

test('scroll positions use path plus hash, and a homepage reload stays at the top', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'scroll behavior is not viewport-specific');
  await goto(page, '/about.html#methodology');
  const saved = await page.evaluate(() => {
    window.scrollTo(0, 640);
    window.dispatchEvent(new Event('pagehide'));
    return {
      hashed: sessionStorage.getItem('ss-scroll:' + location.pathname + '#methodology'),
      plain: sessionStorage.getItem('ss-scroll:' + location.pathname),
    };
  });
  expect(Number(saved.hashed)).toBeGreaterThan(100);
  expect(saved.plain).toBeNull();

  await page.addInitScript(() => {
    try { sessionStorage.setItem('ss-scroll:/', '3200'); } catch (e) {}
  });
  await goto(page, '/');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const y = await page.evaluate(() => window.scrollY || 0);
  expect(y).toBeLessThan(40);
});
