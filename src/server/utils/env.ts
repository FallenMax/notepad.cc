export const env = process.env

export const isDev = /(dev|test)/.test(env.NODE_ENV || '')
export const isTesting = /test/.test(env.NODE_ENV || '')
