/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
export function createSymbol(attr: string) {
    return Symbol.for(attr)
}

export function formatChunk(chunk: string, tpl = 'data: $1\n\n') {
    return tpl.replace('$1', chunk)
}

export async function* asyncGenerator(data: unknown[], delay = 1000) {
    const list = data.map(item => typeof item !== 'string' ? JSON.stringify(item) : item)
    for (const item of list) {
        await new Promise(resolve => setTimeout(resolve, delay))
        yield item
    }
}

export function modifyXhrProtoProps(this: XMLHttpRequest, props: {
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
                return this[key] || props[attr as keyof typeof props]
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
                    // @ts-ignore
                    return xhr[key]
                }
                cacheMap.set(xhr, { [key]: true })
                // @ts-ignore
                return xhr[key] ?? xhr[attr]
            },
            set(val) {
                // @ts-ignore
                xhr[key] = val
            }
        })
    })
}

export function equal(obj1: any, obj2: any) {
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

export function parseHeaders(str: string = ''): Record<string, string> {
    return str.split('\n').filter(Boolean).reduce((acc, line) => {
        const [key, value] = line.trim().split(':')
        acc[toTitleCase(key)] = value.trim()
        return acc
    }, {} as any)
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

export type TransformMethodType = 'onResponding' | 'onMatching' | 'onRedirect' | 'onRequestHeaders' | 'onResponseHeaders' | 'onBlocking'

export function createRunFunc(code: string, kind: TransformMethodType) {
    return new Function('c', `let r;${`const ${kind}=fn=>r=fn(c)`};try{${code};return r}catch{return null}`)
}

export function debounce(func: Function, immediate = false, delay = 300, thisArg = null) {
    let timer: number, first = immediate
    return (...args: any[]) => {
        clearTimeout(timer)
        if (first) {
            func.call(thisArg, ...args)
            first = false
        }
        timer = window.setTimeout(() => {
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

export function parseHeaderKey(name: string): {
    header: string
    tag: 'remove' | 'override' | null
} {
    return {
        header: toTitleCase(name.replace(/^[-!]/, '')),
        tag: (
            name[0] === '-'
                ? 'remove'
                : name[0] === '!'
                ? 'override'
                : null
        ),
    }
}

export function normalizeHeaders(currentHeaders: chrome.webRequest.HttpHeader[] | undefined, modifyHeader: Record<string, string> | undefined) {
    let headers = currentHeaders || []
    Object.entries(modifyHeader || {}).forEach(([name, value]) => {
        const { header, tag } = parseHeaderKey(name)
        if (tag === 'remove') {
            headers = headers.filter(h => toTitleCase(h.name) !== header)
        } else if (tag === 'override') {
            headers = headers.filter(h => toTitleCase(h.name) !== header)
            headers.push({ name: header, value })
        } else {
            headers.push({ name, value })
        }
    })

    return headers
}

export function objectToHttpHeaders(obj: Record<string, string>) {
    return Object.keys(obj).map(key => ({ name: toTitleCase(key), value: obj[key] }))
}

export function trimUrlParams(url: string) {
    return url.replace(/\?(.*)/, '')
}

export function delayAsync<T extends (...args: any[]) => any>(fn: T, delay: number | undefined) {
    return new Promise<Awaited<ReturnType<T>>>(resolve => {
        setTimeout(() => {
            resolve(fn())
        }, delay)
    })
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

export const enum PatternKind {
    RegExp = 1,
    PatchMatcher = 2,
    String = 3
}

export function getMatchType(pattern: string) {
    if (/^\^|\$$/.test(pattern)) {
        return PatternKind.RegExp
    }
    if (/[?*]/.test(pattern)) {
        return PatternKind.PatchMatcher
    }
    return PatternKind.String
}

export function replaceUrl(pattern: string, url: string) {
    if (getMatchType(pattern) === PatternKind.RegExp) {
        try {
            url.replace(new RegExp(pattern), url)
        } catch (error) {
            return url
        }
    }
    return url
}

export function matchPath(pattern: string, path: string) {
    const type = getMatchType(pattern)
    switch (type) {
        case PatternKind.RegExp:
            try {
                const reg = new RegExp(pattern, 'i')
                return reg.test(path)
            } catch (error) {
                return false
            }
        case PatternKind.PatchMatcher:
            return pathMatch(pattern, path);
        default:
            return path.includes(pattern);
    }
}

export function toTitleCase(str = '') {
    return str.replace(/\b[a-z]/g, c => c.toUpperCase())
}

export function tryToProxyUrl(url: string | URL | Request, proxy: Record<string, string | {
    target: string
    rewrite?: string
}> = {}) {
    if (url instanceof Request) {
        return url.url
    }
    const urlObj = url instanceof URL ? url : parseUrl(url)
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
