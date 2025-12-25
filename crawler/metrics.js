export function createMetrics(totalItems) {
  return {
    totalItems,
    skipped: 0,
    attempted: 0,
    succeeded: 0,
    failed: 0,
    startTime: Date.now(),
    endTime: null,
  }
}

export function finishMetrics(metrics) {
  metrics.endTime = Date.now()
}

export function printMetrics(metrics) {
  const durationMs = metrics.endTime - metrics.startTime
  const durationSec = durationMs / 1000
  const durationMin = durationSec / 60

  const successRate = metrics.attempted ? ((metrics.succeeded / metrics.attempted) * 100).toFixed(1) : '0.0'

  const throughput = durationMin > 0 ? (metrics.succeeded / durationMin).toFixed(1) : '0.0'

  console.log('\n📊 CRAWL METRICS')
  console.log('────────────────────────────────')
  console.log('Total items discovered :', metrics.totalItems)
  console.log('Already crawled (skip):', metrics.skipped)
  console.log('Attempted this run    :', metrics.attempted)
  console.log('Successful crawls     :', metrics.succeeded)
  console.log('Failures              :', metrics.failed)
  console.log(`Success rate          : ${successRate}%`)
  console.log('')
  console.log(`Total duration        : ${durationSec.toFixed(1)}s`)
  console.log(`Avg time per item     : ${(durationSec / Math.max(metrics.attempted, 1)).toFixed(2)}s`)
  console.log(`Throughput            : ${throughput} items/min`)
  console.log('────────────────────────────────\n')
}
