/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { delayRun } from '../../../tools'
import { log } from '../../../tools/log'
import { parseUrl } from '../../../utils'
import { __global__ } from '../globalVar'

export default async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const { faked, fakedLog, onFetchIntercept, onMatch } = __global__.options
    const req = input instanceof Request ? input.clone() : new Request(input.toString(), init)
    const url = input instanceof Request
        ? parseUrl(input.url)
        : input instanceof URL
        ? input
        : parseUrl(input)
    
    const matchItem = onMatch({
        method: req.method,
        requestUrl: url.origin + url.pathname,
        type: 'fetch',
        params: [...url.searchParams.entries()],
    })

    if (!matchItem) {
        return __global__.NativeFetch.call(null, input, init)
    }

    const realResponse = faked ? new Response(new Blob(['null'])) : await __global__.NativeFetch.call(null, input, init) as Response
    if (faked && fakedLog) {
        log({
            type: 'fetch:request',
            input,
            ...init,
        })
    }
    const response = await onFetchIntercept(matchItem)(realResponse)

    return new Promise((resolve) => {
        delayRun(async () => {
            const res = response || realResponse
            resolve(res)
            if (faked && fakedLog) {
                const body = await res.clone().json()
                log({
                    type: 'fetch:response',
                    input,
                    body,
                    status: res.status,
                    headers: res.headers,
                })
            }
        }, matchItem ? matchItem.delay : undefined)
    })
}
