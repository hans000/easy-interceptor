import { MatchRule } from "../App"
import { ActionFieldKey, BackgroundMsgKey, IframeMsgKey, RulesFieldKey, StorageMsgKey } from "../tools/constants"
import { pathMatch } from "../utils"
import { updateIcon } from "./utils"

let __result = {}
let __action: ActionType
let __origin = ''
let __rules: MatchRule[] = []

updateIcon()

// 更新origin
chrome.tabs.onActivated.addListener((info) => {
    __result = {}
    chrome.tabs.query({ windowId: info.windowId, active: true }, (tabs) => {
        try {
            const [, a, b] = tabs[0].url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
            __origin = a + b
        } catch (error) {}
    })

    chrome.storage.local.get([ActionFieldKey], (result) => {
        __action = result[ActionFieldKey]
    })
})
chrome.tabs.onUpdated.addListener((_, __, info) => {
    __result = {}
    chrome.tabs.query({ windowId: info.windowId, active: true }, (tabs) => {
        try {
            const [, a, b] = tabs[0].url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
            __origin = a + b
        } catch (error) {}
    })

    chrome.storage.local.get([ActionFieldKey], (result) => {
        __action = result[ActionFieldKey]
    })
})

/** 接收iframe传来的信息，并转发给content.js */
chrome.runtime.onMessage.addListener(msg => {
    // 过滤非本插件的消息
    if (msg.from !== IframeMsgKey) return;

    updateIcon()
    
    if (msg.from === IframeMsgKey) {
        // 重置result
        if (msg.type === StorageMsgKey) {
            __result = {}
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

        if (__action === 'intercept') {
            const urlObj = new URL(details.url)
            const url = urlObj.origin + urlObj.pathname
            for (const rule of __rules) {
                if (rule.enable && rule.redirectUrl && pathMatch(rule.url, url)) {
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
                return;
            }
    
            const formData = details.requestBody.formData
            const body = Object.keys(formData).reduce((acc, key) => {
                acc[key] = formData[key][0]
                return acc
            }, {})
            __result[details.requestId] = { body }
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
        if (__action === 'close') {
            return
        }

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
            if (! __result[details.requestId]) return;
    
            __result[details.requestId].requestHeaders = objectHeaders
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

        // 要求id匹配，域名相同，
        if (!__result[details.requestId] || !__origin || !details.url.startsWith(__origin)) {
            delete __result[details.requestId]
            return
        }

        const responseHeaders = Object.create(null)
        for (const { name, value } of details.responseHeaders) {
            const lower = name.toLowerCase()
            // 过滤非json
            if (lower === 'content-type') {
                if (! value.includes('json')) {
                    delete __result[details.requestId]
                    return
                }
            }
            responseHeaders[name] = value
        }

        __result[details.requestId].responseHeaders = responseHeaders

        const data = __result[details.requestId]

        const urlObj = new URL(details.url)
        
        chrome.storage.local.get([RulesFieldKey, ActionFieldKey], (result) => {
            chrome.storage.local.set({
                [RulesFieldKey]: [
                    ...result[RulesFieldKey],
                    {
                        id: Math.random().toString(36).slice(2),
                        count: 0,
                        url: urlObj.origin + urlObj.pathname,
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
            delete __result[details.requestId]
        })
    },
    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["responseHeaders"]
)