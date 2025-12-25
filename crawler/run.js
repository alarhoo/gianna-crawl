import { db, isAlreadyCrawled } from '../db/index.js'
import { crawlDetail } from './worker.js'
import { rateLimit } from '../utils/rateLimiter.js'
import { retryWithBackoff } from '../utils/retry.js'

const CONCURRENCY = Number(process.env.MAX_CONCURRENCY || 3)
const RATE_DELAY_MS = Number(process.env.RATE_DELAY_MS || 1500)

export async function run(context, items) {
  console.log(`\n▶ Starting crawl with ${CONCURRENCY} workers`)
  const queue = [...items]

  async function worker(workerId) {
    const page = await context.newPage()

    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) break // 🛡 safety guard

      console.log(`\n[Worker ${workerId}] ▶ DETAIL CRAWL`)
      console.log(`[Worker ${workerId}] URL:`, item.detailUrl)

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
        data = await retryWithBackoff(() => crawlDetail(page, item), {
          retries: 3,
          baseDelayMs: 1000,
          factor: 2,
          onRetry: (err, attempt, delay) => {
            console.warn(`[Worker ${workerId}] ⚠ Retry ${attempt}/3 after ${delay}ms`, `→ ${err.message}`)
          },
        })
      } catch (err) {
        console.error(`[Worker ${workerId}] ❌ Failed after retries:`, err.message)
        continue
      }

      if (!data || !data.title) {
        console.warn(`[Worker ${workerId}] ⚠ Skipping (invalid data)`)
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

      // ⏱ Rate limit between requests
      await rateLimit(RATE_DELAY_MS)
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
