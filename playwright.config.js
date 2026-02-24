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

    // Mobile devices (common)
    { name: 'pixel5', use: { ...devices['Pixel 5'] } },
    { name: 'iphone13', use: { ...devices['iPhone 13'] } },
    { name: 'ipad-gen7', use: { ...devices['iPad (gen 7)'] } }
  ],

  use: {
    baseURL: 'https://www.copyright.com',
    headless: false,
    launchOptions: {
      slowMo: slowMo
    },
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    trace: 'on-first-retry'
  }
})
