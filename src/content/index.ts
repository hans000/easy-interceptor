/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import { ActionFieldKey, BackgroundMsgKey, CountMsgKey, LogMsgKey, ResponseMsgKey, RulesFieldKey, StorageMsgKey, SyncDataMsgKey, UpdateMsgKey } from '../tools/constants'
import { log } from '../tools/log'
import { noop } from '../utils'
import { createScript, syncData } from './utils'

function loadScripts() {
    chrome.storage.local.get([ActionFieldKey], result => {
        const action = result[ActionFieldKey] || 'close'
        if (action !== 'close') {
            createScript('injected.js').then(() => {
                log('✅ Injected successfully')
                // @ts-ignore 覆盖原函数
                loadScripts = noop
            })
        }
    })
}

loadScripts()

// 接收background.js传来的信息
chrome.runtime.onMessage.addListener(msg => {
    // 过滤消息
    if (msg.from !== BackgroundMsgKey) {
        return
    }

    // 转发给pagescript
    if (msg.type === StorageMsgKey) {
        postMessage(msg)
        if (msg.key === 'action') {
            loadScripts()
        }
        return
    }

    if (msg.type === LogMsgKey) {
        log(msg.value)
        return
    }
})

// 消息处理
let timer;
const queue = new Map()

function handle() {
    chrome.storage.local.get([RulesFieldKey, UpdateMsgKey], (result) => {
        const rules = result[RulesFieldKey]
        // 取出队列中的数据
        for (const [data, type] of queue) {
            // 监听时 拼接数据
            if (type === ResponseMsgKey) {
                for (let i = rules.length - 1; i >= 0; i--) {
                    const rule = rules[i]
                    if (rule.url === data.url) {
                        rule.response = data.response
                        chrome.storage.local.set({
                            [RulesFieldKey]: rules,
                            [UpdateMsgKey]: !result[UpdateMsgKey],
                        })
                        // 移除队列中的此条数据
                        queue.delete(data)
                        break
                    }
                }
            }
            // 拦截时计数
            if (type === CountMsgKey) {
                const rule = rules.find(rule => rule.id === data.id)
                if (rule) {
                    rule.count = rule.count + 1
                    chrome.storage.local.set({
                        [RulesFieldKey]: rules,
                        [UpdateMsgKey]: !result[UpdateMsgKey],
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

    if (type === SyncDataMsgKey) {
        syncData()
        return
    }

    queue.set(data, type)
    clearInterval(timer)
    timer = setInterval(() => handle(), 300)
}, false)