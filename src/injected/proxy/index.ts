/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { Options, __global__ } from "./globalVar"
import { proxyFetch, unproxyFetch } from "./fetch"
import { proxyXhr, unproxyXhr } from "./xhr"

export function proxyRequest(options: Options, single = false) {
    const banType = options.banType || 'none'
    if (banType === 'all') {
        return
    }

    const canWorkingFetch = (single && options.NativeFetch || !single) && banType !== 'fetch'
    const canWorkingXhr = (single && options.NativeXhr || !single) && banType !== 'xhr'
   
    if (canWorkingFetch) {
        proxyFetch(options)
    }
    if (canWorkingXhr) {
        proxyXhr(options)
    }
}

export function unproxyRequest() {
    unproxyXhr()
    unproxyFetch()
}