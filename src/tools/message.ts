/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { ConfigInfoType, MatchRule } from "../App";
import { PageScriptEventName } from "./constants";

export type CustomEventProps =
    | { from: string, type: 'rules', payload: MatchRule[] }
    | { from: string, type: 'configInfo', payload: ConfigInfoType }
    | { from: string, type: 'count', payload: string }
    | { from: string, type: 'response', payload: any }
    | { from: string, type: 'syncData', payload: null }
    | { from: string, type: 'trigger', payload: boolean }
    | { from: string, type: 'log', payload: any }

export type SyncFields = CustomEventProps['type']


/**
 * content <=> js 通信
 */
export function dispatchPageScriptEvent(action: CustomEventProps) {
    window.dispatchEvent(new CustomEvent(PageScriptEventName, { detail: action }))
}

/**
 * popup使用
 * 发送消息给background
 */
export function sendMessageToBackgound(action: CustomEventProps) {
    chrome.runtime.sendMessage(chrome.runtime.id, action)
}

/**
 * popup或background使用
 * 发送消息给content
 */
export function sendMessageToContent(action: CustomEventProps) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab) {
            chrome.tabs.sendMessage(tab.id!, action)
        }
    })
}
