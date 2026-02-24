const { test, expect } = require('@playwright/test')

test('accept cookies, open login and sign in (handles new tabs)', async ({ browser }) => {
  // Create fresh context and pre-set OneTrust cookies so banner often won't appear
  const context = await browser.newContext()

  // Add domain cookie to avoid banner where possible
  await context.addCookies([
    { name: 'OptanonAlertBoxClosed', value: 'true', domain: 'www.copyright.com', path: '/' },
    { name: 'OptanonConsent', value: 'true', domain: 'www.copyright.com', path: '/' }
  ])

  const page = await context.newPage()
  await page.goto('/')

  // Try to click cookie accept if still present (top-level)
  try {
    const accept = page.locator('#onetrust-accept-btn-handler')
    if (await accept.count() > 0) {
      await accept.click({ timeout: 2000 })
    } else {
      // look for text-based controls
      const byText = page.locator('text=/accept all cookies|accept cookies|accept all/i')
      if (await byText.count() > 0) await byText.first().click()
    }
  } catch (e) {
    // ignore
  }

  // Try to read the account link href from the menu and navigate there.
  const accountSel = '#primary-menu-list-mobile > #nav-menu-item-50313 > .sub-menu > #nav-menu-item-50314 > .menu-link'
  let href = null
  try {
    href = await page.locator(accountSel).first().getAttribute('href')
  } catch (e) {
    href = null
  }

  // If the account link wasn't found, try opening the mobile menu then read it again
  if (!href) {
    const menuCandidates = [
      '.menu-toggle__icon--close > svg',
      '.menu-toggle__icon--close',
      '.menu-toggle',
      '.menu-toggle__icon',
    ]
    for (const sel of menuCandidates) {
      try {
        const loc = page.locator(sel)
        if (await loc.count() > 0) {
          await loc.first().click({ force: true }).catch(() => {})
          await page.waitForTimeout(300)
        }
      } catch (e) {
        // ignore
      }
    }
    try {
      href = await page.locator(accountSel).first().getAttribute('href')
    } catch (e) {
      href = null
    }
  }

  if (!href) {
    console.log('Could not find account link href; aborting. Current URL:', page.url())
    const fs = require('fs')
    fs.writeFileSync('playwright-main-page-snapshot.html', await page.content())
    throw new Error('Account link not found; saved snapshot to playwright-main-page-snapshot.html')
  }

  // Visit the discovered account/login URL
  if (href.startsWith('http')) {
    await page.goto(href, { waitUntil: 'networkidle' })
  } else {
    await page.goto(href, { waitUntil: 'networkidle' })
  }
  let loginPage = page

  // Now on loginPage: fill credentials (replace with env vars in CI)
  // Debug: log current URL
  console.log('Login page URL:', loginPage.url())

  // Try multiple possible username selectors and pick the first visible one
  const usernameCandidates = ['#username', 'input[name="username"]', 'input[name="email"]', 'input[type="email"]', 'input[name="user"]', '#user_login']
  let usernameSelector = null
  for (const sel of usernameCandidates) {
    if (await loginPage.locator(sel).count() > 0) {
      try {
        await loginPage.locator(sel).first().waitFor({ state: 'visible', timeout: 3000 })
        usernameSelector = sel
        break
      } catch (e) {
        // not visible yet
      }
    }
  }

  if (!usernameSelector) {
    // If no username input found, dump a small snapshot to help debugging and fail cleanly
    console.log('No username input found; page title:', await loginPage.title())
    const body = await loginPage.content()
    // write snapshot to disk for inspection
    const fs = require('fs')
    fs.writeFileSync('playwright-login-page-snapshot.html', body)
    throw new Error('Login form not found on page; saved snapshot to playwright-login-page-snapshot.html')
  }

  await loginPage.fill(usernameSelector, 'xavier.gonzalez.arriola@gmail.com')

  // Find password input from candidates
  const passwordCandidates = ['#password', 'input[name="password"]', 'input[type="password"]', '#user_pass']
  let passwordSelector = null
  for (const sel of passwordCandidates) {
    if (await loginPage.locator(sel).count() > 0) {
      try {
        await loginPage.locator(sel).first().waitFor({ state: 'visible', timeout: 2000 })
        passwordSelector = sel
        break
      } catch (e) {
        // not visible yet
      }
    }
  }
  if (!passwordSelector) passwordSelector = 'input[type="password"]'
  await loginPage.fill(passwordSelector, '@RzHsJziGPzDQ@5')

  // Find and click submit button from candidates
  const submitCandidates = ['button[type="submit"]', 'input[type="submit"]', '.login button', '.woocommerce-form > .button', '#login']
  let clicked = false
  for (const s of submitCandidates) {
    const loc = loginPage.locator(s)
    if (await loc.count() > 0) {
      try {
        await loc.first().click({ force: true })
        clicked = true
        break
      } catch (e) {
        // try next
      }
    }
  }
  if (!clicked) {
    throw new Error('Could not find a submit button to click')
  }

    // Simple assert: final URL should not still be the SSO login URL
    const final = page.url()
    console.log('Login page URL:', final)
    expect(final).not.toContain('/cas/login')

  await context.close()
})
