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

function update(props = ['__hs_action', '__hs_rules']) {
    chrome.storage.local.get(props, (result) => {
        if (result.hasOwnProperty('__hs_action')) {
            setIcon(result.__hs_action)
        }
        if (result.hasOwnProperty('__hs_rules')) {
            setBadgeText(result.__hs_rules, result.__hs_action)
        }
    })
}

update()

// 接收iframe传来的信息，转发给content.js
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type !== '__Hs_Transformer__') return;
    
    update()
    
    if (msg.from === 'iframe') {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { ...msg, to: 'content', from: 'iframe' })
        })
    }
})

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        console.log(details);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length) {
                const [origin] = tabs[0].url.match(/^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}(\/)/)
                if (details.url.startsWith(origin)) {
                    chrome.storage.local.get(['__hs_rules', '__hs_action'], (result) => {
                        if (result.__hs_action === 'watch') {
                            chrome.storage.local.set({
                                __hs_rules: [
                                    ...result.__hs_rules,
                                    {
                                        id: Math.random().toString(36).slice(2),
                                        url: details.url,
                                        method: details.method.toLowerCase(),
                                        requestHeaders: details.requestHeaders,
                                    }
                                ],
                            })
                        }
                    })
                }
            }
        })
    },
    {
      urls: ["<all_urls>"],
      types: ["xmlhttprequest"]
    },
);