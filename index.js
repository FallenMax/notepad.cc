const build = require('./build')
const startServer = require('./server')

build().then(startServer)
