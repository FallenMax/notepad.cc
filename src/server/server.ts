import * as cors from '@koa/cors'
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

      const noteService = createNoteService()

      const app = new Koa()
      app.use(error())
      app.use(logger())
      app.use(compress())
      app.use(bodyParser())
      app.use(
        cors({
          origin: (ctx) => {
            const origin = ctx.request.headers.origin
            return origin
          },
          credentials: false,
        }),
      )

      app.use(routes(noteService))

      httpServer = new http.Server(app.callback())

      const rpcServer = createRpcServer<ServerAPI, ClientAPI>(httpServer)

      registerNoteController(rpcServer, noteService)

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
