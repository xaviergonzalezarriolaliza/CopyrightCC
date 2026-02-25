import { test, expect } from '../helpers/fixtures'
import { loginCCC } from '../helpers/login'
import { startJSCoverage, stopJSCoverage } from '../helpers/coverage'

test('login flow smoke', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })
  // start JS coverage collection (writes raw V8 coverage JSON)
  // basic assertion: after login try marketplace
  await page.goto('https://marketplace.copyright.com/rs-ui-web/mp')
  await expect(page).toHaveURL(/\/mp/)

  // stop coverage and write file (only works for Chromium; startJSCoverage returns null otherwise)
  try {
    const _covClient = await startJSCoverage(page)
    if (_covClient) {
      await stopJSCoverage(_covClient, `coverage/playwright-login-${Date.now()}.json`)
    }
  } catch (e) {
    // don't fail the test if coverage collection isn't supported
    console.warn('Coverage collection skipped or failed:', e)
  }
  await context.close()
})
