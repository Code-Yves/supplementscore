const { test, expect } = require('@playwright/test');
const {
  trackConsole, install, goto, quietLoader, settle, scrollY, assertNoEntityText,
  tapFailures, expectTaps,
} = require('./helpers');

const ARTICLE = '/a/berberine-is-it-really-nature-s-ozempic.html';

test.beforeEach(async ({ page }) => {
  await install(page);
});

test('search opens the matching supplement', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => typeof window.heroNext === 'function');
  await page.locator('#ix-hero-search').click();
  await page.locator('#ix-hero-search').fill('magnesium');
  const suggestion = page.locator('#ix-ac.vis .gs-ac-item[data-type="supp"]').first();
  await expect(suggestion).toBeVisible();
  await expect(suggestion).toContainText(/magnesium/i);
  expectTaps(await tapFailures(page, '#ix-ac .gs-ac-item'), 'search suggestion');
  await suggestion.click();
  await expect(page.locator('.ssm.open iframe.ssm-frame')).toHaveAttribute('src', /slug=magnesium/i);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('hero arrows, keyboard, and swipe', async ({ page }, testInfo) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForFunction(() => typeof window.heroNext === 'function');
  await page.waitForSelector('#mag-count');
  const count = () => page.locator('#mag-count').innerText();
  await expect.poll(count).toBe('1 of 20');

  await page.evaluate(() => document.querySelector('.mag-arrow[data-dir="1"]').click());
  await expect.poll(count).toBe('2 of 20');
  await page.evaluate(() => document.querySelector('.mag-arrow[data-dir="-1"]').click());
  await expect.poll(count).toBe('1 of 20');

  await page.locator('.mag-arrow[data-dir="1"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(count).toBe('2 of 20');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(count).toBe('1 of 20');

  await page.evaluate((useTouch) => {
    const hero = document.getElementById('hero');
    const lead = hero.querySelector('.mag-lead');
    const rect = lead.getBoundingClientRect();
    const y = rect.top + 40;
    const x0 = rect.left + rect.width * 0.75;
    const x1 = x0 - 100;
    if (useTouch) {
      const touch = (x) => new Touch({
        identifier: 1, target: hero, clientX: x, clientY: y, radiusX: 2, radiusY: 2, force: 1,
      });
      hero.dispatchEvent(new TouchEvent('touchstart', {
        bubbles: true, cancelable: true, changedTouches: [touch(x0)], touches: [touch(x0)],
      }));
      hero.dispatchEvent(new TouchEvent('touchend', {
        bubbles: true, cancelable: true, changedTouches: [touch(x1)], touches: [],
      }));
      return;
    }
    const point = (type, x) => new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse',
      clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1,
    });
    lead.dispatchEvent(point('pointerdown', x0));
    lead.dispatchEvent(point('pointerup', x1));
  }, testInfo.project.name === 'iphone');
  await expect.poll(count).toBe('2 of 20');
  await assertNoEntityText(page);
  expect(errors, errors.join('\n')).toEqual([]);
});

async function openContents(page, testInfo) {
  await page.waitForSelector('.ar-toc');
  if (testInfo.project.name === 'iphone') {
    const open = await page.locator('.ar-toc details').evaluate((el) => el.open);
    if (!open) await page.locator('.ar-toc summary').click();
  }
  await page.waitForSelector('.ar-toc a');
}

test('article prev, next, share, and contents', async ({ page, context }, testInfo) => {
  const errors = trackConsole(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await goto(page, ARTICLE);
  await page.waitForSelector('.ar-toc');
  await page.waitForSelector('.ar-prevnext a');
  await assertNoEntityText(page);

  const spec = await page.evaluate(() => {
    const col = document.querySelector('.ar-column');
    const toc = document.querySelector('.ar-toc');
    const kicker = document.querySelector('.ar-kicker');
    const h2 = document.querySelector('.ar-column h2');
    const para = h2 && h2.nextElementSibling && h2.nextElementSibling.tagName === 'P' ? h2.nextElementSibling : null;
    const cs = para ? getComputedStyle(para) : null;
    const end = document.querySelector('.ar-end');
    const kids = end ? [...end.children].map((el) => (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60)) : [];
    const gap = end && end.children[1] ? getComputedStyle(end.children[1]).marginTop : '';
    const tocBox = toc ? toc.getBoundingClientRect() : null;
    const colBox = col ? col.getBoundingClientRect() : null;
    return {
      kicker: kicker ? kicker.textContent.trim() : '',
      kickerColor: kicker ? getComputedStyle(kicker).color : '',
      h1: (document.querySelector('.ar-titleblock h1') || {}).textContent || '',
      byline: (document.querySelector('.ar-byline') || {}).innerText || '',
      dek: !!document.querySelector('.ar-dek'),
      colDisplay: col ? getComputedStyle(col).display : '',
      colW: colBox ? Math.round(colBox.width) : 0,
      fontSize: cs ? cs.fontSize : '',
      lineHeight: cs ? cs.lineHeight : '',
      tocW: tocBox ? Math.round(tocBox.width) : 0,
      tocOpen: !!document.querySelector('.ar-toc details') && document.querySelector('.ar-toc details').open,
      overlap: !!(tocBox && colBox && tocBox.right > colBox.left + 1 && tocBox.left < colBox.right),
      tocLinks: [...document.querySelectorAll('.ar-toc a')].map((a) => a.textContent.trim()),
      hero: !!document.querySelector('#hero.mag'),
      floating: !!document.querySelector('.ssux-toc'),
      side: !!document.querySelector('.mag-side'),
      kids,
      gap,
      summary: (document.querySelector('.ar-toc summary') || {}).textContent || '',
    };
  });
  expect(spec.kicker.length, 'category kicker').toBeGreaterThan(0);
  expect(spec.kickerColor).toBe('rgb(21, 90, 80)');
  expect(spec.h1).toMatch(/Nature's Ozempic/);
  expect(spec.dek, 'dek').toBe(true);
  expect(spec.byline).toMatch(/Updated/);
  expect(spec.byline).toMatch(/Reviewed/);
  expect(spec.fontSize).toBe('18px');
  expect(spec.lineHeight).toBe('28.8px');
  expect(spec.hero, 'magazine hero removed').toBe(false);
  expect(spec.floating, 'floating panel removed').toBe(false);
  expect(spec.side, 'side column removed').toBe(false);
  expect(spec.summary).toBe('On this page');
  expect(spec.tocLinks).toEqual([
    'Bottom line',
    'What Berberine Actually Is',
    'The Clinical Evidence: Real But Limited',
    'Limitations and Safety Considerations',
    'The Honest Assessment',
    'Sources',
  ]);
  expect(spec.kids[0]).toMatch(/^Sources/);
  expect(spec.kids[1]).toMatch(/Supplements mentioned/);
  expect(spec.kids[2]).toMatch(/Related/);
  expect(spec.kids[spec.kids.length - 1]).toMatch(/Previous/);
  expect(spec.gap).toBe('8px');
  if (testInfo.project.name === 'desktop') {
    expect(spec.colW).toBeLessThanOrEqual(700);
    expect(spec.colW).toBeGreaterThan(640);
    expect(spec.tocW).toBe(200);
    expect(spec.tocOpen, 'desktop contents stay open').toBe(true);
    expect(spec.overlap, 'rail overlaps the column').toBe(false);
  } else {
    expect(spec.tocOpen, 'phone contents start collapsed').toBe(false);
  }

  await openContents(page, testInfo);
  expectTaps(await tapFailures(page, '.ar-prevnext a, .rc-share'), 'article chrome');
  expectTaps(await tapFailures(page, '.ar-toc a'), 'table of contents');

  const nextHref = await page.locator('.ar-prevnext a', { hasText: 'Next' }).getAttribute('href');
  expect(nextHref).toContain('bergamot');
  await page.locator('.ar-prevnext a', { hasText: 'Next' }).click();
  await page.waitForURL(/bergamot/);
  await page.waitForSelector('.ar-prevnext a');
  await page.locator('.ar-prevnext a', { hasText: 'Previous' }).click();
  await page.waitForURL(/berberine-is-it-really-nature-s-ozempic/);
  await openContents(page, testInfo);

  await page.evaluate(() => {
    try {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    } catch (e) {
      navigator.share = undefined;
    }
  });
  await page.locator('.rc-share').click();
  await expect(page.locator('#rc-toast')).toHaveText('Link copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('berberine-is-it-really-nature-s-ozempic');

  const before = await scrollY(page);
  const target = await page.locator('.ar-toc a').nth(1).getAttribute('href');
  const id = decodeURIComponent(target.replace(/^#/, ''));
  await page.locator('.ar-toc a').nth(1).click();
  await expect.poll(async () => page.evaluate((headingId) => {
    const el = document.getElementById(headingId);
    return el ? el.getBoundingClientRect().top : 9999;
  }, id), { timeout: 8000 }).toBeLessThan(140);
  const after = await scrollY(page);
  expect(after, 'contents link scrolled').toBeGreaterThan(before + 40);
  const max = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
  expect(after, 'contents link did not snap to the footer').toBeLessThan(max - 80);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('newsletter form rejects a bad address and accepts a good one', async ({ page }) => {
  const errors = trackConsole(page);
  await page.route('https://formspree.io/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{"ok":true}',
  }));
  await goto(page, '/');
  await page.waitForSelector('.site-footer-contrib-form');
  const form = page.locator('.site-footer-contrib-form').first();
  const input = form.locator('input[type=email]');
  const button = form.locator('button');
  expectTaps(await tapFailures(page, '.site-footer-contrib-form input, .site-footer-contrib-form button'), 'newsletter');

  await input.fill('nope');
  await button.click();
  await expect(input).toHaveClass(/is-invalid/);

  const posted = page.waitForRequest((request) => request.url().includes('formspree.io') && request.method() === 'POST');
  await input.fill('reader@example.com');
  await button.click();
  const request = await posted;
  expect(request.postData() || '').toContain('reader@example.com');
  await expect(form).toHaveClass(/is-success/);
  await expect(form.locator('.site-footer-contrib-success')).toContainText("Thanks! We'll be in touch.");
  expect(errors, errors.join('\n')).toEqual([]);
});

test('default list show more does not jump', async ({ page }) => {
  const errors = trackConsole(page);
  await goto(page, '/');
  await page.waitForSelector('#s-content .tier-more', { timeout: 60000 });
  await quietLoader(page);
  expectTaps(await tapFailures(page, '#s-content .tier-more'), 'show more');
  const before = await page.evaluate(() => document.querySelectorAll('#s-content .sc:not(.tier-hidden)').length);
  const y = await scrollY(page);
  await page.evaluate(() => document.querySelector('#s-content .tier-more').click());
  await settle(page);
  const after = await page.evaluate(() => document.querySelectorAll('#s-content .sc:not(.tier-hidden)').length);
  expect(after).toBeGreaterThan(before);
  expect(Math.abs((await scrollY(page)) - y)).toBeLessThanOrEqual(5);
  expect(errors, errors.join('\n')).toEqual([]);
});
