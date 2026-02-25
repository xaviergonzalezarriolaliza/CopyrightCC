import fs from 'fs'
import path from 'path'
import type { CDPSession, Page } from '@playwright/test'

export async function startJSCoverage(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page)
  await client.send('Profiler.enable')
  await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
  return client
}

export async function stopJSCoverage(client: CDPSession, outFile?: string) {
  try {
    const res = await client.send('Profiler.takePreciseCoverage')
    await client.send('Profiler.stopPreciseCoverage')
    await client.send('Profiler.disable')
    const data = res && res.result ? res.result : res
    const dir = path.dirname(outFile || 'coverage/playwright')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const file = outFile || `coverage/playwright-${Date.now()}.json`
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return file
  } finally {
    try {
      // detach if available
      // @ts-ignore
      if (client.detach) await client.detach()
    } catch (e) {}
  }
}
