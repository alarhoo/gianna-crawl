export async function crawlMoviePage(page, movieUrl) {
  console.log(`▶ Movie page: ${movieUrl}`)

  await page.goto(movieUrl, { waitUntil: 'networkidle' })

  const movieTitle = await page.textContent('h1')

  const yearMatch = movieTitle?.match(/\((\d{4})\)/)

  // Box covers
  const frontCover = await page.locator('.boxcover-container img').first().getAttribute('src')

  const backCover = await page.locator('.boxcover-container img').nth(1).getAttribute('src')

  // Rating
  const ratingText = await page.textContent('.rating-average')

  // Directors
  const directors = await page.locator('a[href*="directors"]').allTextContents()

  // Categories
  const categories = await page.locator('.categories a').allTextContents()

  return {
    movie: {
      title: movieTitle?.replace(/\(\d{4}\)/, '').trim(),
      productionYear: yearMatch ? Number(yearMatch[1]) : null,
      boxcover: {
        front: frontCover,
        back: backCover,
      },
      rating: ratingText ? Number(ratingText) : null,
      directors: directors.map((d) => d.trim()),
      categories: categories.map((c) => c.trim()),
    },
  }
}
