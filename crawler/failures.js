export const failures = []

export function recordFailure({ detailUrl, stage, error }) {
  failures.push({
    detailUrl,
    stage, // e.g. "detail-crawl", "preview", "db-insert"
    error: error.message,
    timestamp: new Date().toISOString(),
  })
}
