import { test, expect } from '../helpers/fixtures'
import { loginCCC } from '../helpers/login'

test('login then visit marketplace', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })
  await page.goto('https://marketplace.copyright.com/rs-ui-web/mp', { waitUntil: 'networkidle' })
  expect(page.url()).toContain('/mp')
  await context.close()
})
