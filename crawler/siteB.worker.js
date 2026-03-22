import { crawlSceneList } from '../siteB/list.crawler.js'
import { crawlSceneDetail } from '../siteB/sceneDetail.crawler.js'
import { crawlMoviePage } from '../siteB/movie.crawler.js'

import {
  upsertSceneStub,
  upsertCanonicalScene,
  isSceneDetailDone,
  isMovieDone,
  markMovieDone,
} from '../db/siteB.repo.js'

export async function runSiteBWorker(browser, performer) {
  const context = await browser.newContext()
  const page = await context.newPage()

  let pageNum = 1
  let hasNext = true

  while (hasNext) {
    const { scenes, hasNextPage } = await crawlSceneList(page, {
      performerId: performer.performerId,
      performerSlug: performer.performerSlug,
      baseListUrl: performer.sourceUrl,
      pageNum,
    })

    for (const scene of scenes) {
      await upsertSceneStub(scene)

      const detailDone = await isSceneDetailDone(scene.sceneId)
      if (detailDone) continue

      // ── Scene detail
      const canonical = await crawlSceneDetail(page, scene)

      // ── Movie enrichment (once per movie)
      if (scene.movieUrl && !(await isMovieDone(scene.movieId))) {
        const movieData = await crawlMoviePage(page, scene.movieUrl)
        canonical.movie = { ...canonical.movie, ...movieData.movie }
        await markMovieDone(scene.movieId)
      }

      await upsertCanonicalScene(scene.sceneId, canonical)
    }

    hasNext = hasNextPage
    pageNum++
  }

  await page.close()
  await context.close()
}
