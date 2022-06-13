import { MatchRule } from "../App"

function setBadgeText(rules, action) {
    if (action === 'intercept') {
        const count = rules.filter(item => item.enable).length
        const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
        chrome.browserAction.setBadgeText({ text })
        chrome.browserAction.setBadgeBackgroundColor({ color: [136, 20, 127, 255] })
    } else if (action === 'watch') {
        const count = rules.length
        const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
        chrome.browserAction.setBadgeText({ text })
        chrome.browserAction.setBadgeBackgroundColor({ color: [241, 89, 43, 255] })
    } else {
        const count = rules.length
        const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
        chrome.browserAction.setBadgeText({ text })
        chrome.browserAction.setBadgeBackgroundColor({ color: [200, 200, 200, 255] })
    }
}

function setIcon(value) {
    const suffix = value === 'watch'
        ? '-red'
        : value === 'close'
            ? '-gray'
            : ''
    chrome.browserAction.setIcon({
        path: {
            16: `/images/16${suffix}.png`,
            32: `/images/32${suffix}.png`,
            48: `/images/48${suffix}.png`,
        }
    })
}

function update(props = ['__hs_action__', '__hs_rules__']) {
    chrome.storage.local.get(props, (result) => {
        if (result.hasOwnProperty('__hs_action__')) {
            setIcon(result.__hs_action__)
        }
        if (result.hasOwnProperty('__hs_rules__')) {
            setBadgeText(result.__hs_rules__, result.__hs_action__)
        }
    })
}

update()

let __result = {}
let __action = ''
let __origin = ''
let __rules: MatchRule[] = []

// 更新origin
chrome.tabs.onActivated.addListener((info) => {
    __result = {}
    chrome.tabs.query({ windowId: info.windowId, active: true }, (tabs) => {
        try {
            const [, a, b] = tabs[0].url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
            __origin = a + b
        } catch (error) {}
    })

    chrome.storage.local.get(['__hs_action__'], (result) => {
        __action = result.__hs_action__
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

    chrome.storage.local.get(['__hs_action__'], (result) => {
        __action = result.__hs_action__
    })
})

/** 接收iframe传来的信息，并转发给content.js */
chrome.runtime.onMessage.addListener(msg => {
    // 过滤非本插件的消息
    if (msg.from !== '__hs_iframe__') return;

    update()
    
    if (msg.from === '__hs_iframe__') {
        // 重置result
        if (msg.type === '__hs_storage__') {
            __result = {}
        }
        // 更新action
        if (msg.key === 'action') {
            __action = msg.value
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            // if (msg.key === 'rules') {
            //     __rules = msg.value
            // }
            chrome.tabs.sendMessage(tabs[0].id, { ...msg, from: '__hs_background__' })
        })
    }
})

// 获取body数据
chrome.webRequest.onBeforeRequest.addListener(
    details => {
        if (__action !== 'watch') return;

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
    },
    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["requestBody"]
)

chrome.storage.onChanged.addListener(result => {
    if (result.__hs_rules__ !== undefined) {
        __rules = result.__hs_rules__.newValue
    }
})

chrome.storage.local.get(['__hs_rules__'], (result) => {
    __rules = result.__hs_rules__
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
        
        chrome.storage.local.get(['__hs_rules__', '__hs_action__'], (result) => {
            chrome.storage.local.set({
                __hs_rules__: [
                    ...result.__hs_rules__,
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
            update()
            delete __result[details.requestId]
        })
    },
    {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
    },
    ["responseHeaders"]
)