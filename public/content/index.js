(function() {
    // 加载脚本
    async function loadScripts() {
        await createScript('injected/core.js')
        initData()
    }

    loadScripts()

    // 接收background.js传来的信息
    chrome.runtime.onMessage.addListener(msg => {
        // 过滤消息
        if (msg.from !== '__hs_background__') {
            return
        }

        // 转发给pageScript
        if (msg.type === '__hs_storage__') {
            postMessage({ ...msg })
            return
        }
    })

    // 接收pagescript传来的信息
    window.addEventListener("pagescript", function (event) {
        const data = event.detail.data
        chrome.storage.local.get(['__hs_rules__'], (result) => {
            const rules = result.__hs_rules__
            const rule = rules.find(rule => rule.url === data.url)
            if (rule) {
                rule.response = JSON.parse(data.response)
                chrome.storage.local.set({
                    __hs_rules__: rules
                })
            }
        })
    }, false)
})()