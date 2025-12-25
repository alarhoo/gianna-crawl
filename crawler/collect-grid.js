export async function collectGridItems(context, baseUrl, gridUrl) {
  const page = await context.newPage()
  await page.goto(gridUrl, { waitUntil: 'networkidle' })

  await page.waitForSelector('.list-page-grid-container')

  const items = page.locator('.list-page-grid-container .grid-item')
  const count = await items.count()

  const results = []

  for (let i = 0; i < count; i++) {
    const item = items.nth(i)
    const widget = item.locator('.scene-widget.store-view')

    const detailHref = await item.locator('a.scene-title').getAttribute('href')
    if (!detailHref) continue

    results.push({
      detailUrl: baseUrl + detailHref,
      dataMasterId: await widget.getAttribute('data-master-id'),
      dataSceneId: await widget.getAttribute('data-scene-id'),
      thumbnailSrcSet: await item.locator('img.screenshot.img-full-fluid').getAttribute('srcset'),
    })
  }

  await page.close()
  return results
}
