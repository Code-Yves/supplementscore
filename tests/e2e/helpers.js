const { expect } = require('@playwright/test');

const ENTITY_RE = /&#\d+;|&#x[0-9a-fA-F]+;|&amp;#|&amp;amp;/i;

function trackConsole(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push('pageerror: ' + (err && err.message ? err.message : String(err)));
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/favicon|sw\.js|service worker|ServiceWorker|ERR_ABORTED|ERR_FAILED|net::ERR_/i.test(text)) return;
    errors.push('console: ' + text);
  });
  return errors;
}

async function install(page) {
  await page.route('**/sw.js', (route) => route.abort());
  await page.addInitScript(() => {
    try { sessionStorage.clear(); } catch (e) {}
    try { history.scrollRestoration = 'manual'; } catch (e) {}
  });
}

async function goto(page, urlPath) {
  const response = await page.goto(urlPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  return response;
}

async function quietLoader(page) {
  await page.waitForFunction(() => typeof window.LIST_LOAD_MS === 'number', null, { timeout: 60000 });
  const ms = await page.evaluate(() => window.LIST_LOAD_MS);
  expect(ms, 'production loader stays 3s').toBe(3000);
  await page.evaluate(() => { window.LIST_LOAD_MS = 200; });
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 80)));
}

async function scrollY(page) {
  return page.evaluate(() => window.scrollY || window.pageYOffset || 0);
}

async function assertNoEntityText(page) {
  const hit = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : '';
    const match = text.match(/&#\d+;|&#x[0-9a-fA-F]+;|&amp;#|&amp;amp;/i);
    return match ? match[0] : '';
  });
  expect(hit, 'rendered text still contains an HTML entity').toBe('');
}

async function tapFailures(page, selector) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].map((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      return {
        visible,
        w: Math.round(rect.width * 10) / 10,
        h: Math.round(rect.height * 10) / 10,
        text: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
      };
    }).filter((box) => box.visible && (box.w < 43.5 || box.h < 43.5));
  }, selector);
}

function expectTaps(failures, selector) {
  expect(failures, selector + ' under 44px: ' + JSON.stringify(failures)).toEqual([]);
}

module.exports = {
  ENTITY_RE,
  trackConsole,
  install,
  goto,
  quietLoader,
  settle,
  scrollY,
  assertNoEntityText,
  tapFailures,
  expectTaps,
};
