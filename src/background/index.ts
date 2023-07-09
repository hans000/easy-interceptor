/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from "../App"
import { matchPath } from "../tools"
import { ActionFieldKey, ActiveGroupId, BackgroundMsgKey, LogMsgKey, PopupMsgKey, RulesFieldKey, StorageMsgKey, WatchFilterKey } from "../tools/constants"
import { EventProps, createBackgroudAction } from "../tools/message"
import { arrayBufferToString, createRunFunc, objectToHttpHeaders, randID, trimUrlParams } from "../utils"
import { updateIcon } from "./utils"

let __result = new Map<string, any>()
let __action: ActionType
let __rules: MatchRule[] = []

updateIcon()

function update() {
    __result.clear()

    chrome.storage.local.get([ActionFieldKey], (result) => {
        __action = result[ActionFieldKey]
    })
}

chrome.tabs.onActivated.addListener(update)
chrome.tabs.onUpdated.addListener(update)

/** 接收popup传来的信息，并转发给content.js */
chrome.runtime.onMessage.addListener((msg: EventProps) => {
    // 过滤非本插件的消息
    if (msg.from !== PopupMsgKey) return;

    updateIcon()

    if (msg.from === PopupMsgKey) {
        // 重置result
        if (msg.type === StorageMsgKey) {
            __result.clear()
        }
        // 更新rule
        if (msg.key === 'rules') {
            __rules = msg.value
        }
        // 更新action
        if (msg.key === 'action') {
            __action = msg.value
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { ...msg, from: BackgroundMsgKey })
        })
    }
})

chrome.storage.local.get([RulesFieldKey, ActiveGroupId], (result) => {
    __rules = result[RulesFieldKey].filter(rule => (rule.groupId || 'default') === result[ActiveGroupId])
})

// 获取body数据
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const url = trimUrlParams(details.url)

        if (__action === 'watch') {
            return beforeRequestWatch(details, url)
        }
        if (__action === 'intercept') {
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
        if (__action === 'close') return

        const objectHeaders: Record<string, string> = Object.fromEntries(details.requestHeaders.map(({ name, value }) => [name, value]))
        if (__action === 'intercept') {
            return beforeSendHeadersIntercept(details, objectHeaders)
        }

        if (__action === 'watch') {
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
        if (__action === 'watch') {
            return responseStartedWatch(details);
        }
        if (__action === 'intercept') {
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

        chrome.storage.local.get([RulesFieldKey, ActionFieldKey, ActiveGroupId], (result) => {
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
            const fn = createRunFunc(rule.code, 'onRedirect')
            const redirectUrl = fn({
                ...rule,
                url: details.url,
            }) || rule.redirectUrl
            if (redirectUrl) {
                // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                //     chrome.tabs.sendMessage(tabs[0].id, {
                //         type: LogMsgKey,
                //         from: BackgroundMsgKey,
                //         key: 'log',
                //         value: {
                //             type: 'redirect',
                //             from: url,
                //             to: rule.redirectUrl
                //         }
                //     })
                // })
                return {
                    redirectUrl
                }
            }
        }
    }
}

function beforeRequestWatch(details: chrome.webRequest.WebRequestBodyDetails, url: string) {
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
