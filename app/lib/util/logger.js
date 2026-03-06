'use strict'
const log4js = require('log4js')
const path = require('path')

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: path.join(require('os').tmpdir(), 'rst-preview.nvim.log'),
      maxLogSize: 1024 * 1024,
      backups: 1
    }
  },
  categories: {
    default: { appenders: ['file'], level: 'info' }
  }
})

module.exports = function (name) {
  return log4js.getLogger(name)
}
