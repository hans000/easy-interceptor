import { Options, __global__ } from "./globalVar";
import fakeFetch from "./fetch";
import FakeXMLHttpRequest from "./xhr";
import { modifyProto } from "./xhr/handle";

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

    nativeXhrProto = modifyProto()

    __global__.NativeXhr = options.nativeXHR || XMLHttpRequest
    __global__.NativeFetch = options.nativeFetch || fetch
    window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
    window.fetch = fakeFetch
}