import jsonschema from 'json-schema'
import { MatchRule } from '../App'
import { ExportSchema } from '../components/MainEditor/validator'
import { createRunFunc } from '../utils'
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
            throw 'url option must be required.'
        }

        const fn = createRunFunc(code)
        const inst = await sendRequest(data, index)
        const msg = await fn(restData, inst)

        const newMsg = {
            ...restData,
            ...msg || {},
            id,
        }

        const validateResult = jsonschema.validate(newMsg, ExportSchema)

        if (validateResult.errors.length) {
            const { property: p, message: m } = validateResult.errors[0]
            const msg = `\`${p}\` ${m}`
            sendLog('__map__ function must be return an object, ' + msg)
            return
        }

        sendLog(newMsg)
    } catch (error) {
        sendLog(error)
    }
}