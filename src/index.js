const Listr = require('listr')

const cleanData = require('./setup/clean-data')
const createAssetList = require('./wordpress/create-asset-list')
const createBlogPosts = require('./contentful/create-blog-posts')
const createClient = require('./contentful/create-client')
const downloadPosts = require('./wordpress/post-download')
const downloadUsers = require('./wordpress/user-download')
const matchAuthorTypes = require('./contentful/match-author-types')
const testConfig = require('./setup/test-config')
const transformPosts = require('./wordpress/post-transform')
const uploadAssets = require('./contentful/upload-assets')

const tasks = new Listr([
  {
    task: () => {
      return new Listr([
        {
          task: () => testConfig(),
          title: 'Check env config',
        },
        {
          task: () => cleanData(),
          title: 'Clean destination folder',
        },
      ])
    },
    title: 'Setup & Pre-flight checks',
  },
  {
    task: () => {
      return new Listr([
        {
          task: () => downloadUsers(),
          title: 'Download raw JSON',
        },
      ])
    },
    title: 'WordPress export: Users',
  },
  {
    task: ({ devMode }) => {
      return new Listr([
        {
          task: () => downloadPosts({ devMode }),
          title: 'Download raw JSON',
        },
        {
          task: () => transformPosts(),
          title: 'Transform into Contentful format',
        },
        {
          task: () => createAssetList(),
          title: 'Create list of assets',
        },
      ])
    },
    title: 'WordPress export: Posts',
  },
  {
    enabled: ({ devMode }) => !devMode,
    task: () => {
      return new Listr([
        {
          task: () => createClient().then(uploadAssets),
          title: 'Upload assets',
        },
        {
          task: () => createClient().then(matchAuthorTypes),
          title: "Match WP 'User' to Contentful 'Person'",
        },
        {
          task: () => createClient().then(createBlogPosts),
          title: 'Create Posts',
        },
      ])
    },
    title: 'Contentful import',
  },
])

const main = (options = {}) => {
  tasks.run(options).catch((err) => console.error(err))
}

const init = () => {
  console.info('Project initialization is not set up yet, sorry')
  process.exit(1)
}

const args = process.argv
const argument = args[args.length - 1]

if (argument === 'init') {
  init()
} else if (argument === 'dev') {
  main({ devMode: true })
} else {
  main()
}
