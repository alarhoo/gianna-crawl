import { chromium } from 'playwright'
import { parseSrcSet } from '../utils/srcset.js'

export async function collectGridItems(baseUrl, gridUrl) {
  const browser = await chromium.launch()
  const context = await browser.newContext()

  await context.addCookies([
    { name: 'ageConfirmed', value: 'true', domain: new URL(baseUrl).hostname, path: '/' },
    { name: 'confirmed', value: 'true', domain: new URL(baseUrl).hostname, path: '/' },
    { name: 'age_verified', value: '1', domain: new URL(baseUrl).hostname, path: '/' },
  ])

  const page = await context.newPage()
  await page.goto(gridUrl, { waitUntil: 'networkidle' })

  await page.waitForSelector('.list-page-grid-container')

  const items = page.locator('.list-page-grid-container .grid-item')
  console.log(items)
  const count = await items.count()

  const results = []

  for (let i = 0; i < count; i++) {
    const item = items.nth(i)
    const widget = item.locator('.scene-widget.store-view')

    const detailHref = await item.locator('a.scene-title').getAttribute('href')
    if (!detailHref) continue

    results.push({
      detailUrl: baseUrl + detailHref, // 🔥 RENAMED
      dataMasterId: await widget.getAttribute('data-master-id'),
      dataSceneId: await widget.getAttribute('data-scene-id'),
      thumbnailSrcSet: parseSrcSet(await item.locator('img.screenshot.img-full-fluid').getAttribute('srcset')),
    })
  }

  await browser.close()
  return results
}
