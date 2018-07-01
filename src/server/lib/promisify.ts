export function promisify(object: any, method: string) {
  object[method + 'Async'] = (...args: any[]) =>
    new Promise((resolve, reject) => {
      object[method](
        ...args.concat((err: any, result: any) => {
          if (err) return reject(err)
          resolve(result)
        })
      )
    })
}

export function promisifyAll(object: any) {
  for (var key in object) {
    if (!(key in {}) && typeof object[key] === 'function') {
      promisify(object, key)
    }
  }
  return object
}
