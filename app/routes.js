'use strict'
const fs = require('fs')
const path = require('path')
const logger = require('./lib/util/logger')('app/routes')

const routes = []

function use(route) {
  routes.unshift((req, res, next) => () => route(req, res, next))
}

// /page/:bufnr  -> serve the SPA shell
use((req, res, next) => {
  if (/\/page\/\d+/.test(req.asPath)) {
    const html = path.join(__dirname, '_static', 'index.html')
    res.setHeader('Content-Type', 'text/html')
    return fs.createReadStream(html).pipe(res)
  }
  next()
})

// /_static/* -> serve static assets
use((req, res, next) => {
  if (/^\/_static\//.test(req.asPath)) {
    const fpath = path.join(__dirname, req.asPath)
    if (fs.existsSync(fpath) && !fs.statSync(fpath).isDirectory()) {
      if (fpath.endsWith('.woff2')) res.setHeader('Content-Type', 'font/woff2')
      else if (fpath.endsWith('.woff')) res.setHeader('Content-Type', 'font/woff')
      else if (fpath.endsWith('.css')) res.setHeader('Content-Type', 'text/css')
      else if (fpath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript')
      return fs.createReadStream(fpath).pipe(res)
    } else {
      logger.error('Static file not found:', fpath)
    }
  }
  next()
})

// Custom user CSS override
use((req, res, next) => {
  if (req.asPath === '/_custom/user.css' && req.customCss) {
    if (fs.existsSync(req.customCss)) {
      res.setHeader('Content-Type', 'text/css')
      return fs.createReadStream(req.customCss).pipe(res)
    }
  }
  next()
})

// Local image serving: /_local_image_/<encoded path>
use(async (req, res, next) => {
  const reg = /^\/_local_image_\//
  if (reg.test(req.asPath)) {
    try {
      const nvim = req.nvim
      // Get the directory of the current buffer file
      const fileDir = await nvim.call('expand', `#${req.bufnr}:p:h`)

      // Decode the image path (encoded by rst.js)
      let imgPath = decodeURIComponent(req.asPath.replace(reg, ''))
      imgPath = imgPath.replace(/\\ /g, ' ')

      // Resolve relative paths against the buffer's directory
      if (!path.isAbsolute(imgPath)) {
        imgPath = path.join(fileDir, imgPath)
      }

      imgPath = path.normalize(imgPath)

      logger.info('serving image:', imgPath)

      if (fs.existsSync(imgPath) && !fs.statSync(imgPath).isDirectory()) {
        const ext = imgPath.split('.').pop().toLowerCase()
        const mimeTypes = {
          'svg': 'image/svg+xml',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'bmp': 'image/bmp',
        }
        if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext])
        return fs.createReadStream(imgPath).pipe(res)
      }
      logger.error('Image not found:', imgPath)
    } catch (e) {
      logger.error('Image route error:', e)
    }
  }
  next()
})

// 404
use((req, res) => {
  res.statusCode = 404
  res.end('404 Not Found')
})

module.exports = function (req, res, next) {
  return routes.reduce((next, route) => route(req, res, next), next)()
}
