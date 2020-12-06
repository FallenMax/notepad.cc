import * as http from 'http'
import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import * as compress from 'koa-compress'
import * as logger from 'koa-logger'
import { ClientAPI, ServerAPI } from '../common/api.type'
import { config } from './config'
import { registerNoteController } from './controller/note.controller'
import { connectDatabase, disconnectDatabase } from './lib/database'
import { createRpcServer } from './lib/rpc_server'
import { error } from './middleware/errorHandler'
import { routes } from './router'
import { createNoteService } from './service/note.service.'
import { isTesting } from './utils/env'

let httpServer: http.Server | undefined

export const start = () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.info('--- start ---')
      if (httpServer) {
        throw new Error('server is already running')
      }

      await connectDatabase()

      const app = new Koa()
      app.use(error())
      app.use(logger())
      app.use(compress())
      app.use(bodyParser())
      app.use(routes)

      httpServer = new http.Server(app.callback())

      const rpcServer = createRpcServer<ServerAPI, ClientAPI>(httpServer)

      const services = {
        note: createNoteService(),
      }
      const controllers = {
        note: registerNoteController(rpcServer, services.note),
      }

      const port = config.port
      httpServer.listen(port, resolve)

      console.info('Listening on', port)
    } catch (error) {
      reject(error)
    }
  })
}

export const quit = async () => {
  console.info('--- quit ---')
  if (httpServer) {
    httpServer.close()
    httpServer = undefined
  }
  await disconnectDatabase()
}

if (!isTesting) {
  start().catch((e) => {
    console.error(e)
    process.exit(-1)
  })
}
