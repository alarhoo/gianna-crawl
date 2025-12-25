export const clean = (s = '') => s.replace(/\s+/g, ' ').trim()

export async function safeText(page, selector) {
  const el = page.locator(selector)
  return (await el.count()) > 0 ? clean(await el.first().innerText()) : null
}

export async function safeAllTexts(page, selector) {
  const els = page.locator(selector)
  return (await els.count()) > 0 ? (await els.allInnerTexts()).map(clean) : []
}

export async function extractReleaseDate(page, selector) {
  const els = page.locator(selector)
  const count = await els.count()

  for (let i = 0; i < count; i++) {
    const text = (await els.nth(i).innerText()).trim()
    if (text.startsWith('Released:')) {
      const raw = text.replace('Released:', '').trim()
      const d = new Date(raw)
      if (!isNaN(d)) {
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      }
    }
  }
  return null
}
