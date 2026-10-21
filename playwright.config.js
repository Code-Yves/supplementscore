const path = require('path');

process.env.FONTCONFIG_FILE = process.env.FONTCONFIG_FILE || path.join(__dirname, 'tests/fonts/local.conf');

const { defineConfig, devices } = require('@playwright/test');

const iPhone = devices['iPhone 13'];
const port = process.env.PW_PORT || '4173';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 2,
  timeout: 120000,
  expect: {
    timeout: 20000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.001,
    },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:' + port,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'python3 -m http.server ' + port + ' --bind 127.0.0.1',
    url: 'http://127.0.0.1:' + port + '/',
    reuseExistingServer: !process.env.CI && !process.env.PW_PORT,
    timeout: 30000,
  },
  projects: [
    {
      name: 'desktop',
      grepInvert: /@crawl/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
    },
    {
      name: 'iphone',
      grepInvert: /@crawl/,
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        userAgent: iPhone.userAgent,
      },
    },
    {
      name: 'crawl',
      grep: /@crawl/,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
