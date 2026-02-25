import { test, expect } from '@playwright/test'
import { loginCCC } from '../helpers/login'
import { startJSCoverage, stopJSCoverage } from '../helpers/coverage'

test('login flow smoke', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })
  // start JS coverage collection (writes raw V8 coverage JSON)
  const _covClient = await startJSCoverage(page)

  // basic assertion: after login try marketplace
  await page.goto('https://marketplace.copyright.com/rs-ui-web/mp')
  await expect(page).toHaveURL(/\/mp/)

  // stop coverage and write file
  await stopJSCoverage(_covClient, `coverage/playwright-login-${Date.now()}.json`)
  await context.close()
})
