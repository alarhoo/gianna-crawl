import 'dotenv/config'
import { chromium } from 'playwright'
import { db } from './db/index.js'

import { downloadThumbnail } from './downloader/thumbnail.js'
import { downloadLowPreview } from './downloader/previewLow.js'
import { downloadHighPreview } from './downloader/previewHigh.js'

async function main() {
  const RETRY_HQ_ONLY = process.argv.includes('--retry-hq')

  const items = RETRY_HQ_ONLY
    ? await db.all(`SELECT * FROM videos WHERE hqPreviewStatus = 'failed'`)
    : await db.all(`SELECT * FROM videos`)

  const browser = await chromium.launch({ headless: true })

  for (const item of items) {
    try {
      // await downloadThumbnail(item)
      // await downloadLowPreview(item)
      await downloadHighPreview(browser, item)
    } catch (err) {
      console.warn('❌ Download failed:', item.fileName, err.message)
    }
  }

  await browser.close()
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
