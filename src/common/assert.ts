export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function assertNever(o: never): never {
  throw new TypeError('Unexpected type: ' + JSON.stringify(o))
}

export function softAssertNever(o: never): undefined {
  console.warn('Unexpected type:', o)
  return undefined
}
