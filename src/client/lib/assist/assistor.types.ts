export type EditorState = string

export interface Keys {
  key: string
  shift?: boolean
  ctrl_cmd?: boolean
  alt?: boolean
}

export interface Assistor {
  name: string
  keys: Keys
  transform: (state: EditorState) => EditorState | undefined
}

// TODO
export const START = '\u0000'
export const END = '\u0001'
export const CURSOR = `${START}${END}`
export const BULLET = '[\\-+*>]'
