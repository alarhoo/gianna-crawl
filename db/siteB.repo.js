import { db } from './index.js'

export async function upsertSceneStub(scene) {
  await db.run(
    `
    INSERT OR IGNORE INTO scenes
    (
      sourceSite, sceneId, movieId,
      performerId, performerSlug,
      title, movieTitle, studio,
      videoLengthRaw,
      detailUrl, movieUrl,
      thumbnailUrl, boxcoverThumbUrl
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      scene.sourceSite,
      scene.sceneId,
      scene.movieId,
      scene.performerId,
      scene.performerSlug,
      scene.title,
      scene.movieTitle,
      scene.studio,
      scene.videoLengthRaw,
      scene.detailUrl,
      scene.movieUrl,
      scene.thumbnailUrl,
      scene.boxcoverThumb,
    ]
  )
}
