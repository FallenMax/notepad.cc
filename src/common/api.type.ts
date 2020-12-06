import { Patch } from './lib/diff3'

export type ServerAPI = {
  subscribe(params: { id: string }): void
  unsubscribe(params: { id: string }): void
  get(params: { id: string }): { note: string }
  save(params: { id: string; p: Patch; h: number }): void
}
export const SERVER_APIS: (keyof ServerAPI)[] = [
  'get',
  'save',
  'subscribe',
  'unsubscribe',
]

export type ClientAPI = {
  noteUpdate(params: { id: string; h: number; p: Patch }): void
}

export const CLIENT_APIS: (keyof ClientAPI)[] = ['noteUpdate']
