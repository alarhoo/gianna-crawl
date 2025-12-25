import { db } from '../db/index.js'
import { crawlDetail } from './worker.js'

export async function run(context, items) {
  console.log(`\n▶ Starting detail crawl for ${items.length} items\n`)

  const page = await context.newPage()

  let successCount = 0
  let skipCount = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    console.log('\n====================================')
    console.log(`▶ Item ${i + 1} / ${items.length}`)
    console.log('URL:', item.detailUrl)
    console.log('====================================')

    let data = null

    try {
      data = await crawlDetail(page, item)
    } catch (err) {
      console.error('❌ Detail crawl failed:', err.message)
      continue
    }

    if (!data || !data.title) {
      console.warn('⚠ Skipping DB insert (missing critical data)')
      skipCount++
      continue
    }

    console.log('▶ Inserting into DB...')
    console.log('  title:', data.title)

    await db.run(
      `INSERT OR IGNORE INTO videos
       (title, subtitle, releaseDate, studio, series, director, actors, tags, thumbnailSrcSet, previewIframeUrl, hoverPreviewM3U8, fileName, detailUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.previewIframeUrl,
        data.hoverPreviewM3U8,
        data.fileName,
        data.detailUrl,
      ]
    )

    successCount++
    console.log('✔ DB insert done')
  }

  await page.close()

  console.log('\n====================================')
  console.log('🎉 DETAIL CRAWL SUMMARY')
  console.log('  Total items:', items.length)
  console.log('  Inserted   :', successCount)
  console.log('  Skipped    :', skipCount)
  console.log('====================================\n')
}
