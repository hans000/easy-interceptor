/*
 * The GPL License (GPL)
 * Copyright (c) 2022 hans000
 */
import { MatchRule } from '../App'
import { createRunFunc, debounce, equal, parseUrl, TransformMethodKind } from '../utils'
import { fake, unfake } from './fake'
import { CountMsgKey, ResponseMsgKey, StorageMsgKey, SyncDataMsgKey } from '../tools/constants'
import { HttpStatusCodes } from './fake/xhr/constants'
import { CustomRequestInfo } from './fake/globalVar'
import { createPagescriptAction, EventProps } from '../tools/message'
import { log } from '../tools/log'
import { matchPath } from '../tools'

bindEvent()

const app = {
    rules: [] as MatchRule[],
    action: 'close' as ActionType,
    faked: false,
    intercept() {
        const { action, rules, faked } = app
        fake({
            faked,
            onMatch(req) {
                if (action === 'intercept') {
                    return matching(rules, req)
                }
            },
            onFetchIntercept(data: MatchRule | undefined) {
                return async (res) => {
                    if (data) {
                        triggerCountEvent(data.id)
                        const { responseText, response, status = 200, responseHeaders } = await handleCode(data, res)
                        return Promise.resolve(new Response(new Blob([response !== undefined ? JSON.stringify(response) : responseText]), {
                            status,
                            headers: responseHeaders,
                            statusText: HttpStatusCodes[status],
                        }))
                    } else {
                        if (app.action === 'watch') {
                            try {
                                const obj = JSON.parse(await res.clone().text())
                                const urlObj = parseUrl(res.url)
                                triggerResponseEvent(obj, urlObj.origin + urlObj.pathname)
                            } catch (error) {}
                        }
                    }
                }
            },
            onXhrIntercept(data: MatchRule | undefined) {
                return async function(xhr: XMLHttpRequest) {
                    if (data) {
                        if (this.readyState === 4) {
                            try {
                                const { response, responseText, status = 200 } = await handleCode(data, xhr)
                                
                                this.responseText = this.response = response !== undefined ? JSON.stringify(response) : responseText
                                this.status = status
                                this.statusText = HttpStatusCodes[status]
                            } catch (error) {
                                console.error(error)
                            }
                            triggerCountEvent(data.id)
                        }
                    } else {
                        if (app.action === 'watch') {
                            try {
                                const obj = JSON.parse(xhr.responseText)
                                const urlObj = parseUrl(xhr.responseURL)
                                triggerResponseEvent(obj, urlObj.origin + urlObj.pathname)
                            } catch (error) {}
                        }
                    }
                }
            }
        })
    },
    restore() {
        unfake()
    },
    run() {
        const action = app.action
        switch (action) {
            case 'close':
                return app.restore()
            case 'watch':
            case 'intercept':
                return app.intercept()
            default:
                break;
        }
    },
}

const run = debounce(() => app.run())

function matching(rules: MatchRule[], req: CustomRequestInfo): MatchRule | undefined {
    for(let rule of rules) {
        const { code, id, enable, count, ...restRule } = rule
        if (code) {
            const fn = createRunFunc(code, TransformMethodKind.onMatching)
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
        }
        if (rule.enable && matchPath(rule.test, req.requestUrl)) {
            if (!(rule.type ? req.type === rule.type : true)) {
                log('not work? please check `type` option', 'warn')
                console.log('%c Easy Interceptor %c log ', 'color:white;background-color:orange', 'color:green;background-color:black', 'not work? please check `type` option')
                continue
            }
            if (req.method.toLowerCase() !== (rule.method || 'get')) {
                log('not work? please check `method` option', 'warn')
                continue
            }
            if (!(rule.params ? equal(rule.params, req.params) : true)) {
                log('not work? please check `params` option', 'warn')
                continue
            }
            return rule
        }
    }
}

function bindEvent() {
    // get data
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(SyncDataMsgKey)))
    // register event
    window.addEventListener("message", (event: MessageEvent<EventProps>) => {
        const data = event.data
        if (data.type === StorageMsgKey) {
            app[data.key] = data.value
            run()
        }
    })
}

function triggerCountEvent(id: string) {
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(CountMsgKey, { id })))
}

function triggerResponseEvent(response: string, url: string) {
    window.dispatchEvent(new CustomEvent('pagescript', createPagescriptAction(ResponseMsgKey, { response, url })))
}

async function handleCode(matchRule: MatchRule, inst: XMLHttpRequest | Response) {
    let { id, count, enable, code, ...restRule } = matchRule

    const isResponse = inst instanceof Response
    const text = await (isResponse ? inst.text() : inst.responseText)
    restRule.responseText = text

    if (code) {
        try {
            const fn = createRunFunc(code, TransformMethodKind.onResponding)
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
