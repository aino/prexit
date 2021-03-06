const TurndownService = require('turndown')
const fs = require('fs-extra')
const html2plaintext = require('html2plaintext')
const path = require('path')
const { Observable } = require('rxjs')

const shortcode = require('./shortcode-parser')
const {
  MOCK_OBSERVER,
  POST_DIR_ORIGINALS,
  POST_DIR_TRANSFORMED,
  REDIRECTS_DIR,
  REDIRECT_BASE_URL,
  findByGlob,
} = require('../util')

const TURNDOWN_OPTS = {
  bulletListMarker: '*',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx',
  hr: '---',
  linkReferenceStyle: 'full',
  linkStyle: 'inlined',
  strongDelimiter: '__',
}
const turndownService = new TurndownService(TURNDOWN_OPTS)

const extractImages = (post) => {
  const regex = /<img.*?src="(.*?)"[\s\S]*?alt="(.*?)"/g
  post.bodyImages = []
  while ((foundImage = regex.exec(post.body))) {
    const alt = foundImage[2] ? foundImage[2].replace(/_/g, ' ') : ''
    post.bodyImages.push({
      description: alt,
      link: foundImage[1],
      postId: post.id,
      title: alt,
    })
  }
  return post
}

const extractGalleries = (post) => {
  post.galleries = []
  const parsedBody = shortcode.parse(post.body, post.galleries, {
    gallery: (str, params, data) => {
      if (params) {
        data.push(params)
      }
      // Replace shortcode with placeholder for later reconstruction
      // of post layout.
      return '<!-- gallery -->' // This doesn’t really work, investigate
    },
  })
  post.body = parsedBody
  return post
}

const extractIframes = (post) => {
  post.iframes = []
  const parsedBody = shortcode.parse(post.body, post.iframes, {
    iframe: (str, params, data) => {
      if (params) {
        data.push(params)
      }
      return '<!-- iframe -->' // This doesn’t really work, investigate
    },
  })
  post.body = parsedBody
  return post
}

function convertToMarkdown(post) {
  return {
    ...post,
    body: turndownService.turndown(post.body),
  }
}

const transform = (post) => {
  delete post._links
  delete post.guid
  // rename and strip formatting from excerpt, then remove
  post.description = html2plaintext(
    post.excerpt.raw || post.excerpt.rendered || ''
  )
  delete post.excerpt
  // delete post.author;
  delete post.comment_status
  delete post.ping_status
  delete post.template
  delete post.format
  delete post.meta
  delete post.status
  delete post.type
  post.publishDate = post.date_gmt + '+00:00'
  delete post.date_gmt
  delete post.date
  delete post.modified
  delete post.modified_gmt
  delete post.tags
  delete post.sticky
  post.body = post.content.raw || post.content.rendered
  delete post.content
  post.title = html2plaintext(post.title.raw || post.title.rendered) // decode entities
  post.slug = post.slug
  post.category = post.categories[0]
  delete post.categories
  return [
    post.slug,
    convertToMarkdown(extractImages(extractGalleries(extractIframes(post)))),
  ]
}

const writePost = (name, data) =>
  fs.writeJson(path.join(POST_DIR_TRANSFORMED, `${name}.json`), data, {
    spaces: 2,
  })

const postLinkToRedirectSource = (link, base = REDIRECT_BASE_URL) =>
  link.replace(base, '')
const postSlugToRedirectDestination = (slug) => `/blog/${slug}`
const formatAsRedirect = ({ link, slug }) =>
  `${postLinkToRedirectSource(link)}     ${postSlugToRedirectDestination(slug)}`

const writeRedirects = (rdrx) => {
  const txt = rdrx.map(formatAsRedirect).join('\n')
  return fs.writeFile(path.join(REDIRECTS_DIR, `posts`), txt)
}

const transformByPage = async (observer = MOCK_OBSERVER) => {
  // get paginated raw posts from directory created in previous step
  await fs.ensureDir(POST_DIR_TRANSFORMED)
  await fs.ensureDir(REDIRECTS_DIR)
  const files = await findByGlob('*.json', { cwd: POST_DIR_ORIGINALS })
  observer.next(`Found ${files.length} pages of posts`)

  const queue = [...files].sort() // create a queue to process
  const redirects = [] // create list of from/to redirects
  let count = 0 // progress indicator
  while (queue.length) {
    const file = queue.shift()
    const page = await fs.readJson(path.join(POST_DIR_ORIGINALS, file))
    while (page.length) {
      // grab post off the page stack
      const post = page.shift()
      // increment progress and show update
      count += 1
      observer.next(`Processing post ${count}`)
      // transform the wordpress post into the expected format
      const [name, data] = transform(post)
      // save relevant information for redirects
      const { link, slug } = data
      redirects.push({ link, slug })
      // save processed post by slug for later
      await writePost(name, data)
    }
  }

  await writeRedirects(redirects)

  observer.complete(`Successfully tranfsormed ${count} posts`)
}

module.exports = () => new Observable((observer) => transformByPage(observer))
