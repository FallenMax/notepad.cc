import { START, END, Transformer, CURSOR } from '../assistor.types'
// ===
//   xxxIyyy
// ===
//     xxxIyyy
// ===

const BLOCK_REG = new RegExp(`^.*${CURSOR}.*$`, 'm')

export const indentItem: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)
  if (match) {
    const [matched] = match
    const indent = (line: string) => '  ' + line
    return state.replace(matched, indent(matched))
  }
}
