import { delayRun } from "../../../tools"
import { parseUrl, parseXML } from "../../../utils"
import { __global__ } from "../globalVar"

export function modifyProto() {
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

export function handleReadyStateChange() {
    if (this.readyState === 1) {
        const { onMatch } = __global__.options
        const urlObj = this._url instanceof URL ? this._url : parseUrl(this._url)
        this._matchItem = onMatch({
            method: this._method,
            requestUrl: urlObj.origin + urlObj.pathname
        })
    } else if (this.readyState === 4) {
        const { onXhrIntercept } = __global__.options
        if (this._matchItem) {
            Object.defineProperty(this, 'responseText', {
                get() {
                    return this._matchItem.response
                },
            }) 
            Object.defineProperty(this, 'response', {
                get() {
                    return this._matchItem.response
                },
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