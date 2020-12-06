import { ClientAPI, ServerAPI } from '../../common/api.type'
import { RpcServer } from '../lib/rpc_server'
import { noteService } from '../service/note.service.'

export const noteController = (rpc: RpcServer<ServerAPI, ClientAPI>) => {
  rpc.handle('subscribe', ({ id }, client) => {
    rpc.joinRoom(client.id, id)
  })

  rpc.handle('get', async ({ id }, client) => {
    return await noteService.getNote(id)
  })

  rpc.handle('save', async ({ id, p, h }, client) => {
    console.info(`saving note for: ${id}`)
    await noteService.patchNote({
      id,
      patch: p,
      hash: h,
      source: client.id,
    })
  })

  noteService.on('patch', ({ id, hash, patch, source }) => {
    rpc.call(
      'noteUpdate',
      { id, h: hash, p: patch },
      {
        rooms: [id],
        exclude: source,
      },
    )
  })
}
