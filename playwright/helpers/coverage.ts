import fs from 'fs'
import path from 'path'
import type { CDPSession, Page } from '@playwright/test'

// startJSCoverage returns a CDP session when running under Chromium, otherwise null.
export async function startJSCoverage(page: Page): Promise<CDPSession | null> {
  // newCDPSession is only available for Chromium contexts
  // detect availability and gracefully skip for Firefox/WebKit
  // @ts-ignore
  const hasCDP = typeof page.context().newCDPSession === 'function'
  if (!hasCDP) return null

  const client = await (page.context() as any).newCDPSession(page)
  await client.send('Profiler.enable')
  await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true })
  return client
}

export async function stopJSCoverage(client: CDPSession | null, outFile?: string) {
  if (!client) return null
  try {
    const res = await client.send('Profiler.takePreciseCoverage')
    await client.send('Profiler.stopPreciseCoverage')
    await client.send('Profiler.disable')
    const data = res && (res as any).result ? (res as any).result : res
    const dir = path.dirname(outFile || 'coverage/playwright')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const file = outFile || `coverage/playwright-${Date.now()}.json`
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return file
  } finally {
    try {
      // detach if available
      // @ts-ignore
      if ((client as any).detach) await (client as any).detach()
    } catch (e) {}
  }
}
