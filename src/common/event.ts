export const createEventEmitter = <
  EventMap extends { [K: string]: any } = { [K: string]: any }
>(): EventEmitter<EventMap> => {
  type Keys = keyof EventMap
  type KeysPayloadRequired = {
    [K in Keys]: EventMap[K] extends undefined ? never : K
  }[Keys]

  type KeysPayloadOptional = Exclude<Keys, KeysPayloadRequired>

  type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void
  type HandlerDesc<K extends keyof EventMap> = {
    handler: Handler<K>
    once: boolean
  }

  let listeners = Object.create(null) as { [K in Keys]: HandlerDesc<K>[] }

  const on = <K extends Keys>(event: K, handler: Handler<K>) => {
    if (!listeners[event]) {
      listeners[event] = []
    }
    if (!listeners[event].some((item) => item.handler === handler)) {
      listeners[event].push({
        handler: handler,
        once: false,
      })
    }
  }

  const once = <K extends Keys>(event: K, handler: Handler<K>) => {
    if (!listeners[event]) {
      listeners[event] = []
    }
    if (!listeners[event].some((h) => h.handler === handler)) {
      listeners[event].push({
        handler: handler,
        once: true,
      })
    }
  }
  const off = <K extends Keys>(event: K, handler: Handler<K>) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((h) => h.handler !== handler)
    }
  }

  function emit<K extends KeysPayloadOptional>(
    event: K,
    payload?: EventMap[K],
  ): void
  function emit<K extends KeysPayloadRequired>(
    event: K,
    payload: EventMap[K],
  ): void
  function emit<K extends Keys>(event: K, payload?: EventMap[K]): void {
    if (listeners[event]) {
      listeners[event].forEach((handler) => {
        handler.handler(payload as EventMap[K])
        if (handler.once) {
          off(event, handler.handler)
        }
      })
    }
  }

  const removeAllListeners = () => {
    listeners = Object.create(null) as { [K in Keys]: HandlerDesc<K>[] }
  }

  return { on, once, off, emit, removeAllListeners }
}

export type EventEmitter<
  EventMap extends { [K: string]: any } = { [K: string]: any }
> = {
  // type preserve hack
  __eventMap?: EventMap
  on<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void,
  ): void
  once<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void,
  ): void
  off<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void,
  ): void
  emit<K extends keyof EventMap>(event: K, payload?: EventMap[K]): void
  removeAllListeners(): void
}

export class EventEmitterClass<
  EventMap extends { [K: string]: any } = { [K: string]: any }
> {
  private _emitter = createEventEmitter<EventMap>()
  // type preserve hack
  __eventMap?: EventMap
  on = this._emitter.on
  off = this._emitter.off
  once = this._emitter.once
  emit = this._emitter.emit
  removeAllListeners = this._emitter.removeAllListeners
}

export type EventMapOf<T extends EventEmitter> = T extends EventEmitter
  ? Exclude<T['__eventMap'], undefined>
  : never
