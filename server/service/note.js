const Database = require('../lib/database')
const { createPatch, applyPatch, merge3 } = require('../lib/diff3')
const hashString = require('string-hash')
const randomstring = require('randomstring')
const notes = Database('notes')

const api = {
  init: ({ id }) => ({ _id: id, note: '' }),
  find: ({ id }) => notes.findOne({ _id: id }),
  upsert: upsert,
  randomId: () => randomstring.generate({ length: 8, readable: true, charset: 'alphabetic', capitalization: 'lowercase' })
}

setInterval(removeEmptyNotes, 1000 * 60 * 60)

module.exports = api



async function upsert({ id, p: patch, h: hash }) {
  try {
    let existNote = (await notes.findOne({ _id: id })) || (await api.init({ id }))
    let newNote = applyPatch(existNote.note, patch)
    if (newNote == null || hash !== hashString(newNote)) {
      return { error: 'HASH_MISMATCH' }
    } else {
      await notes.upsert({ _id: id }, { _id: id, note: newNote })
      return { notification: { h: hash, p: patch } }
    }
  } catch (e) {
    console.error(e);
    return { error: e && e.message || 'UNKNOWN_ERROR' }
  }
}

async function removeEmptyNotes() {
  console.warn('removing empty notes...')
  const count = await notes.removeMulti({ note: '' })
  console.warn(`${count} empty notes removed`);
}
