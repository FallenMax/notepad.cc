import http from 'http'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import compress from 'koa-compress'
import logger from 'koa-logger'
import serveStatic from 'koa-static'
import { config } from './config'
import { error } from './middleware/errorHandler'
import { routes } from './router'
import { wsServer } from './websocket'

const app = new Koa()

app.use(error())
app.use(logger())
app.use(compress())
app.use(
  serveStatic('public', {
    index: 'disable',
  })
)
app.use(bodyParser())
app.use(routes)

const httpServer = new http.Server(app.callback())
wsServer.listen(httpServer)

function start() {
  const port = config.port || 3000
  httpServer.listen(port)
  console.info('Listening on', port)
}

start()
