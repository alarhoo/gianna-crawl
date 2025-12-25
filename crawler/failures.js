import fs from 'fs'
import path from 'path'

const FAILURE_FILE = path.resolve('failed-items.json')

export function saveFailuresToFile(failures) {
  if (failures.length === 0) return

  fs.writeFileSync(FAILURE_FILE, JSON.stringify(failures, null, 2), 'utf-8')

  console.log(`📄 Saved failures to ${FAILURE_FILE}`)
}

export const failures = []

export function recordFailure({ detailUrl, stage, error }) {
  failures.push({
    detailUrl,
    stage, // e.g. "detail-crawl", "preview", "db-insert"
    error: error.message,
    timestamp: new Date().toISOString(),
  })
}
