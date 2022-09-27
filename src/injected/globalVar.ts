import { InterceptManager } from "../utils"

interface GlobalVar {
    NativeXhr: typeof XMLHttpRequest | undefined
    NativeFetch: typeof fetch | undefined
    options: Options | undefined
}

export interface Options {
    nativeXHR?: typeof XMLHttpRequest
    faked?: boolean
    onMatch?: (reqestInfo: { requestUrl: string; method: string }) => any
    onIntercept?: (data: any) => InterceptManager<XMLHttpRequest, XMLHttpRequest>
}

export const __global__: GlobalVar = {
    NativeXhr: undefined,
    NativeFetch: undefined,
    options: undefined,
}