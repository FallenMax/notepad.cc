import { Middleware } from 'koa'
import { isDev } from '../config'

export const error = (): Middleware => async (ctx, next) => {
  try {
    await next()
  } catch (e: any) {
    console.error(e)
    ctx.response.body = isDev ? (e && e.message) || JSON.stringify(e) : 'error'
    ctx.response.status = 500
  }
}
