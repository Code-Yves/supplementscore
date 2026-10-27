const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('footer splits Terms and Privacy and lists the contact email', async ({ page }) => {
  await goto(page, '/');
  const foot = page.locator('footer.site-footer');
  await expect(foot.locator('a[href="/terms.html"]')).toHaveText('Terms');
  await expect(foot.locator('a[href="/privacy.html"]')).toHaveText('Privacy');
  await expect(foot.locator('a[href="mailto:editorial@supplementscore.org"]')).toBeVisible();
});

test('browse no longer points at a Discover tab', async ({ page }) => {
  await goto(page, '/browse.html');
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Discover tab/i);
  expect(text).toContain('search box on the home page');
});

test('creatine versus beta-alanine is Performance', async ({ page }) => {
  await goto(page, '/compare/index.html');
  const card = page.locator('a[href="creatine-vs-beta-alanine.html"]');
  await expect(card).toHaveAttribute('data-primary', 'Performance');
});

test('creatine search does not repeat an article URL', async ({ page }) => {
  await goto(page, '/');
  await page.locator('#ix-hero-search').fill('creatine');
  await page.waitForSelector('#ix-ac [data-href]');
  const hrefs = await page.locator('#ix-ac [data-href]').evaluateAll((els) =>
    els.map((el) => (el.getAttribute('data-href') || '').replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-').split('?')[0].toLowerCase())
  );
  expect(hrefs.length).toBeGreaterThan(0);
  expect(new Set(hrefs).size).toBe(hrefs.length);
});

test('homepage search dropdown paints above the filter bar', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop overlap');
  await page.setViewportSize({ width: 1280, height: 900 });
  await goto(page, '/');
  await page.locator('#ix-hero-search').fill('creatine');
  await page.waitForSelector('#ix-ac .gs-ac-item');
  const hit = await page.evaluate(() => {
    const menu = document.querySelector('#ix-ac');
    const bar = document.querySelector('#main-sticky');
    const menuBox = menu.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    const y = Math.min(menuBox.bottom - 8, barBox.bottom - 8);
    if (y < barBox.top || y < menuBox.top) return { overlaps: false };
    const el = document.elementFromPoint(menuBox.left + 24, y);
    return { overlaps: true, inMenu: !!(el && el.closest('#ix-ac')) };
  });
  expect(hit.overlaps).toBe(true);
  expect(hit.inMenu).toBe(true);
});

test('comparison pages show the composite score', async ({ page }) => {
  await goto(page, '/compare/melatonin-vs-magnesium-glycinate.html');
  const table = page.locator('h2', { hasText: 'Scores on the same scale' }).locator('xpath=following-sibling::div[1]//table');
  await expect(table).toContainText('/100');
  await expect(table).toContainText('Melatonin');
  await expect(table).toContainText('Magnesium glycinate');
});

test('sleep guide names a caution and drops the alias card', async ({ page }) => {
  await goto(page, '/sx/sleep.html');
  await expect(page.locator('.sx-evidence')).toBeVisible();
  await expect(page.locator('.sx-avoid')).toBeVisible();
  await expect(page.locator('a[href="/hub/sleep.html"]')).toBeVisible();
  await expect(page.locator('a[href="/supplement/magnesium-bisglycinate.html"]')).toHaveCount(0);
});

test('prescription tags are not labelled Synergy', async ({ page }) => {
  await goto(page, '/supplement/magnesium-glycinate.html');
  const tags = await page.locator('.det-ltag').allInnerTexts();
  expect(tags).not.toContain('Synergy');
  expect(tags).toContain('Possible benefit (low evidence)');
  await expect(page.locator('.det-med-note')).toContainText('No known conflict');
  expect(['Avoid', 'Caution']).toContain(tags[0]);
});

test('kids multivitamin does not use the adult card', async ({ page }) => {
  await goto(page, '/brand/nature-made.html');
  const row = page.locator('#p-52');
  await expect(row).toContainText('healthy-adults multivitamin page does not apply');
  await expect(row.locator('a[href="/supplement/multivitamins.html"]')).toHaveCount(0);
  await expect(row.locator('a[href*="kids-multivitamin-gummies"]')).toBeVisible();
});

test('score-change log is a public CSV', async ({ page }) => {
  const response = await page.goto('/data/score-changes.csv');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('date,slug,from,to,reason');
  await goto(page, '/about.html');
  await expect(page.locator('a[href="/data/score-changes.csv"]')).toBeVisible();
});
