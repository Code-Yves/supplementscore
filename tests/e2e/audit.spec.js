const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const BERGAMOT = '/a/bergamot-citrus-extract-italy-s-answer-to-high-cholesterol.html';
const STUDIED = '/a/the-10-most-studied-supplements-on-earth.html';
const BERBERINE = '/a/berberine-is-it-really-nature-s-ozempic.html';
const STUDIED_DEK = 'These ten supplements have survived more scrutiny than most prescription drugs, from creatine and omega-3 to psyllium husk, oat beta-glucan, and oral rehydration salts.';

const ARTICLES = [
  ['bergamot', BERGAMOT],
  ['studied', STUDIED],
  ['berberine', BERBERINE],
];

const PAGES = [
  ['home', '/', '#sfbar-main .cdd-btn'],
  ['bergamot', BERGAMOT, '.ar-titleblock'],
  ['studied', STUDIED, '.ar-dek'],
  ['berberine', BERBERINE, '.ar-toc'],
  ['supplement', '/supplement/magnesium.html', 'h1.det-h1'],
  ['topic', '/hub/sleep.html', 'h1.hub-title'],
  ['about', '/about.html', 'main.ab-wrap h1'],
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

async function articleState(page) {
  return page.evaluate(() => {
    const slugOf = (href) => {
      const match = String(href || '').match(/\/supplement\/([a-z0-9-]+)\.html(?:$|[?#])/i);
      return match ? match[1].toLowerCase() : '';
    };
    const main = document.querySelector('main.ar-wrap');
    const seen = new Set();
    const body = [];
    [...main.querySelectorAll('a[href]')].forEach((a) => {
      if (a.closest('.ar-end, .rc-aend, .ar-related, .ca-related, .sx-related, .sk-related, .ss-mentioned')) return;
      const slug = slugOf(a.getAttribute('href'));
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      body.push(slug);
    });
    const mentionedAnchors = [...document.querySelectorAll('.ar-end #ss-mentioned a, .ar-end .ss-mentioned a')];
    const mentionedSeen = new Set();
    const mentioned = [];
    mentionedAnchors.forEach((a) => {
      const slug = slugOf(a.getAttribute('href'));
      if (!slug || mentionedSeen.has(slug)) return;
      mentionedSeen.add(slug);
      mentioned.push(slug);
    });
    const toc = document.querySelector('.ar-toc');
    const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const skips = [];
    let prev = 0;
    headings.forEach((heading) => {
      const level = Number(heading.tagName.slice(1));
      const text = (heading.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (prev && level > prev + 1) skips.push('h' + prev + ' → h' + level + ' before ' + text);
      prev = level;
    });
    const h2Count = [...main.querySelectorAll('h2')].filter((heading) => {
      const text = (heading.textContent || '').trim().toLowerCase();
      if (/^sources?$/.test(text) || /^related/.test(text) || /^supplements?\s+mentioned/.test(text)) return false;
      return !heading.closest('.rc-aend, .ss-mentioned, .ar-faq');
    }).length;
    const hasSources = !!main.querySelector('#sources, .rc-src-list');
    return {
      body,
      mentioned,
      names: mentionedAnchors.map((a) => a.textContent.trim()),
      tocLinks: toc ? [...toc.querySelectorAll('a')].map((a) => a.textContent.trim()) : [],
      tocHidden: !toc,
      skips,
      sections: h2Count + (hasSources ? 1 : 0) + (mentioned.length ? 1 : 0),
      dek: ((document.querySelector('.ar-dek') || {}).textContent || '').trim(),
    };
  });
}

for (const [name, urlPath] of ARTICLES) {
  test(name + ' mentioned list matches the body links', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector('.ar-end');
    const state = await articleState(page);
    expect(state.mentioned, name).toEqual(state.body);
  });

  test(name + ' contents list is real sections or hidden', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector('.ar-titleblock');
    const state = await articleState(page);
    expect(state.tocLinks, name).not.toEqual(['Bottom line']);
    expect(state.skips, name + ' skipped a heading level').toEqual([]);
    if (state.tocHidden) {
      expect(state.sections, name + ' hid a contents list that still has 3 entries').toBeLessThan(3);
      return;
    }
    expect(state.tocLinks.length, name).toBeGreaterThanOrEqual(3);
    const targets = await page.evaluate(() => [...document.querySelectorAll('.ar-toc a')].map((a) => {
      const id = decodeURIComponent((a.getAttribute('href') || '').replace(/^#/, ''));
      const el = document.getElementById(id);
      return { label: a.textContent.trim(), tag: el ? el.tagName : '' };
    }));
    for (const target of targets) {
      const real = target.tag === 'H2' || target.label === 'Sources' || target.label === 'Supplements mentioned';
      expect(real, target.label + ' is not an h2, Sources, or Supplements mentioned').toBe(true);
    }
  });
}

test('bergamot mentioned is only bergamot', async ({ page }) => {
  await goto(page, BERGAMOT);
  await page.waitForSelector('.ar-end');
  const state = await articleState(page);
  expect(state.names).toEqual(['Bergamot']);
  expect(state.body).toEqual(['bergamot-citrus-polyphenol-extract']);
});

test('studied mentioned includes the three body-linked supplements', async ({ page }) => {
  await goto(page, STUDIED);
  await page.waitForSelector('.ar-dek');
  await page.waitForSelector('.ar-end');
  const state = await articleState(page);
  expect(state.dek).toBe(STUDIED_DEK);
  expect(state.dek).not.toBe('500+ trials on creatine.');
  for (const label of ['Psyllium husk', 'Oat beta-glucan', 'Oral rehydration salts']) {
    expect(state.names, label).toContain(label);
  }
  expect(state.tocLinks).not.toEqual(['Bottom line']);
});

test('berberine chart title does not skip a heading level', async ({ page }) => {
  await goto(page, BERBERINE);
  await page.waitForSelector('.rc-chart-title');
  const chart = await page.locator('.rc-chart-title').evaluate((el) => ({
    tag: el.tagName,
    text: (el.textContent || '').replace(/\u2011/g, '-').trim(),
  }));
  expect(chart.tag).toBe('H3');
  expect(chart.text).toBe('Berberine vs. the actual GLP-1 class');
  const state = await articleState(page);
  expect(state.skips).toEqual([]);
});

for (const [name, urlPath, ready] of PAGES) {
  test(name + ' does not overflow horizontally', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector(ready, { timeout: 60000 });
    if (name === 'home') await page.waitForSelector('#s-content .sc', { timeout: 60000 });
    if (name === 'supplement') {
      await page.waitForFunction(() => {
        const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
        if (!links.some((link) => /\/styles\.css/.test(link.href))) return false;
        return links.every((link) => !!link.sheet);
      }, null, { timeout: 20000 });
    }
    const box = await page.evaluate(() => {
      const doc = document.documentElement;
      const footer = document.querySelector('footer.site-footer');
      const rect = footer ? footer.getBoundingClientRect() : null;
      return {
        overflow: doc.scrollWidth - doc.clientWidth,
        footerRight: rect ? Math.round(rect.right) : 0,
        footerWidth: rect ? Math.round(rect.width) : 0,
        inner: window.innerWidth,
      };
    });
    expect(box.overflow, JSON.stringify(box)).toBeLessThanOrEqual(0);
    expect(box.footerWidth, JSON.stringify(box)).toBeLessThanOrEqual(box.inner);
    expect(box.footerRight, JSON.stringify(box)).toBeLessThanOrEqual(box.inner);
  });
}
