import { safeText, safeAllTexts } from '../utils/text.js'
import { buildFileName } from '../utils/filename.js'

export async function crawlDetail(page, item) {
  console.log('\n-----------------------------')
  console.log('▶ Crawling:', item.detailUrl)

  if (!item.detailUrl) {
    console.error('❌ Missing detailUrl:', item)
    return null
  }

  await page.goto(item.detailUrl, { waitUntil: 'networkidle' })
  console.log('✔ Page loaded')

  const title = await safeText(page, '.video-title h1.description')
  console.log('  title:', title)

  const subtitle = await safeText(page, '.video-title p')
  console.log('  subtitle:', subtitle)

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

  /* --------------------------------
   * PREVIEW LOGIC (SAFE + LOGGED)
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

  const fileName = buildFileName({
    releaseDate: null,
    studio,
    series,
    title,
    actors,
  })

  console.log('✔ Filename:', fileName)

  return {
    detailUrl: item.detailUrl,
    title,
    subtitle,
    studio,
    series,
    director,
    actors,
    tags,
    dataMasterId: item.dataMasterId,
    dataSceneId: item.dataSceneId,
    thumbnailSrcSet: item.thumbnailSrcSet,
    previewIframeUrl,
    fileName,
  }
}
