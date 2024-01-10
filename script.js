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
