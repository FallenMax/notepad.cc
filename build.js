const rollup = require('rollup')
const nodeResolve = require('rollup-plugin-node-resolve')
const buble = require('rollup-plugin-buble')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')

const isProd = process.env.NODE_ENV === 'production'

module.exports = function() {
  return rollup
    .rollup({
      entry: 'client/index.js',
      plugins: [
        nodeResolve({ jsnext: true, main: true }),
        commonjs(),
        buble(),
        isProd && uglify()
      ].filter(Boolean)
    })
    .then(function(bundle) {
      return bundle.write({
        format: 'iife',
        dest: 'public/script/bundle.js'
      })
    })
}
