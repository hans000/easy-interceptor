/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { BanType, MatchRule } from "../../App"

interface GlobalVar {
    NativeXhr: typeof XMLHttpRequest | undefined
    NativeFetch: typeof fetch | undefined
    options: Options | undefined
}

export interface CustomRequestInfo {
    requestUrl: string
    method: string
    type: 'xhr' | 'fetch'
    params: [string, string][]
}

export interface Options {
    faked?: boolean
    fakedLog?: boolean
    nativeXHR?: typeof XMLHttpRequest
    nativeFetch?: typeof fetch
    banType?: BanType
    onMatch?: (reqestInfo: CustomRequestInfo) => MatchRule
    onXhrIntercept?: (data: any) => (xhr: XMLHttpRequest) => Promise<void>
    onFetchIntercept?: (data: any) => (res: Response) => (Promise<Response> | undefined)
}

export const __global__: GlobalVar = {
    NativeXhr: undefined,
    NativeFetch: undefined,
    options: undefined,
}
