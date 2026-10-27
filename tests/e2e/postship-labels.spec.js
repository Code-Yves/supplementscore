const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');
const labels = require('../fixtures/pr107-labels.json');
const paired = require('../fixtures/static-detail-doses.json');

// Expected labels are the post-ship recommendations for the 88 hotfix
// sentences. Wormwood high-dose and herbal diuretics are "Avoid". Methylene
// blue and chronic licorice root stay "Avoid" because a prescribed or
// deglycyrrhizinated use remains. Lethal, fatal, toxic, banned, illegal,
// controlled-substance, carcinogen, and no-safe-dose sentences are "Do not take".

test.beforeEach(async ({ page }) => {
  await install(page);
});

function sameName(a, b) {
  const dash = /[\u2010\u2011\u2012\u2013\u2014\u2212-]/g;
  return a.replace(dash, '-').replace(/\s+/g, ' ').trim() === b.replace(dash, '-').replace(/\s+/g, ' ').trim();
}

async function dailyDose(page) {
  const stat = page.locator('.det-stat').filter({
    has: page.locator('.det-stat-lbl', { hasText: 'Daily dose' }),
  });
  await expect(stat).toHaveCount(1);
  return (await stat.locator('.det-stat-val').innerText()).replace(/\s+/g, ' ').trim();
}

test('every post-ship label matches on the static page and the detail view', async ({ page }) => {
  test.setTimeout(600000);
  for (const item of labels) {
    await goto(page, '/supplement/' + item.slug + '.html');
    expect(await dailyDose(page), item.supplement + ' static').toBe(item.expected);
    // detail:false — the ?slug= shell resolves this file slug to a different card.
    // The prerendered page is the one readers open. See warning-dose.spec.js.
    if (item.detail !== false) {
      await goto(page, '/supplement.html?slug=' + item.slug);
      await page.waitForSelector('.det-stat-val', { timeout: 60000 });
      const h1 = (await page.locator('h1.det-h1').innerText()).replace(/\s+/g, ' ').trim();
      expect(sameName(h1, item.supplement), item.slug + ' detail title\n' + h1).toBe(true);
      expect(await dailyDose(page), item.supplement + ' detail').toBe(item.expected);
    }
  }
});

test('static and detail doses agree for the pages that had drifted', async ({ page }) => {
  test.setTimeout(180000);
  for (const item of paired) {
    await goto(page, '/supplement/' + item.slug + '.html');
    const baked = await dailyDose(page);
    expect(baked, item.supplement + ' static').toBe(item.expected);
    await goto(page, '/supplement.html?slug=' + item.slug);
    await page.waitForSelector('.det-stat-val', { timeout: 60000 });
    expect(await dailyDose(page), item.supplement + ' detail').toBe(item.expected);
    expect(await dailyDose(page), item.supplement + ' views differ').toBe(baked);
  }
});

test('stacked static stats do not split words at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const cases = [
    { slug: 'grapefruit-seed-extract', label: 'Check interactions' },
    { slug: 'vanadium', label: 'Do not supplement' },
  ];
  for (const item of cases) {
    await goto(page, '/supplement/' + item.slug + '.html');
    const info = await page.evaluate(() => {
      const stat = [...document.querySelectorAll('.det-stat')].find((el) => {
        const lbl = el.querySelector('.det-stat-lbl');
        return lbl && /daily dose/i.test(lbl.textContent || '');
      });
      const val = stat.querySelector('.det-stat-val');
      const node = val.firstChild;
      const words = [];
      const re = /\S+/g;
      const text = node ? node.textContent : '';
      let match;
      while ((match = re.exec(text))) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        words.push({ word: match[0], lines: range.getClientRects().length });
      }
      const style = getComputedStyle(val);
      return {
        text: val.innerText.replace(/\s+/g, ' ').trim(),
        raw: (val.textContent || '').replace(/\s+/g, ' ').trim(),
        words,
        statW: stat.getBoundingClientRect().width,
        rowW: stat.parentElement.getBoundingClientRect().width,
        hyphens: style.hyphens || style.webkitHyphens,
      };
    });
    expect(info.text, item.slug).toBe(item.label);
    expect(info.raw, item.slug + ' inserted a hyphen').toBe(item.label);
    expect(info.words.filter((w) => w.lines > 1), item.slug + ' mid-word break').toEqual([]);
    expect(info.statW, item.slug + ' did not stack').toBeGreaterThan(info.rowW * 0.9);
    expect(String(info.hyphens), item.slug + ' hyphenation').toMatch(/none|manual/);
  }
});
