export function buildFileName({ releaseDate, studio, series, title, actors }) {
  const safe = (s) => s?.replace(/[\\/:*?"<>|]/g, '').trim()

  return [releaseDate, safe(studio), safe(series), `(${safe(title)})`, `[${actors.join(', ')}]`]
    .filter(Boolean)
    .join(' - ')
}
