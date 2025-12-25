import 'dotenv/config'
import axios from 'axios'
import { load } from 'cheerio'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

/* ------------------------------------
 * CONFIG
 * ---------------------------------- */
const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing in .env')

const GRID_PAGE_URL = `${BASE_URL}/shop-streaming-video-by-scene.html?page=11&cast=304897`

/* ------------------------------------
 * HTTP client with cookies
 * ---------------------------------- */
const jar = new CookieJar()
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: BASE_URL,
    },
  })
)

/* ------------------------------------
 * Utilities
 * ---------------------------------- */
const clean = (str = '') => str.replace(/\s+/g, ' ').trim()

const formatDate = (input) => {
  const d = new Date(input)
  if (isNaN(d)) return null
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/* ------------------------------------
 * Main
 * ---------------------------------- */
async function crawlOneItem() {
  try {
    /* --------------------------------
     * STEP 0: Age gate cookies
     * -------------------------------- */
    await jar.setCookie('ageConfirmed=true; Path=/', BASE_URL)
    await jar.setCookie('confirmed=true; Path=/', BASE_URL)
    await jar.setCookie('age_verified=1; Path=/', BASE_URL)
    await jar.setCookie('use_lang=en; Path=/', BASE_URL)

    /* --------------------------------
     * STEP 1: Grid page
     * -------------------------------- */
    const gridRes = await client.get(GRID_PAGE_URL)
    const $grid = load(gridRes.data)

    const firstItem = $grid('.list-page-grid-container .grid-item').first()
    if (!firstItem.length) throw new Error('No grid items found')

    const widget = firstItem.find('.scene-widget.store-view')

    const dataMasterId = widget.attr('data-master-id')
    const dataSceneId = widget.attr('data-scene-id')

    if (!dataMasterId || !dataSceneId) throw new Error('Missing master-id or scene-id')

    // Detail page URL
    const detailPath = firstItem.find('a.scene-title').attr('href')
    const detailUrl = `${BASE_URL}${detailPath}`

    console.log(firstItem.html())
    // Thumbnail srcset (ALL resolutions)
    const thumbnailSrcSet = firstItem.find('img.screenshot.img-full-fluid').attr('data-srcset') || null

    // Predictable hover preview m3u8
    const hoverPreviewM3U8 = `https://myvideo.com/hls/previewscene/${dataMasterId}/${dataSceneId}/index-f1-v1.m3u8`

    /* --------------------------------
     * STEP 2: Detail page
     * -------------------------------- */
    const detailRes = await client.get(detailUrl)
    const $ = load(detailRes.data)

    const sourceTabTitle = clean($('title').text())

    // Title (fixed selector)
    const title = clean($('.video-title h1.description').text())

    // Subtitle (whitespace normalized)
    const subtitle = clean($('.video-title p').text())

    // Release date
    const rawDate = clean($('.release-date').first().text().replace('Released:', ''))
    const releaseDate = formatDate(rawDate)

    const studio = clean($('.studio a').text())
    const series = clean($('.series a').text())
    const director = clean($('.director a').text())

    const tags = $('.tags a')
      .map((_, el) => clean($(el).text()))
      .get()

    const actors = $('.video-performer .performer-name')
      .map((_, el) => clean($(el).text()))
      .get()

    /* --------------------------------
     * STEP 4: Preview iframe URL
     * -------------------------------- */
    $('#loadPlayer').click()

    let previewIframeUrl = $('#player iframe').attr('src') || null

    // Fallback: inline JS (what onclick injects)
    if (!previewIframeUrl) {
      $('script').each((_, el) => {
        const js = $(el).html()
        const match = js?.match(/https?:\/\/[^"]+iframe[^"]+/)
        if (match) {
          previewIframeUrl = match[0]
          return false
        }
      })
    }

    /* --------------------------------
     * STEP 5: Filename
     * -------------------------------- */
    const fileName = `${releaseDate} - ${studio} - ${series} (${title}) [${actors.join(', ')}]`

    /* --------------------------------
     * FINAL OBJECT
     * -------------------------------- */
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
  } catch (err) {
    console.error('❌ Crawl failed:', err.message)
  }
}

crawlOneItem()
