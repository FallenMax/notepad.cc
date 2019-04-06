export const generateId = (len = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyz'
  let chars: string[] = []
  for (let index = 0; index < len; index++) {
    chars[index] = charset[Math.floor(Math.random() * charset.length)]
  }
  return chars.join('')
}
