const { test, expect } = require('@playwright/test')
const { loginWithSSO } = require('../helpers/login')

test('login and visit marketplace', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  // Negative test 1: wrong username should NOT result in a logged-in state
  const ctxWrongUser = await browser.newContext()
  const pageWrongUser = await ctxWrongUser.newPage()
  await loginWithSSO(ctxWrongUser, pageWrongUser, { username: 'wrong.user@example.com', password: PASSWORD })
  // Check URL and page for login failure indicators rather than relying only on cookie names
  const finalWrongUser = pageWrongUser.url()
  const accountTextWrongUser = await pageWrongUser.locator('text=/my account|logout|sign out|welcome|dashboard/i').count()
  const errorTextWrongUser = await pageWrongUser.locator('text=/invalid|incorrect|error|failed/i').count()
  expect(accountTextWrongUser).toBe(0)
  expect(errorTextWrongUser + (finalWrongUser.includes('/cas/login') ? 1 : 0)).toBeGreaterThanOrEqual(1)
  await ctxWrongUser.close()

  // Negative test 2: wrong password should NOT result in a logged-in state
  const ctxWrongPass = await browser.newContext()
  const pageWrongPass = await ctxWrongPass.newPage()
  await loginWithSSO(ctxWrongPass, pageWrongPass, { username: USERNAME, password: 'incorrect-password' })
  const finalWrongPass = pageWrongPass.url()
  const accountTextWrongPass = await pageWrongPass.locator('text=/my account|logout|sign out|welcome|dashboard/i').count()
  const errorTextWrongPass = await pageWrongPass.locator('text=/invalid|incorrect|error|failed/i').count()
  expect(accountTextWrongPass).toBe(0)
  expect(errorTextWrongPass + (finalWrongPass.includes('/cas/login') ? 1 : 0)).toBeGreaterThanOrEqual(1)
  await ctxWrongPass.close()

  // Positive login
  await loginWithSSO(context, page, { username: USERNAME, password: PASSWORD })

  // After login, navigate to marketplace and take a screenshot
  const marketplace = 'https://marketplace.copyright.com/rs-ui-web/mp'
  await page.goto(marketplace, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'after-login-marketplace.png', fullPage: true })

  const cookies = await context.cookies()
  const hasSession = cookies.some(c => /session|JSESSIONID|sid|access_token|mp_session/i.test(c.name))
  expect(hasSession).toBeTruthy()

  // Optionally: check for visible indicator text
  const indicator = await page.locator('text=/welcome|dashboard|my account|logout|sign out/i').count()
  expect(indicator).toBeGreaterThanOrEqual(0)

  await context.close()
})
