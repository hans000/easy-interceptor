/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from "../App"
import { matchPath } from "../tools"
import { log } from "../tools/log"
import { createRunFunc, equal } from "../utils"
import { CustomRequestInfo } from "./fake/globalVar"

export function matching(rules: MatchRule[], req: CustomRequestInfo): MatchRule | undefined {
    for (let rule of rules) {
        const { code, id, enable, count, ...restRule } = rule
        const fn = createRunFunc(code, 'onMatching')
        const result = fn(restRule)
        if (result) {
            return {
                ...restRule,
                ...result,
                id,
                enable,
                count,
            }
        }
        if (rule.enable && matchPath(rule.test, req.requestUrl)) {
            if (rule.method ? req.method.toLowerCase() !== rule.method : false) {
                log('not working? please check `method` option', 'warn')
                continue
            }
            if (!(rule.params ? equal(rule.params, req.params) : true)) {
                log('not working? please check `params` option', 'warn')
                continue
            }
            return rule
        }
    }
}

export async function handleCode(matchRule: MatchRule, inst: XMLHttpRequest | Response) {
    let { id, count, enable, code, ...restRule } = matchRule

    const isResponse = inst instanceof Response
    const text = await (isResponse ? inst.text() : inst.responseText)
    restRule.responseText = text

    if (code) {
        try {
            const fn = createRunFunc(code, 'onResponding')
            const partialData = await fn({
                rule: restRule,
                xhr: isResponse ? undefined : inst,
                response: isResponse ? inst : undefined,
            })
            return {
                ...restRule,
                ...partialData || {},
                id,
                count,
                enable,
                code,
            }
        } catch (error) {
            console.error(error)
        }
    }
    return restRule
}
