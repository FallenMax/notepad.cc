const { applyPatch } = require('../lib/diff3')
const hashString = require('string-hash')
const randomstring = require('randomstring')
const Notes = require('../lib/database')('notes')

const api = {
  init: ({ id }) => ({ _id: id, note: '' }),
  find: ({ id }) => Notes.findOne({ _id: id }),
  upsert,
  randomId,
}

setInterval(removeEmptyNotes, 1000 * 60 * 60)

module.exports = api

const NOTE_MAX_SIZE = 100000

async function upsert({ id, p: patch, h: hash }) {
  const existNote =
    (await Notes.findOne({ _id: id })) || (await api.init({ id }))
  const newNote = applyPatch(existNote.note, patch)
  if (newNote == null || hash !== hashString(newNote)) {
    throw { errcode: 'HASH_MISMATCH' }
  }
  if (newNote.length > NOTE_MAX_SIZE) {
    throw { errcode: 'EXCEEDED_MAX_SIZE' }
  }
  await Notes.upsert({ _id: id }, { _id: id, note: newNote })
  return { h: hash, p: patch }
}

async function removeEmptyNotes() {
  console.warn('removing empty notes...')
  const count = await Notes.removeMulti({ note: '' })
  console.warn(`${count} empty notes removed`)
}

function randomId() {
  return randomstring.generate({
    length: 8,
    readable: true,
    charset: 'alphabetic',
    capitalization: 'lowercase',
  })
}
