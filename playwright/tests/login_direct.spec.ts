import { test, expect } from '@playwright/test'
import { loginCCC } from '../helpers/login'

test('direct SSO login', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'sso-after-submit.png' })
  await context.close()
})
