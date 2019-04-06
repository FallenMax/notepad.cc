import { START, END, Transformer } from '../assistor.types'
// ===
//     xxxIyyy
//     yyyyyyy
//     yyyyyyy
//     yyyIxxx
// ===
//   xxxIyyy
//   yyyyyyy
//   yyyyyyy
//   yyyIxxx
// ===
export const deindentItems: Transformer = (state) => {
  const reg = new RegExp(`^.*${START}(\n|.)*${END}.*$`, 'gm')
  const match = reg.exec(state)
  if (match) {
    const [matched] = match
    const deindent = (str: string) => str.replace(/^ /, '').replace(/^ /, '')
    const lines = matched
      .split('\n')
      .map(deindent)
      .join('\n')
    return state.replace(matched, lines)
  }
}
