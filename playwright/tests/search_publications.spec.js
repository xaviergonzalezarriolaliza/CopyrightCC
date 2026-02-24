const { test, expect } = require('@playwright/test')
const { loginWithSSO } = require('../helpers/login')

test('login and search for Albert Einstein publications', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginWithSSO(context, page, { username: USERNAME, password: PASSWORD })

  // Navigate to marketplace search page
  const marketplace = 'https://marketplace.copyright.com/rs-ui-web/mp'
  await page.goto(marketplace, { waitUntil: 'networkidle' })

  // Find a search input using a list of common selectors
  const searchCandidates = [
    'input[type="search"]',
    'input[name="q"]',
    'input[name="search"]',
    'input[placeholder*="Search"]',
    'input[aria-label*="Search"]',
    '#search',
    '.search-input',
    'input[type="text"]'
  ]

  let searchSel = null
  for (const sel of searchCandidates) {
    const loc = page.locator(sel)
    if (await loc.count() > 0) {
      try {
        await loc.first().waitFor({ state: 'visible', timeout: 2000 })
        searchSel = sel
        break
      } catch (e) {
        // not visible
      }
    }
  }

  if (!searchSel) {
    await page.screenshot({ path: 'search-no-input.png', fullPage: true })
    throw new Error('No search input found on marketplace')
  }

  const query = 'albert einstein'
  await page.fill(searchSel, query)
  // Try pressing Enter first
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    page.locator(searchSel).first().press('Enter')
  ])

  // If navigation didn't happen, try clicking nearby submit buttons
  // common submit selectors
  const submitCandidates = ['button[type="submit"]', '.search-button', '.btn-search', '.search-submit']
  for (const sel of submitCandidates) {
    try {
      const loc = page.locator(sel)
      if (await loc.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => null),
          loc.first().click({ force: true }).catch(() => {})
        ])
        break
      }
    } catch (e) {
      // ignore
    }
  }

  // Wait a bit for results to load
  await page.waitForTimeout(1500)

  // Gather candidate result selectors
  const resultSelectors = [
    '.result',
    '.results .item',
    '.search-results .result',
    '.product',
    '.publication',
    '.mp-result',
    'article',
    'li'
  ]

  const foundTitles = new Set()
  for (const sel of resultSelectors) {
    const items = page.locator(sel)
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      try {
        const el = items.nth(i)
        const text = (await el.innerText()).trim()
        if (text && /albert|einstein/i.test(text)) {
          // use first line or trimmed text as title key
          const title = text.split('\n')[0].trim()
          foundTitles.add(title)
        } else {
          // if item doesn't contain the query, try to find a nested anchor or title
          const anchor = el.locator('a')
          if (await anchor.count() > 0) {
            const aText = (await anchor.first().innerText()).trim()
            if (aText && /albert|einstein/i.test(aText)) foundTitles.add(aText.split('\n')[0].trim())
          }
        }
      } catch (e) {
        // ignore per-item errors
      }
    }
    if (foundTitles.size >= 3) break
  }

  // As a fallback, search globally for links containing 'einstein'
  if (foundTitles.size < 3) {
    const anchors = page.locator('a')
    const acount = await anchors.count()
    for (let i = 0; i < acount; i++) {
      const a = anchors.nth(i)
      try {
        const txt = (await a.innerText()).trim()
        if (txt && /einstein/i.test(txt)) foundTitles.add(txt.split('\n')[0].trim())
      } catch (e) {}
      if (foundTitles.size >= 3) break
    }
  }

  // Save screenshot for inspection
  await page.screenshot({ path: 'search-results.png', fullPage: true })

  const resultsCount = foundTitles.size
  console.log('Found publication titles matching query:', Array.from(foundTitles).slice(0,10))
  expect(resultsCount).toBeGreaterThanOrEqual(3)

  await context.close()
})
