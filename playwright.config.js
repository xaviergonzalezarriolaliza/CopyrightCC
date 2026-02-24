const { defineConfig } = require('@playwright/test')

// Allow runtime slowMo via environment variable PLAYWRIGHT_SLOWMO (milliseconds)
const slowMo = process.env.PLAYWRIGHT_SLOWMO ? Number(process.env.PLAYWRIGHT_SLOWMO) : 0

module.exports = defineConfig({
  testDir: 'playwright/tests',
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
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
