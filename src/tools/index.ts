/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { pathMatch } from "../utils"

export function download(filename: string, data: string) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(new Blob([data]))
    a.download = filename
    a.rel = 'noopener'
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
}

export function sizeof(object: Record<string, any> = {}) {
    return JSON.stringify(object).length
}

export function delayRun(fn: Function, delay: number | undefined) {
    delay ? setTimeout(() => fn(), delay) : fn()
}

export function matchPath(pattern: string, path: string) {
    return /[?*]/.test(pattern) ? pathMatch(pattern, path) : path.includes(pattern)
}
