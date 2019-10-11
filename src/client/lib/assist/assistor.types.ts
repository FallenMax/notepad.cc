export type EditorState = string

export interface Keys {
  key: string
  shift?: boolean
  ctrl_cmd?: boolean
  alt?: boolean
}

export type Transformer = (state: EditorState) => EditorState | undefined

export interface Assistor {
  keys: Keys
  hasSelection?: true | false | undefined
  transform: Transformer
}

// TODO
// export const START = '左'
// export const END = '右'
export const START = '\u0000'
export const END = '\u0001'
export const CURSOR = `${START}${END}`
export const BULLET = '-'
export const NOT_BULLET = '[^-]'
