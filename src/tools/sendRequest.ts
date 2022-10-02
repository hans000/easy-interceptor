import { MatchRule } from "../App"
import { stringifyParams } from "../utils"
import { sendLog } from "./runCode"

export async function sendRequest(rule: MatchRule, index: number) {
    if (rule.type === 'fetch') {
        const needBody = ! /(get|option)/.test(rule.method)
        return await fetch(stringifyParams(rule.params, rule.url), {
            headers: {
                ...rule.requestHeaders,
                Index: index + ''
            },
            method: rule.method,
            ...(needBody && {
                body: new URLSearchParams(rule.body)
            }),
        })
    } else {
        const xhr: XMLHttpRequest = new XMLHttpRequest()
        xhr.open(rule.method || 'get', rule.url)
        xhr.setRequestHeader('Index', index + '')
        rule.requestHeaders && Object.keys(rule.requestHeaders).forEach(key => xhr.setRequestHeader(key, rule.requestHeaders[key]))
        xhr.send()

        return await new Promise<XMLHttpRequest>(resolve => {
            xhr.addEventListener('load', () => resolve(xhr))
        })
    }
}

export function sendRequestLog(rule: MatchRule, index: number) {
    if (typeof rule.test !== 'string') {
        return
    }
    sendRequest(rule, index).then(inst => {
        if (inst instanceof XMLHttpRequest) {
            try {
                return JSON.parse(inst.responseText)
            } catch (error) {
                return inst.responseText
            }
        } else {
            return inst.json()
        }
    }).then(sendLog)
}