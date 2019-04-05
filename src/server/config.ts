import * as path from 'path'
import { isDev, env } from './utils/env'

const rootDir = isDev
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../')

export const config = {
  port: Number(env.PORT || 3333),
  dataDir: env.DATA_DIR || path.resolve(rootDir, './data'),
  staticDir: path.resolve(rootDir, './public'),
}
