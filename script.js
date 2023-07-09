/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
const path = require('path')
const fs = require('fs')

const configList = [
    {
        filename: './src/components/MainEditor/index.tsx',
        mark: 'loadConfig',
        isLocal: true,
        code: `
import { loadLocalMocano } from './local';
if (! import.meta.env.DEV) {
    loadLocalMocano()
}`,
    },
    {
        filename: './src/App.tsx',
        mark: 'injectDarkStyle',
        code: `
const link = document.createElement('link')
link.setAttribute('dark', '')
link.href = 'https://unpkg.com/antd@4.24.8/dist/antd.dark.css'
link.rel = 'stylesheet'
document.head.appendChild(link)`
    },
    {
        filename: './src/dark.less',
        mark: 'darkLess',
        isLocal: true,
        code: `
@import 'antd/dist/antd.dark.less';`
    }
]

configList.forEach(config => {
    handle(config)
})

function handle(config) {
    const filename = path.resolve(config.filename)
    const text = fs.readFileSync(filename).toString()
    const reg = new RegExp(`//#region ${config.mark}(\\s|\\S)*?//#endregion`)
    const code = process.env.VITE_LOCAL + '' === config.isLocal + ''
        ? `//#region ${config.mark}${config.code}\n//#endregion`
        : `//#region ${config.mark}\n//#endregion`
    const newText = text.replace(reg, code)
    fs.writeFileSync(filename, newText)
}
