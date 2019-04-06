import { START, END, Transformer, CURSOR } from '../assistor.types'

// ===
//     xxxIyyy
// ===
//   xxxIyyy
// ===

const BLOCK_REG = new RegExp(`^.*${CURSOR}.*$`, 'm')

export const deindentItem: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)
  if (match) {
    const [matched] = match
    const deindent = (line: string) =>
      line.replace(/^ /m, '').replace(/^ /m, '')
    return state.replace(matched, deindent(matched))
  }
}
