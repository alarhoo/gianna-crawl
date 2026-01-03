export function normalizeSrcSet(srcSet) {
  if (!srcSet) return null

  // Already normalized object
  if (typeof srcSet === 'object') {
    return srcSet
  }

  if (typeof srcSet === 'string') {
    const map = {}

    srcSet
      .split(',')
      .map((s) => s.trim())
      .forEach((entry) => {
        const parts = entry.split(/\s+/)
        if (parts.length < 2) return

        let url = parts[0]
        const size = parts[1]

        // 🧼 sanitize URL
        url = url.trim().replace(/^['"]+|['"]+$/g, '')

        if (!url.startsWith('http')) return

        const width = size.replace('w', '')
        if (!Number(width)) return

        map[width] = url
      })

    return Object.keys(map).length ? map : null
  }

  return null
}
