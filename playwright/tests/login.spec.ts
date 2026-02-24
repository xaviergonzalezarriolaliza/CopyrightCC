import { test, expect } from '@playwright/test'
import { loginCCC } from '../helpers/login'

test('login flow smoke', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })

  // basic assertion: after login try marketplace
  await page.goto('https://marketplace.copyright.com/rs-ui-web/mp')
  await expect(page).toHaveURL(/\/mp/) 
  await context.close()
})
