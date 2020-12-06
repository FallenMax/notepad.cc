import hashString = require('string-hash')
import { ErrorCode, UserError } from '../../common/error'
import { createEventEmitter } from '../../common/event'
import { applyPatch, createPatch, Patch } from '../../common/lib/diff3'
import { openDatabase } from '../lib/database'

const NOTE_MAX_SIZE = 100000

type Hash = number

export interface Note {
  _id: string
  note: string
}

export interface NoteEventMap {
  patch: {
    id: string
    hash: Hash
    patch: Patch
    source?: string
  }
}

export const createNoteService = () => {
  const db = openDatabase<Note>('notes')

  const pruneTimer = setInterval(async function removeEmptyNotes() {
    console.warn('removing empty notes...')
    const count = await db.removeMulti({ note: '' })
    console.warn(`${count} empty notes removed`)
  }, 1000 * 60 * 60)

  const patchNote = async ({
    id,
    patch,
    hash,
    source,
  }: {
    id: string
    patch: Patch
    hash: Hash
    source?: string
  }): Promise<{ hash: number; patch: Patch }> => {
    const existNote = await getNote(id)
    const result = applyPatch(existNote.note, patch)
    if (result == null || hash !== hashString(result)) {
      throw new UserError(ErrorCode.UNKNOWN)
    }
    if (result.length > NOTE_MAX_SIZE) {
      throw new UserError(ErrorCode.EXCEEDED_MAX_SIZE)
    }

    await db.upsert({ _id: id }, { note: result, _id: id })

    service.emit('patch', { id, hash, patch, source })

    return { hash, patch }
  }

  const setNote = async (id: string, note: string): Promise<void> => {
    const existNote = await getNote(id)
    const patch = createPatch(existNote.note, note)
    const hash = hashString(note)
    await patchNote({ id, patch, hash })
  }

  const appendNote = async (id: string, append: string): Promise<void> => {
    const existNote = await getNote(id)
    const after = existNote.note + append
    const patch = createPatch(existNote.note, after)
    const hash = hashString(after)
    await patchNote({ id, patch, hash })
  }

  const getNote = async (id: string): Promise<Note> => {
    const note = await db.findOne({ _id: id })
    if (note) {
      return note
    }
    return {
      _id: id,
      note: '',
    }
  }

  const DEBUG_removeAllNote = async () => {
    console.info('-- remove all --')
    return await db.removeMulti({})
  }

  const destory = () => {
    clearInterval(pruneTimer)
    db.close()
    service.removeAllListeners()
  }
  const emitter = createEventEmitter<NoteEventMap>()

  const service = {
    ...emitter,
    getNote,
    setNote,
    appendNote,
    patchNote,
    destory,
    DEBUG_removeAllNote,
  }
  return service
}

export type NoteService = ReturnType<typeof createNoteService>
