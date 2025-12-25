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

function parseSrcSet(srcset) {
  if (!srcset) return null
  const result = {}
  srcset.split(',').forEach((entry) => {
    const [url, size] = entry.trim().split(/\s+/)
    const width = size?.replace('w', '')
    if (url && width) result[width] = url
  })
  return result
}

/* ------------------------------------
 * MAIN
 * ---------------------------------- */
async function crawlAllItems() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()

  /* --------------------------------
   * Age gate cookies
   * -------------------------------- */
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'confirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'age_verified', value: '1', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'use_lang', value: 'en', domain: COOKIE_DOMAIN, path: '/' },
  ])

  const page = await context.newPage()

  /* --------------------------------
   * Load grid page
   * -------------------------------- */
  await page.goto(GRID_URL, { waitUntil: 'networkidle' })

  await page.waitForSelector('.list-page-grid-container', {
    state: 'attached',
    timeout: 30000,
  })

  const items = page.locator('.list-page-grid-container .grid-item')
  const count = await items.count()

  console.log(`Found ${count} grid items`)

  const results = []

  /* --------------------------------
   * LOOP ITEMS
   * -------------------------------- */
  for (let i = 0; i < count; i++) {
    console.log(`\nProcessing item ${i + 1}/${count}`)

    const item = items.nth(i)

    const widget = item.locator('.scene-widget.store-view')
    const dataMasterId = await widget.getAttribute('data-master-id')
    const dataSceneId = await widget.getAttribute('data-scene-id')

    const rawSrcSet = await item.locator('img.screenshot.img-full-fluid').getAttribute('srcset')

    const thumbnailSrcSet = parseSrcSet(rawSrcSet)

    const detailHref = await item.locator('a.scene-title').getAttribute('href')

    if (!detailHref) continue

    const detailUrl = `${BASE_URL}${detailHref}`

    const hoverPreviewM3U8 = `https://myvideo.com/hls/previewscene/${dataMasterId}/${dataSceneId}/index-f1-v1.m3u8`

    /* ------------------------------
     * Detail page
     * ------------------------------ */
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

    /* ------------------------------
     * Preview click → iframe
     * ------------------------------ */
    await page.locator('#loadPlayer').click()
    await page.waitForSelector('#player iframe', { timeout: 15000 })

    const previewIframeUrl = await page.locator('#player iframe').getAttribute('src')

    const fileName = `${releaseDate} - ${studio} - ${series} (${title}) [${actors.join(', ')}]`

    results.push({
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
      detailUrl: detailUrl,
    })

    /* ------------------------------
     * Back to grid page
     * ------------------------------ */
    await page.goto(GRID_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('.list-page-grid-container', {
      state: 'attached',
      timeout: 30000,
    })
  }

  console.log('\n✅ FINAL RESULTS\n')
  console.dir(results, { depth: null })

  await browser.close()
}

crawlAllItems().catch((err) => {
  console.error('❌ Crawl failed:', err.message)
  process.exit(1)
})
