import { test, expect } from '@playwright/test'
import { loginWithSSO } from '../helpers/login'

test('login flow smoke', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = '@RzHsJziGPzDQ@5'

  await loginWithSSO(context, page, { username: USERNAME, password: PASSWORD })

  // basic assertion: after login try marketplace
  await page.goto('https://marketplace.copyright.com/rs-ui-web/mp', { waitUntil: 'networkidle' })
  expect(page.url()).toContain('/mp')
  await context.close()
})
