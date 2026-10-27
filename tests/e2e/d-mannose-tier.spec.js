const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

const SUMMARY = 'A large 2024 trial found no benefit for preventing recurrent UTIs.';

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('D-mannose card uses the weak-evidence tier and the MERIT summary', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/supplement/d-mannose.html');
  await page.waitForSelector('.det-tier');
  const tier = page.locator('.det-tier');
  await expect(tier).toHaveClass(/t3/);
  expect(await tier.evaluate((el) => el.textContent)).toBe('Tier 3 — Trending');
  await expect(page.locator('.det-h1')).toHaveText('D-Mannose');
  await expect(page.locator('.det-tldr')).toContainText(SUMMARY);
  await expect(page.locator('.det-score-num')).toHaveText('57');
  await expect(page.locator('.det-cat-pill')).toHaveText(['Recurrent UTI']);
  const hero = await page.locator('.det-hero').innerText();
  expect(hero).not.toMatch(/Promising/i);
  expect(hero).not.toMatch(/UTI prevention/);
  expect(hero).not.toMatch(/Bladder health/);
  const evidence = await page.locator('#det-evidence').innerText();
  expect(evidence).toContain(SUMMARY);
  expect(evidence).toContain('38497963');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('UTI guide card matches the D-mannose page', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/condition/recurrent-uti.html');
  const card = page.locator('.stack-card').filter({ has: page.locator('a[href="/supplement/d-mannose.html"]') });
  expect(await card.locator('.layer').evaluate((el) => el.textContent)).toBe('Tier 3 — Trending');
  expect(await card.locator('.dose').evaluate((el) => el.textContent)).toBe(SUMMARY);
  const text = await card.innerText();
  expect(text).not.toMatch(/Promising/i);
  expect(text).toMatch(/38497963/);
  expect(text).toMatch(/no significant reduction/i);
  expect(errors, errors.join('\n')).toEqual([]);
});
