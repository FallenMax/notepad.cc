import * as http from 'http'
import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as compress from 'koa-compress'
import * as logger from 'koa-logger'
import { ClientAPI, ServerAPI } from '../common/api.type'
import { config } from './config'
import { noteController } from './controller/note.controller'
import { createRpcServer } from './lib/rpc_server'
import { error } from './middleware/errorHandler'
import { routes } from './router'
import { noteService } from './service/note.service.'
import { isTesting } from './utils/env'

let httpServer: http.Server | undefined

export const start = () => {
  return new Promise<void>((resolve) => {
    console.info('--- start ---')
    if (httpServer) {
      throw new Error('server is already running')
    }

    const app = new Koa()
    app.use(error())
    app.use(logger())
    app.use(compress())
    app.use(bodyParser())
    app.use(routes)

    httpServer = new http.Server(app.callback())

    const rpcServer = createRpcServer<ServerAPI, ClientAPI>(httpServer)
    const controllers = [noteController]
    controllers.forEach((ctrl) => ctrl(rpcServer))

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
  noteService.destory()
}

if (!isTesting) {
  start()
}
