import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { db } from '../db/index.js'

const BASE_URL = process.env.BASE_URL
const COOKIE_FILE = 'cookies.txt'

export async function downloadHighPreview(browser, item) {
  if (!item.previewIframeUrl) {
    console.warn('⚠ No previewIframeUrl for:', item.fileName)
    return
  }

  const outDir = 'downloads/previews-high'
  fs.mkdirSync(outDir, { recursive: true })

  const outPath = path.join(outDir, `${item.fileName}_high.mp4`)
  if (fs.existsSync(outPath)) {
    console.log('⏭ High preview exists:', item.fileName)
    return
  }

  console.log('🎬 Resolving HIGH preview m3u8:', item.fileName)

  const context = await browser.newContext()
  const page = await context.newPage()

  let m3u8Url = null

  page.on('request', (req) => {
    if (req.url().includes('.m3u8')) {
      m3u8Url = req.url()
    }
  })

  try {
    await page.goto(item.previewIframeUrl, {
      waitUntil: 'networkidle',
      timeout: 60000,
    })

    await page.waitForTimeout(3000)

    if (!m3u8Url) {
      throw new Error('HQ m3u8 not detected')
    }

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
      m3u8Url,
    ]

    await new Promise((resolve, reject) => {
      const p = spawn('yt-dlp', args, { stdio: 'inherit' })
      p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}`))))
    })

    await db.run(`UPDATE videos SET hqPreviewStatus = 'success', hqPreviewLastError = NULL WHERE id = ?`, [item.id])

    console.log('✔ High preview saved:', item.fileName)
  } catch (err) {
    console.warn('❌ HQ preview failed:', item.fileName, err.message)

    await db.run(`UPDATE videos SET hqPreviewStatus = 'failed', hqPreviewLastError = ? WHERE id = ?`, [
      err.message,
      item.id,
    ])
  } finally {
    await page.close()
    await context.close()
  }
}
