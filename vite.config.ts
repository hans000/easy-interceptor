import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
// import copy from 'rollup-plugin-copy'
// import viteImport from 'vite-plugin-babel-import'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  },
  plugins: [
    reactRefresh(),
    // viteImport([
    //   {
    //     libraryName: "antd",
    //     libraryDirectory: "es",
    //     style(name) {
    //       return `antd/es/${name}/style/index.css`;
    //     },
    //     ignoreStyles: [],
    //   }
    // ])
  ]
})
