import { DefaultState, Middleware } from 'koa'
import * as Router from 'koa-router'
import * as send from 'koa-send'
import { UserError } from '../../common/error'
import { generateId } from '../../common/lib/generate_id'
import { config } from '../config'
import { NoteService } from '../service/note.service.'
import { isDev } from '../utils/env'

const api =
  (fn: Function): Middleware<DefaultState, { request: { params; body } }> =>
  async (ctx, next) => {
    const params = {
      ...ctx.request.params,
      ...ctx.request.query,
      ...ctx.request.body,
    }
    try {
      if (isDev) {
        console.info('[api] params:', params)
      }
      const result = await fn(params)
      if (result && result.errmsg) {
        throw result
      }
      ctx.body = result === undefined ? {} : result
      ctx.status = 200
      ctx.response.set('Cache-Control', 'no-cache')
      if (isDev) {
        console.info('[api] result:', result)
      }
    } catch (error) {
      console.error(error)
      if (error && error.errmsg) {
        ctx.body = {
          errmsg: error.errmsg,
        }
        ctx.status = 400
      } else {
        if (isDev) {
          ctx.body = error
        }
        ctx.status = 500
      }
    }
  }

export const routes = (noteService: NoteService) => {
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

  // api
  router.all(
    '/api',
    api(async function showStatus() {
      return 'ok'
    }),
  )

  router.post(
    '/api/note',
    api(async function createNote({ note = '' }: { note?: string }) {
      if (typeof note !== 'string') {
        throw new TypeError(`'note' should be string`)
      }
      // find unused id
      let id = generateId()
      let existed = await noteService.getNote(id)
      while (existed.note !== '') {
        id = generateId()
        existed = await noteService.getNote(id)
      }

      await noteService.setNote(id, note)

      return { id, note }
    }),
  )

  router.get(
    '/api/note/:id',
    api(async function getNote({ id }: { id: string }) {
      if (typeof id !== 'string' || id === '') {
        throw new UserError(`'id' should be string`)
      }
      const { note } = await noteService.getNote(id)
      return { id, note }
    }),
  )

  router.put(
    '/api/note/:id',
    api(async function putNote({ id, note }: { id: string; note: string }) {
      if (typeof id !== 'string' || id === '') {
        throw new UserError(`'id' should be string`)
      }
      if (typeof note !== 'string') {
        throw new UserError(`'note' should be string`)
      }
      await noteService.setNote(id, note)
    }),
  )

  router.patch(
    '/api/note/:id',
    api(async function appendNote({
      id,
      append,
    }: {
      id: string
      append: string
    }) {
      if (typeof id !== 'string' || id === '') {
        throw new UserError(`'id' should be string`)
      }
      if (typeof append !== 'string') {
        throw new UserError(`'append' should be string`)
      }
      await noteService.appendNote(id, append)
    }),
  )

  router.del(
    '/api/note/:id',
    api(async function deleteNote({ id }: { id: string }) {
      if (typeof id !== 'string' || id === '') {
        throw new UserError(`'id' should be string`)
      }
      await noteService.setNote(id, '')
    }),
  )

  // pages
  router.get('/', async (ctx, next) => {
    await ctx.redirect(generateId())
  })

  router.get('/:id*', async (ctx, next) => {
    await send(ctx, 'index.html', {
      root: config.staticDir,
    })
  })

  return router.routes()
}
