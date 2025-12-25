export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function rateLimit(baseDelayMs) {
  // 🔒 Force number + sane defaults
  const base = Number(baseDelayMs)

  if (!Number.isFinite(base) || base <= 0) {
    throw new Error(`Invalid RATE_DELAY_MS: ${baseDelayMs}`)
  }

  // 🎲 Jitter: 0–500ms
  const jitter = Math.floor(Math.random() * 500)

  // 🧯 Safety cap: max 5 seconds
  const delay = Math.min(base + jitter, 5000)

  console.log(`⏳ Rate limit sleep: ${delay}ms`)
  await sleep(delay)
}
