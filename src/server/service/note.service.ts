import hashString = require('string-hash')
import { Disposable } from '../../common/disposable'
import { ErrorCode, UserError } from '../../common/error'
import { applyPatch, Patch } from '../../common/lib/diff3'
import { DbConnection, Table } from '../lib/database'

const NOTE_MAX_SIZE = 100000

type Hash = number

export interface Note {
  _id: string
  note: string
}

interface PatchNodeOptions {
  id: string
  patch: Patch
  hash: Hash
  source?: string
}

export class NoteService extends Disposable {
  private table: Table<Note>

  constructor(private connection: DbConnection) {
    super()
    this.table = new Table<Note>(this.connection, 'notes')
  }

  private patchPromise = Promise.resolve() as unknown as ReturnType<
    NoteService['doPatchNote']
  >
  async patchNote(options: PatchNodeOptions) {
    // Queue changes to avoid race condition
    await Promise.allSettled([this.patchPromise])
    this.patchPromise = this.doPatchNote(options)
    return this.patchPromise
  }
  private async doPatchNote({
    id,
    patch,
    hash,
    source,
  }: PatchNodeOptions): Promise<{ hash: number; patch: Patch }> {
    const existNote = await this.getNote(id)

    const result = applyPatch(existNote.note, patch)
    if (result == null || hash !== hashString(result)) {
      throw new UserError(ErrorCode.HASH_MISMATCH)
    }
    if (result.length > NOTE_MAX_SIZE) {
      throw new UserError(ErrorCode.EXCEEDED_MAX_SIZE)
    }

    if (result.length === 0) {
      await this.table.remove({ _id: id })
    } else {
      await this.table.upsert({ _id: id }, { note: result, _id: id })
    }
    return { hash, patch }
  }

  async getNote(id: string): Promise<Note> {
    const note = await this.table.findOne({ _id: id })
    if (note) {
      return note
    }
    return {
      _id: id,
      note: '',
    }
  }
}
