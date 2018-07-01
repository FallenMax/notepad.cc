"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const diff3_1 = __importDefault(require("diff3"));
const node_diff3_1 = require("node-diff3");
const merge = (a, o, b) => {
    const results = diff3_1.default(a, o, b);
    const conflict = results.some((r) => r.conflict);
    const result = results[0].ok;
    return { conflict, result };
};
function toArr(str) {
    return str.split('\n');
}
function fromArr(str) {
    return str && str.join('\n');
}
function compress(patch) {
    return patch.map(({ file1: { offset, length }, file2: { chunk } }) => ({
        a: [offset, length],
        b: chunk,
    }));
}
function decompress(patch) {
    return patch.map(({ a, b }) => ({
        file1: {
            offset: a[0],
            length: a[1],
        },
        file2: {
            chunk: b,
        },
    }));
}
exports.applyPatch = (a, p) => fromArr(node_diff3_1.patch(toArr(a), decompress(p)));
exports.merge3 = (a, o, b) => {
    let { conflict, result } = merge(toArr(a), toArr(o), toArr(b));
    return conflict ? null : fromArr(result);
};
exports.createPatch = (a, b) => compress(node_diff3_1.stripPatch(node_diff3_1.diffPatch(toArr(a), toArr(b))));
//# sourceMappingURL=diff3.js.map