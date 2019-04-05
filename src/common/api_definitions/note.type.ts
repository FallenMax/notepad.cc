import { Patch } from '../lib/diff3'

export type NoteApiMapping = {
  subscribe: { params: { id: string } }
  unsubscribe: { params: { id: string } }
  get: {
    params: { id: string }
    result: { note: string }
  }
  save: {
    params: { id: string; p: Patch; h: number }
    result: { errcode?: 'HASH_MISMATCH' | 'EXCEEDED_MAX_SIZE' }
  }
}
