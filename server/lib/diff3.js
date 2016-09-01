const { patch, merge, diffPatch, stripPatch } = require('node-diff3').diff

module.exports = {
  applyPatch: (a, p) => patch(a, decompress(p)).join(''),
  merge3: (a, o, b) => {
    let { conflict, result } = merge(a, o, b)
    return conflict ? null : result.join('')
  },
  createPatch: (a, b) => compress(stripPatch(diffPatch(a, b)))
}

function compress(patch) {
  return patch.map(({ file1: { offset, length }, file2: { chunk } }) => ({
    a: [offset, length],
    b: chunk.join('')
  }))
}

function decompress(patch) {
  return patch.map(({ a, b }) => ({
    file1: {
      offset: a[0],
      length: a[1]
    },
    file2: {
      chunk: b.split('')
    }
  }))
}
