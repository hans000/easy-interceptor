/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { Options, __global__ } from "./globalVar";
import fakeFetch from "./fetch";
import FakeXMLHttpRequest from "./xhr";
import { modifyXhrProtoMethods } from "./xhr/handle";

let nativeXhrProto

export function unfake() {
    if (__global__.NativeXhr) {
        Object.entries(nativeXhrProto || {}).forEach(([key, val]) => {
            __global__.NativeXhr.prototype[key] = val
        })
        nativeXhrProto = undefined
        window.XMLHttpRequest = __global__.NativeXhr
    }
    if (__global__.NativeFetch) {
        window.fetch = __global__.NativeFetch
    }
}

export function fake(options: Options = {}) {
    unfake()

    __global__.options = options

    if (options.banType === 'xhr') {
        __global__.NativeFetch = options.nativeFetch || fetch
        window.fetch = fakeFetch
    } else if (options.banType === 'fetch') {
        nativeXhrProto = modifyXhrProtoMethods()
        __global__.NativeXhr = options.nativeXHR || XMLHttpRequest
        window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
    } else if (!options.banType || options.banType === 'none') {
        nativeXhrProto = modifyXhrProtoMethods()

        __global__.NativeXhr = options.nativeXHR || XMLHttpRequest
        __global__.NativeFetch = options.nativeFetch || fetch
        window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
        window.fetch = fakeFetch
    }
}