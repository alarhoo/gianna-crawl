import 'dotenv/config'
import { chromium } from 'playwright'

/* ==============================
   CONFIG
================================ */

const BASE_URL = 'https://www.aduempire.com'
const PERFORMER_ID = '1398'
const PERFORMER_SLUG = 'lisa-ann'

const LIST_URL = `${BASE_URL}/clips/${PERFORMER_ID}/${PERFORMER_SLUG}-pornstars.html?page=12&sort=released&unlimited=0`

const COOKIE_DOMAIN = new URL(BASE_URL).hostname

/* ==============================
   METADATA EXTRACTOR (ROBUST)
================================ */
async function extractClipMeta(page) {
  return await page.evaluate(() => {
    const root = document.querySelector('section.clip-meta.m-b-2')
    if (!root) return null

    const clean = (t) => t.replace(/,\s*$/, '').trim()

    const result = {
      starring: [],
      attributes: [],
      details: {},
      performers: {},
      acts: {},
      setting: {},
    }

    /* --- Starring & Attributes --- */
    root.querySelectorAll('.clip-meta__heading .m-b-1').forEach((block) => {
      const label = block.querySelector('strong')?.textContent?.replace(':', '')?.trim()

      const values = [...block.querySelectorAll('a')].map((a) => clean(a.textContent)).filter(Boolean)

      if (label === 'Starring') result.starring = values
      if (label === 'Attributes') result.attributes = values
    })

    /* --- Length / Released / Year --- */
    root.querySelectorAll('#ClipDetails > ul li').forEach((li) => {
      const strong = li.querySelector('strong')
      if (!strong) return

      const key = strong.textContent.replace(':', '').trim()
      const value = li.textContent.replace(strong.textContent, '').trim()

      result.details[key] = value
    })

    /* --- Performers (Female 1, Male 1, etc.) --- */
    root.querySelectorAll('#ClipDetails .col-sm-6 > .m-b-1').forEach((section) => {
      const header = section.querySelector('strong')
      const dl = section.querySelector('dl')
      if (!header || !dl) return

      const performer = header.textContent.trim()
      result.performers[performer] = {}

      dl.querySelectorAll('dt').forEach((dt) => {
        const key = dt.textContent.replace(':', '').trim()
        const dd = dt.nextElementSibling

        const values = [...dd.querySelectorAll('a')].map((a) => clean(a.textContent)).filter(Boolean)

        result.performers[performer][key] = values
      })
    })

    /* --- Acts & Setting --- */
    root.querySelectorAll('#ClipDetails .col-sm-6 > .m-b-1').forEach((section) => {
      const title = section.querySelector('strong')?.textContent?.trim()
      const dl = section.querySelector('dl')
      if (!dl || !title) return

      const target = title === 'Acts' ? result.acts : title === 'Setting' ? result.setting : null

      if (!target) return

      dl.querySelectorAll('dt').forEach((dt) => {
        const key = dt.textContent.replace(':', '').trim()
        const dd = dt.nextElementSibling

        const values = [...dd.querySelectorAll('a')].map((a) => clean(a.textContent)).filter(Boolean)

        target[key] = values
      })
    })

    return result
  })
}

/* ==============================
   MAIN RUNNER
================================ */
async function run() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  })

  const context = await browser.newContext()

  /* --- Age Gate Cookies --- */
  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'confirmed', value: 'true', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'age_verified', value: '1', domain: COOKIE_DOMAIN, path: '/' },
    { name: 'use_lang', value: 'en', domain: COOKIE_DOMAIN, path: '/' },
  ])

  const page = await context.newPage()

  /* ================= LIST PAGE ================= */
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  const card = page.locator('.animated-scene').first()
  await card.waitFor()

  const sceneId = await card.getAttribute('data-scene-id')
  const movieId = await card.getAttribute('data-movie-id')

  const detailUrl = BASE_URL + (await card.locator('a.animated-screen').getAttribute('href'))

  const title = (await card.locator('a.text-display-primary').textContent())?.trim()

  const lengthRaw = (await card.locator('.sticker__scene-length').textContent())?.trim()

  const thumbnailUrl = await card.locator('img.animate.screenshot').getAttribute('src')

  const movieAnchor = card.locator('.animated-scene__detail > a').first()
  const movieUrl = BASE_URL + (await movieAnchor.getAttribute('href'))

  const movieTitle = (await card.locator('.animated-scene__parent-detail__title').textContent())
    ?.replace('Details', '')
    .trim()

  const studio = (await card.locator('.animated-scene__parent-detail__studio').textContent())
    ?.replace('from', '')
    .trim()

  const boxcoverThumb = await card.locator('img.animated-scene__parent-detail__boxcover').getAttribute('src')

  /* ================= SCENE PAGE ================= */
  await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  const sceneTitle = (await page.textContent('.clip-page__detail__title__primary').catch(() => null))?.trim()

  const subtitle = (await page.textContent('.clip-page__detail__title__secondary').catch(() => null))?.trim()

  const trailerIframeUrl = (await page.locator('#previewContainer iframe').count())
    ? await page.locator('#previewContainer iframe').getAttribute('src')
    : null

  const meta = await extractClipMeta(page)

  /* ================= MOVIE PAGE ================= */
  await page.goto(movieUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  const frontCover = (await page.locator('a#front-cover').count())
    ? await page.locator('a#front-cover').getAttribute('href')
    : null

  const backCover = (await page.locator('a#back-cover').count())
    ? await page.locator('a#back-cover').getAttribute('href')
    : null

  /* ================= FINAL OBJECT ================= */
  const canonicalScene = {
    sourceSite: 'siteB',

    performer: {
      id: PERFORMER_ID,
      slug: PERFORMER_SLUG,
    },

    scene: {
      id: sceneId,
      title: sceneTitle || title,
      subtitle,
      lengthRaw,
      detailUrl,
      details: meta?.details ?? {},
      starring: meta?.starring ?? [],
    },

    movie: {
      id: movieId,
      title: movieTitle,
      studio,
      movieUrl,
      boxcover: {
        front: frontCover,
        back: backCover,
      },
    },

    media: {
      thumbnails: {
        scene: thumbnailUrl,
        boxcoverThumb,
      },
      trailer: {
        iframeUrl: trailerIframeUrl,
      },
    },

    performers: meta?.performers ?? {},
    acts: meta?.acts ?? {},
    settings: meta?.setting ?? {},
    attributes: meta?.attributes ?? [],
  }

  console.log('\n✅ FINAL CANONICAL OBJECT\n')
  console.dir(canonicalScene, { depth: null })

  await browser.close()
}

/* ==============================
   ENTRY
================================ */
run().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
