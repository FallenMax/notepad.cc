export type EditorState = string

export interface Keys {
  key: string
  shift?: boolean
  ctrl?: boolean // === 'Command' key in MacOS
  alt?: boolean
}

export interface Assistor {
  name: string
  keys: Keys
  transform: (state: EditorState) => EditorState | undefined
}

// export const START = '\u0000'
// export const END = '\u0001'
export const START = '左'
export const END = '右'
export const CURSOR = `${START}${END}`
export const BULLET = '[\\-+*>]'
