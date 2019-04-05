import * as Router from 'koa-router'
import {
  showRandomNote,
  showNote,
  showApiStatus,
  createNote,
  getNote,
  setNote,
  appendNote,
  deleteNote,
  findItems,
  findOneItem,
  createItem,
  updateItem,
  patchItem,
  deleteItem,
} from '../controller/note'
import { serverStatic } from '../controller/static'
import { Middleware } from 'koa'
import { isDev } from '../utils/env'

const api = (fn: Function): Middleware<{}, any> => async (ctx, next) => {
  let query = {}
  Object.keys(ctx.request.query).forEach((key) => {
    const value = ctx.request.query[key]
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (typeof parsed === 'object') {
          query[key] = parsed
        } else {
          query[key] = value
        }
      } catch (error) {
        query[key] = value
      }
    } else {
      query[key] = value
    }
  })

  const params = {
    ...query,
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
    ctx.body = JSON.stringify(result === undefined ? null : result)
    ctx.status = 200
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
        ctx.body = JSON.stringify(error)
      }
      ctx.status = 500
    }
  }
}

const router = new Router()

// statics
router.all('/dist/:file*', serverStatic)

// apis
router.all('/api', showApiStatus)

router.post('/api/note', api(createNote))
router.get('/api/note', api(getNote))
router.put('/api/note', api(setNote))
router.patch('/api/note', api(appendNote))
router.del('/api/note', api(deleteNote))

router.get('/api/items', api(findItems))
router.get('/api/item', api(findOneItem))
router.post('/api/item', api(createItem))
router.put('/api/item', api(updateItem))
router.patch('/api/item', api(patchItem))
router.del('/api/item', api(deleteItem))

// pages
router.get('/', showRandomNote)
router.get('/:id*', showNote)

export const routes = router.routes()
