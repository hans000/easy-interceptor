/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from '../App'
import { createRunFunc, TransformMethodKind } from '../utils'
import { PopupMsgKey, LogMsgKey } from './constants'
import { sendRequest } from './sendRequest'

const __DEV__ = import.meta.env.DEV

export interface CodeResult {
    response: Record<string, any>
    status?: number
    delay?: number
}

export function sendLog(msg: any) {
    if (__DEV__) {
        console.log(msg)
        return
    }
    chrome.runtime.sendMessage(chrome.runtime.id, {
        type: LogMsgKey,
        from: PopupMsgKey,
        key: 'log',
        value: msg,
    })
}

export async function runCode(data: MatchRule, index: number) {
    const { id, count, enable, code, ...restData } = data
    try {

        if (data.url === undefined) {
            throw '`url` option must be required.'
        }

        const fn = createRunFunc(code, TransformMethodKind.onResponding)
        const inst = await sendRequest(data, index)
        const msg = await fn(restData, inst)

        const newMsg = {
            ...restData,
            ...msg || {},
            id,
        }

        sendLog(newMsg)
    } catch (error) {
        sendLog(error)
    }
}
