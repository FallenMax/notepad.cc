import { isDebugging } from './env'

export const assert = (condition: any, message: string): void => {
  if (!condition) {
    throw new Error(message)
  }
}

export const assertNever = (o: never): never => {
  throw new TypeError('Unexpected type: ' + JSON.stringify(o))
}

export const softAssertNever = (o: never): undefined => {
  if (isDebugging) {
    console.warn('Unexpected type:', o)
  }
  return undefined
}
