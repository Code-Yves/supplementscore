const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const {
  trackConsole, install, goto, assertNoEntityText, tapFailures, expectTaps,
} = require('./helpers');

const PAGES = [
  {
    name: 'homepage',
    path: '/',
    ready: '#sfbar-main .cdd-btn',
    include: ['#hero', '#supplements-view', 'footer.site-footer'],
  },
  {
    name: 'article',
    path: '/a/berberine-is-it-really-nature-s-ozempic.html',
    ready: '.ar-toc',
    include: ['main.ar-wrap', 'footer.site-footer'],
  },
  {
    name: 'supplement',
    path: '/supplement/magnesium.html',
    ready: 'h1.det-h1',
    include: ['main.det-wrap', 'footer.site-footer'],
  },
  {
    name: 'topic',
    path: '/hub/sleep.html',
    ready: 'h1.hub-title',
    include: ['main.hub-wrap', 'footer.site-footer'],
  },
  {
    name: 'about',
    path: '/about.html',
    ready: 'main.ab-wrap h1',
    include: ['main.ab-wrap', 'footer.site-footer'],
  },
  {
    name: 'symptom',
    path: '/sx/sleep.html',
    ready: 'a.rc-close',
    include: ['main.sx-wrap', 'footer.site-footer'],
  },
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

for (const entry of PAGES) {
  test('axe ' + entry.name, async ({ page }) => {
    const errors = trackConsole(page);
    await goto(page, entry.path);
    await page.waitForSelector(entry.ready, { timeout: 60000 });
    if (entry.name === 'homepage') await page.waitForSelector('#s-content .sc', { timeout: 60000 });
    if (entry.name === 'supplement') {
      await page.waitForFunction(() => {
        const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
        if (!links.some((link) => /\/styles\.css/.test(link.href))) return false;
        return links.every((link) => !!link.sheet);
      }, null, { timeout: 20000 });
    }
    await assertNoEntityText(page);

    let builder = new AxeBuilder({ page });
    for (const selector of entry.include) builder = builder.include(selector);
    const results = await builder.analyze();
    const bad = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
    const summary = bad.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.slice(0, 12).map((node) => ({
        target: node.target,
        html: (node.html || '').slice(0, 180),
      })),
    }));
    expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('tap targets on the homepage and an article', async ({ page }, testInfo) => {
  await goto(page, '/');
  await page.waitForSelector('#sfbar-main .cdd-btn', { timeout: 60000 });
  await page.waitForSelector('#s-content .tier-more', { timeout: 60000 });
  expectTaps(await tapFailures(page, '#sfbar-main .cdd-btn'), 'filter cells');
  expectTaps(await tapFailures(page, '#hero.mag .mag-arrow'), 'hero arrows');
  expectTaps(await tapFailures(page, '#s-content .tier-more'), 'show more');
  expectTaps(await tapFailures(page, '#ix-hero-search'), 'search field');
  expectTaps(await tapFailures(page, '.site-footer-contrib-form input, .site-footer-contrib-form button'), 'newsletter');
  await page.evaluate(() => document.querySelector('#cat-filter-wrap .cdd-btn').click());
  expectTaps(await tapFailures(page, '#cat-filter-menu .cdd-item'), 'goal menu items');

  await goto(page, '/a/berberine-is-it-really-nature-s-ozempic.html');
  await page.waitForSelector('.ar-toc');
  if (testInfo.project.name === 'iphone') await page.locator('.ar-toc summary').click();
  await page.waitForSelector('.ar-toc a');
  expectTaps(await tapFailures(page, '.ar-prevnext a, .rc-share, .rc-close'), 'article bar');
  expectTaps(await tapFailures(page, '.ar-toc a, .ar-toc summary'), 'contents links');
});
