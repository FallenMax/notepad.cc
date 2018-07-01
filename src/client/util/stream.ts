interface StreamListener<T> {
  (value: T): void
}

interface StreamDependent<T> {
  update(val: T): void
  flush(): void
}

// dirty workaround as typescript does not support callable class for now
interface StreamCallable<T> {
  (val: T | undefined): void
  (): T
}

enum StreamState {
  Initial,
  Started,
  Ended,
  Errored,
}

class StreamClass<T> {
  private listeners: StreamListener<T>[] = []
  private dependents: StreamDependent<T>[] = []
  private state: StreamState = StreamState.Initial
  private value: T | undefined = undefined
  private changed: boolean = false

  private constructor() {}

  static create<T>(init?: T | undefined): Stream<T> {
    const stream$: Stream<T> = function(val: T | undefined) {
      if (typeof val === 'undefined') {
        return stream$.value
      } else {
        if (stream$.state === StreamState.Initial) {
          stream$.state = StreamState.Started
        }
        stream$.update(val)
        stream$.flush()
      }
    } as Stream<T>
    if (typeof init === 'undefined') {
      stream$.state = StreamState.Started
    }
    stream$.value = init
    stream$.changed = false
    stream$.listeners = []
    stream$.dependents = []
    Object.setPrototypeOf(stream$, StreamClass.prototype)
    return stream$
  }

  static combine<T1, V>(
    combiner: (s1: T1) => V,
    streams: [Stream<T1>]
  ): Stream<V>
  static combine<T1, T2, V>(
    combiner: (s1: T1, s2: T2) => V,
    streams: [Stream<T1>, Stream<T2>]
  ): Stream<V>
  static combine<T1, T2, T3, V>(
    combiner: (s1: T1, s2: T2, s3: T3) => V,
    streams: [Stream<T1>, Stream<T2>, Stream<T3>]
  ): Stream<V>
  static combine(
    combiner: (...values: any[]) => any,
    streams: Stream<any>[]
  ): Stream<any> {
    let cached = streams.map(stream$ => stream$())
    const allHasValue = (arr: any[]) =>
      arr.every(elem => typeof elem !== 'undefined')
    const combined$ = Stream(
      allHasValue(cached) ? combiner(...cached) : undefined
    )

    streams.forEach((stream, i) => {
      stream.dependents.push({
        update(val: any) {
          cached[i] = val
          if (allHasValue(cached)) {
            combined$.update(combiner(...cached))
          }
        },
        flush() {
          combined$.flush()
        },
      })
    })

    return combined$
  }

  static merge<A>(streams: [Stream<A>]): Stream<A>
  static merge<A, B>(streams: [Stream<A>, Stream<B>]): Stream<A | B>
  static merge<A, B, C>(
    streams: [Stream<A>, Stream<B>, Stream<C>]
  ): Stream<A | B | C>
  static merge<V>(streams: Stream<V>[]): Stream<V>
  static merge(streams: Stream<any>[]): Stream<any> {
    const merged$ = Stream()
    streams.forEach(stream$ => {
      stream$.subscribe(val => merged$(val))
    })
    return merged$
  }

  static interval(interval: number) {
    const interval$ = Stream<null>()
    setInterval(() => interval$(null), interval)
    return interval$
  }

  static fromEvent<K extends keyof HTMLElementEventMap | string>(
    elem: HTMLElement,
    type: K
  ): Stream<
    K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : any
  > {
    type ValueType = K extends keyof HTMLElementEventMap
      ? HTMLElementEventMap[K]
      : any
    const event$ = Stream<ValueType>()
    elem.addEventListener(type, event$)
    return event$
  }

  private update(val: T) {
    this.value = val
    this.state = StreamState.Started
    this.changed = true
    this.dependents.forEach(dep => dep.update(val))
  }

  private flush() {
    if (this.changed) {
      this.changed = false
      if (this.state === StreamState.Started) {
        this.listeners.forEach(l => l(this.value as T))
      }
      this.dependents.forEach(dep => dep.flush())
    }
  }

  private asStream(): Stream<T> {
    return this as any
  }

  subscribe(listener: StreamListener<T>, emitOnSubscribe?: boolean): this {
    if (emitOnSubscribe && this.state === StreamState.Started) {
      listener(this.value as T)
    }
    this.listeners.push(listener)
    return this
  }

  log(name: string): this {
    this.subscribe(val =>
      console.log(`[stream] ${name}: ${JSON.stringify(val)}`)
    )
    return this
  }

  map<V>(mapper: (val: T) => V): Stream<V> {
    return Stream.combine<T, V>(mapper, [this.asStream()])
  }

  startWith(x: T): Stream<T> {
    const stream$ = Stream(x)
    this.subscribe(val => stream$(val))
    return stream$
  }

  unique(): Stream<T> {
    let lastValue = this.value
    const unique$ = Stream(lastValue)
    this.subscribe(val => {
      if (val !== lastValue) {
        unique$(val)
        lastValue = val
      }
    })
    return unique$
  }

  filter<V extends T = T>(predict: (val: T) => boolean): Stream<V> {
    const filtered$ = Stream<V>()
    this.subscribe(val => {
      if (predict(val)) {
        filtered$(val as V)
      }
    })
    return filtered$
  }

  delay(delayInMs: number): Stream<T> {
    const delayed$ = Stream<T>()
    this.subscribe(value => {
      setTimeout(() => {
        delayed$(value)
      }, delayInMs)
    })
    return delayed$
  }

  debounce(delay: number): Stream<T> {
    const debounced$ = Stream<T>()
    let timer: any

    this.unique().subscribe(val => {
      clearTimeout(timer)
      timer = setTimeout(function() {
        debounced$(val)
      }, delay)
    })

    return debounced$
  }

  until(condition$: Stream<boolean>): Stream<T> {
    let pending = !condition$()
    const until$ = Stream(pending ? undefined : this.value)

    condition$.subscribe(isOk => {
      if (isOk && pending) {
        pending = false
        until$(this.value)
      }
    })

    this.subscribe(val => {
      if (!condition$()) {
        pending = true
      } else {
        until$(val)
      }
    })

    return until$
  }
}

// dirty workaround as typescript does not support callable class for now
export type Stream<T> = StreamClass<T> & StreamCallable<T>

export const Stream = Object.assign(StreamClass.create, StreamClass)
