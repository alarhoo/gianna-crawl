import 'dotenv/config'
import { chromium } from 'playwright'

/* ------------------------------------
 * CONFIG
 * ---------------------------------- */
const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing in .env')

const GRID_URL = `${BASE_URL}/shop-streaming-video-by-scene.html?page=11&cast=304897`

const COOKIE_DOMAIN = new URL(BASE_URL).hostname

/* ------------------------------------
 * HELPERS
 * ---------------------------------- */
const clean = (s = '') => s.replace(/\s+/g, ' ').trim()

const formatDate = (input) => {
  const d = new Date(input)
  if (isNaN(d)) return null
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/* ------------------------------------
 * MAIN
 * ---------------------------------- */
async function crawlOneItem() {
  const browser = await chromium.launch({
    headless: true, // set false + slowMo to debug
  })

  const context = await browser.newContext()

  /* --------------------------------
   * STEP 0: Age gate cookies
   * -------------------------------- */
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'confirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'age_verified', value: '1', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'use_lang', value: 'en', domain: COOKIE_DOMAIN, path: '/' },
  ])

  const page = await context.newPage()

  /* --------------------------------
   * STEP 1: Load grid page
   * -------------------------------- */
  await page.goto(GRID_URL, { waitUntil: 'networkidle' })

  console.log('Grid page title:', await page.title())

  /* --------------------------------
   * WAIT FOR GRID CONTAINER (KEY FIX)
   * -------------------------------- */
  const gridContainerSelector = '.list-page-grid-container'

  try {
    await page.waitForSelector(gridContainerSelector, {
      state: 'attached',
      timeout: 30000,
    })
  } catch {
    const html = await page.content()
    require('fs').writeFileSync('debug-grid.html', html)
    throw new Error('Grid container not found. HTML dumped to debug-grid.html')
  }

  const firstItem = page.locator('.list-page-grid-container .grid-item').first()

  /* --------------------------------
   * GRID DATA
   * -------------------------------- */
  const widget = firstItem.locator('.scene-widget.store-view')

  const dataMasterId = await widget.getAttribute('data-master-id')
  const dataSceneId = await widget.getAttribute('data-scene-id')

  const thumbnailSrcSet = await firstItem.locator('img.screenshot.img-full-fluid').getAttribute('srcset')

  const detailHref = await firstItem.locator('a.scene-title').getAttribute('href')

  if (!detailHref) throw new Error('Detail page link missing')

  const detailUrl = `${BASE_URL}${detailHref}`

  const hoverPreviewM3U8 = `https://myvideo.com/hls/previewscene/${dataMasterId}/${dataSceneId}/index-f1-v1.m3u8`

  /* --------------------------------
   * STEP 2: Detail page
   * -------------------------------- */
  await page.goto(detailUrl, { waitUntil: 'networkidle' })

  const sourceTabTitle = clean(await page.title())

  const title = clean(await page.locator('.video-title h1.description').innerText())

  const subtitle = clean(await page.locator('.video-title p').innerText())

  const rawDate = clean(await page.locator('.release-date').first().innerText()).replace('Released:', '')

  const releaseDate = formatDate(rawDate)

  const studio = clean(await page.locator('.studio a').innerText())
  const series = clean(await page.locator('.series a').innerText())
  const director = clean(await page.locator('.director a').innerText())

  const tags = (await page.locator('.tags a').allInnerTexts()).map(clean)
  const actors = (await page.locator('.video-performer .performer-name').allInnerTexts()).map(clean)

  /* --------------------------------
   * CLICK PREVIEW → iframe
   * -------------------------------- */
  await page.locator('#loadPlayer').click()

  await page.waitForSelector('#player iframe', { timeout: 15000 })

  const previewIframeUrl = await page.locator('#player iframe').getAttribute('src')

  /* --------------------------------
   * FINAL OBJECT
   * -------------------------------- */
  const fileName = `${releaseDate} - ${studio} - ${series} (${title}) [${actors.join(', ')}]`

  console.dir(
    {
      sourceTabTitle,
      title,
      subtitle,
      releaseDate,
      studio,
      series,
      director,
      tags,
      actors,
      dataMasterId,
      dataSceneId,
      thumbnailSrcSet,
      hoverPreviewM3U8,
      previewIframeUrl,
      fileName,
      sourceUrl: detailUrl,
    },
    { depth: null }
  )

  await browser.close()
}

crawlOneItem().catch((err) => {
  console.error('❌ Crawl failed:', err.message)
  process.exit(1)
})
