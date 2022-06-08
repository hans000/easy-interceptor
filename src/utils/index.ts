export function equal(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
}

export function randID() {
    return Math.random().toString(36).slice(2)
}

export function renderSize(value: number) {
    const mapUnit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
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


export function parseUrl(rawUrl: string) {
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

export function createSymbol(attr: string) {
    return Symbol.for(attr);
}

/** do nothing */
export function noop(): any { }

/** hook */
type GetterHandle<T, P> = (value: T, proxyee: P) => T
type SetterHandle<T, P> = (value: T, proxyee: P) => T
type FuncHandle<P> = (proxyee: P, ...args) => any

interface PropertyHandle<T, P> {
  getter?: GetterHandle<T, P>
  setter?: SetterHandle<T, P>
}
export type InterceptManager<T, P> = {
  [K in keyof T]?: T[K] extends Function ? FuncHandle<P> : PropertyHandle<T[K], P>
}

export function hook<T extends object, P extends object>(proxyer: P, proxyee: T, manager: InterceptManager<T, P> = {} as any) {
    if (!proxyee) {
        return
    }

    for (const attr in proxyee) {
        if (typeof proxyee[attr] === "function") {
            // proxyer[attr as string] = wrapFunc(attr)
        } else {
            Object.defineProperty(proxyer, attr, {
                get: getter(attr),
                set: setter(attr),
                enumerable: true
            })
        }
    }

    function wrapFunc(attr: string) {
        return function (...args) {
            if (manager[attr]) {
                const ret = manager[attr].call(proxyer, ...args, proxyee)
                if (ret) return ret
            }
            return proxyee[attr].apply(proxyee, args)
        }
    }

    function configEvent(event, proxyee: any) {
        const e: any = {}
        for (const attr in event) {
            e[attr] = event[attr]
        }
        e.target = e.currentTarget = proxyee
        return e
    }

    function setter(attr: string) {
        return function (v) {
            const hook = manager[attr]
            const key = createSymbol(attr)
            if (attr.startsWith('on')) {
                proxyer[key] = v
                proxyee[attr] = (e) => {
                    e = configEvent(e, proxyer)
                    if (hook) {
                        const ret = hook.call(proxyer, proxyee, e)
                        if (!ret) {
                            v.call(proxyer, e)
                        }
                    } else {
                        v.call(proxyer, e)
                    }
                }
            } else {
                const s = hook && hook.setter
                v = s && s(v, proxyer) || v
                proxyer[key] = v
                try {
                    proxyee[attr] = v
                } catch (e) { }
            }
        }
    }

    function getter(attr: string) {
        return function () {
            const key = createSymbol(attr)
            const v = proxyer.hasOwnProperty(key) ? proxyer[key] : proxyee[attr]
            const g = (manager[attr] || {}).getter
            return g && g(v, proxyer) || v
        }
    }
}
