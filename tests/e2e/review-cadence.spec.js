const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('Terms and the editorial board use the About cadence', async ({ page }) => {
  await goto(page, '/terms.html');
  const terms = await page.locator('main, body').innerText();
  expect(terms).not.toContain('Tier 1 entries weekly');
  expect(terms).toContain('Tier 1 every 30 days');
  await expect(page.locator('a[href="about.html#cadence"]')).toBeVisible();

  await goto(page, '/editorial-board.html');
  const board = await page.locator('body').innerText();
  expect(board).not.toContain('quarterly re-review');
  expect(board).toContain('Tier 1 is every 30 days');
  await expect(page.locator('a[href="/about.html#cadence"]')).toBeVisible();

  await goto(page, '/about.html');
  const header = await page.locator('.ab-kicker time').getAttribute('datetime');
  const section = await page.locator('#transparency time').first().getAttribute('datetime');
  expect(header).toBe('2026-10-21');
  expect(section).toBe(header);
});

test('a comparison card uses the comparison page date', async ({ page }) => {
  await goto(page, '/compare/');
  const card = page.locator('a[href="melatonin-vs-magnesium-glycinate.html"] .meta');
  await expect(card).toContainText('Updated 2026-10-21');
});
