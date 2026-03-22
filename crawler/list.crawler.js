export async function crawlSceneList(page, context) {
  const {
    performerId, // "1398"
    performerSlug, // "lisa-ann"
    baseListUrl, // full URL with ?page=
    pageNum,
  } = context

  const url = `${baseListUrl}?page=${pageNum}&sort=released&unlimited=0`
  console.log(`▶ List page: ${url}`)

  await page.goto(url, { waitUntil: 'networkidle' })

  const scenes = []

  const cards = await page.locator('.animated-scene').all()

  for (const card of cards) {
    const sceneId = await card.getAttribute('data-scene-id')
    const movieId = await card.getAttribute('data-movie-id')

    const detailUrl = await card.locator('a.animated-screen').getAttribute('href')

    const title = await card.locator('.animated-scene__title a').textContent()

    const lengthRaw = await card.locator('.sticker__scene-length').textContent()

    const thumbnailUrl = await card.locator('img.animate.screenshot').getAttribute('src')

    const movieLink = card.locator('.animated-scene__parent-detail a')
    const movieUrl = await movieLink.getAttribute('href')

    const movieTitle = await card.locator('.animated-scene__parent-detail__title').textContent()

    const studio = await card.locator('.animated-scene__parent-detail__studio').textContent()

    const boxcoverThumb = await card.locator('img.animated-scene__parent-detail__boxcover').getAttribute('src')

    scenes.push({
      sourceSite: 'siteB',
      sceneId,
      movieId,
      performerId,
      performerSlug,
      title: title?.trim(),
      detailUrl,
      movieUrl,
      movieTitle: movieTitle?.replace('Details', '').trim(),
      studio: studio?.replace('from', '').trim(),
      videoLengthRaw: lengthRaw?.trim(),
      thumbnailUrl,
      boxcoverThumb,
    })
  }

  // Pagination stop condition
  const isLastPage = (await page.locator('.pagination li.disabled').textContent())?.includes('Next')

  return {
    scenes,
    hasNextPage: !isLastPage,
  }
}
