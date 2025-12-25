export const clean = (s = '') => s.replace(/\s+/g, ' ').trim()

export async function safeText(page, selector) {
  const el = page.locator(selector)
  return (await el.count()) > 0 ? clean(await el.first().innerText()) : null
}

export async function safeAllTexts(page, selector) {
  const els = page.locator(selector)
  return (await els.count()) > 0 ? (await els.allInnerTexts()).map(clean) : []
}
