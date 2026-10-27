const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const NOTE = 'None of these organisations reviews or endorses SupplementScore.';

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('homepage drops the regulator and trial-window claims', async ({ page }) => {
  await goto(page, '/');
  await page.waitForSelector('#s-content .sc', { timeout: 60000 });
  const html = await page.content();
  expect(html).not.toContain('Considered safe and effective by the WHO, NIH, and EFSA');
  expect(html).not.toContain('published between 2024 and early 2026');
  expect(html).not.toContain('Backed by meta-analyses; see each page for regulator positions.');
  expect(html).not.toContain('Public sources we cite');
  expect(html).toContain('See each page for regulator positions.');
  expect(html).toContain('updated with trials through early 2026');
  await expect(page.locator('.ix-hero .ix-sources')).toHaveCount(0);
  const hero = await page.locator('.ix-hero').innerText();
  expect(hero).not.toMatch(/Sources we cite/);
  expect(hero).not.toMatch(/View all 51 other sources/);
  expect(hero).not.toMatch(/None of these organisations/);
  const box = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(box.scroll, 'no horizontal scroll').toBeLessThanOrEqual(box.client);
});

test('sources list carries the same non-endorsement note', async ({ page }) => {
  await goto(page, '/');
  await page.waitForSelector('#s-content .sc', { timeout: 60000 });
  await page.locator('#sources-modal').evaluate((el) => el.classList.add('open'));
  await expect(page.locator('#sources-modal .src-modal-sub')).toHaveText(NOTE);
});
