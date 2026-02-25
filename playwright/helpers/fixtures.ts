import { test as base, expect } from '@playwright/test'
import { startJSCoverage, stopJSCoverage } from './coverage'

export const test = base.extend({
  // internal fixture to collect JS coverage on Chromium only
  _coverage: [async ({ page }, use) => {
    const client = await startJSCoverage(page)
    await use(client)
    try {
      if (client) await stopJSCoverage(client, `coverage/playwright-${Date.now()}.json`)
    } catch (e) {
      console.warn('Failed to flush coverage:', e)
    }
  }, { scope: 'test' }]
})

export { expect }
