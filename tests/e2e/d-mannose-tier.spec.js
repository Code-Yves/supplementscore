const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

const SUMMARY = 'A large 2024 trial found no benefit for preventing recurrent UTIs.';
const SAFETY = 'D-mannose is generally well tolerated. It can cause stomach upset or loose stools at high doses. Use caution in diabetes, because it is a sugar. There is no good pregnancy data.';
const NAME = 'D-Mannose';
const ARTICLE = 'D-Mannose for UTIs: Evidence Collapsed';

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('D-mannose card uses the weak-evidence tier and the MERIT summary', async ({ page }, testInfo) => {
  const errors = trackConsole(page);
  await goto(page, '/supplement/d-mannose.html');
  await page.waitForSelector('.det-tier');
  const tier = page.locator('.det-tier');
  await expect(tier).toHaveClass(/t3/);
  expect(await tier.evaluate((el) => el.textContent)).toBe('Tier 3 — Trending');
  expect(await page.locator('.det-h1').evaluate((el) => el.textContent)).toBe(NAME);
  const nowrap = await page.locator('.det-h1 span').evaluate((el) => getComputedStyle(el).whiteSpace);
  expect(nowrap).toBe('nowrap');
  expect(await page.locator('.det-tldr').evaluate((el) => el.innerHTML)).toContain('white-space:nowrap');
  const wrap = await page.locator('.det-tldr').evaluate((el) => getComputedStyle(el).textWrap);
  expect(wrap).toBe(testInfo.project.name === 'iphone' ? 'pretty' : 'balance');
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
  expect(text).toMatch(/did not significantly reduce/i);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('UTI compare pages show the downgraded D-mannose score', async ({ page }) => {
  const errors = trackConsole(page);
  const pages = [
    '/compare/d-mannose-vs-cranberry-for-uti.html',
    '/compare/lactoferrin-vs-d-mannose-for-uti.html',
  ];
  for (const path of pages) {
    await goto(page, path);
    const row = page.locator('.rc-supp-row[data-supp-slug="d-mannose"]');
    await expect(row).toBeVisible();
    await expect(row.locator('.rc-supp-row-s')).toHaveText('57');
    const meta = await row.locator('.rc-supp-row-meta').innerText();
    expect(meta).toContain('Efficacy 1/5');
    expect(meta).toContain('Recurrent UTI');
    expect(meta).not.toContain('Efficacy 2/5');
    const h1 = await page.locator('h1').evaluate((el) => el.textContent);
    expect(h1).toContain(NAME);
    expect(h1.includes('\u2011')).toBe(false);
    expect(await page.locator('h1 span').evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('nowrap');
  }
  const verdict = await page.locator('main').innerText();
  expect(verdict).not.toMatch(/strongest trial weight/i);
  expect(verdict).not.toMatch(/better trial weight/i);
  expect(verdict).toMatch(/no better than placebo/i);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('D-mannose safety answer is about safety', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/supplement/d-mannose.html');
  const question = page.getByRole('heading', { name: /Is D.Mannose safe\?/ });
  await expect(question.locator('xpath=following-sibling::p[1]')).toHaveText(SAFETY);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('Evidence Collapsed article is not filed as a Breakthrough', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/a/d-mannose-for-utis-evidence-collapsed-with-the-2024-merit-trial.html');
  await expect(page.locator('.ar-kicker')).toHaveText('Research Update');
  const h1 = await page.locator('h1').evaluate((el) => el.textContent);
  expect(h1.startsWith(NAME)).toBe(true);
  expect(h1.includes('\u2011')).toBe(false);
  expect(await page.locator('h1 span').first().evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('nowrap');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('homepage search for mannose finds the Evidence Collapsed article', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => typeof window.heroNext === 'function' && typeof window.loadDeferredArticleCards === 'function');
  await page.evaluate(() => window.loadDeferredArticleCards());
  await page.waitForFunction(() => [...document.querySelectorAll('.article-title')].some((el) => el.textContent.includes('D-Mannose for UTIs: Evidence Collapsed')));
  const input = page.locator('#ix-hero-search');
  await input.click();
  await input.fill('mannose');
  const hit = page.locator('#ix-ac.vis .gs-ac-item[data-type="art"]').filter({ hasText: ARTICLE });
  await expect(hit).toHaveCount(1);
  await expect(hit).toHaveAttribute('data-href', /d-mannose-for-utis-evidence-collapsed/);
  const title = await hit.locator('.gs-ac-art-title').innerText();
  expect(title).toContain('D-Mannose');
  expect(title).not.toContain('\u2011');
  await input.fill('d-mannose for utis');
  await expect(hit).toHaveCount(1);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('detail pop-up keeps hyphenated summary words together', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => typeof window.heroNext === 'function');
  await page.locator('#ix-hero-search').click();
  await page.locator('#ix-hero-search').fill('D-Mannose');
  const suggestion = page.locator('#ix-ac.vis .gs-ac-item[data-type="supp"][data-name="D-Mannose"]');
  await expect(suggestion).toBeVisible();
  await page.waitForFunction(() => window.SSModal && typeof window.SSModal.open === 'function');
  await suggestion.click();
  const tldr = page.frameLocator('iframe.ssm-frame').locator('.det-tldr');
  await expect(tldr).toContainText('found D-mannose');
  const report = await tldr.evaluate((el) => {
    const words = (el.textContent.match(/[^\s]*-[^\s]*/g) || []).filter((word) => /[A-Za-z0-9]/.test(word));
    const spans = [...el.querySelectorAll('span')]
      .filter((span) => getComputedStyle(span).whiteSpace === 'nowrap')
      .map((span) => span.textContent);
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const chars = [];
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.nodeValue.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        chars.push({ ch: node.nodeValue[i], top: Math.round(rect.top) });
      }
    }
    const lines = [];
    let cur = null;
    for (const c of chars) {
      if (!cur || Math.abs(c.top - cur.top) > 2) {
        cur = { top: c.top, text: '' };
        lines.push(cur);
      }
      cur.text += c.ch;
    }
    return { words, spans, lines: lines.map((line) => line.text) };
  });
  for (const word of report.words) {
    expect(report.spans.some((span) => span.includes(word)), word).toBe(true);
  }
  expect(report.lines.join('\n')).not.toMatch(/D-\s*$/m);
  expect(report.lines.some((line) => line.includes('D-mannose'))).toBe(true);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('uva ursi does not recommend D-mannose', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/supplement.html?slug=uva-ursi&modal=1');
  await page.waitForSelector('#det-evidence');
  const evidence = await page.locator('#det-evidence').innerText();
  expect(evidence).not.toMatch(/D-mannose, or lactobacilli/i);
  expect(evidence).toMatch(/cranberry or lactobacilli/i);
  expect(evidence).toMatch(/no better than placebo/i);
  expect(errors, errors.join('\n')).toEqual([]);
});
