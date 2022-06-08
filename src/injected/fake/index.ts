import { InterceptManager } from "../../utils";
import FakeXMLHttpRequest from "./xhr";

interface Options {
    nativeXhr?: typeof XMLHttpRequest
    onMatch?: (reqestInfo: { requestUrl: string; method: string }) => any
    onIntercept?: (data: any) => InterceptManager<XMLHttpRequest, XMLHttpRequest>
}

export let __NativeXhr__: typeof XMLHttpRequest | undefined
export let __Options__: Options | undefined

export function unfake() {
    if (__NativeXhr__) {
        window.XMLHttpRequest = __NativeXhr__
    }
}

export function fake(options: Options = {}) {
    unfake()

    __Options__ = options

    __NativeXhr__ = options.nativeXhr || window.XMLHttpRequest
    window.XMLHttpRequest = FakeXMLHttpRequest as unknown as typeof XMLHttpRequest
}