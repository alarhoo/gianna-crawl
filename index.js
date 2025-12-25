import 'dotenv/config'
import { chromium } from 'playwright'
import { collectGridItems } from './crawler/collect-grid.js'
import { run } from './crawler/run.js'

const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing')

const GRID_URL = `${BASE_URL}/shop-streaming-video-by-scene.html?cast=304897&cast=56719`

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
  })

  const context = await browser.newContext()

  // 🔑 SET COOKIES ONCE
  const domain = new URL(BASE_URL).hostname
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain, path: '/' },
    { name: 'confirmed', value: 'true', domain, path: '/' },
    { name: 'age_verified', value: '1', domain, path: '/' },
    { name: 'use_lang', value: 'en', domain, path: '/' },
  ])

  console.log('🔹 Collecting grid items...')
  const items = await collectGridItems(context, BASE_URL, GRID_URL)

  console.log(`✅ Collected ${items.length} items`)
  console.log('🔹 Crawling detail page (debug)...')

  await run(context, items)

  await browser.close()
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
