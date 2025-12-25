export function buildFileName({ releaseDate, studio, series, title, actors }) {
  const safe = (s) => s?.replace(/[\\/:*?"<>|]/g, '').trim()

  return [releaseDate, safe(studio), safe(series), `(${safe(title)})`, `[${actors.join(', ')}]`]
    .filter(Boolean)
    .join(' - ')
}

export function sanitizeFilename(input) {
  if (!input) return ''

  return input
    .replace(/[\\\/:*?"<>|]/g, '') // remove illegal chars
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\.+$/, '') // no trailing dots
    .trim()
}
