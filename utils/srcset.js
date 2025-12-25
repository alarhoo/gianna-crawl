export function parseSrcSet(srcset) {
  if (!srcset) return null
  const result = {}
  srcset.split(',').forEach((entry) => {
    const [url, size] = entry.trim().split(/\s+/)
    if (url && size?.endsWith('w')) {
      result[size.replace('w', '')] = url
    }
  })
  return result
}
