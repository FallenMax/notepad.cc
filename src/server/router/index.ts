import Router from 'koa-router'
import send from 'koa-send'
import path from 'path'
import { noteService } from '../service/note'

const router = new Router()

const publicPath = path.resolve(__dirname, '../../public')

// use '.all()' here because koa-router's '.use()' is kinda useless
// see: https://github.com/alexmingoia/koa-router/issues/257
router.all('/dist/:file*', async (ctx, next) => {
  try {
    const filePath = ctx.path.replace(/^\/dist/, '')
    await send(ctx, filePath, {
      root: publicPath,
    })
  } catch (err) {
    if (err.status !== 404) {
      throw err
    }
  }
})

router.get('/', async function(ctx, next) {
  await ctx.redirect(noteService.genRandomId())
})

router.get('/:id*', async function(ctx, next) {
  await send(ctx, 'index.html', {
    root: path.resolve(__dirname, '../../public'),
  })
})

export const routes = router.routes()
