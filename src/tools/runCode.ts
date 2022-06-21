import jsonschema from 'json-schema'
import { MatchRule } from '../App'
import { ExportSchema } from '../components/MainEditor/validator'
import { createRunFunc } from '../utils'
import { IframeMsgKey, LogMsgKey } from './constants'

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
        from: IframeMsgKey,
        key: 'log',
        value: msg,
    })
}

export function runCode(data: MatchRule) {
    try {
        const { id, count, enable, code, ...restData  } = data
        const fn = createRunFunc(code)
        let msg = {}
        try {
            msg = fn(restData) || {}
        } catch (error) {
            sendLog(error.message)
            return
        }

        const newMsg = { ...data, ...msg }

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