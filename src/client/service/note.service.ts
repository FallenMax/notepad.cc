import { NoteApiMapping } from '../../common/api_definitions/note.type'
import { Patch } from '../lib/diff3'

const rpc = <T extends keyof NoteApiMapping>(
  socket: SocketIOClient.Socket,
  event: T,
  params: NoteApiMapping[T]['params'],
): Promise<
  NoteApiMapping[T] extends { result } ? NoteApiMapping[T]['result'] : void
> =>
  new Promise((resolve, reject) => {
    socket.emit(event, params, resolve)
  })

export const createNoteService = ({
  socket,
  id,
}: {
  socket: SocketIOClient.Socket
  id: string
}) => {
  const subscribe = () => rpc(socket, 'subscribe', { id })

  const fetchNote = () => rpc(socket, 'get', { id })

  const saveNote = (patch: Patch, hash: number) =>
    rpc(socket, 'save', { id, p: patch, h: hash })

  return { subscribe, fetchNote, saveNote }
}
