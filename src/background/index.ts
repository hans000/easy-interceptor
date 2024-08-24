/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from "../App"
import { matchPath, normalizeHeaders } from "../tools"
import { ActiveGroupId, BackgroundMsgKey, ConfigInfoFieldKey, PopupMsgKey, RulesFieldKey, WatchFilterKey } from "../tools/constants"
import { CustomEventProps, sendMessageToContent } from "../tools/message"
import updateIcon from "../tools/updateIcon"
import { arrayBufferToString, createRunFunc, randID, trimUrlParams } from "../tools"

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
    __rules = (result[RulesFieldKey] || []).filter((rule: MatchRule) => (rule.groupId || 'default') === result[ActiveGroupId])
})

// 获取body数据
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const url = trimUrlParams(details.url)

        // run at -> trigger 通知injected.js
        if (__configInfo.runAt === 'trigger' && matchPath(__configInfo.runAtTrigger!, url)) {
            sendMessageToContent({
                from: BackgroundMsgKey,
                type: 'trigger',
                payload: true,
            })
        }

        if (__configInfo.action === 'watch') {
            return beforeRequestWatch(details, url)
        }
        if (['intercept', 'proxy'].includes(__configInfo.action!)) {
            return beforeRequestIntercept(details, url)
        }
    },
    {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest', 'stylesheet', 'script', 'main_frame', 'sub_frame', 'font']
    },
    ['requestBody', 'blocking']
)

// 获取requestHeaders
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (__configInfo.action === 'close') return

        const objectHeaders: Record<string, string> = Object.fromEntries(details.requestHeaders!.map(({ name, value }) => [name, value!]))
        if (['intercept', 'proxy'].includes(__configInfo.action!)) {
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
// 修改responseHeaders
chrome.webRequest.onHeadersReceived.addListener(
    details => {
        if (['intercept', 'proxy'].includes(__configInfo.action!)) {
            return responseStartedIntercept(details);
        }
    },
    {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest']
    },
    ['blocking', 'extraHeaders', 'responseHeaders']
)

// 获取responseHeaders
chrome.webRequest.onResponseStarted.addListener(
    details => {
        if (__configInfo.action === 'watch') {
            return responseStartedWatch(details);
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
    // mark sendRequest index
    const index = +objectHeaders.Index

    if (index > -1) {
        const { requestHeaders: h } = __rules[index]
        const { Index, ...o } = objectHeaders
        const newHeadersMap = { ...o, ...h }
        const requestHeaders = normalizeHeaders(details.requestHeaders, newHeadersMap)

        return {
            requestHeaders
        }
    }

    const url = trimUrlParams(details.url)
    for (const rule of __rules) {
        if (rule.enable && matchPath(rule.test, url)) {
            const fn = createRunFunc(rule.code!, 'onRequestHeaders')
            const newHeadersMap = { ...rule.requestHeaders, ...fn(objectHeaders) }
            if (Object.keys(newHeadersMap).length) {
                const requestHeaders = normalizeHeaders(details.requestHeaders, newHeadersMap)
                return {
                    requestHeaders
                }
            }
        }
    }
}

function responseStartedIntercept(details: chrome.webRequest.WebResponseHeadersDetails) {
    const url = trimUrlParams(details.url)
    for (const rule of __rules) {
        if (rule.enable && matchPath(rule.test, url)) {
            const fn = createRunFunc(rule.code!, 'onResponseHeaders')
            const newHeadersMap = { ...rule.responseHeaders, ...fn(details.responseHeaders) }
            if (Object.keys(newHeadersMap).length) {
                const responseHeaders = normalizeHeaders(details.responseHeaders, newHeadersMap)
                return {
                    responseHeaders
                }
            }
        }
    }
}

function responseStartedWatch(details: chrome.webRequest.WebResponseCacheDetails) {
    if (! __result.has(details.requestId)) return

        const responseHeaders = Object.create(null)
        for (const { name, value } of details.responseHeaders!) {
            const lower = name.toLowerCase()
            // 过滤非json
            if (lower === 'content-type') {
                if (! value!.includes('json')) {
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
            {
                const fn = createRunFunc(rule.code!, 'onBlocking')
                const blocked = fn({
                    ...rule,
                    url: details.url,
                }) || rule.blocked
                if (blocked) {
                    return {
                        cancel: true
                    }
                }
            }
            {
                // 处理重定向优先级
                // code面板 > rule.redirectUrl
                const fn = createRunFunc(rule.code!, 'onRedirect')
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
}

function beforeRequestWatch(details: chrome.webRequest.WebRequestBodyDetails, url: string) {

    // 过滤请求
    if (['OPTIONS', 'CONNEST', 'TRACE', 'HEAD'].includes(details.method)) {
        return
    }

    if (! details.requestBody) {
        details.requestBody = { formData: {} }
    }

    let body: any
    if (details.requestBody.raw) {
        try {
            body = JSON.parse(arrayBufferToString(details.requestBody.raw[0].bytes!))
        } catch (error) {
            console.error(error)
            return
        }
    } else {
        const formData = details.requestBody.formData
        if (formData) {
            body = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v[0]]))
        }
    }

    chrome.storage.local.get([WatchFilterKey], (result) => {
        const filter = result[WatchFilterKey]
        if (!filter || matchPath(filter, url)) {
            __result.set(details.requestId, { body })
        }
    })
}
