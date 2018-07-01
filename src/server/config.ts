const env = process.env

export interface Config {
  port: number
}

export const config: Config = {
  port: Number(env.PORT || 3000),
}
