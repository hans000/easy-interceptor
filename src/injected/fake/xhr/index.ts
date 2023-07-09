/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { __global__ } from "../globalVar"
import { stringifyHeaders } from "../../../utils"
import { HttpStatusCodes } from "./constants"
import { dispatchEvent, handleReadyStateChange, handleStateChange, setResponseBody, setResponseHeaders } from "./handle"
import { delayRun } from "../../../tools"
import { log } from "../../../tools/log"

interface MatchItem {
    status?: number
    delay?: number
    response: any
    responseText: string
    responseHeaders?: Record<string, string>
}

class FakeXMLHttpRequest extends XMLHttpRequest {
    private _async: boolean
    private _forceMimeType = ''
    private _requestHeaders = {}
    private _responseHeaders = {}
    private _url = ''
    private _method = ''
    private _xhr: (XMLHttpRequest & { _matchItem?: MatchItem }) | undefined
    public status: number
    public statusText: string
    public response: any
    public responseText: string
    public readyState: number

    constructor() {
        super()

        // whether run a fake xhr
        if (! __global__.options.faked) {
            const xhr = new __global__.NativeXhr()
            xhr.addEventListener(
                "readystatechange",
                handleReadyStateChange.bind(xhr)
            )
            return xhr as any
        }

        this._xhr = new __global__.NativeXhr()
        this._xhr.addEventListener(
            "readystatechange",
            handleReadyStateChange.bind(this._xhr)
        )
        this.addEventListener("readystatechange", () => {
            if (this.readyState === 4) {
                __global__.options.onXhrIntercept(this._xhr._matchItem).call(this, this)
            }
        })
    }

    public overrideMimeType(mimeType: string) {
        this._xhr.overrideMimeType(mimeType)
        this._forceMimeType = mimeType && mimeType.toLowerCase()
    }

    public open(method, url, async = true) {
        this._async = async
        this._url = url
        this._method = method
        this._xhr.open.apply(this._xhr, arguments)
    }

    public send(data) {
        const matchItem = this._xhr._matchItem
        const xhr = this._xhr
        if (! matchItem) {
            xhr.send(data)
            return
        }

        if (__global__.options.faked && __global__.options.fakedLog) {
            log({
                type: 'xhr:request',
                url: this._url,
                method: this._method,
                headers: this._requestHeaders,
                body: data,
            })
        }

        dispatchEvent.call(this, 'loadstart')
        handleStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED)
        handleStateChange.call(this, XMLHttpRequest.LOADING)
        delayRun(() => {
            const { status = 200, responseHeaders, response, responseText } = matchItem
            setResponseHeaders.call(this, responseHeaders)
            // @ts-ignore this field has been proxy
            this.status = status
            // @ts-ignore this field has been proxy
            this.statusText = HttpStatusCodes[this.status]
            setResponseBody.call(this, response ? JSON.stringify(response) : responseText)
            log({
                type: 'xhr:response',
                url: this._url,
                method: this._method,
                status,
                headers: responseHeaders,
                response,
                responseText,
            })
        }, matchItem.delay)
    }

    public setRequestHeader(name: string, value: string) {
        name = name.toLowerCase()
        if (! this._xhr._matchItem) {
            this._xhr.setRequestHeader(name, value)
            return
        }

        this._requestHeaders[name] = value
    }

    public getResponseHeader(name: string) {
        name = name.toLowerCase()
        if (! this._xhr._matchItem) {
            return this._xhr.getResponseHeader(name)
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
        if (! this._xhr._matchItem) {
            return this._xhr.getAllResponseHeaders()
        }

        return stringifyHeaders(this._responseHeaders)
    }

    public abort() {
        if (! this._xhr._matchItem) {
            this._xhr.abort()
            return
        }

        // @ts-ignore this field has been proxy
        this.readyState = XMLHttpRequest.UNSENT
        dispatchEvent.call(this, 'abort')
        dispatchEvent.call(this, 'error')
    }

}

export default FakeXMLHttpRequest as any as typeof XMLHttpRequest
