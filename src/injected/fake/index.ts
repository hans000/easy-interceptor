import { Options, __global__ } from "../globalVar";
import FakeXMLHttpRequest from "./xhr";
import { modifyProto } from "./xhr/handle";

let nativeProto

export function unfake() {
    if (__global__.NativeXhr) {
        Object.entries(nativeProto || {}).forEach(([key, val]) => {
            __global__.NativeXhr.prototype[key] = val
        })
        nativeProto = undefined
        window.XMLHttpRequest = __global__.NativeXhr
    }
}

export function fake(options: Options = {}) {
    unfake()

    __global__.options = options

    if (! options.faked) {
        nativeProto = modifyProto()
    }

    __global__.NativeXhr = options.nativeXHR || XMLHttpRequest
    window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
}