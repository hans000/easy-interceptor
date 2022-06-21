import { terser } from 'rollup-plugin-terser'
import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import * as path from 'path'
import externalGlobals from 'rollup-plugin-external-globals'

const isLocal = !!process.env.VITE_LOCAL
const dist = isLocal ? 'local' : 'cdn'

function createConfig(input, filename) {
  return defineConfig({
    input,
    output: {
      file: path.join('dist', dist, filename),
      format: 'iife',
      name: filename,
    },
    plugins: [
      commonjs(),
      resolve(),
      typescript({
        tsconfig: 'tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      !isLocal && externalGlobals({
        minimatch: "minimatch"
      }),
      replace({
        preventAssignment: true,
        'process.env.VITE_LOCAL': JSON.stringify(process.env.VITE_LOCAL),
      }),
      // terser({
      //   keep_classnames: true,
      //   keep_fnames: true,
      //   ecma: 2015,
      // })
    ].filter(Boolean),
  })
}

export default () => {
  return [
    createConfig('src/injected/index.ts', 'injected.js'),
    createConfig('src/content/index.ts', 'content.js'),
    createConfig('src/background/index.ts', 'background.js'),
  ]
}