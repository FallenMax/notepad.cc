const http = require('http')
const Koa = require('koa')
const logger = require('koa-logger')
const serveStatic = require('koa-static')
const compress = require('koa-compress')
const views = require('koa-views')
const bodyParser = require('koa-bodyparser')

const error = require('./middleware/errorHandler.js')
const router = require('./router')
const enableWebSocket = require('./websocket')

const config = require('../config')

const app = new Koa()
app.use(error())
app.use(logger())
app.use(compress())
app.use(serveStatic('public'))
app.use(bodyParser())
app.use(views(__dirname + '/views', { map: { html: 'mustache' } }))
app.use(router.routes())

let httpServer = http.Server(app.callback())
enableWebSocket(httpServer)

function start() {
  const port = config.port || 3000
  httpServer.listen(port)
  console.info('Listening on', port)
}

module.exports = start
