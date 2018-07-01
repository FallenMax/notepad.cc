import Datastore from 'nedb'
import path from 'path'
import { promisifyAll } from './promisify'

export interface Id {
  _id: string
}

export interface Database<T> {
  name: string
  add: (item: T) => Promise<void>
  find: (query: Partial<T & Id>) => Promise<(T & Id)[]>
  findOne: (query: Partial<T & Id>) => Promise<(T & Id) | undefined>
  findAll: () => Promise<(T & Id)[]>
  remove: (query: Partial<T & Id>) => Promise<void>
  removeMulti: (query: Partial<T & Id>) => Promise<void>
  update: (query: Partial<T & Id>, item: Partial<T>) => Promise<void>
  upsert: (query: Partial<T & Id>, item: Partial<T>) => Promise<void>
  setIndex(field: keyof T): void
}

const cache: { [key: string]: Nedb & any } = {}

export function Database<T>(name: string): Database<T> {
  cache[name] =
    cache[name] ||
    promisifyAll(
      new Datastore({
        filename: path.resolve(__dirname, '../../data/', name),
        timestampData: true,
        autoload: true,
      })
    )

  const db = cache[name]

  db.persistence.setAutocompactionInterval(1000 * 60 * 60)

  return {
    name,
    add: item => db.insertAsync(item),
    find: query => db.findAsync(query),
    findOne: query => db.findOneAsync(query),
    findAll: () => db.findAsync({}),
    remove: query => db.removeAsync(query),
    removeMulti: query => db.removeAsync(query, { multi: true }),
    update: (query, item) => db.updateAsync(query, item),
    upsert: (query, item) => db.updateAsync(query, item, { upsert: true }),
    setIndex(field) {
      db.ensureIndex({
        filename: field,
        unique: true,
      })
    },
  }
}
