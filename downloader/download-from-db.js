import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { db } from '../db/index.js'

const BASE_URL = process.env.BASE_URL
const COOKIE_FILE = '../downloads/cookies.txt'
const OUT_DIR = '../downloads/previews-low'

fs.mkdirSync(OUT_DIR, { recursive: true })

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('yt-dlp', args, { stdio: 'inherit' })

    p.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`yt-dlp exited with code ${code}`))
    })
  })
}

async function main() {
  const rows = await db.all(`
    SELECT fileName, hoverPreviewM3U8
    FROM videos
    WHERE hoverPreviewM3U8 IS NOT NULL
  `)

  console.log(`▶ ${rows.length} items found`)

  for (const row of rows) {
    if (!row.hoverPreviewM3U8) {
      console.warn('⚠ Missing URL for:', row.fileName)
      continue
    }

    const outPath = path.join(OUT_DIR, `${row.fileName}.mp4`)

    if (fs.existsSync(outPath)) {
      console.log('⏭ Skipping (already exists):', row.fileName)
      continue
    }

    console.log('⬇ Downloading:', row.fileName)
    console.log('   URL:', row.hoverPreviewM3U8)

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
      row.hoverPreviewM3U8,
    ]

    try {
      await runYtDlp(args)
      console.log('✔ Done:', row.fileName)
    } catch (err) {
      console.error('❌ Failed:', row.fileName)
      console.error(err.message)
    }
  }

  console.log('🎉 Download process complete')
}

main()
