import { db, isAlreadyCrawled } from '../db/index.js'
import { crawlDetail } from './worker.js'

const CONCURRENCY = 4

export async function run(context, items) {
  console.log(`\n▶ Starting parallel crawl for ${items.length} items`)
  const queue = [...items]

  async function worker(workerId) {
    const page = await context.newPage()

    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break

      // 🔁 RESUME-FROM-DB CHECK
      const alreadyDone = await isAlreadyCrawled(item.detailUrl)
      if (alreadyDone) {
        console.log(`[Worker ${workerId}] ⏭ Skipping (already crawled)`)
        continue
      }

      console.log(`\n[Worker ${workerId}] Crawling:`)
      console.log(`  ${item.detailUrl}`)

      let data
      try {
        data = await crawlDetail(page, item)
      } catch (err) {
        console.error(`[Worker ${workerId}] ❌ Error:`, err.message)
        continue
      }

      if (!data || !data.title) {
        console.warn(`[Worker ${workerId}] ⚠ Skipped (no title)`)
        continue
      }

      await db.run(
        `INSERT OR IGNORE INTO videos
         (title, subtitle, releaseDate, studio, series, director,
          actors, tags, thumbnailSrcSet,
          hoverPreviewM3U8, previewIframeUrl,
          fileName, detailUrl, sourceTabTitle)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.subtitle,
          data.releaseDate,
          data.studio,
          data.series,
          data.director,
          data.actors.join(', '),
          data.tags.join(', '),
          JSON.stringify(data.thumbnailSrcSet),
          data.hoverPreviewM3U8,
          data.previewIframeUrl,
          data.fileName,
          data.detailUrl,
          data.sourceTabTitle,
        ]
      )

      console.log(`[Worker ${workerId}] ✔ Saved`)
    }

    await page.close()
  }

  const workers = []
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i + 1))
  }

  await Promise.all(workers)

  console.log('\n🎉 Parallel crawl complete')
}
