const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('browse lists 200 different supplement pages', async ({ page }) => {
  await goto(page, '/browse.html');
  const links = await page.locator('#bro-list a').evaluateAll((anchors) => anchors.map((a) => ({
    href: a.getAttribute('href'),
    name: a.textContent.trim(),
  })));
  expect(links).toHaveLength(200);
  expect(new Set(links.map((link) => link.href)).size).toBe(200);
  const hrefs = links.map((link) => link.href);
  const names = links.map((link) => link.name);
  expect(hrefs).not.toContain('/supplement/magnesium-bisglycinate.html');
  expect(hrefs).not.toContain('/supplement/amalaki-amla.html');
  expect(hrefs).toContain('/supplement/magnesium-glycinate.html');
  expect(hrefs).toContain('/supplement/coq10.html');
  expect(hrefs).toContain('/supplement/coq10-ubiquinone-classic-form.html');
  expect(names).not.toContain('Psyllium husk (soluble fibre)');
  expect(names).not.toContain('Magnesium bisglycinate');
  expect(names).toContain('Psyllium husk (Plantago ovata)');
});

test('the public supplement catalog drops alias rows', async ({ request }) => {
  const rows = await (await request.get('/data/supplements.json')).json();
  const names = rows.map((row) => row.name);
  expect(new Set(names).size).toBe(names.length);
  expect(names).toHaveLength(734);
  expect(names).not.toContain('Magnesium bisglycinate');
  expect(names).not.toContain('Amalaki/Amla (Emblica officinalis, standardised)');
  expect(names).not.toContain('Sodium bicarbonate (exercise buffer)');
  expect(names).toContain('Magnesium glycinate');
  expect(names).toContain('Sodium bicarbonate (sports)');
});
