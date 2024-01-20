/*
* The AGPL License (AGPL)
* Copyright (c) 2022 hans000
*/
import { modifyXhrProto, modifyXhrProtoProps } from "../../tools"
import { Options, __global__ } from "./globalVar"
import { ProxyXMLHttpRequest, handleReadyStateChange, proxyFakeXhrInstance, proxyXhrInstance } from "./handle"

let unproxied = true

export function proxyXhr(options: Options) {
    if (!unproxied) {
        return
    }
    unproxied = false
    __global__.options = options
    __global__.NativeXhr = options.NativeXhr || __global__.NativeXhr
    
    const ProxyXhr = new Proxy(__global__.NativeXhr, {
        construct(target) {
            const inst = new target() as ProxyXMLHttpRequest
            if (options.faked) {
                return proxyFakeXhrInstance(inst, new target(), options)
            } else {
                proxyXhrInstance(inst)
            }
            inst.addEventListener("readystatechange", handleReadyStateChange.bind(inst, options.faked))
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