import * as path from 'path'
import { env, isDev } from './utils/env'

const rootDir = isDev
  ? path.resolve(__dirname, '../../')
  : path.resolve(__dirname, '../')

export const config = {
  port: Number(env.PORT || 3333),
  dataDir: env.DATA_DIR || path.resolve(rootDir, './data'),
  mongodb: {
    url: env.MONGODB_URL || `mongodb://localhost:27017`,
    database: env.MONGODB_DATABASE || 'notepad_dev',
  },
  staticDir: path.resolve(rootDir, './public'),
}
