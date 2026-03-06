'use strict'
const { spawn } = require('child_process')
const EventEmitter = require('events')
const os = require('os')

module.exports = function opener(url, browser) {
  const emitter = new EventEmitter()

  let cmd, args

  if (browser) {
    args = [url]
    cmd = browser
  } else {
    switch (os.platform()) {
      case 'darwin':
        cmd = 'open'
        args = [url]
        break
      case 'win32':
        cmd = 'cmd'
        args = ['/c', 'start', '', url]
        break
      default:
        cmd = 'xdg-open'
        args = [url]
    }
  }

  const proc = spawn(cmd, args, { stdio: 'ignore', detached: true })
  proc.unref()

  proc.on('error', (err) => emitter.emit('error', err))

  return emitter
}
