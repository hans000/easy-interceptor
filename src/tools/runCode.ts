/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from '../App'
import { createRunFunc } from '.'
import { sendRequest } from './sendRequest'
import { sendLog } from './log'

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