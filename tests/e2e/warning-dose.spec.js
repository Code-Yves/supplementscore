const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

// Warning-led protocols must not surface a number as the Daily dose stat.
// The full sentence stays in the protocol section.
const CASES = [
  {
    slug: 'pennyroyal-oil',
    label: 'Do not take',
    forbidden: /10\s*mL/i,
  },
  {
    slug: 'oil-of-wintergreen',
    label: 'Do not take',
    forbidden: /teaspoon|21/i,
  },
  {
    slug: 'camphor-oil',
    label: 'Do not take',
    forbidden: /2\s*g/i,
  },
  {
    slug: 'beta-carotene',
    label: 'Not for everyone',
    forbidden: /5\s*[–\-]\s*15|mg\/day/i,
  },
  {
    slug: 'melatonin-high-dose-nightly',
    label: 'Avoid',
    forbidden: /1\s*mg/i,
    // The ?slug= shell strips the parenthetical and sends this card to the
    // ordinary melatonin page. The prerendered page is the one readers open.
    detail: false,
  },
  {
    slug: 'black-cohosh-high-dose',
    label: 'Avoid',
    forbidden: /160/,
  },
  {
    slug: 'nad',
    label: 'Not advised',
    forbidden: /250|500|mg/i,
  },
  {
    slug: 'grapefruit-seed-extract',
    label: 'Check interactions',
    forbidden: /3A|\d/,
  },
];

const UNCHANGED = [
  { slug: 'creatine-monohydrate', label: '3-5 g/day' },
  { slug: 'nattokinase', label: '2,000–4,000 FU/day', sub: 'Check interactions' },
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

async function dailyDose(page) {
  const stat = page.locator('.det-stat').filter({
    has: page.locator('.det-stat-lbl', { hasText: 'Daily dose' }),
  });
  await expect(stat).toHaveCount(1);
  const value = (await stat.locator('.det-stat-val').innerText()).replace(/\s+/g, ' ').trim();
  return value;
}

for (const item of CASES) {
  test(item.slug + ' daily dose is a warning label, not a number', async ({ page }) => {
    const errors = trackConsole(page);
    await goto(page, '/supplement/' + item.slug + '.html');
    const baked = await dailyDose(page);
    expect(baked).toBe(item.label);
    expect(baked).not.toMatch(/\d/);
    expect(baked).not.toMatch(item.forbidden);

    if (item.detail !== false) {
      await goto(page, '/supplement.html?slug=' + item.slug);
      await page.waitForSelector('.det-stat-val', { timeout: 60000 });
      const live = await dailyDose(page);
      expect(live).toBe(item.label);
      expect(live).not.toMatch(/\d/);
      expect(live).not.toMatch(item.forbidden);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

for (const item of UNCHANGED) {
  test(item.slug + ' keeps its real daily dose', async ({ page }) => {
    await goto(page, '/supplement/' + item.slug + '.html');
    expect(await dailyDose(page)).toBe(item.label);
    if (item.sub) {
      const stat = page.locator('.det-stat').filter({
        has: page.locator('.det-stat-lbl', { hasText: 'Daily dose' }),
      });
      expect((await stat.locator('.det-stat-sub').innerText()).replace(/\s+/g, ' ').trim()).toBe(item.sub);
      await goto(page, '/supplement.html?slug=' + item.slug);
      await page.waitForSelector('.det-stat-val', { timeout: 60000 });
      expect(await dailyDose(page)).toBe(item.label);
      const live = page.locator('.det-stat').filter({
        has: page.locator('.det-stat-lbl', { hasText: 'Daily dose' }),
      });
      expect((await live.locator('.det-stat-sub').innerText()).replace(/\s+/g, ' ').trim()).toBe(item.sub);
    }
  });
}
