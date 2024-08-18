/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
export function createSymbol(attr: string) {
    return Symbol.for(attr)
}

export function modifyXhrProtoProps(props: {
    response?: string
    responseText?: string
    status?: number
    statusText?: string
    readyState?: number
}) {
    Object.keys(props).forEach(attr => {
        const key = createSymbol(attr)
        Object.defineProperty(this, attr, {
            get() {
                return this[key] || props[attr]
            },
            set(val) {
                this[key] = val
            }
        })
    })
}

export function modifyXhrProto(xhr: XMLHttpRequest) {
    const attrs = ['readyState', 'timeout', 'responseURL', 'status', 'statusText', 'response', 'responseText']
    const cacheMap = new WeakMap()
    attrs.forEach(attr => {
        const key = createSymbol(attr)
        Object.defineProperty(xhr, attr, {
            get() {
                if (cacheMap.has(xhr) && cacheMap.get(xhr)[key]) {
                    return xhr[key]
                }
                cacheMap.set(xhr, { [key]: true })
                return xhr[key] ?? xhr[attr]
            },
            set(val) {
                xhr[key] = val
            }
        })
    })
}

export function equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export function randID() {
    return Math.random().toString(36).slice(2)
}

export function renderSize(value: number) {
    const mapUnit = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.log2(value) / 10 | 0
    const size = value / Math.pow(1024, index)
    return size.toFixed(2) + mapUnit[index]
}

export function parseXML(text: string) {
    let xmlDoc;

    if (typeof DOMParser != "undefined") {
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(text, "text/xml");
    } else {
        //@ts-ignore
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(text);
    }

    return xmlDoc;
}


export function parseUrl(rawUrl: string = '') {
    let url = rawUrl
    if (! /^https?/.test(rawUrl)) {
        url = location.origin + rawUrl.replace(/^(\/|\.)*/, '/')
    }
    return new URL(url)
}

export function stringifyParams(data: [string, string][] = [], url = '') {
    const search = data.map(([k, v]) => `${k}=${v}`).join('&')
    if (url) {
        return `${url}?${search}`
    }
    return search
}

export function parseHeaders(str: string): Record<string, string> {
    return str.split('\n').filter(Boolean).reduce((acc, line) => {
        const [key, value] = line.trim().split(': ')
        acc[key] = value
        return acc
    }, {})
}

export function stringifyHeaders(headers: HeadersInit) {
    let result: string[][] = []
    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            result.push([key, value])
        })
    } else if (Array.isArray(headers)) {
        result = headers
    } else if (typeof headers === 'object') {
        Object.keys(headers).forEach(key => {
            result.push([key, headers[key]])
        })
    }
    return result.map(([key, value]) => `${key}: ${value}`).join('\r\n')
}

/** do nothing */
export function noop(): any { }

export type TransformMethodType = 'onResponding' | 'onMatching' | 'onRedirect' | 'onRequestHeaders' | 'onResponseHeaders'

export function createRunFunc(code: string, kind: TransformMethodType) {
    return new Function('c', `let r;${`const ${kind}=fn=>r=fn(c)`};try{${code};return r}catch{return null}`)
}

export function debounce(func: Function, immediate = false, delay = 300, thisArg = null) {
    let timer, first = immediate
    return (...args) => {
        clearTimeout(timer)
        if (first) {
            func.call(thisArg, ...args)
            first = false
        }
        timer = setTimeout(() => {
            func.call(thisArg, ...args)
        }, delay)
    }
}

export function pathMatch(pattern: string, path: string) {
    if (typeof pattern !== 'string') {
        return false
    }
    let regStr = ''
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i]
        if ('^$+()[]{}'.includes(ch)) {
            continue
        }
        if (ch === '?') {
            regStr += '[\\S]'
            continue
        }
        if (ch === '*') {
            if (pattern[i + 1] === ch) {
                regStr += `${regStr.at(-1) === '/' ? '?' : '' }[\\S]{0,}`
                i++
            } else {
                regStr += '[^/]{0,}'
            }
            continue
        }
        if (ch === '.') {
            regStr += '\\' + ch
            continue
        }
        regStr += ch
    }
    return new RegExp(`^${regStr}$`).test(path)
}

/**
 * 解析浏览器的raw数据
 */
export function arrayBufferToString(arrayBuffer: ArrayBuffer) {
    return decodeURIComponent(escape(new Uint8Array(arrayBuffer).reduce((acc, b) => acc += String.fromCharCode(b), '')))
}

/**
 * 在页面上插入js
 */
export function createScript(path: string) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', chrome.extension.getURL(path))
    document.documentElement.appendChild(script)
    return new Promise(resolve => script.addEventListener('load', () => {
        script.remove()
        resolve(void 0)
    }))
}

export function objectToHttpHeaders(obj: object) {
    return Object.keys(obj).map(key => ({ name: key, value: obj[key] }))
}

export function trimUrlParams(url: string) {
    return url.replace(/\?(.*)/, '')
}

export function delayRun(fn: Function, delay: number | undefined) {
    delay ? setTimeout(() => fn(), delay) : fn()
}

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

export function matchPath(pattern: string, path: string) {
    return /[?*]/.test(pattern) ? pathMatch(pattern, path) : path.includes(pattern)
}

export function toTitleCase(str = '') {
    return str.replace(/\b[a-z]/g, c => c.toUpperCase())
}

export function tryToProxyUrl(url: string | URL, proxy: Record<string, string | {
    target: string
    rewrite?: string
}> = {}) {
    const urlObj = url instanceof URL ? url : new URL(url)
    for (const [name, value] of Object.entries(proxy)) {
        try {
            const reg = new RegExp(name)
            if (reg.test(urlObj.pathname)) {
                if (typeof value === 'string') {
                    urlObj.host = value
                    return urlObj.toString()
                } else {
                    if (value.target) {
                        urlObj.host = value.target
                    }
                    if (value.rewrite) {
                        urlObj.pathname = urlObj.pathname.replace(reg, '')
                    }
                    return urlObj.toString()
                }
            }
        } catch (error) {
            console.error(error)
        }
    }
    return url
}
