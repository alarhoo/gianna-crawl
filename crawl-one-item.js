import 'dotenv/config'
import axios from 'axios'
import { load } from 'cheerio'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const jar = new CookieJar()
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://mysite.co/',
    },
  })
)

// CONFIG
const BASE_URL = process.env.BASE_URL
const GRID_PAGE_URL = `${BASE_URL}/shop-streaming-video-by-scene.html?page=11&cast=304897`

async function crawlOneItem() {
  try {
    /* ------------------------------------
     * STEP 0: Set age confirmation cookies
     * ---------------------------------- */
    await jar.setCookie('ageConfirmed=true; Path=/', BASE_URL)
    await jar.setCookie('confirmed=true; Path=/', BASE_URL)
    await jar.setCookie('age_verified=1; Path=/', BASE_URL)
    await jar.setCookie('use_lang=en; Path=/', BASE_URL)

    console.log('Cookies:', jar.getCookiesSync(BASE_URL))

    /* ------------------------------------
     * STEP 1: Load grid page (IMPORTANT)
     * ---------------------------------- */
    const gridRes = await client.get(GRID_PAGE_URL)
    const $grid = load(gridRes.data)

    const detailPath = $grid('.grid-item a.scene-title').first().attr('href')
    if (!detailPath) throw new Error('Detail page link not found')

    const detailUrl = `${BASE_URL}${detailPath}`
    console.log('Detail URL:', detailUrl)

    /* ------------------------------------
     * STEP 2: Load detail page
     * ---------------------------------- */
    const detailRes = await client.get(detailUrl)
    const $ = load(detailRes.data)

    /* ------------------------------------
     * STEP 3: Extract fields
     * ---------------------------------- */
    const title = clean($('.video-title h1.description').text())
    const subtitle = clean($('.video-title p').text())

    const rawDate = $('.release-date').first().text().replace('Released:', '').trim()

    const releaseDate = formatDate(rawDate)
    const studio = clean($('.studio a').text())
    const series = clean($('.series a').text())
    const director = clean($('.director a').text())

    const tags = $('.tags a')
      .map((_, el) => $(el).text().trim())
      .get()
    const actors = $('.video-performer .performer-name')
      .map((_, el) => $(el).text().trim())
      .get()

    const fileName = `${releaseDate} - ${studio} - ${series} (${title}) [${actors.join(', ')}]`

    console.log('\n✅ Extracted Object:\n', {
      title,
      subtitle,
      releaseDate,
      studio,
      series,
      director,
      tags,
      actors,
      fileName,
      sourceUrl: detailUrl,
    })
  } catch (err) {
    console.error('❌ Crawl failed:', err.message)
  }
}

function formatDate(input) {
  const d = new Date(input)
  if (isNaN(d)) return null
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function clean(text = '') {
  return text.replace(/\s+/g, ' ').trim()
}

crawlOneItem()
