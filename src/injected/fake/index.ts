import { InterceptManager } from "../../utils";
import FakeXMLHttpRequest from "./xhr";
import { modifyProto } from "./xhr/handle";

interface Options {
    nativeXHR?: typeof XMLHttpRequest
    faked?: boolean
    onMatch?: (reqestInfo: { requestUrl: string; method: string }) => any
    onIntercept?: (data: any) => InterceptManager<XMLHttpRequest, XMLHttpRequest>
}

export var __NativeXhr__: typeof XMLHttpRequest | undefined
export let __Options__: Options | undefined

let nativeProto

export function unfake() {
    if (__NativeXhr__) {
        Object.entries(nativeProto || {}).forEach(([key, val]) => {
            __NativeXhr__.prototype[key] = val
        })
        nativeProto = undefined
        window.XMLHttpRequest = __NativeXhr__
    }
}

export function fake(options: Options = {}) {
    unfake()

    __Options__ = options

    if (! options.faked) {
        nativeProto = modifyProto()
    }

    __NativeXhr__ = options.nativeXHR || XMLHttpRequest
    window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
}