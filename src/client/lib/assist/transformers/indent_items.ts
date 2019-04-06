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
export const indentItems: Transformer = (state) => {
  console.log('indent')
  const reg = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'gm')
  const match = reg.exec(state)
  console.log('match ', match)
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
