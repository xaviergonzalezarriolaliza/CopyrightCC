import { test, expect } from '@playwright/test'
import { loginWithSSO } from '../helpers/login'

test('search for "miccrotro catalunya" returns no results', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginWithSSO(context, page, { username: USERNAME, password: PASSWORD })

  const marketplace = 'https://marketplace.copyright.com/rs-ui-web/mp'
  await page.goto(marketplace, { waitUntil: 'networkidle' })

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

  let searchSel: string | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const sel of searchCandidates) {
      const loc = page.locator(sel)
      if ((await loc.count()) > 0) {
        try {
          await loc.first().waitFor({ state: 'visible', timeout: 2000 })
          searchSel = sel
          break
        } catch (e) {}
      }
    }
    if (searchSel) break
    if (attempt === 0) {
      await page.reload({ waitUntil: 'networkidle' }).catch(() => {})
      await page.waitForTimeout(800)
    }
  }

  if (!searchSel) {
    await page.screenshot({ path: 'search-no-input-miccrotro.png', fullPage: true })
    throw new Error('No search input found on marketplace')
  }

  const query = 'miccrotro catalunya'
  await page.fill(searchSel, query)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    page.locator(searchSel).first().press('Enter')
  ])

  await page.waitForTimeout(1000)

  const resultSelectors = ['.result', '.results .item', '.search-results .result', '.product', '.publication', '.mp-result', 'article', 'li']

  const foundTitles = new Set<string>()
  for (const sel of resultSelectors) {
    const items = page.locator(sel)
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      try {
        const el = items.nth(i)
        const text = (await el.innerText()).trim()
        if (text && /miccrotro|catalunya/i.test(text)) {
          foundTitles.add(text.split('\n')[0].trim())
        } else {
          const anchor = el.locator('a')
          if ((await anchor.count()) > 0) {
            const aText = (await anchor.first().innerText()).trim()
            if (aText && /miccrotro|catalunya/i.test(aText)) foundTitles.add(aText.split('\n')[0].trim())
          }
        }
      } catch (e) {}
    }
    if (foundTitles.size > 0) break
  }

  if (foundTitles.size === 0) {
    const anchors = page.locator('a')
    const acount = await anchors.count()
    for (let i = 0; i < acount; i++) {
      try {
        const a = anchors.nth(i)
        const txt = (await a.innerText()).trim()
        if (txt && /miccrotro|catalunya/i.test(txt)) foundTitles.add(txt.split('\n')[0].trim())
      } catch (e) {}
      if (foundTitles.size > 0) break
    }
  }

  await page.screenshot({ path: 'search-no-results-miccrotro.png', fullPage: true })

  console.log('Found titles:', Array.from(foundTitles).slice(0,20))
  expect(foundTitles.size).toBe(0)

  await context.close()
})
