/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */

import { MatchRule } from "../../App"
import { createSymbol, delayRun, modifyXhrProto, modifyXhrProtoProps, toTitleCase } from "../../tools"
import { log } from "../../tools/log"
import { parseUrl, parseXML, stringifyHeaders } from "../../tools"
import { HttpStatusCodes } from "./constants"
import { Options, __global__ } from "./globalVar"

export interface ProxyXMLHttpRequest extends XMLHttpRequest {
    _async: boolean
    _url: string | URL
    _method: string
    _forceMimeType: string
    _matchItem: MatchRule
    _requestData: any
    _requestHeaders: Record<string, string>
    _responseHeaders: Record<string, string>
}

export function isTextType() {
    return this.responseType === '' || this.responseType === 'text'
}

export function formatResponse(response: unknown) {
    if (isTextType.call(this)) {
        return response 
            ? typeof response === 'string'
            ? response
            : JSON.stringify(response)
            : ''
    }
    return response
}

export function formatResponseText(response: unknown) {
    return response 
        ? typeof response === 'string'
        ? response
        : JSON.stringify(response) 
        : ''
}

export function handleReadyStateChange() {
    if (this.readyState === XMLHttpRequest.OPENED) {
        const { onMatch } = __global__.options
        const urlObj: URL = this._url instanceof URL ? this._url : parseUrl(this._url)
        this._matchItem = onMatch({
            method: this._method,
            requestUrl: urlObj.origin + urlObj.pathname,
            type: 'xhr',
            params: [...urlObj.searchParams.entries()]
        })
    } else if (this.readyState === XMLHttpRequest.DONE) {
        const { onXhrIntercept } = __global__.options
        if (this._matchItem) {
            const { status = 200, response, responseText } = this._matchItem
            const mergedResponse = response === undefined
                ? this.response
                : response === null
                ? null
                : response
            const formatResponseResult = formatResponse.call(this, mergedResponse)
            modifyXhrProtoProps.call(this, {
                response: formatResponseResult,
                responseText: responseText === undefined ? formatResponseText(formatResponseResult) : responseText,
                status,
                statusText: HttpStatusCodes[status],
            })
        }

        onXhrIntercept(this._matchItem).call(this, this)
    }
}

export function setResponseHeaders(headers) {
    this._responseHeaders = {}
    for (const header in headers) {
        if (headers.hasOwnProperty(header)) {
            this._responseHeaders[header] = headers[header]
        }
    }
    if (this._forceMimeType) {
        this._responseHeaders['Content-Type'] = this._forceMimeType
    }
    if (this._async) {
        handleStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED)
    } else {
        this.readyState = XMLHttpRequest.HEADERS_RECEIVED
    }
}

export function setResponseBody(body = '') {
    this.response = this.responseText = body
    const type = this.getResponseHeader("content-type")

    if (this.responseText && (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
        try {
            this.responseXML = parseXML(this.responseText)
        }
        catch (e) {}
    }

    if (this._async) {
        handleStateChange.call(this, XMLHttpRequest.DONE)
    } else {
        this.readyState = XMLHttpRequest.DONE
    }
}

export function handleStateChange(state) {
    this.readyState = state
    dispatchCustomEvent.call(this, 'readystatechange')

    if (this.readyState == XMLHttpRequest.DONE) {
        dispatchCustomEvent.call(this, 'load')
        dispatchCustomEvent.call(this, 'loadend')
    }
}

export function dispatchCustomEvent(type: string) {
    this.dispatchEvent(new Event(type))
    const handle = this['on' + type]
    handle && handle()
}

export function proxyXhrInstance(inst: ProxyXMLHttpRequest) {
    const originOpen = inst.open
    const originSend = inst.send
    inst.open = (method: string, url: string | URL, async?: boolean, user?: string, password?: string) => {
        inst._async = async ?? true
        inst._url = url
        inst._method = method
        originOpen.call(inst, method, url, async, user, password)
    }
    inst.send = (data) => {
        const delay = inst._matchItem ? inst._matchItem.delay : undefined
        delayRun(() => {
            inst._requestData = data;
            originSend.call(inst, data);
        }, delay);
    }
}

export function proxyFakeXhrInstance(inst: ProxyXMLHttpRequest, options: Options) {
    const originOpen = inst.open
    const originSend = inst.send
    const originSetRequestHeader = inst.setRequestHeader
    const originGetResponseHeader = inst.getResponseHeader
    const originGetAllResponseHeaders = inst.getAllResponseHeaders
    const originOverrideMimeType = inst.overrideMimeType

    inst.open = (method: string, url: string | URL, async = true) => {
        inst._async = async
        inst._url = url
        inst._method = method
        const urlObj = inst._url instanceof URL ? inst._url : parseUrl(inst._url)
        inst._matchItem = options.onMatch({
            method: inst._method,
            requestUrl: urlObj.origin + urlObj.pathname,
            type: 'xhr',
            params: [...urlObj.searchParams.entries()]
        })
        if (inst._matchItem) {
            modifyXhrProto.call(inst, inst)
            handleStateChange.call(inst, XMLHttpRequest.UNSENT)
            handleStateChange.call(inst, XMLHttpRequest.OPENED)
        } else {
            originOpen.call(inst, method, url, async)
        }
    }
    inst.send = (data) => {
        if (! inst._matchItem) {
            originSend.call(inst, data)
            return
        }
        const loggable = options.faked && options.fakedLog

        if (loggable) {
            log({
                type: 'xhr:request',
                url: inst._url,
                method: inst._method,
                headers: inst._requestHeaders,
                body: data,
            })
        }
        const matchItem = inst._matchItem
        dispatchCustomEvent.call(inst, 'loadstart')

        delayRun(async () => {
            const { status = 200, responseHeaders, response, responseText } = matchItem
            setResponseHeaders.call(inst, responseHeaders)
            handleStateChange.call(inst, XMLHttpRequest.LOADING)
            // @ts-ignore inst field has been proxy
            inst.readyState = XMLHttpRequest.DONE
            {
                const result = await options.onXhrIntercept(matchItem).call(inst, inst)
                const { status = 200, responseHeaders, response, responseText } = { ...matchItem, ...result } as MatchRule

                const mergedResponse = formatResponse.call(inst, response)
                const mergedResponseText = responseText === undefined ? formatResponseText(mergedResponse) : responseText
                // @ts-ignore inst field has been proxy
                inst.status = status
                // @ts-ignore inst field has been proxy
                inst.statusText = HttpStatusCodes[inst.status]
                // @ts-ignore inst field has been proxy
                inst.responseText = mergedResponseText
                // @ts-ignore inst field has been proxy
                inst.response = mergedResponse
                // @ts-ignore inst field has been proxy
                inst.responseHeaders = responseHeaders
            }
            handleStateChange.call(inst, XMLHttpRequest.DONE)

            if (loggable) {
                log({
                    type: 'xhr:response',
                    url: inst._url,
                    method: inst._method,
                    status,
                    headers: responseHeaders,
                    response,
                    responseText,
                })
            }
        }, matchItem.delay)
    }
    inst.setRequestHeader = (name: string, value: string) => {
        const header = toTitleCase(name)
        if (! inst._matchItem) {
            originSetRequestHeader.call(inst, header, value)
            return
        }

        inst._requestHeaders = inst._requestHeaders || {};
        inst._requestHeaders[header] = value
    }
    inst.getResponseHeader = (name: string) => {
        const header = toTitleCase(name)
        if (! inst._matchItem) {
            return originGetResponseHeader.call(inst, header)
        }

        if (inst.readyState < XMLHttpRequest.HEADERS_RECEIVED) {
            return null
        }

        if (/^Set-Cookie2?$/i.test(header)) {
            return null
        }

        return inst._responseHeaders[header]
    }
    inst.getAllResponseHeaders = () => {
        if (! inst._matchItem) {
            return originGetAllResponseHeaders.call(inst)
        }

        return stringifyHeaders(inst._responseHeaders)
    }
    inst.overrideMimeType = (mimeType: string) => {
        if (! inst._matchItem) {
            originOverrideMimeType.call(inst, mimeType)
            return
        }
        inst._forceMimeType = toTitleCase(mimeType)
    }

    return inst
}