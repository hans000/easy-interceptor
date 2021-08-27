import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import viteImport from 'vite-plugin-babel-import'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    reactRefresh(),
    viteImport([
      {
        libraryName: "antd",
        libraryDirectory: "es",
        style(name) {
          return `antd/es/${name}/style/index.css`;
        },
        ignoreStyles: [],
      }
    ])
  ]
})
