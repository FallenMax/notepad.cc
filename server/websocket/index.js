"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const note_1 = require("../service/note");
exports.wsServer = socket_io_1.default();
exports.wsServer.on('connection', function (socket) {
    socket.on('subscribe', async function ({ id }) {
        if (!socket.rooms[id]) {
            socket.join(id);
        }
    });
    socket.on('get', async function ({ id }, reply) {
        console.info(`fetching note for: ${id}`);
        try {
            let note = (await note_1.noteService.find({ id })) ||
                (await note_1.noteService.initialize({ id }));
            reply(note);
        }
        catch (error) {
            console.error(error);
            reply({ error });
        }
    });
    socket.on('save', async function (msg, reply) {
        console.info(`saving note for: ${msg.id}`);
        try {
            const update = await note_1.noteService.upsert(msg);
            reply({});
            socket.to(msg.id).broadcast.emit('note_update', update);
        }
        catch (error) {
            console.warn(error);
            reply({ error });
        }
    });
});
//# sourceMappingURL=index.js.map