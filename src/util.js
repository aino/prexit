require('dotenv').config()

const path = require('path')
const glob = require('glob')

// when task is ran as singular node process and not as Listr task
const MOCK_OBSERVER = { complete: console.success, next: console.log }

// dirs references in various places
const DATA_DIR = path.join(process.cwd(), 'data')

const ASSET_DIR_LIST = path.join(DATA_DIR, 'list-of-assets')
const TAXONOMIES_DIR_ORIGINALS = path.join(DATA_DIR, 'taxonomies-original')
const TAXONOMIES_DIR_TRANSFORMED = path.join(DATA_DIR, 'taxonomies-transformed')
const POST_DIR_CREATED = path.join(DATA_DIR, 'posts-created')
const POST_DIR_ORIGINALS = path.join(DATA_DIR, 'posts-original-by-page')
const POST_DIR_TRANSFORMED = path.join(DATA_DIR, 'posts-transformed')
const REDIRECTS_DIR = path.join(DATA_DIR, 'redirects')
const USER_DIR_ORIGINALS = path.join(DATA_DIR, 'users-original')
const USER_DIR_TRANSFORMED = path.join(DATA_DIR, 'users-transformed')

const {
  CONTENTFUL_CMA_TOKEN,
  CONTENTFUL_ENV_NAME,
  CONTENTFUL_FALLBACK_USER_ID,
  CONTENTFUL_LOCALE,
  CONTENTFUL_SPACE_ID,
  REDIRECT_BASE_URL,
  WP_API_CREDENTIALS,
  WP_API_URL,
} = process.env

// Awaitable globz
const findByGlob = (pattern = '', opts = {}) =>
  new Promise((resolve, reject) => {
    glob(pattern, opts, (err, files) => (err ? reject(err) : resolve(files)))
  })

const MIME_TYPES = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
}

const urlToMimeType = (url) => {
  const type = url.split('.').slice(-1).join('')
  return MIME_TYPES[type] ? MIME_TYPES[type] : MIME_TYPES['jpg']
}

const trimUrlToFilename = (url) => url.split('/').slice(-1).join('')

// exportz
module.exports = {
  ASSET_DIR_LIST,
  TAXONOMIES_DIR_ORIGINALS,
  TAXONOMIES_DIR_TRANSFORMED,
  CONTENTFUL_CMA_TOKEN,
  CONTENTFUL_ENV_NAME,
  CONTENTFUL_FALLBACK_USER_ID,
  CONTENTFUL_LOCALE,
  CONTENTFUL_SPACE_ID,
  DATA_DIR,
  MOCK_OBSERVER,
  POST_DIR_CREATED,
  POST_DIR_ORIGINALS,
  POST_DIR_TRANSFORMED,
  REDIRECTS_DIR,
  REDIRECT_BASE_URL,
  USER_DIR_ORIGINALS,
  USER_DIR_TRANSFORMED,
  WP_API_CREDENTIALS,
  WP_API_URL,
  findByGlob,
  trimUrlToFilename,
  urlToMimeType,
}
