import { CodeResultSchema } from './../components/MainEditor/validator';
import jsonschema from 'json-schema'

const __DEV__ = import.meta.env.DEV

export interface CodeResult {
    response: Record<string, any>
    status?: number
    delay?: number
}

function sendMsg(msg: any) {
    if (__DEV__) {
        console.log('[EI]', msg)
    } else {
        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: '__hs_log__',
            from: '__hs_iframe__',
            key: 'log',
            value: msg,
        })
    }
}

export function runCode(code: string, data: CodeResult) {
    try {
        const dataStr = JSON.stringify(data)
        const msg = eval(`;(${code})(${dataStr})`)
        const validateResult = jsonschema.validate(msg, CodeResultSchema)

        if (validateResult.errors.length) {
            sendMsg(validateResult.errors)
            return
        }

        sendMsg({ ...data, ...msg, })
    } catch (error) {
        sendMsg(error)
    }
}