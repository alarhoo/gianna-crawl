import { db } from '../db/index.js'

const OLD_BASE = 'https://elegantangel.empirestores.co'
const NEW_BASE = 'https://video.aduempire.com'

async function fix() {
  const res = await db.run(
    `
    UPDATE videos
    SET hoverPreviewM3U8 = REPLACE(
      hoverPreviewM3U8,
      ?,
      ?
    )
    WHERE hoverPreviewM3U8 LIKE ?
    `,
    [OLD_BASE, NEW_BASE, `${OLD_BASE}%`],
  )

  console.log('Rows updated:', res.changes)
}

fix()
