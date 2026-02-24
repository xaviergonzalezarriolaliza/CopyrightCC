async function loginWithSSO(context, page, { username, password, ssoUrl } = {}) {
  // Pre-set OneTrust cookies to avoid banner where possible
  try {
    await context.addCookies([
      { name: 'OptanonAlertBoxClosed', value: 'true', domain: 'www.copyright.com', path: '/' },
      { name: 'OptanonConsent', value: 'true', domain: 'www.copyright.com', path: '/' }
    ])
  } catch (e) {
    // ignore if cookie setting fails
  }

  const defaultSSO = 'https://sso.copyright.com/cas/login?allow_corporate_sign_in=true&lang=EN&service=https://marketplace.copyright.com/rs-ui-web/verify_ticket&register=https://marketplace.copyright.com/rs-ui-web/mp/registration'
  const target = ssoUrl || defaultSSO
  await page.goto(target, { waitUntil: 'networkidle' })

  // Try a set of selectors for username, password and submit
  const usernameCandidates = ['#username', 'input[name="username"]', 'input[name="email"]', 'input[type="email"]']
  const passwordCandidates = ['#password', 'input[name="password"]', 'input[type="password"]']
  const submitCandidates = ['button[type="submit"]', 'input[type="submit"]', 'button[name="submit"]', 'button.btn']

  let userSel = null
  for (const sel of usernameCandidates) {
    if (await page.locator(sel).count() > 0) {
      userSel = sel
      break
    }
  }
  if (!userSel) throw new Error('Username input not found on SSO page')

  let passSel = null
  for (const sel of passwordCandidates) {
    if (await page.locator(sel).count() > 0) {
      passSel = sel
      break
    }
  }
  if (!passSel) throw new Error('Password input not found on SSO page')

  await page.fill(userSel, username)
  await page.fill(passSel, password)

  // Try submit options, wait for navigation if it happens
  for (const sel of submitCandidates) {
    const loc = page.locator(sel)
    if (await loc.count() > 0) {
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
          loc.first().click({ force: true })
        ])
        return page
      } catch (e) {
        // try next
      }
    }
  }

  // Fallback: press Enter in password field
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    page.locator(passSel).press('Enter')
  ])
  return page
}

module.exports = { loginWithSSO }
