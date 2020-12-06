import * as MongoDB from 'mongodb'
import { config } from '../config'
import { wait } from '../utils/wait'

export interface Id {
  _id: string
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] | DeepPartial<T[P]> | undefined
}
type Nullable<T> = {
  [P in keyof T]?: T[P] | null | undefined
}

export type FindOption<T> = {
  sort?: { [K in keyof T]?: -1 | 1 }
  limit?: number
  skip?: number
}
export interface Database<T extends Id> {
  add: (item: T) => Promise<void>
  addMulti: (items: T[]) => Promise<void>
  find: (query: DeepPartial<T>, option?: FindOption<T>) => Promise<T[]>
  findOne: (query: DeepPartial<T>) => Promise<T | undefined>
  findAll: (option?: FindOption<T>) => Promise<T[]>
  count: (query: DeepPartial<T>) => Promise<number>
  remove: (query: DeepPartial<T>) => Promise<void>
  removeMulti: (query: DeepPartial<T>) => Promise<void>
  update: (query: DeepPartial<T> & Id, item: Nullable<T>) => Promise<T>
  upsert: (query: DeepPartial<T> & Id, item: T) => Promise<void>
  setIndex(field: keyof T): void
  close: () => void
}

let client: MongoDB.MongoClient | undefined
let mongoDatabase: MongoDB.Db | undefined

let openedClient = 0

const filterObject = <T>(
  o: Record<string, T>,
  predicate: (value: T, key: string, obj: Record<string, T>) => boolean,
): Record<string, T> => {
  let filtered = {} as Record<string, T>
  for (const [key, value] of Object.entries(o)) {
    if (predicate(value, key, o)) {
      filtered[key] = value
    }
  }
  return filtered
}

export const connectDatabase = async () => {
  openedClient++
  if (client) {
    return
  }
  const url = config.mongodb.url
  const dbName = config.mongodb.database

  console.info('[mongodb] connect')
  client = await MongoDB.MongoClient.connect(url, {
    useUnifiedTopology: true,
  })
  mongoDatabase = client.db(dbName)

  return client
}

export const disconnectDatabase = async () => {
  openedClient--
  if (!client) {
    throw new Error('[mongodb] no active client')
  }
  if (openedClient <= 0) {
    console.warn('[mongodb] disconnecting after 1sec...')
    await wait(1000)
    if (openedClient <= 0) {
      console.info('[mongodb] disconnect')
      await client.close()
      client = undefined
      mongoDatabase = undefined
    }
  }
}

export function openDatabase<T extends Id>(name: string): Database<T> {
  let db: MongoDB.Collection = mongoDatabase!.collection(name)
  let indices: { [K in keyof T]?: number } | undefined = {}

  const database: Database<T> = {
    add: async (item) => {
      await db.insertOne(item as any)
    },
    addMulti: async (items) => {
      await db.insertMany(items as any)
    },
    // @ts-ignore
    find: async (query, option) => {
      let { limit, skip, sort } = option || {}
      let cursor = db.find(query)
      if (sort) {
        cursor = cursor.sort(sort)
      }
      if (skip) {
        cursor = cursor.skip(skip)
      }
      if (limit) {
        if (Number.isFinite(limit)) {
          cursor = cursor.limit(limit)
        }
      }
      return await cursor.toArray()
    },
    count: async (query) => {
      return await db.countDocuments(query)
    },
    findOne: async (query) => {
      return (await db.findOne(query)) || undefined
    },
    // @ts-ignore
    findAll: async (option) => {
      // @ts-ignore
      return await database.find({}, option)
    },
    remove: async (query) => {
      await db.deleteOne(query)
    },
    removeMulti: async (query) => {
      await db.deleteMany(query)
    },
    update: async (query, item) => {
      await db.updateOne(query, {
        $set: filterObject(item as any, (value) => value !== undefined) as any,
      })
      return (await database.findOne(query))!
    },
    upsert: async (query, item) => {
      await db.updateOne(query, { $set: item }, { upsert: true })
    },
    setIndex: async (field) => {
      if (!indices) {
        indices = {}
      }
      indices[field] = 1
    },
    close: () => {},
  }

  return database
}
