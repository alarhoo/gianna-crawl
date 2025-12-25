export async function retryWithBackoff(fn, options = {}) {
  const { retries = 3, baseDelayMs = 1000, factor = 2, onRetry = () => {} } = options

  let attempt = 0
  let lastError

  while (attempt <= retries) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      attempt++

      if (attempt > retries) break

      const delay = baseDelayMs * Math.pow(factor, attempt - 1)
      onRetry(err, attempt, delay)

      await new Promise((res) => setTimeout(res, delay))
    }
  }

  throw lastError
}
