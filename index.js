require('async-to-gen/register')
const build = require('./build')
const startServer = require('./server')


build(startServer)
