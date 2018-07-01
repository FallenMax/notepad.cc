import randomstring from 'randomstring'
import hashString from 'string-hash'
import { Database } from '../lib/database'
import { Patch, applyPatch } from '../lib/diff3'

const NOTE_MAX_SIZE = 100000

export interface Note {
  _id: string
  note: string
}

const Notes = Database<Note>('notes')

type Hash = number

async function upsert({
  id,
  p: patch,
  h: hash,
}: {
  id: string
  p: Patch
  h: Hash
}) {
  const existNote =
    (await Notes.findOne({ _id: id })) || (await noteService.initialize({ id }))
  const newNote = applyPatch(existNote.note, patch)
  if (newNote == null || hash !== hashString(newNote)) {
    throw { errcode: 'HASH_MISMATCH' }
  }
  if (newNote.length > NOTE_MAX_SIZE) {
    throw { errcode: 'EXCEEDED_MAX_SIZE' }
  }
  await Notes.upsert({ _id: id }, { note: newNote, _id: id })
  return { h: hash, p: patch }
}

async function removeEmptyNotes() {
  console.warn('removing empty notes...')
  const count = await Notes.removeMulti({ note: '' })
  console.warn(`${count} empty notes removed`)
}

setInterval(removeEmptyNotes, 1000 * 60 * 60)

export const noteService = {
  initialize: ({ id }: { id: string }): Note => ({ _id: id, note: '' }),
  find: ({ id }: { id: string }) => Notes.findOne({ _id: id }),
  upsert,
  genRandomId() {
    return randomstring.generate({
      length: 8,
      readable: true,
      charset: 'alphabetic',
      capitalization: 'lowercase',
    })
  },
}
