const { defineConfig, devices } = require('@playwright/test')

// Allow runtime slowMo via environment variable PLAYWRIGHT_SLOWMO (milliseconds)
const slowMo = process.env.PLAYWRIGHT_SLOWMO ? Number(process.env.PLAYWRIGHT_SLOWMO) : 0

module.exports = defineConfig({
  testDir: 'playwright/tests',
  testMatch: /.*\.spec\.ts$/,
  projects: [
    // Desktop browsers
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    // Microsoft Edge (Chromium) via channel
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },

    // Mobile devices (common)
    { name: 'pixel5', use: { ...devices['Pixel 5'] } },
    { name: 'iphone13', use: { ...devices['iPhone 13'] } },
    { name: 'ipad-gen7', use: { ...devices['iPad (gen 7)'] } }
    ,
    // Samsung Galaxy phone and tablet examples
    {
      name: 'galaxy-s21',
      use: {
        // start from Pixel 5 descriptor then override to represent a Samsung Galaxy phone
        ...devices['Pixel 5'],
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 }
      }
    },
    {
      name: 'galaxy-tab-s7',
      use: {
        // Tablet-like viewport and touch support
        viewport: { width: 1200, height: 2000 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36'
      }
    }
  ],

  use: {
    baseURL: 'https://www.copyright.com',
    // Run headless in CI (no DISPLAY) but headed locally for debugging
    headless: process.env.CI ? true : false,
    launchOptions: {
      slowMo: slowMo
    },
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    trace: 'on-first-retry'
  }
})
