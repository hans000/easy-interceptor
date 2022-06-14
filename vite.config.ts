import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import styleImport from 'vite-plugin-style-import'
import replace from '@rollup/plugin-replace';
import * as path from 'path'
import cdnImport from 'vite-plugin-cdn-import'

const isLocal = !!process.env.VITE_LOCAL
const dist = isLocal ? 'local' : 'cdn'

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
    reactRefresh(),
    !isLocal && cdnImport({
      modules: [
        {
          name: 'minimatch',
          var: 'minimatch',
          path: [],
        },
        {
          name: 'react-is',
          var: 'ReactIs',
          path: 'https://unpkg.com/react-is@17.0.2/umd/react-is.production.min.js',
        },
        {
          name: 'prop-types',
          var: 'PropTypes',
          path: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
        },
        {
          name: 'react',
          var: 'React',
          path: 'https://unpkg.com/react@17.0.2/umd/react.production.min.js',
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: 'https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js',
        },
        {
          name: 'json-schema',
          var: 'jsonSchema',
          path: 'https://unpkg.com/json-schema@0.4.0/lib/validate.js',
        },
        {
          name: '@ant-design/icons',
          var: 'icons',
          path: 'https://unpkg.com/@ant-design/icons@4.7.0/dist/index.umd.js',
        },
        {
          name: 'antd',
          var: 'antd',
          path: 'https://unpkg.com/antd@4.21.0/dist/antd.min.js',
          css: 'https://unpkg.com/antd@4.21.0/dist/antd.min.css',
        },
        {
          name: '@monaco-editor/loader',
          var: 'monaco_loader',
          path: 'https://unpkg.com/@monaco-editor/loader@1.3.2/lib/umd/monaco-loader.min.js',
        },
        {
          name: '@monaco-editor/react',
          var: 'monaco_react',
          path: 'https://unpkg.com/@monaco-editor/react@4.4.5/lib/umd/monaco-react.min.js'
        },
      ]
    }),
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
