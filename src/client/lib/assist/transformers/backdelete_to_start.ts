import { CURSOR, Transformer } from '../assistor.types'

// ===
//       I
// ===
// I
// ===

export const backDeleteToStart: Transformer = (state) => {
  const reg = new RegExp(`^( +)${CURSOR}(.*)$`, 'gm')
  const match = reg.exec(state)
  if (match) {
    const [matched, leadingSpaces, afterCursor] = match
    return state.replace(matched, `${CURSOR}${afterCursor}`)
  }
}
