import { __Options__ } from ".."
import { parseUrl, parseXML } from "../../../utils"

export function modifyProto() {
    const { open, send, setRequestHeader } = XMLHttpRequest.prototype
    XMLHttpRequest.prototype.open = function(method: string, url: string) {
        this._method = method
        this._url = url
        open.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function(data) {
        this._requestData = data
        send.apply(this, arguments)
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
    if (this.readyState === 4) {
        if (this.responseType === '' || this.responseType === 'text') {
            const { onMatch, onIntercept } = __Options__
            const urlObj = this._url instanceof URL ? this._url : parseUrl(this._url)

            const matchItem = onMatch({
                method: this._method,
                requestUrl: urlObj.origin + urlObj.pathname
            })

            if (matchItem) {
                Object.defineProperty(this, 'responseText', {
                    get() {
                        return matchItem.response
                    },
                })
                Object.defineProperty(this, 'response', {
                    get() {
                        return matchItem.response
                    },
                })
            }

            onIntercept(matchItem).onload(this)
        }
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
        this._handleStateChange(XMLHttpRequest.HEADERS_RECEIVED)
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
        this._handleStateChange(XMLHttpRequest.DONE)
    } else {
        this._readyState = XMLHttpRequest.DONE
    }
}

export function handleStateChange(state) {
    this.readyState = state
    this.dispatchEvent(new Event('readystatechange'))

    if (this.readyState == XMLHttpRequest.DONE) {
        this.dispatchEvent(new Event('load'))
    }

    if (this.readyState == XMLHttpRequest.UNSENT || this.readyState == XMLHttpRequest.DONE) {
        this.dispatchEvent(new Event('loadend'))
    }
}