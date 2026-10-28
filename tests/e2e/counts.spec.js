const { test, expect } = require('@playwright/test');
const { install, goto, quietLoader, trackConsole } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('homepage, bibliography, and the export use one pair of totals', async ({ page }) => {
  const errors = trackConsole(page);
  const counts = await (await page.request.get('/data/site-counts.json')).json();
  const studies = counts.studies.toLocaleString('en-US');
  const supplements = String(counts.supplements);

  await goto(page, '/');
  await quietLoader(page);
  const hero = await page.locator('.hero-stat').allInnerTexts();
  expect(hero.join(' ')).toContain(supplements);
  expect(hero.join(' ')).toContain(studies);
  expect(hero.join(' ')).not.toMatch(/780\+|3,200\+/);

  await page.waitForSelector('.pop-head-t', { timeout: 30000 });
  const banner = await page.locator('.pop-head-t').first().innerText();
  const note = await page.locator('.pop-head-m').first().innerText();
  expect(banner).toBe('Trending supplements');
  expect(note).toMatch(/not the highest scores/i);
  expect(note).not.toMatch(/Highest evidence scores first/);

  await goto(page, '/bibliography.html');
  await expect(page.locator('.bib-sub')).toContainText(studies + ' unique PubMed sources');
  await page.waitForSelector('#bib-body tr');
  const rows = await page.locator('#bib-body tr').count();
  expect(rows).toBeGreaterThan(0);
  expect(rows).toBeLessThan(counts.studies);
  await expect(page.locator('#bib-status')).toContainText('Showing A');
  const html = await page.content();
  expect(html).not.toMatch(/&amp;[a-z]+;/);
  await page.locator('#bib-letters button[data-letter="M"]').click();
  await expect(page.locator('#bib-status')).toContainText('Showing M');
  await page.locator('#bib-search').fill('beta');
  await expect(page.locator('#bib-body')).not.toContainText('&beta;');

  await goto(page, '/browse.html');
  const lede = await page.locator('.bro-lede').innerText();
  expect(lede).toContain(supplements);
  expect(lede).not.toMatch(/780\+/);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('hub and symptom scores match the supplement page', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/hub/creatine.html');
  const creatine = (await page.locator('a[href="/supplement/creatine-monohydrate.html"] .hub-sup-score-num').innerText()).trim();
  await goto(page, '/supplement/creatine-monohydrate.html');
  await expect(page.locator('.det-score-num')).toHaveText(creatine);

  await goto(page, '/sx/sleep.html');
  const mag = (await page.locator('a[href="/supplement/magnesium-glycinate.html"] .sx-score').innerText()).trim();
  await goto(page, '/supplement/magnesium-glycinate.html');
  await expect(page.locator('.det-score-num')).toHaveText(mag);
  expect(mag).toBe('80');

  expect(errors, errors.join('\n')).toEqual([]);
});
