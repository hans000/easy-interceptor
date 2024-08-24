/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */

import { MatchRule } from "../../App"
import { asyncGenerator, createRunFunc, delayAsync, formatChunk, modifyXhrProto, modifyXhrProtoProps, parseHeaderKey, parseHeaders, toTitleCase, tryToProxyUrl } from "../../tools"
import { log } from "../../tools/log"
import { parseUrl, stringifyHeaders } from "../../tools"
import { HttpStatusCodes } from "./constants"
import { Options, __global__, getPageXhr } from "./globalVar"

export interface ProxyXMLHttpRequest extends XMLHttpRequest {
    _async: boolean
    _url: string | URL
    _method: string
    _forceMimeType: string
    _matchItem: MatchRule | undefined
    _requestData: any
    _requestHeaders: Record<string, string>
    _responseHeaders: Record<string, string>
    readyState: number
    status: number
    statusText: string
    responseHeaders: any
    responseText: string
    response: any
}

function isTextType(this: ProxyXMLHttpRequest) {
    return this.responseType === '' || this.responseType === 'text'
}

function formatResponse(this: ProxyXMLHttpRequest, response: unknown) {
    if (isTextType.call(this)) {
        return response 
            ? typeof response === 'string'
            ? response
            : JSON.stringify(response)
            : ''
    }
    return response
}

function formatResponseText(response: unknown) {
    return response 
        ? typeof response === 'string'
        ? response
        : JSON.stringify(response) 
        : ''
}

function setResponseHeaders(this: ProxyXMLHttpRequest, headers: Record<string, string> | undefined) {
    this._responseHeaders = Object.fromEntries(
        Object.entries(headers || {}).map(([key, value]) => [toTitleCase(key), value])
    )
    if (this._forceMimeType) {
        this._responseHeaders['Content-Type'] = this._forceMimeType
    }
}

function handleStateChange(this: ProxyXMLHttpRequest, state: number) {
    this.readyState = state
    this.dispatchEvent(new Event('readystatechange'))
}

function dispatchCustomEvent(this: ProxyXMLHttpRequest, type: string) {
    this.dispatchEvent(new Event(type))
}

export function proxyFakeXhrInstance(this: ProxyXMLHttpRequest, options: Options) {
    const originOpen = this.open
    const originSend = this.send
    const originSetRequestHeader = this.setRequestHeader
    const originGetResponseHeader = this.getResponseHeader
    const originGetAllResponseHeaders = this.getAllResponseHeaders
    const originOverrideMimeType = this.overrideMimeType

    this.open = (method: string, url: string | URL, async: boolean = true) => {
        this._async = async
        this._url = url
        this._method = method
        const urlObj = this._url instanceof URL ? this._url : parseUrl(this._url)
        this._matchItem = options.onMatch!({
            method: this._method,
            requestUrl: urlObj.origin + urlObj.pathname,
            type: 'xhr',
            params: [...urlObj.searchParams.entries()]
        })
        if (! this._matchItem) {
            originOpen.call(this, method, url, async)
        } else {
            modifyXhrProto(this)
            handleStateChange.call(this, XMLHttpRequest.UNSENT)
            handleStateChange.call(this, XMLHttpRequest.OPENED)
        }
    }
    this.send = (body) => {
        if (! this._matchItem) {
            originSend.call(this, body)
            return
        }

        const chunks = this._matchItem.chunks || []
        const isEventSource = !!chunks.length
        const matchItem = this._matchItem
        let prerequest: Promise<XMLHttpRequest | undefined> | undefined
        let syncInnerXhr: XMLHttpRequest | undefined

        const PageXhr = getPageXhr()!
        if (this._async === false) {
            syncInnerXhr = new PageXhr()
            syncInnerXhr.open(this._method, this._url, this._async)
            syncInnerXhr.send(body)
        } else {
            prerequest = new Promise<XMLHttpRequest | undefined>((resolve, reject) => {
                if (this._matchItem!.faked || isEventSource) {
                    const fn = createRunFunc(matchItem.code!, 'onBlocking')
                    const blocked = fn({
                        ...matchItem,
                        url: this._url,
                    }) || matchItem.blocked
                    if (blocked) {
                        reject(new Error('net::ERR_BLOCKED_BY_CLIENT'))
                    } else {
                        delayAsync(resolve, matchItem.delay)
                    }
                } else {
                    const innerXhr = new PageXhr()
                    innerXhr.open(this._method, this._url, this._async)
                    delayAsync(() => innerXhr.send(body), matchItem.delay)
                    innerXhr.onload = () => resolve(innerXhr)
                    innerXhr.onerror = () => reject()
                }
            })
        }

        const loggable = matchItem.faked && options.fakedLog
        
        if (loggable) {
            log({
                type: 'xhr:request',
                url: this._url,
                method: this._method,
                headers: this._requestHeaders,
                body,
            })
        }

        dispatchCustomEvent.call(this, 'loadstart')

        const handleResult = (result: MatchRule | undefined) => {
            const { status = 200, responseHeaders, response, responseText } = { ...matchItem, ...result } as MatchRule

            this.status = status
            this.statusText = HttpStatusCodes[this.status]
            this.responseHeaders = responseHeaders

            if (! isEventSource) {
                const mergedResponse = formatResponse.call(this, response)
                const mergedResponseText = responseText === undefined ? formatResponseText(mergedResponse) : responseText
                this.responseText = mergedResponseText
                this.response = mergedResponse
            }

            handleStateChange.call(this, XMLHttpRequest.DONE)
            dispatchCustomEvent.call(this, 'load')
            dispatchCustomEvent.call(this, 'loadend')

            if (loggable) {
                log({
                    type: 'xhr:response',
                    url: this._url,
                    method: this._method,
                    status,
                    headers: responseHeaders,
                    response,
                    responseText,
                })
            }
        }
        
        // async mode
        prerequest?.then(async (innerXhr) => {
            const originHeaders = parseHeaders(innerXhr?.getAllResponseHeaders())
            const mergedResponseReaders = { ...originHeaders, ...matchItem.responseHeaders }
            setResponseHeaders.call(this, mergedResponseReaders)

            handleStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED)
            handleStateChange.call(this, XMLHttpRequest.LOADING)

            // event source stream
            if (isEventSource) {
                this.responseText = ''
                for await (const item of asyncGenerator(matchItem.chunks!, matchItem.chunkInterval)) {
                    const str = formatChunk(item, matchItem.chunkTemplate)
                    this.responseText += str
                    handleStateChange.call(this, XMLHttpRequest.LOADING)
                }
            }
            
            const result = await options.onXhrIntercept!(matchItem).call(this, this) as MatchRule | undefined
            handleResult(result)
        })

        // sync mode
        if (syncInnerXhr) {
            const result = options.onXhrIntercept!(matchItem).call(this, this) as MatchRule | undefined
            setResponseHeaders.call(this, result?.responseHeaders)

            handleResult(result)
        }
    }
    this.setRequestHeader = (name: string, value: string) => {
        const { header } = parseHeaderKey(name)
        if (! this._matchItem) {
            originSetRequestHeader.call(this, header, value)
            return
        }

        this._requestHeaders = this._requestHeaders || {};
        this._requestHeaders[header] = value
    }
    this.getResponseHeader = (name: string) => {
        const header = toTitleCase(name)
        if (! this._matchItem) {
            return originGetResponseHeader.call(this, header)
        }

        if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) {
            return null
        }

        return this._responseHeaders?.[header]
    }
    this.getAllResponseHeaders = () => {
        if (! this._matchItem) {
            return originGetAllResponseHeaders.call(this)
        }

        return stringifyHeaders(this._responseHeaders)
    }
    this.overrideMimeType = (mimeType: string) => {
        if (! this._matchItem) {
            originOverrideMimeType.call(this, mimeType)
            return
        }
        this._forceMimeType = toTitleCase(mimeType)
    }

    return this
}
