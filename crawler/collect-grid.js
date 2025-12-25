export async function collectGridItems(context, baseUrl, gridBaseUrl) {
  let pageNum = 1
  const allItems = []

  while (true) {
    const page = await context.newPage()
    const url = buildPagedUrl(gridBaseUrl, pageNum)

    console.log(`\n🔹 Loading grid page ${pageNum}: ${url}`)
    await page.goto(url, { waitUntil: 'networkidle' })

    const items = page.locator('.list-page-grid-container .grid-item')
    const count = await items.count()

    console.log(`   Grid items found: ${count}`)

    if (count === 0) {
      await page.close()
      console.log('🛑 No more items, stopping pagination')
      break
    }

    for (let i = 0; i < count; i++) {
      const item = items.nth(i)
      const widget = item.locator('.scene-widget.store-view')
      const href = await item.locator('a.scene-title').getAttribute('href')
      if (!href) continue

      const img = item.locator('img.screenshot.img-full-fluid')

      let rawSrcSet = (await img.getAttribute('srcset')) || (await img.getAttribute('data-srcset'))

      if (!rawSrcSet) {
        console.warn('⚠ srcset missing for:', detailHref)
      }

      allItems.push({
        detailUrl: baseUrl + href,
        dataMasterId: await widget.getAttribute('data-master-id'),
        dataSceneId: await widget.getAttribute('data-scene-id'),
        thumbnailSrcSet: rawSrcSet,
      })
    }

    await page.close()
    pageNum++
  }

  console.log(`\n✅ Total grid items collected: ${allItems.length}`)
  return allItems
}

function buildPagedUrl(baseUrl, pageNum) {
  const url = new URL(baseUrl)
  url.searchParams.set('page', pageNum)
  return url.toString()
}
