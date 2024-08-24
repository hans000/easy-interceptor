/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { Options, __global__, getPageXhr } from "./globalVar"
import { ProxyXMLHttpRequest, proxyFakeXhrInstance } from "./handle"

let unproxied = true

export function proxyXhr(options: Options) {
    if (!unproxied) {
        return
    }
    unproxied = false
    __global__.options = options
    __global__.NativeXhr = options.NativeXhr || __global__.NativeXhr
    
    const ProxyXhr = new Proxy(__global__.NativeXhr!, {
        construct(target) {
            const inst = new target() as ProxyXMLHttpRequest
            proxyFakeXhrInstance.call(inst, options)
            return inst
        }
    })

    Object.defineProperties(window, {
        XMLHttpRequest: {
            set(v) {
                if (unproxied) {
                    __global__.PageXhr = v
                }
            },
            get() {
                return ProxyXhr
            }
        }
    })
}

export function unproxyXhr() {
    if (!unproxied) {
        unproxied = true
        Object.defineProperties(window, {
            XMLHttpRequest: {
                get() {
                    return getPageXhr()
                }
            }
        })
    }
}