const promisifyAll = require('bluebird').promisifyAll
const Datastore = require('nedb')
const path = require('path')
promisifyAll(Datastore.prototype)

let cache = {}


function Database(name) {
  let db =  cache[name] || new Datastore({
      filename: path.resolve(__dirname, '../../data/', name),
      timestampData: true,
      autoload: true
  })
  db.persistence.setAutocompactionInterval(1000 * 60 * 60)
  return {
    name,
    add: item => db.insertAsync(item),
    find: query => db.findAsync(query),
    findOne: query => db.findOneAsync(query),
    findAll: () => db.findAsync({}),
    insert: item => db.insertAsync(item),
    remove: query => db.removeAsync(query),
    removeMulti: query => db.removeAsync(query, { multi: true }),
    update: (query, item) => db.updateAsync(query, item),
    upsert: (query, item) => db.updateAsync(query, item, {upsert: true})
  }
}

module.exports = Database
