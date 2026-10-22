const { test, expect } = require('@playwright/test');
const { trackConsole, install, goto, quietLoader, settle, scrollY } = require('./helpers');

const ART_NAMES = {
  quickread: 'Top 10 Lists',
  guide: 'Guide',
  breakthrough: 'Breakthrough',
  kids: 'Kids',
  myth: 'Reality Check',
  safety: 'Safety Alert',
  condition: 'Condition',
  stack: 'Stack',
};

function expectedLoader(menuId, item) {
  if (menuId === 'cat-filter') return 'Retrieving supplements best for ' + item.label + '...';
  if (menuId === 'pop-filter') return 'Retrieving supplements for ' + item.label.toLowerCase() + '...';
  if (menuId === 'sx-filter') return 'Retrieving supplements for ' + item.label + '...';
  const name = ART_NAMES[item.val] || item.label;
  return 'Retrieving ' + name + '...';
}

async function menuState(page, id) {
  return page.evaluate((menuId) => {
    const menu = document.getElementById(menuId + '-menu');
    const list = document.getElementById('s-content');
    const menuRect = menu.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const scroll = window.scrollY || 0;
    const style = getComputedStyle(menu);
    const menuBottom = menuRect.bottom + scroll;
    const listTop = listRect.top + scroll;
    const overlaps = menuRect.bottom > listRect.top + 1 && menuRect.top < listRect.bottom - 1;
    const clips = [];
    let el = menu.parentElement;
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const cutX = cs.overflowX !== 'visible' && (menuRect.left < box.left - 1 || menuRect.right > box.right + 1);
      const cutY = cs.overflowY !== 'visible' && (menuRect.top < box.top - 1 || menuRect.bottom > box.bottom + 1);
      if (cutX || cutY) clips.push((el.id || el.className || el.tagName) + ' ' + cs.overflowX + '/' + cs.overflowY);
      el = el.parentElement;
    }
    const vw = window.innerWidth;
    const active = document.activeElement;
    const focusedItem = !!(active && menu.contains(active) && active.classList.contains('cdd-item'));
    let tinted = 0;
    menu.querySelectorAll('.cdd-item').forEach((item) => {
      const bg = getComputedStyle(item).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') tinted += 1;
    });
    const btn = document.querySelector('#' + menuId + '-wrap .cdd-btn');
    return {
      open: menu.classList.contains('open'),
      expanded: btn ? btn.getAttribute('aria-expanded') : '',
      position: style.position,
      overlaps,
      gap: listTop - menuBottom,
      height: menuRect.height,
      maxHeight: style.maxHeight,
      overflowY: style.overflowY,
      clips,
      fitsWidth: menuRect.width <= vw + 1 && menuRect.left >= -1 && menuRect.right <= vw + 1,
      focusedItem,
      tinted,
    };
  }, id);
}

async function openMenu(page, id, projectName) {
  await page.evaluate((menuId) => {
    document.querySelector('#' + menuId + '-wrap .cdd-btn').click();
  }, id);
  const state = await menuState(page, id);
  expect(state.open, id + ' opens').toBe(true);
  expect(state.expanded, id + ' aria-expanded').toBe('true');
  expect(state.position, id + ' menu position').toBe('static');
  expect(state.overlaps, id + ' menu overlaps the list').toBe(false);
  expect(state.gap, id + ' menu gap above the list').toBeGreaterThanOrEqual(-1);
  expect(state.height, id + ' menu height').toBeGreaterThan(40);
  expect(state.clips, id + ' ancestor clips the open menu').toEqual([]);
  expect(state.fitsWidth, id + ' menu fits the viewport width').toBe(true);
  expect(state.focusedItem, id + ' pre-highlights an option').toBe(false);
  expect(state.tinted, id + ' pre-highlights an option').toBe(0);
  if (projectName === 'iphone') {
    expect(state.maxHeight, id + ' phone menu grows in flow').toBe('none');
    expect(state.overflowY, id + ' phone menu grows in flow').toBe('visible');
  }
}

async function expectClosed(page) {
  await expect.poll(async () => page.locator('#sfbar-main .cdd-menu.open').count()).toBe(0);
  await expect(page.locator('#sfbar-main .cdd-btn[aria-expanded="true"]')).toHaveCount(0);
}

test.describe('homepage category menus', () => {
  test.describe.configure({ timeout: 360000 });

  test.beforeEach(async ({ page }) => {
    await install(page);
  });

  test('every option in every menu', async ({ page }, testInfo) => {
    const errors = trackConsole(page);
    await goto(page, '/');
    await page.waitForSelector('#sfbar-main .cdd-item', { state: 'attached', timeout: 60000 });
    await page.waitForSelector('#s-content .sc', { timeout: 60000 });
    await quietLoader(page);

    const cells = await page.evaluate(() => {
      return [...document.querySelectorAll('#sfbar-main .cdd-btn')].map((button) => {
        const rect = button.getBoundingClientRect();
        return { w: Math.round(rect.width), h: Math.round(rect.height) };
      });
    });
    expect(cells, 'four filter cells').toHaveLength(4);
    for (const cell of cells) expect(cell.h, 'cell height').toBe(48);
    for (const cell of cells) expect(Math.abs(cell.w - cells[0].w), 'equal cell widths').toBeLessThanOrEqual(1);

    const menus = await page.evaluate(() => {
      return [...document.querySelectorAll('#sfbar-main .cdd')].map((wrap) => ({
        id: wrap.id.replace(/-wrap$/, ''),
        items: [...wrap.querySelectorAll('.cdd-item')].map((item) => {
          const labelEl = item.querySelector('.pop-lbl');
          const label = (labelEl ? labelEl.textContent : item.textContent).trim().replace(/\s+/g, ' ');
          return { val: item.getAttribute('data-val'), label };
        }),
      }));
    });
    expect(menus.map((menu) => menu.id)).toEqual(['cat-filter', 'pop-filter', 'sx-filter', 'art-filter']);
    const total = menus.reduce((sum, menu) => sum + menu.items.length, 0);
    expect(total).toBeGreaterThan(40);

    const look = await page.evaluate(() => {
      const bar = document.getElementById('sfbar-main');
      const barCs = getComputedStyle(bar);
      const chevs = [...bar.querySelectorAll('.cdd-chev')].map((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { display: s.display, w: r.width, h: r.height, visibility: s.visibility };
      });
      const research = document.querySelector('#art-filter-wrap .cdd-lbl');
      return {
        borders: [barCs.borderTopWidth, barCs.borderRightWidth, barCs.borderBottomWidth, barCs.borderLeftWidth],
        borderColor: barCs.borderTopColor,
        chevs,
        researchColor: getComputedStyle(research).color,
        open: bar.querySelectorAll('.cdd-menu.open').length,
      };
    });
    expect(look.borders, 'outer border').toEqual(['1px', '1px', '1px', '1px']);
    expect(look.borderColor, 'outer border color').toBe('rgb(220, 218, 215)');
    expect(look.chevs, 'one chevron per cell').toHaveLength(4);
    for (const chev of look.chevs) {
      expect(chev.display, 'chevron display').not.toBe('none');
      expect(chev.visibility, 'chevron visibility').not.toBe('hidden');
      expect(chev.w, 'chevron width').toBeGreaterThan(4);
      expect(chev.h, 'chevron height').toBeGreaterThan(4);
    }
    expect(look.researchColor, 'Research is not teal when nothing is selected').toBe('rgb(12, 10, 9)');
    expect(look.open, 'menus start closed').toBe(0);

    for (const menu of menus) {
      await openMenu(page, menu.id, testInfo.project.name);
      await page.keyboard.press('Escape');
      await expectClosed(page);

      await openMenu(page, menu.id, testInfo.project.name);
      await page.evaluate(() => document.querySelector('h1').click());
      await expectClosed(page);
    }

    let sawShowMore = false;
    for (const menu of menus) {
      for (const item of menu.items) {
        const where = menu.id + ' / ' + item.val;
        const before = await scrollY(page);
        await openMenu(page, menu.id, testInfo.project.name);
        const picked = await page.evaluate(({ menuId, val }) => {
          const menuEl = document.getElementById(menuId + '-menu');
          const node = [...menuEl.querySelectorAll('.cdd-item')].find((el) => el.getAttribute('data-val') === val);
          if (!node) return { missing: true };
          const y0 = window.scrollY || 0;
          node.click();
          const msg = (document.querySelector('.ss-list-load-msg') || {}).textContent || '';
          const sub = (document.querySelector('.ss-list-load-sub') || {}).textContent || '';
          return { missing: false, msg, sub, y1: window.scrollY || 0, y0 };
        }, { menuId: menu.id, val: item.val });

        expect(picked.missing, where + ' missing item').toBe(false);
        expect(picked.msg, where).toBe(expectedLoader(menu.id, item));
        expect(picked.sub, where).toBe('Ranked by clinical evidence and safety.');
        expect(Math.abs(picked.y1 - before), where + ' scroll while loading').toBeLessThanOrEqual(5);
        expect(picked.msg).not.toMatch(/&#\d+;|&#x[0-9a-fA-F]+;/i);

        await page.waitForFunction(() => {
          if (document.querySelector('.ss-list-load')) return false;
          const root = document.getElementById('s-content');
          return !!(root && (root.querySelector('.sc') || root.querySelector('.article-card') || root.querySelector('.empty')));
        }, null, { timeout: 20000 });
        await settle(page);

        const after = await scrollY(page);
        expect(Math.abs(after - before), where + ' scroll after results').toBeLessThanOrEqual(5);

        const results = await page.evaluate(({ menuId, val }) => {
          const lit = [...document.querySelectorAll('#sfbar-main .cdd-btn.on')];
          const root = document.getElementById('s-content');
          const cards = [...root.querySelectorAll('.sc, .article-card')];
          const visible = cards.filter((el) => !el.classList.contains('tier-hidden') && !el.classList.contains('art-pill-hidden'));
          const heading = ((root.querySelector('.pop-head-t') || {}).textContent || '').trim();
          const categories = cards.map((card) => card.getAttribute('data-category')).filter(Boolean);
          return {
            lit: lit.length,
            litId: lit[0] && lit[0].closest('.cdd') ? lit[0].closest('.cdd').id : '',
            empty: !!root.querySelector('.empty'),
            total: cards.length,
            visible: visible.length,
            heading,
            categoriesOk: menuId !== 'art-filter' || (categories.length > 0 && categories.every((cat) => cat === val)),
            showMore: !!root.querySelector('.tier-more'),
          };
        }, { menuId: menu.id, val: item.val });

        expect(results.lit, where + ' selected buttons').toBe(1);
        expect(results.litId, where + ' lit menu').toBe(menu.id + '-wrap');
        if (menu.id === 'cat-filter' && item.val === menu.items[0].val) {
          const selected = await page.evaluate(() => {
            const on = document.querySelector('#sfbar-main .cdd-btn.on');
            const researchBtn = document.querySelector('#art-filter-wrap .cdd-btn');
            const researchLbl = document.querySelector('#art-filter-wrap .cdd-lbl');
            return {
              shadow: getComputedStyle(on).boxShadow,
              color: getComputedStyle(on).color,
              researchOn: researchBtn.classList.contains('on'),
              researchColor: getComputedStyle(researchLbl).color,
              researchShadow: getComputedStyle(researchBtn).boxShadow,
            };
          });
          expect(selected.shadow, 'selected 3px underline').toBe('rgb(21, 90, 80) 0px -3px 0px 0px inset');
          expect(selected.color, 'selected label').toBe('rgb(21, 90, 80)');
          expect(selected.researchOn, 'Research stays unselected').toBe(false);
          expect(selected.researchColor, 'Research is not teal when unselected').toBe('rgb(12, 10, 9)');
          expect(selected.researchShadow, 'Research has no underline').toBe('none');
        }
        expect(results.empty, where + ' empty state').toBe(false);
        expect(results.total, where + ' result count').toBeGreaterThan(0);
        expect(results.visible, where + ' visible results').toBeGreaterThan(0);
        expect(results.heading.length, where + ' heading').toBeGreaterThan(0);
        expect(results.categoriesOk, where + ' article categories').toBe(true);
        if (menu.id === 'cat-filter') expect(results.heading, where).toContain(item.label);
        if (menu.id === 'pop-filter' || menu.id === 'sx-filter') {
          expect(results.heading.toLowerCase(), where).toContain(item.label.toLowerCase());
        }

        if (results.showMore) {
          sawShowMore = true;
          const shownBefore = await page.evaluate(() => {
            return document.querySelectorAll('#s-content .sc:not(.tier-hidden), #s-content .article-card:not(.art-pill-hidden)').length;
          });
          const yShow = await scrollY(page);
          await page.evaluate(() => document.querySelector('#s-content .tier-more').click());
          await settle(page);
          const shownAfter = await page.evaluate(() => {
            return document.querySelectorAll('#s-content .sc:not(.tier-hidden), #s-content .article-card:not(.art-pill-hidden)').length;
          });
          expect(shownAfter, where + ' show more').toBeGreaterThan(shownBefore);
          expect(Math.abs((await scrollY(page)) - yShow), where + ' show more scroll').toBeLessThanOrEqual(5);
        }
      }
    }

    expect(sawShowMore, 'at least one menu has Show more').toBe(true);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
