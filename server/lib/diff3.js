const { patch, diffPatch, stripPatch } = require('node-diff3')
const diff3merge = require('diff3')

module.exports = {
  applyPatch: (a, p) => fromArr(patch(toArr(a), decompress(p))),
  merge3: (a, o, b) => {
    let { conflict, result } = merge(toArr(a), toArr(o), toArr(b))
    return conflict ? null : fromArr(result)
  },
  createPatch: (a, b) => compress(stripPatch(diffPatch(toArr(a), toArr(b)))),
}

const merge = (a, o, b) => {
  const results = diff3merge(a, o, b)
  const conflict = results.some(r => r.conflict)
  const result = results[0].ok
  return { conflict, result }
}

function toArr(str) {
  return str.split('\n')
}

function fromArr(str) {
  return str && str.join('\n')
}

function compress(patch) {
  return patch.map(({ file1: { offset, length }, file2: { chunk } }) => ({
    a: [offset, length],
    b: chunk,
  }))
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
  }))
}
