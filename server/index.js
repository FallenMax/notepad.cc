const Koa = require('koa')
const logger = require('koa-logger')
const serveStatic = require('koa-static')
const compress = require('koa-compress')
const views = require('koa-views')
const bodyParser = require('koa-bodyparser')

const app = new Koa()
const router = require('./router')
const api = require('./socketio')
const config = require('../config')

app.context.config = config
api(app)
app
  .use(logger())
  .use(compress())
  .use(bodyParser())
  .use(views(__dirname + '/views', { map: { html: 'mustache' } }))
  .use(serveStatic('public'))
  .use(router.routes())



module.exports = function start() {
  const port = config.local.port || 3000
  app.listen(port)
  console.info('Listening on', port)
}
