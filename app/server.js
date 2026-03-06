'use strict'

exports.run = function () {
  const http = require('http')
  const websocket = require('socket.io')
  const opener = require('./lib/util/opener')
  const logger = require('./lib/util/logger')('app/server')
  const { getIP } = require('./lib/util/getIP')
  const routes = require('./routes')
  const { renderRST } = require('./rst')
  const { attach } = require('@chemzqm/neovim')

  // Attach directly to neovim via stdio
  const nvim = attach({ reader: process.stdin, writer: process.stdout })

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', err.stack)
  })
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', reason)
  })

  let clients = {}

  const openUrl = (url, browser) => {
    const handler = opener(url, browser)
    handler.on('error', (err) => {
      const message = err.message || ''
      const match = message.match(/\s*spawn\s+(.+)\s+ENOENT\s*/)
      if (match) {
        nvim.call('rstpvw#util#echo_messages', ['Error', [`[rst-preview.nvim]: Cannot open browser: ${match[1]}`]])
      } else {
        nvim.call('rstpvw#util#echo_messages', ['Error', [err.name, err.message]])
      }
    })
  }

  const updateClientsActiveVar = () => {
    const active = Object.values(clients).some(cs => cs.some(c => c.connected))
    nvim.setVar('rstpvw_clients_active', active ? 1 : 0)
  }

  // HTTP server
  const server = http.createServer(async (req, res) => {
    req.nvim = nvim
    req.bufnr = (req.headers.referer || req.url)
      .replace(/[?#].*$/, '').split('/').pop()
    req.asPath = req.url.replace(/[?#].*$/, '')
    req.customCss = await nvim.getVar('rstpvw_css').catch(() => '')
    routes(req, res)
  })

  // WebSocket server
  const io = websocket(server)

  io.on('connection', async (client) => {
    const { handshake = { query: {} } } = client
    const bufnr = handshake.query.bufnr
    logger.info('client connect:', client.id, bufnr)

    clients[bufnr] = clients[bufnr] || []
    clients[bufnr].push(client)
    updateClientsActiveVar()

    // Send initial content
    try {
      const buffers = await nvim.buffers
      for (const buffer of buffers) {
        if (buffer.id === Number(bufnr)) {
          const winline = await nvim.call('winline')
          const currentWindow = await nvim.window
          const winheight = await nvim.call('winheight', currentWindow.id)
          const cursor = await nvim.call('getpos', '.')
          const options = await nvim.getVar('rstpvw_preview_options').catch(() => ({}))
          const pageTitle = await nvim.getVar('rstpvw_page_title').catch(() => '${name}')
          const theme = await nvim.getVar('rstpvw_theme').catch(() => '')
          const name = await buffer.name
          const lines = await buffer.getLines()
          const currentBuffer = await nvim.buffer
          const rendered = renderRST(lines)

          client.emit('refresh_content', {
            options,
            isActive: currentBuffer.id === buffer.id,
            winline,
            winheight,
            cursor,
            pageTitle,
            theme,
            name,
            html: rendered.html,
            lineCount: lines.length
          })
          break
        }
      }
    } catch (e) {
      logger.error('initial content error:', e)
    }

    client.on('disconnect', () => {
      logger.info('disconnect:', client.id)
      clients[bufnr] = (clients[bufnr] || []).filter(c => c.id !== client.id)
      updateClientsActiveVar()
    })
  })

  // RPC notification handlers - nvim calls these via rpcnotify
  nvim.on('notification', async (method, args) => {
    logger.info('notification:', method, args)
    const params = args[0] || {}
    const bufnr = params.bufnr

    if (method === 'refresh_content') {
      try {
        const buffers = await nvim.buffers
        for (const buffer of buffers) {
          if (buffer.id === Number(bufnr)) {
            const winline = await nvim.call('winline')
            const currentWindow = await nvim.window
            const winheight = await nvim.call('winheight', currentWindow.id)
            const cursor = await nvim.call('getpos', '.')
            const options = await nvim.getVar('rstpvw_preview_options').catch(() => ({}))
            const pageTitle = await nvim.getVar('rstpvw_page_title').catch(() => '${name}')
            const theme = await nvim.getVar('rstpvw_theme').catch(() => '')
            const name = await buffer.name
            const lines = await buffer.getLines()
            const currentBuffer = await nvim.buffer
            const rendered = renderRST(lines)

            const data = {
              options,
              isActive: currentBuffer.id === buffer.id,
              winline,
              winheight,
              cursor,
              pageTitle,
              theme,
              name,
              html: rendered.html,
              lineCount: lines.length
            };

            (clients[bufnr] || []).forEach(c => {
              if (c.connected) c.emit('refresh_content', data)
            })
            break
          }
        }
      } catch (e) {
        logger.error('refresh_content error:', e)
      }

    } else if (method === 'open_browser') {
      try {
        const openToTheWorld = await nvim.getVar('rstpvw_open_to_the_world').catch(() => 0)
        const openIp = await nvim.getVar('rstpvw_open_ip').catch(() => '')
        const openHost = openIp !== '' ? openIp : (openToTheWorld ? getIP() : 'localhost')
        const url = `http://${openHost}:${currentPort}/page/${bufnr}`
        const browserfunc = await nvim.getVar('rstpvw_browserfunc').catch(() => '')
        if (browserfunc !== '') {
          nvim.call(browserfunc, [url])
        } else {
          const browser = await nvim.getVar('rstpvw_browser').catch(() => '')
          if (browser !== '') {
            openUrl(url, browser)
          } else {
            openUrl(url)
          }
        }
        const isEchoUrl = await nvim.getVar('rstpvw_echo_preview_url').catch(() => 0)
        if (isEchoUrl) {
          nvim.call('rstpvw#util#echo_url', [url])
        }
      } catch (e) {
        logger.error('open_browser error:', e)
      }

    } else if (method === 'close_page') {
      ;(clients[bufnr] || []).filter(c => {
        if (c.connected) { c.emit('close_page'); return false }
        return true
      })

    } else if (method === 'close_all_pages') {
      Object.keys(clients).forEach(b => {
        ;(clients[b] || []).forEach(c => { if (c.connected) c.emit('close_page') })
      })
      clients = {}
    }
  })

  nvim.on('request', (method, args, resp) => {
    logger.info('request:', method)
    resp.send(null)
  })

  let currentPort = null

  async function startServer () {
    logger.info('startServer called')
    const openToTheWorld = await nvim.getVar('rstpvw_open_to_the_world').catch(() => 0)
    const host = openToTheWorld ? '0.0.0.0' : '127.0.0.1'
    let port = await nvim.getVar('rstpvw_port').catch(() => '')
    port = port || (8090 + Number(`${Date.now()}`.slice(-3)))
    currentPort = port

    server.listen({ host, port }, () => {
      logger.info('server listening on port:', port)
      // Tell vim to open the browser - vim side calls rpcnotify open_browser
      nvim.call('rstpvw#util#open_browser').catch(e => logger.error('open_browser call error:', e))
    })
  }

  // Small delay to let RPC handshake complete
  setTimeout(startServer, 100)
}
