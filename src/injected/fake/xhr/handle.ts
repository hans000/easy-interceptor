/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { delayRun } from "../../../utils"
import { parseUrl, parseXML } from "../../../utils"
import { createSymbol } from "../../../utils/proxy"
import { __global__ } from "../globalVar"
import { HttpStatusCodes } from "./constants"

export function modifyXhrProtoMethods() {
    const { open, send, setRequestHeader } = XMLHttpRequest.prototype
    XMLHttpRequest.prototype.open = function(method: string, url: string) {
        this._method = method
        this._url = url
        open.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function(data) {
        delayRun(() => {
            this._requestData = data
            send.apply(this, arguments)
        }, this._matchItem ? this._matchItem.delay : undefined)
    }

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        this._requestHeaders = this.requestHeaders || {}
        this._requestHeaders[header] = value
        setRequestHeader.apply(this, arguments)
    }
    return {
        open,
        send,
        setRequestHeader,
    }
}

export function modifyXhrProtoProps(config: {
    response: string
    responseText: string
    status: number
    statusText: string
}) {
    for (const attr in config) {
        const key = createSymbol(attr)
        Object.defineProperty(this, attr, {
            get() {
                return this[key] || config[attr]
            },
            set(val) {
                this[key] = val
            }
        })
    }
}

export function handleReadyStateChange() {
    if (this.readyState === 1) {
        const { onMatch } = __global__.options
        const urlObj: URL = this._url instanceof URL ? this._url : parseUrl(this._url)
        this._matchItem = onMatch({
            method: this._method,
            requestUrl: urlObj.origin + urlObj.pathname,
            type: 'xhr',
            params: [...urlObj.searchParams.entries()]
        })
    } else if (this.readyState === 4) {
        const { onXhrIntercept } = __global__.options
        if (this._matchItem) {
            const { status = 200, response, responseText } = this._matchItem
            modifyXhrProtoProps.call(this, {
                response: response === undefined ? this.response : response,
                responseText: responseText === undefined ? this.responseText : responseText,
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
        this._responseHeaders['content-type'] = this._forceMimeType
    }
    if (this._async) {
        handleStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED)
    } else {
        this._readyState = XMLHttpRequest.HEADERS_RECEIVED
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
        this._readyState = XMLHttpRequest.DONE
    }
}

export function handleStateChange(state) {
    this.readyState = state
    dispatchEvent.call(this, 'readystatechange')

    if (this.readyState == XMLHttpRequest.DONE) {
        dispatchEvent.call(this, 'load')
    }

    if (this.readyState == XMLHttpRequest.UNSENT || this.readyState == XMLHttpRequest.DONE) {
        dispatchEvent.call(this, 'loadend')
    }
}

export function dispatchEvent(type: string) {
    const handle = this['on' + type]
    handle && handle()
    this.dispatchEvent(new Event(type))
}