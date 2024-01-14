/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { Options, __global__ } from "./globalVar"
import { ProxyXMLHttpRequest, handleReadyStateChange, proxyFakeXhrInstance, proxyXhrInstance } from "./handle"

let unproxied = true

export function proxyXhr(options: Options) {
    if (!unproxied) {
        return
    }
    unproxied = false
    __global__.options = options

    const { fakedLog, faked } = options
    const loggable = faked && fakedLog
    __global__.NativeXhr = options.NativeXhr || __global__.NativeXhr
    
    const ProxyXhr = new Proxy(__global__.NativeXhr, {
        construct(target) {
            const inst = new target() as ProxyXMLHttpRequest
            if (faked) {
                proxyFakeXhrInstance(inst, { loggable })
            } else {
                proxyXhrInstance(inst)
            }
            inst.addEventListener("readystatechange", handleReadyStateChange.bind(inst))
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
                    return __global__.PageXhr || __global__.NativeXhr
                }
            }
        })
    }
}