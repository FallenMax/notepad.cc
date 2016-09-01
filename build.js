const path = require('path')
const swPrecache = require('sw-precache')
const rootDir = 'public'
const rollup = require('rollup')
const nodeResolve = require('rollup-plugin-node-resolve')
const buble = require('rollup-plugin-buble')
const commonjs = require('rollup-plugin-commonjs')
const uglify = require('rollup-plugin-uglify')

const isProd = process.env.NODE_ENV === 'production'

module.exports = function(cb) {

  rollup.rollup({
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
    .then(function() {
      swPrecache.write(path.join(rootDir, 'service-worker.js'), {
        staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
        stripPrefix: rootDir,
        handleFetch: process.env.NODE_ENV === 'production'
      }, cb)
    })
}
