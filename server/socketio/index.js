const IO = require('socket.io')
const notes = require('../service/note')
const http = require('http')

module.exports = app => {

  app.server = http.Server(app.callback())
  const io = IO(app.server)

  io.on('connection', function(socket) {

    socket.on('enter', async ({ id }) => {
      console.log("id ", id);
      socket.join(id)
    })

    socket.on('save', async ({ id, note }, reply) => {
      console.info(`saving note for: ${id}`);
      await notes.upsert({ id, note })
      reply({ code: 'success' })
      socket.to(id).broadcast.emit('updated note', { note });
    })
  });

}
