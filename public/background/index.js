(function() {
    function setBadgeText(rules, action) {
        if (action === 'interceptor') {
            const count = rules.filter(item => item.enable).length
            const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
            chrome.browserAction.setBadgeText({ text })
            chrome.browserAction.setBadgeBackgroundColor({ color: [24, 144, 255, 255] })
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
        if (value) {
            chrome.browserAction.setIcon({
                path: './images/128.png'
            })
        } else {
            chrome.browserAction.setIcon({
                path: './images/128_gray.png'
            })
        }
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
    
    // 更新origin
    chrome.tabs.onActivated.addListener((info) => {
        __result = {}
        chrome.tabs.query({ windowId: info.windowId, active: true }, (tabs) => {
            const [, a, b] = tabs[0].url.match(/^(https?:\/\/)?(.+?)(\/|$)/)
            __origin = a + b
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
            if (msg.type === '__hs_storage__') {
                __result = {}
            }
            if (msg.key === 'action') {
                __action = msg.value
            }
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (msg.key === 'rules') {
                    __rules = msg.value
                }
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
    
    // 获取requestHeaders
    chrome.webRequest.onBeforeSendHeaders.addListener(
        (details) => {
            if (__action !== 'watch') return;
            if (! __result[details.requestId]) return;
    
            const requestHeaders = details.requestHeaders.reduce((acc, { name, value }) => {
                acc[name] = value
                return acc
            }, {})
            __result[details.requestId].requestHeaders = requestHeaders
        },
        {
          urls: ["<all_urls>"],
          types: ["xmlhttprequest"]
        },
        ["requestHeaders"]
    )
    
    // 获取responseHeaders
    chrome.webRequest.onResponseStarted.addListener(
        details => {
            if (__action !== 'watch') return;
    
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
            
            chrome.storage.local.get(['__hs_rules__', '__hs_action__'], (result) => {
                chrome.storage.local.set({
                    __hs_rules__: [
                        ...result.__hs_rules__,
                        {
                            id: Math.random().toString(36).slice(2),
                            url: details.url,
                            method: details.method.toLowerCase(),
                            ...data,
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
})()

