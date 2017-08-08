const IO = require('socket.io')
const notes = require('../service/note')

module.exports = server => {
  const websocket = IO(server)

  websocket.on('connection', function(socket) {
    socket.on('subscribe', async function({ id }) {
      if (!socket.rooms[id]) {
        socket.join(id)
      }
    })

    socket.on('get', async function({ id }, reply) {
      console.info(`fetching note for: ${id}`)
      try {
        let note = (await notes.find({ id })) || (await notes.init({ id }))
        reply(note)
      } catch (error) {
        console.error(error)
        reply({ error })
      }
    })

    socket.on('save', async function(msg, reply) {
      console.info(`saving note for: ${msg.id}`)
      try {
        const notification = await notes.upsert(msg)
        reply({})
        socket.to(msg.id).broadcast.emit('updated note', notification)
      } catch (error) {
        console.warn(error)
        reply({ error })
      }
    })
  })
}
