const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('profile wizard uses general ranges and a separate pregnancy question', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/#profile');
  await page.locator('#profile-gate .gate-btn').click();
  await expect(page.locator('#wiz-step-3')).toBeAttached();

  const sexText = await page.locator('#wiz-step-3 .pf-sex-pill').first().innerText();
  expect(sexText).toMatch(/Male/);
  expect(sexText).toMatch(/Female/);
  expect(sexText).not.toMatch(/Pregnant/);
  expect(await page.locator('#bp').count()).toBe(0);

  const step3 = await page.locator('#wiz-step-3').evaluate((el) => el.textContent);
  expect(step3).toMatch(/Are you pregnant or breastfeeding/i);
  expect(step3).not.toMatch(/±25%|\+\/-25%/);
  expect(step3).toMatch(/discuss them with your doctor/i);

  const step5 = await page.locator('#wiz-step-5').evaluate((el) => el.textContent);
  expect(step5).not.toMatch(/filter out supplements that interact/i);
  expect(step5).toMatch(/partial list/i);
  expect(step5).toMatch(/does not mean a combination is safe/i);

  const step7 = await page.locator('#wiz-step-7').evaluate((el) => el.textContent);
  expect(step7).not.toMatch(/4,000 IU|2,000 IU; otherwise/);
  expect(step7).not.toMatch(/selenium \+ iodine/i);
  expect(step7).not.toMatch(/auto-cap/i);
  expect(step7).toMatch(/Discuss the dose with your doctor/);
  expect(step7).toMatch(/We will not set a dose from your labs/);

  const doses = await page.evaluate(() => {
    sex = 'f';
    pregnantOrBf = false;
    bloodWork = { vitD: 12, ferritin: 10, b12: 180, triglycerides: 250, tsh: 8 };
    const kidney = document.getElementById('kidney-fn');
    const liver = document.getElementById('liver-fn');
    if (kidney) kidney.value = 'severe';
    if (liver) liver.value = 'cirrhosis';
    const read = (name) => {
      const row = getPersonalizedDose({ n: name });
      return row ? row.dose : '';
    };
    pickSex('fp');
    const migrated = { sex, pregnantOrBf };
    setPregnantOrBf(true);
    const blocked = _buildHardAvoidPredicate()('Berberine');
    setPregnantOrBf(false);
    pickSex('m');
    const notBlocked = _buildHardAvoidPredicate()('Berberine');
    return {
      migrated,
      vitaminD: read('Vitamin D3'),
      selenium: read('Selenium'),
      iodine: read('Iodine'),
      magnesium: read('Magnesium'),
      blocked: !!(blocked && blocked.reason),
      notBlocked: !notBlocked,
    };
  });

  expect(doses.migrated).toEqual({ sex: 'f', pregnantOrBf: true });
  expect(doses.blocked).toBe(true);
  expect(doses.notBlocked).toBe(true);
  for (const dose of [doses.vitaminD, doses.selenium, doses.iodine, doses.magnesium]) {
    expect(dose).toMatch(/Discuss the dose with your doctor/i);
    expect(dose).not.toMatch(/4,000|4000/);
    expect(dose).not.toMatch(/AVOID supplemental magnesium|max 250 mg|CKD stage 3 cap/i);
  }
  expect(doses.selenium).toMatch(/55/);
  expect(doses.vitaminD).toMatch(/1,000/);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('about page does not promise a complete interaction filter', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/about.html');
  const main = await page.locator('main').innerText();
  expect(main).toMatch(/partial list/i);
  expect(main).toMatch(/does not mean a combination is safe/i);
  expect(main).toMatch(/Discuss supplements and doses with your doctor or pharmacist/);
  expect(main).not.toMatch(/Drug–supplement interactions are a separate system, in build as phase 2 of the roadmap\./);
  expect(errors, errors.join('\n')).toEqual([]);
});
