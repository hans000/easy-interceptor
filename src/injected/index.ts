/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from '../App'
import { debounce, noop, parseUrl } from '../tools'
import { proxyRequest, unproxyRequest } from './proxy'
import { PageScriptEventName, PageScriptMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './proxy/constants'
import { CustomEventProps, dispatchPageScriptEvent } from '../tools/message'
import { matching } from "../tools/match"
import { handleCode } from '../tools/sendRequest'

const originXhr = window.XMLHttpRequest
const originFetch = window.fetch

// trigger for get data
dispatchPageScriptEvent({
    from: PageScriptMsgKey,
    type: 'syncData',
    payload: null,
})

// run at logic
window.addEventListener(PageScriptEventName, (event: CustomEvent<CustomEventProps>) => {
    const data = event.detail

    if (data.type === 'configInfo') {
        const value = data.payload
        if (value.runAt === 'start') {
            updateData()
            handle(data.type, data.payload)
        } else if (value.runAt === 'end') {
            window.addEventListener('DOMContentLoaded', () => {
                updateData()
                handle(data.type, data.payload)
            })
        } else if (value.runAt === 'delay') {
            setTimeout(() => {
                updateData()
                handle(data.type, data.payload)
            }, value.runAtDelay)
        } else if (value.runAt === 'trigger') {
            updateData()
        } else if (value.runAt === 'override') {
            Object.defineProperty(window, 'fetch', {
                set(value) {
                    window._fetch = value;
                    updateData()
                    handle(data.type, data.payload, {
                        NativeFetch: window._fetch,
                        NativeXhr: window._XMLHttpRequest,
                    })
                },
                get() {
                    if (window._fetch) {
                        return window._fetch
                    }
                    return originFetch;
                }
            });
            Object.defineProperty(window, 'XMLHttpRequest', {
                set(value) {
                    window._XMLHttpRequest = value;
                    updateData()
                    handle(data.type, data.payload, {
                        NativeFetch: window._fetch,
                        NativeXhr: window._XMLHttpRequest,
                    })
                },
                get() {
                    if (window._XMLHttpRequest) {
                        return window._XMLHttpRequest
                    }
                    return originXhr;
                }
            });
        } else {
            updateData()
            handle(data.type, data.payload)
        }
    } else if (data.type === 'rules') {
        app[data.type] = data.payload
    }
})

const run = debounce((...args: any) => app.run(...args), true)

interface FetcherType {
    NativeFetch?: typeof fetch
    NativeXhr?: typeof XMLHttpRequest
}

const app = {
    trigger: false,
    configInfo: {} as ConfigInfoType,
    rules: [],
    intercept(fetcher?: FetcherType) {
        const { faked, fakedLog, banType, proxy } = app.configInfo
        proxyRequest({
            ...fetcher,
            faked,
            fakedLog,
            banType,
            proxy,
            onMatch(req) {
                if (app.configInfo.action === 'intercept') {
                    return matching(app.rules, req)
                }
            },
            onFetchIntercept(data: MatchRule | undefined) {
                return async (res) => {
                    if (data) {
                        dispatchPageScriptEvent({
                            from: PageScriptMsgKey,
                            type: 'count',
                            payload: data.id
                        })
                        const { responseText, response, status = 200, responseHeaders } = await handleCode(data, res)
                        return Promise.resolve(new Response(new Blob([response !== undefined ? JSON.stringify(response) : responseText]), {
                            status,
                            headers: responseHeaders,
                            statusText: HttpStatusCodes[status],
                        }))
                    } else {
                        if (app.configInfo.action === 'watch') {
                            try {
                                const obj = JSON.parse(await res.clone().text())
                                const urlObj = parseUrl(res.url)
                                dispatchPageScriptEvent({
                                    from: PageScriptMsgKey,
                                    type: 'response',
                                    payload: {
                                        url: urlObj.origin + urlObj.pathname,
                                        response: obj,
                                    }
                                })
                            } catch (error) {}
                        }
                    }
                }
            },
            onXhrIntercept(data: MatchRule | undefined) {
                return async function(xhr: XMLHttpRequest) {
                    if (data) {
                        if (this.readyState === 4) {
                            const result = await handleCode(data, xhr)

                            dispatchPageScriptEvent({
                                from: PageScriptMsgKey,
                                type: 'count',
                                payload: data.id
                            })

                            return result
                        }
                    } else {
                        if (app.configInfo.action === 'watch') {
                            try {
                                const obj = JSON.parse(xhr.responseText)
                                const urlObj = parseUrl(xhr.responseURL)
                                dispatchPageScriptEvent({
                                    from: PageScriptMsgKey,
                                    type: 'response',
                                    payload: {
                                        url: urlObj.origin + urlObj.pathname,
                                        response: obj,
                                    }
                                })
                            } catch (error) {}
                        }
                    }
                }
            }
        }, !!fetcher)
    },
    restore() {
        unproxyRequest()
    },
    run(fetcher?: FetcherType) {
        const action = app.configInfo.action
        switch (action) {
            case 'close':
                return app.restore()
            case 'watch':
            case 'intercept':
                return app.intercept(fetcher)
            default:
                break;
        }
    },
}

function handle(key: string, value: any, fetcher?: any) {
    app[key] = value
    if (app.configInfo.runAt !== 'trigger') {
        run(fetcher)
    } else {
        if (app.trigger) {
            run(fetcher)
        }
    }
}

function updateData() {
    // register event
    window.addEventListener(PageScriptEventName, (event: CustomEvent<CustomEventProps>) => {
        const data = event.detail
        if (data.type === 'rules' || data.type === 'configInfo') {
            handle(data.type, data.payload)
        }
    })
    // @ts-ignore 覆盖原函数，达到只加载一次的目的
    updateData = noop
}
