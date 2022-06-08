import { createScript, initData } from './utils'

async function loadScripts() {
    await createScript('injected.js')
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

    if (msg.type === '__hs_log__') {
        console.log('[EI]', msg.value)
        return
    }
})

// 消息处理
let timer;
const queue = new Map()

function handle() {
    chrome.storage.local.get(['__hs_rules__', '__hs_update__'], (result) => {
        const rules = result.__hs_rules__
        // 取出队列中的数据
        for (const [data, type] of queue) {
            // 监听时 拼接数据
            if (type === '__hs_response__') {
                for (let i = rules.length - 1; i >= 0; i--) {
                    const rule = rules[i]
                    if (rule.url === data.url) {
                        rule.response = data.response
                        chrome.storage.local.set({
                            __hs_rules__: rules,
                            __hs_update__: !result.__hs_update__,
                        })
                        // 移除队列中的此条数据
                        queue.delete(data)
                        break
                    }
                }
            }
            // 拦截时计数
            if (type === '__hs_count__') {
                const rule = rules.find(rule => rule.id === data.id)
                if (rule) {
                    rule.count = rule.count + 1
                    chrome.storage.local.set({
                        __hs_rules__: rules,
                        __hs_update__: !result.__hs_update__,
                    })
                    // 移除队列中的此条数据
                    queue.delete(data)
                }
            }
        }

        if (! queue.size) {
            clearInterval(timer)
        }
    })
}

// 接收pagescript传来的信息
window.addEventListener("pagescript", (event: any) => {
    const { data, type } = event.detail
    queue.set(data, type)
    clearInterval(timer)
    timer = setInterval(() => handle(), 300)
}, false)