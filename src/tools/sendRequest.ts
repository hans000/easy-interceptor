import { MatchRule } from "../App"
import { stringifyParams } from "../utils"
import { sendLog } from "./runCode"

export function sendRequest(rule: MatchRule, index: number) {
    const canSend = /https?/.test(rule.url)
    if (canSend) {
        const needBody = ! /(get|option)/.test(rule.method)
        fetch(stringifyParams(rule.params, rule.url), {
            headers: {
                ...rule.requestHeaders,
                Index: index + ''
            },
            method: rule.method,
            ...(needBody && {
                body: new URLSearchParams(rule.body)
            }),
        }).then(res => res.json()).then(sendLog)
    }
}