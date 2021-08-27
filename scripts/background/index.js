chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 'toggle')
    })
})

function setBadgeText(rules, enable) {
    const count = rules.filter(item => item.enable).length
    const text = count > 99 ? '99+' : count === 0 ? '' : count + ''
    chrome.browserAction.setBadgeText({ text })
    chrome.browserAction.setBadgeBackgroundColor({ color: enable ? [24, 144, 255, 255] : [200, 200, 200, 255] })
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

function update(props = ['__hs_enable', '__hs_rules']) {
    chrome.storage.local.get(props, (result) => {
        if (result.hasOwnProperty('__hs_enable')) {
            setIcon(result.__hs_enable)
        }
        if (result.hasOwnProperty('__hs_rules')) {
            setBadgeText(result.__hs_rules, result.__hs_enable)
        }
    })
}

update()

// 接收iframe传来的信息，转发给content.js
chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === '__Hs_Transformer__' && msg.to === 'background') {
        update()
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { ...msg, to: 'content' })
        })
    }
})

