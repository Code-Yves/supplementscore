const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await install(page);
});

function lin(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

async function visibleLabels(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('.ss-np')].filter((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;
  });
}

async function headerMetrics(page) {
  return page.evaluate(() => {
    function box(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    }
    const label = [...document.querySelectorAll('.ss-np')].find((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });
    const style = label ? getComputedStyle(label) : null;
    let bg = null;
    let node = label;
    while (node) {
      const color = getComputedStyle(node).backgroundColor;
      const match = color && color.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map((part) => parseFloat(part));
        const alpha = parts.length === 4 ? parts[3] : 1;
        if (alpha > 0.95) {
          bg = parts.slice(0, 3);
          break;
        }
      }
      node = node.parentElement;
    }
    const rgb = style ? style.color.match(/rgba?\(([^)]+)\)/) : null;
    const tabs = [...document.querySelectorAll('.site-nav-tab')].map((tab) => box(tab));
    return {
      text: label ? label.textContent : '',
      fontSize: style ? style.fontSize : '',
      whiteSpace: style ? style.whiteSpace : '',
      fg: rgb ? rgb[1].split(',').map((part) => parseFloat(part)).slice(0, 3) : null,
      bg,
      inFooter: !!(label && label.closest('footer')),
      inMenu: !!(label && label.closest('.cdd-menu')),
      label: box(label),
      stats: box(document.querySelector('.beta-bar-stats')),
      bar: box(document.querySelector('.beta-bar')),
      tabsBox: box(document.querySelector('.site-nav-tabs')),
      tabs,
      brand: box(document.querySelector('.ss-pagebar-brand, .site-nav-brand')),
      close: box(document.querySelector('.ss-pagebar-x')),
      nav: box(document.querySelector('nav.site-nav')),
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    };
  });
}

test('100% non-profit label is a desktop header', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'crawl', 'header label is covered by desktop and iphone');
  await goto(page, '/');

  if (testInfo.project.name === 'iphone') {
    expect(await visibleLabels(page)).toBe(0);
    await goto(page, '/about.html');
    expect(await visibleLabels(page)).toBe(0);
    await goto(page, '/condition.html?slug=anxiety');
    expect(await visibleLabels(page)).toBe(0);
    const stray = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const menu = document.querySelector('.cdd-menu');
      return {
        footer: footer ? footer.textContent.includes('100% non-profit') : false,
        menu: menu ? menu.textContent.includes('100% non-profit') : false,
      };
    });
    expect(stray).toEqual({ footer: false, menu: false });
    return;
  }

  async function expectDesktopHeader(width) {
    await page.setViewportSize({ width, height: 900 });
    await goto(page, '/');
    const home = await headerMetrics(page);
    expect(home.text).toBe('100% non-profit');
    expect(home.fontSize).toBe('13px');
    expect(home.whiteSpace).toBe('nowrap');
    expect(home.inFooter).toBe(false);
    expect(home.inMenu).toBe(false);
    expect(home.fg).toEqual([87, 83, 78]);
    const fgL = 0.2126 * lin(home.fg[0]) + 0.7152 * lin(home.fg[1]) + 0.0722 * lin(home.fg[2]);
    const bgL = 0.2126 * lin(home.bg[0]) + 0.7152 * lin(home.bg[1]) + 0.0722 * lin(home.bg[2]);
    const contrast = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    expect(home.stats.height).toBeLessThan(20);
    expect(home.label.left).toBeGreaterThanOrEqual(home.stats.right + 16);
    expect(home.label.right).toBeLessThanOrEqual(home.bar.right + 1);
    expect(home.label.top).toBeGreaterThanOrEqual(home.bar.top - 1);
    expect(home.label.bottom).toBeLessThanOrEqual(home.bar.bottom + 1);
    expect(home.scroll).toBeLessThanOrEqual(home.client + 1);

    await goto(page, '/condition.html?slug=anxiety');
    const nav = await headerMetrics(page);
    expect(nav.text).toBe('100% non-profit');
    expect(nav.tabs.length).toBeGreaterThan(1);
    const tabTop = nav.tabs[0].top;
    nav.tabs.forEach((tab) => {
      expect(Math.abs(tab.top - tabTop)).toBeLessThan(1);
    });
    expect(nav.label.left).toBeGreaterThanOrEqual(nav.tabsBox.right + 16);
    expect(nav.scroll).toBeLessThanOrEqual(nav.client + 1);

    await goto(page, '/about.html');
    const about = await headerMetrics(page);
    expect(about.text).toBe('100% non-profit');
    expect(about.label.left).toBeGreaterThanOrEqual(about.brand.right + 8);
    expect(about.close.left).toBeGreaterThanOrEqual(about.label.right + 16);
    expect(about.scroll).toBeLessThanOrEqual(about.client + 1);
  }

  await expectDesktopHeader(1280);
  await expectDesktopHeader(1024);
});
