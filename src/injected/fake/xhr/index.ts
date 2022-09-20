import { __NativeXhr__, __Options__ } from ".."
import { hook, parseUrl, stringifyHeaders } from "../../../utils"
import { HttpStatusCodes } from "./constants"
import { handleReadyStateChange, handleStateChange, setResponseBody, setResponseHeaders } from "./handle"

interface MatchItem {
    status?: number
    sendReal?: boolean
    delay?: number
    response: string
    responseHeaders: Record<string, string>
}

class FakeXMLHttpRequest extends XMLHttpRequest {
    private _matchItem: MatchItem
    private _async: boolean
    private _forceMimeType = ''
    private _requestHeaders = {}
    private _responseHeaders = {}
    private _xhr: XMLHttpRequest | undefined

    constructor() {
        super()

        // whether run a fake xhr
        if (! __Options__.faked) {
            const xhr = new __NativeXhr__()
            xhr.addEventListener(
                "readystatechange",
                handleReadyStateChange.bind(xhr),
                false
            )
            return xhr as any
        }

        this._xhr = new __NativeXhr__()
    }

    public overrideMimeType(mimeType: string) {
        this._xhr.overrideMimeType(mimeType)
        this._forceMimeType = mimeType && mimeType.toLowerCase()
    }

    public open(method, url, async = true) {
        const { onMatch, onIntercept } = __Options__
        const urlObj = url instanceof URL ? url : parseUrl(url)
        this._matchItem = onMatch({
            method,
            requestUrl: urlObj.origin + urlObj.pathname
        })
        const xhr = this._xhr
        this._async = async
        xhr.open.apply(xhr, arguments)

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
        handleStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED)
        handleStateChange.call(this, XMLHttpRequest.LOADING)
        setTimeout(() => {
            if (matchItem.sendReal) {
                xhr.send(data)
            }
            const { status, responseHeaders, response } = matchItem
            setResponseHeaders.call(this, responseHeaders)
            // @ts-ignore this field has been proxy
            this.status = typeof status == "number" ? status : 200
            // @ts-ignore this field has been proxy
            this.statusText = HttpStatusCodes[this.status]
            setResponseBody.call(this, response)
        }, matchItem.delay || 0)
    }

    public setRequestHeader(name: string, value: string) {
        name = name.toLowerCase()
        if (! this._matchItem) {
            this._xhr.setRequestHeader(name, value)
            return
        }

        if (this._matchItem.sendReal) {
            this._xhr.setRequestHeader(name, value)
            this._requestHeaders[name] = value
            return 
        }

        this._requestHeaders[name] = value
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

        if (this.readyState < XMLHttpRequest.HEADERS_RECEIVED) {
            return null
        }

        if (/^Set-Cookie2?$/i.test(name)) {
            return null
        }

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

    public abort() {
        if (! this._matchItem) {
            this._xhr.abort()
            return
        }

        if (this._matchItem.sendReal) {
            this._xhr.abort()
        }

        // @ts-ignore this field has been proxy
        this.readyState = XMLHttpRequest.UNSENT
        this.dispatchEvent(new Event('abort'))
        this.dispatchEvent(new Event('error'))
    }

}

export default FakeXMLHttpRequest as any as typeof XMLHttpRequest