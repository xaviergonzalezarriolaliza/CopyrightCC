import { test, expect } from '../helpers/fixtures'
import { loginCCC } from '../helpers/login'

test('login and search for Albert Einstein publications', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const USERNAME = process.env.TEST_USER || 'xavier.gonzalez.arriola@gmail.com'
  const PASSWORD = process.env.TEST_PASS || '@RzHsJziGPzDQ@5'

  await loginCCC(context, page, { username: USERNAME, password: PASSWORD })

  const marketplace = 'https://marketplace.copyright.com/rs-ui-web/mp'
  await page.goto(marketplace, { waitUntil: 'networkidle' })

  const searchCandidates = ['input[type="search"]']

  let searchSel: string | null = null
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

  if (!searchSel) {
    await page.screenshot({ path: 'search-no-input.png', fullPage: true })
    throw new Error('No search input found on marketplace')
  }

  const query = 'albert einstein'
  await page.fill(searchSel, query)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
    page.locator(searchSel).first().press('Enter')
  ])

  await page.waitForTimeout(1500)

  const resultSelectors = ['.result', '.results .item', '.search-results .result', '.product', '.publication', '.mp-result', 'article', 'li']

  const foundTitles = new Set<string>()
  for (const sel of resultSelectors) {
    const items = page.locator(sel)
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      try {
        const el = items.nth(i)
        const text = (await el.innerText()).trim()
        if (text && /albert|einstein/i.test(text)) {
          const title = text.split('\n')[0].trim()
          foundTitles.add(title)
        } else {
          const anchor = el.locator('a')
          if ((await anchor.count()) > 0) {
            const aText = (await anchor.first().innerText()).trim()
            if (aText && /albert|einstein/i.test(aText)) foundTitles.add(aText.split('\n')[0].trim())
          }
        }
      } catch (e) {}
    }
    if (foundTitles.size >= 3) break
  }

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

  await page.screenshot({ path: 'search-results.png', fullPage: true })

  const resultsCount = foundTitles.size
  console.log('Found publication titles matching query:', Array.from(foundTitles).slice(0,10))
  expect(resultsCount).toBeGreaterThanOrEqual(3)

  await context.close()
})
