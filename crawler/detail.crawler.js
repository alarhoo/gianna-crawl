export async function crawlSceneDetail(page, sceneRow) {
  console.log(`▶ Scene detail: ${sceneRow.detailUrl}`)

  await page.goto(sceneRow.detailUrl, { waitUntil: 'networkidle' })

  const title = await page.textContent('.clip-page__detail__title__primary')
  const subtitle = await page.textContent('.clip-page__detail__title__secondary')

  // Performers
  const performers = []
  const performerLinks = await page.locator('.clip-page__detail__performers a').all()

  for (const p of performerLinks) {
    performers.push({
      name: (await p.textContent())?.trim(),
      profileUrl: await p.getAttribute('href'),
    })
  }

  // Categories / Tags
  const categories = await page.locator('#ClipDetails a').allTextContents()

  // Trailer iframe
  let trailerIframeUrl = null
  if (await page.locator('#preview-player iframe').count()) {
    trailerIframeUrl = await page.locator('#preview-player iframe').getAttribute('src')
  }

  return {
    sourceSite: 'siteB',

    performer: {
      id: sceneRow.performerId,
      slug: sceneRow.performerSlug,
    },

    scene: {
      id: sceneRow.sceneId,
      title: title?.trim(),
      subtitle: subtitle?.trim(),
      length: {
        raw: sceneRow.videoLengthRaw,
      },
      detailUrl: sceneRow.detailUrl,
    },

    movie: {
      id: sceneRow.movieId,
      title: sceneRow.movieTitle,
      studio: sceneRow.studio,
      movieUrl: sceneRow.movieUrl,
    },

    media: {
      thumbnails: {
        scene: sceneRow.thumbnailUrl,
        boxcoverThumb: sceneRow.boxcoverThumb,
      },
      trailer: {
        iframeUrl: trailerIframeUrl,
      },
    },

    performers,
    categories,
  }
}
