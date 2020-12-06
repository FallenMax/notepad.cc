import * as Router from 'koa-router'
import * as send from 'koa-send'
import { generateId } from '../../common/lib/generate_id'
import { config } from '../config'

const router = new Router()

// static resources
router.all('/dist/:file*', async (ctx) => {
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
})

// pages
router.get('/', async (ctx, next) => {
  await ctx.redirect(generateId())
})

router.get('/:id*', async (ctx, next) => {
  await send(ctx, 'index.html', {
    root: config.staticDir,
  })
})

export const routes = router.routes()
