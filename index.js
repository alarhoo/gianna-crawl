import 'dotenv/config'
import fs from 'fs'
import { chromium } from 'playwright'
import { collectGridItems } from './crawler/collect-grid.js'
import { run } from './crawler/run.js'

const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing')

const GRID_URL = new URL(process.env.GRID_URL, BASE_URL).toString()

const FAILED_ONLY = process.argv.includes('--failed-only')

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  // 🔐 Age-gate cookies (once per context)
  const domain = new URL(BASE_URL).hostname
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain, path: '/' },
    { name: 'confirmed', value: 'true', domain, path: '/' },
    { name: 'age_verified', value: '1', domain, path: '/' },
    { name: 'use_lang', value: 'en', domain, path: '/' },
  ])

  let items

  if (FAILED_ONLY) {
    console.log('🔁 Running in FAILED-ONLY mode')

    if (!fs.existsSync('failed-items.json')) {
      console.log('✅ No failed-items.json found, nothing to retry')
      await browser.close()
      return
    }

    const failed = JSON.parse(fs.readFileSync('failed-items.json', 'utf-8'))

    items = failed.map((f) => ({
      detailUrl: f.detailUrl,
    }))
  } else {
    console.log('🔹 Collecting grid items...')
    items = await collectGridItems(context, BASE_URL, GRID_URL)
  }

  console.log(`✅ Items to process: ${items.length}`)

  await run(context, items)

  await browser.close()
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
