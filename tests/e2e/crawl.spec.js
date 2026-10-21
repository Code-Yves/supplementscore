const { test, expect } = require('@playwright/test');
const { crawl } = require('../crawl-links');

test('internal links and HTML entities @crawl', async () => {
  test.setTimeout(120000);
  const result = crawl();
  expect(result.files).toBeGreaterThan(500);
  expect(result.urls).toBeGreaterThan(100);
  expect(result.broken, result.broken.slice(0, 30).join('\n')).toEqual([]);
  expect(result.leaks, result.leaks.slice(0, 30).join('\n')).toEqual([]);
});
