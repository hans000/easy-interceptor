/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from '../App'
import { createRunFunc } from '../utils'
import { PopupMsgKey } from './constants'
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
        type: 'log',
        from: PopupMsgKey,
        payload: msg,
    })
}

export async function runCode(data: MatchRule, index: number) {
    const { id, count, enable, code, ...restData } = data
    try {

        if (data.url === undefined) {
            throw '`url` option must be required.'
        }

        const fn = createRunFunc(code, 'onResponding')
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
