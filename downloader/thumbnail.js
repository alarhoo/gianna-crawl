import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { normalizeSrcSet } from '../utils/thumbnail.js'

export async function downloadThumbnail(item) {
  const srcSet = normalizeSrcSet(item.thumbnailSrcSet)
  if (!srcSet) {
    console.warn('⚠ No valid thumbnail srcset for:', item.fileName)
    return
  }

  const entries = Object.entries(srcSet)
  if (!entries.length) return
  console.log(entries)

  // Pick highest resolution
  const [, url] = entries.sort((a, b) => Number(b[0]) - Number(a[0]))[0]

  console.log(url)
  const outDir = 'downloads/thumbnails'
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `${item.fileName}.jpg`)
  if (fs.existsSync(outPath)) return

  const res = await axios.get(url, { responseType: 'stream' })
  const stream = fs.createWriteStream(outPath)

  res.data.pipe(stream)

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log('🖼️ Thumbnail saved:', outPath)
}
