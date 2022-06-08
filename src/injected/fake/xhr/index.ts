import { __NativeXhr__, __Options__ } from ".."
import { hook, parseUrl, parseXML, stringifyHeaders } from "../../../utils"
import { HttpStatusCodes, UnsafeHeaders, XhrStates } from "./constants"
import { CustomEventTarget } from "./event"

type Writable<T> = {
    -readonly [P in keyof T]: T[P];
}

interface MatchItem {
    status?: number
    sendReal?: boolean
    delay?: number
    response: string
    responseHeaders: Record<string, string>
}

interface FakeXMLHttpRequest extends Writable<Omit<XMLHttpRequest, 'addEventListener' | 'removeEventListener' | 'dispatchEvent'>> { }

class FakeXMLHttpRequest extends CustomEventTarget {
    private _url
    private _method = ''
    private _matchItem: MatchItem
    private _async: boolean
    private _forceMimeType = ''
    private _requestHeaders = {}
    private _responseHeaders = {}
    private _xhr: XMLHttpRequest | undefined
    
    public upload = Object.create(CustomEventTarget)

    constructor() {
        super()
        const xhr = __NativeXhr__ ? new __NativeXhr__() : new window.XMLHttpRequest()

        for (const key in xhr) {
            const type = typeof xhr[key]

            // sync event proeprty and responseXML, like onload, onreadystatechage
            if (xhr[key] === null) {
                this[key] = null
                continue
            }
            
            // sync property, like status, response
            if (/^(number|boolean|string)$/.test(type)) {
                this[key] = xhr[key]
                continue
            }
        }

        this._xhr = xhr
    }
    private _handleStateChange(state: number) {
        this.readyState = state
        // if (typeof this.onreadystatechange == 'function') {
        //     this.onreadystatechange(new Event('readystatechange'))
        // }
        this.dispatchEvent(new Event('readystatechange'))
        if (this.readyState == XhrStates.DONE) {
            this.dispatchEvent(new Event('load'))
        }
        if (this.readyState == XhrStates.UNSENT || this.readyState == XhrStates.DONE) {
            this.dispatchEvent(new Event('loadend'))
        }
    }
    public overrideMimeType(mimeType: string) {
        this._xhr.overrideMimeType(mimeType)
        this._forceMimeType = mimeType && mimeType.toLowerCase()
    }
    public open(method: string, url: string | URL, async?: boolean, username?: string | null | undefined, password?: string | null | undefined) {
        this._method = method.toLowerCase()
        this._url = url.toString()
        this._async = typeof async == 'boolean' ? async : true
        this.responseText = ''
        this.response = this.responseText
        this.responseXML = null
        this.responseURL = this._url
        this._requestHeaders = {}
        this._handleStateChange(XhrStates.OPENED)

        const { onMatch, onIntercept } = __Options__
        const urlObj = url instanceof URL ? url : parseUrl(url)
        this._matchItem = onMatch({
            method: this._method,
            requestUrl: urlObj.origin + urlObj.pathname
        })
        const xhr = this._xhr
        
        xhr.open(method, url, this._async, username, password)
        // this._setResponseHeaders(this._matchItem.responseHeaders)
        hook(this, xhr, onIntercept(this._matchItem))
    }
    public send(data) {
        const matchItem = this._matchItem
        const xhr = this._xhr
        
        if (! matchItem) {
            xhr.send(data)
            return
        }

        this.dispatchEvent(new Event("loadstart"))
        this._handleStateChange(XhrStates.HEADERS_RECEIVED)
        this._handleStateChange(XhrStates.LOADING)

        setTimeout(() => {
            if (matchItem.sendReal) {
                xhr.send(data)
            }
            const { status, responseHeaders, response } = matchItem
            this._setResponseHeaders(responseHeaders)
            this.status = typeof status == "number" ? status : 200
            this.statusText = HttpStatusCodes[this.status]
            this._setResponseBody(response)
        }, matchItem.delay || 0);
    }
    public setRequestHeader(name: string, value: string) {
        if (UnsafeHeaders.includes(name) || /^(Sec-|Proxy-)/.test(name)) {
            throw new Error("Refused to set unsafe header \"" + name + "\"")
        }

        if (!this._matchItem) {
            this._xhr.setRequestHeader(name, value)
            return
        }

        if (this._matchItem.sendReal) {
            this._xhr.setRequestHeader(name, value)
        }

        this._xhr.setRequestHeader(name, value)
        if (this._requestHeaders[name]) {
            this._requestHeaders[name] += "," + value
        } else {
            this._requestHeaders[name] = value
        }
    }
    private _setResponseHeaders(headers) {
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
            this._handleStateChange(XhrStates.HEADERS_RECEIVED)
        } else {
            this.readyState = XhrStates.HEADERS_RECEIVED
        }
    }
    private _setResponseBody(body = '') {
        this.response = this.responseText = body
        
        const type = this.getResponseHeader("content-type")
        if (this.responseText && (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
            try {
                this.responseXML = parseXML(this.responseText)
            } catch (e) {
            }
        }
        if (this._async) {
            this._handleStateChange(XhrStates.DONE)
        } else {
            this.readyState = XhrStates.DONE
        }
    }
    public abort() {
        if (! this._matchItem) {
            this._xhr.abort()
            return
        }

        if (this._matchItem.sendReal) {
            this._xhr.abort()
        }

        this.readyState = XhrStates.UNSENT;
        this.dispatchEvent(new Event('abort'))
        this.dispatchEvent(new Event('error'))
    }
    public getResponseHeader(name: string) {
        name = name.toLowerCase()
        if (! this._matchItem) {
            return this._xhr.getResponseHeader(name)
        }

        if (this._matchItem.sendReal) {
            return name in this._responseHeaders
                ? this._responseHeaders[name]
                : this._xhr.getResponseHeader(name)
        }

        if (this.readyState < XhrStates.HEADERS_RECEIVED) return null
        if (/^Set-Cookie2?$/i.test(name)) return null
        return this._responseHeaders[name]
    }
    public getAllResponseHeaders() {
        if (! this._matchItem) {
            return this._xhr.getAllResponseHeaders()
        }

        if (this._matchItem.sendReal) {
            return this._xhr.getAllResponseHeaders() + stringifyHeaders(this._responseHeaders)
        }
        
        return stringifyHeaders(this._responseHeaders)
    }
}

Object.keys(XhrStates).forEach(key => FakeXMLHttpRequest[key] = XhrStates[key])

export default FakeXMLHttpRequest