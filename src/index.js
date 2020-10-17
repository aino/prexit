const execa = require('execa')
const Listr = require('listr')

const testConfig = require('./setup/test-config')
const cleanDist = require('./setup/clean-dist')
const downloadUsers = require('./wordpress/user-download')
const downloadPosts = require('./wordpress/post-download')
const transformPosts = require('./wordpress/post-transform')
const createAssetList = require('./wordpress/create-asset-list')
const createClient = require('./contentful/create-client')
const uploadAssets = require('./contentful/upload-assets')
const matchAuthorTypes = require('./contentful/match-author-types')
const createBlogPosts = require('./contentful/create-blog-posts')

const tasks = new Listr([
  {
    task: () => {
      return new Listr([
        {
          task: () => testConfig(),
          title: 'Check env config',
        },
        {
          task: () => cleanDist(),
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
    task: () => {
      return new Listr([
        {
          task: () => downloadPosts(),
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
    task: () => {
      return new Listr([
        // {
        //   title: "Create Content Management API Client",
        //   task: () => createClient()
        // },
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

tasks.run().catch((err) => console.error(err))
