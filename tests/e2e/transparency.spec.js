const { execFileSync } = require('child_process');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole } = require('./helpers');

function withCommas(raw) {
  const [whole, frac] = String(raw).split('.');
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${formatted}.${frac}` : formatted;
}

function transparencyCounts() {
  const script = path.join(__dirname, '..', '..', 'scripts', 'transparency_counts.py');
  const out = execFileSync('python3', [script], { encoding: 'utf8' });
  const counts = {};
  for (const line of out.trim().split('\n')) {
    if (!line || line.includes(' ')) {
      const space = line.indexOf(' ');
      counts[line.slice(0, space)] = line.slice(space + 1);
    }
  }
  return counts;
}

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('transparency page states both counts and the physician status', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/transparency.html');
  await page.waitForSelector('main.made-wrap h1');
  await expect(page.locator('h1')).toHaveText('How SupplementScore is made');
  const text = await page.locator('main.made-wrap').innerText();
  expect(text).toContain('About 11,000');
  expect(text).toContain('Hours one person would need to do this by hand. An estimate, not time worked.');
  expect(text).toContain('Estimated research hours: about 11,000');
  expect(text).toContain('This is an estimate.');
  expect(text).not.toContain('Label this as an estimate');
  expect(text).not.toContain('Hours of human research');
  expect(text).toContain('1.5 hours');
  expect(text).toContain('4 hours');
  expect(text).not.toContain('1,505,381,664');
  expect(text.toLowerCase()).not.toContain('participant-hour');
  expect(text).toContain('openly mostly AI-generated');
  expect(text).toContain('same credible sources doctors rely on');
  expect(text).toContain('bringing physicians on board');
  expect(text.toLowerCase()).not.toContain('back-checked');
  expect(text.toLowerCase()).not.toContain('reviewed by');
  await expect(page.locator('main a[href="/"]')).toHaveCount(2);
  await expect(page.locator('a.ss-pagebar-x')).toHaveAttribute('href', '/');
  const rules = page.locator('details.made-rules');
  await expect(rules).toHaveCount(1);
  await expect(rules).not.toHaveAttribute('open');
  await expect(rules.locator('summary')).toHaveText('Full file rules');
  await expect(rules.locator('code')).toHaveCount(17);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('published figures match scripts/transparency_counts.py', async ({ page }) => {
  const counts = transparencyCounts();
  await goto(page, '/transparency.html');
  const marked = await page.locator('[data-ss-count]').evaluateAll((els) =>
    els.map((el) => ({
      key: el.getAttribute('data-ss-count'),
      text: el.textContent.replace(/\s+/g, ' ').trim(),
    }))
  );
  const seen = new Set();
  for (const item of marked) {
    expect(counts, item.key).toHaveProperty(item.key);
    expect(item.text, item.key).toBe(withCommas(counts[item.key]));
    seen.add(item.key);
  }
  for (const key of Object.keys(counts)) {
    expect(seen.has(key), `page is missing ${key} from the script`).toBe(true);
  }
});

test('money and corrections links land on sections that still exist', async ({ page }) => {
  await goto(page, '/transparency.html');
  const hrefs = await page.locator('main a[href^="/about.html#"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('href'))
  );
  expect(hrefs.length).toBeGreaterThan(0);
  const ids = [...new Set(hrefs.map((href) => href.split('#')[1]))];
  expect(ids).toContain('site-funding');
  expect(ids).toContain('feedback');
  for (const id of ids) {
    await goto(page, '/about.html#' + id);
    await expect(page.locator('#' + id)).toHaveCount(1);
  }
  await goto(page, '/about.html#transparency');
  await expect(page.locator('#transparency')).toHaveCount(1);
  await expect(page.locator('#transparency h2')).toHaveText('Transparency');
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
  expect(placement.footerText.join(' ')).toContain("How it's made");
  expect(placement.footerText.join(' ')).not.toContain('How SupplementScore is made');
});

test('this page uses About’s heading size and the 8px spacing', async ({ page }) => {
  await goto(page, '/transparency.html');
  const type = await page.evaluate(() => {
    const h2 = document.querySelector('main.made-wrap h2');
    const p = document.querySelector('main.made-wrap h2 + p');
    const stat = document.querySelector('.made-stat');
    const lbl = document.querySelector('.made-lbl');
    const wrap = document.querySelector('main.made-wrap');
    const cs = (el) => getComputedStyle(el);
    return {
      h2: cs(h2).fontSize,
      h2MarginBottom: cs(h2).marginBottom,
      p: cs(p).fontSize,
      statPad: cs(stat).paddingTop,
      lblGap: cs(lbl).marginTop,
      pad: [cs(wrap).paddingTop, cs(wrap).paddingRight, cs(wrap).paddingBottom].join(' '),
    };
  });
  expect(type.h2).toBe('23.2px');
  expect(type.p).toBe('17.5px');
  expect(type.statPad).toBe('16px');
  expect(type.lblGap).toBe('8px');
  expect(type.h2MarginBottom).toBe('8px');
  const width = page.viewportSize().width;
  // Phone gutters stay at 16px. page-chrome.css already sets that on the shared shell.
  expect(type.pad).toBe(width > 768 ? '32px 24px 64px' : '16px 16px 64px');
});
