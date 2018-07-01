import Router from 'koa-router'
import send from 'koa-send'
import path from 'path'
import { noteService } from '../service/note'

const router = new Router()

router.get('/', async function(ctx, next) {
  await ctx.redirect(noteService.genRandomId())
})

router.get('/:id', async function(ctx, next) {
  await send(ctx, 'index.html', {
    root: path.resolve(__dirname, '../../public'),
  })
})

export const routes = router.routes()
