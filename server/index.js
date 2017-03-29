const Koa = require('koa')
const http = require('http')
const app = new Koa()

const logger = require('koa-logger')
const serveStatic = require('koa-static')
const compress = require('koa-compress')
const views = require('koa-views')
const bodyParser = require('koa-bodyparser')
const error = require('./middleware/errorHandler.js')
const router = require('./router')

const enableWebSocket = require('./websocket')

const config = require('../config')

app.use(error())
app.use(logger())
app.use(compress())
app.use(serveStatic('public'))
app.use(bodyParser())
app.use(views(__dirname + '/views', { map: { html: 'mustache' } }))
app.use(router.routes())

let server = http.Server(app.callback())
enableWebSocket(server)

function start() {
  const port = config.port || 3000
  server.listen(port)
  console.info('Listening on', port)
}

module.exports = start
