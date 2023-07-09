/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import styleImport from 'vite-plugin-style-import'
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
            // 'https://cdn.jsdelivr.net/npm/react-is@17.0.2/umd/react-is.production.min.js',
            // 'https://cdnjs.cloudflare.com/ajax/libs/react-is/17.0.2/umd/react-is.production.min.js',
          ],
        },
        {
          name: 'prop-types',
          var: 'PropTypes',
          path: [
            'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
            // 'https://cdn.jsdelivr.net/npm/prop-types@15.8.1/prop-types.min.js',
            // 'https://cdnjs.cloudflare.com/ajax/libs/prop-types/15.8.1/prop-types.min.js',
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
          name: 'react',
          var: 'React',
          path: [
            'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
            // 'https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js',
            // 'https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js',
          ],
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: [
            'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
            // 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
            // 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
          ],
        },
        {
          name: 'json-schema',
          var: 'jsonSchema',
          path: [
            'https://unpkg.com/json-schema@0.4.0/lib/validate.js',
            // 'https://cdn.jsdelivr.net/npm/json-schema@0.4.0/lib/validate.js',
          ],
        },
        {
          name: '@ant-design/icons',
          var: 'icons',
          path: [
            'https://unpkg.com/@ant-design/icons@4.7.0/dist/index.umd.js',
            // 'https://cdn.jsdelivr.net/npm/icons@4.7.0/dist/index.umd.js',
          ],
        },
        {
          name: 'antd',
          var: 'antd',
          path: [
            'https://unpkg.com/antd@4.24.4/dist/antd.min.js',
            // 'https://cdn.jsdelivr.net/npm/antd@4.24.4/dist/antd.min.js',
          ],
          css: [
            'https://unpkg.com/antd@4.24.4/dist/antd.min.css',
            // 'https://cdn.jsdelivr.net/npm/antd@4.24.4/dist/antd.min.css',
          ],
        },
        {
          name: '@monaco-editor/loader',
          var: 'monaco_loader',
          path: [
            'https://unpkg.com/@monaco-editor/loader@1.3.2/lib/umd/monaco-loader.min.js',
            // 'https://cdn.jsdelivr.net/npm/@monaco-editor/loader@1.3.2/lib/umd/monaco-loader.min.js',
          ],
        },
        {
          name: '@monaco-editor/react',
          var: 'monaco_react',
          path: [
            'https://unpkg.com/@monaco-editor/react@4.4.5/lib/umd/monaco-react.min.js',
            // 'https://cdn.jsdelivr.net/npm/@monaco-editor/react@4.4.5/lib/umd/monaco-react.min.js',
          ]
        },
        // {
        //   name: 'idb-keyval',
        //   var: 'idbKeyval',
        //   path: [
        //     'https://unpkg.com/idb-keyval@6.2.0/dist/umd.js'
        //   ]
        // },
      ]
    }) as any,
    isLocal && styleImport({
      libs: [
        {
          libraryName: 'antd',
          esModule: true,
          resolveStyle: (name) => {
            return `antd/es/${name}/style/index`
          },
        },
      ]
    }),
    replace({
      preventAssignment: true,
      'process.env.VITE_LOCAL': JSON.stringify(process.env.VITE_LOCAL),
    }),
  ].filter(Boolean)
})
