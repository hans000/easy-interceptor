/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import replace from '@rollup/plugin-replace';
import * as path from 'path'
import cdnImport from 'vite-plugin-cdn-import'
import { version, name } from './public/manifest.json'

const isLocal = !!process.env.VITE_LOCAL
const dist = name.toLowerCase().replace(' ', '-') + '-v' + version + (isLocal ? '-local' : '-cdn')

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: { javascriptEnabled: true }
    }
  },
  build: {
    outDir: path.join('dist', dist),
    target: 'esnext',
    rollupOptions: {
      external: isLocal
        ? [] 
        : [ 'react', 'react-dom' ]
    }
  },
  plugins: [
    react(),
    !isLocal && cdnImport({
      modules: [
        {
          name: 'react-is',
          var: 'ReactIs',
          path: [
            'https://unpkg.com/react-is@17.0.2/umd/react-is.production.min.js',
          ],
        },
        {
          name: 'prop-types',
          var: 'PropTypes',
          path: [
            'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
          ],
        },
        {
          name: 'state-local',
          var: 'state',
          path: [
            'https://unpkg.com/state-local@1.0.7/lib/umd/state-local.min.js'
          ]
        },
        {
          name: 'dayjs',
          var: 'dayjs',
          path: [
            'https://unpkg.com/dayjs@1.11.10/dayjs.min.js',
          ],
        },
        {
          name: 'react',
          var: 'React',
          path: [
            'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
          ],
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: [
            'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
          ],
        },
        {
          name: 'json-schema',
          var: 'jsonSchema',
          path: [
            'https://unpkg.com/json-schema@0.4.0/lib/validate.js',
          ],
        },
        {
          name: '@ant-design/icons',
          var: 'icons',
          path: [
            'https://unpkg.com/@ant-design/icons@5.2.6/dist/index.umd.js',
          ],
        },
        {
          name: 'antd',
          var: 'antd',
          path: [
            'https://unpkg.com/antd@5.12.8/dist/antd.min.js',
          ],
        },
        {
          name: '@monaco-editor/loader',
          var: 'monaco_loader',
          path: [
            'https://unpkg.com/@monaco-editor/loader@1.3.2/lib/umd/monaco-loader.min.js',
          ],
        },
        {
          name: '@monaco-editor/react',
          var: 'monaco_react',
          path: [
            'https://unpkg.com/@monaco-editor/react@4.4.5/lib/umd/monaco-react.min.js',
          ]
        },
      ]
    }) as any,
    replace({
      preventAssignment: true,
      'process.env.VITE_LOCAL': JSON.stringify(process.env.VITE_LOCAL),
      'process.env.VITE_VS': JSON.stringify('https://unpkg.com/monaco-editor@0.33.0/min/vs'),
    }),
  ].filter(Boolean)
})
