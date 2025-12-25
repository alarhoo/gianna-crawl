import 'dotenv/config'
import { chromium } from 'playwright'
import { collectGridItems } from './crawler/collect-grid.js'
import { run } from './crawler/run.js'

const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing')

const GRID_URL = new URL(process.env.GRID_URL, BASE_URL).toString()

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  const domain = new URL(BASE_URL).hostname
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain, path: '/' },
    { name: 'confirmed', value: 'true', domain, path: '/' },
    { name: 'age_verified', value: '1', domain, path: '/' },
    { name: 'use_lang', value: 'en', domain, path: '/' },
  ])

  const items = await collectGridItems(context, BASE_URL, GRID_URL)
  await run(context, items)

  await browser.close()
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
