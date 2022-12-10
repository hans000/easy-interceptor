/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
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