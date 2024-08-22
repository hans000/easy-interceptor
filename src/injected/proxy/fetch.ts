/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { asyncGenerator, delayRun, formatChunk, tryToProxyUrl } from "../../tools";
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
            const [input, init] = args as [Request | URL | string, RequestInit]
            const isRequest = input instanceof Request
            const req = isRequest ? input.clone() : new Request(input.toString(), init)
            const url = isRequest
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

            if (matchItem?.requestHeaders) {
                Object.entries(matchItem.requestHeaders).forEach(([key, value]) => {
                    if (init.headers instanceof Headers) {
                        init.headers.append(key, value)
                    } else if (Array.isArray(init.headers)) {
                        init.headers.push([key, value])
                    } else if (typeof init.headers === 'object') {
                        init.headers[key] = value
                    }
                })
            }

            const realFetch = __global__.PageFetch || target
            const proxyUrl = tryToProxyUrl(input, __global__.options.proxy)
            const proxyInput = isRequest ? new Request(proxyUrl, init) : proxyUrl

            if (matchItem) {
                const loggable = options.faked && options.fakedLog

                if (loggable) {
                    log({
                        type: 'fetch:request',
                        input,
                        ...init,
                    })
                }

                const chunks = matchItem.chunks || []
                const isEventSource = !!chunks.length
                const realResponse = (options.faked || isEventSource)
                    ? new Response(new Blob(['null']), init) 
                    : await realFetch.call(thisArg, proxyInput, init)
                const response = await onFetchIntercept(matchItem)(realResponse)

                return new Promise(resolve => {
                    delayRun(async () => {
                        let res: Response = response || realResponse
                        
                        if (isEventSource) {
                            res = new Response(new ReadableStream({
                                async start(controller) {
                                    for await (const value of asyncGenerator(chunks, matchItem.chunkInterval)) {
                                        const str = formatChunk(value, matchItem.chunkTemplate)
                                        controller.enqueue(new TextEncoder().encode(str));
                                    }
                                    controller.close();
                                },
                            }), init)
                        }

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
                return __global__.PageFetch.call(thisArg, proxyInput, init)
            }
            return target.call(thisArg, proxyInput, init)
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
