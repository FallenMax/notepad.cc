import * as send from 'koa-send'
import * as WsServer from 'socket.io'
import { Middleware } from 'koa'
import { config } from '../config'
import { NoteApiMapping } from '../../common/api_definitions/note.type'
import { noteService } from '../service/note'
import { registerSocketApi, SocketFunction } from './util'
import { isDeepStrictEqual } from 'util'

//-------------- Pages --------------
export const showRandomNote: Middleware = async (ctx, next) => {
  await ctx.redirect(noteService.generateId())
}

export const showNote: Middleware = async (ctx, next) => {
  await send(ctx, 'index.html', {
    root: config.staticDir,
  })
}

//-------------- APIs --------------
export const showApiStatus: Middleware = async (ctx, next) => {
  // TODO
  ctx.body = 'api'
}

//-------------- APIs: notes --------------

export const createNote = async ({ note = '' }: { note?: string }) => {
  if (typeof note !== 'string') {
    throw new TypeError(`'note' should be string`)
  }
  // find unused id
  let id = noteService.generateId()
  let existed = await noteService.getNote(id)
  while (existed.note !== '') {
    id = noteService.generateId()
    existed = await noteService.getNote(id)
  }

  await noteService.setNote(id, note)

  return { id, note }
}

export const getNote = async ({ id }: { id: string }) => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  const { note } = await noteService.getNote(id)
  return { id, note }
}

export const setNote = async ({ id, note }: { id: string; note: string }) => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (typeof note !== 'string') {
    throw new TypeError(`'note' should be string`)
  }
  await noteService.setNote(id, note)
}

export const appendNote = async ({
  id,
  append,
}: {
  id: string
  append: string
}) => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (typeof append !== 'string') {
    throw new TypeError(`'append' should be string`)
  }
  await noteService.appendNote(id, append)
}

export const deleteNote = async ({ id }: { id: string }) => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  await noteService.setNote(id, '')
}

//-------------- APIs: list & items --------------
/** is `item` superset of `query` */
const isMatching = (query: object, item: object): boolean => {
  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      if (!isDeepStrictEqual(item[key], query[key])) {
        return false
      }
    }
  }
  return true
}

const noteToItems = (note: string): any[] => {
  return note
    .split('\n')
    .map((n) => {
      try {
        const parsed = JSON.parse(n)
        if (parsed && typeof parsed === 'object') {
          return parsed
        } else {
          return undefined
        }
      } catch (error) {
        return undefined
      }
    })
    .filter(Boolean)
}

export const findItems = async ({
  id,
  query,
}: {
  id: string
  query?: object
}): Promise<any[]> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (query && typeof query !== 'object') {
    throw new TypeError(`'query' should be object`)
  }

  const { note } = await noteService.getNote(id)
  const items = noteToItems(note)
  const matchingItems = query
    ? items.filter((item: object) => isMatching(query, item))
    : items

  return matchingItems
}

export const findOneItem = async ({
  id,
  query,
}: {
  id: string
  query?: object
}): Promise<any | null> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (!query || typeof query !== 'object') {
    throw new TypeError(`'query' should be object`)
  }
  const { note } = await noteService.getNote(id)
  const items = noteToItems(note)

  const matchingItem = items.find((item: object) => isMatching(query, item))
  return matchingItem || null
}

export const createItem = async ({
  id,
  item,
}: {
  id: string
  item: object
}): Promise<void> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (!item || typeof item !== 'object') {
    throw new TypeError(`'item' should be object`)
  }
  await noteService.appendNote(id, '\n' + JSON.stringify(item))
}

export const updateItem = async ({
  id,
  query,
  item,
}: {
  id: string
  query: object
  item: object
}): Promise<void | { errmsg: string }> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (!query || typeof query !== 'object') {
    throw new TypeError(`'query' should be object`)
  }
  if (!item || typeof item !== 'object') {
    throw new TypeError(`'item' should be object`)
  }

  const note = await noteService.getNote(id)
  const rows = note.note.split('\n')
  const rowIndex = rows.findIndex((row) => {
    try {
      const item = JSON.parse(row)
      if (!item || typeof item !== 'object') {
        return false
      }
      return isMatching(query, item)
    } catch (error) {
      return false
    }
  })
  if (rowIndex === -1) {
    return { errmsg: 'ITEM_NOT_FOUND' }
  }

  rows.splice(rowIndex, 1, JSON.stringify(item))
  const newNote = rows.join('\n')

  await noteService.setNote(id, newNote)
}

export const deleteItem = async ({
  id,
  query,
}: {
  id: string
  query: object
}): Promise<void | { errmsg: string }> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (!query || typeof query !== 'object') {
    throw new TypeError(`'query' should be object`)
  }

  const note = await noteService.getNote(id)
  const rows = note.note.split('\n')
  const rowIndex = rows.findIndex((row) => {
    try {
      const item = JSON.parse(row)
      if (!item || typeof item !== 'object') {
        return false
      }
      return isMatching(query, item)
    } catch (error) {
      return false
    }
  })
  if (rowIndex === -1) {
    return { errmsg: 'ITEM_NOT_FOUND' }
  }

  rows.splice(rowIndex, 1)
  const newNote = rows.join('\n')

  await noteService.setNote(id, newNote)
}

export const patchItem = async ({
  id,
  query,
  update,
}: {
  id: string
  query: object
  update: object
}): Promise<void | { errmsg: string }> => {
  if (typeof id !== 'string' || id === '') {
    throw new TypeError(`'id' should be string`)
  }
  if (!query || typeof query !== 'object') {
    throw new TypeError(`'query' should be object`)
  }
  if (!update || typeof update !== 'object') {
    throw new TypeError(`'update' should be object`)
  }

  const note = await noteService.getNote(id)
  const rows = note.note.split('\n')
  const rowIndex = rows.findIndex((row) => {
    try {
      const item = JSON.parse(row)
      if (!item || typeof item !== 'object') {
        return false
      }
      return isMatching(query, item)
    } catch (error) {
      return false
    }
  })
  if (rowIndex === -1) {
    return { errmsg: 'ITEM_NOT_FOUND' }
  }

  const origItem = JSON.parse(rows[rowIndex])
  const newItem = {
    ...origItem,
    ...update,
  }
  rows.splice(rowIndex, 1, JSON.stringify(newItem))
  const newNote = rows.join('\n')

  await noteService.setNote(id, newNote)
}

//-------------- WebSocket --------------
export type NoteSocketApi = {
  [K in keyof NoteApiMapping]: SocketFunction<
    NoteApiMapping[K]['params'],
    NoteApiMapping[K] extends { result: any }
      ? NoteApiMapping[K]['result']
      : undefined
  >
}

export const registerNoteSocketApis = (server: WsServer.Server): void => {
  const sockets = {} as { [K: string]: SocketIO.Socket }

  const subscribe: NoteSocketApi['subscribe'] = ({ id }, socket) => {
    if (!socket.rooms[id]) {
      socket.join(id)
    }
  }
  const unsubscribe: NoteSocketApi['unsubscribe'] = ({ id }, socket) => {
    if (socket.rooms[id]) {
      socket.leave(id)
    }
  }

  const get: NoteSocketApi['get'] = async ({ id }) => {
    return await noteService.getNote(id)
  }

  const save: NoteSocketApi['save'] = async ({ id, p, h }, socket) => {
    console.info(`saving note for: ${id}`)
    const update = await noteService.patchNote({
      id,
      patch: p,
      hash: h,
      source: socket.id,
    })
    if ('errcode' in update) {
      return { errcode: update.errcode }
    } else {
      return {}
    }
  }

  server.on('connection', function(socket) {
    registerSocketApi(socket, { subscribe, unsubscribe, get, save })
    sockets[socket.id] = socket
  })

  noteService.on('patch', ({ id, hash, patch, source }) => {
    if (source && sockets[source]) {
      console.info('[note] send to others')
      const socket = sockets[source]
      socket.to(id).emit('note_update', { id, h: hash, p: patch })
    } else {
      console.info('[note] broadcast all')
      server.to(id).emit('note_update', { id, h: hash, p: patch })
    }
  })
}
