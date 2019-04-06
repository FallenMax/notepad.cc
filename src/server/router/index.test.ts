import { noteService } from '../service/note'
import { config } from '../config'
import { quit, start } from '..'
import axios from 'axios'

const port = config.port
const host = `http://localhost:${port}`

describe('routes', () => {
  beforeAll(async () => {
    await start()
  })

  afterAll(async () => {
    await quit()
  })

  beforeEach(async () => {
    await noteService.DEBUG_removeAllNote()
  })

  test('GET /api', async () => {
    const result = (await axios.get(`${host}/api`)).data
    expect(result).toBe('api')
  })

  describe('api:note', () => {
    test('GET /api/note', async () => {
      const result = (await axios.post(`${host}/api/note`, { note: 'abc' }))
        .data
      expect(result.note).toBe('abc')
      expect(typeof result.id).toBe('string')
      expect(result.id.length).not.toBe(0)
    })

    test('POST /api/note', async () => {
      const content = 'abc'
      const result = (await axios.post(`${host}/api/note`, { note: content }))
        .data
      expect(result.note).toBe(content)
      expect(typeof result.id).toBe('string')
      expect(result.id.length).not.toBe(0)

      const fetched = (await axios.get(`${host}/api/note`, {
        params: { id: result.id },
      })).data
      expect(fetched.note).toBe(content)
    })

    test('PUT /api/note', async () => {
      const id = '123'
      const note = 'abc'

      await axios.put(`${host}/api/note`, { id, note: note })
      const result = (await axios.get(`${host}/api/note`, {
        params: { id },
      })).data
      expect(result.note).toBe(note)

      const note2 = 'def'
      await axios.put(`${host}/api/note`, { id, note: note2 })
      const result2 = (await axios.get(`${host}/api/note`, {
        params: { id },
      })).data
      expect(result2.note).toBe(note2)
    })

    test('PATCH /api/note', async () => {
      const id = '123'
      const note = 'abc'
      const toAppend = 'def'

      await axios.put(`${host}/api/note`, { id, note: note })
      let patchResult = await axios.patch(`${host}/api/note`, {
        id,
        append: toAppend,
      })

      const result2 = (await axios.get(`${host}/api/note`, {
        params: { id },
      })).data
      expect(result2.note).toBe([note, toAppend].join(''))
    })

    test('DEL /api/note', async () => {
      const id = '123'
      const note = 'abc'

      await axios.put(`${host}/api/note`, { id, note: note })
      await axios.delete(`${host}/api/note`, { params: { id } })

      const result2 = (await axios.get(`${host}/api/note`, {
        params: { id },
      })).data
      expect(result2.note).toBe('')
    })
  })

  describe('api:items', () => {
    test('GET /api/items', async () => {
      const result = (await axios.post(`${host}/api/note`, {
        note: [
          JSON.stringify({ id: 'x', value: 'xx' }),
          JSON.stringify({ id: 'y', value: 'yy' }),
          JSON.stringify({ id: 'z', value: 'zz' }),
        ].join('\n'),
      })).data

      const items = (await axios.get(`${host}/api/items`, {
        params: {
          id: result.id,
          query: { id: 'y' },
        },
      })).data
      expect(items).toEqual([{ id: 'y', value: 'yy' }])
    })

    test('GET /api/item', async () => {
      const result = (await axios.post(`${host}/api/note`, {
        note: [
          JSON.stringify({ id: 'x', value: 'xx' }),
          JSON.stringify({ id: 'y', value: 'yy' }),
          JSON.stringify({ id: 'z', value: 'zz' }),
        ].join('\n'),
      })).data

      const item = (await axios.get(`${host}/api/item`, {
        params: {
          id: result.id,
          query: { id: 'y' },
        },
      })).data
      expect(item).toEqual({ id: 'y', value: 'yy' })

      const item2 = (await axios.get(`${host}/api/item`, {
        params: {
          id: result.id,
          query: { id: 'nonexist' },
        },
      })).data
      expect(item2).toEqual(null)
    })

    test('POST /api/item', async () => {
      const result = (await axios.post(`${host}/api/note`, {
        note: [
          JSON.stringify({ id: 'x', value: 'xx' }),
          JSON.stringify({ id: 'y', value: 'yy' }),
          JSON.stringify({ id: 'z', value: 'zz' }),
        ].join('\n'),
      })).data

      await axios.post(`${host}/api/item`, {
        id: result.id,
        item: { id: 'a', value: 'aa' },
      })

      const item2 = (await axios.get(`${host}/api/items`, {
        params: {
          id: result.id,
        },
      })).data
      expect(item2.length).toEqual(4)
    })
  })

  test('PUT /api/item', async () => {
    const result = (await axios.post(`${host}/api/note`, {
      note: [
        JSON.stringify({ id: 'x', value: 'xx' }),
        JSON.stringify({ id: 'y', value: 'yy' }),
        JSON.stringify({ id: 'z', value: 'zz' }),
      ].join('\n'),
    })).data

    await axios.put(`${host}/api/item`, {
      id: result.id,
      query: { id: 'y' },
      item: { id: 'a', value: 'aa' },
    })

    const item2 = (await axios.get(`${host}/api/items`, {
      params: {
        id: result.id,
      },
    })).data
    expect(item2.length).toEqual(3)
    expect(item2[0]).toEqual({ id: 'x', value: 'xx' })
    expect(item2[1]).toEqual({ id: 'a', value: 'aa' })
    expect(item2[2]).toEqual({ id: 'z', value: 'zz' })

    expect(
      axios.put(`${host}/api/item`, {
        id: result.id,
        query: { id: 'xxx' },
        item: { id: 'a', value: 'aa' },
      }),
    ).rejects.toThrow()
  })

  test('PATCH /api/item', async () => {
    const result = (await axios.post(`${host}/api/note`, {
      note: [
        JSON.stringify({ id: 'x', value: 'xx' }),
        JSON.stringify({ id: 'y', value: 'yy' }),
        JSON.stringify({ id: 'z', value: 'zz' }),
      ].join('\n'),
    })).data

    await axios.patch(`${host}/api/item`, {
      id: result.id,
      query: { id: 'y' },
      update: { value: 'aa' },
    })

    const item2 = (await axios.get(`${host}/api/items`, {
      params: {
        id: result.id,
      },
    })).data
    expect(item2.length).toEqual(3)
    expect(item2[0]).toEqual({ id: 'x', value: 'xx' })
    expect(item2[1]).toEqual({ id: 'y', value: 'aa' })
    expect(item2[2]).toEqual({ id: 'z', value: 'zz' })

    expect(
      axios.patch(`${host}/api/item`, {
        id: result.id,
        query: { id: 'xxx' },
        update: { id: 'a', value: 'aa' },
      }),
    ).rejects.toThrow()
  })

  test('DELETE /api/item', async () => {
    const result = (await axios.post(`${host}/api/note`, {
      note: [
        JSON.stringify({ id: 'x', value: 'xx' }),
        JSON.stringify({ id: 'y', value: 'yy' }),
        JSON.stringify({ id: 'z', value: 'zz' }),
      ].join('\n'),
    })).data

    await axios.delete(`${host}/api/item`, {
      params: { id: result.id, query: { id: 'y' } },
    })

    const item2 = (await axios.get(`${host}/api/items`, {
      params: {
        id: result.id,
      },
    })).data
    expect(item2.length).toEqual(2)
    expect(item2[0]).toEqual({ id: 'x', value: 'xx' })
    // expect(item2[1]).toEqual({ id: 'a', value: 'aa' })
    expect(item2[1]).toEqual({ id: 'z', value: 'zz' })

    expect(
      axios.put(`${host}/api/item`, {
        id: result.id,
        query: { id: 'xxx' },
        item: { id: 'a', value: 'aa' },
      }),
    ).rejects.toThrow()
  })
})
