const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('recurrent UTI guide follows the 2024 MERIT null result', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/condition/recurrent-uti.html');
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/PMID\s*38497963|38497963/);
  expect(text).toMatch(/no significant (reduction|benefit)/i);
  expect(text).not.toMatch(/The two that work/i);
  expect(text).not.toMatch(/prevention comparable to low-dose antibiotics/i);
  expect(text).not.toMatch(/Multiple RCTs show prevention benefit/i);
  const quick = await page.locator('.ca-pick').innerText();
  expect(quick).toMatch(/Do not add D-mannose/i);
  expect(quick).not.toMatch(/D-mannose 2 g\/day \+/);
  expect(errors, errors.join('\n')).toEqual([]);
});
