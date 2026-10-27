const { test, expect } = require('@playwright/test');
const { install, goto } = require('./helpers');

const BERGAMOT = '/a/bergamot-citrus-extract-italy-s-answer-to-high-cholesterol.html';
const STUDIED = '/a/the-10-most-studied-supplements-on-earth.html';
const BERBERINE = '/a/berberine-is-it-really-nature-s-ozempic.html';
const EXERCISE = '/a/how-exercise-outperforms-every-supplement.html';
const KAEMPFEROL = '/a/kaempferol-the-flavonoid-activating-autophagy-and-longevity-pathways.html';
const STUDIED_DEK = 'These ten supplements have survived more scrutiny than most prescription drugs, from creatine and omega-3 to psyllium husk, oat beta-glucan, and oral rehydration salts.';

const ARTICLES = [
  ['bergamot', BERGAMOT],
  ['studied', STUDIED],
  ['berberine', BERBERINE],
];

const PAGES = [
  ['home', '/', '#sfbar-main .cdd-btn'],
  ['bergamot', BERGAMOT, '.ar-titleblock'],
  ['studied', STUDIED, '.ar-dek'],
  ['berberine', BERBERINE, '.ar-toc'],
  ['supplement', '/supplement/magnesium.html', 'h1.det-h1'],
  ['topic', '/hub/sleep.html', 'h1.hub-title'],
  ['about', '/about.html', 'main.ab-wrap h1'],
];

test.beforeEach(async ({ page }) => {
  await install(page);
});

async function articleState(page) {
  return page.evaluate(() => {
    const slugOf = (href) => {
      const match = String(href || '').match(/\/supplement\/([a-z0-9-]+)\.html(?:$|[?#])/i);
      return match ? match[1].toLowerCase() : '';
    };
    const main = document.querySelector('main.ar-wrap');
    const seen = new Set();
    const body = [];
    [...main.querySelectorAll('a[href]')].forEach((a) => {
      if (a.closest('.ar-end, .rc-aend, .ar-related, .ca-related, .sx-related, .sk-related, .ss-mentioned')) return;
      const slug = slugOf(a.getAttribute('href'));
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      body.push(slug);
    });
    const mentionedAnchors = [...document.querySelectorAll('.ar-end #ss-mentioned a, .ar-end .ss-mentioned a')];
    const mentionedSeen = new Set();
    const mentioned = [];
    mentionedAnchors.forEach((a) => {
      const slug = slugOf(a.getAttribute('href'));
      if (!slug || mentionedSeen.has(slug)) return;
      mentionedSeen.add(slug);
      mentioned.push(slug);
    });
    const toc = document.querySelector('.ar-toc');
    const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const skips = [];
    let prev = 0;
    headings.forEach((heading) => {
      const level = Number(heading.tagName.slice(1));
      const text = (heading.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (prev && level > prev + 1) skips.push('h' + prev + ' → h' + level + ' before ' + text);
      prev = level;
    });
    const h2Count = [...main.querySelectorAll('h2')].filter((heading) => {
      const text = (heading.textContent || '').trim().toLowerCase();
      if (/^sources?$/.test(text) || /^related/.test(text) || /^supplements?\s+mentioned/.test(text)) return false;
      return !heading.closest('.rc-aend, .ss-mentioned, .ar-faq');
    }).length;
    const hasSources = !!main.querySelector('#sources, .rc-src-list');
    return {
      body,
      mentioned,
      names: mentionedAnchors.map((a) => a.textContent.trim()),
      tocLinks: toc ? [...toc.querySelectorAll('a')].map((a) => a.textContent.trim()) : [],
      tocHidden: !toc,
      skips,
      sections: h2Count + (hasSources ? 1 : 0) + (mentioned.length ? 1 : 0),
      dek: ((document.querySelector('.ar-dek') || {}).textContent || '').trim(),
    };
  });
}

for (const [name, urlPath] of ARTICLES) {
  test(name + ' mentioned list matches the body links', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector('.ar-end');
    const state = await articleState(page);
    expect(state.mentioned, name).toEqual(state.body);
  });

  test(name + ' contents list is real sections or hidden', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector('.ar-titleblock');
    const state = await articleState(page);
    expect(state.tocLinks, name).not.toEqual(['Bottom line']);
    expect(state.skips, name + ' skipped a heading level').toEqual([]);
    if (state.tocHidden) {
      expect(state.sections, name + ' hid a contents list that still has 3 entries').toBeLessThan(3);
      return;
    }
    expect(state.tocLinks.length, name).toBeGreaterThanOrEqual(3);
    const targets = await page.evaluate(() => [...document.querySelectorAll('.ar-toc a')].map((a) => {
      const id = decodeURIComponent((a.getAttribute('href') || '').replace(/^#/, ''));
      const el = document.getElementById(id);
      return { label: a.textContent.trim(), tag: el ? el.tagName : '' };
    }));
    for (const target of targets) {
      const real = target.tag === 'H2' || target.label === 'Sources' || target.label === 'Supplements mentioned';
      expect(real, target.label + ' is not an h2, Sources, or Supplements mentioned').toBe(true);
    }
  });
}

test('bergamot mentioned is only bergamot', async ({ page }) => {
  await goto(page, BERGAMOT);
  await page.waitForSelector('.ar-end');
  const state = await articleState(page);
  expect(state.names).toEqual(['Bergamot']);
  expect(state.body).toEqual(['bergamot-citrus-polyphenol-extract']);
});

test('studied mentioned includes the three body-linked supplements', async ({ page }) => {
  await goto(page, STUDIED);
  await page.waitForSelector('.ar-dek');
  await page.waitForSelector('.ar-end');
  const state = await articleState(page);
  expect(state.dek).toBe(STUDIED_DEK);
  expect(state.dek).not.toBe('500+ trials on creatine.');
  for (const label of ['Psyllium husk', 'Oat beta-glucan', 'Oral rehydration salts']) {
    expect(state.names, label).toContain(label);
  }
  expect(state.tocLinks).not.toEqual(['Bottom line']);
});

test('berberine chart title does not skip a heading level', async ({ page }) => {
  await goto(page, BERBERINE);
  await page.waitForSelector('.rc-chart-title');
  const chart = await page.locator('.rc-chart-title').evaluate((el) => ({
    tag: el.tagName,
    text: (el.textContent || '').replace(/\u2011/g, '-').trim(),
  }));
  expect(chart.tag).toBe('H3');
  expect(chart.text).toBe('Berberine vs. the actual GLP-1 class');
  const state = await articleState(page);
  expect(state.skips).toEqual([]);
});

for (const [name, urlPath, ready] of PAGES) {
  test(name + ' does not overflow horizontally', async ({ page }) => {
    await goto(page, urlPath);
    await page.waitForSelector(ready, { timeout: 60000 });
    if (name === 'home') await page.waitForSelector('#s-content .sc', { timeout: 60000 });
    if (name === 'supplement') {
      await page.waitForFunction(() => {
        const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
        if (!links.some((link) => /\/styles\.css/.test(link.href))) return false;
        return links.every((link) => !!link.sheet);
      }, null, { timeout: 20000 });
    }
    const box = await page.evaluate(() => {
      const doc = document.documentElement;
      const footer = document.querySelector('footer.site-footer');
      const rect = footer ? footer.getBoundingClientRect() : null;
      return {
        overflow: doc.scrollWidth - doc.clientWidth,
        footerRight: rect ? Math.round(rect.right) : 0,
        footerWidth: rect ? Math.round(rect.width) : 0,
        inner: window.innerWidth,
      };
    });
    expect(box.overflow, JSON.stringify(box)).toBeLessThanOrEqual(0);
    expect(box.footerWidth, JSON.stringify(box)).toBeLessThanOrEqual(box.inner);
    expect(box.footerRight, JSON.stringify(box)).toBeLessThanOrEqual(box.inner);
  });
}

test('hidden contents list keeps the reading column at the same left edge', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'measured at 1280');
  await goto(page, BERBERINE);
  await page.waitForSelector('main.ar-wrap .ar-toc');
  await page.waitForSelector('main.ar-wrap .ar-column');
  const withContents = await page.evaluate(() => Math.round(document.querySelector('main.ar-wrap .ar-column').getBoundingClientRect().left));
  await goto(page, STUDIED);
  await page.waitForSelector('main.ar-wrap.ar-no-toc .ar-column');
  const hidden = await page.evaluate(() => {
    const column = document.querySelector('main.ar-wrap .ar-column');
    return {
      left: Math.round(column.getBoundingClientRect().left),
      toc: !!document.querySelector('.ar-toc'),
    };
  });
  expect(hidden.toc).toBe(false);
  expect(withContents).toBe(377);
  expect(hidden.left).toBe(withContents);
});

test('article deks use balanced wrapping', async ({ page }) => {
  await goto(page, STUDIED);
  await page.waitForSelector('.ar-dek');
  const wrap = await page.locator('.ar-dek').evaluate((el) => getComputedStyle(el).textWrap);
  expect(wrap).toBe('balance');
});

async function mentionedNames(page, urlPath) {
  await goto(page, urlPath);
  await page.waitForSelector('#ss-mentioned[data-names="display"]');
  return page.evaluate(() => {
    return [...document.querySelectorAll('.ar-end #ss-mentioned a')].map((a) => {
      return (a.textContent || '').replace(/\u2011/g, '-').replace(/\s+/g, ' ').trim();
    });
  });
}

test('exercise mentioned names use the supplement display name', async ({ page }) => {
  const names = await mentionedNames(page, EXERCISE);
  expect(names).toEqual(['Omega-3 (EPA/DHA)', 'Berberine', 'Ashwagandha']);
});

test('kaempferol mentioned names use the supplement display name', async ({ page }) => {
  const names = await mentionedNames(page, KAEMPFEROL);
  expect(names).toContain('Saffron (Crocus sativus)');
  expect(names).toContain('Quercetin');
  expect(names.join(' ')).not.toMatch(/\bsaffron\b/);
  expect(names.join(' ')).not.toMatch(/\bquercetin\b/);
});

test('exercise chart title is an h3', async ({ page }) => {
  await goto(page, EXERCISE);
  await page.waitForSelector('.rc-chart-title');
  const chart = await page.locator('.rc-chart-title').evaluate((el) => ({
    tag: el.tagName,
    text: (el.textContent || '').replace(/\u2011/g, '-').trim(),
  }));
  expect(chart.tag).toBe('H3');
  expect(chart.text).toBe('Effect size for same endpoint');
  const state = await articleState(page);
  expect(state.skips).toEqual([]);
});

test('reviewed-against text is stone and meets contrast', async ({ page }) => {
  await goto(page, EXERCISE);
  await page.waitForFunction(() => {
    const line = [...document.querySelectorAll('p, div, li, span')].find((el) => {
      return /^Reviewed against \d+/.test((el.textContent || '').replace(/\s+/g, ' ').trim());
    });
    return !!line && getComputedStyle(line).color === 'rgb(87, 83, 78)';
  });
  const contrast = await page.evaluate(() => {
    const line = [...document.querySelectorAll('p, div, li, span')].find((el) => {
      return /^Reviewed against \d+/.test((el.textContent || '').replace(/\s+/g, ' ').trim());
    });
    function parse(color) {
      const match = String(color).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
    }
    function linear(channel) {
      const s = channel / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }
    function lum(rgb) {
      return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
    }
    let bg = null;
    let node = line;
    while (node && node !== document.documentElement) {
      const color = getComputedStyle(node).backgroundColor;
      const parsed = parse(color);
      if (parsed && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(color) && color !== 'transparent') {
        bg = parsed;
        break;
      }
      node = node.parentElement;
    }
    if (!bg) bg = parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255];
    const fg = parse(getComputedStyle(line).color);
    const lighter = Math.max(lum(fg), lum(bg));
    const darker = Math.min(lum(fg), lum(bg));
    return {
      color: getComputedStyle(line).color,
      ratio: (lighter + 0.05) / (darker + 0.05),
    };
  });
  expect(contrast.color).toBe('rgb(87, 83, 78)');
  expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
});

test('phone footer text is not covered by the back-to-top button', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone', 'phone footer');
  await goto(page, STUDIED);
  await page.waitForSelector('footer.site-footer');
  await page.waitForSelector('.ssux-top', { state: 'attached' });
  await page.waitForFunction(() => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    return links.some((link) => /\/styles\.css/.test(link.href) && link.sheet);
  });
  // On this phone viewport, scrollTo and scrollIntoView move the page without
  // a scroll event, so the button never adds .show. A wheel from past 600px
  // does fire one. A synthetic scroll event scrolls back to the top.
  await page.waitForFunction(() => document.documentElement.scrollHeight > window.innerHeight + 800);
  await page.evaluate(() => { document.scrollingElement.scrollTop = 700; });
  await page.mouse.wheel(0, 400);
  await expect(page.locator('.ssux-top.show')).toBeVisible();
  await page.locator('footer.site-footer').evaluate((el) => el.scrollIntoView({ block: 'end' }));
  const box = await page.evaluate(() => {
    const footer = document.querySelector('footer.site-footer');
    const button = document.querySelector('.ssux-top');
    const legal = document.querySelector('.site-footer-bottom');
    const range = document.createRange();
    range.selectNodeContents(legal);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    const last = rects[rects.length - 1];
    const buttonBox = button.getBoundingClientRect();
    const separated = last.bottom <= buttonBox.top + 0.5
      || last.top >= buttonBox.bottom - 0.5
      || last.right <= buttonBox.left + 0.5
      || last.left >= buttonBox.right - 0.5;
    return {
      pad: parseFloat(getComputedStyle(footer).paddingBottom),
      buttonHeight: buttonBox.height,
      separated,
      lastBottom: Math.round(last.bottom),
      buttonTop: Math.round(buttonBox.top),
    };
  });
  expect(box.pad).toBeGreaterThanOrEqual(box.buttonHeight + 16);
  expect(box.separated, JSON.stringify(box)).toBe(true);
});
