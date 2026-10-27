const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const LINKS = [
  ['Browse', '/browse.html'],
  ['Conditions', '/condition/'],
  ['Compare', '/compare/index.html'],
  ['Research', '/#research'],
  ['About', '/about.html'],
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

async function expectBar(page) {
  const bar = page.locator('header.ss-pagebar');
  await expect(bar).toBeVisible();
  for (const [name, href] of LINKS) {
    await expect(bar.locator('a', { hasText: name }).first()).toHaveAttribute('href', href);
  }
  await expect(bar.locator('form.ss-pagebar-search')).toHaveAttribute('action', '/search.html');
  await expect(bar.locator('input[name="q"]')).toBeVisible();
}

test('homepage keeps the trust strip and adds navigation', async ({ page }, testInfo) => {
  await goto(page, '/');
  await page.waitForSelector('#s-content .sc', { timeout: 60000 });
  await expectBar(page);
  if (testInfo.project.name === 'desktop') {
    await expect(page.locator('.beta-bar')).toBeVisible();
  }
  const box = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(box.scroll, 'no horizontal scroll').toBeLessThanOrEqual(box.client);
});

test('inner pages share one bar and keep a close control', async ({ page }) => {
  const pages = [
    ['/supplement/magnesium.html', 'h1.det-h1', '/'],
    ['/a/the-10-most-studied-supplements-on-earth.html', 'main.ar-wrap h1', '/#research'],
    ['/about.html', 'main.ab-wrap h1', '/'],
    ['/privacy.html', 'h1', '/'],
    ['/condition/recurrent-uti.html', 'h1', '/condition/'],
    ['/browse.html', 'h1', '/'],
  ];
  for (const [path, ready, closeHref] of pages) {
    await goto(page, path);
    await page.waitForSelector(ready, { timeout: 60000 });
    await expectBar(page);
    await expect(page.locator('a.ss-pagebar-x')).toHaveAttribute('href', closeHref);
  }
});

test('phone menu opens the links without sideways scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'menu is the phone layout');
  await goto(page, '/supplement/magnesium.html');
  await page.waitForSelector('h1.det-h1', { timeout: 60000 });
  const browse = page.locator('header.ss-pagebar a[href="/browse.html"]');
  await expect(browse).toBeHidden();
  await page.locator('.ss-pagebar-menu').click();
  await expect(browse).toBeVisible();
  const box = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(box.scroll, 'no horizontal scroll').toBeLessThanOrEqual(box.client);
});

test('the bar search opens the search page', async ({ page }) => {
  await goto(page, '/about.html');
  await page.locator('header.ss-pagebar input[name="q"]').fill('magnesium');
  await Promise.all([
    page.waitForURL(/\/search\.html\?q=magnesium/),
    page.locator('header.ss-pagebar form').evaluate((form) => form.submit()),
  ]);
});
