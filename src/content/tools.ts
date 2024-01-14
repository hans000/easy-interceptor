/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from "../App";
import { ConfigInfoFieldKey, RulesFieldKey, ActiveGroupId, ContentMsgKey, UpdateMsgKey } from "../tools/constants";
import { log } from "../tools/log";
import { CustomEventProps, SyncFields, dispatchPageScriptEvent } from "../tools/message";
import { createScript, noop } from "../utils";

export function injectedScript(configInfo: Partial<ConfigInfoType>) {
    createScript('injected.js').then(() => {
        if (configInfo.bootLog !== false) {
            log('✅ run at `' + configInfo.runAt + '`, ban type `' + configInfo.banType + '`');
        }
        // @ts-ignore 覆盖原函数，达到只加载一次的目的
        injectedScript = noop
    })
}

export function syncData() {
    chrome.storage.local.get([ConfigInfoFieldKey, RulesFieldKey, ActiveGroupId], (result) => {
        dispatchPageScriptEvent({
            from: ContentMsgKey,
            type: 'configInfo',
            payload: result[ConfigInfoFieldKey],
        })
        dispatchPageScriptEvent({
            from: ContentMsgKey,
            type: 'rules',
            payload: result[RulesFieldKey].filter(rule => rule.groupId === result[ActiveGroupId]),
        })
        // TODO ? 重置trigger
        dispatchPageScriptEvent({
            from: ContentMsgKey,
            type: 'trigger',
            payload: false,
        })
    })
}

export function handleTask(queue: Set<CustomEventProps>, timer: number) {
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
        if (!queue.size) {
            clearInterval(timer)
        }
    })
}