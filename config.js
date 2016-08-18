const {
  REMOTE_HOST,
  REMOTE_PORT,
  LOCAL_HOST,
  LOCAL_PORT
} = process.env

module.exports = {
  remote: {
    host: REMOTE_HOST || '127.0.0.1',
    port: REMOTE_PORT || 80
  },
  local: {
    host: LOCAL_HOST || 'localhost',
    port: LOCAL_PORT || 3000
  }
}