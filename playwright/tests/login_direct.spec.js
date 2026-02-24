const { test, expect } = require('@playwright/test')

// Direct SSO login attempt using known credentials. Saves a snapshot and cookies.
test('direct SSO login', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  // Pre-set OneTrust cookies to avoid banner
  await context.addCookies([
    { name: 'OptanonAlertBoxClosed', value: 'true', domain: 'www.copyright.com', path: '/' },
    { name: 'OptanonConsent', value: 'true', domain: 'www.copyright.com', path: '/' }
  ])

  // Known SSO URL observed previously (may change)
  const ssoUrl = 'https://sso.copyright.com/cas/login?allow_corporate_sign_in=true&lang=EN&service=https://marketplace.copyright.com/rs-ui-web/verify_ticket&register=https://marketplace.copyright.com/rs-ui-web/mp/registration'
  console.log('Navigating to SSO URL:', ssoUrl)
  await page.goto(ssoUrl, { waitUntil: 'networkidle' })

  const { loginWithSSO } = require('../helpers/login')
  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginWithSSO(context, page, { username: USERNAME, password: PASSWORD })

  // Save a screenshot and cookies for inspection
  await page.screenshot({ path: 'sso-after-submit.png', fullPage: true })
  const cookies = await context.cookies()
  const fs = require('fs')
  fs.writeFileSync('sso-cookies.json', JSON.stringify(cookies, null, 2))

  console.log('Final URL after submit:', page.url())
  // Assertions to confirm login succeeded
  const finalUrl = page.url()
  if (finalUrl.includes('/cas/login')) {
    throw new Error('Still on SSO login page after submit')
  }

  // Check for common logged-in indicators (adjust selector/text as needed)
  const accountLocator = page.locator('text=/my account|logout|sign out|welcome|account/i')
  const hasAccountText = await accountLocator.count() > 0

  // Check for session-like cookie presence
  const hasSessionCookie = cookies.some(c => /session|JSESSIONID|sid|access_token|mp_session/i.test(c.name))

  if (!hasAccountText && !hasSessionCookie) {
    // Save extra debug artifacts
    await page.screenshot({ path: 'sso-after-submit-no-indicator.png', fullPage: true })
    throw new Error('Login did not produce account indicator or session cookie')
  }

  await context.close()
})
