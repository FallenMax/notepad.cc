import { BULLET, END, START, Transformer } from '../assistor.types'

// to list items:
// ===
//   - xxxIyyy
//   - yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
//   - xxxIyyy
//   - yyyyyyy
//   - yyyyyyy
//   - yyyIxxx
// ===

// from list items:
// ===
//   - xxxIyyy
//   - yyyyyyy
//   - yyyyyyy
//   - yyyIxxx
// ===
//   xxxIyyy
//   yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
const BULLET_REG = new RegExp(`^( *)(${BULLET})( *)`, 'm')
const BLOCK_REG = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'm')
const CURSOR_REG = new RegExp(`(${START}|${END})`, 'mg')

export const toggleList: Transformer = (state) => {
  const match = BLOCK_REG.exec(state)

  if (match) {
    const [matched] = match
    const lines = matched.replace(CURSOR_REG, '').split('\n')
    const everyLineHasBullet = lines.every((line) =>
      line.trim() ? BULLET_REG.test(line) : true,
    )
    const prependBullet = (line: string) => {
      const match = BULLET_REG.exec(line)
      if (match) {
        return line
      } else {
        if (line.trim()) {
          return line.replace(/^ */gm, (match) => {
            return match + '- '
          })
        } else {
          return line
        }
      }
    }
    const stripBullet = (line: string) => {
      const match = BULLET_REG.exec(line)
      if (match) {
        return line.replace(
          BULLET_REG,
          (match, leadingSpaces, bullet, gapSpaces) => {
            return leadingSpaces
          },
        )
      } else {
        return line
      }
    }
    const transformed = lines
      .map(everyLineHasBullet ? stripBullet : prependBullet)
      .join('\n')
    return state.replace(matched, START + transformed + END)
  }
}
