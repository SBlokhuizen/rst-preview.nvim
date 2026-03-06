'use strict'
const path = require('path')
const serverPath = path.join(__dirname, '..', '..', 'server.js')
require(serverPath).run()
