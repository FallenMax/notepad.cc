const IO = require('socket.io')
const notes = require('../service/note')
const http = require('http')

module.exports = app => {

  app.server = http.Server(app.callback())
  const io = IO(app.server)


  io.on('connection', function(socket) {

    socket.on('subscribe', async function({ id }) {
      if (!socket.rooms[id]) {
        socket.join(id);
      }
    })

    socket.on('get', async function({ id }, reply) {
      console.info(`fetching note for: ${id}`);
      let note = await notes.find({ id }) || await notes.init({ id })
      reply(note)
    })

    socket.on('save', async function(msg, reply) {
      const { id } = msg
      console.info(`saving note for: ${msg.id}`);
      const { error, notification } = await notes.upsert(msg)
      if (!error) {
        reply({})
        socket.to(msg.id).broadcast.emit('updated note', notification);
      } else {
        console.warn(error);
        reply({ error })
      }
    })
  })

}
