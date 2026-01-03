import { db, isAlreadyCrawled } from '../db/index.js'
import { crawlDetail } from './worker.js'
import { rateLimit } from '../utils/rateLimiter.js'
import { retryWithBackoff } from '../utils/retry.js'
import { recordFailure, failures, saveFailuresToFile } from './failures.js'
import { createMetrics, finishMetrics, printMetrics } from './metrics.js'

const CONCURRENCY = Number(process.env.MAX_CONCURRENCY || 3)
const RATE_DELAY_MS = Number(process.env.RATE_DELAY_MS || 1500)

export async function run(context, items) {
  console.log(`\n▶ Starting crawl with ${CONCURRENCY} workers`)
  const queue = [...items]

  const metrics = createMetrics(items.length)

  async function worker(workerId) {
    const page = await context.newPage()

    while (true) {
      const item = queue.shift()
      if (!item) break

      console.log(`\n[Worker ${workerId}] ▶ DETAIL CRAWL`)
      console.log(`[Worker ${workerId}] URL: ${item.detailUrl}`)

      // 🔁 Resume-from-DB
      if (item.detailUrl) {
        const done = await isAlreadyCrawled(item.detailUrl)
        if (done) {
          console.log(`[Worker ${workerId}] ⏭ Skipping (already crawled)`)
          metrics.skipped++
          continue
        }
      }

      metrics.attempted++

      // ⏱ Rate limit BEFORE navigation
      await rateLimit(RATE_DELAY_MS)

      let data
      try {
        data = await retryWithBackoff(() => crawlDetail(page, item), {
          retries: 3,
          baseDelayMs: 1000,
          factor: 2,
          onRetry: (err, attempt, delay) => {
            console.warn(`[Worker ${workerId}] ⚠ Retry ${attempt}/3 after ${delay}ms → ${err.message}`)
          },
        })
      } catch (err) {
        console.error(`[Worker ${workerId}] ❌ Failed after retries:`, err.message)

        metrics.failed++
        recordFailure({
          detailUrl: item.detailUrl,
          stage: 'detail-crawl',
          error: err,
        })
        continue
      }

      if (!data || !data.title) {
        console.warn(`[Worker ${workerId}] ⚠ Skipping (invalid data)`)
        metrics.failed++
        continue
      }

      await db.run(
        `INSERT OR IGNORE INTO videos
         (title, subtitle, releaseDate, studio, series, director,
          actors, tags, videoLengthMinutes, videoLengthRaw, thumbnailSrcSet,
          hoverPreviewM3U8, previewIframeUrl,
          fileName, detailUrl, sourceTabTitle)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.subtitle,
          data.releaseDate,
          data.studio,
          data.series,
          data.director,
          data.actors.join(', '),
          data.tags.join(', '),
          data.videoLength?.minutes ?? null,
          data.videoLength?.raw ?? null,
          JSON.stringify(data.thumbnailSrcSet),
          data.hoverPreviewM3U8,
          data.previewIframeUrl,
          data.fileName,
          data.detailUrl,
          data.sourceTabTitle,
        ]
      )

      metrics.succeeded++
      console.log(`[Worker ${workerId}] ✔ Saved`)
    }

    await page.close()
  }

  const workers = []
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(i + 1))
  }

  await Promise.all(workers)

  finishMetrics(metrics)
  printMetrics(metrics)

  if (failures.length > 0) {
    console.log('\n❌ FAILURE REPORT')
    console.table(failures)
    saveFailuresToFile(failures)
  } else {
    console.log('\n✅ No failures recorded')
  }

  console.log('\n🎉 Crawl complete')
}
