const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const SHOTS = [
  ['homepage', '/', '#s-content .sc'],
  ['article', '/a/berberine-is-it-really-nature-s-ozempic.html', '.ar-toc'],
  ['supplement', '/supplement/magnesium.html', 'h1.det-h1'],
  ['topic', '/hub/sleep.html', 'h1.hub-title'],
  ['about', '/about.html', 'main.ab-wrap h1'],
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

for (const [name, urlPath, ready] of SHOTS) {
  test(name, async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector(ready, { timeout: 60000 });
    await page.evaluate(async () => {
      const cap = (promise, ms) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
      if (document.fonts && document.fonts.ready) await cap(document.fonts.ready, 3000);
      await Promise.all([...document.images].map((img) => {
        if (img.complete) return null;
        return cap(new Promise((resolve) => { img.onload = img.onerror = resolve; }), 4000);
      }));
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      window.scrollTo(0, 0);
    });
    // Supplement and article pages inject styles.css 300ms after first paint.
    // A screenshot taken before that sheet applies is a stable but unstyled frame.
    await page.waitForFunction(() => {
      const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
      const full = links.find((link) => /styles\.css/.test(link.getAttribute('href') || ''));
      if (!full || !full.sheet) return false;
      const media = full.media || '';
      if (media && media !== 'all') return false;
      try { return full.sheet.cssRules.length > 0; }
      catch (e) { return false; }
    }, null, { timeout: 15000 });
    await expect(page).toHaveScreenshot(name + '.png', {
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}
