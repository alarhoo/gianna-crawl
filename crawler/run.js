import { chromium } from 'playwright'
import { db } from '../db/index.js'
import { crawlDetail } from './worker.js'

const CONCURRENCY = 3 // SAFE limit

export async function run(items) {
  const browser = await chromium.launch()
  const context = await browser.newContext()

  const queue = [...items]
  const workers = Array(CONCURRENCY)
    .fill(null)
    .map(async () => {
      const page = await context.newPage()

      while (queue.length) {
        const item = queue.shift()
        const data = await crawlDetail(page, item)

        if (!data || !data.title) {
          console.warn('⚠ Skipping DB insert (missing critical data)')
          continue
        }

        await db.run(
          `INSERT OR IGNORE INTO videos
         (title, subtitle, studio, series, director, actors, tags,
          thumbnailSrcSet, previewIframeUrl, hoverPreviewM3U8,
          fileName, detailUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.title,
            data.subtitle,
            data.studio,
            data.series,
            data.director,
            data.actors.join(','),
            data.tags.join(','),
            JSON.stringify(data.thumbnailSrcSet),
            data.previewIframeUrl,
            data.hoverPreviewM3U8,
            data.fileName,
            data.detailUrl,
          ]
        )
      }

      await page.close()
    })

  await Promise.all(workers)
  await browser.close()
}
