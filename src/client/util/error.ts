export class UserError extends Error {
  errmsg: string
  code: string | undefined
  data: any

  constructor(errmsg: string, code?: string, data?: any) {
    super(errmsg)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserError)
    } else {
      this.stack = new Error(errmsg).stack
    }

    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, UserError.prototype)
    } else {
      // @ts-ignore
      this.__proto__ = new.target.prototype
    }

    this.errmsg = errmsg
    this.code = code
    this.data = data
  }
}
