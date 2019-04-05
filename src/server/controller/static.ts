import * as send from 'koa-send'
import { Middleware } from 'koa'
import { config } from '../config'

export const serverStatic: Middleware = async (ctx) => {
  try {
    const filePath = ctx.path.replace(/^\/dist/, '')
    await send(ctx, filePath, {
      root: config.staticDir,
    })
  } catch (err) {
    if (err.status !== 404) {
      throw err
    }
  }
}
