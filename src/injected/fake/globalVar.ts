import { InterceptManager } from "../../utils"

interface GlobalVar {
    NativeXhr: typeof XMLHttpRequest | undefined
    NativeFetch: typeof fetch | undefined
    options: Options | undefined
}

export interface Options {
    faked?: boolean
    nativeXHR?: typeof XMLHttpRequest
    nativeFetch?: typeof fetch
    onMatch?: (reqestInfo: { requestUrl: string; method: string }) => any
    onXhrIntercept?: (data: any) => (xhr: XMLHttpRequest) => void
    onFetchIntercept?: (data: any) => (res: Response) => (Promise<Response> | undefined)
}

export const __global__: GlobalVar = {
    NativeXhr: undefined,
    NativeFetch: undefined,
    options: undefined,
}