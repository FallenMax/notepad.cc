import { Middleware } from 'koa'
import { isDev } from '../utils/env'

export const error = (): Middleware => async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    console.error(e)
    ctx.response.body = isDev ? (e && e.message) || JSON.stringify(e) : 'error'
    ctx.response.status = 500
  }
}
