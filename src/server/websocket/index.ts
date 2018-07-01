import WsServer from 'socket.io'
import { noteService } from '../service/note'

export const wsServer = WsServer()

wsServer.on('connection', function(socket) {
  socket.on('subscribe', async function({ id }: { id: string }) {
    if (!socket.rooms[id]) {
      socket.join(id)
    }
  })

  socket.on('get', async function({ id }: { id: string }, reply: Function) {
    console.info(`fetching note for: ${id}`)
    try {
      let note =
        (await noteService.find({ id })) ||
        (await noteService.initialize({ id }))
      reply(note)
    } catch (error) {
      console.error(error)
      reply({ error })
    }
  })

  socket.on('save', async function(msg: any, reply: Function) {
    console.info(`saving note for: ${msg.id}`)
    try {
      const update = await noteService.upsert(msg)
      reply({})
      socket.to(msg.id).broadcast.emit('note_update', update)
    } catch (error) {
      console.warn(error)
      reply({ error })
    }
  })
})
