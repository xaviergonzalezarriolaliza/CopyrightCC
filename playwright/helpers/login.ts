import type { BrowserContext, Page } from '@playwright/test'

export async function loginWithSSO(
  context: BrowserContext,
  page: Page,
  { username, password, ssoUrl }: { username?: string; password?: string; ssoUrl?: string } = {}
) {
  try {
    await context.addCookies([
      { name: 'OptanonAlertBoxClosed', value: 'true', domain: 'www.copyright.com', path: '/' },
      { name: 'OptanonConsent', value: 'true', domain: 'www.copyright.com', path: '/' }
    ])
  } catch (e) {
    // ignore failures to set cookies
  }

  const defaultSSO =
    'https://sso.copyright.com/cas/login?allow_corporate_sign_in=true&lang=EN&service=https://marketplace.copyright.com/rs-ui-web/verify_ticket&register=https://marketplace.copyright.com/rs-ui-web/mp/registration'
  const target = ssoUrl || defaultSSO
  await page.goto(target, { waitUntil: 'networkidle' })

  const usernameCandidates = ['#username', 'input[name="username"]', 'input[name="email"]', 'input[type="email"]']
  const passwordCandidates = ['#password', 'input[name="password"]', 'input[type="password"]']
  const submitCandidates = ['button[type="submit"]', 'input[type="submit"]', 'button[name="submit"]', 'button.btn']

  let userSel: string | null = null
  for (const sel of usernameCandidates) {
    if ((await page.locator(sel).count()) > 0) {
      userSel = sel
      break
    }
  }
  if (!userSel) throw new Error('Username input not found on SSO page')

  let passSel: string | null = null
  for (const sel of passwordCandidates) {
    if ((await page.locator(sel).count()) > 0) {
      passSel = sel
      break
    }
  }
  if (!passSel) throw new Error('Password input not found on SSO page')

  if (username) await page.fill(userSel, username)
  if (password) await page.fill(passSel, password)

  for (const sel of submitCandidates) {
    const loc = page.locator(sel)
    if ((await loc.count()) > 0) {
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

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    page.locator(passSel).press('Enter')
  ])
  return page
}
