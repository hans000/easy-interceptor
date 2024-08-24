/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { BackgroundMsgKey,  ConfigInfoFieldKey, PageScriptEventName, PopupMsgKey } from '../tools/constants'
import { CustomEventProps, dispatchPageScriptEvent } from '../tools/message'
import { log } from '../tools/log'
import { ConfigInfoType } from '../App'
import { handleTask, injectedScript, syncData } from './tools'
import { matchPath } from '../tools'


chrome.storage.local.get([ConfigInfoFieldKey], result => {
    const configInfo: Partial<ConfigInfoType> = result[ConfigInfoFieldKey] || {}
    const workingStatusList = ['watch', 'intercept']
    const whiteList = (configInfo.whiteList || '**').split(';')

    if (workingStatusList.includes(configInfo.action!)) {
        const canInjected = configInfo.allFrames ? true : (window.self === window.top)
        if (! canInjected) {
            log('subiframe not working, please open the allIframe', 'warn')
           return
        }
    
        if (!whiteList.some(pattern => matchPath(pattern, location.href))) {
            log('The whiteList can not match current site', 'warn')
            return
        }
    }

    let timer: number;
    const queue = new Set<CustomEventProps>()

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

        if (msg.type === 'configInfo' && workingStatusList.includes(msg.payload.action)) {
            if (whiteList.some(pattern => matchPath(pattern, location.href))) {
                injectedScript(msg.payload)
            } else {
                log('The whiteList can not match current site', 'warn')
            }
            return
        }

        if (msg.type === 'log') {
            log(msg.payload)
            return
        }
    })

    // 接收pagescript传来的信息
    window.addEventListener(PageScriptEventName, (event) => {
        const data = (event as CustomEvent<CustomEventProps>).detail
        
        // 页面加载时初始化数据
        if (data.type === 'syncData') {
            syncData()
            return
        }

        if (['response', 'count'].includes(data.type)) {
            queue.add(data)
            clearInterval(timer)
            timer = window.setInterval(() => handleTask(queue, timer), 300)
        }
    })

    if (configInfo.action === 'close' && configInfo.runAt === 'override') {
        log('not working? should be switch `watch` or `intercept` pattern when run at `override` mode', 'warn')
        return
    }

    if (workingStatusList.includes(configInfo.action!)) {
        injectedScript(configInfo)
    }

})