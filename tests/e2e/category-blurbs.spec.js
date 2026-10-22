const { test, expect } = require('@playwright/test');
const { install, goto, trackConsole, quietLoader, settle } = require('./helpers');

function words(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

async function readSource(page) {
  return page.evaluate(() => {
    const cats = window.SS_RESEARCH_CATS || {};
    return Object.keys(cats).map((id) => ({
      id: id,
      label: cats[id].label,
      blurb: cats[id].blurb,
    }));
  });
}

function expectBlurbs(source) {
  expect(source.length, 'shared category list').toBeGreaterThan(8);
  const ids = source.map((cat) => cat.id);
  expect(new Set(ids).size, 'unique category ids').toBe(ids.length);
  for (const cat of source) {
    const n = words(cat.blurb);
    expect(n, cat.id + ' word count').toBeGreaterThanOrEqual(6);
    expect(n, cat.id + ' word count').toBeLessThanOrEqual(10);
  }
}

async function rowMetrics(page, itemSel, blurbSel) {
  return page.evaluate(({ itemSel, blurbSel }) => {
    function channel(c) {
      const x = c / 255;
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    }
    function lum(rgb) {
      const m = rgb.match(/[\d.]+/g).map(Number);
      return 0.2126 * channel(m[0]) + 0.7152 * channel(m[1]) + 0.0722 * channel(m[2]);
    }
    function contrast(a, b) {
      const L1 = lum(a);
      const L2 = lum(b);
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    }
    function painted(el) {
      let n = el;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        const parts = bg.match(/[\d.]+/g);
        if (parts && (parts.length < 4 || Number(parts[3]) > 0.95)) return bg;
        n = n.parentElement;
      }
      return 'rgb(255, 255, 255)';
    }
    const vw = window.innerWidth;
    return [...document.querySelectorAll(itemSel)].map((item) => {
      const blurb = item.querySelector(blurbSel);
      const name = item.querySelector('.art-name, .rh-opt-name, h2');
      const itemBox = item.getBoundingClientRect();
      const blurbBox = blurb ? blurb.getBoundingClientRect() : null;
      const nameCs = name ? getComputedStyle(name) : null;
      const blurbCs = blurb ? getComputedStyle(blurb) : null;
      return {
        id: item.getAttribute('data-val') || item.getAttribute('data-value') || item.getAttribute('data-cat') || '',
        name: name ? name.textContent.replace(/\s+/g, ' ').trim() : '',
        blurb: blurb ? blurb.textContent.replace(/\s+/g, ' ').trim() : '',
        lines: blurb ? blurb.getClientRects().length : 0,
        h: itemBox.height,
        nameSize: nameCs ? parseFloat(nameCs.fontSize) : 0,
        blurbSize: blurbCs ? parseFloat(blurbCs.fontSize) : 0,
        blurbColor: blurbCs ? blurbCs.color : '',
        blurbWeight: blurbCs ? blurbCs.fontWeight : '',
        contrast: blurbCs ? contrast(blurbCs.color, painted(item)) : 0,
        inside: !!(blurbBox && blurbBox.left >= itemBox.left - 1 && blurbBox.right <= itemBox.right + 1 && blurbBox.top >= itemBox.top - 1 && blurbBox.bottom <= itemBox.bottom + 1),
        fits: itemBox.right <= vw + 1 && itemBox.left >= -1,
        overflow: blurb ? blurb.scrollWidth - blurb.clientWidth : 0,
      };
    });
  }, { itemSel, blurbSel });
}

function checkRows(rows, source, where) {
  expect(rows.length, where + ' rows').toBeGreaterThan(0);
  const byId = {};
  source.forEach((cat) => { byId[cat.id] = cat; });
  for (const row of rows) {
    const cat = byId[row.id];
    expect(cat, where + ' ' + row.id + ' is in the shared list').toBeTruthy();
    expect(row.blurb, where + ' ' + row.id).toBe(cat.blurb);
    expect(row.name, where + ' ' + row.id + ' name').toContain(cat.label);
    expect(row.lines, where + ' ' + row.id + ' stays one line').toBe(1);
    expect(row.h, where + ' ' + row.id + ' tap height').toBeGreaterThanOrEqual(44);
    expect(row.blurbSize, where + ' ' + row.id + ' smaller than the name').toBeLessThan(row.nameSize);
    expect(row.blurbColor, where + ' ' + row.id + ' muted').toBe('rgb(87, 83, 78)');
    expect(row.contrast, where + ' ' + row.id + ' contrast').toBeGreaterThanOrEqual(4.5);
    expect(row.inside, where + ' ' + row.id + ' blurb stays in the row').toBe(true);
    expect(row.fits, where + ' ' + row.id + ' row fits').toBe(true);
    expect(row.overflow, where + ' ' + row.id + ' clips').toBeLessThanOrEqual(1);
  }
}

test.describe('research category descriptions', () => {
  test.beforeEach(async ({ page }) => {
    await install(page);
  });

  test('homepage and research sections at 1280', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', '1280 only');
    const errors = trackConsole(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await goto(page, '/');
    await quietLoader(page);
    await page.waitForSelector('#art-filter-menu .art-blurb', { state: 'attached', timeout: 60000 });
    const source = await readSource(page);
    expectBlurbs(source);

    await page.locator('#sfbar-main').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector('#art-filter-wrap .cdd-btn').click());
    const home = await rowMetrics(page, '#art-filter-menu .cdd-item', '.art-blurb');
    checkRows(home, source, 'homepage');
    expect(home.map((row) => row.id)).toEqual([
      'quickread', 'guide', 'breakthrough', 'kids', 'myth', 'safety', 'condition', 'stack',
    ]);
    const homeIds = new Set(home.map((row) => row.id));
    expect(homeIds.has('research-update'), 'homepage menu stays the existing categories').toBe(false);

    await page.evaluate(() => {
      const node = document.querySelector('#art-filter-menu .cdd-item[data-val="safety"]');
      node.click();
    });
    await page.waitForFunction(() => {
      const root = document.getElementById('s-content');
      return root && root.querySelector('.article-card') && !root.querySelector('.ss-list-load');
    }, null, { timeout: 20000 });
    await settle(page);
    const cats = await page.evaluate(() => {
      return [...document.querySelectorAll('#s-content .article-card')].map((card) => card.getAttribute('data-category'));
    });
    expect(cats.length).toBeGreaterThan(0);
    expect(cats.every((cat) => cat === 'safety')).toBe(true);

    await goto(page, '/#research');
    await page.waitForFunction(() => {
      const ready = document.getElementById('rh-root');
      const list = document.querySelector('#rh-source .article-list');
      return ready && Number(ready.dataset.ready) > 200 && list && list.dataset.deferredLoaded === '1';
    }, null, { timeout: 60000 });
    const sections = await rowMetrics(page, '#rh-sections .rh-sec', '.rh-sec-blurb');
    checkRows(sections, source, 'sections');
    expect(sections.some((row) => row.id === 'research-update')).toBe(true);
    const sectionBlurbs = sections.map((row) => row.blurb);
    expect(new Set(sectionBlurbs).size, 'each section has its own line').toBe(sectionBlurbs.length);

    await page.evaluate(() => document.getElementById('rh-type-btn').click());
    const menu = await rowMetrics(page, '#rh-type-menu [role="option"]', '.rh-opt-blurb');
    checkRows(menu, source, 'type menu');
    expect(menu.map((row) => row.id)).toContain('all');
    expect(menu.map((row) => row.id)).toContain('research-update');
    const gaps = await page.evaluate(() => ({
      home: getComputedStyle(document.querySelector('#art-filter-menu .cdd-item')).gap,
      menu: getComputedStyle(document.querySelector('#rh-type-menu [role="option"]')).gap,
      section: getComputedStyle(document.querySelector('.rh-sec-blurb')).marginTop,
    }));
    expect(gaps).toEqual({ home: '8px', menu: '8px', section: '8px' });
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('homepage and research menu at 390', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', '390 only');
    const errors = trackConsole(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await goto(page, '/');
    await page.waitForSelector('#art-filter-menu .art-blurb', { state: 'attached', timeout: 60000 });
    const source = await readSource(page);
    expectBlurbs(source);
    await page.locator('#sfbar-main').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.querySelector('#art-filter-wrap .cdd-btn').click());
    const home = await rowMetrics(page, '#art-filter-menu .cdd-item', '.art-blurb');
    checkRows(home, source, 'phone homepage');
    const menuBox = await page.evaluate(() => {
      const menu = document.getElementById('art-filter-menu');
      const list = document.getElementById('s-content');
      const menuRect = menu.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const style = getComputedStyle(menu);
      return {
        position: style.position,
        maxHeight: style.maxHeight,
        overlaps: menuRect.bottom > listRect.top + 1 && menuRect.top < listRect.bottom - 1,
        width: menuRect.width,
        vw: window.innerWidth,
      };
    });
    expect(menuBox.position).toBe('static');
    expect(menuBox.maxHeight).toBe('none');
    expect(menuBox.overlaps).toBe(false);
    expect(menuBox.width).toBeLessThanOrEqual(menuBox.vw + 1);

    await goto(page, '/#research');
    await page.waitForFunction(() => {
      const ready = document.getElementById('rh-root');
      return ready && Number(ready.dataset.ready) > 200;
    }, null, { timeout: 60000 });
    const sectionsShown = await page.evaluate(() => getComputedStyle(document.getElementById('rh-sections')).display !== 'none');
    expect(sectionsShown).toBe(false);
    await page.evaluate(() => document.getElementById('rh-type-btn').click());
    const menu = await rowMetrics(page, '#rh-type-menu [role="option"]', '.rh-opt-blurb');
    checkRows(menu, source, 'phone type menu');
    const gaps = await page.evaluate(() => ({
      home: getComputedStyle(document.querySelector('#art-filter-menu .cdd-item')).gap,
      menu: getComputedStyle(document.querySelector('#rh-type-menu [role="option"]')).gap,
    }));
    expect(gaps).toEqual({ home: '8px', menu: '8px' });
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
