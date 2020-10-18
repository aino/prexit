const fs = require('fs-extra')

const { DATA_DIR } = require('../util')

const clean = async () => fs.emptyDir(DATA_DIR)

module.exports = clean
