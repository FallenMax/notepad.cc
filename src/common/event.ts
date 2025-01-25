import { Disposable } from './disposable'
type EventHandler<T> = (payload: T) => void

export class EventEmitter<
  EventMap extends { [K: string]: any } = { [K: string]: any },
> extends Disposable {
  private listeners: {
    [K in keyof EventMap]: EventHandler<EventMap[K]>[]
  } = Object.create(null)

  constructor() {
    super()
    this.register(() => {
      this.listeners = Object.create(null)
    })
  }

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    if (!this.listeners[event]) this.listeners[event] = []

    this.listeners[event].push(handler)
    return () => this.off(event, handler)
  }

  off<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>,
  ): void {
    if (!this.listeners[event]) return

    const index = this.listeners[event].indexOf(handler)
    if (index !== -1) {
      this.listeners[event].splice(index, 1)
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    if (!this.listeners[event]) return

    const handlers = this.listeners[event].slice()
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](payload)
    }
  }
}
