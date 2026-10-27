const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('transparency page states both counts and the physician status', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/transparency.html');
  await page.waitForSelector('main.made-wrap h1');
  await expect(page.locator('h1')).toHaveText('How SupplementScore is made');
  const text = await page.locator('main.made-wrap').innerText();
  expect(text).toContain('3,033');
  expect(text).toContain('roughly 11,000');
  expect(text).toContain('1.5 hours');
  expect(text).toContain('4 hours');
  expect(text).toContain('an estimate');
  expect(text).not.toContain('1,505,381,664');
  expect(text.toLowerCase()).not.toContain('participant-hour');
  expect(text).toContain('openly mostly AI-generated');
  expect(text).toContain('same credible sources doctors rely on');
  expect(text).toContain('bringing physicians on board');
  expect(text.toLowerCase()).not.toContain('back-checked');
  expect(text.toLowerCase()).not.toContain('reviewed by');
  await expect(page.locator('main a[href="/"]')).toHaveCount(2);
  await expect(page.locator('a.ss-pagebar-x')).toHaveAttribute('href', '/');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the transparency link is in the footer, not the homepage body', async ({ page }) => {
  await goto(page, '/');
  await page.waitForSelector('footer.site-footer');
  const placement = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href="/transparency.html"]')];
    return {
      total: links.length,
      outsideFooter: links.filter((a) => !a.closest('footer')).length,
      footerText: links.filter((a) => a.closest('footer')).map((a) => a.textContent.replace(/\s+/g, ' ').trim()),
    };
  });
  expect(placement.outsideFooter, JSON.stringify(placement)).toBe(0);
  expect(placement.total).toBeGreaterThan(0);
  expect(placement.footerText.join(' ')).toContain('How SupplementScore is made');
});
