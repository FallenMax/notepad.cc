const env = process.env

const PARCEL_PORT = 1234
const port = Number(
  env.PORT
    ? env.PORT
    : Number(location.port) === PARCEL_PORT
    ? 3333
    : location.port,
)

const hostname = env.HOST_NAME || location.hostname
const host = port ? `${hostname}:${port}` : hostname

export const config = {
  GA_ID: 'UA-84154809-1',
  host,
}
