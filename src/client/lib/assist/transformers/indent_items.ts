import { START, END, Transformer } from '../assistor.types'
// ===
//   xxxIyyy
//   yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
//     xxxIyyy
//     yyyyyyy
//     yyyyyyy
//     yyyIxxx
// ===

const BLOCK_REG = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'gm')

export const indentItems: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)
  if (match) {
    const [matched] = match
    const indent = (line: string) => '  ' + line
    const lines = matched
      .split('\n')
      .map(indent)
      .join('\n')
    return state.replace(matched, lines)
  }
}
