/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule, BanType, ConfigInfoType } from "../../App"

interface GlobalVar {
    NativeXhr: typeof XMLHttpRequest | undefined
    NativeFetch: typeof fetch | undefined
    PageXhr: typeof XMLHttpRequest | undefined
    PageFetch: typeof fetch | undefined
    options: Options | undefined
}

export interface CustomRequestInfo {
    requestUrl: string
    method: string
    type: 'xhr' | 'fetch'
    params: [string, string][]
}

export interface Options {
    faked: boolean
    fakedLog: boolean
    banType?: BanType
    proxy?: ConfigInfoType['proxy']
    NativeFetch?: typeof fetch
    NativeXhr?: typeof XMLHttpRequest
    onMatch?: (reqestInfo: CustomRequestInfo) => MatchRule
    onXhrIntercept?: (data: any) => (xhr: XMLHttpRequest) => Promise<void>
    onFetchIntercept?: (data: any) => (res: Response) => (Promise<Response> | undefined)
}

export const __global__: GlobalVar = {
    NativeXhr: window.XMLHttpRequest,
    NativeFetch: window.fetch,
    PageXhr: undefined,
    PageFetch: undefined,
    options: undefined,
}
