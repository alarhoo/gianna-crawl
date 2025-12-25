import 'dotenv/config'
import { collectGridItems } from './crawler/collect-grid.js'
import { run } from './crawler/run.js'

const BASE_URL = process.env.BASE_URL
if (!BASE_URL) throw new Error('BASE_URL missing')

const GRID_URL = `${BASE_URL}/shop-streaming-video-by-scene.html?cast=304897&cast=2042`

async function main() {
  console.log('🔹 Collecting grid items...')
  const items = await collectGridItems(BASE_URL, GRID_URL)

  console.log(`✅ Collected ${items.length} items`)
  console.log('🔹 Crawling details + persisting to DB...')

  await run(items)

  console.log('🎉 Crawl complete')
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
