import { CURSOR, Transformer } from '../transformer.type'

// ===
//       []
// ===
// []
// ===

export const backDeleteToStart: Transformer = (state) => {
  const reg = new RegExp(`^( +)${CURSOR}(.*)$`, 'm')
  const match = reg.exec(state)
  if (match) {
    const [matched, leadingSpaces, afterCursor] = match
    return state.replace(matched, `${CURSOR}${afterCursor}`)
  }
}
