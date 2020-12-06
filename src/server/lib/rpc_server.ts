import { assert } from 'console'
import * as http from 'http'
import * as SocketIO from 'socket.io'
import { SERVER_APIS } from '../../common/api.type'
import { ErrorCode } from '../../common/error'
import { createEventEmitter } from '../../common/event'

type AnyFunction = (...args: any[]) => any
export type APIMap = { [K: string]: AnyFunction }

export type Client = {
  id: string
}
export type CallOption = {
  rooms?: string[]
  exclude?: string
}

export type RpcServer<S extends APIMap, C extends APIMap> = {
  joinRoom(clientId: string, room: string): void
  leaveRoom(clientId: string, room: string): void
  call<T extends keyof C>(
    method: T,
    params: Parameters<C[T]>[0],
    options?: CallOption,
  ): void
  handle<T extends keyof S>(
    method: T,
    handler: (
      params: Parameters<S[T]>[0],
      client: Client,
    ) => ReturnType<S[T]> | Promise<ReturnType<S[T]>>,
  ): void
}

export const createRpcServer = <S extends APIMap, C extends APIMap>(
  httpServer: http.Server,
): RpcServer<S, C> => {
  const io = new SocketIO.Server(httpServer, {
    cors: {
      origin: '*',
    },
  })

  const handlers = new Map()

  const server: RpcServer<S, C> = {
    ...createEventEmitter(),
    joinRoom(clientId: string, room: string) {
      const socket = io.sockets.sockets.get(clientId)
      assert(socket, `invalid socket: ${clientId}`)
      socket!.join(room)
    },
    leaveRoom(clientId: string, room: string) {
      const socket = io.sockets.sockets.get(clientId)
      assert(socket, `invalid socket: ${clientId}`)
      socket!.leave(room)
    },
    call(method, params, options = {}) {
      let target = options.exclude
        ? io.sockets.sockets.get(options.exclude)
        : io.sockets
      if (!target) {
        throw new Error(
          `[api_server] target not found: ${method}, ${target}, ${options}`,
        )
      }
      ;(options.rooms || []).forEach((room) => {
        target = target!.to(room)
      })
      target.emit(method as string, params)
    },
    handle(method, cb) {
      handlers.set(method, cb)
    },
  }

  io.on('connection', (socket: SocketIO.Socket) => {
    SERVER_APIS.forEach((endpoint) => {
      socket.on(endpoint, async (params, reply) => {
        const handler = handlers.get(endpoint)
        if (handler) {
          try {
            const result = await handler(params, { id: socket.id })
            reply(result)
          } catch (error) {
            console.error(
              '[APIClient] failed to handle event:',
              endpoint,
              error,
            )
            const errcode = error?.errcode ?? ErrorCode.UNKNOWN
            reply({ errcode })
          }
        } else {
          console.error(`[APIClient] client api "${endpoint}" is not handled!`)
          reply({ errcode: ErrorCode.UNKNOWN })
        }
      })
    })
  })

  return server
}
