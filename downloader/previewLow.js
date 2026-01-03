import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const BASE_URL = process.env.BASE_URL
const COOKIE_FILE = 'cookies.txt'

export async function downloadLowPreview(item) {
  if (!item.hoverPreviewM3U8) {
    console.warn('⚠ No hoverPreviewM3U8 for:', item.fileName)
    return
  }

  const outDir = 'downloads/previews-low'
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `${item.fileName}_low.mp4`)

  if (fs.existsSync(outPath)) {
    console.log('⏭ Low preview exists:', item.fileName)
    return
  }

  console.log('🎞️ Downloading LOW preview:', item.fileName)

  const args = [
    '--cookies',
    COOKIE_FILE,
    '--hls-use-mpegts',
    '--concurrent-fragments',
    '15',
    '--retries',
    'infinite',
    '--fragment-retries',
    'infinite',
    '--user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    '--referer',
    `${BASE_URL}/`,
    '--add-header',
    `Origin:${BASE_URL}`,
    '-o',
    outPath,
    item.hoverPreviewM3U8,
  ]

  await new Promise((resolve, reject) => {
    const p = spawn('yt-dlp', args, { stdio: 'inherit' })

    p.on('close', (code) => {
      if (code === 0) {
        console.log('✔ Low preview saved:', item.fileName)
        resolve()
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`))
      }
    })
  })
}
