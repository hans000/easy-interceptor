(function(chrome) {
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
        const { data, type } = event.detail
        chrome.storage.local.get(['__hs_rules__'], (result) => {
            const rules = result.__hs_rules__
            // 监听时拼接数据
            if (type === '__hs_response__') {
                const rule = rules.reverse().find(rule => rule.url === data.url)
                if (rule) {
                    rule.response = data.response
                    chrome.storage.local.set({
                        __hs_rules__: rules
                    })
                }
            }
            // 拦截时计数
            if (type === '__hs_count__') {
                const rule = rules.find(rule => rule.id === data.id)
                if (rule) {
                    rule.count = rule.count + 1
                    chrome.storage.local.set({
                        __hs_rules__: rules
                    })
                }
            }
        })
    }, false)
})(chrome)