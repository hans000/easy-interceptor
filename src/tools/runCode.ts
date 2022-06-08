import jsonschema from 'json-schema'
import { MatchRule } from '../App'
import { ExportSchema } from '../components/MainEditor/validator'

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
        type: '__hs_log__',
        from: '__hs_iframe__',
        key: 'log',
        value: msg,
    })
}

export function runCode(data: MatchRule) {
    try {
        const { id, count, enable, code, ...restData  } = data
        const dataStr = JSON.stringify(restData)
        const raw = `
            ;(function (ctx) {
                ${code}
                return __map__(ctx);
            })(${dataStr})
        `
        let msg = {}
        try {
            msg = eval(raw) || {}
        } catch (error) {
            sendLog('error, ' + '__map__ function must be declared')
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