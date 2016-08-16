const Database = require('../lib/database')
const randomstring = require("randomstring")
const notes = Database('notes')

module.exports = {
  find: ({ id }) => notes.findOne({ _id: id }),
  upsert: ({ id, note }) => notes.upsert({ _id: id }, { _id: id, note: note }),
  randomId: () => randomstring.generate({length: 8,readable:true, charset: 'alphabetic', capitalization: 'lowercase'})
}
