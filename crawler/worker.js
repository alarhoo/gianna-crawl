import { safeText, safeAllTexts, extractReleaseDate } from '../utils/text.js'
import { buildFileName, sanitizeFilename } from '../utils/filename.js'
import { rateLimit } from '../utils/rateLimiter.js'

export async function crawlDetail(page, item) {
  console.log('\n==============================')
  console.log('▶ DETAIL CRAWL')
  console.log('URL:', item.detailUrl)
  console.log('==============================')

  if (!item.detailUrl) {
    console.error('❌ Missing detailUrl, skipping item')
    return null
  }

  // await page.goto(item.detailUrl, { waitUntil: 'networkidle' })
  await rateLimit(process.env.RATE_DELAY_MS)

  await page.goto(item.detailUrl, { waitUntil: 'networkidle' })
  console.log('✔ Page loaded')

  const sourceTabTitle = (await page.title())?.trim()
  console.log('  sourceTabTitle:', sourceTabTitle)

  const title = await safeText(page, '.video-title h1.description')
  console.log('  title:', title)

  const subtitle = await safeText(page, '.video-title p')
  console.log('  subtitle:', subtitle)

  const releaseDate = await extractReleaseDate(page, '.release-date')
  console.log('  releaseDate:', releaseDate)

  const studio = await safeText(page, '.studio a')
  console.log('  studio:', studio)

  const series = await safeText(page, '.series a')
  console.log('  series:', series)

  const director = await safeText(page, '.director a')
  console.log('  director:', director)

  const actors = await safeAllTexts(page, '.video-performer .performer-name')
  console.log('  actors:', actors)

  const tags = await safeAllTexts(page, '.tags a')
  console.log('  tags:', tags)

  const hoverPreviewM3U8 =
    item.dataMasterId && item.dataSceneId
      ? `${process.env.BASE_URL}/hls/previewscene/${item.dataMasterId}/${item.dataSceneId}/index-f1-v1.m3u8`
      : null
  console.log('  hoverPreviewM3U8:', hoverPreviewM3U8)

  /* --------------------------------
   * PREVIEW (SAFE + LOGGED)
   * -------------------------------- */
  let previewIframeUrl = null

  if ((await page.locator('#player iframe').count()) > 0) {
    previewIframeUrl = await page.locator('#player iframe').getAttribute('src')
    console.log('✔ iframe already present')
  } else {
    const loadBtn = page.locator('#loadPlayer')
    if ((await loadBtn.count()) > 0) {
      console.log('▶ Clicking preview button')
      await loadBtn
        .first()
        .click({ timeout: 5000 })
        .catch(() => {
          console.warn('⚠ Preview click failed')
        })

      try {
        await page.waitForSelector('#player iframe', { timeout: 8000 })
        previewIframeUrl = await page.locator('#player iframe').getAttribute('src')
        console.log('✔ iframe loaded after click')
      } catch {
        console.warn('⚠ No iframe after click')
      }
    } else {
      console.warn('⚠ No preview button on page')
    }
  }

  const rawFileName = buildFileName({
    releaseDate,
    studio,
    series,
    title,
    actors,
  })
  const fileName = sanitizeFilename(rawFileName)

  console.log('✔ filename:', fileName)

  // 🔒 FINAL VALIDATION
  if (!title) {
    console.warn('⚠ Missing title → skipping DB insert')
    return null
  }

  return {
    title,
    subtitle,
    releaseDate,
    studio,
    series,
    director,
    actors,
    tags,
    dataMasterId: item.dataMasterId,
    dataSceneId: item.dataSceneId,
    thumbnailSrcSet: item.thumbnailSrcSet,
    hoverPreviewM3U8,
    previewIframeUrl,
    fileName,
    sourceTabTitle,
    detailUrl: item.detailUrl,
  }
}
