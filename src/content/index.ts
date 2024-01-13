/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ActiveGroupId, BackgroundMsgKey,  ConfigInfoFieldKey, ContentMsgKey, CountMsgKey, LogMsgKey, PageScriptEventName, PageScriptMsgKey, PopupMsgKey, ResponseMsgKey, RulesFieldKey, StorageMsgKey, SyncDataMsgKey, UpdateMsgKey } from '../tools/constants'
import { CustomEventProps, SyncFields, dispatchPageScriptEvent } from '../tools/message'
import { createScript, noop } from '../utils'
import { log } from '../tools/log'
import { ConfigInfoType, MatchRule } from '../App'

function loadScripts() {
    chrome.storage.local.get([ConfigInfoFieldKey], result => {
        const configInfo: Partial<ConfigInfoType> = result[ConfigInfoFieldKey] || {}
        if (['watch', 'intercept'].includes(configInfo.action) && window.self === window.top) {
            createScript('injected.js').then(() => {
                if (configInfo.bootLog !== false) {
                    log('✅ run at `' + configInfo.runAt + '`, ban type `' + configInfo.banType + '`');
                }
                // @ts-ignore 覆盖原函数，达到只加载一次的目的
                loadScripts = noop
            })
        }
    })
}

loadScripts()

// 接收background.js传来的信息
chrome.runtime.onMessage.addListener((msg: CustomEventProps) => {
    // 过滤消息
    if (! [BackgroundMsgKey, PopupMsgKey].includes(msg.from)) {
        return
    }

    // 转发给pagescript
    if (msg.from === BackgroundMsgKey) {
        dispatchPageScriptEvent(msg)
    }

    if (msg.type === 'configInfo') {
        loadScripts()
        return
    }

    if (msg.type === 'log') {
        log(msg.payload)
        return
    }
})

// 消息处理
let timer;
const queue = new Set<CustomEventProps>()

function handle() {
    chrome.storage.local.get([RulesFieldKey, UpdateMsgKey], (result) => {
        const rules: MatchRule[] = result[RulesFieldKey]
        // 取出队列中的数据
        for (const item of queue) {
            // 监听时 拼接数据
            if (item.type === 'response') {
                for (let i = rules.length - 1; i >= 0; i--) {
                    const rule = rules[i]
                    if (rule.url === item.payload.url) {
                        rule.response = item.payload.response
                        chrome.storage.local.set({
                            [RulesFieldKey]: rules,
                            [UpdateMsgKey]: !result[UpdateMsgKey],
                        })
                        // 移除队列中的此条数据
                        queue.delete(item)
                        break
                    }
                }
            }
            // 拦截时计数
            if (item.type === 'count') {
                const rule = rules.find(rule => rule.id === item.payload)
                if (rule) {
                    rule.count = rule.count + 1
                    chrome.storage.local.set({
                        [RulesFieldKey]: rules,
                        [UpdateMsgKey]: !result[UpdateMsgKey],
                    })
                    // 移除队列中的此条数据
                    queue.delete(item)
                }
            }
        }

        // 队列为空时清除定时器
        if (! queue.size) {
            clearInterval(timer)
        }
    })
}

function syncData() {
    chrome.storage.local.get([ConfigInfoFieldKey, RulesFieldKey, ActiveGroupId], (result) => {
        const handleMap: Record<string, { key: SyncFields; fn?: Function }> = {
            [ConfigInfoFieldKey]: {
                key: 'configInfo',
            },
            [RulesFieldKey]: {
                key: 'rules',
                fn: () => result[RulesFieldKey].filter(rule => rule.groupId === result[ActiveGroupId])
            },
        }
        Object.entries(handleMap).forEach(([key, val]) => {
            if (result.hasOwnProperty(key)) {
                dispatchPageScriptEvent({
                    from: ContentMsgKey,
                    type: val.key,
                    payload: val.fn?.() || result[key],
                })
            }
        })
        // 重置trigger
        dispatchPageScriptEvent({
            from: ContentMsgKey,
            type: 'trigger',
            payload: false,
        })
    })
}

// 接收pagescript传来的信息
window.addEventListener(PageScriptEventName, (event: CustomEvent<CustomEventProps>) => {
    const data = event.detail
    
    // 页面加载时初始化数据
    if (data.type === 'syncData') {
        syncData()
        return
    }

    if (['response', 'count'].includes(data.type)) {
        queue.add(data)
        clearInterval(timer)
        timer = setInterval(() => handle(), 300)
    }
})
