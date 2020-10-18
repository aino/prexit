const fetch = require('node-fetch')
const fs = require('fs-extra')
const path = require('path')
const { Observable } = require('rxjs')

const {
  MOCK_OBSERVER,
  POST_DIR_ORIGINALS,
  WP_API_CREDENTIALS,
  WP_API_URL,
} = require('../util')

const urlForPage = (url, page) => {
  let localUrl = `${url}/posts?page=${page}`
  if (WP_API_CREDENTIALS) {
    localUrl = `${localUrl}&context=edit`
  }
  return localUrl
}

const posts = async (url, observer = MOCK_OBSERVER, devMode = false) => {
  await fs.ensureDir(POST_DIR_ORIGINALS)

  const postsByPage = async (page = 1) => {
    observer.next(`Getting posts by page (${page})`)
    const response = await fetch(
      urlForPage(url, page),
      WP_API_CREDENTIALS
        ? {
            headers: {
              Authorization: `Basic ${Buffer.from(WP_API_CREDENTIALS).toString(
                'base64'
              )}`,
            },
          }
        : {}
    )

    const { status, headers } = response
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

    // Save data and move on to the next page,
    // or finish if we’ve reached the end.
    if (status === 200) {
      const json = await response.json()
      const dest = path.join(POST_DIR_ORIGINALS, `posts-${page}.json`)
      await fs.writeJson(dest, json)

      if (page === totalPages) {
        return observer.complete()
      } else {
        return postsByPage(page + 1)
      }
    }

    throw new Error(response)
  }
  // kick of recursive requests
  postsByPage()
}

module.exports = ({ devMode }) =>
  new Observable((observer) => posts(WP_API_URL, observer, devMode))
