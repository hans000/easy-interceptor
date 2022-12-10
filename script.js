/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
const path = require('path')
const fs = require('fs')

const code = `
import { loadLocalMocano } from './local';
if (! import.meta.env.DEV) {
    loadLocalMocano()
}`

function getTpl(code = '') {
    return (
`//#region loadConfig${code}
//#endregion`
    )
}

const filename = path.resolve('./src/components/MainEditor/index.tsx')
const text = fs.readFileSync(filename).toString()
const newText = text.replace(/\/\/#region loadConfig(\s|\S)*\/\/#endregion/, getTpl(process.env.VITE_LOCAL ? code : ''))
fs.writeFileSync(filename, newText)