if (!/^(\/|C:\\)snapshot/.test(__dirname)) {
  process.chdir(__dirname)
}
require('./server').run()
