"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const randomstring_1 = __importDefault(require("randomstring"));
const string_hash_1 = __importDefault(require("string-hash"));
const database_1 = require("../lib/database");
const diff3_1 = require("../lib/diff3");
const NOTE_MAX_SIZE = 100000;
const Notes = database_1.Database('notes');
async function upsert({ id, p: patch, h: hash, }) {
    const existNote = (await Notes.findOne({ _id: id })) || (await exports.noteService.initialize({ id }));
    const newNote = diff3_1.applyPatch(existNote.note, patch);
    if (newNote == null || hash !== string_hash_1.default(newNote)) {
        throw { errcode: 'HASH_MISMATCH' };
    }
    if (newNote.length > NOTE_MAX_SIZE) {
        throw { errcode: 'EXCEEDED_MAX_SIZE' };
    }
    await Notes.upsert({ _id: id }, { note: newNote, _id: id });
    return { h: hash, p: patch };
}
async function removeEmptyNotes() {
    console.warn('removing empty notes...');
    const count = await Notes.removeMulti({ note: '' });
    console.warn(`${count} empty notes removed`);
}
setInterval(removeEmptyNotes, 1000 * 60 * 60);
exports.noteService = {
    initialize: ({ id }) => ({ _id: id, note: '' }),
    find: ({ id }) => Notes.findOne({ _id: id }),
    upsert,
    genRandomId() {
        return randomstring_1.default.generate({
            length: 8,
            readable: true,
            charset: 'alphabetic',
            capitalization: 'lowercase',
        });
    },
};
//# sourceMappingURL=note.js.map