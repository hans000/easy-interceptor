/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from "../App"
import { matchPath } from "../tools"
import { ActionFieldKey, BackgroundMsgKey, PopupMsgKey, RulesFieldKey, StorageMsgKey, WatchFilterKey } from "../tools/constants"
import { arrayBufferToString } from "../utils"
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
chrome.runtime.onMessage.addListener(msg => {
    // 过滤非本插件的消息
    if (msg.from !== PopupMsgKey) return;

    updateIcon()
    
    if (msg.from === PopupMsgKey) {
        // 重置result
        if (msg.type === StorageMsgKey) {
            __result.clear()
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

// 获取body数据
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        const urlObj = new URL(details.url)
        const url = urlObj.origin + urlObj.pathname

        if (__action === 'intercept') {
            for (const rule of __rules) {
                if (rule.enable && rule.redirectUrl && matchPath(rule.test, url)) {
                    return {
                        redirectUrl: rule.redirectUrl
                    }
                }
            }
        }

        if (__action === 'watch') {
            if (! details.requestBody) {
                details.requestBody = { formData: {} }
            }
    
            if (details.requestBody.raw) {
                try {
                    const body = JSON.parse(arrayBufferToString(details.requestBody.raw[0].bytes))
                    __result.set(details.requestId, { body })
                } catch (error) {
                    console.error(error)
                    return
                }
            }

            chrome.storage.local.get([WatchFilterKey], (result) => {
                const filter = result[WatchFilterKey]

                if (!filter || matchPath(filter, url)) {
                    const formData = details.requestBody.formData
                    const body = Object.keys(formData).reduce((acc, key) => {
                        acc[key] = formData[key][0]
                        return acc
                    }, {})
                    __result.set(details.requestId, { body })
                }
            })
        }
    },
    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["requestBody", "blocking"]
)

chrome.storage.onChanged.addListener(result => {
    if (result[RulesFieldKey] !== undefined) {
        __rules = result[RulesFieldKey].newValue
    }
})

chrome.storage.local.get([RulesFieldKey], (result) => {
    __rules = result[RulesFieldKey]
})

// 获取requestHeaders
chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (__action === 'close') return

        const objectHeaders = details.requestHeaders.reduce((acc, { name, value }) => {
            acc[name] = value
            return acc
        }, {}) as any

        if (__action === 'intercept') {
            const index = +objectHeaders.Index
    
            if (index > -1) {
                const { requestHeaders: h } = __rules[index]
                const { Index, ...o } = objectHeaders
                const mergeObj = { ...o, ...h }
                const requestHeaders = Object.keys(mergeObj).map(key => ({ name: key, value: mergeObj[key] }))
                return { requestHeaders }
            }
        }

        if (__action === 'watch') {
            if (! __result.has(details.requestId)) return;
    
            __result.get(details.requestId).requestHeaders = objectHeaders
        }
    },
    {
      urls: ["<all_urls>"],
      types: ["xmlhttprequest"]
    },
    ['blocking', 'extraHeaders', "requestHeaders"]
)

// 获取responseHeaders
chrome.webRequest.onResponseStarted.addListener(
    details => {
        if (__action !== 'watch') return;

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
        
        chrome.storage.local.get([RulesFieldKey, ActionFieldKey], (result) => {
            chrome.storage.local.set({
                [RulesFieldKey]: [
                    ...result[RulesFieldKey],
                    {
                        id: Math.random().toString(36).slice(2),
                        count: 0,
                        url: urlObj.origin + urlObj.pathname,
                        test: urlObj.origin + urlObj.pathname,
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
    },
    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["responseHeaders"]
)
