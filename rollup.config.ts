import { terser } from 'rollup-plugin-terser'
import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

function createConfig(input, filename) {
  return defineConfig({
    input,
    output: {
      file: 'dist/' + filename,
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
      // terser({
      //   keep_classnames: true,
      //   keep_fnames: true,
      //   ecma: 2015,
      // })
    ],
  })
}

export default () => {
  return [
    createConfig('src/injected/index.ts', 'injected.js'),
    createConfig('src/content/index.ts', 'content.js'),
    createConfig('src/background/index.ts', 'background.js'),
  ]
}