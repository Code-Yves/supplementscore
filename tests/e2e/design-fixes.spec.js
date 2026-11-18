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
  expect(home.lede).toBe('Drawn from peer-reviewed trials and meta-analyses, plus regulator dossiers and observational safety data.');
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
        inTrustStrip: !!(el && el.closest('.beta-bar')),
        inPagebar: !!(el && el.closest('.ss-pagebar')),
        betaCy: barRect ? barRect.top + barRect.height / 2 : null,
        titleLeft: (document.querySelector('main h1, .bro-wrap h1, .hub-wrap h1, .art-wrap h1') || {}).getBoundingClientRect
          ? document.querySelector('main h1, .bro-wrap h1, .hub-wrap h1, .art-wrap h1').getBoundingClientRect().left
          : null,
        navOverlap: (function () {
          if (!lr) return 0;
          const links = document.querySelectorAll('.ss-pagebar-nav a');
          let hit = 0;
          for (let i = 0; i < links.length; i++) {
            const nr = links[i].getBoundingClientRect();
            if (nr.width < 2) continue;
            const ox = Math.min(lr.right, nr.right) - Math.max(lr.left, nr.left);
            const oy = Math.min(lr.bottom, nr.bottom) - Math.max(lr.top, nr.top);
            if (ox > 0 && oy > 0) hit = Math.max(hit, ox);
          }
          return hit;
        })(),
        wideSearch: (function () {
          const form = document.querySelector('.ss-pagebar-search');
          const x = document.querySelector('header.ss-pagebar a.ss-pagebar-x');
          const main = document.querySelector('main');
          if (!form || getComputedStyle(form).position !== 'absolute') return null;
          const fr = form.getBoundingClientRect();
          const xr = x && getComputedStyle(x).display !== 'none' ? x.getBoundingClientRect() : null;
          const col = main ? main.getBoundingClientRect() : null;
          const link = document.querySelector('.ss-pagebar-nav a:last-child');
          const lrk = link ? link.getBoundingClientRect() : null;
          return {
            w: fr.width,
            gapLinks: lrk ? fr.left - lrk.right : null,
            gapX: xr ? xr.left - fr.right : null,
            inset: xr && col ? col.right - xr.right : null,
            past: Math.max(fr.right, xr ? xr.right : 0) - (col ? col.right : fr.right),
          };
        })(),
      };
    });
  }
  function expectColumn(box, home, path) {
    expect(box.shown, path).toBe(true);
    expect(box.count, path).toBe(1);
    expect(box.text, path).toBe('Independent · No industry funding');
    expect(box.height, path).toBeGreaterThanOrEqual(31);
    expect(box.height, path).toBeLessThanOrEqual(33);
    // Homepage: the line stays in the strip, on the wordmark's column.
    // Inner pages: it is outside the bar, so it cannot cover a link.
    if (box.inTrustStrip) {
      expect(Math.abs(box.cy - box.betaCy), path + ' trust strip').toBeLessThanOrEqual(2);
      expect(Math.abs(box.brandLeft - box.left), path + ' column').toBeLessThanOrEqual(2);
    } else {
      expect(box.inPagebar, path).toBe(false);
      expect(box.navOverlap, path).toBeLessThanOrEqual(0);
      if (box.wideSearch) {
        expect(box.wideSearch.w, path + ' search').toBe(200);
        expect(box.wideSearch.gapX, path + ' close gap').toBeGreaterThanOrEqual(15);
        expect(box.wideSearch.gapX, path + ' close gap').toBeLessThanOrEqual(17);
        expect(box.wideSearch.inset, path + ' inset').toBeGreaterThanOrEqual(15);
        expect(box.wideSearch.inset, path + ' inset').toBeLessThanOrEqual(17);
        expect(box.wideSearch.past, path + ' column').toBeLessThanOrEqual(0.5);
      } else if (box.titleLeft != null) {
        expect(Math.abs(box.brandLeft - box.titleLeft), path + ' title').toBeLessThanOrEqual(2);
      }
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
  const researchBar = await page.evaluate(() => {
    const beta = document.querySelector('.beta-bar').getBoundingClientRect();
    const nav = document.querySelector('header.ss-pagebar').getBoundingClientRect();
    return { gap: beta.top - nav.bottom };
  });
  // The strip used to sit 20px from the viewport. It now sits in that
  // same gap directly under the nav bar, and the two do not overlap.
  expect(researchBar.gap).toBeGreaterThanOrEqual(12);
  expect(researchBar.gap).toBeLessThanOrEqual(20);

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
  expect(articleNarrow.inPagebar).toBe(false);
  expect(Math.abs(articleNarrow.brandLeft - articleNarrow.titleLeft)).toBeLessThanOrEqual(2);

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

test('the homepage skip link is pinned to the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop skip link');
  async function skipBox() {
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.skip-link')).position === 'absolute');
    return page.evaluate(() => {
      const link = document.querySelector('.skip-link');
      link.blur();
      const hidden = link.getBoundingClientRect();
      link.focus();
      const shown = link.getBoundingClientRect();
      return { hiddenBottom: hidden.bottom, focusedTop: shown.top };
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await goto(page, '/');
  const home = await skipBox();
  expect(home.hiddenBottom).toBeLessThanOrEqual(0);
  expect(Math.abs(home.focusedTop)).toBeLessThanOrEqual(1);
  await goto(page, '/#research');
  await page.waitForSelector('#research-view .rh-mast h1');
  const research = await skipBox();
  expect(research.hiddenBottom).toBeLessThanOrEqual(0);
  expect(Math.abs(research.focusedTop)).toBeLessThanOrEqual(1);
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
  const prose = await page.evaluate(() => {
    function width(selector) {
      const el = document.querySelector(selector);
      return el ? el.getBoundingClientRect().width : 0;
    }
    const disclaim = document.querySelector('.sx-disclaim');
    const visibleDek = [...document.querySelectorAll('.sx-sub, .ar-dek')].filter((el) => getComputedStyle(el).display !== 'none');
    return {
      title: width('.ar-titleblock'),
      intro: width('.sx-intro'),
      disclaim: width('.sx-disclaim'),
      list: width('.sx-results'),
      dek: visibleDek.length,
      color: disclaim ? getComputedStyle(disclaim).color : '',
      strong: disclaim ? getComputedStyle(disclaim.querySelector('strong')).color : '',
    };
  });
  expect(prose.title).toBeGreaterThan(400);
  expect(prose.title).toBeLessThanOrEqual(700);
  expect(prose.intro).toBeLessThanOrEqual(700);
  expect(prose.disclaim).toBeLessThanOrEqual(700);
  expect(prose.list).toBeGreaterThan(900);
  expect(prose.dek).toBe(1);
  expect(prose.color).toBe('rgb(146, 64, 14)');
  expect(prose.strong).toBe('rgb(146, 64, 14)');

  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page, '/sx/sleep.html');
  await page.waitForSelector('.ar-dek');
  const phone = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('.sx-sub, .ar-dek')].filter((el) => getComputedStyle(el).display !== 'none');
    const disclaim = document.querySelector('.sx-disclaim');
    return {
      dek: visible.length,
      color: getComputedStyle(disclaim).color,
    };
  });
  expect(phone.dek).toBe(1);
  expect(phone.color).toBe('rgb(146, 64, 14)');

  await page.setViewportSize({ width: 1280, height: 900 });
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
    const bar = document.querySelector('header.ss-pagebar');
    return {
      top: h1.getBoundingClientRect().top,
      pad: parseFloat(getComputedStyle(main).paddingTop) || 0,
      barH: bar ? bar.getBoundingClientRect().height : 0,
    };
  });
  // 64px is the title's offset from the top of the page content. The nav
  // bar is in normal flow, so that same offset now starts below the bar.
  expect(Math.abs(home.top - (64 + home.barH))).toBeLessThanOrEqual(2);
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
