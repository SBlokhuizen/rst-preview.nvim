'use strict'
const { attach } = require('@chemzqm/neovim')
const logger = require('./lib/util/logger')('app/nvim')

const MSG_PREFIX = '[rst-preview.nvim]'

const plugin = attach({
  reader: process.stdin,
  writer: process.stdout
})

process.on('uncaughtException', (err) => {
  const msg = `${MSG_PREFIX} uncaught exception: ` + err.stack
  if (plugin.nvim) {
    plugin.nvim.call('rstpvw#util#echo_messages', ['Error', msg.split('\n')])
  }
  logger.error('uncaughtException', err.stack)
})

process.on('unhandledRejection', (reason) => {
  if (plugin.nvim) {
    plugin.nvim.call('rstpvw#util#echo_messages', ['Error', [`${MSG_PREFIX} UnhandledRejection`, `${reason}`]])
  }
  logger.error('unhandledRejection', reason)
})

exports.plugin = plugin
