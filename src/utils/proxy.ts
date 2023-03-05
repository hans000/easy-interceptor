
export function createSymbol(attr: string) {
    return Symbol.for(attr);
}

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