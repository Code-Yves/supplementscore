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

test('the non-profit claim is the independent funding line', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'copy covered on desktop and phone');
  await goto(page, '/');
  const home = await page.evaluate(() => {
    const label = document.querySelector('.beta-bar .ss-np');
    const shown = label && getComputedStyle(label).display !== 'none';
    return {
      lede: document.querySelector('p.lede') ? document.querySelector('p.lede').textContent : '',
      label: label ? label.textContent : '',
      shown,
      footer: document.querySelector('.site-footer-contrib-eyebrow').textContent.trim(),
      body: document.body.innerText,
    };
  });
  expect(home.lede).toContain('Independent · No industry funding');
  expect(home.lede).not.toMatch(/non-profit/i);
  expect(home.label).toBe('Independent · No industry funding');
  expect(home.footer).toBe('Independent · No industry funding');
  expect(home.footer).not.toMatch(/non-profit/i);
  if (testInfo.project.name === 'desktop') {
    expect(home.shown).toBe(true);
    for (const width of [1280, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      const gap = await page.evaluate(() => {
        const label = document.querySelector('.beta-bar > .ss-np');
        const stats = document.querySelector('.beta-bar-stats');
        const bar = document.querySelector('.beta-bar');
        const lr = label.getBoundingClientRect();
        const sr = stats.getBoundingClientRect();
        const br = bar.getBoundingClientRect();
        return {
          left: lr.left - sr.right,
          right: br.right - lr.right,
          top: lr.top - br.top,
          bottom: br.bottom - lr.bottom,
          scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      expect(gap.left, 'stats gap at ' + width).toBeGreaterThanOrEqual(16);
      expect(gap.right, 'bar inset at ' + width).toBeGreaterThanOrEqual(-1);
      expect(gap.top, 'bar top at ' + width).toBeGreaterThanOrEqual(-1);
      expect(gap.bottom, 'bar bottom at ' + width).toBeGreaterThanOrEqual(-1);
      expect(gap.scroll, 'horizontal overflow at ' + width).toBeLessThanOrEqual(1);
    }
  } else {
    expect(home.shown).toBe(false);
  }

  await goto(page, '/about.html');
  const about = await page.locator('main').innerText();
  expect(about).toContain('Independent · No industry funding');
  expect(about).not.toMatch(/non-profit/i);
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
    };
  });
  expect(row.role).toBe('combobox');
  expect(row.expanded).toBe('false');
  expect(row.minHeight).toBeGreaterThanOrEqual(48);
  expect(row.height).toBeGreaterThanOrEqual(48);
  expect(row.fontSize).toBe('16px');
  expect(parseFloat(row.borderBottom)).toBeGreaterThan(0);
  expect(row.arrow).not.toBe('none');
  expect(row.arrowColor).toBe('rgb(13, 148, 136)');
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
