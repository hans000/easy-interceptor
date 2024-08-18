/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { delayRun } from "../../tools";
import { log } from "../../tools/log";
import { parseUrl } from "../../tools";
import { Options, __global__ } from "./globalVar";

let unproxied = true

export function proxyFetch(options: Options) {
    if (!unproxied) {
        return
    }
    unproxied = false
    __global__.options = options

    const { onMatch, onFetchIntercept } = options
    __global__.NativeFetch = options.NativeFetch || __global__.NativeFetch

    const proxyFetch = new Proxy(__global__.NativeFetch, {
        async apply(target, thisArg, args) {
            const [input, init] = args
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
            const realFetch = __global__.PageFetch || target

            if (matchItem) {
                const loggable = options.faked && options.fakedLog

                if (loggable) {
                    log({
                        type: 'fetch:request',
                        input,
                        ...init,
                    })
                }
                const realResponse = options.faked 
                    ? new Response(new Blob(['null'])) 
                    : await realFetch.call(thisArg, input, init)
                const response = await onFetchIntercept(matchItem)(realResponse)

                return new Promise(resolve => {
                    delayRun(async () => {
                        const res = response || realResponse
                        resolve(res)
                        if (loggable) {
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
            if (__global__.PageFetch) {
                return __global__.PageFetch.call(thisArg, ...args)
            }
            return target.call(thisArg, ...args)
        },
    })

    Object.defineProperties(window, {
        fetch: {
            set(v) {
                if (unproxied) {
                    __global__.PageFetch = v
                }
            },
            get() {
                return proxyFetch
            }
        }
    })
}

export function unproxyFetch() {
    if (!unproxied) {
        unproxied = true
        Object.defineProperties(window, {
            fetch: {
                get() {
                    return __global__.PageFetch || __global__.NativeFetch
                }
            }
        })
    }
}