const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { install, goto } = require('./helpers');

function comparePages() {
  return fs.readdirSync(path.join(__dirname, '../../compare'))
    .filter((name) => name.endsWith('.html'))
    .sort();
}

async function measure(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const client = root.clientWidth;
    const scroll = root.scrollWidth;
    const escape = [];
    function contained(el) {
      let node = el.parentElement;
      while (node && node !== document.body && node !== document.documentElement) {
        const overflow = getComputedStyle(node).overflowX;
        if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden' || overflow === 'clip') return true;
        node = node.parentElement;
      }
      return false;
    }
    for (const el of document.body.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') continue;
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) continue;
      if (box.right <= client + 1 && box.left >= -1) continue;
      if (contained(el)) continue;
      const label = el.className && String(el.className).slice(0, 48);
      escape.push(label || el.tagName);
      if (escape.length >= 3) break;
    }
    return { scroll, client, escape };
  });
}

test('compare pages are no wider than the screen at 390', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', '390 viewport');
  test.setTimeout(180000);
  await install(page);
  const bad = [];
  for (const file of comparePages()) {
    await goto(page, '/compare/' + file);
    await page.waitForFunction(() => {
      return !document.querySelector('main.ca-wrap') || document.documentElement.classList.contains('rc-ready');
    });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const hit = await measure(page);
      if (hit.scroll > hit.client || hit.escape.length) {
        const extra = hit.escape.length ? ' ' + hit.escape.join(',') : '';
        bad.push(width + ' ' + file + ' scroll ' + hit.scroll + '/' + hit.client + extra);
      }
    }
  }
  expect(bad).toEqual([]);
});
