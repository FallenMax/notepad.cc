import * as SocketIO from 'socket.io-client'
import { CLIENT_APIS } from '../../common/api.type'
import { createEventEmitter, EventEmitter } from '../../common/event'
import { config } from '../config'

type AnyFunction = (...args: any[]) => any
export type APIMap = { [K: string]: AnyFunction }

// https://socket.io/docs/v3/migrating-from-2-x-to-3-0/#The-Socket-instance-will-no-longer-forward-the-events-emitted-by-its-Manager
export type RpcClientEventMap = {
  open: undefined
  error: undefined
  close: undefined
  reconnect: undefined
  reconnect_attempt: undefined
  reconnect_failed: undefined
}
export type RpcClientEvent = keyof RpcClientEventMap

export const RPC_CLIENT_EVENTS: RpcClientEvent[] = [
  'open',
  'error',
  'close',
  'reconnect',
  'reconnect_attempt',
  'reconnect_failed',
]

export type RpcClient<
  S extends APIMap,
  C extends APIMap
> = EventEmitter<RpcClientEventMap> & {
  call<T extends keyof S>(
    method: T,
    params: Parameters<S[T]>[0],
  ): Promise<ReturnType<S[T]>>
  handle<T extends keyof C>(
    method: T,
    handler: (params: Parameters<C[T]>[0]) => void | Promise<void>,
  ): void
  ready(): Promise<void>
}

export const createRpcClient = <
  S extends APIMap,
  C extends APIMap
>(): RpcClient<S, C> => {
  const socket = SocketIO.io(`${location.protocol}//${config.host}`)

  const handlers = new Map()

  const client: RpcClient<S, C> = {
    ...createEventEmitter(),
    call(method, params) {
      return new Promise((resolve, reject) => {
        try {
          socket.emit(method as string, params, resolve)
        } catch (error) {
          reject(error)
        }
      })
    },
    handle(method, cb) {
      handlers.set(method, cb)
    },
    ready() {
      if (socket.connected) {
        return Promise.resolve()
      } else {
        return new Promise((resolve, reject) => {
          socket.io.once('open', resolve)
        })
      }
    },
  }

  CLIENT_APIS.forEach((event) => {
    socket.on(event, async (params) => {
      const handler = handlers.get(event)
      if (handler) {
        try {
          await handler(params)
        } catch (error) {
          console.error('[APIClient] failed to handle event:', event, error)
        }
      } else {
        console.error(`[APIClient] client api: ${event} is not handled!`)
      }
    })
  })

  RPC_CLIENT_EVENTS.forEach((event) => {
    socket.on(event, (payload) => client.emit(event, payload))
  })

  return client
}
