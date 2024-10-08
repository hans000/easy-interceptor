/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { asyncGenerator, createRunFunc, delayAsync, formatChunk, parseHeaderKey } from "../../tools";
import { log } from "../../tools/log";
import { parseUrl } from "../../tools";
import { Options, __global__, getPageFetch } from "./globalVar";
import { createBlockException } from "../../tools/exception";

let unproxied = true

export function proxyFetch(options: Options) {
    if (!unproxied) {
        return
    }
    unproxied = false
    __global__.options = options

    const { onMatch, onFetchIntercept } = options
    __global__.NativeFetch = options.NativeFetch || __global__.NativeFetch

    const proxyFetch = new Proxy(__global__.NativeFetch!, {
        async apply(target, thisArg, args) {
            const [input, init] = args as [Request | URL | string, RequestInit]
            const isRequest = input instanceof Request
            const url = isRequest
                ? parseUrl(input.url)
                : input instanceof URL
                ? input
                : parseUrl(input)
            const matchItem = onMatch!({
                method: init.method || 'get',
                requestUrl: url.origin + url.pathname,
                type: 'fetch',
                params: [...url.searchParams.entries()],
            })

            if (matchItem?.requestHeaders) {
                Object.entries(matchItem.requestHeaders).forEach(([name, value]) => {
                    const { header } = parseHeaderKey(name)
                    if (init.headers instanceof Headers) {
                        init.headers.append(header, value)
                    } else if (Array.isArray(init.headers)) {
                        init.headers.push([header, value])
                    } else if (typeof init.headers === 'object') {
                        init.headers[header] = value
                    }
                })
            }

            const realFetch = __global__.PageFetch || target

            if (matchItem) {
                const loggable = matchItem.faked && options.fakedLog

                if (loggable) {
                    log({
                        type: 'fetch:request',
                        input,
                        ...init,
                    })
                }

                if (matchItem.faked) {
                    const fn = createRunFunc(matchItem.code!, 'onBlocking')
                    const blocked = fn({
                        ...matchItem,
                        url: url.origin + url.pathname,
                    }) || matchItem.blocked
                    if (blocked) {
                        throw createBlockException()
                    }
                }

                const chunks = matchItem.chunks || []
                const isEventSource = !!chunks.length
                const realResponse = (matchItem.faked || isEventSource)
                    ? new Response(new Blob(['null']), init) 
                    : await realFetch.call(thisArg, input, init)
                const response = await onFetchIntercept!(matchItem)(realResponse)

                const abortController = new AbortController()

                init.signal?.addEventListener('abort', () => {
                    abortController.abort()
                    return
                })

                return delayAsync(async () => {
                    let res: Response = response || realResponse
                    
                    if (isEventSource) {
                        let outterController: ReadableStreamDefaultController
                        res = new Response(new ReadableStream({
                            async start(controller) {
                                outterController = controller
                                for await (const value of asyncGenerator(chunks, matchItem.chunkInterval)) {
                                    const str = formatChunk(value, matchItem.chunkTemplate)
                                    controller.enqueue(new TextEncoder().encode(str));
                                }
                                controller.close();
                            },
                        }), init)
                        init.signal?.addEventListener('abort', (event: any) => {
                            outterController.close()
                            throw new Error(event.target.reason)
                        })
                    }

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

                    return res
                }, matchItem.delay, abortController.signal)
            }

            const response = __global__.PageFetch
                ? __global__.PageFetch.call(thisArg, input, init)
                : target.call(thisArg, input, init)
            onFetchIntercept!(null)((await response).clone())
            return response
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
                    return getPageFetch()
                }
            }
        })
    }
}
