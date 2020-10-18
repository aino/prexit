const fetch = require('node-fetch')
const fs = require('fs-extra')
const path = require('path')
const { Observable } = require('rxjs')

const {
  MOCK_OBSERVER,
  TAXONOMIES_DIR_ORIGINALS,
  WP_API_URL,
} = require('../util')

const urlForPage = (url, taxonomy, page) => `${url}/${taxonomy}?page=${page}`

const taxonomies = async (
  url,
  observer = MOCK_OBSERVER,
  devMode = false,
  taxonomyType
) => {
  await fs.ensureDir(TAXONOMIES_DIR_ORIGINALS)

  const taxonomiesByPage = async (taxonomy, page = 1) => {
    observer.next(`Getting ${taxonomy} by page (${page})`)
    const response = await fetch(urlForPage(url, taxonomy, page))

    const { status, headers } = response

    // Save data and move on to the next page,
    // or finish if we’ve reached the end.
    if (status === 200) {
      let totalPages = headers.get('x-wp-totalpages')
      if (devMode) {
        // We don’t want to download everything in dev,
        // one page is enough.
        totalPages = 1
      } else if (totalPages) {
        totalPages = parseInt(totalPages)
      } else {
        throw new Error('API error: Couldn’t get total page amount.')
      }

      const json = await response.json()
      const dest = path.join(
        TAXONOMIES_DIR_ORIGINALS,
        `${taxonomy}-${page}.json`
      )
      await fs.writeJson(dest, json, { spaces: 2 })

      if (page === totalPages) {
        return observer.complete()
      } else {
        return taxonomiesByPage(taxonomy, page + 1)
      }
    }

    throw new Error(response)
  }

  // Kick of recursive requests
  taxonomiesByPage(taxonomyType)
}

module.exports = ({ devMode, taxonomy } = {}) =>
  new Observable((observer) =>
    taxonomies(WP_API_URL, observer, devMode, taxonomy)
  )
