import * as http from 'http'
import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as compress from 'koa-compress'
import * as logger from 'koa-logger'
import { config } from './config'
import { error } from './middleware/errorHandler'
import { routes } from './router'
import { createWebsocketServer } from './websocket'
import { isTesting } from './utils/env'
import { noteService } from './service/note'

let httpServer: http.Server | undefined
let websocketServer: SocketIO.Server | undefined

export const start = () => {
  return new Promise((resolve) => {
    console.info('--- start ---')
    if (httpServer || websocketServer) {
      throw new Error('server is already running')
    }
    const app = new Koa()

    app.use(error())
    app.use(logger())
    app.use(compress())
    app.use(bodyParser())
    app.use(routes)

    httpServer = new http.Server(app.callback())
    websocketServer = createWebsocketServer()
    websocketServer.listen(httpServer)

    const port = config.port
    httpServer.listen(port, resolve)
    console.info('Listening on', port)
  })
}

export const quit = () => {
  console.info('--- quit ---')
  if (httpServer) {
    httpServer.close()
    httpServer = undefined
  }
  if (websocketServer) {
    websocketServer.close()
    websocketServer = undefined
  }
  noteService.destory()
}

if (!isTesting) {
  start()
}
