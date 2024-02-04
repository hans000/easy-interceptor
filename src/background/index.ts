/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from "../App"
import { matchPath } from "../tools"
import { ActiveGroupId, BackgroundMsgKey, ConfigInfoFieldKey, PopupMsgKey, RulesFieldKey, WatchFilterKey } from "../tools/constants"
import { CustomEventProps, sendMessageToContent } from "../tools/message"
import updateIcon from "../tools/updateIcon"
import { arrayBufferToString, createRunFunc, objectToHttpHeaders, randID, trimUrlParams } from "../tools"
import { URL } from "url"

let __result = new Map<string, any>()
let __rules: MatchRule[] = []
let __configInfo: Partial<ConfigInfoType> = {}

updateIcon()

function update() {
    __result.clear()

    chrome.storage.local.get([ConfigInfoFieldKey], (result) => {
        __configInfo.action = (result[ConfigInfoFieldKey] || {}).action
    })
}

chrome.tabs.onActivated.addListener(update)
chrome.tabs.onUpdated.addListener(update)

// 接收popup传来的信息，并转发给content.js
chrome.runtime.onMessage.addListener((msg: CustomEventProps) => {
    // 过滤非本插件的消息
    if (msg.from !== PopupMsgKey) {
        return
    }

    if (msg.type === 'rules') {
        __rules = msg.payload || []
    }
    if (msg.type === 'configInfo') {
        __configInfo = msg.payload || {}
    }

    updateIcon()
    sendMessageToContent({ ...msg, from: BackgroundMsgKey })
})

chrome.storage.local.get([RulesFieldKey, ActiveGroupId], (result) => {
    __rules = (result[RulesFieldKey] || []).filter(rule => (rule.groupId || 'default') === result[ActiveGroupId])
})

// 获取body数据
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const url = trimUrlParams(details.url)

        // run at -> trigger 通知injected.js
        if (__configInfo.runAt === 'trigger' && matchPath(__configInfo.runAtTrigger, url)) {
            sendMessageToContent({
                from: BackgroundMsgKey,
                type: 'trigger',
                payload: true,
            })
        }

        if (__configInfo.action === 'watch') {
            return beforeRequestWatch(details, url)
        }
        if (__configInfo.action === 'intercept') {
            return beforeRequestIntercept(details, url)
        }
    },
    {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest', 'stylesheet', 'script', 'main_frame', 'sub_frame']
    },
    ['requestBody', 'blocking']
)

// 获取requestHeaders
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (__configInfo.action === 'close') return

        const objectHeaders: Record<string, string> = Object.fromEntries(details.requestHeaders.map(({ name, value }) => [name, value]))
        if (__configInfo.action === 'intercept') {
            return beforeSendHeadersIntercept(details, objectHeaders)
        }

        if (__configInfo.action === 'watch') {
            return beforeSendHeadersWatch(details, objectHeaders)
        }
    },
    {
      urls: ['<all_urls>'],
      types: ['xmlhttprequest']
    },
    ['blocking', 'extraHeaders', 'requestHeaders']
)

// 获取responseHeaders
chrome.webRequest.onResponseStarted.addListener(
    details => {
        if (__configInfo.action === 'watch') {
            return responseStartedWatch(details);
        }
        if (__configInfo.action === 'intercept') {
            return responseStartedIntercept(details);
        }
    },
    {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest']
    },
    ['responseHeaders']
)

function beforeSendHeadersWatch(details: chrome.webRequest.WebRequestHeadersDetails, objectHeaders: Record<string, string>) {
    if (! __result.has(details.requestId)) return;
    __result.get(details.requestId).requestHeaders = objectHeaders
}

function beforeSendHeadersIntercept(details: chrome.webRequest.WebRequestHeadersDetails, objectHeaders: Record<string, string>) {
    const index = +objectHeaders.Index

    if (index > -1) {
        const { requestHeaders: h } = __rules[index]
        const { Index, ...o } = objectHeaders
        const newHeaders = { ...o, ...h }
        return {
            requestHeaders: objectToHttpHeaders(newHeaders)
        }
    }

    const url = trimUrlParams(details.url)
    for (const rule of __rules) {
        if (rule.enable && matchPath(rule.test, url)) {
            const fn = createRunFunc(rule.code, 'onRequestHeaders')
            const newHeaders = fn(objectHeaders)
            if (newHeaders) {
                return {
                    requestHeaders: objectToHttpHeaders(newHeaders)
                }
            }
        }
    }
}

function responseStartedIntercept(details: chrome.webRequest.WebResponseCacheDetails) {
    const url = trimUrlParams(details.url)
    for (const rule of __rules) {
        if (rule.enable && matchPath(rule.test, url)) {
            const fn = createRunFunc(rule.code, 'onRequestHeaders')
            const newHeaders = fn(details.responseHeaders)
            if (newHeaders) {
                return {
                    responseHeaders: objectToHttpHeaders(newHeaders)
                }
            }
        }
    }
}

function responseStartedWatch(details: chrome.webRequest.WebResponseCacheDetails) {
    if (! __result.has(details.requestId)) return

        const responseHeaders = Object.create(null)
        for (const { name, value } of details.responseHeaders) {
            const lower = name.toLowerCase()
            // 过滤非json
            if (lower === 'content-type') {
                if (! value.includes('json')) {
                    __result.delete(details.requestId)
                    return
                }
            }
            responseHeaders[name] = value
        }

        const data = __result.get(details.requestId)

        data.responseHeaders = responseHeaders

        const urlObj = new URL(details.url)

        if (details.method.toLowerCase() === 'options') {
            __result.delete(details.requestId)
            return
        }

        chrome.storage.local.get([RulesFieldKey, ActiveGroupId], (result) => {
            chrome.storage.local.set({
                [RulesFieldKey]: [
                    ...result[RulesFieldKey],
                    {
                        id: randID(),
                        count: 0,
                        groupId: result[ActiveGroupId],
                        url: urlObj.origin + urlObj.pathname,
                        test: urlObj.pathname,
                        method: details.method.toLowerCase(),
                        body: data.body,
                        params: Array.from(urlObj.searchParams.entries()),
                        requestHeaders: data.requestHeaders,
                        responseHeaders: data.responseHeaders,
                        response: null,
                    }
                ],
            })
            updateIcon()
            __result.delete(details.requestId)
        })
}

function beforeRequestIntercept(details: chrome.webRequest.WebRequestBodyDetails, url: string) {
    for (const rule of __rules) {
        if (rule.enable && matchPath(rule.test, url)) {
            // 处理重定向优先级
            // code面板 > rule.redirectUrl
            const fn = createRunFunc(rule.code, 'onRedirect')
            const redirectUrl = fn({
                ...rule,
                url: details.url,
            }) || rule.redirectUrl
            if (redirectUrl) {
                return {
                    redirectUrl
                }
            }
        }
    }
}

function beforeRequestWatch(details: chrome.webRequest.WebRequestBodyDetails, url: string) {

    // 过滤请求
    if (['OPTIONS', 'CONNEST', 'TRACE', 'HEAD'].includes(details.method)) {
        return
    }

    if (! details.requestBody) {
        details.requestBody = { formData: {} }
    }

    let body
    if (details.requestBody.raw) {
        try {
            body = JSON.parse(arrayBufferToString(details.requestBody.raw[0].bytes))
        } catch (error) {
            console.error(error)
            return
        }
    } else {
        const formData = details.requestBody.formData
        body = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v[0]]))
    }

    chrome.storage.local.get([WatchFilterKey], (result) => {
        const filter = result[WatchFilterKey]
        if (!filter || matchPath(filter, url)) {
            __result.set(details.requestId, { body })
        }
    })
}
