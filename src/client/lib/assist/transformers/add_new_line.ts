import { BULLET, CURSOR, Transformer } from '../assistor.types'

// ===
//   - xxxIyyy
// ===
//   - xxx
//   - Iyyy
// ===

export const addNewLine: Transformer = (state) => {
  const reg = new RegExp(`^( *)(${BULLET})?(.*)${CURSOR}(.*)$`, 'gm')
  const match = reg.exec(state)
  if (match) {
    const [matched, leadingSpaces, bullet, beforeCursor, afterCursor] = match
    if (leadingSpaces === '' && bullet === undefined) return undefined
    return state.replace(
      matched,
      beforeCursor === ' ' && afterCursor === ''
        ? `${CURSOR}`
        : bullet === undefined
        ? `${leadingSpaces}${beforeCursor}\n${leadingSpaces}${CURSOR}${afterCursor}`
        : `${leadingSpaces}${bullet}${beforeCursor}\n${leadingSpaces}${bullet} ${CURSOR}${afterCursor}`,
    )
  }
}
