/*
 * The AGPL License (AGPL)
 * Copyright (c) 2022 hans000
 */
import { matchPath } from ".";
import { MatchRule } from "../App";
import { createRunFunc, equal } from ".";
import { log } from "./log";


export interface CustomRequestInfo {
    requestUrl: string
    method: string
    type: 'xhr' | 'fetch'
    params: [string, string][]
}

export function matching(rules: MatchRule[], req: CustomRequestInfo): MatchRule | undefined {
    for (let rule of rules) {
        const { code, id, enable, count, ...restRule } = rule
        const fn = createRunFunc(code!, 'onMatching')
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
