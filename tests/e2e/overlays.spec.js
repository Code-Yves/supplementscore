const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const TABS = ['#about', '#methodology', '#transparency'];

async function openSupplement(page) {
  await goto(page, '/?supplement=l-theanine');
  await page.waitForSelector('.ssm.open iframe.ssm-frame');
  await page.waitForFunction(() => {
    const frame = document.querySelector('iframe.ssm-frame');
    try { return frame.contentDocument && frame.contentDocument.querySelector('h1'); }
    catch (e) { return false; }
  });
}

async function openAboutInModal(page) {
  const frame = page.frameLocator('iframe.ssm-frame');
  await frame.locator('footer a[href="/about.html"]').first().evaluate((el) => el.click());
  await page.waitForFunction(() => {
    const frameEl = document.querySelector('iframe.ssm-frame');
    try { return /\/about\.html$/.test(frameEl.contentWindow.location.pathname); }
    catch (e) { return false; }
  });
  return frame;
}

async function switchTab(frame, hash) {
  await frame.locator('.ab-jump a[href="' + hash + '"]').evaluate((el) => el.click());
}

async function modalState(page) {
  return page.evaluate(() => {
    const frameEl = document.querySelector('iframe.ssm-frame');
    const card = document.querySelector('.ssm');
    let frame = '';
    let heading = '';
    try {
      frame = frameEl.contentWindow.location.pathname + frameEl.contentWindow.location.hash;
      heading = ((frameEl.contentDocument.querySelector('h1') || {}).textContent || '').trim();
    } catch (e) { /* detached while closing */ }
    return {
      top: location.pathname + location.search,
      frame: frame,
      heading: heading,
      open: !!(card && card.classList.contains('open')),
    };
  });
}

async function roundClose(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      w: rect.width,
      h: rect.height,
      radius: parseFloat(cs.borderRadius) || 0,
      svg: !!el.querySelector('svg'),
      label: el.getAttribute('aria-label') || '',
    };
  }, selector);
}

function expectRound(box, label) {
  expect(box, label + ' missing').toBeTruthy();
  expect(box.w, label + ' width').toBeGreaterThanOrEqual(44);
  expect(box.h, label + ' height').toBeGreaterThanOrEqual(44);
  expect(box.radius, label + ' radius').toBeGreaterThanOrEqual(22);
  expect(box.svg, label + ' icon').toBe(true);
  expect(box.label.toLowerCase(), label + ' name').toContain('close');
}

test.beforeEach(async ({ page }) => {
  await install(page);
});

for (const hash of TABS) {
  test('× closes the about overlay in one click from ' + hash, async ({ page }) => {
    await openSupplement(page);
    const frame = await openAboutInModal(page);
    await switchTab(frame, hash);
    await expect.poll(() => page.frameLocator('iframe.ssm-frame').locator('.ab-jump a[aria-current="true"]').getAttribute('href')).toBe(hash);
    await frame.locator('a.ss-pagebar-x').evaluate((el) => el.click());
    await expect.poll(async () => (await modalState(page)).heading, { timeout: 8000 }).toMatch(/theanine/i);
    const state = await modalState(page);
    expect(state.open, 'supplement card stays open').toBe(true);
    expect(state.frame, 'left the about page').not.toMatch(/about\.html/);
    expect(state.top).toContain('supplement=l-theanine');
  });

  test('Esc closes the about overlay from ' + hash, async ({ page }) => {
    await openSupplement(page);
    const frame = await openAboutInModal(page);
    await switchTab(frame, hash);
    await frame.locator('.ab-jump a[href="' + hash + '"]').focus();
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await modalState(page)).heading, { timeout: 8000 }).toMatch(/theanine/i);
    const state = await modalState(page);
    expect(state.open).toBe(true);
    expect(state.frame).not.toMatch(/about\.html/);
  });
}

test('tab switches do not add history, and Back/Forward restore one layer', async ({ page }) => {
  await openSupplement(page);
  const frame = await openAboutInModal(page);
  await switchTab(frame, '#methodology');
  await switchTab(frame, '#transparency');
  await expect.poll(() => page.frameLocator('iframe.ssm-frame').locator(':root').evaluate(() => location.hash)).toBe('#transparency');
  await page.evaluate(() => history.back());
  await expect.poll(async () => (await modalState(page)).heading, { timeout: 8000 }).toMatch(/theanine/i);
  const back = await modalState(page);
  expect(back.open).toBe(true);
  expect(back.frame).not.toMatch(/about\.html/);
  expect(back.top).toContain('supplement=l-theanine');
  await page.evaluate(() => history.forward());
  await expect.poll(async () => (await modalState(page)).frame, { timeout: 8000 }).toMatch(/about\.html#transparency/);
  expect((await modalState(page)).open).toBe(true);
});

test('standalone about × and Esc leave from any tab', async ({ page }) => {
  await goto(page, '/');
  await page.locator('footer a[href="/about.html"]').first().evaluate((el) => el.click());
  await page.waitForURL(/\/about\.html$/);
  await page.locator('.ab-jump a[href="#methodology"]').evaluate((el) => el.click());
  await page.locator('.ab-jump a[href="#transparency"]').evaluate((el) => el.click());
  expect(new URL(page.url()).hash).toBe('#transparency');
  await page.locator('a.ss-pagebar-x').evaluate((el) => el.click());
  await page.waitForURL((url) => url.pathname === '/');
  expect(new URL(page.url()).hash).not.toMatch(/methodology|transparency|about/);

  await page.locator('footer a[href="/about.html"]').first().evaluate((el) => el.click());
  await page.waitForURL(/\/about\.html$/);
  await page.locator('.ab-jump a[href="#methodology"]').evaluate((el) => el.click());
  await page.locator('a.ss-pagebar-x').focus();
  await page.keyboard.press('Escape');
  await page.waitForURL((url) => url.pathname === '/');
});

test('supplement ×, Esc, Back, and Forward', async ({ page }) => {
  await openSupplement(page);
  await page.locator('.ssm-x').click();
  await expect(page.locator('.ssm.open')).toHaveCount(0);
  await expect.poll(() => page.url()).not.toContain('supplement=');
  await page.evaluate(() => history.forward());
  await expect.poll(() => page.url()).toContain('supplement=l-theanine');
  await expect(page.locator('.ssm.open')).toHaveCount(1);
  await page.evaluate(() => history.back());
  await expect.poll(() => page.url()).not.toContain('supplement=');
  await expect(page.locator('.ssm.open')).toHaveCount(0);

  await openSupplement(page);
  await page.locator('.ssm-x').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ssm.open')).toHaveCount(0);
  expect(page.url()).not.toContain('supplement=');
});

test('refresh keeps a supplement deep link and an about hash', async ({ page }) => {
  await openSupplement(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ssm.open')).toHaveCount(1);
  expect(page.url()).toContain('supplement=l-theanine');

  await goto(page, '/about.html#methodology');
  await expect(page.locator('.ab-jump a[aria-current="true"]')).toHaveAttribute('href', '#methodology');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.ab-jump a[aria-current="true"]')).toHaveAttribute('href', '#methodology');
  expect(new URL(page.url()).hash).toBe('#methodology');
});

test('close controls share one round ×', async ({ page }) => {
  await goto(page, '/about.html');
  expectRound(await roundClose(page, 'a.ss-pagebar-x'), 'about');

  await goto(page, '/a/berberine-is-it-really-nature-s-ozempic.html');
  await page.waitForSelector('a.rc-close svg');
  expectRound(await roundClose(page, 'a.rc-close'), 'article');

  await goto(page, '/supplement/l-theanine.html');
  await page.waitForSelector('a.pg-close-fab.ss-x');
  expectRound(await roundClose(page, 'a.pg-close-fab'), 'supplement');

  await goto(page, '/');
  await page.locator('#sources-modal').evaluate((el) => el.classList.add('open'));
  await expect(page.locator('#sources-modal.open')).toBeVisible();
  expectRound(await roundClose(page, '#sources-modal.open .src-modal-close'), 'sources');
  await page.keyboard.press('Escape');
  await expect(page.locator('#sources-modal.open')).toHaveCount(0);

  await openSupplement(page);
  expectRound(await roundClose(page, '.ssm-x'), 'supplement modal');
});

function contrast(fg, bg) {
  function lin(channel) {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
  function lum(rgb) {
    const m = String(rgb).match(/[\d.]+/g).map(Number);
    return 0.2126 * lin(m[0]) + 0.7152 * lin(m[1]) + 0.0722 * lin(m[2]);
  }
  const hi = Math.max(lum(fg), lum(bg));
  const lo = Math.min(lum(fg), lum(bg));
  return (hi + 0.05) / (lo + 0.05);
}

async function cornerBox(page, selector) {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    let node = el;
    while (node) {
      if (node.getAnimations().some((anim) => anim.playState === 'running')) return false;
      node = node.parentElement;
    }
    const width = el.getBoundingClientRect().width;
    return width >= 44 && width < 44.01;
  }, selector);
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      w: rect.width,
      h: rect.height,
      top: rect.top,
      right: window.innerWidth - rect.right,
      inset: document.documentElement.offsetWidth - rect.right,
      cssTop: cs.top,
      cssRight: cs.right,
    };
  }, selector);
}

function expectCorner(box, label) {
  expect(box.w, label + ' width').toBeGreaterThanOrEqual(44);
  expect(box.w, label + ' width').toBeLessThan(44.01);
  expect(box.h, label + ' height').toBeGreaterThanOrEqual(44);
  expect(box.h, label + ' height').toBeLessThan(44.01);
  expect(box.top, label + ' top').toBeGreaterThanOrEqual(7.5);
  expect(box.top, label + ' top').toBeLessThanOrEqual(8.5);
  expect(box.inset, label + ' right').toBeGreaterThanOrEqual(15.5);
  expect(box.inset, label + ' right').toBeLessThanOrEqual(16.5);
  expect(box.cssTop, label + ' css top').toBe('8px');
  expect(box.cssRight, label + ' css right').toBe('16px');
}

test('phone close controls are 44px and share one corner', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'phone corner');
  const targets = [
    ['/supplement/l-theanine.html', 'a.pg-close-fab.ss-x'],
    ['/a/berberine-is-it-really-nature-s-ozempic.html', 'a.rc-close.ss-x'],
  ];
  for (const [path, selector] of targets) {
    await goto(page, path);
    await page.waitForSelector(selector);
    expectCorner(await cornerBox(page, selector), path);
  }
  await openSupplement(page);
  await page.waitForSelector('.ssm-x.ss-x');
  const modal = await cornerBox(page, '.ssm-x');
  expect(modal.w).toBeGreaterThanOrEqual(44);
  expect(modal.w).toBeLessThan(44.01);
  expect(modal.h).toBeGreaterThanOrEqual(44);
  expect(modal.h).toBeLessThan(44.01);
  expect(modal.top).toBeGreaterThanOrEqual(7.5);
  expect(modal.top).toBeLessThanOrEqual(8.5);
  expect(modal.right).toBeGreaterThanOrEqual(15.5);
  expect(modal.right).toBeLessThanOrEqual(16.5);
  const share = await page.evaluate(() => {
    const button = document.querySelector('.ssm-share');
    const bar = document.querySelector('.ssm-chrome');
    return {
      fg: getComputedStyle(button).color,
      bg: getComputedStyle(bar).backgroundColor,
    };
  });
  expect(contrast(share.fg, share.bg)).toBeGreaterThanOrEqual(4.5);
});

test('desktop close controls share one corner', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop corner');
  const targets = [
    ['/supplement/l-theanine.html', 'a.pg-close-fab.ss-x'],
    ['/a/berberine-is-it-really-nature-s-ozempic.html', 'a.rc-close.ss-x'],
  ];
  for (const [path, selector] of targets) {
    await goto(page, path);
    await page.waitForSelector(selector);
    expectCorner(await cornerBox(page, selector), path);
  }
  await openSupplement(page);
  await page.waitForSelector('.ssm-x.ss-x');
  expectCorner(await cornerBox(page, '.ssm-x'), 'detail');
});

test('supplement close is inside a landmark and the open card does not repeat one', async ({ page }) => {
  await goto(page, '/supplement/l-theanine.html');
  await page.waitForSelector('nav.ss-page-actions a.pg-close-fab');
  const landmark = await page.evaluate(() => {
    const close = document.querySelector('a.pg-close-fab');
    const nav = close.closest('nav');
    return nav ? nav.getAttribute('aria-label') : '';
  });
  expect(landmark).toBe('Page');

  await openSupplement(page);
  const frame = await page.frameLocator('iframe.ssm-frame').locator('body').evaluate(() => {
    const main = document.querySelector('main.det-wrap');
    const footer = document.querySelector('footer.site-footer');
    const footerShown = !!(footer && !footer.hidden && getComputedStyle(footer).display !== 'none');
    return {
      label: main ? main.getAttribute('aria-label') : '',
      footerShown: footerShown,
    };
  });
  expect(frame.label).toBe('Supplement detail');
  expect(frame.footerShown).toBe(false);
});

test('phone back-to-top is a 44px disc on the teal footer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'phone back-to-top');
  await goto(page, '/supplement/l-theanine.html');
  await page.waitForSelector('.ssux-top', { state: 'attached' });
  await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForSelector('.ssux-top.show');
  const box = await page.evaluate(() => {
    const button = document.querySelector('.ssux-top');
    const footer = document.querySelector('footer.site-footer');
    const rect = button.getBoundingClientRect();
    return {
      w: rect.width,
      h: rect.height,
      bg: getComputedStyle(button).backgroundColor,
      fg: getComputedStyle(button).color,
      footer: getComputedStyle(footer).backgroundColor,
    };
  });
  expect(box.w).toBeGreaterThanOrEqual(44);
  expect(box.w).toBeLessThan(44.01);
  expect(box.h).toBeGreaterThanOrEqual(44);
  expect(box.h).toBeLessThan(44.01);
  expect(box.bg).toBe('rgb(255, 255, 255)');
  expect(box.footer).not.toBe(box.bg);
  expect(contrast(box.fg, box.bg)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(box.bg, box.footer)).toBeGreaterThanOrEqual(4.5);
});

test('article × returns to research, and #research survives refresh', async ({ page }) => {
  await goto(page, '/#research');
  await page.waitForFunction(() => document.getElementById('research-view') && getComputedStyle(document.getElementById('research-view')).display !== 'none');
  const article = page.locator('#research-view a[href^="/a/"], #research-view a[href^="a/"]').first();
  await article.evaluate((el) => el.click());
  await page.waitForURL(/\/a\//);
  await page.locator('a.rc-close').evaluate((el) => el.click());
  await page.waitForURL(/#research/);
  expect(page.url()).toContain('#research');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const view = document.getElementById('research-view');
    return view && getComputedStyle(view).display !== 'none';
  });
});
