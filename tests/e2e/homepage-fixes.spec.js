const { test, expect } = require('@playwright/test');
const { install, goto, quietLoader, trackConsole } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

async function pastEdge(page, selector) {
  return page.evaluate((sel) => {
    const vw = document.documentElement.clientWidth;
    return [...document.querySelectorAll(sel)].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        left: Math.round(r.left * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        vw,
      };
    }).filter((box) => box.right > vw + 0.5 || box.left < -0.5);
  }, selector);
}

test('homepage fits at 320', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '320 is a resized desktop viewport');
  const errors = trackConsole(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await goto(page, '/');
  await quietLoader(page);
  await page.waitForSelector('#s-content .lc-name', { timeout: 60000 });

  const doc = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(doc.scroll, 'no horizontal scroll').toBeLessThanOrEqual(doc.client);

  async function expectInside() {
    expect(await pastEdge(page, '#hero.mag'), 'hero card').toEqual([]);
    expect(await pastEdge(page, '#hero.mag .mag-lead, #hero.mag .mag-side, #hero.mag h2'), 'hero text').toEqual([]);
    expect(await pastEdge(page, '.lc-name'), 'supplement name').toEqual([]);
  }
  await expectInside();
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => document.querySelector('.mag-arrow[data-dir="1"]').click());
    await expectInside();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('research menu counts match the research page', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => {
    const list = document.querySelector('#research-list-view .article-list, #rh-source .article-list');
    return list && list.dataset.deferredLoaded === '1';
  }, null, { timeout: 30000 });
  const counts = await page.evaluate(() => {
    return [...document.querySelectorAll('#art-filter-menu .cdd-item')].map((item) => ({
      val: item.getAttribute('data-val'),
      label: (item.querySelector('.art-name') || item).textContent.replace(/\s+/g, ' ').trim(),
    }));
  });
  const byVal = {};
  counts.forEach((row) => { byVal[row.val] = row.label; });
  expect(byVal.guide).toBe('Guide (148)');
  expect(byVal.breakthrough).toBe('Breakthrough (143)');
  expect(byVal.quickread).toBe('Top 10 Lists (17)');
  expect(byVal.stack).toBe('Stack (25)');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('reality check uses one kicker', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => {
    const list = document.querySelector('#research-list-view .article-list, #rh-source .article-list');
    return list && list.dataset.deferredLoaded === '1';
  }, null, { timeout: 30000 });
  const kickers = await page.evaluate(() => {
    return [...document.querySelectorAll('#research-list-view .article-card, #rh-source .article-card')].map((card) => {
      const cat = card.querySelector('.article-cat');
      const title = card.querySelector('.article-title');
      return {
        kicker: ((cat && cat.textContent) || '').replace(/\s+/g, ' ').trim(),
        title: ((title && title.textContent) || '').replace(/\s+/g, ' ').trim(),
      };
    });
  });
  const myths = kickers.filter((row) => /^myth$/i.test(row.kicker));
  expect(myths, 'no MYTH kicker').toEqual([]);
  const liver = kickers.find((row) => row.title.indexOf('Desiccated Beef Liver') === 0);
  const hair = kickers.find((row) => row.title.indexOf('Hair Loss on Ozempic') === 0);
  expect(liver && liver.kicker).toBe('Reality Check');
  expect(hair && hair.kicker).toBe('Reality Check');
  expect(errors, errors.join('\n')).toEqual([]);
});
